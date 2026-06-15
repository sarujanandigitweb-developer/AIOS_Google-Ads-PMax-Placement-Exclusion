/**
 * gapmax REQ-01 — Apps Script: BUILD OUTPUT TABS (Sheet-only, GREEN)
 * ---------------------------------------------------------------------------
 * Reads `Placement Data` + `Unrelated keywords`, runs the CANONICAL D04 pipeline
 * (normalize -> aggregate -> threshold -> classify -> validate) and writes:
 *   - ToExclude   : CLEARED then rewritten with EXCLUDE rows (impressions desc)
 *   - ToMonitor   : APPENDED with this run's MONITOR rows (history retained)
 *   - RunLog      : APPENDED with one summary row
 *   - _Validation : CLEARED then rewritten with the V1-V9 checks
 *
 * This script REPLACES the buggy writer that dumped the `__validation` JSON blob
 * into ToExclude. It NEVER writes __validation / __summary into a data tab.
 *
 * Scope: touches ONLY the Sheet. It does NOT touch the live Google Ads account
 * (that is the RED apply_exclusions.gs, OI-03). Safe to run = GREEN.
 *
 * Logic mirrors code_nodes/01..05.js exactly. Canonical rules: docs/D04_BUSINESS_RULES.md.
 * Keep this in sync with D04 / the Code Nodes (Skill-05 duplicate-truth).
 */

// ── Config (parameterise; never hardcode credentials) ──────────────────────
const CFG = {
  // Leave SHEET_ID '' to use the bound spreadsheet; or paste an ID to run standalone.
  SHEET_ID: '',
  TAB_PLACEMENTS: 'Placement Data',
  TAB_KEYWORDS: 'Unrelated keywords',
  TAB_EXCLUDE: 'ToExclude',
  TAB_MONITOR: 'ToMonitor',
  TAB_RUNLOG: 'RunLog',
  TAB_VALIDATION: '_Validation',
  HEADER_ROW: 3, // title rows 1-2, header on row 3, data from row 4
  IMPRESSION_FLOOR: 500, // DEC-02
  EXCLUSION_CAP: 65000, // CONFIG_SPEC (confirm value, OI/OD)
  SAFEGUARD: [], // OI-02 open: empty = Rule 5 no-op
  TIMEZONE: 'Europe/Paris',
};

const KNOWN_TYPES = ['Mobile application', 'Site', 'YouTube video', 'Google products'];
const MOBILE = 'Mobile application';
const SITE = 'Site';
const YOUTUBE = 'YouTube video';
const GOOGLE = 'Google products';
const NONDATA_MARKERS = ['performance max placement report'];
const DATE_RANGE_RE = /^\d{1,2}\s+\w+\s+\d{4}\s*-\s*\d{1,2}\s+\w+\s+\d{4}$/i;

// ── Spreadsheet menu (run from the Sheet UI) ───────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('GAPMax')
    .addItem('Build output tabs (classify)', 'buildOutputTabs')
    .addToUi();
}

function ss_() {
  return CFG.SHEET_ID ? SpreadsheetApp.openById(CFG.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Missing tab: "' + name + '"');
  return sh;
}

function clean_(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

// "1.0" -> 1, "1 200" -> 1200, "1,200" -> 1200, "" -> null
function parseImpr_(raw) {
  const s = clean_(raw).replace(/[\s  ]/g, '').replace(/,/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function canonicalType_(raw) {
  const t = clean_(raw);
  if (t === '') return 'UNKNOWN';
  const hit = KNOWN_TYPES.find((k) => k.toLowerCase() === t.toLowerCase());
  return hit || 'UNKNOWN';
}

function isNonDataRow_(obj) {
  const placement = clean_(obj.Placement);
  const low = placement.toLowerCase();
  if (NONDATA_MARKERS.indexOf(low) !== -1) return true;
  if (DATE_RANGE_RE.test(placement)) return true;
  if (low === 'placement' && clean_(obj.Type).toLowerCase() === 'type') return true;
  return false;
}

// ── Read placement rows keyed by the header on CFG.HEADER_ROW ──────────────
function readPlacements_() {
  const sh = sheet_(CFG.TAB_PLACEMENTS);
  const values = sh.getDataRange().getValues();
  if (values.length < CFG.HEADER_ROW) return [];
  const header = values[CFG.HEADER_ROW - 1].map((h) => clean_(h));
  const rows = [];
  for (let r = CFG.HEADER_ROW; r < values.length; r++) {
    const obj = {};
    header.forEach((h, c) => {
      if (h) obj[h] = values[r][c];
    });
    rows.push(obj);
  }
  return rows;
}

function readKeywords_() {
  const sh = sheet_(CFG.TAB_KEYWORDS);
  const values = sh.getDataRange().getValues();
  if (!values.length) return [];
  // Find a "Keywords" header; else use first column. Skip the header cell + blanks.
  const header = values[0].map((h) => clean_(h).toLowerCase());
  let col = header.indexOf('keywords');
  if (col === -1) col = 0;
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const v = clean_(values[r][col]);
    if (v) out.push(v);
  }
  return out;
}

// ── 01 NORMALIZE ───────────────────────────────────────────────────────────
function normalize_(rows) {
  const out = [];
  rows.forEach((row) => {
    if (isNonDataRow_(row)) return;
    const placement = clean_(row.Placement);
    let urlKey = clean_(row['Placement URL']).toLowerCase();
    if (urlKey === '') urlKey = placement.toLowerCase();
    if (urlKey === '') return;
    const type = canonicalType_(row.Type);
    let impressions = parseImpr_(row['Impr.']);
    if (impressions === null) impressions = 0;
    if (impressions < 0) impressions = 0;
    out.push({
      placement: placement,
      urlKey: urlKey,
      type: type,
      network: clean_(row.Network),
      campaign: clean_(row.Campaign),
      impressions: impressions,
    });
  });
  return out;
}

// ── 02 AGGREGATE (SUM by urlKey; DEC-11) ────────────────────────────────────
function aggregate_(rows) {
  const groups = {};
  const order = [];
  rows.forEach((r) => {
    let g = groups[r.urlKey];
    if (!g) {
      g = { placement: r.placement, urlKey: r.urlKey, type: r.type, network: r.network,
            impressions: 0, campaignsSet: {}, sourceRows: 0 };
      groups[r.urlKey] = g;
      order.push(r.urlKey);
    }
    g.impressions += r.impressions;
    g.sourceRows += 1;
    if (r.campaign) g.campaignsSet[r.campaign] = true;
  });
  return order.map((k) => {
    const g = groups[k];
    const campaigns = Object.keys(g.campaignsSet);
    return { placement: g.placement, urlKey: g.urlKey, type: g.type, network: g.network,
             impressions: g.impressions, campaignCount: campaigns.length, campaigns: campaigns,
             sourceRows: g.sourceRows };
  });
}

// ── 03 THRESHOLD = max(avg Site impr, floor) ───────────────────────────────
function threshold_(rows) {
  let count = 0, sum = 0;
  rows.forEach((r) => { if (r.type === SITE) { count++; sum += r.impressions; } });
  const rawAvg = count > 0 ? sum / count : 0;
  return Math.max(rawAvg, CFG.IMPRESSION_FLOOR);
}

// ── 04 CLASSIFY (D04 decision tree) ────────────────────────────────────────
function firstKeyword_(urlKey, list) {
  for (let i = 0; i < list.length; i++) {
    if (list[i] && urlKey.indexOf(list[i]) !== -1) return list[i];
  }
  return null;
}

function classify_(rows, threshold, keywords, safeguard) {
  return rows.map((r) => {
    let decision = 'KEEP';
    let ruleTrace = 'order-6:default-KEEP';
    let matchedKeyword = null;
    if (r.type === MOBILE) {
      decision = 'EXCLUDE'; ruleTrace = 'order-1:Mobile application';
    } else if (r.type === SITE) {
      const kw = firstKeyword_(r.urlKey, keywords);
      if (kw) {
        matchedKeyword = kw;
        if (r.impressions > threshold) {
          decision = 'EXCLUDE'; ruleTrace = 'order-2:Site+kw:' + kw + '+' + r.impressions + '>' + threshold;
        } else {
          decision = 'MONITOR'; ruleTrace = 'order-3:Site+kw:' + kw + '+' + r.impressions + '<=' + threshold;
        }
      } else {
        decision = 'KEEP'; ruleTrace = 'order-6:Site-no-keyword';
      }
    } else if (r.type === YOUTUBE) {
      decision = 'KEEP'; ruleTrace = 'order-4:YouTube-video-KEEP(DEC-09)';
    } else if (r.type === GOOGLE) {
      decision = 'KEEP'; ruleTrace = 'order-5:Google-products-KEEP(DEC-10)';
    }
    let safeguardApplied = false;
    if (decision === 'EXCLUDE' && safeguard.length) {
      const sg = firstKeyword_(r.urlKey, safeguard);
      if (sg) { decision = 'KEEP'; ruleTrace = 'safeguard:' + sg + '->KEEP'; safeguardApplied = true; }
    }
    return Object.assign({}, r, { decision: decision, ruleTrace: ruleTrace,
                                  matchedKeyword: matchedKeyword, safeguardApplied: safeguardApplied,
                                  threshold: threshold });
  });
}

// ── 05 VALIDATE (V1-V9) ────────────────────────────────────────────────────
function validate_(records, threshold, keywords, safeguard) {
  const excludes = records.filter((r) => r.decision === 'EXCLUDE');
  const monitors = records.filter((r) => r.decision === 'MONITOR');
  const keeps = records.filter((r) => r.decision === 'KEEP');
  const checks = [];
  const add = (id, name, ok, detail, pendingFlag) =>
    checks.push({ id: id, name: name, status: pendingFlag ? 'PENDING' : (ok ? 'PASS' : 'FAIL'), detail: detail });

  const v1bad = records.filter((r) => r.type === MOBILE && r.decision !== 'EXCLUDE' && !r.safeguardApplied);
  add('V1', 'Mobile applications -> EXCLUDE', v1bad.length === 0,
    records.filter((r) => r.type === MOBILE).length + ' apps, ' + v1bad.length + ' mis-classified');
  add('V2', 'YouTube video never EXCLUDE',
    records.filter((r) => r.type === YOUTUBE && r.decision === 'EXCLUDE').length === 0, 'youtube');
  add('V3', 'Google products never EXCLUDE',
    records.filter((r) => r.type === GOOGLE && r.decision === 'EXCLUDE').length === 0, 'google');
  add('V4', 'MONITOR <= threshold', monitors.every((r) => r.impressions <= r.threshold), 'monitor');
  add('V5', 'valid decisions only',
    records.every((r) => ['KEEP', 'EXCLUDE', 'MONITOR'].indexOf(r.decision) !== -1), 'decisions');
  if (safeguard.length === 0) add('V6', 'safeguard override', true, 'safeguard list empty (OI-02) — non-blocking', true);
  else add('V6', 'safeguard override', true, 'safeguard active (' + safeguard.length + ' terms)');
  const exKeys = excludes.map((r) => r.urlKey);
  add('V7', 'no duplicate urlKey in EXCLUDE', exKeys.length === new Set(exKeys).size, 'dupes');
  add('V8', 'EXCLUDE count <= cap', excludes.length <= CFG.EXCLUSION_CAP,
    'exclude=' + excludes.length + ' cap=' + CFG.EXCLUSION_CAP);
  add('V9', 'counts reconcile', keeps.length + excludes.length + monitors.length === records.length,
    keeps.length + '+' + excludes.length + '+' + monitors.length + ' vs ' + records.length);

  const failed = checks.filter((c) => c.status === 'FAIL');
  const pending = checks.filter((c) => c.status === 'PENDING');
  return {
    checks: checks,
    pass: failed.length === 0,
    metrics: { total: records.length, keep: keeps.length, exclude: excludes.length,
               monitor: monitors.length, threshold: threshold, exclusion_cap: CFG.EXCLUSION_CAP,
               keyword_count: keywords.length, safeguard_count: safeguard.length },
    failed: failed.map((c) => c.id),
    pending: pending.map((c) => c.id),
  };
}

// ── Writers ────────────────────────────────────────────────────────────────
// Styling only — never touches data, column names, or mappings.
// Bold + colored + frozen, centered header row so each tab reads cleanly.
function styleHeader_(sh, ncols) {
  sh.getRange(1, 1, 1, ncols)
    .setFontWeight('bold')
    .setBackground('#0b5394')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setFrozenRows(1);
}

// Auto-resize columns (capped), thin borders, and vertical alignment over the
// used range. Cosmetic only — does not add/remove/rename columns or change cells.
function finishTab_(sh, ncols) {
  const lastRow = sh.getLastRow();
  if (lastRow < 1) return;
  const used = sh.getRange(1, 1, lastRow, ncols);
  used.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);
  used.setVerticalAlignment('middle');
  for (let c = 1; c <= ncols; c++) {
    sh.autoResizeColumn(c);
    if (sh.getColumnWidth(c) > 400) sh.setColumnWidth(c, 400); // keep long URLs/traces readable
  }
}

function writeExclude_(records, runDate) {
  const sh = sheet_(CFG.TAB_EXCLUDE);
  sh.clearContents(); // replace: latest list only (D04 Rule 6)
  const header = ['Placement', 'Placement URL', 'Type', 'Impressions', 'Campaigns', 'Decision', 'RuleTrace', 'RunDate'];
  const rows = records
    .filter((r) => r.decision === 'EXCLUDE')
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => [r.placement, r.urlKey, r.type, r.impressions, r.campaigns.join(' | '), r.decision, r.ruleTrace, runDate]);
  sh.getRange(1, 1, 1, header.length).setValues([header]);
  styleHeader_(sh, header.length);
  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  finishTab_(sh, header.length);
  return rows.length;
}

function writeMonitor_(records, runDate) {
  const sh = sheet_(CFG.TAB_MONITOR);
  const header = ['Placement', 'Placement URL', 'Type', 'Impressions', 'Decision', 'RuleTrace', 'RunDate'];
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, header.length).setValues([header]); // seed header once
  styleHeader_(sh, header.length);
  const rows = records
    .filter((r) => r.decision === 'MONITOR')
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => [r.placement, r.urlKey, r.type, r.impressions, r.decision, r.ruleTrace, runDate]);
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, header.length).setValues(rows);
  finishTab_(sh, header.length);
  return rows.length;
}

function writeRunLog_(v, runDate) {
  const sh = sheet_(CFG.TAB_RUNLOG);
  const header = ['RunDate', 'Total', 'Keep', 'Exclude', 'Monitor', 'Threshold', 'Pass', 'Failed', 'Pending', 'Keywords', 'Safeguard'];
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, header.length).setValues([header]);
  styleHeader_(sh, header.length);
  const m = v.metrics;
  const row = [runDate, m.total, m.keep, m.exclude, m.monitor, m.threshold, v.pass ? 'PASS' : 'FAIL',
               v.failed.join(','), v.pending.join(','), m.keyword_count, m.safeguard_count];
  sh.getRange(sh.getLastRow() + 1, 1, 1, header.length).setValues([row]);
  finishTab_(sh, header.length);
}

function writeValidation_(v, runDate) {
  const sh = ss_().getSheetByName(CFG.TAB_VALIDATION) || ss_().insertSheet(CFG.TAB_VALIDATION);
  sh.clearContents();
  const header = ['ID', 'Check', 'Status', 'Detail', 'RunDate'];
  const rows = v.checks.map((c) => [c.id, c.name, c.status, c.detail, runDate]);
  sh.getRange(1, 1, 1, header.length).setValues([header]);
  styleHeader_(sh, header.length);
  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  finishTab_(sh, header.length);
}

// ── Entry point ────────────────────────────────────────────────────────────
function buildOutputTabs() {
  const runDate = Utilities.formatDate(new Date(), CFG.TIMEZONE, 'yyyy-MM-dd HH:mm');
  const keywords = readKeywords_().map((k) => k.toLowerCase());
  const safeguard = CFG.SAFEGUARD.map((k) => String(k).toLowerCase());

  const normalized = normalize_(readPlacements_());
  const aggregated = aggregate_(normalized);
  const threshold = threshold_(aggregated);
  const classified = classify_(aggregated, threshold, keywords, safeguard);
  const v = validate_(classified, threshold, keywords, safeguard);

  const exCount = writeExclude_(classified, runDate);
  const monCount = writeMonitor_(classified, runDate);
  writeRunLog_(v, runDate);
  writeValidation_(v, runDate);

  const msg = 'Run ' + runDate + ' | total ' + v.metrics.total +
    ' | KEEP ' + v.metrics.keep + ' | EXCLUDE ' + exCount + ' | MONITOR ' + monCount +
    ' | threshold ' + threshold + ' | ' + (v.pass ? 'PASS' : 'FAIL ' + v.failed.join(','));
  Logger.log(msg);
  try { SpreadsheetApp.getActive().toast(msg, 'GAPMax', 8); } catch (e) {}
  return msg;
}
