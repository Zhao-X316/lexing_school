const jwt = require('jsonwebtoken');

const DEFAULT_JWT_SECRET = 'default-secret-key-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 与 server.js 启动校验一致：任意在 production 下加载本模块时即失败，避免遗漏环境变量仍签发令牌
if (process.env.NODE_ENV === 'production') {
  const s = process.env.JWT_SECRET;
  if (!s || s === DEFAULT_JWT_SECRET) {
    throw new Error('生产环境必须设置 JWT_SECRET 且不可使用默认值');
  }
}

/**
 * 生成 JWT Token
 * @param {Object} payload - 要编码的数据（如用户ID、角色等）
 * @returns {String} JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * 验证 JWT Token
 * @param {String} token - JWT Token
 * @returns {Object|null} 解码后的数据，验证失败返回 null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * 解码 JWT Token（不验证有效性）
 * @param {String} token - JWT Token
 * @returns {Object|null} 解码后的数据
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken
};
