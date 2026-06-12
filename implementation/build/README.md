---
document: Build Workbench — README
project_code: gapmax
requirement_id: REQ-01
phase: Implementation Phase 1 (structure prep)
status: NOT IMPLEMENTED — scaffolding only
author: sarujanan (Claude execution agent)
date: 2026-06-12
---

# `implementation/build/` — Implementation Workbench

> ⚠ **No production code here yet.** This folder holds the build structure for the PMax placement-
> exclusion automation. All `.js`/`.gs` files are `IMPLEMENTATION PENDING` placeholders.

## Purpose
Organise the implementation of the automation across its three platforms, without duplicating any
business rule (those live only in [docs/D04_BUSINESS_RULES.md](../../docs/D04_BUSINESS_RULES.md)).

## Platforms (this phase)
- **n8n** — orchestration (`n8n/`).
- **Google Apps Script** — Google Ads export + apply edges (`apps_script/`).
- **Google Sheets** — temporary store + review layer.
- **PostgreSQL** — **excluded this phase** (DNS-blocked; RunLog/ToMonitor interim in Sheets).

## Folder map
| Path | Holds |
|---|---|
| `n8n/WORKFLOW_DESIGN.md` | Node-by-node design |
| `n8n/WORKFLOW_BUILD_PROGRESS.md` | Build status tracker |
| `n8n/code_nodes/*.js` | Code-node implementations (placeholders) |
| `apps_script/` | Export + apply Apps Script (design + placeholders) |
| `config/CONFIG_SPEC.md` | Config values, each cited to D04/DEC |
| `config/IMPLEMENTATION_ASSUMPTIONS.md` | Confirmed decisions + schema mapping |

## Canonical references (DO NOT duplicate)
- Rules: [D04_BUSINESS_RULES.md](../../docs/D04_BUSINESS_RULES.md)
- Logic spec: [QUERY_PACK.md](../../queries/QUERY_PACK.md)
- Validation: [VALIDATION_QUERIES.md](../../queries/VALIDATION_QUERIES.md), [D06](../../docs/D06_VALIDATION_PLAN.md)
- Evidence: [EVIDENCE_REQUIREMENTS.md](../EVIDENCE_REQUIREMENTS.md)

## Evidence
Outputs/logs go to existing `evidence/{outputs,validation,audit,screenshots}/` — not created here.

## Status
**NOT IMPLEMENTED** — structure prepared; build begins per [EXECUTION_PLAN](../EXECUTION_PLAN.md) /
WORKFLOW_BUILD_PROGRESS once OI-02 (safeguard) + OI-03 (deploy approval) are resolved.
