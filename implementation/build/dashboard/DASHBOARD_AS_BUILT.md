---
document: Dashboard — AS BUILT (authoritative)
project_code: gapmax
requirement_id: REQ-01
status: AS-BUILT — supersedes the earlier dashboard design docs
author: sarujanan (Claude execution agent)
date: 2026-06-16
implementation: implementation/build/apps_script/dashboard.gs
---

# Dashboard — As Built

> ⚠ **Authoritative.** The other docs in this folder (DASHBOARD_ARCHITECTURE,
> DASHBOARD_DATA_MODEL, DASHBOARD_BUILD_SPEC, GOOGLE_SHEETS_DASHBOARD_DESIGN,
> N8N_DASHBOARD_IMPLEMENTATION_PLAN, LOOKER_STUDIO_RECOMMENDATION,
> DASHBOARD_VALIDATION_CHECKLIST) describe an **earlier 3-tab, formula-driven** design
> (`MONITOR_DASHBOARD` + `MONITOR_REVIEW` + `Dashboard`). That design was **superseded**.
> This file documents what is **actually deployed**. Where they conflict, this wins.

## What is actually built
- **One tab only: `Dashboard`** (no `MONITOR_DASHBOARD`, no `MONITOR_REVIEW`).
- Implemented in [dashboard.gs](../apps_script/dashboard.gs), entry point `buildMonitorDashboard()`.
- **Apps Script-materialized snapshot** (direct cell writes + `EmbeddedChartBuilder`); **no live formulas**.
- Full-width A:Z desktop BI layout (1920×1080).

## Data sources (read-only)
`ToExclude`, `ToMonitor`, `RunLog`, `_Validation`. The script **never writes** to these or any tab except `Dashboard`.

## Sections (rows)
| Rows | Section |
|---|---|
| 1–4 | Header banner + 🟢/🔴 status pill |
| 5–10 | 8 KPI cards (Total, Excluded, Monitored, Exclusion Rate, High-Risk Monitors, Threshold, Validation, Last Run) |
| 12–28 | 3 trend line charts (Exclusions / Monitor / Threshold) — read a bounded numeric block under chart 1 |
| 29–48 | Risk donut + top-15 monitor queue (risk-colored) |
| 50–68 | Top-10 exclusions + keyword bar chart |
| 69–80 | Validation center (PASS/FAIL/PENDING) |
| 82–85 | Footer (generated-at, totals) |

## Refresh model
- **Semi-dynamic snapshot:** values reflect data as of the last run of `buildMonitorDashboard()`.
- **Auto-refresh:** n8n calls the Web App endpoint (`doPost` → `buildMonitorDashboard()`) after writing the output tabs — see [WEBAPP_DEPLOYMENT.md](../apps_script/WEBAPP_DEPLOYMENT.md).
- **Manual refresh:** Sheet → **GAPMax → Build Executive Dashboard**.
- **Idempotent:** each run clears prior charts/merges/conditional-formats/content, then rebuilds (no duplication).

## Not implemented (vs the old design)
- No `MONITOR_REVIEW` write-back tab, no reviewer-status dropdown, no in-sheet QUERY/ARRAYFORMULA, no Looker Studio. These remain *design options*, not deployed.

## Verification
Rendered output confirmed against [evidence/screenshots/](../../../evidence/screenshots/) (Dashboard, ToExclude, workflow canvas, success email) and RunLog counts `950/210/711/29/PASS`.
