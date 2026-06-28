export function validateRoiInput(revenue, cost) {
  var rev = Number(revenue)
  var c = Number(cost)
  if (!Number.isFinite(rev) || rev < 0) return { valid: false, error: 'Revenue must be a non-negative number' }
  if (!Number.isFinite(c) || c <= 0) return { valid: false, error: 'Cost must be greater than zero' }
  return { valid: true }
}

export function calculateRoi(revenue, cost) {
  var validation = validateRoiInput(revenue, cost)
  if (!validation.valid) return { error: validation.error }

  var rev = Number(revenue)
  var c = Number(cost)
  var profit = rev - c
  var roi = ((rev - c) / c) * 100
  var roas = rev / c

  return { revenue: rev, cost: c, profit, roi, roas }
}

export function formatCurrency(amount, currency) {
  var sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
  return sym + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
