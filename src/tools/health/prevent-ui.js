import { preventRisk, preventCategory } from './prevent.js'
import { copyWithFeedback } from '../tool-utils.js'

function num(id) { const el = document.getElementById(id); if (!el || el.value === '') return NaN; return parseFloat(el.value) }
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t }
function checked(id) { const el = document.getElementById(id); return el ? el.checked : false }
function sel(id) { const el = document.getElementById(id); return el ? el.value : '' }

const OUT_IDS = ['prevent-cvd10', 'prevent-ascvd10', 'prevent-hf10', 'prevent-cvd30', 'prevent-ascvd30', 'prevent-hf30', 'prevent-class']

if (document.getElementById('prevent-age')) {
  const upd = () => {
    const ageYears = num('prevent-age'), totalChol = num('prevent-tc'), hdl = num('prevent-hdl')
    const sbp = num('prevent-sbp'), egfr = num('prevent-egfr'), bmi = num('prevent-bmi')
    const blank = () => OUT_IDS.forEach(id => setText(id, '—'))
    if ([ageYears, totalChol, hdl, sbp, egfr, bmi].some(isNaN)) return blank()
    const r = preventRisk({
      male: sel('prevent-sex') === 'male', ageYears, totalChol, hdl, sbp, egfr, bmi,
      bpMeds: checked('prevent-bpmeds'), statin: checked('prevent-statin'),
      diabetic: checked('prevent-diabetes'), smoker: checked('prevent-smoker'),
    })
    if (!r) return blank()
    setText('prevent-cvd10', r.cvd10 + '%')
    setText('prevent-ascvd10', r.ascvd10 + '%')
    setText('prevent-hf10', r.hf10 + '%')
    const only59 = 'Ages 30–59 only'
    setText('prevent-cvd30', r.cvd30 !== null ? r.cvd30 + '%' : only59)
    setText('prevent-ascvd30', r.ascvd30 !== null ? r.ascvd30 + '%' : only59)
    setText('prevent-hf30', r.hf30 !== null ? r.hf30 + '%' : only59)
    setText('prevent-class', preventCategory(r.ascvd10) || '—')
  }
  const inputs = ['prevent-sex', 'prevent-age', 'prevent-tc', 'prevent-hdl', 'prevent-sbp', 'prevent-egfr', 'prevent-bmi', 'prevent-bpmeds', 'prevent-statin', 'prevent-diabetes', 'prevent-smoker']
  inputs.forEach(id => {
    const el = document.getElementById(id)
    if (el) el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', upd)
  })
}

document.querySelectorAll('.copy-btn').forEach(btn => {
  if (btn.dataset.preventWired === '1') return
  btn.dataset.preventWired = '1'
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.getAttribute('data-target'))
    if (!el || el.textContent === '—') return
    copyWithFeedback(btn, el.textContent)
  })
})
