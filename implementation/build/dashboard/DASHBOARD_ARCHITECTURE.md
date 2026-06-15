---
document: MONITOR Dashboard — Architecture
project_code: gapmax
requirement_id: REQ-01 (reporting layer; no logic change)
status: DESIGN — not implemented
author: sarujanan (Claude execution agent)
date: 2026-06-15
constraint: read-only over existing outputs; D04 + classification untouched
---

# DASHBOARD_ARCHITECTURE.md

## STEP 1 — Existing workflow analysis (evidence)

**Where MONITOR is generated:** [04_classify.js:97-98](../n8n/code_nodes/04_classify.js) — a placement is `MONITOR` only when
`type = Site` **AND** an unrelated keyword matches **AND** `impressions <= threshold`
(`ruleTrace = order-3:Site+kw:<kw>+<impr><=<threshold>`). This is D04 Rule 3 and **must not change**.

**How Sheets are updated today:** the `ToMonitor` tab is written **append-only (history retained)** — by the Apps Script `writeMonitor_()` ([build_output_tabs.gs:309](../apps_script/build_output_tabs.gs)) and/or the n8n Google Sheets writer (ownership reconciliation still open). The `RunLog` tab appends one summary row per run.

**Fields available for the dashboard (no new computation needed):**
| Source tab | Columns |
|---|---|
| `ToMonitor` | `Placement (A) · Placement URL (B) · Type (C) · Impressions (D) · Decision (E) · RuleTrace (F) · RunDate (G)` |
| `RunLog` | `RunDate · Total · Keep · Exclude · Monitor · Threshold · Pass · Failed · Pending · Keywords · Safeguard` |
| Derivable from `RuleTrace` | **Matched Keyword** = `REGEXEXTRACT(F,"kw:([^+]+)")`; **Threshold** = `REGEXEXTRACT(F,"<=(\d+)")` |

➡️ **Key finding:** every field the dashboard needs already exists in `ToMonitor` + `RunLog`, or is parseable from `RuleTrace`. **No upstream/classification change is required.**

## STEP 2 — Architecture decision

```
Google Ads (PMax placements)
        ↓
n8n  (01_Normalize → … → 05_Validate)          [UNCHANGED]
        ↓
Google Sheets data tabs: ToMonitor, RunLog      [UNCHANGED — single source of truth]
        ↓
Google Sheets DASHBOARD tabs  (read-only views via formulas)   [NEW]
        ↓ (optional)
Looker Studio  (executive visuals, read-only)   [OPTIONAL]
```

**Recommendation: Google-Sheets-first, Looker-Studio-optional ("Both supported, Sheets primary").**

| Need | Best tool | Why |
|---|---|---|
| Operational review (reviewers set status / notes, **write-back**) | **Google Sheets** | Looker Studio is **read-only** — it cannot capture reviewer decisions. Review must live in Sheets. |
| Zero new infrastructure / cost | **Google Sheets** | Data is already in Sheets; dashboards are formula tabs, auto-refresh on each n8n run. |
| Polished stakeholder visuals, scheduled PDF/email, multi-page | **Looker Studio** | Better charts and sharing for non-editors; connects to the same tabs. |

**Justification:** the MONITOR workflow is fundamentally a **human-review queue** (reviewers must mark placements and add notes), and only Sheets supports write-back. Therefore Sheets is the operational dashboard. Looker Studio is recommended **only if** stakeholders want a read-only executive view or scheduled exports — it is additive and changes nothing upstream. Do **not** make Looker the system of record.

## Backwards-compatibility guarantees
- The dashboard is built on **new tabs only** (`MONITOR_DASHBOARD`, `MONITOR_REVIEW`, `KPI`); existing `ToMonitor` / `RunLog` / `ToExclude` / `_Validation` are read, never altered.
- All dashboard values are **formulas referencing existing tabs** — if the dashboard tabs were deleted, the pipeline would still run identically.
- No code node (01–05), no D04 rule, and no classification output is modified.

See [DASHBOARD_DATA_MODEL.md](DASHBOARD_DATA_MODEL.md) for fields & scoring, and [DASHBOARD_VALIDATION_CHECKLIST.md](DASHBOARD_VALIDATION_CHECKLIST.md) for governance sign-off.
