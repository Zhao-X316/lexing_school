require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

// 启动服务器 - 严格依据 项目说明书.md §5、§6
async function startServer() {
  try {
    const db = process.env.MYSQL_DATABASE;
    const jwtSecret = process.env.JWT_SECRET;

    if (!db) {
      console.error('❌ 缺少 MySQL 配置');
      console.error('请设置环境变量: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
      process.exit(1);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const defaultSecret = 'default-secret-key-change-in-production';
    if (isProduction && (!jwtSecret || jwtSecret === defaultSecret)) {
      console.error('❌ 生产环境必须设置 JWT_SECRET 且不可使用默认值');
      process.exit(1);
    }
    if (!jwtSecret) {
      console.warn('⚠️  JWT_SECRET 未设置，使用默认值（生产环境请设置）');
    }
    
    // 启动 Express 服务器
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('🚀 乐星融合学校管理系统 API 服务已启动');
      console.log('='.repeat(50));
      console.log(`📋 服务地址: http://localhost:${PORT}`);
      console.log(`🔌 API 文档: http://localhost:${PORT}/api`);
      console.log(`💚 健康检查: http://localhost:${PORT}/health`);
      console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

startServer();
