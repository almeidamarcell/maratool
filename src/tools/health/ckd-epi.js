// CKD-EPI 2021 creatinine equation (race-free).
// Reference: Inker LA, Eneanya ND, Coresh J, et al. New Creatinine- and
// Cystatin C-Based Equations to Estimate GFR without Race.
// N Engl J Med. 2021;385(19):1737-1749.
//
// eGFR = 142 × min(Cr/κ, 1)^α × max(Cr/κ, 1)^-1.200 × 0.9938^Age × (1.012 if female)
//   κ = 0.7 (female) or 0.9 (male)
//   α = -0.241 (female) or -0.302 (male)

function round0(n) { return Math.round(n) }

export function ckdEpi2021({ age, sex, creatinineMgDl }) {
  if (creatinineMgDl <= 0) return null
  if (age < 18) return null
  if (sex !== 'male' && sex !== 'female') return null

  const kappa = sex === 'female' ? 0.7 : 0.9
  const alpha = sex === 'female' ? -0.241 : -0.302
  const female = sex === 'female'

  const ratio = creatinineMgDl / kappa
  const minRatio = Math.min(ratio, 1)
  const maxRatio = Math.max(ratio, 1)

  const egfr =
    142 *
    Math.pow(minRatio, alpha) *
    Math.pow(maxRatio, -1.2) *
    Math.pow(0.9938, age) *
    (female ? 1.012 : 1)

  return round0(egfr)
}
