/**
 * 教案生成与历史 - 项目说明书 §4.2、§4.3
 */
const express = require('express');
const router = express.Router();
const assessmentsController = require('../controllers/assessmentsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(authMiddleware);

router.get('/', roleMiddleware(['super_admin', 'admin', 'teacher', 'parent']), asyncHandler(assessmentsController.list));
router.post('/generate', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(assessmentsController.generate));
router.post('/preview', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(assessmentsController.preview));
router.put('/:id/void', roleMiddleware(['super_admin', 'admin', 'teacher']), asyncHandler(assessmentsController.void));
router.delete('/:id', roleMiddleware(['super_admin', 'admin']), asyncHandler(assessmentsController.remove));

module.exports = router;
