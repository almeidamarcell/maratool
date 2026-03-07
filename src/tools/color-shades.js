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
  var algoSelect = document.getElementById('cs-algo')
  var shiftSlider = document.getElementById('cs-shift')
  var shiftDisplay = document.getElementById('cs-shift-display')
  var countValue = document.getElementById('cs-count-value')
  var countMinus = document.getElementById('cs-count-minus')
  var countPlus = document.getElementById('cs-count-plus')
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

  // RGB slider refs
  var trackR = document.getElementById('cs-track-r')
  var trackG = document.getElementById('cs-track-g')
  var trackB = document.getElementById('cs-track-b')
  var thumbR = document.getElementById('cs-thumb-r')
  var thumbG = document.getElementById('cs-thumb-g')
  var thumbB = document.getElementById('cs-thumb-b')
  var inputR = document.getElementById('cs-input-r')
  var inputG = document.getElementById('cs-input-g')
  var inputB = document.getElementById('cs-input-b')

  // ── State ──
  var MAX_SLOTS = 21
  var SHADE_COUNTS = [5, 7, 9, 11, 13, 15, 17, 19, 21]
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

  // ── RGB slider helpers ──
  function updateRgbSliders(rgb) {
    inputR.value = rgb.r
    inputG.value = rgb.g
    inputB.value = rgb.b
    updateTrackGradients(rgb)
    updateThumbPositions(rgb)
  }

  function updateTrackGradients(rgb) {
    // R track: vary red from 0 to 255, keep G and B fixed
    trackR.style.background = 'linear-gradient(to right, ' +
      rgbToHex(0, rgb.g, rgb.b) + ', ' + rgbToHex(255, rgb.g, rgb.b) + ')'
    // G track
    trackG.style.background = 'linear-gradient(to right, ' +
      rgbToHex(rgb.r, 0, rgb.b) + ', ' + rgbToHex(rgb.r, 255, rgb.b) + ')'
    // B track
    trackB.style.background = 'linear-gradient(to right, ' +
      rgbToHex(rgb.r, rgb.g, 0) + ', ' + rgbToHex(rgb.r, rgb.g, 255) + ')'
  }

  function updateThumbPositions(rgb) {
    thumbR.style.left = (rgb.r / 255 * 100) + '%'
    thumbG.style.left = (rgb.g / 255 * 100) + '%'
    thumbB.style.left = (rgb.b / 255 * 100) + '%'
  }

  function setupChannelTrackDrag(track, thumb, input, channel) {
    function getValueFromEvent(e) {
      var rect = track.getBoundingClientRect()
      var x = (e.clientX || e.touches[0].clientX) - rect.left
      var ratio = Math.max(0, Math.min(1, x / rect.width))
      return Math.round(ratio * 255)
    }

    function applyValue(val) {
      var rgb = hexToRgb(state.hex)
      if (!rgb) return
      rgb[channel] = val
      var hex = rgbToHex(rgb.r, rgb.g, rgb.b)
      setColor(hex, 'rgb')
    }

    function onMove(e) {
      e.preventDefault()
      var val = getValueFromEvent(e)
      applyValue(val)
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
      addRecent(state.hex)
    }

    track.addEventListener('mousedown', function (e) {
      onMove(e)
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
    track.addEventListener('touchstart', function (e) {
      onMove(e)
      document.addEventListener('touchmove', onMove, { passive: false })
      document.addEventListener('touchend', onUp)
    }, { passive: false })

    input.addEventListener('input', function () {
      var val = parseInt(input.value, 10)
      if (isNaN(val)) return
      val = Math.max(0, Math.min(255, val))
      applyValue(val)
    })
    input.addEventListener('change', function () {
      addRecent(state.hex)
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
    updateRgbSliders(rgb)
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

  function textColorForBg(rgb) {
    var lum = luminance(rgb.r, rgb.g, rgb.b)
    return lum > 0.4 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)'
  }

  function renderGrid() {
    grid.innerHTML = ''
    for (var i = 0; i < MAX_SLOTS; i++) {
      var shade = currentShades[i]
      var wrapper = document.createElement('div')
      wrapper.className = 'cs-shade-wrapper'

      if (shade) {
        var div = document.createElement('div')
        div.className = 'cs-shade'
        div.style.background = shade.hex
        div.style.color = textColorForBg(shade.rgb)

        var labelDiv = document.createElement('div')
        labelDiv.className = 'cs-shade-label'
        labelDiv.textContent = shade.step

        var valueDiv = document.createElement('div')
        valueDiv.className = 'cs-shade-value'
        valueDiv.textContent = getShadeValue(shade)

        div.appendChild(labelDiv)
        div.appendChild(valueDiv)

        var copyBtn = document.createElement('button')
        copyBtn.className = 'cs-shade-copy'
        copyBtn.textContent = 'Copy'
        ;(function (s, btn) {
          btn.addEventListener('click', function () {
            var text = getShadeValue(s)
            navigator.clipboard.writeText(text).then(function () {
              btn.textContent = 'Copied!'
              btn.classList.add('copied')
              setTimeout(function () {
                btn.textContent = 'Copy'
                btn.classList.remove('copied')
              }, 1500)
            })
          })
        })(shade, copyBtn)

        wrapper.appendChild(div)
        wrapper.appendChild(copyBtn)
      } else {
        var empty = document.createElement('div')
        empty.className = 'cs-shade cs-shade-empty'
        var emptyLabel = document.createElement('div')
        emptyLabel.className = 'cs-shade-empty-label'
        emptyLabel.textContent = 'EMPTY'
        empty.appendChild(emptyLabel)
        wrapper.appendChild(empty)
      }

      grid.appendChild(wrapper)
    }
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

  algoSelect.addEventListener('change', function () {
    state.algorithm = algoSelect.value
    update()
  })

  shiftSlider.addEventListener('input', function () {
    state.shift = parseInt(shiftSlider.value, 10)
    shiftDisplay.textContent = (state.shift / 100).toFixed(2)
    update()
  })

  countMinus.addEventListener('click', function () {
    var idx = SHADE_COUNTS.indexOf(state.count)
    if (idx > 0) {
      state.count = SHADE_COUNTS[idx - 1]
      countValue.textContent = state.count
      update()
    }
  })

  countPlus.addEventListener('click', function () {
    var idx = SHADE_COUNTS.indexOf(state.count)
    if (idx < SHADE_COUNTS.length - 1) {
      state.count = SHADE_COUNTS[idx + 1]
      countValue.textContent = state.count
      update()
    }
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

  // Setup RGB channel track dragging
  setupChannelTrackDrag(trackR, thumbR, inputR, 'r')
  setupChannelTrackDrag(trackG, thumbG, inputG, 'g')
  setupChannelTrackDrag(trackB, thumbB, inputB, 'b')

  // ── Init ──
  var saved = HashState.parse()
  if (saved.hex) {
    var rgb = hexToRgb(saved.hex)
    if (rgb) state.hex = rgbToHex(rgb.r, rgb.g, rgb.b)
  }
  if (saved.algo && (saved.algo === 'oklch' || saved.algo === 'hsl')) {
    state.algorithm = saved.algo
    algoSelect.value = saved.algo
  }
  if (saved.shift) {
    var s = parseInt(saved.shift, 10)
    if (!isNaN(s) && s >= 0 && s <= 100) {
      state.shift = s
      shiftSlider.value = s
      shiftDisplay.textContent = (s / 100).toFixed(2)
    }
  }
  if (saved.count) {
    var c = parseInt(saved.count, 10)
    if (SHADE_COUNTS.indexOf(c) !== -1) {
      state.count = c
      countValue.textContent = c
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
