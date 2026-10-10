# 網站優化計畫與執行紀錄

日期：2026-10-10｜狀態：已實作，待 PR 合併與 Cloudflare 上線驗證

本文件記錄 LUCAS LAB 網站的第一輪系統性優化：效能與快取、安全標頭、搜尋引擎與分享、閱讀體驗、離線閱讀與程式架構。每一項都對應實際程式、測試與量測數據；不含尚未決定的商業或隱私選擇（見末節）。

## 一、目標與原則

- **先量測，再優化**：效能預算以實際量測值加約 20% 餘裕設定，不先假設目標。
- **不改動正文與遊戲邏輯**：原稿 SHA-256 檢查持續有效；遊戲僅替換素材檔案，不修改程式。
- **零執行期依賴**：維持原生 JavaScript 與 Node 標準庫，不引入框架或分析服務。
- **每項改動都有自動化驗證**：`npm run check`、瀏覽器驗收與效能預算三層把關。

## 二、量測結果（改善前後）

同一支量測腳本（Chromium、初始載入後 1 秒、無快取），數值為傳輸位元組總和（KB）。

| 路由 | 390px 前 → 後 | 1440px 前 → 後 | 說明 |
| --- | ---: | ---: | --- |
| 首頁 `/` | 289 → **111** | 328 → **229** | 主視覺改用 640/1024px AVIF/WebP 候選 |
| 故事頁 | 59 → 69 | 59 → 69 | 新增 Book 結構化資料與繼續閱讀，共用 CSS/JS 增加約 10 KB |
| 章節頁 | 37 → 47 | 37 → 47 | 新增閱讀時間、Article 結構化資料與下一章卡片 |
| 搜尋頁 | 266 → 275 | 266 → 275 | 章節索引只在首次輸入時下載，未輸入時不下載 |
| 遊戲頁 | 2224 → **1292** | 2224 → **1292** | 場景 WebP 重新壓縮（約減少 45%） |

LCP 全部低於 100 ms，CLS 為 0（遊戲頁 0.0003）。改善最明顯的是首頁與遊戲頁；故事與章節頁的小幅增加是新功能的代價，已記錄於此。

**誠實說明**：量測使用本機 Chromium，不等同真機或 Cloudflare 邊緣網路的表現；第一次 LCP 的絕對值僅供相對比較。

## 三、各項實作對應

對應第一輪建議的 14 項。

### P0 效能與快取

1. **圖片瘦身**
   - 首頁主視覺產生 640、1024、1536px 三種尺寸，各有 AVIF 與 WebP（1536 AVIF 約 95 KB，原 WebP 208 KB）。
   - 分享用預設圖 `og-default.jpg` 1200×630，127 KB。
   - 遊戲 5 張場景與白雪立繪重新壓縮（場景 q72、立繪 q80），尺寸維持不變。
   - 遊戲藝廊的 3 張概念展板改指向 WebP；原始 PNG 保留在 repo（依 `MEDIA_ASSETS.md` 的來源政策），但**不發布**到 dist。
   - `highlights.mp3` 雖然只出現在藝廊的配樂選單中，但確實被引用，因此保留。配樂以 `new Audio()` 於播放時才建立，PERF 測試會驗證遊戲頁初始載入不下載任何 mp3。
2. **資產指紋與快取標頭**
   - 站台 CSS/JS 產生內容指紋副本，放在 `static/<hash>/`，頁面引用指紋路徑，並以 `immutable`、一年快取。
   - 未指紋化的 `assets/style.css`、`assets/app.js` 與 `sw.js` 設為 `no-cache`，部署後不會被舊檔遮蔽。
   - 圖片 `assets/images/*` 一週快取；遊戲的 `play/assets/*` 一週快取。
   - **偏離原計畫**：遊戲的 ES 模組與 CSS 未指紋化，因為模組之間以相對路徑 `import` 互相引用，改名會破壞遊戲；它們維持 `no-cache` 的預設行為。Cloudflare `_headers` 只支援結尾的萬用字元，因此採用目錄式指紋而非檔名內嵌。
3. **效能預算（以 Playwright 取代 Lighthouse）**
   - 新增 `scripts/perf-budget.browser.cjs`，量測傳輸量、請求數、LCP、CLS，並在 CI 執行。
   - 預算值：首頁 280 KB、故事頁 85 KB、章節頁 60 KB、搜尋頁 330 KB、遊戲頁 1550 KB；請求數與 CLS ≤ 0.1 亦有上限。
   - **偏離原計畫**：未引入 Lighthouse 依賴，改用既有的 Playwright 工具鏈，避免在 CI 增加另一套執行環境。

### P1 SEO、分享與安全

4. **中繼資料**：所有頁面有預設分享圖、`twitter:card`、`og:site_name`；故事頁 `og:type=book`，章節與日誌為 `article`；章節 description 取自該章開頭段落。
5. **結構化資料（JSON-LD）**：首頁 `WebSite`；故事頁 `Book`；章節 `Article`（含 `isPartOf`、`position`、`wordCount`）；遊戲頁 `VideoGame`；所有詳情頁含 `BreadcrumbList`。JSON 中的 `<` 會被跳脫，避免注入。
6. **sitemap 的 lastmod**：由 git 歷史取得各路由的最後修改日。無 git 歷史（例如下載的 zip）時省略該欄位。**限制**：CI 使用淺層複製（depth 1），日期會退化為 HEAD 的 commit 日期。
7. **安全標頭**：`_headers` 輸出 CSP、`X-Content-Type-Options`、`X-Frame-Options: DENY`、`Referrer-Policy`、`Permissions-Policy`。
   - 站台不含內嵌腳本，`script-src 'self'`。
   - **限制**：`style-src` 含 `'unsafe-inline'`，因為模板與遊戲使用 `style` 屬性（例如密室的動態樣式）。消除它需要把所有內嵌樣式改為類別，屬於後續工作。
   - `serve.cjs` 會依 `_headers` 套用同樣的標頭，讓瀏覽器測試能實際抓到 CSP 違規。
   - `smoke:live` 新增檢查：正式站必須回傳 CSP。

### P1 閱讀體驗

8. **閱讀進度與繼續閱讀**：localStorage 單一版本化鍵 `lucaslab.progress.v1`，記錄每部作品的最後章節、百分比、已讀章節清單。首頁與故事館顯示「繼續閱讀」清單（最近三部）；故事頁顯示續讀按鈕並標示已讀章節。
9. **章節頁細節**：顯示約略閱讀時間（以每分鐘 500 字估算）、章末「下一章」卡片、← / → 鍵切換章節（輸入欄位中不觸發）。
10. **站內搜尋擴充**：`search-index.json` 只含章節標題、作品名與開頭 80 字摘要（118 筆，約 23 KB）。**不是全文搜尋**；全文索引會達數 MB，列為後續決定。索引只在搜尋頁的使用者首次輸入時下載。

### P2 程式架構與內容

11. **拆分建置程式**：`scripts/build.cjs` 變為約 20 行的協調器，各頁面模組位於 `scripts/site/`：`catalog`（載入與驗證）、`assets`（素材與指紋）、`layout`（外殼與元件）、`pages`、`stories`、`games`、`projects`、`showcase-search`、`pwa`、`finalize`。
    - **重構階段以逐位元組比對驗證**：重構後 212 個輸出檔的 SHA-256 與原版完全相同，才進入功能開發。
    - 遊戲檔案改為自動列舉頂層的 `.js`、`.css`、`.svg`，不再寫死清單（新增模組不會被漏掉）。
    - `catalog.json` 在建置時驗證：必要欄位、狀態列舉、slug 唯一、封面檔存在、可遊玩遊戲的故事連結、日誌日期格式。
12. **開發日誌**：新增 5 篇日誌（Cloudflare 遷移、六部長篇上架、共用設計系統、血色魔鏡上線、血色魔鏡回訪設計），內容皆依 commit 與現有文件撰寫。
13. **藝廊**：6 個佔位概念標示為「構思中」；新增血色魔鏡企劃展板區塊（3 張 WebP，附遊戲頁連結）。
14. **離線閱讀（選做，已實作）**：`sw.js` 採用
    - 頁面與搜尋索引：network-first，失敗時退回快取。
    - 靜態資產與圖片：stale-while-revalidate。
    - `/games/` 完全略過，遊戲與音訊不受影響。
    - 快取名稱內含 commit 短碼，部署後自動清除舊快取。
    - `manifest.webmanifest` 已宣告。**限制**：目前只有 SVG 圖示，Chrome 的安裝提示通常需要 192/512 PNG 圖示，這一點尚未完成。

## 四、驗證

| 驗證 | 指令 | 結果 |
| --- | --- | --- |
| 語法、遊戲單元測試、建置與靜態檢查 | `npm run check` | 37 個單元測試通過；頁面與標頭、結構化資料、索引、SW、模組引用全部通過 |
| 遊戲五幕完整流程（CI 已有） | `node scripts/blood-mirror.browser.cjs` | 390px、1280px 通過 |
| 響應式版面與 axe WCAG（CI 已有） | `npm run test:visual` | 162 組頁面×視窗通過；hero 來源依 srcset 選擇，斷言已改為檢查實際來源 |
| 閱讀、搜尋、離線、CSP、藝廊（新增） | `npm run test:site` | 10 項通過 |
| 效能預算（新增） | `npm run test:perf` | 全部路由在預算內 |
| 其餘遊戲瀏覽器測試 | `blood-mirror-{media,gallery,solo,ui,pipes,replay}.browser.cjs` | 全部通過 |

## 五、尚未決定的項目（維持預設）

以下是第一輪規劃中需要使用者決定的事項。本次採用保守預設，沒有擅自變更：

- **自訂網域**：未變更，仍為 `lucas-lab.owl3918.workers.dev`；`SITE_URL` 可隨時覆寫，canonical、sitemap 與分享圖會一併更新。
- **流量統計**：未加入。若要加入，需先更新隱私頁，並重新評估 CSP 的 `connect-src`。
- **搜尋範圍**：只搜章節標題與開頭摘要，不做全文。
- **框架**：維持零依賴的靜態生成。

## 六、後續工作

- 為 PWA 補上 192/512 PNG 圖示，完成安裝條件。
- 消除 `style-src 'unsafe-inline'`：把模板與遊戲的內嵌 `style` 屬性改為類別。
- 搜尋頁的 275 KB 初始傳輸主要來自書籍封面（每張約 25–40 KB，已 lazy-load），可再評估縮小或延後載入。
- 真機驗收（iOS Safari、Android Chrome）仍需人工完成，見 `docs/IMPLEMENTATION.md`。
