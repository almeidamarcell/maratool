import { EMBEDDING_PRICING, calcEmbeddingCost, formatUsd } from './ai-embedding-core.js'

;(function () {
  var model = document.getElementById('emb-model')
  var tokens = document.getElementById('emb-tokens')
  var cost = document.getElementById('emb-cost')

  Object.keys(EMBEDDING_PRICING).forEach(function (id) {
    var opt = document.createElement('option')
    opt.value = id
    opt.textContent = EMBEDDING_PRICING[id].name
    model.appendChild(opt)
  })

  function update() {
    var r = calcEmbeddingCost(tokens.value, model.value)
    cost.textContent = formatUsd(r.cost)
  }
  ;[model, tokens].forEach(function (el) { el.addEventListener('input', update); el.addEventListener('change', update) })
  update()
})()
