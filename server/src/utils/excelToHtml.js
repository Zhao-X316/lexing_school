/**
 * Excel 转 HTML 表格
 * 使用 ExcelJS 解析 .xlsx，输出安全转义的 HTML 表格，支持合并单元格
 */
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const colCache = require('exceljs/lib/utils/col-cache');

const MAX_ROW = 300;
const MAX_COL = 50;

function getCellText(cell) {
  if (!cell || cell.value == null) return '';
  const v = cell.value;
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  if (v && typeof v === 'object') {
    if (v instanceof Date) {
      return v.toLocaleDateString ? v.toLocaleDateString('zh-CN') : String(v);
    }
    if (v.richText && Array.isArray(v.richText)) {
      return v.richText.map((t) => (t && t.text) || '').join('').trim();
    }
    if (typeof v.text === 'string') return v.text.trim();
    if (typeof v.result === 'string' || typeof v.result === 'number') return String(v.result).trim();
  }
  if (cell.text != null) return String(cell.text).trim();
  return '';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sheetToHtml(sheet) {
  const mergeInfo = {};
  const covered = {};
  const mergeRanges = sheet.model?.merges ?? sheet.model?.mergeCells ?? [];
  for (const m of mergeRanges) {
    let rangeStr = typeof m === 'string' ? m : (m.range ?? m.model?.dimensions ?? (m.dimensions ?? String(m)));
    try {
      const d = colCache.decode(rangeStr);
      const rowspan = d.bottom - d.top + 1;
      const colspan = d.right - d.left + 1;
      mergeInfo[`${d.top},${d.left}`] = { rowspan, colspan };
      for (let r = d.top; r <= d.bottom; r++) {
        for (let c = d.left; c <= d.right; c++) {
          if (r !== d.top || c !== d.left) covered[`${r},${c}`] = true;
        }
      }
    } catch (err) {
      // 忽略无法解析的 merge
    }
  }

  let actualMaxCol = 1;
  let actualMaxRow = 1;
  for (let r = 1; r <= MAX_ROW; r++) {
    for (let c = 1; c <= MAX_COL; c++) {
      const hasContent =
        getCellText(sheet.getCell(r, c)) || mergeInfo[`${r},${c}`] || covered[`${r},${c}`];
      if (hasContent) {
        actualMaxRow = r;
        actualMaxCol = Math.max(actualMaxCol, c);
      }
    }
  }
  actualMaxCol = Math.min(actualMaxCol, MAX_COL);
  actualMaxRow = Math.min(actualMaxRow, MAX_ROW);

  let tbodyHtml = '';
  for (let r = 1; r <= actualMaxRow; r++) {
    const hasCoveredInRow = Array.from({ length: actualMaxCol }, (_, i) => i + 1).some(
      (c) => covered[`${r},${c}`]
    );
    let rowHtml = '';
    for (let c = 1; c <= actualMaxCol; c++) {
      if (covered[`${r},${c}`]) continue;
      const cell = sheet.getCell(r, c);
      const text = escapeHtml(getCellText(cell));
      const m = mergeInfo[`${r},${c}`];
      if (m) {
        rowHtml += `<td rowspan="${m.rowspan}" colspan="${m.colspan}">${text}</td>`;
      } else {
        rowHtml += `<td>${text}</td>`;
      }
    }
    if (rowHtml || hasCoveredInRow) {
      tbodyHtml += '<tr>' + rowHtml + '</tr>';
    }
  }
  return `<table class="excel-preview-table"><tbody>${tbodyHtml}</tbody></table>`;
}

async function excelToHtml(filePath) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error('文件不存在');
  }
  const ext = path.extname(absPath).toLowerCase();
  if (ext !== '.xlsx' && ext !== '.xls') {
    throw new Error('仅支持 .xlsx、.xls 格式');
  }
  if (ext === '.xls') {
    throw new Error('HTML 预览仅支持 .xlsx 格式，.xls 请使用「下载原文件」或转换为 .xlsx 后重新上传');
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(absPath);
  } catch (err) {
    throw new Error(err?.message?.includes('corrupt') ? '文件可能已损坏' : '无法读取 Excel 文件');
  }

  const sheets = [];
  for (const sheet of workbook.worksheets) {
    if (!sheet) continue;
    try {
      const html = sheetToHtml(sheet);
      if (!html.includes('<tr>')) continue;
      sheets.push({
        name: sheet.name || `Sheet${sheets.length + 1}`,
        html
      });
    } catch (err) {
      console.warn('[excelToHtml] sheet 解析失败:', sheet.name, err.message);
    }
  }
  return { sheets };
}

/**
 * 从 Buffer 加载 Excel 并转为 HTML（用于预览已渲染的 workbook）
 */
async function excelToHtmlFromBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (err) {
    throw new Error(err?.message?.includes('corrupt') ? '文件可能已损坏' : '无法读取 Excel 文件');
  }

  const sheets = [];
  for (const sheet of workbook.worksheets) {
    if (!sheet) continue;
    try {
      const html = sheetToHtml(sheet);
      if (!html.includes('<tr>')) continue;
      sheets.push({
        name: sheet.name || `Sheet${sheets.length + 1}`,
        html
      });
    } catch (err) {
      console.warn('[excelToHtmlFromBuffer] sheet 解析失败:', sheet.name, err.message);
    }
  }
  return { sheets };
}

module.exports = { excelToHtml, excelToHtmlFromBuffer };
