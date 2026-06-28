;(function () {
  var datetime = document.getElementById('tz-datetime')
  var fromZone = document.getElementById('tz-from')
  var toZone = document.getElementById('tz-to')
  var result = document.getElementById('tz-result')

  var zones = Intl.supportedValuesOf('timeZone')
  zones.forEach(function (z) {
    var o1 = document.createElement('option')
    o1.value = z; o1.textContent = z
    fromZone.appendChild(o1)
    var o2 = document.createElement('option')
    o2.value = z; o2.textContent = z
    toZone.appendChild(o2)
  })
  fromZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
  toZone.value = 'UTC'

  var now = new Date()
  datetime.value = now.toISOString().slice(0, 16)

  function update() {
    var d = new Date(datetime.value)
    if (isNaN(d.getTime())) {
      result.textContent = '—'
      return
    }
    var fmt = { dateStyle: 'full', timeStyle: 'long' }
    var fromStr = d.toLocaleString('en-US', { ...fmt, timeZone: fromZone.value })
    var toStr = d.toLocaleString('en-US', { ...fmt, timeZone: toZone.value })
    result.innerHTML = '<div class="tz-row"><strong>' + fromZone.value + '</strong><br>' + fromStr + '</div><div class="tz-arrow">→</div><div class="tz-row"><strong>' + toZone.value + '</strong><br>' + toStr + '</div>'
  }

  ;[datetime, fromZone, toZone].forEach(function (el) {
    el.addEventListener('input', update)
    el.addEventListener('change', update)
  })
  update()
})()
