---
document: Config Spec
project_code: gapmax
requirement_id: REQ-01
status: NOT IMPLEMENTED — spec only
author: sarujanan (Claude execution agent)
date: 2026-06-12
canonical_rules: docs/D04_BUSINESS_RULES.md
---

# Config Spec

> Defines the **only** constants the implementation may embed. Every value cites its canonical source
> (D04 / DEC id) so config never becomes a second source of truth. Actual values live in the Sheet
> `Config` tab at runtime; this file documents their meaning.

## Purpose
Externalise tunables so logic stays rule-faithful and editable without code changes.

## Config items
| Key | Meaning | Canonical source | Default |
|---|---|---|---|
| `IMPRESSION_FLOOR` | Min threshold floor | D04 Rule 1 / DEC-02 (OD-1 pending) | 500 |
| `TYPE_ACTION_MAP` | Type→branch: Mobile application→EXCLUDE; Site→tree; YouTube video→KEEP; Google products→KEEP | D04 Rule 2 (DEC-09/10) | as stated |
| `KEYWORD_SOURCE` | Runtime unrelated-keyword list | Sheet `Unrelated Keywords` (40 terms) | tab ref |
| `SAFEGUARD_SOURCE` | Related-keyword safeguard | D04 Rule 5 / OI-02 (OPEN) | empty (no-op) |
| `MATCH_FIELD` | Field matched for keyword/app | real schema | `Placement URL` |
| `HEADER_SKIP` | Title rows before header | real schema | 2 (header on row 3) |
| `IMPR_COLUMN` | Impressions column name | real schema | `Impr.` |
| `EXCLUSION_LIST_NAME` | Shared list name | D04 Rule 7 / DEC-12 | `PMax - Unrelated Placements - ledsone.fr` |
| `EXCLUSION_CAP` | Per-list/account cap | Google Ads limit (confirm) | TBD |

## Inputs / Outputs
- Input: Sheet `Config` tab. Output: consumed by n8n Code Nodes 3–4 + Apps Script apply.

## Dependencies
- OI-02 (safeguard), OD-1 (floor value), confirmed cap.

## Evidence requirements
- Config snapshot per run recorded in `RunLog` / `evidence/audit/`.

## Status
**NOT IMPLEMENTED.**
