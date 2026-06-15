---
document: Unrelated Keywords — Usage Analysis
project_code: gapmax
requirement_id: REQ-01
status: ANALYSIS (evidence-based; no code changed)
author: sarujanan (Claude execution agent)
date: 2026-06-15
scope: Determine whether the "Unrelated keywords" sheet/data is actually used.
---

# UNRELATED_KEYWORDS_ANALYSIS.md

## Purpose of Unrelated Keywords

Per the canonical rules document [docs/D04_BUSINESS_RULES.md](../docs/D04_BUSINESS_RULES.md):
- **Rule 2** (D04:43): `Type = Site` AND contains an **unrelated keyword** AND `impressions > threshold` → **EXCLUDE**.
- **Rule 3** (D04:44): `Type = Site` AND contains an **unrelated keyword** AND `impressions ≤ threshold` → **MONITOR**.
- **Rule 4** (D04:65) defines the list itself: a French substring list (~40 terms — `jeux, casino, sport, musique, meteo, actualite, rencontre, …`), matched case-insensitively.

So the keyword list is the **discriminator for `Type = Site` placements**: it decides whether a website placement is unrelated (gaming, sports, news, dating, etc.) and therefore EXCLUDE/MONITOR, versus relevant and KEEP. Mobile apps are excluded independently of keywords (Rule 1).

## References Found

Sheet/data is referenced in **both** classification engines plus the docs:

**Active code (executes the keyword logic):**
| File | Line(s) | Reference |
|---|---|---|
| [implementation/build/n8n/code_nodes/04_classify.js](../implementation/build/n8n/code_nodes/04_classify.js) | 50 | `resolveList('Read Keywords', '__KEYWORDS__')` — loads the list |
| 04_classify.js | 53, 90–96 | `firstKeyword(urlKey, keywords)` → matchedKeyword → EXCLUDE/MONITOR |
| 04_classify.js | 66, 146–149 | `keyword_count` metric; CL7 check `matchedKeyword` present |
| [implementation/build/apps_script/build_output_tabs.gs](../implementation/build/apps_script/build_output_tabs.gs) | 26 | `TAB_KEYWORDS: 'Unrelated keywords'` |
| build_output_tabs.gs | 109–117 | `readKeywords_()` reads the tab |
| build_output_tabs.gs | 184, 199–201 | `firstKeyword_()` → matchedKeyword in `classify_()` |
| build_output_tabs.gs | 349, 355 | `readKeywords_()` wired into `buildOutputTabs()` |

**Configuration / design (declare the source):**
| File | Line | Reference |
|---|---|---|
| [N8N_NODE_CONFIGURATION_REFERENCE.md](../implementation/build/n8n/N8N_NODE_CONFIGURATION_REFERENCE.md) | 34 | `Read Keywords \| Read Rows \| Unrelated keywords \| column Keywords (40 terms)` |
| [WORKFLOW_DESIGN.md](../implementation/build/n8n/WORKFLOW_DESIGN.md) | 22, 35 | `Unrelated Keywords tab (40 terms, runtime keyword source)` |
| [config/CONFIG_SPEC.md](../implementation/build/config/CONFIG_SPEC.md) | 25 | `KEYWORD_SOURCE → Sheet "Unrelated Keywords" (40 terms)` |
| [config/IMPLEMENTATION_ASSUMPTIONS.md](../implementation/build/config/IMPLEMENTATION_ASSUMPTIONS.md) | 28 | tab listed as a project input |

## Execution Flow

**Engine A — n8n workflow (production path):**
```
Schedule Trigger
  → Read Keywords  (Google Sheets node, reads tab "Unrelated keywords", column "Keywords")
  → Read Placements
  → 01_Normalize → 02_Aggregate → 03_Threshold
  → 04_Classify
        keywords = resolveList('Read Keywords', '__KEYWORDS__')   // 04_classify.js:50
        for each Site placement:
            kw = firstKeyword(urlKey, keywords)                   // :90
            kw && impr >  threshold → EXCLUDE  (order-2)          // :92-94
            kw && impr <= threshold → MONITOR  (order-3)          // :95-96
            no kw                   → KEEP     (order-6)          // :99-101
  → 05_Validate (CL7 asserts Site EXCLUDE/MONITOR have matchedKeyword) → writers
```

**Engine B — Apps Script `build_output_tabs.gs` (Sheet-side path):**
```
buildOutputTabs()                                                 // :347
  keywords = readKeywords_()            // reads "Unrelated keywords" tab :349/109
  classify_(aggregated, threshold, keywords, safeguard)           // :355
      firstKeyword_(urlKey, keywords) → EXCLUDE/MONITOR/KEEP      // :199-208
  → writes ToExclude / ToMonitor / RunLog / _Validation
```

Both engines consume the **same** sheet and apply the **same** D04 Rule 2/3 logic.

## Actual Usage Status

- [x] **Actively Used**
- [ ] Partially Used
- [ ] Not Used
- [ ] Dead Code

## Evidence

**Static (code reads + uses it):** the `firstKeyword`/`firstKeyword_` result feeds the `decision` branch in both engines (citations above). It is not stored-and-ignored — `matchedKeyword` is asserted by validation check CL7 (04_classify.js:146-149).

**Runtime (proves it changes outputs):**
- [evidence/outputs/2026-06-12__validation_metrics.json](../evidence/outputs/2026-06-12__validation_metrics.json): `keyword_count: 40`, `exclude: 711`, `monitor: 29`, `keep: 210`.
- [evidence/outputs/2026-06-12__classify_sample.json](../evidence/outputs/2026-06-12__classify_sample.json): a record with `"decision":"MONITOR"`, `"ruleTrace":"order-3:Site+kw:game+3<=500"` — a Site placement classified **only because a keyword matched**.
- Live Sheet screenshots (ToExclude) show Site rows `1001jeux.fr` / `jeux.fr` with `order-2:Site+kw:jeux…` and `1001games.com` with `order-3:Site+kw:game` — direct keyword-driven decisions.
- The `MONITOR = 29` bucket can **only** be produced by Rule 3 (Site + keyword + ≤ threshold). A non-zero MONITOR count is itself proof the list is in effect.

## Impact Analysis

**If the "Unrelated keywords" sheet is removed / emptied:**
- **Will any workflow fail?** No hard crash. Both engines degrade gracefully:
  - n8n: `resolveList(...)` try/catches a missing node and falls back to an empty list (04_classify.js:29-46).
  - Apps Script: `readKeywords_()` returns `[]` if the tab/column is empty (build_output_tabs.gs:109-117). *(Caveat: if the **tab is deleted entirely**, `sheet_()` throws `Missing tab` — build_output_tabs.gs — so removal-by-deletion **would** error the Apps Script; emptying the data would not.)*
- **Will output quality change? Yes, materially:**
  - Every `Type = Site` placement loses its keyword match → all Site rows fall through to **KEEP** (order-6).
  - **MONITOR → 0** (Rule 3 cannot fire).
  - **EXCLUDE collapses to Mobile-application-only** (Rule 1), dropping all unrelated-website exclusions (e.g. `1001jeux.fr`, `1001games.com`).
  - Net: from the evidence run, EXCLUDE would fall from 711 toward the mobile-app subset and MONITOR from 29 to 0 — a large loss of the feature's core value (excluding unrelated **websites**).

## Recommendation

- [x] **Keep as-is** — the functionality is fully implemented and actively driving Rule 2/3 decisions in both engines.

Secondary (not required to answer the question, flagged honestly):
1. **Duplicate truth (already known):** keyword classification exists in **two** engines (04_classify.js and build_output_tabs.gs). Confirm the intended single owner so the keyword logic doesn't drift between them.
2. **D04 list vs live sheet divergence — additional evidence needed.** D04 Rule 4 (D04:65) documents a **French** list (`jeux, casino, sport…`), but runtime evidence matched the English term **`game`** (`order-3:Site+kw:game`). This indicates the **deployed "Unrelated keywords" sheet contains terms not in D04 Rule 4** (or vice-versa). To reconcile, read the live sheet's 40 terms and compare against D04 Rule 4. This does **not** change the "Actively Used" conclusion — it only flags a list-content mismatch to verify.
3. **Substring-match false positives (documented risk, D04:113):** short terms (`info`, `jeu`) can match unintended URLs; the Rule 5 safeguard list mitigates this but is currently empty (OI-02), so V6 = PENDING.

## Reasoning Path (summary)
1. Grep found references in active code (2 files) + 6 docs.
2. Both code files **load** the sheet (`resolveList`/`readKeywords_`) and **branch decisions** on the result (`firstKeyword`).
3. Validation check CL7 and runtime metrics (`keyword_count: 40`, `monitor: 29`) confirm the loaded values reach and change outputs.
4. A concrete classified record (`order-3:Site+kw:game`) shows a decision caused solely by a keyword match.
5. Therefore: **Actively Used**, in two parallel engines, with a list-content reconciliation item outstanding.
