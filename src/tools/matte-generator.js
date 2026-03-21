(function () {
  var uploadEl = document.getElementById('mg-upload')
  var fileInput = document.getElementById('mg-file')
  var browseBtn = document.getElementById('mg-browse')
  var sourceEl = document.getElementById('mg-source')
  var sourceImg = document.getElementById('mg-source-img')
  var sourceInfo = document.getElementById('mg-source-info')
  var changeBtn = document.getElementById('mg-change')
  var controlsEl = document.getElementById('mg-controls')
  var previewWrap = document.getElementById('mg-preview-wrap')
  var canvas = document.getElementById('mg-canvas')
  var ctx = canvas.getContext('2d')
  var downloadBtn = document.getElementById('mg-download')

  var colorInput = document.getElementById('mg-color')
  var colorHex = document.getElementById('mg-color-hex')
  var ratioBtns = document.getElementById('mg-ratio-btns')
  var customRatioEl = document.getElementById('mg-custom-ratio')
  var customW = document.getElementById('mg-custom-w')
  var customH = document.getElementById('mg-custom-h')
  var paddingInput = document.getElementById('mg-padding')
  var paddingVal = document.getElementById('mg-padding-val')

  var baseImg = null
  var ratioMode = '1:1'
  var OUTPUT_SIZE = 1080 // base output width

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

  function reset() {
    baseImg = null
    uploadEl.style.display = 'block'
    sourceEl.style.display = 'none'
    controlsEl.style.display = 'none'
    previewWrap.style.display = 'none'
    fileInput.value = ''
  }

  // ── Ratio calculation ──

  function getRatio() {
    if (ratioMode === '1:1') return { w: 1, h: 1 }
    if (ratioMode === '4:5') return { w: 4, h: 5 }
    if (ratioMode === '16:9') return { w: 16, h: 9 }
    if (ratioMode === 'custom') {
      var cw = parseInt(customW.value, 10) || 1
      var ch = parseInt(customH.value, 10) || 1
      return { w: cw, h: ch }
    }
    return { w: 1, h: 1 }
  }

  // ── Rendering ──

  function render() {
    if (!baseImg) return
    var ratio = getRatio()
    var padding = parseInt(paddingInput.value, 10) / 100
    var bgColor = colorInput.value

    // Calculate canvas dimensions
    var canvasW, canvasH
    if (ratio.w >= ratio.h) {
      canvasW = OUTPUT_SIZE
      canvasH = Math.round(OUTPUT_SIZE * ratio.h / ratio.w)
    } else {
      canvasH = OUTPUT_SIZE
      canvasW = Math.round(OUTPUT_SIZE * ratio.w / ratio.h)
    }

    canvas.width = canvasW
    canvas.height = canvasH

    // Fill background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasW, canvasH)

    // Calculate available space after padding
    var padX = canvasW * padding
    var padY = canvasH * padding
    var availW = canvasW - padX * 2
    var availH = canvasH - padY * 2

    // Scale image to fit
    var imgW = baseImg.naturalWidth
    var imgH = baseImg.naturalHeight
    var scale = Math.min(availW / imgW, availH / imgH)
    var drawW = Math.round(imgW * scale)
    var drawH = Math.round(imgH * scale)

    // Center image
    var x = Math.round((canvasW - drawW) / 2)
    var y = Math.round((canvasH - drawH) / 2)

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(baseImg, x, y, drawW, drawH)
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

  // Color sync
  colorInput.addEventListener('input', function () {
    colorHex.value = colorInput.value
    render()
  })
  colorHex.addEventListener('input', function () {
    var v = colorHex.value.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      colorInput.value = v
      render()
    }
  })

  // Ratio buttons
  ratioBtns.addEventListener('click', function (e) {
    var btn = e.target.closest('.mg-ratio-btn')
    if (!btn) return
    var btns = ratioBtns.querySelectorAll('.mg-ratio-btn')
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active')
    btn.classList.add('active')
    ratioMode = btn.getAttribute('data-ratio')
    customRatioEl.style.display = ratioMode === 'custom' ? 'flex' : 'none'
    render()
  })

  customW.addEventListener('input', render)
  customH.addEventListener('input', render)

  // Padding
  paddingInput.addEventListener('input', function () {
    paddingVal.textContent = paddingInput.value + '%'
    render()
  })

  // Download
  downloadBtn.addEventListener('click', function () {
    if (!baseImg) return
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = 'matte.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  })
})()
