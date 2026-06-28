function normalCDF(z) {
  var t = 1 / (1 + 0.2316419 * Math.abs(z))
  var d = 0.3989423 * Math.exp(-z * z / 2)
  var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

export function validateAbTestInput(controlVisitors, controlConversions, variantVisitors, variantConversions) {
  var cv = Number(controlVisitors)
  var cc = Number(controlConversions)
  var vv = Number(variantVisitors)
  var vc = Number(variantConversions)

  if (!cv || !vv || cv <= 0 || vv <= 0) {
    return { valid: false, error: 'Visitor counts must be greater than zero' }
  }
  if (cc < 0 || vc < 0 || !Number.isFinite(cc) || !Number.isFinite(vc)) {
    return { valid: false, error: 'Conversion counts must be valid numbers' }
  }
  if (cc > cv || vc > vv) {
    return { valid: false, error: 'Conversions cannot exceed visitors' }
  }
  if (cc === 0 && vc === 0) {
    return { valid: false, error: 'At least one conversion is required' }
  }
  return { valid: true }
}

export function calculateAbTest(controlVisitors, controlConversions, variantVisitors, variantConversions, confidenceLevel) {
  var validation = validateAbTestInput(controlVisitors, controlConversions, variantVisitors, variantConversions)
  if (!validation.valid) return { error: validation.error }

  var cv = Number(controlVisitors)
  var cc = Number(controlConversions)
  var vv = Number(variantVisitors)
  var vc = Number(variantConversions)
  var alpha = 1 - (confidenceLevel || 0.95)

  var controlRate = cc / cv
  var variantRate = vc / vv
  var pooled = (cc + vc) / (cv + vv)
  var se = Math.sqrt(pooled * (1 - pooled) * (1 / cv + 1 / vv))

  if (se === 0) {
    return {
      controlRate,
      variantRate,
      lift: 0,
      absoluteDiff: variantRate - controlRate,
      zScore: 0,
      pValue: 1,
      significant: false,
      confidenceLevel: confidenceLevel || 0.95,
    }
  }

  var z = (variantRate - controlRate) / se
  var pValue = 2 * (1 - normalCDF(Math.abs(z)))
  var lift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0

  return {
    controlRate,
    variantRate,
    lift,
    absoluteDiff: variantRate - controlRate,
    zScore: z,
    pValue,
    significant: pValue < alpha,
    confidenceLevel: confidenceLevel || 0.95,
  }
}

export function formatPercent(rate) {
  return (rate * 100).toFixed(2) + '%'
}
