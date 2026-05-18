import {
  meldScore, meldNaScore, meldMortality, packYears, packYearRisk,
  fib4, fib4Risk, maddreyDF, maddreyRisk, nafldFibrosis, nafldRisk,
  das28esr, das28crp, das28Band, lilleModel, lilleRisk,
  injurySeverityScore, issRisk, pesiScore, pesiClass,
  dkaSeverity, dkaSeverityLabel, rIssStage, rIssLabel, cdai, cdaiRisk,
  camIcu, camIcuLabel,
  scorad, scoradRisk, pasi, pasiRisk,
  psiPort, psiPortRisk, framinghamRisk, framinghamCategory,
} from './score-formula.js'

function num(id) { const el = document.getElementById(id); if (!el || el.value === '') return NaN; return parseFloat(el.value) }
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t }
function checked(id) { const el = document.getElementById(id); return el ? el.checked : false }
function sel(id) { const el = document.getElementById(id); return el ? el.value : '' }
function bindInputs(ids, fn) {
  ids.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', fn)
  })
}

// ─── MELD / MELD-Na ─────────────────────────────────────────────
if (document.getElementById('meld-bili')) {
  function meldUpdate() {
    const bili = num('meld-bili'), inr = num('meld-inr'), cr = num('meld-cr')
    const naEl = document.getElementById('meld-na')
    const na = naEl && naEl.value !== '' ? parseFloat(naEl.value) : NaN
    const dialEl = document.getElementById('meld-dial')
    const dialysis = dialEl ? dialEl.checked : false
    if (isNaN(bili) || isNaN(inr) || isNaN(cr)) {
      setText('meld-value', '—'); setText('meld-na-value', '—'); setText('meld-class', '—')
      return
    }
    const meld = meldScore({ bilirubinMgDl: bili, inr, creatinineMgDl: cr, dialysis })
    setText('meld-value', meld === null ? '—' : String(meld))
    setText('meld-class', meld === null ? '—' : (meldMortality(meld) || '—'))
    if (!isNaN(na)) {
      const meldNa = meldNaScore({ bilirubinMgDl: bili, inr, creatinineMgDl: cr, dialysis, sodiumMmol: na })
      setText('meld-na-value', meldNa === null ? '—' : String(meldNa))
    } else {
      setText('meld-na-value', '—')
    }
  }
  ['meld-bili','meld-inr','meld-cr','meld-na'].forEach(id => {
    const el = document.getElementById(id); if (el) el.addEventListener('input', meldUpdate)
  })
  const dial = document.getElementById('meld-dial'); if (dial) dial.addEventListener('change', meldUpdate)
}

// ─── Pack-year ──────────────────────────────────────────────────
if (document.getElementById('py-cpd')) {
  function pyUpdate() {
    const cpd = num('py-cpd'), yrs = num('py-years')
    if (isNaN(cpd) || isNaN(yrs)) { setText('py-value', '—'); setText('py-class', '—'); return }
    const py = packYears({ cigarettesPerDay: cpd, years: yrs })
    setText('py-value', py === null ? '—' : py + ' pack-years')
    setText('py-class', py === null ? '—' : (packYearRisk(py) || '—'))
  }
  ['py-cpd','py-years'].forEach(id => {
    const el = document.getElementById(id); if (el) el.addEventListener('input', pyUpdate)
  })
}

// ─── FIB-4 ──────────────────────────────────────────────────────────
if (document.getElementById('fib4-age')) {
  const upd = () => {
    const ageYears = num('fib4-age'), astUL = num('fib4-ast'), plateletsE9L = num('fib4-plt'), altUL = num('fib4-alt')
    if ([ageYears, astUL, plateletsE9L, altUL].some(isNaN)) { setText('fib4-value', '—'); setText('fib4-class', '—'); return }
    const v = fib4({ ageYears, astUL, plateletsE9L, altUL })
    setText('fib4-value', v === null ? '—' : String(v))
    setText('fib4-class', v === null ? '—' : (fib4Risk(v) || '—'))
  }
  bindInputs(['fib4-age', 'fib4-ast', 'fib4-plt', 'fib4-alt'], upd)
}

// ─── Maddrey Discriminant Function ──────────────────────────────────
if (document.getElementById('mdf-pt')) {
  const upd = () => {
    const ptSeconds = num('mdf-pt'), controlPtSeconds = num('mdf-control'), bilirubinMgDl = num('mdf-bili')
    if ([ptSeconds, controlPtSeconds, bilirubinMgDl].some(isNaN)) { setText('mdf-value', '—'); setText('mdf-class', '—'); return }
    const v = maddreyDF({ ptSeconds, controlPtSeconds, bilirubinMgDl })
    setText('mdf-value', v === null ? '—' : String(v))
    setText('mdf-class', v === null ? '—' : (maddreyRisk(v) || '—'))
  }
  bindInputs(['mdf-pt', 'mdf-control', 'mdf-bili'], upd)
}

// ─── NAFLD Fibrosis Score ───────────────────────────────────────────
if (document.getElementById('nfs-age')) {
  const upd = () => {
    const ageYears = num('nfs-age'), bmi = num('nfs-bmi'), astUL = num('nfs-ast'), altUL = num('nfs-alt')
    const plateletsE9L = num('nfs-plt'), albuminGDl = num('nfs-alb'), diabetes = checked('nfs-dm')
    if ([ageYears, bmi, astUL, altUL, plateletsE9L, albuminGDl].some(isNaN)) { setText('nfs-value', '—'); setText('nfs-class', '—'); return }
    const v = nafldFibrosis({ ageYears, bmi, diabetes, astUL, altUL, plateletsE9L, albuminGDl })
    setText('nfs-value', v === null ? '—' : String(v))
    setText('nfs-class', v === null ? '—' : (nafldRisk(v) || '—'))
  }
  bindInputs(['nfs-age', 'nfs-bmi', 'nfs-ast', 'nfs-alt', 'nfs-plt', 'nfs-alb', 'nfs-dm'], upd)
}

// ─── DAS28-ESR ──────────────────────────────────────────────────────
if (document.getElementById('das28e-tjc')) {
  const upd = () => {
    const tjc28 = num('das28e-tjc'), sjc28 = num('das28e-sjc'), esrMmHr = num('das28e-esr'), ghVas = num('das28e-gh')
    if ([tjc28, sjc28, esrMmHr, ghVas].some(isNaN)) { setText('das28e-value', '—'); setText('das28e-class', '—'); return }
    const v = das28esr({ tjc28, sjc28, esrMmHr, ghVas })
    setText('das28e-value', v === null ? '—' : String(v))
    setText('das28e-class', v === null ? '—' : (das28Band(v) || '—'))
  }
  bindInputs(['das28e-tjc', 'das28e-sjc', 'das28e-esr', 'das28e-gh'], upd)
}

// ─── DAS28-CRP ──────────────────────────────────────────────────────
if (document.getElementById('das28c-tjc')) {
  const upd = () => {
    const tjc28 = num('das28c-tjc'), sjc28 = num('das28c-sjc'), crpMgL = num('das28c-crp'), ghVas = num('das28c-gh')
    if ([tjc28, sjc28, crpMgL, ghVas].some(isNaN)) { setText('das28c-value', '—'); setText('das28c-class', '—'); return }
    const v = das28crp({ tjc28, sjc28, crpMgL, ghVas })
    setText('das28c-value', v === null ? '—' : String(v))
    setText('das28c-class', v === null ? '—' : (das28Band(v) || '—'))
  }
  bindInputs(['das28c-tjc', 'das28c-sjc', 'das28c-crp', 'das28c-gh'], upd)
}

// ─── Lille Model ────────────────────────────────────────────────────
if (document.getElementById('lille-age')) {
  const upd = () => {
    const ageYears = num('lille-age'), albuminDay0GL = num('lille-alb'), bilirubinDay0MgDl = num('lille-bili0')
    const bilirubinDay7MgDl = num('lille-bili7'), ptSeconds = num('lille-pt'), renalInsufficiency = checked('lille-renal')
    if ([ageYears, albuminDay0GL, bilirubinDay0MgDl, bilirubinDay7MgDl, ptSeconds].some(isNaN)) { setText('lille-value', '—'); setText('lille-class', '—'); return }
    const v = lilleModel({ ageYears, albuminDay0GL, bilirubinDay0MgDl, bilirubinDay7MgDl, ptSeconds, renalInsufficiency })
    setText('lille-value', v === null ? '—' : String(v))
    setText('lille-class', v === null ? '—' : (lilleRisk(v) || '—'))
  }
  bindInputs(['lille-age', 'lille-alb', 'lille-bili0', 'lille-bili7', 'lille-pt', 'lille-renal'], upd)
}

// ─── Injury Severity Score ──────────────────────────────────────────
if (document.getElementById('iss-head')) {
  const ids = ['iss-head', 'iss-face', 'iss-chest', 'iss-abdomen', 'iss-extremity', 'iss-external']
  const upd = () => {
    const ais = ids.map(id => parseInt(sel(id), 10))
    const v = injurySeverityScore(ais)
    setText('iss-value', v === null ? '—' : String(v))
    setText('iss-class', v === null ? '—' : (issRisk(v) || '—'))
  }
  bindInputs(ids, upd)
  upd()
}

// ─── PESI ───────────────────────────────────────────────────────────
if (document.getElementById('pesi-age')) {
  const upd = () => {
    const ageYears = num('pesi-age')
    if (isNaN(ageYears)) { setText('pesi-value', '—'); setText('pesi-class', '—'); return }
    const v = pesiScore({
      ageYears,
      male: sel('pesi-sex') === 'male',
      cancer: checked('pesi-cancer'), chronicHF: checked('pesi-hf'), chronicLung: checked('pesi-lung'),
      hr110: checked('pesi-hr'), sbpLt100: checked('pesi-sbp'), rr30: checked('pesi-rr'),
      tempLt36: checked('pesi-temp'), alteredMental: checked('pesi-mental'), sao2Lt90: checked('pesi-sao2'),
    })
    setText('pesi-value', v === null ? '—' : String(v))
    setText('pesi-class', v === null ? '—' : (pesiClass(v) || '—'))
  }
  bindInputs(['pesi-age', 'pesi-sex', 'pesi-cancer', 'pesi-hf', 'pesi-lung', 'pesi-hr', 'pesi-sbp', 'pesi-rr', 'pesi-temp', 'pesi-mental', 'pesi-sao2'], upd)
}

// ─── DKA Severity ───────────────────────────────────────────────────
if (document.getElementById('dka-ph')) {
  const upd = () => {
    const phArterial = num('dka-ph'), bicarbonateMeqL = num('dka-hco3'), mentalStatus = sel('dka-mental')
    if ([phArterial, bicarbonateMeqL].some(isNaN)) { setText('dka-value', '—'); setText('dka-class', '—'); return }
    const lvl = dkaSeverity({ phArterial, bicarbonateMeqL, mentalStatus })
    setText('dka-value', lvl === null ? '—' : (dkaSeverityLabel(lvl) || '—'))
    setText('dka-class', lvl === null ? '—' : ['No ketoacidosis by these parameters', 'Manage per mild-DKA protocol', 'Manage per moderate-DKA protocol', 'Manage per severe-DKA protocol — ICU-level care'][lvl])
  }
  bindInputs(['dka-ph', 'dka-hco3', 'dka-mental'], upd)
}

// ─── R-ISS (Multiple Myeloma) ───────────────────────────────────────
if (document.getElementById('riss-iss')) {
  const upd = () => {
    const iss = parseInt(sel('riss-iss'), 10)
    const stage = rIssStage({ iss, highRiskCytogenetics: checked('riss-cyto'), highLDH: checked('riss-ldh') })
    setText('riss-value', stage === null ? '—' : ('Stage ' + ['', 'I', 'II', 'III'][stage]))
    setText('riss-class', stage === null ? '—' : (rIssLabel(stage) || '—'))
  }
  bindInputs(['riss-iss', 'riss-cyto', 'riss-ldh'], upd)
  upd()
}

// ─── CDAI (Crohn's Disease Activity Index) ──────────────────────────
if (document.getElementById('cdai-stools')) {
  const upd = () => {
    const stools7d = num('cdai-stools'), painSum7d = num('cdai-pain'), wellbeingSum7d = num('cdai-wb')
    const complications = parseInt(sel('cdai-comp'), 10), abdominalMass = parseInt(sel('cdai-mass'), 10)
    const hctObserved = num('cdai-hct'), weightKg = num('cdai-weight'), standardWeightKg = num('cdai-stdweight')
    if ([stools7d, painSum7d, wellbeingSum7d, hctObserved, weightKg, standardWeightKg].some(isNaN) || standardWeightKg <= 0) {
      setText('cdai-value', '—'); setText('cdai-class', '—'); return
    }
    const v = cdai({
      stools7d, painSum7d, wellbeingSum7d, complications,
      antidiarrheal: checked('cdai-antidiarrheal'), abdominalMass,
      hctObserved, male: sel('cdai-sex') === 'male', weightKg, standardWeightKg,
    })
    setText('cdai-value', v === null ? '—' : String(v))
    setText('cdai-class', v === null ? '—' : (cdaiRisk(v) || '—'))
  }
  bindInputs(['cdai-stools', 'cdai-pain', 'cdai-wb', 'cdai-comp', 'cdai-antidiarrheal', 'cdai-mass', 'cdai-hct', 'cdai-sex', 'cdai-weight', 'cdai-stdweight'], upd)
}

// ─── CAM-ICU ────────────────────────────────────────────────────────
if (document.getElementById('cam-f1')) {
  const upd = () => {
    const positive = camIcu({
      f1AcuteFluctuating: checked('cam-f1'),
      f2Inattention: checked('cam-f2'),
      f3AlteredLOC: checked('cam-f3'),
      f4DisorganizedThinking: checked('cam-f4'),
    })
    setText('cam-value', positive === null ? '—' : (positive ? 'Positive' : 'Negative'))
    setText('cam-class', positive === null ? '—' : (camIcuLabel(positive) || '—'))
  }
  bindInputs(['cam-f1', 'cam-f2', 'cam-f3', 'cam-f4'], upd)
  upd()
}

// ─── SCORAD ─────────────────────────────────────────────────────────
if (document.getElementById('scorad-extent')) {
  const ids = ['scorad-extent', 'scorad-ery', 'scorad-edema', 'scorad-ooze', 'scorad-exc', 'scorad-lich', 'scorad-dry', 'scorad-pruritus', 'scorad-sleep']
  const upd = () => {
    const v = scorad({
      extentPct: num('scorad-extent'),
      erythema: parseInt(sel('scorad-ery'), 10), edema: parseInt(sel('scorad-edema'), 10),
      oozing: parseInt(sel('scorad-ooze'), 10), excoriation: parseInt(sel('scorad-exc'), 10),
      lichenification: parseInt(sel('scorad-lich'), 10), dryness: parseInt(sel('scorad-dry'), 10),
      pruritusVas: num('scorad-pruritus'), sleepVas: num('scorad-sleep'),
    })
    setText('scorad-value', v === null ? '—' : String(v))
    setText('scorad-class', v === null ? '—' : (scoradRisk(v) || '—'))
  }
  bindInputs(ids, upd)
  upd()
}

// ─── PASI ───────────────────────────────────────────────────────────
if (document.getElementById('pasi-head-e')) {
  const regs = ['head', 'arms', 'trunk', 'legs']
  const ids = []
  regs.forEach(r => ['e', 'i', 'd', 'a'].forEach(k => ids.push(`pasi-${r}-${k}`)))
  const upd = () => {
    const regions = {}
    for (const r of regs) {
      regions[r] = {
        e: parseInt(sel(`pasi-${r}-e`), 10), i: parseInt(sel(`pasi-${r}-i`), 10),
        d: parseInt(sel(`pasi-${r}-d`), 10), a: parseInt(sel(`pasi-${r}-a`), 10),
      }
    }
    const v = pasi(regions)
    setText('pasi-value', v === null ? '—' : String(v))
    setText('pasi-class', v === null ? '—' : (pasiRisk(v) || '—'))
  }
  bindInputs(ids, upd)
  upd()
}

// ─── PSI / PORT ─────────────────────────────────────────────────────
if (document.getElementById('psi-age')) {
  const cbs = ['psi-nh', 'psi-neoplasm', 'psi-liver', 'psi-chf', 'psi-cva', 'psi-renal', 'psi-ams', 'psi-rr', 'psi-sbp', 'psi-temp', 'psi-pulse', 'psi-ph', 'psi-bun', 'psi-na', 'psi-glucose', 'psi-hct', 'psi-pao2', 'psi-effusion']
  const upd = () => {
    const ageYears = num('psi-age')
    if (isNaN(ageYears)) { setText('psi-value', '—'); setText('psi-class', '—'); return }
    const r = psiPort({
      ageYears, female: sel('psi-sex') === 'female', nursingHome: checked('psi-nh'),
      neoplasm: checked('psi-neoplasm'), liver: checked('psi-liver'), chf: checked('psi-chf'),
      cerebrovascular: checked('psi-cva'), renal: checked('psi-renal'),
      alteredMental: checked('psi-ams'), rr30: checked('psi-rr'), sbp90: checked('psi-sbp'),
      tempAbnormal: checked('psi-temp'), pulse125: checked('psi-pulse'),
      phLt735: checked('psi-ph'), bun30: checked('psi-bun'), naLt130: checked('psi-na'),
      glucose250: checked('psi-glucose'), hctLt30: checked('psi-hct'), pao2Lt60: checked('psi-pao2'),
      pleuralEffusion: checked('psi-effusion'),
    })
    if (!r) { setText('psi-value', '—'); setText('psi-class', '—'); return }
    setText('psi-value', 'Class ' + r.klass + (r.points === null ? '' : ' (' + r.points + ' pts)'))
    setText('psi-class', psiPortRisk(r.klass) || '—')
  }
  bindInputs(['psi-age', 'psi-sex', ...cbs], upd)
}

// ─── Framingham (ATP III) ───────────────────────────────────────────
if (document.getElementById('fram-age')) {
  const upd = () => {
    const ageYears = num('fram-age'), totalChol = num('fram-tc'), hdl = num('fram-hdl'), sbp = num('fram-sbp')
    if ([ageYears, totalChol, hdl, sbp].some(isNaN)) { setText('fram-value', '—'); setText('fram-class', '—'); return }
    const r = framinghamRisk({
      male: sel('fram-sex') === 'male', ageYears, totalChol, hdl,
      smoker: checked('fram-smoker'), sbp, treatedBp: checked('fram-treated'),
    })
    if (!r) { setText('fram-value', '—'); setText('fram-class', '—'); return }
    setText('fram-value', r.points + ' pts → 10-yr CHD risk ' + r.riskPct)
    setText('fram-class', framinghamCategory(r.riskPct) || '—')
  }
  bindInputs(['fram-age', 'fram-sex', 'fram-tc', 'fram-hdl', 'fram-smoker', 'fram-sbp', 'fram-treated'], upd)
}

document.querySelectorAll('.copy-btn').forEach(btn => {
  if (btn.dataset.formulaWired === '1') return
  btn.dataset.formulaWired = '1'
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.getAttribute('data-target'))
    if (!el || el.textContent === '—') return
    navigator.clipboard.writeText(el.textContent).then(() => {
      const o = btn.textContent; btn.textContent = 'Copied!'
      setTimeout(() => { btn.textContent = o }, 2000)
    })
  })
})
