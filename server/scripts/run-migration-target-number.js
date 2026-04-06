/**
 * 执行 target_number 字段迁移
 * 用法: cd server && node scripts/run-migration-target-number.js
 * 环境变量：使用 server/.env 中的 MYSQL_HOST、MYSQL_USER、MYSQL_PASSWORD、MYSQL_DATABASE
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'lexing_school'
  });
  try {
    const [rows] = await conn.query("SHOW COLUMNS FROM teaching_targets LIKE 'target_number'");
    if (rows.length === 0) {
      await conn.query(
        "ALTER TABLE teaching_targets ADD COLUMN target_number VARCHAR(50) DEFAULT NULL COMMENT '目标编号：长期编号或短期编号'"
      );
      console.log('已添加 target_number 字段');
    } else {
      console.log('target_number 字段已存在');
    }
  } finally {
    await conn.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
