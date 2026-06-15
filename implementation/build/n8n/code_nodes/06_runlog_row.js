/**
 * gapmax REQ-01 — n8n Code Node 6: RUNLOG ROW (reducer)
 * Phase 2 workflow assembly. Mode: "Run Once for All Items".
 *
 * Purpose: collapse the ~950 classified+validated items from 05_Validate into ONE
 * summary item for the RunLog Google Sheets writer. NO business logic, NO
 * re-classification — pure reshaping of the summary already computed by Node 5.
 *
 * Why this node exists: 05_Validate must emit ALL records (ToExclude / ToMonitor
 * split them by decision; the IF gate reads __validation.gate). A per-item Sheets
 * writer fed that stream writes one RunLog row per record (the bug). Collapsing to
 * a single item here yields exactly one RunLog row per run — without touching 01–05.
 *
 * Input  (from 05_Validate): every item carries __validation { metrics, pass,
 *         runLog:{ failed[], pending[] }, ... } (identical on all items).
 * Output: exactly one item with the 11 RunLog columns, names matching the headers.
 *
 * Canonical refs: docs/D04_BUSINESS_RULES.md (read-only), code_nodes/05_validate.js.
 */

const v = $('05_Validate').first().json.__validation;
const m = v.metrics;

return [{
  json: {
    RunDate: $now.setZone('Europe/Paris').toFormat('yyyy-MM-dd HH:mm'),
    Total: m.total,
    Keep: m.keep,
    Exclude: m.exclude,
    Monitor: m.monitor,
    Threshold: m.threshold,
    Pass: v.pass ? 'PASS' : 'FAIL',
    Failed: (v.runLog.failed || []).join(','),
    Pending: (v.runLog.pending || []).join(','),
    Keywords: m.keyword_count,
    Safeguard: m.safeguard_count,
  },
}];
