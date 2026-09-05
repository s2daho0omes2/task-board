/**
 * خطة مبيعات ينبع 1 — واجهة تخزين (API) مع رمز دخول ونسخ احتياطية تلقائية
 * لا تحتاج أي مفتاح Anthropic ولا أي خدمة مدفوعة.
 */

/* ═══════════════════════════════════════════════════════════════
   ١) اكتب هنا رمز التعديل الذي ستعطيه لفريقك.
      العرض يبقى مفتوحاً للجميع؛ التعديل يحتاج هذا الرمز.
      اتركه فارغاً '' إذا أردت أن يعدّل أي أحد بلا رمز.
   ═══════════════════════════════════════════════════════════════ */
var PASSCODE = 'yanbu2026';

var SHEET_NAME   = 'plan';
var HIST_SHEET   = 'history';
var MAX_CHARS    = 45000;
var MAX_HISTORY  = 300;      // عدد النسخ الاحتياطية المحفوظة

/* ── الورقة الرئيسية ───────────────────────────────────────── */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange('A1:D1').setValues([['rev', 'updatedAt', 'updatedBy', 'data']]);
    sh.getRange('A2:D2').setValues([[0, '', '', '{}']]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function getHist_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HIST_SHEET);
  if (!sh) {
    sh = ss.insertSheet(HIST_SHEET);
    sh.getRange('A1:D1').setValues([['rev', 'savedAt', 'savedBy', 'data']]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function read_() {
  var row = getSheet_().getRange('A2:D2').getValues()[0];
  var data = {};
  try { data = row[3] ? JSON.parse(String(row[3])) : {}; } catch (e) { data = {}; }
  return {
    rev: Number(row[0] || 0),
    updatedAt: String(row[1] || ''),
    updatedBy: String(row[2] || ''),
    data: data
  };
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── نقاط الوصول ───────────────────────────────────────────── */

function doGet(e) {
  var cur = read_();
  return json_({
    ok: true,
    needsCode: PASSCODE !== '',
    rev: cur.rev,
    updatedAt: cur.updatedAt,
    updatedBy: cur.updatedBy,
    data: cur.data
  });
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'bad_json' }); }

  var codeOk = (PASSCODE === '') || (String(body.code || '') === PASSCODE);

  // التحقق من الرمز فقط، دون حفظ
  if (body.action === 'verify') {
    return json_({ ok: codeOk, error: codeOk ? '' : 'bad_code' });
  }
  if (!codeOk) return json_({ ok: false, error: 'bad_code' });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); }
  catch (err) { return json_({ ok: false, error: 'busy' }); }

  try {
    var payload = JSON.stringify(body.data || {});
    if (payload.length > MAX_CHARS) return json_({ ok: false, error: 'too_large' });

    var cur = read_();
    if (typeof body.rev === 'number' && body.rev < cur.rev) {
      return json_({
        ok: false, error: 'conflict',
        rev: cur.rev, updatedAt: cur.updatedAt, updatedBy: cur.updatedBy, data: cur.data
      });
    }

    var rev = cur.rev + 1;
    var now = new Date().toISOString();
    var by  = String(body.by || '').slice(0, 40);

    getSheet_().getRange('A2:D2').setValues([[rev, now, by, payload]]);

    // نسخة احتياطية لكل حفظة
    try {
      var h = getHist_();
      h.appendRow([rev, now, by, payload]);
      var extra = h.getLastRow() - 1 - MAX_HISTORY;
      if (extra > 0) h.deleteRows(2, extra);
    } catch (err) { /* الحفظ الأساسي نجح — لا نُفشل العملية بسبب الأرشيف */ }

    return json_({ ok: true, rev: rev, updatedAt: now, updatedBy: by });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ── أدوات تُشغَّل يدوياً من المحرّر عند الحاجة ──────────────── */

/** يعرض آخر ٢٠ نسخة احتياطية في السجل (عرض ← سجلات التنفيذ). */
function listBackups() {
  var h = getHist_();
  var last = h.getLastRow();
  var from = Math.max(2, last - 19);
  if (last < 2) { Logger.log('لا توجد نسخ احتياطية بعد.'); return; }
  var rows = h.getRange(from, 1, last - from + 1, 3).getValues();
  rows.forEach(function (r) { Logger.log('rev ' + r[0] + '  |  ' + r[1] + '  |  ' + r[2]); });
}

/** يُرجع الخطة إلى نسخة سابقة. غيّر الرقم ثم شغّل الدالة. */
function restoreBackup() {
  var TARGET_REV = 0;   // ← ضع هنا رقم rev من listBackups
  var h = getHist_();
  var vals = h.getRange(2, 1, Math.max(0, h.getLastRow() - 1), 4).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (Number(vals[i][0]) === TARGET_REV) {
      var cur = read_();
      getSheet_().getRange('A2:D2')
        .setValues([[cur.rev + 1, new Date().toISOString(), 'restore-' + TARGET_REV, vals[i][3]]]);
      Logger.log('تمت الاستعادة إلى rev ' + TARGET_REV);
      return;
    }
  }
  Logger.log('لم أجد rev ' + TARGET_REV + ' — شغّل listBackups أولاً.');
}

/** يمسح الخطة ويعيدها فارغة (تبقى النسخ الاحتياطية سليمة). */
function resetPlan() {
  getSheet_().getRange('A2:D2').setValues([[0, new Date().toISOString(), 'reset', '{}']]);
}
