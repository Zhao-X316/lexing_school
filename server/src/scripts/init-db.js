const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/database');

/**
 * 数据库初始化脚本
 * 用于创建表结构和初始数据
 */
async function initializeDatabase() {
  console.log('开始初始化数据库...');
  
  try {
    // 读取 Schema SQL 文件
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // 将 SQL 分割成多个语句执行
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`共有 ${statements.length} 个 SQL 语句需要执行`);
    
    // 由于 Supabase 客户端不直接支持执行原始 SQL
    // 我们需要通过 Supabase 的 RPC 或使用 REST API
    // 这里先输出提示，实际初始化建议通过 Supabase 控制台执行
    
    console.log('\n====================================');
    console.log('数据库初始化说明:');
    console.log('====================================');
    console.log('1. 请登录 Supabase 控制台');
    console.log('2. 进入 SQL Editor');
    console.log('3. 执行 server/database/schema.sql 中的 SQL 语句');
    console.log('4. 或使用 Supabase CLI: supabase db push');
    console.log('====================================\n');
    
    console.log('数据库 Schema 文件位置: server/database/schema.sql');
    
    return {
      success: true,
      message: '请手动执行 SQL Schema 初始化数据库'
    };
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 创建初始超级管理员账号
 */
async function createInitialAdmin() {
  console.log('\n请通过以下 API 创建超级管理员:');
  console.log('POST /api/auth/register');
  console.log('Body: {');
  console.log('  "username": "admin",');
  console.log('  "password": "your-secure-password",');
  console.log('  "real_name": "系统管理员",');
  console.log('  "role": "super_admin"');
  console.log('}');
}

module.exports = {
  initializeDatabase,
  createInitialAdmin
};

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase()
    .then(result => {
      if (result.success) {
        console.log('\n✓ 数据库初始化准备完成');
      } else {
        console.error('\n✗ 数据库初始化失败:', result.error);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('执行错误:', err);
      process.exit(1);
    });
}
