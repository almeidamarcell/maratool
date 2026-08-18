#!/usr/bin/env node
// Generate public/palette-tools.json from src/data/tools.ts.
// This lets the ⌘K palette lazy-fetch the tool registry on first open
// instead of inlining ~78KB into every page's HTML.
//
// Runs via `npm run prebuild` and on demand: `node scripts/gen-palette.mjs`.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadTools, ROOT } from './lib/load-tools.mjs'

const tools = loadTools({ caller: 'gen-palette' })

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
