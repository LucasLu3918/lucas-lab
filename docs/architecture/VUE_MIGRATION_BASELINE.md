# Vue 遷移前安全基線

日期：2026-10-16
基準 commit：`1ca7c77a1e2763d963200f7f080ba93216a8ae14`
路線：Phase 0 / PR 01 — Baseline、ADR、契約測試

## 目前架構

- Node.js 標準庫執行 SSG；`scripts/build.cjs` 清空並重建 `dist/`。
- `scripts/site/` 產生網站頁面、Catalog、資產、sitemap、PWA 與標頭；`assets/app.js` 與 `assets/music.js` 負責原生瀏覽器互動。
- 《血色魔鏡》是獨立 ES module 遊戲，主流程在 `games/blood-mirror/main.js`，規則、狀態、存檔及 33 個 Puzzle 模組已有拆分。
- `worker/index.js` 僅處理 `/music/audio/*` 的 HTTP Range；其他路徑由 Cloudflare Static Assets 回應。
- `package.json` 沒有 Vue、Vite、TypeScript 或 Pinia；正式站不載入第三方框架 runtime。

## 路由與輸出快照

在基準 commit 執行 `npm run build`，建置器列出 **144 個 sitemap 路由**與 **118 個章節搜尋索引項目**；`dist/` 中共有 **151 個 `index.html` 入口**，另含不列入 sitemap 的遊玩、工具與輔助頁。全部入口的 route、標題、canonical URL 及 robots metadata 已記錄於 [vue-route-baseline.json](vue-route-baseline.json)。`npm run check` 會重建網站並逐項比較此快照，發現新增、移除或 metadata 改動時需在有意識的功能 PR 更新基線。

主要路由族：首頁、故事館與故事詳情、章節頁、遊戲館與遊戲介紹／遊玩頁、作品集、藝廊、音樂、日誌、搜尋、關於／授權，以及 style guide。`wrangler.jsonc` 維持 `404-page` 與 `auto-trailing-slash`。

## 必須維持的資料與瀏覽器契約

| 契約 | 基準值／行為 | 主要來源 |
| --- | --- | --- |
| 遊戲主存檔 | `blood-mirror-v2` | `games/blood-mirror/engine/save.js` |
| 遊戲備援存檔 | `blood-mirror-v2-backup` | 同上 |
| 遊戲舊版資料 | v1 遷移與 puzzle key 保留 | 同上、`scripts/blood-mirror-save.test.mjs` |
| 閱讀偏好 | `lucaslab.reader.preferences` | `assets/app.js` |
| 閱讀進度 | `lucaslab.progress.v1` | `assets/app.js` |
| 遊戲入口 | `/games/blood-mirror/play/` | SSG、Catalog、Cloudflare route |
| 小說章節 | `/stories/<slug>/chapters/<id>/` | `scripts/site/stories.cjs` |
| SEO / 發現性 | canonical、robots、sitemap、JSON-LD | `scripts/site/`, `scripts/check.cjs` |
| PWA | 離線章節、快取更新提示 | service worker 與 `scripts/site/pwa.cjs` |
| 音訊 Range | 有效範圍回 206；無效範圍回 416 | `worker/index.js`、`scripts/serve.cjs` |
| 不存在路由 | Cloudflare 使用 404 頁面，不 SPA fallback | `wrangler.jsonc` |

## 既有驗證介面

- `npm run check`：語法檢查、Node 遊戲測試、密度檢查、SSG 建置、基線／內容檢查。
- `npm run test:visual`：響應式視覺與 axe-core 檢查。
- `npm run test:site`：站內搜尋、閱讀、PWA、藝廊及 CSP 瀏覽器流程。
- `npm run test:perf`：路由傳輸量、請求數、LCP 與 CLS 預算。
- `npm run test:game`：遊戲核心流程與互動瀏覽器情境。
- GitHub Actions 的 `site.yml` 與 `visual.yml` 分別執行來源／建置檢查及瀏覽器驗證。

此 PR 新增 `scripts/vue-migration-contracts.test.mjs` 到 `npm run check`。它比對路由 golden manifest、存檔與閱讀鍵、404 模式，並直接測試 Worker 的 206／416 回應。

## Phase 1 — Vue/Vite/TypeScript 基礎建置

Phase 1 在保留 SSG 為公開頁面來源的前提下，新增 Vue 3、Vite、strict TypeScript、`vue-tsc` 與 Vitest。`src/vue/site/main.ts` 和 `src/vue/game/main.ts` 是彼此獨立的入口；它們只會在頁面含有對應的 `[data-vue-site-island]` 或 `[data-vue-game-app]` 掛載點時啟動。現有 SSG 沒有輸出這些掛載點，也沒有載入 bundles。

`npm run build` 會先將兩個入口建置到 `.vue-build/`，再執行會清空 `dist/` 的 `scripts/build.cjs`。SSG 驗證 Vite manifest 與輸出檔案後，將結果複製到 `dist/_vue/`；公開 HTML 不載入這些 bundles。hashed bundle 使用 immutable cache，manifest 需重新驗證。CSP 維持 `script-src 'self'` 與 `style-src 'self'`，不允許 inline script/style。

最低 Node 版本為 22.12，以符合目前 Vite 與 Vitest 的 runtime 要求。GitHub Actions 使用 `npm ci`，Cloudflare Workers Builds 透過提交的 `package-lock.json` 安裝建置相依。驗證入口為 `npm run typecheck`、`npm run test:vue`、`npm run build` 與 `npm run check`。

## DOM 責任盤點與遷移規則

| DOM 區域 | 現有入口／控制 | 更新責任與風險 |
| --- | --- | --- |
| 全站導覽 | `#site-nav`, `[data-menu]` | `assets/app.js` 綁定開關、外部點擊、Escape、focus 還原及 920px media query。 |
| Catalog 搜尋／篩選 | `[data-region]`, `[data-search]`, `[data-filter]`, `[data-item]` | 以 `hidden`、`aria-pressed`、計數文字改變原生 SSG 清單；URL `?q=` 預填搜尋詞。 |
| 閱讀工具列 | `[data-reader]`, `[data-theme]`, `[data-font]`, `[data-chapter-select]` | 在 reader 根節點切換 class、寫 CSS custom property、ARIA 與 localStorage。 |
| 閱讀進度／續讀 | `[data-reading-progress]`, `[data-resume]`, `[data-story-continue]`, `.chapterlist` | scroll／resize handler 更新位置、續讀連結、已讀標記，並寫 `lucaslab.progress.v1`。 |
| 內容警示／隱私 | `[data-content-warning]`, `[data-warning-ack]`, `[data-clear-progress]` | 狀態留在本機 storage；清除操作更新提示文字。 |
| 離線保存／章節搜尋 | `[data-offline-save]`, `[data-chapter-search]` | 綁定 CacheStorage、Service Worker 與 fetch，更新進度／錯誤訊息及結果列表。 |
| 藝廊對話框 | `#gallery-dialog`, `[data-preview]`, `[data-dialog-*]` | 使用原生 `dialog`、動態建立圖片、方向鍵／觸控滑動、焦點返回與文字更新。 |
| 音樂播放器 | `[data-music-player]`、`[data-audio]` | `assets/music.js` 管理 HTMLAudioElement、seek／volume／播放清單與鍵盤快捷鍵。 |
| PWA 更新提示 | service worker 更新事件 | `assets/app.js` 動態建立 banner、更新文字並提供重新載入操作。 |
| 遊戲 UI／Puzzle | `games/blood-mirror/main.js`, `ui.js`, `views/modals.js`, `puzzles/*.js` | 主流程建立頁面／modal；每個 Puzzle 直接查詢、建立與更新自己的 DOM/SVG，部分依賴 CSSOM 座標和 transform。需按 Puzzle／畫面群組分批交接 DOM 所有權。 |

網站共用控制集中在 `assets/app.js` 與 `assets/music.js`；遊戲跨 33 個 Puzzle 模組直接操作 DOM。這是後續分割遷移的主要工作量來源。各模組來源可用 `rg -n 'querySelector|createElement|innerHTML|\.style\.' assets games/blood-mirror` 重現檢視。

遷移時以一個完整互動區域為邊界：Vue 接手該 DOM 子樹後，舊控制器不再讀寫該子樹。Audio、Canvas、Gamepad、WebAudio 與既有遊戲引擎可以經 adapter 保留，不要求改成 Vue 模板。CSP 不允許新增未審核的 inline script/style。

## 本機驗證結果

環境：Node.js `v26.11.1`、Playwright `1.56.1`、本機快取 Chromium build `1248`。視覺與網站測試使用共用 launcher 的快取瀏覽器；遊戲套件部分測試直接要求 build `1194`，因此本機遊戲全套未能完成。CI 使用其 workflow 指定的環境與瀏覽器，需以 PR 檢查補足該證據。

| 指令 | 結果 | 證據 |
| --- | --- | --- |
| `npm run check` | PASS | 195 個單元測試通過、1 個因本機缺少美術母檔略過；建置 144 個 sitemap 路由、118 個索引項目；內容檢查通過；新增契約測試 4/4 通過 |
| `npm run test:visual` | PASS | 171 組頁面／視窗、鍵盤／觸控、搜尋、閱讀器、藝廊及 axe 稽核 |
| `npm run test:site` | PASS | 搜尋、閱讀進度、離線閱讀、藝廊、CSP 等站台功能驗收通過 |
| `npm run test:perf` | FAIL | 390px 首頁 154 KB / 9 requests / LCP 60ms / CLS 0；故事頁 100 KB / 6 / 40ms / 0；章節頁 78 KB / 5 / 36ms / 0；搜尋 275 KB / 11 / 60ms / 0；遊戲 799 KB / 46 / 60ms / 0。遊戲頁預算為 45 requests，超出 1 個請求；其他量測值在目前預算內。 |
| `npm run test:game` | PARTIAL | 前五個瀏覽器腳本涵蓋主線、推理、結局、藝廊與音訊且通過；picker 腳本要求本機缺少的 Chromium 1194 headless shell，後續套件未執行。 |

臨時安裝的 Playwright／axe-core 只在忽略追蹤的 `node_modules`；`package.json` 與 lockfile 沒有因此新增執行相依。視覺／站台／效能數據來自 Chromium build 1248，與 CI build 不同；效能請求數的超標需由 PR CI 在其瀏覽器版本重驗。`npm run check` 的 1 個 skip 是 `scripts/blood-mirror-concept.test.mjs` 無法取得 repo 外的 PNG 母檔，並非測試斷言失敗。

同一基準 SHA `1ca7c77a1e2763d963200f7f080ba93216a8ae14` 的最新 GitHub `verify` 與 `visual-audit` workflow 均為 success。因此，Chromium 1248 本機的遊戲請求數超標與遊戲套件缺少 1194 headless shell 是本機量測／環境限制；合併依據以 PR 自身對精確 SHA 的 required checks 為準。

真機 iOS Safari／Android Chrome 仍需人工驗收；CI 與正式部署狀態以本次 PR 精確 commit 的檢查結果為準。

## Phase 2 — Vue Design System 與共用基礎元件

Phase 2 新增 `src/vue/shared/tokens.css` 與 `base.css`，以 `assets/style.css` 現有的海軍藍黑底色、古金與酒紅、字體堆疊、6/10px 圓角、48px 主要控制項、44px 緊湊控制項、3px 金色鍵盤焦點框和 reduced-motion 偏好建立 Vue 共用樣式。兩個 Vue 入口載入相同 token 與元件樣式，仍由 Phase 1 的獨立 Vite entries 編譯。

共用元件維持單一責任與明確 API：

| 元件 | 職責與契約 |
| --- | --- |
| `BaseButton` | 原生按鈕；`variant`、`size`、`type`、`disabled`、`loading` props；預設 slot 作為可見與可存取名稱。 |
| `BaseBadge` | 狀態標籤；`tone` prop；預設 slot 為標籤文字。 |
| `BaseCard` | 語意容器；`as` 與 `elevation` props；預設 slot 為內容。 |
| `BaseNotice` | 狀態訊息；`tone` prop；錯誤訊息採 assertive alert，其餘採 polite status。 |
| `BaseTextField` | 有標籤的文字輸入；必填 `label`、`v-model`、說明與錯誤關聯、原生 required/disabled。 |

本階段只把元件樣式納入 Vue build，尚未在 SSG 頁面輸出掛載點或切換既有控制器，因此公開 HTML、路由、使用者資料、Worker 與現有 DOM 所有權不變。`src/vue/shared/index.ts` 是 Vue 領域的共用公開入口；不加入 runtime 服務或新外部依賴。`BaseComponents.spec.ts` 覆蓋 loading/disabled、語意容器、live-region、label/error 關聯與 v-model。
