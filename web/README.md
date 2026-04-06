# 网页前端（Web）

本目录集中存放**官网**与**管理后台**前端代码，以及已弃用的**根目录静态官网**备份。

## 目录说明

| 路径 | 说明 |
|------|------|
| `website/` | 乐星融合学校官网（Vue 3 + Vite + TypeScript） |
| `admin/` | 管理后台（Vue 3 + Element Plus + TypeScript） |
| `legacy-static/` | 原静态官网入口，已弃用。内容已迁移至 `website/src`，仅作历史参考 |

## 开发命令（在仓库根目录）

```bash
pnpm dev:website   # 或 cd web/website && pnpm dev
pnpm dev:admin     # 或 cd web/admin && pnpm dev
```

## 根目录 `package.json` 脚本

`npm run dev` / `dev:website` / `dev:admin` 已指向 `web/website` 与 `web/admin`。

## 若迁移后仍出现空的 `admin/` 文件夹

从旧路径移动目录时，若 IDE 或终端占用该文件夹，可能留下无法删除的空目录。请**关闭占用该路径的窗口**后，在仓库根目录手动删除多余的 `admin` 文件夹即可；实际代码在 **`web/admin/`**。
