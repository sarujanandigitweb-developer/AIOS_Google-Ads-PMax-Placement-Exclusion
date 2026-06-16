/**
 * gapmax REQ-01 — Apps Script: GAPMax EXECUTIVE BI DASHBOARD (single-tab, A:Z, GREEN)
 * ---------------------------------------------------------------------------
 * Builds ONE sheet "Dashboard" as a full-width desktop BI view (Power-BI / Looker style),
 * optimized for 1920x1080: header banner + status pill, 8 KPI cards, 3 trend line charts,
 * risk donut + top-15 monitor queue, top-10 exclusions + keyword bar chart, validation
 * center, footer.
 *
 * Reads ONLY ToExclude, ToMonitor, RunLog, _Validation. NEVER modifies them, the Code
 * Nodes, D04, or build_output_tabs.gs. NO helper sheets.
 *
 * Idempotent: each run removes prior charts / merges / conditional formats / content,
 * then rebuilds — no duplication, no duplicate charts.
 *
 * Entry point: buildMonitorDashboard()
 */

// ── Palette / grid config ───────────────────────────────────────────────────
var DB = {
  TAB: 'Dashboard', COLS: 26, COLW: 70, LAST_ROW: 88, TZ: 'Europe/Paris', CAMPAIGN: 'ledsone.fr · PMax',
  SRC_EXCLUDE: 'ToExclude', SRC_MONITOR: 'ToMonitor', SRC_RUNLOG: 'RunLog', SRC_VALID: '_Validation',
  FONT: 'Roboto',
  PAGE: '#f3f5f9', PANEL: '#ffffff', INK: '#1f2733', MUTE: '#6b7280', LINE: '#dfe4ec',
  BRAND: '#1a56db', BRAND_DK: '#0b3aa3', NAVY: '#0a2540',
  RED: '#e02424', RED_BG: '#fde8e8', ORANGE: '#ff5a1f', ORANGE_BG: '#fff1e8',
  AMBER: '#c27803', AMBER_BG: '#fdf6b2', GREEN: '#057a55', GREEN_BG: '#def7ec',
  TEAL: '#0694a2', VIOLET: '#7e3af2', GREY: '#64748b',
  TOP_MON: 15, TOP_EX: 10, TOP_KW: 10,
};

// ── Spreadsheet + table-reader helpers ──────────────────────────────────────
function dbSS_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function dbTab_(name) { return dbSS_().getSheetByName(name); }
function nowStr_() { return Utilities.formatDate(new Date(), DB.TZ, 'yyyy-MM-dd HH:mm'); }

function readTable_(name) {
  var sh = dbTab_(name);
  if (!sh) return null;
  var values = sh.getDataRange().getValues();
  if (!values.length) return { sheet: sh, headers: [], rows: [], idx: function () { return -1; } };
  var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var rows = values.slice(1).filter(function (r) { return r.join('') !== ''; });
  return {
    sheet: sh, headers: headers, rows: rows,
    idx: function () {
      for (var a = 0; a < arguments.length; a++) {
        var i = headers.indexOf(String(arguments[a]).trim().toLowerCase());
        if (i !== -1) return i;
      }
      return -1;
    },
  };
}

function num_(v) { var n = Number(String(v).replace(/[^\d.-]/g, '')); return isFinite(n) ? n : 0; }
function fmt_(n) { return Number(n).toLocaleString('en-US'); }
function parseThreshold_(rt) { var m = String(rt).match(/<=(\d+)/); return m ? Number(m[1]) : 0; }
function parseKeyword_(rt) { var m = String(rt).match(/kw:([^+]+)/); return m ? m[1] : ''; }
function priorityOf_(ratio) { return ratio >= 0.8 ? 'High' : (ratio >= 0.5 ? 'Medium' : 'Low'); }
function deltaNote_(cur, prev, suffix) {
  if (prev === null || prev === undefined || prev === '') return 'vs last run: —';
  var d = cur - prev, arrow = d > 0 ? '▲' : (d < 0 ? '▼' : '�—');
  return arrow + ' ' + (d > 0 ? '+' : '') + fmt_(Math.round(d * 10) / 10) + (suffix || '') + ' vs last';
}

// Full-width bold section header with brand underline.
function sectionHeader_(sh, row, text) {
  sh.getRange(row, 1, 1, DB.COLS).merge().setValue('  ' + text).setBackground(DB.PAGE).setFontColor(DB.BRAND_DK)
    .setFontWeight('bold').setFontSize(13).setVerticalAlignment('middle').setHorizontalAlignment('left')
    .setBorder(false, false, true, false, false, false, DB.BRAND, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.setRowHeight(row, 26);
}

// Coerce any cell value (string / number / Date / null) to a safe display string.
function asText_(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, DB.TZ, 'yyyy-MM-dd HH:mm');
  return String(v);
}

// KPI card: accent strip (row r) + white body (rows r+1..r+5) with icon/name/value/trend.
// All text parts are coerced to strings so non-string values (e.g. a Date RunDate)
// never produce NaN offsets in setTextStyle. Zero-length runs are skipped.
function kpiCard_(sh, col, r, emoji, name, value, trend, accent, valueColor) {
  sh.getRange(r, col, 1, 3).setBackground(accent);
  var body = sh.getRange(r + 1, col, 5, 3).merge().setBackground(DB.PANEL)
    .setVerticalAlignment('middle').setHorizontalAlignment('center').setWrap(true)
    .setBorder(true, true, true, true, false, false, DB.LINE, SpreadsheetApp.BorderStyle.SOLID);

  var l1 = String(emoji) + '  ' + String(name);
  var val = asText_(value);
  var tr = (trend === null || trend === undefined) ? '' : String(trend);
  var text = l1 + '\n' + val + (tr ? '\n' + tr : '');

  var sName = SpreadsheetApp.newTextStyle().setForegroundColor(DB.MUTE).setFontSize(10).setBold(true).build();
  var sVal = SpreadsheetApp.newTextStyle().setForegroundColor(valueColor || DB.INK).setFontSize(22).setBold(true).build();
  var sTr = SpreadsheetApp.newTextStyle().setForegroundColor(DB.GREY).setFontSize(9).setBold(false).build();

  var rt = SpreadsheetApp.newRichTextValue().setText(text);
  var valStart = l1.length + 1, valEnd = valStart + val.length;
  rt.setTextStyle(0, l1.length, sName);                 // name run (always non-empty)
  if (val.length) rt.setTextStyle(valStart, valEnd, sVal);
  if (tr.length) rt.setTextStyle(valEnd + 1, text.length, sTr);
  body.setRichTextValue(rt.build());
}

// Generic table writer with per-column spans (merged cells) for readable URLs.
// columns: [{label, span, align?, numFmt?, wrap?}]; dataRows: array of value-arrays.
// Returns { lastRow, totalSpan, colStartOf: [absoluteColPerField] }.
function drawTable_(sh, topRow, startCol, columns, dataRows) {
  var colStartOf = [], col = startCol;
  columns.forEach(function (c, i) {
    colStartOf[i] = col;
    var h = sh.getRange(topRow, col, 1, c.span); if (c.span > 1) h.merge();
    h.setValue(c.label).setFontWeight('bold').setBackground(DB.BRAND).setFontColor('#ffffff')
      .setHorizontalAlignment('center').setVerticalAlignment('middle');
    col += c.span;
  });
  var totalSpan = col - startCol;
  for (var r = 0; r < dataRows.length; r++) {
    var rowNum = topRow + 1 + r, cc = startCol;
    for (var i = 0; i < columns.length; i++) {
      var c = columns[i], rng = sh.getRange(rowNum, cc, 1, c.span); if (c.span > 1) rng.merge();
      rng.setValue(dataRows[r][i]).setVerticalAlignment('middle');
      if (c.align) rng.setHorizontalAlignment(c.align);
      if (c.numFmt) rng.setNumberFormat(c.numFmt);
      if (c.wrap) rng.setWrap(true);
      cc += c.span;
    }
  }
  var nRows = dataRows.length + 1;
  if (dataRows.length) sh.getRange(topRow + 1, startCol, dataRows.length, totalSpan).setBackground(DB.PANEL);
  sh.getRange(topRow, startCol, nRows, totalSpan).setBorder(true, true, true, true, true, true, DB.LINE, SpreadsheetApp.BorderStyle.SOLID);
  return { lastRow: topRow + nRows - 1, totalSpan: totalSpan, colStartOf: colStartOf };
}

// ── 0. Reset + canvas ───────────────────────────────────────────────────────
function resetDashboard_() {
  var ss = dbSS_();
  var sh = ss.getSheetByName(DB.TAB) || ss.insertSheet(DB.TAB);
  sh.getCharts().forEach(function (c) { sh.removeChart(c); });
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), DB.LAST_ROW + 6), Math.max(sh.getMaxColumns(), DB.COLS)).breakApart();
  sh.setConditionalFormatRules([]);
  sh.clear();
  sh.setHiddenGridlines(true);
  for (var c = 1; c <= DB.COLS; c++) sh.setColumnWidth(c, DB.COLW);
  sh.getRange(1, 1, DB.LAST_ROW, DB.COLS).setBackground(DB.PAGE).setFontFamily(DB.FONT).setFontColor(DB.INK);
  return sh;
}

// ── 1. Header banner + status pill (rows 1-4) ───────────────────────────────
function buildHeader_(sh, ctx) {
  var ban = sh.getRange(1, 1, 3, DB.COLS).merge().setBackground(DB.NAVY)
    .setVerticalAlignment('middle').setHorizontalAlignment('left');
  var t1 = '   GAPMax — PMax Placement Exclusion Dashboard';
  var t2 = '   Campaign: ' + DB.CAMPAIGN + '      Monitoring date: ' + ctx.today + '      Last run: ' + (ctx.runDate || '—');
  var text = t1 + '\n' + t2;
  ban.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(text)
    .setTextStyle(0, t1.length, SpreadsheetApp.newTextStyle().setForegroundColor('#ffffff').setFontSize(22).setBold(true).build())
    .setTextStyle(t1.length + 1, text.length, SpreadsheetApp.newTextStyle().setForegroundColor('#9db8f0').setFontSize(11).build()).build());
  sh.setRowHeights(1, 3, 24);

  // Status bar (row 4): left meta, right health pill.
  sh.getRange(4, 1, 1, 18).merge().setValue('  Pipeline status').setBackground(DB.PAGE).setFontColor(DB.MUTE).setVerticalAlignment('middle');
  var ok = ctx.validationOk;
  sh.getRange(4, 19, 1, 8).merge().setValue((ok ? '🟢  System Healthy' : '🔴  Validation Failed') + '   ')
    .setBackground(ok ? DB.GREEN_BG : DB.RED_BG).setFontColor(ok ? DB.GREEN : DB.RED)
    .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('right').setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, ok ? DB.GREEN : DB.RED, SpreadsheetApp.BorderStyle.SOLID);
  sh.setRowHeight(4, 24);
}

// ── 2. KPI cards (rows 5-10) — 8 cards across A:Z ───────────────────────────
function buildKpis_(sh, ctx) {
  var m = ctx.metrics, p = ctx.prevMetrics || {};
  var exRate = m.total ? Math.round(m.exclude / m.total * 1000) / 10 : 0;
  var pExRate = (p.total ? Math.round(p.exclude / p.total * 1000) / 10 : null);
  var starts = [2, 5, 8, 11, 14, 17, 20, 23]; // 8 cards x 3 cols, A & Z as margins
  sh.setRowHeight(5, 5); sh.setRowHeights(6, 5, 18);
  kpiCard_(sh, starts[0], 5, '📊', 'TOTAL PLACEMENTS', fmt_(m.total), deltaNote_(m.total, p.total), DB.BRAND);
  kpiCard_(sh, starts[1], 5, '🚫', 'EXCLUDED', fmt_(m.exclude), deltaNote_(m.exclude, p.exclude), DB.RED, DB.RED);
  kpiCard_(sh, starts[2], 5, '👀', 'MONITORED', fmt_(m.monitor), deltaNote_(m.monitor, p.monitor), DB.ORANGE, DB.ORANGE);
  kpiCard_(sh, starts[3], 5, '📈', 'EXCLUSION RATE', exRate + '%', deltaNote_(exRate, pExRate, 'pp'), DB.VIOLET, DB.VIOLET);
  kpiCard_(sh, starts[4], 5, '⚠️', 'HIGH-RISK MONITORS', fmt_(ctx.highRisk), deltaNote_(ctx.highRisk, null), DB.RED, DB.RED);
  kpiCard_(sh, starts[5], 5, '🎯', 'THRESHOLD USED', m.threshold !== '' ? fmt_(num_(m.threshold)) : '—', deltaNote_(num_(m.threshold), p.threshold !== undefined ? num_(p.threshold) : null), DB.TEAL, DB.TEAL);
  kpiCard_(sh, starts[6], 5, ctx.validationOk ? '✅' : '🛑', 'VALIDATION', ctx.validationOk ? 'PASS' : 'FAIL', ctx.passCount + ' pass / ' + ctx.failCount + ' fail', ctx.validationOk ? DB.GREEN : DB.RED, ctx.validationOk ? DB.GREEN : DB.RED);
  kpiCard_(sh, starts[7], 5, '🕒', 'LAST RUN', ctx.runDate || '—', 'generated ' + ctx.generatedAt, DB.GREY, DB.GREY);
  sh.setRowHeight(11, 8);
}

// ── 3. Performance trends (rows 12-28) — 3 line charts ──────────────────────
// Charts read a bounded, NUMERIC data block written onto the Dashboard (cols A:D,
// hidden under chart 1). This avoids whole-column blank-chart issues and guarantees
// numeric series even if RunLog stored numbers as text.
function buildTrends_(sh) {
  sectionHeader_(sh, 12, '📈  Performance Trends (per run)');
  var log = readTable_(DB.SRC_RUNLOG);
  if (!log || !log.rows.length) { sh.getRange(14, 1).setValue('No RunLog data yet.').setFontColor(DB.MUTE); return; }
  var iD = log.idx('run date', 'rundate'), iE = log.idx('exclude'), iM = log.idx('monitor'), iT = log.idx('threshold');

  var block = [['Run', 'Exclusions', 'Monitor', 'Threshold']];
  log.rows.forEach(function (r) { block.push([asText_(r[iD]), num_(r[iE]), num_(r[iM]), num_(r[iT])]); });
  var n = block.length; // header + data rows
  sh.getRange(13, 1, n, 4).setValues(block);
  var domain = sh.getRange(13, 1, n, 1);

  function line_(seriesOffset, title, color, anchorCol) {
    sh.insertChart(sh.newChart().asLineChart()
      .addRange(domain).addRange(sh.getRange(13, 1 + seriesOffset, n, 1)).setNumHeaders(1)
      .setOption('title', title).setOption('titleTextStyle', { color: DB.INK, bold: true, fontSize: 13 })
      .setOption('legend', { position: 'none' }).setOption('colors', [color]).setOption('curveType', 'function')
      .setOption('backgroundColor', DB.PANEL).setOption('pointSize', 5).setOption('lineWidth', 3)
      .setOption('hAxis', { slantedText: true, slantedTextAngle: 30, textStyle: { fontSize: 9 } })
      .setOption('chartArea', { left: 50, top: 40, width: '84%', height: '60%' })
      .setOption('width', 590).setOption('height', 320).setPosition(13, anchorCol, 4, 4).build());
  }
  line_(1, 'Exclusions Trend', DB.RED, 1);    // block col B
  line_(2, 'Monitor Trend', DB.ORANGE, 10);   // block col C
  line_(3, 'Threshold Trend', DB.BRAND, 19);  // block col D
  for (var rr = 13; rr <= 28; rr++) sh.setRowHeight(rr, 20);
}

// ── 4. Risk analysis (rows 30-48) — donut (left) + top-15 monitor queue ─────
function buildRiskAndQueue_(sh, ctx) {
  sectionHeader_(sh, 30, '⚠️  Risk Analysis');

  // Risk counts data block (read by donut), placed under-left where the chart overlays it.
  sh.getRange(32, 1, 1, 2).setValues([['Risk', 'Count']]).setFontColor(DB.MUTE).setFontWeight('bold');
  sh.getRange(33, 1, 3, 2).setValues([['High', ctx.risk.High], ['Medium', ctx.risk.Medium], ['Low', ctx.risk.Low]]);
  sh.insertChart(sh.newChart().asPieChart()
    .addRange(sh.getRange('A33:B35')).setNumHeaders(0)
    .setOption('title', 'Monitor Risk Split — ' + ctx.metrics.monitor + ' total')
    .setOption('titleTextStyle', { color: DB.INK, bold: true, fontSize: 13 })
    .setOption('colors', [DB.RED, DB.ORANGE, DB.GREEN]).setOption('pieHole', 0.55)
    .setOption('backgroundColor', DB.PANEL).setOption('legend', { position: 'right' })
    .setOption('chartArea', { left: 10, top: 40, width: '92%', height: '78%' })
    .setOption('width', 560).setOption('height', 320).setPosition(31, 1, 4, 4).build());

  // Top-15 monitor queue (right, cols J:S).
  var cols = [
    { label: 'Placement URL', span: 4, wrap: true }, { label: 'Impr.', span: 1, align: 'right', numFmt: '#,##0' },
    { label: 'Threshold', span: 1, align: 'right', numFmt: '#,##0' }, { label: 'Risk %', span: 1, align: 'center', numFmt: '0' },
    { label: 'Keyword', span: 2, align: 'center' }, { label: 'Priority', span: 1, align: 'center' },
  ];
  var rows = ctx.monitorRows.slice(0, DB.TOP_MON).map(function (r) {
    return [r.url, r.impr, r.thr, r.risk, r.kw, r.priority];
  });
  var t = drawTable_(sh, 31, 10, cols, rows);
  for (var rr = 32; rr <= t.lastRow; rr++) sh.setRowHeight(rr, 22);

  // Conditional formatting on Priority (last field) across the row.
  var prCol = t.colStartOf[5]; // absolute column of Priority
  var colLetter = String.fromCharCode(64 + prCol);
  var range = sh.getRange(32, 10, DB.TOP_MON, t.totalSpan);
  var rules = sh.getConditionalFormatRules();
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$' + colLetter + '32="High"').setBackground(DB.RED_BG).setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$' + colLetter + '32="Medium"').setBackground(DB.ORANGE_BG).setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$' + colLetter + '32="Low"').setBackground(DB.GREEN_BG).setRanges([range]).build());
  sh.setConditionalFormatRules(rules);
}

// ── 5. Exclusion insights (rows 50-68) — top exclusions + keyword bar ───────
function buildExclusionInsights_(sh, ctx) {
  sectionHeader_(sh, 50, '🚫  Exclusion Insights');

  // Left: top-10 excluded (cols A:J).
  var cols = [
    { label: 'Placement URL', span: 4, wrap: true }, { label: 'Impr.', span: 1, align: 'right', numFmt: '#,##0' },
    { label: 'Rule Trace', span: 4, wrap: true }, { label: '# Camp.', span: 1, align: 'center', numFmt: '0' },
  ];
  var rows = ctx.excludeRows.slice(0, DB.TOP_EX).map(function (r) { return [r.url, r.impr, r.rule, r.campCount]; });
  var t = drawTable_(sh, 52, 1, cols, rows);
  for (var rr = 53; rr <= t.lastRow; rr++) sh.setRowHeight(rr, 24);

  // Right: keyword distribution data (L:N) + bar chart (O:Z).
  sh.getRange(51, 12, 1, 3).merge().setValue('Top matched keywords').setFontWeight('bold').setFontColor(DB.BRAND_DK);
  var kwData = ctx.keywordTop.map(function (k) { return [k.kw, k.count]; });
  if (!kwData.length) kwData = [['(none)', 0]];
  sh.getRange(52, 12, 1, 3).merge(); sh.getRange(52, 12).setValue('Keyword').setFontWeight('bold').setFontColor(DB.MUTE);
  sh.getRange(52, 15).setValue('Count').setFontWeight('bold').setFontColor(DB.MUTE);
  for (var i = 0; i < kwData.length; i++) {
    sh.getRange(53 + i, 12, 1, 3).merge().setValue(kwData[i][0]);
    sh.getRange(53 + i, 15).setValue(kwData[i][1]).setNumberFormat('#,##0');
  }
  var kwLastRow = 52 + kwData.length;
  sh.insertChart(sh.newChart().asBarChart()
    .addRange(sh.getRange(53, 12, kwData.length, 1)).addRange(sh.getRange(53, 15, kwData.length, 1))
    .setOption('title', 'Keyword Distribution (top ' + kwData.length + ')')
    .setOption('titleTextStyle', { color: DB.INK, bold: true, fontSize: 13 })
    .setOption('legend', { position: 'none' }).setOption('colors', [DB.BRAND])
    .setOption('backgroundColor', DB.PANEL).setOption('width', 760).setOption('height', 340)
    .setOption('chartArea', { left: 130, top: 40, width: '70%', height: '80%' })
    .setPosition(51, 16, 4, 4).build());
  // Keep the small data table visible but compact.
  sh.getRange(52, 12, Math.max(kwData.length + 1, 2), 4).setBorder(true, true, true, true, false, false, DB.LINE, SpreadsheetApp.BorderStyle.SOLID);
}

// ── 6. Validation center (rows 69-80) ───────────────────────────────────────
function buildValidationCenter_(sh, ctx) {
  sectionHeader_(sh, 69, '🧪  Validation Center');
  var ok = ctx.validationOk;
  sh.getRange(71, 1, 3, DB.COLS).merge()
    .setValue(ok ? '✅   Pipeline Validation Passed' : '🛑   Validation Issues Detected' + (ctx.failIds.length ? '   —   Failed: ' + ctx.failIds.join(', ') : ''))
    .setBackground(ok ? DB.GREEN_BG : DB.RED_BG).setFontColor(ok ? DB.GREEN : DB.RED)
    .setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, ok ? DB.GREEN : DB.RED, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // 3 mini count-cards.
  var mini = [['PASS', ctx.passCount, DB.GREEN, DB.GREEN_BG], ['FAIL', ctx.failCount, DB.RED, DB.RED_BG], ['PENDING', ctx.pendCount, DB.AMBER, DB.AMBER_BG]];
  var starts = [2, 11, 20];
  for (var i = 0; i < 3; i++) {
    var c = mini[i], body = sh.getRange(75, starts[i], 3, 5).merge().setBackground(c[3])
      .setVerticalAlignment('middle').setHorizontalAlignment('center')
      .setBorder(true, true, true, true, false, false, c[2], SpreadsheetApp.BorderStyle.SOLID);
    var text = c[0] + '\n' + c[1];
    body.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(text)
      .setTextStyle(0, c[0].length, SpreadsheetApp.newTextStyle().setForegroundColor(c[2]).setFontSize(11).setBold(true).build())
      .setTextStyle(c[0].length + 1, text.length, SpreadsheetApp.newTextStyle().setForegroundColor(c[2]).setFontSize(22).setBold(true).build()).build());
  }
  sh.setRowHeights(71, 3, 22); sh.setRowHeights(75, 3, 20);
}

// ── 7. Footer (rows 82-85) ──────────────────────────────────────────────────
function buildFooter_(sh, ctx) {
  sh.getRange(83, 1, 2, DB.COLS).merge()
    .setValue('  Generated by GAPMax  ·  ' + ctx.generatedAt + '  ·  Total placements processed: ' + fmt_(ctx.metrics.total) + '  ·  Threshold: ' + ctx.metrics.threshold)
    .setBackground(DB.NAVY).setFontColor('#9db8f0').setFontSize(10).setVerticalAlignment('middle').setHorizontalAlignment('left');
  sh.setRowHeights(83, 2, 18);
}

// ── Data assembly (read sources once) ───────────────────────────────────────
function gatherContext_() {
  var log = readTable_(DB.SRC_RUNLOG);
  function rowMetrics(row) {
    if (!row) return null;
    return {
      total: num_(row[log.idx('total')]), keep: num_(row[log.idx('keep')]), exclude: num_(row[log.idx('exclude')]),
      monitor: num_(row[log.idx('monitor')]), threshold: row[log.idx('threshold')], pass: String(row[log.idx('pass')] || '').toUpperCase(),
    };
  }
  var lastRow = (log && log.rows.length) ? log.rows[log.rows.length - 1] : null;
  var prevRow = (log && log.rows.length > 1) ? log.rows[log.rows.length - 2] : null;
  var metrics = rowMetrics(lastRow) || { total: 0, keep: 0, exclude: 0, monitor: 0, threshold: '', pass: '' };
  var runDate = lastRow ? lastRow[log.idx('run date', 'rundate')] : '';

  // ToMonitor → risk + queue.
  var mon = readTable_(DB.SRC_MONITOR), risk = { High: 0, Medium: 0, Low: 0 }, monitorRows = [], kwCount = {};
  if (mon && mon.rows.length) {
    var iU = mon.idx('placement url'), iI = mon.idx('impressions', 'impr.', 'impr'), iR = mon.idx('ruletrace', 'rule trace');
    var thrF = num_(metrics.threshold);
    mon.rows.forEach(function (r) {
      var impr = num_(r[iI]), thr = parseThreshold_(r[iR]) || thrF, ratio = thr ? impr / thr : 0, kw = parseKeyword_(r[iR]);
      var pr = priorityOf_(ratio); risk[pr]++;
      monitorRows.push({ url: r[iU], impr: impr, thr: thr, risk: Math.round(ratio * 100), kw: kw, priority: pr });
      if (kw) kwCount[kw] = (kwCount[kw] || 0) + 1;
    });
    monitorRows.sort(function (a, b) { return b.risk - a.risk; });
  }

  // ToExclude → top exclusions + keyword counts.
  var ex = readTable_(DB.SRC_EXCLUDE), excludeRows = [];
  if (ex && ex.rows.length) {
    var eU = ex.idx('placement url'), eI = ex.idx('impressions', 'impr.', 'impr'), eR = ex.idx('ruletrace', 'rule trace'), eC = ex.idx('campaigns');
    ex.rows.forEach(function (r) {
      var camps = eC === -1 ? '' : String(r[eC]);
      var kw = parseKeyword_(r[eR]); if (kw) kwCount[kw] = (kwCount[kw] || 0) + 1;
      excludeRows.push({ url: r[eU], impr: num_(r[eI]), rule: r[eR], campCount: camps ? camps.split('|').length : 0 });
    });
    excludeRows.sort(function (a, b) { return b.impr - a.impr; });
  }
  var keywordTop = Object.keys(kwCount).map(function (k) { return { kw: k, count: kwCount[k] }; })
    .sort(function (a, b) { return b.count - a.count; }).slice(0, DB.TOP_KW);

  // _Validation → counts.
  var val = readTable_(DB.SRC_VALID), passCount = 0, failCount = 0, pendCount = 0, failIds = [];
  if (val && val.rows.length) {
    var vS = val.idx('status'), vI = val.idx('id');
    val.rows.forEach(function (r) {
      var s = String(r[vS]).trim().toUpperCase();
      if (s === 'PASS') passCount++; else if (s === 'FAIL') { failCount++; failIds.push(r[vI]); } else if (s === 'PENDING') pendCount++;
    });
  }
  var validationOk = failCount === 0 && metrics.pass !== 'FAIL';

  return {
    metrics: metrics, prevMetrics: rowMetrics(prevRow), runDate: runDate, today: Utilities.formatDate(new Date(), DB.TZ, 'yyyy-MM-dd'),
    generatedAt: nowStr_(), risk: risk, highRisk: risk.High, monitorRows: monitorRows, excludeRows: excludeRows,
    keywordTop: keywordTop, passCount: passCount, failCount: failCount, pendCount: pendCount, failIds: failIds, validationOk: validationOk,
  };
}

// ── Main entry point ────────────────────────────────────────────────────────
function buildMonitorDashboard() {
  var missing = [DB.SRC_EXCLUDE, DB.SRC_MONITOR, DB.SRC_RUNLOG, DB.SRC_VALID].filter(function (n) { return !dbTab_(n); });
  if (missing.length) {
    var msg = 'Dashboard aborted — missing source tab(s): ' + missing.join(', ');
    Logger.log(msg); try { dbSS_().toast(msg, 'GAPMax Dashboard', 8); } catch (e) {}
    throw new Error(msg);
  }
  var ctx = gatherContext_();
  var sh = resetDashboard_();
  buildHeader_(sh, ctx);
  buildKpis_(sh, ctx);
  buildTrends_(sh);
  buildRiskAndQueue_(sh, ctx);
  buildExclusionInsights_(sh, ctx);
  buildValidationCenter_(sh, ctx);
  buildFooter_(sh, ctx);

  sh.setFrozenRows(4);
  sh.protect().setDescription('Dashboard (auto-generated — re-run to refresh)').setWarningOnly(true);
  dbSS_().setActiveSheet(sh);

  var done = 'Executive dashboard rebuilt (A:Z, ' + ctx.metrics.total + ' placements).';
  Logger.log(done); try { dbSS_().toast(done, 'GAPMax Dashboard', 6); } catch (e) {}
  return done;
}

// ── Web App endpoint: refresh the Dashboard on demand (additive) ────────────
// n8n calls this AFTER it finishes writing ToMonitor / ToExclude / RunLog so the
// Dashboard auto-refreshes. A shared token guards the public endpoint. The Web App
// always returns HTTP 200 (ContentService) — callers must check the JSON `ok` field.
var DASH_REFRESH_TOKEN = 'CHANGE_ME_SET_A_SECRET'; // set a secret; never commit the real value

function doPost(e) { return handleRefresh_(e); }
function doGet(e) { return handleRefresh_(e); } // allows a browser smoke-test: ...exec?token=SECRET

function handleRefresh_(e) {
  var token = '';
  try {
    if (e && e.parameter && e.parameter.token) token = e.parameter.token;            // query / form param
    else if (e && e.postData && e.postData.contents) token = (JSON.parse(e.postData.contents).token || ''); // JSON body
  } catch (err) { token = ''; }

  if (DASH_REFRESH_TOKEN && String(token).trim() !== String(DASH_REFRESH_TOKEN).trim()) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  try {
    var result = buildMonitorDashboard();
    return ContentService.createTextOutput(JSON.stringify({ ok: true, message: result, at: nowStr_() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/*
 * MENU: do NOT add a second onOpen() (build_output_tabs.gs has the only one).
 * Add this one line to that file's existing GAPMax menu:
 *     .addItem('Build Executive Dashboard', 'buildMonitorDashboard')
 * Or run buildMonitorDashboard() from the editor.
 */
