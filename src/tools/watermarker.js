(function () {
  var uploadEl = document.getElementById('wm-upload')
  var fileInput = document.getElementById('wm-file')
  var browseBtn = document.getElementById('wm-browse')
  var sourceEl = document.getElementById('wm-source')
  var sourceImg = document.getElementById('wm-source-img')
  var sourceInfo = document.getElementById('wm-source-info')
  var changeBtn = document.getElementById('wm-change')
  var controlsEl = document.getElementById('wm-controls')
  var previewWrap = document.getElementById('wm-preview-wrap')
  var canvas = document.getElementById('wm-canvas')
  var ctx = canvas.getContext('2d')
  var downloadBtn = document.getElementById('wm-download')

  // Type toggle
  var typeTextBtn = document.getElementById('wm-type-text')
  var typeImageBtn = document.getElementById('wm-type-image')
  var textOpts = document.getElementById('wm-text-opts')
  var imageOpts = document.getElementById('wm-image-opts')

  // Text options
  var textInput = document.getElementById('wm-text-input')
  var fontSizeInput = document.getElementById('wm-font-size')
  var colorInput = document.getElementById('wm-color')

  // Image watermark options
  var wmFileInput = document.getElementById('wm-wm-file')
  var wmBrowseBtn = document.getElementById('wm-wm-browse')
  var wmNameEl = document.getElementById('wm-wm-name')
  var wmScaleInput = document.getElementById('wm-wm-scale')
  var wmScaleVal = document.getElementById('wm-wm-scale-val')

  // Shared options
  var opacityInput = document.getElementById('wm-opacity')
  var opacityVal = document.getElementById('wm-opacity-val')
  var positionGrid = document.getElementById('wm-position-grid')
  var tileBtn = document.getElementById('wm-tile-btn')
  var rotationInput = document.getElementById('wm-rotation')
  var rotationVal = document.getElementById('wm-rotation-val')

  var baseImg = null
  var wmImg = null
  var wmType = 'text' // 'text' | 'image'
  var position = 'mc'
  var isTile = false

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
        uploadEl.style.display = 'none'
        sourceEl.style.display = 'flex'
        controlsEl.style.display = 'block'
        previewWrap.style.display = 'block'
        render()
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  function handleWmFile(file) {
    if (!file) return
    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () {
        wmImg = img
        wmNameEl.textContent = file.name
        render()
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    baseImg = null
    wmImg = null
    uploadEl.style.display = 'block'
    sourceEl.style.display = 'none'
    controlsEl.style.display = 'none'
    previewWrap.style.display = 'none'
    fileInput.value = ''
    wmFileInput.value = ''
    wmNameEl.textContent = ''
  }

  // ── Rendering ──

  function render() {
    if (!baseImg) return
    var w = baseImg.naturalWidth
    var h = baseImg.naturalHeight
    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(baseImg, 0, 0)

    var opacity = parseInt(opacityInput.value, 10) / 100
    var angle = parseInt(rotationInput.value, 10) * Math.PI / 180

    ctx.save()
    ctx.globalAlpha = opacity

    if (wmType === 'text') {
      renderTextWatermark(w, h, angle)
    } else if (wmType === 'image' && wmImg) {
      renderImageWatermark(w, h, angle)
    }

    ctx.restore()
  }

  function renderTextWatermark(w, h, angle) {
    var text = textInput.value || 'Watermark'
    var fontSize = parseInt(fontSizeInput.value, 10) || 48
    var color = colorInput.value

    ctx.font = 'bold ' + fontSize + 'px sans-serif'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    var metrics = ctx.measureText(text)
    var textW = metrics.width
    var textH = fontSize

    if (isTile) {
      drawTiled(w, h, textW, textH, angle, function (x, y) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      })
    } else {
      var pos = getPosition(w, h, textW, textH)
      ctx.save()
      ctx.translate(pos.x, pos.y)
      ctx.rotate(angle)
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
  }

  function renderImageWatermark(w, h, angle) {
    var scale = parseInt(wmScaleInput.value, 10) / 100
    var wmW = wmImg.naturalWidth * scale * (w / wmImg.naturalWidth) * scale
    // Keep aspect ratio, scale relative to base image width
    var targetW = w * (parseInt(wmScaleInput.value, 10) / 100)
    var ratio = wmImg.naturalHeight / wmImg.naturalWidth
    var targetH = targetW * ratio

    if (isTile) {
      drawTiled(w, h, targetW, targetH, angle, function (x, y) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.drawImage(wmImg, -targetW / 2, -targetH / 2, targetW, targetH)
        ctx.restore()
      })
    } else {
      var pos = getPosition(w, h, targetW, targetH)
      ctx.save()
      ctx.translate(pos.x, pos.y)
      ctx.rotate(angle)
      ctx.drawImage(wmImg, -targetW / 2, -targetH / 2, targetW, targetH)
      ctx.restore()
    }
  }

  function getPosition(canvasW, canvasH, wmW, wmH) {
    var pad = Math.min(canvasW, canvasH) * 0.05
    var x, y
    var row = position[0] // t, m, b
    var col = position[1] // l, c, r

    if (col === 'l') x = pad + wmW / 2
    else if (col === 'r') x = canvasW - pad - wmW / 2
    else x = canvasW / 2

    if (row === 't') y = pad + wmH / 2
    else if (row === 'b') y = canvasH - pad - wmH / 2
    else y = canvasH / 2

    return { x: x, y: y }
  }

  function drawTiled(canvasW, canvasH, wmW, wmH, angle, drawFn) {
    var spacingX = wmW * 1.5
    var spacingY = wmH * 2.5
    if (spacingX < 50) spacingX = 50
    if (spacingY < 50) spacingY = 50

    // Expand bounds to cover rotated area
    var diag = Math.sqrt(canvasW * canvasW + canvasH * canvasH)
    var startX = -diag / 2
    var startY = -diag / 2
    var endX = canvasW + diag / 2
    var endY = canvasH + diag / 2

    for (var y = startY; y < endY; y += spacingY) {
      for (var x = startX; x < endX; x += spacingX) {
        drawFn(x, y)
      }
    }
  }

  // ── Events ──

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

  // Type toggle
  typeTextBtn.addEventListener('click', function () {
    wmType = 'text'
    typeTextBtn.classList.add('active')
    typeImageBtn.classList.remove('active')
    textOpts.style.display = 'block'
    imageOpts.style.display = 'none'
    render()
  })
  typeImageBtn.addEventListener('click', function () {
    wmType = 'image'
    typeImageBtn.classList.add('active')
    typeTextBtn.classList.remove('active')
    textOpts.style.display = 'none'
    imageOpts.style.display = 'block'
    render()
  })

  // Watermark image upload
  wmBrowseBtn.addEventListener('click', function () { wmFileInput.click() })
  wmFileInput.addEventListener('change', function () { handleWmFile(wmFileInput.files[0]) })

  // Live update controls
  textInput.addEventListener('input', render)
  fontSizeInput.addEventListener('input', render)
  colorInput.addEventListener('input', render)

  wmScaleInput.addEventListener('input', function () {
    wmScaleVal.textContent = wmScaleInput.value + '%'
    render()
  })

  opacityInput.addEventListener('input', function () {
    opacityVal.textContent = opacityInput.value + '%'
    render()
  })

  rotationInput.addEventListener('input', function () {
    rotationVal.textContent = rotationInput.value + '\u00b0'
    render()
  })

  // Position grid
  positionGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.wm-pos-btn')
    if (!btn) return
    var btns = positionGrid.querySelectorAll('.wm-pos-btn')
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active')
    btn.classList.add('active')
    tileBtn.classList.remove('active')
    position = btn.getAttribute('data-pos')
    isTile = false
    render()
  })

  tileBtn.addEventListener('click', function () {
    isTile = !isTile
    tileBtn.classList.toggle('active', isTile)
    if (isTile) {
      var btns = positionGrid.querySelectorAll('.wm-pos-btn')
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active')
    }
    render()
  })

  // Download
  downloadBtn.addEventListener('click', function () {
    if (!baseImg) return
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = 'watermarked.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  })
})()
