# 「鏡淵」專家關卡原型

可丟棄的原型（不進發布、不屬於遊戲建置），用來回答 [`../plan-expert-levels.md`](../plan-expert-levels.md) 的設計問題。每個都是單檔 HTML，零相依，直接用瀏覽器開啟。

| 檔案 | 關卡 | 驗證腳本 | 驗證了什麼 |
|---|---|---|---|
| `e4-panels.html` | E4 無限鏡廊（巢狀畫面） | — | 拖曳、疊放、放大對齊是否直覺（圖片內嵌自遊戲素材） |
| `e1-gears.html` | E1 逆走鐘樓（齒輪列） | `e1-gears.solve.cjs` | 窮舉：唯一最小解（39／6／24）；提示與解一致 |
| `e2-optics.html` | E2 稜鏡舞廳（光路） | `e2-optics.solve.cjs` | 三關各只有一組光束解；提示依解收斂 |
| `e3-apothecary.html` | E3 毒蘋果調配室 | `e3-apothecary.solve.cjs` | 證詞唯一解、量杯最短解唯一、調色配方唯一 |
| `e5-box.html` | E5 七重魔鏡匣 | `e5-box.solve.cjs` | 注音密碼可還原、缺任一關都解不開、各面閘門 |

> **E1 已有正式實作**：`../../puzzles/gears13.js`（規則與介面）、`../../data/abyss.js`（關卡資料）、`../../abyss.js`（入口），測試在 `scripts/blood-mirror-abyss.test.mjs`。`e1-gears.html` 只保留作為設計紀錄，之後規則以正式版為準；詳見 `../plan-expert-levels.md` 7.8。

## 執行驗證

```bash
for f in e1-gears e2-optics e3-apothecary e5-box; do node $f.solve.cjs; done
```

驗證腳本會從對應的 HTML 抽出 `<script data-core>`（規則與提示）區塊來執行，所以**規則只有一份**：HTML 裡的那一份。

另有 `../expert-dialogue.check.cjs`（對白草稿的規則檢查）；`e3-apothecary.solve.cjs` 也會核對學徒卡片台詞與 `../expert-dialogue-draft.md` 一致。

## 注意

- 原型只經過腳本與瀏覽器 DOM 點擊驗證，**沒有用真實手指測過**。
- 圖形是示意（SVG／遊戲現有美術），不是正式美術。
- E4 的 `e4-panels.html` 內嵌四張遊戲素材（約 480 KB），僅為了在沒有伺服器時能直接開啟。
