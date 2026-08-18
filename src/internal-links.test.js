// Crawl every internal link in the BUILT site and assert it resolves.
//
// The registry-level check in seo-invariants.test.js only reads `relatedTools`
// arrays on tool pages. That misses hand-written hrefs in page copy, blog
// posts, comparison-page HTML strings, and hrefs assembled in components —
// which is exactly where the 404s were found (a dead /cron-parser chip on the
// homepage, a subcategory pill that never slugified "AI Chat").
//
// Requires `npm run build`; skips when dist/ is absent.

import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import { resolve, join, relative } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = resolve(ROOT, 'dist')
const hasBuild = existsSync(DIST)

function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) htmlFiles(p, acc)
    else if (entry.endsWith('.html')) acc.push(p)
  }
  return acc
}

// Assets are served as-is; only page routes need a matching build output.
const ASSET_RE = /\.(css|js|mjs|png|jpe?g|gif|svg|ico|txt|xml|json|webmanifest|woff2?|wasm|pdf|webp|avif)$/i

function resolves(href) {
  const clean = href.replace(/\/$/, '')
  if (clean === '') return true // "/" → dist/index.html
  return (
    existsSync(join(DIST, clean, 'index.html')) ||
    existsSync(join(DIST, `${clean}.html`)) ||
    existsSync(join(DIST, clean))
  )
}

describe.skipIf(!hasBuild)('internal links in the built site', () => {
  test('every internal href resolves to a built page', () => {
    const broken = new Map()

    for (const file of htmlFiles(DIST)) {
      const html = readFileSync(file, 'utf-8')
      for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
        const raw = m[1]
        // Strip fragment/query, they don't affect which file is served.
        const href = raw.split('#')[0].split('?')[0]
        if (!href || ASSET_RE.test(href)) continue
        // Template literals that leaked into inline scripts, not real links.
        if (href.includes('${') || href.includes("' +") || href.includes('`')) continue
        if (resolves(href)) continue
        if (!broken.has(raw)) broken.set(raw, new Set())
        broken.get(raw).add(relative(DIST, file))
      }
    }

    const report = [...broken.entries()]
      .sort((a, b) => b[1].size - a[1].size)
      .map(([href, pages]) => `${href} (${pages.size} page(s), e.g. ${[...pages][0]})`)

    expect(report, `broken internal links:\n${report.join('\n')}`).toEqual([])
  })

  test('no internal href contains an unencoded space', () => {
    // A subcategory pill built with .toLowerCase() but no slugify emits
    // href="/mockup/ai chat" — a hard 404 and an invalid URL.
    const offenders = new Set()
    for (const file of htmlFiles(DIST)) {
      const html = readFileSync(file, 'utf-8')
      for (const m of html.matchAll(/href="(\/[^"]*\s[^"]*)"/g)) {
        // String concatenation inside inline scripts, not a rendered href.
        if (/\$\{|`|['"]\s*\+|\+\s*['"]/.test(m[1])) continue
        offenders.add(`${m[1]} in ${relative(DIST, file)}`)
      }
    }
    expect([...offenders], `hrefs with raw spaces:\n${[...offenders].join('\n')}`).toEqual([])
  })
})
