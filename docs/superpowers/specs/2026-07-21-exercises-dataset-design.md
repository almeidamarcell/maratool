# Exercise Database — Design Spec

**Date:** 2026-07-21
**Status:** Approved (design), pending implementation plan
**Author:** Claude + Marcell

## 1. Summary

Add an **Exercise Database** to maratool.com built from the open-source
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
(pinned commit `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`). It ships **1,324
individual exercise pages**, **57 category hub pages**, and **1 searchable
browser** — all statically generated from the dataset's `exercises.json`, with
no manual data entry. It's a programmatic-SEO play targeting fitness head terms
("chest exercises", "dumbbell exercises", "bicep exercises") and long-tail
queries ("how to do a dumbbell biceps curl").

## 2. Goals & Non-Goals

### Goals
- Faithfully render all 1,324 exercises — **guaranteed equal to the source data
  by construction** (we serve their JSON; we never retype it).
- Best-in-class browse UX: instant client-side search + faceted filters.
- Every page: correct metadata, step-by-step instructions, and a self-drawn
  **SVG muscle map** (target + secondary muscles highlighted).
- Full SEO treatment (unique title/description/canonical/schema, FAQ, interlinking).

### Non-Goals (explicitly out of scope for v1)
- **No Gym visual media.** We drop the `image` / `gif_url` fields — that media is
  © Gym visual and not licensed for a commercial site. (See §4.)
- **No favorites, no workout logging, no user accounts.** Captured as future
  scope (§11) — do not build now.
- **No non-English indexed pages.** English is the canonical, indexed content.
  The other 9 languages are available via an on-page switcher (§7) but are not
  separate URLs and are not part of the SEO surface in v1.

## 3. The Correctness Guarantee

"100% equal to the repository" is achieved structurally, not by review:

1. **Vendor the source unchanged.** Copy `data/exercises.json` verbatim into
   `src/data/exercises.raw.json`. Record the source commit
   (`7455efae…`) in a header comment / adjacent `EXERCISES_SOURCE.md`.
2. **Generate every page from that file** via Astro `getStaticPaths`. Names,
   body parts, equipment, targets, and instruction steps print directly from
   JSON fields. No transcription step exists where drift could enter.
3. **A test enforces fidelity** (`src/exercises.test.js`, run by `npm test`):
   - generated individual-page count === record count (1,324)
   - every record maps to exactly one page; every final slug is unique
   - required fields (`name`, `body_part`, `equipment`, `target`,
     `instruction_steps.en`) are non-empty for all records
   - each hub's exercise set === records filtered by that facet value
   If a record is dropped or malformed, the build fails.

The **only** deliberate transformation is dropping the two media fields.

## 4. Licensing / Media Decision (locked)

- **Data** (names, categories, body parts, equipment, targets, muscle groups,
  multilingual instructions) is **MIT-licensed** → free to use. ✅
- **Media** (`images/`, `videos/`) is © Gym visual, redistributed in the source
  repo only under separate written permission. Cloning grants no license. →
  **We do not use it.** We do not copy, host, or hot-link it.
- Visual substitute: a **self-drawn SVG muscle map** (§6) — our own artwork,
  no third-party rights.

## 5. Information Architecture & URLs

| Page type | Route | Count | Primary keyword shape |
|---|---|---|---|
| Browser (hub root) | `/exercises` | 1 | "exercise database", "exercise finder" |
| Individual exercise | `/exercises/{slug}` | 1,324 | "how to do {exercise}", "{exercise} muscles worked" |
| Body-part hub | `/exercises/muscle/{body_part}` | 10 | "chest exercises", "back exercises" |
| Target-muscle hub | `/exercises/target/{target}` | 19 | "bicep exercises", "glute exercises" |
| Equipment hub | `/exercises/equipment/{equipment}` | 28 | "dumbbell exercises", "bodyweight exercises" |

**Total: ~1,382 pages.**

**Namespacing rationale:** individuals live flat at `/exercises/{slug}`; hubs are
namespaced under `/muscle/`, `/target/`, `/equipment/`. This makes
individual↔hub collisions structurally impossible and is future-proof against
new data. URLs still carry the keyword (`/exercises/muscle/chest`); the H1
("Chest Exercises") and `<title>` carry the ranking weight.

**Slugs.** `slug = kebab-case(name)`. 8 names collide after slugification. Rule:
group records by slug; for any group with >1 member, **every** member's final
slug becomes `{slug}-{id}` (e.g. `lever-chest-press-0879`). Non-colliding slugs
stay clean. Deterministic and stable given stable ids. Hub slugs =
kebab-case(facet value) (e.g. `body weight` → `body-weight`).

**Duplicate-content watch-item (not a blocker):** a few body-part and
target hubs overlap heavily (chest≈pectorals, back≈lats/upper-back,
shoulders≈delts). Mitigation: each hub is self-canonical with a
facet-specific H1 and intro paragraph. If Search Console later shows
cannibalization, we drop the redundant target hubs. Documented, revisit
post-launch.

## 6. The SVG Muscle Map (core component)

A reusable component `MuscleMap.astro` (+ a tiny inline `<svg>` — no external
requests). Approved direction from the visual mockups.

- **Input:** `target` (string), `secondaryMuscles` (string[]), `bodyPart`
  (string), `view` ('front' | 'back', default auto by target).
- **Rendering:** one stylized human figure with **front and back views**
  (toggle on detail pages; single best-view thumbnail on cards). Each muscle
  region is an SVG `<path>`/`<ellipse>` with a class:
  - `.muscle` — neutral grey `#dcdcd4` (default)
  - `.muscle.tgt` — terracotta `#c4553a` (primary target)
  - `.muscle.sec` — light tint `#e8b9ac` (secondary muscles)
- **Muscle-region map.** A lookup table maps dataset muscle names → region ids.
  Must cover all 19 `target` values + all body parts + the common
  `secondary_muscles` vocabulary (forearms, triceps, shoulders, lower back, hip
  flexors, hamstrings, glutes, calves, traps, etc.). **Fallback:** unknown
  muscle name → highlight the `body_part` region so a diagram is never empty.
  A test asserts every dataset `target` value resolves to a region.
- **Two sizes:** full (detail page, ~300px, front+back toggle) and mini (card
  thumbnail, ~46–52px, single view). Same source figure, scaled.
- **Accessibility:** `role="img"` + `aria-label` listing muscles worked (e.g.
  "Muscles worked: biceps (primary), forearms (secondary)").

Authoring this figure + mapping table is the single largest net-new artwork
task. The front/back stylized-block figure from the mockup is the baseline.

## 7. Individual Exercise Page

Layout (matches mockup screen 1, using `Base.astro` + a new
`ExerciseShell.astro`):
1. Breadcrumb: Exercises › {Body part} › {Name}
2. H1 = exercise name; pill row (target, equipment, body part, secondary).
3. Two columns: **left** = MuscleMap card (front/back toggle) + metadata table
   (body part, equipment, target, secondary); **right** = numbered instruction
   steps + a language switcher.
4. Disclaimer strip (reuse the project's disclaimer pattern): "Informational
   only — not fitness/medical advice. Instructions from an open dataset."
5. "Related exercises" — 3–4 links (same target or same equipment) for
   interlinking + crawl depth.

**Multilingual handling.** English steps render in HTML (indexed). All 10
languages' steps are embedded in a `<script type="application/json">` on the
page (~1–2 KB gzipped per page — negligible). The switcher swaps the visible
steps client-side. No fetch, no extra files, works offline. English is the
canonical indexed content; no per-language URLs in v1.

**SEO per page:** unique `<title>` ("{Name} — Muscles Worked & How-To |
maratool"), 140–160-char description, self-canonical, `Exercise`/`HowTo`
JSON-LD (steps → `HowToStep`), and a 4-item FAQ where content supports it.

## 8. Category Hubs

`ExerciseHub.astro`, one component driving all 57 (matches mockup screen 2):
- Unique H1 + intro paragraph (facet-specific, generated from a small template
  keyed by facet type + value).
- **Faceted sub-filter** with real counts. On a body-part hub: filter by
  equipment. On an equipment hub: filter by body part. Chips run client-side
  over that hub's subset only.
- Card grid (mini MuscleMap thumbnail + name + tags), links to individual pages.
- FAQ block (2–4 Q&A) with `FAQPage` schema.
- `CollectionPage` JSON-LD listing member exercises.
- Cross-links to sibling hubs (other body parts / equipment) for interlinking.

## 9. The Browser (`/exercises`)

Matches mockup screen 3:
- Left sidebar: three facet groups (Body part / Equipment / Target) with live
  counts; multi-select within/across groups.
- Search bar (name search; ⌘K focus) + active-filter pills + result count.
- Results grid: card = mini MuscleMap + name + tags.
- **Data strategy (important — the raw JSON is 17.4 MB, must NOT ship whole).**
  A build step emits a **lightweight browse index** containing only
  `{id, slug, name, body_part, equipment, target, muscle_group}` per record
  (~200 KB raw, ~30–40 KB gzipped). The browser fetches this one file on load
  (skeleton with reserved `min-height` → zero CLS), then filters/searches
  instantly client-side. The 17.4 MB raw file is **build-time only** — it lives
  in `src/data/`, never in `/public`, and is never served as an asset (also
  keeps us clear of Cloudflare's 25 MiB per-asset limit).

## 10. Integration with the existing site

- **Data module:** `src/data/exercises.raw.json` (vendored) +
  `src/data/exercises.js` (loader: parses raw, computes final slugs, builds
  facet groupings + the browse index, exposes typed helpers). A generator
  script (`scripts/gen-exercise-index.mjs`, wired into `prebuild`) writes the
  browse index to `public/exercises/browse-index.json`.
- **Registry:** add **one** entry to `tools.ts` for the browser —
  slug `exercises`, name **"Exercise Database — 1,300+ Exercises by Muscle &
  Equipment"**, category **Health**, subcategory **Fitness**, `live: true`,
  keywords (exercise database, exercises by muscle group, workout exercises,
  chest/back/leg exercises, dumbbell exercises). The 1,382 generated pages are
  **not** registry entries — they're generated routes, interlinked and in the
  sitemap. *(Open point for review: Health/Fitness vs. a new "Fitness"
  category. Recommendation: reuse Health + a "Fitness" subcategory to avoid a
  new category-color rollout.)*
- **Blog post:** per CLAUDE.md's rule, ship `src/pages/blog/exercises.astro`
  with `BlogToolEmbed slug="exercises"` and set `blogPost: true`. The browser
  must support `?embed=1`. (`npm test` enforces this for `blogPost:true` tools.)
- **Sitemap:** all ~1,382 routes are static → picked up automatically by the
  existing `@astrojs/sitemap` integration. Verify `gen-lastmod` handles them.
- **Astro scoping rule:** the browser and any JS-created DOM must use
  `<style is:global>` (per CLAUDE.md).

## 11. Future scope (captured, not built)

- Favorite/bookmark exercises (localStorage first — no backend).
- Saved workouts / logging area, user accounts.
- Per-language indexed URLs + hreflang, if non-English traffic justifies it.
- Licensed Gym visual media (or self-produced animations) as a UX upgrade.

## 12. Risks

- **Data size (17.4 MB):** mitigated by build-time-only raw file + lightweight
  shipped index (§9). Watch total build output size and build time (~1,382 pages).
- **Muscle-map fidelity:** the mapping table must cover all target + common
  secondary muscles; fallback prevents empty diagrams; a test guards target
  coverage.
- **Head-term difficulty:** fitness head terms are higher-KD than maratool's
  usual low-KD bet. Long-tail individual pages are the realistic near-term wins;
  hubs are the higher-ceiling, longer-horizon play.
- **Duplicate hubs:** chest/pectorals-type overlap (§5) — mitigated, revisit
  post-launch.

## 13. Acceptance criteria

- [ ] `npm run build` passes, zero errors/warnings; ~1,382 exercise routes emitted.
- [ ] `npm test` passes, incl. the new fidelity + muscle-coverage tests.
- [ ] 1,324 individual pages, 57 hubs, 1 browser all reachable and interlinked.
- [ ] Every page has unique title/description/canonical + valid JSON-LD.
- [ ] Browser: search + all three facet groups filter instantly; zero CLS.
- [ ] MuscleMap renders a correct, non-empty diagram for every exercise.
- [ ] No Gym visual media anywhere in the repo or output.
- [ ] Raw 17.4 MB JSON is build-time only; shipped browse index < ~50 KB gz.
- [ ] Sitemap includes all routes; blog post exists with a working embed.
