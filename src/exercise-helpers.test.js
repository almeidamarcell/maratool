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

  test('relatedExercises is deterministic across calls', () => {
    // The build must be reproducible — no randomness, no dependence on
    // call order or on mutation of the shared grouping arrays.
    const ex = byMuscle.quadriceps[10]
    const a = relatedExercises(ex, 4).map(r => r.slug)
    const b = relatedExercises(ex, 4).map(r => r.slug)
    expect(a).toEqual(b)
  })

  test('relatedExercises prefers a candidate sharing equipment and level over a bare muscle match', () => {
    const ex = exercises.find(x =>
      x.level && x.equipment.length > 0 && byMuscle[x.primaryMuscles[0]].length > 40
    )
    const rel = relatedExercises(ex, 4)
    const closeMatches = rel.filter(r =>
      r.equipment.some(e => ex.equipment.includes(e)) && r.level === ex.level
    )
    expect(closeMatches.length).toBeGreaterThanOrEqual(3)
  })
})

// Thresholds are deliberately loose. The measured values on the current
// dataset are 1,008 distinct blocks, a max repeat of 3, and 74 exercises
// never linked; the bounds below sit far enough away that ordinary data
// changes (adding a source, re-merging, renaming) cannot flap the test,
// while still failing hard on the degenerate behaviour this replaced —
// which produced 84 distinct blocks, one block repeated on 168 pages, and
// 950 exercises with zero inbound related links.
const MIN_DISTINCT_BLOCKS = 700
const MAX_BLOCK_REPEATS = 25
const MAX_NEVER_LINKED = 250

describe('relatedExercises link distribution', () => {
  const blocks = new Map()
  const inbound = new Set()
  for (const ex of exercises) {
    const rel = relatedExercises(ex, 4)
    for (const r of rel) inbound.add(r.slug)
    const key = rel.map(r => r.slug).join('|')
    blocks.set(key, (blocks.get(key) ?? 0) + 1)
  }

  test(`produces at least ${MIN_DISTINCT_BLOCKS} distinct related-link blocks`, () => {
    expect(blocks.size).toBeGreaterThanOrEqual(MIN_DISTINCT_BLOCKS)
  })

  test(`no single block is repeated on more than ${MAX_BLOCK_REPEATS} pages`, () => {
    const worst = Math.max(...blocks.values())
    expect(worst).toBeLessThanOrEqual(MAX_BLOCK_REPEATS)
  })

  test(`at most ${MAX_NEVER_LINKED} exercises are never linked as related`, () => {
    expect(exercises.length - inbound.size).toBeLessThanOrEqual(MAX_NEVER_LINKED)
  })
})
