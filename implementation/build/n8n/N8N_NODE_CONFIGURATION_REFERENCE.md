---
document: n8n Node Configuration Reference
project_code: gapmax
requirement_id: REQ-01
status: DOCUMENTED — canonical node-config source (non-code nodes)
author: sarujanan (Claude execution agent)
date: 2026-06-12
note: Single source of truth for n8n node configuration. Code Nodes 1–5 are implemented in
      code_nodes/*.js and validated; they are referenced, not re-specified here.
---

# n8n Node Configuration Reference

> Configuration only — no JSON, no credentials. Business rules live in
> [D04](../../../docs/D04_BUSINESS_RULES.md); node sequence in [WORKFLOW_DESIGN.md](WORKFLOW_DESIGN.md);
> wiring in [N8N_WORKFLOW_CONNECTION_MAP.md](N8N_WORKFLOW_CONNECTION_MAP.md).

## Schedule Trigger
| Field | Value |
|---|---|
| Type | Schedule Trigger |
| Frequency | Weekly |
| Day | Monday |
| Time | 06:00 |
| Timezone | Europe/Paris |
| Purpose | Fire the weekly run before daily budget spends |

## Google Sheets nodes
Credential: one **Google Sheets OAuth2** with edit access to `SHEET_ID` (parameterised; never committed).

| Node | Operation | Sheet/Tab | Key config | Input → Output |
|---|---|---|---|---|
| Read Placements | Read Rows | `Placement Data` | **Start Row = 3** (skip 2 title rows) | tab → raw rows |
| Read Keywords | Read Rows | `Unrelated keywords` | column `Keywords` (40 terms) | tab → keyword list |
| Read Config | Read Rows | `Config` | floor, safeguard list, exclusion-list name, cap | tab → config + safeguard |
| Write ToExclude | **Clear + Append** | `ToExclude` | clear tab, then append `decision==='EXCLUDE'` sorted impressions-desc | classified → tab |
| Write ToMonitor | **Append** | `ToMonitor` | append `decision==='MONITOR'` (retain history) | classified → tab |
| Write RunLog | **Append** | `RunLog` | one row from `__validation.runLog` | metrics → tab |

Writers filter on the `decision` field from Node-5 output; RunLog reads `__validation.runLog`.

## Wait node (manual review)
| Field | Value |
|---|---|
| Purpose | Pause after ToExclude is written, allowing human review before any Google Ads change — prevents unintended live exclusions |
| Resume process | Reviewer approval via webhook/manual resume; sets `approval = true` |
| Manual approval requirements | Reviewer inspects `ToExclude` for false positives (LED/relevant placements) and confirms count is sane before approving |
| Placement | `Write ToExclude → Wait → IF` |

## IF node (gate)
| Path | Condition | Action |
|---|---|---|
| TRUE | `validation.gate.pass == true` AND `approval == true` AND `validation.gate.withinCap == true` | → Apply Exclusions (RED, OI-03) |
| FALSE | any condition false | → Notify → **Stop workflow** (no apply) |

## Email nodes
Credential: SMTP/send.

| Email | Fields | Source |
|---|---|---|
| Success | Total placements · KEEP · EXCLUDE · MONITOR · Threshold · Validation status | `__validation.metrics` |
| Failure | Failed node · Error message · Execution ID | Error Trigger payload |

## Error Trigger
| Field | Value |
|---|---|
| Flow | `Error Trigger → Write RunLog (failure row) → Failure Email` |
| Purpose | Capture any node failure across the workflow; audit + alert, independent of the main path |

## Status
**DOCUMENTED.** Non-code nodes are designed, not yet built on the n8n canvas. Apply node is RED (OI-03).
