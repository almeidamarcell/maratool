// General medical calculators — pure functions.
// References per function below.

function round0(n) { return Math.round(n) }
function round1(n) { return Math.round(n * 10) / 10 }

// ─── QTc ─────────────────────────────────────────────────────────────
// QT, QTc in ms; HR in bpm; RR in seconds (= 60 / HR).

function rrSeconds(hr) {
  if (hr <= 0) return null
  return 60 / hr
}

// Bazett (1920): QTc = QT / sqrt(RR_s)
export function qtcBazett({ qtMs, hr }) {
  const rr = rrSeconds(hr); if (rr === null || qtMs <= 0) return null
  return round0(qtMs / Math.sqrt(rr))
}

// Fridericia (1920): QTc = QT / RR^(1/3)
export function qtcFridericia({ qtMs, hr }) {
  const rr = rrSeconds(hr); if (rr === null || qtMs <= 0) return null
  return round0(qtMs / Math.cbrt(rr))
}

// Framingham (Sagie 1992): QTc = QT + 154 × (1 − RR)
export function qtcFramingham({ qtMs, hr }) {
  const rr = rrSeconds(hr); if (rr === null || qtMs <= 0) return null
  return round0(qtMs + 154 * (1 - rr))
}

// Hodges (1983): QTc = QT + 1.75 × (HR − 60)
export function qtcHodges({ qtMs, hr }) {
  if (hr <= 0 || qtMs <= 0) return null
  return round0(qtMs + 1.75 * (hr - 60))
}

export function classifyQtc(qtcMs, sex) {
  if (qtcMs === null || qtcMs === undefined) return null
  if (qtcMs < 360) return 'Short'
  if (sex === 'female') {
    if (qtcMs <= 459) return 'Normal'
    if (qtcMs <= 479) return 'Borderline prolonged'
    return 'Prolonged'
  }
  // male / default
  if (qtcMs <= 449) return 'Normal'
  if (qtcMs <= 469) return 'Borderline prolonged'
  return 'Prolonged'
}

// ─── Friedewald LDL ──────────────────────────────────────────────────
// LDL (mg/dL) = TC − HDL − TG/5. Invalid when TG > 400 mg/dL.
// Ref: Friedewald WT et al. Clin Chem. 1972;18(6):499-502.
export function friedewaldLdl({ totalChol, hdl, triglycerides }) {
  if (totalChol <= 0 || hdl <= 0 || triglycerides < 0) return null
  if (triglycerides > 400) return null
  return round0(totalChol - hdl - triglycerides / 5)
}

// ─── Parkland Burn Formula ───────────────────────────────────────────
// Total fluid (mL) = 4 × weight (kg) × %TBSA (over 24h, half in first 8h).
// Ref: Baxter CR, Shires T. Ann N Y Acad Sci. 1968;150(3):874-894.
export function parklandFluid({ weightKg, tbsaPercent }) {
  if (weightKg <= 0 || tbsaPercent <= 0) return null
  const total = 4 * weightKg * tbsaPercent
  const first8h = total / 2
  return {
    totalMl: round0(total),
    first8hMl: round0(first8h),
    first8hRatePerHour: round0(first8h / 8),
    next16hRatePerHour: round0((total - first8h) / 16),
  }
}

// ─── eAG from HbA1c ──────────────────────────────────────────────────
// eAG (mg/dL) = 28.7 × HbA1c − 46.7. Displayed to 1 decimal to match Whitebook.
// Ref: Nathan DM et al. Diabetes Care. 2008;31(8):1473-1478.
export function hba1cToEag(hba1cPct) {
  if (hba1cPct <= 0) return null
  const mgDl = 28.7 * hba1cPct - 46.7
  return {
    mgDl: round1(mgDl),
    mmolL: round1(mgDl / 18.018),
  }
}

// ─── SAAG (Serum-Ascites Albumin Gradient) ───────────────────────────
// SAAG = serum albumin − ascitic albumin. Both in g/dL.
// Ref: Runyon BA, Montano AA, et al. Ann Intern Med. 1992;117(3):215-220.
export function saag({ serumAlb, asciticAlb }) {
  if (serumAlb <= 0 || asciticAlb < 0) return null
  return round1(serumAlb - asciticAlb)
}
export function classifySaag(saagValue) {
  if (saagValue === null || saagValue === undefined) return null
  return saagValue >= 1.1 ? 'Portal hypertension (transudate)' : 'Non-portal hypertensive (exudate)'
}

// ─── Transferrin Saturation ──────────────────────────────────────────
// TSAT (%) = (serum iron / TIBC) × 100.
export function transferrinSaturation({ serumIron, tibc }) {
  if (tibc <= 0 || serumIron < 0) return null
  return round1((serumIron / tibc) * 100)
}

// ─── Blood Volume — Nadler formula ───────────────────────────────────
// Output in mL.
// Male:   (0.3669 × H_m³ + 0.03219 × W + 0.6041) × 1000
// Female: (0.3561 × H_m³ + 0.03308 × W + 0.1833) × 1000
// Ref: Nadler SB, Hidalgo JU, Bloch T. Surgery. 1962;51(2):224-232.
export function bloodVolumeNadler({ weightKg, heightCm, sex }) {
  if (weightKg <= 0 || heightCm <= 0) return null
  if (sex !== 'male' && sex !== 'female') return null
  const hm = heightCm / 100
  const litres = sex === 'male'
    ? 0.3669 * Math.pow(hm, 3) + 0.03219 * weightKg + 0.6041
    : 0.3561 * Math.pow(hm, 3) + 0.03308 * weightKg + 0.1833
  return round0(litres * 1000)
}
