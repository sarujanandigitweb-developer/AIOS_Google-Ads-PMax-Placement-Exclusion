# Skill File — REQ-01-D01 (2026-06-12, Friday)

| Field | Value |
|---|---|
| date | 2026-06-12 |
| developer | sarujanan |
| project | Google Ads PMax Placement Exclusion |
| project_code | gapmax |
| phase | Phase 1 – Build (offline filtering engine) |
| requirement_id | REQ-01 |
| deliverable_id | D01 |
| status | COMPLETE |
| evidence_location | `evidence/outputs/2026-06-12__*.json`, `evidence/audit/2026-06-12__*_run_log.md`, `evidence/validation/2026-06-12__*_tests.md`; git `a3d1633`, `3a415e7` |
| blos_keys_used | IMPRESSION_FLOOR, EXCLUSION_CAP, KEYWORD_SOURCE, SAFEGUARD_LIST (declared in `config/CONFIG_SPEC.md` — currently in-code, BLOS-candidate) |
| hardcoded_thresholds | YES — `IMPRESSION_FLOOR = 500` (DEC-02); `EXCLUSION_CAP = 65000` (unconfirmed); priority cutoffs not yet (added D03) |
| three_am_standard | PASS |
| llm_queryable | YES |
| company_knowledge_candidate | YES |
| domain | Advertising / Google Ads PMax |

## 1. SYSTEM STATE
Empty project subfolder. AIOS skill pack + the source technical document were located in `~/Downloads` and read before any work. The intended data store was PostgreSQL (MCP); no classification logic existed. No live Google Ads access (OI-03 RED, not granted). The task is **offline filtering only** — turn last-7-day PMax placement rows into KEEP / EXCLUDE / MONITOR decisions.

## 2. WHAT CHANGED TODAY
Implemented and offline-validated five n8n Code Nodes against the real 1223-row dataset:
- **01 Normalize** — skips title rows, maps columns, canonicalizes `Type`, parses `Impr.` strings (`"1.0"→1`, `"1 200"→1200`).
- **02 Aggregate** — groups by `urlKey`, **SUMs** impressions across campaigns (one record per unique placement).
- **03 Threshold** — `threshold = max(avg impressions of aggregated Site placements, IMPRESSION_FLOOR)`.
- **04 Classify** — D04 decision tree (below).
- **05 Validate** — V1–V9 gate, emits pass/fail + metrics for RunLog.
Validated result: Normalize 1223 → Aggregate 950 unique (273 collapsed) → Threshold 500 → KEEP 210 / EXCLUDE 711 / MONITOR 29 → Validate PASS (V6 PENDING).

## 3. POSTGRESQL / MCP FINDING
PostgreSQL MCP host `pg.severdigitweb.uk` returned **DNS NXDOMAIN** (unreachable — wrong/private host or VPN-only); credentials were inconsistent across briefs. **Decision: PostgreSQL excluded this phase; Google Sheets is the data store.** Real Sheet schema discovered: **title rows 1–2, header on row 3**, columns `Placement | Placement URL | Type | Network | Campaign | Impr.`; `Impr.` arrives as a **string** (`"1.0"`, `"1 200"`, `"255"`); `Type ∈ {Mobile application, Site, YouTube video, Google products}`.

## 4. GAP FOUND
- **OI-02:** the "related/safeguard keyword" list (Rule 5) is undefined → V6 stays **PENDING** (non-blocking).
- **EXCLUSION_CAP** value (65000) is a placeholder, unconfirmed by the business.
- **D04 Rule 4** documents 37 French keywords; the live sheet count is referenced as 40 → reconciliation needed (carried to D02).

## 5. VALIDATION RULE ADDED OR CHANGED
**D04 decision tree (stop at first match):**
```
IF Type = 'Mobile application'                                  → EXCLUDE   (order-1)
ELSE IF Type = 'Site' AND unrelated-keyword AND impr > threshold → EXCLUDE   (order-2)
ELSE IF Type = 'Site' AND unrelated-keyword AND impr ≤ threshold → MONITOR   (order-3)
ELSE IF Type = 'YouTube video'                                  → KEEP       (order-4, DEC-09)
ELSE IF Type = 'Google products'                                → KEEP       (order-5, DEC-10)
ELSE                                                            → KEEP       (order-6)
Safeguard: a related term present overrides EXCLUDE → KEEP (Rule 5; no-op while OI-02 open).
```
**Threshold rule:** `max( SUM(impr of unique Site placements) / COUNT(unique Site placements), IMPRESSION_FLOOR=500 )`.

## 6. FAILURE MODE OR EDGE CASE
- **Header-row mismatch:** if the reader keys on row 1 (title) instead of row 3, every row has empty identifiers → all `skipped_empty`, `rows_out: 0`.
- **Non-numeric `Impr.`** (e.g. `"—"`, `""`) → coerced to 0 with a warning (never NaN).
- **No `Type = Site` rows** → threshold cannot compute an average → defaults to the floor (hardError flagged).
- **Substring keyword match:** short terms (e.g. `info`) can match unintended URLs (`infographie`) — mitigated only by the (currently empty) safeguard list.

## 7. DECISIONS MADE TODAY
- **DEC-02:** `IMPRESSION_FLOOR = 500` to prevent over-pruning when raw averages are tiny.
- **DEC-11:** aggregate by **SUM** of impressions per placement URL (cross-campaign true volume).
- **DEC-09 / DEC-10:** YouTube video and Google products always KEEP.
- **DEC-08:** developer identity corrected to `sarujanan` (from GitHub owner).
- Validate **offline against the real dataset** before any deployment (zero live-account risk).

## 8. COMPANY KNOWLEDGE EXTRACT
- **Offline dry-run validation harness** — execute Code-Node logic locally against the real dataset before wiring into n8n; highest-leverage de-risking step for any Sheets/Ads pipeline.
- **Evidence-triple per node** (output JSON + audit run-log + validation tests) makes every numeric claim independently reproducible.
- **Threshold-floor pattern** (`max(avg, floor)`) generalizes to any "exclude high-volume outliers but don't over-prune low-volume noise" rule.
- **Cross-source key aggregation** — when the same entity appears across partitions (campaigns), SUM on a canonical key (URL) before thresholding.

## 9. LLM STANDARD CHECK
Terminology consistent (KEEP/EXCLUDE/MONITOR, D04 order-N) ✅ · business rules explicit ✅ · assumptions documented (floor, cap) ✅ · edge cases included ✅ · evidence linked ✅ · another dev can continue ✅ · **LLM Queryable: TRUE**.

## BLOS Governance note
`IMPRESSION_FLOOR (500)`, `EXCLUSION_CAP (65000)`, the unrelated-keyword list, and the safeguard list are **operational thresholds/lists that should move to BLOS** rather than living in Code-Node constants — they will change over time and must be governed/reviewable. Flagged for BLOS migration.
