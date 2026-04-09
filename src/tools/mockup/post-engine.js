/**
 * Post Engine — manages state + renders social media post mockup UI.
 * IIFE, no imports. Reads window.__mockupPlatform for platform config.
 * Depends on window.MockupCommon (loaded before this script).
 *
 * Expected DOM ids:
 *   post-content, author-name, author-handle, content-text,
 *   toggle-dark, toggle-frame, download-btn, phone-screen, phone-frame,
 *   metric-likes, metric-comments, metric-shares, metric-bookmarks,
 *   post-timestamp, image-upload, image-upload-btn
 */
;(function () {
  var platform = window.__mockupPlatform || {}
  var downloadFilename = platform.downloadFilename || 'post-mockup.png'
  var platformId = platform.id || 'instagram-post'

  /* ── State ── */
  var state = {
    author: Object.assign({
      name: 'designstudio',
      displayName: 'Design Studio',
      verified: false,
      avatar: '',
    }, platform.defaultAuthor || {}),
    content: platform.defaultContent || 'Check out our latest work!',
    metrics: Object.assign({
      likes: 1243,
      comments: 48,
      shares: 12,
      bookmarks: 89,
    }, platform.defaultMetrics || {}),
    timestamp: platform.defaultTimestamp || '2h',
    imageUrl: '',
  }

  var dark = false
  var frame = true

  /* ── DOM refs ── */
  var $ = document.getElementById.bind(document)
  var postEl = $('post-content')
  var screen = $('phone-screen')
  var frm = $('phone-frame')

  /* ── Utility ── */
  function esc(s) {
    var d = document.createElement('div')
    d.textContent = s
    return d.innerHTML
  }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
    if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
    if (n >= 1000) return n.toLocaleString()
    return String(n)
  }

  /* ── Render: Instagram Post ── */
  function renderInstagram() {
    var v = state.author.verified ? '<svg class="igp-verified" viewBox="0 0 40 40" width="14" height="14"><circle cx="20" cy="20" r="20" fill="#3897F0"/><path d="M17.6 28.2l-7.2-7.2 2.4-2.4 4.8 4.8 10.8-10.8 2.4 2.4z" fill="#fff"/></svg>' : ''
    var imageArea = state.imageUrl
      ? '<div class="igp-image"><img src="' + esc(state.imageUrl) + '" alt="Post image" style="width:100%;height:100%;object-fit:cover;"></div>'
      : '<div class="igp-image igp-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>'

    var avatarHtml = state.author.avatar
      ? '<img class="igp-avatar" src="' + esc(state.author.avatar) + '" alt="">'
      : '<div class="igp-avatar igp-avatar-initial">' + state.author.name.charAt(0).toUpperCase() + '</div>'

    postEl.innerHTML =
      '<div class="igp-card">' +
        '<div class="igp-header">' +
          avatarHtml +
          '<div class="igp-header-info">' +
            '<span class="igp-username">' + esc(state.author.name) + '</span>' + v +
          '</div>' +
          '<div class="igp-menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></div>' +
        '</div>' +
        imageArea +
        '<div class="igp-actions">' +
          '<div class="igp-actions-left">' +
            '<svg class="igp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>' +
            '<svg class="igp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>' +
            '<svg class="igp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '</div>' +
          '<svg class="igp-icon igp-bookmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>' +
        '</div>' +
        '<div class="igp-likes">' + formatNum(state.metrics.likes) + ' likes</div>' +
        '<div class="igp-caption"><span class="igp-caption-user">' + esc(state.author.name) + '</span> <span class="igp-caption-text" contenteditable="true">' + esc(state.content) + '</span></div>' +
        '<div class="igp-comments-link">View all ' + formatNum(state.metrics.comments) + ' comments</div>' +
        '<div class="igp-timestamp">' + esc(state.timestamp) + '</div>' +
      '</div>'

    wireContentEditable()
  }

  /* ── Render: X/Twitter Post ── */
  function renderXPost() {
    var v = state.author.verified ? '<svg class="xp-verified" viewBox="0 0 22 22" width="18" height="18"><circle cx="11" cy="11" r="11" fill="#1D9BF0"/><path d="M9.5 15.17l-3.89-3.89 1.41-1.42L9.5 12.34l5.47-5.47 1.42 1.41z" fill="#fff"/></svg>' : ''

    var avatarHtml = state.author.avatar
      ? '<img class="xp-avatar" src="' + esc(state.author.avatar) + '" alt="">'
      : '<div class="xp-avatar xp-avatar-initial">' + state.author.displayName.charAt(0).toUpperCase() + '</div>'

    var imageArea = state.imageUrl
      ? '<div class="xp-image"><img src="' + esc(state.imageUrl) + '" alt="Post image" style="width:100%;height:100%;object-fit:cover;border-radius:16px;"></div>'
      : ''

    postEl.innerHTML =
      '<div class="xp-card">' +
        '<div class="xp-header">' +
          avatarHtml +
          '<div class="xp-header-info">' +
            '<div class="xp-name-row"><span class="xp-displayname">' + esc(state.author.displayName) + '</span>' + v + '</div>' +
            '<span class="xp-handle">@' + esc(state.author.name) + '</span>' +
          '</div>' +
          '<div class="xp-menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg></div>' +
        '</div>' +
        '<div class="xp-content" contenteditable="true">' + esc(state.content) + '</div>' +
        imageArea +
        '<div class="xp-timestamp">' + esc(state.timestamp) + '</div>' +
        '<div class="xp-metrics-row">' +
          '<span class="xp-metric"><strong>' + formatNum(state.metrics.shares) + '</strong> Reposts</span>' +
          '<span class="xp-metric"><strong>' + formatNum(state.metrics.likes) + '</strong> Likes</span>' +
          '<span class="xp-metric"><strong>' + formatNum(state.metrics.bookmarks) + '</strong> Bookmarks</span>' +
        '</div>' +
        '<div class="xp-actions">' +
          '<div class="xp-action xp-action-reply"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span>' + formatNum(state.metrics.comments) + '</span></div>' +
          '<div class="xp-action xp-action-repost"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg><span>' + formatNum(state.metrics.shares) + '</span></div>' +
          '<div class="xp-action xp-action-like"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span>' + formatNum(state.metrics.likes) + '</span></div>' +
          '<div class="xp-action xp-action-bookmark"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg><span>' + formatNum(state.metrics.bookmarks) + '</span></div>' +
          '<div class="xp-action xp-action-share"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></div>' +
        '</div>' +
      '</div>'

    wireContentEditable()
  }

  /* ── Sync contenteditable back to state ── */
  function wireContentEditable() {
    var ce = postEl.querySelector('[contenteditable="true"]')
    if (ce) {
      ce.addEventListener('input', function () {
        state.content = this.textContent || ''
      })
    }
  }

  /* ── Render dispatcher ── */
  function render() {
    if (platformId === 'x-post') {
      renderXPost()
    } else {
      renderInstagram()
    }
  }

  /* ── Wire controls ── */

  // Author name
  var nameInput = $('author-name')
  if (nameInput) {
    nameInput.value = platformId === 'x-post' ? state.author.displayName : state.author.name
    nameInput.addEventListener('input', function () {
      if (platformId === 'x-post') {
        state.author.displayName = this.value
      } else {
        state.author.name = this.value
      }
      render()
    })
  }

  // Author handle
  var handleInput = $('author-handle')
  if (handleInput) {
    handleInput.value = platformId === 'x-post' ? state.author.name : state.author.name
    handleInput.addEventListener('input', function () {
      state.author.name = this.value
      render()
    })
  }

  // Verified toggle
  var verifiedInput = $('author-verified')
  if (verifiedInput) {
    verifiedInput.checked = state.author.verified
    verifiedInput.addEventListener('change', function () {
      state.author.verified = this.checked
      render()
    })
  }

  // Content text
  var contentInput = $('content-text')
  if (contentInput) {
    contentInput.value = state.content
    contentInput.addEventListener('input', function () {
      state.content = this.value
      render()
    })
  }

  // Timestamp
  var tsInput = $('post-timestamp')
  if (tsInput) {
    tsInput.value = state.timestamp
    tsInput.addEventListener('input', function () {
      state.timestamp = this.value
      render()
    })
  }

  // Metrics
  ;['likes', 'comments', 'shares', 'bookmarks'].forEach(function (key) {
    var el = $('metric-' + key)
    if (el) {
      el.value = state.metrics[key]
      el.addEventListener('input', function () {
        state.metrics[key] = parseInt(this.value) || 0
        render()
      })
    }
  })

  // Image upload
  var imageUploadBtn = $('image-upload-btn')
  var imageUploadInput = $('image-upload')
  if (imageUploadBtn && imageUploadInput) {
    imageUploadBtn.addEventListener('click', function () {
      imageUploadInput.click()
    })
    imageUploadInput.addEventListener('change', function () {
      var file = this.files && this.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function (e) {
        state.imageUrl = e.target.result
        render()
      }
      reader.readAsDataURL(file)
    })
  }

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
  render()
})()
