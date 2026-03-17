import { describe, it, expect } from 'vitest'
import { getCharSets, generatePassword, calculateStrength } from './password-generator-core.js'

describe('getCharSets', () => {
  it('upper only returns only uppercase letters', () => {
    var set = getCharSets({ upper: true, lower: false, digits: false, symbols: false })
    expect(/^[A-Z]+$/.test(set)).toBe(true)
  })

  it('lower only returns only lowercase letters', () => {
    var set = getCharSets({ upper: false, lower: true, digits: false, symbols: false })
    expect(/^[a-z]+$/.test(set)).toBe(true)
  })

  it('digits only returns only digits', () => {
    var set = getCharSets({ upper: false, lower: false, digits: true, symbols: false })
    expect(/^[0-9]+$/.test(set)).toBe(true)
  })

  it('all options includes all char types', () => {
    var set = getCharSets({ upper: true, lower: true, digits: true, symbols: true })
    expect(/[A-Z]/.test(set)).toBe(true)
    expect(/[a-z]/.test(set)).toBe(true)
    expect(/[0-9]/.test(set)).toBe(true)
    expect(set.length).toBeGreaterThan(60)
  })

  it('excludeAmbiguous removes 0, O, I, l', () => {
    var set = getCharSets({ upper: true, lower: true, digits: true, symbols: false, excludeAmbiguous: true })
    expect(set).not.toContain('0')
    expect(set).not.toContain('O')
    expect(set).not.toContain('I')
    expect(set).not.toContain('l')
  })

  it('returns empty string when no options selected', () => {
    var set = getCharSets({ upper: false, lower: false, digits: false, symbols: false })
    expect(set).toBe('')
  })
})

describe('generatePassword', () => {
  it('returns string of exact requested length', () => {
    var charSets = 'abcdefghijklmnopqrstuvwxyz'
    expect(generatePassword(16, charSets).length).toBe(16)
    expect(generatePassword(8, charSets).length).toBe(8)
    expect(generatePassword(64, charSets).length).toBe(64)
  })

  it('returns only chars from provided set', () => {
    var charSets = 'abc'
    var pwd = generatePassword(100, charSets)
    for (var i = 0; i < pwd.length; i++) {
      expect('abc').toContain(pwd[i])
    }
  })

  it('returns empty string when charSets is empty', () => {
    expect(generatePassword(16, '')).toBe('')
  })

  it('different calls return different values (probabilistic)', () => {
    var charSets = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var a = generatePassword(20, charSets)
    var b = generatePassword(20, charSets)
    var c = generatePassword(20, charSets)
    // Extremely unlikely all three are identical
    expect(a === b && b === c).toBe(false)
  })
})

describe('calculateStrength', () => {
  it('very short password with only lowercase → Weak', () => {
    var result = calculateStrength('abc')
    expect(result.score).toBe(0)
    expect(result.label).toBe('Weak')
  })

  it('password with all char types and length 16 → Strong', () => {
    var result = calculateStrength('Password1!Xy2@ab')
    expect(result.score).toBe(4)
    expect(result.label).toBe('Strong')
  })

  it('lowercase only 8 chars → Weak', () => {
    var result = calculateStrength('password')
    expect(result.score).toBeLessThanOrEqual(1)
  })

  it('length < 12 fails length check', () => {
    var result = calculateStrength('Pass1!')
    expect(result.score).toBeLessThan(4)
  })

  it('length >= 12 with all char types → Strong', () => {
    var result = calculateStrength('Passw0rd!xYz')
    expect(result.score).toBe(4)
    expect(result.label).toBe('Strong')
  })

  it('returns numeric score 0-4', () => {
    var result = calculateStrength('anystring')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(4)
  })
})
