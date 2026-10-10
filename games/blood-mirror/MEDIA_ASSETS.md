# 《血色魔鏡》互動解謎與媒體資產

遊戲延續 `engine.js` 五幕及三個結局，另以 `challenges.js` 提供五種操作性謎題：

| 章節 | 互動謎題 | 操作 |
|---|---|---|
| 黑鐘書庫 | 出生紀錄修復 | 從「出生紀錄」熱點開啟；交換九片 SVG 帳頁碎片，修復後才讀得到密碼後兩位（`ledger.js`） |
| 銀骨礦坑 | 蒸汽管線旋轉 | 從「斷裂的蒸汽管」開啟；接通後封印才接受開閥順序 |
| 玻璃棺室 | 棺中的心跳 | 從「玻璃棺」開啟；重現六次光芒（心跳後依序亮起的符印）；可放慢速度，答錯兩次後可查看刻痕 |
| 王后寢宮 | 記憶牌配對 | 從「王后的信」開啟；每組配對拼回一段證詞，完成後信上的回答浮現 |
| 鏡中之國 | 反寫手稿映照 | 從「見證者手稿」開啟；逐列顯示映照進度，完成後才能閱讀與收取手稿 |

新的關卡完成後才開啟原本的文字封印；原先已解開封印的存檔不受影響。五幕的互動謎題都改由證據熱點開啟（房間資料 `evidence`、`evidenceButton`、`evidenceGate`）；證據修復前，封印只顯示引導。第一至四幕解封後出現 `after:'solved'` 熱點（契約、甦醒的礦工、轉過頭的倒影、母親的最後記憶）。原肖像拼圖畫面移至藝廊「魔鏡前的公主肖像」。

取得任一結局後，五幕各出現一段 `after:'ending'` 的人物記憶（`memory:true`），收藏紀錄保存在 `blood-mirror-v1` 的 `memories` 欄位，開始新旅程也會保留。設定中的「攜帶存檔」由 `savefile.js` 匯出或匯入故事與互動謎題進度。

王后三問（房間資料 `free:true`）接受任何回答組合，每個選項以 `response` 提供薇菈的回應；回答存於 `answers`，用於解鎖敘述（`unlockEcho`）與結局回顧。

效能：`concept-art.js` 的小圖讀取 `design-board-1.webp`、`design-board-3.webp`（由 PNG 以 `cwebp -q 82` 轉出，尺寸相同），結局與藝廊的黎明 CG 讀取 `endings/dawn.webp`。PNG 原檔保留給藝廊完整檢視。
獨立完成紀錄保存在同瀏覽器的 `blood-mirror-challenges-v2`；開始新旅程會清除該紀錄。

## 音樂檔案路徑

`soundtrack.js` 遵循使用者點擊音效開關後才播放的瀏覽器政策；目前有 9 種場景與結局。
加入下列實體 MP3 後，自動優先播放成品配樂；若尚未提供，會立即播放無需網路的場景專屬 WebAudio 伴奏。

~~~text
assets/music/
  00_title_The_Mirror_Lied_First.mp3
  01_library_Black_Bell_Archive.mp3
  02_mine_Seven_Forgotten_Names.mp3
  03_crypt_Glass_Sleep.mp3
  04_queen_The_Queens_Lament.mp3
  05_mirror_A_Name_for_a_Life.mp3
  06_dawn_Nameless_Dawn.mp3
  07_frost_Winter_Without_Names.mp3
  08_crown_Crown_of_Blood.mp3
~~~

## CG 圖像

提供三張內建 SVG 插畫：
- `assets/endings/dawn.svg`
- `assets/endings/frost.svg`
- `assets/endings/crown.svg`

可選用同名高質感 WebP 覆蓋：`assets/endings/dawn.webp`、`frost.webp`、`crown.webp`。
WebP 成功載入後才更換背景，避免圖片缺檔時的空白。

## 驗證

~~~shell
npm run check
node --test scripts/blood-mirror-challenges.test.mjs
# GitHub visual workflow 安裝 Playwright 後
node scripts/blood-mirror.browser.cjs
~~~

遊戲音量初始為靜音；尊重瀏覽器背景分頁暫停及動態減量偏好。

## 魔鏡藝廊

首頁、探索工具列與結局頁可開啟藝廊。`gallery.js` 的 `galleryAssets` 是素材清單，目前收錄 6 張既有角色／場景 WebP、3 張結局插畫（黎明優先使用原始 PNG）及 3 張企劃概念展板。展板含三結局內容，須發現全部結局後開放。

新增概念圖：將檔案放入 `assets/concepts/`，加入具有唯一 `id`、`category: 'concept'`、`title`、`src`、`alt`、`description` 的項目。所有路徑以遊戲入口為基準。結局優先載入同名 WebP，缺檔保留 SVG。縮圖延後載入，大圖支援上一件／下一件、左右方向鍵與 Esc；讀圖失敗會顯示提示。

結局收藏沿用 `state.endings`，未發現的結局不載入縮圖或揭露名稱。藝廊不修改存檔，返回探索也不重設進度。已匯入使用者提供 ZIP 的九首 MP3 試聽版（每首約 31–36 秒）及精選合輯。藝廊聆聽室可逐首播放，試聽時暫停遊戲背景音樂。這不是展板所示的兩分鐘完成版。霜潮／王冠完整 CG 尚未提供，使用概念圖取景插畫與原有 SVG 背景。

## 本輪原始素材來源與限制

- 使用者提供完整試聽包 ZIP：音樂檔案原樣保留；曲目資訊見 `assets/music/playlist.json`，原始音源授權說明見 `assets/music/SOURCE_NOTES.md`。說明記載 TimGM6mb.sf2 與 GPL-2，公開散布前仍須確認對錄音輸出的適用義務；本輪只做本機整合，未部署。
- 使用者分享 https://chatgpt.com/s/m_6ac9c03669708191a3bb0e3a547573be ：四張 PNG 原檔，三張完整展板存於 `source-art/concepts/`，茶館黎明原畫存於 `source-art/endings/dawn.png`；未從展板裁切圖片冒充完整 CG。展板文字為設計提案，不代表遊戲已具備其中所有玩法。
- MP3 載入成功後淡出備援合成音，避免持續低音重疊；背景／靜音仍停止播放。尚未重新母帶製作或保證試聽檔的無縫循環。

## 概念素材的遊戲內使用

`concept-art.js` 定義原展板中的 8 個取景矩形，`concept-art.css` 使用 CSS 背景精靈顯示：公主肖像（九格拼圖與參考圖）、金色機關盤（懷錶與密碼封印）、藥瓶／羽毛／蘋果／鑰匙（記憶配對）、蘋果道具、霜潮與王冠結局插畫。

所有來源 PNG 保持原樣，不新增 AI 圖或拆出修改後的圖檔。霜潮／王冠各約 369×214 像素，以最高 480px 的內文畫框呈現；原有 SVG 仍作結局背景。藝廊對應結局使用同一取景素材，僅解鎖該結局即可觀看，不會顯示整張含其他結局的展板。

謎題答案、記憶配對位置、五幕故事、存檔版本保持相容。展板中迷宮／節奏等未實作提案不視為既有遊戲功能。取景須以桌面與手機實際渲染確認不包含外側標題或鄰近素材。

## 整體 UI 體驗

- 手機導覽提供選單、Escape 關閉與焦點回復；探索工具列在捲動時保持可用。
- 目標與真相進度放在場景上方。場景線索清單與光點共用同一探索事件，手機預設展開；道具狀態顯示「已收取」／「已查看」。
- 共用彈窗固定標題／關閉區，內容可獨立捲動；內容更新後保持鍵盤焦點。
- 有存檔時首頁優先繼續旅程。閱讀文字提高至 14–15px，另提供較大文字。減少動畫與較大文字偏好保存在 `blood-mirror-ui-v1`；不修改故事存檔格式。
- 全站 favicon 為 `assets/favicon.svg` 星軌羅盤；遊戲使用 `games/blood-mirror/favicon.svg` 加冕魔鏡。皆為本機 SVG，16／32／64px 已實際渲染確認。
- 驗證：`scripts/blood-mirror-ui.browser.cjs` 涵蓋 360／390／768／1280／1440px，另重跑完整通關、藝廊及 MP3 驗證。設計與畫面證據見 `docs/design/BLOOD_MIRROR_VISUAL_PROFILE.json`、`BLOOD_MIRROR_VISUAL_AUDIT.json`。截圖為本機暫存證據，未聲稱已取得真實裝置／跨瀏覽器或完整 WCAG 認證。

## 銀骨蒸汽管：連通規則與操作

`pipes.js` 以三乘三管網的實際管口追蹤泉源蒸汽。相鄰管件只有互相面對的管口才連通，不允許跨列繞回；泉源通路若有漏接或未抵達城市，即不能啟動供暖。直管的 0°／180°、90°／270°各自等價。

泉源固定在左上（向右出汽），城市固定在右下（由左進汽）；五段管件可逐次順時針旋轉。SVG 管道與判定使用相同方向基準，通汽段同時以亮色與「◆ 通汽」標記呈現，城市顯示待供暖／已接通。

旋轉立即更新現有 DOM，不重建彈窗。提供最多 50 步撤銷、重設、三段提示、方向鍵換格及 Tab／Enter 操作；完成後需按「啟動城市供暖」才進入原本的冷水→熱泉→城市封印。進行中的旋轉、撤銷與提示只保留在本次頁面記憶體，關閉再開啟謎題會保留；重新整理頁面或開始新旅程則重置。原有 v1 故事存檔與 v2 已完成關卡紀錄保持相容。

`package.json` 的原生 check 已納入全部 blood-mirror 單元測試，包含 1024 種旋轉組合窮舉、方向等價性、漏接／邊界與無效輸入。`scripts/blood-mirror-pipes.browser.cjs` 驗證 360／390／768／1280px 的觸控、鍵盤、撤銷／重設、重新開啟、提示、明確供暖、原封印與舊存檔。

## 2026-10-10 發布最佳化

- 場景與白雪立繪 WebP 以 `cwebp` 重新壓縮（場景 `-q 72`，立繪 `-q 80`），尺寸不變；每張場景由約 380 KB 降至約 180–225 KB。來源版本仍可由 git 歷史取回。
- 概念展板 `design-board-4` 補上 WebP 衍生檔（與 1、3 相同來源 PNG）。
- 原始 PNG 移到 `games/blood-mirror/source-art/`（`concepts/` 與 `endings/`），不在 `assets/` 內，因此建置的複製步驟不會發布它們；`scripts/check.cjs` 會確認 `dist/` 中沒有 PNG 點陣素材。原檔仍受版本控制，不做修改。
- `dawn.png` 同樣只保留為來源，結局插畫實際使用 `dawn.webp`。
- 原始 PNG 路徑：`source-art/concepts/design-board-{1,3,4}.png`、`source-art/endings/dawn.png`；`scripts/blood-mirror-concept.test.mjs` 以此路徑比對 WebP 尺寸。

