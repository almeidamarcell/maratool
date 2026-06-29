// TDD for content-based cache-busting of static /styles/*.css assets.
//
// Bug: production served a 5-day-stale layout.css because the assets are
// referenced by bare, unhashed paths (/styles/layout.css) yet cached for
// 7 days via public/_headers. A CSS change (the mobile sidebar drawer) was
// invisible at the edge. Fix: version the URL by file content so any change
// produces a new URL -> guaranteed cache miss -> fresh CSS.
import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { styleHref, cssVersion } from './css-version.ts'

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = resolve(dir, e.name)
    return e.isDirectory() ? walk(full) : [full]
  })
}

const stylesDir = resolve(import.meta.dirname, '../../public/styles')

function expectedHash(name) {
  const buf = readFileSync(resolve(stylesDir, name))
  return createHash('sha256').update(buf).digest('hex').slice(0, 8)
}

describe('css-version', () => {
  test('styleHref appends an 8-hex content hash query', () => {
    expect(styleHref('layout.css')).toMatch(/^\/styles\/layout\.css\?v=[0-9a-f]{8}$/)
  })

  test('version reflects the actual file content (busts on change)', () => {
    expect(cssVersion['layout.css']).toBe(expectedHash('layout.css'))
  })

  test('different files get different versions', () => {
    expect(cssVersion['layout.css']).not.toBe(cssVersion['global.css'])
  })

  test('Base.astro links CSS through styleHref, never a bare /styles path', () => {
    const base = readFileSync(resolve(import.meta.dirname, '../layouts/Base.astro'), 'utf-8')
    expect(base).toMatch(/styleHref\(/)
    expect(base).not.toMatch(/href="\/styles\/[^"]+\.css"/)
  })

  test('no .astro source links an un-versioned /styles/*.css (CDN cache trap)', () => {
    const srcDir = resolve(import.meta.dirname, '..')
    const offenders = walk(srcDir)
      .filter((f) => f.endsWith('.astro'))
      .filter((f) => /href="\/styles\/[^"?]+\.css"/.test(readFileSync(f, 'utf-8')))
      .map((f) => f.slice(srcDir.length + 1))
    expect(offenders).toEqual([])
  })
})
