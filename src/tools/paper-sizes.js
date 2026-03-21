(function () {
  var INCH_TO_MM = 25.4

  function mmToIn(mm) {
    return Math.round(mm / INCH_TO_MM * 100) / 100
  }

  var SERIES = [
    {
      name: 'ISO A',
      sizes: [
        { name: '4A0', w: 1682, h: 2378 },
        { name: '2A0', w: 1189, h: 1682 },
        { name: 'A0', w: 841, h: 1189 },
        { name: 'A1', w: 594, h: 841 },
        { name: 'A2', w: 420, h: 594 },
        { name: 'A3', w: 297, h: 420 },
        { name: 'A4', w: 210, h: 297 },
        { name: 'A5', w: 148, h: 210 },
        { name: 'A6', w: 105, h: 148 },
        { name: 'A7', w: 74, h: 105 },
        { name: 'A8', w: 52, h: 74 },
        { name: 'A9', w: 37, h: 52 },
        { name: 'A10', w: 26, h: 37 }
      ]
    },
    {
      name: 'ISO B',
      sizes: [
        { name: 'B0', w: 1000, h: 1414 },
        { name: 'B1', w: 707, h: 1000 },
        { name: 'B2', w: 500, h: 707 },
        { name: 'B3', w: 353, h: 500 },
        { name: 'B4', w: 250, h: 353 },
        { name: 'B5', w: 176, h: 250 },
        { name: 'B6', w: 125, h: 176 },
        { name: 'B7', w: 88, h: 125 },
        { name: 'B8', w: 62, h: 88 },
        { name: 'B9', w: 44, h: 62 },
        { name: 'B10', w: 31, h: 44 }
      ]
    },
    {
      name: 'ISO C',
      sizes: [
        { name: 'C0', w: 917, h: 1297 },
        { name: 'C1', w: 648, h: 917 },
        { name: 'C2', w: 458, h: 648 },
        { name: 'C3', w: 324, h: 458 },
        { name: 'C4', w: 229, h: 324 },
        { name: 'C5', w: 162, h: 229 },
        { name: 'C6', w: 114, h: 162 },
        { name: 'C7', w: 81, h: 114 },
        { name: 'C8', w: 57, h: 81 }
      ]
    },
    {
      name: 'US',
      sizes: [
        { name: 'Letter', w: 215.9, h: 279.4 },
        { name: 'Legal', w: 215.9, h: 355.6 },
        { name: 'Tabloid', w: 279.4, h: 431.8 },
        { name: 'Ledger', w: 431.8, h: 279.4 },
        { name: 'Junior Legal', w: 127, h: 203.2 },
        { name: 'Half Letter', w: 139.7, h: 215.9 },
        { name: 'Government Letter', w: 203.2, h: 266.7 },
        { name: 'Government Legal', w: 215.9, h: 330.2 }
      ]
    },
    {
      name: 'ANSI',
      sizes: [
        { name: 'ANSI A', w: 215.9, h: 279.4 },
        { name: 'ANSI B', w: 279.4, h: 431.8 },
        { name: 'ANSI C', w: 431.8, h: 558.8 },
        { name: 'ANSI D', w: 558.8, h: 863.6 },
        { name: 'ANSI E', w: 863.6, h: 1117.6 }
      ]
    },
    {
      name: 'Arch',
      sizes: [
        { name: 'Arch A', w: 228.6, h: 304.8 },
        { name: 'Arch B', w: 304.8, h: 457.2 },
        { name: 'Arch C', w: 457.2, h: 609.6 },
        { name: 'Arch D', w: 609.6, h: 914.4 },
        { name: 'Arch E', w: 914.4, h: 1219.2 },
        { name: 'Arch E1', w: 762, h: 1066.8 }
      ]
    },
    {
      name: 'Japanese JIS',
      sizes: [
        { name: 'JB0', w: 1030, h: 1456 },
        { name: 'JB1', w: 728, h: 1030 },
        { name: 'JB2', w: 515, h: 728 },
        { name: 'JB3', w: 364, h: 515 },
        { name: 'JB4', w: 257, h: 364 },
        { name: 'JB5', w: 182, h: 257 },
        { name: 'JB6', w: 128, h: 182 },
        { name: 'Shiroku ban 4', w: 264, h: 379 },
        { name: 'Shiroku ban 5', w: 189, h: 262 },
        { name: 'Shiroku ban 6', w: 127, h: 188 },
        { name: 'Kiku 4', w: 227, h: 306 },
        { name: 'Kiku 5', w: 151, h: 227 }
      ]
    }
  ]

  var searchInput = document.getElementById('ps-search')
  var tabsContainer = document.getElementById('ps-tabs')
  var contentContainer = document.getElementById('ps-content')
  var activeFilter = 'all'

  function buildTabs() {
    var html = '<button class="ps-tab active" data-series="all">All</button>'
    for (var i = 0; i < SERIES.length; i++) {
      html += '<button class="ps-tab" data-series="' + SERIES[i].name + '">' + SERIES[i].name + '</button>'
    }
    tabsContainer.innerHTML = html
  }

  function matchesSearch(size, query) {
    if (!query) return true
    var q = query.toLowerCase()
    var name = size.name.toLowerCase()
    if (name.indexOf(q) !== -1) return true
    // Match dimensions like "210x297" or "8.27x11.69"
    var mmStr = size.w + 'x' + size.h
    var inW = mmToIn(size.w)
    var inH = mmToIn(size.h)
    var inStr = inW + 'x' + inH
    if (mmStr.indexOf(q) !== -1) return true
    if (inStr.indexOf(q) !== -1) return true
    // Also match partial number searches
    if (String(size.w).indexOf(q) !== -1 || String(size.h).indexOf(q) !== -1) return true
    if (String(inW).indexOf(q) !== -1 || String(inH).indexOf(q) !== -1) return true
    return false
  }

  function render() {
    var query = searchInput.value.trim()
    var html = ''
    var hasResults = false

    for (var i = 0; i < SERIES.length; i++) {
      var series = SERIES[i]
      if (activeFilter !== 'all' && series.name !== activeFilter) continue

      var filteredSizes = []
      for (var j = 0; j < series.sizes.length; j++) {
        if (matchesSearch(series.sizes[j], query)) {
          filteredSizes.push(series.sizes[j])
        }
      }

      if (filteredSizes.length === 0) continue
      hasResults = true

      html += '<div class="ps-section">'
      html += '<div class="ps-section-title">' + series.name + '</div>'
      html += '<table class="ps-table">'
      html += '<thead><tr><th>Name</th><th>mm (W &times; H)</th><th>in (W &times; H)</th></tr></thead>'
      html += '<tbody>'

      for (var k = 0; k < filteredSizes.length; k++) {
        var s = filteredSizes[k]
        var inW = mmToIn(s.w)
        var inH = mmToIn(s.h)
        var mmText = s.w + ' \u00d7 ' + s.h + ' mm'
        var inText = inW + ' \u00d7 ' + inH + ' in'
        html += '<tr data-mm="' + mmText + '" data-in="' + inText + '">'
        html += '<td class="ps-name">' + s.name + '</td>'
        html += '<td class="ps-dim">' + s.w + ' &times; ' + s.h + '</td>'
        html += '<td class="ps-dim">' + inW + ' &times; ' + inH + '</td>'
        html += '</tr>'
      }

      html += '</tbody></table></div>'
    }

    if (!hasResults) {
      html = '<div class="ps-empty">No paper sizes match your search.</div>'
    }

    contentContainer.innerHTML = html
  }

  function copyFromRow(tr, td) {
    // Determine which column was clicked
    var cells = tr.children
    var colIndex = Array.prototype.indexOf.call(cells, td)
    var text
    if (colIndex === 0) {
      text = td.textContent
    } else if (colIndex === 1) {
      text = tr.getAttribute('data-mm')
    } else {
      text = tr.getAttribute('data-in')
    }
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      td.classList.add('copied')
      setTimeout(function () { td.classList.remove('copied') }, 2000)
    })
  }

  // Events
  searchInput.addEventListener('input', render)

  tabsContainer.addEventListener('click', function (e) {
    var btn = e.target.closest('.ps-tab')
    if (!btn) return
    activeFilter = btn.getAttribute('data-series')
    var tabs = tabsContainer.querySelectorAll('.ps-tab')
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active')
    btn.classList.add('active')
    render()
  })

  contentContainer.addEventListener('click', function (e) {
    var td = e.target.closest('td')
    if (!td) return
    var tr = td.closest('tr')
    if (!tr) return
    copyFromRow(tr, td)
  })

  buildTabs()
  render()
})()
