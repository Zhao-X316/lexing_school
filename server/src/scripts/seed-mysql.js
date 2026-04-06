/**
 * MySQL 种子数据脚本 - 严格依据 项目说明书.md §6.3
 * 插入超级管理员账号：username=admin, password=Zzx1998.
 * 运行前请先执行 server/database/schema-mysql.sql 建表。
 * 环境变量：MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DEFAULT_PASSWORD = 'Zzx1998.';

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '192.168.5.2',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE
  });

  if (!process.env.MYSQL_DATABASE) {
    console.error('请设置环境变量 MYSQL_DATABASE');
    process.exit(1);
  }

  try {
    const [rows] = await conn.execute(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      ['admin']
    );
    if (rows && rows.length > 0) {
      console.log('超级管理员账号已存在，跳过插入。');
      return;
    }

    const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await conn.execute(
      'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
      ['admin', password_hash, 'super_admin', 'active']
    );

    console.log('');
    console.log('====================================');
    console.log('超级管理员账号创建成功（§6.3）');
    console.log('====================================');
    console.log('用户名: admin');
    console.log('密码: ' + DEFAULT_PASSWORD);
    console.log('生产环境上线后务必修改密码。');
    console.log('====================================');
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('种子数据执行失败:', err);
    process.exit(1);
  });
}

module.exports = { seed };
