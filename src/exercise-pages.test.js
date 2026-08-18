import { describe, test, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exercises, exerciseMetaDescription, MAX_META_DESCRIPTION } from './data/exercises/index.ts'
import {
  exerciseDetailContent,
  equipmentAlternatives,
  COVERED_MUSCLES,
  COVERED_MOVEMENTS,
} from './data/exercises/detail-content.ts'

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
    expect(exercises.length).toBe(1035)
  })

  test('renders mechanic as a single value, never a comma-joined pill', () => {
    for (const ex of exercises) {
      if (ex.mechanic === null) continue
      expect(ex.mechanic).not.toContain(',')
    }
  })
})

describe('exercise meta descriptions', () => {
  const all = exercises.map(exerciseMetaDescription)

  test('never exceed the meta description budget', () => {
    for (const d of all) expect(d.length).toBeLessThanOrEqual(MAX_META_DESCRIPTION)
  })

  test('never truncate mid-word — every one ends on a complete sentence', () => {
    // Regression: `.slice(0, 158)` produced endings like
    // "…and equipment (Dumbbell). Free e" on 57 pages.
    for (const d of all) {
      expect(d.endsWith('.')).toBe(true)
      expect(d).not.toMatch(/\s(Fre|Free e|e)$/)
    }
  })

  test('are long enough to be useful', () => {
    for (const d of all) expect(d.length).toBeGreaterThan(100)
  })

  test('a pathologically long name still yields a clean, clamped sentence', () => {
    const monster = {
      ...exercises[0],
      name: 'Standing '.repeat(40) + 'Press',
      primaryMuscles: ['shoulders'],
      equipment: ['barbell'],
    }
    const d = exerciseMetaDescription(monster)
    expect(d.length).toBeLessThanOrEqual(MAX_META_DESCRIPTION)
    expect(d.endsWith('.')).toBe(true)
    expect(d).not.toMatch(/\w-$/)
  })
})

/* ==================================================================== */
/* Body copy: length, variation, and absence of hedge text              */
/* ==================================================================== */

/*
 * Why these tests exist.
 *
 * These 1,035 pages were the how-to steps and nothing else: measured on the
 * built output of `dist/exercises/*​/index.html`, the article body had a median
 * of 184 words, a minimum of 85, 661 pages under 200 and 979 under 300. On a
 * templated set this size that is the exact shape Google's thin-content and
 * helpful-content systems are built to catch, and no test caught it.
 *
 * `detail-content.ts` adds prose derived from each record's own fields. The
 * risk it introduces is the opposite failure: generic filler that reads
 * identically on every page, which is an E-E-A-T problem rather than a length
 * problem. So length alone is not enough — the variation tests below are what
 * stop the fix becoming a worse version of the bug.
 */

const words = s => String(s).split(/\s+/).filter(Boolean).length
const median = xs => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

const content = new Map(exercises.map(ex => [ex.slug, exerciseDetailContent(ex)]))

/**
 * Words the page renders from the record itself: the instruction steps plus
 * every sentence, chip and list row `detail-content.ts` produces.
 *
 * This deliberately excludes the template chrome the layout adds on every page
 * — breadcrumb, h1, pill row, metadata table, related-exercises heading,
 * attribution and disclaimer. That chrome measured a consistent 100–109 words
 * on the built output, so the rendered article body always exceeds the number
 * this function returns. Asserting on the smaller number keeps the test honest
 * about what is actually per-record content.
 */
function bodyWords(ex) {
  const c = content.get(ex.slug)
  let n = ex.instructions.reduce((a, s) => a + words(s), 0)
  n += c.muscles.reduce((a, s) => a + words(s), 0)
  n += c.movement.reduce((a, s) => a + words(s), 0)
  n += c.equipment.reduce((a, s) => a + words(s), 0)
  n += words(c.alternativesLead)
  n += c.muscleLinks.reduce((a, l) => a + words(l.label), 0) + 3
  n += c.equipmentLinks.length
    ? c.equipmentLinks.reduce((a, l) => a + words(l.label), 0) + 3
    : 0
  n += c.alternatives.reduce((a, x) => a + words(x.name) + words(x.equipment), 0)
  if (c.level) n += words(c.level.note) + 16
  return n
}

/**
 * Floor for per-record words (instructions + generated prose) on the thinnest
 * page in the set.
 *
 * Derivation: the project's SEO quality gates put the safe floor for the
 * lightest page type at 200 rendered words. The thinnest page currently
 * measures 151 here and 260 in the built article body — the ~109-word gap is
 * the shared chrome. 130 leaves room for a copy edit to shorten a sentence
 * without a red build, while still failing loudly if a whole section is
 * dropped: the smallest section this module emits is worth ~30 words.
 */
const MIN_BODY_WORDS = 130

/**
 * Target median for the same measure. Currently 343, which renders as a
 * 443-word median article body — inside the 350–450 band this work was aimed
 * at. 300 is set below the current value with headroom, and comfortably above
 * the 193-word median the pages started from, so a regression that quietly
 * reverts a section fails here.
 */
const MEDIAN_BODY_WORDS = 300

describe('exercise detail page length', () => {
  const all = exercises.map(bodyWords)

  test('no page falls below the thin-content floor', () => {
    const thin = exercises
      .map((ex, i) => ({ slug: ex.slug, n: all[i] }))
      .filter(x => x.n < MIN_BODY_WORDS)
    expect(thin).toEqual([])
  })

  test('the median clears the target', () => {
    expect(median(all)).toBeGreaterThan(MEDIAN_BODY_WORDS)
  })

  test('every page gets at least three of the four content sections', () => {
    for (const ex of exercises) {
      const c = content.get(ex.slug)
      const present = [
        c.muscles.length > 0,
        c.movement.length > 0,
        c.equipment.length > 0 || c.alternatives.length > 0,
        c.level !== null,
      ].filter(Boolean).length
      expect(present, ex.slug).toBeGreaterThanOrEqual(3)
    }
  })

  test('the anatomy table covers every muscle value in the dataset', () => {
    // A missing entry would silently shorten the muscles paragraph rather than
    // erroring, so the coverage is asserted rather than assumed.
    const used = new Set(exercises.flatMap(e => [...e.primaryMuscles, ...e.secondaryMuscles]))
    for (const m of used) expect(COVERED_MUSCLES, m).toContain(m)
  })

  test('the movement table covers every force x mechanic pair that has one', () => {
    const used = new Set(
      exercises
        .filter(e => e.force !== null || e.mechanic !== null)
        .map(e => `${e.force ?? 'null'}|${e.mechanic ?? 'null'}`)
    )
    for (const k of used) expect(COVERED_MOVEMENTS, k).toContain(k)
  })
})

/*
 * Variation thresholds.
 *
 * Measured across all 1,035 records at the time of writing:
 *   - 394 distinct "muscles worked" paragraphs, the most repeated appearing on
 *     61 pages (5.9%)
 *   - 591 distinct alternative lists, the most repeated appearing on 10 pages
 *
 * The thresholds sit well below those measurements on purpose. The dataset has
 * 28 distinct primary-muscle sets and 314 distinct primary/secondary pairs, so
 * a change that collapsed the prose back to one paragraph per muscle would
 * land near 28 and a change that collapsed it entirely would land at 1 —
 * either fails 250 immediately. The headroom is there so that adding
 * exercises, or rewording one muscle entry, does not fail the suite.
 */
const MIN_DISTINCT_MUSCLE_PARAGRAPHS = 250
const MAX_PARAGRAPH_SHARE = 0.1
const MIN_DISTINCT_ALTERNATIVE_LISTS = 400

describe('exercise detail page copy genuinely varies', () => {
  const musclesText = exercises.map(ex => content.get(ex.slug).muscles.join(' '))

  test('hundreds of distinct "muscles worked" paragraphs', () => {
    expect(new Set(musclesText).size).toBeGreaterThan(MIN_DISTINCT_MUSCLE_PARAGRAPHS)
  })

  test('no single "muscles worked" paragraph covers a large share of pages', () => {
    const counts = new Map()
    for (const t of musclesText) counts.set(t, (counts.get(t) ?? 0) + 1)
    const worst = Math.max(...counts.values())
    expect(worst / exercises.length).toBeLessThan(MAX_PARAGRAPH_SHARE)
  })

  test('exercises with different primary muscles never share muscle prose', () => {
    // One representative per distinct primary-muscle set. If two of them read
    // the same, the prose is not actually keyed on the muscle.
    const rep = new Map()
    for (const ex of exercises) {
      const key = ex.primaryMuscles.join('+')
      if (!rep.has(key)) rep.set(key, ex)
    }
    const seen = new Map()
    for (const [key, ex] of rep) {
      const first = content.get(ex.slug).muscles[0]
      expect(seen.has(first), `${key} duplicates ${seen.get(first)}`).toBe(false)
      seen.set(first, key)
    }
    expect(rep.size).toBeGreaterThan(20)
  })

  test('each force x mechanic pair gets its own explanation, not a reworded one', () => {
    const byPair = new Map()
    for (const ex of exercises) {
      if (ex.force === null && ex.mechanic === null) continue
      byPair.set(`${ex.force ?? 'null'}|${ex.mechanic ?? 'null'}`, content.get(ex.slug).movement[0])
    }
    expect(byPair.size).toBeGreaterThanOrEqual(12)
    // Distinct texts, and each substantial enough to explain something.
    expect(new Set(byPair.values()).size).toBe(byPair.size)
    for (const [pair, text] of byPair) expect(words(text), pair).toBeGreaterThan(35)
  })

  test('different equipment yields different equipment prose', () => {
    const byEquip = new Map()
    for (const ex of exercises) {
      const c = content.get(ex.slug)
      if (c.equipment.length !== 1) continue
      byEquip.set(ex.equipment.find(e => e !== 'other') ?? ex.equipment[0], c.equipment[0])
    }
    expect(byEquip.size).toBeGreaterThan(10)
    expect(new Set(byEquip.values()).size).toBe(byEquip.size)
  })

  test('alternative lists are near-unique per page and point somewhere else', () => {
    const lists = exercises.map(ex =>
      content.get(ex.slug).alternatives.map(a => a.slug).join(',')
    )
    expect(new Set(lists).size).toBeGreaterThan(MIN_DISTINCT_ALTERNATIVE_LISTS)
    for (const ex of exercises) {
      for (const alt of content.get(ex.slug).alternatives) {
        expect(alt.slug, ex.slug).not.toBe(ex.slug)
      }
    }
  })

  test('every alternative really does need different equipment', () => {
    // The list's entire promise. A candidate sharing any equipment value with
    // the page it appears on would make the section a lie.
    for (const ex of exercises) {
      const own = new Set(ex.equipment)
      for (const alt of content.get(ex.slug).alternatives) {
        for (const e of alt.equipment.split(' + ')) {
          expect(own.has(e), `${ex.slug} -> ${alt.slug}`).toBe(false)
        }
      }
    }
  })

  test('every alternative links to a real exercise with a trailing slash', () => {
    const slugs = new Set(exercises.map(e => e.slug))
    for (const ex of exercises) {
      for (const alt of content.get(ex.slug).alternatives) {
        expect(slugs.has(alt.slug), alt.slug).toBe(true)
      }
      for (const l of [...content.get(ex.slug).muscleLinks, ...content.get(ex.slug).equipmentLinks]) {
        expect(l.href.endsWith('/'), l.href).toBe(true)
      }
    }
  })

  test('generation is deterministic — the build must be reproducible', () => {
    const once = JSON.stringify(exercises.map(exerciseDetailContent))
    const twice = JSON.stringify(exercises.map(exerciseDetailContent))
    expect(twice).toBe(once)
    expect(JSON.stringify(equipmentAlternatives(exercises[0]))).toBe(
      JSON.stringify(equipmentAlternatives(exercises[0]))
    )
  })
})

describe('exercise detail page never emits hedge text', () => {
  /**
   * A null `force`, `mechanic` or `level` must drop its sentence, not render an
   * apology or leak the raw value. 167 records have no level, 17 have neither
   * force nor mechanic, and 201 name no equipment, so every one of these
   * patterns is reachable.
   */
  const FORBIDDEN = [
    /\bnot available\b/i,
    /\bnot specified\b/i,
    /\bunknown\b/i,
    /\bn\/a\b/i,
    /\bnone\b/i,
    /\bno information\b/i,
    /\bnot listed\b/i,
    /\bundefined\b/i,
    /\bnull\b/i,
    /\bNaN\b/,
    /\[object Object\]/,
    // Punctuation artefacts left behind when an interpolated value is empty.
    /\bthe\s*[.,;:]/i,
    /\(\s*\)/,
    /\s{2,}/,
    /[:,;]\s*[.]/,
    /\band\s+and\b/i,
    /\bthe\s+the\b/i,
  ]

  const strings = ex => {
    const c = content.get(ex.slug)
    return [
      ...c.muscles,
      ...c.movement,
      ...c.equipment,
      c.alternativesLead,
      ...c.muscleLinks.flatMap(l => [l.label, l.href]),
      ...c.equipmentLinks.flatMap(l => [l.label, l.href]),
      ...c.alternatives.flatMap(a => [a.name, a.equipment]),
      ...(c.level ? [c.level.note, c.level.label, c.level.muscle] : []),
    ]
  }

  test('no page contains a null-field artefact', () => {
    const offenders = []
    for (const ex of exercises) {
      for (const s of strings(ex)) {
        for (const re of FORBIDDEN) {
          if (re.test(s)) offenders.push(`${ex.slug}: ${re} in "${s}"`)
        }
      }
    }
    expect(offenders.slice(0, 10)).toEqual([])
  })

  test('no sentence is empty or unterminated', () => {
    for (const ex of exercises) {
      const c = content.get(ex.slug)
      for (const s of [...c.muscles, ...c.movement, ...c.equipment]) {
        expect(s.trim().length, ex.slug).toBeGreaterThan(20)
        expect(/[.:!?]$/.test(s.trim()), `${ex.slug}: "${s}"`).toBe(true)
      }
    }
  })

  test('records with no level render no difficulty section at all', () => {
    const noLevel = exercises.filter(e => e.level === null)
    expect(noLevel.length).toBeGreaterThan(0)
    for (const ex of noLevel) expect(content.get(ex.slug).level).toBeNull()
  })

  test('records with neither force nor mechanic drop the movement explanation', () => {
    const neither = exercises.filter(e => e.force === null && e.mechanic === null)
    expect(neither.length).toBeGreaterThan(0)
    for (const ex of neither) {
      // The category sentence survives; the force x mechanic one does not.
      expect(content.get(ex.slug).movement.length, ex.slug).toBe(1)
    }
  })

  test('counts quoted in the difficulty section are real and consistent', () => {
    for (const ex of exercises) {
      const lvl = content.get(ex.slug).level
      if (!lvl) continue
      expect(lvl.sameLevel).toBeGreaterThan(0)
      expect(lvl.sameLevel).toBeLessThanOrEqual(lvl.muscleTotal)
      expect(lvl.muscleTotal).toBeGreaterThan(0)
    }
  })
})

describe('exercise detail page renders the new copy in the right place', () => {
  test('imports the content module and passes it through getStaticPaths', () => {
    expect(page).toContain("from '../../data/exercises/detail-content'")
    expect(page).toContain('exerciseDetailContent(ex)')
  })

  test('sits after the instructions and before the related list', () => {
    const steps = page.indexOf('ex.instructions.map')
    const detail = page.indexOf('class="ex-detail"')
    const related = page.indexOf('class="ex-related"')
    expect(steps).toBeGreaterThan(-1)
    expect(detail).toBeGreaterThan(steps)
    expect(related).toBeGreaterThan(detail)
  })

  test('styles stay global — JS-free, but the project rule is global either way', () => {
    expect(page).toContain('<style is:global>')
    expect(page).not.toMatch(/<style>\s/)
  })

  test('adds no client-side script', () => {
    expect(page).not.toContain('<script')
  })

  test('does not add FAQ or extra HowTo schema', () => {
    // HowTo rich results were removed in Sept 2023 and FAQPage is limited to
    // government and health-authority sites, so neither earns anything here.
    expect(page).not.toContain('FAQPage')
    expect(page.match(/'@type': 'HowTo'/g) ?? []).toHaveLength(1)
  })
})
