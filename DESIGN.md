# Design System — maratool

## Product Context
- **What this is:** Free, browser-based developer tool collection (79+ tools)
- **Who it's for:** Developers, designers, and writers
- **Space/industry:** Developer utilities (competitors: SmallDev.tools, Tiny Helpers, IT-Tools, DevUtils)
- **Project type:** Static tool collection site (Astro, Cloudflare Pages)

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian — function-first, tool-dense, no decoration
- **Decoration level:** Minimal — typography and layout do all the work
- **Mood:** Fast, competent, quiet. Like a well-organized workshop where everything is where you expect it.
- **Reference sites:** Tiny Helpers (tag-based filtering), IT-Tools (sidebar + favorites)

## Typography
- **Display/Hero:** Instrument Serif (italic) — warm serif gives personality to an otherwise utilitarian site
- **Body:** Inter — clean, readable, tabular-nums available
- **UI/Labels:** Inter — same as body
- **Data/Tables:** Fira Mono — monospace for code outputs, hash values, UUIDs
- **Code:** Fira Mono
- **Loading:** Google Fonts via `@import` in global.css
- **Scale:** h1: 2.5rem, h2: 1.375rem, h3: 1rem, body: 14px, small: 13px, micro: 11px

## Color
- **Approach:** Restrained — one accent + warm neutrals, color is rare and meaningful
- **Primary/Accent:** `#c4553a` (terracotta) — warm, distinctive, avoids generic blue
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
- **Category colors** (for card left-border and section color bars):
  - Converter: `#c4553a` (terracotta, same as accent)
  - Image: `#7c5cbf` (purple)
  - Text: `#3d8b6e` (green)
  - Developer: `#2d6ef6` (blue)
  - Color: `#d4842a` (orange)
  - PDF: `#c74882` (pink)
  - Marketing: `#4a8fa8` (teal)
  - Mockup: `#6366f1` (indigo)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Grid-disciplined
- **Grid:** Sidebar (240px) + Main (fluid) — 2-column default; 3-column when AdSense active (+ 300px ad col)
- **Max content width:** Fluid (no max-width on main content)
- **Border radius:** `6px` default, `10px` for hero search, `100px` for pills/badges

## Motion
- **Approach:** Minimal-functional
- **Easing:** ease for all transitions
- **Duration:** 100ms (hover states), 150ms (border/color transitions), 120ms (search slide-in)

## Discoverability Architecture (NEW)

The core UX problem: 79+ tools across 7 categories are hard to discover via sidebar alone.

### Homepage Structure (top to bottom)
1. **Hero** — h1 "Free online tools" + hero-sized search input + subtitle + tagline
2. **Recently Used** — localStorage-powered chip row ("Pick up where you left off")
3. **New** — latest 3 tools with "New" badge
4. **Task-oriented groups** — one section per category, phrased as jobs:
   - "Convert formats" (Converter)
   - "Work with images" (Image)
   - "Inspect & debug" (Developer)
   - "Work with text" (Text)
   - "Pick colors" (Color)
   - "Work with PDFs" (PDF)
   - "Marketing tools" (Marketing)
   - Each shows 3 cards + "See all X tools →" link
5. Each group has a **color bar** (3px, category color) before the h2

### Sidebar Improvements
- **"Recently Used" section** at top (localStorage, max 5 items)
- **Divider** between recently used and categories
- **Tool count badges** next to each category name (pill style)
- **Subcategory tag pills** under expanded categories (clickable filters)

### Tool Cards
- **Category color coding** via 3px left border (color per category)
- On hover: border turns accent color, card lifts 2px
- "New" badge: terracotta pill for recently added tools

### Search
- **Hero search** on homepage: larger, white bg, subtle shadow, task-oriented placeholder
- **Topbar search** persists on all pages (existing behavior)
- Fuzzy matching on name + keywords + description (existing behavior)
- Results show category context

### Topbar
- **Logo:** `/logo.svg` (22x22) + "maratool" text in italic Instrument Serif
- **Nav links:** Blog, About, Contact (after separator)
- **Search bar** with ⌘K shortcut

### Footer
- **Left:** Copyright + nav links (Blog, About, Contact, Privacy)
- **Right:** "maravillosa" wordmark (clipped italic, 25% opacity)

### Mascot
- **NOT on homepage** — reserved for blog/about pages

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial design system created | Created by /design-consultation based on codebase analysis + competitive research |
| 2026-03-22 | Task-oriented homepage groups | Category dump doesn't scale at 79+ tools; job-phrased sections aid browse-mode discovery |
| 2026-03-22 | Recently used (localStorage) | Returning users come back for the same 3-4 tools; saves them from re-navigating |
| 2026-03-22 | Category color coding | Visual scanning aid at scale; thin left borders don't overwhelm |
| 2026-03-22 | Hero search | De-emphasizes homepage scroll in favor of search-first for returning users |
| 2026-03-22 | Remove mascot from homepage | Doesn't fit the task-oriented hero; kept for personality pages (blog, about) |
| 2026-03-22 | Add logo.svg to topbar | Brand presence next to wordmark |
