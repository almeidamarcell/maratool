// TDEE calculator — Mifflin-St Jeor BMR × activity multiplier, plus the
// deficit/surplus table people actually come for.
//
// The safe-intake floor (1200 kcal/day for women, 1500 for men) is enforced as
// a visible flag rather than by clamping the number: hiding the target would
// leave people wondering why the arithmetic did not match, and the point is to
// say out loud that the row needs medical supervision.
import { copyWithFeedback, setVisible } from './tool-utils.js'

;(function () {
  var unitsSel = document.getElementById('tdee-units')
  if (!unitsSel) return

  var sexSel = document.getElementById('tdee-sex')
  var ageInput = document.getElementById('tdee-age')
  var metricBox = document.getElementById('tdee-height-metric')
  var imperialBox = document.getElementById('tdee-height-imperial')
  var heightCm = document.getElementById('tdee-height-cm')
  var heightFt = document.getElementById('tdee-height-ft')
  var heightIn = document.getElementById('tdee-height-in')
  var weightInput = document.getElementById('tdee-weight')
  var weightLabel = document.getElementById('tdee-weight-label')
  var activitySel = document.getElementById('tdee-activity')

  var mainOut = document.getElementById('tdee-main')
  var bmrOut = document.getElementById('tdee-bmr')
  var multOut = document.getElementById('tdee-mult')
  var copyBtn = document.getElementById('tdee-copy')
  var warningBox = document.getElementById('tdee-warning')

  var goalSel = document.getElementById('tdee-goal')
  var splitSel = document.getElementById('tdee-split')
  var macroCalOut = document.getElementById('tdee-macro-cal')
  var proteinOut = document.getElementById('tdee-protein')
  var carbsOut = document.getElementById('tdee-carbs')
  var fatOut = document.getElementById('tdee-fat')

  var rows = Array.prototype.slice.call(
    document.querySelectorAll('#tdee-targets tbody tr')
  )

  var LB_TO_KG = 0.45359237 // exact, NIST SP 811
  var IN_TO_CM = 2.54       // exact

  // Below these, hitting protein and micronutrient targets stops being
  // realistic without supervision. Widely used clinical rule of thumb.
  var FLOOR = { female: 1200, male: 1500 }

  var summary = ''

  function num(el) {
    if (!el || el.value === '') return NaN
    return parseFloat(el.value)
  }

  function kcal(v) {
    return Math.round(v).toLocaleString('en-US') + ' kcal'
  }

  // Mifflin MD, St Jeor ST, et al. Am J Clin Nutr. 1990;51(2):241-247.
  function mifflinStJeor(kg, cm, age, sex) {
    return 10 * kg + 6.25 * cm - 5 * age + (sex === 'male' ? 5 : -161)
  }

  function syncUnits() {
    var imperial = unitsSel.value === 'imperial'
    setVisible(metricBox, !imperial)
    setVisible(imperialBox, imperial)
    weightLabel.textContent = imperial ? 'Weight (lb)' : 'Weight (kg)'
    weightInput.placeholder = imperial ? '154' : '70'
  }

  function heightInCm() {
    if (unitsSel.value !== 'imperial') return num(heightCm)
    var ft = num(heightFt)
    var inch = num(heightIn)
    if (isNaN(ft) && isNaN(inch)) return NaN
    return ((isNaN(ft) ? 0 : ft) * 12 + (isNaN(inch) ? 0 : inch)) * IN_TO_CM
  }

  function blank() {
    mainOut.textContent = '—'
    bmrOut.textContent = '—'
    rows.forEach(function (row) {
      row.querySelector('.calc-cell').textContent = '—'
      row.classList.remove('calc-row-warn')
    })
    setVisible(warningBox, false)
    macroCalOut.textContent = '—'
    proteinOut.textContent = '—'
    carbsOut.textContent = '—'
    fatOut.textContent = '—'
    summary = ''
  }

  function updateMacros(tdee) {
    if (!isFinite(tdee) || tdee <= 0) return
    var target = tdee + parseFloat(goalSel.value)
    var parts = splitSel.value.split('-').map(Number)
    var proteinPct = parts[0] / 100
    var carbPct = parts[1] / 100
    var fatPct = parts[2] / 100

    macroCalOut.textContent = Math.round(target).toLocaleString('en-US')
    proteinOut.textContent = Math.round((target * proteinPct) / 4) + ' g'
    carbsOut.textContent = Math.round((target * carbPct) / 4) + ' g'
    fatOut.textContent = Math.round((target * fatPct) / 9) + ' g'
  }

  function update() {
    var sex = sexSel.value
    var age = num(ageInput)
    var cm = heightInCm()
    var weight = num(weightInput)
    var kg = unitsSel.value === 'imperial' ? weight * LB_TO_KG : weight
    var multiplier = parseFloat(activitySel.value)

    multOut.textContent = String(multiplier)

    if (isNaN(age) || age <= 0 || isNaN(cm) || cm <= 0 || isNaN(kg) || kg <= 0) {
      blank()
      return
    }

    var bmr = mifflinStJeor(kg, cm, age, sex)
    var tdee = bmr * multiplier
    var floor = FLOOR[sex] || FLOOR.male

    mainOut.textContent = Math.round(tdee).toLocaleString('en-US')
    bmrOut.textContent = kcal(bmr)

    var anyBelowFloor = false
    rows.forEach(function (row) {
      var delta = parseFloat(row.getAttribute('data-delta'))
      var target = tdee + delta
      var below = target < floor
      if (below) anyBelowFloor = true
      row.querySelector('.calc-cell').textContent = kcal(target)
      row.classList.toggle('calc-row-warn', below)
    })
    setVisible(warningBox, anyBelowFloor)

    updateMacros(tdee)

    summary = 'TDEE: ' + kcal(tdee) + '/day (BMR ' + kcal(bmr) + ' × ' + multiplier + ')' +
      ' • Weight loss ' + kcal(tdee - 500) + '/day • Weight gain ' + kcal(tdee + 500) + '/day'
  }

  unitsSel.addEventListener('change', function () { syncUnits(); update() })
  ;[sexSel, activitySel, goalSel, splitSel].forEach(function (el) {
    el.addEventListener('change', update)
  })
  ;[ageInput, heightCm, heightFt, heightIn, weightInput].forEach(function (el) {
    el.addEventListener('input', update)
  })

  copyBtn.addEventListener('click', function () {
    if (!summary) return
    copyWithFeedback(copyBtn, summary)
  })

  syncUnits()
  update()
})()
