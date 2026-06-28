import { describe, test, expect } from 'vitest'
import { shippingCost, generateSku } from './wave4-ecommerce-ext-core.js'

describe('shippingCost', () => {
  test('scales with weight and zone', () => {
    expect(shippingCost(10, 'domestic', 1, 5).cost).toBe(15)
    expect(shippingCost(10, 'international', 1, 5).cost).toBe(37.5)
  })
})

describe('generateSku', () => {
  test('formats sku code', () => {
    expect(generateSku({ prefix: 'ab', category: 'sh', sequence: 3 })).toBe('AB-SH-00003')
  })
})
