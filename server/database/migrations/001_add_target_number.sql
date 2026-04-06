-- 目标编号字段 - 依据 docs/模板浏览与目标编号改造计划.md §4.1
-- 长期目标：target_number = Excel 中的长期编号
-- 短期目标：target_number = Excel 中的短期编号
ALTER TABLE teaching_targets ADD COLUMN target_number VARCHAR(50) DEFAULT NULL COMMENT '目标编号：长期编号或短期编号';
