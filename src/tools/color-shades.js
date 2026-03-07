import './hash-state.js'
import {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb,
  luminance, contrastRatio,
  generateShades,
  formatRgb, formatHsl, formatOklch,
  exportCssVariables, exportTailwindConfig, exportTailwindV4, exportDesignTokens
} from './color-math.js'

// Color Shades Generator
;(function () {
  // ── DOM refs ──
  var picker = document.getElementById('cs-picker')
  var hexInput = document.getElementById('cs-hex')
  var nameInput = document.getElementById('cs-name')
  var algoTabs = document.getElementById('cs-algo-tabs')
  var shiftSlider = document.getElementById('cs-shift')
  var shiftVal = document.getElementById('cs-shift-val')
  var countSelect = document.getElementById('cs-count')
  var formatTabs = document.getElementById('cs-format-tabs')
  var grid = document.getElementById('cs-grid')
  var exportTabs = document.getElementById('cs-export-tabs')
  var exportOutput = document.getElementById('cs-export-output')
  var copyExport = document.getElementById('cs-copy-export')
  var textOnWhite = document.getElementById('cs-text-on-white')
  var textOnBlack = document.getElementById('cs-text-on-black')
  var ratioWhite = document.getElementById('cs-ratio-white')
  var ratioBlack = document.getElementById('cs-ratio-black')
  var aaWhite = document.getElementById('cs-aa-white')
  var aaaWhite = document.getElementById('cs-aaa-white')
  var aaBlack = document.getElementById('cs-aa-black')
  var aaaBlack = document.getElementById('cs-aaa-black')
  var recentList = document.getElementById('cs-recent-list')

  // ── State ──
  var state = {
    hex: '#2d6ef6',
    algorithm: 'oklch',
    shift: 50,
    count: 11,
    name: 'brand',
    displayFormat: 'hex',
    exportFormat: 'css'
  }
  var currentShades = []
  var recentColors = []

  // ── Tab helpers ──
  function setActiveTab(container, value, attr) {
    var btns = container.querySelectorAll('.tool-tab')
    btns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute(attr) === value)
    })
  }

  function setupTabs(container, attr, callback) {
    container.addEventListener('click', function (e) {
      var btn = e.target.closest('.tool-tab')
      if (!btn) return
      var val = btn.getAttribute(attr)
      setActiveTab(container, val, attr)
      callback(val)
    })
  }

  // ── Core update ──
  function update() {
    var rgb = hexToRgb(state.hex)
    if (!rgb) return

    currentShades = generateShades(state.hex, state.count, state.shift, state.algorithm)
    renderGrid()
    renderExport()
    updateContrast(rgb)
    saveHashState()
  }

  // ── Shade grid rendering ──
  function getShadeValue(shade) {
    switch (state.displayFormat) {
      case 'rgb': return formatRgb(shade.rgb)
      case 'hsl': return formatHsl(shade.hsl)
      case 'oklch': return formatOklch(shade.oklch)
      default: return shade.hex
    }
  }

  function renderGrid() {
    grid.innerHTML = ''
    currentShades.forEach(function (shade) {
      var div = document.createElement('div')
      div.className = 'cs-shade'
      div.setAttribute('role', 'listitem')
      div.title = 'Click to copy'

      var colorDiv = document.createElement('div')
      colorDiv.className = 'cs-shade-color'
      colorDiv.style.background = shade.hex

      var labelDiv = document.createElement('div')
      labelDiv.className = 'cs-shade-label'
      labelDiv.textContent = shade.step

      var valueDiv = document.createElement('div')
      valueDiv.className = 'cs-shade-value'
      valueDiv.textContent = getShadeValue(shade)

      var copiedDiv = document.createElement('div')
      copiedDiv.className = 'cs-shade-copied'
      copiedDiv.textContent = 'Copied!'

      div.appendChild(colorDiv)
      div.appendChild(labelDiv)
      div.appendChild(valueDiv)
      div.appendChild(copiedDiv)

      div.addEventListener('click', function () {
        var text = getShadeValue(shade)
        navigator.clipboard.writeText(text).then(function () {
          copiedDiv.classList.add('show')
          setTimeout(function () { copiedDiv.classList.remove('show') }, 1200)
        })
      })

      grid.appendChild(div)
    })
  }

  // ── Export rendering ──
  function renderExport() {
    var name = state.name || 'brand'
    var code = ''
    switch (state.exportFormat) {
      case 'css': code = exportCssVariables(name, currentShades); break
      case 'tw3': code = exportTailwindConfig(name, currentShades); break
      case 'tw4': code = exportTailwindV4(name, currentShades); break
      case 'tokens': code = exportDesignTokens(name, currentShades); break
    }
    exportOutput.textContent = code
  }

  // ── Contrast checker ──
  function updateContrast(rgb) {
    var hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    var lum = luminance(rgb.r, rgb.g, rgb.b)
    var whiteLum = luminance(255, 255, 255)
    var blackLum = luminance(0, 0, 0)

    var ratioW = contrastRatio(whiteLum, lum)
    var ratioB = contrastRatio(lum, blackLum)

    textOnWhite.style.color = hex
    textOnBlack.style.color = hex

    ratioWhite.textContent = ratioW.toFixed(2) + ':1'
    ratioBlack.textContent = ratioB.toFixed(2) + ':1'

    aaWhite.textContent = 'AA ' + (ratioW >= 4.5 ? 'Pass' : 'Fail')
    aaWhite.className = 'cs-badge ' + (ratioW >= 4.5 ? 'pass' : 'fail')
    aaaWhite.textContent = 'AAA ' + (ratioW >= 7 ? 'Pass' : 'Fail')
    aaaWhite.className = 'cs-badge ' + (ratioW >= 7 ? 'pass' : 'fail')

    aaBlack.textContent = 'AA ' + (ratioB >= 4.5 ? 'Pass' : 'Fail')
    aaBlack.className = 'cs-badge ' + (ratioB >= 4.5 ? 'pass' : 'fail')
    aaaBlack.textContent = 'AAA ' + (ratioB >= 7 ? 'Pass' : 'Fail')
    aaaBlack.className = 'cs-badge ' + (ratioB >= 7 ? 'pass' : 'fail')
  }

  // ── Recent colors ──
  function addRecent(hex) {
    hex = hex.toLowerCase()
    var idx = recentColors.indexOf(hex)
    if (idx !== -1) recentColors.splice(idx, 1)
    recentColors.unshift(hex)
    if (recentColors.length > 8) recentColors.pop()
    renderRecent()
  }

  function renderRecent() {
    recentList.innerHTML = ''
    recentColors.forEach(function (hex) {
      var btn = document.createElement('button')
      btn.className = 'cs-recent-swatch'
      btn.style.background = hex
      btn.title = hex
      btn.addEventListener('click', function () {
        setColor(hex, 'recent')
      })
      recentList.appendChild(btn)
    })
  }

  // ── Set color from any source ──
  function setColor(hex, source) {
    var rgb = hexToRgb(hex)
    if (!rgb) return
    state.hex = rgbToHex(rgb.r, rgb.g, rgb.b)
    if (source !== 'picker') picker.value = state.hex
    if (source !== 'hex') hexInput.value = state.hex
    update()
  }

  // ── Copy export ──
  function copyWithFeedback(btn, text, label) {
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied!'
      btn.classList.add('copied')
      setTimeout(function () {
        btn.textContent = label
        btn.classList.remove('copied')
      }, 2000)
    })
  }

  // ── Hash state ──
  function saveHashState() {
    HashState.save({
      hex: state.hex.replace('#', ''),
      algo: state.algorithm,
      shift: String(state.shift),
      count: String(state.count),
      name: state.name
    })
  }

  // ── Event listeners ──
  picker.addEventListener('input', function () {
    setColor(picker.value, 'picker')
  })
  picker.addEventListener('change', function () {
    addRecent(picker.value)
  })

  hexInput.addEventListener('input', function () {
    var val = hexInput.value.trim()
    if (val.length >= 4) {
      var rgb = hexToRgb(val)
      if (rgb) {
        setColor(val, 'hex')
        addRecent(val)
      }
    }
  })

  nameInput.addEventListener('input', function () {
    state.name = nameInput.value.trim()
    renderExport()
    saveHashState()
  })

  setupTabs(algoTabs, 'data-algo', function (val) {
    state.algorithm = val
    update()
  })

  shiftSlider.addEventListener('input', function () {
    state.shift = parseInt(shiftSlider.value, 10)
    shiftVal.textContent = state.shift
    update()
  })

  countSelect.addEventListener('change', function () {
    state.count = parseInt(countSelect.value, 10)
    update()
  })

  setupTabs(formatTabs, 'data-fmt', function (val) {
    state.displayFormat = val
    renderGrid()
  })

  setupTabs(exportTabs, 'data-export', function (val) {
    state.exportFormat = val
    renderExport()
  })

  copyExport.addEventListener('click', function () {
    copyWithFeedback(copyExport, exportOutput.textContent, 'Copy')
  })

  // ── Init ──
  var saved = HashState.parse()
  if (saved.hex) {
    var rgb = hexToRgb(saved.hex)
    if (rgb) state.hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  }
  if (saved.algo && (saved.algo === 'oklch' || saved.algo === 'hsl')) {
    state.algorithm = saved.algo
    setActiveTab(algoTabs, saved.algo, 'data-algo')
  }
  if (saved.shift) {
    var s = parseInt(saved.shift, 10)
    if (!isNaN(s) && s >= 0 && s <= 100) {
      state.shift = s
      shiftSlider.value = s
      shiftVal.textContent = s
    }
  }
  if (saved.count) {
    var c = parseInt(saved.count, 10)
    if ([5, 7, 9, 11, 13].indexOf(c) !== -1) {
      state.count = c
      countSelect.value = c
    }
  }
  if (saved.name) {
    state.name = saved.name
    nameInput.value = saved.name
  }

  picker.value = state.hex
  hexInput.value = state.hex
  update()
})()
