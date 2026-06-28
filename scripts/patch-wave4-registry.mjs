#!/usr/bin/env node
/** Patch tools.ts and blog index only — pages/UI generated separately. */
import fs from 'fs'
import { WAVE4 } from './generate-wave4.mjs'

const TOOLS_TS = new URL('../src/data/tools.ts', import.meta.url)
const BLOG_INDEX = new URL('../src/pages/blog/index.astro', import.meta.url)

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function toolsTsEntry(cfg) {
  const kw = cfg.slug.replace(/-/g, ' ')
  return `  {
    slug: '${cfg.slug}',
    name: '${esc(cfg.name)}',
    emoji: '${cfg.emoji}',
    description: '${esc(cfg.name)}. Free, instant, runs in your browser.',
    category: '${cfg.category}',
    subcategory: '${cfg.subcategory}',
    keywords: ['${kw}', '${kw} online', '${kw} calculator', '${kw} tool', 'free ${kw}'],
    live: true,
    blogPost: true,
  },`
}

let src = fs.readFileSync(TOOLS_TS, 'utf8')
src = src.replace(
  "Developer: ['Crypto', 'Generate', 'Audit', 'Calculator', 'Reference', 'SQL', 'API', 'Security', 'AI'],",
  "Developer: ['Crypto', 'Generate', 'Audit', 'Calculator', 'Reference', 'SQL', 'API', 'Security', 'AI', 'Web', 'Data'],",
)
src = src.replace("Education: ['Calculator'],", "Education: ['Calculator', 'Reference'],")
src = src.replace(
  "Business: ['Calculator', 'Tax', 'Pay', 'Invoicing'],",
  "Business: ['Calculator', 'Tax', 'Pay', 'Invoicing', 'Generate'],",
)
const entries = WAVE4.map(toolsTsEntry).join('\n')
if (src.includes("slug: 'invoice-number-generator'")) {
  console.log('tools.ts already patched')
} else {
  src = src.replace(/\n\]\n\n\/\/ Ordered categories/, `\n${entries}\n]\n\n// Ordered categories`)
  fs.writeFileSync(TOOLS_TS, src)
  console.log('tools.ts patched')
}

let blog = fs.readFileSync(BLOG_INDEX, 'utf8')
if (blog.includes("slug: 'invoice-number-generator'")) {
  console.log('blog index already patched')
} else {
  const posts = WAVE4.map(t => `  {
    slug: '${t.slug}',
    title: 'How to use ${esc(t.name.split('—')[0].trim().toLowerCase())}',
    date: 'June 28, 2026',
    description: '${esc(t.name)}. Free browser-based tool.',
  },`).join('\n')
  blog = blog.replace('const posts = [', `const posts = [\n${posts}`)
  fs.writeFileSync(BLOG_INDEX, blog)
  console.log('blog index patched')
}
