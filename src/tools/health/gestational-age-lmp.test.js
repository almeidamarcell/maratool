import { describe, test, expect } from 'vitest'
import { gestationalAgeFromLMP } from './gestational-age-lmp.js'

// Reference: Naegele rule. EDD = LMP + 280 days. GA on a given date = (date − LMP) in days.
// Function signature: gestationalAgeFromLMP({ lmp, reference }) where both are 'YYYY-MM-DD'.
// Returns { weeks, days, totalDays, edd } or null on invalid input.

describe('gestationalAgeFromLMP', () => {
  test('LMP 2026-01-01, reference 2026-04-09 (98 days) → 14 weeks 0 days', () => {
    const r = gestationalAgeFromLMP({ lmp: '2026-01-01', reference: '2026-04-09' })
    expect(r.totalDays).toBe(98)
    expect(r.weeks).toBe(14)
    expect(r.days).toBe(0)
  })

  test('LMP 2026-01-01 → EDD 2026-10-08 (LMP + 280 days)', () => {
    const r = gestationalAgeFromLMP({ lmp: '2026-01-01', reference: '2026-04-09' })
    expect(r.edd).toBe('2026-10-08')
  })

  test('LMP and reference same date → 0 weeks 0 days', () => {
    const r = gestationalAgeFromLMP({ lmp: '2026-01-01', reference: '2026-01-01' })
    expect(r.totalDays).toBe(0)
    expect(r.weeks).toBe(0)
    expect(r.days).toBe(0)
  })

  test('LMP 2026-01-01, reference 2026-01-15 → 2 weeks 0 days', () => {
    const r = gestationalAgeFromLMP({ lmp: '2026-01-01', reference: '2026-01-15' })
    expect(r.weeks).toBe(2)
    expect(r.days).toBe(0)
  })

  test('LMP 2026-01-01, reference 2026-01-10 → 1 week 2 days', () => {
    const r = gestationalAgeFromLMP({ lmp: '2026-01-01', reference: '2026-01-10' })
    expect(r.weeks).toBe(1)
    expect(r.days).toBe(2)
  })

  test('returns null if reference is before LMP', () => {
    expect(gestationalAgeFromLMP({ lmp: '2026-01-15', reference: '2026-01-01' })).toBe(null)
  })

  test('returns null on invalid LMP', () => {
    expect(gestationalAgeFromLMP({ lmp: 'not-a-date', reference: '2026-01-01' })).toBe(null)
  })

  test('returns null on empty input', () => {
    expect(gestationalAgeFromLMP({ lmp: '', reference: '2026-01-01' })).toBe(null)
  })
})
