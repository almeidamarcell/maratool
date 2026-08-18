import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MUSCLES } from './data/exercises/vocab.mjs'
import { regionsFor, ALL_REGIONS, regionClasses } from './data/exercises/muscle-regions.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const map = readFileSync(resolve(ROOT, 'src/components/exercises/MuscleMap.astro'), 'utf-8')

describe('muscle regions', () => {
  test('every canonical muscle maps to at least one region in some view', () => {
    for (const m of MUSCLES) {
      const total = regionsFor(m, 'front').length + regionsFor(m, 'back').length
      expect(total, `no region for muscle: ${m}`).toBeGreaterThan(0)
    }
  })

  test('unknown muscle returns an empty region list, never throws', () => {
    expect(regionsFor('zzz', 'front')).toEqual([])
  })

  test('every region referenced by regionsFor exists in ALL_REGIONS', () => {
    for (const m of MUSCLES) {
      for (const view of ['front', 'back']) {
        for (const r of regionsFor(m, view)) expect(ALL_REGIONS).toContain(r)
      }
    }
  })
})

// Data-driven exclusivity table. Every canonical muscle is classified as
// back-only, front-only, or genuinely bilateral (distinct anterior and
// posterior bellies). This asserts BOTH halves of each claim — that the
// muscle has regions on its own view(s) AND none on the view(s) it doesn't
// belong to — so a future edit that quietly adds a muscle to the wrong
// view (like the calves-on-front bug this table was written to catch)
// fails loudly instead of sailing through on a presence-only check.
describe('single-plane exclusivity', () => {
  const BACK_ONLY = [
    'lats', 'traps', 'glutes', 'hamstrings', 'triceps',
    'middle back', 'lower back', 'abductors', 'calves',
  ]
  const FRONT_ONLY = ['chest', 'biceps', 'abdominals', 'quadriceps', 'adductors']
  const BILATERAL = ['shoulders', 'forearms', 'neck']

  test('the three groups partition the full canonical muscle vocabulary', () => {
    const all = [...BACK_ONLY, ...FRONT_ONLY, ...BILATERAL].sort()
    expect(all).toEqual([...MUSCLES].sort())
  })

  test.each(BACK_ONLY)('%s is back-only: regions on back, none on front', (m) => {
    expect(regionsFor(m, 'back').length, `${m} should have back regions`).toBeGreaterThan(0)
    expect(regionsFor(m, 'front').length, `${m} should have no front regions`).toBe(0)
  })

  test.each(FRONT_ONLY)('%s is front-only: regions on front, none on back', (m) => {
    expect(regionsFor(m, 'front').length, `${m} should have front regions`).toBeGreaterThan(0)
    expect(regionsFor(m, 'back').length, `${m} should have no back regions`).toBe(0)
  })

  test.each(BILATERAL)('%s is bilateral: regions on both front and back', (m) => {
    expect(regionsFor(m, 'front').length, `${m} should have front regions`).toBeGreaterThan(0)
    expect(regionsFor(m, 'back').length, `${m} should have back regions`).toBeGreaterThan(0)
  })
})

// The most behaviorally significant logic in MuscleMap.astro — a muscle
// listed in both `primary` and `secondary` must render as primary, not
// secondary — can't be verified by rendering the real .astro component:
// this project's vitest config has no Astro Vite plugin registered, so
// Vite can't parse `.astro` syntax (confirmed directly: importing the
// component in a vitest test throws "Failed to parse source ... invalid
// JS syntax" at the first non-HTML-ish tag). MuscleMap.astro's class
// assignment is therefore driven entirely by the exported `regionClasses`
// pure function, so exercising that function IS exercising the real
// component logic, not a reimplementation of it.
describe('regionClasses — precedence rule used by MuscleMap.astro', () => {
  test('MuscleMap.astro delegates to regionClasses rather than a hand-rolled duplicate', () => {
    expect(map).toContain('regionClasses')
  })

  test('a muscle in both primary and secondary renders as primary (mm-tgt), not secondary (mm-sec)', () => {
    const primary = ['chest']
    const secondary = ['chest', 'triceps']

    const front = regionClasses(primary, secondary, 'front')
    for (const r of regionsFor('chest', 'front')) {
      expect(front[r], `${r} should be mm-tgt (primary wins)`).toBe('mm-tgt')
    }

    const back = regionClasses(primary, secondary, 'back')
    for (const r of regionsFor('triceps', 'back')) {
      expect(back[r], `${r} should be mm-sec (secondary only)`).toBe('mm-sec')
    }
  })

  test('regions belonging to neither primary nor secondary get no class', () => {
    const front = regionClasses(['chest'], [], 'front')
    for (const r of regionsFor('quadriceps', 'front')) {
      expect(front[r]).toBeUndefined()
    }
  })
})

describe('MuscleMap.astro', () => {
  test('renders every region id declared in ALL_REGIONS', () => {
    for (const r of ALL_REGIONS) {
      expect(map, `MuscleMap is missing region: ${r}`).toContain(`data-region="${r}"`)
    }
  })

  test('uses global styles, not scoped', () => {
    expect(map).toContain('<style is:global>')
  })

  test('uses design-system colors for primary and secondary', () => {
    expect(map).toContain('#c4553a')
    expect(map).toContain('#e8b9ac')
  })

  test('is accessible — role=img with a muscles-worked label', () => {
    expect(map).toContain('role="img"')
    expect(map).toMatch(/aria-label/)
  })
})
