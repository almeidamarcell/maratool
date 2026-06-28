import { describe, it, expect } from 'vitest'
import { identifyHash } from './hash-identifier-core.js'

describe('identifyHash', () => {
  it('identifies MD5 hex', () => {
    expect(identifyHash('5d41402abc4b2a76b9719d911017c592').type).toBe('MD5')
  })

  it('identifies SHA-256 hex', () => {
    var sha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    expect(identifyHash(sha).type).toBe('SHA-256')
  })

  it('identifies bcrypt', () => {
    expect(identifyHash('$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy').type).toBe('bcrypt')
  })

  it('returns unknown for short strings', () => {
    expect(identifyHash('hello world').type).toBe('unknown')
  })
})
