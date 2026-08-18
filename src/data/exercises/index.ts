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

/**
 * Exercises rendered per hub page. Hubs used to render the whole facet, which
 * put ~100k DOM tags on /exercises/category/strength/. Paginating keeps every
 * exercise crawler-reachable while holding each page inside Lighthouse's DOM
 * budget.
 */
export const HUB_PAGE_SIZE = 60

/**
 * Display label for an equipment value. `other` is the generator's fallback for
 * records whose source data names no equipment, so rendering it raw produced
 * copy like "205 exercises you can do with other".
 */
export function equipmentLabel(value: string): string {
  return value === 'other' ? 'no equipment listed' : value
}

/** Longest meta description we will emit. */
export const MAX_META_DESCRIPTION = 158

/**
 * Meta description for an exercise page.
 *
 * A flat `.slice(0, MAX)` truncated 57 of these mid-word — "…and equipment
 * (Dumbbell). Free e". Instead, drop whole clauses until the sentence fits, so
 * every description ends on a complete word and a full stop. The final clamp is
 * a last-resort guard for a pathologically long exercise name; it too cuts on a
 * word boundary.
 */
export function exerciseMetaDescription(ex: Exercise): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const primary = ex.primaryMuscles.map(cap).join(', ')
  const equip = ex.equipment.map(cap).join(', ')
  const name = ex.name.toLowerCase()

  const candidates = [
    `How to do the ${name}: step-by-step instructions, muscles worked (${primary}), and equipment (${equip}). Free exercise guide.`,
    `How to do the ${name}: step-by-step instructions, muscles worked (${primary}), and equipment (${equip}).`,
    `How to do the ${name}: step-by-step instructions and muscles worked (${primary}). Free exercise guide.`,
    `How to do the ${name}: step-by-step instructions and muscles worked (${primary}).`,
    `How to do the ${name}: step-by-step instructions, muscles worked, and equipment needed. Free exercise guide.`,
  ]
  const fits = candidates.find(c => c.length <= MAX_META_DESCRIPTION)
  if (fits) return fits

  const cut = candidates[candidates.length - 1].slice(0, MAX_META_DESCRIPTION)
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.(–—-]+$/, '') + '.'
}

/** Counts per facet value, sorted desc — used for hub filter chips. */
export function facetCounts(group: Record<string, Exercise[]>): { value: string; count: number }[] {
  return Object.entries(group)
    .map(([value, list]) => ({ value, count: list.length }))
    .sort((a, b) => b.count - a.count)
}

/**
 * How alike two exercises are. Higher wins. Weights are ordered so that a
 * candidate sharing equipment and level outranks one that only happens to
 * share the same primary muscle — a bare shared muscle is the weakest possible
 * signal here, because every candidate in the pool already has one.
 */
function similarity(ex: Exercise, c: Exercise): number {
  const overlap = (a: string[], b: string[]) => a.filter(x => b.includes(x)).length
  let s = 0
  s += overlap(c.primaryMuscles, ex.primaryMuscles) * 6
  s += overlap(c.equipment, ex.equipment) * 5
  if (c.level && c.level === ex.level) s += 4
  if (c.category === ex.category) s += 3
  if (c.mechanic && c.mechanic === ex.mechanic) s += 2
  if (c.force && c.force === ex.force) s += 1
  s += Math.min(overlap(c.secondaryMuscles, ex.secondaryMuscles), 2)
  return s
}

/**
 * Up to n genuinely similar exercises, sharing a primary muscle or equipment.
 *
 * Two properties matter and are easy to lose:
 *
 * 1. **Variety.** Walking each group from index 0 gave every exercise sharing a
 *    primary muscle the same alphabetically-first neighbours — 84 distinct
 *    blocks across 1,035 pages, 950 pages with zero inbound related links. The
 *    walk is therefore seeded at the exercise's own position in the group and
 *    wraps around, so each exercise starts from a different neighbourhood.
 * 2. **Determinism.** No randomness anywhere; the build must be reproducible.
 *    `Array.prototype.sort` is stable (ES2019+), and ties are additionally
 *    broken on the pool index, so equal-scoring candidates keep the seeded
 *    order rather than collapsing back to one shared alphabetical head.
 */
export function relatedExercises(ex: Exercise, n = 3): Exercise[] {
  const seen = new Set<string>([ex.slug])
  const pool: Exercise[] = []

  const addGroup = (group: Exercise[] | undefined) => {
    if (!group) return
    const i = group.findIndex(g => g.slug === ex.slug)
    // Seed at this exercise's own position and wrap, so neighbours differ.
    const rotated = i >= 0 ? [...group.slice(i + 1), ...group.slice(0, i)] : group
    for (const c of rotated) {
      if (seen.has(c.slug)) continue
      seen.add(c.slug)
      pool.push(c)
    }
  }

  for (const m of ex.primaryMuscles) addGroup(byMuscle[m])
  for (const eq of ex.equipment) addGroup(byEquipment[eq])

  return pool
    .map((c, idx) => ({ c, idx, score: similarity(ex, c) }))
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
    .slice(0, n)
    .map(x => x.c)
}
