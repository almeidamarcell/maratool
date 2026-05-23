# Design System — maratool

## Product Context
- **What this is:** Free, browser-based tools for developers, designers, writers, and clinicians (235 tools, growing — aim: huge compendium)
- **Who it's for:** Two distinct audiences sharing one shell:
  - **Devs / designers / writers** — one-off, search-driven, no return loyalty, respond to play (emoji, color, motion)
  - **Clinicians / medical students** — known-item retrieval, returning users, want clinical sobriety
- **Space / industry:** Dev utilities (peers: SmallDev.tools, Tiny Helpers, IT-Tools) AND medical calculators (peer: MDCalc, ClinCalc)
- **Project type:** Static tool compendium (Astro, Cloudflare Pages)

## Aesthetic Direction
- **Direction:** Industrial / Utilitarian — function-first, tool-dense, no decoration
- **Decoration level:** Minimal — typography and layout do all the work
- **Mood:** Fast, competent, quiet. A well-organized workshop where everything is where you expect it.
- **Reference sites:** MDCalc (scale taxonomy, faceted filter, dense rows), Tiny Helpers (tag-based browse), IT-Tools (sidebar), ClinCalc (search-first minimalism)

## Typography
- **Display / Hero:** Instrument Serif (italic) — warm serif gives personality to an otherwise utilitarian site
- **Body:** Inter — clean, readable, tabular-nums available
- **UI / Labels:** Inter — same as body
- **Data / Tables:** Fira Mono — monospace for code outputs, hash values, UUIDs, counts
- **Code:** Fira Mono
- **Loading:** Google Fonts via `@import` in global.css
- **Scale:** h1 hero 2.5rem · h1 hub 2rem · h2 1.375rem · h3 1rem · body 14px · small 13px · micro 11px

## Color
- **Approach:** Restrained — one accent + warm neutrals, color is rare and meaningful
- **Primary / Accent:** `#c4553a` (terracotta) — warm, distinctive, avoids generic blue
- **Accent hover:** `#a8442e`
- **Neutrals (warm):**
  - Background: `#f5f4f1`
  - Background soft: `#eeeee9`
  - Background hover: `#e8e7e2`
  - Border: `#ddddd6`
  - Text primary: `#2a2a28`
  - Text secondary: `#6b6b63`
  - Text tertiary: `#a8a8a0`
- **Semantic:** success `#68d391` / bg `#f0fff4`, error `#fc8181` / bg `#fff5f5`
- **Category colors** (3px left border on cards, 3px top stripe on vertical cards, 6px dot on rows):
  - Converter: `#c4553a` (terracotta, shares accent)
  - Image: `#7c5cbf` (purple)
  - Text: `#3d8b6e` (green)
  - Developer: `#2d6ef6` (blue)
  - Color: `#d4842a` (orange)
  - PDF: `#c74882` (pink)
  - Marketing: `#4a8fa8` (teal)
  - Mockup: `#6366f1` (indigo)
  - Health: `#2f8c66` (forest green — close to Text green; deliberate sibling, distinct enough on a dot)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable for cards / hero, dense for hub rows
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined
- **Grid:** Sidebar (240px) + Main (fluid) — 2-column default; 3-column when AdSense active (+ 300px ad col)
- **Max content width:** Fluid (no max-width on main content)
- **Border radius:** `6px` default, `8px` for hub search, `10px` for hero search + vertical cards, `12px` for command palette, `100px` for pills / badges

## Motion
- **Approach:** Minimal-functional
- **Easing:** ease for all transitions
- **Duration:** 100ms (hover states), 120ms (row backgrounds), 150ms (border / color transitions), 12s cmd-pop animation on palette open

---

## Scale Architecture (supersedes the prior "Discoverability Architecture")

The core constraint: 235 tools and growing toward "huge compendium." Browse-mode IA that works at 80 tools breaks at 200 and dies at 1000. We solve this with hubs, faceted filtering, contextual navigation, and a universal command palette.

### IA tree

```
maratool.com/
├── /                          → Compendium index (vertical entry grid)
├── /all                       → A–Z exhaustive index with alphabet jump
├── /health/                   → Hub: 145 tools, faceted (17 subcategories)
│   ├── /health/cardiology/    → Subcategory landing (SEO money page)
│   ├── /health/renal/         → "
│   ├── /health/pediatric/     → "
│   └── ... 14 more
├── /developer/                → Hub: 17 tools, 4 subcategories
│   ├── /developer/crypto/     → Subcategory landing
│   └── ...
├── /text/, /image/, /color/, /converter/, /pdf/, /marketing/, /mockup/  → Hubs
└── /<tool-slug>               → Tool page (existing ToolShell)
```

### Component model

| Component | Role |
|-----------|------|
| `Layout.astro` | Topbar + Sidebar + Main + AdColumn + Footer + global CommandPalette. Accepts `scope` prop. |
| `Topbar.astro` | Brand + nav + search trigger button (opens palette on click / ⌘K). |
| `Sidebar.astro` | Contextual based on `scope`. Pinned + Recently used at top, then verticals or hub subs. |
| `CommandPalette.astro` | Global ⌘K modal. Fuzzy search across all 235 tools, sectioned by vertical. |
| `HubPage.astro` | Hub template — breadcrumb + hero + scoped search + facet pills + dense tool list. Used by every `/{vertical}.astro` and `/{vertical}/[subcategory].astro`. |
| `ToolShell.astro` | Tool page wrapper — adds Pin (★) button next to the H1. |

### Homepage = Compendium Index (`src/pages/index.astro`)

Top to bottom:
1. **Hero** — h1 "Free online tools" (Instrument Serif italic) + giant search input (560px, 48px, opens palette on click / focus) + ⌘K kbd hint
2. **Popular query chips** — 6 pre-canned links: "JSON formatter", "CHA2DS2-VASc", "QR generator", "JWT decoder", "cron parser", "contrast checker"
3. **Pinned strip** — rendered from localStorage `maratool_pinned` (hidden until populated)
4. **Recently used** — existing localStorage `maratool_recent` (hidden until populated)
5. **Verticals grid** — 4-up cards (Health first → Marketing last, sorted by tool count desc). Each: name + count + 1-line description + 3 popular tools. 3px top color stripe per category.
6. **Popular this week** — 6 cards across all verticals (currently hardcoded, P2 algorithmic)
7. **New** — 3 most recently added tools (hardcoded slug list)
8. **Why maratool + FAQ** (existing)

Removed: the per-category "3 cards + see all X tools →" sections (didn't scale at 9 categories).

### Hub Page Template (`src/components/HubPage.astro`)

Used by every vertical hub (`/health.astro`, `/developer.astro`, …) and every subcategory page (`/health/[subcategory].astro`, …):
- Breadcrumb (2 levels for hub, 3 for subcategory)
- h1 (Instrument Serif italic): job-phrased (`Medical calculators`, not `Health`)
- Sub-paragraph (140–160 char meta, doubles as visible description)
- **Scoped search** — `<input class="hub-search-input">` — filters rows live via JS (name + description)
- **Facet row** — single-axis subcategory pills, each links to `/{vertical}/{sub}/`. Active pill filled with `--text`. Count badges.
- **Dense tool list** — 1px-separated rows on `var(--border)` background. Each row:
  - Name + one-line description
  - `purpose-badge` (subcategory, colored)
  - Star button (★/☆, persists to `maratool_pinned`)
- Empty states for both "no tools in category" and "no tools match search"

### Pagination (client-side, 30 per page)
- Every hub renders ALL filtered tools server-side (preserves SEO link graph)
- Client JS shows only the active page-window; remaining rows are `display: none`
- Page state syncs to URL via `?page=N` (omitted when `N === 1`)
- Pagination is hidden automatically when filtered result count ≤ page size
- Search input and facet pills reset to page 1 on change
- Back/forward (`popstate`) restores page state
- Page picker: `‹ Prev · 1 · 2 · 3 · … · last · Next ›` (max 5 buttons + ellipsis on long ranges)
- Info row: `31–60 of 145`
- Touch targets ≥36px on mobile, ≥32px on desktop
- Smooth-scroll to top of list on page change (only if list is off-screen)

### Subcategory landing pages (`/[vertical]/[subcategory].astro`)
- Auto-generated via `getStaticPaths` from `tools.ts` taxonomy
- Each has its own hand-written meta (title, description, intro) for SEO
- `CollectionPage` JSON-LD + `BreadcrumbList` JSON-LD
- Uses the same `HubPage` component as the vertical hub, with `activeSubcategory` set — facet pills show active state automatically
- These rank Google for "cardiology calculators online", "crypto tools online", etc.

### Command palette (⌘K) — `src/components/CommandPalette.astro`
- Mounted globally via `Layout.astro`
- Triggers: ⌘K / Ctrl+K, click on topbar search button, click on homepage hero search
- 580px modal, dim backdrop (0.45 + 2px blur), focus-trapped, ESC closes
- Fuzzy match on name + keywords + description (6-tier scoring)
- **Sectioned results** by vertical with section labels and counts
- Empty state: ★ Pinned + Recent (from localStorage)
- Keymap footer: ↑↓ Navigate · ↵ Open · ⌘↵ New tab · esc Close
- Exposed as `window.maratoolOpenCmdPalette()` for trigger buttons

### Contextual sidebar (`src/components/Sidebar.astro`)
Never shows all 235 tools. Adapts to `scope` (auto-detected from URL):
- **On `/` or `/all`:** ★ Pinned · Recently used · Verticals (9 with counts + colored dots) · All tools link
- **On a hub or subcategory page (`/health/...`):** ★ Pinned · Health subcategories (chips with counts) · ← Back to maratool
- **On a tool page (`/cha2ds2-vasc`):** ★ Pinned · In <Specialty> (sibling tools) · ← All Health · ← maratool home

### Pinned tools (★)
- Explicit pin button on every tool page header (next to h1, alongside Embed button)
- localStorage key `maratool_pinned`, max 12 items, ordered by pin time
- Complementary to existing `maratool_recent` (passive auto-track)
- Surfaced in: sidebar, homepage strip, command palette empty state, hub tool rows

### `/all` index — alphabet jump (`src/pages/all.astro`)
- Sticky alphabet nav (`0–9 A B C…`), disabled state for empty letters
- Letter section heads (Instrument Serif italic) with `scroll-margin-top` for smooth anchor jumps
- Each row: name + description + vertical (with color dot) + purpose badge text
- SEO + accessibility backstop

### Tool cards on home + popular
- 3-up `popular-grid` cards (homepage Popular and New sections)
- 3px left border in category color
- Hover: bg → bg-soft, no transform (subtler than the legacy 2px lift)

### Faceted filter (hub pages)
- Single horizontal pill row, single-select
- Active pill: filled with `--text`, white text, no border
- Inactive: bg-soft + 1px border, hover → bg-hover
- Counts shown in a small mono badge inside each pill

### Purpose badges (hub rows)
Each subcategory gets its own subtle color palette:
- Score: amber (`#fef3e7` / `#b06d12`)
- Calculator: blue (`#eaf3fc` / `#1f5fc7`)
- Scale: purple (`#f3eafc` / `#6b3eb0`)
- Screening: green (`#e9f5ef` / `#1f7a52`)
- Prognosis: pink (`#fbe9f3` / `#9d2d6b`)
- Reference / Generate / Format / Transform / etc. — see `discovery.css`

### Algorithmic ranking — Popular this week
- `popularityScore(tool)` in `tools.ts` returns a deterministic score:
  - `manualBoost[slug] × 5` — small curation map of definitively-popular tools (CHA2DS2-VASc, JSON formatter, JWT decoder, QR generator, BMI calc, etc.)
  - `+ keywordCount × 0.5` — more keywords = more SEO surface
  - `+ log2(categorySize + 1)` — bigger categories see more traffic (diminishing returns)
  - `+ (toolIndex / total) × 1.5` — small recency lift for newly-added tools
- `getPopularTools(n)` returns top N sorted by score
- `getRecentlyAddedTools(n)` returns last N by file position (proxy for recency since no `addedAt` field)
- Homepage uses both for Popular this week + New sections — no hardcoded slugs

### Tag layer (shipped — derived, not curated)
- `tags?: string[]` field on `Tool` interface (optional override)
- `deriveTags(tool)` infers tags from existing data:
  - `file-upload` — tools in Image/PDF categories or with file-related keywords
  - `no-upload` — everything else
  - `instant` — default, except known slow tools (background-remover, video-to-gif, etc.)
  - `realtime` — Score/Calculator/Scale subcategories + tools matching `/(diff|json|color|contrast|hash|uuid|jwt)/i`
  - `clinical` — all Health tools
- `getAllTags()` returns `[{ tag, count }]` sorted by count desc
- `/tag/[tag]` route auto-generated for each tag; lists matching tools across all verticals, grouped by category
- Tags pill row appears on `/all` page for browsing
- Manual override: any tool can set `tags: [...]` explicitly to bypass derivation

### Dual-axis filter on /health/ (shipped)
- Secondary axis on the Health hub: **Specialty × Subcategory**
- Specialty derived via `getSpecialty(tool)` — uses subcategory if it's a specialty (Cardiology, Renal, etc.) or infers from name/description keywords (`SPECIALTY_KEYWORDS` map for Cardiology, Renal, Hepatology, Pediatric, Obstetric, Endocrine, Trauma, Pulmonary, Neurology, Oncology, GI, Hematology, Infectious, Psych, ICU)
- Purpose derived via `getPurpose(tool)` — uses subcategory if it's a purpose (Score, Scale, Screening, etc.) or infers from name patterns
- `HubPage` accepts optional `secondaryAxis` prop with `{ label, paramKey, source, options }`
- Filter syncs via URL query param (`?specialty=cardiology`), works client-side without rebuild
- Only `/health.astro` enables it for now (subcategory pages stay single-axis)

### Single visual temperature across hubs
Per `/design-consultation` decision: Health is NOT visually differentiated. One brand, one feel. Differentiation comes from faceted filter complexity and Purpose badges, not different colorways.

### CSS file map
| File | Role |
|------|------|
| `global.css` | Reset, tokens (`--bg`, `--text`, `--accent`, category colors), base typography |
| `layout.css` | Topbar, sidebar, main grid, ad column, footer, hero, legacy tool cards |
| `tools.css` | Shared tool UI primitives (inputs, outputs, buttons, FAQ) |
| `health-tools.css` | Medical calculator specific patterns |
| `discovery.css` | IA scale patterns: hub page, command palette, verticals grid, popular grid, /all alphabet jump, pin star button, contextual sidebar additions, purpose badges, **mobile responsive overrides** |

## Mobile Architecture

Mobile is treated as a first-class context, not an afterthought. Two breakpoints handle 99% of cases:

### Breakpoints
- **≤768px (tablet / large mobile):** sidebar hides, content goes 1-column, mobile responsive overrides kick in
- **≤640px (small mobile, palette becomes sheet):** command palette becomes full-screen bottom sheet
- **≤480px (small mobile):** tighter padding, smaller hero h1 (1.5rem), reduced margins

### Mobile-specific patterns
| Pattern | Treatment |
|---------|-----------|
| Topbar | Logo (smaller) + full-width search trigger only. Nav links hidden at <900px. |
| Hero | h1 = 1.875rem (1.5rem at <480), search input = 16px (prevents iOS auto-zoom on focus) |
| Facet rows | Horizontal scroll (`overflow-x: auto`) with mask-image fade on right edge. No wrap. Scrollbar hidden. Touch-friendly 32px pill height. |
| Hub tool rows | 2-column grid with purpose badge top-right, star button bottom-right. Name + desc spans full width. |
| /all alphabet | Same horizontal scroll pattern as facets. 32x32 buttons. Sticky to top. |
| /all rows | 2-column (drop purpose column), smaller cat label |
| Command palette | Full-screen sheet at <640px: `height: 100vh`, no border-radius, no shadow. 16px input font. |
| Tool page Pin button | min-height 36px for touch |
| Vertical cards | Single column, padding tightened to 12px |
| Popular grid | Single column, smaller pop-card padding (12px) |

### iOS-specific
- `font-size: 16px` on all top-level search inputs (palette, hub search, hero search) to prevent zoom on focus
- `@media (hover: none) and (pointer: coarse)` block forces 16px on touch devices
- `-webkit-overflow-scrolling: touch` on horizontally-scrolling rows

### Touch targets
- All interactive controls ≥32px tall on mobile (pills, alphabet buttons)
- Pin button ≥36px (Apple HIG soft minimum)
- Star buttons on hub rows: 18px font + 4-8px padding for tap surface
- Spacing between adjacent pills/buttons ≥6px

### Fade-out scroll hint
Facet rows and alphabet jump use `mask-image: linear-gradient(...)` to fade content at the right edge — visual signal that more content lies beyond. Native to CSS, no JS, works on all modern browsers.

### What we deliberately did NOT do
- **No hamburger menu** — nav at <900px is hidden entirely (Blog/About/Contact still reachable via footer). Mobile users don't need top-nav navigation; they search.
- **No mobile-only screen** for the command palette — it shares the desktop component, just restyled at <640px to be sheet-like.
- **No tap-to-pin gesture on rows** — the star button stays tap-only, no long-press magic. Discoverability > cleverness.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial design system created | `/design-consultation` based on codebase analysis + competitive research |
| 2026-03-22 | Task-oriented homepage groups | Category dump didn't scale at 79+ tools |
| 2026-03-22 | Recently used (localStorage) | Returning users come back for the same 3–4 tools |
| 2026-03-22 | Category color coding | Visual scanning aid at scale |
| 2026-03-22 | Hero search | De-emphasizes homepage scroll in favor of search-first |
| 2026-03-22 | Remove mascot from homepage | Doesn't fit the task-oriented hero |
| 2026-03-22 | Add logo.svg to topbar | Brand presence next to wordmark |
| 2026-05-23 | Scale Architecture supersedes Discoverability | Site grew 79 → 235 tools, Health alone at 145. Per-category 3-card sections + flat 235-row sidebar broke down. Solution: hubs + faceted filter + ⌘K + contextual sidebar + subcategory landings + /all + pinned. |
| 2026-05-23 | Hubs as first-class destinations | Each big vertical is a sovereign room inside maratool's shell. One domain (SEO authority), multiple front doors (UX). |
| 2026-05-23 | Single visual temperature across hubs | Decided against /health/ mood-shift; one product, one feel. Density comes from faceted filter + Purpose badges, not different colorway. |
| 2026-05-23 | Vertical grid sorted by tool count desc | Health (145) is the largest by 8x — putting it first in the verticals grid reflects scale and avoids the awkward orphan card. |
| 2026-05-23 | Add `--cat-health: #2f8c66` token | Forest green, sibling to Text green but distinct on a 6px dot. |
| 2026-05-23 | Add `[hidden] { display: none !important }` | Sidebar/palette overrides used `display: flex` which beat the HTML `hidden` attribute. Restored expected behavior across the board. |
| 2026-05-23 | Topbar search → palette trigger button | Replaces the inline-dropdown search overlay. Same fuzzy search, real centered modal, better at scale (235 tools won't fit a dropdown). |
| 2026-05-23 | Tag layer deferred to P2 | Adding `tags?: string[]` to all 235 tools is a content-migration task; ship structural moves first, layer tags once architecture is settled. |
| 2026-05-23 | Algorithmic Popular this week | Replaced hardcoded slug list with `popularityScore(tool)` heuristic: manualBoost + keyword count + log(category size) + recency lift. Deterministic given data, no analytics required, tunable via manualBoost map. |
| 2026-05-23 | Tag layer shipped via derivation, not migration | Instead of manually tagging 235 tools, `deriveTags(tool)` infers tags from category/subcategory/keywords. Tools can override with explicit `tags` field. Zero migration cost, 100% coverage. |
| 2026-05-23 | Dual-axis Health: Specialty × Subcategory | `getSpecialty()` infers specialty from keywords (Cardiology, Renal, Pediatric, etc.) for tools whose subcategory is a "purpose" type (Score, Scale, etc.). Secondary axis on /health/ only — subcategory pages stay single-axis. URL syncs via `?specialty=X` query param, filters client-side. |
| 2026-05-23 | `--cat-health` shifted to `#0f766e` (deep teal) | Original `#2f8c66` was too close to `--cat-text: #3d8b6e`. Teal communicates clinical without conflicting with the 8 other category colors. |
| 2026-05-23 | Mobile design pass — no hamburger, no app-shell | Considered hamburger menu + bottom nav; chose neither. Mobile users searching tools don't browse nav; they search. The ⌘K palette + sheet treatment + horizontal-scroll facets cover the discovery surface. Nav links live in the footer for the rare mobile user who needs them. |
| 2026-05-23 | Horizontal-scroll facets over wrap | Facet rows on /health/ have 17+ pills. Wrapping at <768px produced 6–8 row stacks. Horizontal scroll with mask-fade hints scrollability without scrollbar visual noise — same pattern used at MDCalc, Linear, Vercel docs. |
| 2026-05-23 | 16px input font on iOS to prevent zoom | All top-level search inputs (palette, hub, hero) bumped to 16px on touch devices via media query. Prevents iOS from auto-zooming the viewport on focus, which would break the layout. |
| 2026-05-23 | Pagination is client-side, not server-side | Server-side pagination would split the link graph (Google sees only page-1's tools); client-side keeps all 145 Health tools in one HTML doc for crawl. URL syncs via `?page=N` for shareability + back/forward. Filter+search reset to page 1. Hidden when result count ≤ 30. |
