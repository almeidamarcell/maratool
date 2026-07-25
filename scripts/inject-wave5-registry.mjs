#!/usr/bin/env node
/**
 * Injects Wave 5 registry entries into src/data/tools.ts and blog index
 * entries into src/pages/blog/index.astro, one commit-family at a time.
 * Run: node scripts/inject-wave5-registry.mjs <family 1-6>
 */
import fs from 'fs'
import path from 'path'
import { LINEAR } from './wave5-data-linear.mjs'
import { SPECIAL } from './wave5-data-special.mjs'

const ROOT = path.join(import.meta.dirname, '..')
const TOOLS_TS = path.join(ROOT, 'src', 'data', 'tools.ts')
const BLOG_INDEX = path.join(ROOT, 'src', 'pages', 'blog', 'index.astro')

const FAMILIES = {
  1: { label: 'Wave 5 — dimension & mechanics converters', slugs: ['area-converter', 'volume-converter', 'pressure-converter', 'energy-converter', 'power-converter', 'force-converter', 'torque-converter', 'acceleration-converter', 'density-converter', 'angle-converter', 'frequency-converter', 'bandwidth-converter'] },
  2: { label: 'Wave 5 — chemistry & flow converters', slugs: ['amount-of-substance-converter', 'molar-mass-converter', 'dynamic-viscosity-converter', 'kinematic-viscosity-converter', 'mass-flow-rate-converter', 'volumetric-flow-rate-converter'] },
  3: { label: 'Wave 5 — electrical converters', slugs: ['capacitance-converter', 'electric-charge-converter', 'electric-current-converter', 'electric-potential-converter', 'electrical-conductance-converter', 'electrical-resistance-converter', 'inductance-converter'] },
  4: { label: 'Wave 5 — magnetism & photometry converters', slugs: ['magnetic-field-converter', 'magnetic-field-strength-converter', 'magnetic-flux-converter', 'magnetomotive-force-converter', 'illuminance-converter', 'luminance-converter', 'luminous-energy-converter', 'luminous-flux-converter', 'luminous-intensity-converter'] },
  5: { label: 'Wave 5 — radiation dose converters', slugs: ['absorbed-dose-converter', 'equivalent-dose-converter', 'radioactivity-converter'] },
  6: { label: 'Wave 5 — fuel economy, pace, wind, due date & sizing tools', slugs: ['mpg-to-l100km', 'running-pace-calculator', 'wind-speed-converter', 'due-date-calculator', 'tire-size-calculator', 'screen-size-calculator', 'clothing-size-converter', 'hat-size-converter'] },
}

const ALL = {}
for (const t of LINEAR) ALL[t.slug] = { ...t, category: 'Converter', subcategory: t.sub }
for (const t of SPECIAL) ALL[t.slug] = { ...t, category: t.category, subcategory: t.sub }

function registryEntry(t) {
  const kw = t.keywords.map(k => `'${k.replace(/'/g, "\\'")}'`).join(', ')
  return `  {
    slug: '${t.slug}',
    name: '${t.name.replace(/'/g, "\\'")}',
    emoji: '${t.emoji}',
    description: '${t.desc.replace(/'/g, "\\'")}',
    category: '${t.category}',
    subcategory: '${t.subcategory}',
    keywords: [${kw}],
    live: true,
    blogPost: true,
  },
`
}

function blogIndexEntry(t) {
  return `  {
    slug: '${t.slug}',
    title: '${t.blog.title.replace(/'/g, "\\'")}',
    date: 'July 25, 2026',
    description: '${t.blog.description.replace(/'/g, "\\'")}',
  },
`
}

const family = FAMILIES[process.argv[2]]
if (!family) {
  console.error('Usage: node scripts/inject-wave5-registry.mjs <1-6>')
  process.exit(1)
}

const tools = family.slugs.map(s => {
  if (!ALL[s]) throw new Error(`Unknown slug ${s}`)
  return ALL[s]
})

// tools.ts — insert before the closing bracket of the tools array
let ts = fs.readFileSync(TOOLS_TS, 'utf8')
const tsAnchor = ']\n\n// Ordered categories'
if (!ts.includes(tsAnchor)) throw new Error('tools.ts anchor not found')
if (ts.includes(`slug: '${tools[0].slug}'`)) throw new Error(`${tools[0].slug} already registered`)
const block = `  // ── ${family.label} ──\n` + tools.map(registryEntry).join('')
ts = ts.replace(tsAnchor, block + tsAnchor)
fs.writeFileSync(TOOLS_TS, ts)
console.log('tools.ts: added', tools.length, 'entries')

// blog/index.astro — insert at the top of the posts array (newest first)
let idx = fs.readFileSync(BLOG_INDEX, 'utf8')
const idxAnchor = 'const posts = [\n'
if (!idx.includes(idxAnchor)) throw new Error('blog index anchor not found')
idx = idx.replace(idxAnchor, idxAnchor + tools.map(blogIndexEntry).join(''))
fs.writeFileSync(BLOG_INDEX, idx)
console.log('blog/index.astro: added', tools.length, 'entries')
