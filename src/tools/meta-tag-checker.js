import './hash-state.js'
import { parseMetaFromHtml } from './html-meta-parser-core.js'
import { analyzeMetaTags } from './meta-tag-checker-core.js'

;(function () {
  var input = document.getElementById('mtc-input')
  var scoreEl = document.getElementById('mtc-score')
  var listEl = document.getElementById('mtc-issues')
  var summaryEl = document.getElementById('mtc-summary')

  function render() {
    var meta = parseMetaFromHtml(input.value)
    var result = analyzeMetaTags(meta)

    if (result.error) {
      scoreEl.textContent = '—'
      summaryEl.textContent = result.error
      listEl.innerHTML = ''
      return
    }

    scoreEl.textContent = result.score
    summaryEl.textContent = result.summary.errors + ' error(s), ' + result.summary.warnings + ' warning(s), ' + result.summary.passed + ' passed'

    listEl.innerHTML = result.issues.map(function (issue) {
      return '<li class="mtc-issue mtc-' + issue.level + '"><span class="mtc-level">' + issue.level + '</span> ' + issue.message + '</li>'
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
