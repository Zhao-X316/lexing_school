/**
 * 教案模板库 - 项目说明书 §4.2、§6.2（7）
 * 表 templates：name, file_path, file_type, scenario, status
 * 存储目录由环境变量 TEMPLATE_STORAGE_PATH 配置（默认 /SATA存储11/web/teaching/templates）
 */
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { convertToPdf } = require('../utils/pdfConverter');
const { excelToMarkdown } = require('../utils/excelToMarkdown');
const {
  warmExcelPreviewCache,
  getExcelPreviewPayload,
  invalidatePreviewCache,
  resolveTemplateFilePath,
  isPathUnderStorage
} = require('../utils/templatePreviewCache');

const TEMPLATE_STORAGE = process.env.TEMPLATE_STORAGE_PATH || path.join(__dirname, '../../templates');

/** multipart 字段被 busboy 用 latin1 解析时，恢复 UTF-8 */
function fixMultipartEncoding(str) {
  if (!str || typeof str !== 'string') return str;
  if (/[\u0100-\uFFFF]/.test(str)) return str;
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch {
    return str;
  }
}

const templatesController = {
  /**
   * 列表 - GET /api/templates
   */
  async list(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, file_path, file_type, scenario, status, created_at FROM templates ORDER BY created_at DESC'
      );
      res.json({ success: true, data: { list: rows } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 单条 - GET /api/templates/:id
   */
  async getById(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, file_path, file_type, scenario, status, created_at FROM templates WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('模板不存在', 404);
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 上传模板 - POST /api/templates/upload（§4.2）
   * multer 已写入文件，req.file 含 path/filename
   */
  async upload(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('请选择模板文件（.xlsx 或 .docx）', 400);
      }
      const ext = path.extname(req.file.filename || req.file.originalname || '').toLowerCase();
      const isExcel = ext === '.xlsx' || ext === '.xls';
      const isWord = ext === '.docx' || ext === '.doc';
      if (!isExcel && !isWord) {
        throw new AppError('仅支持 .xlsx、.xls、.docx、.doc 模板', 400);
      }
      const file_type = isExcel ? 'excel' : 'word';
      const rawName = req.body.name || path.basename(req.file.originalname || req.file.filename, path.extname(req.file.originalname || req.file.filename));
      let name = fixMultipartEncoding(rawName);
      name = String(name || '').trim().slice(0, 100) || 'template';
      const scenario = req.body.scenario || null;
      const file_path = req.file.path || path.join(TEMPLATE_STORAGE, req.file.filename);

      if (!fs.existsSync(path.dirname(file_path))) {
        fs.mkdirSync(path.dirname(file_path), { recursive: true });
      }

      const [result] = await pool.execute(
        'INSERT INTO templates (name, file_path, file_type, scenario, status) VALUES (?, ?, ?, ?, ?)',
        [name, file_path, file_type, scenario, 'enabled']
      );
      const [rows] = await pool.execute(
        'SELECT id, name, file_path, file_type, scenario, status, created_at FROM templates WHERE id = ?',
        [result.insertId]
      );
      // 异步生成 PDF 预览，不阻塞响应
      if (isExcel || isWord) {
        convertToPdf(file_path).catch(() => {});
      }
      // Excel：后台预热 HTML 预览缓存（磁盘 + 内存），减轻首次点击预览延迟
      if (isExcel) {
        setImmediate(() => {
          warmExcelPreviewCache(result.insertId).catch((e) =>
            console.error('[templates] warmExcelPreviewCache', result.insertId, e.message)
          );
        });
      }
      res.status(201).json({ success: true, message: '模板上传成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新状态等 - PUT /api/templates/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, scenario, status } = req.body;
      const updates = [];
      const params = [];
      if (name !== undefined) { updates.push('name = ?'); params.push(name); }
      if (scenario !== undefined) { updates.push('scenario = ?'); params.push(scenario); }
      if (status !== undefined) {
        if (!['enabled', 'disabled'].includes(status)) {
          throw new AppError('status 须为 enabled 或 disabled', 400);
        }
        updates.push('status = ?');
        params.push(status);
      }
      if (updates.length === 0) {
        throw new AppError('无有效更新字段', 400);
      }
      params.push(id);
      await pool.execute(`UPDATE templates SET ${updates.join(', ')} WHERE id = ?`, params);
      invalidatePreviewCache(id);
      const [rows] = await pool.execute(
        'SELECT id, name, file_path, file_type, scenario, status, created_at FROM templates WHERE id = ?',
        [id]
      );
      res.json({ success: true, message: '更新成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 预览 PDF - GET /api/templates/:id/preview
   * 返回 PDF 文件流，新标签页打开；若 PDF 不存在则返回明确错误
   */
  async preview(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, file_path FROM templates WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('模板不存在', 404);
      }
      const filePath = rows[0].file_path;
      const absPath = path.isAbsolute(filePath) ? filePath : path.join(TEMPLATE_STORAGE, filePath);
      const safePath = path.resolve(absPath);
      const storageResolved = path.resolve(TEMPLATE_STORAGE);
      if (!safePath.startsWith(storageResolved) || !fs.existsSync(safePath)) {
        throw new AppError('模板文件不存在或路径无效', 404);
      }
      const ext = path.extname(safePath).toLowerCase();
      let pdfPath = safePath;
      if (ext !== '.pdf') {
        const candidatePdf = safePath.replace(/\.[^/.]+$/, '.pdf');
        if (!fs.existsSync(candidatePdf)) {
          throw new AppError('该模板暂无 PDF 预览，请使用「下载原文件」获取模板。配置 LibreOffice 后可自动生成 PDF 预览。', 404);
        }
        pdfPath = candidatePdf;
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(rows[0].name || 'preview') + '.pdf"');
      res.sendFile(pdfPath);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Excel 模板 Markdown 预览 - GET /api/templates/:id/preview-markdown
   * 将 Excel 转为 Markdown 表格，供网页端展示
   */
  async previewMarkdown(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, file_path, file_type FROM templates WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('模板不存在', 404);
      }
      if (rows[0].file_type !== 'excel') {
        throw new AppError('仅支持 Excel 模板的 Markdown 预览', 400);
      }
      const filePath = rows[0].file_path;
      const absPath = path.isAbsolute(filePath) ? filePath : path.join(TEMPLATE_STORAGE, filePath);
      const safePath = path.resolve(absPath);
      const storageResolved = path.resolve(TEMPLATE_STORAGE);
      if (!safePath.startsWith(storageResolved) || !fs.existsSync(safePath)) {
        throw new AppError('模板文件不存在或路径无效', 404);
      }
      const { sheets } = await excelToMarkdown(safePath);
      res.json({ success: true, data: { name: rows[0].name, sheets } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Excel 模板 HTML 预览 - GET /api/templates/:id/preview-html
   * 将 Excel 转为 HTML 表格，支持合并单元格，供网页端 v-html 渲染
   */
  async previewHtml(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, file_path, file_type FROM templates WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('模板不存在', 404);
      }
      if (rows[0].file_type !== 'excel') {
        throw new AppError('仅支持 Excel 模板的 HTML 预览', 400);
      }
      const filePath = rows[0].file_path;
      const safePath = resolveTemplateFilePath(filePath);
      if (!isPathUnderStorage(safePath)) {
        throw new AppError('模板文件不存在或路径无效', 404);
      }
      const data = await getExcelPreviewPayload(req.params.id, rows[0], safePath);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 下载原始模板 - GET /api/templates/:id/download
   */
  async download(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, file_path FROM templates WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('模板不存在', 404);
      }
      const filePath = rows[0].file_path;
      const absPath = path.isAbsolute(filePath) ? filePath : path.join(TEMPLATE_STORAGE, filePath);
      const safePath = path.resolve(absPath);
      const storageResolved = path.resolve(TEMPLATE_STORAGE);
      if (!safePath.startsWith(storageResolved) || !fs.existsSync(safePath)) {
        throw new AppError('模板文件不存在或路径无效', 404);
      }
      const ext = path.extname(safePath).toLowerCase();
      const mime = ext === '.docx' || ext === '.doc'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const filename = (rows[0].name || 'template') + ext;
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.sendFile(safePath);
    } catch (error) {
      next(error);
    }
  },

  /**
   * 删除 - DELETE /api/templates/:id
   */
  async remove(req, res, next) {
    try {
      const [rows] = await pool.execute('SELECT file_path FROM templates WHERE id = ?', [req.params.id]);
      if (rows && rows.length > 0) {
        const fp = path.isAbsolute(rows[0].file_path)
          ? rows[0].file_path
          : path.join(TEMPLATE_STORAGE, rows[0].file_path);
        const resolved = path.resolve(fp);
        const storageResolved = path.resolve(TEMPLATE_STORAGE);
        if (resolved.startsWith(storageResolved) && fs.existsSync(resolved)) {
          try { fs.unlinkSync(resolved); } catch (_) {}
        }
        const pdfPath = resolved.replace(/\.[^/.]+$/, '.pdf');
        if (pdfPath !== resolved && pdfPath.startsWith(storageResolved) && fs.existsSync(pdfPath)) {
          try { fs.unlinkSync(pdfPath); } catch (_) {}
        }
      }
      invalidatePreviewCache(req.params.id);
      const [result] = await pool.execute('DELETE FROM templates WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) {
        throw new AppError('模板不存在', 404);
      }
      res.json({ success: true, message: '已删除' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = templatesController;
