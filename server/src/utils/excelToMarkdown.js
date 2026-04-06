/**
 * Excel 转 Markdown 表格
 * 使用 ExcelJS 解析 .xlsx 文件，将每个 sheet 转为 Markdown 表格格式
 */
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

/**
 * 从单元格安全提取文本
 */
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

/**
 * 转义 Markdown 表格单元格中的 | 字符
 */
function escapeCell(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

/**
 * 将一行数据转为 Markdown 表格行
 */
function rowToMarkdownLine(cells) {
  return '| ' + cells.map(escapeCell).join(' | ') + ' |';
}

/**
 * 将 Excel 文件转为 Markdown 表格
 * @param {string} filePath - Excel 文件路径
 * @returns {Promise<{ sheets: Array<{ name: string, markdown: string }> }>}
 */
async function excelToMarkdown(filePath) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error('文件不存在');
  }
  const ext = path.extname(absPath).toLowerCase();
  if (ext !== '.xlsx' && ext !== '.xls') {
    throw new Error('仅支持 .xlsx、.xls 格式');
  }
  if (ext === '.xls') {
    throw new Error('Markdown 预览仅支持 .xlsx 格式，.xls 请使用「下载原文件」或转换为 .xlsx 后重新上传');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(absPath);

  const sheets = [];
  for (const sheet of workbook.worksheets) {
    if (!sheet) continue;
    const rows = [];
    const maxRow = 300;
    const maxCol = 50;

    for (let r = 1; r <= maxRow; r++) {
      const cells = [];
      for (let c = 1; c <= maxCol; c++) {
        const cell = sheet.getCell(r, c);
        cells.push(getCellText(cell));
      }
      if (cells.some((c) => c !== '')) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) continue;

    const colNum = Math.max(...rows.map((row) => row.length), 1);
    const normalized = rows.map((row) => {
      const pad = Array(colNum - row.length).fill('');
      return [...row, ...pad];
    });

    const lines = [];
    normalized.forEach((row, i) => {
      const trimmed = row.slice(0, colNum);
      lines.push(rowToMarkdownLine(trimmed));
      if (i === 0) {
        lines.push('| ' + Array(colNum).fill('---').join(' | ') + ' |');
      }
    });

    sheets.push({
      name: sheet.name || `Sheet${sheets.length + 1}`,
      markdown: lines.join('\n')
    });
  }

  return { sheets };
}

module.exports = { excelToMarkdown };
