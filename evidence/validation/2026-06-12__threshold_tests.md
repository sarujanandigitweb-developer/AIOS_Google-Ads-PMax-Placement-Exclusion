---
asset: 03_threshold.js validation
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/03_threshold.js
method: offline Node.js dry-run, normalize->aggregate->threshold on real export
---

# Threshold Node — Validation Evidence 2026-06-12

| Check | Definition | Result | Pass |
|---|---|---|---|
| TH1 | threshold == max(raw_avg, floor) | 500 == max(39.39,500) | ✓ |
| TH2 | threshold >= floor (500) | 500 | ✓ |
| TH3 | site_count > 0 | 169 | ✓ |
| TH4 | raw_avg == site_impr/site_count | 39.3905 | ✓ |
| TH5 | rows_out == rows_in (pass-through) | 950==950 | ✓ |
| TH6 | floor applied when raw_avg<floor | floor_applied=true | ✓ |

Computed over 169 aggregated Site placements (Σ impr 6657).

## Verdict
**PASS** — threshold = 500 (500 floor dominates; raw avg 39.39). Each of 950 records carries threshold for Classify (Node 4).
