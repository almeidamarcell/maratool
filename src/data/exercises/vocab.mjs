// Canonical vocabularies for the merged exercise dataset.
// Target vocabulary is free-exercise-db's, since it is the larger source.

export const MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest',
  'forearms', 'glutes', 'hamstrings', 'lats', 'lower back', 'middle back',
  'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
]

const MUSCLE_ALIASES = Object.create(null)
Object.assign(MUSCLE_ALIASES, {
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
  // Real variants from Everkinetic dataset
  forearm: 'forearms',
  'hip abductors': 'abductors',
  bicpes: 'biceps',
  should: 'shoulders',
})

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

const EQUIPMENT_ALIASES = Object.create(null)
Object.assign(EQUIPMENT_ALIASES, {
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
})

export function normalizeEquipment(raw) {
  if (typeof raw !== 'string') return 'other'
  const key = raw.trim().toLowerCase()
  if (!key) return 'other'
  if (EQUIPMENT.includes(key)) return key
  return EQUIPMENT_ALIASES[key] ?? 'other'
}
