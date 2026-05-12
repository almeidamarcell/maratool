// Shared UI hooks for all Renal calculators on individual pages.
// Each page binds a subset of these via DOM element presence.
import {
  mdrd,
  fractionalExcretionSodium,
  fractionalExcretionUrea,
  urineProteinCreatinineRatio,
  bicarbonateDeficit,
} from './renal.js'
import { classifyGFR } from './cockcroft-gault.js'

function num(id) {
  var el = document.getElementById(id)
  if (!el || el.value === '') return NaN
  return parseFloat(el.value)
}
function setText(id, text) {
  var el = document.getElementById(id)
  if (el) el.textContent = text
}
function setClass(id, cls) {
  var el = document.getElementById(id)
  if (el) el.className = 'hcalc-output-value' + (cls ? ' ' + cls : '')
}

// MDRD
if (document.getElementById('mdrd-age')) {
  var mdrdUpdate = function () {
    var age = num('mdrd-age'), cr = num('mdrd-cr')
    var sex = document.getElementById('mdrd-sex').value
    if (isNaN(age) || isNaN(cr)) { setText('mdrd-value', '—'); setText('mdrd-class', '—'); return }
    var r = mdrd({ age: age, sex: sex, creatinineMgDl: cr })
    setText('mdrd-value', r !== null ? r + ' mL/min/1.73m²' : '—')
    var c = classifyGFR(r)
    setText('mdrd-class', c || '—')
    setClass('mdrd-class', c && (c.startsWith('G1') || c.startsWith('G2')) ? 'cls-normal' : c && c.startsWith('G3') ? 'cls-warn' : c ? 'cls-danger' : '')
  }
  ;['mdrd-age', 'mdrd-cr'].forEach(function (id) { document.getElementById(id).addEventListener('input', mdrdUpdate) })
  document.getElementById('mdrd-sex').addEventListener('change', mdrdUpdate)
}

// FENa
if (document.getElementById('fena-una')) {
  var fenaUpdate = function () {
    var r = fractionalExcretionSodium({
      uNa: num('fena-una'), pCr: num('fena-pcr'),
      pNa: num('fena-pna'), uCr: num('fena-ucr'),
    })
    if (r === null || isNaN(num('fena-una'))) { setText('fena-value', '—'); setText('fena-class', '—'); return }
    setText('fena-value', r + ' %')
    var c = r < 1 ? 'Prerenal (likely)' : r > 2 ? 'Intrinsic AKI (likely)' : 'Indeterminate'
    setText('fena-class', c)
    setClass('fena-class', c === 'Prerenal (likely)' ? 'cls-warn' : c === 'Intrinsic AKI (likely)' ? 'cls-danger' : '')
  }
  ;['fena-una', 'fena-pcr', 'fena-pna', 'fena-ucr'].forEach(function (id) { document.getElementById(id).addEventListener('input', fenaUpdate) })
}

// FEUrea
if (document.getElementById('feu-uurea')) {
  var feuUpdate = function () {
    var r = fractionalExcretionUrea({
      uUrea: num('feu-uurea'), pCr: num('feu-pcr'),
      pUrea: num('feu-purea'), uCr: num('feu-ucr'),
    })
    if (r === null || isNaN(num('feu-uurea'))) { setText('feu-value', '—'); setText('feu-class', '—'); return }
    setText('feu-value', r + ' %')
    var c = r < 35 ? 'Prerenal (likely)' : r > 50 ? 'Intrinsic AKI (likely)' : 'Indeterminate'
    setText('feu-class', c)
    setClass('feu-class', c === 'Prerenal (likely)' ? 'cls-warn' : c === 'Intrinsic AKI (likely)' ? 'cls-danger' : '')
  }
  ;['feu-uurea', 'feu-pcr', 'feu-purea', 'feu-ucr'].forEach(function (id) { document.getElementById(id).addEventListener('input', feuUpdate) })
}

// UPCR
if (document.getElementById('upcr-protein')) {
  var upcrUpdate = function () {
    var r = urineProteinCreatinineRatio({
      proteinMgDl: num('upcr-protein'), creatinineMgDl: num('upcr-cr'),
    })
    if (r === null || isNaN(num('upcr-protein'))) { setText('upcr-value', '—'); setText('upcr-class', '—'); return }
    setText('upcr-value', r + ' (g/g, approx. g/day)')
    var c = r < 0.15 ? 'Normal' : r < 0.5 ? 'Mild proteinuria' : r < 3.5 ? 'Moderate proteinuria' : 'Nephrotic range'
    setText('upcr-class', c)
    setClass('upcr-class', c === 'Normal' ? 'cls-normal' : c === 'Nephrotic range' ? 'cls-danger' : 'cls-warn')
  }
  ;['upcr-protein', 'upcr-cr'].forEach(function (id) { document.getElementById(id).addEventListener('input', upcrUpdate) })
}

// HCO3 deficit
if (document.getElementById('hco3-weight')) {
  var hco3Update = function () {
    var r = bicarbonateDeficit({
      weightKg: num('hco3-weight'), currentHCO3: num('hco3-current'), targetHCO3: num('hco3-target'),
    })
    if (r === null || isNaN(num('hco3-weight'))) { setText('hco3-value', '—'); return }
    setText('hco3-value', r + ' mEq')
  }
  ;['hco3-weight', 'hco3-current', 'hco3-target'].forEach(function (id) { document.getElementById(id).addEventListener('input', hco3Update) })
}

// Copy buttons (generic)
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
