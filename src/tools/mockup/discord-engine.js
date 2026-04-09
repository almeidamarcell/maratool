/**
 * Discord Engine — manages state + renders Discord chat mockup UI.
 * IIFE, no imports. Reads window.__mockupPlatform for platform config.
 * Depends on window.MockupCommon (loaded before this script).
 *
 * Expected DOM ids:
 *   dc-chat, people-list, msg-list, phone-screen, phone-frame,
 *   msg-sender-select, new-person-name, add-person-btn,
 *   new-msg-text, add-msg-btn, dir-outgoing, dir-incoming,
 *   toggle-dark, toggle-frame, download-btn
 */
;(function () {
  var platform = window.__mockupPlatform || {}
  var downloadFilename = platform.downloadFilename || 'discord-mockup.png'

  /* ── Color palette for role colors ── */
  var roleColors = [
    '#5865F2', '#57F287', '#FEE75C', '#EB459E',
    '#ED4245', '#F47B67', '#E8A62E', '#3BA55D',
  ]

  /* ── State ── */
  var defaultPeople = platform.defaultPeople || [
    { id: 1, name: 'noctis_dev', color: '#5865F2', avatar: '' },
    { id: 2, name: 'luna_writes', color: '#57F287', avatar: '' },
    { id: 3, name: 'kael_ops', color: '#FEE75C', avatar: '' },
  ]
  var defaultMessages = platform.defaultMessages || [
    { id: 1, text: 'just pushed the auth refactor to main', sender: 1, time: 'Today at 3:42 PM' },
    { id: 2, text: 'nice, I\'ll pull and run the tests', sender: 2, time: 'Today at 3:43 PM' },
    { id: 3, text: 'heads up — the env vars changed, check the README', sender: 1, time: 'Today at 3:43 PM' },
    { id: 4, text: 'got it, updating my .env now', sender: 2, time: 'Today at 3:44 PM' },
    { id: 5, text: 'are we still doing the deploy at 5?', sender: 3, time: 'Today at 3:45 PM' },
    { id: 6, text: 'yeah, I\'ll handle the migration script first', sender: 1, time: 'Today at 3:45 PM' },
  ]

  var people = defaultPeople.map(function (p) {
    return { id: p.id, name: p.name, color: p.color, avatar: p.avatar || '' }
  })
  var messages = defaultMessages.map(function (m) {
    return { id: m.id, text: m.text, sender: m.sender, time: m.time }
  })
  var nextMsgId = messages.length > 0 ? Math.max.apply(null, messages.map(function (m) { return m.id })) + 1 : 1
  var nextPersonId = Math.max.apply(null, people.map(function (p) { return p.id })) + 1

  /* ── State helpers ── */
  function addPerson(name) {
    var person = { id: nextPersonId++, name: name, color: roleColors[people.length % roleColors.length], avatar: '' }
    people.push(person)
    return person
  }

  function removePerson(id) {
    if (people.length <= 1) return
    people = people.filter(function (p) { return p.id !== id })
    messages = messages.filter(function (m) { return m.sender !== id })
  }

  function addMessage(text, sender, time) {
    var msg = { id: nextMsgId++, text: text, sender: sender, time: time }
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

  /* ── UI state ── */
  var outMode = true // true = first person speaks
  var dark = true    // Discord is dark by default
  var frame = true
  var activeSender = people[0] ? people[0].id : 1

  /* ── DOM refs ── */
  var $ = document.getElementById.bind(document)
  var chatEl = $('dc-chat')
  var pplEl = $('people-list')
  var msgEl = $('msg-list')
  var screen = $('phone-screen')
  var frm = $('phone-frame')
  var selEl = $('msg-sender-select')

  /* ── Utility ── */
  function esc(s) {
    var d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }

  /* ── Render: Discord chat messages ── */
  function renderChat() {
    chatEl.innerHTML = ''

    messages.forEach(function (m, idx) {
      var prev = idx > 0 ? messages[idx - 1] : null
      var collapsed = prev && prev.sender === m.sender
      var sender = people.find(function (p) { return p.id === m.sender })
      var sName = sender ? sender.name : 'Unknown'
      var sColor = sender ? sender.color : '#B5BAC1'

      var row = document.createElement('div')
      row.className = 'dc-msg-row' + (collapsed ? ' dc-msg-collapsed' : '')

      if (!collapsed) {
        var header = document.createElement('div')
        header.className = 'dc-msg-header'

        var avatar = document.createElement('div')
        avatar.className = 'dc-msg-avatar'
        avatar.style.background = sColor
        avatar.textContent = sName.charAt(0).toUpperCase()

        var infoWrap = document.createElement('div')
        infoWrap.className = 'dc-msg-info'

        var username = document.createElement('span')
        username.className = 'dc-msg-username'
        username.style.color = sColor
        username.textContent = sName

        var time = document.createElement('span')
        time.className = 'dc-msg-time'
        time.textContent = m.time

        infoWrap.appendChild(username)
        infoWrap.appendChild(time)

        header.appendChild(avatar)
        header.appendChild(infoWrap)
        row.appendChild(header)
      }

      var textEl = document.createElement('div')
      textEl.className = 'dc-msg-text'
      textEl.setAttribute('contenteditable', 'true')
      textEl.setAttribute('data-msg-id', m.id)
      textEl.textContent = m.text

      textEl.addEventListener('input', function () {
        m.text = this.textContent
        renderMsgList()
      })

      row.appendChild(textEl)
      chatEl.appendChild(row)
    })

    chatEl.scrollTop = chatEl.scrollHeight
  }

  /* ── Render: people list + sender select ── */
  function renderPeople() {
    pplEl.innerHTML = ''
    selEl.innerHTML = ''

    people.forEach(function (p) {
      var it = document.createElement('div')
      it.className = 'person-item' + (p.id === activeSender ? ' active' : '')
      it.innerHTML =
        '<div class="person-avatar" style="background:' + p.color + '">' +
        p.name.charAt(0).toUpperCase() +
        '</div><span class="person-name">' + esc(p.name) +
        '</span><button class="tool-button-danger" data-r="' + p.id + '">&times;</button>'

      it.querySelector('.person-name').addEventListener('click', function () {
        activeSender = p.id
        renderPeople()
      })

      it.querySelector('[data-r]').addEventListener('click', function (e) {
        e.stopPropagation()
        if (people.length <= 1) return
        removePerson(p.id)
        if (activeSender === p.id) {
          var next = people[0]
          if (next) activeSender = next.id
        }
        renderAll()
      })

      pplEl.appendChild(it)

      var o = document.createElement('option')
      o.value = p.id
      o.textContent = p.name
      if (p.id === activeSender) o.selected = true
      selEl.appendChild(o)
    })
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

  // Direction toggle (in Discord context: "You" = first person, "Them" = pick sender)
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
    var sid = outMode ? activeSender : (parseInt(selEl.value) || activeSender)
    var now = new Date()
    var hours = now.getHours()
    var ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    if (hours === 0) hours = 12
    var timeStr = 'Today at ' + hours + ':' + now.getMinutes().toString().padStart(2, '0') + ' ' + ampm
    addMessage(t, sid, timeStr)
    inp.value = ''
    renderAll()
  })
  $('new-msg-text').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('add-msg-btn').click()
  })

  // Dark mode toggle (Discord is dark by default, toggle switches to light)
  $('toggle-dark').addEventListener('click', function () {
    dark = !dark
    if (dark) {
      screen.classList.remove('dc-light')
    } else {
      screen.classList.add('dc-light')
    }
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
