import './hash-state.js'
// Markdown Editor — uses marked.js for full GFM support
;(function () {
  'use strict'

  var input = document.getElementById('md-input')
  var preview = document.getElementById('md-preview')
  var copyMdBtn = document.getElementById('md-copy-md')
  var copyHtmlBtn = document.getElementById('md-copy-html')
  var debounceTimer = null
  var markedParse = null

  async function loadMarked() {
    if (markedParse) return
    var mod = await import('https://cdn.jsdelivr.net/npm/marked@15.0.7/+esm')
    mod.marked.setOptions({
      gfm: true,
      breaks: false,
    })
    markedParse = mod.marked.parse
    updatePreview()
  }

  // ── Fallback parser (used until marked loads) ──
  function fallbackParse(src) {
    return src
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .split('\n')
      .map(function (l) { return '<p>' + l + '</p>' })
      .join('\n')
  }

  // ── Preview update ──
  function updatePreview() {
    var parsed = markedParse ? markedParse(input.value) : fallbackParse(input.value)
    preview.innerHTML = parsed
  }

  input.addEventListener('input', function () {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(updatePreview, 80)
    HashState.save({ input: input.value })
  })

  // ── Toolbar insertion ──
  var insertions = {
    bold: { before: '**', after: '**', placeholder: 'bold text' },
    italic: { before: '*', after: '*', placeholder: 'italic text' },
    strikethrough: { before: '~~', after: '~~', placeholder: 'strikethrough' },
    link: { before: '[', after: '](url)', placeholder: 'link text' },
    code: { before: '`', after: '`', placeholder: 'code' },
    h1: { before: '# ', after: '', placeholder: 'Heading 1', lineStart: true },
    h2: { before: '## ', after: '', placeholder: 'Heading 2', lineStart: true },
    table: { insert: '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n' },
    task: { insert: '\n- [ ] Task item\n' },
  }

  document.querySelectorAll('[data-md]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.dataset.md
      var ins = insertions[action]
      if (!ins) return

      input.focus()
      var start = input.selectionStart
      var end = input.selectionEnd
      var text = input.value

      if (ins.insert) {
        input.value = text.slice(0, end) + ins.insert + text.slice(end)
        var newPos = end + ins.insert.length
        input.setSelectionRange(newPos, newPos)
      } else if (ins.lineStart) {
        var lineStart = text.lastIndexOf('\n', start - 1) + 1
        input.value = text.slice(0, lineStart) + ins.before + text.slice(lineStart)
        var newPos = lineStart + ins.before.length
        input.setSelectionRange(newPos, newPos + (end - start || ins.placeholder.length))
      } else {
        var selected = text.slice(start, end) || ins.placeholder
        var replacement = ins.before + selected + ins.after
        input.value = text.slice(0, start) + replacement + text.slice(end)
        input.setSelectionRange(start + ins.before.length, start + ins.before.length + selected.length)
      }

      updatePreview()
    })
  })

  // ── Copy buttons ──
  function copyWithFeedback(btn, text, label) {
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied!'
      btn.classList.add('copied')
      setTimeout(function () {
        btn.textContent = label
        btn.classList.remove('copied')
      }, 2000)
    })
  }

  copyMdBtn.addEventListener('click', function () {
    copyWithFeedback(copyMdBtn, input.value, 'Copy Markdown')
  })

  copyHtmlBtn.addEventListener('click', function () {
    copyWithFeedback(copyHtmlBtn, preview.innerHTML, 'Copy HTML')
  })

  // ── Default content ──
  input.value = '# Hello, Markdown!\n\nThis is a **live preview** editor. Start typing on the left.\n\n## Features\n\n- **Bold** and *italic* text\n- ~~Strikethrough~~ text\n- `Inline code` and fenced code blocks\n- [Links](https://example.com)\n- Lists, blockquotes, and more\n\n## Table Example\n\n| Feature | Supported |\n| --- | --- |\n| Tables | Yes |\n| Task lists | Yes |\n| Strikethrough | Yes |\n| Code blocks | Yes |\n\n## Task List\n\n- [x] Write markdown\n- [x] See the preview\n- [ ] Copy the output\n\n> Markdown is a lightweight markup language.\n\n```js\nconst greeting = "Hello, world!";\nconsole.log(greeting);\n```\n\n---\n\n1. Write markdown\n2. See the preview\n3. Copy the output'
  updatePreview()

  // Load marked.js in the background
  loadMarked()

  // ── Hash state restore (after defaults) ──
  var saved = HashState.parse()
  if (saved.input) {
    input.value = saved.input
    updatePreview()
  }
})()
