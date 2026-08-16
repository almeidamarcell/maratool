// Rotate and flip an image on a canvas. The output canvas is sized to the
// bounding box of the rotated rectangle, so a 37 degree turn keeps all four
// corners instead of cropping them.
import { setVisible, readFileAsDataURL, downloadBlob } from './tool-utils.js'

;(function () {
  var byId = function (id) { return document.getElementById(id) }

  var dropzone = byId('rot-dropzone')
  var fileInput = byId('rot-file')
  var editor = byId('rot-editor')
  var canvas = byId('rot-canvas')
  var leftBtn = byId('rot-left')
  var rightBtn = byId('rot-right')
  var halfBtn = byId('rot-180')
  var flipHBtn = byId('rot-flip-h')
  var flipVBtn = byId('rot-flip-v')
  var resetBtn = byId('rot-reset')
  var angleInput = byId('rot-angle')
  var angleVal = byId('rot-angle-val')
  var formatSelect = byId('rot-format')
  var bgSelect = byId('rot-bg')
  var origDims = byId('rot-orig-dims')
  var newDims = byId('rot-new-dims')
  var transformEl = byId('rot-transform')
  var errorEl = byId('rot-error')
  var downloadBtn = byId('rot-download')
  var changeBtn = byId('rot-change')

  if (!dropzone || !editor) return

  // Anything larger than this is drawn scaled down for the on-screen preview.
  // The download always re-renders at full resolution.
  var PREVIEW_MAX = 900

  var sourceImg = null
  var sourceName = 'image'
  var natW = 0
  var natH = 0
  var angle = 0
  var flipH = false
  var flipV = false

  function showError(message) {
    if (!errorEl) return
    errorEl.textContent = message || ''
    setVisible(errorEl, !!message)
  }

  function normalise(deg) {
    var a = ((deg + 180) % 360 + 360) % 360 - 180
    return a === -180 ? 180 : a
  }

  function outputSize(scale) {
    var rad = angle * Math.PI / 180
    var sin = Math.abs(Math.sin(rad))
    var cos = Math.abs(Math.cos(rad))
    var w = natW * scale
    var h = natH * scale
    return {
      w: Math.max(1, Math.round(w * cos + h * sin)),
      h: Math.max(1, Math.round(w * sin + h * cos)),
    }
  }

  function background() {
    var value = bgSelect.value
    // JPEG has no alpha channel; a transparent request would come out black.
    if (value === 'transparent' && formatSelect.value === 'jpeg') return '#ffffff'
    return value === 'transparent' ? null : value
  }

  function draw(target, scale) {
    var size = outputSize(scale)
    target.width = size.w
    target.height = size.h
    var ctx = target.getContext('2d')
    var bg = background()
    if (bg) {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, size.w, size.h)
    }
    ctx.save()
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.translate(size.w / 2, size.h / 2)
    ctx.rotate(angle * Math.PI / 180)
    // Applied after the rotation so the mirror runs along the image's own
    // axes, which is what "flip then turn" looks like to a user.
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.drawImage(sourceImg, -natW * scale / 2, -natH * scale / 2, natW * scale, natH * scale)
    ctx.restore()
    return size
  }

  function describeTransform() {
    var bits = []
    bits.push(angle + '°')
    if (flipH) bits.push('flip H')
    if (flipV) bits.push('flip V')
    return bits.join(' · ')
  }

  function update() {
    if (!sourceImg) return
    var previewScale = Math.min(1, PREVIEW_MAX / Math.max(natW, natH))
    draw(canvas, previewScale)
    var full = outputSize(1)
    newDims.textContent = full.w + ' × ' + full.h
    transformEl.textContent = describeTransform()
    angleVal.textContent = angle + '°'
    angleInput.value = angle
    flipHBtn.classList.toggle('active', flipH)
    flipVBtn.classList.toggle('active', flipV)
  }

  function setAngle(deg) {
    angle = normalise(deg)
    update()
  }

  leftBtn.addEventListener('click', function () { setAngle(angle - 90) })
  rightBtn.addEventListener('click', function () { setAngle(angle + 90) })
  halfBtn.addEventListener('click', function () { setAngle(angle + 180) })
  flipHBtn.addEventListener('click', function () { flipH = !flipH; update() })
  flipVBtn.addEventListener('click', function () { flipV = !flipV; update() })
  resetBtn.addEventListener('click', function () {
    angle = 0
    flipH = false
    flipV = false
    update()
  })
  angleInput.addEventListener('input', function () { setAngle(Number(angleInput.value) || 0) })
  formatSelect.addEventListener('change', update)
  bgSelect.addEventListener('change', update)

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
        angle = 0
        flipH = false
        flipV = false
        origDims.textContent = natW + ' × ' + natH
        setVisible(dropzone, false)
        setVisible(editor, true)
        update()
      }
      img.onerror = function () { showError('That image could not be decoded.') }
      img.src = dataUrl
    }, function (err) { showError(err.message) })
  }

  function reset() {
    sourceImg = null
    natW = 0
    natH = 0
    angle = 0
    flipH = false
    flipV = false
    canvas.width = 0
    canvas.height = 0
    fileInput.value = ''
    origDims.textContent = '—'
    newDims.textContent = '—'
    transformEl.textContent = '—'
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

  downloadBtn.addEventListener('click', function () {
    if (!sourceImg) return
    var format = formatSelect.value
    var mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
    var ext = format === 'jpeg' ? 'jpg' : format
    var full = document.createElement('canvas')
    var size = draw(full, 1)
    full.toBlob(function (blob) {
      if (!blob) {
        showError('This browser could not encode the result in that format. Try PNG.')
        return
      }
      showError('')
      downloadBlob(blob, sourceName + '-rotated-' + size.w + 'x' + size.h + '.' + ext)
    }, mime, mime === 'image/png' ? undefined : 0.92)
  })

  changeBtn.addEventListener('click', reset)
})()
