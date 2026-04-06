/**
 * 教案生成与落库 - 项目说明书 §3.2、§4.2、§6.2（4）（5）、§8
 * 占位符：{{studentName}} {{assessmentDate}} {{teacherName}} {#targets} {#domains}
 * 教师仅能为自己负责的学生生成（teacher_id = 当前用户 id）
 * 生成教案不扣课时（课时由上传打卡记录表扣减，见 §3.4）
 */
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const mammoth = require('mammoth');
const ExcelJS = require('exceljs');
const colCache = require('exceljs/lib/utils/col-cache');
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { excelToHtmlFromBuffer } = require('../utils/excelToHtml');

const TEMPLATE_STORAGE = process.env.TEMPLATE_STORAGE_PATH || path.join(__dirname, '../../templates');

const CATEGORY_ORDER = ['CVP', 'EL', 'FM', 'GM', 'VMI', 'AB', 'PSC'];
const CATEGORY_NAMES = {
  CVP: '认知(语言/语前)',
  EL: '语言表达',
  FM: '小肌肉',
  GM: '大肌肉',
  VMI: '模仿(视觉/动作)',
  AB: '适应行为',
  PSC: '个人自理'
};

/** 将 major_category 归一化为短码，兼容 "PSC" 与 "个人自理(PSC)" 等格式 */
function normalizeMajorCategory(val) {
  if (!val || typeof val !== 'string') return null;
  const s = val.trim();
  if (CATEGORY_ORDER.includes(s)) return s;
  const m = s.match(/\(([A-Z]+)\)\s*$/);
  if (m && CATEGORY_ORDER.includes(m[1])) return m[1];
  return s;
}

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}年${m}月`;
}

function getMasterCell(sheet, row, col) {
  const merges = sheet._merges;
  if (merges && typeof merges === 'object') {
    for (const addr of Object.keys(merges)) {
      const range = merges[addr];
      if (range && row >= range.top && row <= range.bottom && col >= range.left && col <= range.right) {
        return { row: range.top, col: range.left };
      }
    }
  }
  const mergeRanges = sheet.model?.merges ?? sheet.model?.mergeCells ?? [];
  for (const m of mergeRanges) {
    const rangeStr = typeof m === 'string' ? m : (m.range ?? m.model?.dimensions ?? String(m));
    try {
      const d = colCache.decode(rangeStr);
      if (row >= d.top && row <= d.bottom && col >= d.left && col <= d.right) {
        return { row: d.top, col: d.left };
      }
    } catch (e) {
      /* ignore */
    }
  }
  return { row, col };
}

const IEP_START_ROW = 6;
const IEP_COL_DOMAIN = 1;
const IEP_COL_LONG_TERM = 2;
const IEP_COL_SHORT_TERM = 3;
const IEP_COL_COUNT = 7;

/** 深拷贝单元格样式，使插入/写入的单元格与模板一致 */
function copyCellStyle(sourceCell, targetCell) {
  if (!sourceCell || !targetCell) return;
  const s = sourceCell.style;
  if (!s) return;
  try {
    const cloned = {};
    if (s.font && typeof s.font === 'object') cloned.font = JSON.parse(JSON.stringify(s.font));
    if (s.alignment && typeof s.alignment === 'object') cloned.alignment = JSON.parse(JSON.stringify(s.alignment));
    if (s.border && typeof s.border === 'object') cloned.border = JSON.parse(JSON.stringify(s.border));
    if (s.fill && typeof s.fill === 'object') cloned.fill = JSON.parse(JSON.stringify(s.fill));
    if (s.numFmt != null) cloned.numFmt = s.numFmt;
    if (Object.keys(cloned).length) targetCell.style = cloned;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[assessments] copyCellStyle:', e.message);
  }
}

/** 替换 Excel 中的 {{studentName}} {{assessmentDate}} {{teacherName}} */
function renderExcelBasePlaceholders(sheet, data) {
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      let v = cell.value;
      if (v && typeof v === 'object' && v.richText) {
        v = v.richText.map((t) => t.text).join('');
      }
      let str = String(v ?? '');
      str = str.replace(/\{\{studentName\}\}/g, data.studentName)
        .replace(/\{\{assessmentDate\}\}/g, data.assessmentDate)
        .replace(/\{\{teacherName\}\}/g, data.teacherName);
      if (str !== (v != null ? String(v) : '')) {
        cell.value = str;
      }
    });
  });
}

/** 将第 6 行第 1-7 列的样式应用到指定行的 1-7 列 */
function applyRowStyle(sheet, row, refCells) {
  for (let col = 1; col <= IEP_COL_COUNT; col++) {
    copyCellStyle(refCells[col], sheet.getCell(row, col));
  }
}

/**
 * IEP 固定布局：短期目标分行插入，领域与长期目标合并单元格
 * 第 6 行起，第 1/2/3 列分别为领域、长期目标、短期目标
 * 每个领域若有 N 个短期目标则占 N 行，领域与长期目标列纵向合并
 * 以第 6 行第 1-7 列为参考样式，写入及新插入行均应用相同格式
 */
function renderIepDomainTable(sheet, domains) {
  const TEMPLATE_DOMAIN_ROWS = 7;
  const refRow = IEP_START_ROW;
  const refCells = {};
  for (let col = 1; col <= IEP_COL_COUNT; col++) {
    refCells[col] = sheet.getCell(refRow, col);
  }

  let totalRows = 0;
  domains.forEach((domain) => {
    totalRows += Math.max(1, domain.shortTermTargets.length);
  });
  if (totalRows > TEMPLATE_DOMAIN_ROWS) {
    for (let i = 0; i < totalRows - TEMPLATE_DOMAIN_ROWS; i++) {
      sheet.insertRow(IEP_START_ROW + TEMPLATE_DOMAIN_ROWS, []);
    }
  }

  let writeRow = IEP_START_ROW;
  domains.forEach((domain) => {
    const shortTerms = domain.shortTermTargets.map((t) =>
      t.number ? `${t.number} ${t.content}` : t.content
    );
    const rowCount = Math.max(1, shortTerms.length);
    const longTermText = domain.longTermTargets
      .map((t) => (t.number ? `${t.number} ${t.content}` : t.content))
      .join('\n');

    const startRow = writeRow;
    const endRow = writeRow + rowCount - 1;

    const cellDomain = sheet.getCell(startRow, IEP_COL_DOMAIN);
    const cellLongTerm = sheet.getCell(startRow, IEP_COL_LONG_TERM);
    cellDomain.value = domain.name;
    cellLongTerm.value = longTermText;

    for (let i = 0; i < rowCount; i++) {
      const cellShort = sheet.getCell(writeRow, IEP_COL_SHORT_TERM);
      cellShort.value = shortTerms[i] || '';
      applyRowStyle(sheet, writeRow, refCells);
      writeRow++;
    }

    if (rowCount > 1) {
      try {
        sheet.mergeCells(startRow, IEP_COL_DOMAIN, endRow, IEP_COL_DOMAIN);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[assessments] merge domain:', e.message);
      }
      try {
        sheet.mergeCells(startRow, IEP_COL_LONG_TERM, endRow, IEP_COL_LONG_TERM);
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.warn('[assessments] merge longTerm:', e.message);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[assessments] excel write domain=${domain.name} rows=${startRow}-${endRow} shortCount=${shortTerms.length}`);
    }
  });
}

function formatDateForDb(d) {
  const date = d instanceof Date ? d : new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 构建教案数据并渲染模板（generate 与 preview 共用）
 * @returns {{ buffer, tpl, student, assessmentDate, targetRows }}
 */
async function buildAssessmentData(req) {
  const { student_id, target_ids, template_id } = req.body;
  const teacherId = req.user.id;
  const teacherRole = req.user.role;

  if (!student_id || !target_ids || !Array.isArray(target_ids) || target_ids.length === 0) {
    throw new AppError('请提供 student_id 与 target_ids 数组', 400);
  }

  const [students] = await pool.execute(
    'SELECT id, name, teacher_id FROM students WHERE id = ? LIMIT 1',
    [student_id]
  );
  const student = students && students[0];
  if (!student) {
    throw new AppError('学生不存在', 404);
  }
  if (teacherRole === 'teacher' && Number(student.teacher_id) !== Number(teacherId)) {
    throw new AppError('无权为该学生生成教案', 403);
  }

  const [users] = await pool.execute(
    'SELECT id, username FROM users WHERE id = ? LIMIT 1',
    [teacherId]
  );
  const teacherName = users && users[0] ? (users[0].username || '') : '';

  const placeholders = target_ids.map(() => '?').join(',');
  const [targetRows] = await pool.execute(
    `SELECT id, major_category, sub_category, stage, target_type, content, target_number FROM teaching_targets WHERE id IN (${placeholders})`,
    target_ids
  );
  if (targetRows.length !== target_ids.length) {
    throw new AppError('部分目标 ID 无效', 400);
  }

  const assessmentDate = new Date();
  const targets = targetRows.map((t, i) => {
    const number = (t.target_number && String(t.target_number).trim()) || String(i + 1);
    return {
      majorCategory: t.major_category,
      stage: t.stage,
      content: t.content,
      number
    };
  });

  const domains = CATEGORY_ORDER.map((key) => ({
    name: `${CATEGORY_NAMES[key] || key}(${key})`,
    longTermTargets: targetRows
      .filter((t) => normalizeMajorCategory(t.major_category) === key && t.target_type === 'long_term')
      .map((t) => ({ number: (t.target_number && String(t.target_number).trim()) || '', content: t.content })),
    shortTermTargets: targetRows
      .filter((t) => normalizeMajorCategory(t.major_category) === key && t.target_type === 'short_term')
      .map((t) => ({ number: (t.target_number && String(t.target_number).trim()) || '', content: t.content }))
  }));

  const templateWhere = template_id
    ? 'id = ? AND status = ?'
    : "status = ? AND file_type = 'excel' ORDER BY id DESC LIMIT 1";
  const templateParams = template_id ? [template_id, 'enabled'] : ['enabled'];
  const [tplRows] = await pool.execute(
    `SELECT id, name, file_path, file_type FROM templates WHERE ${templateWhere}`,
    templateParams
  );
  const tpl = tplRows && tplRows[0];
  if (!tpl || !tpl.file_path) {
    throw new AppError('未找到可用模板', 400);
  }
  const templatePath = path.isAbsolute(tpl.file_path) ? tpl.file_path : path.join(TEMPLATE_STORAGE, tpl.file_path);
  if (!fs.existsSync(templatePath)) {
    throw new AppError('模板文件不存在: ' + templatePath, 500);
  }
  const actualExt = path.extname(templatePath).toLowerCase();
  let isWordTemplate;
  if (actualExt === '.docx' || actualExt === '.doc') {
    isWordTemplate = true;
  } else if (actualExt === '.xlsx' || actualExt === '.xls') {
    isWordTemplate = false;
  } else {
    isWordTemplate = tpl.file_type === 'word';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[assessments] template:', {
      template_id,
      tpl_id: tpl.id,
      tpl_name: tpl.name,
      tpl_file_type: tpl.file_type,
      templatePath,
      actualExt,
      isWordTemplate
    });
    console.log('[assessments] targetRows:', targetRows.map((t) => ({
      major_category: t.major_category,
      normalized: normalizeMajorCategory(t.major_category),
      target_type: t.target_type,
      target_number: t.target_number
    })));
    console.log('[assessments] domains:', domains.map((d) => ({
      name: d.name,
      longTermCount: d.longTermTargets.length,
      shortTermCount: d.shortTermTargets.length
    })));
  }

  const data = {
    studentName: student.name,
    assessmentDate: formatDate(assessmentDate),
    teacherName: teacherName,
    targets,
    domains
  };

  let buffer;
  if (isWordTemplate) {
    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
    buffer = doc.getZip().generate({ type: 'nodebuffer' });
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new AppError('Excel 模板无有效工作表', 500);
    }
    renderExcelBasePlaceholders(sheet, data);
    renderIepDomainTable(sheet, data.domains);
    buffer = await workbook.xlsx.writeBuffer();
  }

  return { buffer, tpl, student, assessmentDate, targetRows, isWordTemplate, teacherName };
}

const assessmentsController = {
  /**
   * 生成教案并下载 - POST /api/assessments/generate
   * Body: { student_id, target_ids: number[], template_id?: number }
   */
  async generate(req, res, next) {
    try {
      const { buffer, tpl, student, assessmentDate, targetRows, isWordTemplate, teacherName } = await buildAssessmentData(req);
      const { student_id, target_ids } = req.body;
      const teacherId = req.user.id;

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [insAss] = await conn.execute(
          'INSERT INTO assessments (student_id, teacher_id, assessment_date, status) VALUES (?, ?, ?, ?)',
          [student.id, teacherId, formatDateForDb(assessmentDate), 'active']
        );
        const assessmentId = insAss.insertId;
        for (const t of targetRows) {
          await conn.execute(
            'INSERT INTO assessment_details (assessment_id, target_id, score, major_category) VALUES (?, ?, ?, ?)',
            [assessmentId, t.id, 0, t.major_category]
          );
        }
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        console.error('[assessments/generate] DB error:', e.message, e.code, e.errno);
        throw e;
      } finally {
        conn.release();
      }

      const ext = isWordTemplate ? 'docx' : 'xlsx';
      const filenameRaw = [student.name, teacherName || '', formatDate(assessmentDate)].filter(Boolean).join('-') + `.${ext}`;
      const filenameEncoded = encodeURIComponent(filenameRaw);
      res.setHeader('Content-Type', isWordTemplate ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filenameEncoded}`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      next(error);
    }
  },

  /**
   * 教案预览 - POST /api/assessments/preview
   * 与 generate 相同入参，返回渲染后的 HTML（不落库）
   */
  async preview(req, res, next) {
    try {
      const { buffer, tpl, isWordTemplate } = await buildAssessmentData(req);
      let html = '';
      const type = isWordTemplate ? 'word' : 'excel';

      if (type === 'word') {
        const result = await mammoth.convertToHtml({ buffer });
        html = result.value || '';
      } else {
        const { sheets } = await excelToHtmlFromBuffer(buffer);
        const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        html = sheets.map((s) => `<div class="sheet-block"><h4>${escape(s.name)}</h4>${s.html}</div>`).join('');
      }

      res.json({ success: true, data: { type, html } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 历史教案列表（§4.3）教师仅自己的学生，家长仅自己孩子的；管理员可传 status 查看已作废/全部
   */
  async list(req, res, next) {
    try {
      const { student_id, status } = req.query;
      const userId = req.user.id;
      const role = req.user.role;

      let sql = `
        SELECT a.id, a.student_id, a.teacher_id, a.assessment_date, a.status, a.created_at,
               s.name AS student_name
        FROM assessments a
        JOIN students s ON s.id = a.student_id
        WHERE 1=1
      `;
      const params = [];
      if (role === 'teacher' || role === 'parent') {
        sql += " AND a.status = 'active'";
      } else if (role === 'admin' || role === 'super_admin') {
        if (status === 'void') {
          sql += " AND a.status = 'void'";
        } else if (status === 'all') {
          sql += " AND a.status IN ('active', 'void')";
        } else {
          sql += " AND a.status = 'active'";
        }
      } else {
        sql += " AND a.status = 'active'";
      }
      if (role === 'teacher') {
        sql += ' AND a.teacher_id = ?';
        params.push(userId);
      }
      if (role === 'parent') {
        sql += ' AND s.parent_id = ?';
        params.push(userId);
      }
      if (student_id) {
        sql += ' AND a.student_id = ?';
        params.push(student_id);
      }
      sql += ' ORDER BY a.assessment_date DESC, a.id DESC';

      const [rows] = await pool.execute(sql, params);
      const total_count = rows.length;
      const latest_date = rows.length > 0 ? rows[0].assessment_date : null;
      res.json({ success: true, data: { list: rows, total_count, latest_date } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 作废教案（软删除）- PUT /api/assessments/:id/void（§4.2、§4.3）
   */
  async void(req, res, next) {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const role = req.user.role;

      const [rows] = await pool.execute(
        'SELECT id, teacher_id, status FROM assessments WHERE id = ? LIMIT 1',
        [id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('教案不存在', 404);
      }
      if (rows[0].status === 'void') {
        throw new AppError('该教案已作废', 400);
      }
      if (role === 'teacher' && Number(rows[0].teacher_id) !== Number(teacherId)) {
        throw new AppError('无权作废此教案', 403);
      }

      await pool.execute("UPDATE assessments SET status = 'void' WHERE id = ?", [id]);
      res.json({ success: true, message: '已作废' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 物理删除教案 - DELETE /api/assessments/:id
   * 仅 super_admin、admin 可调用；仅可删除 status='void' 的记录；assessment_details 由 CASCADE 自动删除
   */
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const [rows] = await pool.execute(
        'SELECT id, status FROM assessments WHERE id = ? LIMIT 1',
        [id]
      );
      if (!rows || rows.length === 0) {
        throw new AppError('教案不存在', 404);
      }
      if (rows[0].status !== 'void') {
        throw new AppError('仅可删除已作废的教案', 400);
      }
      await pool.execute('DELETE FROM assessments WHERE id = ?', [id]);
      res.json({ success: true, message: '已删除' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = assessmentsController;
