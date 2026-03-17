import { describe, it, expect } from 'vitest'
import { generateApiKey, validateApiKeyOptions } from './api-key-generator-core.js'

describe('validateApiKeyOptions', () => {
  it('accepts valid hex options', () => {
    const result = validateApiKeyOptions({ format: 'hex', length: 32 })
    expect(result.valid).toBe(true)
  })

  it('accepts valid base64 options', () => {
    const result = validateApiKeyOptions({ format: 'base64', length: 24 })
    expect(result.valid).toBe(true)
  })

  it('accepts valid alphanumeric options', () => {
    const result = validateApiKeyOptions({ format: 'alphanumeric', length: 32 })
    expect(result.valid).toBe(true)
  })

  it('rejects unknown format', () => {
    const result = validateApiKeyOptions({ format: 'binary', length: 32 })
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects length below 8', () => {
    const result = validateApiKeyOptions({ format: 'hex', length: 4 })
    expect(result.valid).toBe(false)
  })

  it('rejects length above 128', () => {
    const result = validateApiKeyOptions({ format: 'hex', length: 200 })
    expect(result.valid).toBe(false)
  })
})

describe('generateApiKey', () => {
  it('generates a hex key of the correct character length', () => {
    const key = generateApiKey({ format: 'hex', length: 32 })
    expect(key).toMatch(/^[0-9a-f]+$/)
    expect(key.length).toBe(64) // 32 bytes = 64 hex chars
  })

  it('generates an alphanumeric key of the correct length', () => {
    const key = generateApiKey({ format: 'alphanumeric', length: 32 })
    expect(key).toMatch(/^[A-Za-z0-9]+$/)
    expect(key.length).toBe(32)
  })

  it('generates a base64url key', () => {
    const key = generateApiKey({ format: 'base64', length: 24 })
    // base64url uses A-Z a-z 0-9 - _
    expect(key).toMatch(/^[A-Za-z0-9\-_=]+$/)
  })

  it('generates different keys on consecutive calls', () => {
    const a = generateApiKey({ format: 'hex', length: 16 })
    const b = generateApiKey({ format: 'hex', length: 16 })
    const c = generateApiKey({ format: 'hex', length: 16 })
    const unique = new Set([a, b, c])
    expect(unique.size).toBe(3)
  })

  it('generates multiple keys as an array', () => {
    const keys = Array.from({ length: 5 }, () => generateApiKey({ format: 'hex', length: 16 }))
    expect(keys).toHaveLength(5)
    keys.forEach(k => expect(k).toMatch(/^[0-9a-f]+$/))
  })
})
