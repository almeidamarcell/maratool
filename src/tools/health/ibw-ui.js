import { idealBodyWeight } from './ibw.js'

;(function () {
  var heightInput = document.getElementById('ibw-height')
  var sexInput = document.getElementById('ibw-sex')
  var outs = {
    devine: document.getElementById('ibw-devine'),
    robinson: document.getElementById('ibw-robinson'),
    miller: document.getElementById('ibw-miller'),
    hamwi: document.getElementById('ibw-hamwi'),
  }
  function update() {
    var h = parseFloat(heightInput.value)
    var sex = sexInput.value
    var r = idealBodyWeight(h, sex)
    Object.keys(outs).forEach(function (k) {
      outs[k].textContent = r[k] !== null ? r[k].toFixed(1) + ' kg' : '—'
    })
  }
  heightInput.addEventListener('input', update)
  sexInput.addEventListener('change', update)

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
