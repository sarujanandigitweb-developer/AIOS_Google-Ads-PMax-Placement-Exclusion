---
document: n8n Workflow Connection Map
project_code: gapmax
requirement_id: REQ-01
status: AS-BUILT — matches the executed export
author: sarujanan (Claude execution agent)
date: 2026-06-16
source_of_truth: evidence/exports/GADS_PMAX_Placement Exclusion.json (24 nodes incl. 5 sticky notes)
note: Node config lives in N8N_NODE_CONFIGURATION_REFERENCE.md. This file = wiring only.
---

# n8n Workflow Connection Map (As Built)

Reconstructed from the **exported live workflow JSON**. The earlier version of this file
described an *Export Placements / Apply Exclusions* design that was never executed; that is
replaced below with the actual graph. (`Code in JavaScript` = the RunLog reducer
[06_runlog_row.js](code_nodes/06_runlog_row.js).)

## Graph (actual)
```
Schedule Trigger → Read Keywords → Read Placements
  → 01_Normalize → 02_Aggregate → 03_Threshold → 04_Classify → 05_Validate

05_Validate ┬── ToExclude ─────────────┐
            ├── ToMonitor ─────────────┤
            ├── Code in JavaScript → RunLog ┤
            │                              └── Merge → HTTP Request (Dashboard refresh)
            │                                            → Wait → Merge1 → IF
            └────────────────────────────────────────────────────► Merge1 (validation passthrough)
                                                                       IF ┬── TRUE  → Send a message  (Success)
                                                                          └── FALSE → Send a message1 (Failure)
```

## Connections (verified from JSON)
| Source | Target | Purpose |
|---|---|---|
| Schedule Trigger | Read Keywords | weekly kick-off (Mon, Europe/Paris) |
| Read Keywords | Read Placements | load keyword list first (so `$('Read Keywords')` resolves in 04) |
| Read Placements | 01_Normalize | load placement rows (header row 3) |
| 01_Normalize | 02_Aggregate | typed records |
| 02_Aggregate | 03_Threshold | SUM-collapse duplicates |
| 03_Threshold | 04_Classify | per-run threshold |
| 04_Classify | 05_Validate | decision tree |
| 05_Validate | ToExclude | persist EXCLUDE rows |
| 05_Validate | ToMonitor | persist MONITOR rows |
| 05_Validate | Code in JavaScript | reduce 950 items → 1 RunLog summary row |
| 05_Validate | Merge1 | validation/gate passthrough to the IF |
| Code in JavaScript | RunLog | write the single RunLog summary row |
| ToExclude | Merge | join writer-complete signal |
| ToMonitor | Merge | join writer-complete signal |
| RunLog | Merge | join writer-complete signal |
| Merge | HTTP Request | fire dashboard refresh AFTER all 3 writers complete |
| HTTP Request | Wait | dashboard refreshed → hold for review |
| Wait | Merge1 | resume → combine with validation passthrough |
| Merge1 | If | evaluate the validation gate |
| If (TRUE) | Send a message | Success email |
| If (FALSE) | Send a message1 | Failure email |

## Node roster (non-sticky)
Schedule Trigger · Read Keywords · Read Placements · 01_Normalize · 02_Aggregate ·
03_Threshold · 04_Classify · 05_Validate · ToExclude · ToMonitor · Code in JavaScript ·
RunLog · Merge · HTTP Request · Wait · Merge1 · If · Send a message · Send a message1.
(+ 5 sticky "Phase" notes.)

## Merge semantics
- **Merge** collects ToExclude + ToMonitor + RunLog → emits once all three writers finish → triggers the **HTTP Request** dashboard refresh (Execute Once, Continue On Fail). See [WEBAPP_DEPLOYMENT.md](../apps_script/WEBAPP_DEPLOYMENT.md).
- **Merge1** combines the post-Wait signal with the `05_Validate` passthrough so the **IF** gate can read the validation/gate data.

## Pass/Fail (whole workflow)
- **PASS:** stages clean, writers complete, dashboard refresh `{ok:true}`, gate TRUE → Success email.
- **FAIL:** any node error or gate FALSE → Failure email; dashboard refresh failure is non-blocking (Continue On Fail).

## Notes / deltas from the old design
- No **Export Placements** node — `Placement Data` is populated manually / upstream; the workflow reads it.
- No **Apply Exclusions** node in the executed graph — pushing to the live account remains **RED / OI-03** and is not auto-wired.
- Dashboard refresh is an **HTTP Request → Apps Script Web App**, not present in the old map.

## Status
**AS-BUILT — verified against the exported JSON.**
