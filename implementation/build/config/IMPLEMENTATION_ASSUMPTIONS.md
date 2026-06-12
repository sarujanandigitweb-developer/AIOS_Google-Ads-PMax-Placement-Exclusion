---
document: Implementation Assumptions
project_code: gapmax
requirement_id: REQ-01
status: NOT IMPLEMENTED — assumptions baseline
author: sarujanan (Claude execution agent)
date: 2026-06-12
---

# Implementation Assumptions

> The confirmed decisions + verified schema the build relies on. These are **guidelines for the build**;
> the canonical rules still live in [D04](../../../docs/D04_BUSINESS_RULES.md) (pending the approved
> update that records DEC-09…12).

## Confirmed business decisions (in-session, awaiting D04/D09 record)
| # | Decision | Source |
|---|---|---|
| 1 | YouTube video → KEEP all | DEC-09 |
| 2 | Google products → KEEP | DEC-10 |
| 3 | Cross-campaign dupes → SUM impressions per placement, classify once | DEC-11 |
| 4 | Exclusion scope → one account-level shared list | DEC-12 |
| 5 | Related safeguard list → **OPEN (OI-02)**; build treats as empty no-op | DEC-07 |

## Verified real-data schema (live Sheet)
| Fact | Value |
|---|---|
| Tabs | `Placement Data`, `Unrelated keywords` (40 terms), `Exclusion List` (empty) |
| Header | row 3 (rows 1–2 = title + date range) |
| Columns | Placement, **Placement URL**, Type, Network, Campaign, **Impr.** |
| Types | Mobile application (890), Site (258), YouTube video (72), Google products (3) |
| Rows | 1,223 data rows; 186 duplicate placement keys (cross-campaign) |
| Match field | `Placement URL` (apps carry `play.google.com`) |
| Threshold note | raw avg ≈ 26 → 500 floor dominates |

## Inputs / Outputs
- Input: live Sheet + confirmed decisions. Output: assumptions consumed by Code Nodes + Apps Script.

## Dependencies
- D04/D09 canonical update (pending approval), OI-02, OD-1, OI-03.

## Evidence requirements
- Discovery evidence: [DISCOVERY_REPORT](../../../evidence/discovery/DISCOVERY_REPORT.md) + live-sheet inspection logs.

## Status
**NOT IMPLEMENTED** — baseline assumptions recorded; no logic built.
