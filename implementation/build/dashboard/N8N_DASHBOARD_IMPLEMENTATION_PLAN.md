---
document: MONITOR Dashboard — n8n Implementation Plan
project_code: gapmax
status: DESIGN — not implemented (no code written yet)
author: sarujanan (Claude execution agent)
date: 2026-06-15
---

# N8N_DASHBOARD_IMPLEMENTATION_PLAN.md

## STEP 6 — n8n implementation strategy

**Guiding principle:** the dashboard is a **Sheets-formula layer**, so n8n needs **little or no change**. The classification nodes (01–05) and the IF/Wait/email gate are **frozen**.

### Which nodes need modification
| Node | Change | Why |
|---|---|---|
| 01–05 Code nodes | **NONE** | Business logic frozen (D04). |
| `ToMonitor` writer | **NONE required** (optional enhancement below) | Dashboard derives Threshold + Matched Keyword from `RuleTrace` in-sheet. |
| RunLog writer + `Build RunLog Row` reducer | **NONE** | RunLog already provides KPI + trend history. |
| IF gate / Wait / emails | **NONE** | Unchanged. |

### Are new Code nodes required?
**No.** Two viable approaches; the recommended one adds **zero** nodes:

- **Recommended — in-sheet (no new nodes):** Priority/Risk and Matched Keyword/Threshold are computed by **Google Sheets formulas** on the `MONITOR_DASHBOARD` tab. They recalculate automatically whenever n8n updates `ToMonitor`. Simplest, least to maintain, no historical recompute.
- **Optional — server-side enrichment (1 node):** if you prefer the values materialised in the sheet (e.g. for Looker), add a small **"Enrich Monitor"** Code node *after* the existing MONITOR split that appends `matchedKeyword`, `threshold`, `priority`, `riskScore` to each MONITOR item. It only **reshapes existing record fields** (`r.matchedKeyword`, `r.threshold` already exist on 04/05 output) — **no D04 logic**. This would also require adding 4 columns to the `ToMonitor` writer (additive, backward-compatible).

> Recommendation: **start in-sheet (zero nodes)**. Promote to the optional Code node only if Looker needs pre-computed columns.

### How dashboard sheets are updated
- `MONITOR_DASHBOARD`, `KPI`, `KEYWORD_DIST`, `RISK_DIST` are **live formula views** over `ToMonitor` + `RunLog`. They update the instant the writers finish — no n8n step writes to them.
- `MONITOR_REVIEW` is **human-owned**; n8n never writes it.

### How historical data is preserved
| Need | Mechanism (already exists) |
|---|---|
| Monitor count over time (trend) | `RunLog` appends one row per run → trend source. |
| Per-placement MONITOR history | `ToMonitor` is append-only (history retained). |
| Reviewer decisions persisting across runs | `MONITOR_REVIEW` keyed by Placement URL; joined via `XLOOKUP`. |

### How duplicate records are prevented
- **Dashboard view** shows only the **latest run** by filtering to the max `RunDate`:
  ```
  latestRun = MAX over ToMonitor RunDate  (text-sortable "yyyy-MM-dd HH:mm")
  MONITOR_DASHBOARD body =
    =QUERY(ToMonitor!A2:G, "where Col7 = '"&$LatestRun&"' and Col5='MONITOR'", 0)
  ```
  So even though `ToMonitor` accumulates history, the dashboard never shows duplicates.
- **Review metadata** is keyed by **Placement URL** (one row per placement) → notes never duplicate across runs.
- If you later choose **n8n** as the sole `ToMonitor` writer, use **Append Row** + manual mapping (never "Append or Update", per the earlier column-cache fix) — the dashboard's latest-run filter handles de-duplication at the view layer.

### Sequencing / dependencies
1. No workflow rewiring. (If the optional "Enrich Monitor" node is adopted: `05_Validate → Enrich Monitor → ToMonitor`, mirroring the `Build RunLog Row` pattern.)
2. Resolve the open **ToMonitor ownership** (Apps Script vs n8n) first, so only one writer feeds the dashboard. The dashboard is agnostic to which writer wins — it reads the tab either way.

### What this plan explicitly does NOT do
- Does not modify Normalize/Aggregate/Threshold/Classify/Validate.
- Does not change D04 or any decision output.
- Does not add a write path to the existing data tabs.
