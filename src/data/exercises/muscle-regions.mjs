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
