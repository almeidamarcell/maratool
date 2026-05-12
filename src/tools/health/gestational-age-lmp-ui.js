import { gestationalAgeFromLMP } from './gestational-age-lmp.js'

;(function () {
  var lmpIn = document.getElementById('ga-lmp')
  var refIn = document.getElementById('ga-ref')
  var gaOut = document.getElementById('ga-value')
  var eddOut = document.getElementById('ga-edd')

  // Default reference date = today.
  var today = new Date()
  var todayISO = today.toISOString().slice(0, 10)
  refIn.value = todayISO

  function update() {
    var r = gestationalAgeFromLMP({ lmp: lmpIn.value, reference: refIn.value })
    if (!r) {
      gaOut.textContent = '—'
      eddOut.textContent = '—'
      return
    }
    gaOut.textContent = r.weeks + 'w ' + r.days + 'd (' + r.totalDays + ' days)'
    eddOut.textContent = r.edd
  }
  lmpIn.addEventListener('change', update)
  refIn.addEventListener('change', update)
  lmpIn.addEventListener('input', update)
  refIn.addEventListener('input', update)

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
})()
