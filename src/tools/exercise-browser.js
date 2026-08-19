// Exercise browser — fetches the lean browse index and filters client-side.
;(function () {
  var results = document.getElementById('ex-results')
  var countEl = document.getElementById('ex-count')
  var emptyEl = document.getElementById('ex-empty')
  var search = document.getElementById('ex-search')
  if (!results || !search) return

  var DATA = []

  // With 1,035 records an unthrottled, uncapped render rebuilt every card on
  // every keystroke. Two guards: only render 120ms after typing stops, and
  // never build more than RENDER_CAP cards at once (the count line says how
  // many matched, so nothing is silently hidden).
  var DEBOUNCE_MS = 120
  var RENDER_CAP = 120
  var debounceTimer = null

  // Placeholder aspect hint for the thumbnail <img> width/height attributes.
  // browse-index.json carries each record's real media path but not its real
  // pixel dimensions (that would mean shipping two more numbers per record to
  // every visitor). CSS bounds the rendered box to these same dimensions via
  // max-height + width:auto (see .exb-thumb img in exercises/index.astro), so
  // the actual on-screen size never depends on this hint being pixel-accurate
  // — it only avoids a reflow between "no size known" and "image loaded".
  var THUMB_W = 160
  var THUMB_H = 84

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

  function activeFacets() {
    var out = { muscle: [], equipment: [], category: [], level: [] }
    var boxes = document.querySelectorAll('.ex-facet')
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) out[boxes[i].getAttribute('data-facet')].push(boxes[i].value)
    }
    return out
  }

  function matches(ex, q, f) {
    if (q && ex.name.toLowerCase().indexOf(q) === -1) return false
    if (f.muscle.length) {
      var hit = false
      for (var i = 0; i < f.muscle.length; i++) {
        if (ex.primaryMuscles.indexOf(f.muscle[i]) !== -1) { hit = true; break }
      }
      if (!hit) return false
    }
    if (f.equipment.length) {
      var eHit = false
      for (var j = 0; j < f.equipment.length; j++) {
        if (ex.equipment.indexOf(f.equipment[j]) !== -1) { eHit = true; break }
      }
      if (!eHit) return false
    }
    if (f.category.length && f.category.indexOf(ex.category) === -1) return false
    if (f.level.length && f.level.indexOf(ex.level) === -1) return false
    return true
  }

  function render() {
    var q = search.value.trim().toLowerCase()
    var f = activeFacets()
    var list = []
    for (var i = 0; i < DATA.length; i++) {
      if (matches(DATA[i], q, f)) list.push(DATA[i])
    }

    results.textContent = ''
    var shown = Math.min(list.length, RENDER_CAP)
    var frag = document.createDocumentFragment()
    for (var k = 0; k < shown; k++) {
      var ex = list[k]
      var a = document.createElement('a')
      a.className = 'exb-card'
      a.href = '/exercises/' + ex.slug + '/'

      if (ex.media) {
        var thumb = document.createElement('div')
        thumb.className = 'exb-thumb'
        var img = document.createElement('img')
        img.src = ex.media
        img.alt = ''
        img.loading = 'lazy'
        img.decoding = 'async'
        img.width = THUMB_W
        img.height = THUMB_H
        thumb.appendChild(img)
        a.appendChild(thumb)
      }

      var h = document.createElement('h3')
      h.textContent = ex.name
      a.appendChild(h)

      var tags = document.createElement('div')
      tags.className = 'exb-tags'
      var labels = [cap(ex.equipment[0] || ''), cap(ex.primaryMuscles[0] || '')]
      for (var t = 0; t < labels.length; t++) {
        if (!labels[t]) continue
        var span = document.createElement('span')
        span.className = 'exb-tag'
        span.textContent = labels[t]
        tags.appendChild(span)
      }
      a.appendChild(tags)
      frag.appendChild(a)
    }
    results.appendChild(frag)

    countEl.textContent = shown < list.length
      ? 'Showing first ' + shown + ' of ' + list.length + ' matches — search or filter to narrow it down'
      : 'Showing ' + list.length + ' of ' + DATA.length + ' exercises'
    emptyEl.hidden = list.length !== 0
  }

  function renderDebounced() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(function () {
      debounceTimer = null
      render()
    }, DEBOUNCE_MS)
  }

  // Typing debounces; ticking a checkbox is a discrete action, so it renders
  // immediately.
  search.addEventListener('input', renderDebounced)
  var boxes = document.querySelectorAll('.ex-facet')
  for (var b = 0; b < boxes.length; b++) boxes[b].addEventListener('change', render)

  // ⌘K / Ctrl+K focuses search.
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      search.focus()
    }
  })

  // The site-wide ⌘K palette caps exercise results and links here with
  // ?q=<query> for the rest — prefill the search box so that link actually
  // continues the search instead of dropping the user on an empty page.
  try {
    var initialQuery = new URLSearchParams(window.location.search).get('q')
    if (initialQuery) search.value = initialQuery
  } catch (e) { /* URLSearchParams unsupported — search just starts empty */ }

  fetch('/exercises/browse-index.json')
    .then(function (r) { return r.json() })
    .then(function (json) { DATA = json; render() })
    .catch(function () { countEl.textContent = 'Could not load the exercise index.' })
})()
