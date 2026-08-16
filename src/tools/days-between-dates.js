import { copyWithFeedback, setVisible } from './tool-utils.js'

// Days Between Dates
//
// Every calculation here works in "epoch days" — whole days since 1970-01-01,
// derived from Date.UTC. Subtracting two local-midnight timestamps and dividing
// by 86400000 is off by one whenever the span crosses a daylight saving change,
// because one of those days is 23 or 25 hours long. UTC midnight has no such
// days, so the division is always exact.
;(function () {
  var MS_DAY = 86400000

  var startEl = document.getElementById('dbd-start')
  var endEl = document.getElementById('dbd-end')
  var startWd = document.getElementById('dbd-start-weekday')
  var endWd = document.getElementById('dbd-end-weekday')
  var includeEnd = document.getElementById('dbd-include-end')
  var errorEl = document.getElementById('dbd-error')
  var headlineEl = document.getElementById('dbd-headline')
  var breakdownEl = document.getElementById('dbd-breakdown')
  var daysEl = document.getElementById('dbd-days')
  var weeksEl = document.getElementById('dbd-weeks')
  var hoursEl = document.getElementById('dbd-hours')
  var minutesEl = document.getElementById('dbd-minutes')
  var businessEl = document.getElementById('dbd-business')
  var weekendEl = document.getElementById('dbd-weekend')
  var todayBtn = document.getElementById('dbd-today')
  var copyBtn = document.getElementById('dbd-copy')

  if (!startEl || !endEl) return

  // ── date helpers ──────────────────────────────────────────────────────

  function utcDate(y, m, d) {
    // setUTCFullYear rather than Date.UTC: Date.UTC maps years 0–99 onto
    // 1900–1999, which would silently accept 0042-01-01 as 1942.
    var dt = new Date(0)
    dt.setUTCFullYear(y, m, d)
    dt.setUTCHours(0, 0, 0, 0)
    return dt
  }

  // "YYYY-MM-DD" → whole days since epoch, or null.
  function parseDay(value) {
    var m = /^(\d{1,6})-(\d{2})-(\d{2})$/.exec(value || '')
    if (!m) return null
    var y = parseInt(m[1], 10)
    var mo = parseInt(m[2], 10)
    var d = parseInt(m[3], 10)
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
    var dt = utcDate(y, mo - 1, d)
    if (isNaN(dt.getTime())) return null
    // Rejects 2026-02-30, which the Date constructor would roll into March.
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
    return Math.round(dt.getTime() / MS_DAY)
  }

  function dayToDate(day) {
    return new Date(day * MS_DAY)
  }

  function toInputValue(day) {
    var d = dayToDate(day)
    var y = d.getUTCFullYear()
    var mo = String(d.getUTCMonth() + 1).padStart(2, '0')
    var da = String(d.getUTCDate()).padStart(2, '0')
    return String(y).padStart(4, '0') + '-' + mo + '-' + da
  }

  function longDate(day) {
    return dayToDate(day).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    })
  }

  function todayDay() {
    var n = new Date()
    return Math.round(utcDate(n.getFullYear(), n.getMonth(), n.getDate()).getTime() / MS_DAY)
  }

  // ── math ──────────────────────────────────────────────────────────────

  // Weekdays in the half-open interval [from, to). O(1) — a day-by-day loop
  // would walk millions of iterations for a span of centuries.
  function countWeekdays(from, to) {
    var n = to - from
    if (n <= 0) return 0
    var weeks = Math.floor(n / 7)
    var count = weeks * 5
    var rest = n - weeks * 7
    for (var i = 0; i < rest; i++) {
      // Epoch day 0 was a Thursday, so +4 lines the index up with getUTCDay().
      var dow = (((from + weeks * 7 + i + 4) % 7) + 7) % 7
      if (dow !== 0 && dow !== 6) count++
    }
    return count
  }

  // Adds whole months to a date, clamping the day of month. 31 Jan plus one
  // month is 28 Feb, not 3 March.
  function addMonths(day, n) {
    var a = dayToDate(day)
    var y = a.getUTCFullYear()
    var m = a.getUTCMonth() + n
    var lastOfTarget = utcDate(y, m + 1, 0).getUTCDate()
    var d = Math.min(a.getUTCDate(), lastOfTarget)
    return Math.round(utcDate(y, m, d).getTime() / MS_DAY)
  }

  // Calendar-aware difference: 31 Jan → 1 Mar is "1 month, 1 day", not 29 days
  // rounded into some fixed-length month.
  //
  // The textbook borrow-a-month version (months--, days += length of the
  // previous month) underflows here: 1 − 31 + 28 leaves −2 days. Anchoring on
  // the start date instead cannot go negative — take the largest whole number
  // of months that still lands on or before the end date, then count the
  // leftover days from there.
  function breakdown(fromDay, toDay) {
    var a = dayToDate(fromDay)
    var b = dayToDate(toDay)
    var months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
    if (months < 0) months = 0
    while (months > 0 && addMonths(fromDay, months) > toDay) months--
    return {
      years: Math.floor(months / 12),
      months: months % 12,
      days: toDay - addMonths(fromDay, months),
    }
  }

  function plural(n, unit) {
    return n.toLocaleString() + ' ' + unit + (n === 1 ? '' : 's')
  }

  function breakdownText(b) {
    var parts = []
    if (b.years) parts.push(plural(b.years, 'year'))
    if (b.months) parts.push(plural(b.months, 'month'))
    if (b.days) parts.push(plural(b.days, 'day'))
    if (!parts.length) return 'Same day'
    return parts.join(', ')
  }

  // ── rendering ─────────────────────────────────────────────────────────

  var summary = ''

  function clearResults() {
    headlineEl.textContent = '—'
    breakdownEl.textContent = '—'
    daysEl.textContent = weeksEl.textContent = hoursEl.textContent = '—'
    minutesEl.textContent = businessEl.textContent = weekendEl.textContent = '—'
    summary = ''
  }

  function update() {
    var s = parseDay(startEl.value)
    var e = parseDay(endEl.value)

    startWd.textContent = s === null ? '' : longDate(s)
    endWd.textContent = e === null ? '' : longDate(e)

    if (s === null || e === null) {
      setVisible(errorEl, true)
      clearResults()
      return
    }
    setVisible(errorEl, false)

    var reversed = e < s
    var from = reversed ? e : s
    var last = reversed ? s : e
    // Including the end date means the last day counts in full, which is the
    // same as moving the exclusive boundary one day further out.
    var to = includeEnd.checked ? last + 1 : last

    var total = to - from
    var b = breakdown(from, to)
    var business = countWeekdays(from, to)

    var headline = plural(total, 'day')
    var detail = breakdownText(b)
    headlineEl.textContent = headline
    // For spans under a month the breakdown just repeats the headline, so the
    // line carries the ISO range instead of saying "30 days" twice.
    breakdownEl.textContent = (detail === headline ? toInputValue(from) + ' → ' + toInputValue(last) : detail) +
      (reversed ? ' (the end date is earlier than the start date, so the span is measured backwards)' : '')

    daysEl.textContent = total.toLocaleString()
    var weeks = Math.floor(total / 7)
    var rest = total % 7
    weeksEl.textContent = rest ? weeks + 'w ' + rest + 'd' : weeks + 'w'
    hoursEl.textContent = (total * 24).toLocaleString()
    minutesEl.textContent = (total * 1440).toLocaleString()
    businessEl.textContent = business.toLocaleString()
    weekendEl.textContent = (total - business).toLocaleString()

    summary = longDate(from) + ' → ' + longDate(last) + '\n' +
      plural(total, 'day') + ' (' + breakdownText(b) + ')\n' +
      plural(business, 'business day') + ', ' + plural(total - business, 'weekend day') + '\n' +
      (includeEnd.checked ? 'End date included.' : 'End date not included.')
  }

  function resetToToday() {
    var t = todayDay()
    startEl.value = toInputValue(t)
    endEl.value = toInputValue(t + 30)
    update()
  }

  ;[startEl, endEl].forEach(function (el) {
    el.addEventListener('input', update)
    el.addEventListener('change', update)
  })
  includeEnd.addEventListener('change', update)
  if (todayBtn) todayBtn.addEventListener('click', resetToToday)
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (!summary) return
      copyWithFeedback(copyBtn, summary)
    })
  }

  resetToToday()
})()
