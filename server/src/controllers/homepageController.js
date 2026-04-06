/**
 * 首页配置控制器 - 严格依据 项目说明书.md §3.1、§5.2、§6.2（8）
 * 表 homepage_config：config_key, config_value, remark, updated_at
 */
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const homepageController = {
  /**
   * 获取所有配置 - GET /api/homepage/config（官网拉取）
   */
  async getAllConfig(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT config_key, config_value, remark, updated_at FROM homepage_config'
      );
      const configMap = {};
      rows.forEach((r) => {
        configMap[r.config_key] = r.config_value;
      });
      res.json({ success: true, data: configMap });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取单个配置 - GET /api/homepage/config/:key（不存在时返回空值，便于管理端编辑后保存）
   */
  async getConfigByKey(req, res, next) {
    try {
      const key = req.params.key;
      const [rows] = await pool.execute(
        'SELECT config_key, config_value, remark, updated_at FROM homepage_config WHERE config_key = ? LIMIT 1',
        [key]
      );
      if (!rows || rows.length === 0) {
        return res.json({
          success: true,
          data: { config_key: key, config_value: '', config: {}, remark: null, updated_at: null }
        });
      }
      const row = rows[0];
      let config = {};
      if (row.config_value) {
        try {
          config = typeof row.config_value === 'string' ? JSON.parse(row.config_value) : row.config_value;
        } catch (_) {
          config = {};
        }
      }
      res.json({ success: true, data: { ...row, config } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新官网首页轮播图或视频链接 - PUT /api/homepage/update（§5.2，权限：管理员）
   * Body: { config_key, config_value } 或 { items: [{ config_key, config_value }] }
   */
  async update(req, res, next) {
    try {
      const body = req.body;
      const items = body.items && Array.isArray(body.items)
        ? body.items
        : body.config_key != null
          ? [{ config_key: body.config_key, config_value: body.config_value || '' }]
          : [];
      if (items.length === 0) {
        throw new AppError('请提供 config_key 与 config_value 或 items 数组', 400);
      }

      for (const it of items) {
        const k = it.config_key;
        const v = it.config_value != null ? String(it.config_value) : '';
        if (!k) continue;
        await pool.execute(
          'INSERT INTO homepage_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
          [k, v]
        );
      }
      res.json({ success: true, message: '首页配置已更新' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新配置 - PUT /api/homepage/config/:key（兼容旧路径）
   */
  async updateConfig(req, res, next) {
    try {
      const key = req.params.key;
      const config_value = req.body.config_value != null ? String(req.body.config_value) : (req.body.config && typeof req.body.config === 'object' ? JSON.stringify(req.body.config) : '');
      if (!key) {
        throw new AppError('配置键不能为空', 400);
      }
      await pool.execute(
        'INSERT INTO homepage_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
        [key, config_value]
      );
      const [rows] = await pool.execute('SELECT config_key, config_value, updated_at FROM homepage_config WHERE config_key = ?', [key]);
      res.json({ success: true, message: '配置更新成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 批量更新配置 - PUT /api/homepage/config/batch（兼容）
   */
  async batchUpdateConfig(req, res, next) {
    try {
      const configs = req.body.configs;
      if (!configs || typeof configs !== 'object') {
        throw new AppError('配置格式错误', 400);
      }
      let n = 0;
      for (const [key, val] of Object.entries(configs)) {
        const v = typeof val === 'string' ? val : JSON.stringify(val);
        await pool.execute(
          'INSERT INTO homepage_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
          [key, v]
        );
        n++;
      }
      res.json({ success: true, message: `成功更新 ${n} 项配置` });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = homepageController;
