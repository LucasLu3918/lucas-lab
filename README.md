# LUCAS LAB ✳

**Code · Create · Imagine**

一個以暗黑科技與奇幻宇宙為設計語言的個人創作網站，包含工具入口、故事、可遊玩遊戲與概念、軟體作品集、AI 藝廊與開發日誌。

## 啟動

需要 Node.js 22+；執行 `npm run check`、`npm start` **不需要 npm install**，網站執行時不依賴外部套件或 AI API Key。Cloudflare 部署 CLI `wrangler` 則明確固定在 `devDependencies`，需先 `npm install` 才能從本機執行 `npm run deploy`。

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
data/catalog.json    公開作品清單、狀態與原稿引用
content/stories/     完整小說 Markdown 原稿（保留原文）
scripts/build.cjs    產生 dist/ 下的靜態 HTML 網站
scripts/components.cjs  共用 SVG、封面、狀態與閱讀控制元件
scripts/story-source.cjs  將完整原稿分章，不修改原文
scripts/check.cjs    驗證連結、頁面與響應式斷點
scripts/serve.cjs    本機純 Node 靜態預覽伺服器
.github/workflows/   GitHub CI 檢查（Cloudflare 負責部署）
docs/                內容與技術規範
```

## Lucas Tools 整合

所有工具卡片均連結至 [Lucas Tools 原站](https://lucas-tools.owl3918.workers.dev/)，不複製、不嵌入、不遷移原程式碼。工具清單只收錄人工確認可公開的入口。

## 內容與版權

- 「霧林來信」是用於閱讀器的本站原創示範短篇（兩章）。
- 《白雪公主：血色魔鏡》與另外五部使用者提供的完整 DOCX 劇本皆已上架，保留完整分章與內容警示；沒有使用 AI 自行補寫不存在的劇情。
- 《白雪公主：血色魔鏡》五幕密室逃脫已可遊玩；其他遊戲與電商概念仍在規劃階段。
- 藝廊展示七本故事的原創 AI 封面，可放大預覽；世界概念區仍為程式繪製的示意圖。
- 未明確授權的第三方作品、素材不得直接公開。

詳細設計與後續計畫參見 [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)。

## 目前的實作取捨

先前曾規劃 Astro + Vue，但第一版選擇無依賴靜態生成，以優先完成高品質響應式體驗與可部署網站。日後有更複雜內容管理和互動需求時，再引入框架。

## 正式部署驗證

`npm run check` 僅驗證原始碼與靜態輸出，**不能取代 Cloudflare 上線驗證**。

- `npm run smoke:live` 唯讀檢查正式網站的主要路由、CSS、sitemap 與 `/_build.json`。
- `EXPECTED_COMMIT=$(git rev-parse HEAD) npm run smoke:live` 額外要求 Cloudflare 部署版本與指定 Git Commit 一致。
- GitHub Actions 每次 `main` 推送且原始碼驗證通過後，會自動重試確認正式網站已更新至對應 Commit；另每日約在台灣時間 10:23 巡檢，也可使用 `workflow_dispatch` 手動執行。GitHub 排程可能延遲。
- 版本或路由檢查失敗時，請在 Cloudflare Dashboard 的 Workers Builds 檢查 Git 來源、分支、建置命令及部署紀錄；GitHub Action **不會**替 Cloudflare 執行部署。
- 全站搜尋包含公開 Lucas Tools 項目，但工具仍由原網站提供，不複製、不代理其程式碼。

> 部署穩定性：`wrangler` 已固定版本；這降低 CLI 更新漂移，但不代表已修復 Cloudflare Workers Builds 的既有失敗。仍需查看 Cloudflare Build log，確認錯誤後才能合併部署。

## 正式小說匯入（第二階段）

- 完整稿：`content/stories/dark-snow-white.md`，由讀者提供的原稿原樣保存（SHA-256 `9d123d04b2f7e3e033d25705637a4f2edab101be34b82b6fbcc14941faead602`）。
- `data/catalog.json` 使用 `manuscript` 欄位連結原稿，建置時解析 `序章`、`第一章`至`第二十章`、`尾聲`，自動產生章節路由。
- 首頁及故事館優先展示完成稿；尚未提供完整稿件的故事維持待匯入，沒有自行補寫或創作佔位正文。
- 內容包含成人情慾張力、暴力、兒童受害及死亡議題，網站公開清楚的內容提示。
- **不將文件中的《哈利波特》氛圍描述視為該系列的官方授權或合作關係。** 正文使用自己的魔法世界設定。
- 更換原稿需同步更新 `scripts/check.cjs` 的 SHA-256 驗證值並經過內容審查，避免無意修改已上架文本。

## 原創《白雪公主：血色魔鏡》封面與瀏覽器驗收

- 新增本機原創 AI 城堡與故事封面 `assets/images/moonlit-castle.webp`、`assets/images/snow-white-portrait.webp`；首頁主視覺與故事封面都由靜態建置複製至 `dist/assets`，`npm run check` 會比對源檔與建置產物。
- 網站採暗黑奇幻、月光藍與古金色系，首頁使用全幅城堡主視覺與中文標題；導覽品牌以本機 SVG 羅盤呈現，無外部字型或圖像服務依賴。
- 現有純靜態網站仍不依賴任何執行期套件；Chrome 自動測試工具只於獨立 GitHub Actions 工作流程暫時安裝，不參與 Cloudflare 正式站部署。
- `npm run test:visual` 使用本機 Chromium + Playwright (需預先安裝)，檢查 320、360、390、480、720、768、900、1024、1440px 的核心頁面，避免水平溢出，並確認城堡與封面載入，測試行動選單、ESC 焦點、搜尋、閱讀主題/字級、章節導覽與藝廊預覽。
- `.github/workflows/visual.yml` 會在 PR / main 更新時執行，保留桌面、平板、手機三種寬度的自動測試截圖供檢視；此流程提供 Chromium 模擬驗證，不等同於實際 iPhone Safari、Android Chrome 或真人操作驗收。
- 城堡與封面插畫是本站原創視覺，與既有影視、遊戲或書籍的官方視覺無關。

- 獨立 Chromium CI 另外使用 `@axe-core/playwright` 在 390px 與 1440px 的首頁、小說目錄、首章與搜尋頁自動執行 WCAG 2.1 A/AA 檢查；此測試不等於真人螢幕閱讀器與實體裝置的驗收。

## 六部正式完整劇本（2026-10-09）

已上架《白雪公主：血色魔鏡》（既有原稿，22 個閱讀單元），並由五份使用者提供的 DOCX 轉存完整 Markdown：

| 作品 | 正文章節 | 閱讀單元 | 原稿檔 |
|---|---:|---:|---|
| 紅帽：噬月森林 | 16 | 19 | `content/stories/dark-red-hood.md` |
| 灰燼王冠：午夜之後，無人倖免 | 13 | 16 | `content/stories/dark-cinderella.md` |
| 阿拉丁：願望的屍骨 | 14 | 16 | `content/stories/dark-aladdin.md` |
| 小美人魚：沉默者的王冠 | 18 | 20 | `content/stories/dark-mermaid.md` |
| 花木蘭：葬名之歌 | 21 | 23 | `content/stories/dark-mulan.md` |

五部新增劇本共 **82 個正文章節、94 個閱讀單元**，連同白雪公主為 116 個完整長篇閱讀單元。原 DOCX 格式中的一般段落逐段轉成 Markdown，章節標題轉為語意標記；唯一需要人工分隔的是《灰燼王冠》原 DOCX 將「序幕」標題與第一句正文寫在同一段，因此只將兩者分行，正文措辭不變。原始 DOCX 保留在使用者上傳資料，未在網站公開 DOCX 檔。

- `scripts/story-source.cjs` 支援 `序章 / 序幕`、章節、分部、`終章 / 尾聲` 等多種章節結構，不強制每部作品相同章數。
- 每部的 Markdown SHA-256、章節數、首尾原文與全部章節靜態頁面納入 CI 驗證；`smoke:live` 驗證所有新章節在 Cloudflare 正式網站可開啟。
- 各劇本保留成人、暴力及其他真實敏感主題的警示；劇情沒有被重新生成或改寫。其他未提供素材的遊戲、藝廊內容維持概念/待匯入標示。

## 共用 UI 與全套故事封面

- 全站 UI 使用 `assets/style.css` 的統一 tokens 與 `scripts/components.cjs`；按鈕、狀態、輸入、卡片、提示、彈窗和閱讀控制共享尺寸與互動規則。
- 七本書均有 900×1350 與 360×540 WebP 封面，透過 `srcset`／`sizes` 選圖；書名與系列資訊採 HTML 排版。
- 閱讀器新增章節下拉切換、即時本章進度及字級上／下限停用狀態，沿用既有瀏覽器閱讀偏好。
- `/style-guide/` 是不索引的元件展示頁；設計規劃位於 `docs/design/UI_COVER_PLAN.md`，素材 hash 與尺寸位於 `docs/design/COVER_ASSETS.json`。
- AI Product System 詳情的「閱讀 AIPS 說明文件」指向說明網站，GitHub 原始碼保持獨立入口。

## 第一款可遊玩遊戲：血色魔鏡（2026-10-10）

後續完整優化方向見 [血色魔鏡優化計畫](docs/design/BLOOD_MIRROR_OPTIMIZATION_PLAN.md)，涵蓋玩法、劇情與重玩、UI、美術、聲音、存檔、效能、架構及驗收；目前僅規劃，未實作後續功能。第一批回訪體驗的邊界與驗證記錄見 [漸進改善路線](docs/design/BLOOD_MIRROR_ROADMAP.md)。

- `/games/`：完成遊戲優先展示；概念作品維持原有標籤。
- `/games/blood-mirror/`：作品介紹、內容提示、原著連結與開始遊戲。
- `/games/blood-mirror/play/`：五幕密室、道具／筆記／分層提示、自動存檔與三種結局。
- 首頁精選、故事焦點、原作目錄與全站搜尋提供遊戲入口。
- 原始遊戲放在 `games/blood-mirror/`，建置時複製至遊玩路由；請不要直接修改 `dist/`。遊戲介面樣式只在遊玩頁載入，字體使用本機回退、素材皆為本機 WebP。
- 存檔使用原有 `blood-mirror-v1` localStorage 格式；不收集個人資料、不跨裝置同步。只有同一瀏覽器與同一 origin 的存檔能延續，獨立遊戲的舊網址與 LUCAS LAB 不同時不會自動轉移。
- `npm run check` 新增遊戲邏輯、原始／建置素材一致性、跨分區連結、狀態與 sitemap 驗證。`BASE_PATH` 子路徑建置也支援遊戲返回導覽。
- 本次整合只修改本機原始碼與建置產物，未提交、推送或正式部署。
