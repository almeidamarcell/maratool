/** Weighted grade calculator */

export function calcWeightedGrade(assignments) {
  const list = Array.isArray(assignments) ? assignments : []
  let weighted = 0
  let totalWeight = 0
  for (const a of list) {
    const w = Number(a.weight) || 0
    const score = Number(a.score)
    if (!w || !Number.isFinite(score)) continue
    weighted += score * w
    totalWeight += w
  }
  const percent = totalWeight ? weighted / totalWeight : 0
  return {
    percent: Math.round(percent * 100) / 100,
    totalWeight,
  }
}
