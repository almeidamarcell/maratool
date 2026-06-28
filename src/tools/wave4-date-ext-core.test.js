import { describe, test, expect } from 'vitest'
import { businessDaysBetween, addBusinessDays, workingHours, countdownTo } from './wave4-date-ext-core.js'

describe('businessDaysBetween', () => {
  test('excludes weekends', () => {
    const r = businessDaysBetween('2026-06-01', '2026-06-07', [])
    expect(r.businessDays).toBe(5)
  })
})

describe('addBusinessDays', () => {
  test('skips weekend', () => {
    const r = addBusinessDays('2026-06-05', 1, [])
    expect(r.resultDate).toBe('2026-06-08')
  })
})

describe('workingHours', () => {
  test('subtracts break', () => {
    expect(workingHours('09:00', '17:00', 60).hours).toBe(7)
  })
})

describe('countdownTo', () => {
  test('returns parts for future date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 2)
    const r = countdownTo(future.toISOString().slice(0, 10))
    expect(r.past).toBe(false)
    expect(r.days).toBeGreaterThanOrEqual(1)
  })
})
