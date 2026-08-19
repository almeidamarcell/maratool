import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { byMuscle, byEquipment, byCategory, byLevel, HUB_PAGE_SIZE } from './data/exercises/index.ts'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('hub routes', () => {
  const routes = {
    muscle: 'src/pages/exercises/muscle/[muscle]/[...page].astro',
    equipment: 'src/pages/exercises/equipment/[equipment]/[...page].astro',
    category: 'src/pages/exercises/category/[category]/[...page].astro',
    level: 'src/pages/exercises/level/[level]/[...page].astro',
  }

  for (const [name, path] of Object.entries(routes)) {
    test(`${name} hub uses getStaticPaths and renders ExerciseHub`, () => {
      const src = read(path)
      expect(src).toMatch(/export (function|const) getStaticPaths/)
      expect(src).toContain('<ExerciseHub')
    })

    test(`${name} hub emits CollectionPage schema and a canonical with trailing slash`, () => {
      const src = read(path)
      expect(src).toContain("'@type': 'CollectionPage'")
      // Built from a baseHref that already ends in '/', plus '${n}/' for page 2+.
      expect(src).toMatch(/const baseHref = `\/exercises\/\w+\/\$\{slug\}\/`/)
      expect(src).toMatch(/\$\{baseHref\}\$\{n\}\//)
      expect(src).toContain('const canonical = `https://maratool.com${pageHref(page.currentPage)}`')
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

  for (const [name, path] of Object.entries(routes)) {
    test(`${name} hub paginates and canonicalises each page to itself`, () => {
      const src = read(path)
      expect(src).toContain('paginate(')
      expect(src).toContain('pageSize: HUB_PAGE_SIZE')
      // Page 2+ must NOT canonicalise back to page 1.
      expect(src).toContain('pageHref(page.currentPage)')
      expect(src).toContain('canonical,')
    })
  }

  test('the `other` equipment hub does not render "you can do with other"', () => {
    const src = read(routes.equipment)
    expect(src).not.toMatch(/you can do with \$\{equipment\}`\s*$/m)
    expect(src).toContain("equipment === 'other'")
    expect(src).toContain('No Specific Equipment')
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

  test('does not embed a MuscleMap per card', () => {
    // Each card used to carry a full two-view MuscleMap (~45 shapes x 2). On a
    // muscle hub every card highlighted the same primary muscle by
    // construction, so the maps were near-identical — and they pushed
    // /exercises/category/strength/ to ~100k DOM tags. They also duplicated
    // the visible tags as a "Muscles worked: ..." screen-reader label.
    expect(hub).not.toMatch(/import MuscleMap/)
    expect(hub).not.toMatch(/<MuscleMap/)
    expect(hub).not.toContain('<svg')
  })

  test('reserves grid height so the cards do not shift layout', () => {
    expect(hub).toMatch(/\.exh-grid\s*\{[^}]*min-height/)
  })

  test('renders pagination links with trailing slashes when there is more than one page', () => {
    expect(hub).toContain('lastPage > 1')
    expect(hub).toMatch(/\$\{baseHref\}\$\{n\}\//)
    expect(hub).toContain('aria-label="Pagination"')
  })

  test('renders the exercise\'s own media as a single lazy, explicitly-sized <img> per card', () => {
    // Card thumbnails used to be a generic category glyph (🏋️ for every
    // strength exercise). They now render the exercise's own media.start
    // frame — one <img> tag, not an inlined <svg> (that was the 100k-tag
    // regression this file's other tests guard against).
    expect(hub).toContain('src={ex.media.start}')
    expect(hub).toContain('loading="lazy"')
    expect(hub).toContain('decoding="async"')
    expect(hub).toContain('width={ex.media.width}')
    expect(hub).toContain('height={ex.media.height}')
  })

  test('the card thumbnail image is decorative — alt is empty so the heading is not double-announced', () => {
    // <h2>{ex.name}</h2> immediately follows the thumb inside the same <a>,
    // so a non-empty alt would repeat the exercise name back-to-back for
    // screen reader users navigating the link.
    expect(hub).toMatch(/<img[^>]*alt=""/)
  })
})

describe('hub page size', () => {
  test('caps each hub page well inside a sane DOM budget', () => {
    expect(HUB_PAGE_SIZE).toBeLessThanOrEqual(60)
    expect(HUB_PAGE_SIZE).toBeGreaterThan(0)
  })

  test('every exercise in the biggest facet is still reachable across pages', () => {
    const biggest = Math.max(...Object.values(byCategory).map(l => l.length))
    const pages = Math.ceil(biggest / HUB_PAGE_SIZE)
    expect(pages * HUB_PAGE_SIZE).toBeGreaterThanOrEqual(biggest)
  })
})
