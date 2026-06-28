/** Wave 4 business generators and calculators */

export function generateInvoiceNumber(prefix = 'INV', year = new Date().getFullYear(), sequence = 1, pad = 4) {
  const seq = String(Math.max(0, Math.floor(sequence))).padStart(pad, '0')
  const p = String(prefix || 'INV').trim().toUpperCase()
  return `${p}-${year}-${seq}`
}

export function generatePurchaseOrder(po) {
  const {
    vendor = 'Vendor Name',
    buyer = 'Your Company',
    poNumber = generateInvoiceNumber('PO'),
    items = [{ description: 'Item', qty: 1, unitPrice: 0 }],
    notes = '',
  } = po || {}
  const lines = items.map((it, i) => {
    const qty = Number(it.qty) || 0
    const price = Number(it.unitPrice) || 0
    return `${i + 1}. ${it.description || 'Item'} — qty ${qty} × $${price.toFixed(2)} = $${(qty * price).toFixed(2)}`
  })
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0)
  return [
    'PURCHASE ORDER',
    `PO #: ${poNumber}`,
    `Buyer: ${buyer}`,
    `Vendor: ${vendor}`,
    '',
    ...lines,
    '',
    `Subtotal: $${subtotal.toFixed(2)}`,
    notes ? `Notes: ${notes}` : '',
  ].filter(Boolean).join('\n')
}

const ADJECTIVES = ['Bright', 'Swift', 'Clear', 'Prime', 'Nova', 'Blue', 'Golden', 'Urban', 'True', 'Peak']
const NOUNS = ['Labs', 'Works', 'Studio', 'Collective', 'Supply', 'Digital', 'Partners', 'Craft', 'Logic', 'Flow']

export function generateBusinessNames(seed = '', count = 10) {
  const base = String(seed || '').trim().toLowerCase()
  const names = new Set()
  let i = 0
  while (names.size < count && i < count * 20) {
    const adj = ADJECTIVES[i % ADJECTIVES.length]
    const noun = NOUNS[(i * 3) % NOUNS.length]
    const name = base
      ? `${base.charAt(0).toUpperCase()}${base.slice(1)} ${noun}`
      : `${adj} ${noun}`
    names.add(name)
    i++
  }
  return [...names]
}

export function currencyMargin(cost, sellPrice, fxRate = 1, fxFeePct = 0) {
  const c = Number(cost)
  const s = Number(sellPrice)
  const rate = Number(fxRate) || 1
  const fee = Number(fxFeePct) || 0
  if (!isFinite(c) || !isFinite(s) || s <= 0) return null
  const adjustedCost = (c / rate) * (1 + fee / 100)
  const profit = s - adjustedCost
  return {
    adjustedCost,
    profit,
    marginPct: (profit / s) * 100,
    markupPct: adjustedCost > 0 ? (profit / adjustedCost) * 100 : 0,
  }
}
