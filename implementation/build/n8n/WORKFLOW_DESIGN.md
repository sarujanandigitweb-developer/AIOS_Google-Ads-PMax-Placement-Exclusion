---
document: n8n Workflow Design
project_code: gapmax
requirement_id: REQ-01
status: NOT IMPLEMENTED — design only
author: sarujanan (Claude execution agent)
date: 2026-06-12
canonical_rules: docs/D04_BUSINESS_RULES.md
---

# n8n Workflow Design

> Design of record for the orchestration workflow. No n8n JSON, no code. Rules referenced from
> [D04](../../../docs/D04_BUSINESS_RULES.md), never restated.

## Purpose
Orchestrate weekly: read placement data → aggregate → threshold → classify → validate → write Sheets
→ human review → apply (via Apps Script) → notify.

## Inputs
- `Placement Data` tab (refreshed by export Apps Script; header row 3).
- `Unrelated Keywords` tab (40 terms, runtime keyword source).
- `Config` tab (floor, safeguard list [OI-02], list name, cap).

## Outputs
- `ToExclude` (replace), `ToMonitor` (append), `RunLog` (append) tabs.
- Trigger to apply Apps Script; email notification.

## Node sequence
| Order | Node | Purpose | In → Out |
|---|---|---|---|
| 1 | Schedule Trigger | Mon 06:00 Europe/Paris | — → tick |
| 2 | Execute Apps Script | run export edge | tick → refreshed Placement Data |
| 3 | Sheets Read | Placement Data (row 3+) | tab → raw rows |
| 4 | Sheets Read | Unrelated Keywords | tab → keywords |
| 5 | Sheets Read | Config | tab → config |
| 6 | Code Node 1 | normalize | raw → typed records |
| 7 | Code Node 2 | aggregate by URL (SUM) | typed → unique placements |
| 8 | Code Node 3 | threshold | aggregated → threshold |
| 9 | Code Node 4 | classify (Type-aware tree) | aggregated+kw+threshold → classified |
| 10 | Code Node 5 | validate (V1–V9) | classified → pass/fail+metrics |
| 11 | Sheets Write | ToExclude/ToMonitor/RunLog | classified → persisted |
| 12 | Manual Approval (Wait) | review ToExclude | ToExclude → approve/reject |
| 13 | IF | gate: pass && approved && count≤cap | metrics → proceed/halt |
| 14 | Execute Apps Script | apply edge | ToExclude → list applied |
| 15 | Email | run summary | metrics → sent |
| E | Error Trigger → Email+RunLog | failure capture | error → alert |

## Dependencies
- Code Nodes 1–5 (`code_nodes/`), Apps Script edges (`apps_script/`), Config tab, OI-02 safeguard, OI-03 approval.

## Evidence requirements
- n8n execution log → `evidence/audit/`; ToExclude/ToMonitor → `evidence/outputs/`;
  validation results → `evidence/validation/`; applied-list + schedule screenshots → `evidence/screenshots/`.

---

## Node configuration & wiring (see dedicated docs)
- Detailed per-node config (Schedule Trigger, Sheets, Wait, IF, Email, Error Trigger):
  **[N8N_NODE_CONFIGURATION_REFERENCE.md](N8N_NODE_CONFIGURATION_REFERENCE.md)** (canonical).
- Full connection wiring: **[N8N_WORKFLOW_CONNECTION_MAP.md](N8N_WORKFLOW_CONNECTION_MAP.md)**.
- Deployment gating: **[N8N_DEPLOYMENT_CHECKLIST.md](N8N_DEPLOYMENT_CHECKLIST.md)**.

## Status
**Code Nodes 1–5: COMPLETE + offline-validated (2026-06-12).** Non-code nodes DESIGNED, not built.
Apply node is RED (OI-03). See WORKFLOW_BUILD_PROGRESS.md.
