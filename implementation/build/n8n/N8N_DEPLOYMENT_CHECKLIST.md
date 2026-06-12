---
document: n8n Deployment Checklist
project_code: gapmax
requirement_id: REQ-01
status: DOCUMENTED — gating checklist, nothing deployed
author: sarujanan (Claude execution agent)
date: 2026-06-12
---

# n8n Deployment Checklist

> Tick only with evidence (AIOS Skill 08). Go-live items are RED — blocked on OI-03.

## Pre-deployment
- [ ] **OI-02** safeguard keyword list available + loaded into `Config` (closes V6 PENDING)
- [ ] **OI-03** written approval received for live Google Ads changes
- [ ] **Exclusion cap** confirmed (replace placeholder 65000 in `Config`)
- [ ] **Google Sheets access** verified (read all tabs + write ToExclude/ToMonitor/RunLog)
- [ ] **SMTP credentials** configured for Email nodes
- [ ] Canonical D04/D09 updated with DEC-09…12 (still pending)

## Dry-run validation (apply DISABLED)
- [ ] Validate node → overall **PASS** (V1–V9; V6 may be PENDING until OI-02)
- [ ] Review `ToExclude` — no relevant/LED placements wrongly excluded
- [ ] Review `ToMonitor` — appended correctly, history retained
- [ ] Review `RunLog` — metrics row written (counts, threshold, pass)
- [ ] n8n execution log saved → `evidence/audit/`

## Go-live checks
- [ ] Apply Exclusions node enabled (only after OI-03)
- [ ] Wait node functioning (pause + resume on approval)
- [ ] IF gate verified (TRUE only when pass && approval && withinCap)
- [ ] Error Trigger tested (forced failure → RunLog + Failure Email)
- [ ] Schedule Trigger set Mon 06:00 Europe/Paris; **Preview** clean before activating
- [ ] First applied-list screenshot → `evidence/screenshots/`

## Rollback
- [ ] Disable Schedule Trigger (stop weekly runs)
- [ ] Disable Apply Exclusions node (stop Google Ads writes)
- [ ] Review `RunLog` to identify last good run / impact
- [ ] Notify stakeholders (coordinator + business validator)
- [ ] (If needed) manually revert the shared exclusion list in Google Ads

## Status
**DOCUMENTED.** No items ticked — deployment blocked on OI-02, OI-03, and cap confirmation.
