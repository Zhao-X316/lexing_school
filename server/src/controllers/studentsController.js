/**
 * 学生档案 - 项目说明书 §6.2（2）、§8
 * 教师仅能查看 teacher_id = 当前用户 id 的学生
 */
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const studentsController = {
  /**
   * 学生列表 - GET /api/students（教师仅自己的学生）
   */
  /**
   * 学生列表 - 教师仅自己的学生；家长仅自己的孩子（§4.3）
   */
  async list(req, res, next) {
    try {
      const role = req.user.role;
      const userId = req.user.id;

      let sql = 'SELECT s.id, s.name, s.parent_id, s.teacher_id, s.total_hours, s.used_hours, s.remaining_hours, s.created_at FROM students s WHERE 1=1';
      const params = [];
      if (role === 'teacher') {
        sql += ' AND s.teacher_id = ?';
        params.push(userId);
      }
      if (role === 'parent') {
        sql += ' AND s.parent_id = ?';
        params.push(userId);
      }
      sql += ' ORDER BY s.created_at DESC';

      const [rows] = await pool.execute(sql, params);
      res.json({ success: true, data: { list: rows } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 单条 - GET /api/students/:id（教师仅自己的学生）
   */
  /**
   * 单条 - 教师仅自己的学生；家长仅自己的孩子
   */
  async getById(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, name, parent_id, teacher_id, total_hours, used_hours, remaining_hours, created_at FROM students WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('学生不存在', 404);
      }
      const role = req.user.role;
      const userId = req.user.id;
      if (role === 'teacher' && Number(rows[0].teacher_id) !== Number(userId)) {
        throw new AppError('无权查看该学生', 403);
      }
      if (role === 'parent' && Number(rows[0].parent_id) !== Number(userId)) {
        throw new AppError('无权查看该学生', 403);
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 创建学生 - POST /api/students（§12.2.1，权限：超管、管理员）
   * Body: name, teacher_id?, parent_id?, total_hours?
   */
  async create(req, res, next) {
    try {
      const { name, teacher_id, parent_id, total_hours } = req.body;
      if (!name || !String(name).trim()) {
        throw new AppError('学生姓名不能为空', 400);
      }
      const total = total_hours != null ? parseInt(total_hours, 10) : 0;
      const tid = teacher_id != null && teacher_id !== '' ? parseInt(teacher_id, 10) : null;
      const pid = parent_id != null && parent_id !== '' ? parseInt(parent_id, 10) : null;
      const [result] = await pool.execute(
        'INSERT INTO students (name, parent_id, teacher_id, total_hours, used_hours, remaining_hours) VALUES (?, ?, ?, ?, 0, ?)',
        [String(name).trim(), pid, tid, isNaN(total) ? 0 : total, isNaN(total) ? 0 : total]
      );
      const [rows] = await pool.execute(
        'SELECT id, name, parent_id, teacher_id, total_hours, used_hours, remaining_hours, created_at FROM students WHERE id = ?',
        [result.insertId]
      );
      res.status(201).json({ success: true, message: '创建成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新学生 - PUT /api/students/:id（§12.2.1，权限：超管、管理员）
   * Body: name?, teacher_id?, parent_id?, total_hours?
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, teacher_id, parent_id, total_hours } = req.body;
      const [existing] = await pool.execute('SELECT id FROM students WHERE id = ? LIMIT 1', [id]);
      if (!existing || existing.length === 0) {
        throw new AppError('学生不存在', 404);
      }
      const updates = [];
      const params = [];
      if (name !== undefined) {
        if (!String(name).trim()) throw new AppError('学生姓名不能为空', 400);
        updates.push('name = ?');
        params.push(String(name).trim());
      }
      if (teacher_id !== undefined) {
        updates.push('teacher_id = ?');
        params.push(teacher_id != null && teacher_id !== '' ? parseInt(teacher_id, 10) : null);
      }
      if (parent_id !== undefined) {
        updates.push('parent_id = ?');
        params.push(parent_id != null && parent_id !== '' ? parseInt(parent_id, 10) : null);
      }
      if (total_hours !== undefined) {
        const total = parseInt(total_hours, 10);
        if (!isNaN(total) && total >= 0) {
          updates.push('total_hours = ?');
          params.push(total);
          updates.push('remaining_hours = ?');
          const [cur] = await pool.execute('SELECT used_hours FROM students WHERE id = ?', [id]);
          const used = cur && cur[0] ? cur[0].used_hours : 0;
          params.push(Math.max(0, total - used));
        }
      }
      if (updates.length === 0) {
        throw new AppError('无有效更新字段', 400);
      }
      params.push(id);
      await pool.execute(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, params);
      const [rows] = await pool.execute(
        'SELECT id, name, parent_id, teacher_id, total_hours, used_hours, remaining_hours, created_at FROM students WHERE id = ?',
        [id]
      );
      res.json({ success: true, message: '更新成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = studentsController;
