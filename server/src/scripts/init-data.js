/**
 * 初始化数据入口 - 已切换为 MySQL（项目说明书 §6.3）
 * 实际执行 server/src/scripts/seed-mysql.js 的种子逻辑。
 * 超级管理员：admin / Zzx1998.
 */
const { seed } = require('./seed-mysql');

seed().catch((err) => {
  console.error('初始化数据失败:', err);
  process.exit(1);
});
