#!/usr/bin/env node
// Generate public/palette-tools.json from src/data/tools.ts.
// This lets the ⌘K palette lazy-fetch the tool registry on first open
// instead of inlining ~78KB into every page's HTML.
//
// Runs via `npm run prebuild` and on demand: `node scripts/gen-palette.mjs`.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const toolsSource = readFileSync(resolve(ROOT, 'src/data/tools.ts'), 'utf-8')

const dataOnly = toolsSource
  .replace(/export interface Tool \{[\s\S]*?\n\}\n/, '')
  .replace(/:\s*Tool\[\]/, '')
  .replace(/^export\s+const\s+tools\s*=/m, 'globalThis.__tools =')

const startIdx = dataOnly.indexOf('globalThis.__tools =')
if (startIdx === -1) {
  console.error('gen-palette: could not locate tools array in src/data/tools.ts')
  process.exit(1)
}

const bracketStart = dataOnly.indexOf('[', startIdx)
let depth = 0
let bracketEnd = -1
for (let i = bracketStart; i < dataOnly.length; i++) {
  const ch = dataOnly[i]
  if (ch === '[') depth++
  else if (ch === ']') {
    depth--
    if (depth === 0) { bracketEnd = i; break }
  }
}
if (bracketEnd === -1) {
  console.error('gen-palette: unbalanced brackets in tools array')
  process.exit(1)
}

const arrayLiteral = dataOnly.slice(bracketStart, bracketEnd + 1)
const tools = (0, eval)(`(${arrayLiteral})`)

// Keep only fields the palette actually uses for fuzzy-search + render.
const paletteTools = tools
  .filter(t => t.live)
  .map(t => ({
    slug: t.slug,
    name: t.name,
    emoji: t.emoji,
    category: t.category,
    subcategory: t.subcategory,
    keywords: t.keywords,
    description: t.description,
  }))

// Minified JSON so the file is as small as possible — the palette never
// renders raw JSON, only parses it.
const output = JSON.stringify(paletteTools)
const outPath = resolve(ROOT, 'public/palette-tools.json')
writeFileSync(outPath, output, 'utf-8')

console.log(`gen-palette: wrote ${output.length} bytes, ${paletteTools.length} tools → public/palette-tools.json`)
