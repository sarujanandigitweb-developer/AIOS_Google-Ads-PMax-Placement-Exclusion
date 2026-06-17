# Skill File — REQ-01-D03 (2026-06-16, Tuesday)

| Field | Value |
|---|---|
| date | 2026-06-16 |
| developer | sarujanan |
| project | Google Ads PMax Placement Exclusion |
| project_code | gapmax |
| phase | Phase 3 – Dashboard, Auto-refresh & Governance |
| requirement_id | REQ-01 |
| deliverable_id | D03 |
| status | COMPLETE (latest `dashboard.gs` pending commit) |
| evidence_location | `evidence/exports/GADS_PMAX_Placement Exclusion.json`, `evidence/exports/Google ads Placement Data - RunLog.csv`, `evidence/screenshots/` (8 files); `implementation/build/apps_script/dashboard.gs` |
| blos_keys_used | DASH_REFRESH_TOKEN, IMPRESSION_FLOOR, EXCLUSION_CAP, priority cutoffs (High/Medium/Low) |
| hardcoded_thresholds | YES — priority cutoffs `≥0.8 High / ≥0.5 Medium / else Low`; `IMPRESSION_FLOOR=500`; `EXCLUSION_CAP=65000`; `DASH_REFRESH_TOKEN` (secret — keep out of git, rotate if exposed) |
| three_am_standard | PASS |
| llm_queryable | YES |
| company_knowledge_candidate | YES |
| domain | Advertising / Google Ads PMax |

## 1. SYSTEM STATE
The full pipeline ran end-to-end and wrote ToExclude/ToMonitor/RunLog/_Validation correctly. There was **no visualization layer** and **no auto-refresh**: outputs lived only as raw tabs. Evidence (workflow JSON, screenshots) was not yet filed.

## 2. WHAT CHANGED TODAY
- **Single-tab A:Z executive dashboard** (`dashboard.gs`): header + status pill, 8 KPI cards, trend panels, risk split, top-15 monitor queue, top-10 exclusions, validation center, footer. Read-only over the 4 source tabs; idempotent rebuild.
- **Web App refresh endpoint** (`doPost`/`doGet`/`handleRefresh_` + shared token) — n8n calls it after writing tabs so the dashboard auto-refreshes.
- **Chart-rendering resilience:** embedded charts → replaced with **in-cell SPARKLINE** (risk bars + trend lines via inline array); `chartSafe_` retry; `fallbackPanel_` for degenerate/zero data.
- **Evidence filed:** exported live workflow JSON (24 nodes), RunLog CSV (25 PASS runs), 8 screenshots.
- **Governance docs:** as-built connection map, FAILURE_RECOVERY_GUIDE, WEBAPP_DEPLOYMENT, CLASSIFICATION_OWNERSHIP, DASHBOARD_AS_BUILT.

## 3. POSTGRESQL / MCP FINDING
No DB. **Apps Script / Google-charts platform finding:** `EmbeddedChartBuilder.insertChart()` **succeeds** (chart title renders) but the plot **does not render** in this Google account — a *render* failure Apps Script cannot catch (no exception). **In-cell `SPARKLINE` (a cell formula) always renders** and is the reliable substitute. Also: the Web App `/exec` runs the **deployed** version, not the editor — code changes require **Deploy → New version**.

## 4. GAP FOUND
- **ToMonitor source duplication** — the n8n `Merge` emits **1901 items**; every placement is doubled, so risk reads `High 2 / Medium 2 / Low 54` instead of `1/1/27`. Upstream pipeline defect (one-writer-per-tab not enforced).
- **Constant trend data** — every run is `711/29/500`, so trend lines are inherently flat until run-to-run values differ.
- **Recurring "blank chart" reports** traced mostly to **stale deployment** (editor saved, deployment not re-versioned).

## 5. VALIDATION RULE ADDED OR CHANGED
Visualization rules (presentation only — no business-logic change):
```
Risk priority (display): impressions/threshold ≥ 0.80 → High; ≥ 0.50 → Medium; else Low.
Dashboard is READ-ONLY over outputs; it never writes ToExclude/ToMonitor/RunLog/_Validation.
Web App auth: reject unless trim(token) == trim(DASH_REFRESH_TOKEN); always HTTP 200 (ContentService) → caller checks JSON `ok`.
n8n HTTP node: Execute Once + Continue On Fail + Follow Redirects.
```

## 6. FAILURE MODE OR EDGE CASE
- **`Illegal argument` in KPI card** — a `Date` RunDate has no `.length` → NaN `setTextStyle` offsets. Fix: coerce all rich-text parts to strings.
- **Off-screen helper cells inherited stale DATE formatting** — number `711` displayed as `1901-12-11` (date serial 711); broke the line series. Fix: build SPARKLINE from an **inline array** (no off-screen cells).
- **`ymin:0` pinned a constant line to the top edge** → looked blank. Fix: auto-scale (centered flat line).
- **"An unknown error has occurred, please try again later"** on `insertChart` — transient chart-service failure → retry/backoff, non-fatal.
- **Stale Web App deployment** → "same issue repeatedly" until **New version** deployed.

## 7. DECISIONS MADE TODAY
- **SPARKLINE over embedded charts** for all critical visuals (guaranteed rendering).
- **Inline-array SPARKLINE** (no off-screen helper columns) — removes date-format inheritance, collisions, and magic column numbers.
- **Event-driven refresh** via Apps Script Web App `doPost` + shared token (n8n triggers it post-write).
- **Idempotent rebuild:** remove charts → break merges → clear CF rules → `clear()` → rebuild.

## 8. COMPANY KNOWLEDGE EXTRACT
- **Embedded Google-Sheets charts are unreliable across accounts** — prefer in-cell `SPARKLINE`; you cannot detect a *render* failure in code, only an *insert* failure.
- **Stale-deployment rule:** any Apps Script Web App serves the deployed snapshot; "edit ≠ live" — always Deploy → New version (same `/exec`).
- **doPost pattern:** ContentService always returns 200 → callers must check a JSON `ok` field; guard with a trim-compared token; pair with n8n HTTP "Execute Once + Continue On Fail + Follow Redirects".
- **Degenerate-data UX:** constant/zero series can't form a chart — render a flat sparkline or an honest message, never a blank box.
- **RichText offset trap:** non-string values (Date) break `setTextStyle`; always coerce first.

## 9. LLM STANDARD CHECK
Consistent vocabulary ✅ · render-vs-insert failure distinction explained ✅ · every failure mapped to a fix ✅ · evidence linked (JSON/CSV/screenshots) ✅ · upstream gap (duplication) flagged ✅ · **LLM Queryable: TRUE**.

## BLOS Governance note
Priority cutoffs (`0.80 / 0.50`) are **business thresholds currently hardcoded** in `dashboard.gs` → BLOS-candidate. `DASH_REFRESH_TOKEN` is a **secret**: keep the real value out of git (repo holds a placeholder), and **rotate it** (it was exposed in a shared n8n config). `IMPRESSION_FLOOR`/`EXCLUSION_CAP` remain BLOS-candidates from D01/D02.
