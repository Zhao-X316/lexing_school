const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * 首页配置路由
 */

// 公开接口（无需认证）- 官网读取配置
router.get('/config', asyncHandler(homepageController.getAllConfig));
router.get('/config/:key', asyncHandler(homepageController.getConfigByKey));

// 需要认证的接口 - 管理后台修改配置
router.use(authMiddleware);
router.use(roleMiddleware(['super_admin', 'admin']));

// §5.2 更新官网首页轮播图或视频链接 - PUT /api/homepage/update（管理员）
router.put('/update', asyncHandler(homepageController.update));

// 更新配置（兼容）
router.put('/config/:key', asyncHandler(homepageController.updateConfig));

// 批量更新配置（兼容）
router.put('/config/batch', asyncHandler(homepageController.batchUpdateConfig));

module.exports = router;
