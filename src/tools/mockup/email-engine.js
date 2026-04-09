/**
 * Email Engine — manages state + renders email mockup UI (Gmail).
 * IIFE, no imports. Reads window.__mockupPlatform for platform config.
 * Depends on window.MockupCommon (loaded before this script).
 *
 * Expected DOM ids:
 *   email-content, from-name, from-email, to-email, email-subject,
 *   email-body, email-date, toggle-dark, toggle-frame, download-btn,
 *   phone-screen, phone-frame,
 *   label-inbox, label-important, label-starred, label-social
 */
;(function () {
  var platform = window.__mockupPlatform || {}
  var downloadFilename = platform.downloadFilename || 'gmail-mockup.png'

  /* ── State ── */
  var state = {
    from: Object.assign({
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      avatar: '',
      color: '#4285F4',
    }, platform.defaultFrom || {}),
    to: platform.defaultTo || 'me',
    subject: platform.defaultSubject || 'Q2 Planning Meeting Notes',
    body: platform.defaultBody || 'Hi team,\n\nHere are the key takeaways from our Q2 planning session:\n\n1. Product launch timeline moved to June 15\n2. Design review scheduled for next Thursday\n3. Engineering sprints will be 2 weeks instead of 3\n\nPlease review the attached doc and add any comments by Friday.\n\nBest,\nSarah',
    date: platform.defaultDate || 'Apr 9, 2026, 10:23 AM',
    labels: platform.defaultLabels || ['Inbox'],
  }

  var dark = false
  var frame = true

  /* ── DOM refs ── */
  var $ = document.getElementById.bind(document)
  var emailEl = $('email-content')
  var screen = $('phone-screen')
  var frm = $('phone-frame')

  /* ── Utility ── */
  function esc(s) {
    var d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }

  /* ── Label colors ── */
  var labelColors = {
    'Inbox': { bg: '#E8F0FE', color: '#1967D2', darkBg: '#1A3A5C', darkColor: '#8AB4F8' },
    'Important': { bg: '#FCE8B2', color: '#B06000', darkBg: '#5C4A1A', darkColor: '#FDD663' },
    'Starred': { bg: '#FCE8B2', color: '#B06000', darkBg: '#5C4A1A', darkColor: '#FDD663' },
    'Social': { bg: '#E6F4EA', color: '#137333', darkBg: '#1A3C2A', darkColor: '#81C995' },
  }

  /* ── Render Gmail email view ── */
  function render() {
    var initial = state.from.name.charAt(0).toUpperCase()

    var avatarHtml = state.from.avatar
      ? '<img class="gm-sender-avatar" src="' + esc(state.from.avatar) + '" alt="">'
      : '<div class="gm-sender-avatar gm-avatar-initial" style="background:' + state.from.color + '">' + initial + '</div>'

    var labelsHtml = ''
    state.labels.forEach(function (label) {
      var lc = labelColors[label] || { bg: '#E8E8E4', color: '#6b6b63', darkBg: '#3C3C3C', darkColor: '#AAAAAA' }
      labelsHtml += '<span class="gm-label" data-label="' + esc(label) + '" style="background:' + lc.bg + ';color:' + lc.color + '">' + esc(label) + '</span>'
    })

    var bodyLines = state.body.split('\n').map(function (line) {
      return '<div>' + (esc(line) || '&nbsp;') + '</div>'
    }).join('')

    emailEl.innerHTML =
      '<div class="gm-email">' +
        '<div class="gm-toolbar">' +
          '<svg class="gm-toolbar-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
          '<div style="flex:1"></div>' +
          '<svg class="gm-toolbar-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
          '<svg class="gm-toolbar-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
          '<svg class="gm-toolbar-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6l9 6 9-6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>' +
        '</div>' +
        '<div class="gm-subject-row">' +
          '<h2 class="gm-subject" contenteditable="true">' + esc(state.subject) + '</h2>' +
          '<div class="gm-labels">' + labelsHtml + '</div>' +
        '</div>' +
        '<div class="gm-sender-row">' +
          avatarHtml +
          '<div class="gm-sender-info">' +
            '<div class="gm-sender-name-row">' +
              '<span class="gm-sender-name">' + esc(state.from.name) + '</span>' +
              '<span class="gm-date">' + esc(state.date) + '</span>' +
            '</div>' +
            '<div class="gm-sender-email">&lt;' + esc(state.from.email) + '&gt;</div>' +
            '<div class="gm-to">to ' + esc(state.to) + ' <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg></div>' +
          '</div>' +
          '<div class="gm-sender-actions">' +
            '<svg class="gm-toolbar-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17l-5-5 5-5"/><path d="M4 12h16"/></svg>' +
            '<svg class="gm-toolbar-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' +
          '</div>' +
        '</div>' +
        '<div class="gm-body" contenteditable="true">' + bodyLines + '</div>' +
        '<div class="gm-reply-bar">' +
          '<button class="gm-reply-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 17l-5-5 5-5"/><path d="M4 12h16"/></svg> Reply</button>' +
          '<button class="gm-reply-btn"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17l5-5-5-5"/><path d="M20 12H4"/></svg> Forward</button>' +
        '</div>' +
      '</div>'

    wireContentEditable()
  }

  /* ── Sync contenteditable back to state ── */
  function wireContentEditable() {
    var subjectEl = emailEl.querySelector('.gm-subject')
    if (subjectEl) {
      subjectEl.addEventListener('input', function () {
        state.subject = this.textContent || ''
        var si = $('email-subject')
        if (si) si.value = state.subject
      })
    }
    var bodyEl = emailEl.querySelector('.gm-body')
    if (bodyEl) {
      bodyEl.addEventListener('input', function () {
        state.body = this.innerText || ''
        var bi = $('email-body')
        if (bi) bi.value = state.body
      })
    }
  }

  /* ── Wire controls ── */

  // From name
  var fromNameInput = $('from-name')
  if (fromNameInput) {
    fromNameInput.value = state.from.name
    fromNameInput.addEventListener('input', function () {
      state.from.name = this.value
      render()
    })
  }

  // From email
  var fromEmailInput = $('from-email')
  if (fromEmailInput) {
    fromEmailInput.value = state.from.email
    fromEmailInput.addEventListener('input', function () {
      state.from.email = this.value
      render()
    })
  }

  // To
  var toInput = $('to-email')
  if (toInput) {
    toInput.value = state.to
    toInput.addEventListener('input', function () {
      state.to = this.value
      render()
    })
  }

  // Subject
  var subjectInput = $('email-subject')
  if (subjectInput) {
    subjectInput.value = state.subject
    subjectInput.addEventListener('input', function () {
      state.subject = this.value
      render()
    })
  }

  // Body
  var bodyInput = $('email-body')
  if (bodyInput) {
    bodyInput.value = state.body
    bodyInput.addEventListener('input', function () {
      state.body = this.value
      render()
    })
  }

  // Date
  var dateInput = $('email-date')
  if (dateInput) {
    dateInput.value = state.date
    dateInput.addEventListener('input', function () {
      state.date = this.value
      render()
    })
  }

  // Labels checkboxes
  ;['Inbox', 'Important', 'Starred', 'Social'].forEach(function (label) {
    var el = $('label-' + label.toLowerCase())
    if (el) {
      el.checked = state.labels.indexOf(label) !== -1
      el.addEventListener('change', function () {
        if (this.checked) {
          if (state.labels.indexOf(label) === -1) state.labels.push(label)
        } else {
          state.labels = state.labels.filter(function (l) { return l !== label })
        }
        render()
      })
    }
  })

  // Dark mode toggle
  $('toggle-dark').addEventListener('click', function () {
    dark = MockupCommon.toggleDarkMode(screen)
    // Update label colors for dark mode
    var labelEls = emailEl.querySelectorAll('.gm-label')
    labelEls.forEach(function (el) {
      var labelName = el.getAttribute('data-label')
      var lc = labelColors[labelName]
      if (lc) {
        el.style.background = dark ? lc.darkBg : lc.bg
        el.style.color = dark ? lc.darkColor : lc.color
      }
    })
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
  render()
})()
