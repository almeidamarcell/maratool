// Gestational age from LMP (Naegele rule).
// GA = days from LMP to reference date. EDD = LMP + 280 days.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_DAY = 86_400_000

function parseISODate(s) {
  if (typeof s !== 'string' || !ISO_DATE.test(s)) return null
  // Anchor to UTC noon to avoid DST/timezone edge cases.
  const d = new Date(s + 'T12:00:00Z')
  return Number.isNaN(d.getTime()) ? null : d
}

function toISODate(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function gestationalAgeFromLMP({ lmp, reference }) {
  const lmpDate = parseISODate(lmp)
  const refDate = parseISODate(reference)
  if (!lmpDate || !refDate) return null

  const totalDays = Math.round((refDate.getTime() - lmpDate.getTime()) / MS_PER_DAY)
  if (totalDays < 0) return null

  const eddDate = new Date(lmpDate.getTime() + 280 * MS_PER_DAY)

  return {
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7,
    totalDays,
    edd: toISODate(eddDate),
  }
}
