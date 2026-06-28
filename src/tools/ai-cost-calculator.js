import './hash-state.js'
import { MODEL_PRICING, calculateCost, formatUsd } from './ai-cost-calculator-core.js'
import { countTokens } from './ai-token-calculator-core.js'

;(function () {
  var inputTokens = document.getElementById('acc-input-tokens')
  var outputTokens = document.getElementById('acc-output-tokens')
  var textInput = document.getElementById('acc-text')
  var modelSelect = document.getElementById('acc-model')
  var outInput = document.getElementById('acc-out-input')
  var outOutput = document.getElementById('acc-out-output')
  var outTotal = document.getElementById('acc-out-total')
  var countFromTextBtn = document.getElementById('acc-count-text')

  Object.keys(MODEL_PRICING).forEach(function (id) {
    var opt = document.createElement('option')
    opt.value = id
    opt.textContent = MODEL_PRICING[id].name
    modelSelect.appendChild(opt)
  })

  function update() {
    var result = calculateCost(inputTokens.value, outputTokens.value, modelSelect.value)
    outInput.textContent = formatUsd(result.inputCost)
    outOutput.textContent = formatUsd(result.outputCost)
    outTotal.textContent = formatUsd(result.totalCost)
  }

  function save() {
    HashState.save({
      inputTokens: inputTokens.value,
      outputTokens: outputTokens.value,
      text: textInput.value,
      model: modelSelect.value,
    })
  }

  ;[inputTokens, outputTokens, modelSelect].forEach(function (el) {
    el.addEventListener('input', function () { update(); save() })
    el.addEventListener('change', function () { update(); save() })
  })

  countFromTextBtn.addEventListener('click', function () {
    var tokens = countTokens(textInput.value, modelSelect.value)
    inputTokens.value = tokens
    update()
    save()
  })

  var saved = HashState.parse()
  if (saved.model) modelSelect.value = saved.model
  if (saved.inputTokens) inputTokens.value = saved.inputTokens
  if (saved.outputTokens) outputTokens.value = saved.outputTokens
  if (saved.text) textInput.value = saved.text
  update()
})()
