---
document: Classification Ownership — Duplicate-Truth Resolution
project_code: gapmax
requirement_id: REQ-01
status: GOVERNANCE — authoritative
author: sarujanan (Claude execution agent)
date: 2026-06-16
resolves: HIGH duplicate-truth risk (two engines implement D04)
---

# Classification Ownership

D04 classification + threshold logic is implemented in **two** places. This document
declares the single source of truth so they cannot silently drift.

## Ownership hierarchy
| Layer | File(s) | Role | Authority |
|---|---|---|---|
| **Rules (canonical)** | [docs/D04_BUSINESS_RULES.md](../../docs/D04_BUSINESS_RULES.md) | The business rules themselves | **SOURCE OF TRUTH** — rules change here first |
| **Runtime engine (production)** | [n8n/code_nodes/03_threshold.js](n8n/code_nodes/03_threshold.js), [04_classify.js](n8n/code_nodes/04_classify.js) (+01,02,05,06) | Executes D04 in the live weekly workflow | **AUTHORITATIVE EXECUTION** — what actually classifies placements |
| **Offline mirror** | [apps_script/build_output_tabs.gs](apps_script/build_output_tabs.gs) (`threshold_`, `classify_`) | Optional Sheet-side regeneration of ToExclude/ToMonitor/RunLog without n8n | **MIRROR ONLY** — must match the runtime engine; never the authority |
| **Visualization (read-only)** | [apps_script/dashboard.gs](apps_script/dashboard.gs) | Renders the Dashboard from output tabs | No classification logic |

## Rules of change
1. A rule change starts in **D04**, then is applied to the **n8n code nodes** (runtime), then mirrored into **build_output_tabs.gs**. Never the reverse.
2. The **n8n code nodes are the production classifier.** If the two engines ever disagree, the n8n result is correct and `build_output_tabs.gs` is the bug.
3. `build_output_tabs.gs` carries a header note that its `classify_`/`threshold_` mirror D04 and must stay in sync — it is a convenience, not a second source of truth.

## Writer ownership (related)
To avoid two writers on one tab:
- **ToMonitor / ToExclude / RunLog** are written by the **n8n** Google Sheets nodes in the live workflow (confirmed in the exported JSON).
- `build_output_tabs.gs` should only write those tabs when running the **offline** path *without* n8n; do not run both writers against the same tab in the same cycle.
- **Dashboard** tab is written only by `dashboard.gs`.

## Verification
- Runtime counts (RunLog): `950 / 210 / 711 / 29 / threshold 500 / PASS` — see [evidence/exports/Google ads Placement Data - RunLog.csv](../../evidence/exports/Google%20ads%20Placement%20Data%20-%20RunLog.csv).
- The offline mirror must reproduce the same counts on the same input; if it does not, fix `build_output_tabs.gs` to match the n8n nodes.

**Net effect:** duplicate-truth risk is downgraded from HIGH to MANAGED — one canonical rules doc, one authoritative runtime engine, one explicitly-subordinate mirror.
