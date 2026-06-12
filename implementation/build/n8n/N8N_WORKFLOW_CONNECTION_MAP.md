---
document: n8n Workflow Connection Map
project_code: gapmax
requirement_id: REQ-01
status: DOCUMENTED
author: sarujanan (Claude execution agent)
date: 2026-06-12
note: Wiring of the workflow. Node config lives in N8N_NODE_CONFIGURATION_REFERENCE.md (not repeated).
---

# n8n Workflow Connection Map

## Graph
```
Schedule Trigger → Export Placements → Read Placements → Normalize → Aggregate
  → Threshold → Classify → Validate
Validate ├── Write ToExclude → Wait → IF
         │                              ├── TRUE  → Apply Exclusions (RED/OI-03)
         │                              └── FALSE → Notify → Stop
         ├── Write ToMonitor
         └── Write RunLog (+ Success Email after IF/writes)
Error Trigger → Write RunLog (failure) → Failure Email
```

## Connections
| Source | Target | Purpose | Input | Output | Pass/Fail criteria |
|---|---|---|---|---|---|
| Schedule Trigger | Export Placements | weekly kick-off | tick | exec | fires Mon 06:00 Paris |
| Export Placements | Read Placements | refresh raw data | tick | `Placement Data` tab | export ran, rows>0 |
| Read Placements | Normalize | load rows | tab (row 3+) | raw rows | schema present |
| Normalize | Aggregate | typed records | raw | normalized + `__summary` | hardError=false |
| Aggregate | Threshold | collapse dupes (SUM) | normalized | unique placements | AG1–AG6 pass |
| Threshold | Classify | per-run threshold | aggregated | + `threshold` | TH1–TH6 pass |
| Classify | Validate | decision tree | aggregated+kw+threshold | classified | CL1–CL8 pass |
| Validate | Write ToExclude | persist EXCLUDE | classified | EXCLUDE rows (impr-desc) | decision filter applied |
| Validate | Write ToMonitor | persist MONITOR | classified | MONITOR rows | append, history kept |
| Validate | Write RunLog | audit | `__validation.runLog` | RunLog row | row written |
| Write ToExclude | Wait | hold for review | ToExclude | pause | tab populated |
| Wait | IF | resume on approval | approval | `approval=true/false` | reviewer approved |
| IF (TRUE) | Apply Exclusions | push to shared list | ToExclude | list applied | pass && approval && withinCap; **RED/OI-03** |
| IF (FALSE) | Notify | halt + inform | gate | email | any gate condition false |
| Notify | Stop | end run | — | — | no apply performed |
| Apply Exclusions | Success Email | report | metrics | email | applied=pushed (within cap) |
| Error Trigger | Write RunLog | failure audit | error | RunLog (failure) row | any node error |
| Write RunLog (failure) | Failure Email | alert | error payload | email | failed node + msg + exec ID |

## Pass/Fail (whole workflow)
- **PASS:** every stage check passes, gate TRUE, exclusions applied within cap, Success Email sent, RunLog written.
- **FAIL:** any stage hardError, gate FALSE, or node error → Notify/Failure Email, no apply, RunLog records the failure.

## Status
**DOCUMENTED.** Apply Exclusions edge is RED (OI-03); workflow not yet wired on the canvas.
