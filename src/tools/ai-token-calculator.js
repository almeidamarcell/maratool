import './hash-state.js'
import { TOKEN_MODELS, getTextStats } from './ai-token-calculator-core.js'

;(function () {
  var input = document.getElementById('atc-input')
  var modelSelect = document.getElementById('atc-model')
  var statTokens = document.getElementById('atc-tokens')
  var statWords = document.getElementById('atc-words')
  var statChars = document.getElementById('atc-chars')
  var copyBtn = document.getElementById('atc-copy')

  Object.keys(TOKEN_MODELS).forEach(function (id) {
    var opt = document.createElement('option')
    opt.value = id
    opt.textContent = TOKEN_MODELS[id].name
    modelSelect.appendChild(opt)
  })

  function update() {
    var stats = getTextStats(input.value, modelSelect.value)
    statTokens.textContent = stats.tokens.toLocaleString()
    statWords.textContent = stats.words.toLocaleString()
    statChars.textContent = stats.characters.toLocaleString()
  }

  input.addEventListener('input', function () {
    update()
    HashState.save({ input: input.value, model: modelSelect.value })
  })

  modelSelect.addEventListener('change', function () {
    update()
    HashState.save({ input: input.value, model: modelSelect.value })
  })

  copyBtn.addEventListener('click', function () {
    var text = statTokens.textContent
    if (!text || text === '0') return
    navigator.clipboard.writeText(text).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy token count'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  var saved = HashState.parse()
  if (saved.model) modelSelect.value = saved.model
  if (saved.input) input.value = saved.input
  update()
})()
