;(function () {
  'use strict'

  // ── DOM refs ──
  var uploadEl = document.getElementById('gm-upload')
  var fileInput = document.getElementById('gm-file')
  var browseBtn = document.getElementById('gm-browse')
  var framesSection = document.getElementById('gm-frames-section')
  var framesGrid = document.getElementById('gm-frames-grid')
  var frameCountEl = document.getElementById('gm-frame-count')
  var addMoreBtn = document.getElementById('gm-add-more')
  var clearBtn = document.getElementById('gm-clear')
  var optionsEl = document.getElementById('gm-options')
  var delayInput = document.getElementById('gm-delay')
  var fpsInput = document.getElementById('gm-fps')
  var widthInput = document.getElementById('gm-width')
  var heightInput = document.getElementById('gm-height')
  var loopSelect = document.getElementById('gm-loop')
  var makeBtn = document.getElementById('gm-make')
  var progressEl = document.getElementById('gm-progress')
  var progressFill = document.getElementById('gm-progress-fill')
  var progressText = document.getElementById('gm-progress-text')
  var resultEl = document.getElementById('gm-result')
  var previewImg = document.getElementById('gm-preview')
  var resultInfo = document.getElementById('gm-result-info')
  var downloadBtn = document.getElementById('gm-download')

  // ── State ──
  var frames = [] // { img: HTMLImageElement, file: File, delay: number }
  var gifBlobURL = null
  var gifBlob = null
  var dragSrcIdx = -1
  var addMoreInput = null

  // ── gifenc lazy load ──
  var gifencModule = null

  function loadGifenc() {
    if (gifencModule) return Promise.resolve(gifencModule)
    return import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js').then(function (mod) {
      gifencModule = mod
      return mod
    })
  }

  // ── Helpers ──

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val))
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  function getOutputDimensions() {
    var w = parseInt(widthInput.value, 10)
    var h = parseInt(heightInput.value, 10)

    if (w > 0 && h > 0) return { width: clamp(w, 1, 1920), height: clamp(h, 1, 1920) }

    // Auto: use largest frame dimensions, capped at 1920
    var maxW = 0, maxH = 0
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].img.naturalWidth > maxW) maxW = frames[i].img.naturalWidth
      if (frames[i].img.naturalHeight > maxH) maxH = frames[i].img.naturalHeight
    }

    if (w > 0) {
      var ratio = maxH / maxW
      return { width: clamp(w, 1, 1920), height: clamp(Math.round(w * ratio), 1, 1920) }
    }
    if (h > 0) {
      var ratio2 = maxW / maxH
      return { width: clamp(Math.round(h * ratio2), 1, 1920), height: clamp(h, 1, 1920) }
    }

    // Scale down if over 1920
    if (maxW > 1920 || maxH > 1920) {
      var scale = Math.min(1920 / maxW, 1920 / maxH)
      return { width: Math.round(maxW * scale), height: Math.round(maxH * scale) }
    }

    return { width: maxW || 320, height: maxH || 240 }
  }

  // ── Upload handling ──

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.match(/^image\//)) { reject('Not an image'); return }
      var reader = new FileReader()
      reader.onload = function () {
        var img = new Image()
        img.onload = function () { resolve(img) }
        img.onerror = function () { reject('Failed to load image') }
        img.src = reader.result
      }
      reader.onerror = function () { reject('Failed to read file') }
      reader.readAsDataURL(file)
    })
  }

  function addFiles(fileList) {
    var promises = []
    for (var i = 0; i < fileList.length; i++) {
      (function (file) {
        promises.push(
          loadImage(file).then(function (img) {
            return { img: img, file: file, delay: parseInt(delayInput.value, 10) || 100 }
          }).catch(function () { return null })
        )
      })(fileList[i])
    }

    Promise.all(promises).then(function (results) {
      for (var j = 0; j < results.length; j++) {
        if (results[j]) frames.push(results[j])
      }
      renderFrames()
      showEditor()
    })
  }

  function showEditor() {
    if (frames.length === 0) {
      uploadEl.style.display = 'block'
      framesSection.style.display = 'none'
      optionsEl.style.display = 'none'
      resultEl.style.display = 'none'
      makeBtn.disabled = true
      return
    }

    uploadEl.style.display = 'none'
    framesSection.style.display = 'block'
    optionsEl.style.display = 'block'
    makeBtn.disabled = frames.length < 2
  }

  // ── Frame rendering ──

  function renderFrames() {
    framesGrid.innerHTML = ''
    frameCountEl.textContent = '(' + frames.length + ')'

    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i]
      var el = document.createElement('div')
      el.className = 'gm-frame'
      el.draggable = true
      el.dataset.idx = i

      var img = document.createElement('img')
      img.className = 'gm-frame-img'
      img.src = frame.img.src
      img.alt = 'Frame ' + (i + 1)
      el.appendChild(img)

      var info = document.createElement('div')
      info.className = 'gm-frame-info'
      var num = document.createElement('span')
      num.className = 'gm-frame-num'
      num.textContent = '#' + (i + 1)
      info.appendChild(num)
      var del = document.createElement('button')
      del.className = 'gm-frame-del'
      del.textContent = '\u00d7'
      del.title = 'Remove frame'
      del.dataset.idx = i
      info.appendChild(del)
      el.appendChild(info)

      var delayRow = document.createElement('div')
      delayRow.className = 'gm-frame-delay-row'
      var delayEl = document.createElement('input')
      delayEl.className = 'gm-frame-delay'
      delayEl.type = 'number'
      delayEl.min = '20'
      delayEl.max = '5000'
      delayEl.step = '10'
      delayEl.value = frame.delay
      delayEl.dataset.idx = i
      delayRow.appendChild(delayEl)
      var unit = document.createElement('span')
      unit.className = 'gm-frame-delay-unit'
      unit.textContent = 'ms'
      delayRow.appendChild(unit)
      el.appendChild(delayRow)

      // Drag events
      el.addEventListener('dragstart', onDragStart)
      el.addEventListener('dragover', onDragOver)
      el.addEventListener('dragenter', onDragEnter)
      el.addEventListener('dragleave', onDragLeave)
      el.addEventListener('drop', onDrop)
      el.addEventListener('dragend', onDragEnd)

      framesGrid.appendChild(el)
    }

    makeBtn.disabled = frames.length < 2
  }

  // ── Drag & drop reorder ──

  function getFrameEl(target) {
    while (target && !target.classList.contains('gm-frame')) {
      target = target.parentElement
    }
    return target
  }

  function onDragStart(e) {
    var el = getFrameEl(e.target)
    if (!el) return
    dragSrcIdx = parseInt(el.dataset.idx, 10)
    el.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dragSrcIdx)
  }

  function onDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDragEnter(e) {
    var el = getFrameEl(e.target)
    if (el) el.classList.add('drag-over')
  }

  function onDragLeave(e) {
    var el = getFrameEl(e.target)
    if (el) el.classList.remove('drag-over')
  }

  function onDrop(e) {
    e.preventDefault()
    var el = getFrameEl(e.target)
    if (!el) return
    el.classList.remove('drag-over')
    var destIdx = parseInt(el.dataset.idx, 10)
    if (dragSrcIdx === destIdx || dragSrcIdx < 0) return

    var moved = frames.splice(dragSrcIdx, 1)[0]
    frames.splice(destIdx, 0, moved)
    renderFrames()
  }

  function onDragEnd() {
    dragSrcIdx = -1
    var items = framesGrid.querySelectorAll('.gm-frame')
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('dragging', 'drag-over')
    }
  }

  // ── GIF encoding ──

  function makeGIF() {
    if (frames.length < 2) return

    makeBtn.disabled = true
    progressEl.style.display = 'block'
    progressFill.style.width = '0%'
    progressText.textContent = 'Loading encoder...'
    resultEl.style.display = 'none'

    if (gifBlobURL) { URL.revokeObjectURL(gifBlobURL); gifBlobURL = null }

    loadGifenc().then(function (mod) {
      var GIFEncoder = mod.GIFEncoder
      var quantize = mod.quantize
      var applyPalette = mod.applyPalette

      var dim = getOutputDimensions()
      var w = dim.width
      var h = dim.height
      var loop = parseInt(loopSelect.value, 10)

      var gif = GIFEncoder()
      var canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      var ctx = canvas.getContext('2d')

      for (var i = 0; i < frames.length; i++) {
        progressText.textContent = 'Encoding frame ' + (i + 1) + ' / ' + frames.length + '...'
        progressFill.style.width = Math.round(((i + 1) / frames.length) * 100) + '%'

        // Draw frame to canvas
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Fit image maintaining aspect ratio, centered
        var img = frames[i].img
        var iw = img.naturalWidth
        var ih = img.naturalHeight
        var scale = Math.min(w / iw, h / ih)
        var dw = Math.round(iw * scale)
        var dh = Math.round(ih * scale)
        var dx = Math.round((w - dw) / 2)
        var dy = Math.round((h - dh) / 2)
        ctx.drawImage(img, dx, dy, dw, dh)

        var imageData = ctx.getImageData(0, 0, w, h)
        var data = imageData.data

        // Convert RGBA to RGB array for gifenc
        var rgb = new Uint8Array(w * h * 3)
        for (var p = 0, j = 0; p < data.length; p += 4, j += 3) {
          rgb[j] = data[p]
          rgb[j + 1] = data[p + 1]
          rgb[j + 2] = data[p + 2]
        }

        var palette = quantize(rgb, 256, { format: 'rgb333' })
        var index = applyPalette(rgb, palette, 'rgb333')

        var delay = Math.round(frames[i].delay / 10) // gifenc uses centiseconds
        if (delay < 2) delay = 2

        gif.writeFrame(index, w, h, {
          palette: palette,
          delay: delay,
          repeat: loop === 0 ? 0 : loop,
          dispose: 2
        })
      }

      gif.finish()

      var bytes = gif.bytes()
      gifBlob = new Blob([bytes], { type: 'image/gif' })
      gifBlobURL = URL.createObjectURL(gifBlob)

      previewImg.src = gifBlobURL
      resultInfo.textContent = w + ' \u00d7 ' + h + '  \u2014  ' + frames.length + ' frames  \u2014  ' + formatSize(gifBlob.size)

      progressEl.style.display = 'none'
      resultEl.style.display = 'block'
      makeBtn.disabled = false
    }).catch(function (err) {
      progressText.textContent = 'Error: ' + (err.message || err)
      makeBtn.disabled = false
    })
  }

  // ── Events ──

  // Upload zone
  browseBtn.addEventListener('click', function (e) {
    e.stopPropagation()
    fileInput.click()
  })

  uploadEl.addEventListener('click', function () {
    fileInput.click()
  })

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) addFiles(fileInput.files)
    fileInput.value = ''
  })

  uploadEl.addEventListener('dragover', function (e) {
    e.preventDefault()
    uploadEl.classList.add('dragover')
  })

  uploadEl.addEventListener('dragleave', function () {
    uploadEl.classList.remove('dragover')
  })

  uploadEl.addEventListener('drop', function (e) {
    e.preventDefault()
    uploadEl.classList.remove('dragover')
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  })

  // Add more
  addMoreBtn.addEventListener('click', function () {
    if (!addMoreInput) {
      addMoreInput = document.createElement('input')
      addMoreInput.type = 'file'
      addMoreInput.accept = 'image/*'
      addMoreInput.multiple = true
      addMoreInput.style.display = 'none'
      document.body.appendChild(addMoreInput)
      addMoreInput.addEventListener('change', function () {
        if (addMoreInput.files.length > 0) addFiles(addMoreInput.files)
        addMoreInput.value = ''
      })
    }
    addMoreInput.click()
  })

  // Clear
  clearBtn.addEventListener('click', function () {
    frames = []
    if (gifBlobURL) { URL.revokeObjectURL(gifBlobURL); gifBlobURL = null }
    gifBlob = null
    resultEl.style.display = 'none'
    renderFrames()
    showEditor()
  })

  // Delete frame (event delegation)
  framesGrid.addEventListener('click', function (e) {
    if (e.target.classList.contains('gm-frame-del')) {
      var idx = parseInt(e.target.dataset.idx, 10)
      frames.splice(idx, 1)
      renderFrames()
      if (frames.length === 0) showEditor()
    }
  })

  // Per-frame delay
  framesGrid.addEventListener('change', function (e) {
    if (e.target.classList.contains('gm-frame-delay')) {
      var idx = parseInt(e.target.dataset.idx, 10)
      var val = parseInt(e.target.value, 10)
      if (val >= 20 && val <= 5000 && frames[idx]) {
        frames[idx].delay = val
      }
    }
  })

  // FPS ↔ Delay sync
  var syncing = false
  delayInput.addEventListener('input', function () {
    if (syncing) return
    syncing = true
    var ms = parseInt(delayInput.value, 10)
    if (ms > 0) {
      fpsInput.value = Math.round(1000 / ms)
      // Update all frame delays
      for (var i = 0; i < frames.length; i++) {
        frames[i].delay = ms
      }
      // Update visible delay inputs
      var inputs = framesGrid.querySelectorAll('.gm-frame-delay')
      for (var j = 0; j < inputs.length; j++) {
        inputs[j].value = ms
      }
    }
    syncing = false
  })

  fpsInput.addEventListener('input', function () {
    if (syncing) return
    syncing = true
    var fps = parseInt(fpsInput.value, 10)
    if (fps > 0) {
      var ms = Math.round(1000 / fps)
      delayInput.value = ms
      for (var i = 0; i < frames.length; i++) {
        frames[i].delay = ms
      }
      var inputs = framesGrid.querySelectorAll('.gm-frame-delay')
      for (var j = 0; j < inputs.length; j++) {
        inputs[j].value = ms
      }
    }
    syncing = false
  })

  // Make GIF
  makeBtn.addEventListener('click', makeGIF)

  // Download
  downloadBtn.addEventListener('click', function () {
    if (!gifBlobURL) return
    var a = document.createElement('a')
    a.href = gifBlobURL
    a.download = 'animated.gif'
    a.click()
  })
})()
