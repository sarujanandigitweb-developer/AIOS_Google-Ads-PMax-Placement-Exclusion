---
asset: 02_aggregate.js run log
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/02_aggregate.js
---

# Aggregate Node — Run Log 2026-06-12

Chained 01_normalize -> 02_aggregate on real Placement Data export (offline /tmp copy).

```
rows_in (normalized):         1223
rows_out (unique placements): 950
duplicate_rows_collapsed:     273
total_impressions_before:     28619
total_impressions_after:      28619
hardError:                    false
warnings:                     0
```

Most-duplicated placement: "msn.com" — impr=41, sourceRows=4, campaigns=4.
1223 normalized rows collapsed to 950 unique placements (273 cross-campaign duplicate rows summed), matching discovery (273 extra rows).
