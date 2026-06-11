---
document: Task Breakdown Structure
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: DRAFT
related: [docs/D05_IMPLEMENTATION_PLAN.md, EXECUTION_PLAN.md]
---

# Task Breakdown Structure — `gapmax` REQ-01

## Epic E1 — Documentation & rules (GREEN) ✅ DONE
| Task ID | Description | Dependency | Owner | Evidence Required | Validation Method |
|---|---|---|---|---|---|
| T1.1 | Discovery of existing assets | — | Agent | DISCOVERY_REPORT | File present + reviewer |
| T1.2 | D01–D03 analysis | T1.1 | Agent | docs present | Queryability review |
| T1.3 | D04 canonical rules | T1.2 | Agent + validator | D04 + DEC-03 | Business sign-off |
| T1.4 | D05–D09 + reports + handover | T1.3 | Agent | files present | Compliance review |

## Epic E2 — Filter logic validation (GREEN/AMBER)
| T2.1 | Express filter as query pack | T1.3 | Agent | QUERY_PACK | Matches D04 examples |
| T2.2 | Obtain sample 7-day export (OI-05) | — | Account owner | CSV in evidence/outputs | File present |
| T2.3 | Run D06 V1–V9 on sample | T2.1,T2.2 | Tech reviewer | validation evidence | Expected=Actual |
| T2.4 | Approve safeguard list (OI-02) | T1.3 | Validator | D04 Rule 5 updated | Sign-off |

## Epic E3 — Production build (RED — gated by OI-03)
| T3.1 | Author script in Preview | T2.3,T2.4,OI-03 | Tech reviewer | script + Preview log | No errors |
| T3.2 | Review generated to_exclude | T3.1 | Validator | review note | Spot-check pass |
| T3.3 | Create + apply exclusion list | T3.2 | Account owner | screenshot | List applied |
| T3.4 | Enable weekly schedule + email | T3.3 | Account owner | schedule screenshot | Preview ok |
| T3.5 | First run + Mon 09:00 spot-check | T3.4 | Account owner | logs + screenshot | Run ≤5 min, sane output |

## Epic E4 — Closure & capability (GREEN)
| T4.1 | Closure report | T3.5 (or T2.3 if paused) | Agent | closure md | Skill 08 |
| T4.2 | Capability extraction + parent candidate flag | T4.1 | Agent | REVIEW_REQUIREMENTS | Reviewer |

## Pass / fail
- **PASS:** every task has dependency, owner, evidence, validation method.
- **FAIL:** any RED task lacks an approval dependency.
