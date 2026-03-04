# maratool.com — Project Context for Claude Code

> This file lives in the project root. Read it at the start of every session.

## What This Is

maratool.com is a collection of free, browser-based developer tools. Business model: AdSense. Traffic: 100% organic SEO. The whole bet is ranking fast on low-KD keywords with high CPC before competitors notice the opportunity.

Domain registered: maratool.com (March 2026)

## Stack — Non-Negotiable

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro (static output) | Pre-rendered HTML = instant Google indexing |
| Styling | Plain CSS + CSS variables | Zero bundle overhead, no purge config |
| Tool logic | Vanilla JS | Astro doesn't need a framework for this |
| Deploy | Cloudflare Pages | Free, global CDN, zero config with Astro |
| Font | Inter via Google Fonts | Loaded in Base.astro head |

**Never introduce:** Tailwind, React, Vue, Alpine, any JS framework inside tools/.

## Design System

```css
--bg: #ffffff
--bg-soft: #f7f7f5
--bg-hover: #f1f1ef
--border: #e8e8e4
--text: #1a1a18
--text-2: #6b6b63
--text-3: #a8a8a0
--accent: #2d6ef6
--sidebar-width: 240px
--ad-col-width: 300px
--radius: 10px
--font: 'Inter', -apple-system, sans-serif
```

## Layout — 3-Column Grid

```
[Topbar — 52px sticky]
[Sidebar 240px sticky] | [Main fluid] | [AdColumn 300px sticky]
[Footer]
```

- Sidebar: lists all tools grouped by category, reads from tools.ts
- AdColumn: two placeholder divs (`ad-slot-1` 300x250 + `ad-slot-2` 300x600)
- Footer: wordmark "maravillosa" in oversized serif, clipped at ~40% height

## Project Structure

```
maratool/
├── CLAUDE.md                     ← you are here
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   └── robots.txt
└── src/
    ├── components/
    │   ├── Layout.astro           # topbar + 3-col grid + footer
    │   ├── Topbar.astro           # logo + search bar
    │   ├── Sidebar.astro          # nav, reads tools.ts
    │   ├── AdColumn.astro         # two AdSense placeholders
    │   ├── Footer.astro           # maravillosa wordmark
    │   ├── ToolShell.astro        # per-tool wrapper: h1 + description + slot + how-to + faq
    │   └── ComingSoon.astro       # placeholder for live: false tools
    ├── layouts/
    │   └── Base.astro             # <html>, <head>, meta, schema, canonical
    ├── pages/
    │   ├── index.astro            # homepage: hero + tool cards grid
    │   ├── jwt-decoder.astro
    │   ├── unix-timestamp.astro
    │   ├── diff-checker.astro
    │   ├── hash-generator.astro
    │   ├── base64.astro
    │   ├── uuid-generator.astro
    │   ├── reading-time.astro
    │   └── text-to-binary.astro
    ├── tools/                     # pure vanilla JS, zero imports
    │   ├── jwt.js
    │   ├── unix.js
    │   ├── diff.js
    │   ├── hash.js
    │   ├── base64.js
    │   ├── uuid.js
    │   ├── reading.js
    │   └── binary.js
    ├── data/
    │   └── tools.ts               # single source of truth for all tool metadata
    └── styles/
        ├── global.css             # reset + variables + typography
        ├── layout.css             # topbar, sidebar, grid, ad col, footer
        └── tools.css              # shared tool UI: inputs, outputs, buttons, copy feedback
```

## tools.ts — Central Registry

```ts
export interface Tool {
  slug: string        // URL path: /jwt-decoder
  name: string        // "JWT Decoder"
  emoji: string       // used in sidebar + cards
  description: string // one sentence; used in cards + meta description
  category: string    // "Developer" | "Text" | "Encoding" | "Generator"
  keywords: string[]  // for internal search + SEO context
  live: boolean       // false = ComingSoon component
}
```

Wave 1 (all live: true):
- jwt-decoder, unix-timestamp, diff-checker, hash-generator, base64, uuid-generator, reading-time, text-to-binary

## SEO Rules — Every Tool Page

Each `.astro` in pages/ must:

1. Pass unique `title`, `description`, `canonical`, and `schema` to Base.astro
2. Title format: `"JWT Decoder — Decode tokens instantly | maratool"`
3. Description: 140–160 chars, includes keyword, action-oriented
4. Schema: `WebApplication` JSON-LD with `applicationCategory: "DeveloperApplication"`, `operatingSystem: "Any"`, `offers.price: "0"`
5. FAQ schema: `FAQPage` JSON-LD with exactly 4 Q&A pairs per tool page

**ToolShell.astro must include (in order):**
1. Tool UI (above the fold — no scroll required)
2. "How to use" — 3 steps, each one sentence
3. FAQ — 4 questions, structured with FAQ schema
4. "Related tools" — 2–3 internal links

## Quality Gates — Run Before Considering Anything Done

```bash
npm run build        # zero errors, zero warnings
```

CLS check: every tool container must have a `min-height` set so there's zero layout shift when the JS loads.

Copy buttons: must change text to "Copied!" for 2 seconds, then revert.

## astro.config.mjs

```js
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  site: 'https://maratool.com',
  integrations: [sitemap()],
})
```

## Per-Tool Functional Specs

### JWT Decoder (`jwt-decoder.astro` + `jwt.js`)
- Large textarea input for raw JWT
- Three output panels: Header (JSON), Payload (JSON), Signature (raw)
- All panels update on input change (no submit button needed)
- Handles malformed input gracefully (show error state, not a crash)
- Copy button per panel

### Unix Timestamp Converter (`unix-timestamp.astro` + `unix.js`)
- Show current Unix timestamp in real time (updates every second)
- Input: Unix timestamp → output human-readable date (with timezone)
- Input: date/time picker → output Unix timestamp
- Support UTC + local timezone toggle
- Copy button for each output

### Diff Checker (`diff-checker.astro` + `diff.js`)
- Two side-by-side textareas
- Diff result panel below: highlight added lines (green bg), removed lines (red bg)
- Line-by-line diff (not char-by-char)
- "Compare" button to trigger diff
- Show stats: X lines added, Y lines removed

### Hash Generator (`hash-generator.astro` + `hash.js`)
- Single textarea input
- Output: MD5, SHA-1, SHA-256, SHA-512 — all shown simultaneously
- Updates in real time as user types (use Web Crypto API for SHA; use pure JS implementation for MD5)
- Copy button per hash

### Base64 Encode/Decode (`base64.astro` + `base64.js`)
- Two tabs: "Text ↔ Base64" | "Image → Base64"
- Text tab: left textarea (plain text) ↔ right textarea (base64), both editable, both update the other
- Image tab: file input → shows base64 data URL + preview
- Copy button on base64 output

### UUID Generator (`uuid-generator.astro` + `uuid.js`)
- Version selector: v4 (default), v1, v5
- Quantity input: 1 to 100
- "Generate" button → list of UUIDs
- "Copy all" button + individual copy per UUID
- Use `crypto.randomUUID()` for v4

### Reading Time Calculator (`reading-time.astro` + `reading.js`)
- Large textarea for pasting text
- Output panel: reading time (slow/average/fast), word count, character count, paragraph count, sentence count
- Average: 238 WPM, Slow: 150 WPM, Fast: 350 WPM
- Updates in real time

### Text to Binary (`text-to-binary.astro` + `binary.js`)
- Two tabs: "Text → Binary" | "Binary → Text"
- Also shows hex and decimal representations
- Updates in real time
- Copy button on output

## Tone & Content Guidelines

- Write for developers: direct, no fluff, no "Welcome to our amazing tool!"
- FAQ questions should be real questions devs actually ask (check Stack Overflow phrasing)
- "How to use" steps are numbered, each one a single clear action
- No marketing language anywhere in the UI

## What Success Looks Like After This Session

- [ ] `npm run build` passes with zero errors
- [ ] All 8 Wave 1 tool pages exist and are functional
- [ ] Every page has unique title, description, canonical, WebApplication schema, FAQ schema
- [ ] sitemap.xml is generated and includes all 8 tool pages
- [ ] robots.txt exists
- [ ] Copy buttons work with visual feedback
- [ ] No layout shift (min-heights set on all tool containers)
- [ ] Internal links between related tools exist on every page
