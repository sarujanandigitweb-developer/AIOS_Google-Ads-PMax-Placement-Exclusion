---
document: D09 Decision Log
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D09
date: 2026-06-11
last_updated: 2026-06-11
author: sarujanan (Claude execution agent)
reviewer: Coordinator
status: DRAFT — living log
version: 1.0
---

# D09 — Decision Log

Append-only record of decisions, rationale, and reversibility.

| ID | Date | Decision | Rationale | Made by | Reversible? |
|---|---|---|---|---|---|
| DEC-01 | 2026-06-11 | This subfolder is **documentation/planning only**; no live Google Ads change executed here | AIOS mini-subfolder doctrine: RED work (production/automation) needs written approval | Claude execution agent | Yes |
| DEC-02 | 2026-06-11 | Apply an **IMPRESSION_FLOOR of 500** (range 500–1000) on top of avg-impressions threshold | LLM-validation safeguard: raw average can over-prune algorithm exploration | Author (pending PPC confirm) | Yes — tune in D04 |
| DEC-03 | 2026-06-11 | **Decision-tree order = Mobile-app exclusion FIRST**, then keyword+threshold rules | Source doc labels conditions inconsistently; fix deterministic order. Branches are `Type`-mutually-exclusive so order is safe | Author | Yes |
| DEC-04 | 2026-06-11 | Adopt naming `YYYY-MM-DD__developer__gapmax__REQ-01-Dxx.md` for closure reports | Matches existing AIOS report convention (prior `ospm` report) — avoids format duplication | Author | Yes |
| DEC-05 | 2026-06-11 | Treat identity fields (developer=`sarujanan`, code=`gapmax`, REQ-01) as **assumptions** | No memory/config/git confirms staff name; only email signal available | Author | Yes — confirm with coordinator |
| DEC-06 | 2026-06-11 | `ToExclude` = clear+replace; `ToMonitor` = append | Direct from source doc note | Source doc | No (business rule) |
| DEC-07 | 2026-06-11 | Related-keyword safeguard list deferred as **OPEN ITEM (OI-02)**, not invented | AIOS: do not silently invent business logic; needs validator | Author | n/a |
| DEC-08 | 2026-06-11 | Confirm **developer = `sarujanan`** (resolves DEC-05/OD-3); initialise git + push to GitHub `main` (resolves OI-04, closes R10) | User supplied repo `sarujanandigitweb-developer/AIOS_Google-Ads-PMax-Placement-Exclusion`; owner matches prior `ospm` reports | sarujanan (user) | Yes — rename if coordinator objects |

## Open decisions (need an owner)
- OD-1: Confirm IMPRESSION_FLOOR final value (500 vs 1000) — PPC owner.
- OD-2: Approve related-keyword safeguard contents — business validator.
- OD-3: ✅ RESOLVED (DEC-08) — developer=sarujanan; repo live on GitHub `main`.

## Pass / fail rule
- **PASS:** every non-trivial choice is logged with rationale and reversibility; invented business logic = none.
- **FAIL:** any business rule was assumed into production without a logged, owner-assigned decision.
