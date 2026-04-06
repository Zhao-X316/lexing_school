require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// ============================================
// 中间件配置
// ============================================

// CORS 配置（生产环境必须设置 CORS_ORIGIN；动静分离多域名可用英文逗号分隔）
const corsOriginRaw = process.env.CORS_ORIGIN || '*';
const isProduction = process.env.NODE_ENV === 'production';

let corsOriginOption;
if (corsOriginRaw === '*') {
  corsOriginOption = '*';
} else {
  const list = corsOriginRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) {
    console.warn(
      '[CORS] CORS_ORIGIN parsed to an empty allowlist; falling back to * (credentials disabled in production).'
    );
    corsOriginOption = '*';
  } else if (list.length === 1) {
    corsOriginOption = list[0];
  } else {
    corsOriginOption = list;
  }
}

// 浏览器不允许 credentials + Allow-Origin: * 同时生效；生产环境对通配关闭 credentials
const allowCredentials = !(isProduction && corsOriginOption === '*');

app.use(cors({
  origin: corsOriginOption,
  credentials: allowCredentials,
  exposedHeaders: ['Content-Disposition']
}));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志（开发环境）
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// 静态文件服务
// ============================================

// 上传的文件（公开 URL；敏感内容请走鉴权下载接口或由网关限制访问；此处关闭目录索引与隐藏文件）
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    index: false,
    dotfiles: 'ignore'
  })
);

// ============================================
// 路由
// ============================================

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '乐星融合学校管理系统 API 服务运行中',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '欢迎访问乐星融合学校管理系统 API',
    documentation: '/api',
    health: '/health'
  });
});

// ============================================
// 错误处理
// ============================================

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

module.exports = app;
