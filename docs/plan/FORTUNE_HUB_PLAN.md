# 占卜中心 Fortune Hub 規劃

- 狀態：P0（#103）、P1（#105）、P2（#107）已合併；P3 整合已實作（見 §9.1，分支 `claude/fortune-hub-p3`）；P4 尚未開始
- 日期：2026-10-17
- 範圍：以既有「月夜占卜室」為基礎，整合六個占卜模組、共用計算引擎與資料層，並導入本機 Claude Code 占卜技能作為規格與內容來源。
- 原則：所有計算在瀏覽器本機完成；不需要付費 API 或 AI API Key；計算可重現；出生資料不儲存、不上傳。

## 1. 現況盤點

主站已有三個占卜入口，皆以本機規則計算，並以 `methodVersion` 標記版本。

| 模組 | 路由 | 目前狀態 | 主要檔案 |
| --- | --- | --- | --- |
| 塔羅 | `/tarot/` | 已完成：78 張牌、六種牌陣、單張與每日一抽；使用 `crypto.getRandomValues` 抽牌；閱讀歷史存於本機，P3 起經 `fortune-core/local-history` 匯出 | `src/vue/site/features/tarot/` |
| 八字 | `/bazi/` | 已完成：三柱（時辰未知）與四柱、十神、五行、大運；使用 `lunar-javascript`；P3 起標示 `inputPrecision` | `src/vue/site/features/divination/bazi.ts`（`bazi-local-v2`） |
| 西洋占星 | `/astrology/` | 已完成：行星落座、相位、年度流年；使用 `astronomy-engine`；時間未知時隱藏上升與宮位；P3 起標示 `inputPrecision` | `src/vue/site/features/divination/astrology.ts`、`astrology-annual.ts`（`tropical-whole-sign-v3`） |
| 占卜總覽 | `/divination/` | 入口卡片（月夜占卜室）；P3 起加入零輸入的今日總覽（今日一抽、今日星座） | `DivinationHub.vue`、`TodayOverview.vue` |
| 星座運勢 | `/horoscope/` | 已完成（P1）：五個面向與幸運指引，原創文案依 `dailySeed` 選取 | `src/vue/site/features/horoscope/` |
| 紫微斗數 | `/ziwei/` | 已完成（P2）：十二宮、十四主星、四化與大限；標準安星法，與 iztro 差異測試一致 | `src/vue/site/features/ziwei/`（`ziwei-standard-v1`） |
| 生命靈數 | `/numerology/` | 已完成（P1）：生命路徑、表達數、靈魂數、人格數、生日數與個人循環 | `src/vue/site/features/numerology/`（`numerology-pythagorean-v1`） |

既有可沿用的設計：

- 時區與 civil time 解析集中於 `timezone.ts`，已處理不存在與重複的夏令時間。
- `divination.spec.ts` 已有固定規則與版本的測試；`scripts/divination.browser.cjs` 是瀏覽器驗證入口。
- Vue Islands 架構見 [ADR-001](../architecture/ADR-001-vue-islands.md)，新模組應沿用。

## 2. 目標架構

```mermaid
flowchart TB
  Hub["占卜中心 /divination/<br/>模組登錄表 · 資料需求標示"]
  subgraph Modules["占卜模組（各自 lazy-load）"]
    T["塔羅 tarot"]
    HO["星座運勢 horoscope"]
    AS["星盤解析 astrology"]
    BZ["八字命理 bazi"]
    ZW["紫微斗數 ziwei"]
    NU["生命靈數 numerology"]
  end
  subgraph Core["fortune-core 共用層"]
    CT["civil-time 與曆法"]
    RNG["seeded RNG / 安全亂數"]
    CNT["content 資料層與 schema"]
    ETH["ethics 文案檢查"]
    RES["MethodResult 結果格式"]
    HIS["local-history 本機歷史"]
  end
  Hub --> T & HO & AS & BZ & ZW & NU
  T & HO & AS & BZ & ZW & NU --> Core
```

### 2.1 模組登錄表

Hub 不寫死卡片，改由一份登錄表（manifest）描述每個模組：

```ts
interface FortuneModule {
  id: 'tarot' | 'horoscope' | 'astrology' | 'bazi' | 'ziwei' | 'numerology';
  title: string;
  route: string;                 // 既有 URL 保留，SEO 不變
  inputNeeds: 'none' | 'birthdate' | 'birth-datetime-place';
  methodVersion: string;
  load: () => Promise<unknown>;  // 動態匯入，確保 Hub 首屏維持輕量
}
```

Hub 依 `inputNeeds` 顯示「不需個資，立即抽牌」或「選擇資料完整度」。塔羅與星座運勢不需出生資料，應排在最前面。

## 3. 模組規格

### 3.1 塔羅 Tarot（既有，改為使用共用層）

- 輸入：牌陣、主題、問題（皆可略過）。
- 引擎：沿用 `tarot.ts`，抽牌繼續使用安全亂數；「每日一抽」維持既有行為（同一天不換牌，抽過的結果保存在本機），不改用可預測的日期種子。
- 資料：78 張牌義以 `tarot.ts` 為唯一來源。
- 驗證：以 `claude-tarot` 的 `cards.json`（MIT）做牌名與正逆位交叉比對，不複製其圖片（見第 6 節）。

### 3.2 星座運勢 Horoscope（新增）

- 輸入：星座（可由生日推算）、期間（今日／本週／本月）、日期。
- 引擎：太陽星座由日期邊界推算；內容由 `dailySeed(date, sign, period)` 選取文案組合。
- 內容：五個面向（整體、感情、事業、財務、健康）＋幸運指引與每日提示。每個面向由「情境句 × 行動句 × 語氣句」組合，避免重複感。
- 文案規則：賦權而非預測、可能性而非確定性、負面資訊附帶方向；禁止死亡、疾病確定性與恐嚇性語句（由 `ethics` 檢查器自動測試）。
- 不使用 LLM 即時生成；內容以離線撰寫、人工審稿後存為 JSON。

### 3.3 星盤解析 Astrology（既有，擴充）

- 引擎：沿用 `astronomy-engine` 與 `tropical-whole-sign-v3`。
- 擴充：星盤 SVG 圖形、行星逆行狀態、相位表說明、年度流年摘要。
- 精確度標示：每張盤顯示「完整／近似（時間未知）／僅太陽星座」，與八字共用同一套 `inputPrecision`。
- 驗證：挑選數個日期，與公開星曆（如 JPL Horizons）的行星黃經比對，寫入 golden 測試。

### 3.4 八字命理 BaZi（既有，維持）

- 引擎：沿用 `bazi.ts`（`bazi-local-v2`）與 `lunar-javascript`。
- 保留：三柱模式（時辰未知）、真太陽時更正（須明確開啟）、大運性別與流派參數。
- 擴充：流年與大運的時間軸視覺化；十神說明文案移至 `content` 層。

### 3.5 紫微斗數 Ziwei（新增，需先做技術 spike）

需要：農曆日期、時辰、五行局、紫微星定位、十四主星安星與四化。

兩條路線：

| 路線 | 做法 | 優點 | 風險 |
| --- | --- | --- | --- |
| A. 採用 `iztro` | 作為執行期依賴（MIT，v2.6.3） | 成熟，省開發時間 | 解包約 3.6 MB，依賴 `lunar-typescript`、`i18next`、`dayjs`，需要評估 gzip 後的體積與 perf budget |
| B. 自行實作 | 依規則文件實作純函式引擎；以 `iztro` 作為 devDependency 的對照表做差異測試 | 體積小、可控、可重現 | 開發成本較高，需大量 fixture |

建議：先做 spike，比較兩條路線的 gzip 體積與 10 組以上命盤的差異；若 B 的差異可收斂，採用 B，並以 A 作為測試對照。無論哪條路線，都要統一使用 `lunar-javascript` 的曆法來源，避免同時引入兩套農曆庫。

### 3.5.1 Spike 結果（P2，已決定路線 B）

- **體積**：`iztro` 2.6.3 以 esbuild 打包（含 `lunar-typescript`、`i18next`、`dayjs`）約 503 KB（未壓縮），gzip 約 147 KB。路線 B 的 `/ziwei/` 島嶼 gzip 約 8 KB，曆法沿用既有的 `lunar-javascript` 共用層。
- **差異**：標準引擎與 iztro 在 12 組陽曆命盤、1 組農曆換算命盤，以及 5 個五行局 × 30 日的紫微落宮表上完全一致。差異測試位於 `ziwei.iztro.spec.ts` 與 `ziwei.spec.ts`。
- **規格文件偏差**：`ziwei-fortune` 技能的 `calculation-rules.md` 與 iztro 有三處不一致，因此計算不採用其規則，只作規格參考。
  1. 五行局的命宮天干誤用農曆月份。例如庚午年五月初八亥時，命宮在未，命宮干支應為癸未（楊柳木，木三局），不是壬未。
  2. 紫微落宮的奇偶進退與起算方式不同。例如木三局初八，iztro 與標準引擎為卯，技能規則算出子。
  3. 紫微與天府的對稱軸是寅申，不是子午。例如紫微在卯，天府在丑。
- **決定**：採路線 B，以標準安星法實作，iztro 只作為 devDependency 的對照表（`iztro` 2.6.3，MIT）。執行期程式碼不載入 iztro。

### 3.6 生命靈數 Numerology（新增）

- 輸入：出生日期；可選全名。
- 計算：生命路徑數、表達數、靈魂數、人格數、生日數，加上個人流年／月／日。主數 11、22、33 不化約。
- 中文姓名：字母對照需要拼音表，列為待決定事項（見第 10 節）；P1 階段先只使用出生日期。
- 所有計算步驟可展開顯示，方便使用者自行驗算。

## 4. 共用計算引擎與資料層（`fortune-core`）

建議放在 `src/vue/site/features/fortune-core/`，各模組只能依賴它，不得互相依賴。

| 子模組 | 職責 |
| --- | --- |
| `civil-time` | 由既有 `timezone.ts` 移入；提供 civil time 解析、夏令時間處理與地點清單 |
| `calendar` | 包裝 `lunar-javascript`：陽曆、農曆、干支、節氣；所有模組只透過此層取得曆法 |
| `rng` | `seededRandom(seed)` 供每日內容使用；`secureRandom` 供抽牌使用；兩者不可混用 |
| `content` | 內容 JSON 的 schema 與版本；以 `ajv`（已是 devDependency）在測試與建置時驗證 |
| `ethics` | 文案檢查器：掃描禁用詞、絕對化用語與缺少建設性方向的負面句 |
| `result` | 統一輸出格式 `MethodResult<T>`：`methodVersion`、`contentVersion`、`inputPrecision`、`disclaimer` |
| `local-history` | 本機閱讀歷史，含 schema 版本、匯出與一鍵刪除 |
| `ui` | `DoorCard`、`PrecisionSelector`、`ReadingCard`、`DisclaimerNote` 等共用元件 |

### 4.1 結果格式

```ts
interface MethodResult<T> {
  module: string;
  methodVersion: string;        // 例如 'bazi-local-v2'
  contentVersion: string;       // 文案版本，文案改動時遞增
  inputPrecision: 'full' | 'approximate' | 'minimal';
  disclaimer: string;
  data: T;
}
```

每個結果都標示版本，讓使用者能知道「這個結果是用哪一版規則算的」，也讓 golden 測試能偵測規則漂移。

## 5. 隱私、倫理與成本

- 出生資料只存在記憶體，計算後不寫入 `localStorage`；若要記住，需使用者逐次勾選同意，且可一鍵刪除。
- 閱讀歷史只存於本機，不上傳；若要分享，只分享文字結果，不附出生資料。
- 不使用任何付費 API；不需 AI API Key；不呼叫第三方占卜服務。
- 每個模組顯示一致的免責說明：內容供娛樂與自我反思，不保證事件，不取代醫療、法律或財務建議。
- 文案由 `ethics` 檢查器在 CI 中把關。

## 6. 導入占卜相關技能

### 6.1 已安裝到本機的技能（`~/.claude/skills/`）

| 技能 | 來源 | 用途 |
| --- | --- | --- |
| `fortune-hub` | fortune-telling-skills | 占卜路由規則與資料收集流程參考 |
| `tarot`（Claude Tarot） | claude-tarot（MIT） | 牌名與正逆位交叉比對 |
| `tarot-reading` | fortune-telling-skills | 牌陣與解讀規則參考 |
| `horoscope-daily` | fortune-telling-skills | 星座面向與文案結構參考 |
| `numerology-fortune` | fortune-telling-skills | 生命靈數計算規則與數字意義參考 |
| `ziwei-fortune` | fortune-telling-skills | 紫微斗數計算規則（路線 B 的規格來源） |
| `bazi-fortune` | fortune-telling-skills | 八字規則交叉比對 |
| `vedic-astrology`、`meihua-yishu`、`liuyao-yijing`、`qimen-dunjia`、`fengshui-advisor` | fortune-telling-skills | 本計畫範圍外，保留為未來擴充模組 |

這些技能是給 Claude Code 使用的提示與規則文件，**不是網站的執行期程式庫**。網站執行時不載入它們。

### 6.2 使用方式

- **規格來源**：計算規則（例如紫微的排盤步驟、生命靈數的對照表）作為實作與測試的參考，由工程師讀後自行撰寫程式碼。
- **內容撰寫**：星座文案可在 Claude Code 中以這些技能協助起草，但最後必須經人工審稿，才寫入 `content` 層。
- **交叉驗證**：`claude-tarot` 的 `cards.json` 作為牌名與正逆位的比對資料，寫成測試。

### 6.3 授權閘門（實作前必須確認）

- **fortune-telling-skills**：README 顯示 MIT 授權標章，但 repo 內**沒有 LICENSE 檔案**。在作者確認前，只把其內容當成規格參考，不直接複製文字或文案。
- **claude-tarot**：MIT 授權，若複製 `cards.json` 等資料，需保留版權聲明與授權全文。
- **claude-tarot 的圖片**：授權與來源不明，**不匯入**。站內已有自製的 `assets/tarot-cards/` 圖卡。

## 7. 優化建議（已納入規劃）

1. **統一輸入精確度**：八字的時辰未知、占星的時間未知、紫微的時辰未知，共用 `inputPrecision`，避免各模組各自定義。
2. **模組登錄表與 lazy-load**：Hub 只載入卡片，點進模組才載入引擎；`lunar-javascript` 與 `astronomy-engine` 各自成為共用 chunk。
3. **Perf budget 新增占卜路由**：為 `/divination/` 與新模組路由在 `scripts/perf-budget.browser.cjs` 設定預算，依既有流程記錄提高理由。
4. **Golden 測試與版本號**：每個引擎以固定 fixture 做 snapshot；規則改變時必須遞增 `methodVersion`，否則測試失敗。
5. **每日內容用種子亂數**：「今日運勢」以 `dailySeed(date, sign, period)` 選取文案，同一天同一星座不會看到不同結果，重新整理也不會換內容。種子可由他人推算，因此只用於娛樂文案，不用於抽牌或任何需要隨機性的場合。
6. **統一本機歷史**：塔羅歷史與未來的其他結果共用 `local-history`，含 schema 版本、匯出與一鍵刪除。
7. **文案 CI 檢查**：`ethics` 檢查器進入 `npm run check`，禁用詞一旦出現就失敗。
8. **離線支援**：將 `/divination/` 與各模組路由加入既有的 PWA 離線快取（`scripts/site/pwa.cjs`）。
9. **跨模組「今日總覽」**：今日運勢與每日一抽都不需要出生資料，可在 Hub 首頁合併成一張「今日卡片」，零輸入即可使用。
10. **無障礙**：所有模組支援鍵盤操作、`prefers-reduced-motion` 與對比檢查，並納入 `scripts/visual-audit.cjs`。
11. **分享只分享結果**：若提供分享功能，只輸出文字或不含個資的圖片，避免把出生日期與位置一起傳出去。
12. **SEO 與搜尋**：新路由加入 `data/catalog.json` 或對應的頁面清單，並出現在 sitemap 與站內搜尋。

## 8. 測試策略（TDD）

每個模組依序完成：

1. **Schema 測試**：內容 JSON 通過 `ajv` 驗證，版本欄位存在。
2. **Golden 測試**：固定輸入產生固定輸出（含 `methodVersion`）。紫微與占星另以外部對照做差異測試。
3. **邊界測試**：閏月、夏令時間重複與空缺、子時跨日、日界線（星座與生命靈數）、無效日期。
4. **倫理測試**：所有文案通過 `ethics` 檢查器。
5. **瀏覽器測試**：擴充 `scripts/divination.browser.cjs`，覆蓋輸入、結果、歷史刪除與離線模式。
6. **效能與視覺**：perf budget 與 visual audit 通過。

既有 `npm run check` 會執行 typecheck、Vitest 與建置，新模組需納入其中。

## 9. 分階段路線

| 階段 | 內容 | 驗收 |
| --- | --- | --- |
| P0 基礎 | `fortune-core`：civil-time 移入、calendar 包裝、rng、content schema、ethics、result、local-history；Hub 改為登錄表 | 既有三模組行為不變；既有測試全數通過；首屏 bundle 不增加 |
| P1 新模組（可平行） | 軌道 A：生命靈數（純計算）；軌道 B：星座運勢（內容與引擎） | 各自 golden、schema、ethics 測試通過；lazy-load 生效 |
| P2 紫微 | spike（路線 A／B 比較）→ 實作 → 差異測試 | 10 組以上命盤與對照結果一致或差異有記錄；體積在預算內 |
| P3 整合 | 既有塔羅、八字、占星改用共用層；統一歷史與精確度標示；今日總覽 | 行為與既有測試一致；歷史可匯出與刪除 |
| P4 體驗與維運 | Hub 視覺改版（暗黑童話主題）、離線快取、perf budget、visual audit、文件更新 | `npm run check:all` 通過 |

P1 的兩個軌道與 P2 的 spike 彼此獨立，只依賴 P0 的共用層，檔案範圍互不重疊，可各自在獨立工作區進行。

### 9.1 P3 實作結果

- **共用層**：塔羅閱讀歷史改由 `fortune-core/local-history` 提供；storage key 維持 `lucas-lab:tarot-history:v1`，既有紀錄不需遷移。`local-history` 新增保留順序的 `update`；寫入失敗改為往上拋，讓 UI 能正確告知「未保存」，讀取與清除仍不拋錯。
- **精確度**：八字與占星結果新增 `inputPrecision`，共用 `InputPrecision` 型別；時間未知為 `approximate`，時間齊全為 `full`。結果頁以 `fortune-core/ui/PrecisionBadge.vue` 顯示同一套標示。
- **歷史匯出與刪除**：塔羅紀錄可匯出為 JSON（只含牌卡、時間與筆記）；清除紀錄維持原有行為。
- **日期一致**：`localDayKey` 移至 `fortune-core/civil-time`，星座運勢與塔羅每日一抽共用同一個本機日期。
- **今日總覽**：占卜中心首頁新增「今日總覽」，今日一抽（已抽則顯示牌名）與今日星座（記住上次選擇的星座，只存於本機）。塔羅歷史與星座運勢引擎都以動態匯入載入。量測（gzip）：`/divination/` 入口 chunk 約 3.5 KB；總覽掛載時就會載入塔羅歷史與牌卡資料約 10.8 KB（每次進入首頁都會）；選擇星座後才載入星座引擎約 4.8 KB。這些數字留給 P4 設定 perf budget 時參考，目前尚未設定預算。
- **範圍外**：八字與占星仍不保存閱讀紀錄，因為出生資料不儲存（§5）；因此統一歷史目前只包含塔羅。單筆刪除未實作，清除紀錄涵蓋刪除需求。

## 10. 待決定事項

1. **紫微路線**：A（`iztro` 執行期依賴）或 B（自行實作、`iztro` 僅作測試對照）？建議先做 spike，依體積與差異結果決定。
2. **中文姓名的生命靈數**：是否建立拼音對照表？建議 P1 先只用出生日期，姓名功能待拼音表確定後再加入。
3. **星座文案來源**：自撰模板並人工審稿（建議），或先用技能協助起草再審稿？
4. **站名**：維持「月夜占卜室」，或改為「占卜中心 Fortune Hub」？兩者可並存，Hub 頁顯示其一即可。
5. **fortune-telling-skills 授權**：是否向作者確認 MIT 授權？確認前只作規格參考。

## 11. 影響範圍

- 本文件為規劃文件，**不修改任何既有程式碼、資料或建置設定**。
- 實作時預計影響：`src/vue/site/features/`（新增 `fortune-core/`、`horoscope/`、`ziwei/`、`numerology/`，調整 `divination/` 與 `tarot/`）、`src/vue/site/divination-main.ts`、`scripts/site/`（頁面與 PWA）、`scripts/perf-budget.browser.cjs`、`scripts/divination.browser.cjs`、`data/catalog.json`、`package.json`（若採用 `iztro`）。
- 版本與授權變更需在 `docs/IMPLEMENTATION.md` 記錄；若採用 `iztro`，需新增依賴說明。
