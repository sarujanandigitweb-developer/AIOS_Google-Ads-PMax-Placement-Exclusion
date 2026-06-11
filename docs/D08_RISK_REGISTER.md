---
document: D08 Risk Register
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D08
date: 2026-06-11
last_updated: 2026-06-11
author: techclawweb (Claude execution agent)
reviewer: Coordinator + Technical reviewer
status: DRAFT — living document
version: 1.0
related: [reports/RISK_ASSESSMENT_REPORT.md, D04_BUSINESS_RULES.md]
---

# D08 — Risk Register

## What / why
Active risks across business, technical, AIOS-governance, evidence, and queryability dimensions.

| ID | Risk | Category | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R1 | Excluding quality placements (false positive) | Business | High | Medium | Related-keyword safeguard (R-rule 5); impression floor 500–1000; manual pre-apply review | Business validator |
| R2 | Over-pruning shrinks PMax algorithm exploration | Business/Algo | Medium | Medium | Raise threshold floor; MONITOR (not exclude) low-impression hits | PPC owner |
| R3 | Keyword substring false matches (e.g. `info`) | Technical | Medium | High | Safeguard list; word-boundary refinement; spot-check | Technical reviewer |
| R4 | Google Ads exclusion cap exceeded | Technical | Medium | Medium | Sort by impressions desc; apply top-N; log dropped | Technical reviewer |
| R5 | Condition ordering ambiguity in source doc | Technical/Logic | Medium | (resolved) | DEC-03 fixes order (app first) | Author |
| R6 | Non-idempotent re-run duplicates exclusions | Technical | Low | Medium | Dedupe by placement key; ToExclude replace | Technical reviewer |
| R7 | Live account change without approval (scope creep into RED) | AIOS Governance | High | Low | RED gate (OI-03); this subfolder is docs-only | Coordinator |
| R8 | Duplicate truth (rules restated divergently) | AIOS Governance | High | Low | D04 is sole canonical; others reference only | Queryability reviewer |
| R9 | Evidence not saved → unproven completion | Evidence | High | Medium | EVIDENCE_REQUIREMENTS.md per task; Skill 08 | Owner |
| R10 | No GitHub remote → local-only weak storage | Storage/Query | Medium | High (current) | Configure repo (OI-04); meanwhile keep all in subfolder | Coordinator |
| R11 | Identity assumptions (developer/project code) wrong | Governance | Low | Medium | Flagged as assumptions; correct via DEC log | Owner |
| R12 | Google Sheet referenced but inaccessible | External | Medium | Medium | OI-01; verify access before S3 | Owner |
| R13 | ROI modest at ~€1000/month spend | Business | Low | — | Treat as skill investment; reusable when budget scales | PPC owner |

## Risk posture
Documentation phase risk is **LOW** (no production touch). Highest residual risks (R1, R7, R9) all
crystallise only at the RED implementation stages and are gated by approval + validation + evidence.

## Pass / fail rule
- **PASS:** every High-impact risk has a named owner + a concrete mitigation before its triggering stage.
- **FAIL:** any High risk enters an active (RED) stage unmitigated.
