-- =============================================
-- 第五阶段 §4.4.3 D1：高频查询索引
-- 执行时机：建表完成后执行本脚本（仅执行一次，重复执行会报“索引已存在”可忽略）
-- 用途：图表与列表查询毫秒级响应
-- =============================================

-- assessments：按学生、状态、教师筛选
CREATE INDEX idx_assessments_student_status ON assessments(student_id, status);
CREATE INDEX idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX idx_assessments_date ON assessments(assessment_date DESC);

-- assessment_details：按评估聚合
CREATE INDEX idx_assessment_details_assessment_id ON assessment_details(assessment_id);
CREATE INDEX idx_assessment_details_target_id ON assessment_details(target_id);

-- students：按教师、家长隔离
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_students_parent_id ON students(parent_id);

-- users：按角色筛选（可选）
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
