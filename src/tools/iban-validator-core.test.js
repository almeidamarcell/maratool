import { describe, it, expect } from 'vitest'
import { validateIban } from './iban-validator-core.js'

describe('validateIban', () => {
  it('validates a known good IBAN', () => {
    var r = validateIban('GB82 WEST 1234 5698 7654 32')
    expect(r.valid).toBe(true)
    expect(r.formatted).toContain('GB82')
  })

  it('rejects invalid check digits', () => {
    var r = validateIban('GB00 WEST 1234 5698 7654 32')
    expect(r.valid).toBe(false)
  })

  it('rejects too short input', () => {
    expect(validateIban('GB82').valid).toBe(false)
  })
})
