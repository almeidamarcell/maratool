import { describe, it, expect } from 'vitest'
import { sumScore, interpretBand, scoreAndInterpret } from './score-engine.js'

describe('sumScore', () => {
  it('sums integer point values', () => {
    expect(sumScore({ a: 2, b: 1, c: 0 })).toBe(3)
  })
  it('coerces numeric strings (HTML select values are strings)', () => {
    expect(sumScore({ a: '2', b: '1' })).toBe(3)
  })
  it('returns null if any value is missing', () => {
    expect(sumScore({ a: 2, b: null })).toBeNull()
    expect(sumScore({ a: 2, b: undefined })).toBeNull()
    expect(sumScore({ a: 2, b: '' })).toBeNull()
  })
  it('returns null if any value is non-numeric', () => {
    expect(sumScore({ a: 2, b: 'foo' })).toBeNull()
  })
  it('handles negative values (RASS-style scales: −5 to +4)', () => {
    expect(sumScore({ rass: -3 })).toBe(-3)
  })
})

describe('interpretBand', () => {
  const bands = [
    { min: 0, max: 1, label: 'Low', cls: 'cls-normal' },
    { min: 2, max: 4, label: 'Moderate', cls: 'cls-warn' },
    { min: 5, label: 'High', cls: 'cls-danger' }, // open-ended
  ]
  it('classifies the lowest band', () => {
    expect(interpretBand(0, bands)).toEqual({ label: 'Low', cls: 'cls-normal' })
    expect(interpretBand(1, bands)).toEqual({ label: 'Low', cls: 'cls-normal' })
  })
  it('classifies the middle band', () => {
    expect(interpretBand(3, bands)).toEqual({ label: 'Moderate', cls: 'cls-warn' })
  })
  it('classifies the open-ended top band', () => {
    expect(interpretBand(99, bands)).toEqual({ label: 'High', cls: 'cls-danger' })
  })
  it('returns null for null/undefined score', () => {
    expect(interpretBand(null, bands)).toBeNull()
    expect(interpretBand(undefined, bands)).toBeNull()
  })
  it('returns null if no band matches', () => {
    expect(interpretBand(-1, bands)).toBeNull()
  })
  it('defaults cls to empty string when not provided', () => {
    expect(interpretBand(0, [{ min: 0, label: 'X' }])).toEqual({ label: 'X', cls: '' })
  })
})

describe('scoreAndInterpret', () => {
  const bands = [
    { min: 0, max: 1, label: 'Low' },
    { min: 2, label: 'High' },
  ]
  it('returns score + interpretation', () => {
    expect(scoreAndInterpret({ a: 1, b: 2 }, bands)).toEqual({
      score: 3,
      interpretation: { label: 'High', cls: '' },
    })
  })
  it('returns null when inputs are incomplete', () => {
    expect(scoreAndInterpret({ a: 1, b: null }, bands)).toBeNull()
  })
})
