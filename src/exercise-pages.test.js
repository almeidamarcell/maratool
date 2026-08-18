import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exercises, exerciseMetaDescription, MAX_META_DESCRIPTION } from './data/exercises/index.ts'

const ROOT = resolve(import.meta.dirname, '..')
const page = readFileSync(resolve(ROOT, 'src/pages/exercises/[slug].astro'), 'utf-8')

describe('exercise detail page', () => {
  test('generates one path per exercise via getStaticPaths', () => {
    expect(page).toContain('export function getStaticPaths')
    expect(page).toMatch(/exercises\.map/)
  })

  test('renders the media viewer and the muscle map', () => {
    expect(page).toContain('<ExerciseMedia')
    expect(page).toContain('<MuscleMap')
  })

  test('emits HowTo schema built from the instruction steps', () => {
    expect(page).toContain("'@type': 'HowTo'")
    expect(page).toContain('HowToStep')
  })

  test('renders the license attribution required by CC BY-SA', () => {
    expect(page).toContain('attribution')
    expect(page).toContain('creativecommons.org/licenses/by-sa/4.0')
  })

  test('links related exercises with trailing slashes', () => {
    expect(page).toContain('relatedExercises')
    expect(page).toMatch(/\/exercises\/\$\{[^}]+\}\//)
  })

  test('canonical URL uses a trailing slash', () => {
    expect(page).toMatch(/canonical:\s*`https:\/\/maratool\.com\/exercises\/\$\{[^}]+\}\/`/)
  })

  test('the dataset it renders is non-trivial', () => {
    expect(exercises.length).toBe(1035)
  })

  test('renders mechanic as a single value, never a comma-joined pill', () => {
    for (const ex of exercises) {
      if (ex.mechanic === null) continue
      expect(ex.mechanic).not.toContain(',')
    }
  })
})

describe('exercise meta descriptions', () => {
  const all = exercises.map(exerciseMetaDescription)

  test('never exceed the meta description budget', () => {
    for (const d of all) expect(d.length).toBeLessThanOrEqual(MAX_META_DESCRIPTION)
  })

  test('never truncate mid-word — every one ends on a complete sentence', () => {
    // Regression: `.slice(0, 158)` produced endings like
    // "…and equipment (Dumbbell). Free e" on 57 pages.
    for (const d of all) {
      expect(d.endsWith('.')).toBe(true)
      expect(d).not.toMatch(/\s(Fre|Free e|e)$/)
    }
  })

  test('are long enough to be useful', () => {
    for (const d of all) expect(d.length).toBeGreaterThan(100)
  })

  test('a pathologically long name still yields a clean, clamped sentence', () => {
    const monster = {
      ...exercises[0],
      name: 'Standing '.repeat(40) + 'Press',
      primaryMuscles: ['shoulders'],
      equipment: ['barbell'],
    }
    const d = exerciseMetaDescription(monster)
    expect(d.length).toBeLessThanOrEqual(MAX_META_DESCRIPTION)
    expect(d.endsWith('.')).toBe(true)
    expect(d).not.toMatch(/\w-$/)
  })
})
