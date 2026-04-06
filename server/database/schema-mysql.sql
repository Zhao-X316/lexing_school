-- =============================================
-- 数字化教学管理与展示系统 - MySQL 建表脚本
-- 严格依据 项目说明书.md §6.2 执行顺序
-- 数据库：MySQL 8.0+ | 字符集：utf8mb4 | 引擎：InnoDB
-- =============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- （1）用户与权限表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号(手机号或工号)',
    password_hash VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    role ENUM('super_admin', 'admin', 'teacher', 'parent') NOT NULL COMMENT '四级权限角色',
    status ENUM('active', 'frozen') DEFAULT 'active' COMMENT '账号状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '账号创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户与角色权限表';

-- （2）学生档案与课时表
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '学生姓名',
    parent_id INT COMMENT '关联家长账号ID',
    teacher_id INT COMMENT '关联主负责教师账号ID(用于数据隔离)',
    total_hours INT DEFAULT 0 COMMENT '总购买课时',
    used_hours INT DEFAULT 0 COMMENT '已消耗课时',
    remaining_hours INT DEFAULT 0 COMMENT '剩余可用课时',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生基本信息与课务表';

-- （3）四级教学标签与目标库
CREATE TABLE IF NOT EXISTS teaching_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    major_category VARCHAR(50) NOT NULL COMMENT '一级：大类，取值见§5.4(7大类)：CVP/EL/FM/GM/VMI/AB/PSC',
    sub_category VARCHAR(50) NOT NULL COMMENT '二级：小类(如：平衡能力)',
    stage INT NOT NULL COMMENT '三级：阶段(如：1, 2, 3)',
    target_type ENUM('long_term', 'short_term') NOT NULL COMMENT '四级：长短期目标',
    content TEXT NOT NULL COMMENT '具体的训练目标内容',
    target_number VARCHAR(50) DEFAULT NULL COMMENT '目标编号：长期编号或短期编号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='四级联动评估目标库';

-- （4）评估与教案主表
CREATE TABLE IF NOT EXISTS assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT '被评估学生ID',
    teacher_id INT NOT NULL COMMENT '执行评估教师ID',
    assessment_date DATE NOT NULL COMMENT '评估日期(用于生成历史折线图时间轴)',
    status ENUM('active', 'void') DEFAULT 'active' COMMENT '状态：生效或作废(软删除机制)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='历次教案与评估记录主表';

-- （5）评估得分明细表
CREATE TABLE IF NOT EXISTS assessment_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id INT NOT NULL COMMENT '关联教案主表ID',
    target_id INT NULL COMMENT '关联训练目标ID，清空目标库时置空',
    score INT DEFAULT 0 COMMENT '该项得分(用于图表数据聚合计分)',
    major_category VARCHAR(50) DEFAULT NULL COMMENT '目标大类快照，用于清空目标库后图表仍可展示',
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES teaching_targets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='单次评估勾选的目标明细与得分';

-- （6）活动宣传文章表（第二阶段 CMS）
CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '文章/活动标题',
    content LONGTEXT NOT NULL COMMENT '富文本HTML内容',
    status ENUM('draft', 'published', 'pending_review', 'rejected') DEFAULT 'draft' COMMENT '草稿/已发布/待审核/已驳回',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动宣传页富文本内容表';

-- （7）教案模板库表（第三阶段）
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    file_path VARCHAR(500) NOT NULL COMMENT 'NAS中模板文件绝对路径',
    file_type ENUM('excel', 'word') NOT NULL COMMENT '模板类型',
    scenario VARCHAR(100) COMMENT '适用场景(可选)',
    status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '启用状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教案Excel/Word模板库';

-- （8）首页配置表（轮播图与视频链接）
CREATE TABLE IF NOT EXISTS homepage_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(50) NOT NULL UNIQUE COMMENT '配置键(如: banner_1_url, video_main_url)',
    config_value VARCHAR(500) NOT NULL COMMENT '配置值(图片或视频URL)',
    remark VARCHAR(100) COMMENT '备注',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='官网首页轮播图与视频链接配置';
