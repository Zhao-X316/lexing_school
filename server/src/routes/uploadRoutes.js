const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// 上传目录（本地或 NAS），与 uploadController 中 UPLOAD_DIR 一致
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * 上传路由
 */

// 所有上传路由需要认证
router.use(authMiddleware);

// 上传任意文件
router.post('/',
  upload.single('file'),
  asyncHandler(uploadController.uploadFile)
);

// 上传图片（仅限图片类型）
router.post('/image',
  upload.single('file'),
  asyncHandler(uploadController.uploadImage)
);

// 获取文件列表
router.get('/files',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(uploadController.listFiles)
);

// 获取文件访问 URL
router.get('/url/:key(*)',
  asyncHandler(uploadController.getFileUrl)
);

// 删除文件
router.delete('/:key(*)',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(uploadController.deleteFile)
);

module.exports = router;
