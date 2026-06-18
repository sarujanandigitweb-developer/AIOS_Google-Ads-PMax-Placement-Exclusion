---
document: Next Steps
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: sarujanan (Claude execution agent)
status: ACTIVE
related: [docs/D05_IMPLEMENTATION_PLAN.md, implementation/EXECUTION_PLAN.md]
---

# Next Steps — `gapmax` REQ-01

> **Historical planning document.**
> Refer to [PROJECT_FINAL_CLOSURE.md](PROJECT_FINAL_CLOSURE.md) for current project status.
> Steps 1–6 and 12 were completed and certified; only the RED production steps (7–11, OI-03) remain out of scope by design. Retained as the original planning record.

## Immediate (no approval needed — GREEN)
1. Coordinator confirms identity/repo metadata (OD-3) and initialises GitHub (OI-04), then commit this scaffold.
2. Business validator drafts the related-keyword safeguard list (OI-02) → update D04 Rule 5.
3. Account owner exports a sample 7-day placement CSV (OI-05) into `evidence/outputs/`.

## On sample data (GREEN/AMBER)
4. Run QUERY_PACK logic against the sample (offline) → produce decision distribution.
5. Execute D06 V1–V9 on the sample → save expected-vs-actual to `evidence/validation/`.
6. Refine keyword/safeguard lists from INVESTIGATION_QUERIES findings → log in D09.

## Production (RED — only after OI-03 written approval)
7. Author Google Ads Script (export+filter+exclude) in **Preview** mode (S4).
8. Validator reviews generated `to_exclude` (S5).
9. Create shared exclusion list "PMax - Unrelated Placements - ledsone.fr" + apply (S6).
10. Enable weekly schedule Mon 06:00 CET + email-on-failure (S7); Preview before save.
11. First run + Monday 09:00 spot-check (S8); capture screenshots → `evidence/screenshots/`.

## Closure (GREEN)
12. File closure report (DEC-04 naming); extract reusable capability; flag parent-AIOS candidate.

## Recommended sequence
1→2→3 (parallel) → 4→5→6 → [approval gate OI-03] → 7→8→9→10→11 → 12.
