// Resize an image to an exact pixel size (or a percentage of the original).
// Everything is decoded, redrawn, and re-encoded on a canvas in the browser.
import { setVisible, readFileAsDataURL, formatSize, downloadBlob } from './tool-utils.js'

;(function () {
  var byId = function (id) { return document.getElementById(id) }

  var dropzone = byId('rsz-dropzone')
  var fileInput = byId('rsz-file')
  var editor = byId('rsz-editor')
  var previewImg = byId('rsz-preview')
  var modeSelect = byId('rsz-mode')
  var pxFields = byId('rsz-px-fields')
  var pctFields = byId('rsz-pct-fields')
  var widthInput = byId('rsz-width')
  var heightInput = byId('rsz-height')
  var lockInput = byId('rsz-lock')
  var presetSelect = byId('rsz-preset')
  var percentInput = byId('rsz-percent')
  var percentVal = byId('rsz-percent-val')
  var formatSelect = byId('rsz-format')
  var qualityField = byId('rsz-quality-field')
  var qualityInput = byId('rsz-quality')
  var qualityVal = byId('rsz-quality-val')
  var origDims = byId('rsz-orig-dims')
  var newDims = byId('rsz-new-dims')
  var estSize = byId('rsz-est-size')
  var errorEl = byId('rsz-error')
  var downloadBtn = byId('rsz-download')
  var changeBtn = byId('rsz-change')

  if (!dropzone || !editor) return

  var MAX_SIDE = 10000
  var sourceImg = null
  var sourceName = 'image'
  var natW = 0
  var natH = 0
  var outputBlob = null
  // Every render swaps previewImg.src for a fresh object URL. Without the
  // revoke below, dragging the percent slider leaks one blob per frame.
  var previewUrl = null
  var renderSeq = 0
  var renderTimer = null

  function clampInt(value, min, max, fallback) {
    var n = Math.round(Number(value))
    if (!isFinite(n) || n < min) return fallback != null ? fallback : min
    if (n > max) return max
    return n
  }

  function showError(message) {
    if (!errorEl) return
    errorEl.textContent = message || ''
    setVisible(errorEl, !!message)
  }

  function mimeFor(value) {
    if (value === 'png') return 'image/png'
    if (value === 'webp') return 'image/webp'
    return 'image/jpeg'
  }

  function extFor(value) {
    if (value === 'png') return 'png'
    if (value === 'webp') return 'webp'
    return 'jpg'
  }

  function targetDims() {
    if (modeSelect.value === 'pct') {
      var pct = clampInt(percentInput.value, 1, 200, 100)
      return {
        w: Math.max(1, Math.min(MAX_SIDE, Math.round(natW * pct / 100))),
        h: Math.max(1, Math.min(MAX_SIDE, Math.round(natH * pct / 100))),
      }
    }
    return {
      w: clampInt(widthInput.value, 1, MAX_SIDE, natW),
      h: clampInt(heightInput.value, 1, MAX_SIDE, natH),
    }
  }

  function schedule() {
    clearTimeout(renderTimer)
    renderTimer = setTimeout(render, 180)
  }

  function render() {
    if (!sourceImg) return
    var dims = targetDims()
    newDims.textContent = dims.w + ' × ' + dims.h
    estSize.textContent = 'calculating…'

    var format = formatSelect.value
    var mime = mimeFor(format)
    var quality = format === 'png' ? undefined : clampInt(qualityInput.value, 10, 100, 90) / 100

    var canvas = document.createElement('canvas')
    canvas.width = dims.w
    canvas.height = dims.h
    var ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, dims.w, dims.h)
    }
    ctx.drawImage(sourceImg, 0, 0, dims.w, dims.h)

    // A slow encode from an earlier keystroke must not overwrite a newer one.
    var seq = ++renderSeq
    canvas.toBlob(function (blob) {
      if (seq !== renderSeq) return
      if (!blob) {
        outputBlob = null
        estSize.textContent = '—'
        showError('This browser could not encode the image in that format. Try PNG or JPEG.')
        return
      }
      showError('')
      outputBlob = blob
      estSize.textContent = formatSize(blob.size)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      previewUrl = URL.createObjectURL(blob)
      previewImg.src = previewUrl
    }, mime, quality)
  }

  function syncModeFields() {
    var pct = modeSelect.value === 'pct'
    setVisible(pxFields, !pct)
    setVisible(pctFields, pct)
  }

  function syncQualityField() {
    setVisible(qualityField, formatSelect.value !== 'png')
  }

  function loadImage(file) {
    if (!file || !/^image\//.test(file.type)) {
      showError('That file is not an image. Pick a JPG, PNG, WebP, GIF, or BMP.')
      return
    }
    showError('')
    sourceName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image'

    readFileAsDataURL(file).then(function (dataUrl) {
      var img = new Image()
      img.onload = function () {
        sourceImg = img
        natW = img.naturalWidth
        natH = img.naturalHeight
        origDims.textContent = natW + ' × ' + natH
        widthInput.value = natW
        heightInput.value = natH
        presetSelect.value = ''
        percentInput.value = 50
        percentVal.textContent = '50%'
        setVisible(dropzone, false)
        setVisible(editor, true)
        syncModeFields()
        syncQualityField()
        render()
      }
      img.onerror = function () { showError('That image could not be decoded.') }
      img.src = dataUrl
    }, function (err) { showError(err.message) })
  }

  function reset() {
    sourceImg = null
    outputBlob = null
    natW = 0
    natH = 0
    clearTimeout(renderTimer)
    renderSeq++
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null }
    previewImg.removeAttribute('src')
    fileInput.value = ''
    origDims.textContent = '—'
    newDims.textContent = '—'
    estSize.textContent = '—'
    showError('')
    setVisible(editor, false)
    setVisible(dropzone, true)
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    if (e.dataTransfer && e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) loadImage(fileInput.files[0])
  })

  widthInput.addEventListener('input', function () {
    presetSelect.value = ''
    if (lockInput.checked && natW) {
      var w = clampInt(widthInput.value, 1, MAX_SIDE, natW)
      heightInput.value = Math.max(1, Math.round(w * natH / natW))
    }
    schedule()
  })

  heightInput.addEventListener('input', function () {
    presetSelect.value = ''
    if (lockInput.checked && natH) {
      var h = clampInt(heightInput.value, 1, MAX_SIDE, natH)
      widthInput.value = Math.max(1, Math.round(h * natW / natH))
    }
    schedule()
  })

  lockInput.addEventListener('change', function () {
    if (lockInput.checked && natW) {
      var w = clampInt(widthInput.value, 1, MAX_SIDE, natW)
      heightInput.value = Math.max(1, Math.round(w * natH / natW))
      schedule()
    }
  })

  presetSelect.addEventListener('change', function () {
    var parts = presetSelect.value.split('x')
    if (parts.length !== 2) return
    widthInput.value = parts[0]
    heightInput.value = parts[1]
    schedule()
  })

  percentInput.addEventListener('input', function () {
    percentVal.textContent = percentInput.value + '%'
    schedule()
  })

  modeSelect.addEventListener('change', function () {
    syncModeFields()
    schedule()
  })

  formatSelect.addEventListener('change', function () {
    syncQualityField()
    schedule()
  })

  qualityInput.addEventListener('input', function () {
    qualityVal.textContent = qualityInput.value + '%'
    schedule()
  })

  downloadBtn.addEventListener('click', function () {
    if (!outputBlob) return
    var dims = targetDims()
    downloadBlob(outputBlob, sourceName + '-' + dims.w + 'x' + dims.h + '.' + extFor(formatSelect.value))
  })

  changeBtn.addEventListener('click', reset)

  qualityVal.textContent = qualityInput.value + '%'
  syncQualityField()
  syncModeFields()
})()
