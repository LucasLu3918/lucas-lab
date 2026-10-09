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
- GitHub Actions 在 PR 執行驗證，在 main 執行驗證與 Pages 部署。

## 後續階段
1. 真正作品封面與插畫匯入、授權與檔案最佳化。
2. 劇本分章、角色資料、世界觀，以及正式上架流程。
3. 第一款可遊玩的互動文字冒險與本機存檔。
4. 個人化收藏、閱讀進度、進階搜尋、國際化。
5. 內容量大後評估 Astro/Vue、Cloudflare Workers、R2 或 D1。

## 上線前額外人工驗收
- 真實 iOS Safari、Android Chrome、桌面 Chromium／Firefox。
- 360、390、768、1024、1440 px 檢查橫向捲動、字體裁切、選單與觸控區。
- Lighthouse、axe-core、鍵盤導覽、CSP/HTTP headers。
- 遵守發布審批流程，不把私有內容或未知授權作品直接公開。
