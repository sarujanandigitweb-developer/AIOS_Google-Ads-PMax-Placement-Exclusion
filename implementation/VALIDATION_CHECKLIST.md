---
document: Validation Checklist
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: sarujanan (Claude execution agent)
status: DRAFT — to be executed at M1 / M4
related: docs/D06_VALIDATION_PLAN.md
---

# Validation Checklist — `gapmax` REQ-01

> Tick only with saved evidence (AIOS Skill 08). "Looks fine" is not a tick.

## Logic validation (M1 — on sample data)
- [ ] V1 Threshold = avg impressions/Site, floor 500 applied — evidence: `evidence/validation/`
- [ ] V2 All app placements → EXCLUDE regardless of impressions
- [ ] V3 Site + keyword + impr>threshold → EXCLUDE
- [ ] V4 Site + keyword + impr≤threshold → MONITOR (none above threshold)
- [ ] V5 Site, no keyword → KEEP
- [ ] V6 Related-safeguard term overrides EXCLUDE → KEEP (blocked on OI-02)
- [ ] V7 Re-run idempotent — no duplicate to_exclude rows
- [ ] V8 Apply ordering = impressions DESC, cap respected, drops logged
- [ ] V9 ToMonitor appended across runs (history retained)
- [ ] Manual 5-min spot-check: no obviously relevant LED placement in to_exclude

## Production validation (M4 — live)
- [ ] Script Preview runs with no errors
- [ ] Exclusion list "PMax - Unrelated Placements - ledsone.fr" exists & applied — screenshot
- [ ] Weekly schedule = Monday 06:00 (GMT+01 Paris); email-on-failure enabled — screenshot
- [ ] First run duration ≤5 min — log
- [ ] Monday 09:00 log review completed — note

## Governance validation (every closure)
- [ ] One canonical rule source (D04) — no divergence
- [ ] Evidence saved for every claim
- [ ] Unknown-developer test passes
- [ ] No work outside subfolder; no production change without OI-03

## Sign-off
| Gate | Reviewer | Date | Result |
|---|---|---|---|
| M1 logic | Technical reviewer | | |
| M2 rules | Business validator | | |
| M4 live | Coordinator + validator | | |
