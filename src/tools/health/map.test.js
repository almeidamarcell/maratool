import { describe, test, expect } from 'vitest'
import { calculateMAP, classifyMAP } from './map.js'

describe('calculateMAP — (SBP + 2*DBP) / 3', () => {
  test('120/80 → 93', () => {
    expect(calculateMAP(120, 80)).toBe(93)
  })
  test('140/90 → 107', () => {
    expect(calculateMAP(140, 90)).toBe(107)
  })
  test('90/60 → 70', () => {
    expect(calculateMAP(90, 60)).toBe(70)
  })
  test('returns null when SBP < DBP', () => {
    expect(calculateMAP(80, 90)).toBe(null)
  })
  test('returns null when SBP is 0', () => {
    expect(calculateMAP(0, 80)).toBe(null)
  })
  test('returns null when DBP is 0', () => {
    expect(calculateMAP(120, 0)).toBe(null)
  })
})

describe('classifyMAP — perfusion threshold', () => {
  test('< 65 → Hypotension (inadequate perfusion)', () => {
    expect(classifyMAP(50)).toBe('Hypotension (inadequate perfusion)')
    expect(classifyMAP(64)).toBe('Hypotension (inadequate perfusion)')
  })
  test('65–110 → Adequate perfusion', () => {
    expect(classifyMAP(65)).toBe('Adequate perfusion')
    expect(classifyMAP(93)).toBe('Adequate perfusion')
    expect(classifyMAP(110)).toBe('Adequate perfusion')
  })
  test('> 110 → Elevated', () => {
    expect(classifyMAP(111)).toBe('Elevated')
    expect(classifyMAP(130)).toBe('Elevated')
  })
  test('returns null for null input', () => {
    expect(classifyMAP(null)).toBe(null)
  })
})
