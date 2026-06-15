/**
 * gapmax REQ-01 — Apps Script: BUILD MONITOR DASHBOARD (Sheet-only, GREEN, ADDITIVE)
 * ---------------------------------------------------------------------------
 * Creates and maintains the formula-driven monitoring dashboard described in
 * implementation/build/dashboard/DASHBOARD_BUILD_SPEC.md:
 *   - MONITOR_REVIEW    : human-owned review metadata (URL, Status, Notes, Updated)
 *   - MONITOR_DASHBOARD : latest-run MONITOR rows + derived Risk/Priority + review join
 *   - Dashboard         : KPI cards, trend, risk + keyword distribution, action queue
 *
 * Strictly ADDITIVE. It reads ToMonitor + RunLog and writes ONLY the three tabs
 * above. It does NOT modify ToMonitor / RunLog / ToExclude / _Validation, any
 * Code Node (01-05), D04, or the existing build_output_tabs.gs logic.
 *
 * Idempotent: safe to re-run. Reviewer data in MONITOR_REVIEW is preserved;
 * dashboard formula cells are (re)written only when missing/changed.
 *
 * Entry point: buildMonitorDashboard()
 */

// ── Config ──────────────────────────────────────────────────────────────────
var DASH = {
  SHEET_ID: '', // '' = bound spreadsheet; or paste an ID to run standalone
  TAB_TOMONITOR: 'ToMonitor',
  TAB_RUNLOG: 'RunLog',
  TAB_REVIEW: 'MONITOR_REVIEW',
  TAB_TABLE: 'MONITOR_DASHBOARD',
  TAB_DASH: 'Dashboard',
  STATUS_LIST: ['New', 'In Review', 'Approved-Keep', 'Approved-Exclude', 'Ignored'],
  BRAND: '#0b5394',
  HEADER_FG: '#ffffff',
  RISK_HIGH_BG: '#f4c7c3', RISK_HIGH_FG: '#990000',
  RISK_MED_BG: '#fce8b2',
  RISK_LOW_BG: '#b7e1cd',
  SCALE_MIN: '#57bb8a', SCALE_MID: '#ffd666', SCALE_MAX: '#e67c73',
};

// Header definitions (also used by the column-position validator).
var REVIEW_HEADER = ['Placement URL', 'Review Status', 'Reviewer Notes', 'Last Updated'];
var TABLE_HEADER = ['Run Date', 'Placement URL', 'Type', 'Impressions', 'Decision',
  'Rule Trace', 'Threshold', 'Matched Keyword', 'Risk Score', 'Priority',
  'Review Status', 'Reviewer Notes'];

// ── Generic helpers (mirror build_output_tabs.gs style) ─────────────────────
function ssDash_() {
  return DASH.SHEET_ID ? SpreadsheetApp.openById(DASH.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name) {
  return ssDash_().getSheetByName(name); // may be null
}

function getOrCreateSheet_(name) {
  var ss = ssDash_();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// Bold + brand + frozen header band.
function styleHeaderRow_(sh, header) {
  sh.getRange(1, 1, 1, header.length).setValues([header])
    .setFontWeight('bold').setBackground(DASH.BRAND).setFontColor(DASH.HEADER_FG)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.setFrozenRows(1);
}

// Write a formula only if the cell does not already hold it (idempotent self-heal).
function setFormulaIfMissing_(sh, a1, formula) {
  var cell = sh.getRange(a1);
  if (cell.getFormula() !== formula) cell.setFormula(formula);
}

// ── 6. Validation helpers ───────────────────────────────────────────────────
// Returns { ok:Boolean, errors:[String] }. Verifies sources + required columns
// at the POSITIONS the dashboard formulas rely on.
function validatePrerequisites_() {
  var errors = [];
  var mon = getSheet_(DASH.TAB_TOMONITOR);
  var log = getSheet_(DASH.TAB_RUNLOG);

  if (!mon) errors.push('Missing source tab: "' + DASH.TAB_TOMONITOR + '".');
  if (!log) errors.push('Missing source tab: "' + DASH.TAB_RUNLOG + '".');

  // ToMonitor must expose: B Placement URL, D Impressions, E Decision, F RuleTrace, G RunDate.
  if (mon && mon.getLastColumn() >= 7) {
    var mh = mon.getRange(1, 1, 1, 7).getValues()[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var need = { 1: 'placement url', 3: 'impressions', 4: 'decision', 5: 'rule trace', 6: 'run date' };
    Object.keys(need).forEach(function (idx) {
      var got = mh[idx] || '';
      // accept 'rule trace' or 'ruletrace', 'run date' or 'rundate'
      var want = need[idx].replace(' ', '');
      if (got.replace(' ', '') !== want) {
        errors.push('ToMonitor column ' + String.fromCharCode(65 + Number(idx)) +
          ' should be "' + need[idx] + '" but is "' + (mh[idx] || '(empty)') + '".');
      }
    });
  } else if (mon) {
    errors.push('ToMonitor has fewer than 7 columns; expected A..G (Placement..RunDate).');
  }

  // RunLog must expose A RunDate, B Total, C Keep, D Exclude, E Monitor, F Threshold.
  if (log && log.getLastColumn() >= 6) {
    var lh = log.getRange(1, 1, 1, 6).getValues()[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var wantLog = ['run date', 'total', 'keep', 'exclude', 'monitor', 'threshold'];
    wantLog.forEach(function (w, i) {
      if ((lh[i] || '').replace(' ', '') !== w.replace(' ', '')) {
        errors.push('RunLog column ' + String.fromCharCode(65 + i) +
          ' should be "' + w + '" but is "' + (lh[i] || '(empty)') + '".');
      }
    });
  } else if (log) {
    errors.push('RunLog has fewer than 6 columns; expected A..F (RunDate..Threshold).');
  }

  return { ok: errors.length === 0, errors: errors };
}

// ── 1. MONITOR_REVIEW ───────────────────────────────────────────────────────
// Create if missing; set header + Status dropdown; NEVER overwrite reviewer rows.
function buildReview_() {
  var sh = getOrCreateSheet_(DASH.TAB_REVIEW);

  // Header only if row 1 is empty/incorrect — never touch data rows (2+).
  var firstCell = String(sh.getRange(1, 1).getValue()).trim().toLowerCase();
  if (firstCell !== 'placement url') {
    styleHeaderRow_(sh, REVIEW_HEADER);
  } else {
    styleHeaderRow_(sh, REVIEW_HEADER); // re-apply styling only; values identical
  }

  // Review Status dropdown on B2:B (reject invalid). Applied to a generous range.
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(DASH.STATUS_LIST, true)
    .setAllowInvalid(false)
    .setHelpText('Choose one of: ' + DASH.STATUS_LIST.join(', '))
    .build();
  sh.getRange('B2:B1000').setDataValidation(rule);

  // Cosmetic widths/format — no data change.
  sh.setColumnWidth(1, 320);
  sh.setColumnWidth(2, 150);
  sh.setColumnWidth(3, 360);
  sh.setColumnWidth(4, 150);
  sh.getRange('D2:D1000').setNumberFormat('yyyy-mm-dd hh:mm');
  return sh;
}

// ── 2. MONITOR_DASHBOARD ────────────────────────────────────────────────────
// All cells are formula-derived. We clear the derived area safely, then (re)write
// the anchor formulas. Reviewer data lives in MONITOR_REVIEW, so nothing here is
// user-owned — clearing is safe and backward-compatible.
function buildMonitorTable_() {
  var sh = getOrCreateSheet_(DASH.TAB_TABLE);

  // Safely clear stale derived content (keep formatting); leaves header intact below.
  sh.getRange('A2:L').clearContent();
  sh.getRange('N1').clearContent();

  styleHeaderRow_(sh, TABLE_HEADER);

  // 3.1 latest-run control cell (text dates sort chronologically).
  var fLatest = '=IFERROR(INDEX(SORT(UNIQUE(FILTER(' + DASH.TAB_TOMONITOR + '!G2:G,(' +
    DASH.TAB_TOMONITOR + '!E2:E="MONITOR")*(' + DASH.TAB_TOMONITOR + '!G2:G<>""))),1,FALSE),1),"")';
  setFormulaIfMissing_(sh, 'N1', fLatest);

  // 3.2 latest MONITOR extraction (spills A2:F); IFERROR handles empty ToMonitor.
  var fQuery = '=IFERROR(QUERY(' + DASH.TAB_TOMONITOR +
    '!A2:G, "select G,B,C,D,E,F where E=\'MONITOR\' and G=\'"&$N$1&"\' order by D desc", 0),"")';
  setFormulaIfMissing_(sh, 'A2', fQuery);

  // 3.3–3.8 derived columns (ARRAYFORMULA, anchored to the A column gate).
  setFormulaIfMissing_(sh, 'G2', '=ARRAYFORMULA(IF(A2:A="","", IFERROR(VALUE(REGEXEXTRACT(F2:F,"<=(\\d+)")),"")))');
  setFormulaIfMissing_(sh, 'H2', '=ARRAYFORMULA(IF(A2:A="","", IFERROR(REGEXEXTRACT(F2:F,"kw:([^+]+)"),"")))');
  setFormulaIfMissing_(sh, 'I2', '=ARRAYFORMULA(IF(A2:A="","", IFERROR(ROUND(D2:D/G2:G*100,0),0)))');
  setFormulaIfMissing_(sh, 'J2', '=ARRAYFORMULA(IF(A2:A="","", IF(IFERROR(D2:D/G2:G,0)>=0.8,"High", IF(IFERROR(D2:D/G2:G,0)>=0.5,"Medium","Low"))))');
  setFormulaIfMissing_(sh, 'K2', '=ARRAYFORMULA(IF(A2:A="","", IFERROR(VLOOKUP(B2:B, ' + DASH.TAB_REVIEW + '!$A:$B, 2, FALSE),"New")))');
  setFormulaIfMissing_(sh, 'L2', '=ARRAYFORMULA(IF(A2:A="","", IFERROR(VLOOKUP(B2:B, ' + DASH.TAB_REVIEW + '!$A:$C, 3, FALSE),"")))');

  // Hide the control column; cosmetic widths + number formats.
  sh.hideColumns(14); // column N
  var widths = [150, 320, 130, 110, 110, 280, 100, 150, 100, 90, 140, 320];
  for (var c = 0; c < widths.length; c++) sh.setColumnWidth(c + 1, widths[c]);
  sh.getRange('D2:D').setNumberFormat('#,##0');
  sh.getRange('G2:G').setNumberFormat('#,##0');
  sh.getRange('I2:I').setNumberFormat('0');
  sh.setFrozenColumns(2);
  return sh;
}

// ── 3. Dashboard (KPI / trend / risk / keyword / action queue) ──────────────
function buildDashboard_() {
  var sh = getOrCreateSheet_(DASH.TAB_DASH);
  sh.clearContents();

  // Title.
  sh.getRange('B2').setValue('PMax Placement Monitor — Executive Dashboard')
    .setFontSize(16).setFontWeight('bold').setFontColor(DASH.BRAND);

  // Helper: latest RunLog row index (hidden in Z1).
  setFormulaIfMissing_(sh, 'Z1', '=COUNTA(' + DASH.TAB_RUNLOG + '!A:A)');

  // KPI cards — labels (row 4) + formulas (row 5).
  var kpiLabels = ['Run Date', 'Total Placements', 'Safe (Keep)', 'Excluded', 'Monitor', 'Threshold'];
  var kpiCols = ['A', 'B', 'C', 'D', 'E', 'F']; // RunLog columns to INDEX
  for (var i = 0; i < kpiLabels.length; i++) {
    var col = i + 2; // start at column B
    sh.getRange(4, col).setValue(kpiLabels[i]).setFontColor('#666666').setFontWeight('bold');
    sh.getRange(5, col).setFormula('=INDEX(' + DASH.TAB_RUNLOG + '!' + kpiCols[i] + ':' + kpiCols[i] + ',$Z$1)')
      .setFontSize(18).setFontWeight('bold');
  }
  sh.getRange('C5:F5').setNumberFormat('#,##0');

  // Risk Distribution (labels row 7, counts row 8).
  sh.getRange('B7').setValue('Risk Distribution').setFontWeight('bold').setFontColor(DASH.BRAND);
  var riskLabels = ['High', 'Medium', 'Low'];
  for (var r = 0; r < riskLabels.length; r++) {
    sh.getRange(8, r + 2).setValue(riskLabels[r]).setFontWeight('bold');
    sh.getRange(9, r + 2).setFormula('=COUNTIF(' + DASH.TAB_TABLE + '!J:J,"' + riskLabels[r] + '")');
  }

  // Monitor Trend (sparkline).
  sh.getRange('B11').setValue('Monitor Trend').setFontWeight('bold').setFontColor(DASH.BRAND);
  setFormulaIfMissing_(sh, 'B12',
    '=SPARKLINE(' + DASH.TAB_RUNLOG + '!E2:E,{"charttype","line";"color1","' + DASH.BRAND + '"})');

  // Keyword Distribution (to the right so it can spill freely).
  sh.getRange('I4').setValue('Keyword Distribution (latest run)').setFontWeight('bold').setFontColor(DASH.BRAND);
  setFormulaIfMissing_(sh, 'I5', '=IFERROR(QUERY(' + DASH.TAB_TABLE +
    '!H2:H, "select H, count(H) where H is not null and H<>\'\' group by H order by count(H) desc label H \'Keyword\', count(H) \'Count\'", 0),"")');

  // Action Queue (High priority, unresolved, highest risk first).
  sh.getRange('B14').setValue('Action Queue — review now').setFontWeight('bold').setFontColor(DASH.BRAND);
  setFormulaIfMissing_(sh, 'B15', '=IFERROR(QUERY(' + DASH.TAB_TABLE +
    '!A2:L, "select B,D,G,H,I,J,K where J=\'High\' and (K=\'New\' or K=\'In Review\') order by I desc label B \'Placement URL\', D \'Impr.\', G \'Threshold\', H \'Keyword\', I \'Risk\', J \'Priority\', K \'Status\'", 0),"No high-priority items.")');

  sh.hideColumns(26); // hide helper column Z
  sh.setColumnWidth(2, 200);
  sh.setFrozenRows(1);
  return sh;
}

// ── 4. Formatting (conditional formatting on the table) ─────────────────────
function applyTableFormatting_() {
  var sh = getSheet_(DASH.TAB_TABLE);
  if (!sh) return;
  var rules = [];
  var priorityCol = sh.getRange('J2:J');
  var riskCol = sh.getRange('I2:I');
  var statusCol = sh.getRange('K2:K');

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('High').setBackground(DASH.RISK_HIGH_BG).setFontColor(DASH.RISK_HIGH_FG).setBold(true)
    .setRanges([priorityCol]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Medium').setBackground(DASH.RISK_MED_BG).setRanges([priorityCol]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Low').setBackground(DASH.RISK_LOW_BG).setRanges([priorityCol]).build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .setGradientMinpointWithValue(DASH.SCALE_MIN, SpreadsheetApp.InterpolationType.NUMBER, '0')
    .setGradientMidpointWithValue(DASH.SCALE_MID, SpreadsheetApp.InterpolationType.NUMBER, '50')
    .setGradientMaxpointWithValue(DASH.SCALE_MAX, SpreadsheetApp.InterpolationType.NUMBER, '100')
    .setRanges([riskCol]).build());

  ['Approved-Keep', 'Approved-Exclude'].forEach(function (s) {
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(s).setBackground('#efefef').setStrikethrough(true).setRanges([statusCol]).build());
  });
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Ignored').setBackground('#efefef').setItalic(true).setFontColor('#999999').setRanges([statusCol]).build());

  sh.setConditionalFormatRules(rules);
}

// ── 5. Protection ───────────────────────────────────────────────────────────
// Dashboard + MONITOR_DASHBOARD: warning-only (prevents accidental edits without
// locking the owner out). MONITOR_REVIEW: protect everything except B:D editable.
function applyProtections_() {
  try {
    [DASH.TAB_TABLE, DASH.TAB_DASH].forEach(function (name) {
      var sh = getSheet_(name);
      if (!sh) return;
      var existing = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      existing.forEach(function (p) { p.remove(); });
      sh.protect().setDescription(name + ' (formula-driven — do not edit)').setWarningOnly(true);
    });

    var rev = getSheet_(DASH.TAB_REVIEW);
    if (rev) {
      rev.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { p.remove(); });
      var prot = rev.protect().setDescription('MONITOR_REVIEW — edit Status/Notes/Updated only');
      // Leave B2:D editable; protect the rest (header + URL key column).
      prot.setUnprotectedRanges([rev.getRange('B2:D1000')]);
      prot.setWarningOnly(true); // warning-only avoids editor-permission failures
    }
  } catch (e) {
    Logger.log('Protection step skipped: ' + e.message);
  }
}

// ── 7. Main entry point ─────────────────────────────────────────────────────
function buildMonitorDashboard() {
  // 1. Validate prerequisites.
  var check = validatePrerequisites_();
  if (!check.ok) {
    var msg = 'Dashboard build aborted — fix these first:\n- ' + check.errors.join('\n- ');
    Logger.log(msg);
    try { SpreadsheetApp.getActive().toast('Build aborted — see logs', 'GAPMax Dashboard', 8); } catch (e) {}
    throw new Error(msg);
  }

  // 2-3. Build tabs (review first so the table's lookups resolve).
  buildReview_();
  buildMonitorTable_();
  buildDashboard_();

  // 4-5. Formatting + protections.
  applyTableFormatting_();
  applyProtections_();

  // 6. Log completion.
  var done = 'MONITOR dashboard built/updated: ' + DASH.TAB_REVIEW + ', ' +
    DASH.TAB_TABLE + ', ' + DASH.TAB_DASH + '.';
  Logger.log(done);
  try { SpreadsheetApp.getActive().toast(done, 'GAPMax Dashboard', 8); } catch (e) {}
  return done;
}

/*
 * OPTIONAL menu wiring — do NOT add a second onOpen() (build_output_tabs.gs already
 * defines one; two onOpen functions collide). Instead add ONE line to that file's
 * existing GAPMax menu:
 *     .addItem('Build Monitor Dashboard', 'buildMonitorDashboard')
 * Or run buildMonitorDashboard() directly from the Apps Script editor / a trigger.
 */
