---
document: D06 Validation Plan
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D06
date: 2026-06-11
last_updated: 2026-06-11
author: sarujanan (Claude execution agent)
reviewer: Technical reviewer + Business validator
status: DRAFT
version: 1.0
related: [D04_BUSINESS_RULES.md, queries/VALIDATION_QUERIES.md, implementation/VALIDATION_CHECKLIST.md]
---

# D06 — Validation Plan

## What / why
Defines how to prove the pipeline classifies and excludes correctly **before** and **after** any live run.

## Validation objectives
1. Threshold computed correctly (avg impressions/Site, floor applied).
2. Decision tree applied in order, stop-at-first-match.
3. App placements always excluded regardless of impressions.
4. `ToExclude` replaced; `ToMonitor` appended (history retained).
5. Exclusions applied highest-impression-first within cap.
6. No quality (related) placement wrongly excluded.

## Test cases

| ID | Input | Expected | Method |
|---|---|---|---|
| V1 | Site set with known impressions | threshold = Σ/COUNT, then max(.,500) | recompute by hand + query (VALIDATION_QUERIES Q1) |
| V2 | `play.google.com/...` app, impr=40 | EXCLUDE (order-1) | trace decision tree |
| V3 | Site `jeux-...`, impr > threshold | EXCLUDE (order-2) | trace |
| V4 | Site `chanson-...`, impr ≤ threshold | MONITOR (order-3) | trace |
| V5 | Site `eclairage-led-...`, no keyword | KEEP | trace + safeguard |
| V6 | Site with unrelated keyword BUT related-safeguard term | KEEP (safeguard overrides) | trace (pending OI-02) |
| V7 | Re-run same week | no duplicate exclusion rows (idempotent) | diff ToExclude before/after |
| V8 | Exclusion count > cap | only top-N by impressions applied; rest logged | inspect logs |
| V9 | `ToMonitor` after 2 runs | union of both runs (append) | row-count diff |

## Acceptance criteria
- V1–V9 all PASS; manual 5-minute spot-check of `to_exclude` finds no obviously-relevant LED placement.
- Confidence target ≥ the source LLM-validation baseline (75%) before scaling.

## Required evidence (per test)
- Saved input sample (`evidence/outputs/`), expected-vs-actual table, reviewer initials, date.
- Screenshot of applied exclusion list (`evidence/screenshots/`) for V8/post-apply.

## Review responsibilities
- Logic correctness → technical reviewer.
- Relevance / false-positive judgement → business validator.

## Pass / fail rule
- **PASS:** all acceptance criteria met with saved evidence per AIOS Skill 08 (no "it works" claims).
- **FAIL:** any test lacks saved expected-vs-actual evidence, or V6 cannot be validated because the safeguard list is undefined.

## Known limitations
- V6 is blocked until the related-keyword safeguard (OI-02) is approved.
