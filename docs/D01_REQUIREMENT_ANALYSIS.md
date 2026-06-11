---
document: D01 Requirement Analysis
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D01
date: 2026-06-11
last_updated: 2026-06-11
author: techclawweb (Claude execution agent)
reviewer: Business validator (PPC) + Queryability reviewer
status: DRAFT — awaiting reviewer sign-off
version: 1.0
source_documents:
  - "Automate Unrelated Placement Exclusion in PMAX Campaigns (ledsone.fr)"
related_evidence:
  - evidence/discovery/DISCOVERY_REPORT.md
---

# D01 — Requirement Analysis

## What is this / why does it exist?

This document captures the **complete requirement** for automating unrelated-placement exclusion in
ledsone.fr Performance Max campaigns, derived solely from the supplied technical document. It is the
entry point for all downstream planning (D02–D09).

## Business understanding

| Aspect | Detail |
|---|---|
| **Business objective** | Stop budget waste on placements unrelated to LED lighting; redirect spend to relevant inventory → more revenue at the same budget. |
| **Business problem** | PMax serves ads on irrelevant websites/apps/YouTube channels (gaming, kids' cartoons, sports, music). Clicks there never convert. |
| **Expected outcome** | Continuous weekly exclusion → cleaner PMax learning signals → improved placement quality and ROI. |
| **Stakeholders** | PPC/marketing owner (ledsone.fr), coordinator, technical reviewer, business validator. |
| **Success criteria** | (1) Weekly run with no manual input after setup; (2) correct KEEP/EXCLUDE/MONITOR classification; (3) exclusion list applied to PMax; (4) ≤5 min/run; (5) manual 5-min spot-check passes. |
| **Operational constraints** | Run Monday 06:00 CET (before budget spends); Google Ads caps placement exclusions per campaign → prioritise highest-impression placements. |

## Technical understanding

| Aspect | Detail |
|---|---|
| **Technical objective** | Export → filter → exclude → schedule, fully automated via Google Ads Scripts (+ optional Apps Script / Python). |
| **Functional requirements** | FR1 Export last-7-day placement data (Placement, Type, Network, Impressions). FR2 Compute threshold = avg impressions/Site. FR3 Apply decision tree → `to_exclude` / `to_monitor`. FR4 Push exclusions to a shared Placement Exclusion List on the PMax campaign. FR5 Schedule weekly. FR6 Email on failure. |
| **Non-functional** | Idempotent weekly run; ≤5 min; respects Google Ads exclusion caps; preserves `To Monitor` history (append), refreshes `To Exclude` (clear+replace). |
| **Data requirements** | Columns: Placement, Type, Network, Impressions. Data grain = one row per placement per 7-day window. **Only impressions are available at placement level** (no conversion data in PMax). |
| **System dependencies** | Google Ads account + PMax campaign; Google Ads Scripts runtime; Google Sheet ("Placement Exclusion") for intermediate data; optional Python/Apps Script for filtering. |
| **Integration points** | Google Ads UI ↔ Google Ads Scripts ↔ Google Sheets ↔ Shared Library exclusion list. |
| **Security** | Script runs under account credentials; `YOUR_SHEET_ID` must be parameterised, not hardcoded in shared code. |
| **Performance** | Threshold recommended 500–1000 impressions to avoid over-pruning algorithm exploration (LLM-validation guidance). |
| **Validation** | Manual review of `to_exclude.csv` before applying; spot-check Monday 09:00; "Related" keyword safeguard to protect DIY/design channels. |

## Scope definition

### In scope (within this mini-subfolder — GREEN work)
- Requirement, technical, workflow, business-rule, and risk **documentation**.
- Filter logic expressed as **query packs / pseudocode** (not executed against production).
- **Validation plan, evidence requirements, task breakdown, execution plan**.
- Duplicate-truth, queryability, compliance, and closure **reports**.

### Out of scope (RED — requires written approval, NOT done here)
- Deploying or running the Google Ads Script in the live account.
- Creating/applying the actual Shared Library exclusion list.
- Changing PPC thresholds, budgets, or business rules in production.
- Editing the parent AIOS or any asset outside this subfolder.
- Sending the script live / scheduling live automation.

### Out of scope (technical reality)
- Conversion-based exclusion (PMax does not expose conversion data at placement level — impressions only).

## Assumptions & risks (summary — full register in D08)

| Assumption | Basis | If wrong |
|---|---|---|
| Project code `gapmax`, REQ-01, developer `techclawweb` | Inferred from folder + email; no memory/config confirms | Rename via D09 decision; low cost |
| Threshold = avg impressions/Site, raised to 500–1000 floor | Source doc + LLM-validation table | Re-tune; documented in D04 |
| Source technical doc is the single authority | Discovery found no competing asset | Re-baseline if a Google Sheet rule differs |

## Requirement understanding summary

A weekly, fully-automated, impressions-driven exclusion pipeline for ledsone.fr PMax that classifies
placements as KEEP / EXCLUDE / MONITOR using a fixed decision tree and a per-run average-impressions
threshold, then maintains a shared exclusion list — with manual safeguards (review + spot-check +
"related" keyword protection). This subfolder delivers the **plan and proof scaffold**; production
deployment is a separate, approval-gated step.

## Pass / fail rule
- **PASS:** every functional requirement (FR1–FR6) is traceable to a D02/D03 design element and a D06 validation test.
- **FAIL:** any requirement lacks a design or validation linkage.

## Known limitations
- No conversion signal; classification relies on impressions + keyword heuristics → false-positive risk on ambiguous sites.
- Google Sheet referenced in source is not available locally (external dependency).
