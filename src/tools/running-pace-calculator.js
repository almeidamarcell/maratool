(function () {
  var dist = document.getElementById('rpc-dist')
  var unit = document.getElementById('rpc-unit')
  var hh = document.getElementById('rpc-h')
  var mm = document.getElementById('rpc-m')
  var ss = document.getElementById('rpc-s')
  var paceKm = document.getElementById('rpc-pace-km')
  var paceMi = document.getElementById('rpc-pace-mi')
  var speedKmh = document.getElementById('rpc-speed-kmh')
  var speedMph = document.getElementById('rpc-speed-mph')
  var t5 = document.getElementById('rpc-t5')
  var t10 = document.getElementById('rpc-t10')
  var tHalf = document.getElementById('rpc-thalf')
  var tFull = document.getElementById('rpc-tfull')
  var copyBtn = document.getElementById('rpc-copy')

  var KM_MI = 1.609344 // exact (NIST SP 811)
  var RACES = { half: 21.0975, full: 42.195 } // official IAAF distances, km

  var summary = ''

  function pad(n) { return n < 10 ? '0' + n : '' + n }

  function fmtPace(secPerUnit) {
    if (!isFinite(secPerUnit) || secPerUnit <= 0) return '—'
    var m = Math.floor(secPerUnit / 60)
    var s = Math.round(secPerUnit % 60)
    if (s === 60) { m += 1; s = 0 }
    return m + ':' + pad(s)
  }

  function fmtTime(totalSec) {
    if (!isFinite(totalSec) || totalSec <= 0) return '—'
    var h = Math.floor(totalSec / 3600)
    var m = Math.floor((totalSec % 3600) / 60)
    var s = Math.round(totalSec % 60)
    if (s === 60) { m += 1; s = 0 }
    if (m === 60) { h += 1; m = 0 }
    return h > 0 ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s)
  }

  function update() {
    var d = parseFloat(dist.value)
    var t = (parseInt(hh.value, 10) || 0) * 3600 + (parseInt(mm.value, 10) || 0) * 60 + (parseInt(ss.value, 10) || 0)
    if (isNaN(d) || d <= 0 || t <= 0) {
      paceKm.textContent = paceMi.textContent = speedKmh.textContent = speedMph.textContent = '—'
      t5.textContent = t10.textContent = tHalf.textContent = tFull.textContent = '—'
      summary = ''
      return
    }
    var km = unit.value === 'mi' ? d * KM_MI : d
    var secPerKm = t / km
    var kmh = 3600 / secPerKm

    paceKm.textContent = fmtPace(secPerKm)
    paceMi.textContent = fmtPace(secPerKm * KM_MI)
    speedKmh.textContent = parseFloat(kmh.toFixed(2)).toString()
    speedMph.textContent = parseFloat((kmh / KM_MI).toFixed(2)).toString()
    t5.textContent = fmtTime(secPerKm * 5)
    t10.textContent = fmtTime(secPerKm * 10)
    tHalf.textContent = fmtTime(secPerKm * RACES.half)
    tFull.textContent = fmtTime(secPerKm * RACES.full)

    summary = 'Pace ' + fmtPace(secPerKm) + ' /km (' + fmtPace(secPerKm * KM_MI) + ' /mile) — 5K ' + fmtTime(secPerKm * 5) +
      ', 10K ' + fmtTime(secPerKm * 10) + ', Half ' + fmtTime(secPerKm * RACES.half) + ', Marathon ' + fmtTime(secPerKm * RACES.full)
  }

  ;[dist, hh, mm, ss].forEach(function (el) { el.addEventListener('input', update) })
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
