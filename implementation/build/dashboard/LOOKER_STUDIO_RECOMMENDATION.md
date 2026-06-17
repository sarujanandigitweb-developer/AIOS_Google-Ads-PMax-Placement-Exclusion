---
document: MONITOR Dashboard — Looker Studio Recommendation
project_code: gapmax
status: DESIGN — optional, not implemented
author: sarujanan (Claude execution agent)
date: 2026-06-15
---

> ⚠ **Superseded — see [DASHBOARD_AS_BUILT.md](DASHBOARD_AS_BUILT.md).** Describes the earlier 3-tab dashboard design; kept for history only.


# LOOKER_STUDIO_RECOMMENDATION.md

## STEP 8 — Should Looker Studio be integrated?

**Recommendation: OPTIONAL — add it only for read-only executive/stakeholder consumption; keep operational review in Google Sheets.**

**Add Looker Studio if** any of these are true:
- Stakeholders are **non-editors** who should not touch the Sheet.
- You want **scheduled email/PDF** delivery of the weekly monitor summary.
- You want polished, interactive charts beyond native Sheets visuals.

**Do NOT rely on Looker if** you need data entry — Looker Studio is **read-only** and cannot capture Review Status / Notes. Those stay in `MONITOR_REVIEW` (Sheets).

It is purely additive: Looker connects to the **same** `ToMonitor` / `RunLog` / `MONITOR_DASHBOARD` tabs via the Google Sheets connector and changes nothing upstream.

## If adopted — design

### Data sources (Google Sheets connector, read-only)
- `RunLog` → KPIs + trend.
- `MONITOR_DASHBOARD` → priority table, keyword & risk distributions.

### Page structure
1. **Overview** — KPI scorecards (Total, Excluded, Monitor, Safe) + Monitor trend line + Risk donut.
2. **Priority Queue** — sortable table (Placement URL, Impressions, Threshold, Risk Score, Priority, Matched Keyword), default sort Risk desc; conditional color on Priority.
3. **Keyword Insights** — bar chart of most-matched keywords; treemap by keyword category (optional).
4. **Trend & History** — Monitor vs Exclude over RunDate; time-series.

### Charts
| Component | Chart type |
|---|---|
| KPIs | Scorecards |
| Monitor over time | Time series / line |
| Risk High/Med/Low | Donut or 100% stacked bar |
| Keyword frequency | Horizontal bar (top 10) |
| Priority queue | Table with heatmap on Risk Score |

### Filters (report-level controls)
- **Run Date** (date/picker — pick a week).
- **Priority** (High/Medium/Low).
- **Matched Keyword**.
- **Review Status** (if surfaced from the joined column).

### Refresh strategy
- Looker Sheets connector caches ~15 min; data freshness is bounded by the **weekly n8n run**, so set **scheduled refresh daily** (cheap) and rely on the weekly write for real changes.
- Add a "Data as of: {RunDate}" text element bound to the latest RunLog row so viewers know the vintage.

### UX recommendations
- Landing on **Overview**; one click to **Priority Queue**.
- Red/Amber/Green only for risk; brand blue `#0b5394` for chrome (consistent with Sheets).
- Keep to 4 pages; avoid chart overload. Provide a short legend explaining Risk Score = Impressions ÷ Threshold × 100.
- Share as **view-only**; reviewers still act in the Sheet.

## Governance note
Looker Studio is a **consumption layer only**. It must never become the system of record; `ToMonitor`/`RunLog` (written by the frozen pipeline) remain canonical. No D04 or classification impact.
