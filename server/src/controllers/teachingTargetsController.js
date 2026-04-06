/**
 * 四级教学标签与目标库 - 项目说明书 §4.2、§6.2（3）
 * 表 teaching_targets：major_category, sub_category, stage, target_type, content
 * Excel 表头（§9 P3）：领域；项目；阶段；长期编号；长期方案；短期编号；短期方案
 */
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

/** 标准表头（不可变） */
const STANDARD_HEADERS = ['领域', '项目', '阶段', '长期编号', '长期方案', '短期编号', '短期方案'];

/**
 * 从 ExcelJS 单元格安全提取文本，避免富文本/公式等产生 [object Object]
 * @param {ExcelJS.Cell} cell
 * @returns {string}
 */
function getCellText(cell) {
  if (!cell || cell.value == null) return '';
  const v = cell.value;
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  if (v && typeof v === 'object') {
    if (v.richText && Array.isArray(v.richText)) {
      return v.richText.map((t) => (t && t.text) || '').join('').trim();
    }
    if (typeof v.text === 'string') return v.text.trim();
    if (typeof v.result === 'string' || typeof v.result === 'number') return String(v.result).trim();
  }
  if (cell.text != null) return String(cell.text).trim();
  return '';
}

/**
 * 中文数字转阿拉伯数字（阶段解析用）
 * 一→1 ... 十→10, 十一→11, 十二→12
 */
function chineseNumToInt(s) {
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  if (!s || typeof s !== 'string') return 0;
  const t = s.trim();
  if (map[t]) return map[t];
  if (t === '十') return 10;
  const m = t.match(/^十([一二三四五六七八九])$/);
  if (m) return 10 + (map[m[1]] || 0);
  return 0;
}

/**
 * 从「阶段」列解析阶段数字
 * 支持：阿拉伯数字（第1阶段、1）、中文数字（第一阶段、个人自理第一阶段）、Excel 数字类型
 */
function parseStageNum(val) {
  if (val == null || val === '') return NaN;
  const s = String(val).trim();
  const arabic = s.match(/第(\d+)阶段|阶段\s*(\d+)/);
  if (arabic) return parseInt(arabic[1] || arabic[2], 10);
  const cn = s.match(/第([一二三四五六七八九十]+)阶段/);
  if (cn) return chineseNumToInt(cn[1]) || NaN;
  const n = parseInt(s, 10);
  return !isNaN(n) ? n : NaN;
}

const teachingTargetsController = {
  /**
   * 列表（树形/平铺）- GET /api/teaching-targets
   * 支持分页与筛选；不传 page/limit 时返回全量（兼容评估页）
   * 参数：page, limit, major_category, sub_category, stage, target_type, content
   * 多选支持逗号分隔：major_category=CVP,EL
   */
  async list(req, res, next) {
    try {
      const { page, limit, major_category, sub_category, stage, target_type, content } = req.query;
      let whereClause = ' WHERE 1=1';
      const params = [];

      if (major_category && String(major_category).trim()) {
        const vals = String(major_category).split(',').map((v) => v.trim()).filter(Boolean);
        if (vals.length > 0) {
          whereClause += ` AND major_category IN (${vals.map(() => '?').join(',')})`;
          params.push(...vals);
        }
      }
      if (sub_category && String(sub_category).trim()) {
        const vals = String(sub_category).split(',').map((v) => v.trim()).filter(Boolean);
        if (vals.length > 0) {
          whereClause += ` AND sub_category IN (${vals.map(() => '?').join(',')})`;
          params.push(...vals);
        }
      }
      if (stage !== undefined && stage !== '' && stage !== null) {
        const vals = String(stage).split(',').map((v) => parseInt(v.trim(), 10)).filter((n) => !isNaN(n));
        if (vals.length > 0) {
          whereClause += ` AND stage IN (${vals.map(() => '?').join(',')})`;
          params.push(...vals);
        }
      }
      if (target_type && ['long_term', 'short_term'].includes(String(target_type))) {
        whereClause += ' AND target_type = ?';
        params.push(target_type);
      }
      if (content && String(content).trim()) {
        whereClause += ' AND content LIKE ?';
        params.push('%' + String(content).trim() + '%');
      }

      const orderBy = ' ORDER BY major_category, sub_category, stage, target_type';
      const selectSql = 'SELECT id, major_category, sub_category, stage, target_type, content, target_number, created_at FROM teaching_targets' + whereClause + orderBy;

      const hasPagination = page !== undefined && page !== '' && limit !== undefined && limit !== '';
      if (hasPagination) {
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM teaching_targets' + whereClause, params);
        const total = (countRows && countRows[0] && countRows[0].total) || 0;

        const [rows] = await pool.execute(selectSql + ` LIMIT ${limitNum} OFFSET ${offset}`, params);
        res.json({
          success: true,
          data: { list: rows, total, page: pageNum, limit: limitNum }
        });
      } else {
        const [rows] = await pool.execute(selectSql, params);
        res.json({ success: true, data: { list: rows, total: rows.length, page: 1, limit: rows.length } });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * 单条 - GET /api/teaching-targets/:id
   */
  async getById(req, res, next) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, major_category, sub_category, stage, target_type, content, target_number, created_at FROM teaching_targets WHERE id = ? LIMIT 1',
        [req.params.id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('目标不存在', 404);
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 新增 - POST /api/teaching-targets
   */
  async create(req, res, next) {
    try {
      const { major_category, sub_category, stage, target_type, content, target_number } = req.body;
      if (!major_category || !sub_category || stage === undefined || !target_type || !content) {
        throw new AppError('major_category、sub_category、stage、target_type、content 不能为空', 400);
      }
      if (!['long_term', 'short_term'].includes(target_type)) {
        throw new AppError('target_type 须为 long_term 或 short_term', 400);
      }
      const [result] = await pool.execute(
        'INSERT INTO teaching_targets (major_category, sub_category, stage, target_type, content, target_number) VALUES (?, ?, ?, ?, ?, ?)',
        [major_category, sub_category, parseInt(stage, 10), target_type, content, target_number || null]
      );
      const [rows] = await pool.execute(
        'SELECT id, major_category, sub_category, stage, target_type, content, target_number, created_at FROM teaching_targets WHERE id = ?',
        [result.insertId]
      );
      res.status(201).json({ success: true, message: '创建成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新 - PUT /api/teaching-targets/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { major_category, sub_category, stage, target_type, content, target_number } = req.body;
      const updates = [];
      const params = [];
      if (major_category !== undefined) { updates.push('major_category = ?'); params.push(major_category); }
      if (sub_category !== undefined) { updates.push('sub_category = ?'); params.push(sub_category); }
      if (stage !== undefined) { updates.push('stage = ?'); params.push(parseInt(stage, 10)); }
      if (target_type !== undefined) {
        if (!['long_term', 'short_term'].includes(target_type)) {
          throw new AppError('target_type 须为 long_term 或 short_term', 400);
        }
        updates.push('target_type = ?');
        params.push(target_type);
      }
      if (content !== undefined) { updates.push('content = ?'); params.push(content); }
      if (target_number !== undefined) { updates.push('target_number = ?'); params.push(target_number || null); }
      if (updates.length === 0) {
        throw new AppError('无有效更新字段', 400);
      }
      params.push(id);
      await pool.execute(`UPDATE teaching_targets SET ${updates.join(', ')} WHERE id = ?`, params);
      const [rows] = await pool.execute(
        'SELECT id, major_category, sub_category, stage, target_type, content, target_number, created_at FROM teaching_targets WHERE id = ?',
        [id]
      );
      res.json({ success: true, message: '更新成功', data: rows[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 一键清空 - DELETE /api/teaching-targets/clear
   * assessment_details 已存 major_category 快照，清空后图表仍可展示；仅超管、管理员
   */
  async clear(req, res, next) {
    try {
      const [result] = await pool.execute('DELETE FROM teaching_targets');
      const deleted = result.affectedRows || 0;
      res.json({ success: true, message: `已清空教案库，共删除 ${deleted} 条` });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 删除 - DELETE /api/teaching-targets/:id
   */
  async remove(req, res, next) {
    try {
      const [result] = await pool.execute('DELETE FROM teaching_targets WHERE id = ?', [req.params.id]);
      if (result.affectedRows === 0) {
        throw new AppError('目标不存在', 404);
      }
      res.json({ success: true, message: '已删除' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 批量导入 Excel - POST /api/teaching-targets/import（§4.2、§9 P3）
   * 表头必须为标准：领域；项目；阶段；长期编号；长期方案；短期编号；短期方案
   */
  async importExcel(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        throw new AppError('请上传 Excel 文件', 400);
      }
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) {
        throw new AppError('Excel 无有效工作表', 400);
      }

      // 1. 使用 getCellText 读取表头
      const headers = [];
      const headRow = sheet.getRow(1);
      headRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = getCellText(cell);
      });

      // 2. 标准表头强校验
      const normalizedHeaders = headers.map((h) => (h || '').replace(/\s/g, ''));
      const missing = STANDARD_HEADERS.filter((std) => {
        const n = std.replace(/\s/g, '');
        return !normalizedHeaders.some((h) => h === n);
      });
      if (missing.length > 0) {
        throw new AppError(`Excel 表头不符合标准格式，缺少列：${missing.join('、')}。请按标准表头调整后重新上传。`, 400);
      }

      const colIndex = (name) => {
        const n = (name || '').replace(/\s/g, '');
        const i = normalizedHeaders.findIndex((h) => h === n);
        return i >= 0 ? i : -1;
      };
      const getVal = (row, key) => {
        const idx = colIndex(key);
        if (idx < 0) return '';
        const cell = row.getCell(idx + 1);
        return cell ? getCellText(cell) : '';
      };

      // 3. 行级校验并收集待插入记录
      const records = [];
      const rowErrors = [];
      for (let r = 2; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const 领域 = getVal(row, '领域');
        const 项目 = getVal(row, '项目');
        const 阶段 = getVal(row, '阶段');
        const 长期编号 = getVal(row, '长期编号');
        const 长期方案 = getVal(row, '长期方案');
        const 短期编号 = getVal(row, '短期编号');
        const 短期方案 = getVal(row, '短期方案');

        // 空行跳过
        if (!领域 && !项目 && !阶段 && !长期方案 && !短期方案) continue;

        // 领域、项目必填
        if (!领域 || !项目) {
          rowErrors.push(`第 ${r} 行：领域、项目不能为空`);
          continue;
        }

        // 阶段必须为明确数字（1-10 或按业务允许范围），支持中文数字如「第一阶段」
        const stageNum = parseStageNum(阶段);
        if (isNaN(stageNum) || stageNum < 1 || stageNum > 10) {
          rowErrors.push(`第 ${r} 行：阶段必须为 1-10 之间的整数，当前值「${阶段}」无效`);
          continue;
        }

        if (长期方案) {
          records.push({ major_category: 领域, sub_category: 项目, stage: stageNum, target_type: 'long_term', content: 长期方案, target_number: 长期编号 || null });
        }
        if (短期方案) {
          records.push({ major_category: 领域, sub_category: 项目, stage: stageNum, target_type: 'short_term', content: 短期方案, target_number: 短期编号 || null });
        }
      }

      if (rowErrors.length > 0) {
        throw new AppError(`导入校验失败：\n${rowErrors.join('\n')}`, 400);
      }

      // 4. 同批预去重
      const seen = new Set();
      const toInsert = [];
      let skipped = 0;
      for (const rec of records) {
        const key = [rec.major_category, rec.sub_category, rec.stage, rec.target_type, rec.content, rec.target_number || ''].join('\0');
        if (seen.has(key)) {
          skipped++;
          continue;
        }
        seen.add(key);
        toInsert.push(rec);
      }

      // 5. 事务保护
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        let inserted = 0;
        for (const rec of toInsert) {
          await conn.execute(
            'INSERT INTO teaching_targets (major_category, sub_category, stage, target_type, content, target_number) VALUES (?, ?, ?, ?, ?, ?)',
            [rec.major_category, rec.sub_category, rec.stage, rec.target_type, rec.content, rec.target_number]
          );
          inserted++;
        }

        // 保留现有 SQL 去重
        const [duplicates] = await conn.query(`
          SELECT major_category, sub_category, stage, target_type, content,
                 COALESCE(target_number, '') AS target_number,
                 GROUP_CONCAT(id ORDER BY id) AS ids,
                 COUNT(*) AS cnt
          FROM teaching_targets
          GROUP BY major_category, sub_category, stage, target_type, content, COALESCE(target_number, '')
          HAVING cnt > 1
        `);
        let deleted = 0;
        for (const row of duplicates) {
          const ids = row.ids.split(',').map(Number);
          const keepId = ids[0];
          for (const dupId of ids.slice(1)) {
            await conn.execute(
              'UPDATE assessment_details SET target_id = ? WHERE target_id = ?',
              [keepId, dupId]
            );
            const [del] = await conn.execute('DELETE FROM teaching_targets WHERE id = ?', [dupId]);
            deleted += del.affectedRows;
          }
        }

        await conn.commit();

        const parts = [`成功导入 ${inserted} 条目标`];
        if (skipped > 0) parts.push(`跳过同批重复 ${skipped} 条`);
        if (deleted > 0) parts.push(`删除历史重复 ${deleted} 条`);
        res.json({ success: true, message: parts.join('，') });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (error) {
      next(error);
    }
  }
};

module.exports = teachingTargetsController;
