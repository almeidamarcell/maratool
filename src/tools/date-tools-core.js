/** Age, ISO8601, and week number utilities */

export function calcAge(birthDate, targetDate = new Date()) {
  const birth = new Date(birthDate)
  const target = new Date(targetDate)
  if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null
  let years = target.getFullYear() - birth.getFullYear()
  let months = target.getMonth() - birth.getMonth()
  let days = target.getDate() - birth.getDate()
  if (days < 0) {
    months--
    const prev = new Date(target.getFullYear(), target.getMonth(), 0)
    days += prev.getDate()
  }
  if (months < 0) { years--; months += 12 }
  const totalDays = Math.floor((target - birth) / (1000 * 60 * 60 * 24))
  return { years, months, days, totalDays }
}

export function formatIso8601(date) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return { error: 'Invalid date' }
  return {
    iso: d.toISOString(),
    local: d.toLocaleString(),
    unix: Math.floor(d.getTime() / 1000),
  }
}

export function parseIso8601(str) {
  const d = new Date(str)
  if (isNaN(d.getTime())) return { error: 'Invalid ISO 8601 string' }
  return formatIso8601(d)
}

export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    week,
    year: d.getUTCFullYear(),
    label: `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`,
    weekStart: monday.toLocaleDateString(),
    weekEnd: sunday.toLocaleDateString(),
  }
}
