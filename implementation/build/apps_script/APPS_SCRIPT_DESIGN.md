---
document: Google Apps Script Design
project_code: gapmax
requirement_id: REQ-01
status: NOT IMPLEMENTED — design only
author: sarujanan (Claude execution agent)
date: 2026-06-12
---

# Google Apps Script Design — Google Ads Edges

> n8n cannot natively read PMax placement reports or write PMax exclusions; two Apps Script files own
> those edges. Design only — no `.gs` logic. Rules referenced from
> [D04](../../../docs/D04_BUSINESS_RULES.md).

## Files
| File | Responsibility | Status |
|---|---|---|
| `export_placements.gs` | Export PMax placement report → `Placement Data` tab | NOT IMPLEMENTED |
| `apply_exclusions.gs` | Read `ToExclude` → account-level shared exclusion list | NOT IMPLEMENTED |

## export_placements.gs
- **Purpose:** pull last-7-day PMax placements (all campaigns) into the Sheet.
- **Inputs:** Google Ads account, parameterised `SHEET_ID`, date window.
- **Outputs:** `Placement Data` tab with `Placement, Placement URL, Type, Network, Campaign, Impr.`; execution log.
- **Dependencies:** Ads account access; Sheet write access (OI-01).
- **Evidence:** execution log → `evidence/audit/`; tab snapshot → `evidence/outputs/`.

## apply_exclusions.gs
- **Purpose:** push `ToExclude` into **one account-level** shared list `PMax - Unrelated Placements - ledsone.fr` (DEC-12).
- **Inputs:** `SHEET_ID`, `ToExclude` rows (impr-desc), list name, cap.
- **Outputs:** updated shared list; applied vs dropped counts; execution log.
- **Validation required:** applied = pushed (within cap); overflow logged; idempotent (no dup entries); screenshot of applied list.
- **Dependencies:** OI-03 written approval (RED — live account); OI-01 access.
- **Evidence:** execution log → `evidence/audit/`; applied-list screenshot → `evidence/screenshots/`.

## Status
**NOT IMPLEMENTED** — both files are `IMPLEMENTATION PENDING` placeholders.
