# 用法：复制为 deploy-nas.ps1，填写下面变量，在仓库根目录执行: .\scripts\deploy-nas.ps1
$ErrorActionPreference = "Stop"
$NasUser = "root"
$NasHost = "192.168.1.100"
# SSH 下真实路径（文件管理器的 /SATA存储11/... 在终端里常不存在）；用户 ID 以你 NAS 为准
$NasRemotePath = "/data_s002/data/udata/real/18106781808/web/Docker/lexing_school/deploy/docker/html/admin"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location (Join-Path $Root "web\admin")
pnpm install
pnpm build
Push-Location (Join-Path $Root "web\admin\dist")
try {
  scp -r * "${NasUser}@${NasHost}:${NasRemotePath}/"
} finally {
  Pop-Location
}
