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

## GitHub Pages

推送到 `main` 會由 `.github/workflows/site.yml` 執行建置與部署。
第一次使用時，請在 Repository → Settings → Pages 中把 Source 設為 **GitHub Actions**。

預期網站位址：`https://lucaslu3918.github.io/lucas-lab/`（需 Pages 設定與部署成功才會生效）。

## 架構

```text
assets/              CSS 設計系統和無框架互動功能
data/catalog.json    所有公開作品的清單與章節示範
scripts/build.cjs    產生 dist/ 下的靜態 HTML 網站
scripts/check.cjs    驗證連結、頁面與響應式斷點
scripts/serve.cjs    本機純 Node 靜態預覽伺服器
.github/workflows/   CI 與 Pages 自動部署
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
