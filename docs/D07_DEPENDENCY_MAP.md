---
document: D07 Dependency Map
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D07
date: 2026-06-11
last_updated: 2026-06-11
author: sarujanan (Claude execution agent)
reviewer: Technical reviewer
status: DRAFT
version: 1.0
related: [implementation/DEPENDENCY_TRACKER.md, D05_IMPLEMENTATION_PLAN.md]
---

# D07 — Dependency Map

## What / why
All prerequisite relationships across systems, data, documentation, and validation, so sequencing is explicit.

## System dependencies
- Google Ads account + active PMax campaign (ledsone.fr) — **external, required**.
- Google Ads Scripts runtime — required for automation.
- Google Sheet "Placement Exclusion" (`YOUR_SHEET_ID`) — intermediate store; **access not yet confirmed (OI-01)**.
- Shared Library ▸ Placement Exclusion Lists — exclusion target.
- Optional: Python / Apps Script runtime for filtering.

## Data dependencies
- Last-7-day placement export with columns [Placement, Type, Network, Impressions].
- Per-run Site population (for threshold).
- Keyword list + related-safeguard list (D04 / OI-02).

## Documentation dependencies (internal)
```
D01 Requirement ─► D02 Technical ─► D03 Workflow
                         │              │
                         ▼              ▼
                    D04 Business Rules (canonical)
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                  ▼
   queries/*        D05 Implementation   D06 Validation
                         │                  │
                         ▼                  ▼
                    implementation/*    evidence/*
                         │
                         ▼
                 reports/* + handover/*
```

## Validation dependencies
- D06 tests depend on D04 rules being frozen and (for V6) OI-02 resolved.

## External dependencies / blockers
| Dep | Needed for | Status |
|---|---|---|
| Google Sheet access (`YOUR_SHEET_ID`) | Phases 1–2 automation | OPEN (OI-01) |
| Related-keyword safeguard list | D04 Rule 5, V6 | OPEN (OI-02) |
| Approval to touch live account | S6–S8 | OPEN (OI-03) |
| GitHub repo/path | Storage discipline (Skill 12) | OPEN (OI-04) |

## Sequencing requirements
Documentation (D01→D04) must freeze before query packs are validated; query packs + OI-02 must resolve
before D06 V6; all RED stages gated behind OI-03 approval.

## Pass / fail rule
- **PASS:** no downstream task starts before its mapped prerequisite is satisfied/approved.
- **FAIL:** any RED stage begins with an open external dependency.
