/**
 * 四级标签与目标库 - 项目说明书 §4.2
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();
const teachingTargetsController = require('../controllers/teachingTargetsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.delete('/clear', roleMiddleware(['super_admin', 'admin']), asyncHandler(teachingTargetsController.clear));
router.get('/', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(teachingTargetsController.list));
router.get('/:id', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(teachingTargetsController.getById));
router.post('/', roleMiddleware(['super_admin', 'admin']), asyncHandler(teachingTargetsController.create));
router.put('/:id', roleMiddleware(['super_admin', 'admin']), asyncHandler(teachingTargetsController.update));
router.delete('/:id', roleMiddleware(['super_admin', 'admin']), asyncHandler(teachingTargetsController.remove));
router.post('/import', roleMiddleware(['super_admin', 'admin']), memoryUpload.single('file'), asyncHandler(teachingTargetsController.importExcel));

module.exports = router;
