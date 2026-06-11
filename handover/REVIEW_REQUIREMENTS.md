---
document: Review Requirements
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: ACTIVE
---

# Review Requirements — `gapmax` REQ-01

## Who reviews what

| Artifact | Reviewer | Gate |
|---|---|---|
| D01 Requirement, D03 Workflow | Business validator | Sign-off before build |
| D02 Technical, D05 Implementation, D07 Dependency | Technical reviewer (Sajeesan/assigned) | Sign-off before S4 |
| D04 Business Rules (canonical) + safeguard (OI-02) | Business validator | **Mandatory** before any exclusion runs |
| D06 Validation + query packs | Technical reviewer | Before validation execution |
| All reports (duplicate/queryability/compliance/risk) | Queryability reviewer (Tamil Selvan/assigned) | Before closure accepted |
| RED stages S6–S8 | Coordinator + business validator (written) | Before live account touch |

## Parent-AIOS candidate (flag only — do NOT promote)

| Field | Value |
|---|---|
| Candidate title | Weekly impressions-based PMax unrelated-placement exclusion method |
| Source subfolder | `AIOS_Google Ads PMax Placement Exclusion` (gapmax) |
| Problem solved | Recurring PPC budget waste on irrelevant placements across PMax accounts |
| Evidence path | evidence/discovery/DISCOVERY_REPORT.md (+ validation evidence once run) |
| Reuse reason | Generalises to any PMax account; only keyword/threshold differ per vertical |
| KPI / proxy KPI | Wasted-impression share excluded; placement-quality / ROAS proxy |
| Owner/reviewer | PPC owner + technical reviewer |
| Duplicate-risk check | GREEN (DUPLICATE_TRUTH_ANALYSIS) |
| Recommended next action | After ≥1 evidenced live cycle, submit to assigned validator for parent-AIOS review |

> Promotion requires separate validator review. A subfolder asset is **not** parent truth until approved.

## Pass / fail
- **PASS:** every artifact has a named reviewer + gate; RED stages blocked on written approval.
- **FAIL:** any rule/production step proceeds without its mandatory reviewer.
