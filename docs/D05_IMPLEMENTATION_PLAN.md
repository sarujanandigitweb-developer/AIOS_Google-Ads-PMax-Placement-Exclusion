---
document: D05 Implementation Plan
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D05
date: 2026-06-11
last_updated: 2026-06-11
author: sarujanan (Claude execution agent)
reviewer: Technical reviewer + Coordinator
status: DRAFT — implementation steps are APPROVAL-GATED (RED beyond documentation)
version: 1.0
related: [D02_TECHNICAL_ANALYSIS.md, D04_BUSINESS_RULES.md, D06_VALIDATION_PLAN.md, implementation/EXECUTION_PLAN.md]
---

# D05 — Implementation Plan

## What / why
Ordered plan to move from documented design to a live weekly automation. **Documentation/query steps
are GREEN (done here). Steps that touch the live Google Ads account are RED** and require written
approval + the named reviewers before execution. This file plans them; it does not perform them.

## Build stages

| Stage | Description | Class | Done where |
|---|---|---|---|
| S0 | Documentation + canonical rules (D01–D04) | GREEN | ✅ this subfolder |
| S1 | Express filter logic as query pack / pseudocode | GREEN | ✅ `queries/QUERY_PACK.md` |
| S2 | Define & approve related-keyword safeguard list (OI-02) | AMBER | business validator |
| S3 | Manual one-time export to verify data shape (Phase 1 first run) | AMBER | account owner |
| S4 | Author Google Ads Script (export→filter→exclude) in a **non-scheduled / Preview** mode | AMBER | technical reviewer |
| S5 | Manual review of generated `to_exclude` against D06 | AMBER | validator |
| S6 | Create shared exclusion list + apply (first time) | **RED** | account owner, approved |
| S7 | Enable weekly schedule (Mon 06:00 CET) + email-on-failure | **RED** | account owner, approved |
| S8 | First scheduled run + Monday 09:00 spot-check | RED | account owner |
| S9 | Capture evidence + closure + capability extraction | GREEN | this subfolder |

## Recommended order
S0 → S1 → S2 → S3 → S4 → S5 → (approval gate) → S6 → S7 → S8 → S9.

## What "implementation" means in THIS subfolder
Only S0, S1, S9 (documentation, query packs, evidence/closure). S3–S8 are planned and specified here
but **executed elsewhere by authorised personnel** with reviewer sign-off.

## Configuration to externalise (not hardcode)
- `YOUR_SHEET_ID` (Placement Exclusion sheet)
- Exclusion list name: `PMax - Unrelated Placements - ledsone.fr`
- `IMPRESSION_FLOOR` (default 500)
- Keyword + related-keyword lists (reference D04)

## Pass / fail rule
- **PASS:** every RED stage has a named approver + a D06 validation test + an evidence slot before it may run.
- **FAIL:** any account-touching stage is scheduled without approval, validation, and evidence plan.

## Known limitations / dependencies
- Blocked on OI-02 (related-keyword list) and OI-01 (Google Sheet access). See OPEN_ITEMS.
