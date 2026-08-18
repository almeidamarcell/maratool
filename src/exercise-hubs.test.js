import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { byMuscle, byEquipment, byCategory, byLevel } from './data/exercises/index.ts'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('hub routes', () => {
  const routes = {
    muscle: 'src/pages/exercises/muscle/[muscle].astro',
    equipment: 'src/pages/exercises/equipment/[equipment].astro',
    category: 'src/pages/exercises/category/[category].astro',
    level: 'src/pages/exercises/level/[level].astro',
  }

  for (const [name, path] of Object.entries(routes)) {
    test(`${name} hub uses getStaticPaths and renders ExerciseHub`, () => {
      const src = read(path)
      expect(src).toContain('export function getStaticPaths')
      expect(src).toContain('<ExerciseHub')
    })

    test(`${name} hub emits CollectionPage schema and a canonical with trailing slash`, () => {
      const src = read(path)
      expect(src).toContain("'@type': 'CollectionPage'")
      expect(src).toMatch(/canonical:.*\/`/)
    })
  }

  test('hub slugs are URL-safe (spaces become dashes)', () => {
    const src = read(routes.muscle)
    expect(src).toMatch(/replace\(\/ \/g, '-'\)/)
  })

  test('muscle hubs ship an FAQ with FAQPage schema', () => {
    const src = read(routes.muscle)
    expect(src).toContain("'@type': 'FAQPage'")
    expect(src).toContain('faqSchema')
    expect(src).toContain('faqs={faqs}')
  })

  test('facet values exist in the data to generate from', () => {
    expect(Object.keys(byMuscle).length).toBeGreaterThanOrEqual(15)
    expect(Object.keys(byEquipment).length).toBeGreaterThan(5)
    expect(Object.keys(byCategory).length).toBeGreaterThanOrEqual(5)
    expect(Object.keys(byLevel).length).toBe(3)
  })
})

describe('ExerciseHub.astro', () => {
  const hub = read('src/components/exercises/ExerciseHub.astro')

  test('renders a card grid with links to exercise pages', () => {
    expect(hub).toMatch(/\/exercises\/\$\{[^}]+\}\//)
  })

  test('renders an FAQ section when faqs are passed', () => {
    expect(hub).toContain('faqs')
    expect(hub).toContain('<details>')
  })

  test('renders filter chips with counts', () => {
    expect(hub).toContain('facets')
    expect(hub).toContain('count')
  })

  test('uses global styles', () => {
    expect(hub).toContain('<style is:global>')
  })
})
