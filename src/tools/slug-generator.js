import { attachCopyButton } from './tool-utils.js'

// Slug Generator — title → URL slug, live as you type.
;(function () {
  var input = document.getElementById('slg-input')
  var output = document.getElementById('slg-output')
  var sepInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="slg-sep"]'))
  var lowerEl = document.getElementById('slg-lower')
  var stopEl = document.getElementById('slg-stopwords')
  var maxEl = document.getElementById('slg-maxlen')
  var batchEl = document.getElementById('slg-batch')
  var copyBtn = document.getElementById('slg-copy')
  var statCount = document.getElementById('slg-stat-count')
  var statLongest = document.getElementById('slg-stat-longest')
  var statChars = document.getElementById('slg-stat-chars')

  if (!input || !output) return

  var STOP_WORDS = ['a', 'an', 'the', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for']
  var STOP_SET = {}
  STOP_WORDS.forEach(function (w) { STOP_SET[w] = true })

  // NFD + combining-mark strip handles é→e, ñ→n, ç→c. The characters below have
  // no decomposition, so they survive the strip and the ASCII filter then
  // deletes them outright: "Straße" → "strae" instead of "strasse".
  var SPECIALS = [
    [/[ßẞ]/g, 'ss'],
    [/[æÆ]/g, 'ae'],
    [/[œŒ]/g, 'oe'],
    [/[øØ]/g, 'o'],
    [/[đĐðÐ]/g, 'd'],
    [/[łŁ]/g, 'l'],
    [/[þÞ]/g, 'th'],
    [/[ıİ]/g, 'i'],
    [/[·・•]/g, ' '],
  ]

  function separator() {
    for (var i = 0; i < sepInputs.length; i++) {
      if (sepInputs[i].checked) return sepInputs[i].value
    }
    return '-'
  }

  function words(text) {
    var s = String(text)
    SPECIALS.forEach(function (pair) { s = s.replace(pair[0], pair[1]) })
    // Decompose, then drop the combining marks left behind (U+0300–U+036F).
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Everything that is not a letter or digit becomes a word break, so
    // punctuation, emoji, and any script we cannot transliterate all vanish
    // rather than leaking into the slug.
    return s.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
  }

  function truncateOnWordBoundary(list, sep, max) {
    if (!max || max <= 0) return list
    var kept = []
    var length = 0
    for (var i = 0; i < list.length; i++) {
      var add = (kept.length ? sep.length : 0) + list[i].length
      if (length + add > max) break
      kept.push(list[i])
      length += add
    }
    // A single first word longer than the limit would otherwise return an
    // empty slug, so hard-cut it. Every other case cuts between words.
    if (!kept.length && list.length) return [list[0].slice(0, max)]
    return kept
  }

  function slugify(text, opts) {
    var list = words(text)
    if (opts.lower) list = list.map(function (w) { return w.toLowerCase() })
    if (opts.dropStopWords) {
      var filtered = list.filter(function (w) { return !STOP_SET[w.toLowerCase()] })
      // A title built only from stop words ("The Of And") would filter down to
      // nothing, so keep the original rather than returning an empty slug.
      if (filtered.length) list = filtered
    }
    list = truncateOnWordBoundary(list, opts.sep, opts.max)
    return list.join(opts.sep)
  }

  function update() {
    var opts = {
      sep: separator(),
      lower: !lowerEl || lowerEl.checked,
      dropStopWords: !!(stopEl && stopEl.checked),
      max: maxEl ? parseInt(maxEl.value, 10) || 0 : 0,
    }
    var batch = !!(batchEl && batchEl.checked)
    var lines = batch
      ? input.value.split(/\r?\n/).filter(function (l) { return l.trim() !== '' })
      : [input.value.replace(/\s+/g, ' ')]

    var slugs = lines.map(function (line) { return slugify(line, opts) }).filter(function (s) { return s !== '' })
    output.value = slugs.join('\n')

    if (statCount) {
      var longest = slugs.reduce(function (a, b) { return b.length > a.length ? b : a }, '')
      statCount.textContent = String(slugs.length)
      statLongest.textContent = slugs.length ? String(longest.length) : '0'
      statChars.textContent = String(output.value.length)
    }
  }

  input.addEventListener('input', update)
  sepInputs.forEach(function (el) { el.addEventListener('change', update) })
  ;[lowerEl, stopEl, batchEl].forEach(function (el) { if (el) el.addEventListener('change', update) })
  if (maxEl) maxEl.addEventListener('input', update)

  if (copyBtn) attachCopyButton(copyBtn, function () { return output.value }, { idle: 'Copy slug' })

  if (!input.value) input.value = 'Ação Rápida: 10 Tips for a Faster Website in 2026'
  update()
})()
