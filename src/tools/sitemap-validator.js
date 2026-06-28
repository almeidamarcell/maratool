import './hash-state.js'
import { parseSitemapXml, validateSitemap } from './sitemap-validator-core.js'

;(function () {
  var input = document.getElementById('smv-input')
  var statusEl = document.getElementById('smv-status')
  var statsEl = document.getElementById('smv-stats')
  var listEl = document.getElementById('smv-issues')

  function render() {
    var parsed = parseSitemapXml(input.value)
    var result = validateSitemap(parsed)

    if (result.error) {
      statusEl.textContent = 'Invalid'
      statusEl.className = 'tool-stat-value smv-bad'
      statsEl.textContent = result.error
      listEl.innerHTML = ''
      return
    }

    statusEl.textContent = result.valid ? 'Valid' : 'Issues found'
    statusEl.className = 'tool-stat-value ' + (result.valid ? 'smv-ok' : 'smv-bad')
    statsEl.textContent = result.stats.type + ' — ' + result.stats.count + ' entr' + (result.stats.count === 1 ? 'y' : 'ies')

    listEl.innerHTML = result.issues.map(function (issue) {
      return '<li class="smv-issue smv-' + issue.level + '">' + issue.message + '</li>'
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
