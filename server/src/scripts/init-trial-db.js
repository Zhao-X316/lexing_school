/**
 * 试运行一键初始化：创建数据库 → 建表 → 建索引 → 插入超管
 * 使用 server/.env 中的 MYSQL_*、MYSQL_DATABASE；请先填写 MYSQL_PASSWORD
 * 运行：在项目根目录执行 node server/src/scripts/init-trial-db.js 或 cd server && node src/scripts/init-trial-db.js
 */
const path = require('path');
const fs = require('fs');

// 从 server 目录加载 .env（兼容从根目录或 server 目录执行）
const serverDir = path.join(__dirname, '../..');
require('dotenv').config({ path: path.join(serverDir, '.env') });

const mysql = require('mysql2/promise');

const DB = process.env.MYSQL_DATABASE || 'lexing_school';
const HOST = process.env.MYSQL_HOST || '127.0.0.1';
const PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);
const USER = process.env.MYSQL_USER || 'root';
const PASSWORD = process.env.MYSQL_PASSWORD || '';

async function run() {
  if (!DB) {
    console.error('请设置 MYSQL_DATABASE（或在 server/.env 中配置）');
    process.exit(1);
  }

  console.log('使用数据库:', DB, '主机:', HOST);
  console.log('');

  const baseConfig = { host: HOST, port: PORT, user: USER, password: PASSWORD };

  const connNoDb = await mysql.createConnection(baseConfig);
  try {
    await connNoDb.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` DEFAULT CHARACTER SET utf8mb4`);
    console.log('✓ 数据库已就绪');
  } finally {
    await connNoDb.end();
  }

  const conn = await mysql.createConnection({
    ...baseConfig,
    database: DB,
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(serverDir, 'database', 'schema-mysql.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await conn.query(schemaSql);
    console.log('✓ 建表完成');

    const indexPath = path.join(serverDir, 'database', 'schema-mysql-indexes.sql');
    const indexSql = fs.readFileSync(indexPath, 'utf8');
    const statements = indexSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));
    for (const stmt of statements) {
      try {
        await conn.query(stmt + ';');
      } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME' && e.errno !== 1061) throw e;
      }
    }
    console.log('✓ 索引已就绪');

    const { seed } = require('./seed-mysql.js');
    await seed();
  } finally {
    await conn.end();
  }

  console.log('');
  console.log('试运行数据库初始化完成，可执行: cd server && pnpm dev');
}

run().catch((err) => {
  console.error('初始化失败:', err.message);
  process.exit(1);
});
