// Registry-wide invariants that used to be checked by hand (or not at all).
// These are the failure modes that ship silently: a canonical pointing at the
// wrong slug, a related-tools typo producing an internal 404, a meta
// description too short to fill the SERP snippet, and generated artifacts
// drifting from tools.ts because prebuild was not re-run.

import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { tools } from './data/tools.ts'

const ROOT = resolve(import.meta.dirname, '..')
const liveTools = tools.filter(t => t.live)
const liveSlugs = new Set(liveTools.map(t => t.slug))

function pageSrc(slug) {
  return readFileSync(resolve(ROOT, `src/pages/${slug}.astro`), 'utf-8')
}

// Handles both `description: '...'` and the wrapped form where the value sits
// on the next line. A too-strict regex silently drops pages from the check.
function metaDescription(src) {
  const m = src.match(/const seo = \{[\s\S]*?\n {2}description:\s*\n?\s*'((?:[^'\\]|\\.)*)'/)
  return m ? m[1].replace(/\\'/g, "'") : null
}

function usesHealthCalc(src) {
  return /from '\.\.\/components\/(HealthCalc|ScoreCalc)\.astro'/.test(src)
}

describe('canonical URLs', () => {
  test('every live tool page declares a canonical matching its slug', () => {
    const wrong = []
    for (const tool of liveTools) {
      const src = pageSrc(tool.slug)
      // HealthCalc/ScoreCalc build the canonical from their `slug` prop, so
      // for those pages the invariant is that the prop matches the filename.
      if (usesHealthCalc(src)) {
        const prop = src.match(/slug="([^"]+)"/)
        if (!prop) wrong.push(`${tool.slug}: HealthCalc without slug prop`)
        else if (prop[1] !== tool.slug) wrong.push(`${tool.slug}: slug prop is "${prop[1]}"`)
        continue
      }
      const m = src.match(/canonical:\s*'([^']+)'/)
      if (!m) { wrong.push(`${tool.slug}: no canonical`); continue }
      const expected = `https://maratool.com/${tool.slug}`
      if (m[1] !== expected) wrong.push(`${tool.slug}: ${m[1]}`)
    }
    expect(wrong, `canonical mismatches:\n${wrong.join('\n')}`).toEqual([])
  })
})

describe('internal links resolve', () => {
  test('every relatedTools slug points at a live tool', () => {
    const broken = []
    for (const tool of liveTools) {
      const src = pageSrc(tool.slug)
      const block = src.match(/relatedTools\s*=\s*\[([\s\S]*?)\n\]/)
      if (!block) continue
      for (const m of block[1].matchAll(/slug:\s*'([^']+)'/g)) {
        if (!liveSlugs.has(m[1])) broken.push(`${tool.slug} → ${m[1]}`)
      }
    }
    expect(broken, `related links to missing/dead tools:\n${broken.join('\n')}`).toEqual([])
  })
})

describe('meta descriptions', () => {
  test('every live tool page description is 140–160 chars', () => {
    const offenders = []
    for (const tool of liveTools) {
      const desc = metaDescription(pageSrc(tool.slug))
      if (desc === null) continue // HealthCalc pages pass meta via component props
      if (desc.length < 140 || desc.length > 160) {
        offenders.push(`${tool.slug}: ${desc.length}`)
      }
    }
    expect(offenders, `descriptions outside 140–160:\n${offenders.join('\n')}`).toEqual([])
  })

  test('only HealthCalc pages are exempt from the description check', () => {
    // Without this, a page whose seo block stops matching the regex drops out
    // of the length check silently instead of failing.
    const unparsed = []
    for (const tool of liveTools) {
      const src = pageSrc(tool.slug)
      if (usesHealthCalc(src)) continue
      if (metaDescription(src) === null) unparsed.push(tool.slug)
    }
    expect(unparsed, `pages whose seo.description could not be parsed: ${unparsed.join(', ')}`).toEqual([])
  })
})

// palette-tools.json is gitignored (prebuild output), so on a fresh clone these
// skip rather than pass — a silent early-return would report green without
// asserting anything.
const PALETTE_PATH = resolve(ROOT, 'public/palette-tools.json')
const LLMS_PATH = resolve(ROOT, 'public/llms.txt')

describe('generated artifacts are in sync with tools.ts', () => {
  test.skipIf(!existsSync(PALETTE_PATH))('palette-tools.json lists every live tool', () => {
    const path = PALETTE_PATH
    const palette = JSON.parse(readFileSync(path, 'utf-8'))
    const inPalette = new Set(palette.map(t => t.slug))
    const missing = [...liveSlugs].filter(s => !inPalette.has(s))
    const stale = [...inPalette].filter(s => !liveSlugs.has(s))
    expect(missing, `missing from palette (run npm run gen:palette): ${missing.join(', ')}`).toEqual([])
    expect(stale, `stale entries in palette: ${stale.join(', ')}`).toEqual([])
  })

  test.skipIf(!existsSync(LLMS_PATH))('llms.txt lists every live tool', () => {
    const llms = readFileSync(LLMS_PATH, 'utf-8')
    const missing = [...liveSlugs].filter(s => !llms.includes(`/${s}`))
    expect(missing, `missing from llms.txt (run npm run gen:llms): ${missing.join(', ')}`).toEqual([])
  })
})

describe('blog index stays in sync with post files', () => {
  // The posts array in blog/index.astro is hand-maintained. A post that ships
  // without an index entry is orphaned — no internal link, so it is unlikely
  // to ever be crawled.
  test('every blog post has an index entry and vice versa', () => {
    const idx = readFileSync(resolve(ROOT, 'src/pages/blog/index.astro'), 'utf-8')
    const arr = idx.match(/const posts = \[([\s\S]*?)\n\]/)
    expect(arr, 'could not find posts array in blog/index.astro').not.toBeNull()
    const listed = new Set([...arr[1].matchAll(/slug: '([^']+)'/g)].map(m => m[1]))

    const files = new Set(
      readdirSync(resolve(ROOT, 'src/pages/blog'))
        .filter(f => f.endsWith('.astro') && f !== 'index.astro')
        .map(f => f.replace('.astro', ''))
    )

    const orphanPosts = [...files].filter(s => !listed.has(s))
    const deadEntries = [...listed].filter(s => !files.has(s))
    expect(orphanPosts, `posts missing from blog/index.astro: ${orphanPosts.join(', ')}`).toEqual([])
    expect(deadEntries, `index entries with no post file: ${deadEntries.join(', ')}`).toEqual([])
  })
})

describe('tool blog posts embed their tool', () => {
  test('every blogPost:true tool has a post containing BlogToolEmbed', () => {
    const missing = []
    for (const tool of liveTools.filter(t => t.blogPost)) {
      const path = resolve(ROOT, `src/pages/blog/${tool.slug}.astro`)
      if (!existsSync(path)) { missing.push(`${tool.slug}: no post file`); continue }
      if (!readFileSync(path, 'utf-8').includes('BlogToolEmbed')) {
        missing.push(`${tool.slug}: post has no BlogToolEmbed`)
      }
    }
    expect(missing, `blog embed gaps:\n${missing.join('\n')}`).toEqual([])
  })
})

describe('og:image is a social-renderable format', () => {
  test('Base.astro points og:image at PNG, not SVG', () => {
    const base = readFileSync(resolve(ROOT, 'src/layouts/Base.astro'), 'utf-8')
    const ogFn = base.match(/function ogImageForCanonical[\s\S]*?\n\}/)
    expect(ogFn).not.toBeNull()
    // Facebook/LinkedIn/X do not render SVG previews.
    expect(ogFn[0]).not.toMatch(/\.svg/)
    expect(ogFn[0]).toMatch(/\.png/)
  })
})

describe('Astro scoping rule', () => {
  test('no tool page uses a scoped <style> block', () => {
    // Scoped styles add [data-astro-cid-*] selectors that JS-created elements
    // never carry, so the CSS silently no-ops. Tool pages must use is:global.
    // Match every <style ...> form, not just a bare tag — <style lang="scss">
    // and <style define:vars={...}> are scoped too.
    const offenders = []
    for (const tool of liveTools) {
      for (const m of pageSrc(tool.slug).matchAll(/<style([^>]*)>/g)) {
        if (!/\bis:global\b/.test(m[1])) offenders.push(`${tool.slug}: <style${m[1]}>`)
      }
    }
    expect(offenders, `pages with scoped <style> (use <style is:global>):\n${offenders.join('\n')}`).toEqual([])
  })
})
