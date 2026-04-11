// Percentage Calculator — pure calculation functions
// Each function returns a number rounded to 2 decimal places, or null for invalid input

function round2(n) {
  return Math.round(n * 100) / 100
}

// What is X% of Y?
export function percentOf(percent, value) {
  return round2((percent / 100) * value)
}

// X is what % of Y?
export function whatPercent(value, total) {
  if (total === 0) return null
  return round2((value / total) * 100)
}

// From original to new (increase), what % increase?
export function percentIncrease(original, newValue) {
  if (original === 0) return null
  return round2(((newValue - original) / original) * 100)
}

// From original to new (decrease), what % decrease?
export function percentDecrease(original, newValue) {
  if (original === 0) return null
  return round2(((original - newValue) / original) * 100)
}

// X over Y is what %? (same as whatPercent but semantically different in UI)
export function proportionPercent(part, whole) {
  if (whole === 0) return null
  return round2((part / whole) * 100)
}

// Increase X by Y% = result
export function addPercent(value, percent) {
  return round2(value * (1 + percent / 100))
}

// Decrease X by Y% = result
export function subtractPercent(value, percent) {
  return round2(value * (1 - percent / 100))
}

// Increased by X% became Y, what was original?
export function originalBeforeIncrease(percent, finalValue) {
  if (percent === -100) return null
  return round2(finalValue / (1 + percent / 100))
}

// Decreased by X% became Y, what was original?
export function originalBeforeDecrease(percent, finalValue) {
  if (percent === 100) return null
  return round2(finalValue / (1 - percent / 100))
}
