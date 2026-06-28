import './hash-state.js'
import { validateJsonLd } from './schema-validator-core.js'

;(function () {
  var input = document.getElementById('sv-input')
  var statusEl = document.getElementById('sv-status')
  var listEl = document.getElementById('sv-results')

  function render() {
    var result = validateJsonLd(input.value)

    if (result.error) {
      statusEl.textContent = 'Invalid'
      statusEl.className = 'tool-stat-value sv-bad'
      listEl.innerHTML = '<p class="sv-error">' + result.error + '</p>'
      return
    }

    statusEl.textContent = result.valid ? 'Valid' : 'Issues found'
    statusEl.className = 'tool-stat-value ' + (result.valid ? 'sv-ok' : 'sv-bad')

    listEl.innerHTML = result.results.map(function (item) {
      var issues = item.issues.map(function (issue) {
        return '<li class="sv-issue sv-' + issue.level + '">' + issue.message + '</li>'
      }).join('')
      return '<div class="sv-block"><h3 class="sv-block-title">Item #' + item.index + (item.type ? ' — ' + item.type : '') + '</h3><ul>' + issues + '</ul></div>'
    }).join('')
  }

  input.addEventListener('input', function () {
    render()
    HashState.save({ input: input.value })
  })

  var saved = HashState.parse()
  if (saved.input) {
    input.value = saved.input
    render()
  }
})()
