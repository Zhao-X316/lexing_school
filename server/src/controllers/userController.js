/**
 * 用户控制器 - 严格依据 项目说明书.md §5.2、§6.2、§8
 * 表 users：id, username, password_hash, role, status, created_at
 * 密码使用 bcrypt 加密
 */
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../config/jwt');
const { AppError } = require('../middleware/errorHandler');

const USER_FIELDS = 'id, username, role, status, created_at';

const userController = {
  /**
   * 用户登录 - POST /api/auth/login（§5.2）
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        throw new AppError('用户名和密码不能为空', 400);
      }

      const [rows] = await pool.execute(
        'SELECT id, username, password_hash, role, status FROM users WHERE username = ? LIMIT 1',
        [username]
      );
      const user = rows && rows[0];
      if (!user) {
        throw new AppError('用户名或密码错误', 401);
      }
      if (user.status !== 'active') {
        throw new AppError('账号已被禁用或未激活', 403);
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        throw new AppError('用户名或密码错误', 401);
      }

      const token = generateToken({ id: user.id, role: user.role });
      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: { id: user.id, username: user.username, role: user.role, status: user.status },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取用户列表 - GET /api/users/list 或 GET /api/users（§5.2，权限：超管、管理员）
   * 查询参数：role, status, search(用户名模糊), page, limit
   */
  async getList(req, res, next) {
    try {
      const { role, status, search, page, limit } = req.query;
      let sql = `SELECT ${USER_FIELDS} FROM users WHERE 1=1`;
      const params = [];
      if (role && ['super_admin', 'admin', 'teacher', 'parent'].includes(String(role))) {
        sql += ' AND role = ?';
        params.push(role);
      }
      if (status && ['active', 'frozen'].includes(String(status))) {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search && String(search).trim()) {
        sql += ' AND username LIKE ?';
        params.push('%' + String(search).trim() + '%');
      }
      sql += ' ORDER BY created_at DESC';
      const [allRows] = await pool.execute(sql, params);
      const total = allRows.length;
      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
      const offset = (pageNum - 1) * limitNum;
      // LIMIT/OFFSET 使用数字拼接（已校验，防注入），避免 prepared statement 的 "Incorrect arguments to mysqld_stmt_execute"
      const [rows] = await pool.execute(sql + ` LIMIT ${limitNum} OFFSET ${offset}`, params);
      res.json({
        success: true,
        data: {
          list: rows,
          total,
          page: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 创建账号 - POST /api/users/create（§5.2，权限：超管、管理员）
   */
  async create(req, res, next) {
    try {
      const { username, password, role } = req.body;
      if (!username || !password) {
        throw new AppError('用户名和密码不能为空', 400);
      }
      const r = role || 'parent';
      if (!['super_admin', 'admin', 'teacher', 'parent'].includes(r)) {
        throw new AppError('无效的角色', 400);
      }
      // 仅超管可创建 admin / super_admin，管理员只能创建教师、家长
      const callerRole = req.user.role;
      if (['super_admin', 'admin'].includes(r) && callerRole !== 'super_admin') {
        throw new AppError('仅超级管理员可创建管理员或超管账号', 403);
      }

      const [existing] = await pool.execute('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
      if (existing && existing.length > 0) {
        throw new AppError('用户名已存在', 409);
      }

      const password_hash = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
        [username, password_hash, r, 'active']
      );
      const id = result.insertId;
      const [newUser] = await pool.execute(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [id]);
      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: newUser[0]
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取当前用户 - GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      const [rows] = await pool.execute(
        `SELECT ${USER_FIELDS} FROM users WHERE id = ? LIMIT 1`,
        [req.user.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('用户不存在', 404);
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 根据 ID 获取用户 - GET /api/users/:id（管理员）
   */
  async getUserById(req, res, next) {
    try {
      const [rows] = await pool.execute(
        `SELECT ${USER_FIELDS} FROM users WHERE id = ? LIMIT 1`,
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('用户不存在', 404);
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新用户 - PUT /api/users/:id（仅 role、status，表结构限定）
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, status } = req.body;
      const updates = [];
      const params = [];
      if (role !== undefined) {
        if (!['super_admin', 'admin', 'teacher', 'parent'].includes(role)) {
          throw new AppError('无效的角色', 400);
        }
        updates.push('role = ?');
        params.push(role);
      }
      if (status !== undefined) {
        if (!['active', 'frozen'].includes(status)) {
          throw new AppError('无效的状态', 400);
        }
        updates.push('status = ?');
        params.push(status);
      }
      if (updates.length === 0) {
        throw new AppError('无有效更新字段', 400);
      }
      params.push(id);
      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      const [rows] = await pool.execute(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [id]);
      res.json({ success: true, message: '更新成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 删除用户 - DELETE /api/users/:id（仅超管）
   */
  async deleteUser(req, res, next) {
    try {
      if (req.user.role !== 'super_admin') {
        throw new AppError('只有超级管理员可以删除用户', 403);
      }
      if (String(req.params.id) === String(req.user.id)) {
        throw new AppError('不能删除自己的账号', 400);
      }
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) {
        throw new AppError('用户不存在', 404);
      }
      res.json({ success: true, message: '用户已删除' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 修改密码 - PUT /api/users/:id/password（需登录）
   * 本人或非超管：必须校验 old_password。
   * 超级管理员重置他人密码：可不要求旧密码（管理重置）；改自己密码时仍须旧密码。
   */
  async changePassword(req, res, next) {
    try {
      const id = req.params.id || req.user.id;
      const { old_password, new_password } = req.body;
      if (String(id) !== String(req.user.id) && req.user.role !== 'super_admin') {
        throw new AppError('权限不足', 403);
      }
      if (!new_password || new_password.length < 6) {
        throw new AppError('新密码长度至少6位', 400);
      }

      const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [id]);
      if (!rows || rows.length === 0) {
        throw new AppError('用户不存在', 404);
      }
      const isSelf = String(id) === String(req.user.id);
      const isSuperResettingOther = req.user.role === 'super_admin' && !isSelf;
      if (!isSuperResettingOther) {
        if (!old_password) {
          throw new AppError('请输入旧密码', 400);
        }
        const valid = await bcrypt.compare(old_password, rows[0].password_hash);
        if (!valid) {
          throw new AppError('旧密码错误', 400);
        }
      }

      const password_hash = await bcrypt.hash(new_password, 10);
      await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
      res.json({ success: true, message: '密码修改成功' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
