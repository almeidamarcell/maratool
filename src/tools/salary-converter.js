import { salaryConvert, formatMoney } from './business-calc-core.js'

;(function () {
  var annual = document.getElementById('sc-annual')
  var hours = document.getElementById('sc-hours')
  var weeks = document.getElementById('sc-weeks')
  var fields = {
    monthly: document.getElementById('sc-monthly'),
    biweekly: document.getElementById('sc-biweekly'),
    weekly: document.getElementById('sc-weekly'),
    daily: document.getElementById('sc-daily'),
    hourly: document.getElementById('sc-hourly'),
  }

  function update() {
    var a = parseFloat(annual.value) || 0
    var h = parseFloat(hours.value) || 40
    var w = parseFloat(weeks.value) || 52
    if (a <= 0) {
      Object.values(fields).forEach(function (el) { el.textContent = '—' })
      return
    }
    var result = salaryConvert(a, h, w)
    fields.monthly.textContent = formatMoney(result.monthly)
    fields.biweekly.textContent = formatMoney(result.biweekly)
    fields.weekly.textContent = formatMoney(result.weekly)
    fields.daily.textContent = formatMoney(result.daily)
    fields.hourly.textContent = formatMoney(result.hourly)
  }

  ;[annual, hours, weeks].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
