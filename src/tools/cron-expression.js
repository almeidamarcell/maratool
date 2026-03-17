import './hash-state.js'
// Cron Expression Generator
(function () {
  var fields = {
    min: document.getElementById('cron-min'),
    hour: document.getElementById('cron-hour'),
    dom: document.getElementById('cron-dom'),
    month: document.getElementById('cron-month'),
    dow: document.getElementById('cron-dow'),
  }
  var exprEl = document.getElementById('cron-expr')
  var errorEl = document.getElementById('cron-error')
  var descEl = document.getElementById('cron-desc')
  var nextEl = document.getElementById('cron-next')
  var copyBtn = document.getElementById('cron-copy')

  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  var monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // ── Parse a single cron field into a set of valid values ──
  function parseField(str, min, max) {
    str = str.trim()
    if (!str) return null
    var values = new Set()

    var parts = str.split(',')
    for (var p = 0; p < parts.length; p++) {
      var part = parts[p].trim()

      // */n step
      var stepAll = part.match(/^\*\/(\d+)$/)
      if (stepAll) {
        var step = parseInt(stepAll[1], 10)
        if (step < 1) return null
        for (var v = min; v <= max; v += step) values.add(v)
        continue
      }

      // * wildcard
      if (part === '*') {
        for (var v = min; v <= max; v++) values.add(v)
        continue
      }

      // range with optional step: n-m or n-m/s
      var rangeMatch = part.match(/^(\d+)-(\d+)(\/(\d+))?$/)
      if (rangeMatch) {
        var from = parseInt(rangeMatch[1], 10)
        var to = parseInt(rangeMatch[2], 10)
        var step = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 1
        if (from < min || to > max || from > to || step < 1) return null
        for (var v = from; v <= to; v += step) values.add(v)
        continue
      }

      // single number
      if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10)
        if (n < min || n > max) return null
        values.add(n)
        continue
      }

      return null // invalid token
    }

    return values.size > 0 ? values : null
  }

  // ── Generate human-readable description ──
  function describe(m, h, dom, mon, dow) {
    var expr = m + ' ' + h + ' ' + dom + ' ' + mon + ' ' + dow
    var desc = ''

    // Common presets
    if (expr === '* * * * *') return 'Every minute'
    if (expr === '0 * * * *') return 'Every hour, at minute 0'
    if (expr === '0 0 * * *') return 'Every day at midnight'
    if (expr === '0 0 * * 1') return 'Every Monday at midnight'
    if (expr === '0 0 * * 1-5') return 'Every weekday (Mon\u2013Fri) at midnight'
    if (expr === '0 0 1 * *') return 'First day of every month at midnight'

    // Build description from parts
    var parts = []

    // Time
    if (m !== '*' && h !== '*') {
      var mins = parseField(m, 0, 59)
      var hrs = parseField(h, 0, 23)
      if (mins && hrs && mins.size === 1 && hrs.size === 1) {
        var hv = Array.from(hrs)[0]
        var mv = Array.from(mins)[0]
        var ampm = hv >= 12 ? 'PM' : 'AM'
        var h12 = hv % 12 || 12
        parts.push('At ' + h12 + ':' + (mv < 10 ? '0' : '') + mv + ' ' + ampm)
      } else {
        parts.push('At minute ' + m + ' past hour ' + h)
      }
    } else if (m !== '*') {
      if (/^\*\/\d+$/.test(m)) {
        parts.push('Every ' + m.split('/')[1] + ' minutes')
      } else {
        parts.push('At minute ' + m)
      }
    } else if (h !== '*') {
      parts.push('Every minute of hour ' + h)
    } else {
      parts.push('Every minute')
    }

    // Day of month
    if (dom !== '*') {
      parts.push('on day ' + dom + ' of the month')
    }

    // Month
    if (mon !== '*') {
      var monSet = parseField(mon, 1, 12)
      if (monSet) {
        var names = Array.from(monSet).sort(function (a, b) { return a - b }).map(function (n) { return monthNames[n] })
        parts.push('in ' + names.join(', '))
      } else {
        parts.push('in month ' + mon)
      }
    }

    // Day of week
    if (dow !== '*') {
      var dowSet = parseField(dow, 0, 6)
      if (dowSet) {
        var names = Array.from(dowSet).sort(function (a, b) { return a - b }).map(function (n) { return dayNames[n] })
        parts.push('on ' + names.join(', '))
      } else {
        parts.push('on weekday ' + dow)
      }
    }

    return parts.join(', ')
  }

  // ── Calculate next N run times ──
  function getNextRuns(m, h, dom, mon, dow, count) {
    var minSet = parseField(m, 0, 59)
    var hourSet = parseField(h, 0, 23)
    var domSet = parseField(dom, 1, 31)
    var monSet = parseField(mon, 1, 12)
    var dowSet = parseField(dow, 0, 6)

    if (!minSet || !hourSet || !domSet || !monSet || !dowSet) return []

    var results = []
    var d = new Date()
    d.setSeconds(0, 0)
    d.setMinutes(d.getMinutes() + 1) // start from next minute

    var maxIterations = 525600 // ~1 year of minutes
    for (var i = 0; i < maxIterations && results.length < count; i++) {
      if (monSet.has(d.getMonth() + 1) &&
          domSet.has(d.getDate()) &&
          dowSet.has(d.getDay()) &&
          hourSet.has(d.getHours()) &&
          minSet.has(d.getMinutes())) {
        results.push(new Date(d))
      }
      d.setMinutes(d.getMinutes() + 1)
    }

    return results
  }

  function formatDate(d) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' ' +
      (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes()
  }

  // ── Main update ──
  function update() {
    var m = fields.min.value.trim() || '*'
    var h = fields.hour.value.trim() || '*'
    var dom = fields.dom.value.trim() || '*'
    var mon = fields.month.value.trim() || '*'
    var dow = fields.dow.value.trim() || '*'

    var expr = m + ' ' + h + ' ' + dom + ' ' + mon + ' ' + dow
    exprEl.textContent = expr

    // Validate
    var valid = true
    var ranges = [[m, 0, 59], [h, 0, 23], [dom, 1, 31], [mon, 1, 12], [dow, 0, 6]]
    var fieldEls = [fields.min, fields.hour, fields.dom, fields.month, fields.dow]
    for (var i = 0; i < ranges.length; i++) {
      var parsed = parseField(ranges[i][0], ranges[i][1], ranges[i][2])
      if (!parsed) {
        fieldEls[i].classList.add('error-state')
        valid = false
      } else {
        fieldEls[i].classList.remove('error-state')
      }
    }

    if (!valid) {
      errorEl.textContent = 'One or more fields have invalid values'
      descEl.textContent = '\u2014'
      nextEl.innerHTML = ''
      return
    }

    errorEl.textContent = ''
    descEl.textContent = describe(m, h, dom, mon, dow)

    var runs = getNextRuns(m, h, dom, mon, dow, 5)
    if (runs.length === 0) {
      nextEl.innerHTML = '<li style="color:var(--text-3)">No upcoming runs found within the next year</li>'
    } else {
      nextEl.innerHTML = runs.map(function (d) {
        return '<li>' + formatDate(d) + '</li>'
      }).join('')
    }
  }

  function saveState() {
    HashState.save({
      min: fields.min.value,
      hour: fields.hour.value,
      dom: fields.dom.value,
      month: fields.month.value,
      dow: fields.dow.value
    })
  }

  // ── Event listeners ──
  Object.keys(fields).forEach(function (key) {
    fields[key].addEventListener('input', function () {
      update()
      saveState()
    })
  })

  // ── Reference table rows ──
  document.querySelectorAll('.cron-ref-row').forEach(function (row) {
    row.style.cursor = 'pointer'
    row.addEventListener('click', function () {
      var parts = row.dataset.expr.split(' ')
      fields.min.value = parts[0]
      fields.hour.value = parts[1]
      fields.dom.value = parts[2]
      fields.month.value = parts[3]
      fields.dow.value = parts[4]
      update()
      saveState()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })

  // ── Presets ──
  document.querySelectorAll('.cron-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var parts = btn.dataset.expr.split(' ')
      fields.min.value = parts[0]
      fields.hour.value = parts[1]
      fields.dom.value = parts[2]
      fields.month.value = parts[3]
      fields.dow.value = parts[4]
      update()
      saveState()
    })
  })

  // ── Copy ──
  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(exprEl.textContent).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Restore from hash state
  var _hs = HashState.parse()
  if (_hs.min !== undefined) fields.min.value = _hs.min
  if (_hs.hour !== undefined) fields.hour.value = _hs.hour
  if (_hs.dom !== undefined) fields.dom.value = _hs.dom
  if (_hs.month !== undefined) fields.month.value = _hs.month
  if (_hs.dow !== undefined) fields.dow.value = _hs.dow

  update()
})()
