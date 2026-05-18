// Generic clinical score engine.
//
// Most clinical scores follow a simple pattern: each input is a categorical
// choice with an integer point value; the total score is the sum; the total
// is mapped to a clinical interpretation band.
//
// This module provides pure functions for that pattern. It also supports
// optional bonus terms (e.g. "+1 if age > 65") via additional numeric inputs.

/**
 * Sum the numeric values in a record. Returns null if any value is the
 * literal `null` or `undefined` or NaN. Strings that parse as numbers are
 * coerced. Required for correctness against the Whitebook reference outputs.
 *
 * @param {Record<string, number | string>} values
 * @returns {number | null}
 */
export function sumScore(values) {
  let total = 0
  for (const key of Object.keys(values)) {
    const raw = values[key]
    if (raw === null || raw === undefined || raw === '') return null
    const n = typeof raw === 'number' ? raw : parseFloat(raw)
    if (!Number.isFinite(n)) return null
    total += n
  }
  return total
}

/**
 * Map a numeric score to a clinical interpretation band.
 *
 * @param {number | null} score
 * @param {Array<{ min: number, max?: number, label: string, cls?: string }>} bands
 *   Bands are inclusive on `min`. If `max` is omitted, treated as +Infinity.
 *   Bands are checked in order — first match wins.
 * @returns {{ label: string, cls: string } | null}
 */
export function interpretBand(score, bands) {
  if (score === null || score === undefined || !Number.isFinite(score)) return null
  for (const b of bands) {
    const min = b.min
    const max = b.max === undefined ? Infinity : b.max
    if (score >= min && score <= max) {
      return { label: b.label, cls: b.cls || '' }
    }
  }
  return null
}

/**
 * Combined helper: sum inputs, classify, return both.
 *
 * @param {Record<string, number | string>} inputs
 * @param {Array<{ min: number, max?: number, label: string, cls?: string }>} bands
 * @returns {{ score: number, interpretation: { label: string, cls: string } | null } | null}
 */
export function scoreAndInterpret(inputs, bands) {
  const score = sumScore(inputs)
  if (score === null) return null
  return { score, interpretation: interpretBand(score, bands) }
}
