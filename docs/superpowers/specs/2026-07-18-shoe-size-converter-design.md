# Shoe Size Converter — Design

**Date:** 2026-07-18
**Slug:** `shoe-size-converter`
**Reference:** https://www.convertworld.com/pt/tamanho-do-calcado/ (in English, aim to beat it 1-to-1)

## Goal

A free, browser-based shoe size converter that converts a size between US, UK,
EU, BR, JP, AU, and centimeters (foot length) across Men / Women / Kids
categories. Must be more accurate, faster, cleaner, and better for SEO than the
reference site.

## Why we can beat convertworld

- **UX:** instant conversion, no page reload, mobile-first, one large legible result.
- **Trust (E-E-A-T):** we anchor everything in foot length (Mondopoint) with
  documented standard formulas (Paris point for EU, barleycorn for UK/US) and
  publish the methodology on-page. convertworld does not explain its numbers.
- **Real content:** full reference chart generated from the same core as the
  converter, plus How-to, methodology, and FAQ with schema.
- **Consistency:** converter and chart share one source of truth, so they never
  contradict each other.

Where they still lead: domain authority/backlinks and breadth (brands, gloves,
etc.). Our bet is UX + focus + speed + structured SEO.

## Scope

Target: full superset of convertworld's unit list (verified from their dropdown:
Europa, UK men/women, US+Canada men/women, Japan men/women, México, Brasil,
Australia men/women, Centímetro, Mondopoint, Polegadas) — plus a Kids category
their adult dropdown lacks.

- **Categories:** Men, Women, Kids (kids covers infant→youth range).
- **Systems (columns):** US, UK, EU, BR, MX (Mexico), JP, AU, CM, Mondopoint (mm),
  and Inches. CM / Mondopoint / Inches are the same physical quantity (foot
  length) in different units and double as the ground truth.
- **Gender handling:** instead of convertworld's 14-item dropdown that bakes
  gender into each region (UK-men vs UK-women, etc.), we use a Men/Women/Kids
  toggle. Only US, UK, AU are genuinely gender-offset; EU, BR, MX, JP, cm,
  Mondopoint, inches are unisex (foot-length / last based) and show the same
  value across the toggle. Cleaner UX, same coverage.
- **BR (Brazil):** Brazilian numbering runs ~2 points below EU (e.g. 26 cm foot
  ≈ BR 40 ≈ EU 42). Differentiator for maratool's Brazilian audience.
- **MX (Mexico):** foot-length based (~cm); grounded against reference anchors in
  implementation.

## Architecture (follows existing project pattern)

- `src/tools/shoe-size-core.js` — **pure functions, zero DOM**:
  - Ground truth = foot length in millimetres (Mondopoint).
  - `footLengthToSizes(mm, category)` → `{ us, uk, eu, br, mx, jp, au, cm, mondopoint, inch }`.
  - `sizeToFootLength(system, size, category)` → mm (inverse, for input in any system).
  - `referenceRows(category)` → array of rows spanning the useful range, used to
    render the chart. Generated from the same formulas so it can't drift.
  - Formula basis:
    - **EU (Paris point):** 1 Paris point = 2/3 cm = 6.667 mm; size = last length
      in Paris points, where last = foot length + toe allowance (~15 mm).
    - **UK (barleycorn):** 1 barleycorn = 1/3 inch = 8.467 mm; adult UK =
      3 × last_inches − 25; child scale offset for Kids.
    - **US:** barleycorn-based, offset from UK — Men's US = UK + 1, Women's US =
      Men's + 1 (validated against anchor points below); Kids/Youth scale.
    - **BR:** EU − 2 (whole numbers).
    - **JP / CM / Mondopoint:** foot length — JP & cm labelled in cm, Mondopoint
      in mm; all the same physical measure.
    - **MX (Mexico):** foot-length based (~cm scale), anchored to reference points.
    - **Inches:** foot length in inches (1 in = 25.4 mm).
    - **AU:** Men follow UK; Women follow UK-derived AU scale.
  - Half sizes supported; rounding to nearest half where the system uses them.
- `src/tools/shoe-size-core.test.js` — pinned to **known anchor points** so
  accuracy is guaranteed, e.g. (approx, finalized in implementation):
  - Men: US 9 ≈ UK 8.5 ≈ EU 42 ≈ BR 40 ≈ JP 27 ≈ 27.0 cm
  - Women: US 8 ≈ UK 6 ≈ EU 38.5 ≈ BR 36.5 ≈ 24.0 cm
  - Round-trip: `sizeToFootLength` then `footLengthToSizes` returns the input system's size.
- `src/tools/shoe-size.js` — DOM wiring only (reads inputs, calls core, renders).
- `src/pages/shoe-size-converter.astro` — page. `<style is:global>` (JS creates
  DOM), `min-height` on tool containers for zero CLS.
- `src/pages/blog/shoe-size-converter.astro` — required blog post with
  `<BlogToolEmbed slug="shoe-size-converter" />`.
- `src/data/tools.ts` — new entry, `category: 'Converter'`, `subcategory: 'Unit'`,
  `blogPost: true`.
- `src/pages/blog/index.astro` — new entry (newest first).

## UI

Above the fold — **Converter**:
1. Category toggle: Men / Women / Kids.
2. Input: pick source system (US/UK/EU/BR/JP/AU/CM) + type/select the size.
3. Result: large card showing every other system + foot length in cm and inches.
   Copy button. Updates instantly on input change.

Below — **Reference chart**:
- Full conversion table for the selected category, all systems as columns.
- Filter/search box (by any size value).

Then, in `ToolShell` order:
- **How to use** — 3 one-sentence steps.
- **How we calculate shoe sizes** — methodology section with the formulas
  (foot length → each system). Anchor-linked from a "How is this calculated?"
  link near the converter. This is the "text explaining how it was calculated"
  the user asked for.
- **FAQ** — exactly 4 Q&A with `FAQPage` JSON-LD.
- **Related tools** — unit-converter, paper-sizes, + one more.

**CTA summary:** short closing line, e.g. "Measure your foot in centimeters, not
your guess — enter the cm and get every size instantly."

## SEO

- Keyword research (Google autocomplete / PAA / semrush) before finalizing
  title, h1, `name`, `description`, and `keywords`. Draft:
  - title: `Shoe Size Converter — US, UK, EU, BR, JP & CM | maratool`
  - h1 / name: `Shoe Size Converter — US, UK, EU, BR, JP & CM`
  - keywords: shoe size converter, us to eu shoe size, uk to us shoe size,
    shoe size chart, cm to shoe size, brazilian shoe size, japanese shoe size (+ refine)
- `WebApplication` JSON-LD (DeveloperApplication? → likely `UtilitiesApplication`),
  `operatingSystem: Any`, `offers.price: 0`.
- `FAQPage` JSON-LD, 4 pairs.
- Unique canonical, 140–160 char description.

## Quality gates

- `npm run build` — zero errors/warnings.
- `npm test` — core tests pass; blogPost gate passes (blog file has BlogToolEmbed).
- Zero CLS (min-heights set).
- Copy button shows "Copied!" for 2s.
- Manual: verify styles apply to JS-created elements in the browser (Astro scoping rule).

## Out of scope (YAGNI)

- Brand-specific sizing (Nike/Adidas last differences).
- Width sizing (D/E/EE).
- Gloves/hats/ring sizes.
