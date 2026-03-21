(function () {
  var uploadEl = document.getElementById('sc-upload')
  var fileInput = document.getElementById('sc-file')
  var browseBtn = document.getElementById('sc-browse')
  var sourceEl = document.getElementById('sc-source')
  var sourceImg = document.getElementById('sc-source-img')
  var sourceInfo = document.getElementById('sc-source-info')
  var changeBtn = document.getElementById('sc-change')
  var presetsEl = document.getElementById('sc-presets')
  var presetGrid = document.getElementById('sc-preset-grid')
  var cropWrap = document.getElementById('sc-crop-wrap')
  var cropContainer = document.getElementById('sc-crop-container')
  var cropImg = document.getElementById('sc-crop-img')
  var cropOverlay = document.getElementById('sc-crop-overlay')
  var cropInfo = document.getElementById('sc-crop-info')
  var downloadBtn = document.getElementById('sc-download')

  var presets = [
    { name: 'Instagram Post', dims: '1080\u00d71080', w: 1080, h: 1080, ratio: 1 / 1 },
    { name: 'Instagram Story', dims: '1080\u00d71920', w: 1080, h: 1920, ratio: 9 / 16 },
    { name: 'Instagram Portrait', dims: '1080\u00d71350', w: 1080, h: 1350, ratio: 4 / 5 },
    { name: 'Twitter/X Header', dims: '1500\u00d7500', w: 1500, h: 500, ratio: 3 / 1 },
    { name: 'Facebook Cover', dims: '820\u00d7312', w: 820, h: 312, ratio: 820 / 312 },
    { name: 'Bluesky Post', dims: '4:3', w: 1200, h: 900, ratio: 4 / 3 },
    { name: 'YouTube Thumbnail', dims: '1280\u00d7720', w: 1280, h: 720, ratio: 16 / 9 },
    { name: 'LinkedIn Banner', dims: '1584\u00d7396', w: 1584, h: 396, ratio: 4 / 1 },
  ]

  var baseImg = null
  var activePreset = null
  // Crop state in image coordinates
  var cropX = 0
  var cropY = 0
  var cropW = 0
  var cropH = 0
  // Drag state
  var dragging = false
  var dragStartX = 0
  var dragStartY = 0
  var dragCropStartX = 0
  var dragCropStartY = 0

  // ── Build preset buttons ──
  function buildPresets() {
    presetGrid.innerHTML = ''
    for (var i = 0; i < presets.length; i++) {
      (function (p, idx) {
        var btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'sc-preset-btn' + (idx === 0 ? ' active' : '')
        btn.innerHTML = p.name + '<span class="sc-preset-dims">' + p.dims + '</span>'
        btn.addEventListener('click', function () {
          var btns = presetGrid.querySelectorAll('.sc-preset-btn')
          for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active')
          btn.classList.add('active')
          activePreset = p
          fitCrop()
          updateOverlay()
        })
        presetGrid.appendChild(btn)
      })(presets[i], i)
    }
    activePreset = presets[0]
  }

  buildPresets()

  // ── File handling ──

  function handleFile(file) {
    if (!file) return
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) return
    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () {
        baseImg = img
        sourceImg.src = img.src
        sourceInfo.textContent = img.naturalWidth + ' \u00d7 ' + img.naturalHeight + ' \u2014 ' + file.name
        cropImg.src = img.src
        uploadEl.style.display = 'none'
        sourceEl.style.display = 'flex'
        presetsEl.style.display = 'block'
        cropWrap.style.display = 'block'
        fitCrop()
        // Wait for image to render before updating overlay
        cropImg.onload = function () {
          updateOverlay()
        }
        if (cropImg.complete) updateOverlay()
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    baseImg = null
    uploadEl.style.display = 'block'
    sourceEl.style.display = 'none'
    presetsEl.style.display = 'none'
    cropWrap.style.display = 'none'
    fileInput.value = ''
  }

  // ── Crop logic ──

  function fitCrop() {
    if (!baseImg || !activePreset) return
    var imgW = baseImg.naturalWidth
    var imgH = baseImg.naturalHeight
    var ratio = activePreset.ratio

    // Fit crop rect into image
    if (imgW / imgH > ratio) {
      // Image is wider than target ratio — fit by height
      cropH = imgH
      cropW = Math.round(imgH * ratio)
    } else {
      // Image is taller — fit by width
      cropW = imgW
      cropH = Math.round(imgW / ratio)
    }
    // Center crop
    cropX = Math.round((imgW - cropW) / 2)
    cropY = Math.round((imgH - cropH) / 2)
  }

  function updateOverlay() {
    if (!baseImg || !cropImg.complete) return
    var displayW = cropImg.clientWidth
    var displayH = cropImg.clientHeight
    if (displayW === 0 || displayH === 0) return
    var scaleX = displayW / baseImg.naturalWidth
    var scaleY = displayH / baseImg.naturalHeight

    cropOverlay.style.left = (cropX * scaleX) + 'px'
    cropOverlay.style.top = (cropY * scaleY) + 'px'
    cropOverlay.style.width = (cropW * scaleX) + 'px'
    cropOverlay.style.height = (cropH * scaleY) + 'px'

    var outW = activePreset.w
    var outH = activePreset.h
    cropInfo.textContent = 'Output: ' + outW + '\u00d7' + outH + ' px (' + activePreset.name + ')'
  }

  function clampCrop() {
    var imgW = baseImg.naturalWidth
    var imgH = baseImg.naturalHeight
    if (cropX < 0) cropX = 0
    if (cropY < 0) cropY = 0
    if (cropX + cropW > imgW) cropX = imgW - cropW
    if (cropY + cropH > imgH) cropY = imgH - cropH
  }

  // ── Drag to reposition ──

  function getDisplayScale() {
    return {
      x: baseImg.naturalWidth / cropImg.clientWidth,
      y: baseImg.naturalHeight / cropImg.clientHeight
    }
  }

  cropOverlay.addEventListener('mousedown', function (e) {
    e.preventDefault()
    dragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    dragCropStartX = cropX
    dragCropStartY = cropY
  })

  document.addEventListener('mousemove', function (e) {
    if (!dragging) return
    var scale = getDisplayScale()
    cropX = dragCropStartX + Math.round((e.clientX - dragStartX) * scale.x)
    cropY = dragCropStartY + Math.round((e.clientY - dragStartY) * scale.y)
    clampCrop()
    updateOverlay()
  })

  document.addEventListener('mouseup', function () { dragging = false })

  // Touch support
  cropOverlay.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return
    e.preventDefault()
    dragging = true
    dragStartX = e.touches[0].clientX
    dragStartY = e.touches[0].clientY
    dragCropStartX = cropX
    dragCropStartY = cropY
  }, { passive: false })

  document.addEventListener('touchmove', function (e) {
    if (!dragging || e.touches.length !== 1) return
    var scale = getDisplayScale()
    cropX = dragCropStartX + Math.round((e.touches[0].clientX - dragStartX) * scale.x)
    cropY = dragCropStartY + Math.round((e.touches[0].clientY - dragStartY) * scale.y)
    clampCrop()
    updateOverlay()
  }, { passive: false })

  document.addEventListener('touchend', function () { dragging = false })

  // ── Upload events ──

  browseBtn.addEventListener('click', function (e) {
    e.stopPropagation()
    fileInput.click()
  })
  uploadEl.addEventListener('click', function () { fileInput.click() })
  fileInput.addEventListener('change', function () { handleFile(fileInput.files[0]) })
  uploadEl.addEventListener('dragover', function (e) {
    e.preventDefault()
    uploadEl.classList.add('dragover')
  })
  uploadEl.addEventListener('dragleave', function () { uploadEl.classList.remove('dragover') })
  uploadEl.addEventListener('drop', function (e) {
    e.preventDefault()
    uploadEl.classList.remove('dragover')
    handleFile(e.dataTransfer.files[0])
  })

  changeBtn.addEventListener('click', reset)

  // ── Download ──

  downloadBtn.addEventListener('click', function () {
    if (!baseImg || !activePreset) return
    var outW = activePreset.w
    var outH = activePreset.h
    var c = document.createElement('canvas')
    c.width = outW
    c.height = outH
    var cx = c.getContext('2d')
    cx.imageSmoothingEnabled = true
    cx.imageSmoothingQuality = 'high'
    cx.drawImage(baseImg, cropX, cropY, cropW, cropH, 0, 0, outW, outH)
    c.toBlob(function (blob) {
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = activePreset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  })

  // Resize handler
  window.addEventListener('resize', function () {
    if (baseImg) updateOverlay()
  })
})()
