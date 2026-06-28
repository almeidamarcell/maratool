import { CONTEXT_MODELS, estimateTokens, contextUsage } from './ai-context-core.js'

;(function () {
  var model = document.getElementById('cw-model')
  var text = document.getElementById('cw-text')
  var tokensEl = document.getElementById('cw-tokens')
  var limitEl = document.getElementById('cw-limit')
  var pctEl = document.getElementById('cw-pct')
  var remainEl = document.getElementById('cw-remain')
  var bar = document.getElementById('cw-bar')

  Object.keys(CONTEXT_MODELS).forEach(function (id) {
    var opt = document.createElement('option')
    opt.value = id
    opt.textContent = CONTEXT_MODELS[id].name + ' (' + CONTEXT_MODELS[id].contextWindow.toLocaleString() + ')'
    model.appendChild(opt)
  })

  function update() {
    var tokens = estimateTokens(text.value)
    var usage = contextUsage(tokens, model.value)
    tokensEl.textContent = tokens.toLocaleString()
    limitEl.textContent = usage.limit.toLocaleString()
    pctEl.textContent = usage.percent.toFixed(1) + '%'
    remainEl.textContent = usage.remaining.toLocaleString()
    bar.style.width = Math.min(100, usage.percent) + '%'
    bar.style.background = usage.overLimit ? '#c53030' : usage.percent > 80 ? '#d4842a' : 'var(--accent)'
  }

  ;[model, text].forEach(function (el) {
    el.addEventListener('input', update)
    el.addEventListener('change', update)
  })
  update()
})()
