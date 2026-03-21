(function () {
  var opentypeLoaded = false
  var font = null
  var fontFamilyName = 'fe-preview-' + Date.now()

  var dropzone = document.getElementById('fe-dropzone')
  var fileInput = document.getElementById('fe-file-input')
  var panels = document.getElementById('fe-panels')
  var fontNameEl = document.getElementById('fe-font-name')
  var clearBtn = document.getElementById('fe-clear')
  var previewSize = document.getElementById('fe-preview-size')
  var previewSizeLabel = document.getElementById('fe-preview-size-label')
  var previewText = document.getElementById('fe-preview-text')
  var previewRender = document.getElementById('fe-preview-render')
  var waterfall = document.getElementById('fe-waterfall')
  var metaTable = document.getElementById('fe-meta-table')
  var charsetGrid = document.getElementById('fe-charset-grid')
  var glyphDetail = document.getElementById('fe-glyph-detail')
  var glyphSvg = document.getElementById('fe-glyph-svg')
  var glyphInfo = document.getElementById('fe-glyph-info')
  var featuresList = document.getElementById('fe-features-list')
  var metricsTable = document.getElementById('fe-metrics-table')
  var tabButtons = document.querySelectorAll('.fe-tab')
  var allPanels = ['preview', 'metadata', 'charset', 'features', 'metrics']

  var FEATURE_NAMES = {
    aalt: 'Access All Alternates', calt: 'Contextual Alternates', case: 'Case-Sensitive Forms',
    ccmp: 'Glyph Composition/Decomposition', clig: 'Contextual Ligatures', cpsp: 'Capital Spacing',
    dlig: 'Discretionary Ligatures', frac: 'Fractions', hist: 'Historical Forms',
    kern: 'Kerning', liga: 'Standard Ligatures', lnum: 'Lining Figures',
    locl: 'Localized Forms', numr: 'Numerators', onum: 'Oldstyle Figures',
    ordn: 'Ordinals', pnum: 'Proportional Figures', salt: 'Stylistic Alternates',
    sinf: 'Scientific Inferiors', smcp: 'Small Capitals', ss01: 'Stylistic Set 1',
    ss02: 'Stylistic Set 2', ss03: 'Stylistic Set 3', ss04: 'Stylistic Set 4',
    ss05: 'Stylistic Set 5', subs: 'Subscript', sups: 'Superscript',
    swsh: 'Swash', tnum: 'Tabular Figures', zero: 'Slashed Zero',
    dnom: 'Denominators', mark: 'Mark Positioning', mkmk: 'Mark to Mark Positioning',
    rlig: 'Required Ligatures', c2sc: 'Small Capitals From Capitals'
  }

  function loadOpentype(cb) {
    if (opentypeLoaded) return cb()
    var script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js'
    script.onload = function () {
      opentypeLoaded = true
      cb()
    }
    script.onerror = function () {
      alert('Failed to load opentype.js. Please check your internet connection.')
    }
    document.head.appendChild(script)
  }

  function handleFile(file) {
    if (!file) return
    var ext = file.name.split('.').pop().toLowerCase()
    if (['otf', 'ttf', 'woff'].indexOf(ext) === -1) {
      alert('Unsupported format. Please upload a .otf, .ttf, or .woff file.')
      return
    }
    loadOpentype(function () {
      var reader = new FileReader()
      reader.onload = function (e) {
        try {
          font = opentype.parse(e.target.result)
          showFont(file.name)
        } catch (err) {
          alert('Error parsing font: ' + err.message)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  function showFont(filename) {
    dropzone.style.display = 'none'
    panels.style.display = 'block'

    var names = font.names
    var familyName = (names.fontFamily && (names.fontFamily.en || Object.values(names.fontFamily)[0])) || filename.replace(/\.[^.]+$/, '')
    fontNameEl.textContent = familyName

    // Register font for preview
    try {
      var buffer = font.toArrayBuffer()
      var blob = new Blob([buffer], { type: 'font/opentype' })
      var url = URL.createObjectURL(blob)
      var style = document.createElement('style')
      style.textContent = '@font-face { font-family: "' + fontFamilyName + '"; src: url("' + url + '"); }'
      document.head.appendChild(style)
      previewRender.style.fontFamily = '"' + fontFamilyName + '", sans-serif'
    } catch (err) {
      // Font preview may not work but metadata still shows
    }

    renderPreview()
    renderMetadata()
    renderCharset()
    renderFeatures()
    renderMetrics()
    switchTab('preview')
  }

  function renderPreview() {
    previewRender.textContent = previewText.value
    previewRender.style.fontSize = previewSize.value + 'px'

    var sizes = [12, 16, 20, 24, 32, 48, 64, 80]
    var html = ''
    for (var i = 0; i < sizes.length; i++) {
      html += '<div class="fe-waterfall-item"><span class="fe-waterfall-label">' + sizes[i] + 'px</span><span style="font-family:\'' + fontFamilyName + '\',sans-serif;font-size:' + sizes[i] + 'px">Aa Bb Cc Dd Ee Ff Gg 0123456789</span></div>'
    }
    waterfall.innerHTML = html
  }

  function renderMetadata() {
    var names = font.names
    var get = function (field) {
      if (!names[field]) return 'N/A'
      return names[field].en || Object.values(names[field])[0] || 'N/A'
    }
    var rows = [
      ['Family', get('fontFamily')],
      ['Subfamily', get('fontSubfamily')],
      ['Full Name', get('fullName')],
      ['PostScript Name', get('postScriptName')],
      ['Version', get('version')],
      ['Designer', get('designer')],
      ['Manufacturer', get('manufacturer')],
      ['License', get('license')],
      ['Description', get('description')],
      ['Glyphs', String(font.glyphs.length)]
    ]
    var html = ''
    for (var i = 0; i < rows.length; i++) {
      html += '<tr><td>' + rows[i][0] + '</td><td>' + escapeHtml(rows[i][1]) + '</td></tr>'
    }
    metaTable.innerHTML = html
  }

  function renderCharset() {
    var glyphs = font.glyphs
    var count = Math.min(glyphs.length, 500)
    var html = ''
    for (var i = 0; i < count; i++) {
      var g = glyphs.get(i)
      if (!g.unicode && g.unicode !== 0) continue
      var ch = String.fromCodePoint(g.unicode)
      html += '<button class="fe-glyph-btn" data-idx="' + i + '" title="U+' + g.unicode.toString(16).toUpperCase().padStart(4, '0') + '" style="font-family:\'' + fontFamilyName + '\',sans-serif">' + escapeHtml(ch) + '</button>'
    }
    if (glyphs.length > 500) {
      html += '<div style="grid-column:1/-1;text-align:center;padding:0.75rem;font-size:13px;color:var(--text-2)">Showing first 500 of ' + glyphs.length + ' glyphs</div>'
    }
    if (!html) html = '<div style="padding:1rem;text-align:center;color:var(--text-2)">No displayable glyphs found.</div>'
    charsetGrid.innerHTML = html
  }

  function showGlyphDetail(idx) {
    var g = font.glyphs.get(idx)
    glyphDetail.style.display = 'grid'

    var path = g.getPath(0, 0, 150)
    var pathData = path.toPathData(2)
    var bbox = path.getBoundingBox()
    var w = Math.max(bbox.x2 - bbox.x1, 1)
    var h = Math.max(bbox.y2 - bbox.y1, 1)
    var pad = 10
    var vb = (bbox.x1 - pad) + ' ' + (bbox.y1 - pad) + ' ' + (w + pad * 2) + ' ' + (h + pad * 2)
    glyphSvg.innerHTML = '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" width="180" height="180"><path d="' + pathData + '" fill="currentColor" /></svg>'

    var hex = g.unicode ? g.unicode.toString(16).toUpperCase().padStart(4, '0') : 'N/A'
    var infoHtml = ''
    infoHtml += '<div class="fe-glyph-info-row"><span class="fe-glyph-info-label">Name</span><span class="fe-glyph-info-value">' + escapeHtml(g.name || 'unnamed') + '</span></div>'
    infoHtml += '<div class="fe-glyph-info-row"><span class="fe-glyph-info-label">Unicode</span><span class="fe-glyph-info-value">U+' + hex + '</span></div>'
    infoHtml += '<div class="fe-glyph-info-row"><span class="fe-glyph-info-label">Glyph Index</span><span class="fe-glyph-info-value">' + idx + '</span></div>'
    infoHtml += '<div class="fe-glyph-info-row"><span class="fe-glyph-info-label">Advance Width</span><span class="fe-glyph-info-value">' + (g.advanceWidth || 0) + '</span></div>'
    if (pathData) {
      var short = pathData.length > 200 ? pathData.substring(0, 200) + '...' : pathData
      infoHtml += '<div class="fe-glyph-info-row"><span class="fe-glyph-info-label">Path Data</span><span class="fe-glyph-info-value" style="font-size:11px;max-height:80px;overflow:auto;display:block">' + escapeHtml(short) + '</span></div>'
    }
    glyphInfo.innerHTML = infoHtml

    var btns = charsetGrid.querySelectorAll('.fe-glyph-btn')
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('selected', parseInt(btns[i].dataset.idx) === idx)
    }
  }

  function renderFeatures() {
    var features = {}
    if (font.tables.gsub && font.tables.gsub.features) {
      for (var i = 0; i < font.tables.gsub.features.length; i++) {
        features[font.tables.gsub.features[i].tag] = true
      }
    }
    if (font.tables.gpos && font.tables.gpos.features) {
      for (var i = 0; i < font.tables.gpos.features.length; i++) {
        features[font.tables.gpos.features[i].tag] = true
      }
    }
    var tags = Object.keys(features).sort()
    if (tags.length === 0) {
      featuresList.innerHTML = '<div class="fe-no-features">No OpenType features found in this font.</div>'
      return
    }
    var html = ''
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i]
      var name = FEATURE_NAMES[tag] || 'Unknown Feature'
      html += '<div class="fe-feature-tag"><span class="fe-feature-code">' + tag + '</span><span class="fe-feature-name">' + name + '</span></div>'
    }
    featuresList.innerHTML = html
  }

  function renderMetrics() {
    var rows = [
      ['Units Per Em', String(font.unitsPerEm)],
      ['Ascender', String(font.ascender)],
      ['Descender', String(font.descender)],
      ['Line Gap', String(font.tables.os2 ? font.tables.os2.sTypoLineGap : 'N/A')],
      ['Cap Height', String(font.tables.os2 ? font.tables.os2.sCapHeight : 'N/A')],
      ['x-Height', String(font.tables.os2 ? font.tables.os2.sxHeight : 'N/A')],
      ['Number of Glyphs', String(font.glyphs.length)]
    ]
    var html = ''
    for (var i = 0; i < rows.length; i++) {
      html += '<tr><td>' + rows[i][0] + '</td><td>' + rows[i][1] + '</td></tr>'
    }
    metricsTable.innerHTML = html
  }

  function switchTab(name) {
    for (var i = 0; i < tabButtons.length; i++) {
      var btn = tabButtons[i]
      var isActive = btn.dataset.panel === name
      btn.classList.toggle('active', isActive)
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false')
    }
    for (var i = 0; i < allPanels.length; i++) {
      var el = document.getElementById('fe-panel-' + allPanels[i])
      if (el) el.style.display = allPanels[i] === name ? 'block' : 'none'
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function reset() {
    font = null
    dropzone.style.display = 'block'
    panels.style.display = 'none'
    fileInput.value = ''
    glyphDetail.style.display = 'none'
  }

  // Events
  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('dragover') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('dragover') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('dragover')
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFile(fileInput.files[0])
  })
  clearBtn.addEventListener('click', reset)

  for (var i = 0; i < tabButtons.length; i++) {
    tabButtons[i].addEventListener('click', function () {
      switchTab(this.dataset.panel)
    })
  }

  previewSize.addEventListener('input', function () {
    previewSizeLabel.textContent = previewSize.value + 'px'
    previewRender.style.fontSize = previewSize.value + 'px'
  })
  previewText.addEventListener('input', function () {
    previewRender.textContent = previewText.value
  })

  charsetGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.fe-glyph-btn')
    if (!btn) return
    showGlyphDetail(parseInt(btn.dataset.idx))
  })
})()
