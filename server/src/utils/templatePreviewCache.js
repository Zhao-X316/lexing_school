/**
 * Excel HTML 预览：磁盘持久缓存 + 进程内短时缓存
 * 上传成功后异步预热磁盘；预览优先读缓存，源文件 mtime 变化则失效。
 * 同一 templateId 并发计算单飞；内存条数有上限并定期清理过期项；磁盘 IO 使用 fs.promises。
 */
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { pool } = require('../config/database');
const { excelToHtml } = require('./excelToHtml');

const TEMPLATE_STORAGE = process.env.TEMPLATE_STORAGE_PATH || path.join(__dirname, '../../templates');

/** 内存缓存 TTL（毫秒），默认 15 分钟 */
const MEMORY_TTL_MS = Number(process.env.PREVIEW_HTML_MEMORY_TTL_MS) || 15 * 60 * 1000;

/** 内存中最多保留的预览条目数（超出则淘汰最早过期的键），默认 200 */
const MEMORY_MAX_ENTRIES = Math.max(
  1,
  Number(process.env.PREVIEW_HTML_MEMORY_MAX_ENTRIES) || 200
);

/** 后台清理过期内存条目的间隔（毫秒），默认 5 分钟；设为 0 则仅依赖写入时淘汰 */
const MEMORY_SWEEP_INTERVAL_MS = Number(process.env.PREVIEW_HTML_MEMORY_SWEEP_MS);
const SWEEP_MS =
  Number.isFinite(MEMORY_SWEEP_INTERVAL_MS) && MEMORY_SWEEP_INTERVAL_MS >= 0
    ? MEMORY_SWEEP_INTERVAL_MS
    : 5 * 60 * 1000;

const CACHE_VERSION = 1;
const memoryStore = new Map(); // id -> { payload, expiresAt }

/** 同一 id 仅一条在途计算，避免缓存击穿时重复 excelToHtml */
const inflight = new Map();

function getCacheDirResolved() {
  return path.join(path.resolve(TEMPLATE_STORAGE), 'cache');
}

async function ensureCacheDir() {
  const dir = getCacheDirResolved();
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

function diskPathForId(templateId) {
  return path.join(getCacheDirResolved(), `${templateId}.json`);
}

function resolveTemplateFilePath(filePath) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(TEMPLATE_STORAGE, filePath);
  return path.resolve(absPath);
}

function isPathUnderStorage(safePath) {
  const storageResolved = path.resolve(TEMPLATE_STORAGE);
  return safePath.startsWith(storageResolved) && fs.existsSync(safePath);
}

/**
 * 读磁盘缓存；若源文件 mtime 与缓存不一致则视为失效
 */
async function readDiskCache(templateId, safePath, fallbackName) {
  await ensureCacheDir();
  const fp = diskPathForId(templateId);
  let raw;
  try {
    const buf = await fsp.readFile(fp, 'utf8');
    raw = JSON.parse(buf);
  } catch {
    try {
      await fsp.unlink(fp);
    } catch (_) {}
    return null;
  }
  if (!raw || raw.version !== CACHE_VERSION || !Array.isArray(raw.sheets)) {
    return null;
  }
  let mtimeMs;
  try {
    const st = await fsp.stat(safePath);
    mtimeMs = st.mtimeMs;
  } catch {
    return null;
  }
  if (raw.sourceMtimeMs !== mtimeMs) {
    return null;
  }
  return {
    name: raw.name != null ? raw.name : fallbackName,
    sheets: raw.sheets
  };
}

/**
 * 写磁盘缓存
 */
async function writeDiskCache(templateId, payload, safePath) {
  let mtimeMs;
  try {
    const st = await fsp.stat(safePath);
    mtimeMs = st.mtimeMs;
  } catch {
    return;
  }
  const body = JSON.stringify({
    version: CACHE_VERSION,
    name: payload.name,
    sourceMtimeMs: mtimeMs,
    sheets: payload.sheets
  });
  await ensureCacheDir();
  try {
    await fsp.writeFile(diskPathForId(templateId), body, 'utf8');
  } catch (e) {
    console.error('[templatePreviewCache] write disk failed', templateId, e.message);
  }
}

function sweepExpiredMemory() {
  const now = Date.now();
  for (const [k, v] of memoryStore.entries()) {
    if (now > v.expiresAt) memoryStore.delete(k);
  }
}

/** 超出 MEMORY_MAX_ENTRIES 时淘汰「最早过期」的若干条 */
function evictMemoryIfOverCapacity() {
  sweepExpiredMemory();
  if (memoryStore.size <= MEMORY_MAX_ENTRIES) return;
  const entries = [...memoryStore.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const toRemove = memoryStore.size - MEMORY_MAX_ENTRIES;
  for (let i = 0; i < toRemove; i++) {
    memoryStore.delete(entries[i][0]);
  }
}

function getMemoryCache(templateId) {
  const hit = memoryStore.get(templateId);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryStore.delete(templateId);
    return null;
  }
  return hit.payload;
}

function setMemoryCache(templateId, payload) {
  evictMemoryIfOverCapacity();
  memoryStore.set(templateId, {
    payload,
    expiresAt: Date.now() + MEMORY_TTL_MS
  });
}

function invalidateMemory(templateId) {
  memoryStore.delete(Number(templateId));
}

if (SWEEP_MS > 0) {
  setInterval(() => {
    try {
      sweepExpiredMemory();
    } catch (_) {}
  }, SWEEP_MS).unref?.();
}

/**
 * 删除磁盘缓存文件（删除模板或手动清缓存时调用）
 */
function invalidateDisk(templateId) {
  const fp = diskPathForId(templateId);
  fsp.unlink(fp).catch(() => {});
}

function invalidatePreviewCache(templateId) {
  const id = Number(templateId);
  invalidateMemory(id);
  invalidateDisk(id);
  inflight.delete(id);
}

function getOrCreateInflight(id, factory) {
  const existing = inflight.get(id);
  if (existing) return existing;
  const p = factory().finally(() => {
    inflight.delete(id);
  });
  inflight.set(id, p);
  return p;
}

/**
 * mode === 'warm'：上传后预热，与旧逻辑一致，不读内存/磁盘，直接 excelToHtml 再写回。
 * mode === 'get'：内存 → 磁盘 → 计算。
 */
async function loadPreviewPayload(id, safePath, name, mode) {
  if (mode !== 'warm') {
    const mem = getMemoryCache(id);
    if (mem) return mem;
    const fromDisk = await readDiskCache(id, safePath, name);
    if (fromDisk) {
      setMemoryCache(id, fromDisk);
      return fromDisk;
    }
  }
  const { sheets } = await excelToHtml(safePath);
  const payload = { name, sheets };
  await writeDiskCache(id, payload, safePath);
  setMemoryCache(id, payload);
  return payload;
}

/**
 * 上传成功后异步调用：生成 Excel→HTML 并写入磁盘 + 内存
 */
async function warmExcelPreviewCache(templateId) {
  const id = Number(templateId);
  const [rows] = await pool.execute(
    'SELECT id, name, file_path, file_type FROM templates WHERE id = ? LIMIT 1',
    [id]
  );
  if (!rows || rows.length === 0 || rows[0].file_type !== 'excel') {
    return;
  }
  const filePath = rows[0].file_path;
  const safePath = resolveTemplateFilePath(filePath);
  if (!isPathUnderStorage(safePath)) {
    return;
  }
  return getOrCreateInflight(id, () => loadPreviewPayload(id, safePath, rows[0].name, 'warm'));
}

/**
 * 供 previewHtml 使用：按序尝试 内存 → 磁盘 → 现场计算
 */
async function getExcelPreviewPayload(templateId, row, safePath) {
  const id = Number(templateId);
  const mem = getMemoryCache(id);
  if (mem) {
    return mem;
  }
  return getOrCreateInflight(id, () => loadPreviewPayload(id, safePath, row.name, 'get'));
}

module.exports = {
  TEMPLATE_STORAGE,
  resolveTemplateFilePath,
  isPathUnderStorage,
  warmExcelPreviewCache,
  getExcelPreviewPayload,
  invalidatePreviewCache,
  getCacheDir: () => {
    const dir = getCacheDirResolved();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  },
  MEMORY_TTL_MS,
  MEMORY_MAX_ENTRIES
};
