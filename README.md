# 张弛个人作品集网站

React + Vite 结构的基础版本，内容来自简历 `张弛简历.docx`。

## 当前机器预览

当前环境没有 npm，可使用内置静态预览入口：

```bash
node server.mjs
```

打开：

```text
http://localhost:5173/preview.html
```

## 公网部署

要让 iPhone、Mac、Windows、不同地点和不同网络都能打开，需要部署到公网静态托管平台，例如 Vercel、Netlify、Cloudflare Pages 或 GitHub Pages。

本项目已支持静态部署，上传整个 `portfolio-site` 目录即可。部署完成后使用平台提供的 `https://...` 公网地址访问。

已内置：

- `manifest.webmanifest`
- `service-worker.js`
- `vercel.json`
- `netlify.toml`
- PWA 离线缓存

说明：离线缓存只能保证用户至少访问过一次后，在网络较差或短暂断网时仍尽量可打开。完全没有网络且从未访问过该网址，任何网站都无法首次打开。

## 标准 Vite 运行

在有 npm 的本机环境中：

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址即可。

## 文件结构

- `src/App.jsx`：页面内容与组件
- `src/styles.css`：暗色视觉系统与响应式布局
- `index.html`：标准 Vite 入口
- `preview.html`：无 npm 环境下的临时预览入口
