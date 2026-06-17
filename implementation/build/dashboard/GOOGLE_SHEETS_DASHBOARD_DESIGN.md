---
document: MONITOR Dashboard — Google Sheets Design
project_code: gapmax
status: DESIGN — not implemented
author: sarujanan (Claude execution agent)
date: 2026-06-15
brand: header colour #0b5394 (matches existing styleHeader_ in build_output_tabs.gs)
---

> ⚠ **Superseded — see [DASHBOARD_AS_BUILT.md](DASHBOARD_AS_BUILT.md).** Describes the earlier 3-tab dashboard design; kept for history only.


# GOOGLE_SHEETS_DASHBOARD_DESIGN.md

## STEP 5 — Dashboard components

### 1. Executive KPI Cards (top of `KPI` / dashboard header band)
Read the **latest** `RunLog` row. Place as four merged "card" ranges with large numbers.
```
LatestRow      = COUNTA(RunLog!A:A)
Total          = INDEX(RunLog!B:B, LatestRow)
Total Excluded = INDEX(RunLog!D:D, LatestRow)
Total Monitor  = INDEX(RunLog!E:E, LatestRow)
Total Safe     = INDEX(RunLog!C:C, LatestRow)        ' Keep
Run Date       = INDEX(RunLog!A:A, LatestRow)
```
Design: 4 cards, each = big number (28–36pt bold) + label (10pt grey) + brand top-border. Cards: **Total Placements · Excluded · Monitor · Safe (Keep)**.

### 2. Monitor Priority Table (`MONITOR_DASHBOARD`)
- Body = latest-run QUERY (see implementation plan), columns A–L per data model.
- **Sorted by Risk Score desc** (`order by ... ` in QUERY, or a Filter View sort on J).
- Freeze header row + freeze column B (Placement URL) for horizontal scroll.

### 3. Monitor Trend Analysis
- Source: `RunLog` (`RunDate` vs `Monitor`).
- Inline: `=SPARKLINE(RunLog!E2:E,{"charttype","line";"color1","#0b5394"})` in a KPI card.
- Full: a **Line chart** (X = RunDate, Y = Monitor) on the dashboard; optionally overlay Exclude (D) for context.

### 4. Keyword Distribution Analysis (`KEYWORD_DIST`)
Most-matched unrelated keywords in the latest run:
```
=QUERY(MONITOR_DASHBOARD!F2:F, "select F, count(F) where F is not null group by F order by count(F) desc label count(F) 'Count'", 0)
```
Render as a **bar chart** (top 10). Reveals which themes (jeux, sport, news…) drive monitoring.

### 5. Risk Distribution Visualization (`RISK_DIST`)
```
High   = COUNTIF(MONITOR_DASHBOARD!I:I,"High")
Medium = COUNTIF(MONITOR_DASHBOARD!I:I,"Medium")
Low    = COUNTIF(MONITOR_DASHBOARD!I:I,"Low")
```
Render as a **stacked bar or donut** (Red/Amber/Green).

### 6. Action Queue
A filtered view of placements needing review **now**:
```
=QUERY(MONITOR_DASHBOARD!A2:L,
  "where I = 'High' and (K = 'New' or K = 'In Review') order by J desc", 0)
```
Shows High-priority, not-yet-resolved placements, highest risk first.

## STEP 7 — Google Sheets design standards

**Layout**
- One **`Dashboard`** landing tab: KPI cards (rows 1–5), Risk donut + Trend line (rows 6–18), Action Queue (row 20+).
- Supporting tabs: `MONITOR_DASHBOARD` (full table), `MONITOR_REVIEW` (review input), `KEYWORD_DIST`, `RISK_DIST`. Hide raw helper tabs from stakeholders.

**Conditional formatting**
| Range | Rule | Format |
|---|---|---|
| Priority (I) = High | text is "High" | red fill `#f4c7c3`, dark red text |
| Priority (I) = Medium | "Medium" | amber fill `#fce8b2` |
| Priority (I) = Low | "Low" | green fill `#b7e1cd` |
| Risk Score (J) | color scale 0→100 | green→amber→red gradient |
| Review Status (K) = "Approved/Excluded" | text | grey strikethrough (resolved) |

**Color usage:** brand header `#0b5394` + white text (matches existing styled tabs); semantic Red/Amber/Green for risk only; neutral greys for chrome. Avoid >3 accent colors.

**Filtering:** create a **Filter View** (not raw filter) on `MONITOR_DASHBOARD` so stakeholders can slice by Priority/Keyword/Status without disturbing others.

**Freeze panes:** `MONITOR_DASHBOARD` → freeze row 1 + column B. KPI/Dashboard → freeze rows 1–5.

**Data validation**
- `MONITOR_REVIEW.B (Review Status)` → dropdown: `New · In Review · Approved-Keep · Approved-Exclude · Ignore`.
- `MONITOR_REVIEW.A (Placement URL)` → optional dropdown sourced from `MONITOR_DASHBOARD!B:B` to avoid typos.

**Protection:** protect formula columns A–J of `MONITOR_DASHBOARD` (warning-only) so reviewers edit only `MONITOR_REVIEW`.

**Executive polish:** number formats (Impressions `#,##0`; Risk `0`), 22–28px row height on KPI cards, consistent 10pt body font, generous white space, a title + "Last updated: =RunDate" caption.
