# parse-script-board.js（Coze 代码节点 · 纯 JavaScript）

将 **autism-video-scriptwriter** 产出的 Markdown 剧本解析为结构化镜头数据。

## 使用方式（Coze）

1. 打开 **代码** 节点，语言选 **JavaScript**。
2. 将 **`parse-script-board.js` 全文**粘贴到编辑器（或仅粘贴从文件开头到 `module.exports` 之前的全部函数 + `main`；若 Coze 禁止 `module.exports` 块，可去掉文件末尾 **「本地 Node 测试」** 那 4 行）。
3. 输入变量绑定为 **`params.input`**，或在上游把 Markdown 文本传入 `input`。
4. 返回值：`scenes`、`voiceovers`、`subtitles`、`image_prompts`、`video_prompts`、`durations`（与 `SKILL.md` 约定一致）。

## 入口签名

```javascript
async function main({ params }) {
  var input = (params && params.input) || "";
  // ...
}
```

## 支持的输入格式

- **新版**：Markdown 主表 `| 画面 | 时间段 | 口播文案 | …` + 可选「即梦 · 按镜展开」表 + 统一风格前缀「见下」合并。
- **旧版**：`#### 画面` 分块 + `**口播文案**：` + 两个 ``` 代码块。

## 本地验证（可选）

```bash
cd scripts
node -e "require('./parse-script-board.js').main({params:{input:require('fs').readFileSync('../output/呼名训练-版本B-分镜剧本.md','utf8')}}).then(console.log)"
```

## 相关文档

- [../.cursor/skills/autism-video-scriptwriter/references/output-format.md](../.cursor/skills/autism-video-scriptwriter/references/output-format.md)
