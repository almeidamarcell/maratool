#!/usr/bin/env node
// Generate public/llms.txt from src/data/tools.ts.
// Runs via `npm run prebuild` and on demand: `node scripts/gen-llms.mjs`.
//
// Why: llms.txt was hand-maintained and drifted (the audit caught
// percentage-calculator missing). Regenerating from the single
// source of truth (tools.ts) keeps it in sync forever.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadTools, ROOT } from './lib/load-tools.mjs'

const tools = loadTools({ caller: 'gen-llms' })

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
