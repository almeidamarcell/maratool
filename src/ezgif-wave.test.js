import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { tools } from './data/tools.ts'
import { EZGIF_TOOLS } from '../scripts/generate-ezgif-wave.mjs'

function readSrc(rel) {
  return readFileSync(resolve(import.meta.dirname, '..', rel), 'utf-8')
}

describe('ezgif wave tools', () => {
  test('every ezgif tool is registered live with blogPost', () => {
    for (const t of EZGIF_TOOLS) {
      const reg = tools.find(x => x.slug === t.slug)
      expect(reg, `missing registry: ${t.slug}`).toBeDefined()
      expect(reg?.live).toBe(true)
      expect(reg?.blogPost).toBe(true)
    }
  })

  test('every blogPost tool has blog file with BlogToolEmbed', () => {
    for (const t of EZGIF_TOOLS) {
      const blogPath = `src/pages/blog/${t.slug}.astro`
      expect(existsSync(resolve(import.meta.dirname, '..', blogPath)), blogPath).toBe(true)
      const content = readSrc(blogPath)
      expect(content).toContain('BlogToolEmbed')
      expect(content).toContain(`slug="${t.slug}"`)
    }
  })

  test('every ezgif tool has a page and js file', () => {
    for (const t of EZGIF_TOOLS) {
      expect(existsSync(resolve(import.meta.dirname, '..', `src/pages/${t.slug}.astro`))).toBe(true)
      expect(existsSync(resolve(import.meta.dirname, '..', `src/tools/${t.slug}.js`))).toBe(true)
    }
  })
})
