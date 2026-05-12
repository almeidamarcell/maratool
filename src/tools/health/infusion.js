// IV infusion converters.

function round1(n) { return Math.round(n * 10) / 10 }
function round0(n) { return Math.round(n) }

// gtt/min → mL/h: mL/h = (drops/min × 60) / drops_per_mL
// Macrodrop set: 20 gtt/mL. Microdrop set: 60 gtt/mL.
export function dropsPerMinToMlPerHour({ dropsPerMin, dropsPerMl }) {
  if (dropsPerMl <= 0) return null
  return round1((dropsPerMin * 60) / dropsPerMl)
}
export function mlPerHourToDropsPerMin({ mlPerHour, dropsPerMl }) {
  if (mlPerHour < 0) return null
  return round0((mlPerHour * dropsPerMl) / 60)
}

// mcg/kg/min ↔ mL/h
export function mcgKgMinToMlPerHour({ doseMcgKgMin, weightKg, concentrationMcgPerMl }) {
  if (weightKg <= 0 || concentrationMcgPerMl <= 0) return null
  return round1((doseMcgKgMin * weightKg * 60) / concentrationMcgPerMl)
}
export function mlPerHourToMcgKgMin({ mlPerHour, weightKg, concentrationMcgPerMl }) {
  if (weightKg <= 0 || concentrationMcgPerMl <= 0) return null
  return round1((mlPerHour * concentrationMcgPerMl) / (weightKg * 60))
}
