/**
 * 图表数据 API - 项目说明书 §4.3、§5.4
 * 雷达图：单次评估 7 大类聚合；折线图：该学生历次评估（仅 status=active）
 * 7 大类顺序：CVP, EL, FM, GM, VMI, AB, PSC（§5.4）
 */
const { pool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

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
const MAX_SCORE = 5;

function ensureStudentAccess(role, userId, student) {
  if (role === 'teacher' && Number(student.teacher_id) !== Number(userId)) {
    throw new AppError('无权查看该学生数据', 403);
  }
  if (role === 'parent' && Number(student.parent_id) !== Number(userId)) {
    throw new AppError('无权查看该学生数据', 403);
  }
}

const chartsController = {
  /**
   * 雷达图数据 - GET /api/students/:id/charts/radar?assessment_id=xxx
   * 返回 §5.4 格式：{ indicator: [{ name, max }], values: [] }
   */
  async radar(req, res, next) {
    try {
      const studentId = req.params.id;
      const assessmentId = req.query.assessment_id;
      const role = req.user.role;
      const userId = req.user.id;

      const [students] = await pool.execute(
        'SELECT id, name, teacher_id, parent_id FROM students WHERE id = ? LIMIT 1',
        [studentId]
      );
      if (!students || students.length === 0) {
        throw new AppError('学生不存在', 404);
      }
      ensureStudentAccess(role, userId, students[0]);

      let effectiveAssessmentId = assessmentId;
      if (!effectiveAssessmentId) {
        const [latest] = await pool.execute(
          'SELECT id FROM assessments WHERE student_id = ? AND status = ? ORDER BY assessment_date DESC, id DESC LIMIT 1',
          [studentId, 'active']
        );
        effectiveAssessmentId = latest && latest[0] ? latest[0].id : null;
      }
      if (!effectiveAssessmentId) {
        const indicator = CATEGORY_ORDER.map((key) => ({ name: CATEGORY_NAMES[key] || key, max: MAX_SCORE }));
        return res.json({ success: true, data: { indicator, values: CATEGORY_ORDER.map(() => 0) } });
      }

      const [rows] = await pool.execute(
        `SELECT COALESCE(ad.major_category, tt.major_category) AS major_category, AVG(ad.score) AS avg_score
         FROM assessment_details ad
         LEFT JOIN teaching_targets tt ON tt.id = ad.target_id
         WHERE ad.assessment_id = ?
         GROUP BY COALESCE(ad.major_category, tt.major_category)`,
        [effectiveAssessmentId]
      );

      const byCategory = {};
      rows.forEach((r) => {
        byCategory[r.major_category] = Math.min(MAX_SCORE, Math.round(Number(r.avg_score) * 10) / 10);
      });

      const indicator = CATEGORY_ORDER.map((key) => ({
        name: CATEGORY_NAMES[key] || key,
        max: MAX_SCORE
      }));
      const values = CATEGORY_ORDER.map((key) => byCategory[key] ?? 0);

      res.json({ success: true, data: { indicator, values } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 折线图数据 - GET /api/students/:id/charts/trend
   * 返回历次评估（仅 active）时间轴 + 综合得分
   */
  async trend(req, res, next) {
    try {
      const studentId = req.params.id;
      const role = req.user.role;
      const userId = req.user.id;

      const [students] = await pool.execute(
        'SELECT id, name, teacher_id, parent_id FROM students WHERE id = ? LIMIT 1',
        [studentId]
      );
      if (!students || students.length === 0) {
        throw new AppError('学生不存在', 404);
      }
      ensureStudentAccess(role, userId, students[0]);

      const [rows] = await pool.execute(
        `SELECT a.id, a.assessment_date, a.created_at,
                (SELECT COALESCE(AVG(ad.score), 0) FROM assessment_details ad WHERE ad.assessment_id = a.id) AS avg_score
         FROM assessments a
         WHERE a.student_id = ? AND a.status = 'active'
         ORDER BY a.assessment_date ASC, a.id ASC`,
        [studentId]
      );

      const dates = rows.map((r) => r.assessment_date ? String(r.assessment_date) : '');
      const scores = rows.map((r) => Math.round(Number(r.avg_score || 0) * 100) / 100);

      res.json({
        success: true,
        data: {
          dates,
          scores,
          list: rows.map((r) => ({
            assessment_id: r.id,
            assessment_date: r.assessment_date,
            score: Math.round(Number(r.avg_score || 0) * 100) / 100
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = chartsController;
