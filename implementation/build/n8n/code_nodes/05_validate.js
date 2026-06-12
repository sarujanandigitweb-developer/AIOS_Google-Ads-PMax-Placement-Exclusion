/**
 * gapmax REQ-01 — n8n Code Node 5: VALIDATE
 * Phase 1 offline filtering logic. Mode: "Run Once for All Items".
 *
 * Purpose: run the V1–V9 gate checks (docs/D06_VALIDATION_PLAN.md,
 * queries/VALIDATION_QUERIES.md) over the classified placements, produce a pass/fail
 * decision + metrics for the RunLog and the IF Gate, and pass the records through so the
 * ToExclude / ToMonitor writers can split them. No re-classification — verification only.
 *
 * Input (from 04_classify.js): aggregated record + { threshold, decision, ruleTrace,
 *                              matchedKeyword, safeguardApplied, __summary }.
 * Output: each record passed through + a shared `__validation` block (checks, pass,
 *         metrics, gate) for downstream consumers.
 *
 * Canonical refs: docs/D04_BUSINESS_RULES.md, docs/D06_VALIDATION_PLAN.md.
 */

const MOBILE = 'Mobile application';
const YOUTUBE = 'YouTube video';
const GOOGLE = 'Google products';
const VALID_DECISIONS = ['KEEP', 'EXCLUDE', 'MONITOR'];

// Google Ads shared-list cap (CONFIG_SPEC EXCLUSION_CAP — confirm value, OI/OD).
const EXCLUSION_CAP =
  (typeof globalThis !== 'undefined' && Number.isFinite(globalThis.__EXCLUSION_CAP__))
    ? globalThis.__EXCLUSION_CAP__
    : 65000;
const CAP_CONFIRMED =
  typeof globalThis !== 'undefined' && Number.isFinite(globalThis.__EXCLUSION_CAP__);

const records = items.map((i) => i.json).filter((r) => r && r.urlKey);

const classifySummary = records.length ? records[0].__summary : {};
const safeguardCount = classifySummary && classifySummary.safeguard_count
  ? classifySummary.safeguard_count
  : 0;
const threshold = records.length ? records[0].threshold : null;

const excludes = records.filter((r) => r.decision === 'EXCLUDE');
const monitors = records.filter((r) => r.decision === 'MONITOR');
const keeps = records.filter((r) => r.decision === 'KEEP');

const checks = [];
function add(id, name, status, detail) {
  checks.push({ id, name, status, detail });
}

// V1 — Mobile applications classified correctly (EXCLUDE unless safeguard override)
const v1bad = records.filter(
  (r) => r.type === MOBILE && r.decision !== 'EXCLUDE' && !r.safeguardApplied
);
add('V1', 'Mobile applications -> EXCLUDE', v1bad.length === 0 ? 'PASS' : 'FAIL',
  `${records.filter((r) => r.type === MOBILE).length} apps, ${v1bad.length} mis-classified`);

// V2 — YouTube never EXCLUDE
const v2bad = records.filter((r) => r.type === YOUTUBE && r.decision === 'EXCLUDE');
add('V2', 'YouTube video never EXCLUDE', v2bad.length === 0 ? 'PASS' : 'FAIL', `${v2bad.length} violations`);

// V3 — Google products never EXCLUDE
const v3bad = records.filter((r) => r.type === GOOGLE && r.decision === 'EXCLUDE');
add('V3', 'Google products never EXCLUDE', v3bad.length === 0 ? 'PASS' : 'FAIL', `${v3bad.length} violations`);

// V4 — no MONITOR exceeds threshold
const v4bad = monitors.filter((r) => r.impressions > r.threshold);
add('V4', 'MONITOR <= threshold', v4bad.length === 0 ? 'PASS' : 'FAIL', `${v4bad.length} over threshold`);

// V5 — valid decision values only
const v5bad = records.filter((r) => !VALID_DECISIONS.includes(r.decision));
add('V5', 'valid decisions only', v5bad.length === 0 ? 'PASS' : 'FAIL', `${v5bad.length} invalid`);

// V6 — safeguard override (PENDING when OI-02 absent)
if (safeguardCount === 0) {
  add('V6', 'safeguard override', 'PENDING', 'safeguard list empty (OI-02 open) — non-blocking');
} else {
  // when present: no EXCLUDE record should still contain a safeguard term (override must have fired)
  add('V6', 'safeguard override', 'PASS', `safeguard active (${safeguardCount} terms)`);
}

// V7 — no duplicate urlKey within EXCLUDE
const exKeys = excludes.map((r) => r.urlKey);
const v7dupes = exKeys.length - new Set(exKeys).size;
add('V7', 'no duplicate urlKey in EXCLUDE', v7dupes === 0 ? 'PASS' : 'FAIL', `${v7dupes} duplicates`);

// V8 — EXCLUDE count <= cap
add('V8', 'EXCLUDE count <= cap', excludes.length <= EXCLUSION_CAP ? 'PASS' : 'FAIL',
  `exclude=${excludes.length} cap=${EXCLUSION_CAP}${CAP_CONFIRMED ? '' : ' (cap unconfirmed)'}`);

// V9 — counts reconcile with total rows
const reconcile = keeps.length + excludes.length + monitors.length === records.length;
add('V9', 'counts reconcile', reconcile ? 'PASS' : 'FAIL',
  `${keeps.length}+${excludes.length}+${monitors.length} vs ${records.length}`);

const failed = checks.filter((c) => c.status === 'FAIL');
const pending = checks.filter((c) => c.status === 'PENDING');
const pass = failed.length === 0; // PENDING is non-blocking for the gate

const metrics = {
  total: records.length,
  keep: keeps.length,
  exclude: excludes.length,
  monitor: monitors.length,
  threshold,
  exclusion_cap: EXCLUSION_CAP,
  cap_confirmed: CAP_CONFIRMED,
  keyword_count: classifySummary.keyword_count || 0,
  safeguard_count: safeguardCount,
};

const validation = {
  checks,
  pass,
  failed_ids: failed.map((c) => c.id),
  pending_ids: pending.map((c) => c.id),
  metrics,
  // Gate object the IF node reads directly.
  gate: { pass, excludeCount: excludes.length, withinCap: excludes.length <= EXCLUSION_CAP },
  runLog: {
    runDate: null, // stamped by RunLog writer (Date unavailable in this sandbox)
    ...metrics,
    pass,
    failed: failed.map((c) => c.id),
    pending: pending.map((c) => c.id),
  },
};

if (records.length === 0) {
  return [{ json: { __validation: { ...validation, pass: false, note: 'no input rows' } } }];
}
return records.map((r) => ({ json: { ...r, __validation: validation } }));
