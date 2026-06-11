---
document: INVESTIGATION_QUERIES
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: DRAFT — exploratory, not executed against production
---

# Investigation Queries

Exploratory queries to refine the keyword list and understand placement distribution. Run on a sample export.

## IQ1 — Type / Network breakdown
```sql
SELECT type, network, COUNT(*) n, SUM(impressions) impr
FROM placements GROUP BY type, network ORDER BY impr DESC;
```

## IQ2 — Top placements by impressions (exclusion priority)
```sql
SELECT placement, type, impressions FROM placements ORDER BY impressions DESC LIMIT 50;
```

## IQ3 — Keyword hit frequency (which terms actually fire)
```sql
-- For each keyword, count matching placements: informs list pruning / safeguard need
SELECT term, COUNT(*) FROM placements p
JOIN (SELECT unnest(ARRAY['jeux','enfant','sport','musique','actualite','rencontre']) term) k
  ON lower(p.placement) LIKE '%'||k.term||'%'
GROUP BY term ORDER BY 2 DESC;
```

## IQ4 — Potential false positives (keyword hit but possibly relevant)
```sql
-- Manual review target: keyword-flagged sites with LED/lighting/deco tokens → safeguard candidates
SELECT placement FROM placements
WHERE lower(placement) ~ '(led|lumiere|eclairage|deco|design|luminaire)'
  AND lower(placement) ~ '(info|sport|people|spectacle)';
```

## IQ5 — App vs Site share
```sql
SELECT CASE WHEN lower(placement) ~ '(play.google|apps.apple|itunes|android-app)' THEN 'app'
            ELSE type END AS bucket, COUNT(*), SUM(impressions)
FROM placements GROUP BY 1;
```

## Pass / fail
- **PASS:** findings feed keyword/safeguard refinement and are captured in D04/D09; results saved to evidence.
- **FAIL:** exploration done but learning not captured into canonical rules.
