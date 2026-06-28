import {
  invertRgba,
  computeEnlargeDims,
  computeAspectPad,
  computeSpriteTiles,
  computeCollageCells,
  computeRoundedRadius,
  computePassportSize,
  buildDataUri,
  computeHalftoneCellSize,
  computeCensorRegion,
  formatImageOutputName,
} from './ezgif-image-core.js'
import { combineLayoutDims } from './gif-anim-core.js'

var MAX_IMAGE = 25 * 1024 * 1024

export function initImageTool(config) {
  var mode = config.mode
  var suffix = config.suffix || mode
  var root = document.getElementById('ez-root')
  if (!root) return

  root.innerHTML =
    '<div class="ei-dropzone tool-dropzone" id="ei-dropzone">' +
      '<input type="file" id="ei-file" hidden ' + (mode === 'compare' || mode === 'collage' ? 'multiple' : '') + ' accept="image/*" />' +
      '<p id="ei-drop-text">Drop image' + (mode === 'compare' ? 's (2)' : mode === 'collage' ? 's' : '') + ' or click to upload</p>' +
    '</div>' +
    '<div id="ei-settings" hidden></div>' +
    '<div id="ei-progress" hidden><p id="ei-progress-text">Processing...</p></div>' +
    '<div id="ei-result" hidden>' +
      '<canvas id="ei-canvas" style="max-width:100%;"></canvas>' +
      '<img id="ei-preview" alt="Result" style="max-width:100%;display:none;" />' +
      '<pre id="ei-meta" class="tool-hint" style="display:none;white-space:pre-wrap;"></pre>' +
      '<textarea id="ei-output" class="tool-textarea" style="display:none;min-height:120px;" readonly></textarea>' +
      '<button type="button" class="tool-btn" id="ei-download" style="margin-top:1rem;">Download</button>' +
      '<button type="button" class="tool-btn tool-btn-secondary" id="ei-copy" style="margin-top:0.5rem;display:none;">Copy</button>' +
    '</div>' +
    '<p id="ei-error" class="tool-error" hidden><span id="ei-error-text"></span></p>'

  var dropzone = document.getElementById('ei-dropzone')
  var fileInput = document.getElementById('ei-file')
  var settingsEl = document.getElementById('ei-settings')
  var progressEl = document.getElementById('ei-progress')
  var resultEl = document.getElementById('ei-result')
  var canvas = document.getElementById('ei-canvas')
  var preview = document.getElementById('ei-preview')
  var metaEl = document.getElementById('ei-meta')
  var outputEl = document.getElementById('ei-output')
  var downloadBtn = document.getElementById('ei-download')
  var copyBtn = document.getElementById('ei-copy')
  var errorEl = document.getElementById('ei-error')
  var errorText = document.getElementById('ei-error-text')

  var images = []
  var resultBlob = null
  var resultMime = 'image/png'
  var currentNames = []

  function showState(state) {
    dropzone.style.display = state === 'upload' ? '' : 'none'
    settingsEl.style.display = state === 'settings' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.match(/^image\//)) { reject(new Error('Not an image')); return }
      if (file.size > MAX_IMAGE) { reject(new Error('File too large (max 25 MB).')); return }
      var reader = new FileReader()
      reader.onload = function () {
        var img = new Image()
        img.onload = function () { resolve({ img: img, file: file }) }
        img.onerror = function () { reject(new Error('Failed to load image')) }
        img.src = reader.result
      }
      reader.onerror = function () { reject(new Error('Read failed')) }
      reader.readAsDataURL(file)
    })
  }

  function buildSettings() {
    var html = ''
    if (mode === 'halftone') {
      html += '<label class="tool-label">Dot density</label><input class="tool-input" id="ei-opt-cells" type="number" value="40" min="10" max="120" />'
    }
    if (mode === 'rounded') {
      html += '<label class="tool-label">Corner radius (%)</label><input class="tool-input" id="ei-opt-radius" type="number" value="15" min="1" max="50" />'
    }
    if (mode === 'enlarge') {
      html += '<label class="tool-label">Scale (%)</label><input class="tool-input" id="ei-opt-scale" type="number" value="200" min="100" max="400" />'
    }
    if (mode === 'aspect') {
      html += '<label class="tool-label">Ratio W:H</label><div style="display:flex;gap:0.5rem;"><input class="tool-input" id="ei-opt-rw" type="number" value="16" /><input class="tool-input" id="ei-opt-rh" type="number" value="9" /></div>'
      html += '<label class="tool-label">Mode</label><select class="tool-input" id="ei-opt-mode"><option value="letterbox">Letterbox</option><option value="crop">Crop</option></select>'
    }
    if (mode === 'censor') {
      html += '<label class="tool-label">X</label><input class="tool-input" id="ei-opt-x" type="number" value="0" />'
      html += '<label class="tool-label">Y</label><input class="tool-input" id="ei-opt-y" type="number" value="0" />'
      html += '<label class="tool-label">Width</label><input class="tool-input" id="ei-opt-w" type="number" value="100" />'
      html += '<label class="tool-label">Height</label><input class="tool-input" id="ei-opt-h" type="number" value="100" />'
      html += '<label class="tool-label">Blur (px)</label><input class="tool-input" id="ei-opt-blur" type="number" value="12" min="2" max="40" />'
    }
    if (mode === 'passport') {
      html += '<label class="tool-label">Preset</label><select class="tool-input" id="ei-opt-preset"><option value="us">US 2×2 in</option><option value="eu">EU 35×45 mm</option></select>'
    }
    if (mode === 'sprite') {
      html += '<label class="tool-label">Rows</label><input class="tool-input" id="ei-opt-rows" type="number" value="2" min="1" max="20" />'
      html += '<label class="tool-label">Columns</label><input class="tool-input" id="ei-opt-cols" type="number" value="4" min="1" max="20" />'
    }
    if (mode === 'collage') {
      html += '<label class="tool-label">Layout</label><select class="tool-input" id="ei-opt-layout"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option><option value="grid2x2">2×2 grid</option></select>'
      html += '<label class="tool-label">Gap (px)</label><input class="tool-input" id="ei-opt-gap" type="number" value="8" min="0" max="40" />'
    }
    html += '<button type="button" class="tool-btn" id="ei-process" style="margin-top:1rem;">' +
      (mode === 'metadata' || mode === 'datauri' ? 'Show result' : 'Process') + '</button>'
    settingsEl.innerHTML = html
    var btn = document.getElementById('ei-process')
    if (btn) btn.addEventListener('click', process)
  }

  function readOpt(id, fallback) {
    var el = document.getElementById(id)
    return el ? el.value : fallback
  }

  function drawRoundedRect(ctx, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(w - r, 0)
    ctx.quadraticCurveTo(w, 0, w, r)
    ctx.lineTo(w, h - r)
    ctx.quadraticCurveTo(w, h, w - r, h)
    ctx.lineTo(r, h)
    ctx.quadraticCurveTo(0, h, 0, h - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
  }

  function applyHalftone(ctx, w, h, cells) {
    var cell = computeHalftoneCellSize(w, h, cells)
    var img = ctx.getImageData(0, 0, w, h)
    var data = img.data
    for (var y = 0; y < h; y += cell) {
      for (var x = 0; x < w; x += cell) {
        var r = 0; var g = 0; var b = 0; var n = 0
        for (var dy = 0; dy < cell && y + dy < h; dy++) {
          for (var dx = 0; dx < cell && x + dx < w; dx++) {
            var i = ((y + dy) * w + (x + dx)) * 4
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
          }
        }
        var lum = (r / n + g / n + b / n) / 3
        var radius = (1 - lum / 255) * (cell / 2)
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  async function process() {
    if (!images.length) return
    showState('progress')
    try {
      if (mode === 'metadata') {
        var f = images[0].file
        metaEl.style.display = ''
        canvas.style.display = 'none'
        preview.style.display = 'none'
        outputEl.style.display = 'none'
        downloadBtn.style.display = 'none'
        copyBtn.style.display = 'none'
        metaEl.textContent = 'Name: ' + f.name + '\nType: ' + f.type + '\nSize: ' + f.size + ' bytes\nDimensions: ' +
          images[0].img.naturalWidth + ' × ' + images[0].img.naturalHeight
        showState('result')
        return
      }

      if (mode === 'datauri') {
        var buf = await images[0].file.arrayBuffer()
        var b64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))
        var uri = buildDataUri(images[0].file.type || 'image/png', b64)
        outputEl.style.display = ''
        outputEl.value = uri
        canvas.style.display = 'none'
        preview.style.display = 'none'
        metaEl.style.display = 'none'
        copyBtn.style.display = ''
        downloadBtn.style.display = 'none'
        copyBtn.onclick = function () {
          navigator.clipboard.writeText(uri)
          copyBtn.textContent = 'Copied!'
          setTimeout(function () { copyBtn.textContent = 'Copy' }, 2000)
        }
        showState('result')
        return
      }

      var outCanvas = document.createElement('canvas')
      var ctx = outCanvas.getContext('2d')

      if (mode === 'compare' && images.length >= 2) {
        var a = images[0].img
        var b = images[1].img
        outCanvas.width = a.naturalWidth + b.naturalWidth + 8
        outCanvas.height = Math.max(a.naturalHeight, b.naturalHeight)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, outCanvas.width, outCanvas.height)
        ctx.drawImage(a, 0, 0)
        ctx.drawImage(b, a.naturalWidth + 8, 0)
      } else if (mode === 'collage') {
        var layout = readOpt('ei-opt-layout', 'horizontal')
        var gap = parseInt(readOpt('ei-opt-gap', '8'), 10) || 0
        var sizes = images.map(function (it) { return { w: it.img.naturalWidth, h: it.img.naturalHeight } })
        var dims = combineLayoutDims(layout, sizes)
        if (layout === 'grid2x2' && sizes.length < 4) throw new Error('Grid layout needs 4 images.')
        outCanvas.width = dims.width + (layout === 'horizontal' ? gap * (sizes.length - 1) : layout === 'grid2x2' ? gap : 0)
        outCanvas.height = dims.height + (layout === 'vertical' ? gap * (sizes.length - 1) : layout === 'grid2x2' ? gap : 0)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, outCanvas.width, outCanvas.height)
        var cells = computeCollageCells(layout, sizes, gap)
        cells.forEach(function (cell, i) {
          if (images[i]) ctx.drawImage(images[i].img, cell.x, cell.y, cell.w, cell.h)
        })
      } else if (mode === 'sprite') {
        var rows = parseInt(readOpt('ei-opt-rows', '2'), 10) || 2
        var cols = parseInt(readOpt('ei-opt-cols', '4'), 10) || 4
        var src = images[0].img
        var tiles = computeSpriteTiles(src.naturalWidth, src.naturalHeight, rows, cols)
        outCanvas.width = tiles[0].w
        outCanvas.height = tiles[0].h
        ctx.drawImage(src, tiles[0].x, tiles[0].y, tiles[0].w, tiles[0].h, 0, 0, tiles[0].w, tiles[0].h)
        resultMime = 'image/png'
      } else {
        var img = images[0].img
        var w = img.naturalWidth
        var h = img.naturalHeight

        if (mode === 'enlarge') {
          var dims2 = computeEnlargeDims(w, h, readOpt('ei-opt-scale', '200'))
          outCanvas.width = dims2.width
          outCanvas.height = dims2.height
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, dims2.width, dims2.height)
        } else if (mode === 'aspect') {
          var pad = computeAspectPad(w, h, readOpt('ei-opt-rw', '16'), readOpt('ei-opt-rh', '9'), readOpt('ei-opt-mode', 'letterbox'))
          outCanvas.width = pad.canvasW
          outCanvas.height = pad.canvasH
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, pad.canvasW, pad.canvasH)
          ctx.drawImage(img, pad.drawX, pad.drawY, pad.drawW, pad.drawH)
        } else if (mode === 'passport') {
          var ps = computePassportSize(readOpt('ei-opt-preset', 'us'))
          outCanvas.width = ps.width
          outCanvas.height = ps.height
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, ps.width, ps.height)
          var scale = Math.min(ps.width / w, ps.height / h)
          var dw = Math.round(w * scale)
          var dh = Math.round(h * scale)
          ctx.drawImage(img, Math.round((ps.width - dw) / 2), Math.round((ps.height - dh) / 2), dw, dh)
        } else if (mode === 'rounded') {
          var radius = computeRoundedRadius(w, h, readOpt('ei-opt-radius', '15'))
          outCanvas.width = w
          outCanvas.height = h
          drawRoundedRect(ctx, w, h, radius)
          ctx.clip()
          ctx.drawImage(img, 0, 0)
        } else if (mode === 'censor') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
          var reg = computeCensorRegion(w, h,
            parseInt(readOpt('ei-opt-x', '0'), 10),
            parseInt(readOpt('ei-opt-y', '0'), 10),
            parseInt(readOpt('ei-opt-w', '100'), 10),
            parseInt(readOpt('ei-opt-h', '100'), 10))
          var blur = parseInt(readOpt('ei-opt-blur', '12'), 10) || 12
          ctx.filter = 'blur(' + blur + 'px)'
          ctx.drawImage(outCanvas, reg.x, reg.y, reg.width, reg.height, reg.x, reg.y, reg.width, reg.height)
          ctx.filter = 'none'
        } else if (mode === 'invert') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
          var id = ctx.getImageData(0, 0, w, h)
          id.data.set(invertRgba(id.data))
          ctx.putImageData(id, 0, 0)
        } else if (mode === 'halftone') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0)
          applyHalftone(ctx, w, h, readOpt('ei-opt-cells', '40'))
        } else if (mode === 'exif') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
          resultMime = images[0].file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
        } else {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
        }
      }

      canvas.width = outCanvas.width
      canvas.height = outCanvas.height
      canvas.getContext('2d').drawImage(outCanvas, 0, 0)
      canvas.style.display = ''
      preview.style.display = 'none'
      metaEl.style.display = 'none'
      outputEl.style.display = 'none'
      downloadBtn.style.display = ''
      copyBtn.style.display = 'none'

      resultBlob = await new Promise(function (resolve) {
        canvas.toBlob(function (b) { resolve(b) }, resultMime, 0.92)
      })
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  async function handleFiles(fileList) {
    try {
      images = []
      currentNames = []
      for (var i = 0; i < fileList.length; i++) {
        var loaded = await loadImage(fileList[i])
        images.push(loaded)
        currentNames.push(fileList[i].name)
      }
      if (mode === 'compare' && images.length < 2) {
        showError('Please upload two images to compare.')
        return
      }
      buildSettings()
      showState('settings')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault() })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFiles(fileInput.files)
  })

  downloadBtn.addEventListener('click', function () {
    if (!resultBlob) return
    var ext = resultMime === 'image/jpeg' ? '.jpg' : '.png'
    var a = document.createElement('a')
    a.href = URL.createObjectURL(resultBlob)
    a.download = formatImageOutputName(currentNames[0] || 'image', suffix, ext)
    a.click()
  })

  showState('upload')
}
