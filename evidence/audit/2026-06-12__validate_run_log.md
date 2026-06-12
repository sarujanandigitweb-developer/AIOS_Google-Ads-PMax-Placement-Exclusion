---
asset: 05_validate.js run log
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
supports: implementation/build/n8n/code_nodes/05_validate.js
---

# Validate Node — Run Log 2026-06-12

Full chain normalize->aggregate->threshold->classify->validate on real export.

```
overall pass: true
KEEP/EXCLUDE/MONITOR: 210 / 711 / 29
threshold: 500   exclusion_cap: 65000 (confirmed=false)
failed: []   pending: ["V6"]
```

Gate -> {"pass":true,"excludeCount":711,"withinCap":true}. V6 PENDING (OI-02 safeguard empty, non-blocking). V8 cap unconfirmed (placeholder 65000).
