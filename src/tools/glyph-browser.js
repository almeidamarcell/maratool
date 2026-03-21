(function () {
  var CATEGORIES = [
    { name: 'Arrows', ranges: [[0x2190, 0x21FF]] },
    { name: 'Math', ranges: [[0x2200, 0x22FF]] },
    { name: 'Currency', ranges: [[0x20A0, 0x20CF], [0x0024, 0x0024], [0x00A2, 0x00A5]] },
    { name: 'Box Drawing', ranges: [[0x2500, 0x257F]] },
    { name: 'Greek', ranges: [[0x0370, 0x03FF]] },
    { name: 'Cyrillic', ranges: [[0x0400, 0x04FF]] },
    { name: 'Latin Extended', ranges: [[0x0080, 0x00FF], [0x0100, 0x017F]] },
    { name: 'Symbols', ranges: [[0x2600, 0x26FF]] },
    { name: 'Dingbats', ranges: [[0x2700, 0x27BF]] },
    { name: 'Braille', ranges: [[0x2800, 0x28FF]] },
    { name: 'Geometric', ranges: [[0x25A0, 0x25FF]] },
    { name: 'Punctuation', ranges: [[0x2000, 0x206F]] },
    { name: 'Emoji', ranges: [[0x1F600, 0x1F64F], [0x1F300, 0x1F5FF], [0x1F680, 0x1F6FF]] }
  ]

  // Common Unicode character names for search
  var CHAR_NAMES = {}
  // Arrows
  CHAR_NAMES[0x2190] = 'leftwards arrow'; CHAR_NAMES[0x2191] = 'upwards arrow'; CHAR_NAMES[0x2192] = 'rightwards arrow'; CHAR_NAMES[0x2193] = 'downwards arrow'
  CHAR_NAMES[0x2194] = 'left right arrow'; CHAR_NAMES[0x2195] = 'up down arrow'; CHAR_NAMES[0x2196] = 'north west arrow'; CHAR_NAMES[0x2197] = 'north east arrow'
  CHAR_NAMES[0x2198] = 'south east arrow'; CHAR_NAMES[0x2199] = 'south west arrow'; CHAR_NAMES[0x21A9] = 'leftwards arrow with hook'; CHAR_NAMES[0x21AA] = 'rightwards arrow with hook'
  CHAR_NAMES[0x21B0] = 'upwards arrow with tip leftwards'; CHAR_NAMES[0x21B1] = 'upwards arrow with tip rightwards'
  CHAR_NAMES[0x21D0] = 'leftwards double arrow'; CHAR_NAMES[0x21D1] = 'upwards double arrow'; CHAR_NAMES[0x21D2] = 'rightwards double arrow'; CHAR_NAMES[0x21D3] = 'downwards double arrow'
  CHAR_NAMES[0x21D4] = 'left right double arrow'; CHAR_NAMES[0x21E6] = 'leftwards white arrow'; CHAR_NAMES[0x21E7] = 'upwards white arrow'; CHAR_NAMES[0x21E8] = 'rightwards white arrow'; CHAR_NAMES[0x21E9] = 'downwards white arrow'
  // Math
  CHAR_NAMES[0x2200] = 'for all'; CHAR_NAMES[0x2202] = 'partial differential'; CHAR_NAMES[0x2203] = 'there exists'; CHAR_NAMES[0x2205] = 'empty set'
  CHAR_NAMES[0x2207] = 'nabla'; CHAR_NAMES[0x2208] = 'element of'; CHAR_NAMES[0x2209] = 'not an element of'; CHAR_NAMES[0x220B] = 'contains as member'
  CHAR_NAMES[0x220F] = 'n-ary product'; CHAR_NAMES[0x2211] = 'n-ary summation'; CHAR_NAMES[0x2212] = 'minus sign'; CHAR_NAMES[0x2215] = 'division slash'
  CHAR_NAMES[0x2217] = 'asterisk operator'; CHAR_NAMES[0x221A] = 'square root'; CHAR_NAMES[0x221E] = 'infinity'; CHAR_NAMES[0x2220] = 'angle'
  CHAR_NAMES[0x2227] = 'logical and'; CHAR_NAMES[0x2228] = 'logical or'; CHAR_NAMES[0x2229] = 'intersection'; CHAR_NAMES[0x222A] = 'union'
  CHAR_NAMES[0x222B] = 'integral'; CHAR_NAMES[0x2234] = 'therefore'; CHAR_NAMES[0x2235] = 'because'; CHAR_NAMES[0x2248] = 'almost equal to'
  CHAR_NAMES[0x2260] = 'not equal to'; CHAR_NAMES[0x2261] = 'identical to'; CHAR_NAMES[0x2264] = 'less-than or equal to'; CHAR_NAMES[0x2265] = 'greater-than or equal to'
  CHAR_NAMES[0x2282] = 'subset of'; CHAR_NAMES[0x2283] = 'superset of'; CHAR_NAMES[0x2286] = 'subset of or equal to'; CHAR_NAMES[0x2287] = 'superset of or equal to'
  CHAR_NAMES[0x22C5] = 'dot operator'; CHAR_NAMES[0x00D7] = 'multiplication sign'; CHAR_NAMES[0x00F7] = 'division sign'
  // Currency
  CHAR_NAMES[0x0024] = 'dollar sign'; CHAR_NAMES[0x00A2] = 'cent sign'; CHAR_NAMES[0x00A3] = 'pound sign'; CHAR_NAMES[0x00A4] = 'currency sign'; CHAR_NAMES[0x00A5] = 'yen sign'
  CHAR_NAMES[0x20A0] = 'euro-currency sign'; CHAR_NAMES[0x20A3] = 'french franc sign'; CHAR_NAMES[0x20A4] = 'lira sign'; CHAR_NAMES[0x20A7] = 'peseta sign'
  CHAR_NAMES[0x20A8] = 'rupee sign'; CHAR_NAMES[0x20A9] = 'won sign'; CHAR_NAMES[0x20AA] = 'new sheqel sign'; CHAR_NAMES[0x20AB] = 'dong sign'
  CHAR_NAMES[0x20AC] = 'euro sign'; CHAR_NAMES[0x20AD] = 'kip sign'; CHAR_NAMES[0x20AE] = 'tugrik sign'; CHAR_NAMES[0x20B1] = 'peso sign'
  CHAR_NAMES[0x20B2] = 'guarani sign'; CHAR_NAMES[0x20B5] = 'cedi sign'; CHAR_NAMES[0x20B8] = 'tenge sign'; CHAR_NAMES[0x20B9] = 'indian rupee sign'
  CHAR_NAMES[0x20BA] = 'turkish lira sign'; CHAR_NAMES[0x20BD] = 'ruble sign'; CHAR_NAMES[0x20BF] = 'bitcoin sign'
  // Symbols
  CHAR_NAMES[0x2600] = 'black sun with rays'; CHAR_NAMES[0x2601] = 'cloud'; CHAR_NAMES[0x2602] = 'umbrella'; CHAR_NAMES[0x2603] = 'snowman'
  CHAR_NAMES[0x2605] = 'black star'; CHAR_NAMES[0x2606] = 'white star'; CHAR_NAMES[0x260E] = 'black telephone'; CHAR_NAMES[0x2615] = 'hot beverage'
  CHAR_NAMES[0x2620] = 'skull and crossbones'; CHAR_NAMES[0x2622] = 'radioactive sign'; CHAR_NAMES[0x2623] = 'biohazard sign'
  CHAR_NAMES[0x2639] = 'white frowning face'; CHAR_NAMES[0x263A] = 'white smiling face'; CHAR_NAMES[0x263B] = 'black smiling face'
  CHAR_NAMES[0x2640] = 'female sign'; CHAR_NAMES[0x2642] = 'male sign'; CHAR_NAMES[0x2660] = 'black spade suit'; CHAR_NAMES[0x2661] = 'white heart suit'
  CHAR_NAMES[0x2662] = 'white diamond suit'; CHAR_NAMES[0x2663] = 'black club suit'; CHAR_NAMES[0x2664] = 'white spade suit'; CHAR_NAMES[0x2665] = 'black heart suit'
  CHAR_NAMES[0x2666] = 'black diamond suit'; CHAR_NAMES[0x2667] = 'white club suit'; CHAR_NAMES[0x266A] = 'eighth note'; CHAR_NAMES[0x266B] = 'beamed eighth notes'
  CHAR_NAMES[0x2702] = 'black scissors'; CHAR_NAMES[0x2708] = 'airplane'; CHAR_NAMES[0x2709] = 'envelope'; CHAR_NAMES[0x270C] = 'victory hand'
  CHAR_NAMES[0x270F] = 'pencil'; CHAR_NAMES[0x2714] = 'heavy check mark'; CHAR_NAMES[0x2716] = 'heavy multiplication x'; CHAR_NAMES[0x2728] = 'sparkles'
  CHAR_NAMES[0x273F] = 'black florette'; CHAR_NAMES[0x2744] = 'snowflake'; CHAR_NAMES[0x2764] = 'heavy black heart'
  // Geometric
  CHAR_NAMES[0x25A0] = 'black square'; CHAR_NAMES[0x25A1] = 'white square'; CHAR_NAMES[0x25AA] = 'black small square'; CHAR_NAMES[0x25AB] = 'white small square'
  CHAR_NAMES[0x25B2] = 'black up-pointing triangle'; CHAR_NAMES[0x25B3] = 'white up-pointing triangle'; CHAR_NAMES[0x25BC] = 'black down-pointing triangle'
  CHAR_NAMES[0x25C0] = 'black left-pointing triangle'; CHAR_NAMES[0x25C6] = 'black diamond'; CHAR_NAMES[0x25CB] = 'white circle'; CHAR_NAMES[0x25CF] = 'black circle'
  CHAR_NAMES[0x25D0] = 'circle with left half black'; CHAR_NAMES[0x25D1] = 'circle with right half black'
  CHAR_NAMES[0x25EF] = 'large circle'; CHAR_NAMES[0x25B6] = 'black right-pointing triangle'

  var searchInput = document.getElementById('gb-search')
  var tabsContainer = document.getElementById('gb-tabs')
  var grid = document.getElementById('gb-grid')
  var toast = document.getElementById('gb-toast')
  var detailChar = document.getElementById('gb-detail-char')
  var detailName = document.getElementById('gb-detail-name')
  var detailCode = document.getElementById('gb-detail-code')
  var detailHtml = document.getElementById('gb-detail-html')
  var detailCss = document.getElementById('gb-detail-css')
  var detailJs = document.getElementById('gb-detail-js')
  var toastTimer = null
  var activeCategory = 0
  var currentQuery = ''
  var charCache = {}

  // Build category character arrays (cached)
  function getCharsForCategory(idx) {
    if (charCache[idx]) return charCache[idx]
    var cat = CATEGORIES[idx]
    var chars = []
    for (var r = 0; r < cat.ranges.length; r++) {
      var start = cat.ranges[r][0]
      var end = cat.ranges[r][1]
      for (var code = start; code <= end; code++) {
        try {
          var ch = String.fromCodePoint(code)
          chars.push({ code: code, char: ch })
        } catch (e) { /* skip invalid */ }
      }
    }
    charCache[idx] = chars
    return chars
  }

  function getCharName(code) {
    if (CHAR_NAMES[code]) return CHAR_NAMES[code]
    // Fallback: generate a generic name from the block
    var hex = code.toString(16).toUpperCase()
    while (hex.length < 4) hex = '0' + hex
    return 'U+' + hex
  }

  function toHex(code) {
    var hex = code.toString(16).toUpperCase()
    while (hex.length < 4) hex = '0' + hex
    return hex
  }

  // Build tabs
  function buildTabs() {
    var html = ''
    for (var i = 0; i < CATEGORIES.length; i++) {
      html += '<button class="gb-tab' + (i === 0 ? ' active' : '') + '" role="tab" data-idx="' + i + '" aria-selected="' + (i === 0 ? 'true' : 'false') + '">' + CATEGORIES[i].name + '</button>'
    }
    tabsContainer.innerHTML = html
  }

  function renderChars(chars) {
    if (chars.length === 0) {
      grid.innerHTML = '<p class="gb-no-results">No characters found.</p>'
      return
    }
    // Limit to 400 for performance
    var display = chars.length > 400 ? chars.slice(0, 400) : chars
    var html = ''
    for (var i = 0; i < display.length; i++) {
      var c = display[i]
      var hex = toHex(c.code)
      var name = getCharName(c.code)
      html += '<button class="gb-char" data-code="' + c.code + '" title="' + name + ' (U+' + hex + ')" aria-label="Copy ' + name + '">' + c.char + '</button>'
    }
    if (chars.length > 400) {
      html += '<p class="gb-no-results">Showing first 400 of ' + chars.length + ' characters. Use search to narrow results.</p>'
    }
    grid.innerHTML = html
  }

  function setTab(idx) {
    activeCategory = idx
    var tabs = tabsContainer.querySelectorAll('.gb-tab')
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', parseInt(tabs[i].dataset.idx) === idx)
      tabs[i].setAttribute('aria-selected', parseInt(tabs[i].dataset.idx) === idx ? 'true' : 'false')
    }
    renderChars(getCharsForCategory(idx))
  }

  function searchChars(query) {
    var q = query.toLowerCase().trim()
    var results = []
    // Check if searching by code point
    var codePointMatch = q.match(/^u\+([0-9a-f]{1,6})$/i)
    if (codePointMatch) {
      var targetCode = parseInt(codePointMatch[1], 16)
      try {
        var ch = String.fromCodePoint(targetCode)
        results.push({ code: targetCode, char: ch })
      } catch (e) { /* invalid code point */ }
      return results
    }
    // Search by name across all categories
    for (var i = 0; i < CATEGORIES.length; i++) {
      var chars = getCharsForCategory(i)
      for (var j = 0; j < chars.length; j++) {
        var name = getCharName(chars[j].code).toLowerCase()
        if (name.indexOf(q) !== -1) {
          results.push(chars[j])
        }
      }
      if (results.length >= 400) break
    }
    return results
  }

  function showDetail(code) {
    var ch = String.fromCodePoint(code)
    var hex = toHex(code)
    var name = getCharName(code)
    detailChar.textContent = ch
    detailName.textContent = name
    detailCode.textContent = 'U+' + hex
    detailHtml.textContent = '&#x' + hex + ';'
    detailCss.textContent = '\\' + hex
    if (code > 0xFFFF) {
      detailJs.textContent = '\\u{' + hex + '}'
    } else {
      detailJs.textContent = '\\u' + hex
    }
    // Highlight selected character
    var btns = grid.querySelectorAll('.gb-char')
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('selected', parseInt(btns[i].dataset.code) === code)
    }
  }

  function showToast(text) {
    toast.textContent = text + ' Copied!'
    toast.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(function () {
      toast.classList.remove('show')
    }, 1500)
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
    }
    var ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return Promise.resolve()
  }

  // Event: click character in grid
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.gb-char')
    if (!btn) return
    var code = parseInt(btn.dataset.code)
    showDetail(code)
    var ch = String.fromCodePoint(code)
    copyText(ch).then(function () { showToast(ch) })
  })

  // Event: click tab
  tabsContainer.addEventListener('click', function (e) {
    var tab = e.target.closest('.gb-tab')
    if (!tab) return
    currentQuery = ''
    searchInput.value = ''
    setTab(parseInt(tab.dataset.idx))
  })

  // Event: click copyable detail values
  document.querySelector('.gb-detail-info').addEventListener('click', function (e) {
    var el = e.target.closest('.gb-copyable')
    if (!el) return
    var text = el.textContent
    if (text === '\u2014') return
    copyText(text).then(function () {
      el.classList.add('copied')
      setTimeout(function () { el.classList.remove('copied') }, 2000)
    })
  })

  // Event: search
  var debounce = null
  searchInput.addEventListener('input', function () {
    clearTimeout(debounce)
    debounce = setTimeout(function () {
      currentQuery = searchInput.value.trim()
      if (currentQuery) {
        var tabs = tabsContainer.querySelectorAll('.gb-tab')
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active')
        renderChars(searchChars(currentQuery))
      } else {
        setTab(activeCategory)
      }
    }, 150)
  })

  // Init
  buildTabs()
  setTab(0)
})()
