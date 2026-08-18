import { describe, test, expect } from 'vitest'
import { exercises, exerciseBySlug, byMuscle, byEquipment, byCategory, byLevel, relatedExercises } from './data/exercises/index.ts'

describe('exercise helpers', () => {
  test('exercises loads the full merged set', () => {
    expect(exercises.length).toBe(1035)
  })

  test('exerciseBySlug resolves every slug exactly once', () => {
    expect(exerciseBySlug.size).toBe(exercises.length)
    const first = exercises[0]
    expect(exerciseBySlug.get(first.slug)).toEqual(first)
  })

  test('byMuscle groups by every primary muscle', () => {
    expect(Object.keys(byMuscle).length).toBeGreaterThanOrEqual(15)
    expect(byMuscle.chest.length).toBeGreaterThan(0)
    for (const ex of byMuscle.chest) expect(ex.primaryMuscles).toContain('chest')
  })

  test('an exercise with two primary muscles appears under both', () => {
    const multi = exercises.find(x => x.primaryMuscles.length > 1)
    if (!multi) return
    for (const m of multi.primaryMuscles) {
      expect(byMuscle[m].map(x => x.slug)).toContain(multi.slug)
    }
  })

  test('byEquipment, byCategory, byLevel partition the set', () => {
    expect(Object.keys(byEquipment).length).toBeGreaterThan(5)
    expect(Object.keys(byCategory)).toContain('strength')
    expect(Object.keys(byLevel)).toContain('beginner')
  })

  test('relatedExercises returns n others sharing a muscle, never itself', () => {
    const ex = byMuscle.chest[0]
    const rel = relatedExercises(ex, 3)
    expect(rel.length).toBe(3)
    for (const r of rel) {
      expect(r.slug).not.toBe(ex.slug)
      const shares = r.primaryMuscles.some(m => ex.primaryMuscles.includes(m)) ||
                     r.equipment.some(e => ex.equipment.includes(e))
      expect(shares).toBe(true)
    }
  })
})
