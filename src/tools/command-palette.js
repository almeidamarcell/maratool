// Site-wide ⌘K command palette. Searches the tool registry
// (/palette-tools.json) and the exercise index (/exercises/browse-index.json),
// both fetched lazily on first open and cached for the rest of the session.
//
// This used to be an inline <script> inside CommandPalette.astro. It moved to
// a real file so it can be unit-tested the same way the other tools/*.js
// files are (jsdom + vi.stubGlobal('fetch', …)) — an inline Astro script has
// no importable module to test against. Loaded via
// <script src="../tools/command-palette.js"> — no type="module", or it 404s
// in production (see other tools/*.js files for the same convention).
;(function () {
  var overlay = document.getElementById('cmd-overlay')
  var backdrop = document.getElementById('cmd-backdrop')
  var input = document.getElementById('cmd-input')
  var results = document.getElementById('cmd-results')
  if (!overlay || !input || !results || !backdrop) return

  var paletteTools = []
  var paletteLoadPromise = null

  // Lean fields from public/exercises/browse-index.json — the same index the
  // /exercises/ browser page fetches. `media` is the thumbnail path; older
  // cached copies of the index (or a test fixture) may not carry it, so
  // nothing here assumes it's present.
  var exerciseIndex = []
  var exerciseTermsCache = []
  var exerciseLoadPromise = null
  var dataLoadPromise = null

  var activeIndex = -1
  var currentResults = []
  var lastFocused = null
  var debounceTimer = null

  function loadPalette() {
    if (paletteLoadPromise) return paletteLoadPromise
    paletteLoadPromise = fetch('/palette-tools.json', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : [] })
      .then(function (data) {
        paletteTools = Array.isArray(data) ? data : []
        return paletteTools
      })
      .catch(function () { paletteTools = []; return paletteTools })
    return paletteLoadPromise
  }

  // Split into words for fuzzy matching — "body only" becomes ["body",
  // "only"], "Barbell Squat" becomes ["barbell", "squat"].
  function tokenize(s) {
    return String(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  }

  function exerciseTerms(ex) {
    var terms = tokenize(ex.name)
    for (var i = 0; i < ex.primaryMuscles.length; i++) terms = terms.concat(tokenize(ex.primaryMuscles[i]))
    for (var j = 0; j < ex.equipment.length; j++) terms = terms.concat(tokenize(ex.equipment[j]))
    return terms
  }

  // The exercise index is fetched lazily on first palette open and cached,
  // exactly like palette-tools.json. A failed fetch resolves to an empty
  // list rather than rejecting, so tool search is never blocked or broken by
  // it — see the .catch below.
  function loadExercises() {
    if (exerciseLoadPromise) return exerciseLoadPromise
    exerciseLoadPromise = fetch('/exercises/browse-index.json', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : [] })
      .then(function (data) {
        exerciseIndex = Array.isArray(data) ? data : []
        exerciseTermsCache = exerciseIndex.map(exerciseTerms)
        return exerciseIndex
      })
      .catch(function () { exerciseIndex = []; exerciseTermsCache = []; return exerciseIndex })
    return exerciseLoadPromise
  }

  function ensureDataLoaded() {
    if (dataLoadPromise) return dataLoadPromise
    dataLoadPromise = Promise.all([loadPalette(), loadExercises()]).then(function () {})
    return dataLoadPromise
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function highlight(text, q) {
    var escaped = escapeHtml(text)
    if (!q) return escaped
    var lower = String(text).toLowerCase()
    var idx = lower.indexOf(q.toLowerCase())
    if (idx === -1) return escaped
    return escapeHtml(text.slice(0, idx)) +
      '<b>' + escapeHtml(text.slice(idx, idx + q.length)) + '</b>' +
      escapeHtml(text.slice(idx + q.length))
  }

  function scoreFor(tool, q) {
    var name = tool.name.toLowerCase()
    var desc = tool.description.toLowerCase()
    if (name === q) return 6
    if (name.indexOf(q) === 0) return 5
    if (name.indexOf(q) !== -1) return 4
    for (var i = 0; i < tool.keywords.length; i++) {
      var kw = tool.keywords[i].toLowerCase()
      if (kw === q) return 3
      if (kw.indexOf(q) !== -1) return 2
    }
    if (desc.indexOf(q) !== -1) return 1
    return 0
  }

  function search(q) {
    q = q.toLowerCase().trim()
    if (!q) return []
    var scored = []
    for (var i = 0; i < paletteTools.length; i++) {
      var s = scoreFor(paletteTools[i], q)
      if (s > 0) scored.push({ tool: paletteTools[i], score: s })
    }
    scored.sort(function (a, b) { return b.score - a.score })
    return scored.slice(0, 30).map(function (x) { return x.tool })
  }

  var EXERCISE_CAP = 20

  // Name beats an exact facet match, which beats a partial facet match — same
  // ranking shape as scoreFor above. Matching on primaryMuscles and equipment
  // (not just name) is what makes "barbell" or "hamstring" actually useful:
  // on the real dataset "barbell" hits 95 exercises by name alone but 215
  // once equipment counts, and "hamstring" hits 12 by name but 86 once
  // muscles count.
  function exerciseScoreFor(ex, q) {
    var name = ex.name.toLowerCase()
    if (name === q) return 6
    if (name.indexOf(q) === 0) return 5
    if (name.indexOf(q) !== -1) return 4
    for (var i = 0; i < ex.primaryMuscles.length; i++) {
      var m = ex.primaryMuscles[i].toLowerCase()
      if (m === q) return 3
      if (m.indexOf(q) !== -1) return 2
    }
    for (var j = 0; j < ex.equipment.length; j++) {
      var eq = ex.equipment[j].toLowerCase()
      if (eq === q) return 3
      if (eq.indexOf(q) !== -1) return 2
    }
    return 0
  }

  function searchExercises(q) {
    q = q.toLowerCase().trim()
    if (!q) return []
    var scored = []
    for (var i = 0; i < exerciseIndex.length; i++) {
      var s = exerciseScoreFor(exerciseIndex[i], q)
      if (s > 0) scored.push({ ex: exerciseIndex[i], score: s })
    }
    scored.sort(function (a, b) { return b.score - a.score })
    return scored.map(function (x) { return x.ex })
  }

  // Typo tolerance — general, not a lookup table for specific misspellings.
  // Distance is scaled to the length of the real (candidate) word: under 4
  // chars, one edit would let almost anything match ("abs" -> "abd" -> ...),
  // so no tolerance; up to 7 chars, one edit; beyond that, two. These cutoffs
  // are a judgment call, not a derived constant — the goal is "catches a
  // normal typo" without "matches unrelated short words."
  function typoThreshold(len) {
    if (len < 4) return 0
    if (len <= 7) return 1
    return 2
  }

  // Damerau-Levenshtein, not plain Levenshtein: transposing two adjacent
  // letters ("sqaut" for "squat", "bicpes" for "biceps") is the single most
  // common real typing error, and plain Levenshtein charges it as two edits
  // (delete + insert), which misses it entirely at a distance-1 threshold.
  // The extra branch below recognizes the swap as one edit.
  function damerauLevenshtein(a, b) {
    var al = a.length
    var bl = b.length
    var d = []
    for (var i = 0; i <= al; i++) d[i] = [i]
    for (var j = 0; j <= bl; j++) d[0][j] = j
    for (i = 1; i <= al; i++) {
      for (j = 1; j <= bl; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1
        var best = Math.min(
          d[i - 1][j] + 1,       // deletion
          d[i][j - 1] + 1,       // insertion
          d[i - 1][j - 1] + cost // substitution
        )
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
          best = Math.min(best, d[i - 2][j - 2] + 1) // transposition
        }
        d[i][j] = best
      }
    }
    return d[al][bl]
  }

  function fuzzyMatchesTerm(term, q) {
    var thresh = typoThreshold(term.length)
    if (thresh === 0) return false
    // Cheap pre-filter: distance can never be less than the length gap, so
    // this skips the O(n*m) table for obviously-unrelated word lengths.
    if (Math.abs(term.length - q.length) > thresh) return false
    return damerauLevenshtein(term, q) <= thresh
  }

  // Only ever called after an exact search (tools + exercises) came back
  // completely empty — a real hit, however small, is never diluted by fuzzy
  // noise. ~1,035 records x a handful of precomputed terms each, each check
  // short-circuited by the length pre-filter, stays well inside a keystroke.
  function fuzzySearchExercises(q) {
    var out = []
    for (var i = 0; i < exerciseIndex.length; i++) {
      var terms = exerciseTermsCache[i] || []
      for (var t = 0; t < terms.length; t++) {
        if (fuzzyMatchesTerm(terms[t], q)) { out.push(exerciseIndex[i]); break }
      }
    }
    return out
  }

  function getPinned() {
    try {
      var raw = localStorage.getItem('maratool_pinned')
      return raw ? JSON.parse(raw) : []
    } catch (e) { return [] }
  }

  function getRecent() {
    try {
      var raw = localStorage.getItem('maratool_recent')
      return raw ? JSON.parse(raw) : []
    } catch (e) { return [] }
  }

  function findTool(slug) {
    for (var i = 0; i < paletteTools.length; i++) {
      if (paletteTools[i].slug === slug) return paletteTools[i]
    }
    return null
  }

  function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  }

  function renderRow(tool, idx, query) {
    return '<a class="cmd-row" href="/' + tool.slug + '/" data-index="' + idx + '" data-slug="' + tool.slug + '">' +
      '<span class="cmd-row-emoji">' + escapeHtml(tool.emoji) + '</span>' +
      '<span class="cmd-row-body">' +
        '<span class="cmd-row-name">' + highlight(tool.name, query) + '</span>' +
        '<span class="cmd-row-desc">' + escapeHtml(tool.description) + '</span>' +
      '</span>' +
      '<span class="cmd-row-cat">' + escapeHtml(tool.category) + '</span>' +
    '</a>'
  }

  function renderExerciseRow(ex, idx, query) {
    var sub = [cap(ex.primaryMuscles[0] || ''), cap(ex.equipment[0] || '')].filter(Boolean).join(' · ')
    return '<a class="cmd-row" href="/exercises/' + ex.slug + '/" data-index="' + idx + '" data-slug="' + ex.slug + '">' +
      '<span class="cmd-row-emoji" aria-hidden="true">🏋️</span>' +
      '<span class="cmd-row-body">' +
        '<span class="cmd-row-name">' + highlight(ex.name, query) + '</span>' +
        '<span class="cmd-row-desc">' + escapeHtml(sub) + '</span>' +
      '</span>' +
      '<span class="cmd-row-cat">Exercise</span>' +
    '</a>'
  }

  // Groups tool hits by category, same as before, but pushes into
  // `currentResults` using its own running length as the row index so this
  // and the exercise group below can be concatenated in renderCombined
  // without a shared idx counter threaded through both.
  function toolGroupsHtml(items, query) {
    var byCategory = {}
    var order = []
    for (var i = 0; i < items.length; i++) {
      var cat = items[i].category
      if (!byCategory[cat]) { byCategory[cat] = []; order.push(cat) }
      byCategory[cat].push(items[i])
    }
    var html = ''
    for (var j = 0; j < order.length; j++) {
      var c = order[j]
      var group = byCategory[c]
      html += '<div class="cmd-section-label">' + escapeHtml(c) + ' <span class="count">' + group.length + ' match' + (group.length === 1 ? '' : 'es') + '</span></div>'
      for (var k = 0; k < group.length; k++) {
        html += renderRow(group[k], currentResults.length, query)
        currentResults.push(group[k])
      }
    }
    return html
  }

  // Tools first (its own scoring already ranks it), exercises in a labelled
  // group after — 1,035 exercise rows must never swamp a tool search. The
  // exercise pool is searched with an exact facet match on name/muscle/
  // equipment first; only if BOTH tools and exercises come back completely
  // empty does it fall back to typo-tolerant matching, so a real result is
  // never diluted by a fuzzy one.
  function renderCombined(query) {
    activeIndex = -1
    currentResults = []
    var q = query.toLowerCase().trim()
    var toolHits = search(q)
    var exerciseHits = searchExercises(q)
    var usedFuzzy = false
    if (toolHits.length === 0 && exerciseHits.length === 0) {
      exerciseHits = fuzzySearchExercises(q)
      usedFuzzy = exerciseHits.length > 0
    }

    if (toolHits.length === 0 && exerciseHits.length === 0) {
      results.innerHTML = '<div class="cmd-empty">No tools or exercises found for &ldquo;' + escapeHtml(query) + '&rdquo;</div>'
      return
    }

    var html = ''
    if (toolHits.length > 0) html += toolGroupsHtml(toolHits, query)

    if (exerciseHits.length > 0) {
      var shown = exerciseHits.slice(0, EXERCISE_CAP)
      var countLabel = usedFuzzy
        ? (exerciseHits.length === 1 ? '1 close match' : exerciseHits.length + ' close matches')
        : (exerciseHits.length === 1 ? '1 match' : exerciseHits.length + ' matches')
      html += '<div class="cmd-section-label">Exercises <span class="count">' + countLabel + '</span></div>'
      for (var e = 0; e < shown.length; e++) {
        html += renderExerciseRow(shown[e], currentResults.length, query)
        currentResults.push(shown[e])
      }
      if (exerciseHits.length > shown.length) {
        html += '<a class="cmd-row cmd-row-more" href="/exercises/?q=' + encodeURIComponent(query) + '" data-index="' + currentResults.length + '">' +
          '<span class="cmd-row-emoji" aria-hidden="true">→</span>' +
          '<span class="cmd-row-body"><span class="cmd-row-name">See all ' + exerciseHits.length + ' matches in the Exercise Database</span></span>' +
        '</a>'
        currentResults.push({ seeAllExercises: true })
      }
    }

    results.innerHTML = html
    setActive(0)
  }

  function renderEmpty() {
    activeIndex = -1
    currentResults = []
    var pinned = getPinned()
    var recent = getRecent()
    var html = ''
    var idx = 0

    if (pinned.length > 0) {
      html += '<div class="cmd-section-label">★ Pinned <span class="count">' + pinned.length + '</span></div>'
      for (var i = 0; i < pinned.length; i++) {
        var t = findTool(pinned[i].slug)
        if (t) {
          html += renderRow(t, idx, '')
          currentResults.push(t)
          idx++
        }
      }
    }

    if (recent.length > 0) {
      html += '<div class="cmd-section-label">Recent <span class="count">' + recent.length + '</span></div>'
      for (var r = 0; r < recent.length; r++) {
        var rt = findTool(recent[r].slug)
        if (rt) {
          html += renderRow(rt, idx, '')
          currentResults.push(rt)
          idx++
        }
      }
    }

    if (!html) {
      html = '<div class="cmd-empty">Type to search 235+ tools — try &ldquo;json&rdquo;, &ldquo;cha2ds2&rdquo;, or &ldquo;qr&rdquo;.</div>'
    }
    results.innerHTML = html
    if (currentResults.length > 0) setActive(0)
  }

  function setActive(i) {
    var rows = results.querySelectorAll('.cmd-row')
    if (activeIndex >= 0 && activeIndex < rows.length) {
      rows[activeIndex].classList.remove('active')
    }
    activeIndex = i
    if (activeIndex >= 0 && activeIndex < rows.length) {
      rows[activeIndex].classList.add('active')
      if (rows[activeIndex].scrollIntoView) rows[activeIndex].scrollIntoView({ block: 'nearest' })
    }
  }

  function open() {
    lastFocused = document.activeElement
    overlay.hidden = false
    document.body.style.overflow = 'hidden'
    setTimeout(function () { input.focus() }, 0)
    // Lazy-load both the tool registry and the exercise index on first open,
    // exactly as the tool registry alone used to load; show a brief loading
    // state only for that first fetch.
    var firstLoad = !dataLoadPromise
    if (firstLoad) results.innerHTML = '<div class="cmd-empty">Loading…</div>'
    ensureDataLoaded().then(function () {
      // Re-render in case the user typed (or closed the palette) while loading
      if (overlay.hidden) return
      var q = input.value.trim()
      if (q) renderCombined(q)
      else renderEmpty()
    })
  }

  function close() {
    overlay.hidden = true
    document.body.style.overflow = ''
    if (lastFocused && lastFocused.focus) lastFocused.focus()
  }

  input.addEventListener('input', function () {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(function () {
      var q = input.value.trim()
      if (!q) { renderEmpty(); return }
      ensureDataLoaded().then(function () { renderCombined(q) })
    }, 100)
  })

  input.addEventListener('keydown', function (e) {
    var rows = results.querySelectorAll('.cmd-row')
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(Math.min(activeIndex + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(Math.max(activeIndex - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < rows.length) {
        var href = rows[activeIndex].getAttribute('href')
        if (!href) return
        if (e.metaKey || e.ctrlKey) {
          window.open(href, '_blank')
        } else {
          window.location.href = href
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  })

  backdrop.addEventListener('click', close)

  // Global ⌘K / Ctrl+K — keep listener lightweight (no data loaded until opened)
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      if (overlay.hidden) {
        open()
      } else {
        close()
      }
    }
    // Slash also opens (when not focused in an input)
    if (e.key === '/' && document.activeElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      if (overlay.hidden) {
        e.preventDefault()
        open()
      }
    }
  })

  // Expose for trigger buttons (topbar search field, hero search button)
  window.maratoolOpenCmdPalette = open
})()
