/**
 * Word/Excel 转 PDF 工具
 * 依赖 LibreOffice（soffice）已安装，可通过 ENABLE_PDF_CONVERSION 和 LIBREOFFICE_PATH 环境变量配置
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const CONVERT_TIMEOUT = 60000; // 60 秒超时
const SUPPORTED_EXT = ['.doc', '.docx', '.xls', '.xlsx'];

/**
 * 将 Word/Excel 文件转换为 PDF
 * @param {string} inputPath - 源文件绝对路径
 * @returns {Promise<string|null>} 成功返回 PDF 路径，失败返回 null
 */
function convertToPdf(inputPath) {
  return new Promise((resolve) => {
    if (process.env.ENABLE_PDF_CONVERSION === 'false') {
      return resolve(null);
    }

    const ext = path.extname(inputPath).toLowerCase();
    if (!SUPPORTED_EXT.includes(ext)) {
      return resolve(null);
    }

    const absPath = path.resolve(inputPath);
    if (!fs.existsSync(absPath)) {
      return resolve(null);
    }

    const outDir = path.dirname(absPath);
    const librePath = process.env.LIBREOFFICE_PATH || (process.platform === 'win32' ? 'soffice' : 'libreoffice');
    const args = ['--headless', '--convert-to', 'pdf', '--outdir', outDir, absPath];

    const proc = spawn(librePath, args);
    let stderr = '';
    proc.stderr?.on('data', (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => {
      try {
        proc.kill();
      } catch (_) {}
      console.warn('[pdfConverter] LibreOffice 转换超时');
      resolve(null);
    }, CONVERT_TIMEOUT);
    proc.on('error', (err) => {
      clearTimeout(timer);
      console.warn('[pdfConverter] LibreOffice 启动失败:', err.message);
      resolve(null);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        console.warn('[pdfConverter] LibreOffice 转换失败:', stderr || `exit code ${code}`);
        return resolve(null);
      }
      const pdfPath = absPath.replace(/\.[^/.]+$/, '.pdf');
      resolve(fs.existsSync(pdfPath) ? pdfPath : null);
    });
  });
}

module.exports = { convertToPdf, SUPPORTED_EXT };
