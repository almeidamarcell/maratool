import {
  apgarScore, classifyApgar,
  ettSizeUncuffed, ettSizeCuffed, ettInsertionDepth,
  pediatricInfusionMcgKgMin, pediatricInfusionMgKgHour,
  gestationalAgeFromCRL,
} from './pediatric.js'

function num(id) { var el = document.getElementById(id); if (!el || el.value === '') return NaN; return parseFloat(el.value) }
function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t }
function setClass(id, c) { var el = document.getElementById(id); if (el) el.className = 'hcalc-output-value' + (c ? ' ' + c : '') }

// APGAR
if (document.getElementById('apgar-appearance')) {
  function apgarUpdate() {
    var items = {
      appearance: parseInt(document.getElementById('apgar-appearance').value, 10),
      pulse: parseInt(document.getElementById('apgar-pulse').value, 10),
      grimace: parseInt(document.getElementById('apgar-grimace').value, 10),
      activity: parseInt(document.getElementById('apgar-activity').value, 10),
      respiration: parseInt(document.getElementById('apgar-respiration').value, 10),
    }
    var score = apgarScore(items)
    setText('apgar-value', score !== null ? score + ' / 10' : '—')
    var c = classifyApgar(score)
    setText('apgar-class', c || '—')
    setClass('apgar-class', c === 'Reassuring' ? 'cls-normal' : c === 'Moderately depressed' ? 'cls-warn' : c === 'Severely depressed' ? 'cls-danger' : '')
  }
  ['apgar-appearance','apgar-pulse','apgar-grimace','apgar-activity','apgar-respiration'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', apgarUpdate)
  })
}

// ETT
if (document.getElementById('ett-age')) {
  function ettUpdate() {
    var age = num('ett-age')
    if (isNaN(age) || age < 1) {
      ['ett-uncuffed','ett-cuffed','ett-depth-u','ett-depth-c'].forEach(function (id) { setText(id, '—') })
      return
    }
    var u = ettSizeUncuffed(age), c = ettSizeCuffed(age)
    setText('ett-uncuffed', u + ' mm')
    setText('ett-cuffed', c + ' mm')
    setText('ett-depth-u', ettInsertionDepth(u) + ' cm')
    setText('ett-depth-c', ettInsertionDepth(c) + ' cm')
  }
  document.getElementById('ett-age').addEventListener('input', ettUpdate)
}

// Pediatric Infusion mcg/kg/min
if (document.getElementById('pinf-dose')) {
  function pinfUpdate() {
    var r = pediatricInfusionMcgKgMin({
      doseMcgKgMin: num('pinf-dose'), weightKg: num('pinf-weight'),
      concentrationMcgPerMl: num('pinf-conc'),
    })
    setText('pinf-rate', r !== null ? r + ' mL/h' : '—')
  }
  ['pinf-dose','pinf-weight','pinf-conc'].forEach(function (id) { document.getElementById(id).addEventListener('input', pinfUpdate) })
}

// Pediatric Infusion mg/kg/hour
if (document.getElementById('pinfh-dose')) {
  function pinfhUpdate() {
    var r = pediatricInfusionMgKgHour({
      doseMgKgHour: num('pinfh-dose'), weightKg: num('pinfh-weight'),
      concentrationMgPerMl: num('pinfh-conc'),
    })
    setText('pinfh-rate', r !== null ? r + ' mL/h' : '—')
  }
  ['pinfh-dose','pinfh-weight','pinfh-conc'].forEach(function (id) { document.getElementById(id).addEventListener('input', pinfhUpdate) })
}

// Gestational Age by USG (CRL)
if (document.getElementById('gausg-crl')) {
  function gausgUpdate() {
    var r = gestationalAgeFromCRL(num('gausg-crl'))
    if (!r) { setText('gausg-value', '—'); return }
    setText('gausg-value', r.weeks + 'w ' + r.days + 'd (' + r.totalDays + ' days)')
  }
  document.getElementById('gausg-crl').addEventListener('input', gausgUpdate)
}

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
