const express = require('express');
const router = express.Router();

// 导入路由模块
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const articleRoutes = require('./articleRoutes');
const homepageRoutes = require('./homepageRoutes');
const uploadRoutes = require('./uploadRoutes');
const teachingTargetsRoutes = require('./teachingTargetsRoutes');
const templatesRoutes = require('./templatesRoutes');
const assessmentsRoutes = require('./assessmentsRoutes');
const studentsRoutes = require('./studentsRoutes');

/**
 * API 路由注册
 */

// 认证相关
router.use('/auth', authRoutes);

// 用户管理
router.use('/users', userRoutes);

// 文章/内容管理
router.use('/articles', articleRoutes);

// 首页配置
router.use('/homepage', homepageRoutes);

// 文件上传
router.use('/upload', uploadRoutes);

// 第三阶段 §4.2：四级标签库、模板、教案生成
router.use('/teaching-targets', teachingTargetsRoutes);
router.use('/templates', templatesRoutes);
router.use('/assessments', assessmentsRoutes);
router.use('/students', studentsRoutes);

// API 根路径信息
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '乐星融合学校数字化教学管理系统 API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/login': '用户登录（§5.2）',
        'GET /api/auth/me': '获取当前用户信息（需认证）'
      },
      users: {
        'GET /api/users/list': '获取用户列表（超管、管理员）（§5.2）',
        'POST /api/users/create': '创建账号（超管、管理员）（§5.2）',
        'GET /api/users': '获取用户列表（兼容）',
        'PUT /api/users/:id': '更新用户',
        'DELETE /api/users/:id': '删除用户（超管）'
      },
      articles: {
        'GET /api/articles': '获取文章列表',
        'POST /api/articles/publish': '发布活动宣传页（管理员）（§5.2）',
        'POST /api/articles': '创建文章（教师及以上）',
        'PUT /api/articles/:id': '更新文章',
        'DELETE /api/articles/:id': '删除文章（管理员）'
      },
      homepage: {
        'GET /api/homepage/config': '获取首页配置',
        'PUT /api/homepage/update': '更新首页轮播图/视频链接（管理员）（§5.2）'
      },
      upload: {
        'POST /api/upload': '上传文件',
        'POST /api/upload/image': '上传图片',
        'GET /api/upload/files': '获取文件列表（管理员）',
        'DELETE /api/upload/:key': '删除文件（管理员）'
      },
      'teaching-targets': {
        'GET /api/teaching-targets': '教案库列表（支持分页与筛选）',
        'POST /api/teaching-targets': '新增目标（管理员）',
        'POST /api/teaching-targets/import': 'Excel 批量导入（管理员）',
        'PUT /api/teaching-targets/:id': '更新',
        'DELETE /api/teaching-targets/:id': '删除'
      },
      templates: {
        'GET /api/templates': '模板列表',
        'POST /api/templates/upload': '上传模板（管理员）',
        'PUT /api/templates/:id': '更新',
        'DELETE /api/templates/:id': '删除'
      },
      assessments: {
        'GET /api/assessments': '历史教案列表',
        'POST /api/assessments/generate': '生成教案并下载（按次扣课时）',
        'PUT /api/assessments/:id/void': '作废教案（软删除）'
      },
      students: {
        'GET /api/students': '学生列表（教师/家长仅自己的学生或孩子）',
        'GET /api/students/:id': '学生详情',
        'GET /api/students/:id/charts/radar': '雷达图数据（§5.4）',
        'GET /api/students/:id/charts/trend': '折线图数据'
      }
    }
  });
});

module.exports = router;
