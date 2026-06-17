---
document: Candidate Reusable Skills — discovered 2026-06-15/16 debugging
project_code: gapmax
status: CANDIDATE — reviewer approval required before promotion to canonical skills
author: sarujanan (Claude execution agent)
date: 2026-06-16
rule: promote only if reusable BEYOND a single debugging session
---

# Candidate Skills (n8n ⇄ Google Sheets integration)

Each item below recurred as a root cause and is **reusable on any future n8n + Google Sheets
project**, so it qualifies for promotion. IDs are provisional (`CAND-*`) pending reviewer
assignment into the canonical numbered skill set.

## CAND-01 — n8n Google Sheets "Header Row" must match the real header
**Rule:** when a sheet has title rows above the header, set the Read node **Header Row / First Data Row** to the actual header line (here row 3 / data row 4). Default = row 1, which turns title text into column keys (`col_2..col_6`) and silently zeroes downstream output.
**Symptom:** `rows_out: 0`, `skipped_empty == rows_in`.
**Evidence:** [01_normalize.js](../implementation/build/n8n/code_nodes/01_normalize.js) `resolveColumns()`; 2026-06-15 closure problem #3.

## CAND-02 — Classify depends on `Read Keywords` node name + execution order
**Rule:** `$('Read Keywords')` resolves only if a node is named **exactly** `Read Keywords` and runs **upstream in the same execution**. Place it before `Read Placements` (which overwrites the item stream but leaves the reference intact). No Merge node needed.
**Symptom:** `keyword_count: 0`; all Site placements fall to KEEP; MONITOR=0.
**Evidence:** [04_classify.js:50](../implementation/build/n8n/code_nodes/04_classify.js); 2026-06-15 problem #6.

## CAND-03 — Sheets writers: use "Append Row" + manual mapping (never auto-map objects)
**Rule:** for write-only history/replace tabs use **Append Row** with **Map Each Column Manually**. Auto-map serialises object fields (`__validation`, `__summary`) into JSON-blob columns.
**Symptom:** giant JSON in a data column; unexpected extra columns.
**Evidence:** 2026-06-15 problem #4; reducer pattern in [06_runlog_row.js](../implementation/build/n8n/code_nodes/06_runlog_row.js).

## CAND-04 — "Append or Update" requires a stable "Column to Match On"
**Rule:** **Append-or-Update / Update Row** need a match column and cache the header at setup. If the header is cleared/rewritten (e.g. by Apps Script `clearContents()`), the node throws *"Column names were updated after the node's setup."* Use **Append Row** unless you genuinely need upsert.
**Evidence:** 2026-06-15 problems #1, #2.

## CAND-05 — One writer per sheet tab (Apps Script vs n8n = duplicate-truth)
**Rule:** never let both Apps Script and an n8n node write the same tab. Apps Script `clearContents()` + n8n cached columns collide; rows stack from two sources.
**Symptom:** correct rows + a second block of raw/contaminated rows in the same tab.
**Evidence:** 2026-06-15 problem #2; see [DUPLICATE_TRUTH_ANALYSIS.md](../reports/DUPLICATE_TRUTH_ANALYSIS.md).

## CAND-06 — Reduce-before-write for single-summary tabs
**Rule:** a per-item Sheets writer fed an N-item stream writes N rows. For a one-row summary (RunLog), insert a **"Run Once for All Items"** reducer that returns a single item from the shared summary object (`__validation.runLog`).
**Symptom:** RunLog/summary tab fills with one row per record.
**Evidence:** [06_runlog_row.js](../implementation/build/n8n/code_nodes/06_runlog_row.js); 2026-06-15 problem #5.

## CAND-07 — Apps Script multi-file `onOpen()` collision
**Rule:** an Apps Script *project* shares one global namespace; only **one** `onOpen()` may exist. Add menu items to the existing `onOpen()` rather than defining a second one in a new file. Namespace helper functions (`getSheet_` vs `sheet_`) to avoid duplicate-declaration errors.
**Evidence:** 2026-06-16 deployment guidance; `build_monitor_dashboard.gs` (removed / superseded by `dashboard.gs`) — no `onOpen`, namespaced helpers.

---
**Reviewer action:** approve each candidate for promotion into the canonical skill registry (assign permanent IDs), or reject with reason. Until approved, these remain CANDIDATE and are not authoritative.
