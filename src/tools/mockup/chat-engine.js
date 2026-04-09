/**
 * Chat Engine — manages state + renders chat mockup UI.
 * IIFE, no imports. Reads window.__mockupPlatform for platform config.
 * Depends on window.MockupCommon (loaded before this script).
 *
 * Expected DOM ids:
 *   wa-chat, people-list, msg-list, phone-screen, phone-frame,
 *   wa-avatar, wa-contact-name, msg-sender-select,
 *   new-person-name, add-person-btn, new-msg-text, add-msg-btn,
 *   dir-outgoing, dir-incoming, toggle-dark, toggle-frame, download-btn
 */
;(function () {
  /* ── Platform config (set by the .astro page before this script loads) ── */
  var platform = window.__mockupPlatform || {}
  var downloadFilename = platform.downloadFilename || 'chat-mockup.png'

  /* ── Color palette for people avatars ── */
  var colors = [
    '#128c7e', '#25d366', '#34b7f1', '#e44d6e',
    '#ffa62b', '#7c5cbf', '#d4842a', '#3d8b6e',
  ]

  /* ── Inline state management (mirrors chat-state.js logic) ── */
  var defaultPeople = (platform.defaultPeople || [
    { id: 1, name: 'Sarah', color: '#128c7e' },
    { id: 2, name: 'You', color: '#25d366' },
  ])
  var defaultMessages = (platform.defaultMessages || [
    { id: 1, text: 'Hey! Did you see the new design mockups?', sender: 1, outgoing: false, time: '14:15' },
    { id: 2, text: 'Yes! They look amazing. The new color scheme is perfect.', sender: 2, outgoing: true, time: '14:16' },
    { id: 3, text: 'Right?? The team really nailed it this time', sender: 1, outgoing: false, time: '14:16' },
    { id: 4, text: 'I especially love the dark mode version. Very clean.', sender: 2, outgoing: true, time: '14:17' },
    { id: 5, text: 'Want to hop on a call to discuss the implementation?', sender: 1, outgoing: false, time: '14:18' },
    { id: 6, text: 'Sure, give me 10 minutes. Just finishing up something.', sender: 2, outgoing: true, time: '14:18' },
    { id: 7, text: 'No rush! Take your time', sender: 1, outgoing: false, time: '14:19' },
  ])

  var people = defaultPeople.map(function (p) { return { id: p.id, name: p.name, color: p.color } })
  var messages = defaultMessages.map(function (m) { return { id: m.id, text: m.text, sender: m.sender, outgoing: m.outgoing, time: m.time } })
  var nextMsgId = messages.length > 0 ? Math.max.apply(null, messages.map(function (m) { return m.id })) + 1 : 1
  var nextPersonId = Math.max.apply(null, people.map(function (p) { return p.id })) + 1

  /* ── State helpers ── */
  function addPerson(name) {
    var person = { id: nextPersonId++, name: name, color: colors[people.length % colors.length] }
    people.push(person)
    return person
  }

  function removePerson(id) {
    var nonYou = people.filter(function (p) { return p.name !== 'You' })
    if (nonYou.length <= 1 && nonYou[0] && nonYou[0].id === id) return
    people = people.filter(function (p) { return p.id !== id })
    messages = messages.filter(function (m) { return m.sender !== id })
  }

  function addMessage(text, sender, outgoing, time) {
    var msg = { id: nextMsgId++, text: text, sender: sender, outgoing: outgoing, time: time }
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
  var outMode = true
  var dark = false
  var frame = true
  var activePerson = people.find(function (p) { return p.name !== 'You' })
  var active = activePerson ? activePerson.id : 1

  /* ── DOM refs ── */
  var $ = document.getElementById.bind(document)
  var chatEl = $('wa-chat')
  var pplEl = $('people-list')
  var msgEl = $('msg-list')
  var screen = $('phone-screen')
  var frm = $('phone-frame')
  var avEl = $('wa-avatar')
  var nameEl = $('wa-contact-name')
  var selEl = $('msg-sender-select')

  /* ── Utility ── */
  function esc(s) {
    var d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }

  /* ── Render: chat bubbles (contenteditable) ── */
  function renderChat() {
    chatEl.innerHTML = ''

    var pill = document.createElement('div')
    pill.className = 'wa-date-pill'
    pill.textContent = 'TODAY'
    chatEl.appendChild(pill)

    messages.forEach(function (m, idx) {
      // Add tail to first message or when sender changes
      var prevMsg = idx > 0 ? messages[idx - 1] : null
      var hasTail = !prevMsg || prevMsg.outgoing !== m.outgoing

      var b = document.createElement('div')
      b.className = 'wa-msg ' + (m.outgoing ? 'outgoing' : 'incoming') + (hasTail ? ' has-tail' : '')
      b.setAttribute('contenteditable', 'true')
      b.setAttribute('data-msg-id', m.id)
      b.appendChild(document.createTextNode(m.text))

      var meta = document.createElement('div')
      meta.className = 'wa-msg-meta'
      var t = document.createElement('span')
      t.className = 'wa-msg-time'
      t.textContent = m.time
      meta.appendChild(t)

      if (m.outgoing) {
        var tk = document.createElement('span')
        tk.className = 'wa-msg-ticks'
        tk.innerHTML = '<svg viewBox="0 0 16 11" width="16" height="11"><path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146l-.311.31a.445.445 0 0 0-.14.337c0 .136.047.25.14.343l2.996 2.996a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.14-.337l-.387-.31zm-2.26 7.654l.387.317a.464.464 0 0 0 .337.14.426.426 0 0 0 .343-.14l.31-.31a.465.465 0 0 0 .14-.343.445.445 0 0 0-.14-.337L7.192 4.64l-.48.597 2.1 3.07z" fill="currentColor"/></svg>'
        meta.appendChild(tk)
      }

      b.appendChild(meta)

      // Sync inline edits back to state
      b.addEventListener('input', function () {
        var txt = ''
        for (var i = 0; i < this.childNodes.length; i++) {
          if (this.childNodes[i].nodeType === 3) txt += this.childNodes[i].textContent
        }
        m.text = txt
        renderMsgList()
      })

      chatEl.appendChild(b)
    })

    chatEl.scrollTop = chatEl.scrollHeight
  }

  /* ── Render: people list + sender select ── */
  function renderPeople() {
    pplEl.innerHTML = ''
    selEl.innerHTML = ''

    people.forEach(function (p) {
      if (p.name === 'You') return

      var it = document.createElement('div')
      it.className = 'person-item' + (p.id === active ? ' active' : '')
      it.innerHTML =
        '<div class="person-avatar" style="background:' + p.color + '">' +
        p.name.charAt(0).toUpperCase() +
        '</div><span class="person-name">' + esc(p.name) +
        '</span><button class="tool-button-danger" data-r="' + p.id + '">&times;</button>'

      // Click name to set as active contact
      it.querySelector('.person-name').addEventListener('click', function () {
        active = p.id
        avEl.textContent = p.name.charAt(0).toUpperCase()
        avEl.style.background = p.color
        nameEl.textContent = p.name
        renderPeople()
      })

      // Delete person
      it.querySelector('[data-r]').addEventListener('click', function (e) {
        e.stopPropagation()
        if (people.length <= 2) return
        removePerson(p.id)
        if (active === p.id) {
          var next = people.find(function (x) { return x.name !== 'You' })
          if (next) active = next.id
        }
        renderAll()
      })

      pplEl.appendChild(it)

      // Populate sender select for "incoming" mode
      var o = document.createElement('option')
      o.value = p.id
      o.textContent = p.name
      selEl.appendChild(o)
    })

    // Keep header avatar/name in sync
    var ap = people.find(function (p) { return p.id === active })
    if (ap) {
      avEl.textContent = ap.name.charAt(0).toUpperCase()
      avEl.style.background = ap.color
      nameEl.textContent = ap.name
    }
  }

  /* ── Render: message list with reorder arrows ── */
  function renderMsgList() {
    msgEl.innerHTML = ''

    messages.forEach(function (m, i) {
      var s = people.find(function (p) { return p.id === m.sender })
      var it = document.createElement('div')
      it.className = 'msg-item'
      it.innerHTML =
        '<div class="msg-reorder">' +
        '<button data-up="' + i + '"' + (i === 0 ? ' disabled' : '') + '>&#9650;</button>' +
        '<button data-dn="' + i + '"' + (i === messages.length - 1 ? ' disabled' : '') + '>&#9660;</button>' +
        '</div>' +
        '<div class="msg-body">' +
        '<div class="msg-sender">' + esc(s ? s.name : '?') + ' &middot; ' + m.time + '</div>' +
        '<div class="msg-preview">' + esc(m.text) + '</div>' +
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
    renderPeople()
    renderMsgList()
  }

  /* ── Wire controls ── */

  // Add person
  $('add-person-btn').addEventListener('click', function () {
    var inp = $('new-person-name')
    var n = inp.value.trim()
    if (!n) return
    addPerson(n)
    inp.value = ''
    renderAll()
  })
  $('new-person-name').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('add-person-btn').click()
  })

  // Direction toggle
  $('dir-outgoing').addEventListener('click', function () {
    outMode = true
    this.classList.add('active')
    $('dir-incoming').classList.remove('active')
    selEl.style.display = 'none'
  })
  $('dir-incoming').addEventListener('click', function () {
    outMode = false
    this.classList.add('active')
    $('dir-outgoing').classList.remove('active')
    selEl.style.display = 'block'
  })

  // Add message
  $('add-msg-btn').addEventListener('click', function () {
    var inp = $('new-msg-text')
    var t = inp.value.trim()
    if (!t) return
    var sid = outMode
      ? (people.find(function (p) { return p.name === 'You' }) || {}).id
      : (parseInt(selEl.value) || active)
    addMessage(t, sid, outMode, MockupCommon.getTimeNow())
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
