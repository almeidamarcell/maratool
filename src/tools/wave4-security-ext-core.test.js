import { describe, test, expect } from 'vitest'
import {
  compareHashes,
  decodePem,
  buildCsrSubject,
  parseCertificateValidity,
} from './wave4-security-ext-core.js'

describe('compareHashes', () => {
  test('matches case-insensitively', () => {
    expect(compareHashes('ABC', 'abc').match).toBe(true)
  })
})

describe('decodePem', () => {
  test('extracts PEM blocks', () => {
    const blocks = decodePem('-----BEGIN TEST-----\nQUJD\n-----END TEST-----')
    expect(blocks[0].type).toBe('TEST')
    expect(blocks[0].binaryLength).toBe(3)
  })
})

describe('buildCsrSubject', () => {
  test('orders DN fields', () => {
    expect(buildCsrSubject({ C: 'US', CN: 'example.com' })).toBe('CN=example.com, C=US')
  })
})

describe('parseCertificateValidity', () => {
  test('returns null when no UTCTime found', () => {
    const r = parseCertificateValidity(new Uint8Array([1, 2, 3]))
    expect(r.notBefore).toBeNull()
  })
})
