# 乐星融合学校 - 官网

由原静态官网（现备份于 `web/legacy-static/` 的 `index.html` + `style.css` + `script.js`）迁移至 Vue 3，保留原有设计与交互。

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Vite 5

## 开发

**若访问 http://localhost:5000 出现连接被拒绝 (ERR_CONNECTION_REFUSED / -102)，请先安装依赖并启动服务：**

```bash
# 在仓库根目录：
cd web/website
npm install    # 或 pnpm install
npm run dev    # 或 pnpm dev
```

**Windows 用户**：可在 `web/website` 目录下双击 `start-dev.bat`，会自动安装依赖（若未安装）并启动开发服务。

启动成功后浏览器打开：http://localhost:5000

## 构建

```bash
pnpm build
pnpm preview  # 预览生产构建
```

## 结构说明

- `src/components/` - 首页各区块（Hero、核心理念、设施、为什么选择我们、资讯、家长感受、社交矩阵、咨询表单、页脚、悬浮按钮）
- `src/composables/useIntersectionObserver.ts` - 滚动进入视口时添加 class，用于动画
- `src/data/news.ts` - 公告/资讯数据
- `src/assets/styles/main.css` - 全局样式（由原 `style.css` 迁移）
