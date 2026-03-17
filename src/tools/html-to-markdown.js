import './hash-state.js'
import { htmlToMarkdown } from './html-to-md.js'
// HTML to Markdown Converter
;(function () {
  'use strict'

  var input = document.getElementById('htm-input')
  var output = document.getElementById('htm-output')
  var copyBtn = document.getElementById('htm-copy')

  function convert() {
    var html = input.value
    if (!html.trim()) { output.value = ''; return }
    try {
      output.value = htmlToMarkdown(html)
      output.classList.remove('error-state')
    } catch (e) {
      output.value = 'Error: ' + e.message
      output.classList.add('error-state')
    }
  }

  input.addEventListener('input', function () {
    convert()
    HashState.save({ input: input.value })
  })

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy Markdown'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  var saved = HashState.parse()
  if (saved.input) {
    input.value = saved.input
    convert()
  }
})()
