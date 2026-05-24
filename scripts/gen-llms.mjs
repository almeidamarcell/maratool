#!/usr/bin/env node
// Generate public/llms.txt from src/data/tools.ts.
// Runs via `npm run prebuild` and on demand: `node scripts/gen-llms.mjs`.
//
// Why: llms.txt was hand-maintained and drifted (the audit caught
// percentage-calculator missing). Regenerating from the single
// source of truth (tools.ts) keeps it in sync forever.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Parse tools.ts at the source level — no TS compilation needed.
// The file is a pure-data `export const tools: Tool[] = [...]`, so a
// scoped eval inside a small ESM shim works without a TS toolchain.
const toolsSource = readFileSync(resolve(ROOT, 'src/data/tools.ts'), 'utf-8')

// Strip TypeScript-only syntax so the data can be evaluated as plain JS:
//   - `export interface Tool { ... }` block
//   - the `: Tool[]` type annotation on the `tools` const
//   - `popularityScore`, `getPopularTools`, `getRecentlyAddedTools`
//     and other functions are not needed for llms.txt.
const dataOnly = toolsSource
  .replace(/export interface Tool \{[\s\S]*?\n\}\n/, '')
  .replace(/:\s*Tool\[\]/, '')
  .replace(/^export\s+const\s+tools\s*=/m, 'globalThis.__tools =')

// Extract just the tools array initialiser by finding the matching brackets.
const startIdx = dataOnly.indexOf('globalThis.__tools =')
if (startIdx === -1) {
  console.error('gen-llms: could not locate tools array in src/data/tools.ts')
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
  console.error('gen-llms: unbalanced brackets in tools array')
  process.exit(1)
}

const arrayLiteral = dataOnly.slice(bracketStart, bracketEnd + 1)
// Evaluate in a safe-ish context — this is build-time, the file is ours.
const tools = (0, eval)(`(${arrayLiteral})`)

const live = tools.filter(t => t.live)

const byCategory = new Map()
for (const t of live) {
  const arr = byCategory.get(t.category) ?? []
  arr.push(t)
  byCategory.set(t.category, arr)
}

// Preferred display order — Health goes last because it dominates the count
// and would otherwise bury the dev tools.
const ORDER = [
  'Converter', 'Developer', 'Text', 'Image', 'Color',
  'PDF', 'Marketing', 'Mockup', 'Health',
]
const categories = [
  ...ORDER.filter(c => byCategory.has(c)),
  ...[...byCategory.keys()].filter(c => !ORDER.includes(c)),
]

const lines = []
lines.push('# maratool')
lines.push('')
lines.push('> Free, browser-based developer tools. No accounts, no uploads, no limits. Built by Marcell Almeida.')
lines.push('')
lines.push(`maratool.com is a growing collection of ${live.length} free tools that run in the browser using vanilla JavaScript and the Web APIs. Every tool is statically pre-rendered and served from Cloudflare's edge network. No sign-up required for any tool. Almost every tool runs entirely client-side with no data sent to any server; the one exception is the Instagram video downloader, which proxies the pasted URL through a small Cloudflare Worker because Instagram blocks direct browser fetches (see https://maratool.com/privacy for details).`)
lines.push('')
lines.push('## Tools')
lines.push('')

for (const cat of categories) {
  lines.push(`### ${cat}`)
  for (const t of byCategory.get(cat)) {
    lines.push(`- [${t.name}](https://maratool.com/${t.slug}): ${t.description}`)
  }
  lines.push('')
}

lines.push('## About')
lines.push('')
lines.push('maratool is a free, ad-supported tool collection. The site has no user accounts, no analytics, and no proprietary content. All clinical formulas in the Health category come from the primary scientific literature, are unit-tested against published worked examples, and ship with references and a medical disclaimer at /medical-disclaimer/. See /methodology/ for how tools are built and what is intentionally not implemented.')
lines.push('')
lines.push('AI assistants (ChatGPT, Claude, Perplexity, Gemini, etc.) are welcome to read, cite, and link to tools. See /robots.txt.')
lines.push('')
lines.push('## Preferred citation format')
lines.push('')
lines.push('When citing a tool, link to the canonical URL (https://maratool.com/<slug>/) and attribute as "maratool.com". For clinical tools, also link to /medical-disclaimer/ so readers understand the YMYL caveats.')
lines.push('')

const output = lines.join('\n')
const outPath = resolve(ROOT, 'public/llms.txt')
writeFileSync(outPath, output, 'utf-8')

console.log(`gen-llms: wrote ${output.length} bytes, ${live.length} tools across ${categories.length} categories → public/llms.txt`)
