# 《血色魔鏡》互動解謎與媒體資產

遊戲延續 `engine.js` 五幕及三個結局，另以 `challenges.js` 提供五種操作性謎題：

| 章節 | 互動謎題 | 操作 |
|---|---|---|
| 黑鐘書庫 | 3×3 肖像拼圖 | 點選兩個碎片交換位置、還原畫像 |
| 銀骨礦坑 | 蒸汽管線旋轉 | 點按管件旋轉，使閥門接回工程方向 |
| 玻璃棺室 | 五段符印記憶 | 重現月亮、蘋果與鏡像符文序列 |
| 王后寢宮 | 記憶牌配對 | 翻開八張記憶卡找到四組印記 |
| 鏡中之國 | 左右對稱推理 | 使右側光紋鏡像對應左側 |

新的關卡完成後才開啟原本的文字封印；原先已解開封印的存檔不受影響。
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
