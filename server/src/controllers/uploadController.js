const path = require('path');
const fs = require('fs').promises;
const { AppError } = require('../middleware/errorHandler');

// 上传目录（本地或 NAS），由环境变量配置，默认 server/uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// 允许的文件类型
const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
};

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 上传控制器（本地/NAS 存储，不依赖 Coze 与对象存储）
 */
const uploadController = {
  /**
   * 上传文件
   * POST /api/upload
   * 文件由 multer diskStorage 已写入 UPLOAD_DIR，req.file.path 为完整路径
   */
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('请选择要上传的文件', 400);
      }

      const file = req.file;

      if (!ALLOWED_TYPES[file.mimetype]) {
        throw new AppError('不支持的文件类型', 400);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new AppError('文件大小不能超过 10MB', 400);
      }

      const relativeKey = file.filename;
      const baseUrl = process.env.API_BASE_URL || '';
      const fileUrl = baseUrl ? `${baseUrl}/uploads/${relativeKey}` : `/uploads/${relativeKey}`;

      res.json({
        success: true,
        message: '文件上传成功',
        data: {
          key: relativeKey,
          url: fileUrl,
          filename: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 上传图片（仅限图片类型）
   * POST /api/upload/image
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('请选择要上传的图片', 400);
      }

      const file = req.file;
      if (!file.mimetype.startsWith('image/')) {
        throw new AppError('只能上传图片文件', 400);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new AppError('图片大小不能超过 10MB', 400);
      }

      const relativeKey = file.filename;
      const baseUrl = process.env.API_BASE_URL || '';
      const fileUrl = baseUrl ? `${baseUrl}/uploads/${relativeKey}` : `/uploads/${relativeKey}`;

      res.json({
        success: true,
        message: '图片上传成功',
        data: {
          key: relativeKey,
          url: fileUrl
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取文件列表（扫描上传目录）
   * GET /api/upload/files
   */
  async listFiles(req, res, next) {
    try {
      const { prefix = '', limit = 50 } = req.query;
      const safePrefix = String(prefix).replace(/\.\./g, '').replace(/^\/+/, '');
      const fullPath = path.resolve(UPLOAD_DIR, safePrefix);
      const rootResolved = path.resolve(UPLOAD_DIR);
      if (!fullPath.startsWith(rootResolved)) {
        throw new AppError('非法路径', 400);
      }
      let entries = [];
      try {
        entries = await fs.readdir(fullPath, { withFileTypes: true });
      } catch (e) {
        if (e.code === 'ENOENT') {
          return res.json({ success: true, data: { files: [], isTruncated: false } });
        }
        throw e;
      }
      const names = entries
        .filter((e) => e.isFile())
        .map((e) => (safePrefix ? `${safePrefix}/${e.name}` : e.name))
        .slice(0, parseInt(limit, 10) || 50);

      res.json({
        success: true,
        data: {
          files: names,
          isTruncated: names.length >= (parseInt(limit, 10) || 50)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 删除文件
   * DELETE /api/upload/:key
   */
  async deleteFile(req, res, next) {
    try {
      const { key } = req.params;
      const fileKey = decodeURIComponent(key);
      const safeKey = fileKey.replace(/\.\./g, '').replace(/^\/+/, '');
      const fullPath = path.join(UPLOAD_DIR, safeKey);
      const resolved = path.resolve(fullPath);
      const rootResolved = path.resolve(UPLOAD_DIR);
      if (!resolved.startsWith(rootResolved)) {
        throw new AppError('非法路径', 400);
      }
      await fs.unlink(resolved);
      res.json({ success: true, message: '文件已删除' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError('文件不存在', 404);
      }
      next(error);
    }
  },

  /**
   * 获取文件访问 URL（本地存储为静态路径）
   * GET /api/upload/url/:key
   */
  async getFileUrl(req, res, next) {
    try {
      const { key } = req.params;
      const fileKey = decodeURIComponent(key);
      const baseUrl = process.env.API_BASE_URL || '';
      const url = baseUrl ? `${baseUrl}/uploads/${fileKey}` : `/uploads/${fileKey}`;
      res.json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = uploadController;
