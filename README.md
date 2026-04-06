# 乐星融合学校数字化教学管理系统

## 项目结构

```
.
├── web/                  # 网页前端（官网 + 管理后台 + 已弃用静态站备份）
│   ├── README.md         # web 目录说明
│   ├── website/          # 官网前端 (Vue 3 + Vite，原静态官网迁移)
│   │   ├── src/
│   │   │   ├── components/     # 首页各区块组件
│   │   │   ├── composables/    # 组合式函数（如 IntersectionObserver）
│   │   │   └── assets/         # 样式等静态资源
│   │   └── package.json
│   ├── admin/            # 管理后台前端
│   │   ├── src/
│   │   │   ├── api/            # API 请求模块
│   │   │   ├── router/         # Vue Router 配置
│   │   │   ├── stores/         # Pinia 状态管理
│   │   │   ├── types/          # TypeScript 类型定义
│   │   │   ├── views/          # 页面组件
│   │   │   ├── layouts/        # 布局组件
│   │   │   └── assets/         # 静态资源
│   │   └── package.json
│   └── legacy-static/    # [已弃用] 原根目录 index.html / style.css / script.js，现由 web/website 提供
├── server/               # 管理后台 API 服务
│   ├── src/
│   │   ├── app.js          # Express 应用配置
│   │   ├── server.js       # 服务启动入口
│   │   ├── config/         # 配置文件（数据库、JWT）
│   │   ├── middleware/     # 中间件（认证、错误处理）
│   │   ├── routes/         # API 路由
│   │   ├── controllers/    # 控制器
│   │   └── scripts/        # 工具脚本
│   ├── database/           # 数据库 Schema
│   └── package.json
├── src/storage/          # 数据库模型
│   └── database/
│       ├── shared/schema.ts    # 数据库 Schema 定义
│       └── supabase-client.ts  # Supabase 客户端
└── start.sh              # 启动脚本（Linux/macOS）
```

## 技术栈

### 官网 (`web/website/`)
- Vue 3 (Composition API) + TypeScript + Vite
- 响应式设计，保留原静态页的视觉与交互
- 滚动进入动画（IntersectionObserver）、横向滚动、资讯滑块、咨询表单等

### 管理后台 - 后端
- Node.js + Express.js
- **MySQL**（项目说明书 §6，mysql2 驱动）
- JWT 认证，密码 bcrypt（§5.1、§8）
- 文件上传：本地或 NAS 目录存储
- 四级权限控制（RBAC，§2）

### 管理后台 - 前端
- Vue 3 (Composition API)
- Vue Router 4
- Pinia 状态管理
- Element Plus UI 组件库
- WangEditor 5 富文本编辑器
- TypeScript

## 快速开始

### 环境要求
- Node.js 18+
- pnpm

### 环境变量配置

*现已不通过 Coze 平台部署，请在本机或 NAS 环境自行配置以下变量：*

| 变量名 | 说明 |
|--------|------|
| `MYSQL_HOST` | MySQL 主机（如 192.168.5.2） |
| `MYSQL_PORT` | MySQL 端口（默认 3306） |
| `MYSQL_USER` | MySQL 用户名 |
| `MYSQL_PASSWORD` | MySQL 密码 |
| `MYSQL_DATABASE` | 数据库名（必填） |
| `JWT_SECRET` | JWT 密钥（生产环境必设） |
| `UPLOAD_DIR` | 可选。上传文件存储目录（默认 `server/uploads`） |
| `TEMPLATE_STORAGE_PATH` | 可选。教案模板存储目录（第三阶段，默认 `server/templates`；NAS 可设为 `/SATA存储11/web/teaching/templates`） |
| `API_BASE_URL` | 可选。API 公网地址（如 `https://lexingronghe.com`） |

### 安装依赖

```bash
# 后端
cd server && pnpm install

# 官网
cd web/website && pnpm install

# 管理后台
cd web/admin && pnpm install
```

### 初始化数据库（项目说明书 §6.3）

1. 在 MySQL 中创建数据库后，执行建表脚本：
   ```bash
   mysql -h 192.168.5.2 -u root -p your_database < server/database/schema-mysql.sql
   ```
2. 执行第五阶段索引（§4.4.3 D1）：
   ```bash
   mysql -h 192.168.5.2 -u root -p your_database < server/database/schema-mysql-indexes.sql
   ```
3. 插入超级管理员账号（§6.3：admin / Zzx1998.）：
   ```bash
   cd server && MYSQL_DATABASE=your_database pnpm run seed-mysql
   ```
   （可设置 MYSQL_HOST、MYSQL_USER、MYSQL_PASSWORD 等环境变量）

### 第五阶段：联调测试与交付（§4.4）

- **索引**：建表后执行 `server/database/schema-mysql-indexes.sql`（见上）。
- **Docker 部署**：`deploy/docker/docker-compose.yml`（backend + Nginx；MySQL 使用已有实例时在 `deploy/docker/.env` 配置连接），详见 `deploy/docker/.env.example` 与 `deploy/极空间-Docker-Nginx-部署清单.md`。
- **备份**：使用 `server/scripts/backup-mysql.sh`，配置 crontab 定时执行（如每日 02:00）。
- **越权测试与部署步骤**：见 `docs/phase5-越权与部署说明.md`。

### 启动服务

**本机试运行（推荐先看）**：从数据库初始化到三个服务启动的完整步骤见 **[试运行指南（docs/试运行指南.md）](docs/试运行指南.md)**（含 Windows 与常见问题）。

```bash
# 使用启动脚本（Linux/macOS；脚本内含日志路径，本机试运行建议用下方「分别启动」）
bash start.sh

# 或分别启动（三个终端）
cd server && pnpm dev       # 后端 API: http://localhost:3001
cd web/admin && pnpm dev    # 管理后台: http://localhost:5001
cd web/website && pnpm dev  # 官网: 一般为 http://localhost:5000（见 web/website/vite.config.ts）
```

## 权限体系

| 角色 | 权限说明 |
|------|----------|
| super_admin | 超级管理员，拥有所有权限 |
| admin | 管理员，可管理用户和内容 |
| teacher | 教师，可发布和管理文章 |
| parent | 家长，查看权限 |

## API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册（需认证）
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理
- `GET /api/users` - 获取用户列表
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户

### 文章管理
- `GET /api/articles` - 获取文章列表
- `POST /api/articles` - 创建文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章

### 首页配置
- `GET /api/homepage/config` - 获取首页配置
- `PUT /api/homepage/config/:key` - 更新配置

### 文件上传
- `POST /api/upload` - 上传文件
- `POST /api/upload/image` - 上传图片
- `GET /api/upload/files` - 获取文件列表
- `DELETE /api/upload/:key` - 删除文件

## 开发进度

- [x] 官网开发（已完成）
- [x] 后端 API 框架搭建
- [x] JWT 认证与权限中间件
- [x] 用户管理接口
- [x] 文章管理接口
- [x] 首页配置接口
- [x] 文件上传接口
- [x] 前端框架搭建
- [x] 登录页面
- [x] 后台管理布局
- [x] 账号管理页面
- [x] 文章管理页面（含富文本编辑）
- [x] 首页配置页面
- [x] 图片上传功能
- [x] 部署配置

## License

MIT
