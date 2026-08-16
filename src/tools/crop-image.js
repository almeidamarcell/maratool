// Free-form image cropper: a draggable selection box over the preview, kept in
// sync with numeric X / Y / width / height fields. The crop rectangle is always
// stored in natural image pixels; the on-screen box is derived from it, so a
// browser resize or a zoom never drifts the numbers.
import { setVisible, readFileAsDataURL, downloadBlob } from './tool-utils.js'

;(function () {
  var byId = function (id) { return document.getElementById(id) }

  var dropzone = byId('crp-dropzone')
  var fileInput = byId('crp-file')
  var editor = byId('crp-editor')
  var stage = byId('crp-stage')
  var imgEl = byId('crp-img')
  var boxEl = byId('crp-box')
  var xInput = byId('crp-x')
  var yInput = byId('crp-y')
  var wInput = byId('crp-w')
  var hInput = byId('crp-h')
  var ratioSelect = byId('crp-ratio')
  var formatSelect = byId('crp-format')
  var sourceDims = byId('crp-source-dims')
  var readout = byId('crp-readout')
  var positionEl = byId('crp-position')
  var errorEl = byId('crp-error')
  var downloadBtn = byId('crp-download')
  var selectAllBtn = byId('crp-select-all')
  var changeBtn = byId('crp-change')

  if (!dropzone || !editor) return

  var natW = 0
  var natH = 0
  var sourceName = 'image'
  // The <img> src is a data URL, so there is no object URL to revoke here.
  var rect = { x: 0, y: 0, w: 0, h: 0 }
  var drag = null

  function clamp(n, min, max) { return n < min ? min : n > max ? max : n }

  function showError(message) {
    if (!errorEl) return
    errorEl.textContent = message || ''
    setVisible(errorEl, !!message)
  }

  function ratio() {
    var parts = String(ratioSelect.value).split(':')
    if (parts.length !== 2) return 0
    var a = Number(parts[0])
    var b = Number(parts[1])
    if (!a || !b) return 0
    return a / b
  }

  // Displayed pixels per natural pixel. Recomputed on every read because the
  // preview is fluid and the sidebar/ad column can reflow it.
  function scale() {
    if (!natW) return 1
    var shown = imgEl.clientWidth
    return shown ? shown / natW : 1
  }

  function syncBox() {
    var s = scale()
    boxEl.style.left = rect.x * s + 'px'
    boxEl.style.top = rect.y * s + 'px'
    boxEl.style.width = rect.w * s + 'px'
    boxEl.style.height = rect.h * s + 'px'
  }

  function syncFields() {
    xInput.value = Math.round(rect.x)
    yInput.value = Math.round(rect.y)
    wInput.value = Math.round(rect.w)
    hInput.value = Math.round(rect.h)
    readout.textContent = Math.round(rect.w) + ' × ' + Math.round(rect.h)
    positionEl.textContent = Math.round(rect.x) + ', ' + Math.round(rect.y)
  }

  function syncAll() {
    syncBox()
    syncFields()
  }

  // Builds a rectangle from a fixed anchor corner to a moving point, honouring
  // the ratio lock and staying inside the image on every side.
  function rectFromAnchor(ax, ay, px, py) {
    var r = ratio()
    var dirX = px >= ax ? 1 : -1
    var dirY = py >= ay ? 1 : -1
    var maxW = dirX > 0 ? natW - ax : ax
    var maxH = dirY > 0 ? natH - ay : ay
    var w = Math.abs(px - ax)
    var h = Math.abs(py - ay)

    if (r) {
      if (h === 0 || w / h > r) h = w / r
      else w = h * r
      if (w > maxW) { w = maxW; h = w / r }
      if (h > maxH) { h = maxH; w = h * r }
      if (w > maxW) { w = maxW; h = w / r }
    } else {
      w = Math.min(w, maxW)
      h = Math.min(h, maxH)
    }

    w = Math.max(1, w)
    h = Math.max(1, h)
    return {
      x: dirX > 0 ? ax : ax - w,
      y: dirY > 0 ? ay : ay - h,
      w: w,
      h: h,
    }
  }

  function pointFromEvent(e) {
    var box = imgEl.getBoundingClientRect()
    var s = scale()
    return {
      x: clamp((e.clientX - box.left) / s, 0, natW),
      y: clamp((e.clientY - box.top) / s, 0, natH),
    }
  }

  function anchorFor(handle) {
    if (handle === 'nw') return { x: rect.x + rect.w, y: rect.y + rect.h }
    if (handle === 'ne') return { x: rect.x, y: rect.y + rect.h }
    if (handle === 'sw') return { x: rect.x + rect.w, y: rect.y }
    return { x: rect.x, y: rect.y }
  }

  function centreDefault() {
    var w = natW * 0.8
    var h = natH * 0.8
    var r = ratio()
    if (r) {
      if (w / h > r) w = h * r
      else h = w / r
    }
    rect = { x: (natW - w) / 2, y: (natH - h) / 2, w: w, h: h }
  }

  stage.addEventListener('pointerdown', function (e) {
    if (!natW) return
    var handle = e.target && e.target.getAttribute ? e.target.getAttribute('data-handle') : null
    var p = pointFromEvent(e)

    if (handle) {
      drag = { mode: 'resize', anchor: anchorFor(handle) }
    } else if (e.target === boxEl) {
      drag = { mode: 'move', dx: p.x - rect.x, dy: p.y - rect.y }
    } else {
      drag = { mode: 'resize', anchor: { x: p.x, y: p.y } }
      rect = { x: p.x, y: p.y, w: 1, h: 1 }
      syncAll()
    }

    try { stage.setPointerCapture(e.pointerId) } catch (err) { /* not supported */ }
    e.preventDefault()
  })

  stage.addEventListener('pointermove', function (e) {
    if (!drag) return
    var p = pointFromEvent(e)
    if (drag.mode === 'move') {
      rect.x = clamp(p.x - drag.dx, 0, natW - rect.w)
      rect.y = clamp(p.y - drag.dy, 0, natH - rect.h)
    } else {
      rect = rectFromAnchor(drag.anchor.x, drag.anchor.y, p.x, p.y)
    }
    syncAll()
    e.preventDefault()
  })

  function endDrag(e) {
    if (!drag) return
    drag = null
    try { stage.releasePointerCapture(e.pointerId) } catch (err) { /* ignore */ }
    syncAll()
  }
  stage.addEventListener('pointerup', endDrag)
  stage.addEventListener('pointercancel', endDrag)

  // `driver` is the field the user just edited. With a ratio locked, the other
  // side is derived from it — deriving both ways would overwrite whichever
  // number was typed last and make the height box feel broken.
  function readFields(driver) {
    if (!natW) return
    var w = clamp(Math.round(Number(wInput.value) || 1), 1, natW)
    var h = clamp(Math.round(Number(hInput.value) || 1), 1, natH)
    var r = ratio()
    if (r) {
      if (driver === 'h') {
        w = clamp(Math.round(h * r), 1, natW)
        h = clamp(Math.round(w / r), 1, natH)
      } else {
        h = clamp(Math.round(w / r), 1, natH)
        w = clamp(Math.round(h * r), 1, natW)
      }
    }
    var x = clamp(Math.round(Number(xInput.value) || 0), 0, natW - w)
    var y = clamp(Math.round(Number(yInput.value) || 0), 0, natH - h)
    rect = { x: x, y: y, w: w, h: h }
    syncAll()
  }

  ;[[xInput, 'x'], [yInput, 'y'], [wInput, 'w'], [hInput, 'h']].forEach(function (pair) {
    pair[0].addEventListener('change', function () { readFields(pair[1]) })
  })

  ratioSelect.addEventListener('change', function () {
    if (!natW) return
    var r = ratio()
    if (!r) return
    var w = rect.w
    var h = w / r
    if (h > natH) { h = natH; w = h * r }
    if (w > natW) { w = natW; h = w / r }
    rect = {
      x: clamp(rect.x, 0, natW - w),
      y: clamp(rect.y, 0, natH - h),
      w: w,
      h: h,
    }
    syncAll()
  })

  selectAllBtn.addEventListener('click', function () {
    if (!natW) return
    ratioSelect.value = 'free'
    rect = { x: 0, y: 0, w: natW, h: natH }
    syncAll()
  })

  window.addEventListener('resize', function () { if (natW) syncBox() })

  function loadImage(file) {
    if (!file || !/^image\//.test(file.type)) {
      showError('That file is not an image. Pick a JPG, PNG, WebP, GIF, or BMP.')
      return
    }
    showError('')
    sourceName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image'

    readFileAsDataURL(file).then(function (dataUrl) {
      var probe = new Image()
      probe.onload = function () {
        natW = probe.naturalWidth
        natH = probe.naturalHeight
        imgEl.src = dataUrl
        sourceDims.textContent = natW + ' × ' + natH
        setVisible(dropzone, false)
        setVisible(editor, true)
        centreDefault()
        // The <img> needs a layout pass before clientWidth is meaningful.
        requestAnimationFrame(syncAll)
      }
      probe.onerror = function () { showError('That image could not be decoded.') }
      probe.src = dataUrl
    }, function (err) { showError(err.message) })
  }

  function reset() {
    natW = 0
    natH = 0
    drag = null
    rect = { x: 0, y: 0, w: 0, h: 0 }
    imgEl.removeAttribute('src')
    fileInput.value = ''
    sourceDims.textContent = '—'
    readout.textContent = '—'
    positionEl.textContent = '—'
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
    if (!natW) return
    var w = Math.max(1, Math.round(rect.w))
    var h = Math.max(1, Math.round(rect.h))
    var x = Math.round(rect.x)
    var y = Math.round(rect.y)
    var format = formatSelect.value
    var mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
    var ext = format === 'jpeg' ? 'jpg' : format

    var canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    var ctx = canvas.getContext('2d')
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(imgEl, x, y, w, h, 0, 0, w, h)
    canvas.toBlob(function (blob) {
      if (!blob) {
        showError('This browser could not encode the crop in that format. Try PNG.')
        return
      }
      showError('')
      downloadBlob(blob, sourceName + '-crop-' + w + 'x' + h + '.' + ext)
    }, mime, mime === 'image/png' ? undefined : 0.92)
  })

  changeBtn.addEventListener('click', reset)
})()
