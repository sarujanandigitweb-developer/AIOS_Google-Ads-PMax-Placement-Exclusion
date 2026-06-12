---
document: Apps Script — README
project_code: gapmax
requirement_id: REQ-01
status: NOT IMPLEMENTED
author: sarujanan (Claude execution agent)
date: 2026-06-12
---

# Apps Script Edges — README

> ⚠ **RED work.** Deploying/running these scripts touches the live Google Ads account and requires
> written approval (OI-03). Files are placeholders until then.

## Purpose
Two Google Apps Script files bridge n8n ↔ Google Ads (export + apply edges). See
[APPS_SCRIPT_DESIGN.md](APPS_SCRIPT_DESIGN.md) for full responsibilities.

## Inputs / Outputs
| File | Input | Output |
|---|---|---|
| `export_placements.gs` | Ads account, `SHEET_ID` | `Placement Data` tab |
| `apply_exclusions.gs` | `ToExclude`, list name | account-level shared exclusion list |

## Dependencies
- OI-01 (Sheet/Ads access), OI-03 (deploy approval). Parameterise `SHEET_ID` — never hardcode/commit.

## Evidence requirements
Execution logs → `evidence/audit/`; applied-list screenshot → `evidence/screenshots/`.

## Status
**NOT IMPLEMENTED.**
