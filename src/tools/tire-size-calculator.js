(function () {
  var inputA = document.getElementById('tsc-a')
  var inputB = document.getElementById('tsc-b')
  var outA = document.getElementById('tsc-out-a')
  var outB = document.getElementById('tsc-out-b')
  var cmp = document.getElementById('tsc-cmp')
  var diffEl = document.getElementById('tsc-diff')
  var speedoEl = document.getElementById('tsc-speedo')
  var msgEl = document.getElementById('tsc-msg')

  var MM_IN = 25.4

  // Metric tire designation per ISO 4000-1 / ETRTO: width(mm)/aspect(%) R rim(in)
  function parse(str) {
    var m = /^\s*(\d{3})\s*\/\s*(\d{2,3})\s*[Rr]?\s*(\d{2}(?:\.\d)?)\s*$/.exec(str)
    if (!m) return null
    var width = Number(m[1])
    var aspect = Number(m[2])
    var rim = Number(m[3])
    if (aspect < 20 || aspect > 95) return null
    var sidewall = width * aspect / 100
    var diameter = rim * MM_IN + 2 * sidewall
    var circumference = Math.PI * diameter
    return {
      width: width,
      sidewall: sidewall,
      diameter: diameter,
      circumference: circumference,
      revsPerKm: 1e6 / circumference,
    }
  }

  function f1(x) { return parseFloat(x.toFixed(1)).toString() }

  function fill(prefix, t) {
    document.getElementById(prefix + '-width').textContent = t.width + ' mm'
    document.getElementById(prefix + '-side').textContent = f1(t.sidewall) + ' mm'
    document.getElementById(prefix + '-diam').textContent = f1(t.diameter) + ' mm (' + f1(t.diameter / MM_IN) + '″)'
    document.getElementById(prefix + '-circ').textContent = f1(t.circumference / 10) + ' cm'
    document.getElementById(prefix + '-revs').textContent = Math.round(t.revsPerKm).toString()
  }

  function update() {
    var a = inputA.value.trim() ? parse(inputA.value) : null
    var b = inputB.value.trim() ? parse(inputB.value) : null

    outA.hidden = !a
    outB.hidden = !b
    cmp.hidden = !(a && b)

    if (a) fill('tsc-a', a)
    if (b) fill('tsc-b', b)

    if (a && b) {
      var diff = (b.diameter - a.diameter) / a.diameter * 100
      var sign = diff >= 0 ? '+' : ''
      diffEl.textContent = sign + diff.toFixed(2) + '%'
      // Speedometer counts revolutions calibrated for tire 1
      speedoEl.textContent = (100 * b.diameter / a.diameter).toFixed(1) + ' km/h'
      msgEl.textContent = Math.abs(diff) > 3
        ? 'Diameter differs by more than 3% — expect noticeable speedometer and gearing changes.'
        : 'Within the common ±3% rule of thumb.'
    } else if ((inputA.value.trim() && !a) || (inputB.value.trim() && !b)) {
      msgEl.textContent = 'Could not parse — use the metric format, e.g. 205/55R16.'
    } else {
      msgEl.textContent = 'Enter a size like 205/55R16 to see dimensions.'
    }
  }

  inputA.addEventListener('input', update)
  inputB.addEventListener('input', update)
})()
