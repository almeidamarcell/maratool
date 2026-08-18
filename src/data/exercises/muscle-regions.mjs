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
  // Calves (gastrocnemius/soleus) are posterior-compartment muscles — the
  // anterior lower leg is the tibialis anterior, a different muscle. Back-only.
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

// Pure region-id -> css-class map for one view, given the primary/secondary
// muscle lists. A muscle listed in both wins as primary ('mm-tgt') over
// secondary ('mm-sec') because primary is assigned second and overwrites.
// Exported (beyond ALL_REGIONS/regionsFor) so MuscleMap.astro's precedence
// rule can be exercised directly in a unit test — Astro's container API
// can't render this .astro file under the project's plain vitest config
// (no Astro Vite plugin registered), so this is the real logic the
// component runs, not a duplicate reimplementation of it.
export function regionClasses(primary, secondary, view) {
  const out = {}
  for (const m of secondary) for (const r of regionsFor(m, view)) out[r] = 'mm-sec'
  for (const m of primary) for (const r of regionsFor(m, view)) out[r] = 'mm-tgt'
  return out
}
