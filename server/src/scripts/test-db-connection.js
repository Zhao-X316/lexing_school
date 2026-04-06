/**
 * 测试 MySQL 连接（使用 server/.env）
 * 运行：cd server && node src/scripts/test-db-connection.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

async function test() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE
  };

  console.log('正在连接 MySQL...');
  console.log('  主机:', config.host + ':' + config.port);
  console.log('  用户:', config.user);
  console.log('  数据库:', config.database || '(未指定)');
  console.log('');

  try {
    const conn = await mysql.createConnection(config);
    await conn.ping();
    console.log('✓ 连接成功');

    const [rows] = await conn.query('SELECT DATABASE() AS db, VERSION() AS version');
    console.log('  当前库:', rows[0].db);
    console.log('  MySQL 版本:', rows[0].version);

    if (config.database) {
      const [tables] = await conn.query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
        [config.database]
      );
      console.log('  表数量:', tables.length);
      if (tables.length > 0) {
        console.log('  表列表:', tables.map((t) => t.TABLE_NAME).join(', '));
      }
    }

    await conn.end();
    console.log('');
    console.log('数据库连接正常，可以试运行。');
  } catch (err) {
    console.error('✗ 连接失败:', err.message);
    if (err.code) console.error('  错误码:', err.code);
    process.exit(1);
  }
}

test();
