# LUCAS LAB：網站規劃與實作紀錄

## 第一版功能
- 首頁：暗黑科技與星軌視覺、六大分類、精選內容、原生響應式導覽。
- 工具館：純入口展示，直接開啟原 [Lucas Tools](https://lucas-tools.owl3918.workers.dev/) 網站，**不複製其程式碼**。
- 故事館：作品資料頁、內容狀態、兩章原創示範、明暗閱讀主題與字體調整。
- 遊戲館：概念介紹，尚無可玩遊戲；不得使用可遊玩標籤。
- 作品集：Lucas Tools、AIPS 專案連結與電商概念。
- 藝廊：CSS/符號視覺佔位，非已完成 AI 圖片。
- 日誌、關於、全站作品搜尋與授權／隱私說明。

## 響應式與體驗
- Breakpoints: 990 / 720 / 480 px。
- 720px 以下採選單按鈕、垂直主視覺、雙欄分類和藝廊。
- 480px 以下作品卡採圖文橫向單欄，工具為單欄，避免不必要的橫向捲動。
- 互動目標最小 44px；清楚的 focus-visible；支援 prefers-reduced-motion。
- 閱讀器字體 16–24px、紙張／夜間模式，使用 localStorage 記錄偏好。
- 以純 CSS 概念視覺避免額外圖像請求，未來採 WebP/AVIF、srcset 與 lazy-loading。

## 資料治理
- 由 `data/catalog.json` 管理故事、工具、遊戲、專案、藝廊與日誌。
- `pending`、`concept`、`demo`、`live` 等狀態需誠實呈現。
- 故事劇本需要從 ChatGPT 專案或有權使用的原稿正式匯入，完成校對、內容分級與授權審查後才能公開。
- 工具清單為人工審核的 public allowlist，不展示 Lucas Tools 的 extension / 限制使用工具。
- 避免引入任何外部付費 Agent API Key。

## 技術決策
- 第一版使用 Node.js 標準庫生成靜態 HTML，無第三方 Runtime／Build 依賴。
- 理由：內容與資料規模仍小，簡化部署、降低首次上線不確定性與載入負擔。
- **與先前規劃的 Astro + Vue 不同**：本版先以零依賴靜態生成落地；待作品量、內容管理需求、複雜互動確立後，再評估遷移 Astro Content Collections 與 Vue Islands。
- `npm run check` 會執行語法檢查、建置、內部連結檢查與公共工具鏈結檢查。
- GitHub Actions 僅在 PR/main 執行驗證；正式部署交由已連結 GitHub 的 Cloudflare Workers Builds，避免 GitHub Pages 雙軌部署。

## 後續階段
1. 真正作品封面與插畫匯入、授權與檔案最佳化。
2. 劇本分章、角色資料、世界觀，以及正式上架流程。
3. 第一款可遊玩的互動文字冒險與本機存檔。
4. 個人化收藏、閱讀進度、進階搜尋、國際化。
5. 內容量大後評估 Astro/Vue、Cloudflare R2 或 D1；Cloudflare Workers 已是正式部署平台。

## 上線前額外人工驗收
- 真實 iOS Safari、Android Chrome、桌面 Chromium／Firefox。
- 360、390、768、1024、1440 px 檢查橫向捲動、字體裁切、選單與觸控區。
- Lighthouse、axe-core、鍵盤導覽、CSP/HTTP headers。
- 遵守發布審批流程，不把私有內容或未知授權作品直接公開。

## 正式部署與 SEO
- 正式來源：`https://lucas-lab.owl3918.workers.dev/`，使用 Cloudflare Workers Static Assets。
- Worker 名稱與靜態輸出目錄由 `wrangler.jsonc` 管理；`dist/` 應由 `npm run build` 生成。
- Cloudflare Git integration 使用 `main`，Build command 為 `npm run build`、Deploy command 為 `npx wrangler deploy`。
- 不再使用 GitHub Pages 部署流程。若啟用自訂網域，再更新 `SITE_URL`。
- 網站實際是否已部署、Build 過程是否成功，應以 Cloudflare Dashboard 為準，不能以 GitHub CI 成功代替驗證。

## 第二階段優化：搜尋、手機體驗與上線驗證

- 全站搜尋整合公開 Lucas Tools 工具清單、故事、遊戲及專案，搜尋詞不傳至後端；工具皆保留外站新分頁連結。
- 小螢幕篩選標籤列可橫向捲動，作品卡及工具動作連結維持至少 44px 的可操作高度。
- 手機導覽 Esc 關閉後返回選單按鈕，螢幕切至桌面尺寸時清除展開狀態。
- 搜尋頁、未完成的遊戲／劇本／專案概念頁仍可從站內開啟，但不列入 sitemap，避免與 `noindex` 衝突。
- `_build.json` 公開部署來源 Commit SHA 和網站來源，`npm run smoke:live` 使用唯讀 HTTPS 偵測正式網站主路由、內容與 Cloudflare 部署版本是否落後。
- GitHub Actions 驗證 source/build；`schedule` 與 `workflow_dispatch` 另執行 live smoke。Cloudflare Git integration 仍是唯一正式部署來源。
- 這些改善不等同於真實螢幕截圖測試；iOS Safari、Android Chrome、平板及桌面仍需人工驗收。

## 第三階段：完整小說《白雪公主：血色魔鏡》

- 完整原稿保存在 `content/stories/dark-snow-white.md`；以檔案 checksum 驗證與使用者提供的原文一致，建置工具不得重新生成或補寫。
- `scripts/story-source.cjs` 將序章、二十章及尾聲解析為 22 個固定閱讀網址（`/stories/dark-snow-white/chapters/00/` 至 `/21/`），並保留五部原始分組。
- 內容以原始換行逐行展示；完整稿加上專用閱讀排版樣式，沿用夜間/紙張主題、字體調整、前後章導覽。
- 搜尋、首頁、故事館及 sitemap 可收錄已完成且可閱讀的正式故事；未完成作品繼續維持 pending/concept 和既有 noindex 設計。
- 對成人情慾張力、殘酷暴力、兒童死亡與傷害、階級壓迫與悲劇等議題展示內容警示；不發布其他尚未提供的完整劇本。
- `npm run check` 同時檢查原稿 SHA-256、章節數、章節網址、原文起始與結束及內容警示。
- Cloudflare 發布與實際跨裝置驗收仍獨立進行；原稿完成不等於正式圖片與遊戲也完成。

- 正式環境 `live-smoke` 已擴充為每次驗證《白雪公主：血色魔鏡》全部 22 個閱讀網址與尾聲完整結語，避免上線後出現單章 404 或截斷結局。
