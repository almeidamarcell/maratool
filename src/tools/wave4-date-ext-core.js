/** Wave 4 date/time calculators */

const US_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25', '2026-07-03',
  '2026-09-07', '2026-10-12', '2026-11-11', '2026-11-26', '2026-12-25',
]

function parseDate(s) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function fmt(d) {
  return d.toISOString().slice(0, 10)
}

export function businessDaysBetween(start, end, holidays = US_HOLIDAYS_2026) {
  const s = parseDate(start)
  const e = parseDate(end)
  if (!s || !e) return null
  const holidaySet = new Set(holidays)
  let count = 0
  const cur = new Date(s)
  const forward = cur <= e
  if (!forward) return businessDaysBetween(end, start, holidays)
  while (cur <= e) {
    const day = cur.getDay()
    const key = fmt(cur)
    if (day !== 0 && day !== 6 && !holidaySet.has(key)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return { businessDays: Math.max(0, count - (fmt(s) === fmt(e) ? 0 : 0)), calendarDays: Math.round((e - s) / 86400000) + 1 }
}

export function addBusinessDays(start, days, holidays = US_HOLIDAYS_2026) {
  const s = parseDate(start)
  const n = Math.floor(Number(days))
  if (!s || !isFinite(n)) return null
  const holidaySet = new Set(holidays)
  const cur = new Date(s)
  let added = 0
  while (added < n) {
    cur.setDate(cur.getDate() + 1)
    const day = cur.getDay()
    if (day !== 0 && day !== 6 && !holidaySet.has(fmt(cur))) added++
  }
  return { resultDate: fmt(cur) }
}

export function workingHours(startTime, endTime, breakMinutes = 0) {
  const [sh, sm] = String(startTime || '09:00').split(':').map(Number)
  const [eh, em] = String(endTime || '17:00').split(':').map(Number)
  if ([sh, sm, eh, em].some(x => !isFinite(x))) return null
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  const total = Math.max(0, endMins - startMins - (Number(breakMinutes) || 0))
  return { hours: total / 60, minutes: total }
}

export function countdownTo(targetDate) {
  const t = parseDate(targetDate)
  if (!t) return null
  const now = new Date()
  const diff = t - now
  const abs = Math.abs(diff)
  const days = Math.floor(abs / 86400000)
  const hours = Math.floor((abs % 86400000) / 3600000)
  const minutes = Math.floor((abs % 3600000) / 60000)
  const seconds = Math.floor((abs % 60000) / 1000)
  return { past: diff < 0, days, hours, minutes, seconds, totalSeconds: Math.floor(abs / 1000) }
}
