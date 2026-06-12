/**
 * gapmax REQ-01 — n8n Code Node 3: THRESHOLD
 * Phase 1 offline filtering logic. Mode: "Run Once for All Items".
 *
 * Purpose: compute the per-run exclusion threshold over the AGGREGATED Site population
 * (D04 Rule 1, operating on Rule-0 output). NO classification here — that is Node 4.
 *   threshold = max( SUM(impr of unique Site placements) / COUNT(unique Site placements),
 *                    IMPRESSION_FLOOR )
 * IMPRESSION_FLOOR = 500 (DEC-02; OD-1 pending). Floor prevents over-pruning when the raw
 * average is tiny (real data raw avg ≈ low tens).
 *
 * Input (from 02_aggregate.js): { placement, urlKey, type, network, impressions,
 *                                 campaignCount, campaigns, sourceRows, __summary }
 * Output: same records passed through unchanged + `threshold` attached to each, plus a
 * __summary carrying the threshold computation (for Classify + RunLog).
 *
 * Canonical refs: docs/D04_BUSINESS_RULES.md (Rules 0,1), queries/QUERY_PACK.md (Q0).
 */

// ── Config (mirrors implementation/build/config/CONFIG_SPEC.md; cites DEC-02) ──
const IMPRESSION_FLOOR = 500;
const SITE_TYPE = 'Site';

// ── Read aggregated items (drop any summary-only item) ──
const input = items.map((i) => i.json).filter((r) => r && r.urlKey);

const summary = {
  rows_in: input.length,
  rows_out: 0,
  site_count: 0,
  site_impressions: 0,
  raw_avg: 0,
  impression_floor: IMPRESSION_FLOOR,
  threshold: IMPRESSION_FLOOR,
  floor_applied: false,
  hardError: false,
  thresholdWarnings: [],
};

// ── Compute over aggregated Site placements only ──
for (const r of input) {
  if (r.type === SITE_TYPE) {
    summary.site_count += 1;
    summary.site_impressions += Number.isFinite(r.impressions) ? r.impressions : 0;
  }
}

if (summary.site_count > 0) {
  summary.raw_avg = summary.site_impressions / summary.site_count;
} else {
  summary.raw_avg = 0;
  summary.hardError = true;
  summary.thresholdWarnings.push(
    'no aggregated Site placements — cannot compute average; defaulting threshold to floor'
  );
}

summary.threshold = Math.max(summary.raw_avg, IMPRESSION_FLOOR);
summary.floor_applied = summary.threshold === IMPRESSION_FLOOR && summary.raw_avg < IMPRESSION_FLOOR;

// ── Validation (TH1–TH6) ──
const expected = Math.max(summary.raw_avg, IMPRESSION_FLOOR);
if (summary.threshold !== expected) {
  summary.hardError = true; // TH1
  summary.thresholdWarnings.push('TH1 threshold != max(raw_avg, floor)');
}
if (summary.threshold < IMPRESSION_FLOOR) {
  summary.hardError = true; // TH2
  summary.thresholdWarnings.push('TH2 threshold below floor');
}
// TH3 handled above (site_count == 0 => hardError)
if (summary.site_count > 0) {
  const expAvg = summary.site_impressions / summary.site_count;
  if (Math.abs(expAvg - summary.raw_avg) > 1e-9) {
    summary.hardError = true; // TH4
    summary.thresholdWarnings.push('TH4 raw_avg != site_impr/site_count');
  }
}

// ── Pass records through unchanged, attaching the threshold for Node 4 ──
const out = input.map((r) => ({ ...r, threshold: summary.threshold }));
summary.rows_out = out.length;

// TH5: pass-through conserves rows
if (summary.rows_out !== summary.rows_in) {
  summary.hardError = true;
  summary.thresholdWarnings.push('TH5 rows_out != rows_in (pass-through lost rows)');
}
// TH6: floor correctly applied when raw_avg < floor
if (summary.raw_avg < IMPRESSION_FLOOR && summary.threshold !== IMPRESSION_FLOOR) {
  summary.hardError = true;
  summary.thresholdWarnings.push('TH6 floor not applied when raw_avg < floor');
}

if (out.length === 0) {
  return [{ json: { __summary: summary } }];
}
return out.map((r) => ({ json: { ...r, __summary: summary } }));
