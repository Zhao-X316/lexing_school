#!/usr/bin/env bash
# 用法：复制为 deploy-nas.sh，填写 NAS_* 三行，chmod +x deploy-nas.sh，在仓库根目录执行 ./scripts/deploy-nas.sh
set -euo pipefail
NAS_USER="root"
NAS_HOST="192.168.1.100"
# SSH 下真实路径（文件管理器的 /SATA存储11/... 在终端里常不存在）；用户 ID 以你 NAS 为准
NAS_REMOTE_PATH="/data_s002/data/udata/real/18106781808/web/Docker/lexing_school/deploy/docker/html/admin"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/web/admin"
pnpm install
pnpm build
rsync -av --delete "$ROOT/web/admin/dist/" "${NAS_USER}@${NAS_HOST}:${NAS_REMOTE_PATH}/"
