---
document: MONITOR Dashboard — Build Spec (Google Sheets, formula-driven)
project_code: gapmax
requirement_id: REQ-01 (reporting layer)
status: IMPLEMENTATION ARTIFACT — ready to apply in the Sheet
author: sarujanan (Claude execution agent)
date: 2026-06-15
decisions: OI-D1 n8n sole ToMonitor writer · OI-D2 Sheets only (no Looker) ·
           OI-D3 status set fixed · OI-D4 in-sheet formulas only (no new n8n nodes)
constraint: no D04 / classification / n8n-node change; new tabs only; backward compatible
---

> ⚠ **Superseded — see [DASHBOARD_AS_BUILT.md](DASHBOARD_AS_BUILT.md).** Describes the earlier 3-tab dashboard design; kept for history only.


# DASHBOARD_BUILD_SPEC.md

## Source tabs (read-only inputs — unchanged)
- `ToMonitor` (n8n sole writer): `A Placement · B Placement URL · C Type · D Impressions · E Decision · F RuleTrace · G RunDate`. Header row 1, data row 2+. Append-only (history retained).
- `RunLog`: `A RunDate · B Total · C Keep · D Exclude · E Monitor · F Threshold · G Pass · H Failed · I Pending · J Keywords · K Safeguard`.

`RuleTrace` for MONITOR rows is always `order-3:Site+kw:<keyword>+<impr><=<threshold>` (emitted by 04_classify.js) → Threshold and Matched Keyword are parseable in-sheet.

---

## 1. Tabs to create
1. **`MONITOR_REVIEW`** — human-owned review metadata (create first; the dashboard joins to it).
2. **`MONITOR_DASHBOARD`** — the live priority table.
3. **`Dashboard`** — executive landing page (KPIs, trend, risk, keyword, action queue).

---

## 2. `MONITOR_REVIEW` (build first)
Header row 1: `A Placement URL | B Review Status | C Reviewer Notes | D Last Updated`.

**Optional one-time seed of URLs** (so reviewers have rows). In a scratch cell (e.g. `F1`), run, then **Copy → Paste special → Values only** into `A2`:
```
=UNIQUE(FILTER(ToMonitor!B2:B, ToMonitor!E2:E="MONITOR"))
```
Paste-as-values keeps column A editable. `B`, `C`, `D` are typed by reviewers (D optional manual timestamp).

---

## 3. `MONITOR_DASHBOARD` — layout & exact formulas
Header row 1 (type literally):
`A Run Date | B Placement URL | C Type | D Impressions | E Decision | F Rule Trace | G Threshold | H Matched Keyword | I Risk Score | J Priority | K Review Status | L Reviewer Notes`

> Base columns **A–F** come from one QUERY (the latest run only). Derived **G–L** are `ARRAYFORMULA`s to the right — no interleave, no collisions.

### 3.1 Latest-run control cell — `N1`
(Place out to the side; `N` is the control column.) Latest run that produced MONITOR rows:
```
=IFERROR(INDEX(SORT(UNIQUE(FILTER(ToMonitor!G2:G,(ToMonitor!E2:E="MONITOR")*(ToMonitor!G2:G<>""))),1,FALSE),1),"")
```
(Text dates `yyyy-MM-dd HH:mm` sort chronologically, so the first descending value = latest run.)

### 3.2 Latest MONITOR extraction — `A2` (spills A2:F)
```
=QUERY(ToMonitor!A2:G, "select G,B,C,D,E,F where E='MONITOR' and G='"&$N$1&"' order by D desc", 0)
```
Returns RunDate, Placement URL, Type, Impressions, Decision, RuleTrace for the latest run, sorted by Impressions desc (within a run the threshold is constant, so impressions-desc == risk-desc).

### 3.3 Threshold extraction — `G2`
```
=ARRAYFORMULA(IF(A2:A="","", IFERROR(VALUE(REGEXEXTRACT(F2:F,"<=(\d+)")),"")))
```

### 3.4 Matched Keyword extraction — `H2`
```
=ARRAYFORMULA(IF(A2:A="","", IFERROR(REGEXEXTRACT(F2:F,"kw:([^+]+)"),"")))
```

### 3.5 Risk Score — `I2`  (0–100 = Impressions ÷ Threshold × 100)
```
=ARRAYFORMULA(IF(A2:A="","", IFERROR(ROUND(D2:D/G2:G*100,0),0)))
```

### 3.6 Priority — `J2`  (High ≥80 · Medium ≥50 · Low <50)
```
=ARRAYFORMULA(IF(A2:A="","", IF(IFERROR(D2:D/G2:G,0)>=0.8,"High", IF(IFERROR(D2:D/G2:G,0)>=0.5,"Medium","Low"))))
```

### 3.7 Review Status lookup — `K2`  (defaults "New")
```
=ARRAYFORMULA(IF(A2:A="","", IFERROR(VLOOKUP(B2:B, MONITOR_REVIEW!$A:$B, 2, FALSE),"New")))
```

### 3.8 Reviewer Notes lookup — `L2`
```
=ARRAYFORMULA(IF(A2:A="","", IFERROR(VLOOKUP(B2:B, MONITOR_REVIEW!$A:$C, 3, FALSE),"")))
```

> Only `A2`, `G2`, `H2`, `I2`, `J2`, `K2`, `L2` and `N1` contain formulas. Everything else fills by spill. Editing any other cell breaks the view — protect it (section 7).

---

## 4. `Dashboard` — KPI, trend, distributions, action queue

### 4.1 Executive KPI cards (latest RunLog row)
Helper (e.g. `Z1`): `=COUNTA(RunLog!A:A)` → last RunLog row index. Then:
| Card | Formula |
|---|---|
| Run Date | `=INDEX(RunLog!A:A,$Z$1)` |
| Total Placements | `=INDEX(RunLog!B:B,$Z$1)` |
| Total Safe (Keep) | `=INDEX(RunLog!C:C,$Z$1)` |
| Total Excluded | `=INDEX(RunLog!D:D,$Z$1)` |
| Total Monitor | `=INDEX(RunLog!E:E,$Z$1)` |
| Run Threshold | `=INDEX(RunLog!F:F,$Z$1)` |

### 4.2 Monitor Trend (count over time)
Inline sparkline:
```
=SPARKLINE(RunLog!E2:E,{"charttype","line";"color1","#0b5394"})
```
Full chart: **Insert → Chart → Line**, X = `RunLog!A2:A` (RunDate), Y = `RunLog!E2:E` (Monitor). Optional 2nd series `RunLog!D2:D` (Exclude).

### 4.3 Risk Distribution (counts)
```
High   =COUNTIF(MONITOR_DASHBOARD!J:J,"High")
Medium =COUNTIF(MONITOR_DASHBOARD!J:J,"Medium")
Low    =COUNTIF(MONITOR_DASHBOARD!J:J,"Low")
```
Chart these three as a **donut** (Red/Amber/Green).

### 4.4 Keyword Distribution (most-matched, top of latest run)
```
=QUERY(MONITOR_DASHBOARD!H2:H, "select H, count(H) where H is not null and H<>'' group by H order by count(H) desc label H 'Keyword', count(H) 'Count'", 0)
```
Render the spilled result as a **horizontal bar** chart (top 10).

### 4.5 Action Queue (High priority, not yet resolved, highest risk first)
```
=QUERY(MONITOR_DASHBOARD!A2:L, "select B,D,G,H,I,J,K where J='High' and (K='New' or K='In Review') order by I desc", 0)
```
Columns returned: Placement URL, Impressions, Threshold, Matched Keyword, Risk Score, Priority, Review Status.

---

## 5. Conditional formatting specifications
Apply on `MONITOR_DASHBOARD` (and mirror on the Action Queue range):
| Range | Condition | Format |
|---|---|---|
| `J2:J` (Priority) | Text **is exactly** `High` | Fill `#F4C7C3`, text `#990000`, bold |
| `J2:J` | Text is exactly `Medium` | Fill `#FCE8B2` |
| `J2:J` | Text is exactly `Low` | Fill `#B7E1CD` |
| `I2:I` (Risk Score) | **Color scale** | Min 0 `#57BB8A` · Mid 50 `#FFD666` · Max 100 `#E67C73` |
| `K2:K` (Review Status) | Text is exactly `Approved-Keep` | Fill `#EFEFEF`, strikethrough |
| `K2:K` | Text is exactly `Approved-Exclude` | Fill `#EFEFEF`, strikethrough |
| `K2:K` | Text is exactly `Ignored` | Fill `#EFEFEF`, italic grey |
| `K2:K` | Text is exactly `New` | Text bold `#0b5394` |

Header band (`A1:L1`): fill `#0b5394`, white bold, centered (matches existing styled tabs).

---

## 6. Data validation configurations
| Sheet/Range | Rule | Settings |
|---|---|---|
| `MONITOR_REVIEW!B2:B` (Review Status) | **Dropdown (list of items)** | `New, In Review, Approved-Keep, Approved-Exclude, Ignored` · **Reject input** · show dropdown |
| `MONITOR_REVIEW!A2:A` (Placement URL) | Dropdown from range (optional) | `=MONITOR_DASHBOARD!$B$2:$B` · Allow invalid = warning |
| `MONITOR_REVIEW!D2:D` (Last Updated) | Date (optional) | Reviewer-entered |
| `MONITOR_DASHBOARD` | **none** | fully formula-driven; no manual entry |

---

## 7. Sheet protection recommendations
| Object | Protection |
|---|---|
| `MONITOR_DASHBOARD` (whole sheet) | **Protect range/sheet**, "Show warning" or restrict to owner — it's all formulas/spills |
| `Dashboard` (whole sheet) | Protect (KPIs/charts) — owner-only edit |
| `MONITOR_REVIEW!1:1` (header) | Protect header row only; leave `A:D` (rows 2+) editable for reviewers |
| `ToMonitor`, `RunLog`, `ToExclude`, `_Validation` | Protect from manual edits (n8n/Apps Script writes only) — prevents accidental corruption of the dashboard's sources |

Freeze panes: `MONITOR_DASHBOARD` → **freeze row 1 + column B**. `Dashboard` → freeze the KPI band rows.

---

## 8. Implementation checklist
- [ ] **8.1** Confirm `ToMonitor` is written **only by n8n** (OI-D1), Append Row + manual mapping, columns A–G as above (no `__validation`/`__summary` columns).
- [ ] **8.2** Create `MONITOR_REVIEW`; add header; (optional) seed URLs via §2 and paste-as-values.
- [ ] **8.3** Set Review Status dropdown (§6) on `MONITOR_REVIEW!B2:B`.
- [ ] **8.4** Create `MONITOR_DASHBOARD`; type header row (§3).
- [ ] **8.5** Enter `N1` (§3.1), then `A2` QUERY (§3.2); confirm A2:F spills the latest run.
- [ ] **8.6** Enter derived formulas `G2,H2,I2,J2,K2,L2` (§3.3–3.8); confirm they align row-for-row.
- [ ] **8.7** Apply conditional formatting (§5) and freeze panes (§7).
- [ ] **8.8** Create `Dashboard`; add KPI cards (§4.1), trend (§4.2), risk donut (§4.3), keyword bar (§4.4), action queue (§4.5).
- [ ] **8.9** Apply protections (§7).
- [ ] **8.10** **Validation run** (per DASHBOARD_VALIDATION_CHECKLIST.md): execute n8n once → `_Validation` still PASS; `MONITOR_DASHBOARD` row count == latest `RunLog.Monitor` (e.g. 29); spot-check Risk/Priority/Keyword on 3 rows; set a Review note, re-run, confirm it persists by URL and isn't duplicated.
- [ ] **8.11** Hide helper column `N` and the `Z1` helper; share `Dashboard` view-only with stakeholders.

## Backward-compatibility statement
All formulas **read** `ToMonitor` / `RunLog`; nothing writes back to them. Deleting any dashboard tab leaves the pipeline fully functional. No code node (01–05), D04 rule, or n8n classification output is modified. Work class: **GREEN**.
