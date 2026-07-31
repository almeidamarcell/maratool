#!/usr/bin/env node
// Generate per-vertical OG images (1200×630) in public/og/, as both SVG and
// PNG. Runs via `npm run prebuild`.
//
// PNG is what og:image points at: Facebook, LinkedIn and X do not render SVG
// OG images, so an SVG-only setup shows a blank preview on the platforms that
// drive the most social referrals. The SVG stays as the editable source and is
// rasterised with sharp — declared in package.json dependencies on purpose:
// Astro only lists it as an OPTIONAL dependency, so `npm ci --omit=optional`
// would leave prebuild throwing and take the whole deploy down.

import { writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { loadTools, ROOT } from './lib/load-tools.mjs'

// Tool counts are rendered onto the cards, so derive them from the registry —
// hardcoded numbers drift silently as waves ship.
const tools = loadTools({ caller: 'gen-og-images' })
const liveByCategory = new Map()
for (const t of tools.filter(t => t.live)) {
  liveByCategory.set(t.category, (liveByCategory.get(t.category) || 0) + 1)
}

// Category colors come from the --cat-* tokens in global.css so a share card
// matches the color the same vertical shows on-site. Hardcoding them here let
// 8 of 9 drift away from the design system.
const globalCss = readFileSync(resolve(ROOT, 'public/styles/global.css'), 'utf-8')
function catColor(slug) {
  const m = globalCss.match(new RegExp(`--cat-${slug}:\\s*(#[0-9a-fA-F]{3,8})`))
  if (!m) throw new Error(`gen-og-images: no --cat-${slug} token in public/styles/global.css`)
  return m[1]
}

const VERTICALS = [
  { slug: 'developer', category: 'Developer', label: 'Developer tools',    emoji: '⚡',  tagline: 'JWT, hash, UUID, regex, cron' },
  { slug: 'health',    category: 'Health',    label: 'Medical calculators', emoji: '⚕',  tagline: 'CHA2DS2-VASc, MELD, qSOFA, NIHSS' },
  { slug: 'image',     category: 'Image',     label: 'Image tools',         emoji: '✦',  tagline: 'Background removal, SVG, favicons' },
  { slug: 'text',      category: 'Text',      label: 'Text tools',          emoji: '¶',  tagline: 'Diff, regex, JSON, Markdown' },
  { slug: 'color',     category: 'Color',     label: 'Color tools',         emoji: '◐',  tagline: 'Contrast, palettes, gradients' },
  { slug: 'converter', category: 'Converter', label: 'Converter tools',     emoji: '⇄',  tagline: 'CSV, JSON, YAML, units, time' },
  { slug: 'marketing', category: 'Marketing', label: 'Marketing tools',     emoji: '◎',  tagline: 'QR codes, UTM links, barcodes' },
  { slug: 'mockup',    category: 'Mockup',    label: 'Mockup generators',   emoji: '◊',  tagline: 'WhatsApp, iMessage, X, Instagram' },
  { slug: 'pdf',       category: 'PDF',       label: 'PDF tools',           emoji: '▤',  tagline: 'Extract, merge, split, accessibility' },
].map(v => ({ ...v, color: catColor(v.slug), count: liveByCategory.get(v.category) || 0 }))

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Headline width guard. Rasterising to PNG happens on the build host, which
// may not have Instrument Serif (a Linux CI box falls back to a wider generic
// serif). The longest labels already sit ~45px from the right edge in the
// intended font, so bound the rendered width explicitly instead of trusting
// whatever metrics the host font happens to have.
const HEADLINE_X = 420
const HEADLINE_MAX_W = 1150 - HEADLINE_X

function headlineFor(safeLabel) {
  const size = safeLabel.length > 16 ? 72 : 84
  // ~0.5em average advance for an italic serif, biased high so the clamp
  // engages before a wide fallback would clip.
  const estimated = safeLabel.length * size * 0.5
  const clamp = estimated > HEADLINE_MAX_W
    ? ` textLength="${HEADLINE_MAX_W}" lengthAdjust="spacingAndGlyphs"`
    : ''
  return { size, clamp }
}

function svgFor({ label, color, emoji, tagline, count }) {
  const safeLabel = escapeXml(label)
  const safeTag = escapeXml(tagline)
  const headline = headlineFor(safeLabel)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.85"/>
    </linearGradient>
    <style>
      .h { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; }
      .b { font-family: 'Inter', -apple-system, system-ui, sans-serif; }
      .mono { font-family: 'Fira Mono', 'Consolas', monospace; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#f5f4f1"/>

  <!-- Left color block -->
  <rect x="0" y="0" width="360" height="630" fill="url(#g)"/>

  <!-- Glyph centered in color block -->
  <text x="180" y="345" font-size="200" fill="#ffffff" text-anchor="middle" font-family="Inter, system-ui, sans-serif" opacity="0.95">${escapeXml(emoji)}</text>

  <!-- Right content area -->
  <text x="420" y="240" class="b" font-size="22" font-weight="500" fill="#6b6b63" letter-spacing="2">${count} TOOLS</text>
  <text x="${HEADLINE_X}" y="335" class="h" font-size="${headline.size}" fill="#2a2a28"${headline.clamp}>${safeLabel}</text>
  <text x="420" y="395" class="b" font-size="28" fill="#6b6b63">${safeTag}</text>

  <!-- Footer wordmark -->
  <line x1="420" y1="510" x2="540" y2="510" stroke="#a8a8a0" stroke-width="1"/>
  <text x="420" y="555" class="b" font-size="26" font-weight="600" fill="#2a2a28">maratool</text>
  <text x="420" y="585" class="mono" font-size="16" fill="#a8a8a0">maratool.com</text>

  <!-- Top-right corner: free badge (width fits the 17-char mono label) -->
  <rect x="980" y="50" width="170" height="40" rx="6" fill="#2a2a28"/>
  <text x="1065" y="76" class="mono" font-size="14" font-weight="600" fill="#f5f4f1" text-anchor="middle">FREE · NO SIGN-UP</text>
</svg>
`
}

const outDir = resolve(ROOT, 'public/og')
for (const v of VERTICALS) {
  const svg = svgFor(v)
  writeFileSync(resolve(outDir, `${v.slug}.svg`), svg, 'utf-8')

  // density 72 makes the 1200-unit viewBox rasterise 1:1 at 1200×630.
  const png = await sharp(Buffer.from(svg), { density: 72 })
    .resize(1200, 630, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer()
  writeFileSync(resolve(outDir, `${v.slug}.png`), png)
}

console.log(`gen-og-images: wrote ${VERTICALS.length} SVG + PNG OG images → public/og/`)
