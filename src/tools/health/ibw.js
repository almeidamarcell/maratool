// Ideal Body Weight — 4 formulas (Devine, Robinson, Miller, Hamwi).
// All take height in cm, sex 'male'|'female'. Output in kg.
// All formulas defined only for height > 60 inches (≈152.4 cm); below that, return null.

const INCHES_PER_CM = 1 / 2.54
const MIN_INCHES = 60

function round1(n) { return Math.round(n * 10) / 10 }

function inchesOver60(heightCm) {
  if (heightCm <= 0) return null
  const inches = heightCm * INCHES_PER_CM
  if (inches <= MIN_INCHES) return null
  return inches - MIN_INCHES
}

export function idealBodyWeight(heightCm, sex) {
  const over = inchesOver60(heightCm)
  const valid = sex === 'male' || sex === 'female'
  if (over === null || !valid) {
    return { devine: null, robinson: null, miller: null, hamwi: null }
  }
  const isMale = sex === 'male'
  return {
    devine: round1((isMale ? 50 : 45.5) + 2.3 * over),
    robinson: round1((isMale ? 52 : 49) + (isMale ? 1.9 : 1.7) * over),
    miller: round1((isMale ? 56.2 : 53.1) + (isMale ? 1.41 : 1.36) * over),
    hamwi: round1((isMale ? 48 : 45.5) + (isMale ? 2.7 : 2.2) * over),
  }
}
