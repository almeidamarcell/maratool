(function () {
  var uploadEl = document.getElementById('ic-upload')
  var fileInput = document.getElementById('ic-file')
  var browseBtn = document.getElementById('ic-browse')
  var sourceEl = document.getElementById('ic-source')
  var sourceImg = document.getElementById('ic-source-img')
  var sourceInfo = document.getElementById('ic-source-info')
  var changeBtn = document.getElementById('ic-change')
  var optionsEl = document.getElementById('ic-options')
  var formatSelect = document.getElementById('ic-format')
  var qualityRow = document.getElementById('ic-quality-row')
  var qualitySlider = document.getElementById('ic-quality')
  var qualityVal = document.getElementById('ic-quality-val')
  var widthInput = document.getElementById('ic-width')
  var heightInput = document.getElementById('ic-height')
  var lockBtn = document.getElementById('ic-lock')
  var resetSizeBtn = document.getElementById('ic-reset-size')
  var convertBtn = document.getElementById('ic-convert')

  var originalWidth = 0
  var originalHeight = 0
  var aspectRatio = 1
  var locked = true
  var currentImg = null
  var currentFileName = ''

  // Check AVIF support
  var testCanvas = document.createElement('canvas')
  testCanvas.width = 1
  testCanvas.height = 1
  var avifSupported = testCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  if (avifSupported) {
    var opt = document.createElement('option')
    opt.value = 'image/avif'
    opt.textContent = 'AVIF'
    formatSelect.appendChild(opt)
  }

  function handleFile(file) {
    if (!file || !file.type.match(/^image\//)) return
    currentFileName = file.name.replace(/\.[^.]+$/, '')

    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () {
        currentImg = img
        originalWidth = img.naturalWidth
        originalHeight = img.naturalHeight
        aspectRatio = originalWidth / originalHeight
        showSource(img, file)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  function showSource(img, file) {
    sourceImg.src = img.src
    var sizeKB = (file.size / 1024).toFixed(1)
    sourceInfo.textContent = img.naturalWidth + ' \u00d7 ' + img.naturalHeight + ' \u2014 ' + sizeKB + ' KB \u2014 ' + file.name
    uploadEl.style.display = 'none'
    sourceEl.style.display = 'flex'
    optionsEl.style.display = 'block'
    widthInput.placeholder = originalWidth
    heightInput.placeholder = originalHeight
    widthInput.value = ''
    heightInput.value = ''
    updateQualityVisibility()
  }

  function reset() {
    uploadEl.style.display = 'block'
    sourceEl.style.display = 'none'
    optionsEl.style.display = 'none'
    currentImg = null
    fileInput.value = ''
    widthInput.value = ''
    heightInput.value = ''
  }

  function updateQualityVisibility() {
    var fmt = formatSelect.value
    var showQuality = fmt === 'image/jpeg' || fmt === 'image/webp' || fmt === 'image/avif'
    qualityRow.style.display = showQuality ? 'block' : 'none'
  }

  function getTargetWidth() {
    var v = parseInt(widthInput.value, 10)
    return (v && v > 0) ? v : originalWidth
  }

  function getTargetHeight() {
    var v = parseInt(heightInput.value, 10)
    return (v && v > 0) ? v : originalHeight
  }

  function convert() {
    if (!currentImg) return

    var w = getTargetWidth()
    var h = getTargetHeight()
    var fmt = formatSelect.value
    var quality = parseInt(qualitySlider.value, 10) / 100

    var canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    var ctx = canvas.getContext('2d')

    // JPEG has no transparency — fill white background
    if (fmt === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(currentImg, 0, 0, w, h)

    var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' }
    var extension = ext[fmt] || 'png'

    canvas.toBlob(function (blob) {
      if (!blob) return
      var url = URL.createObjectURL(blob)
      var a = document.createElement('a')
      a.href = url
      a.download = currentFileName + '.' + extension
      a.click()
      URL.revokeObjectURL(url)
    }, fmt, quality)
  }

  // ── Events ──

  browseBtn.addEventListener('click', function (e) {
    e.stopPropagation()
    fileInput.click()
  })

  uploadEl.addEventListener('click', function () {
    fileInput.click()
  })

  fileInput.addEventListener('change', function () {
    handleFile(fileInput.files[0])
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
    handleFile(e.dataTransfer.files[0])
  })

  changeBtn.addEventListener('click', reset)

  formatSelect.addEventListener('change', updateQualityVisibility)

  qualitySlider.addEventListener('input', function () {
    qualityVal.textContent = qualitySlider.value
  })

  lockBtn.addEventListener('click', function () {
    locked = !locked
    lockBtn.textContent = locked ? '\uD83D\uDD17' : '\u26D3\uFE0F'
    lockBtn.classList.toggle('unlocked', !locked)
  })

  widthInput.addEventListener('input', function () {
    if (!locked) return
    var w = parseInt(widthInput.value, 10)
    if (w && w > 0) {
      heightInput.value = Math.round(w / aspectRatio)
    } else {
      heightInput.value = ''
    }
  })

  heightInput.addEventListener('input', function () {
    if (!locked) return
    var h = parseInt(heightInput.value, 10)
    if (h && h > 0) {
      widthInput.value = Math.round(h * aspectRatio)
    } else {
      widthInput.value = ''
    }
  })

  resetSizeBtn.addEventListener('click', function () {
    widthInput.value = ''
    heightInput.value = ''
  })

  convertBtn.addEventListener('click', convert)
})()
