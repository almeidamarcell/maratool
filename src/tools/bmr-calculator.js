// BMR calculator — Mifflin-St Jeor (headline), revised Harris-Benedict
// (Roza & Shizgal 1984) and Katch-McArdle for comparison.
//
// The three equations exist on the same page on purpose: "why does every
// calculator give me a different BMR" is the question people actually arrive
// with, and the answer is only visible when you can see the spread.
import { copyWithFeedback, setVisible } from './tool-utils.js'

;(function () {
  var unitsSel = document.getElementById('bmr-units')
  if (!unitsSel) return

  var sexSel = document.getElementById('bmr-sex')
  var ageInput = document.getElementById('bmr-age')
  var metricBox = document.getElementById('bmr-height-metric')
  var imperialBox = document.getElementById('bmr-height-imperial')
  var heightCm = document.getElementById('bmr-height-cm')
  var heightFt = document.getElementById('bmr-height-ft')
  var heightIn = document.getElementById('bmr-height-in')
  var weightInput = document.getElementById('bmr-weight')
  var weightLabel = document.getElementById('bmr-weight-label')
  var bodyFatInput = document.getElementById('bmr-bodyfat')

  var mainOut = document.getElementById('bmr-main')
  var mifflinOut = document.getElementById('bmr-mifflin')
  var harrisOut = document.getElementById('bmr-harris')
  var katchOut = document.getElementById('bmr-katch')
  var katchRow = document.getElementById('bmr-katch-row')
  var katchNote = document.getElementById('bmr-katch-note')
  var lbmOut = document.getElementById('bmr-lbm')
  var copyBtn = document.getElementById('bmr-copy')

  var LB_TO_KG = 0.45359237 // exact, NIST SP 811
  var IN_TO_CM = 2.54       // exact

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

  // Roza AM, Shizgal HM. Am J Clin Nutr. 1984;40(1):168-182.
  function harrisBenedict(kg, cm, age, sex) {
    return sex === 'male'
      ? 88.362 + 13.397 * kg + 4.799 * cm - 5.677 * age
      : 447.593 + 9.247 * kg + 3.098 * cm - 4.330 * age
  }

  // Katch & McArdle — lean body mass only, no sex or age term.
  function katchMcArdle(lbmKg) {
    return 370 + 21.6 * lbmKg
  }

  function syncUnits() {
    var imperial = unitsSel.value === 'imperial'
    setVisible(metricBox, !imperial)
    setVisible(imperialBox, imperial)
    weightLabel.textContent = imperial ? 'Weight (lb)' : 'Weight (kg)'
    weightInput.placeholder = imperial ? '154' : '70'
  }

  function blank() {
    mainOut.textContent = '—'
    mifflinOut.textContent = '—'
    harrisOut.textContent = '—'
    katchOut.textContent = '—'
    lbmOut.textContent = '—'
    summary = ''
  }

  function update() {
    var imperial = unitsSel.value === 'imperial'
    var sex = sexSel.value
    var age = num(ageInput)

    var cm
    if (imperial) {
      var ft = num(heightFt)
      var inch = num(heightIn)
      if (isNaN(ft) && isNaN(inch)) cm = NaN
      else cm = ((isNaN(ft) ? 0 : ft) * 12 + (isNaN(inch) ? 0 : inch)) * IN_TO_CM
    } else {
      cm = num(heightCm)
    }

    var weight = num(weightInput)
    var kg = imperial ? weight * LB_TO_KG : weight

    var bodyFat = num(bodyFatInput)
    var hasBodyFat = !isNaN(bodyFat) && bodyFat > 0 && bodyFat < 70

    setVisible(katchRow, hasBodyFat)
    setVisible(katchNote, !hasBodyFat)

    if (isNaN(age) || age <= 0 || isNaN(cm) || cm <= 0 || isNaN(kg) || kg <= 0) {
      blank()
      return
    }

    var mifflin = mifflinStJeor(kg, cm, age, sex)
    var harris = harrisBenedict(kg, cm, age, sex)

    mainOut.textContent = Math.round(mifflin).toLocaleString('en-US')
    mifflinOut.textContent = kcal(mifflin)
    harrisOut.textContent = kcal(harris)

    summary = 'BMR (Mifflin-St Jeor): ' + kcal(mifflin) + '/day • Harris-Benedict 1984: ' + kcal(harris) + '/day'

    if (hasBodyFat) {
      var lbm = kg * (1 - bodyFat / 100)
      var katch = katchMcArdle(lbm)
      katchOut.textContent = kcal(katch)
      lbmOut.textContent = lbm.toFixed(1) + ' kg'
      summary += ' • Katch-McArdle: ' + kcal(katch) + '/day'
    } else {
      katchOut.textContent = '—'
      lbmOut.textContent = '—'
    }
  }

  unitsSel.addEventListener('change', function () { syncUnits(); update() })
  sexSel.addEventListener('change', update)
  ;[ageInput, heightCm, heightFt, heightIn, weightInput, bodyFatInput].forEach(function (el) {
    el.addEventListener('input', update)
  })

  copyBtn.addEventListener('click', function () {
    if (!summary) return
    copyWithFeedback(copyBtn, summary)
  })

  syncUnits()
  update()
})()
