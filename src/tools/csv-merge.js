import { mergeCsv } from './csv-tools-core.js'

;(function () {
  var a = document.getElementById('cm-a')
  var b = document.getElementById('cm-b')
  var output = document.getElementById('cm-output')
  var mergeBtn = document.getElementById('cm-merge')
  var copy = document.getElementById('cm-copy')

  mergeBtn.addEventListener('click', function () {
    try { output.value = mergeCsv([a.value, b.value]) } catch (e) { output.value = 'Error: ' + e.message }
  })
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.value).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
})()
