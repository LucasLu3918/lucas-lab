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
| 音樂播放器 | `[data-music-player]`、`[data-audio]` | Music 頁由 `src/vue/site/music-main.ts` 啟動 Vue island；`AudioPlayerPort` 與瀏覽器 adapter 管理 `HTMLAudioElement`、seek／volume／播放清單與鍵盤快捷鍵，元件卸載時清除事件監聽器。 |
| PWA 更新提示 | service worker 更新事件 | `assets/app.js` 動態建立 banner、更新文字並提供重新載入操作。 |
| 遊戲 UI／Puzzle | `games/blood-mirror/main.js`, `ui.js`, `views/modals.js`, `puzzles/*.js` | 主流程建立頁面／modal；每個 Puzzle 直接查詢、建立與更新自己的 DOM/SVG，部分依賴 CSSOM 座標和 transform。需按 Puzzle／畫面群組分批交接 DOM 所有權。 |

全站共用控制仍集中在 `assets/app.js`；Music 播放器由 Vue island 管理生命周期，遊戲跨 33 個 Puzzle 模組直接操作 DOM。這是後續分割遷移的主要工作量來源。各模組來源可用 `rg -n 'querySelector|createElement|innerHTML|\.style\.' assets games/blood-mirror` 重現檢視。

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

## Phase 3 — Search / Discovery 第一個切片

Search 從 `/search/` 開始遷移；此頁仍由 SSG 產生，canonical、`noindex,follow` 與 sitemap 排除規則不變。作品卡片與搜尋控制項先由 SSG 輸出；site-lazy entry 只安裝輕量輸入／分類監聽器，使用者互動時才載入 Vue feature bundle。停用 JavaScript 時仍可瀏覽完整作品清單。

`scripts/site/showcase-search.cjs` 將公開作品摘要以 HTML attribute escaping 後傳入 island；Vue 在本機比對，不送出搜尋詞，也不將 `q` 寫回 URL。`?q=` 仍預填輸入框，最多 80 字。名稱、說明、分類與工具特徵使用 NFKC、忽略大小寫並移除空白後比對；分類篩選與四組結果各自更新。

章節搜尋沿用 `dist/search-index.json`：只有至少兩個字元的查詢經過 200 ms debounce 後才載入；索引仍只包含章節標題、作品標題、同源路徑與正文開頭 80 字。載入失敗會顯示狀態，後續查詢可重試；結果只接受同源章節連結，最多顯示 30 筆。公開 Lucas Tools 連結仍經 catalog HTTPS 驗證並使用 `noopener noreferrer`。

Vue 元件責任：`SiteApp` 選擇 island；`SearchApp` 組合搜尋流程；`SearchControls` 管理輸入與分類事件；`SearchResults` 顯示分組、數量與空狀態；`SearchResultCard` 顯示單筆作品；`ChapterSearchResults` 顯示延遲取得的章節；`site/lazy.ts` 在互動時載入 feature。其他館藏頁與 `/style-guide/` 仍由 `assets/app.js` 控制；搜尋頁使用自己的 `data-search-filter`，不輸出舊控制器使用的搜尋標記，避免同一 DOM 子樹被兩套控制器管理。

本切片驗證使用 `npm run check`、`npm run test:site`、`npm run test:visual` 與 `npm run test:perf`。Search 頁加入專用 180px、壓縮 360px／600px WebP 候選後，本機 390px 為 166 KB／12 個請求、1440px 為 281 KB／13 個請求，均低於 350 KB／15 個上限。GitHub CI 初次量測原始縮圖的桌面 Search 為 352 KB／14 個請求，故提供依 viewport 選擇的輕量候選。`origin/main` 的遊戲頁也會觸發既有的效能檢查失敗（46 個請求，高於 45 個上限），本切片未更動遊戲資源。後續依序遷移 Catalog 館藏頁，再處理 Reader；不要在本切片擴大到 Gallery、Music 或遊戲。

## Phase 4 — Blood Mirror Inventory Vue island

Inventory 是遊戲 UI 的第一個 Vue 垂直切片，沿用 `/games/blood-mirror/play/` 公開路由與既有 SSG。`games/blood-mirror/index.html` 提供唯一的 `[data-vue-game-inventory]` 子樹；`scripts/site/games.cjs` 從已驗證的獨立 Vite manifest 注入同源 hashed bundle 路徑。legacy 控制器在首次進入場景時才動態載入 Vue，標題頁與遊戲頁初始載入不增加請求。

遊戲引擎仍擁有 `state.inventory`、收取規則與存檔。legacy `renderInventory` 只更新清單外的數量，並以 `blood-mirror:inventory-updated` 發布 ID；Vue `InventoryPanel` 根據既有物品 catalog 顯示物品，選取後以 `blood-mirror:inventory-selected` 傳回 ID。legacy 控制器驗證物品仍在背包後，繼續使用原本的 modal、插畫、說明與焦點還原。Vue 不改寫遊戲狀態；Journal 的內容規則、Hints、Puzzle 與其他遊戲畫面仍由 legacy 控制器擁有。

不變條件：v1/v2 遷移、`blood-mirror-v2` 與 `blood-mirror-v2-backup`、puzzle key、CSP、公開路由與 Worker 行為維持原樣。測試包含清單／空狀態、事件資料驗證、manifest 綁定的 SSG 契約，以及實際收取物品、開啟詳情和焦點還原的遊戲瀏覽器流程。

## Phase 5 — Blood Mirror Journal Vue island

Journal 接手既有 modal 中的已解鎖章節筆記、推理簿、人物記憶與收藏；沿用現有 game Vue bundle，並在開啟筆記時才掛載 Vue。legacy `main.js` 使用 `journalChapters`、`memoryCollection` 與既有引擎資料組成唯讀快照，Vue 只管理章節選擇和呈現。既有 modal shell 保留標題、關閉、焦點還原與其他視窗的控制；關閉或切換視窗時卸載 Journal island。祕密尾聲按鈕只把請求交回 legacy 控制器。

不變條件：預設目前章節、全部已解鎖章節篩選、已查看線索、修復後文字、線索詞分組、人物記憶與碎片／成就遮蔽規則維持原樣。Vue 以文字插值顯示內容，不輸出 HTML；Journal 不寫入遊戲狀態或存檔。Hints、Puzzle、遊戲引擎、存檔格式、路由、CSP 與 Worker 行為維持原有邊界。驗證涵蓋快照解析、元件的篩選／空狀態／未解鎖內容、既有遊戲瀏覽器 Journal 流程，以及同一個 lazy game bundle 的 SSG 契約。

下一個遷移切片：Hints（提示）Vue island；在 Hints 完成獨立驗收前，Puzzle 與其他遊戲畫面仍由 legacy 控制器擁有。

## Phase 6 — Blood Mirror Hints Vue island

Hints 沿用 `/games/blood-mirror/play/` 與已存在的 game Vue bundle，開啟提示 modal 時才掛載 `HintPanel`。`main.js` 將目前步驟名稱、三層提示文字與已揭露層數組成唯讀快照；Vue 以文字插值顯示已揭露內容，按鈕只發出 reveal-next 事件。legacy controller 仍選擇步驟、更新 `stepHints`／`hints`、記錄試玩事件並保存進度。

既有 native modal shell 繼續負責關閉、Escape、焦點還原與標題；modal 關閉或切換時卸載 island。Puzzle 內的 `<details>` 燭光提示維持既有 HTML renderer 與綁定邏輯，不與獨立 Hints modal 混用。載入失敗時在 modal 內顯示可讀狀態。

不變條件：三層提示文字與順序、已揭露層數、試玩紀錄、localStorage 存檔、Puzzle 內嵌提示、遊戲路由、CSP 與 Worker 行為維持原樣。驗證包含快照解析、提示層呈現／事件／完成狀態、實際遊戲瀏覽器開啟及焦點流程，以及 game bundle contract；不另輸出遊戲頁載入腳本或建立第二份 Vue runtime。

### Phase 7 — Blood Mirror Reflection Puzzle Vue island

「反寫手稿」將 4×4 光格交由 `ReflectionPuzzle.vue` 管理，沿用 game Vue lazy bundle 與原生 modal。Vue 持有右半部的互動狀態、格子呈現與即時列數；左半固定。legacy `reflection.js` 保留起始格局與 `glassIsSolved`，接收變更後播放點擊音效並呼叫既有 `done()`；`startPuzzle` 的公開呼叫方式、stage id、完成／存檔流程與下一道鏡像迷廊不變。

`main.js` 只在 reflection stage 建立 island，確認 modal 與 stage 仍有效後才掛載；既有 modal close／切換機制負責卸載。載入失敗會顯示可讀訊息，缺少 adapter 時保留 legacy renderer。元件使用文字插值與原生 button，固定格不可操作，互動格提供 `aria-pressed`，列數透過 status live region 更新。沒有新增 Vue bundle entry、頁面載入腳本、路由或存檔欄位。

驗證包含元件行為、game bundle export 契約與完整瀏覽器解謎流程；原本的 reflection domain test 繼續保護 `glassIsSolved` 規則。這一切片只交接反寫手稿格盤，其他 Puzzle 的 DOM／SVG／Canvas 操作仍由各自 legacy stage 管理。

## Phase 8 — Blood Mirror Maze Puzzle Vue island

`MazePuzzle.vue` 接手既有鏡像迷廊的 5×7 board、方向按鈕、方向鍵、懷錶按鈕、重設按鈕與狀態訊息，並沿用現有 lazy game bundle 和 challenge modal。`maze.js` 保留迷宮 layout、移動／碰牆規則、左右鏡像、懷錶物品門檻、步數、提示訊息、音效與 stage 完成回呼；Vue 收到唯讀 snapshot，操作後將 typed action 交回 legacy 規則並呈現回傳 snapshot。無法掛載 Vue island 時保留原有 DOM renderer。

不變條件：35 格位置與樣式、方向語意、閉鎖門與懷錶條件、重設位置／步數但保留已開啟的鏡門、鍵盤操作與按鈕焦點、stage id、modal shell、Hints、進度和存檔行為維持原樣。Vue adapter 驗證 snapshot；不新增入口、公開路由、存檔格式、執行期相依、network 或 storage 存取。驗證包含 component 行為、bundle export contract、真實遊戲情境中的鍵盤移動／懷錶／重設／通關，以及既有 game checks。

## Phase 9 — Blood Mirror Pipes Puzzle Vue island

`PipesPuzzle.vue` 接手 3×3 蒸汽管網、管件旋轉控制、連線狀態、提示與復原／重設／確認按鈕，沿用既有 lazy game bundle。`pipes.js` 保留 `analyzePipes`／`pipeIsSolved` 規則、旋轉與 undo history、提示進度、音效及完成回呼；Vue 只顯示經驗證的 snapshot，並把 typed action 交回 legacy controller。若 island 無法掛載，原有 DOM renderer 仍可使用。

不變條件：管件位置與旋轉方向、連通／漏氣判定、50 筆復原歷史、提示順序、方向鍵移格、只有明確確認才完成、stage id、modal shell、進度與存檔行為維持原樣。CSS rotation classes 避免新增 inline style；不新增入口、公開路由、存檔欄位、執行期相依或額外載入腳本。驗證包含快照解析、元件互動、既有 Pipes browser journey 的觸控／鍵盤／提示／復原／通關，以及 game bundle contract。

## Phase 10 — Blood Mirror Ledger Puzzle Vue island

`LedgerPuzzle.vue` 接手「拼回帳頁」的 3×3 碎片格盤、選取狀態、歸位數量、重設控制與方向鍵移格，沿用既有 lazy game bundle。`ledger.js` 保留初始／重設排列、碎片交換、完成判定、音效與完成回呼；快照 adapter 只接受完整的 0–8 碎片排列，並使用 `ledger-art.js` 產生已知的靜態 SVG。無法掛載 Vue island 時，原有 DOM renderer 保留作為 fallback。

不變條件：stage id、原生 modal shell、另一道懷錶齒輪、遊戲進度與存檔格式維持不變；Vue 只擁有格盤子樹與暫態選取狀態，不寫入 storage。沒有新增 route、bundle entry、runtime dependency、CSP 例外或網路存取。驗證包含快照解析、元件互動、manifest/bundle contract，以及實際瀏覽器中的觸控、鍵盤、重設與完成流程。

下一步：重新盤點尚未接手的 Puzzle UI，挑選一個互動邊界獨立、規則可留在 legacy 的項目，再逐項遷移。
