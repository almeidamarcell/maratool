import { calcFinalGradeNeeded } from './education-final-grade-core.js'

;(function () {
  var current = document.getElementById('fg-current')
  var desired = document.getElementById('fg-desired')
  var weight = document.getElementById('fg-weight')
  var needed = document.getElementById('fg-needed')
  var possible = document.getElementById('fg-possible')

  function update() {
    var r = calcFinalGradeNeeded({
      currentPercent: current.value,
      desiredPercent: desired.value,
      finalWeight: weight.value,
    })
    if (r.error) {
      needed.textContent = '—'
      possible.textContent = r.error
      return
    }
    needed.textContent = r.neededPercent.toFixed(1) + '%'
    possible.textContent = r.possible ? 'Achievable' : 'Not achievable (need >100%)'
  }

  ;[current, desired, weight].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
