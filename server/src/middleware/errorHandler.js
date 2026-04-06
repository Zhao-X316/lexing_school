/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 默认错误状态码和消息
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';

  // 处理特定类型的错误
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '未授权访问';
  } else if (err.code === '23505' || err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    statusCode = 409;
    message = '数据已存在';
  } else if (err.code === '23503' || err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451 || err.errno === 1452) {
    statusCode = 400;
    message = '关联数据不存在';
  } else if (err.code && String(err.code).startsWith('ER_') && err.message) {
    // MySQL 错误：开发环境返回具体信息便于排查
    message = process.env.NODE_ENV === 'development' ? err.message : '数据库操作失败';
  }

  // 开发环境返回详细错误信息
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found 中间件
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.path} 不存在`
  });
};

/**
 * 异步处理器包装函数
 * 用于包装异步路由处理器，自动捕获错误
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 自定义应用错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * express-validator 校验结果处理
 * 需在 body/param 等校验中间件之后使用
 */
const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const message = result.array().map((e) => e.msg).join('；') || '参数校验失败';
    return res.status(400).json({ success: false, message });
  }
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  validateRequest
};
