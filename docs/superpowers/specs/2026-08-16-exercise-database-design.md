# Exercise Database — Design Spec (v2, final)

**Date:** 2026-08-16
**Status:** Approved — ready for implementation planning
**Supersedes:** `2026-07-21-exercises-dataset-design.md` (media source pivoted; see §2)

## 1. Summary

Add an **Exercise Database** to maratool.com: **1,032 exercise pages**, ~41
faceted hub pages, and one searchable browser — all statically generated from
two openly-licensed datasets. Every exercise page **shows the movement**
(vector animation or start/end photos) plus a self-drawn **SVG muscle map**.
Programmatic-SEO play targeting head terms ("chest exercises", "dumbbell
exercises") and long-tail ("how to do a bench press").

## 2. Media sources — the central decision

The v1 spec used [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
(1,324 exercises). **Rejected:** its GIFs are © Gym visual, licensed only to
that repo by separate written permission — unusable on a commercial AdSense
site, and "restyling" them would still produce an infringing derivative work.
A data-only version was rejected by the user: *"o foco aqui é o exercício"* — a
muscle map alone doesn't show the movement.

Two openly-licensed sources are used instead:

| Source | License | Exercises | Media |
|---|---|---|---|
| [everkinetic/data](https://github.com/everkinetic/data) | **CC BY-SA 4.0** | 267 (with SVG pairs) | **Vector SVG, 2 phases** (`relaxation` / `tension`) |
| [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) | **Unlicense (public domain)** | 873 | 2 photos (start → end) |

**Merges: 102.** 6 records are dropped rather than defaulted (1 Everkinetic record with no
primary muscle, 5 free-exercise-db records with no instructions in the raw upstream data —
see §3's merge rule). Merged total: **1,032 unique exercises** — 266 with vector animation,
766 photo-only.

**Why Everkinetic is the star:** its SVGs use exactly two fills (`#333` figure,
`#FFF` background), so they can be recolored and animated freely into
maratool's own visual identity — the creative freedom the user wanted, legally.

### License obligations (must be honored)
- **Everkinetic (CC BY-SA 4.0):** visible attribution ("Illustration:
  Everkinetic — CC BY-SA 4.0", linked) on every page using its art, **and**
  our recolored/derived versions must be published under CC BY-SA 4.0. The
  ShareAlike applies to the images/derivatives, **not** to maratool's own code
  or page content. Ship a `LICENSES.md` / attribution page stating this.
- **free-exercise-db (Unlicense):** public domain, no obligation. Credit anyway.
- **No Gym visual media anywhere** in the repo or output.

## 3. Data architecture

### Vendored sources
Both datasets are vendored into the repo at pinned commits (the earlier `/tmp`
clones were wiped mid-session — external clones are not a dependency):
- `src/data/exercises/everkinetic.raw.json` + `public/exercises/svg/*.svg`
- `src/data/exercises/free-exercise-db.raw.json` + photo assets
- `EXERCISES_SOURCE.md` records both source URLs, commits, and licenses.

### Merge & normalization (`src/data/exercises/build.mjs`, run in `prebuild`)
Emits a single normalized `exercises.json` + a lightweight browse index.

**Merge rule:** fuzzy-match Everkinetic titles against free-db names (token
Jaccard ≥ 0.75, each free-db record consumable by at most one match). On a
match, keep **one** record and prefer the **Everkinetic vector media** (better
UX), merging free-db's richer metadata (`level`, `force`, `mechanic`,
`category`). Non-matches from both sides pass through. **A record is dropped
(and logged by name) rather than defaulted** if, after merging, it still has
no primary muscle or no instructions — never invent anatomy or fabricate
steps. The match threshold and the resulting merge map are **snapshot-tested** so the
merge can't silently drift.

**Normalized record:**
```
{ slug, name, primaryMuscles[], secondaryMuscles[], equipment[],
  category, level, force, mechanic, instructions[],
  media: { kind: 'vector', start, end } | { kind: 'photo', start, end },
  source: 'everkinetic' | 'free-exercise-db', attribution }
```

**Muscle vocabulary normalization.** The two sets share 11 terms; Everkinetic
adds 14 variants needing mapping — `gluts`→`glutes`, `hamstring`→`hamstrings`,
`trapezius`→`traps`, `rear/posterior/lateral deltoid`→`shoulders`,
`obliques`/`lower abdominals`/`core`→`abdominals`, `neck *`→`neck`, and the
vague `arms`/`back` resolved per-exercise. Target vocabulary = free-db's 17
muscles. A test asserts every normalized muscle maps to a muscle-map region.

**Equipment** is normalized the same way (`dumbbells`→`dumbbell`, `body`→`body
only`, `cable machine`→`cable`, bench variants→`bench`, …).

**Slugs:** kebab-case(name); on collision, **every** member of the colliding
group gets `{slug}-{source-id}`. Deterministic; uniqueness enforced by test.

## 4. URLs & page inventory

| Page type | Route | Count |
|---|---|---|
| Browser | `/exercises` | 1 |
| Individual exercise | `/exercises/{slug}` | 1,032 |
| Muscle hub | `/exercises/muscle/{muscle}` | ~17 |
| Equipment hub | `/exercises/equipment/{equipment}` | ~14 |
| Category hub | `/exercises/category/{category}` | 7 |
| Level hub | `/exercises/level/{level}` | 3 |

**≈1,074 pages.** Hubs are namespaced (`/muscle/`, `/equipment/`, …) so
collisions with exercise slugs are structurally impossible. Exact hub counts
are derived from the data at build time, not hardcoded.

## 5. Exercise page

1. Breadcrumb → H1 (exercise name) → pill row (primary muscle, equipment,
   level, mechanic).
2. **Left column — the media viewer** (approved in mockup):
   - **Mode selector, 4 modes:** `▶ Animar` · `Lado a lado` · `Início` · `Esforço`
   - **Animar** uses a **hard cut** between phases (~1.1s), never a crossfade —
     crossfading ghosted the terracotta phase over the dark one, which the user
     rejected. Phase A renders dark (`#2a2a28`), phase B renders terracotta
     (`#c4553a`).
   - **Lado a lado** shows both phases split, labelled "início" / "esforço".
   - **Início** / **Esforço** show a single phase.
   - Preference persists in `localStorage` and applies site-wide.
   - Same component serves both media kinds (vector SVG or photo pair).
   - Respect `prefers-reduced-motion`: default to `Lado a lado`, don't auto-animate.
3. **Muscle map** below the viewer — the approved SVG figure (front/back),
   primary in terracotta, secondary in light tint, driven by the normalized
   muscle fields. Fallback: unknown muscle → highlight body region, never empty.
4. Metadata table + numbered instructions.
5. Attribution line (per §2) + informational-only disclaimer.
6. "Related exercises" — 3–4 links (same muscle / same equipment).

**SEO:** unique title/description/canonical, `Exercise`+`HowTo` JSON-LD
(steps → `HowToStep`), FAQ where content supports it.

## 6. Hubs & browser

**Hubs** (`ExerciseHub.astro`, one component for all ~41): unique H1 + intro,
cross-facet filter chips with real counts, card grid (mini muscle map or media
still), FAQ block with `FAQPage` schema, `CollectionPage` JSON-LD, sibling-hub
cross-links.

**Browser** (`/exercises`): sidebar with four facet groups (muscle, equipment,
category, level) with live counts; search (⌘K); active-filter pills; result
count; card grid. Single static page — filtering runs client-side over a
**browse index** containing only `{slug, name, primaryMuscles, equipment,
category, level, mediaKind}` (~35 KB gz). Raw datasets stay **build-time only**
(never served). Skeleton with reserved `min-height` → zero CLS.

## 7. Site integration

- **Category:** reuse **Health** with a new **Fitness** subcategory. *(Correction
  to an earlier assumption: the 145 medical calculators are **already** organized
  into 17 medical subcategories — Anthropometric, Cardiology, Renal, Pediatric,
  Score, … — so no restructuring is needed. The only change is appending
  `'Fitness'` to `subcategoryOrderByCategory.Health` and adding a `fitness` entry
  to `src/pages/health/[subcategory].astro`. No existing URLs change.)*
- **Registry:** one `tools.ts` entry for the browser (slug `exercises`,
  category Health, subcategory Fitness, `live: true`, `blogPost: true`). The
  ~1,074 generated pages are routes, not registry entries.
- **Blog post:** `src/pages/blog/exercises.astro` with `<BlogToolEmbed
  slug="exercises" />`; browser must support `?embed=1`. Enforced by `npm test`.
- **Assets:** Everkinetic SVGs (~11 MB raw) are optimized (SVGO) and served
  per-exercise; free-db photos are resized/compressed. Both well under
  Cloudflare's 25 MiB per-asset limit. Watch total build output.
- **Astro scoping:** the browser and any JS-created DOM use `<style is:global>`
  (CLAUDE.md rule). Tool scripts must not use `type="module"` on `../tools`
  paths (see memory: astro-tool-script-bundling).
- **Trailing slashes:** all internal links end with `/` (enforced by test).

## 8. Testing (`npm test`)

- Merge fidelity: output count === 1,032; every source record either present,
  explicitly merged, or dropped-and-logged (missing primary muscle or
  instructions); merge map snapshot.
- Slug uniqueness; every hub's set === data filtered by that facet.
- Every normalized muscle/equipment value maps to a known region/label.
- Every exercise has non-empty instructions and a valid `media` block.
- Attribution present on every Everkinetic-sourced page.
- Existing gates: blog embed test, trailing-slash test, build clean.

## 9. Out of scope (captured for later)

Favorites / bookmarks (localStorage first), workout logging, user accounts,
per-language content (neither source is multilingual — the 10-language
instructions were a casualty of dropping hasaneyldrm), licensed Gym visual
media as a future UX upgrade.

## 10. Risks

- **ShareAlike obligation** — derived Everkinetic art must ship CC BY-SA 4.0;
  needs an attribution page and per-page credit. Non-negotiable.
- **Coverage asymmetry** — only 266/1,032 get vector animation; the other 766
  use photos. Mitigated by the unified media viewer, so the layout is identical
  either way.
- **Merge false positives** — a bad fuzzy match would fuse two different
  exercises. Mitigated by the 0.75 threshold + snapshot test; borderline
  matches reviewed once at implementation time.
- **Fitness head terms are higher-KD** than maratool's usual bet; long-tail
  exercise pages are the realistic near-term win.
- **Health recategorization** touches 145 existing tools — must not change
  their URLs; verify with the existing SEO/redirect tests.

## 11. Acceptance criteria

- [ ] `npm run build` clean; ~1,074 exercise routes emitted.
- [ ] `npm test` passes incl. all new tests in §8.
- [ ] Every exercise page shows the movement (vector or photos) + muscle map.
- [ ] Media viewer: 4 modes, hard-cut animation, no phase overlap, preference
      persisted, reduced-motion respected.
- [ ] Attribution + ShareAlike notice present and correct.
- [ ] No Gym visual media anywhere.
- [ ] Browser: search + 4 facet groups filter instantly; zero CLS; `?embed=1` works.
- [ ] `Fitness` subcategory added to Health with no URL changes to existing tools.
- [ ] Sitemap includes all routes; blog post ships with working embed.
