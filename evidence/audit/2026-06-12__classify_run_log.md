---
asset: 04_classify.js run log
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/04_classify.js
---

# Classify Node — Run Log 2026-06-12

Chained normalize->aggregate->threshold->classify on real export; keywords=40 (Sheet tab), safeguard=0 (OI-02 empty).

```
rows:        950
threshold:   500
KEEP:        210
EXCLUDE:     711
MONITOR:     29
hardError:   false
```

by_type: {"Mobile application":{"KEEP":0,"EXCLUDE":709,"MONITOR":0},"Site":{"KEEP":138,"EXCLUDE":2,"MONITOR":29},"YouTube video":{"KEEP":71,"EXCLUDE":0,"MONITOR":0},"Google products":{"KEEP":1,"EXCLUDE":0,"MONITOR":0}}

Note: with the 500 floor, most keyword-hit Sites fall <= threshold and route to MONITOR (expected per D04). YouTube video + Google products all KEEP (DEC-09/10). Safeguard no-op (OI-02 open) — V6 PENDING.
