# LUCAS LAB ✳

**Code · Create · Imagine**

一個以暗黑科技與奇幻宇宙為設計語言的個人創作網站，包含工具入口、故事、遊戲概念、軟體作品集、AI 藝廊與開發日誌。

## 啟動

需要 Node.js 22+；**不需要 npm install，也不需要任何外部 AI API Key**。

```bash
npm run check
npm start
```

瀏覽 `http://localhost:4173`。

## 正式網站：Cloudflare Workers

網址：[https://lucas-lab.owl3918.workers.dev/](https://lucas-lab.owl3918.workers.dev/)

本站以 **Cloudflare Workers Static Assets** 為唯一正式部署平台，GitHub Pages 不再使用。

- GitHub `main` 更新：GitHub Actions 執行 `npm run check`，不執行 Pages 部署。
- Cloudflare 已連接 GitHub 的情況下，正式部署由 **Cloudflare Workers Builds / Git integration** 處理，避免第二套部署權限與 token。
- Worker 設定在 `wrangler.jsonc`：`name: lucas-lab`、`assets.directory: ./dist`，使用 SSG 分頁路由及 404 頁。
- Cloudflare 建置指令：`npm run build`（驗證需求較高可改 `npm run check`）。
- Cloudflare 部署指令：`npx wrangler deploy`。
- 建置結果預設使用 Cloudflare 網址產生 canonical、Open Graph 與 sitemap；未來改正式自訂網域時可用 `SITE_URL` 覆寫。
- 在 Cloudflare Dashboard 檢查 Worker 的 Git 來源、分支與 Build/Deploy 設定；此儲存庫無法代替 Cloudflare 控制台確認部署結果。

本機預覽：

```bash
npm run check
npm start
```

## 架構

```text
assets/              CSS 設計系統和無框架互動功能
data/catalog.json    所有公開作品的清單與章節示範
scripts/build.cjs    產生 dist/ 下的靜態 HTML 網站
scripts/check.cjs    驗證連結、頁面與響應式斷點
scripts/serve.cjs    本機純 Node 靜態預覽伺服器
.github/workflows/   GitHub CI 檢查（Cloudflare 負責部署）
docs/                內容與技術規範
```

## Lucas Tools 整合

所有工具卡片均連結至 [Lucas Tools 原站](https://lucas-tools.owl3918.workers.dev/)，不複製、不嵌入、不遷移原程式碼。工具清單只收錄人工確認可公開的入口。

## 內容與版權

- 「霧林來信」是用於閱讀器的本站原創示範短篇（兩章）。
- 黑暗童話的正文尚未自 ChatGPT 劇本專案匯入，現在只提供待匯入的內容頁。
- 遊戲與電商概念仍在規劃階段。
- 藝廊目前採 CSS/符號佔位，尚未匯入正式插畫。
- 未明確授權的第三方作品、素材不得直接公開。

詳細設計與後續計畫參見 [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)。

## 目前的實作取捨

先前曾規劃 Astro + Vue，但第一版選擇無依賴靜態生成，以優先完成高品質響應式體驗與可部署網站。日後有更複雜內容管理和互動需求時，再引入框架。

## 正式部署驗證

`npm run check` 僅驗證原始碼與靜態輸出，**不能取代 Cloudflare 上線驗證**。

- `npm run smoke:live` 唯讀檢查正式網站的主要路由、CSS、sitemap 與 `/_build.json`。
- `EXPECTED_COMMIT=$(git rev-parse HEAD) npm run smoke:live` 額外要求 Cloudflare 部署版本與指定 Git Commit 一致。
- GitHub Actions 每日約在台灣時間 10:23 檢查正式網站，也可透過 `workflow_dispatch` 手動執行。GitHub 排程可能延遲。
- 版本或路由檢查失敗時，請在 Cloudflare Dashboard 的 Workers Builds 檢查 Git 來源、分支、建置命令及部署紀錄；GitHub Action **不會**替 Cloudflare 執行部署。
- 全站搜尋包含公開 Lucas Tools 項目，但工具仍由原網站提供，不複製、不代理其程式碼。
