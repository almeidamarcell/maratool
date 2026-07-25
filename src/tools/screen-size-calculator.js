(function () {
  var diag = document.getElementById('ssc-diag')
  var ratio = document.getElementById('ssc-ratio')
  var rw = document.getElementById('ssc-rw')
  var rh = document.getElementById('ssc-rh')
  var widthEl = document.getElementById('ssc-width')
  var heightEl = document.getElementById('ssc-height')
  var areaEl = document.getElementById('ssc-area')
  var ppiEl = document.getElementById('ssc-ppi')
  var cmEl = document.getElementById('ssc-cm')

  var CM_IN = 2.54

  function f1(x) { return parseFloat(x.toFixed(1)).toString() }

  function update() {
    var d = parseFloat(diag.value)
    if (isNaN(d) || d <= 0) {
      widthEl.textContent = heightEl.textContent = areaEl.textContent = ppiEl.textContent = '—'
      cmEl.textContent = ''
      return
    }
    var parts = ratio.value.split(':')
    var w = Number(parts[0])
    var h = Number(parts[1])
    // Pythagorean theorem: width = diag · w/√(w²+h²)
    var hyp = Math.sqrt(w * w + h * h)
    var wIn = d * w / hyp
    var hIn = d * h / hyp
    var area = wIn * hIn

    widthEl.textContent = f1(wIn) + '″'
    heightEl.textContent = f1(hIn) + '″'
    areaEl.textContent = Math.round(area) + ' in²'

    var pw = parseInt(rw.value, 10)
    var ph = parseInt(rh.value, 10)
    if (pw > 0 && ph > 0) {
      var ppi = Math.sqrt(pw * pw + ph * ph) / d
      ppiEl.textContent = f1(ppi)
    } else {
      ppiEl.textContent = '—'
    }

    cmEl.textContent = f1(wIn * CM_IN) + ' × ' + f1(hIn * CM_IN) + ' cm — area ' +
      Math.round(area * CM_IN * CM_IN).toLocaleString('en-US') + ' cm²'
  }

  ;[diag, rw, rh].forEach(function (el) { el.addEventListener('input', update) })
  ratio.addEventListener('change', update)
})()
