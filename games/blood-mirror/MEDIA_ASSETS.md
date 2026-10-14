# 《血色魔鏡》互動解謎與媒體資產

> **母檔位置（2026-10-13 起）**：PNG 與音訊母檔不在版本控制內。下文中的 `source-art/`、`source-audio/` 指倉庫旁的 `../draft/lucas-lab/blood-mirror/source-art/`、`../draft/lucas-lab/blood-mirror/source-audio/`，以及 `../draft/lucas-lab/bgm-audition/`（配樂封存與試聽）；網站根目錄的 `source-art/` 對應 `../draft/lucas-lab/source-art/`。完整清單見 `../draft/lucas-lab/MASTERS-MANIFEST.md`。

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
  01_library_The_Thirteenth_Toll.mp3      第一幕
  12_ballroom_Waltz_of_Wax.mp3            第二幕
  13_hunter_A_Heart_in_Glass.mp3          第三幕
  02_mine_Seven_Beds_of_Silver.mp3        第四幕
  03_crypt_The_Breath_Between.mp3         第五幕
  04_queen_Veras_Lullaby.mp3              第六幕
  05_mirror_The_Price_of_a_Name.mp3       第七幕
  06_dawn_Nameless_Dawn_v4.mp3            真結局
  07_frost_Winter_Without_Names_v4.mp3    霜潮結局
  08_crown_Crown_of_Blood_v4.mp3          王冠結局
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

## M4–M8 音訊與收藏素材（2026-10）

- 音樂清單（`assets/music/`）：`10_theme_intro_Who_Deserves_to_Live.mp3`（39 秒前奏循環，標題畫面）、`11_theme_full_Who_Deserves_to_Live.mp3`（約 5 分鐘完整版，聆聽室與片尾名單，片尾以內部音軌鍵 `credits` 播放）。
- `00_title_The_Mirror_Lied_First.mp3` 為舊版標題曲，程式已不引用，已移至 `source-audio/`，不再隨遊戲發布。
- 母帶 `source-audio/main_theme_Who_Deserves_to_Live.mp3`（約 9.3 MB）超過 8 MB 的提交守衛上限，未納入版本控制；`highlights.mp3` 已移出發布。
- 場景環境音與音效全部由 WebAudio 即時合成（`audio/ambience.js`、`audio/sfx.js`），沒有額外音檔。
- 混音（2026-10-13）：音樂、音效、環境音三條匯流排經主匯流排與安全限幅器輸出；音量滑桿採 40·log10 dB 曲線（一半約 -12 dB）。各曲以 EBU R128 實測響度正規化到 -18 LUFS（提升上限 +4 dB），數值在 `soundtrack.js` 的 `LOUDNESS`，換檔時需以 `ffmpeg -i <檔案> -af ebur128 -f null -` 重新量測。重要音效會壓低音樂；謎題開啟時音樂低通變暗，解開後恢復。
- 鏡之碎片與收藏、成就、祕密尾聲皆為文字與 CSS 呈現，未新增圖片素材。
- 尚缺：角色立繪（M4 對話場景與 M6 的人物）、M6 兩個新章節（血色舞會、獵人的心臟）的場景圖與三首 MiniMax 配樂。需於本機影像與音訊工具產出後，依 plan 第 8.2 節的人工審查流程加入。

## 第二幕・第三幕新增素材（M6）

- 場景圖（1664×944 WebP，均 ≤ 130 KB；PNG 母檔在 `source-art/m6/`，不發布）：`ballroom.webp`、`hunter-cabin.webp` 為章節場景；`mirror-hall.webp`、`balcony.webp`、`black-pine-path.webp` 目前只在魔鏡藝廊展示。
- 產生方式：本機 ComfyUI（Z-Image Turbo，8 步，經 AIPS `creative` 流程），逐張目視審查；獵人小屋與黑松林各重做一次（玻璃心臟須為器官形狀、整體維持油畫質感）。這不是使用者驗收。
- 配樂：第一至第七幕的場景配樂已全面換成 v3（本機 MiniMax Music 3 產生，每首約 77–86 秒、可循環、−18 LUFS），舊曲歸檔於 `source-audio/bgm-v1-archive/`；來源、種子與授權見 `assets/music/SOURCE_NOTES.md`。
- 人物立繪（`assets/portraits/*.webp`，640×936，各 ≤ 42 KB；PNG 母檔在 `source-art/m6/portraits/`）：eli、orion、nyla、heso、lucy、hunter、vera、mirror。本機 ComfyUI Z-Image Turbo 文字生圖，逐張目視審查通過（魔鏡倒影有一張面孔，與「無臉」的原設定略有出入）；無圖像編輯模型，故沒有白雪。人工驗收待你確認。


## 機關特寫圖與黃銅介面（2026-10-13）

- 機關特寫（`assets/puzzles/<機關 id>.webp`，960×411，各 ≤ 44 KB，共 14 張約 500 KB；PNG 母檔不在版本控制內，見下方「母檔存放」）：musicbox、ledger、watch、masks、light、runeheart、pipes、names、rune、rubbing、memory、stitch、reflection、maze。檔名即 `puzzles/index.js` 各階段的 `id`；只在機關視窗開啟時載入，不計入首屏。
- 產生方式：本機 ComfyUI，沿用 `source-art/manifest.json` 的 Z-Image Turbo 流程（9 步、`res_multistep`、1344×576，再以 `cwebp -q 78 -m 6 -resize 960 411` 轉檔）。每個機關出 2 張候選，目視挑選；提示詞限制為無文字、無人物。這不是使用者驗收。
- 黃銅質感：樣式在 `challenges.css` 結尾（`#modal` 下的設計語彙，漸層與 `box-shadow`，不使用圖檔）；視窗外框在 `styles/stage.css` 結尾。
- 線索視窗的場景特寫（`concept-art.js` 的 `zoomStyle`）：直接放大熱點座標附近的場景圖，沒有新增素材。
- 機關選擇縮圖（`assets/puzzles/thumbs/<機關 id>.webp`，224×128，14 張共約 66 KB）：由上述母檔置中裁切；只在兩選一的選擇畫面載入。

### 帳本的背面 E1 逆走鐘樓（2026-10-14）

- 三道機關各有一張特寫與縮圖（不算在前面 14 張之內，只在機關視窗、機關選擇與重玩選單載入）：`belfry-gears`（約 40 KB）、`belfry-pendulum`（約 26 KB）、`belfry-wheel`（約 20 KB），特寫 960×411、縮圖 224×128（共約 100 KB）。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，種子 2101／2102、2201／2202、2301／2302，每個機關 2 張候選目視挑選；選用 gears-0、pendulum-1、wheel-0）。提示詞要求無文字、無人物；齒輪特寫指定灰兔右耳要有一排紅色縫線（候選 0 做到了），星輪的輪緣只有符文般的刻痕，沒有可讀文字。轉檔：`cwebp -q 72 -m 6 -resize 960 411`；縮圖取中央 1008×576 再 `-resize 224 128 -q 76`。PNG 母檔與全部候選在 `draft/lucas-lab/blood-mirror/`（`source-art/puzzles/belfry-*.png`、`candidates/belfry/`），不在版本控制內。**這不是使用者驗收。**
- 先前暫用的概念圖裁切（`belfry.webp`）已移除；概念圖 `plan-improve/concepts-expert/` 仍只當方向稿。
- 齒輪、軸座、擺錘、配重、星輪與提示面板都是程式繪製的 SVG／CSS（`puzzles/gears13.js`、`pendulum.js`、`starwheel.js`、`challenges.css`），沒有圖檔。

## 新增場景視角與熱點稽核（2026-10-13）

- 新場景視角（1600×896 WebP，各 ≤ 126 KB，共約 500 KB；PNG 母檔不在版本控制內，見下方「母檔存放」）：`library-desk`（書庫書桌）、`queen-vanity`（王后梳妝台）、`mine-dorm`（礦工宿舍）、`mirror-children`（牽著手的孩子）、`crypt-bedside`（玻璃棺旁）。各章 `views` 的第一個仍是抵達視角；封印與證據熱點留在抵達視角（`blood-mirror-m6.test.mjs` 規定）。已加入魔鏡藝廊的「場景」分類。
- 產生方式同上（本機 ComfyUI、Z-Image Turbo、每個場景出 2 張候選目視挑選）。不是使用者驗收。
- 熱點稽核：以標註圖逐幕比對 84 個熱點與畫面物件，移動 48 個到對應物件上（例如懷錶移到書桌的懷錶、玻璃心臟移到罐中心臟、閥柄移到紅色閥輪）。原圖裡沒有的物件（鐘塔手札、被撕走書頁的禁書、打翻的墨水、蠟印、醫師畫像、王冠、祈禱書、搖籃、藍圖牆、礦工提燈、牽手的孩子、露西的髮帶、白紗、守夜燭台、玻璃外的低語）改放在新視角。
- 座標準則：同一視角的熱點在 812×457 橫向手機舞台上至少相距 48 px；手機版 y 不超過約 80%（底部面板），桌面左半部 y 不超過約 75%（對話框）。

- 母檔存放：機關特寫（14 張）、新場景視角（5 張）與白雪立繪的 PNG 母檔（約 26 MB）以及每次出圖的全部候選圖，都**不在版本控制內**（提交時被內容安全檢查擋下），保存在作者本機的草稿資料夾 `draft/lucas-lab/blood-mirror/`（內有 README.md）。發布用的 WebP 不受影響；若要放回，維持 `games/blood-mirror/source-art/` 下的相同相對路徑。

## 白雪立繪（2026-10-13）

- `assets/portraits/snow.webp`（640×936，42 KB）：與其他人物立繪同規格的半身油畫立繪。以本機 ComfyUI 的 Flux 2 Klein 4B base 圖像編輯（20 步、CFG 5），用 `assets/snow-white.webp` 主視覺當參考圖維持臉部與服飾（黑長捲髮、灰綠眼、紅唇、金冠與紅寶石耳環、黑絲絨金紅刺繡禮服），挑自 4 張候選的種子 33。PNG 母檔不在版本控制內，見上方「母檔存放」。不是使用者驗收。
- 使用位置：首頁「旅程回顧」卡的頭像（有存檔時才載入，首次造訪不增加請求）、線索筆記視窗的抬頭、魔鏡藝廊的「角色」分類（`snow-portrait`）。白雪仍是第二人稱的「妳」、不會說話，所以對話框的說話者表沒有她。
- 試過但放棄的做法：Qwen Image Edit 2511 bf16（約 39 GB）與 2509 fp8（約 19 GB）在 48 GB 的 Mac 上載入後會讓 ComfyUI 後端因記憶體不足當掉；Flux 2 Klein 9B fp8 在 MPS 上不支援 Float8。

## 鏡淵 E2 稜鏡舞廳（三道機關的橫幅與縮圖）

- 檔案：`assets/puzzles/prism-{rays,blend,ballroom}.webp`（960×411，約 15、18、22 KB）與 `assets/puzzles/thumbs/prism-{rays,blend,ballroom}.webp`（224×128，各約 3 KB）。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，種子 2401／2402、2501／2502、2601／2602，每個機關 2 張候選目視挑選；選用 rays-2402、blend-2501、ballroom-2602）。提示詞要求無文字、無臉；舞廳的賓客只有背影與空白面具。轉檔與縮圖參數同 E1：`cwebp -q 72 -m 6 -resize 960 411`；縮圖取中央 1008×576 再 `-resize 224 128 -q 76`。PNG 母檔在 `draft/lucas-lab/blood-mirror/source-art/puzzles/prism-*.png`，全部候選在 `candidates/prism/`，不在版本控制內。**這不是使用者驗收。**

## 鏡淵 E3 毒蘋果調配室（三道機關的橫幅與縮圖）

- 檔案：`assets/puzzles/apothecary-{testimony,vessels,mixing}.webp`（960×411，約 30、29、20 KB）與 `assets/puzzles/thumbs/apothecary-{testimony,vessels,mixing}.webp`（224×128，各約 4–5 KB）。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，每個機關 2 張候選目視挑選）。選用 testimony-4701、vessels-2802、mixing-5902。轉檔與縮圖參數同 E1、E2：`cwebp -q 72 -m 6 -resize 960 411`；縮圖取中央 1008×576 再 `-resize 224 128 -q 76`。**調色例外**：橫幅取原圖左側 `-crop 0 80 1100 471` 再縮成 960×411，縮圖取 `-crop 250 100 800 457`，都是為了切掉原圖右緣的畫框。PNG 母檔在 `draft/lucas-lab/blood-mirror/source-art/puzzles/apothecary-*.png`，全部候選（含被淘汰的兩輪）在 `candidates/apothecary/`，不在版本控制內。
- **提示詞的教訓**：第一版（種子 2701／2702、2901／2902）背牆都被模型加了一幅肖像畫；提示詞寫「沒有畫、沒有肖像」反而更容易出現（第二輪仍有）。第三輪改成**正面描述**（「整面牆是滿滿的藥瓶架」「牆上沒有掛任何東西」，不出現 queen、painting 等字）後，證詞橫幅沒有畫；調色橫幅右緣仍有畫框，所以用裁切避開。第一版調色的手持鏡是立式，現在改成平放在桌上。
- 尚待作者驗收。**這不是使用者驗收。**

## 鏡淵 E4 無限鏡廊（兩道機關的橫幅與縮圖）

- 檔案：`assets/puzzles/gallery-{align,merge}.webp`（960×411，約 35、46 KB）與 `assets/puzzles/thumbs/gallery-{align,merge}.webp`（224×128，約 5、7 KB）。畫格本身（`mirror-hall`、`balcony`、`black-pine-path`、`ballroom`）用既有場景圖，沒有新增。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，每個機關 2 張候選目視挑選）。選用 align-4102（哥德長廊、紅線沿地面延伸）、merge-4201（疊在一起的金框畫，一條紅線穿過）。轉檔與縮圖參數同 E1–E3：`cwebp -q 72 -m 6 -resize 960 411`；縮圖取中央 1008×576（`-crop 168 0 1008 576`）再 `-resize 224 128 -q 76`。PNG 母檔與落選候選在 `draft/lucas-lab/blood-mirror/source-art/puzzles/`（候選在 `e4/`），不進版本控制。
- 提示詞全程用正面描述，沒有否定句。第一輪即可用，沒有重畫。
- 尚待作者驗收。**這不是使用者驗收。**

## 鏡淵 E5 七重魔鏡匣（六面的橫幅與縮圖）

- 檔案：`assets/puzzles/box-{time,light,apple,thread,shards,cipher}.webp`（960×411，約 13、14、13、13、17、22 KB）與 `assets/puzzles/thumbs/box-*.webp`（224×128，各約 3–4 KB）。「鏡中鏡」面的四格畫面用既有場景圖（`mirror-hall`、`balcony`、`black-pine-path`、`ballroom`），沒有新增。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，每面 2 張候選目視挑選）。選用 time-7101（黃銅撥盤）、light-7201（稜鏡與紅線）、apple-7301（蘋果形金鎖與藥滴）、thread-7401（兩個金框鏡孔與紅線）、shards-7502（碎片環）、cipher-7602（符號盤與字條）。轉檔與縮圖參數同 E1–E4：`cwebp -q 72 -m 6 -resize 960 411`；縮圖取中央 1008×576（`-crop 168 0 1008 576`）再 `-resize 224 128 -q 76`。PNG 母檔在 `draft/lucas-lab/blood-mirror/source-art/puzzles/box-*.png`，落選候選與提示詞在 `e5/`（含 `convert.cjs`），不進版本控制。
- 提示詞全程用正面描述，沒有否定句；一輪即可用。
- 已知：碎片面的圖是八片碎片（模型沒有畫成七片），密碼盤上的刻字是模型生成的偽字符，不是注音；兩者只是氛圍圖，正式機關是 HTML。
- 尚待作者驗收。**這不是使用者驗收。**


## 鏡淵 E7 稱量廳（三道機關的橫幅與縮圖）

- 檔案：`assets/puzzles/scale-{fruit,thorn,final}.webp`（960×411，約 18、20、17 KB）與 `assets/puzzles/thumbs/scale-*.webp`（224×128，各約 3–4 KB）。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，每張 2 張候選目視挑選）。選用 fruit-9502（三顆蘋果對兩面鏡，背後是帳冊）、thorn-9502（黑玫瑰與匕首對砝碼，背後是帳冊）、final-9501（長桌上的多座天秤與帳冊）。轉檔與縮圖參數同 E1–E6。PNG 母檔、落選候選、提示詞與 `run.sh` 在 `draft/lucas-lab/blood-mirror/source-art/puzzles/e7/`，不進版本控制。
- 提示詞全程用正面描述；一輪即可用。
- 已知：final 的兩張候選都把天秤零件畫得分離（橫樑與盤不連在一起），只當氛圍圖；圖中盤裡的東西與數量不代表謎題內容，正式機關是 HTML，答案由 `puzzles/scale.js` 的規則決定。
- 尚待作者驗收。**這不是使用者驗收。**

## 鏡淵 E6 失聲合唱廳（三道機關的橫幅與縮圖）

- 檔案：`assets/puzzles/choir-{pipes,rhythm,hymn}.webp`（960×411，約 19、18、20 KB）與 `assets/puzzles/thumbs/choir-*.webp`（224×128，各約 3–5 KB）。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，每張 2 張候選目視挑選）。選用 pipes-9401（一排封蠟的黃銅管與藍燭）、rhythm-9402（譜架與三個黃銅齒輪）、hymn-9402（管風琴琴鍵、碎鏡與藍燭）。轉檔與縮圖參數同 E1–E5。PNG 母檔、落選候選、提示詞與 `run.sh` 在 `draft/lucas-lab/blood-mirror/source-art/puzzles/e6/`，不進版本控制。
- 提示詞全程用正面描述；一輪即可用。
- 已知：圖中的管數與譜面只是氛圍（管有 9–10 根、譜上是偽字符），正式機關是 HTML，管長與拍子由 `puzzles/choir.js` 的規則決定。
- 尚待作者驗收。**這不是使用者驗收。**

## 鏡淵 E-X 影戲小屋（兩道機關的橫幅與縮圖）

- 檔案：`assets/puzzles/shadow-{key,queen}.webp`（960×411，約 11、18 KB）與 `assets/puzzles/thumbs/shadow-*.webp`（224×128，各約 2–4 KB）。
- 產生方式：本機 mflux Z-Image Turbo（9 步、`--quantize 8`、1344×576，每張 2 張候選目視挑選）。選用 key-9201（油燈、木雕鑰匙與牆上的大影子）、queen-9302（背對、戴冠、長辮的木雕與牆上剪影）。轉檔與縮圖參數同 E1–E5。PNG 母檔、落選候選、提示詞與 `run.sh` 在 `draft/lucas-lab/blood-mirror/source-art/puzzles/ex/`，不進版本控制。
- 提示詞全程用正面描述，沒有否定句；一輪即可用。
- 已知：圖中木雕與影子的角度只是氛圍，正式機關是 SVG 圓盤投影，答案由 `puzzles/shadow.js` 的規則決定。
- 尚待作者驗收。**這不是使用者驗收。**

## UI ornaments (`assets/ui/`)

Generated locally with mflux Z-Image Turbo (9 steps, `--quantize 8`); masters, prompts and `convert.cjs` / `seal-alpha.cjs` live in `draft/lucas-lab/blood-mirror/source-art/ui/`.

| File | Use | Notes |
|---|---|---|
| `arrow-gilt.webp` | Scene view arrows (`.view-arrow::after`, `mix-blend-mode:screen`, mirrored for the left one) | seed 8102, cropped to 480×70, black background |
| `seal-wax.webp` (inlined) | Sealed chapter cards (`.chapter-card.locked`) | seed 8201, circular alpha mask via sharp, 176×176 |
| `velvet.webp` (inlined) | Grain under framed panels (`soft-light`) | seed 8301, 384×384, q55 |

Seal and velvet are base64 data URIs inside `styles/stage.css` (about 9 KB) to save two first-screen requests; the `.webp` files are not shipped, regenerate them from the masters with `convert.cjs` / `seal-alpha.cjs`, then re-inline. Only `arrow-gilt.webp` is a separate file.
