import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')
const page = read('src/pages/exercises/index.astro')
const js = read('src/tools/exercise-browser.js')

describe('exercise browser page', () => {
  test('does not inline the full dataset — it fetches the lean index', () => {
    expect(page).not.toContain("from '../../data/exercises/exercises.json'")
    expect(js).toContain('/exercises/browse-index.json')
  })

  test('reserves height on the results container to prevent CLS', () => {
    expect(page).toMatch(/min-height/)
  })

  test('uses global styles and a non-module tool script', () => {
    expect(page).toContain('<style is:global>')
    expect(page).toContain('src="../../tools/exercise-browser.js"')
    expect(page).not.toMatch(/type="module"[^>]*tools\//)
  })

  test('has a search input and the four facet groups', () => {
    expect(page).toContain('id="ex-search"')
    for (const f of ['muscle', 'equipment', 'category', 'level']) {
      expect(page).toContain(`data-facet="${f}"`)
    }
  })

  test('emits CollectionPage schema with a trailing-slash canonical', () => {
    expect(page).toContain("'@type': 'CollectionPage'")
    expect(page).toContain("canonical: 'https://maratool.com/exercises/'")
  })
})

describe('exercise-browser.js', () => {
  test('filters by search text and all four facets', () => {
    for (const f of ['muscle', 'equipment', 'category', 'level']) {
      expect(js).toContain(f)
    }
  })

  test('links results with trailing slashes', () => {
    expect(js).toMatch(/'\/exercises\/'/)
  })

  test('uses the hidden attribute rather than style.display', () => {
    expect(js).not.toMatch(/style\.display/)
  })
})
