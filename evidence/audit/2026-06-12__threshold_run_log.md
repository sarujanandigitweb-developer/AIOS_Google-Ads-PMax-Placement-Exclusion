---
asset: 03_threshold.js run log
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/03_threshold.js
---

# Threshold Node — Run Log 2026-06-12

Chained 01_normalize -> 02_aggregate -> 03_threshold on real export (offline /tmp copy).

```
rows_in/out:        950 / 950
site_count (unique):169
site_impressions:   6657
raw_avg:            39.3905
impression_floor:   500   (DEC-02)
threshold:          500
floor_applied:      true
hardError:          false
```

raw_avg (39.39) < floor (500) -> floor dominates, threshold = 500.
Confirms D04 Rule 1 expectation that the 500 floor governs at current data volumes.
