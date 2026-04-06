/**
 * 学生档案与图表 - 教师仅自己的学生，家长仅自己的孩子（§4.3）
 */
const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');
const chartsController = require('../controllers/chartsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const canViewStudent = roleMiddleware(['super_admin', 'admin', 'teacher', 'parent']);
const canManageStudent = roleMiddleware(['super_admin', 'admin']);

router.use(authMiddleware);

router.get('/', canViewStudent, asyncHandler(studentsController.list));
router.post('/', canManageStudent, asyncHandler(studentsController.create));
router.get('/:id/charts/radar', canViewStudent, asyncHandler(chartsController.radar));
router.get('/:id/charts/trend', canViewStudent, asyncHandler(chartsController.trend));
router.get('/:id', canViewStudent, asyncHandler(studentsController.getById));
router.put('/:id', canManageStudent, asyncHandler(studentsController.update));

module.exports = router;
