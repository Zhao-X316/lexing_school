/**
 * 文章控制器 - 项目说明书 §5.2、§6.2（6）、§12.2.2 审核流程
 * 表 articles：id, title, content, status (draft/published/pending_review/rejected), created_at, updated_at
 * 教师仅可创建/更新为 draft 或 pending_review；管理员可审核通过/驳回。
 */
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const ALLOWED_STATUSES = ['draft', 'published', 'pending_review', 'rejected'];

const articleController = {
  /**
   * 获取文章列表 - GET /api/articles
   */
  async getArticles(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(limit, 10));
      const limitNum = Math.min(100, parseInt(limit, 10) || 10);

      let sql = 'SELECT id, title, content, status, created_at, updated_at FROM articles';
      const params = [];
      const statusVal = status && ALLOWED_STATUSES.includes(String(status)) ? String(status) : null;
      if (statusVal) {
        sql += ' WHERE status = ?';
        params.push(statusVal);
      }
      sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
      params.push(limitNum, offset);

      const [rows] = await pool.execute(sql, params);
      const [countRows] = await pool.execute(
        statusVal ? 'SELECT COUNT(*) AS total FROM articles WHERE status = ?' : 'SELECT COUNT(*) AS total FROM articles',
        statusVal ? [statusVal] : []
      );
      const total = countRows[0].total;

      res.json({
        success: true,
        data: { list: rows, total, page: parseInt(page, 10), limit: limitNum }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取单篇文章 - GET /api/articles/:id
   */
  async getArticle(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, title, content, status, created_at, updated_at FROM articles WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('文章不存在', 404);
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 发布富文本活动宣传页 - POST /api/articles/publish（§5.2，权限：管理员）
   */
  async publish(req, res, next) {
    try {
      const { title, content } = req.body;
      if (!title || content == null) {
        throw new AppError('标题和内容不能为空', 400);
      }
      const [result] = await pool.execute(
        'INSERT INTO articles (title, content, status) VALUES (?, ?, ?)',
        [title, content, 'published']
      );
      const id = result.insertId;
      const [rows] = await pool.execute(
        'SELECT id, title, content, status, created_at, updated_at FROM articles WHERE id = ?',
        [id]
      );
      res.status(201).json({
        success: true,
        message: '发布成功',
        data: rows[0]
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 创建文章 - POST /api/articles（§12.2.2：教师仅可 draft 或 pending_review）
   */
  async createArticle(req, res, next) {
    try {
      const { title, content, status = 'draft' } = req.body;
      if (!title || content == null) {
        throw new AppError('标题和内容不能为空', 400);
      }
      const role = req.user.role;
      let s = ALLOWED_STATUSES.includes(String(status)) ? String(status) : 'draft';
      if (role === 'teacher') {
        if (s === 'published') {
          s = 'draft';
        }
        if (!['draft', 'pending_review'].includes(s)) {
          s = 'draft';
        }
      }
      const [result] = await pool.execute(
        'INSERT INTO articles (title, content, status) VALUES (?, ?, ?)',
        [title, content, s]
      );
      const id = result.insertId;
      const [rows] = await pool.execute(
        'SELECT id, title, content, status, created_at, updated_at FROM articles WHERE id = ?',
        [id]
      );
      res.status(201).json({ success: true, message: '文章创建成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新文章 - PUT /api/articles/:id（§12.2.2：教师不可设为 published）
   */
  async updateArticle(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content, status } = req.body;
      const role = req.user.role;
      const updates = [];
      const params = [];
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (content !== undefined) {
        updates.push('content = ?');
        params.push(content);
      }
      if (status !== undefined && ALLOWED_STATUSES.includes(String(status))) {
        const s = String(status);
        if (role === 'teacher' && s === 'published') {
          throw new AppError('教师不能直接发布，请提交审核', 403);
        }
        if (role === 'teacher' && !['draft', 'pending_review'].includes(s)) {
          throw new AppError('教师仅可设为草稿或待审核', 403);
        }
        updates.push('status = ?');
        params.push(s);
      }
      if (updates.length === 0) {
        throw new AppError('无有效更新字段', 400);
      }
      params.push(id);
      await pool.execute(`UPDATE articles SET ${updates.join(', ')} WHERE id = ?`, params);
      const [rows] = await pool.execute(
        'SELECT id, title, content, status, created_at, updated_at FROM articles WHERE id = ?',
        [id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('文章不存在', 404);
      }
      res.json({ success: true, message: '文章更新成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 审核通过 - PUT /api/articles/:id/approve（§12.2.2，仅管理员）
   */
  async approve(req, res, next) {
    try {
      const { id } = req.params;
      const [rows] = await pool.execute(
        'SELECT id, status FROM articles WHERE id = ? LIMIT 1',
        [id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('文章不存在', 404);
      }
      if (rows[0].status !== 'pending_review') {
        throw new AppError('仅待审核文章可执行通过操作', 400);
      }
      await pool.execute("UPDATE articles SET status = 'published' WHERE id = ?", [id]);
      const [updated] = await pool.execute(
        'SELECT id, title, content, status, created_at, updated_at FROM articles WHERE id = ?',
        [id]
      );
      res.json({ success: true, message: '已通过并发布', data: updated[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 审核驳回 - PUT /api/articles/:id/reject（§12.2.2，仅管理员）
   */
  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const [rows] = await pool.execute(
        'SELECT id, status FROM articles WHERE id = ? LIMIT 1',
        [id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('文章不存在', 404);
      }
      if (rows[0].status !== 'pending_review') {
        throw new AppError('仅待审核文章可执行驳回操作', 400);
      }
      await pool.execute("UPDATE articles SET status = 'rejected' WHERE id = ?", [id]);
      const [updated] = await pool.execute(
        'SELECT id, title, content, status, created_at, updated_at FROM articles WHERE id = ?',
        [id]
      );
      res.json({ success: true, message: '已驳回', data: updated[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 删除文章 - DELETE /api/articles/:id
   */
  async deleteArticle(req, res, next) {
    try {
      const [result] = await pool.execute('DELETE FROM articles WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) {
        throw new AppError('文章不存在', 404);
      }
      res.json({ success: true, message: '文章已删除' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取文章统计 - GET /api/articles/stats（仅按 status）
   */
  async getStats(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT status, COUNT(*) AS count FROM articles GROUP BY status'
      );
      const byStatus = {};
      rows.forEach((r) => { byStatus[r.status] = r.count; });
      res.json({ success: true, data: { byStatus } });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = articleController;
