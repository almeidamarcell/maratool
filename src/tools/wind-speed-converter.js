(function () {
  var val = document.getElementById('wsc-value')
  var unit = document.getElementById('wsc-unit')
  var outs = {
    kn: document.getElementById('wsc-out-kn'),
    mph: document.getElementById('wsc-out-mph'),
    kmh: document.getElementById('wsc-out-kmh'),
    ms: document.getElementById('wsc-out-ms'),
    fts: document.getElementById('wsc-out-fts'),
  }
  var beaufortEl = document.getElementById('wsc-beaufort')
  var descEl = document.getElementById('wsc-desc')
  var copyBtn = document.getElementById('wsc-copy')

  // Factors to m/s. Knot = 1852 m / 3600 s exactly (NIST SP 811).
  var TO_MS = { kn: 1852 / 3600, mph: 0.44704, kmh: 1 / 3.6, ms: 1, fts: 0.3048 }

  // NOAA NWS Beaufort scale — upper bound of each force in knots
  var BEAUFORT = [
    [1, 'Calm'], [3, 'Light air'], [6, 'Light breeze'], [10, 'Gentle breeze'],
    [16, 'Moderate breeze'], [21, 'Fresh breeze'], [27, 'Strong breeze'], [33, 'Near gale'],
    [40, 'Gale'], [47, 'Strong gale'], [55, 'Storm'], [63, 'Violent storm'],
  ]

  var summary = ''

  function fmt(x) { return parseFloat(x.toFixed(2)).toString() }

  function beaufort(kn) {
    for (var i = 0; i < BEAUFORT.length; i++) {
      if ((i === 0 && kn < BEAUFORT[0][0]) || (i > 0 && kn <= BEAUFORT[i][0])) {
        return { force: i, desc: BEAUFORT[i][1] }
      }
    }
    return { force: 12, desc: 'Hurricane force' }
  }

  function update() {
    var v = parseFloat(val.value)
    if (isNaN(v) || v < 0) {
      Object.keys(outs).forEach(function (k) { outs[k].textContent = '—' })
      beaufortEl.textContent = descEl.textContent = '—'
      summary = ''
      return
    }
    var ms = v * TO_MS[unit.value]
    var kn = ms / TO_MS.kn
    Object.keys(outs).forEach(function (k) { outs[k].textContent = fmt(ms / TO_MS[k]) })
    var b = beaufort(kn)
    beaufortEl.textContent = 'Force ' + b.force
    descEl.textContent = b.desc
    summary = fmt(kn) + ' kn = ' + fmt(ms / TO_MS.mph) + ' mph = ' + fmt(ms / TO_MS.kmh) + ' km/h = ' +
      fmt(ms) + ' m/s — Beaufort force ' + b.force + ' (' + b.desc + ')'
  }

  val.addEventListener('input', update)
  unit.addEventListener('change', update)

  copyBtn.addEventListener('click', function () {
    if (!summary) return
    navigator.clipboard.writeText(summary).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = orig
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })
})()
