/**
 * AI Chat Engine — manages state + renders ChatGPT-style mockup UI.
 * IIFE, no imports. Reads window.__mockupPlatform for platform config.
 * Depends on window.MockupCommon (loaded before this script).
 *
 * Expected DOM ids:
 *   gpt-chat, msg-list, phone-screen, phone-frame,
 *   new-msg-text, add-msg-btn,
 *   dir-outgoing (=User), dir-incoming (=Assistant),
 *   toggle-dark, toggle-frame, download-btn
 */
;(function () {
  /* ── Platform config ── */
  var platform = window.__mockupPlatform || {}
  var downloadFilename = platform.downloadFilename || 'chatgpt-mockup.png'

  /* ── State ── */
  var model = platform.defaultModel || 'ChatGPT 4o'
  var defaultMessages = platform.defaultMessages || [
    { id: 1, role: 'user', text: 'Can you explain how JavaScript closures work?' },
    { id: 2, role: 'assistant', text: 'A closure is a function that remembers the variables from the place where it was defined, regardless of where it is executed later.\n\nWhen you create a function inside another function, the inner function has access to:\n\n1. Its own variables\n2. The outer function\'s variables\n3. Global variables\n\nThe key insight is that even after the outer function has returned, the inner function still has access to those outer variables. The variables aren\'t destroyed — they\'re "closed over" by the inner function.' },
    { id: 3, role: 'user', text: 'Can you show me a simple example?' },
    { id: 4, role: 'assistant', text: 'Here\'s a classic example:\n\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\nconsole.log(counter()); // 3\n\nThe inner function closes over the count variable. Each call to counter() increments and returns the same count — even though createCounter() has already finished executing.' },
  ]

  var messages = defaultMessages.map(function (m) { return { id: m.id, role: m.role, text: m.text } })
  var nextMsgId = messages.length > 0 ? Math.max.apply(null, messages.map(function (m) { return m.id })) + 1 : 1

  /* ── State helpers ── */
  function addMessage(text, role) {
    var msg = { id: nextMsgId++, role: role, text: text }
    messages.push(msg)
    return msg
  }

  function removeMessage(id) {
    messages = messages.filter(function (m) { return m.id !== id })
  }

  function moveMessage(index, direction) {
    if (direction === 'up' && index > 0) {
      var tmp = messages[index]
      messages[index] = messages[index - 1]
      messages[index - 1] = tmp
    } else if (direction === 'down' && index < messages.length - 1) {
      var tmp2 = messages[index]
      messages[index] = messages[index + 1]
      messages[index + 1] = tmp2
    }
  }

  /* ── UI mode state ── */
  var outMode = true // true = User, false = Assistant
  var dark = false
  var frame = true

  /* ── DOM refs ── */
  var $ = document.getElementById.bind(document)
  var chatEl = $('gpt-chat')
  var msgEl = $('msg-list')
  var screen = $('phone-screen')
  var frm = $('phone-frame')
  var modelChipEl = $('gpt-model-chip')

  /* ── Utility ── */
  function esc(s) {
    var d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }

  function nl2br(s) {
    return esc(s).replace(/\n/g, '<br>')
  }

  /* ── ChatGPT icon SVG ── */
  var gptIconSVG = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.052.5a6.046 6.046 0 00-5.77 4.225 6.047 6.047 0 00-4.04 2.929 6.065 6.065 0 00.747 7.116 5.985 5.985 0 00.516 4.91 6.046 6.046 0 006.51 2.9A6.065 6.065 0 0013.22 23.5a6.046 6.046 0 005.77-4.225 6.047 6.047 0 004.04-2.929 6.065 6.065 0 00-.747-7.116zM13.22 22.19a4.553 4.553 0 01-2.924-1.066c.037-.02.1-.056.144-.081l4.852-2.801a.788.788 0 00.397-.685v-6.839l2.052 1.184a.073.073 0 01.04.056v5.662a4.567 4.567 0 01-4.56 4.57zM3.88 18.236a4.543 4.543 0 01-.544-3.064c.036.021.1.06.145.084l4.852 2.801a.79.79 0 00.793 0l5.926-3.42v2.37a.072.072 0 01-.028.06l-4.906 2.833a4.567 4.567 0 01-6.238-1.664zM2.7 7.89a4.543 4.543 0 012.38-1.999V11.6a.788.788 0 00.397.685l5.926 3.42-2.051 1.185a.073.073 0 01-.07.006L4.376 14.06A4.567 4.567 0 012.7 7.89zm16.757 3.9l-5.926-3.42 2.051-1.185a.073.073 0 01.07-.006l4.907 2.834a4.566 4.566 0 01-.754 8.224v-5.71a.788.788 0 00-.397-.685zm2.041-3.072c-.036-.021-.1-.06-.145-.084l-4.852-2.801a.79.79 0 00-.793 0l-5.926 3.42V6.883a.072.072 0 01.028-.06l4.906-2.834a4.565 4.565 0 016.782 4.729zM8.678 13.428l-2.052-1.184a.073.073 0 01-.04-.056V6.526a4.565 4.565 0 017.484-3.504c-.037.02-.1.056-.144.081l-4.852 2.801a.788.788 0 00-.397.685v6.839zm1.114-2.4l2.639-1.524 2.639 1.524v3.048l-2.639 1.524-2.639-1.524V11.03z" fill="currentColor"/></svg>'

  /* ── Render: chat messages ── */
  function renderChat() {
    chatEl.innerHTML = ''

    messages.forEach(function (m) {
      var row = document.createElement('div')
      row.className = 'gpt-msg ' + (m.role === 'user' ? 'gpt-msg-user' : 'gpt-msg-assistant')
      row.setAttribute('data-msg-id', m.id)

      if (m.role === 'assistant') {
        var iconWrap = document.createElement('div')
        iconWrap.className = 'gpt-msg-icon gpt-msg-icon-assistant'
        iconWrap.innerHTML = gptIconSVG
        row.appendChild(iconWrap)

        var content = document.createElement('div')
        content.className = 'gpt-msg-content'

        var textEl = document.createElement('div')
        textEl.className = 'gpt-msg-text'
        textEl.setAttribute('contenteditable', 'true')
        textEl.innerHTML = nl2br(m.text)
        textEl.addEventListener('input', function () {
          m.text = this.innerText
          renderMsgList()
        })
        content.appendChild(textEl)

        var actions = document.createElement('div')
        actions.className = 'gpt-msg-actions'
        actions.innerHTML = '<button class="gpt-action-btn" title="Copy"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>'
        actions.querySelector('button').addEventListener('click', function () {
          navigator.clipboard.writeText(m.text)
          this.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
          var btn = this
          setTimeout(function () {
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'
          }, 2000)
        })
        content.appendChild(actions)

        row.appendChild(content)
      } else {
        // User message
        var textEl2 = document.createElement('div')
        textEl2.className = 'gpt-msg-text'
        textEl2.setAttribute('contenteditable', 'true')
        textEl2.innerHTML = nl2br(m.text)
        textEl2.addEventListener('input', function () {
          m.text = this.innerText
          renderMsgList()
        })
        row.appendChild(textEl2)
      }

      chatEl.appendChild(row)
    })

    chatEl.scrollTop = chatEl.scrollHeight
  }

  /* ── Render: message list with reorder arrows ── */
  function renderMsgList() {
    msgEl.innerHTML = ''

    messages.forEach(function (m, i) {
      var it = document.createElement('div')
      it.className = 'msg-item'
      it.innerHTML =
        '<div class="msg-reorder">' +
        '<button data-up="' + i + '"' + (i === 0 ? ' disabled' : '') + '>&#9650;</button>' +
        '<button data-dn="' + i + '"' + (i === messages.length - 1 ? ' disabled' : '') + '>&#9660;</button>' +
        '</div>' +
        '<div class="msg-body">' +
        '<div class="msg-sender">' + esc(m.role === 'user' ? 'User' : 'Assistant') + '</div>' +
        '<div class="msg-preview">' + esc(m.text.length > 60 ? m.text.substring(0, 60) + '...' : m.text) + '</div>' +
        '</div>' +
        '<div style="flex-shrink:0"><button class="tool-button-danger" data-d="' + m.id + '">&times;</button></div>'

      it.querySelector('[data-up]').addEventListener('click', function () {
        if (i > 0) { moveMessage(i, 'up'); renderAll() }
      })
      it.querySelector('[data-dn]').addEventListener('click', function () {
        if (i < messages.length - 1) { moveMessage(i, 'down'); renderAll() }
      })
      it.querySelector('[data-d]').addEventListener('click', function () {
        removeMessage(m.id)
        renderAll()
      })

      msgEl.appendChild(it)
    })
  }

  /* ── Full re-render ── */
  function renderAll() {
    renderChat()
    renderMsgList()
  }

  /* ── Wire controls ── */

  // Direction toggle (User / Assistant)
  $('dir-outgoing').addEventListener('click', function () {
    outMode = true
    this.classList.add('active')
    $('dir-incoming').classList.remove('active')
  })
  $('dir-incoming').addEventListener('click', function () {
    outMode = false
    this.classList.add('active')
    $('dir-outgoing').classList.remove('active')
  })

  // Add message
  $('add-msg-btn').addEventListener('click', function () {
    var inp = $('new-msg-text')
    var t = inp.value.trim()
    if (!t) return
    addMessage(t, outMode ? 'user' : 'assistant')
    inp.value = ''
    renderAll()
  })
  $('new-msg-text').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('add-msg-btn').click()
  })

  // Dark mode toggle
  $('toggle-dark').addEventListener('click', function () {
    dark = MockupCommon.toggleDarkMode(screen)
    this.innerHTML = dark
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Light mode'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> Dark mode'
  })

  // Frame toggle
  $('toggle-frame').addEventListener('click', function () {
    frame = MockupCommon.toggleFrame(frm)
    this.innerHTML = frame
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> Hide frame'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg> Show frame'
  })

  // Download PNG
  $('download-btn').addEventListener('click', function () {
    var tgt = frame ? frm : screen
    MockupCommon.exportPNG(tgt, downloadFilename)
  })

  /* ── Initial render ── */
  renderAll()
})()
