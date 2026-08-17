import { describe, test, expect } from 'vitest'
import { normalizeMuscle, normalizeEquipment, MUSCLES, EQUIPMENT } from './data/exercises/vocab.mjs'

describe('normalizeMuscle', () => {
  test('passes through canonical free-db muscles unchanged', () => {
    for (const m of ['chest', 'biceps', 'triceps', 'lats', 'quadriceps', 'hamstrings', 'calves', 'abdominals', 'shoulders', 'forearms', 'glutes', 'traps', 'lower back', 'middle back', 'neck', 'abductors', 'adductors']) {
      expect(normalizeMuscle(m)).toBe(m)
    }
  })

  test('maps Everkinetic variants onto canonical muscles', () => {
    expect(normalizeMuscle('gluts')).toBe('glutes')
    expect(normalizeMuscle('hamstring')).toBe('hamstrings')
    expect(normalizeMuscle('trapezius')).toBe('traps')
    expect(normalizeMuscle('rear deltoid')).toBe('shoulders')
    expect(normalizeMuscle('posterior deltoid')).toBe('shoulders')
    expect(normalizeMuscle('lateral deltoid')).toBe('shoulders')
    expect(normalizeMuscle('obliques')).toBe('abdominals')
    expect(normalizeMuscle('lower abdominals')).toBe('abdominals')
    expect(normalizeMuscle('core')).toBe('abdominals')
    expect(normalizeMuscle('neck extensors')).toBe('neck')
    expect(normalizeMuscle('neck flexors')).toBe('neck')
    expect(normalizeMuscle('neck side flexors')).toBe('neck')
    expect(normalizeMuscle('back')).toBe('middle back')
    expect(normalizeMuscle('arms')).toBe('biceps')
  })

  test('is case- and whitespace-insensitive', () => {
    expect(normalizeMuscle('  Gluts ')).toBe('glutes')
    expect(normalizeMuscle('TRAPEZIUS')).toBe('traps')
  })

  test('returns null for unknown input rather than inventing a muscle', () => {
    expect(normalizeMuscle('zzz')).toBe(null)
    expect(normalizeMuscle('')).toBe(null)
    expect(normalizeMuscle(undefined)).toBe(null)
  })

  test('every canonical muscle is listed in MUSCLES', () => {
    expect(MUSCLES).toHaveLength(17)
    expect(MUSCLES).toContain('glutes')
    expect(new Set(MUSCLES).size).toBe(MUSCLES.length)
  })
})

describe('normalizeEquipment', () => {
  test('collapses plural and machine variants', () => {
    expect(normalizeEquipment('dumbbells')).toBe('dumbbell')
    expect(normalizeEquipment('kettlebells')).toBe('kettlebell')
    expect(normalizeEquipment('cable machine')).toBe('cable')
    expect(normalizeEquipment('body')).toBe('body only')
    expect(normalizeEquipment('bands')).toBe('band')
    expect(normalizeEquipment('exercise band')).toBe('band')
  })

  test('collapses bench variants to bench', () => {
    expect(normalizeEquipment('flat bench')).toBe('bench')
    expect(normalizeEquipment('incline bench')).toBe('bench')
    expect(normalizeEquipment('decline bench')).toBe('bench')
  })

  test('passes through canonical values', () => {
    expect(normalizeEquipment('barbell')).toBe('barbell')
    expect(normalizeEquipment('smith machine')).toBe('smith machine')
  })

  test('unknown equipment falls back to "other"', () => {
    expect(normalizeEquipment('zzz')).toBe('other')
    expect(normalizeEquipment(undefined)).toBe('other')
  })

  test('every value normalizeEquipment can return is in EQUIPMENT', () => {
    for (const v of ['dumbbell', 'barbell', 'cable', 'body only', 'bench', 'band', 'other']) {
      expect(EQUIPMENT).toContain(v)
    }
  })
})
