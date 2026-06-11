---
document: Dependency Tracker
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: techclawweb (Claude execution agent)
status: ACTIVE
related: docs/D07_DEPENDENCY_MAP.md
---

# Dependency Tracker — `gapmax` REQ-01

Live status of every blocking dependency (detail in [D07](../docs/D07_DEPENDENCY_MAP.md)).

| Dep ID | Dependency | Needed for | Owner | Status | Target |
|---|---|---|---|---|---|
| OI-01 | Google Sheet access (`YOUR_SHEET_ID`) | Phases 1–2, sample export | Account owner | OPEN | before M1 |
| OI-02 | Related-keyword safeguard list | D04 Rule 5, V6, go-live | Business validator | OPEN | before M2 |
| OI-03 | Written approval for live account (RED) | S6–S8 / M4 | Coordinator + validator | OPEN | before M4 |
| OI-04 | GitHub repo/path | Storage discipline (R10) | Coordinator | OPEN | before commit |
| OI-05 | Sample 7-day export | D06 validation execution | Account owner | OPEN | before M1 |
| OD-1 | Impression floor value (500/1000) | Threshold tuning | PPC owner | OPEN | before M2 |
| OD-3 | Identity/repo metadata confirm | Closure metadata accuracy | Coordinator | OPEN | before commit |

## Internal sequencing
- D01→D04 frozen ✅ → query packs validated → (OI-02) → D06 V6 → (OI-03) → RED stages.

## Escalation
All rows are human-owned; the execution agent cannot close any of them. Escalate at next coordinator sync.
