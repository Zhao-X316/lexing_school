const { verifyToken } = require('../config/jwt');

/**
 * 认证中间件 - 验证 JWT Token
 */
const authMiddleware = (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀
    
    // 验证 token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '无效或已过期的令牌'
      });
    }

    // 将用户信息附加到请求对象
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证失败'
    });
  }
};

/**
 * 角色权限中间件 - 检查用户角色
 * @param {Array} allowedRoles - 允许访问的角色列表
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证用户'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法访问此资源'
      });
    }

    next();
  };
};

/**
 * 角色层级定义
 * 超管(super_admin) > 管理员(admin) > 教师(teacher) > 家长(parent)
 */
const ROLE_HIERARCHY = {
  'super_admin': 4,
  'admin': 3,
  'teacher': 2,
  'parent': 1
};

/**
 * 检查用户是否有足够高的权限级别
 * @param {String} userRole - 用户角色
 * @param {String} requiredRole - 要求的最低角色
 */
const hasMinimumRole = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * 系统级权限中间件 - 仅允许超管访问
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: '此操作仅限超级管理员执行'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  hasMinimumRole,
  superAdminOnly,
  ROLE_HIERARCHY
};
