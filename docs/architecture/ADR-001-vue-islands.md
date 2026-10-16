# ADR-001：以 Vue Islands 漸進遷移互動介面

- 狀態：已接受
- 日期：2026-10-16
- 範圍：LUCAS LAB 網站與《血色魔鏡》客戶端 UI 的後續重構

## 背景

LUCAS LAB 以 Node.js 標準庫產生靜態 HTML，部署在 Cloudflare Workers Static Assets。網站已有公開路由、SEO metadata、PWA 離線閱讀、閱讀器偏好與進度；《血色魔鏡》也有獨立遊戲引擎、Puzzle 模組和大量單元／瀏覽器測試。`docs/IMPLEMENTATION.md` 原先決定暫緩 Vue，等需求成熟再評估。這次使用者明確選擇依 `vue1` 規劃開始 Vue 3、DDD、Clean Architecture、SOLID 與 TDD 的分階段重構，因此採用該新決定；本 ADR 將變更限制在可逐步驗收的遷移路徑。

## 決策

保留既有靜態網站生成（SSG）、公開網址和 Cloudflare Workers 部署，使用 Vue Islands 漸進取代互動區域。新程式優先採 Vue 3 Composition API 與 TypeScript；只在跨元件確實共享狀態時採 Pinia。Vite 用於新 Vue 入口的開發與打包，舊頁面仍由現有 SSG 產生。

不把全站改成 Vue SPA，不在本階段導入 Nuxt SSR，也不先把整個 repository 改成 monorepo。遊戲 Domain 與既有存檔契約先保留，等 UI 架構基礎建立後再透過 ports/adapters 和 use cases 漸進整合。

## 依賴與部署邊界

- Vue、Vite 及型別／測試工具只作為建置或開發依賴，不加入瀏覽器執行期服務。
- Vite 輸出必須先放在獨立暫存目錄；`scripts/build.cjs` 目前會清空 `dist/`，因此不能先把 bundle 放進 `dist/` 再執行 SSG。
- SSG 從明確的 build manifest 載入 hashed assets，保持 CSP、canonical、sitemap、404、PWA 與資產路徑契約。
- 每個遷移區域只能有 Vue 或原生控制器其中一方擁有其 DOM 子樹。
- 不變更正式 Worker 路由模式，也不移除 `worker/index.js` 的 Range 支援。

## 取捨

Vue Islands 增加建置相依與維護面積，但可沿用目前 SSG 的 SEO、離線閱讀與部署特性，並讓互動 UI 分批替換、逐 PR 回退。全站 SPA 或 SSR 會同時改變路由、渲染和部署方式，與目前以靜態內容為主的需求不符。Phase 0 不新增框架依賴或改變任何正式輸出。

## 驗收方向

每個階段保留上一版可部署與回退能力；路由 golden manifest、存檔／閱讀資料、Worker 音訊 Range、404、PWA、metadata 與既有測試均持續通過。架構規則以可執行測試或 lint 邊界落實，不以文件宣告取代驗證。

## 後續決策

先完成 Phase 0 安全基線，再依序建立 Vue/Vite/TypeScript Scaffold、共用 UI、Catalog/Discovery/Reading，之後再遷移 Gallery/Music 和遊戲。每一階段開始前重新確認 `main`、Change Impact 和實際消費者。
