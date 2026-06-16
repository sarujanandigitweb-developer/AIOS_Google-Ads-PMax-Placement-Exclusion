---
document: Failure Recovery Guide
project_code: gapmax
requirement_id: REQ-01
status: OPERATIONAL
author: sarujanan (Claude execution agent)
date: 2026-06-16
source_of_truth: evidence/exports/GADS_PMAX_Placement Exclusion.json (executed workflow)
---

# Failure Recovery Guide — GAPMax PMax Placement Exclusion

Covers how to detect, diagnose, and recover from failures in the executed workflow:
`Schedule → Read Keywords → Read Placements → 01→02→03→04→05_Validate → {ToExclude, ToMonitor, RunLog} → Merge → HTTP Request (Dashboard refresh) → Wait → Merge1 → IF → Success/Failure email`.

## 0. First signals
- **Failure email** ("Send a message1") fired → a gate condition failed or a node errored.
- **RunLog** row shows `Pass = FAIL` or expected counts missing.
- **Dashboard** "Last Run" KPI not updated / `🔴 Validation Failed` pill.
- n8n **Executions** list shows a red (failed) execution.

## 1. Code-node failure (01–05 or the RunLog reducer "Code in JavaScript")
- **Symptom:** execution stops at a code node; `__summary.hardError = true` or thrown error.
- **Diagnose:** open the failed node's output; read `normalizeWarnings` / `aggregateWarnings` / `thresholdWarnings` / `classifyWarnings`.
- **Common cause:** `01_Normalize` header mismatch → `rows_out: 0`. Fix: Read Placements **Header Row = 3 / First Data Row = 4** (the node also auto-detects positional columns).
- **Recover:** fix config, **re-run the whole workflow** (idempotent — RunLog appends a fresh row; ToExclude is replace-style).
- **Do NOT** edit business logic (01–05 / D04) to "make it pass."

## 2. Keyword resolution failure (empty keywords → no Site exclusions)
- **Symptom:** `keyword_count: 0`, MONITOR = 0, EXCLUDE collapses to mobile-apps only.
- **Cause:** the keyword node is not named exactly **`Read Keywords`** or not upstream of `04_Classify`.
- **Recover:** ensure `Schedule → Read Keywords → Read Placements → …` order; node named `Read Keywords`.

## 3. Google Sheets writer failure (ToExclude / ToMonitor / RunLog)
- **Symptom:** "The 'Column to Match On' parameter is required" or "Column names were updated after the node's setup".
- **Cause:** writer set to **Append-or-Update / Update**, or a second writer (Apps Script) cleared headers.
- **Recover:** set operation **Append Row** + manual column mapping; one writer per tab (see [CLASSIFICATION_OWNERSHIP.md](../implementation/build/CLASSIFICATION_OWNERSHIP.md) / writer-ownership note). Re-run.

## 4. Dashboard refresh (HTTP Request) failure
- **Symptom:** HTTP node red, or response `{"ok":false,"error":"unauthorized"}`.
- **Non-blocking:** the HTTP node should be **Continue On Fail = ON**, so the run still reaches Wait/IF/Email. The dashboard simply isn't refreshed.
- **Diagnose:** `unauthorized` → token mismatch or **stale Web App deployment** (see [WEBAPP_DEPLOYMENT.md](../implementation/build/apps_script/WEBAPP_DEPLOYMENT.md) §Troubleshooting). Empty/HTML response → enable **Follow Redirects**.
- **Manual recover:** open the Sheet → **GAPMax menu → Build Executive Dashboard** (runs `buildMonitorDashboard()` directly). Idempotent — safe any time.

## 5. Validation gate (IF) returns FALSE
- **Symptom:** Failure email; no live-account apply performed.
- **Meaning (by design):** `validation.gate.pass`, reviewer approval, or `withinCap` was false. This is a **safe stop**, not a crash.
- **Recover:** inspect `_Validation` tab (which V-check failed) and ToExclude (false positives / count sanity). Fix the underlying data condition, re-run. Never bypass the gate.

## 6. Wait node not resuming
- **Symptom:** execution paused indefinitely at `Wait`.
- **Cause:** awaiting reviewer approval/timer.
- **Recover:** resume from n8n (manual resume / webhook) once review is complete. Confirm the Wait resume mechanism is configured.

## 7. Whole-run replay
The pipeline is **safe to re-run**: RunLog/ToMonitor append history; ToExclude is replace-style; the dashboard rebuilds idempotently. Re-running after a fix never double-applies (live-account apply is gated and is RED/OI-03 — currently not auto-executed).

## Audit trail
Every run appends one **RunLog** row (`RunDate … Pass/Failed/Pending`). Use it to confirm recovery: a healthy recovered run shows `Pass=PASS`, expected counts, and a fresh `RunDate`. Evidence: [evidence/exports/Google ads Placement Data - RunLog.csv](../evidence/exports/Google%20ads%20Placement%20Data%20-%20RunLog.csv).
