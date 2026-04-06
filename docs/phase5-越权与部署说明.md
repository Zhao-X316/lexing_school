# 第五阶段执行说明（§4.4）

## 一、索引（§4.4.3 D1）

建表完成后在 MySQL 中执行（请将 `your_database` 替换为实际数据库名，如 `lexing_school`）：

```bash
mysql -h 192.168.5.2 -u root -p your_database < server/database/schema-mysql-indexes.sql
```

若报「索引已存在」可忽略（说明已执行过）。

---

## 二、越权测试（§4.4.1）

### 2.1 垂直越权（需先取得各角色 Token）

以下用 `$ADMIN_TOKEN`、`$TEACHER_TOKEN`、`$PARENT_TOKEN` 替换为实际登录后返回的 token。

- **教师调管理员接口（预期 403）**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/users/create \
    -H "Authorization: Bearer $TEACHER_TOKEN" -H "Content-Type: application/json" \
    -d '{"username":"test","password":"123456","role":"parent"}'
  ```
- **家长调生成教案（预期 403）**
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/assessments/generate \
    -H "Authorization: Bearer $PARENT_TOKEN" -H "Content-Type: application/json" \
    -d '{"student_id":1,"target_ids":[1,2]}'
  ```

### 2.2 水平越权

- 教师 A 的 Token 请求「教师 B 负责的学生」详情或图表，应返回 403 或空。
- 家长 A 的 Token 请求「家长 B 的孩子」详情，应返回 403。

---

## 三、Docker 部署（§4.4.3 C1/C2）

### 3.1 首次启动

1. **MySQL** 已在极空间 Docker 或其它环境就绪；在 **`deploy/docker/`** 执行 `cp .env.example .env`，填写 **`MYSQL_*`、`JWT_SECRET`** 等（见 **`.env.example`** 中 A/B/C）。
2. 若库未建表，在能连上 MySQL 的机器上执行（将 `your_database` 换成实际库名）：
   ```bash
   mysql -h ... -P 3306 -u root -p your_database < server/database/schema-mysql.sql
   mysql -h ... -P 3306 -u root -p your_database < server/database/schema-mysql-indexes.sql
   cd server && MYSQL_HOST=... MYSQL_DATABASE=your_database pnpm run seed-mysql
   ```
3. 启动 **backend + Nginx**：
   ```bash
   cd deploy/docker
   docker compose up -d
   ```

### 3.2 说明

生产编排**仅**使用 **`deploy/docker/docker-compose.yml`**（**不含** MySQL 服务；数据库使用已有实例）。

---

## 四、备份（§4.4.3 B1）

- 脚本：`server/scripts/backup-mysql.sh`
- 环境变量：`BACKUP_DIR`、`MYSQL_HOST`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`
- 定时示例（crontab -e）：
  ```text
  0 2 * * * BACKUP_DIR=/path/to/backups MYSQL_DATABASE=lexing_school /path/to/backup-mysql.sh
  ```

---

## 五、前端 Gzip（§4.4.3 F1）

生产环境由 Nginx（或其它 Web 服务器）开启 Gzip 即可；若需构建时生成 .gz，可安装 `vite-plugin-compression` 并在 `vite.config.ts` 中配置。
