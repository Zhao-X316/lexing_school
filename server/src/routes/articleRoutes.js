const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * 文章/内容管理路由
 */

// 公开接口（无需认证）
// 获取文章列表（兼容 GET /api/articles 与 GET /api/articles/，路径为空或 / 均匹配）
router.get(['', '/'], asyncHandler(articleController.getArticles));

// 获取文章统计
router.get('/stats', asyncHandler(articleController.getStats));

// 获取单篇文章
router.get('/:id', asyncHandler(articleController.getArticle));

// 需要认证的接口
router.use(authMiddleware);

// §5.2 发布富文本活动宣传页 - POST /api/articles/publish（管理员）
router.post('/publish',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(articleController.publish)
);

// 创建文章 - 教师及以上
router.post('/',
  roleMiddleware(['super_admin', 'admin', 'teacher']),
  asyncHandler(articleController.createArticle)
);

// 审核通过 - 仅管理员（§12.2.2，须在 /:id 前注册）
router.put('/:id/approve',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(articleController.approve)
);

// 审核驳回 - 仅管理员（§12.2.2）
router.put('/:id/reject',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(articleController.reject)
);

// 更新文章 - 教师及以上（§12.2.2：教师不可设 status=published）
router.put('/:id',
  roleMiddleware(['super_admin', 'admin', 'teacher']),
  asyncHandler(articleController.updateArticle)
);

// 删除文章 - 管理员及以上
router.delete('/:id',
  roleMiddleware(['super_admin', 'admin']),
  asyncHandler(articleController.deleteArticle)
);

module.exports = router;
