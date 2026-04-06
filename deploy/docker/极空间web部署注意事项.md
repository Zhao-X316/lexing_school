# 极空间 Web 部署注意事项（乐星 / Docker）

本文记录 **NAS（极空间）上 Docker 部署** 的正确路径、要点与常见错误。编排文件为 **`deploy/docker/docker-compose.yml`**（**backend + Nginx**；**MySQL 使用已有实例**）。

---

## 1. 路径：文件管理器 ≠ SSH

| 场景 | 说明 |
|------|------|
| 极空间**文件管理器**里常见 `SATA存储11/web/...` | 便于拷贝文件 |
| **SSH / 终端** 里往往**没有**同一路径 | 真实路径形如 `/data_s001` 或 `/data_s002/.../udata/real/<用户ID>/web/...` |
| 自查 | `sudo find /data_s001 /data_s002 -maxdepth 15 -name "docker-compose.yml"`（避开 `.recycle`） |

**注意**：`server` 与 `deploy/docker` 可能**不在同一存储池**（例如一个在 `data_s001`，一个在 `data_s002`），`build.context` 的绝对路径需分别核对。

---

## 2. 目录与唯一编排

- **唯一编排**：`deploy/docker/docker-compose.yml`（**不要**与项目根目录另一份 compose 混用）。
- **环境变量**：复制 `deploy/docker/.env.example` 为 **`deploy/docker/.env`**（与 `docker-compose.yml` **同级**）。
- **前端静态资源**：本机 `web/admin` 执行 `pnpm build`，将 **`dist/` 内容** 拷到 **`deploy/docker/html/admin/`**（与 `index.html` 同级），再 **重建 Nginx 镜像**。

---

## 3. `docker-compose.yml` 必对项

1. **`build.context`**  
   极空间从 **`/zspace/.../compose_config/`** 解析 compose 时，**相对路径**（如 `./server`）不可靠。  
   应使用 **SSH 下真实绝对路径**（本仓库示例为示例用户 ID，请按你 NAS 实际路径替换）。

2. **`env_file`**  
   相对路径 **`env_file: .env`** 在 ZDocker 下**经常找不到**，容器内 **`JWT_SECRET` 为空** → 后端反复崩溃。  
   **修正**：改为 **`deploy/docker/.env` 的绝对路径**，例如：  
   `/data_s002/data/udata/real/<用户ID>/web/Docker/lexing_school/deploy/docker/.env`

3. **勿**再用 **`JWT_SECRET: ${JWT_SECRET:-}`** 等占满 `environment` 的**空串**覆盖 `.env`；保留 **`env_file` + 少量 `environment`**（如 `NODE_ENV`）即可。

4. **端口**：宿主机 **80** 常被占用 → 当前映射 **`8888:80`**（可按需改）。

5. **基础镜像**：国内直连 Docker Hub 易超时 → **`server/Dockerfile`、`Dockerfile.nginx`** 的 **`FROM`** 可使用镜像站（如 **`docker.1panel.live/library/...`**）。

6. **Nginx 默认 Welcome 页**  
   - **`Dockerfile.nginx`** 中删除 **`/etc/nginx/templates/*.template`**，避免启动时覆盖 **`default.conf`**。  
   - **`RUN rm`** 默认 `html` 后再 **`COPY html/admin/`**；更新静态文件后建议 **`docker build --no-cache`** 再启容器。

---

## 4. 极空间 ZDocker 占位文件

若解析 compose 失败并提示缺少 `.env`，可能需在以下路径**创建空文件**（`sudo mkdir -p` + `sudo touch`），以实际报错为准：

- `/zspace/applications/services/zdocker/.env`
- `/zspace/applications/services/zdocker/config/compose_config/.env`

---

## 5. SSH 命令差异

| 现象 | 处理 |
|------|------|
| `docker compose` 不存在 | 试 **`docker-compose`**（带连字符）；或**只用极空间 Docker 图形界面** |
| `permission denied`（`docker.sock`） | 命令前加 **`sudo`** |
| 误敲 **`ssh ssh ...`** | 只保留 **`ssh -p 端口 用户@IP`** |

---

## 6. MySQL 与 CORS（`.env`）

| 方式 | `MYSQL_HOST` |
|------|----------------|
| MySQL 容器已映射宿主机端口（如 3306） | **`host.docker.internal`**（compose 已为 backend 配 **`extra_hosts`**） |
| 与 backend **同一 Docker 自定义网络** | **MySQL 容器名** |
| 库在其它机器 | **局域网 IP** |

**`CORS_ORIGIN`**：必须与浏览器地址栏一致（**协议 + IP/域名 + 端口**），例如 `http://极空间IP:8888`。  
**多域名**（官网 `www` + 管理端 `admin` 等）：见 **§10**，在 `.env` 中用**英文逗号**分隔多个 `https://...`（后端已支持）。

**`.env` 中 `#` 注释**：若密钥含 `#`，须用**双引号**包住（见 `.env.example` 中 `JWT_SECRET` 说明）。

---

## 7. 常见错误速查

| 错误 / 现象 | 原因 | 处理 |
|-------------|------|------|
| `docker: 'compose' is not a docker command` | 无 Compose V2 插件 | 用 **`docker-compose`** 或图形界面 |
| `registry-1.docker.io` 超时 | 国内访问 Hub 困难 | 镜像站 **`FROM`** 或系统镜像加速 |
| `dockerfile: 2B` / 找不到 Dockerfile | **`server` 目录不完整** 或路径错 | 同步完整 **`server`** + **`Dockerfile`** |
| `Permission denied` 写 Dockerfile | 目录属主为 root | **`sudo tee`** 或文件管理器上传 |
| `package.json` 找不到 | 只拷了部分 `server` | 补全 **`package.json`、`pnpm-lock.yaml`、`src/`** |
| 界面有文件，SSH 没有 | **SATA 路径与 data_s 路径不是同一处** | 用 **`find`** 确认真实路径 |
| `address already in use :80` | 80 被占用 | 改为 **`8888:80`** 等 |
| 浏览器仍 **Welcome to nginx** | 镜像层旧 / 模板覆盖 / 未拷 **admin dist** | 模板删除、**`--no-cache` 构建**、确认 **`html/admin`** |
| **`JWT_SECRET` 必须设置** | `.env` 未进容器 | **`env_file` 绝对路径** + 重建 backend |
| `.env` 里 `#` 截断密钥 | **`#` 在 .env 中为注释** | 密钥加**引号**或不用 `#` |
| `parsing failed` 缺 `.env` | ZDocker 固定路径无文件 | **`mkdir` + `touch`** 占位 |
| 界面卡在 **Starting** | 界面未刷新 | **`docker ps`** 已为 **Up** 即可；或查端口占用 |
| `Could not resolve hostname ssh` | 命令写成 **`ssh ssh`** | 只保留一个 **`ssh`** |

---

## 8. 部署后自检

- **`http://NAS_IP:8888/health`** → JSON **`status":"ok"`**、`environment":"production"` 即后端正常。
- 若执行过种子脚本，默认管理员账号见 **`server/src/scripts/seed-mysql.js`** 与项目 README（如 **`admin` / `Zzx1998.`**）；密码以数据库哈希为准。

---

## 9. 日常维护

- 修改 **`deploy/docker/.env`** 或 **`docker-compose.yml`** 后：同步到 NAS 并**重建/重启**对应容器。
- 仅更新前端静态资源：同步 **`html/admin`** 后**重建 Nginx 镜像**。
- **公网访问**时同步 **`CORS_ORIGIN`**、路由器端口转发与 **HTTPS** 配置。
- 定期备份 **`deploy/docker/.env`**（勿提交 Git）与 MySQL；极空间或 ZDocker 升级后若 **`env_file` 行为**变化，需再核对一次。

---

## 10. 动静分离：云放静态，API 经 Tailscale 回 NAS（www 官网 + admin 管理端）

目标：**HTML/JS/CSS/图片** 在云 CDN/云机就近下发；**API** 仍由云 Nginx **反代到 NAS**（`http://<NAS-Tailscale-IP>:8888`，与现有 Docker Nginx 一致），延迟对管理端交互通常可接受。

### 10.1 域名分工

| 域名 | 用途 |
|------|------|
| **`https://www.lexingronghe.com`** | 网站首页（`web/website` 构建产物） |
| **`https://admin.lexingronghe.com`** | 管理门户（`web/admin` 构建产物） |
| **`lexingronghe.com`（裸域）** | 建议 **301 重定向** 到 `https://www.lexingronghe.com`，避免与 `www` 重复收录 |

### 10.2 DNS（均指向云服务器公网 IP）

- **`www`** → A 记录 → 云 IP  
- **`admin`** → A 记录 → 云 IP  
- **`@`（裸域）** → A 记录 → 云 IP（仅用于做跳转，可不托管业务）

### 10.3 云上构建与目录示例

- 官网：`web/website` → `pnpm build` → 同步 `dist/` 到如 `/var/www/www.lexingronghe.com/`  
- 管理端：`web/admin` → `pnpm build`，**`VITE_API_BASE_URL` 使用默认 `/api`**（请求发往 `https://admin.lexingronghe.com/api/...`）  
- 官网内「进入管理后台」等链接指向 **`https://admin.lexingronghe.com/login`**（按实际路由调整）

### 10.4 云 Nginx（两个 `server`，共用上游）

- `upstream nas_entry { server <NAS-Tailscale-IP>:8888; }`  
- **`server_name www.lexingronghe.com`**：`root` 指官网静态；`location /api/`、`/uploads/`、`/health` → `proxy_pass` 到 `nas_entry`（路径与现有一致），并带 `X-Forwarded-Proto` 等头。  
- **`server_name admin.lexingronghe.com`**：`root` 指管理端 `dist`，`try_files` 适配 SPA；同样反代 `/api/`、`/uploads/`、`/health`。  
- **裸域** `server_name lexingronghe.com`：`return 301 https://www.lexingronghe.com$request_uri;`（**HTTP 与 HTTPS 均需**，避免裸域证书访问无跳转）。  
- **HTTPS**：证书在云申请后，配置 **`listen 443 ssl http2`** 与 `ssl_certificate` / `ssl_certificate_key`；建议 **`client_max_body_size 20m`** 等与上传一致。  
- 参考模板：**`deploy/cloud/nginx.lexingronghe.com.conf.example`**（仅 80）；本机 HTTPS 见 **`nginx.lexingronghe.com.https.conf.example`**

### 10.5 NAS 上 `CORS_ORIGIN`

在 **`deploy/docker/.env`** 中写（**一行**，英文逗号分隔）：

```env
CORS_ORIGIN=https://www.lexingronghe.com,https://admin.lexingronghe.com
```

修改后 **重启 backend 容器**。若仅内网调试，可临时保留内网地址并与公网域名并列（按实际需要）。

### 10.6 NAS 是否还打包静态进镜像

采用本节后，公网用户**不再依赖** NAS 上的 Nginx 静态页；NAS 仍可保留 **`html/admin`** 便于内网直连 `8888` 调试，或后续再从 compose 中精简，按运维习惯即可。

### 10.7 模板 Excel HTML 预览缓存（后端）

- **磁盘**：`TEMPLATE_STORAGE_PATH/cache/<id>.json`，上传 Excel 成功后 **异步预热**；源文件 **mtime 变化** 后缓存失效，下次预览会重算。  
- **内存**：同一 `template_id` 短时缓存（默认 **15 分钟**，`PREVIEW_HTML_MEMORY_TTL_MS`）；条数上限 **`PREVIEW_HTML_MEMORY_MAX_ENTRIES`**（默认 200，超出淘汰最早过期项）、后台 **`PREVIEW_HTML_MEMORY_SWEEP_MS`** 清理过期项（默认 5 分钟，设为 0 则仅写入时淘汰）。同一 id 并发预览 **单飞**，避免重复解析 Excel。  
- **Redis**：当前未接入；多实例时可改为共享 Redis（需扩展 `server/src/utils/templatePreviewCache.js`）。  
- 模板 **更新 / 删除** 会 **清除** 对应缓存。
