---
document: VALIDATION_QUERIES
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: DRAFT — design, not executed against production
related: docs/D06_VALIDATION_PLAN.md
---

# Validation Queries

Maps to [D06 test cases](../docs/D06_VALIDATION_PLAN.md). Run against a **sample/staging** dataset only.

## VQ1 — Threshold sanity (V1)
```sql
SELECT SUM(impressions) AS site_impr, COUNT(*) AS n_sites,
       SUM(impressions)::float/NULLIF(COUNT(*),0) AS raw_avg,
       GREATEST(SUM(impressions)::float/NULLIF(COUNT(*),0), 500) AS threshold
FROM placements WHERE type='Site';
```

## VQ2 — Decision distribution
```sql
SELECT decision, COUNT(*) FROM (/* Q1 from QUERY_PACK */) c GROUP BY decision;
```

## VQ3 — All app placements excluded (V2)
```sql
SELECT placement, decision FROM (/* Q1 */) c
WHERE (lower(placement) LIKE '%play.google.com%' OR lower(placement) LIKE '%apps.apple.com%'
       OR lower(placement) LIKE '%itunes%' OR lower(placement) LIKE '%android-app://%')
  AND decision <> 'EXCLUDE';     -- expect 0 rows
```

## VQ4 — Monitor must be ≤ threshold (V4)
```sql
SELECT * FROM (/* Q1 */) c, (SELECT 500.0 AS threshold) t
WHERE c.decision='MONITOR' AND c.impressions > t.threshold;  -- expect 0 rows
```

## VQ5 — Idempotency / duplicate key (V7)
```sql
SELECT placement, COUNT(*) FROM to_exclude GROUP BY placement HAVING COUNT(*) > 1;  -- expect 0 rows
```

## VQ6 — Apply ordering (V8)
```sql
SELECT placement, impressions FROM to_exclude ORDER BY impressions DESC;  -- top-N applied within cap
```

## Pass / fail
- **PASS:** VQ3, VQ4, VQ5 return 0 rows; VQ1 matches hand calc; results saved to `evidence/validation/`.
- **FAIL:** any non-empty result on VQ3/VQ4/VQ5, or results not evidenced.
