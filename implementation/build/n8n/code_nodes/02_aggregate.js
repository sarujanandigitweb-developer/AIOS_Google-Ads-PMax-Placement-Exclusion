/**
 * gapmax REQ-01 — n8n Code Node 2: AGGREGATE
 * Phase 1 offline filtering logic. Mode: "Run Once for All Items".
 *
 * Purpose: collapse cross-campaign duplicates (D04 Rule 0 / DEC-11). The same placement
 * appears across multiple PMax campaigns with different impressions; the true volume is the
 * SUM across campaigns. Produces one record per unique urlKey for Threshold → Classify.
 * NO threshold, NO classification, NO business rule beyond aggregation.
 *
 * Input (from 01_normalize.js): { placement, urlKey, type, network, campaign,
 *                                 originalImpressions, impressions, __summary }
 * Canonical refs: docs/D04_BUSINESS_RULES.md (Rule 0), queries/QUERY_PACK.md.
 */

// ── Read normalized items (ignore the carried __summary; recompute our own) ──
const input = items
  .map((i) => i.json)
  .filter((r) => r && r.urlKey); // skip the summary-only item emitted when normalize had 0 rows

const summary = {
  rows_in: input.length,
  rows_out: 0,
  duplicate_rows_collapsed: 0,
  unique_placements: 0,
  total_impressions_before: 0,
  total_impressions_after: 0,
  hardError: false,
  aggregateWarnings: [],
};

// ── Group by urlKey, SUM impressions, collect unique campaigns ──
const groups = new Map();

for (const r of input) {
  const impr = Number.isFinite(r.impressions) ? r.impressions : 0;
  summary.total_impressions_before += impr;

  let g = groups.get(r.urlKey);
  if (!g) {
    g = {
      placement: r.placement,
      urlKey: r.urlKey,
      type: r.type,
      network: r.network,
      impressions: 0,
      campaignsSet: new Set(),
      sourceRows: 0,
    };
    groups.set(r.urlKey, g);
  }
  g.impressions += impr;
  g.sourceRows += 1;
  if (r.campaign) g.campaignsSet.add(r.campaign);

  // Type/network divergence across rows of the same placement: keep first, warn.
  if (g.type !== r.type) {
    summary.aggregateWarnings.push(
      `type mismatch for ${r.urlKey}: kept "${g.type}", saw "${r.type}"`
    );
  }
}

// ── Build output records ──
const out = [];
for (const g of groups.values()) {
  const campaigns = Array.from(g.campaignsSet);
  if (g.impressions < 0) g.impressions = 0;
  summary.total_impressions_after += g.impressions;
  if (g.sourceRows > 1) summary.duplicate_rows_collapsed += g.sourceRows - 1;
  out.push({
    placement: g.placement,
    urlKey: g.urlKey,
    type: g.type,
    network: g.network,
    impressions: g.impressions,
    campaignCount: campaigns.length,
    campaigns,
    sourceRows: g.sourceRows,
  });
}

summary.rows_out = out.length;
summary.unique_placements = out.length;

// ── Validation (AG1–AG6) ──
// AG1: Σ impressions conserved through aggregation
if (summary.total_impressions_before !== summary.total_impressions_after) {
  summary.hardError = true; // AG6
  summary.aggregateWarnings.push(
    `AG1/AG6 impression sum mismatch: before=${summary.total_impressions_before} after=${summary.total_impressions_after}`
  );
}
// AG2: no duplicate urlKey
const keys = out.map((o) => o.urlKey);
if (new Set(keys).size !== keys.length) {
  summary.hardError = true;
  summary.aggregateWarnings.push('AG2 duplicate urlKey in output');
}
// AG3 + AG4: per-record invariants
for (const o of out) {
  if (o.campaignCount !== new Set(o.campaigns).size) {
    summary.hardError = true;
    summary.aggregateWarnings.push(`AG3 campaignCount mismatch for ${o.urlKey}`);
  }
  if (o.sourceRows < o.campaignCount) {
    summary.hardError = true;
    summary.aggregateWarnings.push(`AG4 sourceRows<campaignCount for ${o.urlKey}`);
  }
  if (o.impressions < 0) {
    summary.hardError = true;
    summary.aggregateWarnings.push(`negative impressions for ${o.urlKey}`);
  }
}
// AG5: no output
if (summary.rows_out === 0) {
  summary.hardError = true;
  summary.aggregateWarnings.push('AG5 rows_out == 0');
}

// n8n output: aggregated items + carried __summary; emit summary-only item if empty.
if (out.length === 0) {
  return [{ json: { __summary: summary } }];
}
return out.map((r) => ({ json: { ...r, __summary: summary } }));
