// Mean Arterial Pressure — MAP = (SBP + 2*DBP) / 3
// Threshold for adequate end-organ perfusion: ≥ 65 mmHg (Surviving Sepsis Campaign).

function round0(n) { return Math.round(n) }

export function calculateMAP(sbp, dbp) {
  if (sbp <= 0 || dbp <= 0) return null
  if (sbp < dbp) return null
  return round0((sbp + 2 * dbp) / 3)
}

export function classifyMAP(map) {
  if (map === null || map === undefined) return null
  if (map < 65) return 'Hypotension (inadequate perfusion)'
  if (map <= 110) return 'Adequate perfusion'
  return 'Elevated'
}
