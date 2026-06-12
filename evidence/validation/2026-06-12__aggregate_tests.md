---
asset: 02_aggregate.js validation
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/02_aggregate.js
method: offline Node.js dry-run, 01_normalize -> 02_aggregate on real export
---

# Aggregate Node — Validation Evidence 2026-06-12

| Check | Definition | Result | Pass |
|---|---|---|---|
| AG1 | Σ impr before == after | 28619 == 28619 | ✓ |
| AG2 | no duplicate urlKey | 950/950 unique | ✓ |
| AG3 | campaignCount == unique campaigns | per-record | ✓ |
| AG4 | sourceRows >= campaignCount | per-record | ✓ |
| AG5 | rows_out > 0 | 950 | ✓ |
| AG6 | impression sum match (hardError) | hardError=false | ✓ |
| dedup | output < input | 950 < 1223 | ✓ |

Cross-campaign SUM example (most-duplicated): impressions=41 across 4 rows / 4 campaigns.

## Verdict
**PASS** — 273 duplicate rows collapsed into 950 unique placements; impressions conserved (28619); output ready for Threshold (Node 3).
