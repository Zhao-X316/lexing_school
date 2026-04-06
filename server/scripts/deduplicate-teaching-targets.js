/**
 * 删除 teaching_targets 表中的重复数据
 * 重复定义：major_category、sub_category、stage、target_type、content、target_number 完全相同
 * 保留每组中 id 最小的记录，将 assessment_details 的 target_id 指向保留记录后删除其余
 * 用法: cd server && node scripts/deduplicate-teaching-targets.js
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
    // 1. 查找重复组（保留 id 最小的）
    const [duplicates] = await conn.query(`
      SELECT major_category, sub_category, stage, target_type, content,
             COALESCE(target_number, '') AS target_number,
             GROUP_CONCAT(id ORDER BY id) AS ids,
             COUNT(*) AS cnt
      FROM teaching_targets
      GROUP BY major_category, sub_category, stage, target_type, content, COALESCE(target_number, '')
      HAVING cnt > 1
    `);

    if (duplicates.length === 0) {
      console.log('未发现重复数据');
      return;
    }

    console.log('发现', duplicates.length, '组重复数据');

    let totalDeleted = 0;
    for (const row of duplicates) {
      const ids = row.ids.split(',').map(Number);
      const keepId = ids[0]; // 保留 id 最小的
      const deleteIds = ids.slice(1);

      for (const dupId of deleteIds) {
        // 将引用 dupId 的 assessment_details 改为引用 keepId
        await conn.query(
          'UPDATE assessment_details SET target_id = ? WHERE target_id = ?',
          [keepId, dupId]
        );
        await conn.query('DELETE FROM teaching_targets WHERE id = ?', [dupId]);
        totalDeleted++;
      }
    }

    console.log('已删除', totalDeleted, '条重复记录');
  } finally {
    await conn.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
