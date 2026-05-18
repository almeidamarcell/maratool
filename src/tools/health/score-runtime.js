// Generic runtime for categorical-score health calculators.
//
// On a page with a `<script type="application/json" id="score-spec">` block,
// this runtime reads the spec, sums all `<select data-score-input>` elements,
// classifies the total via the spec's `bands`, and renders to `#score-total`
// and `#score-class`. It also wires `.copy-btn` elements (data-target → id).
//
// Spec shape:
// {
//   bands: [{ min, max?, label, cls? }],
//   max?: number,    // optional total for display ("X / Y")
//   prefix?: string, // optional prefix shown before the score number
//   bonus?: number,  // optional constant added to the sum (e.g. Capurro = sum + 204)
//   format?: 'default' | 'gestational' | 'percent'
// }

import { scoreAndInterpret } from './score-engine.js'

function readSpec() {
  const el = document.getElementById('score-spec')
  if (!el) return null
  try { return JSON.parse(el.textContent || '{}') } catch { return null }
}

function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t }
function setClass(id, cls) {
  const el = document.getElementById(id)
  if (!el) return
  el.className = 'hcalc-output-value' + (cls ? ' ' + cls : '')
}

function formatScore(n, spec) {
  if (spec.format === 'gestational') {
    const weeks = Math.floor(n / 7)
    const days = n % 7
    return weeks + 'w ' + days + 'd (' + n + ' days)'
  }
  if (spec.format === 'percent') return n + '%'
  return (spec.prefix || '') + n + (spec.max ? ' / ' + spec.max : '')
}

function update(spec, inputs) {
  const values = {}
  for (const el of inputs) {
    const v = el.value
    values[el.id || el.name || Math.random()] = v === '' ? null : v
  }
  const result = scoreAndInterpret(values, spec.bands || [])
  if (!result) {
    setText('score-total', '—'); setText('score-class', '—'); setClass('score-class', '')
    return
  }
  const total = result.score + (spec.bonus || 0)
  // re-band on the bonus-adjusted total so bands work in the user-visible units
  const band = (spec.bands || []).find(b => total >= b.min && total <= (b.max === undefined ? Infinity : b.max))
  setText('score-total', formatScore(total, spec))
  if (band) {
    setText('score-class', band.label)
    setClass('score-class', band.cls || '')
  } else {
    setText('score-class', '—'); setClass('score-class', '')
  }
}

function init() {
  const spec = readSpec()
  if (!spec) return
  const inputs = Array.from(document.querySelectorAll('[data-score-input]'))
  if (!inputs.length) return
  const run = () => update(spec, inputs)
  for (const el of inputs) el.addEventListener('change', run)
  run()

  // Copy buttons (idempotent: handle even if already wired by another script).
  document.querySelectorAll('.copy-btn').forEach(btn => {
    if (btn.dataset.scoreWired === '1') return
    btn.dataset.scoreWired = '1'
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.getAttribute('data-target'))
      if (!el || el.textContent === '—') return
      navigator.clipboard.writeText(el.textContent).then(() => {
        const o = btn.textContent
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = o }, 2000)
      })
    })
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
