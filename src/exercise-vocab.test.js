import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { normalizeMuscle, normalizeEquipment, MUSCLES, EQUIPMENT } from './data/exercises/vocab.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

  test('prevents prototype pollution from malicious keys', () => {
    expect(normalizeEquipment('constructor')).toBe('other')
    expect(normalizeEquipment('__proto__')).toBe('other')
    expect(normalizeEquipment('prototype')).toBe('other')
  })
})

describe('Completeness: muscles from vendored data', () => {
  test('every distinct muscle string from both datasets normalizes to a canonical value', () => {
    const everk = JSON.parse(readFileSync(join(__dirname, 'data/exercises/everkinetic.raw.json'), 'utf-8'))
    const freedb = JSON.parse(readFileSync(join(__dirname, 'data/exercises/free-exercise-db.raw.json'), 'utf-8'))

    const allMuscles = new Set()

    // Extract from Everkinetic
    everk.forEach(ex => {
      if (ex.primary) {
        ex.primary.split(',').forEach(m => allMuscles.add(m.trim().toLowerCase()))
      }
      if (Array.isArray(ex.secondary)) {
        ex.secondary.forEach(m => allMuscles.add(m.trim().toLowerCase()))
      }
    })

    // Extract from free-exercise-db
    freedb.forEach(ex => {
      if (Array.isArray(ex.primaryMuscles)) {
        ex.primaryMuscles.forEach(m => allMuscles.add(m.trim().toLowerCase()))
      }
      if (Array.isArray(ex.secondaryMuscles)) {
        ex.secondaryMuscles.forEach(m => allMuscles.add(m.trim().toLowerCase()))
      }
    })

    const failures = []
    allMuscles.forEach(muscle => {
      const normalized = normalizeMuscle(muscle)
      if (normalized === null) {
        failures.push(muscle)
      }
    })

    if (failures.length > 0) {
      expect.fail(`These muscles from vendored data normalize to null: ${failures.join(', ')}`)
    }
  })
})

describe('Completeness: equipment from vendored data', () => {
  test('every distinct equipment string from both datasets normalizes to a canonical value', () => {
    const everk = JSON.parse(readFileSync(join(__dirname, 'data/exercises/everkinetic.raw.json'), 'utf-8'))
    const freedb = JSON.parse(readFileSync(join(__dirname, 'data/exercises/free-exercise-db.raw.json'), 'utf-8'))

    const allEquipment = new Set()

    // Extract from Everkinetic (equipment is an array)
    everk.forEach(ex => {
      if (Array.isArray(ex.equipment)) {
        ex.equipment.forEach(e => allEquipment.add(e.trim().toLowerCase()))
      }
    })

    // Extract from free-exercise-db (equipment is a string)
    freedb.forEach(ex => {
      if (typeof ex.equipment === 'string' && ex.equipment) {
        allEquipment.add(ex.equipment.trim().toLowerCase())
      }
    })

    const failures = []
    allEquipment.forEach(equipment => {
      const normalized = normalizeEquipment(equipment)
      // Equipment should normalize to a canonical value (including 'other'), never stay as unknown
      if (!EQUIPMENT.includes(normalized)) {
        failures.push(`${equipment} → ${normalized} (not in EQUIPMENT)`)
      }
    })

    if (failures.length > 0) {
      expect.fail(`These equipment values fail: ${failures.join(', ')}`)
    }
  })
})

describe('Prototype pollution regression', () => {
  test('normalizeMuscle returns null for prototype-pollution keys', () => {
    expect(normalizeMuscle('constructor')).toBe(null)
    expect(normalizeMuscle('__proto__')).toBe(null)
    expect(normalizeMuscle('prototype')).toBe(null)
    expect(normalizeMuscle('hasOwnProperty')).toBe(null)
  })

  test('normalizeEquipment returns "other" for prototype-pollution keys', () => {
    expect(normalizeEquipment('constructor')).toBe('other')
    expect(normalizeEquipment('__proto__')).toBe('other')
    expect(normalizeEquipment('prototype')).toBe('other')
    expect(normalizeEquipment('hasOwnProperty')).toBe('other')
  })
})
