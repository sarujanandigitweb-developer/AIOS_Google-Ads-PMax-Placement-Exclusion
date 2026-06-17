# Skill File — REQ-01-D02 (2026-06-15, Monday)

| Field | Value |
|---|---|
| date | 2026-06-15 |
| developer | sarujanan |
| project | Google Ads PMax Placement Exclusion |
| project_code | gapmax |
| phase | Phase 2 – n8n Integration + Reporting |
| requirement_id | REQ-01 |
| deliverable_id | D02 |
| status | COMPLETE |
| evidence_location | `implementation/build/n8n/code_nodes/{01,04,06}.js`; `reports/UNRELATED_KEYWORDS_ANALYSIS.md`, `reports/KEYWORD_RECONCILIATION_REPORT.md`; git `c2cdd84`, `5e559c7` |
| blos_keys_used | KEYWORD_SOURCE (`Unrelated keywords` tab), SAFEGUARD_LIST (Config), IMPRESSION_FLOOR, EXCLUSION_CAP |
| hardcoded_thresholds | YES — `IMPRESSION_FLOOR = 500`, `EXCLUSION_CAP = 65000` (both in Code Nodes; BLOS-candidate) |
| three_am_standard | PASS |
| llm_queryable | YES |
| company_knowledge_candidate | YES |
| domain | Advertising / Google Ads PMax |

## 1. SYSTEM STATE
Code Nodes 01–05 were built and offline-validated (D01) but **not yet wired in n8n**. The Google Sheets reader/writer nodes were unconfigured; the live workflow had not produced tabs. Classification was correct in isolation but failed when fed real n8n inputs.

## 2. WHAT CHANGED TODAY
- **01 Normalize:** added `resolveColumns()` — auto-detects whether n8n returns real headers (`Placement`,`Impr.`…) **or** the title-row-as-header shape (`Performance Max placement report`, `col_2…col_6`), and maps accordingly. Fixed `rows_out: 0`.
- **04 Classify:** made keyword-column lookup **case/space-insensitive** (`Keywords`/` keywords `) on the `Read Keywords` node reference.
- **06 Build RunLog Row (new):** a reducer that collapses the ~950-item validated stream into **one** RunLog summary row.
- **build_output_tabs.gs:** header styling + `finishTab_` (borders/auto-resize/freeze).
- Reports: Unrelated-keywords usage analysis + keyword reconciliation (D04 37 FR vs live 40).
- MONITOR dashboard design (initial spec).

## 3. POSTGRESQL / MCP FINDING
No DB this phase. Confirmed the **output-tab contracts** that downstream layers depend on:
- `ToMonitor`: `Placement | Placement URL | Type | Impressions | Decision | RuleTrace | RunDate`.
- `ToExclude`: adds `Campaigns`; `RunLog`: `RunDate,Total,Keep,Exclude,Monitor,Threshold,Pass,Failed,Pending,Keywords,Safeguard`; `_Validation`: `ID,Check,Status,Detail,RunDate`.
- **Key reuse insight:** `RuleTrace` encodes both the matched keyword and the threshold (`order-3:Site+kw:game+3<=500`), so **Matched Keyword and Threshold are derivable downstream by regex** without changing the classifier.

## 4. GAP FOUND
- **Keyword list divergence:** D04 Rule 4 documents **37 French** terms; the live `Unrelated keywords` sheet has **40** including the **English `game`** → canonical-rule vs runtime mismatch (reconciliation report opened, status PARTIAL).
- **OI-D1:** writer ownership of ToMonitor/ToExclude/RunLog is split (Apps Script + n8n) → dual-writer collisions.

## 5. VALIDATION RULE ADDED OR CHANGED
n8n Google Sheets writer contract (operational rules, not business logic):
```
Writer operation MUST be 'Append Row'  (NOT 'Append or Update Row' — that requires a Column-to-Match-On).
Column mapping MUST be manual          (auto-map dumps object fields __validation/__summary as JSON blobs).
RunLog MUST be fed ONE reduced item    (a per-item writer over 950 items writes 950 rows).
Reader 'Read Placements' MUST set Header Row = 3 / First Data Row = 4.
'Read Keywords' MUST execute upstream of Classify and be named exactly.
```

## 6. FAILURE MODE OR EDGE CASE
- **"The 'Column to Match On' parameter is required"** — writer set to Append-or-Update.
- **"Column names were updated after the node's setup"** — Apps Script `clearContents()` rewrites headers while the n8n writer cached columns (dual writer).
- **`__validation`/`__summary` JSON leaked into ToExclude/RunLog** — Sheets auto-map of object fields.
- **RunLog wrote 950 rows** — per-item writer over the full stream.
- **Keywords resolved to 0** — the keyword node wasn't named `Read Keywords` / not wired before Classify → only Mobile apps excluded, MONITOR=0.

## 7. DECISIONS MADE TODAY
- **One writer per tab** (resolve OI-D1) — eliminate dual-writer collisions.
- **n8n Code Nodes are the canonical/runtime classifier**; `build_output_tabs.gs` is a subordinate offline **mirror** (later formalized in `CLASSIFICATION_OWNERSHIP.md`).
- **Reduce-before-write** for any single-row sheet target.
- Column mapping always **manual** for Sheets writers.

## 8. COMPANY KNOWLEDGE EXTRACT
Reusable **n8n ↔ Google Sheets integration ruleset** (applies to any project):
1. Title rows → set the reader's **Header Row** explicitly; never trust the default.
2. Side-table nodes referenced via `$('Node')` must **run upstream** and be **named exactly**.
3. **Append Row + manual mapping**; never Append-or-Update for fresh writes; never auto-map object fields.
4. **Reduce N→1** before a single-row writer.
5. **One writer per tab** — two writers + cached columns = "columns updated after setup".
6. Encode provenance in a single trace string (`RuleTrace`) so downstream layers derive fields by regex without touching the engine.

## 9. LLM STANDARD CHECK
Consistent vocabulary ✅ · operational rules explicit ✅ · failure modes mapped to causes ✅ · evidence linked (code + reports) ✅ · reconciliation gap documented ✅ · **LLM Queryable: TRUE**.

## BLOS Governance note
`IMPRESSION_FLOOR`, `EXCLUSION_CAP`, the **unrelated-keyword list** and **safeguard list** remain in Code-Node/sheet form. The keyword list especially is **business logic that changes** and is currently out of sync with D04 → strong BLOS-migration candidate (governed, reviewable, single source).
