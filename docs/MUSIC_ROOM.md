# 音樂館：血色魔鏡 AI 原創歌曲

- `/music/` 提供播放清單、循環（全部／單曲／關閉）、隨機播放（每輪不重複）、進度拖曳（含已緩衝範圍與滑過時間提示）、±10 秒按鈕、鍵盤快捷鍵（空白鍵／K 播放、←→ 5 秒、J／L 10 秒、Shift+←→ 換曲）、音量、鎖定畫面控制（Media Session，含快轉／倒退與進度）與捲動時的迷你播放列；偏好只存在 localStorage。
- 跳轉需要伺服器支援範圍請求（Range）。Cloudflare 靜態資產對音檔一律回 200 整檔，瀏覽器會把音檔判為不可跳轉、進度條被打回 0:00。因此 `worker/index.js` 只在 `/music/audio/*` 執行（`wrangler.jsonc` 的 `run_worker_first`），把 `Range` 轉成 206 回應；其他路徑仍直接走靜態資產。前端另有備援：若音檔仍不可跳轉，播放器會把整首歌下載成 blob 再跳轉（CSP `media-src` 因此允許 `blob:`）。
- 歌曲資料在 `data/catalog.json` 的 `music` 陣列，統一欄位：版本、曲風、BPM／調性／拍號、人聲、核心樂器、情緒走向、適合場景、特色、段落時間軸。缺欄位或檔案時建置失敗。
- 音檔由原始 WAV 轉為 AAC 128 kbps（`music/audio/<slug>.m4a`，每首約 4 MB），歌詞原文放在 `music/lyrics/<slug>.txt`，建置時解析段落標籤。原始 WAV 不進版控。
- 音檔路徑在 `/music/audio/`，不在 `/assets/` 下，離線 service worker 不會快取大型音檔。
- 段落時間、強度曲線（`energy`，每 2 秒一點）與最強時間點（`peak`）由實際音檔分析而來（librosa：音量與音色變化分段），段落需連續涵蓋整首歌；對應的歌詞段落為人工推定。BPM／調性的自動偵測不可靠，頁面上的 BPM 與調性標示為「創作設定」。
- 歌詞尚未逐句對時；逐句同步需另行標註時間戳。

## 新增歌曲

1. 以 ffmpeg 將 WAV 轉為 AAC 128 kbps、`+faststart`，存成 `music/audio/<slug>.m4a`（單檔需小於 6 MB）。
2. 將歌詞放到 `music/lyrics/<slug>.txt`，保留 `[Verse]`、`[Chorus]` 等段落標籤。
3. 在 `data/catalog.json` 的 `music` 陣列加入同格式的項目，含分析所得的 `duration`、`timeline`、`energy`、`peak`。
4. 執行 `npm run check` 驗證。
