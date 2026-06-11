---
document: Open Items
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: ACTIVE
---

# Open Items — `gapmax` REQ-01

| ID | Item | Type | Blocks | Owner | Status |
|---|---|---|---|---|---|
| OI-01 | Confirm access to Google Sheet "Placement Exclusion" (`YOUR_SHEET_ID`) referenced in source doc | External dependency | Phases 1–2 automation, sample validation | Account owner | OPEN |
| OI-02 | Define & approve the **related-keyword safeguard list** (Rule 5) protecting LED/DIY/design channels | Business rule | D04 Rule 5, D06 V6, go-live | Business validator | OPEN |
| OI-03 | Written approval to author/run/schedule the live Google Ads Script (RED stages S6–S8) | Governance approval | All production stages | Coordinator + validator | OPEN |
| OI-04 | Configure GitHub repo/path for this subfolder (currently not a git repo) | Storage discipline | Long-term queryability (R10) | Coordinator | OPEN |
| OI-05 | Provide a sample 7-day placement export to validate filter logic offline | Data | D06 validation execution | Account owner | OPEN |

## Open decisions (see D09)
- OD-1 Final IMPRESSION_FLOOR (500 vs 1000) — PPC owner.
- OD-2 Related-keyword safeguard contents — business validator (= OI-02).
- OD-3 Confirm identity/repo metadata (developer/project_code) — coordinator.

## Notes
None of these can be resolved by the execution agent alone — each needs a human owner decision or
external access. They are escalated rather than guessed (AIOS rule 14).
