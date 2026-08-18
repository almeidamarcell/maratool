import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MUSCLES } from './data/exercises/vocab.mjs'
import { regionsFor, ALL_REGIONS } from './data/exercises/muscle-regions.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const map = readFileSync(resolve(ROOT, 'src/components/exercises/MuscleMap.astro'), 'utf-8')

describe('muscle regions', () => {
  test('every canonical muscle maps to at least one region in some view', () => {
    for (const m of MUSCLES) {
      const total = regionsFor(m, 'front').length + regionsFor(m, 'back').length
      expect(total, `no region for muscle: ${m}`).toBeGreaterThan(0)
    }
  })

  test('back-only muscles have no front regions and vice versa', () => {
    expect(regionsFor('lats', 'back').length).toBeGreaterThan(0)
    expect(regionsFor('chest', 'front').length).toBeGreaterThan(0)
    expect(regionsFor('glutes', 'back').length).toBeGreaterThan(0)
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
