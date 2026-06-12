---
asset: 04_classify.js validation
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/04_classify.js
method: offline Node.js dry-run, normalize->aggregate->threshold->classify on real export; 40-term keyword tab; empty safeguard
---

# Classify Node — Validation Evidence 2026-06-12

threshold=500 · KEEP=210 EXCLUDE=711 MONITOR=29

| Check | Definition | Pass |
|---|---|---|
| CL1 | all Mobile application -> EXCLUDE (unless safeguard) | ✓ |
| CL2 | all YouTube video -> KEEP (DEC-09) | ✓ |
| CL3 | all Google products -> KEEP (DEC-10) | ✓ |
| CL4 | no MONITOR with impr > threshold | ✓ |
| CL5 | every decision in {KEEP,EXCLUDE,MONITOR} | ✓ |
| CL6 | rows_out == rows_in | ✓ |
| CL7 | Site EXCLUDE/MONITOR had keyword match | ✓ |
| CL8 | counts sum to rows_out | ✓ |
| V6 | safeguard override | PENDING (OI-02 empty) |

by_type breakdown: {"Mobile application":{"KEEP":0,"EXCLUDE":709,"MONITOR":0},"Site":{"KEEP":138,"EXCLUDE":2,"MONITOR":29},"YouTube video":{"KEEP":71,"EXCLUDE":0,"MONITOR":0},"Google products":{"KEEP":1,"EXCLUDE":0,"MONITOR":0}}

## Verdict
**PASS** (V6 pending). 711 EXCLUDE / 29 MONITOR / 210 KEEP across 950 placements. Ready for Validation node (Node 5).
