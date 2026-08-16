import { setVisible, formatSize, downloadBlob } from './tool-utils.js'

;(function () {
  var tabs = document.querySelectorAll('.tool-tab')
  var panels = document.querySelectorAll('.tab-panel')
  var input = document.getElementById('svp-input')
  var dropzone = document.getElementById('svp-dropzone')
  var fileInput = document.getElementById('svp-file')
  var errorEl = document.getElementById('svp-error')
  var hintEl = document.getElementById('svp-hint')
  var controls = document.getElementById('svp-controls')
  var widthInput = document.getElementById('svp-width')
  var heightInput = document.getElementById('svp-height')
  var lockCheck = document.getElementById('svp-lock')
  var whiteCheck = document.getElementById('svp-white')
  var scaleBtns = document.querySelectorAll('.svp-scale')
  var naturalEl = document.getElementById('svp-natural')
  var previewImg = document.getElementById('svp-preview')
  var outMeta = document.getElementById('svp-outmeta')
  var downloadBtn = document.getElementById('svp-download')
  var resetBtn = document.getElementById('svp-reset')

  if (!input) return

  var MAX_DIM = 8000
  // Browsers give an SVG with no width/height/viewBox no intrinsic size at
  // all, and drawImage on it yields a 0x0 canvas. This is the fallback box.
  var FALLBACK = 512

  var baseWidth = FALLBACK
  var baseHeight = FALLBACK
  var ratio = 1
  var sourceName = 'image'
  var pngBlob = null
  // Assigned to previewImg.src on every render. Revoked before the next
  // assignment and on reset, otherwise each keystroke orphans a PNG.
  var pngUrl = null
  var renderSeq = 0
  var debounceTimer = null

  // ── Tabs ──────────────────────────────────────────────────────────────
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { activateTab(tab.dataset.panel) })
  })

  function activateTab(panelId) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.panel === panelId) })
    panels.forEach(function (p) { p.style.display = p.id === panelId ? '' : 'none' })
  }

  // ── Parsing ───────────────────────────────────────────────────────────
  function parseLength(value) {
    if (value == null) return 0
    var trimmed = String(value).trim()
    // Percentages and em/rem are relative to a viewport the SVG does not have
    // here, so they count as "no intrinsic size" rather than a number.
    if (!/^-?[\d.]+(px)?$/.test(trimmed)) return 0
    var n = parseFloat(trimmed)
    return isFinite(n) && n > 0 ? n : 0
  }

  function parseSvg(text) {
    var doc = new DOMParser().parseFromString(text, 'image/svg+xml')
    if (doc.getElementsByTagName('parsererror').length) return { error: 'That is not valid XML. Check for an unclosed tag or a stray character.' }
    var root = doc.documentElement
    if (!root || root.nodeName.toLowerCase() !== 'svg') return { error: 'No <svg> root element found. Paste the whole SVG, opening tag included.' }

    var w = parseLength(root.getAttribute('width'))
    var h = parseLength(root.getAttribute('height'))
    var viewBox = null
    var vb = root.getAttribute('viewBox')
    if (vb) {
      var nums = vb.trim().split(/[\s,]+/).map(parseFloat)
      if (nums.length === 4 && nums.every(function (n) { return isFinite(n) }) && nums[2] > 0 && nums[3] > 0) {
        viewBox = nums
      }
    }

    var guessed = false
    if (!w || !h) {
      if (viewBox) {
        w = w || viewBox[2]
        h = h || viewBox[3]
      } else {
        w = FALLBACK
        h = FALLBACK
        guessed = true
      }
    }
    if (!viewBox) root.setAttribute('viewBox', '0 0 ' + w + ' ' + h)

    return { root: root, width: Math.round(w), height: Math.round(h), guessed: guessed }
  }

  function showError(message) {
    if (!message) { setVisible(errorEl, false); return }
    errorEl.textContent = message
    setVisible(errorEl, true)
    setVisible(controls, false)
    setVisible(hintEl, false)
  }

  // ── Load new markup ───────────────────────────────────────────────────
  var currentRoot = null

  function loadMarkup() {
    var text = input.value.trim()
    if (!text) {
      showError(null)
      setVisible(controls, false)
      setVisible(hintEl, false)
      currentRoot = null
      return
    }

    var parsed = parseSvg(text)
    if (parsed.error) { currentRoot = null; showError(parsed.error); return }

    showError(null)
    currentRoot = parsed.root
    baseWidth = Math.min(MAX_DIM, parsed.width)
    baseHeight = Math.min(MAX_DIM, parsed.height)
    ratio = baseHeight > 0 ? baseWidth / baseHeight : 1
    naturalEl.textContent = 'Original: ' + baseWidth + ' × ' + baseHeight + ' px'

    if (parsed.guessed) {
      hintEl.textContent = 'This SVG declares no width, height, or viewBox, so it has no intrinsic size. Falling back to ' + FALLBACK + ' × ' + FALLBACK + ' px — set the numbers below to whatever you actually need.'
      setVisible(hintEl, true)
    } else {
      setVisible(hintEl, false)
    }

    widthInput.value = baseWidth
    heightInput.value = baseHeight
    setVisible(controls, true)
    markActiveScale()
    render()
  }

  // ── Render ────────────────────────────────────────────────────────────
  function targetSize() {
    var w = Math.round(parseFloat(widthInput.value))
    var h = Math.round(parseFloat(heightInput.value))
    if (!isFinite(w) || w < 1) w = 1
    if (!isFinite(h) || h < 1) h = 1
    return { w: Math.min(MAX_DIM, w), h: Math.min(MAX_DIM, h) }
  }

  function render() {
    if (!currentRoot) return
    var size = targetSize()
    // A slow decode from an earlier keystroke must not overwrite a newer one.
    var seq = ++renderSeq

    var clone = currentRoot.cloneNode(true)
    clone.setAttribute('width', size.w)
    clone.setAttribute('height', size.h)
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    var markup = new XMLSerializer().serializeToString(clone)
    var svgUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))

    var img = new Image()
    img.onload = function () {
      URL.revokeObjectURL(svgUrl)
      if (seq !== renderSeq) return

      var canvas = document.createElement('canvas')
      canvas.width = size.w
      canvas.height = size.h
      var ctx = canvas.getContext('2d')
      if (whiteCheck.checked) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size.w, size.h)
      }
      ctx.drawImage(img, 0, 0, size.w, size.h)

      canvas.toBlob(function (blob) {
        if (seq !== renderSeq || !blob) return
        pngBlob = blob
        if (pngUrl) URL.revokeObjectURL(pngUrl)
        pngUrl = URL.createObjectURL(blob)
        previewImg.src = pngUrl
        previewImg.alt = 'PNG preview at ' + size.w + ' by ' + size.h + ' pixels'
        outMeta.textContent = 'PNG · ' + size.w + ' × ' + size.h + ' px · ' + formatSize(blob.size) +
          (whiteCheck.checked ? ' · white background' : ' · transparent background')
        downloadBtn.disabled = false
      }, 'image/png')
    }
    img.onerror = function () {
      URL.revokeObjectURL(svgUrl)
      if (seq !== renderSeq) return
      showError('The browser refused to render this SVG. External images and scripts inside an SVG are blocked when it is loaded this way.')
    }
    img.src = svgUrl
  }

  function scheduleRender() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(render, 250)
  }

  function markActiveScale() {
    var w = Math.round(parseFloat(widthInput.value))
    scaleBtns.forEach(function (btn) {
      var n = parseInt(btn.dataset.scale, 10)
      btn.classList.toggle('active', Math.round(baseWidth * n) === w)
    })
  }

  // ── Wiring ────────────────────────────────────────────────────────────
  var loadTimer = null
  input.addEventListener('input', function () {
    clearTimeout(loadTimer)
    loadTimer = setTimeout(loadMarkup, 300)
  })

  widthInput.addEventListener('input', function () {
    if (lockCheck.checked && ratio > 0) {
      var w = parseFloat(widthInput.value)
      if (isFinite(w) && w > 0) heightInput.value = Math.max(1, Math.round(w / ratio))
    }
    markActiveScale()
    scheduleRender()
  })

  heightInput.addEventListener('input', function () {
    if (lockCheck.checked && ratio > 0) {
      var h = parseFloat(heightInput.value)
      if (isFinite(h) && h > 0) widthInput.value = Math.max(1, Math.round(h * ratio))
    }
    markActiveScale()
    scheduleRender()
  })

  whiteCheck.addEventListener('change', render)

  scaleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var n = parseInt(btn.dataset.scale, 10) || 1
      widthInput.value = Math.min(MAX_DIM, Math.round(baseWidth * n))
      heightInput.value = Math.min(MAX_DIM, Math.round(baseHeight * n))
      markActiveScale()
      render()
    })
  })

  if (dropzone) {
    dropzone.addEventListener('click', function () { fileInput.click() })
    dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
    dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault()
      dropzone.classList.remove('drag-over')
      if (e.dataTransfer && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
    })
    fileInput.addEventListener('change', function () {
      if (fileInput.files[0]) handleFile(fileInput.files[0])
      fileInput.value = ''
    })
  }

  function handleFile(file) {
    if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') {
      showError('That is not an SVG file. This tool reads .svg markup, not raster images.')
      return
    }
    sourceName = file.name.replace(/\.[^.]+$/, '') || 'image'
    var reader = new FileReader()
    reader.onload = function () {
      input.value = String(reader.result)
      activateTab('svp-tab-paste')
      loadMarkup()
    }
    reader.onerror = function () { showError('Could not read that file.') }
    reader.readAsText(file)
  }

  downloadBtn.addEventListener('click', function () {
    if (!pngBlob) return
    var size = targetSize()
    downloadBlob(pngBlob, sourceName + '-' + size.w + 'x' + size.h + '.png')
  })

  resetBtn.addEventListener('click', function () {
    renderSeq++
    input.value = ''
    currentRoot = null
    pngBlob = null
    if (pngUrl) { URL.revokeObjectURL(pngUrl); pngUrl = null }
    previewImg.removeAttribute('src')
    sourceName = 'image'
    outMeta.textContent = ''
    setVisible(controls, false)
    setVisible(hintEl, false)
    showError(null)
    activateTab('svp-tab-paste')
    input.focus()
  })

  window.addEventListener('pagehide', function () {
    if (pngUrl) { URL.revokeObjectURL(pngUrl); pngUrl = null }
  })
})()
