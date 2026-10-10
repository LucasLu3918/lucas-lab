# docs 文件整理計畫

日期：2026-10-11｜範圍：`docs/` 下的文件；`.claude/worktrees/` 內的副本不列入

## 原則

- 判斷「需要」的依據：是否被 README、程式（`scripts/`、`games/`）、AIPS 專案來源或其他保留文件引用，或是否仍是未完成工作的操作依據。
- 只移動、不刪除。被移出的文件保留在 `docs/plan/`，要刪除可由你決定。
- 不動目前有未提交變更的文件：`docs/IMPLEMENTATION.md`、`docs/design/BLOOD_MIRROR_ROADMAP.md`、`docs/design/BLOOD_MIRROR_VISUAL_PROFILE.json`。

## 保留（11 個）

| 文件 | 保留理由 |
| --- | --- |
| `docs/IMPLEMENTATION.md` | README 連結；AIPS 專案來源 |
| `docs/design/COVER_ASSETS.json` | `scripts/check.cjs` 直接讀取，作為封面素材 hash 與尺寸的依據 |
| `docs/design/UI_COVER_PLAN.md` | README 連結；`PROJECT_VISUAL_PROFILE.yaml` 的 baseline；AIPS 專案來源 |
| `docs/design/PROJECT_VISUAL_PROFILE.yaml` | 視覺設定主檔；AIPS 專案來源；`BLOOD_MIRROR_VISUAL_*.json` 以其為 source |
| `docs/design/VISUAL_AUDIT.yaml` | `PROJECT_VISUAL_PROFILE.yaml` 的 visual_audit 欄位；AIPS 專案來源 |
| `docs/design/BLOOD_MIRROR_VISUAL_PROFILE.json` | `games/blood-mirror/MEDIA_ASSETS.md` 引用的設計證據 |
| `docs/design/BLOOD_MIRROR_VISUAL_AUDIT.json` | `games/blood-mirror/MEDIA_ASSETS.md` 引用的畫面證據 |
| `docs/design/SITE_OPTIMIZATION_PLAN.md` | README 連結；`scripts/perf-budget.browser.cjs` 的預算依據 |
| `docs/design/BLOOD_MIRROR_ROADMAP.md` | README 連結；M1 邊界與里程碑記錄，優化計畫引用它 |
| `docs/design/BLOOD_MIRROR_OPTIMIZATION_PLAN.md` | README 連結；後續優化方向總表 |
| `docs/design/BLOOD_MIRROR_PLAYTEST_KIT.md` | 真人試玩尚未進行，這是執行時要用的流程與記錄表 |

## 移出（1 個）

| 原位置 | 新位置 | 理由 |
| --- | --- | --- |
| `docs/design/BLOOD_MIRROR_M2_LIBRARY_PLAN.md` | `docs/plan/BLOOD_MIRROR_M2_LIBRARY_PLAN.md` | 狀態為 WC-01–WC-08 已實作；屬於已完成的實作規劃紀錄，README 未引用，不再是設計操作依據 |

移出後已修正的連結：

- 上層文件連結改為 `../design/BLOOD_MIRROR_ROADMAP.md`、`../design/BLOOD_MIRROR_OPTIMIZATION_PLAN.md`
- 試玩套件連結改為 `../design/BLOOD_MIRROR_PLAYTEST_KIT.md`

反引號中的檔名（例如 `BLOOD_MIRROR_VISUAL_PROFILE.json`）不是連結，未修改。

## 不處理的項目

- `docs/.DS_Store`：macOS 產生的檔案，已被 `.gitignore` 忽略且未被跟踪，不屬於文件。
- `docs/design/BLOOD_MIRROR_M2_LIBRARY_PLAN.md` 內的 `docs/research/blood-mirror-playtest-kit.md` 路徑已不存在（舊路徑）。這是歷史紀錄，因此保留原文，未改寫。

## 驗證

- `docs/` 與 `README.md` 內所有相對 Markdown 連結都能解析，共 9 條，缺失 0 條。
- `scripts/check.cjs` 依賴的 `docs/design/COVER_ASSETS.json` 仍在原位。
- `games/blood-mirror/MEDIA_ASSETS.md` 引用的兩個 `BLOOD_MIRROR_VISUAL_*.json` 仍在原位。
- 未執行 `npm run check`。文件搬移不影響建置輸出；`check.cjs` 只驗證 `dist/`，而 `dist/` 未被改動。

## Change Impact 記錄

- AIPS Intelligence：狀態 READY；freshness 為 STALE，原因是工作區有未提交變更與多個監看路徑的 committed 變更。本次未執行 refresh。
- `aips intelligence impact-candidates` 對 `docs/` 的種子路徑回傳 0 個候選，因為此專案是 Node.js，掃描到 0 個 Python 檔。因此影響範圍改以全文引用搜尋（上表）判定。

## 待你決定

1. `BLOOD_MIRROR_PLAYTEST_KIT.md` 目前保留在 `docs/design/`。若真人試玩已經完成、只想保留結果，可以移到 `docs/plan/`，並同步修正 `docs/plan/BLOOD_MIRROR_M2_LIBRARY_PLAN.md` 中的連結。
2. `.claude/worktrees/` 內有多份舊版 `docs/` 副本，它們不在主仓庫中，這次未處理。

## 追加：舊版副本處理（2026-10-11）

目標：處理 `.claude/worktrees/` 內的舊版副本。

| worktree | 狀態檢查 | 處理結果 |
| --- | --- | --- |
| `cool-mendel-63f9af`（分支 `feat/site-optimization-plan`） | 工作區乾淨；唯一的提交 `9831bfe` 在 main 有等價提交（`git cherry`） | 已用 `git worktree remove` 移除 |
| `game-project-planning-16cc97`（分支 `claude/game-project-planning-16cc97`） | 工作區乾淨；沒有只存在於分支的檔案；內容是 main 的舊版（Blood Mirror 結局回顧、記憶、WebP 精灵图等已由 main 的 #16、#17 取代） | **未移除**：`git worktree remove` 被權限檢查拒絕 |
| `website-optimization-plan-c3d28c`（分支 `claude/website-optimization-plan-c3d28c`） | 沒有領先 main 的提交；唯一的未跟踪檔案是規劃草稿 `docs/design/SITE_OPTIMIZATION_PLAN.md`（2026-10-11，寫明「規劃完成，尚未實作」） | 草稿已移到 `docs/plan/SITE_OPTIMIZATION_PLAN_draft_2026-10-11.md` 存檔；**worktree 未移除**：`git worktree remove` 被權限檢查拒絕 |

- 分支本身沒有刪除；`game-project-planning-16cc97` 的兩個提交（`adacf35`、`ce5b6ac`）不是 main 上的同一個 hash，但內容已由 main 取代。若確定不需要，可自行刪除分支。
- `/Users/lucas/.codex/worktrees/` 下的 worktree 屬於 Codex，不在本專案的 `.claude/worktrees/` 內，未處理。
