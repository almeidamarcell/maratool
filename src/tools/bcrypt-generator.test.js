import { describe, it, expect } from 'vitest'
import { validateCostFactor, hashPassword, verifyPassword } from './bcrypt-generator-core.js'

describe('validateCostFactor', () => {
  it('4 is valid', () => {
    expect(validateCostFactor(4)).toEqual({ valid: true })
  })

  it('12 is valid', () => {
    expect(validateCostFactor(12)).toEqual({ valid: true })
  })

  it('8 is valid', () => {
    expect(validateCostFactor(8)).toEqual({ valid: true })
  })

  it('3 is invalid (too low)', () => {
    var result = validateCostFactor(3)
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('13 is invalid (too high)', () => {
    var result = validateCostFactor(13)
    expect(result.valid).toBe(false)
  })

  it('non-integer string is invalid', () => {
    var result = validateCostFactor('abc')
    expect(result.valid).toBe(false)
  })

  it('null is invalid', () => {
    var result = validateCostFactor(null)
    expect(result.valid).toBe(false)
  })
})

describe('hashPassword and verifyPassword (mock bcrypt)', () => {
  // Mock bcrypt that just encodes predictably
  var mockBcrypt = {
    hash: function (password, rounds) {
      return Promise.resolve('$2b$' + rounds + '$MOCK_SALT_' + password)
    },
    compare: function (password, hash) {
      return Promise.resolve(hash === '$2b$10$MOCK_SALT_' + password)
    }
  }

  it('hashPassword resolves to a string', async () => {
    var result = await hashPassword('secret', 10, mockBcrypt)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('hashPassword includes the rounds in output', async () => {
    var result = await hashPassword('secret', 10, mockBcrypt)
    expect(result).toContain('10')
  })

  it('verifyPassword resolves true for matching pair', async () => {
    var hash = await hashPassword('mypassword', 10, mockBcrypt)
    var result = await verifyPassword('mypassword', hash, mockBcrypt)
    expect(result).toBe(true)
  })

  it('verifyPassword resolves false for non-matching password', async () => {
    var hash = await hashPassword('mypassword', 10, mockBcrypt)
    var result = await verifyPassword('wrongpassword', hash, mockBcrypt)
    expect(result).toBe(false)
  })
})
