---
document: QUERY_PACK — filter logic
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: DRAFT — design pseudocode, NOT executed against production
source_of_truth: docs/D04_BUSINESS_RULES.md
---

# Query Pack — Placement Filter Logic

> Reference implementation of [D04 canonical rules](../docs/D04_BUSINESS_RULES.md). This is design
> pseudocode/SQL for review — it is **not** run against any live system from this subfolder.

## Assumed input table `placements`
`(placement TEXT, type TEXT, network TEXT, impressions INT)` — one row per placement per 7-day window.

## Q0 — Threshold (Rule 1)
```sql
WITH sites AS (
  SELECT impressions FROM placements WHERE type = 'Site'
)
SELECT GREATEST(
         COALESCE(SUM(impressions)::float / NULLIF(COUNT(*),0), 0),
         500                                   -- IMPRESSION_FLOOR (DEC-02)
       ) AS threshold
FROM sites;
```

## Q1 — Classification (Rule 2, stop-at-first-match) — SQL form
```sql
WITH t AS ( /* Q0 */ SELECT 500::float AS threshold ),  -- substitute Q0 result
kw AS (
  SELECT unnest(ARRAY[
    'jeux','jeu','joueur','casino','pari','poker','enfants','enfant','dessin','anime','manga',
    'sport','football','basket','tennis','rugby','f1','musique','chanson','paroles','concert',
    'playlist','meteo','previsions','actualite','actualites','info','infos','journal','presse',
    'rencontre','rencontres','celibataire','divertissement','spectacle','celebrity','people'
  ]) AS term
),
app AS (
  SELECT unnest(ARRAY[
    'play.google.com','android-app://','google play','googleplay',
    'itunes.apple.com','apps.apple.com','itunes','apple.com/app'
  ]) AS pat
)
SELECT p.placement, p.type, p.impressions,
  CASE
    -- order 1: mobile app → EXCLUDE (no threshold)
    WHEN EXISTS (SELECT 1 FROM app  WHERE lower(p.placement) LIKE '%'||app.pat||'%')
         THEN 'EXCLUDE'
    -- order 2/3: Site + unrelated keyword
    WHEN p.type = 'Site'
         AND EXISTS (SELECT 1 FROM kw WHERE lower(p.placement) LIKE '%'||kw.term||'%')
      THEN CASE WHEN p.impressions > (SELECT threshold FROM t)
                THEN 'EXCLUDE' ELSE 'MONITOR' END
    -- order 4
    ELSE 'KEEP'
  END AS decision
FROM placements p;
-- NOTE: related-keyword safeguard (Rule 5 / OI-02) NOT yet applied — add as a guard that
-- downgrades EXCLUDE→KEEP when a related term is present, once approved.
```

## Q1b — Apps Script / Python pseudocode
```
threshold = max(sum(impr for r in rows if r.type=='Site') / count_sites, 500)
for r in rows:
    pl = r.placement.lower()
    if any(pat in pl for pat in APP_PATTERNS):        # order 1
        r.decision = 'EXCLUDE'
    elif r.type == 'Site' and any(k in pl for k in KEYWORDS):
        r.decision = 'EXCLUDE' if r.impressions > threshold else 'MONITOR'  # order 2/3
    else:
        r.decision = 'KEEP'                            # order 4
    # TODO(OI-02): if any(rel in pl for rel in RELATED_SAFEGUARD): r.decision = 'KEEP'
```

## Output split (Rule 6)
- `to_exclude` = rows where decision='EXCLUDE', ordered by impressions DESC (Rule 7) → ToExclude (replace).
- `to_monitor` = rows where decision='MONITOR' → ToMonitor (append).

## Pass / fail
- **PASS:** output reproduces D04 worked examples exactly.
- **FAIL:** any divergence from D04, or safeguard left unimplemented at go-live.
