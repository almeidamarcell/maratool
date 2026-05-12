// Shared UI hooks for General health calculators.
import {
  qtcBazett, qtcFridericia, qtcFramingham, qtcHodges, classifyQtc,
  friedewaldLdl, parklandFluid, hba1cToEag,
  saag, classifySaag, transferrinSaturation, bloodVolumeNadler,
} from './general.js'

function num(id) { var el = document.getElementById(id); if (!el || el.value === '') return NaN; return parseFloat(el.value) }
function val(id) { var el = document.getElementById(id); return el ? el.value : '' }
function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t }
function setClass(id, c) { var el = document.getElementById(id); if (el) el.className = 'hcalc-output-value' + (c ? ' ' + c : '') }

// QTc
if (document.getElementById('qtc-qt')) {
  function qtcUpdate() {
    var qt = num('qtc-qt'), hr = num('qtc-hr'), sex = val('qtc-sex')
    if (isNaN(qt) || isNaN(hr)) {
      ['qtc-bazett','qtc-fridericia','qtc-framingham','qtc-hodges','qtc-class'].forEach(function(id){ setText(id,'—') })
      return
    }
    var b = qtcBazett({ qtMs: qt, hr: hr }), f = qtcFridericia({ qtMs: qt, hr: hr })
    var fr = qtcFramingham({ qtMs: qt, hr: hr }), h = qtcHodges({ qtMs: qt, hr: hr })
    setText('qtc-bazett', b !== null ? b + ' ms' : '—')
    setText('qtc-fridericia', f !== null ? f + ' ms' : '—')
    setText('qtc-framingham', fr !== null ? fr + ' ms' : '—')
    setText('qtc-hodges', h !== null ? h + ' ms' : '—')
    var cls = classifyQtc(b, sex)
    setText('qtc-class', cls || '—')
    setClass('qtc-class', cls === 'Normal' ? 'cls-normal' : cls === 'Short' ? 'cls-warn' : cls === 'Borderline prolonged' ? 'cls-warn' : cls === 'Prolonged' ? 'cls-danger' : '')
  }
  ['qtc-qt','qtc-hr'].forEach(function(id){ document.getElementById(id).addEventListener('input', qtcUpdate) })
  document.getElementById('qtc-sex').addEventListener('change', qtcUpdate)
}

// Friedewald
if (document.getElementById('fw-tc')) {
  function fwUpdate() {
    var r = friedewaldLdl({ totalChol: num('fw-tc'), hdl: num('fw-hdl'), triglycerides: num('fw-tg') })
    if (r === null) {
      var tg = num('fw-tg')
      if (!isNaN(tg) && tg > 400) {
        setText('fw-value', 'TG > 400: formula invalid')
        setClass('fw-value', 'cls-warn')
      } else {
        setText('fw-value', '—')
        setClass('fw-value', '')
      }
      return
    }
    setText('fw-value', r + ' mg/dL')
    setClass('fw-value', '')
  }
  ['fw-tc','fw-hdl','fw-tg'].forEach(function(id){ document.getElementById(id).addEventListener('input', fwUpdate) })
}

// Parkland
if (document.getElementById('pk-weight')) {
  function pkUpdate() {
    var r = parklandFluid({ weightKg: num('pk-weight'), tbsaPercent: num('pk-tbsa') })
    if (!r) { ['pk-total','pk-8h','pk-rate1','pk-rate2'].forEach(function(id){ setText(id,'—') }); return }
    setText('pk-total', r.totalMl + ' mL')
    setText('pk-8h', r.first8hMl + ' mL')
    setText('pk-rate1', r.first8hRatePerHour + ' mL/h')
    setText('pk-rate2', r.next16hRatePerHour + ' mL/h')
  }
  ['pk-weight','pk-tbsa'].forEach(function(id){ document.getElementById(id).addEventListener('input', pkUpdate) })
}

// eAG
if (document.getElementById('eag-hba1c')) {
  function eagUpdate() {
    var r = hba1cToEag(num('eag-hba1c'))
    if (!r) { setText('eag-mgdl','—'); setText('eag-mmoll','—'); return }
    setText('eag-mgdl', r.mgDl + ' mg/dL')
    setText('eag-mmoll', r.mmolL + ' mmol/L')
  }
  document.getElementById('eag-hba1c').addEventListener('input', eagUpdate)
}

// SAAG
if (document.getElementById('saag-serum')) {
  function saagUpdate() {
    var r = saag({ serumAlb: num('saag-serum'), asciticAlb: num('saag-ascitic') })
    if (r === null) { setText('saag-value','—'); setText('saag-class','—'); return }
    setText('saag-value', r + ' g/dL')
    var c = classifySaag(r); setText('saag-class', c || '—')
    setClass('saag-class', c && c.startsWith('Portal') ? 'cls-warn' : '')
  }
  ['saag-serum','saag-ascitic'].forEach(function(id){ document.getElementById(id).addEventListener('input', saagUpdate) })
}

// TSAT
if (document.getElementById('tsat-iron')) {
  function tsatUpdate() {
    var r = transferrinSaturation({ serumIron: num('tsat-iron'), tibc: num('tsat-tibc') })
    if (r === null) { setText('tsat-value','—'); setText('tsat-class','—'); return }
    setText('tsat-value', r + ' %')
    var c = r < 20 ? 'Iron deficiency (likely)' : r > 45 ? 'Iron overload (likely)' : 'Normal'
    setText('tsat-class', c)
    setClass('tsat-class', c === 'Normal' ? 'cls-normal' : 'cls-warn')
  }
  ['tsat-iron','tsat-tibc'].forEach(function(id){ document.getElementById(id).addEventListener('input', tsatUpdate) })
}

// Blood Volume (Nadler)
if (document.getElementById('bv-weight')) {
  function bvUpdate() {
    var r = bloodVolumeNadler({ weightKg: num('bv-weight'), heightCm: num('bv-height'), sex: val('bv-sex') })
    if (r === null) { setText('bv-value','—'); return }
    setText('bv-value', r + ' mL (' + (r/1000).toFixed(2) + ' L)')
  }
  ['bv-weight','bv-height'].forEach(function(id){ document.getElementById(id).addEventListener('input', bvUpdate) })
  document.getElementById('bv-sex').addEventListener('change', bvUpdate)
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
