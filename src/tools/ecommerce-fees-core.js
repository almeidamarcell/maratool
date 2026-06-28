/** Amazon and Etsy fee calculations (static rate tables, early 2026) */

export const AMAZON_REFERRAL_RATES = {
  default: 0.15,
  electronics: 0.08,
  clothing: 0.17,
  books: 0.15,
  beauty: 0.15,
  home: 0.15,
  toys: 0.15,
}

export function calcAmazonFees(price, category = 'default', fulfillment = 'fba') {
  const referralRate = AMAZON_REFERRAL_RATES[category] ?? 0.15
  const referralFee = price * referralRate
  // Simplified FBA fee estimate by price tier
  let fbaFee = 0
  if (fulfillment === 'fba') {
    if (price < 10) fbaFee = 3.22
    else if (price < 20) fbaFee = 4.75
    else fbaFee = 5.40 + (price > 50 ? (price - 50) * 0.02 : 0)
  }
  const totalFees = referralFee + fbaFee
  return {
    referralFee,
    fbaFee,
    totalFees,
    netProfit: price - totalFees,
    margin: price > 0 ? ((price - totalFees) / price) * 100 : 0,
  }
}

export function calcEtsyFees(price, shipping = 0) {
  const listingFee = 0.20
  const transactionFee = (price + shipping) * 0.065
  const paymentProcessing = (price + shipping) * 0.03 + 0.25
  const totalFees = listingFee + transactionFee + paymentProcessing
  return {
    listingFee,
    transactionFee,
    paymentProcessing,
    totalFees,
    netProfit: price - totalFees,
    margin: price > 0 ? ((price - totalFees) / price) * 100 : 0,
  }
}

export function formatMoney(n) {
  if (!isFinite(n)) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatPct(n) {
  if (!isFinite(n)) return '—'
  return n.toFixed(2) + '%'
}
