export function validateCacLtvInput(marketingSpend, newCustomers, avgRevenue, lifespanMonths, grossMargin) {
  var spend = Number(marketingSpend)
  var customers = Number(newCustomers)
  var revenue = Number(avgRevenue)
  var months = Number(lifespanMonths)
  var margin = Number(grossMargin)

  if (!Number.isFinite(spend) || spend < 0) return { valid: false, error: 'Marketing spend must be a non-negative number' }
  if (!customers || customers <= 0) return { valid: false, error: 'New customers must be greater than zero' }
  if (!Number.isFinite(revenue) || revenue < 0) return { valid: false, error: 'Average revenue must be non-negative' }
  if (!months || months <= 0) return { valid: false, error: 'Customer lifespan must be greater than zero' }
  if (!Number.isFinite(margin) || margin <= 0 || margin > 100) return { valid: false, error: 'Gross margin must be between 1 and 100' }
  return { valid: true }
}

export function calculateCacLtv(marketingSpend, newCustomers, avgRevenue, lifespanMonths, grossMargin) {
  var validation = validateCacLtvInput(marketingSpend, newCustomers, avgRevenue, lifespanMonths, grossMargin)
  if (!validation.valid) return { error: validation.error }

  var spend = Number(marketingSpend)
  var customers = Number(newCustomers)
  var revenue = Number(avgRevenue)
  var months = Number(lifespanMonths)
  var margin = Number(grossMargin) / 100

  var cac = spend / customers
  var monthlyRevenue = revenue * margin
  var ltv = monthlyRevenue * months
  var ratio = cac > 0 ? ltv / cac : 0
  var paybackMonths = monthlyRevenue > 0 ? cac / monthlyRevenue : Infinity

  return { cac, ltv, ratio, paybackMonths, monthlyRevenue }
}
