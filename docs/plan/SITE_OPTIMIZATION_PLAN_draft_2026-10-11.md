# LUCAS LAB 網站優化計畫

日期：2026-10-11｜狀態：規劃完成，尚未實作。

## 範圍與決策紀錄

本計畫處理 LUCAS LAB 網站本體：效能、快取與安全、閱讀體驗、離線閱讀、分享與 SEO、內容活躍度、流量統計和維護性。血色魔鏡的玩法、劇情與遊戲 UI 依 [血色魔鏡優化計畫](BLOOD_MIRROR_OPTIMIZATION_PLAN.md) 處理；本計畫只涵蓋會影響全站的遊戲素材重量、快取與 CSP。

使用者已確認的決策（2026-10-11）：

| 議題 | 決策 | 對計畫的影響 |
| --- | --- | --- |
| 自訂網域 | 不使用 | 維持 `https://lucas-lab.owl3918.workers.dev/`；`SITE_URL` 預設值不變，不規劃轉址 |
| 流量統計 | 可以加入不使用 cookie 的統計 | 採 Cloudflare Web Analytics，並同步更新隱私說明與 CSP（項目 09） |
| 遊戲大型 PNG | 只發布壓縮版 | 原檔保留在 repo 中不發布的位置，只有 WebP 進入 `dist/`（項目 01） |
| PWA 離線閱讀 | 要做 | 新增 manifest、Service Worker 與離線保存書籍功能（項目 08） |

不變的原則：零執行期依賴、Node 標準庫靜態生成、不修改小說原稿或讓 SHA-256 檢查失效、`dist/` 一律由建置產生、Cloudflare Workers Builds 是唯一正式部署來源。

## 現況基線（2026-10-10 本機建置）

| 項目 | 數據 | 問題 |
| --- | --- | --- |
| 建置輸出 | 145 個 HTML，`dist/` 約 24 MB，其中 `dist/games/` 約 21 MB | 重量集中在遊戲素材 |
| 遊戲 PNG | `endings/dawn.png` 2.6 MB；`concepts/design-board-1/3/4.png` 各約 2.5–2.7 MB | 約 10 MB 未壓縮，在 `gallery.js`、`concept-art.js` 被直接引用 |
| 遊戲音樂 | 9 首單曲各約 600–700 KB，`highlights.mp3` 2.2 MB；`soundtrack.js` 建立 `Audio` 時設 `preload='auto'` | 需要確認是否一次預載多首 |
| 首頁主視覺 | `moonlit-castle.webp` 1536×1024、203 KB，沒有 `srcset` | 手機也下載桌機尺寸，影響首屏載入（LCP） |
| 快取與標頭 | 沒有 `_headers`；`style.css`、`app.js` 檔名不含版本 | 無法長期快取；沒有 CSP 等安全標頭 |
| Inline 程式 | 全站沒有 inline `<script>`；遊戲 `innerHTML` 模板含 `style="left:..%;top:..%"` 與 `conceptStyle()` | 全站可以用嚴格的 `script-src`；遊戲頁的 `style-src` 需要例外或重構 |
| 分享與 SEO | 書籍頁、遊戲介紹頁有 og:image；首頁、藝廊等沒有；全站沒有 `twitter:card`、JSON-LD | 首頁分享到社群沒有預覽圖 |
| 閱讀器 | localStorage 只存主題與字級 | 116 個閱讀單元沒有「繼續閱讀」與進度 |
| 內容 | 日誌 1 篇；藝廊 6 個程式繪製概念位置 | 網站活躍度不足 |
| 隱私說明 | `/legal/` 寫「本站未加入第三方分析或會員系統」 | 加入統計時必須同步修改 |
| 文件 | `IMPLEMENTATION.md` 仍寫「藝廊：CSS/符號佔位」，「後續階段」已過時 | 文件與現況不一致 |
| 程式結構 | `scripts/build.cjs` 112 行，但單行最長 1645 字元 | 難以閱讀與檢視 diff |

尚無真實使用者流量資料；項目 09 上線後才有基線，之後的優先順序可依實際數據調整。

## 優先級

- **P0**：效能、快取、安全的基礎，成本低且可量化。
- **P1**：閱讀留存、離線閱讀、分享、統計，是網站的核心價值。
- **P2**：內容活躍度與維護性。
- **持續**：每次更新都要遵守的驗收門檻。

## A. 效能與上線基礎（P0）

### 01｜遊戲素材只發布壓縮版

- **目的：**移除約 10 MB 的 PNG，減少遊戲路由重量與快取負擔。
- **主要工作：**
  - 把 `design-board-1/3/4.png`、`dawn.png` 移到不會被複製的原始素材目錄（建議 `games/blood-mirror/source-art/`，並在建置的複製邏輯中明確排除），原檔繼續版本控制。
  - 一次性轉出 WebP（必要時另出 AVIF），保留 1536×1024 原比例；完整版目標每張 ≤ 400 KB，藝廊縮圖另出 ≤ 80 KB 的小圖，用 `srcset` 選圖。轉檔工具（例如 `cwebp`）只在本機使用，不進入建置流程或依賴。
  - 將 `gallery.js`、`concept-art.js` 的 `src`／`preferredSrc` 改為 WebP；`dawn.svg` 備援維持不變。
  - 檢查 `soundtrack.js` 的 `preload='auto'`：只預載目前場景的曲目，其他曲目在切換場景時才載入；`highlights.mp3` 只在藝廊試聽時載入（試聽播放器已是 `preload="none"`）。
  - 更新 `MEDIA_ASSETS.md` 與 `BLOOD_MIRROR_VISUAL_PROFILE.json`，記錄素材路徑、尺寸、大小與 hash，以及原檔位置。
- **完成標準：**
  - `dist/` 中沒有任何 `.png` 遊戲素材；`dist/games/` 從約 21 MB 降到 11 MB 以下。
  - 遊戲首次進入只下載目前場景所需的一首曲目。
  - 藝廊、結局 CG 與概念展板在瀏覽器測試（`blood-mirror-gallery.browser.cjs`）中可正常解碼。

### 02｜素材預算寫進檢查

- **目的：**避免日後再把大型未壓縮素材發布出去。
- **主要工作：**在 `scripts/check.cjs` 加入預算：單張點陣圖 ≤ 500 KB（封面維持既有 260／60 KB 預算）、`dist/` 不得出現 `.png` 點陣素材（favicon 與 PWA 圖示除外）、單一音檔 ≤ 2.5 MB，並輸出 `dist/` 總重量摘要。
- **完成標準：**故意放入超標素材時 `npm run check` 會失敗，並指出檔名與大小。

### 03｜首頁主視覺多尺寸

- **目的：**縮短手機首屏載入時間。
- **主要工作：**產生 768、1280、1536px 三種 WebP，`<img>` 加入 `srcset`／`sizes`，保留 `fetchpriority="high"`，並加 `<link rel="preload" as="image" imagesrcset imagesizes>`。更新 `COVER_ASSETS.json`。
- **完成標準：**390px 寬的手機只下載 ≤ 80 KB 的主視覺；1440px 桌機畫質不變；`visual-audit.cjs` 的城堡載入檢查通過。

### 04｜檔名版本號與快取標頭

- **目的：**讓重複造訪由快取命中，同時確保更新後不會讀到舊檔。
- **主要工作：**
  - 建置時依內容 hash 為 `style.css`、`app.js` 以及遊戲 CSS/JS 產生帶版本的檔名（例如 `style.3f9a1c.css`），HTML 引用改為輸出後的檔名；或在檔名不變的情況下加 `?v=<hash>`。建議改檔名，快取語意較清楚。
  - 建置輸出 `dist/_headers`：
    - 帶 hash 的 CSS/JS 與 `/assets/images/*`、遊戲素材：`Cache-Control: public, max-age=31536000, immutable`。圖片檔名目前不含 hash，替換圖片時必須改檔名，並在 `check.cjs` 驗證。
    - HTML、`sitemap.xml`、`_build.json`、`sw.js`、`manifest.webmanifest`：`Cache-Control: public, max-age=0, must-revalidate`。
  - `serve.cjs` 本機預覽不需要模擬這些標頭。
- **完成標準：**第二次造訪時 CSS、JS、圖片都由快取取得；部署新版後 HTML 立即引用新檔；`smoke:live` 驗證主要檔案的 `Cache-Control`。

### 05｜安全標頭與 CSP

- **目的：**降低注入與嵌入的風險，同時不影響現有功能。
- **主要工作：**
  - 全站標頭：`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy`（關閉相機、麥克風、定位等未使用的權限）、`X-Frame-Options: DENY`，或 CSP 的 `frame-ancestors 'none'`。
  - 全站 CSP 起點：`default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; img-src 'self' data:; style-src 'self'; font-src 'self'; media-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`。
  - 遊戲遊玩路由 `/games/blood-mirror/play/*`：遊戲 `innerHTML` 模板含 `style=""` 屬性，第一階段該路由的 `style-src` 加 `'unsafe-inline'`；`script-src` 仍維持嚴格。日後把熱點座標與概念樣式改成在 JS 中設定 `element.style`（CSSOM 寫入不受 CSP 的 inline style 限制），即可移除例外。
  - 上線前先用 `Content-Security-Policy-Report-Only` 在 visual CI 的 Chromium 中跑過全站與遊戲，蒐集違規後再改成正式強制。
- **完成標準：**visual CI 與全部遊戲 browser 測試沒有 CSP 違規；`smoke:live` 驗證標頭存在；外部安全標頭檢測沒有重大缺漏。

## B. 閱讀體驗與留存（P1）

### 06｜繼續閱讀與閱讀進度

- **目的：**讓讀者在長篇之間中斷後能夠回到原處。
- **主要工作：**
  - 新增獨立的 localStorage key（例如 `lucas-lab-progress-v1`），記錄每本書最後章節、段落位置（以段落索引或捲動比例為準）、各章已讀狀態與更新時間；不改動既有偏好的 key 與格式，讀取失敗時忽略。
  - 首頁與故事館加入「繼續閱讀」區塊（沒有紀錄時不顯示）；書籍頁顯示「讀到第 N 章」與章節已讀標記。
  - 進入章節時如有位置紀錄，顯示「回到上次位置」提示，不自動跳轉，避免干擾。
  - 隱私說明列出新增的本機資料，並提供「清除閱讀紀錄」按鈕。
- **完成標準：**讀到一半關閉，回到首頁可一鍵回到原段落；無痕模式或 storage 被封鎖時頁面照常運作；`visual-audit.cjs` 加入進度流程測試。

### 07｜閱讀器細節

- **目的：**降低長篇閱讀的操作成本。
- **主要工作：**
  - 鍵盤 ← → 切換上下章（輸入框或選單取得焦點時不觸發）。
  - 每章顯示預估閱讀時間（依中文字數，建置時計算）。
  - 章末加入「下一章」「回目錄」大按鈕；有對應遊戲的作品加入遊戲導流。
  - 內容警示確認後依作品記住選擇，不重複顯示。
- **完成標準：**鍵盤、觸控、螢幕閱讀器都能操作；axe 檢查通過；既有閱讀偏好格式相容。

### 08｜PWA 與離線閱讀

- **目的：**可以加入主畫面，在沒有網路時閱讀已保存的書。
- **主要工作：**
  - **Manifest：**`manifest.webmanifest`，包含名稱、`theme_color #080e16`、`display: standalone`、`start_url` 與 `scope`（支援 `BASE_PATH`），以及由 `favicon.svg` 產出的 192／512px 與 maskable 圖示（PNG 例外寫進項目 02 的預算規則）。iOS 另加 `apple-touch-icon`。
  - **Service Worker（`sw.js`，放在網站根目錄，零依賴手寫）：**
    - 快取版本使用建置 commit 或內容 hash，啟用時刪除舊版快取。
    - 預快取：首頁、離線備援頁 `/offline/`、帶 hash 的 CSS/JS、favicon 與圖示。
    - HTML 導覽採 network-first，失敗時讀快取，再失敗則顯示 `/offline/`。
    - 帶 hash 的靜態檔與圖片採 cache-first。
    - 讀過的章節自動放入「近期章節」快取，上限約 30 章，超過時移除最舊的。
    - 不快取 `_build.json`、`/search/` 的查詢結果與外站 Lucas Tools 連結。遊戲音樂與大型圖檔不進入自動快取，避免佔用空間；遊戲是否整包離線另行評估。
  - **離線保存整本書：**書籍頁加「離線保存」按鈕，依建置輸出的章節清單（例如 `/stories/<id>/offline.json`）抓取全部章節與封面；顯示進度、保存完成狀態與「移除離線版本」。使用 `navigator.storage.estimate()` 顯示空間，並嘗試 `persist()`。
  - **更新提示：**偵測到新版 Service Worker 時顯示「有新版本，重新整理」，不在閱讀中途強制重載。
  - **開發與測試：**`serve.cjs` 本機預覽可註冊 SW（localhost 允許）；提供關閉 SW 的方式（例如網址參數或建置旗標），避免開發時讀到舊快取。
  - 隱私說明加入「離線保存使用瀏覽器快取，可在本站或瀏覽器設定中移除」。
- **完成標準：**
  - Chromium 測試：保存一本書後切到離線，所有章節、封面、閱讀器偏好與進度可用；未保存的頁面顯示離線頁。
  - 部署新版後 SW 會更新，舊快取被清除；`smoke:live` 能取得 `sw.js`、manifest 與正確標頭。
  - Lighthouse 的 PWA installable 檢查通過；iOS Safari、Android Chrome 加入主畫面需要真機驗收（項目 14）。
- **風險：**快取失效錯誤會讓讀者看到舊版；以 network-first HTML、版本化快取與更新提示降低風險。項目 04 的檔名 hash 是前置條件。

## C. 分享、SEO 與統計（P1）

### 09｜Cloudflare Web Analytics（無 cookie）

- **目的：**取得真實的瀏覽、來源、裝置與 Core Web Vitals 數據，作為後續排序依據。
- **主要工作：**
  - **使用者操作：**在 Cloudflare Dashboard 為 `lucas-lab.owl3918.workers.dev` 建立 Web Analytics 網站並取得 site token。Workers Static Assets 不會自動注入，需要手動加入 beacon。token 本身是公開值，但仍由建置環境變數提供，不寫死在程式碼中。
  - 建置讀取環境變數（例如 `CF_ANALYTICS_TOKEN`）；有值才輸出 `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"..."}'>`，本機與 CI 預設不輸出。在 Cloudflare Workers Builds 設定該變數。
  - 這是全站唯一的外部腳本；項目 05 的 CSP 只對這兩個網域放行。Cloudflare 的 beacon 檔案沒有版本號，內容可能隨時更新，無法使用 SRI（`integrity`）；以 CSP 限定網域和 `defer` 載入來控制風險，並在文件中記錄這項取捨。
  - 確認搜尋詞不在網址中，或在統計前移除，避免搜尋內容被送出；`noindex` 頁照常統計但不影響 SEO。
  - 修改 `/legal/` 的隱私段落：說明使用 Cloudflare Web Analytics、不使用 cookie、不建立跨站識別、蒐集的資料類型，以及本機 localStorage／離線快取的用途。同時更新 README 中「沒有外部服務依賴」的相關描述。
  - `check.cjs` 驗證：有 token 時 beacon 只出現一次且網域正確；沒有 token 時完全不輸出。
- **完成標準：**上線一週後 Dashboard 有數據；隱私說明與實際行為一致；沒有 CSP 違規。

### 10｜分享與結構化資料

- **目的：**改善社群分享預覽與搜尋結果呈現。
- **主要工作：**
  - 以城堡主視覺製作 1200×630 的站台分享圖（WebP 與 JPEG 各一張；部分社群平台不支援 WebP）；首頁、工具、藝廊、遊戲館、日誌、關於使用站台圖，書籍與遊戲維持各自封面。
  - 全站加 `twitter:card=summary_large_image`、`og:site_name`、`og:locale=zh_TW`。
  - JSON-LD：首頁 `WebSite`、書籍頁 `Book`（作者、封面、內容分級提示）、章節 `Chapter` 加 `BreadcrumbList`、遊戲介紹頁 `VideoGame`。輸出為外部或 `type="application/ld+json"` 區塊。JSON-LD 不是可執行腳本，不受 `script-src` 影響。
  - `check.cjs` 驗證每個可索引頁面都有 canonical、description、og:image（且檔案存在），JSON-LD 可被解析。
- **完成標準：**社群分享偵錯工具能顯示預覽圖；Google Rich Results 測試沒有錯誤。

## D. 內容與活躍度（P2）

### 11｜搜尋強化

- **目的：**讓讀者可以搜尋到章節，而不只是作品。
- **主要工作：**建置時輸出章節索引 JSON（作品、章節標題、網址；不含全文以控制大小），搜尋頁在需要時才載入；中文採子字串與正規化比對，結果分組顯示作品、章節、工具、遊戲。
- **完成標準：**搜尋章節標題關鍵字能直接開啟該章；索引 ≤ 50 KB；搜尋詞不送出到後端。

### 12｜日誌、藝廊與首頁動態

- **主要工作：**
  - 依 commit 歷史補 4–6 篇開發日誌（小說上架、封面系列、UI 系統、遊戲整合、本次優化），日誌頁加 Atom feed（`/journal/feed.xml`）。
  - 藝廊：6 個程式繪製位置改用已有的遊戲場景 WebP 與項目 01 壓縮後的結局 CG／概念展板，或明確歸類為「世界概念」；只展示已確認授權的原創素材。
  - 首頁加「最新更新」，從 catalog 與日誌日期自動產生。
- **完成標準：**feed 通過驗證；藝廊每個項目都有實際圖片或清楚的分類標示；首頁更新區不需要手動維護。

## E. 維護性與品質門檻（P2／持續）

### 13｜`build.cjs` 模組化重構

- **主要工作：**依頁面種類拆成 `scripts/pages/`（home、stories、reader、games、catalog pages、meta／sitemap／headers），超長單行改為可讀格式，維持 CommonJS 與零依賴。
- **完成標準：**重構前後 `dist/` 逐檔比對完全一致（除了可接受的格式差異）；`npm run check` 與 visual CI 通過。必須在功能穩定後的獨立 PR 進行，不和功能改動混在一起。

### 14｜效能預算與真機驗收

- **主要工作：**
  - `visual.yml` 暫時安裝 Lighthouse CI（不進入執行期依賴），在首頁、書籍頁、章節頁、遊戲頁的手機設定下設定門檻：LCP ≤ 2.5 s、CLS ≤ 0.1、首頁傳輸量 ≤ 500 KB、PWA installable。
  - 真機驗收清單：iOS Safari、Android Chrome 的閱讀器、離線保存、加入主畫面、遊戲音樂與觸控；結果記錄在本文件或日誌中。Chromium 模擬不能取代真機。
- **完成標準：**CI 會在預算超標時失敗；至少完成一次 iOS 與 Android 真機驗收紀錄。

### 15｜文件同步

- **主要工作：**更新 `IMPLEMENTATION.md`（藝廊現況、後續階段改為指向本計畫）、README（統計、PWA、標頭與素材規則）、`UI_COVER_PLAN.md` 的後續建議。
- **完成標準：**文件描述與實際網站行為一致，沒有過時的「佔位」或「無外部服務」說法。

## 執行順序與相依

| 批次 | 項目 | 相依與理由 |
| --- | --- | --- |
| 1 | 01 → 02 → 03 | 素材瘦身最容易量化；02 防止回退 |
| 2 | 04 → 05 | 04 的 hash 檔名是長期快取與 PWA 的前提；05 先用 Report-Only 再強制 |
| 3 | 09 → 10 | 09 的 CSP 放行依賴 05；統計越早上線，基線數據越早累積 |
| 4 | 06 → 07 → 08 | 08 會快取閱讀進度與章節，需要 04、06 先穩定 |
| 5 | 11、12 | 內容與搜尋，可以並行 |
| 6 | 13 → 14 → 15 | 重構放在功能穩定後；15 在每批結束時同步更新 |

每批獨立 PR，維持既有流程：`npm run check`、visual 與 axe CI、遊戲 browser 測試都通過；合併後由 Cloudflare 部署，再以 `EXPECTED_COMMIT=$(git rev-parse HEAD) npm run smoke:live` 驗證。

## 需要使用者處理的事項

- 項目 09：在 Cloudflare Dashboard 建立 Web Analytics 網站，並在 Workers Builds 設定 token 環境變數。
- 項目 14：提供 iOS 與 Android 真機驗收（或指定驗收人）。
- 項目 12：確認要放進藝廊的素材範圍，以及日誌要公開的內容。

## 實作紀錄（2026-10-11）

分支 `feat/site-optimization-2026-10-11`。草稿的現況基線寫於 2026-10-10 建置前，其中 `_headers`、CSP、JSON-LD、離線 Service Worker 與閱讀進度已由 `76e92ee` 實作；本次以該提交為基準，只補上仍缺的部分。

| 項目 | 結果 | 說明 |
| --- | --- | --- |
| 01 遊戲素材 | 完成 | 原 PNG 移到 `games/blood-mirror/source-art/`，不在建置複製範圍內；`check` 確認 dist 沒有非圖示的 PNG；`dist/games` 約 10.3 MB（上限 11 MB） |
| 02 素材預算 | 完成 | `check`：點陣圖 ≤ 500 KB、音檔 ≤ 2.5 MB、`dist/games` ≤ 11 MB，並輸出 dist 重量摘要 |
| 03 首頁主視覺 | 完成（尺寸偏離） | 沿用既有 640／1024／1536 px，未改為 768／1280；首頁加入 AVIF 的 `preload`（`imagesrcset`） |
| 04 快取與標頭 | 部分完成 | 新增 manifest、sitemap、`_build.json`、搜尋索引、feed 的 `must-revalidate`。圖片未改 `immutable`，因為檔名未含 hash |
| 05 CSP | 完成（未走 Report-Only） | 移除 `style-src 'unsafe-inline'`，站內無 inline style；瀏覽器測試以強制模式驗證無違規，未先以 Report-Only 觀察 |
| 06 繼續閱讀 | 完成 | 章節頁「回到上次位置」（需使用者點選）；書籍頁顯示讀到哪一章與已讀數；隱私頁可清除閱讀紀錄 |
| 07 閱讀器 | 完成 | 章末遊戲導流；「回到章節目錄」；內容提示確認後記住並收合 |
| 08 PWA | 完成 | PNG 圖示（192／512／maskable／180）；precache；離線頁 `/offline/`；近期章節上限 30；「離線保存全書」；更新提示不強制重載 |
| 09 流量統計 | 完成（待你設定 token） | `CF_ANALYTICS_TOKEN` 有值才輸出 beacon；CSP 只放行 `static.cloudflareinsights.com` 與 `cloudflareinsights.com`；隱私說明依設定切換 |
| 10 分享與 SEO | 完成 | `og:locale`、`apple-touch-icon`；`check` 驗證所有可索引頁的 canonical、description、og:image 與 JSON-LD |
| 11 搜尋 | 完成 | 正規化（NFKC、忽略大小寫與空白）；結果依故事、遊戲、作品、工具分組；查詢不寫入網址；索引 < 50 KB |
| 12 日誌與首頁 | 完成 | Atom feed `/journal/feed.xml`；首頁「最新更新」由日誌日期自動產生；藝廊佔位維持「構思中」標示 |
| 13 build 模組化 | 已於 `76e92ee` 完成 | 本次未再改動 |
| 14 效能預算與真機 | 部分完成 | 預算沿用 Playwright（未引入 Lighthouse）；真機驗收需要你執行 |
| 15 文件同步 | 部分完成 | README 已更新。`IMPLEMENTATION.md` 有未提交的使用者修改，未動 |

驗證：`npm run check`、`test:site`（15 項，含離線、閱讀、搜尋、CSP）、`test:perf`、`test:visual`（axe）、Blood Mirror 全部瀏覽器測試與 37 項單元測試，均在本機通過。

離線測試注意：`context.setOffline` 不會阻擋 Service Worker 的請求，因此測試改為實際停止本機伺服器。

### 需要你處理

- 項目 09：在 Cloudflare Dashboard 建立 Web Analytics 網站，並在 Workers Builds 設定 `CF_ANALYTICS_TOKEN`。
- 項目 14：iOS Safari 與 Android Chrome 真機驗收（加入主畫面、離線保存、遊戲音樂與觸控）。
- 項目 15：`docs/IMPLEMENTATION.md` 目前有未提交的修改（移除了「站點優化」段落），是否保留請你決定。
- SW 更新提示（banner）目前只在真實部署的兩個版本之間才會出現，本機測試未覆蓋。

### 第二輪核對（2026-10-11）

逐項對照程式碼與建置輸出後，剩餘事項如下。`npm run check` 本機通過（37 項單元測試、143 頁、所有站點檢查）。

| 項目 | 狀態 | 仍未完成的部分與原因 |
| --- | --- | --- |
| 04 快取 | 部分完成 | `/static/<hash>/` 指紋 CSS／JS 已存在並以 `immutable` 快取。圖片（`/assets/images/*`）仍為 7 天快取，未改 `immutable`：檔名不含內容 hash，替換圖片後舊版會在快取中留到一年。改為 `immutable` 需要先建立圖片 hash 清單與檢查，待決定是否接受這個工作量 |
| 15 文件 | 部分完成 | 本輪已修正 `UI_COVER_PLAN.md` 的後續建議（閱讀進度已完成，改列真機驗收）。`docs/IMPLEMENTATION.md` 仍寫「藝廊：CSS/符號視覺佔位」與「後續階段」，但該檔有使用者未提交的修改，本輪未動，需使用者決定是否保留 |
| 14 預算 | 部分完成 | 預算以 Playwright 實作，未引入 Lighthouse（已記錄的偏離）。iOS Safari、Android Chrome 真機驗收需要使用者執行 |
| 09 統計 | 待使用者 | 需在 Cloudflare Dashboard 建立 Web Analytics 網站，並於 Workers Builds 設定 `CF_ANALYTICS_TOKEN` |
| SW banner | 測試缺口 | 本機無法同時提供兩個已部署版本；需另行設計測試方式 |

未在本輪處理的其他事項：`docs/plan/DOCS_CLEANUP_PLAN.md` 的兩個舊 worktree 移除（權限檢查拒絕，需使用者決定）；Blood Mirror 的 M2 項目 13、14、16（正式美術與配樂，需要素材）、18 與 M6（實機）、20（模組化，計畫明定等分支需求確定後再做）、21（真人試玩）。這些都需要使用者提供資料、素材或裝置，無法由程式碼單獨完成。
