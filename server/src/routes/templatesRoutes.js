/**
 * 教案模板库 - 项目说明书 §4.2
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const templatesController = require('../controllers/templatesController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const TEMPLATE_STORAGE = process.env.TEMPLATE_STORAGE_PATH || path.join(__dirname, '../../templates');
if (!fs.existsSync(TEMPLATE_STORAGE)) {
  fs.mkdirSync(TEMPLATE_STORAGE, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMPLATE_STORAGE),
  filename: (req, file, cb) => {
    const safe = (file.originalname || '').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(templatesController.list));
router.get('/:id/preview', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(templatesController.preview));
router.get('/:id/preview-html', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(templatesController.previewHtml));
router.get('/:id/preview-markdown', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(templatesController.previewMarkdown));
router.get('/:id/download', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(templatesController.download));
router.get('/:id', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(templatesController.getById));
router.post('/upload', roleMiddleware(['super_admin', 'admin']), upload.single('file'), asyncHandler(templatesController.upload));
router.put('/:id', roleMiddleware(['super_admin', 'admin']), asyncHandler(templatesController.update));
router.delete('/:id', roleMiddleware(['super_admin', 'admin']), asyncHandler(templatesController.remove));

module.exports = router;
