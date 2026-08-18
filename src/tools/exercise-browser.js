// Exercise browser — fetches the lean browse index and filters client-side.
;(function () {
  var results = document.getElementById('ex-results')
  var countEl = document.getElementById('ex-count')
  var emptyEl = document.getElementById('ex-empty')
  var search = document.getElementById('ex-search')
  if (!results || !search) return

  var DATA = []

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
    var frag = document.createDocumentFragment()
    for (var k = 0; k < list.length; k++) {
      var ex = list[k]
      var a = document.createElement('a')
      a.className = 'exb-card'
      a.href = '/exercises/' + ex.slug + '/'

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

    countEl.textContent = 'Showing ' + list.length + ' of ' + DATA.length + ' exercises'
    emptyEl.hidden = list.length !== 0
  }

  search.addEventListener('input', render)
  var boxes = document.querySelectorAll('.ex-facet')
  for (var b = 0; b < boxes.length; b++) boxes[b].addEventListener('change', render)

  // ⌘K / Ctrl+K focuses search.
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      search.focus()
    }
  })

  fetch('/exercises/browse-index.json')
    .then(function (r) { return r.json() })
    .then(function (json) { DATA = json; render() })
    .catch(function () { countEl.textContent = 'Could not load the exercise index.' })
})()
