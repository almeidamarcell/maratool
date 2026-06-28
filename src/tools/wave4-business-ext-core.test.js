import { describe, test, expect } from 'vitest'
import {
  generateInvoiceNumber,
  generatePurchaseOrder,
  generateBusinessNames,
  currencyMargin,
} from './wave4-business-ext-core.js'

describe('generateInvoiceNumber', () => {
  test('formats prefix year and padded sequence', () => {
    expect(generateInvoiceNumber('inv', 2026, 7)).toBe('INV-2026-0007')
  })
})

describe('generatePurchaseOrder', () => {
  test('builds PO text with subtotal', () => {
    const text = generatePurchaseOrder({
      vendor: 'Acme',
      buyer: 'Us',
      poNumber: 'PO-1',
      items: [{ description: 'Widget', qty: 2, unitPrice: 10 }],
    })
    expect(text).toContain('PO #: PO-1')
    expect(text).toContain('Subtotal: $20.00')
  })
})

describe('generateBusinessNames', () => {
  test('returns unique names', () => {
    const names = generateBusinessNames('pixel', 5)
    expect(names.length).toBe(5)
    expect(names[0]).toMatch(/^Pixel /)
  })
})

describe('currencyMargin', () => {
  test('applies FX rate and fee to cost', () => {
    const r = currencyMargin(100, 200, 2, 5)
    expect(r.adjustedCost).toBeCloseTo(52.5)
    expect(r.profit).toBeCloseTo(147.5)
  })
})
