# 极空间 NAS：Docker + Nginx 同域部署（可执行清单）

本仓库已包含 **`deploy/docker/`** 下的 Compose、Nginx 与 **`server/Dockerfile`**。按下面顺序做即可在同一入口下提供：**`/` 管理端静态页**、**`/api` 后端**、**`/uploads` 上传文件**（与 `server/src/app.js` 一致）。

**文档关系**：本文件为**可执行清单**；极空间路径坑位、`env_file` 绝对路径、ZDocker 占位、常见错误速查等见 **`deploy/docker/极空间web部署注意事项.md`**（建议两处对照阅读）。

**公网两种常见形态**：（1）**全栈在 NAS**：路由器把端口转到极空间，域名指向家宽公网 IP；（2）**动静分离（推荐）**：**官网 `www` + 管理端 `admin` 的 HTML/JS/CSS 在云**，**API 经云 Nginx 反代到 NAS**（如云与 NAS 之间用 **Tailscale**）。详见下文 **§十**。

---

## 一、仓库里新增/要用的路径（对照表）

### 极空间：文件管理器路径 ≠ SSH 路径

- **文件管理器**里常见 **`/SATA存储11/web/...`**，便于你拖拽、同步文件。
- **SSH / 终端**里该路径**往往不存在**；真实路径形如 **`/data_s00x/data/udata/real/<用户ID>/web/Docker/lexing_school/...`**（`s001` / `s002` 取决于存储池，项目可能迁移）。在 NAS 上可用：`sudo find /data_s001 /data_s002 -maxdepth 15 -name "docker-compose.yml"` 确认（勿用回收站 `.recycle` 下的结果）。
- **`docker-compose.yml`** 里 **`build.context`** 已按 **SSH 可见的真实绝对路径** 编写（见仓库内文件）；若你本机用户 ID 不同，请改其中的 **`18106781808`** 段。

| 路径 | 作用 |
|------|------|
| `server/Dockerfile` | 构建后端镜像 |
| `server/.dockerignore` | 减小构建上下文 |
| `deploy/docker/docker-compose.yml` | 唯一编排：backend + Nginx（MySQL 另用已有容器/宿主机库，见 `.env`） |
| `deploy/docker/nginx/default.conf` | 同域反代配置 |
| `deploy/docker/.env.example` | 变量模板；**复制为同目录 `.env`**：`cp .env.example .env` 后编辑；或在极空间里为 backend 配同名环境变量 |
| `deploy/docker/html/admin/` | **必须放入 admin 前端构建产物**（见下文） |

---

## 二、在你电脑上：构建管理端（admin）

在项目根目录执行（需已安装 pnpm）：

```bash
cd web/admin
pnpm install
pnpm build
```

构建成功后生成 **`web/admin/dist/`** 目录（内有 `index.html` 与 `assets/`）。

**生产环境 API 地址**：仓库里已有 `web/admin/.env.production`，其中 `VITE_API_BASE_URL=/api`，与同域 Nginx 一致，**无需改**。

**动静分离（§十）**：官网 `web/website` 同样执行 `pnpm build`，`dist/` **部署到云**；管理端 `dist/` **部署到云**；仅内网调试或全栈在 NAS 时，仍按下文把 admin 的 `dist` 拷到 **`deploy/docker/html/admin/`**。

---

## 三、把文件放到 NAS 上的位置

任选其一：

1. **整个 `projects` 仓库**拷到极空间（文件管理器示例：`/SATA存储11/web/Docker/lexing_school/`；**SSH 上**请用你查到的真实路径（以 `find` 为准）。**可能出现** `server` 在 `data_s001`、`deploy/docker` 在 `data_s002` 等情况，此时 **`docker-compose.yml` 里两处 `build.context` 需分别写对**，保证存在：
   - `deploy/docker/`（含 `docker-compose.yml`、`nginx/default.conf`、`html/admin/`）
   - `server/`（含 `Dockerfile`）

2. 或只拷 **`server`** + **`deploy/docker`** 最小集合（仍需保留 `deploy/docker` 与 `server` 的目录关系；当前 compose 使用 **绝对路径** `build.context`，需与 NAS 上实际落盘路径一致）。

---

## 四、放入前端静态文件（关键一步）

把本机 **`web/admin/dist/` 里的全部内容**（不是 dist 文件夹本身）复制到 NAS 上：

```
deploy/docker/html/admin/
```

复制完成后，`admin` 目录下应直接能看到 **`index.html`**，例如：

```
deploy/docker/html/admin/index.html
deploy/docker/html/admin/assets/...
```

---

## 五、配置环境变量

**`deploy/docker/docker-compose.yml`** 中 **backend** 使用 **`env_file: .env`**。**不自带 MySQL 容器**；若库已在极空间 **Docker** 里或其它机器上，在 **`.env`** 里配置 **`MYSQL_HOST` / `MYSQL_PORT`**（见 **`.env.example`** 中 A/B/C）。

1. 在 **`deploy/docker/`** 执行 `cp .env.example .env`，再编辑 **`.env`**。  
   **`docker-compose.yml`** 中 **`env_file`** 已写为 **`deploy/docker/.env` 的 SSH 绝对路径**（极空间从 `compose_config` 解析时相对路径 `.env` 会失效）；若你的存储池或用户 ID 不同，请改该路径。
2. **或** 在极空间 Docker 界面为 **backend** 添加与 `.env.example` 同名的变量。

至少修改：

- **`JWT_SECRET`**：长随机字符串（见 `server/src/config/jwt.js`）；含 **`#`** 时请用引号包起来。
- **`MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`**：与**已有** MySQL 实例一致。
- **`CORS_ORIGIN`**：须与浏览器实际访问来源一致（**协议 + 域名 + 端口**），**不要用 `*`**。
  - **仅内网访问 NAS**：例如 `http://极空间内网IP:8888`（与 `docker-compose.yml` 中宿主机端口一致）。
  - **动静分离（官网 `www` + 管理端 `admin`）**：**一行**内用**英文逗号**分隔多个 HTTPS 来源，例如：  
    `CORS_ORIGIN=https://www.lexingronghe.com,https://admin.lexingronghe.com`  
    （后端 `server/src/app.js` 已支持多域名；解析后若为空列表会回退为通配并打日志，生产环境请避免误配。）

**`UPLOAD_DIR`**：Compose 已把卷挂到容器内 `/app/uploads`，保持示例中的 `UPLOAD_DIR=/app/uploads` 即可（与卷一致）。

---

## 五.1、极空间 ZDocker 与「目录结构」说明

### 是否「只能」用固定目录？

**不一定。** 报错里出现的 `/zspace/applications/services/zdocker/` 是极空间 Docker 里**常见的一种工作路径**，不同机型/版本可能不同；**并非**说系统只能在这一层放文件。

真正限制来自 **`docker-compose.yml` 里的 `build.context`**：必须指向 NAS 上**真实存在**的 **`server`** 与 **`deploy/docker`** 目录。当前仓库为兼容极空间 ZDocker，使用 **SSH 可见的绝对路径**（见 `docker-compose.yml` 内注释），不再依赖「在 `deploy/docker` 下相对路径 `../../server`」。

### 本仓库在 NAS 上的实际目录结构（SSH 路径示例）

项目根与 compose 位置如下（**`server` 与 `deploy` 同级**）：

```text
…/lexing_school/   ← 项目根（`server` 与 `deploy` 可能在同一 data_s00x 下，也可能跨 s001/s002，以 find 为准）
├── server/                          ← 后端源码 + Dockerfile（必须存在）
│   ├── Dockerfile
│   └── src/...
└── deploy/
    └── docker/                      ← docker-compose.yml 所在目录，在此执行 compose
        ├── docker-compose.yml
        ├── nginx/default.conf
        ├── html/admin/              ← index.html 与 assets（构建 nginx 镜像时 COPY 进镜像）
        ├── .env.example
        └── .env                     ← 复制 .env.example 后填写
```

在 **SSH 终端**里应是：

```text
cd /data_s002/data/udata/real/18106781808/web/Docker/lexing_school/deploy/docker
sudo docker compose build && sudo docker compose up -d
```

若 `build.context` 与上述目录不一致，请编辑 **`docker-compose.yml`** 中两处 **`context:`**，使其指向本机 **`server`** 与 **`deploy/docker`** 的绝对路径。

### 若极空间界面把「项目」指向了别的路径怎么办？

- **做法 A（推荐）**：把整个 **`lexing_school`**（项目根）复制/同步到 NAS，路径与上表一致后，再进入 **`deploy/docker`** 用 compose 启动。
- **做法 B**：若界面**只能**把堆栈放在**某个固定目录**且该目录**不是** `…/deploy/docker`，则需要把 **`server`、`deploy/docker` 下各子目录** 按相对关系摆到该目录能解析到的位置；若仍无法满足 `../../server`，**再考虑**改 `build.context` 或改用「已构建镜像」等方案——**改仓库前请与你确认**。

### 环境变量

在 **`deploy/docker`** 放置 **`.env`**（从 `.env.example` 复制），或在界面为 **backend** 填写与 `.env.example` 同名的变量。

---

## 六、路由器与极空间端口

- **本仓库 `docker-compose.yml` 默认**：宿主机 **`8888`** → 容器 Nginx **`80`**（`"8888:80"`），因极空间上 **80** 常被占用。
- **全栈在 NAS、要从公网访问**：将路由器 **80/443**（或你映射的高位端口）转发到极空间 **内网 IP 的 8888**（或你改成的主机端口）。
- **动静分离**：公网用户**不打** NAS 端口；云服务器 **443** 终止 HTTPS，再通过 **Tailscale** 访问 NAS 上 `http://<NAS-Tailscale-IP>:8888`（见 **§十**）。

---

## 七、启动

在 **`deploy/docker/`** 目录（SSH 真实路径，见上文）：

```bash
sudo docker compose build --no-cache
sudo docker compose up -d
```

查看日志：

```bash
sudo docker compose logs -f
```

---

## 八、验证

1. 浏览器访问：`http://极空间内网IP:8888/`（默认映射）应出现管理端登录页。
2. `http://极空间内网IP:8888/health` 应返回 JSON（后端健康检查）。
3. **公网全栈在 NAS**：域名与 **`CORS_ORIGIN`**、浏览器地址栏三者一致（含 `https` 与端口）。
4. **动静分离**：分别验证 `https://www.lexingronghe.com` 与 `https://admin.lexingronghe.com`；NAS 上 **`CORS_ORIGIN`** 已含上述两个域名（见 **§十**）。

---

## 九、HTTPS

### 9.1 证书在 NAS 上（全栈自建）

1. 申请证书（Let’s Encrypt 或 NAS 证书中心）后，将 **fullchain** / **privkey** 放到例如 `deploy/docker/nginx/ssl/`。
2. 编辑 **`deploy/docker/nginx/default.conf`** 增加 `listen 443 ssl` 与证书路径；在 **`docker-compose.yml`** 中映射 **443** 与 ssl 目录（按你实际改法）。
3. 将 **`CORS_ORIGIN`** 改为与浏览器一致的 `https://域名`（含端口则写端口）。

### 9.2 证书在云服务器上（动静分离，推荐对外）

域名 **A 记录指向云 IP**，证书在云（Let’s Encrypt / 云厂商等）；NAS 侧可继续 **HTTP**（`8888`），由云 Nginx **反代**到 `http://<NAS-Tailscale-IP>:8888`。

- **仅 `listen 80`**（HTTP，或由 CDN/其它层做 HTTPS）：**`deploy/cloud/nginx.lexingronghe.com.conf.example`**。  
- **本机终止 HTTPS（443）**：**`deploy/cloud/nginx.lexingronghe.com.https.conf.example`**，并配置 **`ssl_certificate`** 路径（见 **`deploy/cloud/证书路径说明.md`**），再 **`nginx -t`** 与 **`reload`**。

详见 **§十**。

---

## 十、动静分离：`www` 官网 + `admin` 管理端（云静态，API 回 NAS）

目标：**HTML/JS/CSS/图片** 在云机/CDN 就近加载；**API** 仍由 **云 Nginx** 转发到 NAS 现有入口（与 **`deploy/docker/nginx/default.conf`** 同路径：`/api`、`/uploads`、`/health`）。云与 NAS 建议用 **Tailscale** 打通（云与极空间各装 Tailscale，同一 tailnet）。

| 域名 | 用途 |
|------|------|
| **`https://www.lexingronghe.com`** | 网站首页（`web/website` → `pnpm build` → `dist/` 部署到云） |
| **`https://admin.lexingronghe.com`** | 管理门户（`web/admin` → `pnpm build` → `dist/` 部署到云） |
| **`lexingronghe.com`（裸域）** | 建议 **301** 到 `https://www.lexingronghe.com` |

**DNS**：`www`、`admin` 的 **A 记录** 指向**云服务器公网 IP**；裸域按需解析到云用于跳转。

**云 Nginx 要点**：

- `upstream nas_entry { server <NAS-Tailscale-IP>:8888; }`（端口与 NAS 上 compose 一致）。
- **HTTPS**：`listen 443 ssl http2`，证书路径与已申请证书一致；**HTTP 80** 统一 **301** 到 **HTTPS**；**裸域** `lexingronghe.com` 在 **80 与 443** 均 **301** 到 `https://www.lexingronghe.com`。
- **`server_name www.lexingronghe.com`**：`root` 指官网静态；`location ~ ^/(api|uploads|health)` → `proxy_pass http://nas_entry`，并设置 `Host`、`X-Forwarded-For`、`X-Forwarded-Proto`。
- **`server_name admin.lexingronghe.com`**：`root` 指管理端 `dist`，`try_files` 适配 SPA；同样反代 `/api`、`/uploads`、`/health`。
- **`client_max_body_size`**（如 **20m**）与上传/后端限制对齐，避免 **413**。
- 可直接以 **`deploy/cloud/nginx.lexingronghe.com.conf.example`**（仅 80）或 **`.https.conf.example`**（80+443）为模板，改 IP、（若用 HTTPS）证书路径、`root` 后上线。
- 管理端构建保持 **`VITE_API_BASE_URL=/api`**（默认即可），浏览器将请求发到 **当前域名** 下的 `/api`，由云反代到 NAS。

**NAS 上 `deploy/docker/.env`**：

```env
CORS_ORIGIN=https://www.lexingronghe.com,https://admin.lexingronghe.com
```

修改后 **重启 backend 容器**。官网内「进入管理后台」链接应指向 **`https://admin.lexingronghe.com/login`**（按路由调整）。

**说明**：采用本节后，公网用户**不依赖** NAS 上的 Nginx 静态页；NAS 仍保留 **`html/admin`** 便于内网 `http://NAS:8888` 调试。更细的步骤见 **`deploy/docker/极空间web部署注意事项.md` §10**。

---

## 十.1、仅 NAS 同域时与 `web/website` 的关系

当前 **`deploy/docker`** 默认把 **管理端（`web/admin`）** 挂在 **`/`**。若**不**做动静分离、仍要在同一 NAS 上托管官网，需自行扩展 Nginx（多 `location` / 子路径或子域），超出本清单默认范围。

---

## 十一、故障排查

| 现象 | 检查 |
|------|------|
| 502 Bad Gateway | `docker compose ps` 看 backend 是否 Up；`docker compose logs backend` |
| 页面空白 | `html/admin/` 下是否有 `index.html`；是否误把 `dist` 文件夹整体拷入导致多一层目录 |
| 接口跨域 | `.env` 中 **`CORS_ORIGIN`** 是否包含当前访问来源；多域名是否用**英文逗号**分隔、无多余空格截断 |
| 云反代 502 | 云能否 `curl http://<NAS-Tailscale-IP>:8888/health`；Tailscale 是否同 tailnet；NAS 上 compose 是否 Up |
| 上传 413 / HTTPS 报错 | 云 Nginx **`client_max_body_size`**；**`ssl_certificate` 路径**与域名/SAN 是否与 `server_name` 一致；`nginx -t` |
| 数据库连不上 | `MYSQL_HOST`：本机 MySQL 用 `host.docker.internal`；防火墙是否放行 3306 |
| `invalid volume path: /zspace/.../nginx/default.conf` | 在极空间 Docker 里把**项目目录**选为 **`deploy/docker` 的 SSH 真实路径**（例如 **`.../lexing_school/deploy/docker`**，且含 `nginx/`、`html/admin/`），不要用仅含单文件的 `zdocker` 目录；**不要用**仅在文件管理器里可见的 **`/SATA存储11/...` 作为 SSH 路径 |
| `invalid volume path: .../nginx` 或 `.../default.conf`（SATA 仍报错） | ZDocker 对主机卷校验很严。**Nginx 已改为 `Dockerfile.nginx` 构建镜像**（无主机卷），配置与 `html/admin` 在构建时 `COPY` 进镜像；更新前端或 Nginx 配置后需执行 **`docker compose build nginx`** 或 **`docker compose up -d --build`** |
| `undefined volume ${NGINX_CONF_PATH}` | 极空间解析器易把 `${...}` 当成具名卷。**Nginx 已用 `Dockerfile.nginx` 构建**，勿在卷映射里用环境变量拼路径；确保**项目目录**指向 **`deploy/docker` 的 SSH 真实路径** |

---

## 十二、代码依据（便于你对照）

- 前端 Axios `baseURL`：`web/admin/src/api/request.ts` → 默认 **`/api`**
- 上传 `fetch`：`web/admin/src/api/upload.ts` → **`/api/upload`**
- 后端挂载：`server/src/app.js` → **`/api`**、`/uploads`、`/health`

按上述清单执行后，即为「同域：根路径管理端 + `/api` + `/uploads`」的完整链路。**若采用 §十 动静分离**，公网静态走云，NAS 仍仅承担后端与数据库，链路以云 Nginx → Tailscale → NAS 为准。

---

## 十三、一条命令更新管理端前端（脚本模板）

仓库内提供脚本模板，填好 NAS 地址与远程目录后，日常更新只需**一条命令**（本机构建并同步 `dist` 到 `deploy/docker/html/admin/`）。

| 文件 | 适用环境 |
|------|----------|
| `scripts/deploy-nas.example.sh` | macOS / Linux / WSL / NAS 上（需 `pnpm`、`rsync`、SSH） |
| `scripts/deploy-nas.example.ps1` | Windows（需 `pnpm`、**OpenSSH 客户端** 自带的 `scp`） |

**步骤：**

1. 复制模板：`deploy-nas.example.sh` → `deploy-nas.sh`（或 `.ps1` → `deploy-nas.ps1`）。
2. 编辑脚本内 **`NAS_USER` / `NAS_HOST` / `NAS_REMOTE_PATH`**（与你在 NAS 上实际放置的 `deploy/docker/html/admin` 路径一致）。
3. Bash：`chmod +x scripts/deploy-nas.sh`，在**仓库根目录**执行 `./scripts/deploy-nas.sh`。  
4. PowerShell：在仓库根目录执行 `.\scripts\deploy-nas.ps1`。

脚本会执行：`web/admin` 目录下 `pnpm install`、`pnpm build`，再把 **`dist/` 内全部文件**同步到 NAS 上对应目录（`rsync --delete` 或 `scp`）。  
当前 **Nginx 使用 `Dockerfile.nginx`**，静态页在**构建镜像时** `COPY` 进容器，因此同步到 `html/admin` 后，须在 NAS 的 **`deploy/docker`** 下执行 **`docker compose build nginx && docker compose up -d`**（或 **`docker compose up -d --build`**）才会在浏览器里生效。若仅改了后端，可只重建 **backend** 或整体 **`--build`**。
