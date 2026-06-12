---
asset: 05_validate.js validation
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/05_validate.js
method: offline Node.js dry-run, 5-node chain on real export; 40-term keywords; empty safeguard
related: docs/D06_VALIDATION_PLAN.md, queries/VALIDATION_QUERIES.md
---

# Validate Node — V1–V9 Evidence 2026-06-12

Overall: **PASS** (PENDING is non-blocking). KEEP 210 / EXCLUDE 711 / MONITOR 29; threshold 500.

| ID | Check | Status | Detail |
|---|---|---|---|
| V1 | Mobile applications -> EXCLUDE | PASS | 709 apps, 0 mis-classified |
| V2 | YouTube video never EXCLUDE | PASS | 0 violations |
| V3 | Google products never EXCLUDE | PASS | 0 violations |
| V4 | MONITOR <= threshold | PASS | 0 over threshold |
| V5 | valid decisions only | PASS | 0 invalid |
| V6 | safeguard override | PENDING | safeguard list empty (OI-02 open) — non-blocking |
| V7 | no duplicate urlKey in EXCLUDE | PASS | 0 duplicates |
| V8 | EXCLUDE count <= cap | PASS | exclude=711 cap=65000 (cap unconfirmed) |
| V9 | counts reconcile | PASS | 210+711+29 vs 950 |

Gate for IF node: pass=true, excludeCount=711, withinCap=true.

## Verdict
**PASS** with V6 PENDING (OI-02) and V8 cap to be confirmed. Phase-1 offline filtering logic (Nodes 1–5) validated end-to-end on real data.
