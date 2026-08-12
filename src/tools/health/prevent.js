// AHA PREVENT™ equations, base model (Khan SS et al. "Development and Validation
// of the American Heart Association's PREVENT Equations", Circulation
// 2024;149:430-449, supplemental tables).
//
// Coefficients cross-verified against three independent implementations:
// lhegstrom/PyPREVENT (src/covariates.rs), Medical-Software-Foundation/canvas
// (prevent-calculator/services/equations.py) and FrederikeLuebeck/adacvd.
// The female 10-yr HF diabetes coefficient is 1.038346 (PyPREVENT truncates it
// to 1.0 — the canvas value reproduces the official AHA calculator exactly).
//
// Model form: logistic. risk = e^x / (1 + e^x), where x is a linear predictor
// over centred/spline-knotted terms: age (per 10 y, centred at 55), non-HDL and
// HDL cholesterol in mmol/L (mg/dL × 0.02586), SBP knot at 110 mmHg, eGFR knot
// at 60 mL/min/1.73m², BMI knot at 30 kg/m² (HF models only).

// Term order: constant, age, age², nonHDL, HDL, sbpMin, sbpMax, diabetes,
// smoker, egfrMin, egfrMax, bpMeds, statin, bpMeds×sbpMax, statin×nonHDL,
// age×nonHDL, age×HDL, age×sbpMax, age×diabetes, age×smoker, age×egfrMin,
// bmiMin, bmiMax, age×bmiMax
const PREVENT_COEFS = {
  female: {
    cvd10: [-3.307728, 0.7939329, 0, 0.0305239, -0.1606857, -0.2394003, 0.3600781, 0.8667604, 0.5360739, 0.6045917, 0.0433769, 0.3151672, -0.1477655, -0.0663612, 0.1197879, -0.0819715, 0.0306769, -0.0946348, -0.27057, -0.078715, -0.1637806, 0, 0, 0],
    ascvd10: [-3.819975, 0.719883, 0, 0.1176967, -0.151185, -0.0835358, 0.3592852, 0.8348585, 0.4831078, 0.4864619, 0.0397779, 0.2265309, -0.0592374, -0.0395762, 0.0844423, -0.0567839, 0.0325692, -0.1035985, -0.2417542, -0.0791142, -0.1671492, 0, 0, 0],
    hf10: [-4.310409, 0.8998235, 0, 0, 0, -0.4559771, 0.3576505, 1.038346, 0.583916, 0.7451638, 0.0557087, 0.3534442, 0, -0.0981511, 0, 0, 0, -0.0946663, -0.3581041, -0.1159453, -0.1884289, -0.0072294, 0.2997706, -0.003878],
    cvd30: [-1.318827, 0.5503079, -0.0928369, 0.0409794, -0.1663306, -0.1628654, 0.3299505, 0.6793894, 0.3196112, 0.1857101, 0.0553528, 0.2894, -0.075688, -0.056367, 0.1071019, -0.0751438, 0.0301786, -0.0998776, -0.3206166, -0.1607862, -0.1450788, 0, 0, 0],
    ascvd30: [-1.974074, 0.4669202, -0.0893118, 0.1256901, -0.1542255, -0.0018093, 0.322949, 0.6296707, 0.268292, 0.100106, 0.0499663, 0.1875292, 0.0152476, -0.0276123, 0.0736147, -0.0521962, 0.0316918, -0.1046101, -0.2727793, -0.1530907, -0.1299149, 0, 0, 0],
    hf30: [-2.205379, 0.6254374, -0.0983038, 0, 0, -0.3919241, 0.3142295, 0.8330787, 0.3438651, 0.2981642, 0.0667159, 0.333921, 0, -0.0893177, 0, 0, 0, -0.0974299, -0.404855, -0.1982991, -0.1564215, 0.0594874, 0.2525536, -0.0035619],
  },
  male: {
    cvd10: [-3.031168, 0.7688528, 0, 0.0736174, -0.0954431, -0.4347345, 0.3362658, 0.7692857, 0.4386871, 0.5378979, 0.0164827, 0.288879, -0.1337349, -0.0475924, 0.150273, -0.0517874, 0.0191169, -0.1049477, -0.2251948, -0.0895067, -0.1543702, 0, 0, 0],
    ascvd10: [-3.500655, 0.7099847, 0, 0.1658663, -0.1144285, -0.2837212, 0.3239977, 0.7189597, 0.3956973, 0.3690075, 0.0203619, 0.2036522, -0.0865581, -0.0322916, 0.114563, -0.0300005, 0.0232747, -0.0927024, -0.2018525, -0.0970527, -0.1217081, 0, 0, 0],
    hf10: [-3.946391, 0.8972642, 0, 0, 0, -0.6811466, 0.3634461, 0.923776, 0.5023736, 0.6926917, 0.0251827, 0.2980922, 0, -0.0497731, 0, 0, 0, -0.1289201, -0.3040924, -0.1401688, -0.1797778, -0.0485841, 0.3726929, 0.0068126],
    cvd30: [-1.148204, 0.4627309, -0.0984281, 0.0836088, -0.1029824, -0.2140352, 0.2904325, 0.5331276, 0.2141914, 0.1155556, 0.0603775, 0.232714, -0.0272112, -0.0384488, 0.134192, -0.0511759, 0.0165865, -0.1101437, -0.2585943, -0.1566406, -0.1166776, 0, 0, 0],
    ascvd30: [-1.736444, 0.3994099, -0.0937484, 0.1744643, -0.120203, -0.0665117, 0.2753037, 0.4790257, 0.1782635, -0.0218789, 0.0602553, 0.1421182, 0.0135996, -0.0218265, 0.1013148, -0.0312619, 0.020673, -0.0920935, -0.2159947, -0.1548811, -0.0712547, 0, 0, 0],
    hf30: [-1.95751, 0.5681541, -0.1048388, 0, 0, -0.4761564, 0.30324, 0.6840338, 0.2656273, 0.2541805, 0.0638923, 0.2583631, 0, -0.0391938, 0, 0, 0, -0.1269124, -0.3273572, -0.2043019, -0.1342618, 0.0833107, 0.26999, -0.0182831],
  },
}

function preventLogOdds(k, p) {
  const age = (p.ageYears - 55) / 10
  const nonHdl = 0.02586 * (p.totalChol - p.hdl) - 3.5
  const hdl = (0.02586 * p.hdl - 1.3) / 0.3
  const sbpMin = (Math.min(p.sbp, 110) - 110) / 20
  const sbpMax = (Math.max(p.sbp, 110) - 130) / 20
  const egfrMin = (Math.min(p.egfr, 60) - 60) / -15
  const egfrMax = (Math.max(p.egfr, 60) - 90) / -15
  const bmiMin = (Math.min(p.bmi, 30) - 25) / 5
  const bmiMax = (Math.max(p.bmi, 30) - 30) / 5
  const dm = p.diabetic ? 1 : 0, smk = p.smoker ? 1 : 0
  const bp = p.bpMeds ? 1 : 0, st = p.statin ? 1 : 0
  const terms = [
    1, age, age * age, nonHdl, hdl, sbpMin, sbpMax, dm, smk, egfrMin, egfrMax,
    bp, st, bp * sbpMax, st * nonHdl, age * nonHdl, age * hdl, age * sbpMax,
    age * dm, age * smk, age * egfrMin, bmiMin, bmiMax, age * bmiMax,
  ]
  let x = 0
  for (let i = 0; i < terms.length; i++) x += k[i] * terms[i]
  return x
}

const toPct = x => Math.round((Math.exp(x) / (1 + Math.exp(x))) * 1000) / 10

// Returns { cvd10, ascvd10, hf10, cvd30, ascvd30, hf30 } as percentages, or
// null if required inputs are missing/out of range. 30-year outputs are null
// for ages 60-79 (the model is only defined for 30-year prediction at 30-59).
export function preventRisk(p) {
  const { ageYears, totalChol, hdl, sbp, egfr, bmi } = p
  if ([ageYears, totalChol, hdl, sbp, egfr, bmi].some(v => !Number.isFinite(v))) return null
  if (ageYears < 30 || ageYears > 79) return null
  if (totalChol < 130 || totalChol > 320) return null
  if (hdl < 20 || hdl > 100) return null
  if (sbp < 90 || sbp > 200) return null
  if (egfr < 15 || egfr > 140) return null
  if (bmi < 18.5 || bmi >= 40) return null
  const k = PREVENT_COEFS[p.male ? 'male' : 'female']
  const thirty = ageYears <= 59
  return {
    cvd10: toPct(preventLogOdds(k.cvd10, p)),
    ascvd10: toPct(preventLogOdds(k.ascvd10, p)),
    hf10: toPct(preventLogOdds(k.hf10, p)),
    cvd30: thirty ? toPct(preventLogOdds(k.cvd30, p)) : null,
    ascvd30: thirty ? toPct(preventLogOdds(k.ascvd30, p)) : null,
    hf30: thirty ? toPct(preventLogOdds(k.hf30, p)) : null,
  }
}

// ACC/AHA risk bands, conventionally applied to the 10-year ASCVD estimate.
// Keep in sync with ascvdCategory in score-formula.js — duplicated (not shared)
// so each tool page ships a single self-contained bundle.
export function preventCategory(pct) {
  if (!Number.isFinite(pct)) return null
  if (pct < 5) return 'Low risk (< 5%)'
  if (pct < 7.5) return 'Borderline risk (5 – 7.4%)'
  if (pct < 20) return 'Intermediate risk (7.5 – 19.9%)'
  return 'High risk (≥ 20%)'
}
