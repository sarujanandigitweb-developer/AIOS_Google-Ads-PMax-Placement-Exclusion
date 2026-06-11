---
document: Evidence Requirements
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: ACTIVE
aios_skill: 08_SKILL_EVIDENCE_FIRST + 12_SKILL_STORAGE
---

# Evidence Requirements — `gapmax` REQ-01

> No evidence = no completed work. Every claim links to a saved artifact.

## Per-task evidence

| Task | Required evidence | Storage location | Naming |
|---|---|---|---|
| Discovery | discovery report | `evidence/discovery/` | `DISCOVERY_REPORT.md` ✅ |
| Sample export (OI-05) | raw CSV | `evidence/outputs/` | `YYYY-MM-DD__placements_last7days.csv` |
| D06 logic validation | expected-vs-actual tables | `evidence/validation/` | `YYYY-MM-DD__V{n}__result.md` |
| Script Preview (S4) | Preview log/screenshot | `evidence/audit/` | `YYYY-MM-DD__script_preview.png/.md` |
| Exclusion list applied (S6) | screenshot of list + campaign | `evidence/screenshots/` | `YYYY-MM-DD__exclusion_list_applied.png` |
| Schedule (S7) | schedule config screenshot | `evidence/screenshots/` | `YYYY-MM-DD__weekly_schedule.png` |
| First run (S8) | run log + spot-check note | `evidence/audit/` | `YYYY-MM-DD__first_run_log.md` |

## Evidence package minimum fields (Skill 08)
evidence ID/filename · date captured · captured by · source system · method · result summary ·
files touched · validation status · caveats · next step.

## Accepted vs not
- **Accepted:** CSV/SQL output, screenshots saved internally, logs, validation md, commit hash/path.
- **Not accepted:** "it works", "Claude said done", "on my computer", "will upload later".

## Reviewer expectations
Each evidence file names the **asset it supports**; each asset header names its **evidence path**
(bidirectional link, Skill 12). Reviewer marks status: DRAFT / PARTIAL / VALIDATED / REJECTED / SUPERSEDED.

## Current evidence status
- VALIDATED: discovery.
- PENDING (gated): all validation/runtime evidence (no live run yet).
