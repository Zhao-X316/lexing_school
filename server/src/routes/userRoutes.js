const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * 用户管理路由
 */

// 所有用户路由都需要认证
router.use(authMiddleware);

// §5.2 获取用户列表 - GET /api/users/list（超管、管理员）
router.get('/list',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(userController.getList)
);

// §5.2 创建账号 - POST /api/users/create（超管、管理员）
router.post('/create',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(userController.create)
);

// 获取用户列表（兼容 GET /api/users 与 GET /api/users/，路径为空或 / 均匹配）
router.get(['', '/'],
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(userController.getList)
);

// 修改用户密码
router.put('/:id/password',
  asyncHandler(userController.changePassword)
);

// 获取指定用户信息（管理员）
router.get('/:id',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(userController.getUserById)
);

router.put('/:id',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(userController.updateUser)
);

router.delete('/:id',
  roleMiddleware(['super_admin']),
  asyncHandler(userController.deleteUser)
);

module.exports = router;
