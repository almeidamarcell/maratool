import { describe, it, expect } from 'vitest'
import { luhnCheck } from './luhn-checker-core.js'

describe('luhnCheck', () => {
  it('validates Visa test number', () => {
    expect(luhnCheck('4111111111111111').valid).toBe(true)
  })

  it('rejects invalid check digit', () => {
    expect(luhnCheck('4111111111111112').valid).toBe(false)
  })

  it('strips spaces and dashes', () => {
    expect(luhnCheck('4111 1111 1111 1111').valid).toBe(true)
  })
})
