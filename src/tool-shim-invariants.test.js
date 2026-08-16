// Guards the failure mode that shipped 14 broken pages before anyone noticed:
// a tool page whose thin shim points at the wrong engine mode, so the page
// quietly runs a different tool than its <title> promises.
//
// How it went unnoticed: `npm test` covered SEO invariants and the pure logic
// in *-core.js, and `npm run build` only proves the page renders. Neither ever
// compared what a page advertises against which mode its shim passes. Three
// separate slugs rode `mode: 'to-frames'`; `crop-pdf` ran the compressor;
// `bulk-jpg-to-png` handed back a JPEG.
//
// Sharing an engine is legitimate — several landing pages target different
// queries over one implementation, which is a deliberate SEO choice here. What
// is not legitimate is sharing it *by accident*. So every group of slugs on one
// signature must be declared below with a reason. A new undeclared collision
// fails, which is exactly the signal that was missing.

import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tools } from './data/tools.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TOOLS_DIR = resolve(ROOT, 'src/tools')

// A shim is a thin file that does nothing but hand config to a shared engine.
// Anything longer is a real implementation and is out of scope here.
const SHIM_MAX_BYTES = 1200

/**
 * Engines deliberately shared by more than one page, and why.
 * Keep the reason honest — "same engine, different input format" is fine;
 * "nobody checked" is the bug this test exists to catch.
 */
const DECLARED_SHARED_ENGINES = [
  {
    slugs: ['apng-to-gif', 'avif-to-gif', 'mng-to-gif', 'tgs-to-gif', 'webp-to-gif'],
    reason: 'One animated-to-GIF ffmpeg path. The input container differs, the conversion does not.',
  },
  {
    slugs: ['bulk-avif-to-jpg', 'bulk-png-to-jpg'],
    reason: 'Same convert-to-JPEG engine. Input format is detected from the dropped file.',
  },
  {
    slugs: ['bulk-avif-to-png', 'bulk-jpg-to-png', 'bulk-webp-to-png'],
    reason: 'Same convert-to-PNG engine. Input format is detected from the dropped file.',
  },
  {
    slugs: ['gif-add-text', 'white-box-caption'],
    reason: 'Shared caption engine; white-box-caption is the same tool preset for the meme caption bar.',
  },
  {
    slugs: ['gif-resizer', 'instagif'],
    reason: 'Shared resize engine; instagif targets the square-for-Instagram query.',
  },
  {
    slugs: ['livephoto-to-gif', 'mvimg-to-gif'],
    reason: 'Both unwrap a motion-photo container to GIF through the same path.',
  },
]

function shimSignature(slug) {
  let src
  try {
    src = readFileSync(resolve(TOOLS_DIR, `${slug}.js`), 'utf-8')
  } catch {
    return null // page has no companion script, or uses a component instead
  }
  if (src.length > SHIM_MAX_BYTES) return null
  const call = src.match(/(init[A-Za-z]+)\(\{([\s\S]*?)\}\s*\)/)
  if (!call) return null
  // `suffix` only names the download; two pages differing solely by suffix are
  // running the identical tool, which is precisely what we want to surface.
  const config = call[2]
    .replace(/suffix:\s*'[^']*',?/, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/, '')
    .trim()
  return `${call[1]}|${config}`
}

describe('tool shims point at the engine their page advertises', () => {
  test('every shared engine is declared, so accidental duplicates fail', () => {
    const bySignature = new Map()
    for (const tool of tools) {
      if (!tool.live) continue
      const sig = shimSignature(tool.slug)
      if (!sig) continue
      if (!bySignature.has(sig)) bySignature.set(sig, [])
      bySignature.get(sig).push(tool.slug)
    }

    const declared = new Set(
      DECLARED_SHARED_ENGINES.map(e => [...e.slugs].sort().join(',')),
    )

    const undeclared = []
    for (const [sig, slugs] of bySignature) {
      if (slugs.length < 2) continue
      const key = [...slugs].sort().join(',')
      if (!declared.has(key)) undeclared.push(`${key}\n    all run: ${sig}`)
    }

    expect(
      undeclared,
      'These pages run the identical engine but are not declared as sharing one.\n' +
        'Either the shim points at the wrong mode (the bug this test exists for),\n' +
        'or the sharing is intentional and belongs in DECLARED_SHARED_ENGINES with a reason:\n\n  ' +
        undeclared.join('\n  '),
    ).toEqual([])
  })

  test('every declared shared engine still matches reality', () => {
    // Stops the allowlist from rotting into a list of slugs that diverged long
    // ago, which would silently re-open the hole it was meant to close.
    const stale = []
    for (const entry of DECLARED_SHARED_ENGINES) {
      const sigs = new Set(entry.slugs.map(shimSignature))
      if (sigs.size !== 1 || sigs.has(null)) {
        stale.push(`${entry.slugs.join(', ')} — no longer share one signature; drop the entry`)
      }
    }
    expect(stale, `stale DECLARED_SHARED_ENGINES entries:\n${stale.join('\n')}`).toEqual([])
  })

  test('no live tool page loads a script that does not exist', () => {
    // Paths can be nested (health/score-formula-ui.js), so resolve each one
    // rather than matching against a flat listing of src/tools.
    const missing = []
    for (const tool of tools) {
      if (!tool.live) continue
      let page
      try {
        page = readFileSync(resolve(ROOT, `src/pages/${tool.slug}.astro`), 'utf-8')
      } catch {
        continue
      }
      for (const m of page.matchAll(/<script\s+src="\.\.\/tools\/([^"]+)"/g)) {
        if (!existsSync(resolve(TOOLS_DIR, m[1]))) {
          missing.push(`${tool.slug} → ../tools/${m[1]}`)
        }
      }
    }
    expect(missing, `tool pages loading a missing script:\n${missing.join('\n')}`).toEqual([])
  })
})
