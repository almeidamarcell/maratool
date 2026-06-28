/** Wave 4 e-commerce calculators */

export function shippingCost(weightLb, zone = 'domestic', ratePerLb = 0.5, flat = 5) {
  const w = Number(weightLb)
  const rate = Number(ratePerLb)
  const base = Number(flat)
  if (!isFinite(w) || w < 0) return null
  const zoneMult = zone === 'international' ? 2.5 : zone === 'regional' ? 1.5 : 1
  const cost = (base + w * rate) * zoneMult
  return { cost, zone, weightLb: w }
}

export function generateSku({ prefix = 'SKU', category = 'GEN', sequence = 1 } = {}) {
  const seq = String(Math.max(0, Math.floor(sequence))).padStart(5, '0')
  return `${String(prefix).toUpperCase()}-${String(category).toUpperCase()}-${seq}`
}
