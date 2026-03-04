// Markdown Editor — minimal vanilla JS parser + live preview
(function () {
  var input = document.getElementById('md-input')
  var preview = document.getElementById('md-preview')
  var copyMdBtn = document.getElementById('md-copy-md')
  var copyHtmlBtn = document.getElementById('md-copy-html')
  var debounceTimer = null

  // ── Minimal Markdown → HTML parser ──
  function parseMarkdown(src) {
    var lines = src.split('\n')
    var html = []
    var i = 0

    while (i < lines.length) {
      var line = lines[i]

      // Fenced code blocks
      if (/^```/.test(line)) {
        var lang = line.slice(3).trim()
        var code = []
        i++
        while (i < lines.length && !/^```/.test(lines[i])) {
          code.push(escapeHtml(lines[i]))
          i++
        }
        i++ // skip closing ```
        html.push('<pre><code>' + code.join('\n') + '</code></pre>')
        continue
      }

      // Horizontal rule
      if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) {
        html.push('<hr>')
        i++
        continue
      }

      // Headings
      var headingMatch = line.match(/^(#{1,6})\s+(.*)/)
      if (headingMatch) {
        var level = headingMatch[1].length
        html.push('<h' + level + '>' + inlineFormat(headingMatch[2]) + '</h' + level + '>')
        i++
        continue
      }

      // Blockquote
      if (/^>\s?/.test(line)) {
        var bqLines = []
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          bqLines.push(lines[i].replace(/^>\s?/, ''))
          i++
        }
        html.push('<blockquote>' + parseMarkdown(bqLines.join('\n')) + '</blockquote>')
        continue
      }

      // Unordered list
      if (/^[\-\*\+]\s+/.test(line)) {
        var items = []
        while (i < lines.length && /^[\-\*\+]\s+/.test(lines[i])) {
          items.push('<li>' + inlineFormat(lines[i].replace(/^[\-\*\+]\s+/, '')) + '</li>')
          i++
        }
        html.push('<ul>' + items.join('') + '</ul>')
        continue
      }

      // Ordered list
      if (/^\d+\.\s+/.test(line)) {
        var items = []
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          items.push('<li>' + inlineFormat(lines[i].replace(/^\d+\.\s+/, '')) + '</li>')
          i++
        }
        html.push('<ol>' + items.join('') + '</ol>')
        continue
      }

      // Empty line
      if (/^\s*$/.test(line)) {
        i++
        continue
      }

      // Paragraph — collect consecutive non-empty lines
      var pLines = []
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) && !/^```/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^[\-\*\+]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^(-{3,}|_{3,}|\*{3,})\s*$/.test(lines[i])) {
        pLines.push(lines[i])
        i++
      }
      html.push('<p>' + inlineFormat(pLines.join(' ')) + '</p>')
    }

    return html.join('\n')
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function inlineFormat(text) {
    // Inline code (must come before bold/italic to avoid conflicts)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
    // Images
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Bold + italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
    text = text.replace(/_(.+?)_/g, '<em>$1</em>')
    return text
  }

  // ── Preview update ──
  function updatePreview() {
    preview.innerHTML = parseMarkdown(input.value)
  }

  input.addEventListener('input', function () {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(updatePreview, 150)
  })

  // ── Toolbar insertion ──
  var insertions = {
    bold: { before: '**', after: '**', placeholder: 'bold text' },
    italic: { before: '*', after: '*', placeholder: 'italic text' },
    link: { before: '[', after: '](url)', placeholder: 'link text' },
    code: { before: '`', after: '`', placeholder: 'code' },
    h1: { before: '# ', after: '', placeholder: 'Heading 1', lineStart: true },
    h2: { before: '## ', after: '', placeholder: 'Heading 2', lineStart: true },
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
      var selected = text.slice(start, end) || ins.placeholder

      if (ins.lineStart) {
        // Find the start of the current line
        var lineStart = text.lastIndexOf('\n', start - 1) + 1
        input.value = text.slice(0, lineStart) + ins.before + text.slice(lineStart)
        var newPos = lineStart + ins.before.length
        input.setSelectionRange(newPos, newPos + (end - start || ins.placeholder.length))
      } else {
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
  input.value = '# Hello, Markdown!\n\nThis is a **live preview** editor. Start typing on the left.\n\n## Features\n\n- **Bold** and *italic* text\n- `Inline code` and code blocks\n- [Links](https://example.com)\n- Lists, blockquotes, and more\n\n> Markdown is a lightweight markup language.\n\n```\nconst greeting = "Hello, world!";\nconsole.log(greeting);\n```\n\n---\n\n1. Write markdown\n2. See the preview\n3. Copy the output'
  updatePreview()
})()
