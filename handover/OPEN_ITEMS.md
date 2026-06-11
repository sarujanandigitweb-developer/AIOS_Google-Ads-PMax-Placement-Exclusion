---
document: Open Items
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: sarujanan (Claude execution agent)
status: ACTIVE
---

# Open Items — `gapmax` REQ-01

| ID | Item | Type | Blocks | Owner | Status |
|---|---|---|---|---|---|
| OI-01 | Confirm access to Google Sheet "Placement Exclusion" (`YOUR_SHEET_ID`) referenced in source doc | External dependency | Phases 1–2 automation, sample validation | Account owner | OPEN |
| OI-02 | Define & approve the **related-keyword safeguard list** (Rule 5) protecting LED/DIY/design channels | Business rule | D04 Rule 5, D06 V6, go-live | Business validator | OPEN |
| OI-03 | Written approval to author/run/schedule the live Google Ads Script (RED stages S6–S8) | Governance approval | All production stages | Coordinator + validator | OPEN |
| OI-04 | ~~Configure GitHub repo/path~~ | Storage discipline | Long-term queryability (R10) | Coordinator | ✅ RESOLVED 2026-06-11 — pushed to `main` at github.com/sarujanandigitweb-developer/AIOS_Google-Ads-PMax-Placement-Exclusion |
| OI-05 | Provide a sample 7-day placement export to validate filter logic offline | Data | D06 validation execution | Account owner | OPEN |

## Open decisions (see D09)
- OD-1 Final IMPRESSION_FLOOR (500 vs 1000) — PPC owner.
- OD-2 Related-keyword safeguard contents — business validator (= OI-02).
- OD-3 ✅ RESOLVED — developer = `sarujanan` (confirmed via GitHub repo owner `sarujanandigitweb-developer`, consistent with prior `ospm` reports). `project_code`/`REQ-01` still nominal; rename if coordinator objects.

## Notes
None of these can be resolved by the execution agent alone — each needs a human owner decision or
external access. They are escalated rather than guessed (AIOS rule 14).
