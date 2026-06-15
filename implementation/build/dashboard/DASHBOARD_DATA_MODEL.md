---
document: MONITOR Dashboard — Data Model & Scoring
project_code: gapmax
status: DESIGN — not implemented
author: sarujanan (Claude execution agent)
date: 2026-06-15
---

# DASHBOARD_DATA_MODEL.md

## STEP 3 — `MONITOR_DASHBOARD` sheet structure

A read-only view of the **latest run's** MONITOR rows, enriched with priority/risk and joined to persistent review metadata. Columns A–I are formula-derived (never typed); J–K are joined from `MONITOR_REVIEW` (reviewer-owned, persistent).

| # | Field | Source | Purpose |
|---|---|---|---|
| A | Run Date | `ToMonitor.G` | Which weekly run produced the row; lets the view filter to the latest run. |
| B | Placement URL | `ToMonitor.B` | The placement key reviewers act on; primary join key. |
| C | Placement Type | `ToMonitor.C` | Always `Site` for MONITOR (Rule 3) — kept for clarity/forward-compat. |
| D | Impressions | `ToMonitor.D` | Exposure volume; numerator of the risk ratio. |
| E | Threshold | `REGEXEXTRACT(ToMonitor.F,"<=(\d+)")` | Per-run cut-off; denominator of the risk ratio. |
| F | Matched Keyword | `REGEXEXTRACT(ToMonitor.F,"kw:([^+]+)")` | Why it's flagged; drives keyword-distribution analysis. |
| G | Decision | `ToMonitor.E` (`MONITOR`) | Audit/clarity; confirms this is the monitor queue. |
| H | Rule Trace | `ToMonitor.F` | Full provenance (`order-3:Site+kw:…<=…`) for auditability. |
| I | Priority Level | computed (Step 4) | High / Medium / Low — at-a-glance triage. |
| J | Risk Score | computed (Step 4) | 0–100 numeric for sorting and trend. |
| K | Review Status | `MONITOR_REVIEW` (dropdown) | Reviewer workflow state; **persists across runs**. |
| L | Reviewer Notes | `MONITOR_REVIEW` | Free-text rationale; **persists across runs**. |

> **Why a separate `MONITOR_REVIEW` tab:** `ToMonitor` is append-only and rewritten/extended every run, so reviewer-entered Status/Notes cannot live there (they'd be lost or duplicated). `MONITOR_REVIEW` is keyed by **Placement URL** and owned by humans; the dashboard LEFT-JOINs it (`XLOOKUP`) onto the latest MONITOR rows so notes survive every n8n execution.

### Persistence join (K, L)
```
K2 = IFERROR(XLOOKUP($B2, MONITOR_REVIEW!$A:$A, MONITOR_REVIEW!$B:$B), "New")
L2 = IFERROR(XLOOKUP($B2, MONITOR_REVIEW!$A:$A, MONITOR_REVIEW!$C:$C), "")
```
`MONITOR_REVIEW` columns: `A Placement URL · B Review Status · C Reviewer Notes · D Last Updated`.

## STEP 4 — Priority scoring system

MONITOR placements always satisfy `impressions <= threshold` (Rule 3), so the **risk ratio is 0–1**; the closer to the threshold, the closer the placement is to *becoming* an EXCLUDE next run — i.e. higher risk.

**Definitions**
```
ratio      = Impressions / Threshold                      (0 .. 1 for MONITOR)
RiskScore  = ROUND(ratio * 100, 0)                         (0 .. 100)
Priority   = ratio ≥ 0.80 → High
             ratio ≥ 0.50 → Medium
             ratio < 0.50 → Low
```

**Google Sheets formulas (row 2; D=Impressions, E=Threshold):**
```
J2 (Risk Score) = IFERROR(ROUND(D2/E2*100,0), 0)
I2 (Priority)   = IFERROR(IFS(D2/E2>=0.8,"High", D2/E2>=0.5,"Medium", TRUE,"Low"), "Low")
```

**Rationale (Senior-Analyst view):** within a homogeneous MONITOR set, raw impressions alone are misleading because the threshold varies per run; normalising by threshold makes risk comparable across runs and directly expresses "how close to exclusion." This keeps the score interpretable for stakeholders ("80%+ of the line") without inventing any new business rule — it is a **presentation transform of existing fields only**.

**Edge handling:** `IFERROR` guards a zero/blank threshold (defaults Risk 0 / Low). No classification value is altered — Priority/Risk are dashboard-only columns.

## Field integrity rules
- A–H are **formulas** → never hand-edited (protect the range).
- E and F depend on the `RuleTrace` format `order-3:Site+kw:<kw>+<impr><=<thr>` (stable, emitted by 04_classify.js). If RuleTrace format ever changes, only these two formulas need updating — **not** the classifier.
- K, L are the **only** human-editable columns and live in `MONITOR_REVIEW`.
