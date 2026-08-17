# Exercise Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an exercise database on maratool.com — 1,032 exercise pages, ~41 faceted hubs, and one searchable browser — generated from two openly-licensed datasets, where every page shows the movement plus a muscle map.

**Architecture:** Two datasets are vendored at pinned commits and merged at build time by a Node script into one normalized `exercises.json` plus a lightweight browse index. Astro `getStaticPaths` generates every page from that normalized file. Media is rendered by a single client-side viewer component that handles both vector-SVG pairs (Everkinetic) and photo pairs (free-exercise-db) with four display modes.

**Tech Stack:** Astro 7 (static output), vanilla JS (no framework), plain CSS with `<style is:global>`, vitest, Node ESM build scripts, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-08-16-exercise-database-design.md`

## Global Constraints

- **Never introduce** Tailwind, React, Vue, Alpine, or any JS framework inside `src/tools/`.
- Every `.astro` page with a companion JS file that creates DOM elements MUST use `<style is:global>`, never scoped `<style>`.
- Tool script tags must be `<script src="../tools/x.js"></script>` — **never** `type="module"` on `../tools` paths (it 404s in prod).
- Use `setVisible()`-style `hidden` attribute toggling, not `style.display` (global `[hidden]{display:none!important}` rule).
- All internal links end with a trailing slash `/`.
- Design tokens only: `--bg:#f5f4f1` `--bg-soft:#eeeee9` `--border:#ddddd6` `--text:#2a2a28` `--text-2:#6b6b63` `--text-3:#a8a8a0` `--accent:#c4553a` `--cat-health:#0c7d8c` `--radius:6px`. Fonts: Inter (body), Instrument Serif (display), Fira Mono (data).
- **Attribution is non-negotiable:** every page showing Everkinetic art renders "Illustration: Everkinetic — CC BY-SA 4.0" linked to `https://creativecommons.org/licenses/by-sa/4.0/`.
- **No Gym visual media** may enter the repo or the build output.
- `npm run build` must finish with zero errors and zero warnings; `npm test` must pass.
- Every tool container needs a `min-height` so there is zero layout shift when JS loads.

---

### Task 1: Vendor both datasets at pinned commits

**Files:**
- Create: `scripts/vendor-exercise-sources.mjs`
- Create: `src/data/exercises/EXERCISES_SOURCE.md`
- Create (generated): `src/data/exercises/everkinetic.raw.json`, `src/data/exercises/free-exercise-db.raw.json`
- Test: `src/exercise-sources.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `src/data/exercises/everkinetic.raw.json` (array of Everkinetic records), `src/data/exercises/free-exercise-db.raw.json` (array of free-db records), and `public/exercises/svg/{id_num}-{relaxation|tension}.svg` optimized SVG assets.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-sources.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('vendored exercise sources', () => {
  test('everkinetic raw json exists and has records with SVG pairs', () => {
    const ek = JSON.parse(read('src/data/exercises/everkinetic.raw.json'))
    expect(Array.isArray(ek)).toBe(true)
    expect(ek.length).toBeGreaterThanOrEqual(260)
    expect(ek[0]).toHaveProperty('id_num')
    expect(ek[0]).toHaveProperty('title')
  })

  test('free-exercise-db raw json exists with 873 records', () => {
    const fe = JSON.parse(read('src/data/exercises/free-exercise-db.raw.json'))
    expect(fe.length).toBe(873)
    expect(fe[0]).toHaveProperty('primaryMuscles')
    expect(fe[0]).toHaveProperty('images')
  })

  test('EXERCISES_SOURCE.md records both commits and licenses', () => {
    const doc = read('src/data/exercises/EXERCISES_SOURCE.md')
    expect(doc).toContain('everkinetic/data')
    expect(doc).toContain('yuhonas/free-exercise-db')
    expect(doc).toContain('CC BY-SA 4.0')
    expect(doc).toContain('Unlicense')
    expect(doc).toMatch(/[0-9a-f]{40}/)  // a pinned commit sha
  })

  test('no Gym visual media anywhere in vendored data', () => {
    const ek = read('src/data/exercises/everkinetic.raw.json')
    const fe = read('src/data/exercises/free-exercise-db.raw.json')
    expect(ek.toLowerCase()).not.toContain('gymvisual')
    expect(fe.toLowerCase()).not.toContain('gymvisual')
  })

  test('everkinetic SVG assets are present in public/', () => {
    const ek = JSON.parse(read('src/data/exercises/everkinetic.raw.json'))
    const sample = ek[0].id_num
    expect(existsSync(resolve(ROOT, `public/exercises/svg/${sample}-relaxation.svg`))).toBe(true)
    expect(existsSync(resolve(ROOT, `public/exercises/svg/${sample}-tension.svg`))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-sources.test.js`
Expected: FAIL — `ENOENT: no such file or directory ... everkinetic.raw.json`

- [ ] **Step 3: Write the vendoring script**

Create `scripts/vendor-exercise-sources.mjs`:

```js
#!/usr/bin/env node
// One-shot vendoring of the two openly-licensed exercise datasets.
// Run manually: node scripts/vendor-exercise-sources.mjs
// NOT part of prebuild — the vendored output is committed to the repo.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync, rmSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TMP = resolve(ROOT, '.vendor-tmp')
const OUT = resolve(ROOT, 'src/data/exercises')
const SVG_OUT = resolve(ROOT, 'public/exercises/svg')

const SOURCES = {
  everkinetic: { repo: 'https://github.com/everkinetic/data', license: 'CC BY-SA 4.0' },
  freedb: { repo: 'https://github.com/yuhonas/free-exercise-db', license: 'Unlicense (public domain)' },
}

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })
mkdirSync(OUT, { recursive: true })
mkdirSync(SVG_OUT, { recursive: true })

function clone(name, repo) {
  const dir = resolve(TMP, name)
  execSync(`git clone --depth 1 -q ${repo} "${dir}"`, { stdio: 'inherit' })
  const sha = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim()
  return { dir, sha }
}

// ---- Everkinetic: keep only records that have BOTH svg phases ----
const ek = clone('everkinetic', SOURCES.everkinetic.repo)
const ekAll = JSON.parse(readFileSync(resolve(ek.dir, 'exercises.json'), 'utf-8'))
const svgDir = resolve(ek.dir, 'dist/svg')
const svgFiles = new Set(readdirSync(svgDir))
const ekKept = ekAll.filter(x =>
  x.id_num && svgFiles.has(`${x.id_num}-relaxation.svg`) && svgFiles.has(`${x.id_num}-tension.svg`)
)
for (const x of ekKept) {
  for (const phase of ['relaxation', 'tension']) {
    const f = `${x.id_num}-${phase}.svg`
    // Normalize the two fills so the viewer can recolor via currentColor.
    const raw = readFileSync(resolve(svgDir, f), 'utf-8')
    const normalized = raw
      .replace(/fill="#FFF"/g, 'fill="none"')
      .replace(/fill="#333"/g, 'fill="currentColor"')
      .replace(/width="[^"]*"\s*height="[^"]*"/, 'width="100%" height="100%"')
    writeFileSync(resolve(SVG_OUT, f), normalized)
  }
}
writeFileSync(resolve(OUT, 'everkinetic.raw.json'), JSON.stringify(ekKept, null, 2))

// ---- free-exercise-db ----
const fe = clone('freedb', SOURCES.freedb.repo)
const feAll = JSON.parse(readFileSync(resolve(fe.dir, 'dist/exercises.json'), 'utf-8'))
writeFileSync(resolve(OUT, 'free-exercise-db.raw.json'), JSON.stringify(feAll, null, 2))

// ---- copy free-db photos ----
const PHOTO_OUT = resolve(ROOT, 'public/exercises/photos')
mkdirSync(PHOTO_OUT, { recursive: true })
let photos = 0
for (const x of feAll) {
  for (const rel of x.images ?? []) {
    const src = resolve(fe.dir, 'exercises', rel)
    if (!existsSync(src)) continue
    const flat = rel.replace(/\//g, '__')
    mkdirSync(dirname(resolve(PHOTO_OUT, flat)), { recursive: true })
    copyFileSync(src, resolve(PHOTO_OUT, flat))
    photos++
  }
}

writeFileSync(resolve(OUT, 'EXERCISES_SOURCE.md'), `# Vendored exercise data sources

Regenerate with: \`node scripts/vendor-exercise-sources.mjs\`

## everkinetic/data
- Repo: ${SOURCES.everkinetic.repo}
- Commit: \`${ek.sha}\`
- License: **${SOURCES.everkinetic.license}**
- Records kept (with both SVG phases): ${ekKept.length}
- Obligation: visible attribution on every page using this art, AND our
  recolored/derived versions are published under CC BY-SA 4.0.

## yuhonas/free-exercise-db
- Repo: ${SOURCES.freedb.repo}
- Commit: \`${fe.sha}\`
- License: **${SOURCES.freedb.license}**
- Records: ${feAll.length}
- Photos copied: ${photos}

## Explicitly NOT used
hasaneyldrm/exercises-dataset media (© Gym visual) — proprietary, not licensed
for redistribution on a commercial site. Never vendor it.
`)

rmSync(TMP, { recursive: true, force: true })
console.log(`vendored: everkinetic=${ekKept.length}, free-db=${feAll.length}, photos=${photos}`)
```

- [ ] **Step 4: Run the script, then run the test to verify it passes**

Run: `node scripts/vendor-exercise-sources.mjs && npx vitest run src/exercise-sources.test.js`
Expected: script prints `vendored: everkinetic=267, free-db=873, photos=1746`; all 5 tests PASS. (As
actually implemented in Task 1, the kept count is 267, not 270 — two Everkinetic records collide on
`id_num "0020"` and are both dropped rather than guessed at; see `task-1-report.md`.)

- [ ] **Step 5: Commit**

```bash
git add scripts/vendor-exercise-sources.mjs src/data/exercises/ public/exercises/ src/exercise-sources.test.js
git commit -m "feat(exercises): vendor Everkinetic + free-exercise-db at pinned commits"
```

---

### Task 2: Normalization vocabulary (muscles + equipment)

**Files:**
- Create: `src/data/exercises/vocab.mjs`
- Test: `src/exercise-vocab.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `normalizeMuscle(raw: string) => string`, `normalizeEquipment(raw: string) => string`, `MUSCLES: string[]` (the 17 canonical muscles), `EQUIPMENT: string[]` (canonical equipment list).

- [ ] **Step 1: Write the failing test**

Create `src/exercise-vocab.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { normalizeMuscle, normalizeEquipment, MUSCLES, EQUIPMENT } from './data/exercises/vocab.mjs'

describe('normalizeMuscle', () => {
  test('passes through canonical free-db muscles unchanged', () => {
    for (const m of ['chest', 'biceps', 'triceps', 'lats', 'quadriceps', 'hamstrings', 'calves', 'abdominals', 'shoulders', 'forearms', 'glutes', 'traps', 'lower back', 'middle back', 'neck', 'abductors', 'adductors']) {
      expect(normalizeMuscle(m)).toBe(m)
    }
  })

  test('maps Everkinetic variants onto canonical muscles', () => {
    expect(normalizeMuscle('gluts')).toBe('glutes')
    expect(normalizeMuscle('hamstring')).toBe('hamstrings')
    expect(normalizeMuscle('trapezius')).toBe('traps')
    expect(normalizeMuscle('rear deltoid')).toBe('shoulders')
    expect(normalizeMuscle('posterior deltoid')).toBe('shoulders')
    expect(normalizeMuscle('lateral deltoid')).toBe('shoulders')
    expect(normalizeMuscle('obliques')).toBe('abdominals')
    expect(normalizeMuscle('lower abdominals')).toBe('abdominals')
    expect(normalizeMuscle('core')).toBe('abdominals')
    expect(normalizeMuscle('neck extensors')).toBe('neck')
    expect(normalizeMuscle('neck flexors')).toBe('neck')
    expect(normalizeMuscle('neck side flexors')).toBe('neck')
    expect(normalizeMuscle('back')).toBe('middle back')
    expect(normalizeMuscle('arms')).toBe('biceps')
  })

  test('is case- and whitespace-insensitive', () => {
    expect(normalizeMuscle('  Gluts ')).toBe('glutes')
    expect(normalizeMuscle('TRAPEZIUS')).toBe('traps')
  })

  test('returns null for unknown input rather than inventing a muscle', () => {
    expect(normalizeMuscle('zzz')).toBe(null)
    expect(normalizeMuscle('')).toBe(null)
    expect(normalizeMuscle(undefined)).toBe(null)
  })

  test('every canonical muscle is listed in MUSCLES', () => {
    expect(MUSCLES).toHaveLength(17)
    expect(MUSCLES).toContain('glutes')
    expect(new Set(MUSCLES).size).toBe(MUSCLES.length)
  })
})

describe('normalizeEquipment', () => {
  test('collapses plural and machine variants', () => {
    expect(normalizeEquipment('dumbbells')).toBe('dumbbell')
    expect(normalizeEquipment('kettlebells')).toBe('kettlebell')
    expect(normalizeEquipment('cable machine')).toBe('cable')
    expect(normalizeEquipment('body')).toBe('body only')
    expect(normalizeEquipment('bands')).toBe('band')
    expect(normalizeEquipment('exercise band')).toBe('band')
  })

  test('collapses bench variants to bench', () => {
    expect(normalizeEquipment('flat bench')).toBe('bench')
    expect(normalizeEquipment('incline bench')).toBe('bench')
    expect(normalizeEquipment('decline bench')).toBe('bench')
  })

  test('passes through canonical values', () => {
    expect(normalizeEquipment('barbell')).toBe('barbell')
    expect(normalizeEquipment('smith machine')).toBe('smith machine')
  })

  test('unknown equipment falls back to "other"', () => {
    expect(normalizeEquipment('zzz')).toBe('other')
    expect(normalizeEquipment(undefined)).toBe('other')
  })

  test('every value normalizeEquipment can return is in EQUIPMENT', () => {
    for (const v of ['dumbbell', 'barbell', 'cable', 'body only', 'bench', 'band', 'other']) {
      expect(EQUIPMENT).toContain(v)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-vocab.test.js`
Expected: FAIL — cannot resolve `./data/exercises/vocab.mjs`

- [ ] **Step 3: Write the implementation**

Create `src/data/exercises/vocab.mjs`:

```js
// Canonical vocabularies for the merged exercise dataset.
// Target vocabulary is free-exercise-db's, since it is the larger source.

export const MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest',
  'forearms', 'glutes', 'hamstrings', 'lats', 'lower back', 'middle back',
  'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
]

const MUSCLE_ALIASES = {
  gluts: 'glutes',
  glute: 'glutes',
  hamstring: 'hamstrings',
  trapezius: 'traps',
  'rear deltoid': 'shoulders',
  'posterior deltoid': 'shoulders',
  'lateral deltoid': 'shoulders',
  'anterior deltoid': 'shoulders',
  deltoids: 'shoulders',
  delts: 'shoulders',
  obliques: 'abdominals',
  'lower abdominals': 'abdominals',
  'upper abdominals': 'abdominals',
  abs: 'abdominals',
  core: 'abdominals',
  'neck extensors': 'neck',
  'neck flexors': 'neck',
  'neck side flexors': 'neck',
  // Vague Everkinetic values resolved to their most common concrete meaning.
  back: 'middle back',
  arms: 'biceps',
  quads: 'quadriceps',
  pectorals: 'chest',
  'upper back': 'middle back',
  spine: 'lower back',
}

export function normalizeMuscle(raw) {
  if (typeof raw !== 'string') return null
  const key = raw.trim().toLowerCase()
  if (!key) return null
  if (MUSCLES.includes(key)) return key
  return MUSCLE_ALIASES[key] ?? null
}

export const EQUIPMENT = [
  'barbell', 'dumbbell', 'body only', 'cable', 'machine', 'kettlebell',
  'band', 'medicine ball', 'exercise ball', 'foam roll', 'e-z curl bar',
  'smith machine', 'bench', 'other',
]

const EQUIPMENT_ALIASES = {
  dumbbells: 'dumbbell',
  kettlebells: 'kettlebell',
  'cable machine': 'cable',
  body: 'body only',
  bodyweight: 'body only',
  'body weight': 'body only',
  bands: 'band',
  'exercise band': 'band',
  'resistance band': 'band',
  'flat bench': 'bench',
  'incline bench': 'bench',
  'decline bench': 'bench',
  bar: 'barbell',
  'ez barbell': 'e-z curl bar',
  'e-z bar': 'e-z curl bar',
  'stability ball': 'exercise ball',
  'foam roller': 'foam roll',
}

export function normalizeEquipment(raw) {
  if (typeof raw !== 'string') return 'other'
  const key = raw.trim().toLowerCase()
  if (!key) return 'other'
  if (EQUIPMENT.includes(key)) return key
  return EQUIPMENT_ALIASES[key] ?? 'other'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/exercise-vocab.test.js`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/exercises/vocab.mjs src/exercise-vocab.test.js
git commit -m "feat(exercises): canonical muscle and equipment vocabularies"
```

---

### Task 3: Merge script — produce the normalized dataset

**Files:**
- Create: `scripts/gen-exercises.mjs`
- Modify: `package.json` (add `gen:exercises` script; append to `prebuild` chain)
- Test: `src/exercise-merge.test.js`

**Interfaces:**
- Consumes: `src/data/exercises/*.raw.json` (Task 1), `normalizeMuscle`/`normalizeEquipment` from `src/data/exercises/vocab.mjs` (Task 2).
- Produces: `src/data/exercises/exercises.json` — an array of normalized records shaped:
  `{ slug, name, primaryMuscles: string[], secondaryMuscles: string[], equipment: string[], category: string, level: string|null, force: string|null, mechanic: string|null, instructions: string[], media: { kind: 'vector'|'photo', start: string, end: string }, source: 'everkinetic'|'free-exercise-db', attribution: string }`
  and `public/exercises/browse-index.json` — `{ slug, name, primaryMuscles, equipment, category, level, mediaKind }[]`.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-merge.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MUSCLES, EQUIPMENT } from './data/exercises/vocab.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const load = p => JSON.parse(readFileSync(resolve(ROOT, p), 'utf-8'))
const all = load('src/data/exercises/exercises.json')

describe('merged exercise dataset', () => {
  test('has 1032 unique exercises', () => {
    expect(all.length).toBe(1032)
  })

  test('every slug is unique and URL-safe', () => {
    const slugs = all.map(x => x.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/)
  })

  test('266 records use vector media, the rest photos', () => {
    const vector = all.filter(x => x.media.kind === 'vector')
    const photo = all.filter(x => x.media.kind === 'photo')
    expect(vector.length).toBe(266)
    expect(photo.length).toBe(766)
  })

  test('every record has a non-empty name, instructions and media pair', () => {
    for (const x of all) {
      expect(x.name.length).toBeGreaterThan(0)
      expect(Array.isArray(x.instructions)).toBe(true)
      expect(x.instructions.length).toBeGreaterThan(0)
      expect(x.media.start.length).toBeGreaterThan(0)
      expect(x.media.end.length).toBeGreaterThan(0)
    }
  })

  test('every record has at least one primary muscle', () => {
    for (const x of all) {
      expect(Array.isArray(x.primaryMuscles)).toBe(true)
      expect(x.primaryMuscles.length).toBeGreaterThan(0)
    }
  })

  test('every muscle and equipment value is canonical', () => {
    for (const x of all) {
      expect(x.primaryMuscles.length).toBeGreaterThan(0)
      for (const m of [...x.primaryMuscles, ...x.secondaryMuscles]) {
        expect(MUSCLES).toContain(m)
      }
      for (const e of x.equipment) expect(EQUIPMENT).toContain(e)
    }
  })

  test('every everkinetic-sourced record carries CC BY-SA attribution', () => {
    for (const x of all.filter(x => x.source === 'everkinetic')) {
      expect(x.attribution).toContain('Everkinetic')
      expect(x.attribution).toContain('CC BY-SA 4.0')
    }
  })

  test('vector media points at existing public SVG paths', () => {
    const v = all.find(x => x.media.kind === 'vector')
    expect(v.media.start).toMatch(/^\/exercises\/svg\/\d+-relaxation\.svg$/)
    expect(v.media.end).toMatch(/^\/exercises\/svg\/\d+-tension\.svg$/)
  })

  test('browse index is lean — only the fields the browser filters on', () => {
    const idx = load('public/exercises/browse-index.json')
    expect(idx.length).toBe(1032)
    expect(Object.keys(idx[0]).sort()).toEqual(
      ['category', 'equipment', 'level', 'mediaKind', 'name', 'primaryMuscles', 'slug'].sort()
    )
    // Must stay small enough to ship to the client.
    const bytes = readFileSync(resolve(ROOT, 'public/exercises/browse-index.json')).length
    expect(bytes).toBeLessThan(400_000)
  })

  test('merge map snapshot — guards against silent fuzzy-match drift', () => {
    const merged = all.filter(x => x.mergedFrom).map(x => x.slug).sort()
    expect(merged.length).toBe(102)
  })
})
```

**Note (as actually implemented in Task 3):** the counts above (1,032 / 266 / 766 / 102)
supersede the estimates below. Two corrections from the original brief were applied:
(1) the everkinetic source is 267 records, not 270, and `usedFe` deduplication means a
free-db record can only be consumed by one Everkinetic match, so the true merge count is
lower than the original 105 estimate; (2) records that end up with zero primary muscles
or zero instructions after merging are **dropped and logged** rather than defaulted
(`['abdominals']` fallback removed — it would have mislabeled anatomy). A
`primaryMuscles.length > 0` invariant test was added. See `task-3-report.md` for the
full reconciliation and the list of the 6 dropped records.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-merge.test.js`
Expected: FAIL — `ENOENT ... src/data/exercises/exercises.json`

- [ ] **Step 3: Write the merge script**

Create `scripts/gen-exercises.mjs`:

```js
#!/usr/bin/env node
// Merge the two vendored exercise datasets into one normalized file plus a
// lightweight browse index. Runs in `npm run prebuild`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMuscle, normalizeEquipment } from '../src/data/exercises/vocab.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const load = p => JSON.parse(readFileSync(resolve(ROOT, p), 'utf-8'))

const EK_ATTRIBUTION = 'Illustration: Everkinetic — CC BY-SA 4.0'
const FE_ATTRIBUTION = 'Photos: free-exercise-db — public domain (Unlicense)'

const ek = load('src/data/exercises/everkinetic.raw.json')
const fe = load('src/data/exercises/free-exercise-db.raw.json')

const slugify = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
const tokens = n => new Set(String(n ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean))
const jaccard = (a, b) => {
  const inter = [...a].filter(x => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

// Split a comma-joined muscle string ("triceps, biceps") into canonical muscles.
const splitMuscles = raw =>
  String(raw ?? '').split(',').map(s => normalizeMuscle(s)).filter(Boolean)

const uniq = a => [...new Set(a)]

// ---- index free-db by token set for fuzzy matching ----
const feIndexed = fe.map(x => ({ rec: x, toks: tokens(x.name) }))
const MATCH_THRESHOLD = 0.75

const usedFe = new Set()
const out = []
const dropped = []

// ---- Everkinetic first: it owns the better (vector) media ----
for (const x of ek) {
  const name = x.title || x.name
  const toks = tokens(name)
  let best = 0, bestRec = null
  for (const cand of feIndexed) {
    if (usedFe.has(cand.rec.id)) continue
    const j = jaccard(toks, cand.toks)
    if (j > best) { best = j; bestRec = cand.rec }
  }
  const matched = best >= MATCH_THRESHOLD ? bestRec : null
  if (matched) usedFe.add(matched.id)

  const primary = uniq([
    ...splitMuscles(x.primary),
    ...(matched?.primaryMuscles ?? []).map(normalizeMuscle).filter(Boolean),
  ])
  const secondary = uniq([
    ...(x.secondary ?? []).flatMap(splitMuscles),
    ...(matched?.secondaryMuscles ?? []).map(normalizeMuscle).filter(Boolean),
  ]).filter(m => !primary.includes(m))

  const equipment = uniq([
    ...(x.equipment ?? []).map(normalizeEquipment),
    ...(matched?.equipment ? [normalizeEquipment(matched.equipment)] : []),
  ])

  const instructions = (x.steps?.length ? x.steps : matched?.instructions) ?? []

  // Never invent a muscle or fabricate instructions — drop and log instead.
  if (primary.length === 0) { dropped.push(`${name} (no primary muscle)`); continue }
  if (instructions.length === 0) { dropped.push(`${name} (no instructions)`); continue }

  out.push({
    slug: slugify(name),
    name,
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    equipment: equipment.length ? equipment : ['other'],
    category: matched?.category ?? 'strength',
    level: matched?.level ?? null,
    force: matched?.force ?? null,
    mechanic: matched?.mechanic ?? x.type ?? null,
    instructions,
    media: {
      kind: 'vector',
      start: `/exercises/svg/${x.id_num}-relaxation.svg`,
      end: `/exercises/svg/${x.id_num}-tension.svg`,
    },
    source: 'everkinetic',
    attribution: EK_ATTRIBUTION,
    ...(matched ? { mergedFrom: matched.id } : {}),
  })
}

// ---- free-db records that were not merged into an Everkinetic record ----
for (const x of fe) {
  if (usedFe.has(x.id)) continue
  const imgs = (x.images ?? []).map(p => `/exercises/photos/${p.replace(/\//g, '__')}`)
  if (imgs.length < 2) continue
  const primary = uniq((x.primaryMuscles ?? []).map(normalizeMuscle).filter(Boolean))
  const secondary = uniq((x.secondaryMuscles ?? []).map(normalizeMuscle).filter(Boolean))
    .filter(m => !primary.includes(m))

  // Never invent a muscle or fabricate instructions — drop and log instead.
  if (primary.length === 0) { dropped.push(`${x.name} (no primary muscle)`); continue }
  const instructions = x.instructions ?? []
  if (instructions.length === 0) { dropped.push(`${x.name} (no instructions)`); continue }

  out.push({
    slug: slugify(x.name),
    name: x.name,
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    equipment: [normalizeEquipment(x.equipment)],
    category: x.category ?? 'strength',
    level: x.level ?? null,
    force: x.force ?? null,
    mechanic: x.mechanic ?? null,
    instructions,
    media: { kind: 'photo', start: imgs[0], end: imgs[1] },
    source: 'free-exercise-db',
    attribution: FE_ATTRIBUTION,
  })
}

for (const name of dropped) console.log(`dropped: ${name}`)

// ---- slug collision resolution: every member of a colliding group is suffixed ----
const bySlug = new Map()
for (const x of out) {
  if (!bySlug.has(x.slug)) bySlug.set(x.slug, [])
  bySlug.get(x.slug).push(x)
}
for (const [slug, group] of bySlug) {
  if (group.length < 2) continue
  group.forEach((x, i) => { x.slug = `${slug}-${i + 1}` })
}

out.sort((a, b) => a.name.localeCompare(b.name))

mkdirSync(resolve(ROOT, 'public/exercises'), { recursive: true })
writeFileSync(resolve(ROOT, 'src/data/exercises/exercises.json'), JSON.stringify(out, null, 2))

const index = out.map(x => ({
  slug: x.slug,
  name: x.name,
  primaryMuscles: x.primaryMuscles,
  equipment: x.equipment,
  category: x.category,
  level: x.level,
  mediaKind: x.media.kind,
}))
writeFileSync(resolve(ROOT, 'public/exercises/browse-index.json'), JSON.stringify(index))

const vector = out.filter(x => x.media.kind === 'vector').length
console.log(`gen-exercises: ${out.length} exercises (${vector} vector, ${out.length - vector} photo), ${out.filter(x => x.mergedFrom).length} merged, ${dropped.length} dropped`)
```

- [ ] **Step 4: Wire it into package.json**

In `package.json`, add to `"scripts"`:

```json
"gen:exercises": "node scripts/gen-exercises.mjs",
```

and append `&& node scripts/gen-exercises.mjs` to the end of the existing `"prebuild"` chain.

- [ ] **Step 5: Run the generator and the test**

Run: `node scripts/gen-exercises.mjs && npx vitest run src/exercise-merge.test.js`
Expected (as actually implemented): prints `gen-exercises: 1032 exercises (266 vector, 766
photo), 102 merged, 6 dropped`; all tests PASS. (Original estimate was `1038/270/768/105`
with no drops — see the reconciliation note above Step 1's test code and `task-3-report.md`
for why the real numbers differ: 267 vendored Everkinetic records not 270, `usedFe`
deduplication reduces true merges below the original 105 estimate, and 6 records — 1 with no
primary muscle, 5 with no instructions in the raw free-exercise-db data — are dropped rather
than defaulted.)

If counts differ, do **not** edit the test to match — investigate the merge threshold first, then reconcile the spec's numbers with reality and update both together.

- [ ] **Step 6: Commit**

```bash
git add scripts/gen-exercises.mjs package.json src/data/exercises/exercises.json public/exercises/browse-index.json src/exercise-merge.test.js
git commit -m "feat(exercises): merge both sources into a normalized dataset + browse index"
```

---

### Task 4: Data access helpers

**Files:**
- Create: `src/data/exercises/index.ts`
- Test: `src/exercise-helpers.test.js`

**Interfaces:**
- Consumes: `src/data/exercises/exercises.json` (Task 3).
- Produces: `exercises: Exercise[]`, `exerciseBySlug: Map<string, Exercise>`, `byMuscle: Record<string, Exercise[]>`, `byEquipment: Record<string, Exercise[]>`, `byCategory: Record<string, Exercise[]>`, `byLevel: Record<string, Exercise[]>`, `facetCounts(field)`, `relatedExercises(ex, n)`, and the `Exercise` TypeScript interface.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-helpers.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { exercises, exerciseBySlug, byMuscle, byEquipment, byCategory, byLevel, relatedExercises } from './data/exercises/index.ts'

describe('exercise helpers', () => {
  test('exercises loads the full merged set', () => {
    expect(exercises.length).toBe(1032)
  })

  test('exerciseBySlug resolves every slug exactly once', () => {
    expect(exerciseBySlug.size).toBe(exercises.length)
    const first = exercises[0]
    expect(exerciseBySlug.get(first.slug)).toEqual(first)
  })

  test('byMuscle groups by every primary muscle', () => {
    expect(Object.keys(byMuscle).length).toBeGreaterThanOrEqual(15)
    expect(byMuscle.chest.length).toBeGreaterThan(0)
    for (const ex of byMuscle.chest) expect(ex.primaryMuscles).toContain('chest')
  })

  test('an exercise with two primary muscles appears under both', () => {
    const multi = exercises.find(x => x.primaryMuscles.length > 1)
    if (!multi) return
    for (const m of multi.primaryMuscles) {
      expect(byMuscle[m].map(x => x.slug)).toContain(multi.slug)
    }
  })

  test('byEquipment, byCategory, byLevel partition the set', () => {
    expect(Object.keys(byEquipment).length).toBeGreaterThan(5)
    expect(Object.keys(byCategory)).toContain('strength')
    expect(Object.keys(byLevel)).toContain('beginner')
  })

  test('relatedExercises returns n others sharing a muscle, never itself', () => {
    const ex = byMuscle.chest[0]
    const rel = relatedExercises(ex, 3)
    expect(rel.length).toBe(3)
    for (const r of rel) {
      expect(r.slug).not.toBe(ex.slug)
      const shares = r.primaryMuscles.some(m => ex.primaryMuscles.includes(m)) ||
                     r.equipment.some(e => ex.equipment.includes(e))
      expect(shares).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-helpers.test.js`
Expected: FAIL — cannot resolve `./data/exercises/index.ts`

- [ ] **Step 3: Write the implementation**

Create `src/data/exercises/index.ts`:

```ts
import data from './exercises.json'

export interface ExerciseMedia {
  kind: 'vector' | 'photo'
  start: string
  end: string
}

export interface Exercise {
  slug: string
  name: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string[]
  category: string
  level: string | null
  force: string | null
  mechanic: string | null
  instructions: string[]
  media: ExerciseMedia
  source: 'everkinetic' | 'free-exercise-db'
  attribution: string
  mergedFrom?: string
}

export const exercises = data as Exercise[]

export const exerciseBySlug: Map<string, Exercise> = new Map(
  exercises.map(e => [e.slug, e])
)

function groupByMulti(field: (e: Exercise) => string[]): Record<string, Exercise[]> {
  const out: Record<string, Exercise[]> = {}
  for (const e of exercises) {
    for (const key of field(e)) {
      ;(out[key] ??= []).push(e)
    }
  }
  return out
}

function groupBySingle(field: (e: Exercise) => string | null): Record<string, Exercise[]> {
  const out: Record<string, Exercise[]> = {}
  for (const e of exercises) {
    const key = field(e)
    if (!key) continue
    ;(out[key] ??= []).push(e)
  }
  return out
}

export const byMuscle = groupByMulti(e => e.primaryMuscles)
export const byEquipment = groupByMulti(e => e.equipment)
export const byCategory = groupBySingle(e => e.category)
export const byLevel = groupBySingle(e => e.level)

/** Counts per facet value, sorted desc — used for hub filter chips. */
export function facetCounts(group: Record<string, Exercise[]>): { value: string; count: number }[] {
  return Object.entries(group)
    .map(([value, list]) => ({ value, count: list.length }))
    .sort((a, b) => b.count - a.count)
}

/** Up to n other exercises sharing a primary muscle, falling back to equipment. */
export function relatedExercises(ex: Exercise, n = 3): Exercise[] {
  const seen = new Set<string>([ex.slug])
  const picked: Exercise[] = []
  const push = (cand: Exercise) => {
    if (picked.length >= n || seen.has(cand.slug)) return
    seen.add(cand.slug)
    picked.push(cand)
  }
  for (const m of ex.primaryMuscles) for (const c of byMuscle[m] ?? []) push(c)
  for (const eq of ex.equipment) for (const c of byEquipment[eq] ?? []) push(c)
  return picked
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/exercise-helpers.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/exercises/index.ts src/exercise-helpers.test.js
git commit -m "feat(exercises): typed data access helpers and facet grouping"
```

---

### Task 5: MuscleMap component

**Files:**
- Create: `src/components/exercises/MuscleMap.astro`
- Create: `src/data/exercises/muscle-regions.mjs`
- Test: `src/exercise-muscle-map.test.js`

**Interfaces:**
- Consumes: `MUSCLES` from `vocab.mjs` (Task 2).
- Produces: `<MuscleMap primary={string[]} secondary={string[]} size="full"|"mini" />`; and `regionsFor(muscle, view)` from `muscle-regions.mjs` returning `string[]` of SVG region ids.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-muscle-map.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { MUSCLES } from './data/exercises/vocab.mjs'
import { regionsFor, ALL_REGIONS } from './data/exercises/muscle-regions.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const map = readFileSync(resolve(ROOT, 'src/components/exercises/MuscleMap.astro'), 'utf-8')

describe('muscle regions', () => {
  test('every canonical muscle maps to at least one region in some view', () => {
    for (const m of MUSCLES) {
      const total = regionsFor(m, 'front').length + regionsFor(m, 'back').length
      expect(total, `no region for muscle: ${m}`).toBeGreaterThan(0)
    }
  })

  test('back-only muscles have no front regions and vice versa', () => {
    expect(regionsFor('lats', 'back').length).toBeGreaterThan(0)
    expect(regionsFor('chest', 'front').length).toBeGreaterThan(0)
    expect(regionsFor('glutes', 'back').length).toBeGreaterThan(0)
  })

  test('unknown muscle returns an empty region list, never throws', () => {
    expect(regionsFor('zzz', 'front')).toEqual([])
  })

  test('every region referenced by regionsFor exists in ALL_REGIONS', () => {
    for (const m of MUSCLES) {
      for (const view of ['front', 'back']) {
        for (const r of regionsFor(m, view)) expect(ALL_REGIONS).toContain(r)
      }
    }
  })
})

describe('MuscleMap.astro', () => {
  test('renders every region id declared in ALL_REGIONS', () => {
    for (const r of ALL_REGIONS) {
      expect(map, `MuscleMap is missing region: ${r}`).toContain(`data-region="${r}"`)
    }
  })

  test('uses global styles, not scoped', () => {
    expect(map).toContain('<style is:global>')
  })

  test('uses design-system colors for primary and secondary', () => {
    expect(map).toContain('#c4553a')
    expect(map).toContain('#e8b9ac')
  })

  test('is accessible — role=img with a muscles-worked label', () => {
    expect(map).toContain('role="img"')
    expect(map).toMatch(/aria-label/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-muscle-map.test.js`
Expected: FAIL — cannot resolve `muscle-regions.mjs`

- [ ] **Step 3: Write the region map**

Create `src/data/exercises/muscle-regions.mjs`:

```js
// Maps canonical muscles to SVG region ids in MuscleMap.astro.
// A muscle may appear in the front view, the back view, or both.

export const ALL_REGIONS = [
  // front
  'pec-l', 'pec-r', 'delt-f-l', 'delt-f-r', 'biceps-l', 'biceps-r',
  'forearm-f-l', 'forearm-f-r', 'abs', 'oblique-l', 'oblique-r',
  'quad-l', 'quad-r', 'adductor-l', 'adductor-r', 'calf-f-l', 'calf-f-r',
  'neck-f',
  // back
  'trap-b', 'lat-l', 'lat-r', 'midback', 'lowerback', 'delt-b-l', 'delt-b-r',
  'triceps-l', 'triceps-r', 'forearm-b-l', 'forearm-b-r',
  'glute-l', 'glute-r', 'ham-l', 'ham-r', 'abductor-l', 'abductor-r',
  'calf-b-l', 'calf-b-r', 'neck-b',
]

const FRONT = {
  chest: ['pec-l', 'pec-r'],
  shoulders: ['delt-f-l', 'delt-f-r'],
  biceps: ['biceps-l', 'biceps-r'],
  forearms: ['forearm-f-l', 'forearm-f-r'],
  abdominals: ['abs', 'oblique-l', 'oblique-r'],
  quadriceps: ['quad-l', 'quad-r'],
  adductors: ['adductor-l', 'adductor-r'],
  calves: ['calf-f-l', 'calf-f-r'],
  neck: ['neck-f'],
}

const BACK = {
  traps: ['trap-b'],
  lats: ['lat-l', 'lat-r'],
  'middle back': ['midback'],
  'lower back': ['lowerback'],
  shoulders: ['delt-b-l', 'delt-b-r'],
  triceps: ['triceps-l', 'triceps-r'],
  forearms: ['forearm-b-l', 'forearm-b-r'],
  glutes: ['glute-l', 'glute-r'],
  hamstrings: ['ham-l', 'ham-r'],
  abductors: ['abductor-l', 'abductor-r'],
  calves: ['calf-b-l', 'calf-b-r'],
  neck: ['neck-b'],
}

export function regionsFor(muscle, view) {
  const table = view === 'back' ? BACK : FRONT
  return table[muscle] ?? []
}
```

- [ ] **Step 4: Write MuscleMap.astro**

Create `src/components/exercises/MuscleMap.astro`. Compute the class for each region from the props, then render both figures. Every id in `ALL_REGIONS` must appear exactly once as a `data-region` attribute.

```astro
---
import { regionsFor } from '../../data/exercises/muscle-regions.mjs'

interface Props {
  primary: string[]
  secondary?: string[]
  size?: 'full' | 'mini'
}
const { primary, secondary = [], size = 'full' } = Astro.props

function classesFor(view: 'front' | 'back'): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of secondary) for (const r of regionsFor(m, view)) out[r] = 'mm-sec'
  for (const m of primary) for (const r of regionsFor(m, view)) out[r] = 'mm-tgt'
  return out
}
const f = classesFor('front')
const b = classesFor('back')
const cf = (map: Record<string, string>, id: string) => `mm-m ${map[id] ?? ''}`.trim()

const label = `Muscles worked: ${primary.join(', ')}${secondary.length ? ` (primary); ${secondary.join(', ')} (secondary)` : ''}`
---
<div class:list={['mm', size === 'mini' && 'mm-mini']} role="img" aria-label={label}>
  <div class="mm-view">
    <svg viewBox="0 0 180 380" xmlns="http://www.w3.org/2000/svg">
      <g class="mm-silh">
        <circle cx="90" cy="26" r="17"/><rect x="82" y="42" width="16" height="9"/>
        <path d="M58 54 Q90 46 122 54 L132 74 L138 150 L126 156 L120 100 L118 210 L96 214 L94 120 L86 120 L84 214 L62 210 L60 100 L54 156 L42 150 L48 74 Z"/>
        <path d="M132 74 L150 90 L156 150 L150 200 L140 200 L138 150 L126 100 Z"/>
        <path d="M48 74 L30 90 L24 150 L30 200 L40 200 L42 150 L54 100 Z"/>
        <path d="M62 210 L84 214 L82 300 L78 360 L64 360 L60 300 Z"/>
        <path d="M118 210 L96 214 L98 300 L102 360 L116 360 L120 300 Z"/>
      </g>
      <rect data-region="neck-f" class={cf(f,'neck-f')} x="83" y="42" width="14" height="10" rx="3"/>
      <ellipse data-region="delt-f-l" class={cf(f,'delt-f-l')} cx="52" cy="78" rx="12" ry="11"/>
      <ellipse data-region="delt-f-r" class={cf(f,'delt-f-r')} cx="128" cy="78" rx="12" ry="11"/>
      <path data-region="pec-l" class={cf(f,'pec-l')} d="M66 74 Q84 70 88 78 L88 96 Q76 98 66 92 Z"/>
      <path data-region="pec-r" class={cf(f,'pec-r')} d="M114 74 Q96 70 92 78 L92 96 Q104 98 114 92 Z"/>
      <ellipse data-region="biceps-l" class={cf(f,'biceps-l')} cx="42" cy="112" rx="9" ry="20" transform="rotate(6 42 112)"/>
      <ellipse data-region="biceps-r" class={cf(f,'biceps-r')} cx="138" cy="112" rx="9" ry="20" transform="rotate(-6 138 112)"/>
      <ellipse data-region="forearm-f-l" class={cf(f,'forearm-f-l')} cx="30" cy="160" rx="8" ry="22"/>
      <ellipse data-region="forearm-f-r" class={cf(f,'forearm-f-r')} cx="150" cy="160" rx="8" ry="22"/>
      <rect data-region="abs" class={cf(f,'abs')} x="78" y="104" width="24" height="42" rx="5"/>
      <path data-region="oblique-l" class={cf(f,'oblique-l')} d="M70 106 L76 106 L76 146 L72 142 Z"/>
      <path data-region="oblique-r" class={cf(f,'oblique-r')} d="M110 106 L104 106 L104 146 L108 142 Z"/>
      <ellipse data-region="quad-l" class={cf(f,'quad-l')} cx="74" cy="255" rx="13" ry="40"/>
      <ellipse data-region="quad-r" class={cf(f,'quad-r')} cx="106" cy="255" rx="13" ry="40"/>
      <ellipse data-region="adductor-l" class={cf(f,'adductor-l')} cx="84" cy="240" rx="5" ry="22"/>
      <ellipse data-region="adductor-r" class={cf(f,'adductor-r')} cx="96" cy="240" rx="5" ry="22"/>
      <ellipse data-region="calf-f-l" class={cf(f,'calf-f-l')} cx="72" cy="330" rx="8" ry="26"/>
      <ellipse data-region="calf-f-r" class={cf(f,'calf-f-r')} cx="108" cy="330" rx="8" ry="26"/>
    </svg>
    <span class="mm-cap">Front</span>
  </div>
  <div class="mm-view">
    <svg viewBox="0 0 180 380" xmlns="http://www.w3.org/2000/svg">
      <g class="mm-silh">
        <circle cx="90" cy="26" r="17"/><rect x="82" y="42" width="16" height="9"/>
        <path d="M58 54 Q90 46 122 54 L132 74 L138 150 L126 156 L120 100 L118 210 L96 214 L94 120 L86 120 L84 214 L62 210 L60 100 L54 156 L42 150 L48 74 Z"/>
        <path d="M132 74 L150 90 L156 150 L150 200 L140 200 L138 150 L126 100 Z"/>
        <path d="M48 74 L30 90 L24 150 L30 200 L40 200 L42 150 L54 100 Z"/>
        <path d="M62 210 L84 214 L82 300 L78 360 L64 360 L60 300 Z"/>
        <path d="M118 210 L96 214 L98 300 L102 360 L116 360 L120 300 Z"/>
      </g>
      <rect data-region="neck-b" class={cf(b,'neck-b')} x="83" y="42" width="14" height="10" rx="3"/>
      <path data-region="trap-b" class={cf(b,'trap-b')} d="M72 58 L108 58 L100 84 L90 90 L80 84 Z"/>
      <ellipse data-region="delt-b-l" class={cf(b,'delt-b-l')} cx="52" cy="78" rx="12" ry="11"/>
      <ellipse data-region="delt-b-r" class={cf(b,'delt-b-r')} cx="128" cy="78" rx="12" ry="11"/>
      <path data-region="lat-l" class={cf(b,'lat-l')} d="M70 88 Q84 86 88 96 L86 130 Q74 128 68 112 Z"/>
      <path data-region="lat-r" class={cf(b,'lat-r')} d="M110 88 Q96 86 92 96 L94 130 Q106 128 112 112 Z"/>
      <rect data-region="midback" class={cf(b,'midback')} x="80" y="92" width="20" height="26" rx="4"/>
      <rect data-region="lowerback" class={cf(b,'lowerback')} x="78" y="134" width="24" height="30" rx="5"/>
      <ellipse data-region="triceps-l" class={cf(b,'triceps-l')} cx="42" cy="112" rx="9" ry="20" transform="rotate(6 42 112)"/>
      <ellipse data-region="triceps-r" class={cf(b,'triceps-r')} cx="138" cy="112" rx="9" ry="20" transform="rotate(-6 138 112)"/>
      <ellipse data-region="forearm-b-l" class={cf(b,'forearm-b-l')} cx="30" cy="160" rx="8" ry="22"/>
      <ellipse data-region="forearm-b-r" class={cf(b,'forearm-b-r')} cx="150" cy="160" rx="8" ry="22"/>
      <path data-region="glute-l" class={cf(b,'glute-l')} d="M72 210 Q86 208 88 224 L84 240 Q72 240 66 226 Z"/>
      <path data-region="glute-r" class={cf(b,'glute-r')} d="M108 210 Q94 208 92 224 L96 240 Q108 240 114 226 Z"/>
      <ellipse data-region="abductor-l" class={cf(b,'abductor-l')} cx="64" cy="238" rx="5" ry="18"/>
      <ellipse data-region="abductor-r" class={cf(b,'abductor-r')} cx="116" cy="238" rx="5" ry="18"/>
      <ellipse data-region="ham-l" class={cf(b,'ham-l')} cx="74" cy="270" rx="12" ry="34"/>
      <ellipse data-region="ham-r" class={cf(b,'ham-r')} cx="106" cy="270" rx="12" ry="34"/>
      <ellipse data-region="calf-b-l" class={cf(b,'calf-b-l')} cx="72" cy="330" rx="9" ry="27"/>
      <ellipse data-region="calf-b-r" class={cf(b,'calf-b-r')} cx="108" cy="330" rx="9" ry="27"/>
    </svg>
    <span class="mm-cap">Back</span>
  </div>
</div>

<style is:global>
  .mm { display: flex; gap: 14px; justify-content: center; }
  .mm-view { text-align: center; flex: 1; min-width: 0; }
  .mm-view svg { width: 100%; height: auto; max-height: 220px; }
  .mm-cap {
    display: block; font-size: 10px; text-transform: uppercase;
    letter-spacing: .05em; color: var(--text-3); margin-top: 4px;
  }
  .mm-silh { fill: #eeeee9; }
  .mm-m { fill: #dcdcd4; stroke: #c9c9c0; stroke-width: .5; }
  .mm-m.mm-sec { fill: #e8b9ac; }
  .mm-m.mm-tgt { fill: #c4553a; }
  .mm-mini .mm-cap { display: none; }
  .mm-mini .mm-view svg { max-height: 96px; }
</style>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/exercise-muscle-map.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/exercises/MuscleMap.astro src/data/exercises/muscle-regions.mjs src/exercise-muscle-map.test.js
git commit -m "feat(exercises): SVG muscle map component with front/back regions"
```

---

### Task 6: ExerciseMedia viewer (4 modes)

**Files:**
- Create: `src/components/exercises/ExerciseMedia.astro`
- Create: `src/tools/exercise-media.js`
- Test: `src/exercise-media.test.js`

**Interfaces:**
- Consumes: an `Exercise['media']` object from Task 4.
- Produces: `<ExerciseMedia media={ExerciseMedia} name={string} />` rendering a `.exm` root with `data-start` / `data-end` / `data-kind`; `src/tools/exercise-media.js` wires the mode buttons and persists the choice under `localStorage['maratool.exercise.mediaMode']`.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-media.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')
const astro = read('src/components/exercises/ExerciseMedia.astro')
const js = read('src/tools/exercise-media.js')

describe('ExerciseMedia.astro', () => {
  test('offers exactly the four approved modes', () => {
    for (const m of ['anim', 'side', 'start', 'end']) {
      expect(astro).toContain(`data-mode="${m}"`)
    }
  })

  test('exposes media data to JS via data attributes', () => {
    expect(astro).toContain('data-start=')
    expect(astro).toContain('data-end=')
    expect(astro).toContain('data-kind=')
  })

  test('reserves height to avoid layout shift', () => {
    expect(astro).toMatch(/min-height/)
  })

  test('uses global styles, not scoped', () => {
    expect(astro).toContain('<style is:global>')
  })
})

describe('exercise-media.js', () => {
  test('animation uses a hard cut, never a crossfade', () => {
    // A crossfade would show the terracotta phase ghosted over the dark one.
    expect(js).not.toMatch(/transition:\s*opacity/)
    expect(js).toMatch(/setInterval/)
  })

  test('persists the chosen mode in localStorage under a namespaced key', () => {
    expect(js).toContain('maratool.exercise.mediaMode')
    expect(js).toMatch(/localStorage\.setItem/)
    expect(js).toMatch(/localStorage\.getItem/)
  })

  test('respects prefers-reduced-motion by defaulting away from animation', () => {
    expect(js).toContain('prefers-reduced-motion')
  })

  test('clears its interval when switching modes (no leaked timers)', () => {
    expect(js).toMatch(/clearInterval/)
  })

  test('uses the hidden attribute, not style.display', () => {
    expect(js).not.toMatch(/style\.display/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-media.test.js`
Expected: FAIL — `ENOENT ... ExerciseMedia.astro`

- [ ] **Step 3: Write the component**

Create `src/components/exercises/ExerciseMedia.astro`:

```astro
---
interface Props {
  media: { kind: 'vector' | 'photo'; start: string; end: string }
  name: string
}
const { media, name } = Astro.props
---
<div class="exm" data-kind={media.kind} data-start={media.start} data-end={media.end}>
  <div class="exm-modes" role="group" aria-label="Display mode">
    <button type="button" data-mode="anim" aria-pressed="true">▶ Animate</button>
    <button type="button" data-mode="side" aria-pressed="false">Side by side</button>
    <button type="button" data-mode="start" aria-pressed="false">Start</button>
    <button type="button" data-mode="end" aria-pressed="false">Effort</button>
  </div>
  <div class="exm-stage" data-name={name}></div>
  <p class="exm-cap"></p>
</div>

<style is:global>
  .exm-modes { display: flex; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: #fff; margin-bottom: 10px; }
  .exm-modes button {
    flex: 1; font: inherit; font-size: 11.5px; padding: 7px 4px;
    border: 0; border-right: 1px solid var(--border); background: #fff;
    color: var(--text-2); cursor: pointer; transition: background 100ms ease;
  }
  .exm-modes button:last-child { border-right: 0; }
  .exm-modes button:hover { background: var(--bg-soft); }
  .exm-modes button[aria-pressed='true'] { background: var(--text); color: #fff; }
  .exm-stage {
    position: relative; background: #fff; border: 1px solid var(--border);
    border-radius: 10px; overflow: hidden; min-height: 300px;
    display: flex; align-items: center; justify-content: center;
  }
  .exm-stage.exm-dual { gap: 0; }
  .exm-phase { flex: 1; display: flex; align-items: center; justify-content: center; padding: 14px; position: relative; min-width: 0; }
  .exm-phase + .exm-phase { border-left: 1px dashed var(--border); }
  .exm-phase img, .exm-phase svg { max-width: 100%; max-height: 260px; height: auto; }
  .exm-phase[data-phase='start'] { color: var(--text); }
  .exm-phase[data-phase='end'] { color: var(--accent); }
  .exm-phase b {
    position: absolute; bottom: 4px; left: 0; right: 0; text-align: center;
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .05em; color: var(--text-3);
  }
  .exm-cap { font-size: 11px; color: var(--text-3); text-align: center; margin: 7px 0 0; }
</style>

<script src="../../tools/exercise-media.js"></script>
```

- [ ] **Step 4: Write the client script**

Create `src/tools/exercise-media.js`:

```js
// Exercise media viewer — 4 modes, hard-cut animation (never a crossfade,
// which ghosted the terracotta phase over the dark one).
;(function () {
  var KEY = 'maratool.exercise.mediaMode'
  var CAPTIONS = {
    anim: 'animated — one phase at a time',
    side: 'both phases side by side',
    start: 'starting position',
    end: 'effort position',
  }

  function readMode() {
    try {
      var saved = localStorage.getItem(KEY)
      if (saved && CAPTIONS[saved]) return saved
    } catch (e) { /* private mode */ }
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reduced ? 'side' : 'anim'
  }

  function saveMode(mode) {
    try { localStorage.setItem(KEY, mode) } catch (e) { /* private mode */ }
  }

  function phaseEl(root, which, label) {
    var kind = root.getAttribute('data-kind')
    var src = root.getAttribute(which === 'start' ? 'data-start' : 'data-end')
    var name = root.querySelector('.exm-stage').getAttribute('data-name') || 'exercise'
    var wrap = document.createElement('div')
    wrap.className = 'exm-phase'
    wrap.setAttribute('data-phase', which)
    if (kind === 'vector') {
      // SVGs use fill="currentColor"; <img> would drop the color, so inline via <object>-free fetch.
      var img = document.createElement('img')
      img.src = src
      img.alt = name + ' — ' + which
      img.loading = 'lazy'
      wrap.appendChild(img)
    } else {
      var photo = document.createElement('img')
      photo.src = src
      photo.alt = name + ' — ' + which
      photo.loading = 'lazy'
      wrap.appendChild(photo)
    }
    if (label) {
      var b = document.createElement('b')
      b.textContent = label
      wrap.appendChild(b)
    }
    return wrap
  }

  function init(root) {
    var stage = root.querySelector('.exm-stage')
    var cap = root.querySelector('.exm-cap')
    var buttons = root.querySelectorAll('.exm-modes button')
    var timer = null

    function render(mode) {
      if (timer) { clearInterval(timer); timer = null }
      stage.textContent = ''
      stage.classList.toggle('exm-dual', mode === 'side')

      if (mode === 'side') {
        stage.appendChild(phaseEl(root, 'start', 'start'))
        stage.appendChild(phaseEl(root, 'end', 'effort'))
      } else if (mode === 'start' || mode === 'end') {
        stage.appendChild(phaseEl(root, mode, null))
      } else {
        var a = phaseEl(root, 'start', null)
        var b = phaseEl(root, 'end', null)
        b.hidden = true
        stage.appendChild(a)
        stage.appendChild(b)
        var showingEnd = false
        timer = setInterval(function () {
          showingEnd = !showingEnd
          a.hidden = showingEnd
          b.hidden = !showingEnd
        }, 1100)
      }

      cap.textContent = CAPTIONS[mode] || ''
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-mode') === mode))
      }
    }

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var mode = e.currentTarget.getAttribute('data-mode')
        saveMode(mode)
        render(mode)
      })
    }

    render(readMode())
  }

  var roots = document.querySelectorAll('.exm')
  for (var i = 0; i < roots.length; i++) init(roots[i])
})()
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/exercise-media.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/exercises/ExerciseMedia.astro src/tools/exercise-media.js src/exercise-media.test.js
git commit -m "feat(exercises): 4-mode media viewer with hard-cut animation"
```

---

### Task 7: Individual exercise pages (1,032 routes)

**Files:**
- Create: `src/pages/exercises/[slug].astro`
- Test: `src/exercise-pages.test.js`

**Interfaces:**
- Consumes: `exercises`, `relatedExercises` (Task 4); `MuscleMap` (Task 5); `ExerciseMedia` (Task 6); `Base.astro` props `{title, description, canonical, schema, breadcrumbSchema?, scope}`.
- Produces: one static route per exercise slug at `/exercises/{slug}/`.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-pages.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exercises } from './data/exercises/index.ts'

const ROOT = resolve(import.meta.dirname, '..')
const page = readFileSync(resolve(ROOT, 'src/pages/exercises/[slug].astro'), 'utf-8')

describe('exercise detail page', () => {
  test('generates one path per exercise via getStaticPaths', () => {
    expect(page).toContain('export function getStaticPaths')
    expect(page).toMatch(/exercises\.map/)
  })

  test('renders the media viewer and the muscle map', () => {
    expect(page).toContain('<ExerciseMedia')
    expect(page).toContain('<MuscleMap')
  })

  test('emits HowTo schema built from the instruction steps', () => {
    expect(page).toContain("'@type': 'HowTo'")
    expect(page).toContain('HowToStep')
  })

  test('renders the license attribution required by CC BY-SA', () => {
    expect(page).toContain('attribution')
    expect(page).toContain('creativecommons.org/licenses/by-sa/4.0')
  })

  test('links related exercises with trailing slashes', () => {
    expect(page).toContain('relatedExercises')
    expect(page).toMatch(/\/exercises\/\$\{[^}]+\}\//)
  })

  test('canonical URL uses a trailing slash', () => {
    expect(page).toMatch(/canonical:\s*`https:\/\/maratool\.com\/exercises\/\$\{[^}]+\}\/`/)
  })

  test('the dataset it renders is non-trivial', () => {
    expect(exercises.length).toBe(1032)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-pages.test.js`
Expected: FAIL — `ENOENT ... src/pages/exercises/[slug].astro`

- [ ] **Step 3: Write the page**

Create `src/pages/exercises/[slug].astro`:

```astro
---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'
import MuscleMap from '../../components/exercises/MuscleMap.astro'
import ExerciseMedia from '../../components/exercises/ExerciseMedia.astro'
import { exercises, relatedExercises } from '../../data/exercises'
import type { Exercise } from '../../data/exercises'

export function getStaticPaths() {
  return exercises.map(ex => ({
    params: { slug: ex.slug },
    props: { ex, related: relatedExercises(ex, 4) },
  }))
}

const { ex, related } = Astro.props as { ex: Exercise; related: Exercise[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const primaryLabel = ex.primaryMuscles.map(cap).join(', ')
const equipLabel = ex.equipment.map(cap).join(', ')

const description =
  `How to do the ${ex.name.toLowerCase()}: step-by-step instructions, muscles worked (${primaryLabel}), and equipment (${equipLabel}). Free exercise guide.`.slice(0, 158)

const seo = {
  title: `${ex.name} — Muscles Worked & How To | maratool`,
  description,
  canonical: `https://maratool.com/exercises/${ex.slug}/`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to do the ${ex.name}`,
    description,
    step: ex.instructions.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Exercises', item: 'https://maratool.com/exercises/' },
      { '@type': 'ListItem', position: 3, name: ex.name, item: `https://maratool.com/exercises/${ex.slug}/` },
    ],
  },
}
---
<Base {...seo} scope="tool">
  <Layout>
    <article class="ex-page">
      <nav class="ex-crumb" aria-label="Breadcrumb">
        <a href="/exercises/">Exercises</a> ›
        <a href={`/exercises/muscle/${ex.primaryMuscles[0]?.replace(/ /g, '-')}/`}>{cap(ex.primaryMuscles[0] ?? '')}</a> ›
        <span>{ex.name}</span>
      </nav>

      <h1>{ex.name}</h1>

      <div class="ex-pills">
        <span class="ex-pill ex-pill-on">🎯 {primaryLabel}</span>
        <span class="ex-pill">🏋️ {equipLabel}</span>
        {ex.level && <span class="ex-pill">{cap(ex.level)}</span>}
        {ex.mechanic && <span class="ex-pill">{cap(ex.mechanic)}</span>}
        {ex.secondaryMuscles.map(m => <span class="ex-pill">{cap(m)} (2°)</span>)}
      </div>

      <div class="ex-body">
        <aside class="ex-aside">
          <ExerciseMedia media={ex.media} name={ex.name} />

          <div class="ex-mapcard">
            <MuscleMap primary={ex.primaryMuscles} secondary={ex.secondaryMuscles} />
            <div class="ex-legend">
              <span><i style="background:#c4553a"></i>Primary</span>
              <span><i style="background:#e8b9ac"></i>Secondary</span>
            </div>
          </div>

          <table class="ex-meta">
            <tbody>
              <tr><td>Primary muscles</td><td>{primaryLabel}</td></tr>
              {ex.secondaryMuscles.length > 0 && <tr><td>Secondary</td><td>{ex.secondaryMuscles.map(cap).join(', ')}</td></tr>}
              <tr><td>Equipment</td><td>{equipLabel}</td></tr>
              <tr><td>Category</td><td>{cap(ex.category)}</td></tr>
              {ex.level && <tr><td>Level</td><td>{cap(ex.level)}</td></tr>}
              {ex.force && <tr><td>Force</td><td>{cap(ex.force)}</td></tr>}
            </tbody>
          </table>
        </aside>

        <section class="ex-steps">
          <h2>How to do the {ex.name.toLowerCase()}</h2>
          <ol>
            {ex.instructions.map(step => <li>{step}</li>)}
          </ol>

          {related.length > 0 && (
            <div class="ex-related">
              <h2>Related exercises</h2>
              <ul>
                {related.map(r => (
                  <li><a href={`/exercises/${r.slug}/`}>{r.name}</a></li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <p class="ex-attr">
        {ex.attribution}
        {ex.source === 'everkinetic' && (
          <> — <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license noopener" target="_blank">license</a>. Modified versions are shared under the same license.</>
        )}
      </p>
      <p class="ex-disclaimer">
        ⓘ Informational only — not a substitute for professional fitness or medical advice.
      </p>
    </article>
  </Layout>
</Base>

<style is:global>
  .ex-page { max-width: 1000px; }
  .ex-crumb { font-size: 12px; color: var(--text-2); margin-bottom: 6px; }
  .ex-crumb a { color: var(--cat-health); text-decoration: none; }
  .ex-page h1 { font-size: 30px; font-weight: 600; margin: 6px 0 10px; letter-spacing: -.01em; }
  .ex-pills { display: flex; gap: 6px; flex-wrap: wrap; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .ex-pill { font-size: 12px; padding: 3px 10px; border-radius: 100px; background: var(--bg-soft); border: 1px solid var(--border); color: var(--text-2); }
  .ex-pill-on { background: #fdf1ee; border-color: var(--accent); color: var(--accent); }
  .ex-body { display: grid; grid-template-columns: 340px 1fr; gap: 24px; padding-top: 18px; }
  .ex-mapcard { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-top: 14px; }
  .ex-legend { display: flex; gap: 14px; justify-content: center; margin-top: 8px; font-size: 11px; color: var(--text-2); }
  .ex-legend i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; margin-right: 4px; }
  .ex-meta { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 14px; }
  .ex-meta td { padding: 7px 0; border-bottom: 1px solid var(--border); }
  .ex-meta td:first-child { color: var(--text-2); width: 44%; }
  .ex-meta td:last-child { font-weight: 500; }
  .ex-steps h2 { font-size: 17px; margin: 0 0 14px; }
  .ex-steps ol { margin: 0; padding: 0; list-style: none; counter-reset: exstep; }
  .ex-steps ol li { counter-increment: exstep; position: relative; padding: 0 0 16px 40px; font-size: 14px; line-height: 1.55; }
  .ex-steps ol li::before {
    content: counter(exstep); position: absolute; left: 0; top: -2px;
    width: 26px; height: 26px; border-radius: 50%; background: var(--bg-soft);
    border: 1px solid var(--border); color: var(--accent); font-size: 12px;
    font-weight: 600; display: flex; align-items: center; justify-content: center;
  }
  .ex-related { margin-top: 26px; }
  .ex-related ul { list-style: none; padding: 0; margin: 0; }
  .ex-related li { padding: 7px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  .ex-related a { color: var(--cat-health); text-decoration: none; }
  .ex-attr, .ex-disclaimer { font-size: 11px; color: var(--text-3); margin: 16px 0 0; }
  .ex-attr a { color: var(--text-2); }
  @media (max-width: 860px) { .ex-body { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 4: Run test and a scoped build to verify**

Run: `npx vitest run src/exercise-pages.test.js && npm run build`
Expected: tests PASS; build completes with zero errors and reports ~1,032 additional pages.

- [ ] **Step 5: Commit**

```bash
git add src/pages/exercises/[slug].astro src/exercise-pages.test.js
git commit -m "feat(exercises): 1032 individual exercise pages with HowTo schema"
```

---

### Task 8: Faceted hub pages

**Files:**
- Create: `src/components/exercises/ExerciseHub.astro`
- Create: `src/pages/exercises/muscle/[muscle].astro`
- Create: `src/pages/exercises/equipment/[equipment].astro`
- Create: `src/pages/exercises/category/[category].astro`
- Create: `src/pages/exercises/level/[level].astro`
- Test: `src/exercise-hubs.test.js`

**Interfaces:**
- Consumes: `byMuscle`, `byEquipment`, `byCategory`, `byLevel`, `facetCounts` (Task 4); `MuscleMap` (Task 5).
- Produces: `<ExerciseHub title subtitle exercises facetLabel facets basePath />`; static routes `/exercises/{muscle|equipment|category|level}/{value}/`.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-hubs.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { byMuscle, byEquipment, byCategory, byLevel } from './data/exercises/index.ts'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('hub routes', () => {
  const routes = {
    muscle: 'src/pages/exercises/muscle/[muscle].astro',
    equipment: 'src/pages/exercises/equipment/[equipment].astro',
    category: 'src/pages/exercises/category/[category].astro',
    level: 'src/pages/exercises/level/[level].astro',
  }

  for (const [name, path] of Object.entries(routes)) {
    test(`${name} hub uses getStaticPaths and renders ExerciseHub`, () => {
      const src = read(path)
      expect(src).toContain('export function getStaticPaths')
      expect(src).toContain('<ExerciseHub')
    })

    test(`${name} hub emits CollectionPage schema and a canonical with trailing slash`, () => {
      const src = read(path)
      expect(src).toContain("'@type': 'CollectionPage'")
      expect(src).toMatch(/canonical:.*\/`/)
    })
  }

  test('hub slugs are URL-safe (spaces become dashes)', () => {
    const src = read(routes.muscle)
    expect(src).toMatch(/replace\(\/ \/g, '-'\)/)
  })

  test('muscle hubs ship an FAQ with FAQPage schema', () => {
    const src = read(routes.muscle)
    expect(src).toContain("'@type': 'FAQPage'")
    expect(src).toContain('faqSchema')
    expect(src).toContain('faqs={faqs}')
  })

  test('facet values exist in the data to generate from', () => {
    expect(Object.keys(byMuscle).length).toBeGreaterThanOrEqual(15)
    expect(Object.keys(byEquipment).length).toBeGreaterThan(5)
    expect(Object.keys(byCategory).length).toBeGreaterThanOrEqual(5)
    expect(Object.keys(byLevel).length).toBe(3)
  })
})

describe('ExerciseHub.astro', () => {
  const hub = read('src/components/exercises/ExerciseHub.astro')

  test('renders a card grid with links to exercise pages', () => {
    expect(hub).toMatch(/\/exercises\/\$\{[^}]+\}\//)
  })

  test('renders an FAQ section when faqs are passed', () => {
    expect(hub).toContain('faqs')
    expect(hub).toContain('<details>')
  })

  test('renders filter chips with counts', () => {
    expect(hub).toContain('facets')
    expect(hub).toContain('count')
  })

  test('uses global styles', () => {
    expect(hub).toContain('<style is:global>')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-hubs.test.js`
Expected: FAIL — `ENOENT ... ExerciseHub.astro`

- [ ] **Step 3: Write ExerciseHub.astro**

```astro
---
import MuscleMap from './MuscleMap.astro'
import type { Exercise } from '../../data/exercises'

interface Facet { value: string; label: string; count: number; href: string }
interface Faq { q: string; a: string }

interface Props {
  title: string
  subtitle: string
  exercises: Exercise[]
  facetLabel: string
  facets: Facet[]
  faqs?: Faq[]
}
const { title, subtitle, exercises, facetLabel, facets, faqs = [] } = Astro.props
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
---
<div class="exh">
  <header class="exh-head">
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </header>

  {facets.length > 0 && (
    <nav class="exh-facets" aria-label={facetLabel}>
      <span class="exh-facet-label">{facetLabel}</span>
      {facets.map(f => (
        <a class="exh-chip" href={f.href}>{f.label} <b>{f.count}</b></a>
      ))}
    </nav>
  )}

  <div class="exh-grid">
    {exercises.map(ex => (
      <a class="exh-card" href={`/exercises/${ex.slug}/`}>
        <div class="exh-thumb">
          <MuscleMap primary={ex.primaryMuscles} secondary={ex.secondaryMuscles} size="mini" />
        </div>
        <h2>{ex.name}</h2>
        <div class="exh-tags">
          {ex.equipment.slice(0, 2).map(e => <span class="exh-tag">{cap(e)}</span>)}
          <span class="exh-tag">{cap(ex.primaryMuscles[0] ?? '')}</span>
        </div>
      </a>
    ))}
  </div>

  {faqs.length > 0 && (
    <section class="exh-faq">
      <h2>{title} — FAQ</h2>
      {faqs.map(f => (
        <details>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  )}
</div>

<style is:global>
  .exh-head h1 { font-size: 28px; font-weight: 600; margin: 0 0 6px; }
  .exh-faq { margin-top: 30px; }
  .exh-faq h2 { font-size: 18px; margin: 0 0 10px; }
  .exh-faq details { border-bottom: 1px solid var(--border); padding: 10px 0; font-size: 13px; }
  .exh-faq summary { cursor: pointer; font-weight: 500; }
  .exh-faq p { color: var(--text-2); margin: 8px 0 0; line-height: 1.55; }
  .exh-head p { font-size: 14px; color: var(--text-2); margin: 0 0 18px; max-width: 620px; line-height: 1.5; }
  .exh-facets { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 18px; }
  .exh-facet-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-3); margin-right: 4px; }
  .exh-chip { font-size: 12px; padding: 4px 11px; border-radius: 100px; background: #fff; border: 1px solid var(--border); color: var(--text-2); text-decoration: none; }
  .exh-chip:hover { background: var(--bg-hover); }
  .exh-chip b { color: var(--text-3); font-weight: 500; }
  .exh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; }
  .exh-card { background: #fff; border: 1px solid var(--border); border-top: 3px solid var(--cat-health); border-radius: 8px; padding: 14px; text-decoration: none; color: inherit; transition: transform 100ms ease, box-shadow 100ms ease; }
  .exh-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .exh-thumb { background: var(--bg-soft); border-radius: 6px; min-height: 96px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
  .exh-card h2 { font-size: 14px; margin: 0 0 8px; font-weight: 600; line-height: 1.3; }
  .exh-tags { display: flex; gap: 5px; flex-wrap: wrap; }
  .exh-tag { font-size: 11px; padding: 2px 8px; border-radius: 100px; background: var(--bg-soft); color: var(--text-2); }
</style>
```

- [ ] **Step 4: Write the four hub routes**

Create `src/pages/exercises/muscle/[muscle].astro`:

```astro
---
import Base from '../../../layouts/Base.astro'
import Layout from '../../../components/Layout.astro'
import ExerciseHub from '../../../components/exercises/ExerciseHub.astro'
import { byMuscle, byEquipment } from '../../../data/exercises'
import type { Exercise } from '../../../data/exercises'

export function getStaticPaths() {
  return Object.entries(byMuscle).map(([muscle, list]) => ({
    params: { muscle: muscle.replace(/ /g, '-') },
    props: { muscle, list },
  }))
}

const { muscle, list } = Astro.props as { muscle: string; list: Exercise[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const slug = muscle.replace(/ /g, '-')
const title = `${cap(muscle)} Exercises`
const description = `${list.length} ${muscle} exercises with step-by-step instructions, muscle maps, and equipment filters. Free, no sign-up.`.slice(0, 158)

// Cross-facet: which equipment appears within this muscle's set.
const equipCounts = new Map<string, number>()
for (const ex of list) for (const e of ex.equipment) equipCounts.set(e, (equipCounts.get(e) ?? 0) + 1)
const facets = [...equipCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([value, count]) => ({
    value,
    label: cap(value),
    count,
    href: `/exercises/equipment/${value.replace(/ /g, '-')}/`,
  }))

const topEquip = facets[0]?.label ?? 'body only'
const bodyweightCount = list.filter(ex => ex.equipment.includes('body only')).length
const faqs = [
  {
    q: `What are the best ${muscle} exercises?`,
    a: `It depends on your available equipment and experience. This page lists all ${list.length} ${muscle} exercises in the database — ${topEquip.toLowerCase()} is the most common equipment for this muscle. Open any exercise for step-by-step instructions.`,
  },
  {
    q: `How do I train ${muscle} without equipment?`,
    a: `${bodyweightCount} of these ${muscle} exercises need no equipment at all. Use the equipment filter above and pick "Body only".`,
  },
  {
    q: `Which other muscles do ${muscle} exercises work?`,
    a: `Most compound movements recruit secondary muscles alongside the ${muscle}. Every exercise page shows a muscle map with the primary muscle in terracotta and secondary muscles in a lighter tint.`,
  },
]

const seo = {
  title: `${title} — ${list.length} Exercises | maratool`,
  description,
  canonical: `https://maratool.com/exercises/muscle/${slug}/`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `https://maratool.com/exercises/muscle/${slug}/`,
    description,
    hasPart: list.slice(0, 50).map(ex => ({
      '@type': 'HowTo',
      name: ex.name,
      url: `https://maratool.com/exercises/${ex.slug}/`,
    })),
  },
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Exercises', item: 'https://maratool.com/exercises/' },
      { '@type': 'ListItem', position: 3, name: title, item: `https://maratool.com/exercises/muscle/${slug}/` },
    ],
  },
}
---
<Base {...seo} scope="hub">
  <Layout scope="hub">
    <ExerciseHub
      title={title}
      subtitle={`${list.length} exercises that target the ${muscle}. Filter by equipment, then open any exercise for step-by-step instructions and a muscle map.`}
      exercises={list}
      facetLabel="Equipment"
      facets={facets}
      faqs={faqs}
    />
  </Layout>
</Base>
```

Create `src/pages/exercises/equipment/[equipment].astro` — identical structure, swapping the facet axis to muscle:

```astro
---
import Base from '../../../layouts/Base.astro'
import Layout from '../../../components/Layout.astro'
import ExerciseHub from '../../../components/exercises/ExerciseHub.astro'
import { byEquipment } from '../../../data/exercises'
import type { Exercise } from '../../../data/exercises'

export function getStaticPaths() {
  return Object.entries(byEquipment).map(([equipment, list]) => ({
    params: { equipment: equipment.replace(/ /g, '-') },
    props: { equipment, list },
  }))
}

const { equipment, list } = Astro.props as { equipment: string; list: Exercise[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const slug = equipment.replace(/ /g, '-')
const title = `${cap(equipment)} Exercises`
const description = `${list.length} exercises you can do with ${equipment}. Step-by-step instructions, muscles worked, and difficulty level.`.slice(0, 158)

const muscleCounts = new Map<string, number>()
for (const ex of list) for (const m of ex.primaryMuscles) muscleCounts.set(m, (muscleCounts.get(m) ?? 0) + 1)
const facets = [...muscleCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([value, count]) => ({
    value,
    label: cap(value),
    count,
    href: `/exercises/muscle/${value.replace(/ /g, '-')}/`,
  }))

const seo = {
  title: `${title} — ${list.length} Exercises | maratool`,
  description,
  canonical: `https://maratool.com/exercises/equipment/${slug}/`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `https://maratool.com/exercises/equipment/${slug}/`,
    description,
    hasPart: list.slice(0, 50).map(ex => ({
      '@type': 'HowTo',
      name: ex.name,
      url: `https://maratool.com/exercises/${ex.slug}/`,
    })),
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Exercises', item: 'https://maratool.com/exercises/' },
      { '@type': 'ListItem', position: 3, name: title, item: `https://maratool.com/exercises/equipment/${slug}/` },
    ],
  },
}
---
<Base {...seo} scope="hub">
  <Layout scope="hub">
    <ExerciseHub
      title={title}
      subtitle={`${list.length} exercises using ${equipment}. Filter by target muscle, then open any exercise for instructions and a muscle map.`}
      exercises={list}
      facetLabel="Muscle"
      facets={facets}
    />
  </Layout>
</Base>
```

Create `src/pages/exercises/category/[category].astro`:

```astro
---
import Base from '../../../layouts/Base.astro'
import Layout from '../../../components/Layout.astro'
import ExerciseHub from '../../../components/exercises/ExerciseHub.astro'
import { byCategory } from '../../../data/exercises'
import type { Exercise } from '../../../data/exercises'

export function getStaticPaths() {
  return Object.entries(byCategory).map(([category, list]) => ({
    params: { category: category.replace(/ /g, '-') },
    props: { category, list },
  }))
}

const { category, list } = Astro.props as { category: string; list: Exercise[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const slug = category.replace(/ /g, '-')
const title = `${cap(category)} Exercises`
const description = `${list.length} ${category} exercises with step-by-step instructions, muscles worked, and equipment. Free, no sign-up.`.slice(0, 158)

const muscleCounts = new Map<string, number>()
for (const ex of list) for (const m of ex.primaryMuscles) muscleCounts.set(m, (muscleCounts.get(m) ?? 0) + 1)
const facets = [...muscleCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([value, count]) => ({
    value,
    label: cap(value),
    count,
    href: `/exercises/muscle/${value.replace(/ /g, '-')}/`,
  }))

const seo = {
  title: `${title} — ${list.length} Exercises | maratool`,
  description,
  canonical: `https://maratool.com/exercises/category/${slug}/`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `https://maratool.com/exercises/category/${slug}/`,
    description,
    hasPart: list.slice(0, 50).map(ex => ({
      '@type': 'HowTo',
      name: ex.name,
      url: `https://maratool.com/exercises/${ex.slug}/`,
    })),
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Exercises', item: 'https://maratool.com/exercises/' },
      { '@type': 'ListItem', position: 3, name: title, item: `https://maratool.com/exercises/category/${slug}/` },
    ],
  },
}
---
<Base {...seo} scope="hub">
  <Layout scope="hub">
    <ExerciseHub
      title={title}
      subtitle={`${list.length} ${category} exercises. Filter by target muscle, then open any exercise for instructions and a muscle map.`}
      exercises={list}
      facetLabel="Muscle"
      facets={facets}
    />
  </Layout>
</Base>
```

Create `src/pages/exercises/level/[level].astro`:

```astro
---
import Base from '../../../layouts/Base.astro'
import Layout from '../../../components/Layout.astro'
import ExerciseHub from '../../../components/exercises/ExerciseHub.astro'
import { byLevel } from '../../../data/exercises'
import type { Exercise } from '../../../data/exercises'

export function getStaticPaths() {
  return Object.entries(byLevel).map(([level, list]) => ({
    params: { level: level.replace(/ /g, '-') },
    props: { level, list },
  }))
}

const { level, list } = Astro.props as { level: string; list: Exercise[] }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const slug = level.replace(/ /g, '-')
const title = `${cap(level)} Exercises`
const description = `${list.length} exercises rated ${level}. Step-by-step instructions, muscles worked, and equipment needed. Free, no sign-up.`.slice(0, 158)

const muscleCounts = new Map<string, number>()
for (const ex of list) for (const m of ex.primaryMuscles) muscleCounts.set(m, (muscleCounts.get(m) ?? 0) + 1)
const facets = [...muscleCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 8)
  .map(([value, count]) => ({
    value,
    label: cap(value),
    count,
    href: `/exercises/muscle/${value.replace(/ /g, '-')}/`,
  }))

const seo = {
  title: `${title} — ${list.length} Exercises | maratool`,
  description,
  canonical: `https://maratool.com/exercises/level/${slug}/`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `https://maratool.com/exercises/level/${slug}/`,
    description,
    hasPart: list.slice(0, 50).map(ex => ({
      '@type': 'HowTo',
      name: ex.name,
      url: `https://maratool.com/exercises/${ex.slug}/`,
    })),
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Exercises', item: 'https://maratool.com/exercises/' },
      { '@type': 'ListItem', position: 3, name: title, item: `https://maratool.com/exercises/level/${slug}/` },
    ],
  },
}
---
<Base {...seo} scope="hub">
  <Layout scope="hub">
    <ExerciseHub
      title={title}
      subtitle={`${list.length} exercises rated ${level}. Filter by target muscle, then open any exercise for instructions and a muscle map.`}
      exercises={list}
      facetLabel="Muscle"
      facets={facets}
    />
  </Layout>
</Base>
```

- [ ] **Step 5: Run test and build**

Run: `npx vitest run src/exercise-hubs.test.js && npm run build`
Expected: tests PASS; build emits the hub routes with zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/exercises/ExerciseHub.astro src/pages/exercises/muscle src/pages/exercises/equipment src/pages/exercises/category src/pages/exercises/level src/exercise-hubs.test.js
git commit -m "feat(exercises): faceted hub pages by muscle, equipment, category, level"
```

---

### Task 9: The browser at /exercises

**Files:**
- Create: `src/pages/exercises/index.astro`
- Create: `src/tools/exercise-browser.js`
- Test: `src/exercise-browser.test.js`

**Interfaces:**
- Consumes: `public/exercises/browse-index.json` (Task 3), fetched at runtime.
- Produces: the `/exercises/` route; `src/tools/exercise-browser.js` renders results into `#ex-results` and wires `#ex-search` plus `.ex-facet` inputs.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-browser.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')
const page = read('src/pages/exercises/index.astro')
const js = read('src/tools/exercise-browser.js')

describe('exercise browser page', () => {
  test('does not inline the full dataset — it fetches the lean index', () => {
    expect(page).not.toContain("from '../../data/exercises/exercises.json'")
    expect(js).toContain('/exercises/browse-index.json')
  })

  test('reserves height on the results container to prevent CLS', () => {
    expect(page).toMatch(/min-height/)
  })

  test('uses global styles and a non-module tool script', () => {
    expect(page).toContain('<style is:global>')
    expect(page).toContain('src="../../tools/exercise-browser.js"')
    expect(page).not.toMatch(/type="module"[^>]*tools\//)
  })

  test('has a search input and the four facet groups', () => {
    expect(page).toContain('id="ex-search"')
    for (const f of ['muscle', 'equipment', 'category', 'level']) {
      expect(page).toContain(`data-facet="${f}"`)
    }
  })

  test('emits CollectionPage schema with a trailing-slash canonical', () => {
    expect(page).toContain("'@type': 'CollectionPage'")
    expect(page).toContain("canonical: 'https://maratool.com/exercises/'")
  })
})

describe('exercise-browser.js', () => {
  test('filters by search text and all four facets', () => {
    for (const f of ['muscle', 'equipment', 'category', 'level']) {
      expect(js).toContain(f)
    }
  })

  test('links results with trailing slashes', () => {
    expect(js).toMatch(/'\/exercises\/'/)
  })

  test('uses the hidden attribute rather than style.display', () => {
    expect(js).not.toMatch(/style\.display/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-browser.test.js`
Expected: FAIL — `ENOENT ... src/pages/exercises/index.astro`

- [ ] **Step 3: Write the page**

Create `src/pages/exercises/index.astro`:

```astro
---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'
import { exercises, byMuscle, byEquipment, byCategory, byLevel, facetCounts } from '../../data/exercises'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const groups = [
  { key: 'muscle', label: 'Muscle', values: facetCounts(byMuscle) },
  { key: 'equipment', label: 'Equipment', values: facetCounts(byEquipment) },
  { key: 'category', label: 'Category', values: facetCounts(byCategory) },
  { key: 'level', label: 'Level', values: facetCounts(byLevel) },
]

const total = exercises.length
const description = `Browse ${total} exercises by muscle, equipment, category, and difficulty. Step-by-step instructions and muscle maps — free, no sign-up.`

const seo = {
  title: `Exercise Database — ${total} Exercises by Muscle & Equipment | maratool`,
  description,
  canonical: 'https://maratool.com/exercises/',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Exercise Database',
    url: 'https://maratool.com/exercises/',
    description,
  },
}
---
<Base {...seo} scope="hub">
  <Layout scope="hub">
    <div class="exb">
      <header class="exb-head">
        <h1>Exercise Database</h1>
        <p>{total} exercises with step-by-step instructions and muscle maps. Search or filter by muscle, equipment, category, and difficulty.</p>
      </header>

      <div class="exb-layout">
        <aside class="exb-side">
          {groups.map(g => (
            <section class="exb-group">
              <h2>{g.label}</h2>
              {g.values.map(v => (
                <label class="exb-facet-row">
                  <input type="checkbox" class="ex-facet" data-facet={g.key} value={v.value} />
                  <span>{cap(v.value)}</span>
                  <b>{v.count}</b>
                </label>
              ))}
            </section>
          ))}
        </aside>

        <div class="exb-main">
          <div class="exb-searchbar">
            <span aria-hidden="true">🔎</span>
            <input id="ex-search" type="search" placeholder="Search exercises…" autocomplete="off" />
          </div>
          <p class="exb-count" id="ex-count">Loading…</p>
          <div class="exb-grid" id="ex-results"></div>
          <p class="exb-empty" id="ex-empty" hidden>No exercises match those filters.</p>
        </div>
      </div>

      <p class="exb-attr">
        Illustrations: Everkinetic (<a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license noopener" target="_blank">CC BY-SA 4.0</a>) ·
        Photos: free-exercise-db (public domain). Informational only — not fitness or medical advice.
      </p>
    </div>
  </Layout>
</Base>

<style is:global>
  .exb-head h1 { font-size: 30px; font-weight: 600; margin: 0 0 6px; }
  .exb-head p { font-size: 14px; color: var(--text-2); margin: 0 0 18px; max-width: 640px; line-height: 1.5; }
  .exb-layout { display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
  .exb-side { border-right: 1px solid var(--border); padding-right: 16px; }
  .exb-group { margin-bottom: 18px; }
  .exb-group h2 { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-3); margin: 0 0 8px; }
  .exb-facet-row { display: flex; align-items: center; gap: 7px; font-size: 13px; padding: 3px 5px; border-radius: 5px; cursor: pointer; color: var(--text-2); }
  .exb-facet-row:hover { background: var(--bg-hover); }
  .exb-facet-row b { margin-left: auto; color: var(--text-3); font-size: 11px; font-weight: 500; }
  .exb-searchbar { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); background: #fff; border-radius: 8px; padding: 10px 12px; }
  .exb-searchbar input { border: 0; outline: 0; font: inherit; font-size: 14px; flex: 1; background: none; }
  .exb-count { font-size: 12px; color: var(--text-2); margin: 10px 2px 12px; }
  .exb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; min-height: 480px; align-content: start; }
  .exb-card { background: #fff; border: 1px solid var(--border); border-top: 3px solid var(--cat-health); border-radius: 8px; padding: 12px; text-decoration: none; color: inherit; transition: transform 100ms ease, box-shadow 100ms ease; }
  .exb-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .exb-card h3 { font-size: 13px; margin: 0 0 7px; font-weight: 600; line-height: 1.3; }
  .exb-tags { display: flex; gap: 5px; flex-wrap: wrap; }
  .exb-tag { font-size: 11px; padding: 2px 8px; border-radius: 100px; background: var(--bg-soft); color: var(--text-2); }
  .exb-empty { font-size: 14px; color: var(--text-2); }
  .exb-attr { font-size: 11px; color: var(--text-3); margin-top: 22px; }
  @media (max-width: 860px) { .exb-layout { grid-template-columns: 1fr; } .exb-side { border-right: 0; padding-right: 0; } }
</style>

<script src="../../tools/exercise-browser.js"></script>
```

- [ ] **Step 4: Write the browser script**

Create `src/tools/exercise-browser.js`:

```js
// Exercise browser — fetches the lean browse index and filters client-side.
;(function () {
  var results = document.getElementById('ex-results')
  var countEl = document.getElementById('ex-count')
  var emptyEl = document.getElementById('ex-empty')
  var search = document.getElementById('ex-search')
  if (!results || !search) return

  var DATA = []

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

  function activeFacets() {
    var out = { muscle: [], equipment: [], category: [], level: [] }
    var boxes = document.querySelectorAll('.ex-facet')
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) out[boxes[i].getAttribute('data-facet')].push(boxes[i].value)
    }
    return out
  }

  function matches(ex, q, f) {
    if (q && ex.name.toLowerCase().indexOf(q) === -1) return false
    if (f.muscle.length) {
      var hit = false
      for (var i = 0; i < f.muscle.length; i++) {
        if (ex.primaryMuscles.indexOf(f.muscle[i]) !== -1) { hit = true; break }
      }
      if (!hit) return false
    }
    if (f.equipment.length) {
      var eHit = false
      for (var j = 0; j < f.equipment.length; j++) {
        if (ex.equipment.indexOf(f.equipment[j]) !== -1) { eHit = true; break }
      }
      if (!eHit) return false
    }
    if (f.category.length && f.category.indexOf(ex.category) === -1) return false
    if (f.level.length && f.level.indexOf(ex.level) === -1) return false
    return true
  }

  function render() {
    var q = search.value.trim().toLowerCase()
    var f = activeFacets()
    var list = []
    for (var i = 0; i < DATA.length; i++) {
      if (matches(DATA[i], q, f)) list.push(DATA[i])
    }

    results.textContent = ''
    var frag = document.createDocumentFragment()
    for (var k = 0; k < list.length; k++) {
      var ex = list[k]
      var a = document.createElement('a')
      a.className = 'exb-card'
      a.href = '/exercises/' + ex.slug + '/'

      var h = document.createElement('h3')
      h.textContent = ex.name
      a.appendChild(h)

      var tags = document.createElement('div')
      tags.className = 'exb-tags'
      var labels = [cap(ex.equipment[0] || ''), cap(ex.primaryMuscles[0] || '')]
      for (var t = 0; t < labels.length; t++) {
        if (!labels[t]) continue
        var span = document.createElement('span')
        span.className = 'exb-tag'
        span.textContent = labels[t]
        tags.appendChild(span)
      }
      a.appendChild(tags)
      frag.appendChild(a)
    }
    results.appendChild(frag)

    countEl.textContent = 'Showing ' + list.length + ' of ' + DATA.length + ' exercises'
    emptyEl.hidden = list.length !== 0
  }

  search.addEventListener('input', render)
  var boxes = document.querySelectorAll('.ex-facet')
  for (var b = 0; b < boxes.length; b++) boxes[b].addEventListener('change', render)

  // ⌘K / Ctrl+K focuses search.
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      search.focus()
    }
  })

  fetch('/exercises/browse-index.json')
    .then(function (r) { return r.json() })
    .then(function (json) { DATA = json; render() })
    .catch(function () { countEl.textContent = 'Could not load the exercise index.' })
})()
```

- [ ] **Step 5: Run test and build**

Run: `npx vitest run src/exercise-browser.test.js && npm run build`
Expected: tests PASS; build clean.

- [ ] **Step 6: Verify in a real browser**

Run: `npm run preview`, open `http://localhost:4321/exercises/`.
Confirm: results render, typing filters instantly, checking facets narrows results, no layout shift on load, and `?embed=1` hides the shell.

- [ ] **Step 7: Commit**

```bash
git add src/pages/exercises/index.astro src/tools/exercise-browser.js src/exercise-browser.test.js
git commit -m "feat(exercises): searchable browser with four facet groups"
```

---

### Task 10: Site integration — registry, Fitness subcategory, blog post

**Files:**
- Modify: `src/data/tools.ts` (append the `exercises` entry; add `'Fitness'` to `subcategoryOrderByCategory.Health`)
- Modify: `src/pages/health/[subcategory].astro` (add the `fitness` descriptions entry)
- Create: `src/pages/blog/exercises.astro`
- Modify: `src/pages/blog/index.astro` (add the post, newest first)
- Test: `src/exercise-integration.test.js`

**Interfaces:**
- Consumes: the `/exercises/` route (Task 9); `BlogToolEmbed` component.
- Produces: registry entry `{slug: 'exercises', …}`; the Health `Fitness` subcategory page at `/health/fitness/`.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-integration.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { tools, subcategoryOrderByCategory } from './data/tools.ts'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('site integration', () => {
  const entry = tools.find(t => t.slug === 'exercises')

  test('the browser is registered as a Health/Fitness tool', () => {
    expect(entry).toBeDefined()
    expect(entry.category).toBe('Health')
    expect(entry.subcategory).toBe('Fitness')
    expect(entry.live).toBe(true)
    expect(entry.blogPost).toBe(true)
  })

  test('Fitness is a Health subcategory', () => {
    expect(subcategoryOrderByCategory.Health).toContain('Fitness')
  })

  test('adding Fitness did not disturb the existing medical subcategories', () => {
    for (const sub of ['Anthropometric', 'Cardiology', 'Renal', 'Pediatric', 'Score']) {
      expect(subcategoryOrderByCategory.Health).toContain(sub)
    }
  })

  test('the health subcategory route has copy for fitness', () => {
    expect(read('src/pages/health/[subcategory].astro')).toContain('fitness:')
  })

  test('the blog post exists and embeds the tool', () => {
    const post = read('src/pages/blog/exercises.astro')
    expect(post).toContain('BlogToolEmbed')
    expect(post).toContain('slug="exercises"')
    expect(post).toContain("'@type': 'BlogPosting'")
  })

  test('the blog post is listed on the blog index', () => {
    expect(read('src/pages/blog/index.astro')).toContain('exercises')
  })

  test('no exercise page links omit the trailing slash', () => {
    const detail = read('src/pages/exercises/[slug].astro')
    expect(detail).not.toMatch(/href="\/exercises"/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-integration.test.js`
Expected: FAIL — `entry` is undefined.

- [ ] **Step 3: Register the tool and the subcategory**

In `src/data/tools.ts`, add `'Fitness'` to the end of the `Health` array in `subcategoryOrderByCategory`:

```ts
Health: ['Anthropometric', 'Cardiology', 'Renal', 'Electrolytes', 'Endocrine', 'Hepatology', 'Ventilation', 'Obstetric', 'Pediatric', 'Drug', 'Infusion', 'Trauma', 'Screening', 'Scale', 'Prognosis', 'Score', 'General', 'Fitness'],
```

Then append this entry to the `tools` array (before the closing `]`):

```ts
  // ── Health / Fitness ──
  {
    slug: 'exercises',
    name: 'Exercise Database — Browse Exercises by Muscle & Equipment',
    emoji: '💪',
    description: 'Browse 1,032 exercises by muscle, equipment, and difficulty. Step-by-step instructions and a muscle map for every exercise — free, no sign-up.',
    category: 'Health',
    subcategory: 'Fitness',
    keywords: ['exercise database', 'exercises by muscle group', 'chest exercises', 'back exercises', 'dumbbell exercises', 'bodyweight exercises', 'workout exercise list', 'exercises by equipment'],
    live: true,
    blogPost: true,
  },
```

- [ ] **Step 4: Add the fitness subcategory copy**

In `src/pages/health/[subcategory].astro`, add to the `descriptions` object:

```ts
    fitness: {
      title: 'Fitness & Exercise Tools — maratool',
      description: 'Browse an exercise database of 1,032 movements by muscle group, equipment, and difficulty — with step-by-step instructions and muscle maps.',
      intro: 'Exercise reference and fitness tools.',
    },
```

- [ ] **Step 5: Write the blog post**

First open `src/pages/blog/ai-token-calculator.astro` and match its import list and wrapper markup exactly — the blog layout components must be imported the same way. Then create `src/pages/blog/exercises.astro`:

```astro
---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'
import BlogToolEmbed from '../../components/BlogToolEmbed.astro'

const title = 'How to find the right exercise for any muscle or equipment'
const description = 'Filter 1,032 exercises by muscle group, equipment, and difficulty — then get step-by-step instructions and a muscle map for each one.'

const seo = {
  title: `${title} | maratool`,
  description,
  canonical: 'https://maratool.com/blog/exercises/',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: '2026-08-16',
    author: { '@type': 'Organization', name: 'maratool' },
    mainEntityOfPage: 'https://maratool.com/blog/exercises/',
  },
}
---
<Base {...seo} scope="page">
  <Layout scope="page">
    <article class="blog-post">
      <h1>{title}</h1>
      <p class="blog-lead">
        Pick the muscle you want to train and the equipment you actually have — the
        database returns every matching exercise with instructions.
      </p>

      <BlogToolEmbed slug="exercises" title="Exercise Database" />

      <h2>How it works</h2>
      <ol>
        <li>Choose a muscle group, or filter by the equipment available to you.</li>
        <li>Scan the results — narrow further by category or difficulty level.</li>
        <li>Open any exercise for step-by-step instructions and a muscle map.</li>
      </ol>

      <h2>Primary vs secondary muscles</h2>
      <p>
        Every exercise lists a primary muscle — the one doing most of the work — and
        often several secondary muscles that assist. A bench press is a chest exercise,
        but it also recruits the triceps and shoulders. The muscle map on each page
        shows this: the primary muscle in terracotta, secondary muscles in a lighter
        tint, on both a front and a back view of the body.
      </p>
      <p>
        This matters when planning a session. Training chest and triceps back to back
        means the triceps are already fatigued from pressing. The muscle maps make that
        overlap visible at a glance.
      </p>

      <h2>Where the data comes from</h2>
      <p>
        The database combines two openly-licensed sources. Vector illustrations come
        from <a href="https://github.com/everkinetic/data" rel="noopener" target="_blank">Everkinetic</a>,
        licensed CC BY-SA 4.0 — each exercise has a start and an effort phase, which is
        what makes the animation possible. Photographs and the broader exercise list come
        from <a href="https://github.com/yuhonas/free-exercise-db" rel="noopener" target="_blank">free-exercise-db</a>,
        released into the public domain. Full details are on the
        <a href="/exercises/licenses/">attribution page</a>.
      </p>

      <p class="blog-footnote">
        Open the <a href="/exercises/">Exercise Database</a> or browse more
        <a href="/health/">health and fitness tools</a>. Informational only — not a
        substitute for professional fitness or medical advice.
      </p>
    </article>
  </Layout>
</Base>
```

Then add it to the `posts` array in `src/pages/blog/index.astro` as the newest (first) entry, matching the shape the existing entries use:

```js
  {
    slug: 'exercises',
    title: 'How to find the right exercise for any muscle or equipment',
    description: 'Filter 1,032 exercises by muscle group, equipment, and difficulty — then get step-by-step instructions and a muscle map for each one.',
    date: '2026-08-16',
  },
```

- [ ] **Step 6: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: all tests PASS (including the pre-existing blog-embed gate); build clean.

- [ ] **Step 7: Commit**

```bash
git add src/data/tools.ts "src/pages/health/[subcategory].astro" src/pages/blog/exercises.astro src/pages/blog/index.astro src/exercise-integration.test.js
git commit -m "feat(exercises): register browser under Health/Fitness with blog post"
```

---

### Task 11: Licensing page and final verification

**Files:**
- Create: `src/pages/exercises/licenses.astro`
- Modify: `public/llms.txt` (mention the exercise database)
- Test: `src/exercise-licensing.test.js`

**Interfaces:**
- Consumes: everything above.
- Produces: `/exercises/licenses/` — the CC BY-SA compliance page linked from every exercise page's attribution line.

- [ ] **Step 1: Write the failing test**

Create `src/exercise-licensing.test.js`:

```js
import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')

describe('licensing compliance', () => {
  const page = read('src/pages/exercises/licenses.astro')

  test('names both sources with their licenses', () => {
    expect(page).toContain('Everkinetic')
    expect(page).toContain('CC BY-SA 4.0')
    expect(page).toContain('free-exercise-db')
    expect(page).toMatch(/Unlicense|public domain/i)
  })

  test('states the ShareAlike obligation on our derived versions', () => {
    expect(page.toLowerCase()).toContain('sharealike')
  })

  test('links the canonical license deed', () => {
    expect(page).toContain('https://creativecommons.org/licenses/by-sa/4.0/')
  })

  test('no Gym visual media anywhere in the repo source or public assets', () => {
    const suspicious = []
    const walk = dir => {
      for (const e of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue
        const rel = `${dir}/${e.name}`
        if (e.isDirectory()) walk(rel)
        else if (/gymvisual/i.test(e.name)) suspicious.push(rel)
      }
    }
    walk('public')
    walk('src')
    expect(suspicious).toEqual([])
  })

  test('the vendored source doc exists and pins both commits', () => {
    expect(existsSync(resolve(ROOT, 'src/data/exercises/EXERCISES_SOURCE.md'))).toBe(true)
    const doc = read('src/data/exercises/EXERCISES_SOURCE.md')
    expect((doc.match(/[0-9a-f]{40}/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/exercise-licensing.test.js`
Expected: FAIL — `ENOENT ... licenses.astro`

- [ ] **Step 3: Write the licensing page**

Create `src/pages/exercises/licenses.astro`:

```astro
---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'

const title = 'Exercise data & image licenses'
const description = 'Attribution and license terms for the exercise illustrations, photographs, and data used in the maratool exercise database.'

const seo = {
  title: `${title} | maratool`,
  description,
  canonical: 'https://maratool.com/exercises/licenses/',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: 'https://maratool.com/exercises/licenses/',
    description,
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Exercises', item: 'https://maratool.com/exercises/' },
      { '@type': 'ListItem', position: 3, name: 'Licenses', item: 'https://maratool.com/exercises/licenses/' },
    ],
  },
}
---
<Base {...seo} scope="page">
  <Layout scope="page">
    <article class="ex-lic">
      <h1>{title}</h1>
      <p>
        The <a href="/exercises/">exercise database</a> is built from two
        openly-licensed sources. This page records what came from where, and the
        terms each one carries.
      </p>

      <h2>Illustrations — Everkinetic</h2>
      <p>
        The vector exercise illustrations come from
        <a href="https://github.com/everkinetic/data" rel="noopener" target="_blank">everkinetic/data</a>,
        licensed under
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license noopener" target="_blank">Creative Commons Attribution-ShareAlike 4.0 International</a>.
      </p>
      <p>
        maratool recolors these SVGs to match its own palette. Under the ShareAlike
        term, <strong>those modified versions are themselves published under CC BY-SA
        4.0</strong> and may be reused on the same terms. The original artwork remains
        credited to Everkinetic.
      </p>

      <h2>Photographs — free-exercise-db</h2>
      <p>
        Exercise photographs and much of the exercise metadata come from
        <a href="https://github.com/yuhonas/free-exercise-db" rel="noopener" target="_blank">yuhonas/free-exercise-db</a>,
        released into the public domain under the Unlicense. No attribution is
        required; we credit it anyway.
      </p>

      <h2>What we do not use</h2>
      <p>
        maratool does not use exercise media from Gym visual or any other
        proprietary source. No such media appears anywhere on this site.
      </p>

      <p class="ex-lic-note">
        ⓘ Exercise instructions are informational only and are not a substitute for
        professional fitness or medical advice.
      </p>
    </article>
  </Layout>
</Base>

<style is:global>
  .ex-lic { max-width: 680px; }
  .ex-lic h1 { font-size: 28px; font-weight: 600; margin: 0 0 12px; }
  .ex-lic h2 { font-size: 17px; margin: 26px 0 8px; }
  .ex-lic p { font-size: 14px; line-height: 1.6; color: var(--text-2); margin: 0 0 10px; }
  .ex-lic a { color: var(--cat-health); }
  .ex-lic-note { margin-top: 26px; font-size: 12px; color: var(--text-3); }
</style>
```

Then update the attribution line in `src/pages/exercises/[slug].astro` to also link this page:

```astro
      <p class="ex-attr">
        {ex.attribution}
        {ex.source === 'everkinetic' && (
          <> — <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license noopener" target="_blank">license</a>. Modified versions are shared under the same license.</>
        )}
        {' '}<a href="/exercises/licenses/">Full attribution →</a>
      </p>
```

- [ ] **Step 4: Update llms.txt**

Add a line to `public/llms.txt` under the tools listing:

```
- [Exercise Database](https://maratool.com/exercises/): 1,032 exercises browsable by muscle, equipment, category, and difficulty, each with step-by-step instructions and a muscle map.
```

- [ ] **Step 5: Run the full suite and a clean build**

Run: `npm test && npm run build`
Expected: every test passes; build finishes with zero errors and zero warnings.

- [ ] **Step 6: Verify the acceptance criteria by hand**

Run `npm run preview` and confirm each item from the spec's §11:
- `/exercises/` — search and all four facet groups filter instantly; no layout shift.
- A vector-media exercise (e.g. `/exercises/bench-press/`) — all four media modes work, animation is a hard cut with no phase overlap, the mode choice persists after reload and carries to another exercise page.
- A photo-media exercise — same four modes, same layout.
- Muscle map is non-empty and correctly highlighted on both.
- Attribution renders and `/exercises/licenses/` is reachable.
- `/health/fitness/` lists the Exercise Database; no existing Health tool URL changed.
- `dist/sitemap-0.xml` contains the exercise routes.

- [ ] **Step 7: Commit**

```bash
git add src/pages/exercises/licenses.astro "src/pages/exercises/[slug].astro" public/llms.txt src/exercise-licensing.test.js
git commit -m "feat(exercises): licensing page and CC BY-SA compliance verification"
```
