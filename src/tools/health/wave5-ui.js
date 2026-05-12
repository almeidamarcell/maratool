// Shared UI for Wave 5 calcs.
import { serumOsmolality, correctedCalcium, correctedSodium, ironDeficitGanzoni } from './electrolytes.js'
import { idealPaO2ByAge, pao2FiO2Ratio, classifyArds, spo2FiO2Ratio } from './ventilation.js'
import { dropsPerMinToMlPerHour, mlPerHourToDropsPerMin, mcgKgMinToMlPerHour, mlPerHourToMcgKgMin } from './infusion.js'
import { opioidConversion, benzodiazepineConversion, corticosteroidConversion, rsiDoses, phenytoinCorrected } from './drug.js'

function num(id) { var el = document.getElementById(id); if (!el || el.value === '') return NaN; return parseFloat(el.value) }
function val(id) { var el = document.getElementById(id); return el ? el.value : '' }
function checked(id) { var el = document.getElementById(id); return el && el.checked }
function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t }
function setClass(id, c) { var el = document.getElementById(id); if (el) el.className = 'hcalc-output-value' + (c ? ' ' + c : '') }
function bind(ids, fn) { ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.addEventListener('input', fn) }) }
function bindChange(ids, fn) { ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.addEventListener('change', fn) }) }

// ── Serum Osmolality ────────
if (document.getElementById('osm-na')) {
  var osmUpdate = function () {
    var r = serumOsmolality({ sodium: num('osm-na'), glucose: num('osm-glc'), bun: num('osm-bun') })
    setText('osm-value', r !== null ? r + ' mOsm/kg' : '—')
  }
  bind(['osm-na','osm-glc','osm-bun'], osmUpdate)
}

// ── Corrected Calcium ────────
if (document.getElementById('cca-ca')) {
  var ccaUpdate = function () {
    var r = correctedCalcium({ totalCalcium: num('cca-ca'), albumin: num('cca-alb') })
    setText('cca-value', r !== null ? r + ' mg/dL' : '—')
  }
  bind(['cca-ca','cca-alb'], ccaUpdate)
}

// ── Corrected Sodium (Katz) ────────
if (document.getElementById('csn-na')) {
  var csnUpdate = function () {
    var r = correctedSodium({ sodium: num('csn-na'), glucose: num('csn-glc') })
    setText('csn-value', r !== null ? r + ' mEq/L' : '—')
  }
  bind(['csn-na','csn-glc'], csnUpdate)
}

// ── Iron Deficit ────────
if (document.getElementById('iron-weight')) {
  var ironUpdate = function () {
    var r = ironDeficitGanzoni({ weightKg: num('iron-weight'), currentHb: num('iron-hb'), targetHb: num('iron-target') })
    setText('iron-value', r !== null ? r + ' mg' : '—')
  }
  bind(['iron-weight','iron-hb','iron-target'], ironUpdate)
}

// ── Ideal PaO2 by age ────────
if (document.getElementById('pao2age-age')) {
  var pao2ageUpdate = function () {
    var r = idealPaO2ByAge(num('pao2age-age'))
    setText('pao2age-value', r !== null ? r + ' mmHg' : '—')
  }
  bind(['pao2age-age'], pao2ageUpdate)
}

// ── PaO2/FiO2 ratio ────────
if (document.getElementById('pf-pao2')) {
  var pfUpdate = function () {
    var r = pao2FiO2Ratio({ pao2: num('pf-pao2'), fio2: num('pf-fio2') })
    setText('pf-value', r !== null ? r + '' : '—')
    var c = classifyArds(r); setText('pf-class', c || '—')
    setClass('pf-class', c === 'No ARDS' ? 'cls-normal' : c === 'Severe ARDS' ? 'cls-danger' : 'cls-warn')
  }
  bind(['pf-pao2','pf-fio2'], pfUpdate)
}

// ── SpO2/FiO2 ratio ────────
if (document.getElementById('sf-spo2')) {
  var sfUpdate = function () {
    var r = spo2FiO2Ratio({ spo2: num('sf-spo2'), fio2: num('sf-fio2') })
    setText('sf-value', r !== null ? r + '' : '—')
  }
  bind(['sf-spo2','sf-fio2'], sfUpdate)
}

// ── Drops to mL/h ────────
if (document.getElementById('drops-gtt')) {
  var dropsUpdate = function () {
    var r = dropsPerMinToMlPerHour({ dropsPerMin: num('drops-gtt'), dropsPerMl: parseFloat(val('drops-factor') || '20') })
    setText('drops-mlh', r !== null ? r + ' mL/h' : '—')
    var r2 = mlPerHourToDropsPerMin({ mlPerHour: num('drops-mlh-in'), dropsPerMl: parseFloat(val('drops-factor') || '20') })
    setText('drops-gtt-out', r2 !== null ? r2 + ' gtt/min' : '—')
  }
  bind(['drops-gtt','drops-mlh-in'], dropsUpdate)
  bindChange(['drops-factor'], dropsUpdate)
}

// ── mcg/kg/min ↔ mL/h ────────
if (document.getElementById('vaso-dose')) {
  var vasoUpdate = function () {
    var r = mcgKgMinToMlPerHour({ doseMcgKgMin: num('vaso-dose'), weightKg: num('vaso-weight'), concentrationMcgPerMl: num('vaso-conc') })
    setText('vaso-mlh', r !== null ? r + ' mL/h' : '—')
  }
  bind(['vaso-dose','vaso-weight','vaso-conc'], vasoUpdate)
}

// ── Opioid Conversion ────────
if (document.getElementById('opi-from')) {
  var opiUpdate = function () {
    var r = opioidConversion({ from: val('opi-from'), to: val('opi-to'), dose: num('opi-dose') })
    setText('opi-value', r !== null ? r + ' mg' : '—')
  }
  bindChange(['opi-from','opi-to'], opiUpdate)
  bind(['opi-dose'], opiUpdate)
}

// ── Benzo conversion ────────
if (document.getElementById('bz-from')) {
  var bzUpdate = function () {
    var r = benzodiazepineConversion({ from: val('bz-from'), to: val('bz-to'), dose: num('bz-dose') })
    setText('bz-value', r !== null ? r + ' mg' : '—')
  }
  bindChange(['bz-from','bz-to'], bzUpdate)
  bind(['bz-dose'], bzUpdate)
}

// ── Cortico conversion ────────
if (document.getElementById('ct-from')) {
  var ctUpdate = function () {
    var r = corticosteroidConversion({ from: val('ct-from'), to: val('ct-to'), dose: num('ct-dose') })
    setText('ct-value', r !== null ? r + ' mg' : '—')
  }
  bindChange(['ct-from','ct-to'], ctUpdate)
  bind(['ct-dose'], ctUpdate)
}

// ── RSI Doses ────────
if (document.getElementById('rsi-weight')) {
  var rsiUpdate = function () {
    var r = rsiDoses(num('rsi-weight'))
    if (!r) { ['etomidate','ketamine','propofol','midazolam','succinylcholine','rocuronium','fentanyl','lidocaine'].forEach(function(k){ setText('rsi-'+k,'—') }); return }
    Object.keys(r).forEach(function(k){ setText('rsi-'+k, r[k] + (k === 'fentanyl' ? ' mcg' : ' mg')) })
  }
  bind(['rsi-weight'], rsiUpdate)
}

// ── Phenytoin Corrected ────────
if (document.getElementById('phen-level')) {
  var phenUpdate = function () {
    var r = phenytoinCorrected({ level: num('phen-level'), albumin: num('phen-alb'), esrd: checked('phen-esrd') })
    setText('phen-value', r !== null ? r + ' mcg/mL' : '—')
  }
  bind(['phen-level','phen-alb'], phenUpdate)
  var esrd = document.getElementById('phen-esrd')
  if (esrd) esrd.addEventListener('change', phenUpdate)
}

// Generic copy
document.querySelectorAll('.copy-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var el = document.getElementById(btn.getAttribute('data-target'))
    if (!el || el.textContent === '—') return
    navigator.clipboard.writeText(el.textContent).then(function () {
      var o = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(function () { btn.textContent = o }, 2000)
    })
  })
})
