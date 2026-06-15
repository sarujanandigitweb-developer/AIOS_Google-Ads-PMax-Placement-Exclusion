/**
 * gapmax REQ-01 — n8n Code Node 4: CLASSIFY
 * Phase 1 offline filtering logic. Mode: "Run Once for All Items".
 *
 * Purpose: assign KEEP / EXCLUDE / MONITOR per the CANONICAL decision tree
 * (docs/D04_BUSINESS_RULES.md Rule 2; DEC-03 order, DEC-09/10). This node does NOT
 * define rules — it executes D04. Threshold comes from Node 3; keywords from the Sheet
 * `Unrelated keywords` tab; safeguard from the `Config` tab (OI-02 — empty = no-op).
 *
 * Decision tree (stop at first match):
 *   1. type = 'Mobile application'                                  -> EXCLUDE
 *   2. type = 'Site' + unrelated keyword + impressions >  threshold -> EXCLUDE
 *   3. type = 'Site' + unrelated keyword + impressions <= threshold -> MONITOR
 *   4. type = 'YouTube video'                                       -> KEEP (DEC-09)
 *   5. type = 'Google products'                                     -> KEEP (DEC-10)
 *   6. otherwise (incl. Site without keyword, UNKNOWN)              -> KEEP
 *   Rule 5 safeguard: a related/safeguard term present overrides EXCLUDE -> KEEP.
 *
 * Input (from 03_threshold.js): aggregated record + `threshold`.
 * Output: record + { decision, ruleTrace, matchedKeyword, safeguardApplied }.
 */

const MOBILE = 'Mobile application';
const SITE = 'Site';
const YOUTUBE = 'YouTube video';
const GOOGLE = 'Google products';

// ── Resolve keyword + safeguard lists (n8n node refs with offline fallback) ──
function resolveList(nodeName, globalKey) {
  // n8n: read from a referenced Sheets node; offline: read injected global.
  try {
    if (typeof $ === 'function') {
      const rows = $(nodeName).all().map((i) => i.json);
      const vals = [];
      for (const r of rows) {
        // Prefer a "Keywords" column (case/space-insensitive); else fall back to the first cell.
        const keyName = Object.keys(r).find((k) => String(k).trim().toLowerCase() === 'keywords');
        const v = keyName ? r[keyName] : Object.values(r)[0];
        if (v !== undefined && v !== null && String(v).trim() !== '') vals.push(String(v).trim());
      }
      if (vals.length) return vals;
    }
  } catch (e) {
    /* fall through to global */
  }
  const g = (typeof globalThis !== 'undefined' && globalThis[globalKey]) || [];
  return Array.isArray(g) ? g : [];
}

const keywords = resolveList('Read Keywords', '__KEYWORDS__').map((k) => k.toLowerCase());
const safeguard = resolveList('Read Config', '__SAFEGUARD__').map((k) => k.toLowerCase());

function firstKeyword(urlKey, list) {
  for (const term of list) {
    if (term && urlKey.includes(term)) return term;
  }
  return null;
}

// ── Read threshold-stage items ──
const input = items.map((i) => i.json).filter((r) => r && r.urlKey);

const summary = {
  rows_in: input.length,
  rows_out: 0,
  keyword_count: keywords.length,
  safeguard_count: safeguard.length,
  threshold: input.length ? input[0].threshold : null,
  counts: { KEEP: 0, EXCLUDE: 0, MONITOR: 0 },
  by_type: {},
  safeguard_overrides: 0,
  hardError: false,
  classifyWarnings: [],
};
if (safeguard.length === 0) {
  summary.classifyWarnings.push('safeguard list empty (OI-02 open) — Rule 5 is a no-op this run');
}

function classify(r) {
  const urlKey = r.urlKey;
  const threshold = r.threshold;
  let decision = 'KEEP';
  let ruleTrace = 'order-6:default-KEEP';
  let matchedKeyword = null;

  if (r.type === MOBILE) {
    decision = 'EXCLUDE';
    ruleTrace = 'order-1:Mobile application';
  } else if (r.type === SITE) {
    const kw = firstKeyword(urlKey, keywords);
    if (kw) {
      matchedKeyword = kw;
      if (r.impressions > threshold) {
        decision = 'EXCLUDE';
        ruleTrace = `order-2:Site+kw:${kw}+${r.impressions}>${threshold}`;
      } else {
        decision = 'MONITOR';
        ruleTrace = `order-3:Site+kw:${kw}+${r.impressions}<=${threshold}`;
      }
    } else {
      decision = 'KEEP';
      ruleTrace = 'order-6:Site-no-keyword';
    }
  } else if (r.type === YOUTUBE) {
    decision = 'KEEP';
    ruleTrace = 'order-4:YouTube-video-KEEP(DEC-09)';
  } else if (r.type === GOOGLE) {
    decision = 'KEEP';
    ruleTrace = 'order-5:Google-products-KEEP(DEC-10)';
  }

  // Rule 5 safeguard: override EXCLUDE -> KEEP when a safeguard term is present.
  let safeguardApplied = false;
  if (decision === 'EXCLUDE' && safeguard.length) {
    const sg = firstKeyword(urlKey, safeguard);
    if (sg) {
      decision = 'KEEP';
      ruleTrace = `safeguard:${sg}->KEEP`;
      safeguardApplied = true;
    }
  }
  return { decision, ruleTrace, matchedKeyword, safeguardApplied };
}

const out = [];
for (const r of input) {
  const c = classify(r);
  if (c.safeguardApplied) summary.safeguard_overrides += 1;
  summary.counts[c.decision] += 1;
  summary.by_type[r.type] = summary.by_type[r.type] || { KEEP: 0, EXCLUDE: 0, MONITOR: 0 };
  summary.by_type[r.type][c.decision] += 1;
  out.push({ ...r, ...c });
}
summary.rows_out = out.length;

// ── Validation (CL1–CL8) ──
const monitors = out.filter((o) => o.decision === 'MONITOR');
const checks = {
  CL1_apps_excluded: out
    .filter((o) => o.type === MOBILE)
    .every((o) => o.decision === 'EXCLUDE' || o.safeguardApplied),
  CL2_youtube_keep: out.filter((o) => o.type === YOUTUBE).every((o) => o.decision === 'KEEP'),
  CL3_google_keep: out.filter((o) => o.type === GOOGLE).every((o) => o.decision === 'KEEP'),
  CL4_monitor_below_threshold: monitors.every((o) => o.impressions <= o.threshold),
  CL5_valid_decisions: out.every((o) => ['KEEP', 'EXCLUDE', 'MONITOR'].includes(o.decision)),
  CL6_conserved: summary.rows_out === summary.rows_in,
  CL7_site_decisions_have_kw: out
    .filter((o) => o.type === SITE && (o.decision === 'EXCLUDE' || o.decision === 'MONITOR'))
    .every((o) => !!o.matchedKeyword),
  CL8_counts_sum: summary.counts.KEEP + summary.counts.EXCLUDE + summary.counts.MONITOR === summary.rows_out,
};
summary.checks = checks;
if (!Object.values(checks).every(Boolean)) {
  summary.hardError = true;
  for (const [k, v] of Object.entries(checks)) if (!v) summary.classifyWarnings.push(`FAILED ${k}`);
}

if (out.length === 0) {
  return [{ json: { __summary: summary } }];
}
return out.map((r) => ({ json: { ...r, __summary: summary } }));
