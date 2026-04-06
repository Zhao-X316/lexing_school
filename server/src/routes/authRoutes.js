const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler, validateRequest } = require('../middleware/errorHandler');

/**
 * 认证路由
 */

// §5.2 登录 - POST /api/auth/login（公开）
router.post('/login',
  [
    body('username').notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  validateRequest,
  asyncHandler(userController.login)
);

// 获取当前用户信息 - GET /api/auth/me（需认证）
router.get('/me',
  authMiddleware,
  asyncHandler(userController.getCurrentUser)
);

// 修改密码（当前用户）- 需要认证
router.put('/password',
  authMiddleware,
  [
    body('old_password').notEmpty().withMessage('旧密码不能为空'),
    body('new_password').isLength({ min: 6 }).withMessage('新密码至少6位')
  ],
  validateRequest,
  asyncHandler(userController.changePassword)
);

module.exports = router;
