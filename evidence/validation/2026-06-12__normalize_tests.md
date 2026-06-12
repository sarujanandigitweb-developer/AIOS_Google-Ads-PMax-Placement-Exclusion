---
asset: 01_normalize.js validation
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-12
captured_by: sarujanan (Claude execution agent)
status: VALIDATED
evidence_type: validation
supports: implementation/build/n8n/code_nodes/01_normalize.js
method: offline Node.js dry-run of the n8n Code Node logic against the real Placement Data export (/tmp working copy) + injected edge cases
---

# Normalize Node — Validation Evidence

## Run summary (real export + 3 injected edge rows)
```
rows_in: 1229   rows_out: 1225   skipped_empty: 1   skipped_nondata: 3
impr_warnings: 1   hasSiteRows: true   hardError: false   (2 warnings)
```
- `skipped_nondata: 3` = title row, date-range row, stray header row (correctly dropped).
- `skipped_empty: 1` = injected fully-blank row.
- Conservation holds: 1225 + 1 + 3 = 1229. ✓

## Real-data Type distribution (output)
Mobile application 890 · Site 258 · YouTube video 72 · Google products 3 — matches discovery. (Injected edge rows added 1 Site + 1 UNKNOWN.)

## Test-case results
| TC | Input | Expected | Actual | Pass |
|---|---|---|---|---|
| N1/N2/header | title / date-range / header rows | dropped | 3 skipped_nondata | ✓ |
| N3 | app row, `Impr.="1.0"` | impressions:1 | 1 | ✓ |
| N4 | `Impr.="1 200"` | 1200 | 1200 | ✓ |
| N5 | blank Placement+URL | dropped | skipped_empty | ✓ |
| N6 | `Impr.="abc"` | 0 + warning | 0, impr_warnings=1 | ✓ |
| N7 | `Type="site "` | canonical `Site` | Site | ✓ |
| N8 | `Type="Smart Shopping"` | `UNKNOWN`, kept | UNKNOWN | ✓ |
| N9 | mixed-case URL | lowercased urlKey | `http://play.google.com/app` | ✓ |
| N10 | full real export | conservation + ≥1 Site | holds; hasSiteRows true | ✓ |

## Verdict
**PASS** — normalize logic correct on real data. Output contract `{placement, urlKey, type, network, campaign, originalImpressions, impressions, __summary}` ready for Aggregate (Node 2).
