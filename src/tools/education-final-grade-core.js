/** Final exam grade needed calculator */

export function calcFinalGradeNeeded({ currentPercent, desiredPercent, finalWeight }) {
  const current = Number(currentPercent) || 0
  const desired = Number(desiredPercent) || 0
  const weight = Number(finalWeight) || 0
  const nonFinalWeight = 100 - weight

  if (weight <= 0 || weight > 100) {
    return { error: 'Final weight must be between 1 and 100' }
  }

  const needed = (desired - (current * nonFinalWeight / 100)) / (weight / 100)
  const rounded = Math.round(needed * 100) / 100

  return {
    neededPercent: rounded,
    possible: rounded >= 0 && rounded <= 100,
    currentPercent: current,
    desiredPercent: desired,
    finalWeight: weight,
  }
}
