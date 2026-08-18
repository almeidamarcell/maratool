import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { tools, subcategoryOrderByCategory } from './data/tools.ts'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('site integration', () => {
  const entry = tools.find(t => t.slug === 'exercises')

  test('the browser is registered as a Health/Fitness tool', () => {
    expect(entry).toBeDefined()
    expect(entry.category).toBe('Health')
    expect(entry.subcategory).toBe('Fitness')
    expect(entry.live).toBe(true)
    expect(entry.blogPost).toBe(true)
  })

  test('Fitness is a Health subcategory', () => {
    expect(subcategoryOrderByCategory.Health).toContain('Fitness')
  })

  test('adding Fitness did not disturb the existing medical subcategories', () => {
    for (const sub of ['Anthropometric', 'Cardiology', 'Renal', 'Pediatric', 'Score']) {
      expect(subcategoryOrderByCategory.Health).toContain(sub)
    }
  })

  test('the health subcategory route has copy for fitness', () => {
    expect(read('src/pages/health/[subcategory].astro')).toContain('fitness:')
  })

  test('the blog post exists and embeds the tool', () => {
    const post = read('src/pages/blog/exercises.astro')
    expect(post).toContain('BlogToolEmbed')
    expect(post).toContain('slug="exercises"')
    expect(post).toContain("'@type': 'BlogPosting'")
  })

  test('the blog post is listed on the blog index', () => {
    expect(read('src/pages/blog/index.astro')).toContain('exercises')
  })

  test('no exercise page links omit the trailing slash', () => {
    const detail = read('src/pages/exercises/[slug].astro')
    expect(detail).not.toMatch(/href="\/exercises"/)
  })
})
