/** GPA calculator — letter grades on 4.0 scale */

const LETTER_MAP = {
  'A+': 4, A: 4, 'A-': 3.7,
  'B+': 3.3, B: 3, 'B-': 2.7,
  'C+': 2.3, C: 2, 'C-': 1.7,
  'D+': 1.3, D: 1, 'D-': 0.7,
  F: 0,
}

export function calcGpa(courses) {
  const list = Array.isArray(courses) ? courses : []
  let points = 0
  let credits = 0
  for (const c of list) {
    const cr = Number(c.credits) || 0
    const grade = String(c.grade || '').trim().toUpperCase()
    const gp = LETTER_MAP[grade]
    if (gp === undefined || cr <= 0) continue
    points += gp * cr
    credits += cr
  }
  return {
    value: credits ? Math.round((points / credits) * 100) / 100 : 0,
    credits,
    courses: list.length,
  }
}
