import { calculateMAP, classifyMAP } from './map.js'

;(function () {
  var sbpInput = document.getElementById('map-sbp')
  var dbpInput = document.getElementById('map-dbp')
  var mapOut = document.getElementById('map-value')
  var classOut = document.getElementById('map-class')

  function update() {
    var sbp = parseFloat(sbpInput.value)
    var dbp = parseFloat(dbpInput.value)
    if (!sbp || !dbp) {
      mapOut.textContent = '—'
      classOut.textContent = '—'
      classOut.className = 'hcalc-output-value'
      return
    }
    var map = calculateMAP(sbp, dbp)
    var cls = classifyMAP(map)
    mapOut.textContent = map !== null ? map + ' mmHg' : '—'
    classOut.textContent = cls || '—'
    classOut.className = 'hcalc-output-value'
    if (cls && cls.startsWith('Hypotension')) classOut.classList.add('cls-warn')
    else if (cls === 'Adequate perfusion') classOut.classList.add('cls-normal')
    else if (cls === 'Elevated') classOut.classList.add('cls-warn')
  }
  sbpInput.addEventListener('input', update)
  dbpInput.addEventListener('input', update)

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
