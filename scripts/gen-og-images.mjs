#!/usr/bin/env node
// Generate per-vertical OG images (SVG, 1200×630) in public/og/.
// Runs via `npm run prebuild`. Output is small enough to ship as static
// assets — no PNG conversion, no headless browsers, no extra deps.
//
// SVG OG images are honored by Open Graph consumers (LinkedIn, Slack,
// Discord, iMessage previews, Mastodon, recent Twitter). Older fallbacks
// fall back to the existing /og-image.png.

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const VERTICALS = [
  { slug: 'developer', label: 'Developer tools',    color: '#2d6ef6', emoji: '⚡',  tagline: 'JWT, hash, UUID, regex, cron',          count: 17 },
  { slug: 'health',    label: 'Medical calculators', color: '#0f766e', emoji: '⚕',  tagline: 'CHA2DS2-VASc, MELD, qSOFA, NIHSS',     count: 131 },
  { slug: 'image',     label: 'Image tools',         color: '#7c5cbf', emoji: '✦',  tagline: 'Background removal, SVG, favicons',     count: 16 },
  { slug: 'text',      label: 'Text tools',          color: '#3d8b6e', emoji: '¶',  tagline: 'Diff, regex, JSON, Markdown',          count: 13 },
  { slug: 'color',     label: 'Color tools',         color: '#d4842a', emoji: '◐',  tagline: 'Contrast, palettes, gradients',         count: 9 },
  { slug: 'converter', label: 'Converter tools',     color: '#c4553a', emoji: '⇄',  tagline: 'CSV, JSON, YAML, units, time',         count: 14 },
  { slug: 'marketing', label: 'Marketing tools',     color: '#4a8fa8', emoji: '◎',  tagline: 'QR codes, UTM links, barcodes',         count: 3 },
  { slug: 'mockup',    label: 'Mockup generators',   color: '#6366f1', emoji: '◊',  tagline: 'WhatsApp, iMessage, X, Instagram',      count: 8 },
  { slug: 'pdf',       label: 'PDF tools',           color: '#c74882', emoji: '▤',  tagline: 'Extract, merge, split, accessibility',  count: 8 },
]

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function svgFor({ label, color, emoji, tagline, count }) {
  const safeLabel = escapeXml(label)
  const safeTag = escapeXml(tagline)
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
  <text x="420" y="335" class="h" font-size="84" fill="#2a2a28">${safeLabel}</text>
  <text x="420" y="395" class="b" font-size="28" fill="#6b6b63">${safeTag}</text>

  <!-- Footer wordmark -->
  <line x1="420" y1="510" x2="540" y2="510" stroke="#a8a8a0" stroke-width="1"/>
  <text x="420" y="555" class="b" font-size="26" font-weight="600" fill="#2a2a28">maratool</text>
  <text x="420" y="585" class="mono" font-size="16" fill="#a8a8a0">maratool.com</text>

  <!-- Top-right corner: free badge -->
  <rect x="1020" y="50" width="130" height="40" rx="6" fill="#2a2a28"/>
  <text x="1085" y="76" class="mono" font-size="14" font-weight="600" fill="#f5f4f1" text-anchor="middle">FREE · NO SIGN-UP</text>
</svg>
`
}

const outDir = resolve(ROOT, 'public/og')
for (const v of VERTICALS) {
  const svg = svgFor(v)
  const outPath = resolve(outDir, `${v.slug}.svg`)
  writeFileSync(outPath, svg, 'utf-8')
}

console.log(`gen-og-images: wrote ${VERTICALS.length} SVG OG images → public/og/`)
