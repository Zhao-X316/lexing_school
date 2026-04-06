# 乐星融合学校项目 - 全量代码审查（不含数据库）

> 审查范围：website（官网）、admin（管理后台）、server（API 及中间件）。已排除 database schema / 建表脚本。

---

## 一、Server 后端

### 1.1 优点

- **结构清晰**：`app.js` 只做中间件与路由挂载，`server.js` 负责启动与环境检查，职责分明。
- **错误处理统一**：`errorHandler`、`notFoundHandler`、`AppError`、`asyncHandler` 使用一致，便于维护。
- **权限设计合理**：`auth.js` 中 JWT 校验 + 角色中间件 + 超管专属，层级清楚。
- **JWT 配置**：过期时间可配置，验证失败返回 `null` 不抛错，便于上层处理。

### 1.2 已修复问题

| 问题 | 位置 | 修复说明 |
|------|------|----------|
| **修改密码接口** | `userController.changePassword` | `PUT /api/auth/password` 无 `req.params.id`，已改为 `id = req.params.id \|\| req.user.id`。 |
| **GET /users/:id 错误** | `userRoutes` | 原用 `getCurrentUser`（只看当前用户），已改为 `getUserById`，并新增控制器方法，按 `id` 查用户且需管理员角色。 |
| **express-validator 未生效** | `authRoutes` | 仅挂了 `body()` 校验，未处理 `validationResult`。已增加 `validateRequest` 中间件并在登录/注册/改密路由中使用。 |
| **上传存储方式** | `uploadController` | 已改为本地/NAS 目录存储（`UPLOAD_DIR`），不再依赖 Coze 对象存储与 `coze-coding-dev-sdk`。 |

### 1.3 建议改进（未改代码）

- **生产环境 JWT**：`jwt.js` 中 `JWT_SECRET` 默认值仅适合开发；生产应强制要求配置并启动时校验。
- **CORS**：`origin: '*'` 适合开发；生产建议改为具体前端域名列表。
- **请求体大小**：`10mb` 较大，若仅需 JSON/表单，可考虑下调并单独为上传路由放大。
- **日志**：可引入轻量日志库，按环境区分格式与级别，避免仅用 `console.log`。
- **uploadController**：已改为本地/NAS 存储，无需 S3/Coze 环境变量；生产部署时建议设置 `UPLOAD_DIR` 指向持久化目录。

---

## 二、Admin 管理后台

### 2.1 优点

- **请求封装**：`request.ts` 统一 baseURL、超时、Authorization、业务错误与 401 跳转，结构清楚。
- **路由与权限**：`router` 中 `requiresAuth`、`roles` 与守卫配合，未登录跳登录、无权限跳 dashboard，逻辑清晰。
- **状态持久化**：`user` store 的 token/user 存 localStorage，并实现 `restoreFromStorage`，刷新不丢登录态。
- **登录页**：表单校验、loading、错误由拦截器处理，流程完整。

### 2.2 潜在问题与建议

- **401 跳转方式**：`request.ts` 用 `window.location.href = '/login'`，会整页刷新。若希望 SPA 内跳转，可改为 `router.push('/login')`（需在封装处拿到 router 实例或通过事件/全局状态触发）。
- **auth.changePassword**：前端调用 `PUT /users/${userId}/password`；后端同时支持 `PUT /auth/password`（当前用户）。若产品上“个人改密”只用 `/auth/password`，前端可增加“个人设置-修改密码”入口并只调 `/auth/password`，避免传 userId。
- **Login 重定向**：`route.query.redirect` 未做白名单校验，若被篡改可能打开后台内任意路径；建议只允许跳转至后台已知路由。

---

## 三、Website 官网

### 3.1 优点

- **组件拆分**：首屏、核心理念、设施、为什么选择我们、资讯、家长感受、社交、咨询、页脚、悬浮 CTA 独立组件，便于维护。
- **复用逻辑**：`useIntersectionObserver` / `useIntersectionObserverMulti` 统一处理“进入视口加 class”，代码简洁。
- **样式迁移**：全局样式集中在 `main.css`，保留原设计，未引入多余依赖。
- **资讯数据**：`news.ts` 独立，后续可改为接口拉取。

### 3.2 已修复问题

| 问题 | 位置 | 修复说明 |
|------|------|----------|
| **mouseleave 监听泄漏** | `NewsSection.vue` | 原用匿名函数 `() => { if (isDragging) touchEnd() }` 注册，`onUnmounted` 却用 `touchEnd` 移除，导致无法移除监听。已改为具名函数 `onMouseLeave`，添加与移除同一引用。 |

### 3.3 建议改进（未改代码）

- **WhyChooseUsSection**：`updateHorizontalScroll` 依赖 `containerRef`/`trackRef`，在 `onMounted` 时已可用；若将来在 SSR 或异步挂载场景，可加空值判断或 `nextTick`。
- **GlobalCta**：`transitionend` 只监听 `transform`，若 CSS 中动画属性变更，需同步；当前逻辑与现有样式一致即可。
- **ConsultationSection**：提交后仍为前端 `setTimeout` + `alert`，未真正发请求；后续可接后端接口并做 loading/成功提示。
- **无障碍**：部分按钮/链接仅有 `aria-label`，可对焦点顺序、键盘操作再补强；官网若需 SEO，可考虑服务端渲染或首屏关键内容直出。

---

## 四、安全与规范小结

- **敏感信息**：JWT 密钥、S3 密钥等应从环境变量读取，且生产环境禁止默认值（已按此修复上传密钥与 auth 相关逻辑）。
- **权限**：接口侧已按角色做中间件校验；前端路由守卫仅做体验优化，不能替代服务端校验。
- **输入校验**：登录/注册/改密已通过 express-validator + `validateRequest` 做服务端校验；其他写接口若有复杂 body，建议同样加校验与白名单。
- **XSS**：官网与后台多为 Vue 绑定与静态内容，风险较低；若后续有富文本或 `v-html`，需做过滤或 CSP。

---

## 五、修复项汇总

本次审查中已实施的代码修改：

1. **server**
   - `userController.changePassword`：支持 `PUT /api/auth/password`（无 `id` 时用 `req.user.id`）。
   - `userController.getUserById`：新增，供 `GET /api/users/:id` 使用。
   - `userRoutes`：`GET /:id` 改为调用 `getUserById` 并加管理员角色校验。
   - `errorHandler.js`：新增 `validateRequest`，在认证路由中使用。
   - `authRoutes.js`：登录、注册、修改密码路由增加 `validateRequest`。
   - `uploadController.js`：S3 的 accessKey、secretKey、region 改为环境变量配置。

2. **website**
   - `NewsSection.vue`：`mouseleave` 使用具名函数 `onMouseLeave`，确保 `onUnmounted` 能正确移除监听。

以上为本次全量代码审查（除数据库外）的结论与已做修改说明。
