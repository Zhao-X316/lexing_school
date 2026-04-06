/**
 * 执行 assessment_details major_category 快照迁移
 * 使教案库一键清空后，历史图表仍可正常展示
 * 用法: cd server && node scripts/run-migration-assessment-details.js
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
    // 1. 检查 major_category 列是否已存在
    const [cols] = await conn.query(
      "SHOW COLUMNS FROM assessment_details LIKE 'major_category'"
    );
    if (cols.length === 0) {
      await conn.query(
        "ALTER TABLE assessment_details ADD COLUMN major_category VARCHAR(50) DEFAULT NULL COMMENT '目标大类快照，用于清空目标库后图表仍可展示'"
      );
      console.log('已添加 major_category 列');
    } else {
      console.log('major_category 列已存在');
    }

    // 2. 回填已有数据
    const [upd] = await conn.query(`
      UPDATE assessment_details ad
      JOIN teaching_targets tt ON tt.id = ad.target_id
      SET ad.major_category = tt.major_category
      WHERE ad.major_category IS NULL
    `);
    if (upd.affectedRows > 0) {
      console.log('已回填', upd.affectedRows, '条 major_category');
    }

    // 3. 查找 target_id 外键约束名
    const [fks] = await conn.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assessment_details'
       AND COLUMN_NAME = 'target_id' AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [process.env.MYSQL_DATABASE || 'lexing_school']
    );
    const fkName = fks && fks[0] && fks[0].CONSTRAINT_NAME;

    if (fkName) {
      await conn.query(
        "ALTER TABLE assessment_details MODIFY COLUMN target_id INT NULL COMMENT '关联训练目标ID，清空目标库时置空'"
      );
      await conn.query('ALTER TABLE assessment_details DROP FOREIGN KEY ??', [fkName]);
      await conn.query(
        `ALTER TABLE assessment_details ADD CONSTRAINT assessment_details_target_fk
         FOREIGN KEY (target_id) REFERENCES teaching_targets(id) ON DELETE SET NULL`
      );
      console.log('已修改 target_id 外键为 ON DELETE SET NULL');
    } else {
      console.log('未找到 target_id 外键，可能已修改');
    }
  } finally {
    await conn.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
