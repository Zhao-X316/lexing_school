#!/bin/bash
# 第五阶段 §4.4.3 B1 - MySQL 全量备份
# 建议 NAS 定时任务（如每日 02:00）：0 2 * * * /path/to/backup-mysql.sh
# 需配置：MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, BACKUP_DIR
# 若不设 MYSQL_PASSWORD，将依赖 MySQL 客户端默认配置（如 ~/.my.cnf）；cron 下建议显式配置。

set -e
BACKUP_DIR="${BACKUP_DIR:-/SATA存储11/web/backups/mysql}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_DATABASE="${MYSQL_DATABASE:-lexing_school}"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_DIR}/lexing_${MYSQL_DATABASE}_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR" || { echo "Cannot create BACKUP_DIR: $BACKUP_DIR"; exit 1; }
export MYSQL_PWD="$MYSQL_PASSWORD"
if ! mysqldump -h"$MYSQL_HOST" -u"$MYSQL_USER" --single-transaction --routines "$MYSQL_DATABASE" | gzip > "$FILE"; then
  unset MYSQL_PWD
  echo "Backup failed: mysqldump or gzip error" >&2
  exit 1
fi
unset MYSQL_PWD
echo "Backup done: $FILE"
