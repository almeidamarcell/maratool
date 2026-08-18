// Exercise media viewer — 4 modes, hard-cut animation (never a crossfade,
// which ghosted the terracotta phase over the dark one).
//
// Vector media (kind="vector") is a pair of Everkinetic SVGs normalized so
// their figure is filled with fill="currentColor" and their background with
// fill="none" — that's what lets the stylesheet recolor the start phase dark
// and the effort phase terracotta via .exm-phase[data-phase] color rules.
// An <img src="*.svg"> loads the SVG as an independent document, so
// currentColor would resolve against the SVG's own initial color (black),
// not the page's CSS — the recoloring would silently do nothing. So vector
// media is fetched as text and inlined into the DOM (innerHTML) instead of
// rendered through <img>. Photos (kind="photo") keep using <img>.
;(function () {
  var KEY = 'maratool.exercise.mediaMode'
  var CAPTIONS = {
    anim: 'animated — one phase at a time',
    side: 'both phases side by side',
    start: 'starting position',
    end: 'effort position',
  }

  // Module-level cache so the same SVG is fetched once even though several
  // phases (start/end) and several mode switches (anim/side/start/end all
  // reference the same two URLs) request it repeatedly. Keyed by URL, valued
  // by the in-flight/resolved Promise<string> so concurrent requests for the
  // same URL share a single fetch instead of racing.
  var svgCache = new Map()

  function fetchSvgMarkup(url) {
    if (!svgCache.has(url)) {
      svgCache.set(
        url,
        fetch(url)
          .then(function (res) {
            if (!res.ok) throw new Error('svg fetch failed: ' + res.status)
            return res.text()
          })
          .catch(function (err) {
            // The promise is cached before it settles, so a rejection would
            // otherwise be cached forever: every later mode switch would reuse
            // the rejected promise and the stage would stay permanently blank
            // with no way to retry. Evict on failure so the next switch
            // re-fetches.
            svgCache.delete(url)
            throw err
          })
      )
    }
    return svgCache.get(url)
  }

  function readMode() {
    try {
      var saved = localStorage.getItem(KEY)
      if (saved && CAPTIONS[saved]) return saved
    } catch (e) { /* private mode */ }
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reduced ? 'side' : 'anim'
  }

  function saveMode(mode) {
    try { localStorage.setItem(KEY, mode) } catch (e) { /* private mode */ }
  }

  function phaseEl(root, which, label) {
    var kind = root.getAttribute('data-kind')
    var src = root.getAttribute(which === 'start' ? 'data-start' : 'data-end')
    var name = root.querySelector('.exm-stage').getAttribute('data-name') || 'exercise'

    var wrap = document.createElement('div')
    wrap.className = 'exm-phase'
    wrap.setAttribute('data-phase', which)

    // Media goes in its own inner container so a later async innerHTML swap
    // (vector SVGs) can never clobber the <b> phase label appended below.
    var media = document.createElement('div')
    media.className = 'exm-media'
    wrap.appendChild(media)

    if (kind === 'vector') {
      fetchSvgMarkup(src)
        .then(function (svgText) {
          media.innerHTML = svgText
          var svg = media.querySelector('svg')
          if (svg) {
            svg.setAttribute('role', 'img')
            svg.setAttribute('aria-label', name + ' — ' + which)
          }
        })
        .catch(function () {
          // Leave the phase empty rather than throwing.
        })
    } else {
      var photo = document.createElement('img')
      photo.src = src
      photo.alt = name + ' — ' + which
      photo.loading = 'lazy'
      media.appendChild(photo)
    }

    if (label) {
      var b = document.createElement('b')
      b.textContent = label
      wrap.appendChild(b)
    }
    return wrap
  }

  function init(root) {
    var stage = root.querySelector('.exm-stage')
    var cap = root.querySelector('.exm-cap')
    var buttons = root.querySelectorAll('.exm-modes button')
    var timer = null

    function render(mode) {
      if (timer) { clearInterval(timer); timer = null }
      stage.textContent = ''
      stage.classList.toggle('exm-dual', mode === 'side')

      if (mode === 'side') {
        stage.appendChild(phaseEl(root, 'start', 'start'))
        stage.appendChild(phaseEl(root, 'end', 'effort'))
      } else if (mode === 'start' || mode === 'end') {
        stage.appendChild(phaseEl(root, mode, null))
      } else {
        var a = phaseEl(root, 'start', null)
        var b = phaseEl(root, 'end', null)
        b.hidden = true
        stage.appendChild(a)
        stage.appendChild(b)
        var showingEnd = false
        timer = setInterval(function () {
          showingEnd = !showingEnd
          a.hidden = showingEnd
          b.hidden = !showingEnd
        }, 1100)
      }

      cap.textContent = CAPTIONS[mode] || ''
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-mode') === mode))
      }
    }

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        var mode = e.currentTarget.getAttribute('data-mode')
        saveMode(mode)
        render(mode)
      })
    }

    render(readMode())
  }

  var roots = document.querySelectorAll('.exm')
  for (var i = 0; i < roots.length; i++) init(roots[i])
})()
