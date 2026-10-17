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

## Phase 11 — Blood Mirror Masks Puzzle Vue island

`MasksPuzzle.vue` 接手 ballroom「面具賓客」的六組原生選單、賓客排序、證詞與狀態回饋，沿用既有 lazy game bundle 和 challenge modal。`masks.js` 保留面具與賓客資料、選擇狀態、未完成／重複選擇檢查、`masksSolved`／`brokenClue` 判定、錯誤音效與 stage 完成回呼；Vue 收到經驗證的 snapshot，將 typed select／reset／confirm actions 交回 legacy controller。沒有 island mount callback 時，原 DOM renderer 保留作為 fallback。

不變條件：六組面具與選項順序、五則證詞、stage id、modal shell、下一道鏡面光路、進度與存檔行為維持原樣。Vue 只呈現 repository-authored 字串並使用原生 `<select>`，不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含快照解析、元件行為、game bundle export contract，以及瀏覽器中的鍵盤選擇、重設、未填／重複／錯誤回饋、通關與進度連續性。

## Phase 12 — Blood Mirror Light Puzzle Vue island

`LightPuzzle.vue` 接手 ballroom「鏡面光路」的 5×6 光格、四面鏡子的翻轉按鈕、光線路徑、暗門狀態與重設控制，沿用既有 lazy game bundle、challenge modal 與 puzzle CSS。`light.js` 保留 `traceBeam`／`lightSolved`、方向狀態、翻轉與重設動作、點擊音效及 stage 完成回呼；Vue 收到經驗證的鏡面／光線快照，再將 typed flip/reset action 交回 legacy controller。沒有 island callback 時，既有 DOM renderer 繼續使用。

不變條件：光線入口、暗門位置、四面鏡子的座標／起始方向／解答、stage id、modal shell、內嵌提示、進度與存檔行為維持原樣。Vue 只管理光路 UI 子樹，不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含快照 parser、元件的鍵盤翻轉／重設／即時狀態、既有 game bundle contract，以及 360px／1280px 遊戲瀏覽器中的 lazy mount、解謎、legacy stage 進度和水平溢位。

## Phase 13 — Blood Mirror Watch Puzzle Vue island

`WatchPuzzle.vue` 接手書庫「懷錶齒輪」的三枚齒輪控制與狀態呈現，沿用既有 lazy game bundle、challenge modal 和齒輪素材。`watch.js` 保留暖身階段、齒輪聯動、累積角度與動畫狀態、音效、重設規則和通關判定；Vue 只根據已驗證 snapshot 呈現齒輪並傳回 typed turn/reset action。沒有 island callback 時，legacy DOM renderer 保留作為 fallback。

不變條件：時輪／分輪／秒輪順序、六格位置、暖身初始值與轉動一次後進入真正謎題的流程、三枚齒輪互相牽動的規則、方向連續的旋轉動畫、重設行為與 stage id 維持原樣。modal、Hints、進度、存檔、公開路由、CSP、lazy bundle entry 和 runtime dependencies 不變。Vue 不讀寫 storage 或自行判定答案。驗證包含快照 parser、鍵盤可操作的齒輪按鈕、狀態／暖身轉場／重設、bundle export 契約，以及 360px／1280px 瀏覽器中的 lazy mount、暖身、聯動、解謎和 legacy stage progress。

## Phase 14 — Blood Mirror Belfry Gear Train Vue island

`Gears13Puzzle.vue` 與 board／tray／controls 子元件接手鏡淵「逆走鐘樓」齒輪列的 SVG 盤面、軸座、托盤和控制呈現，沿用既有 lazy game bundle、stage id、modal 與鐘樓 CSS。`gears13.js` 保留暖身／主盤狀態、齒輪放置與嚙合／卡死／輸出比判定、提示、時間動畫、音效和通關回呼；Vue 只根據經驗證的快照呈現，並將 typed actions 交回 legacy controller。動畫快照沿用現有 challenge adapter，模態關閉時解除更新與 island。

不變條件：暖身的惰輪教學與唯一解、主盤 13:1 齒輪列、軸座距離尺、下層／上層隔離、曲柄／輸出軸角度、stage id `belfry-gears`、可選關卡進度與存檔格式維持原樣。未掛載 island callback 時沿用 legacy renderer；不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 parser／元件測試、bundle export contract、360px／1280px 遊戲瀏覽器中的暖身、齒輪配置、旋轉、通關、進度連續性與 legacy fallback。

下一步建議：評估「逆走鐘樓」鐘擺（`games/blood-mirror/puzzles/pendulum.js`）Vue island 的互動邊界，確認砝碼選取、復原和週期判定是否適合沿用既有 puzzle adapter。

## Phase 15 — Blood Mirror Belfry Pendulum Vue island

`PendulumPuzzle.vue` 接手砝碼切換控制與減少動態時的放開操作，沿用既有 lazy game bundle、鐘擺 SVG、樣式、stage id 和 modal。`pendulum.js` 保留砝碼狀態、長度／週期計算、提示、擺動與鐘聲動畫、通關判定、音效和完成回呼；Vue 只呈現經 parser 驗證的三枚固定配重 snapshot，並將 toggle／run typed actions 交回 legacy controller。沒有 island callback 時沿用原 DOM renderer。

不變條件：細桿與配重長度、平方根週期公式、唯一正解、提示層級、正常動態下等待新擺完成一趟才通關，以及 stage id `belfry-pendulum` 維持原樣。存檔、進度、路由、modal、CSP、lazy bundle entry 與 runtime dependencies 不變；不新增 reset 行為。驗證包含 snapshot parser／元件測試、bundle export contract，以及 360px／1280px 瀏覽器中的 lazy mount、配重切換、減少動態通關、進度連續性與 legacy fallback。

## Phase 16 — Blood Mirror Belfry Starwheel Vue island

`StarwheelPuzzle.vue` 接手 13 格 SVG 星輪、燭光／刻字顯示、撥爪跨格控制、敲鐘控制與狀態呈現，沿用既有 lazy game bundle、stage id、modal 與鐘樓 CSS。`starwheel.js` 保留 `numeralAt`／`playTolls`／`wheelSolved`／`solveAll` 解題規則、動畫時鐘與角度推進、每聲音效、錯誤與通關判定、提示狀態、完成回呼及 legacy renderer。Vue 只呈現經 parser 驗證的 transient snapshot，並將 candle／step／run typed actions 交回 legacy；legacy 透過既有 island adapter 推送鐘錘動畫快照。

不變條件：13 格與紅寶石位置、燭光下的刻字與碑文、每聲跨格設定、錯誤時停在第一個失誤刻度、唯一解與第十三聲回到紅寶石、Hints／音效／stage id `belfry-wheel`、可選關卡進度和存檔格式維持原樣。沒有 island callback 時沿用既有 DOM renderer；不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 snapshot parser／元件測試、bundle export contract、既有 puzzle-rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、刻字、錯誤敲鐘、解謎、進度連續性、fallback 與水平溢位。

下一步建議：評估「稜鏡舞廳」第一道濾鏡關（`games/blood-mirror/puzzles/prism.js`、stage `prism-rays`）是否適合沿用同一 typed snapshot／action adapter，先確認動畫與多階段狀態邊界再核准切片。

## Phase 17 — Blood Mirror Prism Rays Vue island

`PrismRaysPuzzle.vue` 接手 `prism-rays` 的 7×5 光路盤、白光 emitter、紅色 filter、面具 target、三面鏡、光束與狀態呈現，沿用既有 lazy game bundle、stage id、modal 與稜鏡 CSS。`prism.js` 保留 `trace`／`solved`／`litCount` 規則、鏡面狀態、提示、音效、完成判定、進度 callback 與 legacy renderer；Vue 只呈現 parser 驗證的 transient snapshot，並將鏡面 flip typed action 交回 legacy controller。

不變條件：白光經紅色濾鏡後只留下紅光、單一目標須精確收到紅光、解法仍由原 puzzle engine 判定、stage id `prism-rays`、Hints／音效／可選關卡進度和存檔格式維持原樣。沒有 island callback 時沿用既有 DOM renderer；不新增 reset、route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 snapshot parser／元件測試、bundle export contract、既有 prism rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、鍵盤翻鏡、通關與 legacy fallback；全域 Impact Graph 仍不完整，本切片消費者僅依手動追查。

下一步建議：評估 `prism-blend` 合光水晶 Vue island 的 snapshot 邊界，特別確認水晶收光／再發射是否能由單一靜態場景加上既有 beam trace 呈現。

## Phase 18 — Blood Mirror Prism Blend Vue island

`PrismBlendPuzzle.vue` 接手 `prism-blend` 的 7×5 光路盤、紅／綠兩個 emitter、合光水晶、黃色面具、四面鏡與光束呈現，沿用既有 lazy game bundle、stage id、modal、稜鏡素材與 CSS。單一 snapshot 同時呈現水晶收到的色彩、是否合光，以及 legacy `trace` 產生的所有 beam segments；水晶不在 Vue 內自行模擬或推進。`prism.js` 保留 `trace`／`solved`／`litCount` 規則、鏡面狀態、提示、音效、完成判定、進度 callback 與 legacy renderer，Vue 只呈現 parser 驗證的 transient snapshot，並將鏡面 flip typed action 交回 legacy controller。

不變條件：紅光與綠光須同時進入水晶才會合成黃色光、唯一目標仍須精確收到黃光、stage id `prism-blend`、Hints／音效／可選關卡進度和存檔格式維持原樣。沒有 island callback 時沿用既有 DOM renderer；不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 snapshot parser／元件測試、bundle export contract、既有 prism rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、兩色收光與再發射、鏡面解謎、進度連續性、fallback 與水平溢位；全域 Impact Graph 仍不完整，本切片消費者依手動追查。

下一步建議：評估 `prism-ballroom` 舞廳階段的 Vue island 邊界，先確認多目標、合光水晶與可移動舞者 blocker 能否以同一份靜態場景與 legacy beam trace snapshot 呈現。

## Phase 19 — Blood Mirror Prism Ballroom Vue island

`PrismBallroomPuzzle.vue` 接手 `prism-ballroom` 的 9×7 光路盤、三個 emitter、紅色 filter、合光水晶、三個彩色面具、七面鏡、兩位可移動舞者、光束與狀態呈現，沿用既有 lazy game bundle、stage id、modal、稜鏡素材與 CSS。Vue 僅呈現經 `parsePrismBallroomSnapshot` 驗證的 transient `trace` snapshot，並把 typed mirror flip／dancer move actions 交回 legacy controller。`prism.js` 保留 `trace`／`solved`／`litCount` 規則、鏡面／舞者狀態、提示、音效、完成判定、進度 callback 與 legacy renderer。

不變條件：紅、藍、黃三個目標必須各自精確收到所需顏色；filter、水晶與舞者阻擋仍由既有引擎計算；stage id `prism-ballroom`、Hints／音效／可選關卡進度和存檔格式維持原樣。沒有 island callback 時沿用既有 DOM renderer；不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 snapshot parser／元件測試、bundle export contract、既有 prism rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、翻鏡／移動舞者、通關、進度連續性、legacy fallback 與水平溢位。全域 Impact Graph 仍不完整，本切片 caller／consumer 僅依核准範圍手動追查。

### Phase 20 — Blood Mirror Apothecary Testimony Vue island

`ApothecaryTestimonyPuzzle.vue` 接手 `apothecary-testimony` 的七張學徒卡、鏡像模式、劃掉／指認控制與狀態呈現，沿用既有 lazy game bundle、stage id、modal 與 `.apo-*` 樣式。`apothecary.js` 保留 `conflicts`／`firstConflict` 謎題規則、矛盾提示、Hints、音效、完成判定、進度 callback 與 legacy renderer；Vue 僅呈現 parser 驗證的 transient snapshot，並將鏡像切換、劃掉與指認 typed actions 交回 legacy controller。

不變條件：只有甘松拿著毒蘋果時，除持有者外六人的證詞都成立；反寫模式、矛盾提示、stage id `apothecary-testimony`、Hints／音效／可選關卡進度與存檔格式維持原樣。沒有 island callback 時沿用既有 DOM renderer；不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 snapshot parser／元件測試、bundle export contract、既有 testimony rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、鏡像模式、劃掉／錯誤指認、通關、fallback 與水平溢位。全域 Impact Graph 仍不完整，本切片 caller／consumer 依核准範圍手動追查。

### Phase 21 — Blood Mirror Apothecary Vessels Vue island

`ApothecaryVesselsPuzzle.vue` 接手 `apothecary-vessels` 的三杯 SVG 盤面、單向管線、倒液／復原／重來按鈕、步數與狀態呈現，沿用既有 lazy game bundle、stage id、modal 與 `.apo-*` 樣式。`apothecary.js` 保留倒液與合法操作規則、undo history、提示、音效、完成判定、進度 callback 與 legacy renderer；Vue 只呈現 parser 驗證的 transient snapshot，並將 typed pour／undo／restart actions 交回 legacy controller。

不變條件：容量仍為 A=8、B=5、C=3，初始狀態 `[8,0,0]`，管線方向 A→C→B→A，倒液直到來源空或目的杯滿，目標為 B=4；stage id、Hints／音效／可選關卡進度與存檔格式維持原樣。沒有 island callback 時沿用既有 DOM renderer；不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 snapshot parser／元件測試、bundle export contract、既有 vessel rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、倒液／復原／重來、通關、fallback 與水平溢位。全域 Impact Graph 仍不完整，本切片 caller／consumer 依核准範圍手動追查。

## Phase 22 — Blood Mirror Apothecary Mixing Vue island

`ApothecaryMixingPuzzle.vue` 接手 `apothecary-mixing` 的配方色／混色 swatches、手持鏡切換、紅黃藍色精滴數與回饋呈現，沿用既有 lazy game bundle、stage id、modal 與 `.apo-*` 樣式。`apothecary.js` 保留 `BASE`／`TARGET`／`mixColor`／`colorOk` 色彩規則、提示、音效、完成判定、進度 callback 與 legacy renderer；Vue 只呈現 parser 驗證的 transient snapshot，並將滴數變更與手持鏡切換 typed actions 交回 legacy controller。

不變條件：每種色精仍可調整 0–4 滴；配方、混色與容差判定完全沿用既有規則；stage id `apothecary-mixing`、Hints／音效／可選關卡進度和存檔格式維持原樣。沒有 island callback 時沿用既有 DOM renderer；不新增 route、bundle entry、runtime dependency、storage、network 或 CSP 例外。驗證包含 snapshot parser／元件測試、bundle export contract、既有 apothecary rule tests，以及 360px／1280px 瀏覽器中的 lazy mount、鏡子切換、滴數界限、通關、fallback 與水平溢位。全域 Impact Graph 仍不完整，本切片 caller／consumer 依核准範圍手動追查。

下一步建議：評估 E4 `gallery-align` 的拖曳疊圖 stage，先盤點 legacy 互動狀態、鍵盤替代操作與拖曳座標模型，再決定 Vue island 邊界。

## Phase 23 — Blood Mirror Gallery Align Vue island

`GalleryAlignPuzzle.vue` 接手 E4 `gallery-align` 的四格疊圖盤面、物件標記／紅線、放大／翻面工具、指標拖曳、方向鍵移動與免拖曳清單放置。沿用現有 lazy game bundle、stage id、modal 和 `.gal-*` 樣式。`puzzles/gallery.js` 仍負責候選物件搜尋、座標吸附、`judgeMove` 判定、提示、音效、完成與進度 callback；Vue 只呈現經 `parseGalleryAlignSnapshot` 驗證的 transient snapshot，並將 typed actions 回交 legacy controller。沒有 island callback 時使用原 DOM renderer。

不變條件：月亮與提燈的兩條線仍由既有規則決定；放大、翻面、方向鍵步進、tray 拖出、標記及清單放置維持原有語意；`gallery-merge` 維持 legacy renderer。stage id、Hints／音效／進度、存檔格式、路由、CSP 與 runtime dependencies 不變。驗證包含 snapshot parser／元件測試、bundle export contract、既有 E4 rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、拖曳／清單／鍵盤操作、完成、fallback、進度連續性與水平溢位。AIPS traversal 未映射 island seed；caller／consumer 依本次核准範圍人工核對，全域 Impact Graph coverage 仍 incomplete。

下一步建議：評估 E4 `gallery-merge` 階段的翻面門對位與四格紅線排序，盤點排序規則、鍵盤操作與 stage 間既有連線狀態，再決定 Vue island 邊界。

## Phase 24 — Blood Mirror Gallery Merge Vue island

`GalleryMergePuzzle.vue` 接手 E4 `gallery-merge` 的四格畫面、鏡廊／舞廳門把方向、翻面控制、接門操作與紅線排序。沿用既有 lazy game bundle、stage id、modal 與 `.gal-*` 樣式。`puzzles/gallery.js` 保留 `judgeMove`／`isChain` 規則、錯誤間隙提示、音效、完成計時、進度 callback 與 legacy renderer；Vue 只呈現經 `parseGalleryMergeSnapshot` 驗證的 transient snapshot，並將 typed flip／place／order actions 交回 legacy controller。

不變條件：`gallery-align` 完成前 `gallery-merge` 仍不可進入；合併階段開場仍帶有月亮與提燈兩條既有連線，門只接受一側翻面後的 `A.door`／`D.door` 對位；排序仍由 `isChain` 接受 `B-A-D-C` 或反向 `C-D-A-B`。stage id、Hints／音效／完成與可選關卡進度、存檔格式、路由、CSP、runtime dependencies 及無 island callback 時的 DOM fallback 維持原樣。驗證包含 snapshot parser／元件測試、bundle export contract、既有 E4 rule 測試，以及 360px／1280px 瀏覽器中的 lazy mount、錯誤／正確門位、順序／反向排序、錯誤排序、完成、fallback、進度連續性與水平溢位。AIPS traversal 未映射 island seed；本切片 caller／consumer 依核准範圍人工追查，全域 Impact Graph coverage 仍 incomplete。

下一步建議：評估 E5 `box-thread` 四格排序 Vue island，確認它沿用 E4 畫格與紅線規則的程度、stage／物品前置條件和重玩行為，再決定是否重用 Gallery Merge 的呈現邊界。
