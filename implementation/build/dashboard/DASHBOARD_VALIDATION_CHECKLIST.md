---
document: MONITOR Dashboard — Governance & Validation Checklist
project_code: gapmax
status: DESIGN — sign-off gate before any build
author: sarujanan (Claude execution agent)
date: 2026-06-15
---

> ⚠ **Superseded — see [DASHBOARD_AS_BUILT.md](DASHBOARD_AS_BUILT.md).** Describes the earlier 3-tab dashboard design; kept for history only.


# DASHBOARD_VALIDATION_CHECKLIST.md

## STEP 9 — Governance review (Technical Mini-AIOS)

| Governance requirement | How this design satisfies it | Status |
|---|---|---|
| Does **not** alter D04 rules | Dashboard reads outputs only; no edit to docs/D04 or 01–05 code nodes | ✅ by design |
| Does **not** impact existing outputs | New tabs only (`MONITOR_DASHBOARD`, `MONITOR_REVIEW`, `KPI`, `KEYWORD_DIST`, `RISK_DIST`); `ToMonitor`/`RunLog`/`ToExclude`/`_Validation` untouched | ✅ |
| Backward compatible | All dashboard cells are formulas; deleting dashboard tabs leaves the pipeline fully functional | ✅ |
| Single source of truth preserved | `ToMonitor` + `RunLog` remain canonical; dashboard never writes to them | ✅ |
| No duplicate truth (Skill-05) | Priority/Risk are **presentation transforms** of existing fields, not new business rules | ✅ |
| Queryability / evidence (Skill-09) | Risk formula and field provenance documented in [DASHBOARD_DATA_MODEL.md](DASHBOARD_DATA_MODEL.md) | ✅ |
| Naming convention | Deliverables follow project doc conventions under `implementation/build/dashboard/` | ✅ |
| Work class | GREEN (reporting layer; no production/live-account action) | ✅ |

**Classification-impact statement:** the dashboard introduces **zero** new decisions. `Priority` and `Risk Score` rank existing MONITOR rows for human attention; they never feed back into KEEP/EXCLUDE/MONITOR. The only human-writable data (`MONITOR_REVIEW`) is advisory.

## Acceptance tests (run before stakeholder release)
1. **Non-interference:** run the full n8n workflow with dashboard tabs present → `_Validation` still PASS, counts unchanged (Total/Keep/Exclude/Monitor identical to a no-dashboard run).
2. **Latest-run filter:** `MONITOR_DASHBOARD` shows only the newest `RunDate`; row count == `RunLog.Monitor` of the latest row (e.g. 29).
3. **Risk math:** spot-check 3 rows → `RiskScore == round(Impressions/Threshold*100)`; Priority bucket matches 0.8/0.5 thresholds.
4. **Keyword parse:** `Matched Keyword` equals the `kw:` token in `RuleTrace` for 5 sampled rows.
5. **Persistence:** set a Review Status + Note, re-run n8n, confirm the note **still appears** (joined by URL) and is not duplicated.
6. **No write-back:** confirm dashboard tabs contain only formulas (except `MONITOR_REVIEW`); protected ranges block edits to A–J.
7. **KPI accuracy:** KPI cards equal the latest `RunLog` row exactly.
8. **Resilience:** delete a dashboard tab → pipeline still completes; recreate from template → values return.

## STEP 10 — Deliverables (this set)
| # | File | Covers |
|---|---|---|
| 1 | [DASHBOARD_ARCHITECTURE.md](DASHBOARD_ARCHITECTURE.md) | Steps 1, 2, backward-compat |
| 2 | [DASHBOARD_DATA_MODEL.md](DASHBOARD_DATA_MODEL.md) | Steps 3, 4 |
| 3 | [N8N_DASHBOARD_IMPLEMENTATION_PLAN.md](N8N_DASHBOARD_IMPLEMENTATION_PLAN.md) | Step 6 |
| 4 | [GOOGLE_SHEETS_DASHBOARD_DESIGN.md](GOOGLE_SHEETS_DASHBOARD_DESIGN.md) | Steps 5, 7 |
| 5 | [LOOKER_STUDIO_RECOMMENDATION.md](LOOKER_STUDIO_RECOMMENDATION.md) | Step 8 |
| 6 | DASHBOARD_VALIDATION_CHECKLIST.md (this file) | Steps 9, 10 |

## Open items to confirm before build
- **OI-D1:** Resolve `ToMonitor` writer ownership (Apps Script vs n8n) so a single writer feeds the dashboard.
- **OI-D2:** Confirm whether Looker Studio is in scope (else Sheets-only).
- **OI-D3:** Confirm Review Status vocabulary (`New · In Review · Approved-Keep · Approved-Exclude · Ignore`).
- **OI-D4:** Decide in-sheet formulas (recommended) vs optional "Enrich Monitor" Code node.

**Build begins only after these design docs are approved — no code/sheet changes have been made.**
