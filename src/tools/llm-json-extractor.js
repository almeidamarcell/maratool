import { extractJsonFromText } from './llm-json-extract-core.js'

;(function () {
  var input = document.getElementById('lje-input')
  var blocks = document.getElementById('lje-blocks')

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function render() {
    var r = extractJsonFromText(input.value)
    if (!r.blocks.length) {
      blocks.innerHTML = '<p style="color:var(--text-2);font-size:13px;">No JSON blocks found.</p>'
      return
    }
    blocks.innerHTML = r.blocks.map(function (b, i) {
      var pretty = b.valid ? JSON.stringify(JSON.parse(b.json), null, 2) : b.json
      return '<div style="margin-bottom:1rem;border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">' +
        '<span style="font-size:12px;color:var(--text-2);">' + (b.valid ? 'Valid JSON' : 'Invalid JSON') + '</span>' +
        '<button type="button" class="copy-btn lje-copy" data-i="' + i + '">Copy</button></div>' +
        '<pre class="tool-output" style="min-height:40px;white-space:pre-wrap;font-size:12px;margin:0;">' + escapeHtml(pretty) + '</pre></div>'
    }).join('')

    blocks.querySelectorAll('.lje-copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.getAttribute('data-i'))
        var text = blocks.querySelectorAll('pre')[i].textContent
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'Copied!'
          setTimeout(function () { btn.textContent = 'Copy' }, 2000)
        })
      })
    })
  }

  input.addEventListener('input', render)
  render()
})()
