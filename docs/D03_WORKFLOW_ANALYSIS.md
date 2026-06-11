---
document: D03 Workflow Analysis
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D03
date: 2026-06-11
last_updated: 2026-06-11
author: techclawweb (Claude execution agent)
reviewer: Business validator + Technical reviewer
status: DRAFT
version: 1.0
source_documents: ["Automate Unrelated Placement Exclusion in PMAX Campaigns (ledsone.fr)"]
related: [D02_TECHNICAL_ANALYSIS.md, D04_BUSINESS_RULES.md]
---

# D03 — Workflow Analysis

## What / why
The end-to-end operational flow, phase by phase, with inputs, tools, outputs, and human checkpoints.

## Phase summary (from source)

| Phase | Action | Tool | Output |
|---|---|---|---|
| 1 | Export placement data (last 7 days) | Google Ads UI or Script | CSV `placements_last7days.csv` / Sheet `Placements` tab |
| 2 | Filter unrelated placements | Python or Apps Script | `to_exclude.csv` + `to_monitor` |
| 3 | Apply exclusions | Google Ads UI or Script | Shared exclusion list applied |
| 4 | Schedule automation | Google Ads Scripts | Weekly auto-run |

## Phase 1 — Export
- **First time (manual verification):** Campaigns ▸ PMax ▸ Insights & Reports ▸ *When & Where Ads Showed* ▸
  Last 7 days ▸ columns [Placement, Type, Network, Impressions] ▸ Download CSV.
  Alternative path: Report editor ▸ *When and where ads showed* ▸ PMax campaign placements.
- **Going forward (automated):** Google Ads Script writes data to a Google Sheet (`YOUR_SHEET_ID`).

## Phase 2 — Filter
- Compute threshold (D04). Apply decision tree (stop at first match).
- Outputs: **`ToExclude` tab = clear + replace** every run; **`ToMonitor` tab = append**, retain history.
- **Human checkpoint:** review `to_exclude.csv` before applying; tune threshold to reduce low-traffic noise.

## Phase 3 — Apply
- **First-time setup (manual):** Tools & Settings ▸ Shared Library ▸ Placement Exclusion Lists ▸
  + New list → name **"PMax - Unrelated Placements - ledsone.fr"** → paste app IDs/URLs → Save →
  Campaigns ▸ PMax ▸ Placements ▸ Exclusions → apply list.
- **Ongoing (automated):** script updates the same list weekly. **Prioritise highest-impression placements**
  due to per-campaign exclusion caps.

## Phase 4 — Schedule
| Setting | Value |
|---|---|
| Frequency | Weekly |
| Day | Monday |
| Time | 06:00 CET (GMT+01:00 Paris) — before daily budget spends |
| Duration | ~2–5 min |
| Manual input | None after setup |
| Log review | Monday 09:00 |

Steps: Tools ▸ Scripts ▸ paste combined export+filter+exclude function ▸ Weekly/Monday ▸ 06:00 Paris ▸
enable email-on-failure ▸ **Preview first** ▸ Save.

## Output storage (per source)

| Output | Location |
|---|---|
| Exclusion list | Tools ▸ Shared Library ▸ Placement Exclusion Lists |
| Script logs | Tools ▸ Scripts ▸ [script] ▸ Logs |
| Raw placement data | Google Sheet ▸ Placements tab |
| Filtered exclusion list | Google Sheet ▸ ToExclude tab |

## Automation flow (summary)
1. PMax report (7d) → 2. Export [Placement|Type|Network|Impressions] → 3. Filter (impressions > threshold + keyword) →
4. Push exclusions to PMax → 5. Weekly Monday scheduler → 6. Manual 5-min spot-check + keyword-list refinement.

## Human-in-the-loop checkpoints
- Pre-apply review of `to_exclude` (every run, weight on first runs).
- Monday 09:00 log/result review.
- Periodic keyword-list refinement (capability candidate).

## Pass / fail rule
- **PASS:** each phase has defined input, tool, output, and (where required) a human checkpoint.
- **FAIL:** any phase output location or checkpoint is undefined.
