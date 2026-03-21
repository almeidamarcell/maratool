(function () {
  // ── CVD Matrices (Machado, Oliveira & Fernandes 2009) ──
  var TYPES = [
    { key: 'normal', name: 'Normal Vision', desc: 'No deficiency', matrix: null },
    { key: 'protanopia', name: 'Protanopia', desc: 'Red-blind', matrix: [[0.567,0.433,0],[0.558,0.442,0],[0,0.242,0.758]] },
    { key: 'deuteranopia', name: 'Deuteranopia', desc: 'Green-blind', matrix: [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]] },
    { key: 'tritanopia', name: 'Tritanopia', desc: 'Blue-blind', matrix: [[0.95,0.05,0],[0,0.433,0.567],[0,0.475,0.525]] },
    { key: 'achromatopsia', name: 'Achromatopsia', desc: 'Total color blindness', matrix: [[0.299,0.587,0.114],[0.299,0.587,0.114],[0.299,0.587,0.114]] },
    { key: 'protanomaly', name: 'Protanomaly', desc: 'Red-weak', matrix: [[0.817,0.183,0],[0.333,0.667,0],[0,0.125,0.875]] },
    { key: 'deuteranomaly', name: 'Deuteranomaly', desc: 'Green-weak', matrix: [[0.8,0.2,0],[0.258,0.742,0],[0,0.142,0.858]] },
    { key: 'tritanomaly', name: 'Tritanomaly', desc: 'Blue-weak', matrix: [[0.967,0.033,0],[0,0.733,0.267],[0,0.183,0.817]] },
  ]

  // ── DOM refs ──
  var modeTabs = document.getElementById('cbs-mode-tabs')
  var imageMode = document.getElementById('cbs-image-mode')
  var colorMode = document.getElementById('cbs-color-mode')
  var uploadArea = document.getElementById('cbs-upload-area')
  var fileInput = document.getElementById('cbs-file-input')
  var browseBtn = document.getElementById('cbs-browse-btn')
  var imageResults = document.getElementById('cbs-image-results')
  var imageGrid = document.getElementById('cbs-image-grid')
  var colorPicker = document.getElementById('cbs-color-picker')
  var hexInput = document.getElementById('cbs-hex-input')
  var swatchGrid = document.getElementById('cbs-swatch-grid')

  var currentMode = 'image'
  var sourceImage = null // HTMLImageElement

  // ── Mode switching ──
  modeTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.tool-tab')
    if (!btn) return
    var mode = btn.getAttribute('data-mode')
    currentMode = mode
    var btns = modeTabs.querySelectorAll('.tool-tab')
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i] === btn)
    }
    imageMode.style.display = mode === 'image' ? '' : 'none'
    colorMode.style.display = mode === 'color' ? '' : 'none'
  })

  // ── Apply CVD matrix to a single RGB triplet ──
  function applyMatrix(m, r, g, b) {
    return [
      Math.round(Math.min(255, Math.max(0, m[0][0] * r + m[0][1] * g + m[0][2] * b))),
      Math.round(Math.min(255, Math.max(0, m[1][0] * r + m[1][1] * g + m[1][2] * b))),
      Math.round(Math.min(255, Math.max(0, m[2][0] * r + m[2][1] * g + m[2][2] * b)))
    ]
  }

  // ── Hex helpers ──
  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
    if (hex.length !== 6) return null
    var n = parseInt(hex, 16)
    if (isNaN(n)) return null
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  function rgbToHex(r, g, b) {
    return '#' + [r,g,b].map(function (v) {
      var h = Math.max(0, Math.min(255, Math.round(v))).toString(16)
      return h.length === 1 ? '0' + h : h
    }).join('')
  }

  // ── IMAGE MODE ──

  // File upload / drag & drop
  browseBtn.addEventListener('click', function (e) {
    e.preventDefault()
    e.stopPropagation()
    fileInput.click()
  })
  uploadArea.addEventListener('click', function () { fileInput.click() })
  uploadArea.addEventListener('dragover', function (e) {
    e.preventDefault()
    uploadArea.classList.add('dragover')
  })
  uploadArea.addEventListener('dragleave', function () {
    uploadArea.classList.remove('dragover')
  })
  uploadArea.addEventListener('drop', function (e) {
    e.preventDefault()
    uploadArea.classList.remove('dragover')
    var files = e.dataTransfer.files
    if (files.length) loadImage(files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) loadImage(fileInput.files[0])
  })

  function loadImage(file) {
    if (!file.type.startsWith('image/')) return
    var reader = new FileReader()
    reader.onload = function (e) {
      var img = new Image()
      img.onload = function () {
        sourceImage = img
        renderImageResults()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  function renderImageResults() {
    if (!sourceImage) return
    uploadArea.style.display = 'none'
    imageResults.style.display = ''

    // Limit canvas size for performance
    var maxW = 600
    var w = sourceImage.width
    var h = sourceImage.height
    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }

    // Get original pixel data once
    var srcCanvas = document.createElement('canvas')
    srcCanvas.width = w
    srcCanvas.height = h
    var srcCtx = srcCanvas.getContext('2d')
    srcCtx.drawImage(sourceImage, 0, 0, w, h)
    var srcData = srcCtx.getImageData(0, 0, w, h)

    imageGrid.innerHTML = ''

    // Change image button
    var changeRow = document.createElement('div')
    changeRow.className = 'cbs-change-image-row'
    var changeBtn = document.createElement('button')
    changeBtn.className = 'cbs-change-btn'
    changeBtn.textContent = 'Change image'
    changeBtn.addEventListener('click', function () {
      sourceImage = null
      uploadArea.style.display = ''
      imageResults.style.display = 'none'
      fileInput.value = ''
    })
    changeRow.appendChild(changeBtn)
    imageGrid.parentNode.insertBefore(changeRow, imageGrid)

    for (var t = 0; t < TYPES.length; t++) {
      var type = TYPES[t]
      var card = document.createElement('div')
      card.className = 'cbs-image-card'

      var label = document.createElement('div')
      label.className = 'cbs-image-card-label'
      label.innerHTML = type.name + ' <small>' + type.desc + '</small>'

      var canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      var ctx = canvas.getContext('2d')

      if (!type.matrix) {
        // Normal — just draw original
        ctx.putImageData(srcData, 0, 0)
      } else {
        var imgData = ctx.createImageData(w, h)
        var src = srcData.data
        var dst = imgData.data
        var m = type.matrix
        for (var i = 0; i < src.length; i += 4) {
          var r = src[i], g = src[i+1], b = src[i+2]
          dst[i]   = Math.min(255, Math.max(0, Math.round(m[0][0]*r + m[0][1]*g + m[0][2]*b)))
          dst[i+1] = Math.min(255, Math.max(0, Math.round(m[1][0]*r + m[1][1]*g + m[1][2]*b)))
          dst[i+2] = Math.min(255, Math.max(0, Math.round(m[2][0]*r + m[2][1]*g + m[2][2]*b)))
          dst[i+3] = src[i+3]
        }
        ctx.putImageData(imgData, 0, 0)
      }

      card.appendChild(label)
      card.appendChild(canvas)
      imageGrid.appendChild(card)
    }
  }

  // ── COLOR MODE ──

  function renderSwatches() {
    var hex = colorPicker.value
    var rgb = hexToRgb(hex)
    if (!rgb) return

    swatchGrid.innerHTML = ''
    for (var t = 0; t < TYPES.length; t++) {
      var type = TYPES[t]
      var simRgb = type.matrix ? applyMatrix(type.matrix, rgb[0], rgb[1], rgb[2]) : rgb
      var simHex = type.matrix ? rgbToHex(simRgb[0], simRgb[1], simRgb[2]) : hex

      var card = document.createElement('div')
      card.className = 'cbs-swatch-card'
      card.setAttribute('data-hex', simHex)

      var preview = document.createElement('div')
      preview.className = 'cbs-swatch-preview'
      preview.style.background = simHex

      var info = document.createElement('div')
      info.className = 'cbs-swatch-info'

      var nameSpan = document.createElement('span')
      nameSpan.className = 'cbs-swatch-name'
      nameSpan.textContent = type.name

      var hexSpan = document.createElement('span')
      hexSpan.className = 'cbs-swatch-hex'
      hexSpan.textContent = simHex

      info.appendChild(nameSpan)
      info.appendChild(hexSpan)
      card.appendChild(preview)
      card.appendChild(info)

      ;(function (hex, cardEl) {
        cardEl.addEventListener('click', function () {
          navigator.clipboard.writeText(hex).then(function () {
            cardEl.classList.add('copied')
            var hexEl = cardEl.querySelector('.cbs-swatch-hex')
            var orig = hexEl.textContent
            hexEl.textContent = 'Copied!'
            setTimeout(function () {
              cardEl.classList.remove('copied')
              hexEl.textContent = orig
            }, 2000)
          })
        })
      })(simHex, card)

      swatchGrid.appendChild(card)
    }
  }

  colorPicker.addEventListener('input', function () {
    hexInput.value = colorPicker.value
    renderSwatches()
  })

  hexInput.addEventListener('input', function () {
    var val = hexInput.value.trim()
    if (val.length >= 4) {
      var rgb = hexToRgb(val)
      if (rgb) {
        colorPicker.value = rgbToHex(rgb[0], rgb[1], rgb[2])
        renderSwatches()
      }
    }
  })

  // Init color mode swatches
  renderSwatches()
})()
