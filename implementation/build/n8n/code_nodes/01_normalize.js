/**
 * gapmax REQ-01 — n8n Code Node 1: NORMALIZE
 * Phase 1 offline filtering logic. Mode: "Run Once for All Items".
 *
 * Purpose: turn raw "Placement Data" rows (real Google Sheet) into clean, typed records
 * for the Aggregate → Threshold → Classify → Validate chain. Structural hygiene only —
 * NO aggregation, NO classification, NO business rule (those live in docs/D04_BUSINESS_RULES.md).
 *
 * Real sheet facts:
 *   - Title rows 1-2 precede the header (header on row 3).
 *   - Columns: Placement | Placement URL | Type | Network | Campaign | Impr.
 *   - Impr. arrives as string ("1.0", "1 200", "255").
 *   - Type ∈ { Mobile application, Site, YouTube video, Google products }.
 *
 * Canonical refs: docs/D04_BUSINESS_RULES.md, queries/QUERY_PACK.md.
 */

// ── Config (mirrors implementation/build/config/CONFIG_SPEC.md; no business rules here) ──
const KNOWN_TYPES = ['Mobile application', 'Site', 'YouTube video', 'Google products'];
const COL = {
  placement: 'Placement',
  url: 'Placement URL',
  type: 'Type',
  network: 'Network',
  campaign: 'Campaign',
  impr: 'Impr.',
};
const NONDATA_MARKERS = ['performance max placement report'];
// Date-range title row, e.g. "10 March 2026 - 16 March 2026"
const DATE_RANGE_RE = /^\d{1,2}\s+\w+\s+\d{4}\s*-\s*\d{1,2}\s+\w+\s+\d{4}$/i;

// ── Helpers ──
function clean(v) {
  return (v === undefined || v === null) ? '' : String(v).trim();
}

// "1.0" -> 1, "1 200" -> 1200, "1,200" -> 1200, "" -> null (parse failure)
function parseImpr(raw) {
  const s = clean(raw).replace(/[\s  ]/g, '').replace(/,/g, '');
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function canonicalType(raw) {
  const t = clean(raw);
  if (t === '') return 'UNKNOWN';
  const hit = KNOWN_TYPES.find((k) => k.toLowerCase() === t.toLowerCase());
  return hit || 'UNKNOWN';
}

function isNonDataRow(row) {
  const placement = clean(row[COL.placement]);
  const low = placement.toLowerCase();
  if (NONDATA_MARKERS.includes(low)) return true;
  if (DATE_RANGE_RE.test(placement)) return true;
  // A stray header row that slipped through (raw read without offset).
  if (low === 'placement' && clean(row[COL.type]).toLowerCase() === 'type') return true;
  return false;
}

// ── Main ──
const input = items.map((i) => i.json);
const summary = {
  rows_in: input.length,
  rows_out: 0,
  skipped_empty: 0,
  skipped_nondata: 0,
  impr_warnings: 0,
  normalizeWarnings: [],
  hasSiteRows: false,
  hardError: false,
};

const out = [];

for (const row of input) {
  if (isNonDataRow(row)) {
    summary.skipped_nondata += 1;
    continue;
  }

  const placement = clean(row[COL.placement]);
  let urlKey = clean(row[COL.url]).toLowerCase();
  if (urlKey === '') urlKey = placement.toLowerCase(); // fallback when URL missing

  // Empty/garbage row: no identifier at all.
  if (urlKey === '') {
    summary.skipped_empty += 1;
    continue;
  }

  const type = canonicalType(row[COL.type]);
  if (type === 'UNKNOWN') {
    summary.normalizeWarnings.push(`unknown type "${clean(row[COL.type])}" for ${urlKey}`);
  }

  const originalImpressions = clean(row[COL.impr]);
  let impressions = parseImpr(originalImpressions);
  if (impressions === null) {
    summary.impr_warnings += 1;
    summary.normalizeWarnings.push(`non-numeric Impr. "${originalImpressions}" for ${urlKey} -> 0`);
    impressions = 0;
  }
  if (impressions < 0) impressions = 0;

  if (type === 'Site') summary.hasSiteRows = true;

  out.push({
    placement,
    urlKey,
    type,
    network: clean(row[COL.network]),
    campaign: clean(row[COL.campaign]),
    originalImpressions,
    impressions,
  });
}

summary.rows_out = out.length;

// Conservation + emptiness guards.
const conserved =
  summary.rows_out + summary.skipped_empty + summary.skipped_nondata === summary.rows_in;
if (!conserved) {
  summary.hardError = true;
  summary.normalizeWarnings.push('conservation check failed (rows_out + skipped != rows_in)');
}
if (summary.rows_out === 0) {
  summary.hardError = true;
  summary.normalizeWarnings.push('no data rows after normalization');
}
if (!summary.hasSiteRows) {
  summary.normalizeWarnings.push(
    'no Type=Site rows — threshold node will be unable to compute an average'
  );
}

// n8n output: each data item carries __summary so the next node / RunLog can read it
// without a side channel. If there are zero output rows, still emit the summary.
if (out.length === 0) {
  return [{ json: { __summary: summary } }];
}
return out.map((r) => ({ json: { ...r, __summary: summary } }));
