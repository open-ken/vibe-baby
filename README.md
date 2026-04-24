# VibeBaby

一个个人使用的静态宝宝摄影 Prompt 工作台，用本地模板和人话参数生成结构化 Prompt JSON。

## 当前能力

- 上传一张宝宝参考照并在本地预览
- 从 `templates/` 读取 8 个摄影模板
- 调整像本人程度、画面氛围、背景复杂度、道具丰富度、输出比例和张数
- 根据宝宝月龄提示模板是否适配
- 提示参考照缺失对身份保留的影响
- 生成可直接粘贴给 GPT 的完整提示词，内含结构化 Prompt JSON
- 使用 `localStorage` 保存最近一次配置

## 本地运行

因为页面会用 `fetch()` 读取本地 JSON 模板，建议从项目目录启动一个静态服务：

```bash
python -m http.server 8000
```

然后在浏览器打开：

```text
http://localhost:8000/studio.html
```

如果当前机器没有 Python，也可以使用任意静态文件服务，只要能访问 `studio.html` 和 `templates/*.json` 即可。

## 部署到 Vercel

推荐通过 Vercel 控制台部署：

1. 把本仓库推送到 GitHub。
2. 在 Vercel 新建 Project，导入该 GitHub 仓库。
3. Framework Preset 选择 `Other`。
4. Build Command 留空。
5. Output Directory 留空。
6. 点击 Deploy。

项目根目录已有 `vercel.json`，访问部署域名根路径时会自动打开 `studio.html`。

也可以使用 Vercel CLI：

```bash
npm i -g vercel
vercel
vercel --prod
```

## 文件结构

```text
.
|-- studio.html
|-- index.html
|-- styles.css
|-- app.js
|-- app-core.js
|-- package.json
|-- vercel.json
|-- templates/
|   |-- index.json
|   `-- *.json
`-- tests/
    `-- app-core.test.js
```

## 测试

核心 Prompt 逻辑使用 Node 和 `assert`，无需安装依赖：

```bash
node tests/app-core.test.js
```

或运行完整检查：

```bash
npm run check
```

## 设计原则

- 保持纯 HTML/CSS/JS，不引入框架和构建工具
- 模板内容尽量放在 JSON，避免把模板行为写死在 JS
- UI 只暴露人能理解的创作参数
- Prompt 输出保留宝宝身份、安全姿态和年龄适配约束

## 使用流程

1. 打开 `studio.html`。
2. 上传宝宝参考照。
3. 选择模板并调整参数。
4. 点击“复制给 GPT”。
5. 到 GPT 对话中粘贴并发送，同时确保宝宝参考照也已上传。

复制内容会包含完整指令和 Prompt JSON。如果 GPT 没有收到宝宝照片，它应只回复：

```text
请上传您的宝宝的照片即可生成。
```
