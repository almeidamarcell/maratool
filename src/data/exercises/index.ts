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
