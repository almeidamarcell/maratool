import { isoWeek } from './date-tools-core.js'

;(function () {
  var date = document.getElementById('wn-date')
  var week = document.getElementById('wn-week')
  var label = document.getElementById('wn-label')
  var start = document.getElementById('wn-start')
  var end = document.getElementById('wn-end')

  date.value = new Date().toISOString().slice(0, 10)

  function update() {
    var r = isoWeek(new Date(date.value))
    week.textContent = r.week
    label.textContent = r.label
    start.textContent = r.weekStart
    end.textContent = r.weekEnd
  }
  date.addEventListener('input', update)
  date.addEventListener('change', update)
  update()
})()
