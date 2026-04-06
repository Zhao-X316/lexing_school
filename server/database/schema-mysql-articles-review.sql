-- 活动宣传审核流程（§12.2.2）：为 articles.status 增加 pending_review、rejected
-- 执行前请确认已存在 articles 表；可与 schema-mysql.sql 新建库一起使用时无需单独执行（新 schema 已含四态）

ALTER TABLE articles
  MODIFY COLUMN status ENUM('draft', 'published', 'pending_review', 'rejected') DEFAULT 'draft'
  COMMENT '草稿/已发布/待审核/已驳回';
