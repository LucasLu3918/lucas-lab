# 「鏡淵」專家關卡原型

可丟棄的原型（不進發布、不屬於遊戲建置），用來回答 [`../plan-expert-levels.md`](../plan-expert-levels.md) 的設計問題。每個都是單檔 HTML，零相依，直接用瀏覽器開啟。

| 檔案 | 關卡 | 驗證腳本 | 驗證了什麼 |
|---|---|---|---|
| `e4-panels.html` | E4 無限鏡廊（巢狀畫面） | — | 拖曳、疊放、放大對齊是否直覺（圖片內嵌自遊戲素材） |
| `e1-gears.html` | E1 逆走鐘樓（齒輪列） | `e1-gears.solve.cjs` | 窮舉：唯一最小解（39／6／24）；提示與解一致 |
| `e2-optics.html` | E2 稜鏡舞廳（光路） | `e2-optics.solve.cjs` | 三關各只有一組光束解；提示依解收斂 |
| `e2-prism.html` | E2 稜鏡舞廳（濾鏡、合光水晶、舞者；正式版規劃的三段） | `e2-prism.solve.cjs`（盤面由 `e2-prism.gen.cjs` 搜尋寫入） | 三關各只有一組光束解；解必須用到該關的新規則；起點離最近的解至少 2、2、4 步；第 3 關任何單步翻轉都不會多亮一個面具；提示依解收斂 |
| `e3-apothecary.html` | E3 毒蘋果調配室 | `e3-apothecary.solve.cjs` | 證詞唯一解、量杯最短解唯一、調色配方唯一 |
| `e5-box.html` | E5 七重魔鏡匣 | `e5-box.solve.cjs` | 注音密碼可還原、缺任一關都解不開、各面閘門 |
| `e1-pendulum.html` | E1 鐘擺（週期與擺長） | `../../../../scripts/blood-mirror-abyss.test.mjs` | 由 `build-belfry-prototypes.cjs` 從正式模組產生；唯一解是掛「輕」與「重」，擺長 4 格、週期比 2 |
| `e1-starwheel.html` | E1 星輪（點燭讀刻字、設定步幅） | 同上 | 同上；唯一步幅 5，第 13 聲落回紅寶石 |

> **E2 已有正式實作**：`../../puzzles/prism.js`，詳見 `../plan-expert-levels.md` 7.10；`e2-prism.html` 只保留作設計紀錄，規則與盤面以正式版為準。

> **E1 已有正式實作**：`../../puzzles/gears13.js`、`pendulum.js`、`starwheel.js`（規則與介面）、`../../data/abyss.js`（關卡資料）、`../../abyss.js`（入口），測試在 `scripts/blood-mirror-abyss.test.mjs`。`e1-gears.html` 只保留作為設計紀錄，之後規則以正式版為準；詳見 `../plan-expert-levels.md` 7.8、7.9。

兩頁以 `node build-belfry-prototypes.cjs` 重新產生。預覽窗格對本機檔案只顯示靜態快照、腳本不會執行，請用一般瀏覽器開啟；它們的規則與介面和遊戲內完全相同，在遊戲內已實測。

## 執行驗證

```bash
for f in e1-gears e2-optics e2-prism e3-apothecary e5-box; do node $f.solve.cjs; done
```

驗證腳本會從對應的 HTML 抽出 `<script data-core>`（規則與提示）區塊來執行，所以**規則只有一份**：HTML 裡的那一份。

另有 `../expert-dialogue.check.cjs`（對白草稿的規則檢查）；`e3-apothecary.solve.cjs` 也會核對學徒卡片台詞與 `../expert-dialogue-draft.md` 一致。

## 注意

- 原型只經過腳本與瀏覽器 DOM 點擊驗證，**沒有用真實手指測過**。
- 圖形是示意（SVG／遊戲現有美術），不是正式美術。
- E4 的 `e4-panels.html` 內嵌四張遊戲素材（約 480 KB），僅為了在沒有伺服器時能直接開啟。
