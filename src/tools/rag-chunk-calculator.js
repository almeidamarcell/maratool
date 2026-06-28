import { calcRagChunks } from './rag-chunk-core.js'

;(function () {
  var tokens = document.getElementById('rc-tokens')
  var size = document.getElementById('rc-size')
  var overlap = document.getElementById('rc-overlap')
  var count = document.getElementById('rc-count')
  var step = document.getElementById('rc-step')
  var err = document.getElementById('rc-error')

  function update() {
    var r = calcRagChunks({
      totalTokens: Number(tokens.value),
      chunkSize: Number(size.value),
      overlap: Number(overlap.value),
    })
    if (r.error) {
      err.textContent = r.error
      count.textContent = step.textContent = '—'
      return
    }
    err.textContent = ''
    count.textContent = String(r.chunkCount)
    step.textContent = String(r.stepSize)
  }

  ;[tokens, size, overlap].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
