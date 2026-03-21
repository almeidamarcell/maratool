(function () {
  var uploadEl = document.getElementById('sg-upload')
  var fileInput = document.getElementById('sg-file')
  var browseBtn = document.getElementById('sg-browse')
  var sourceEl = document.getElementById('sg-source')
  var sourceImg = document.getElementById('sg-source-img')
  var sourceInfo = document.getElementById('sg-source-info')
  var changeBtn = document.getElementById('sg-change')
  var controlsEl = document.getElementById('sg-controls')
  var previewWrap = document.getElementById('sg-preview-wrap')
  var previewEl = document.getElementById('sg-preview')
  var slideInfo = document.getElementById('sg-slide-info')
  var downloadBtn = document.getElementById('sg-download')

  var dirHBtn = document.getElementById('sg-dir-h')
  var dirVBtn = document.getElementById('sg-dir-v')
  var slidesInput = document.getElementById('sg-slides')
  var autoHint = document.getElementById('sg-auto-hint')

  var baseImg = null
  var direction = 'horizontal' // 'horizontal' | 'vertical'
  var slideCanvases = []

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
        autoCalculateSlides()
        render()
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  function reset() {
    baseImg = null
    slideCanvases = []
    uploadEl.style.display = 'block'
    sourceEl.style.display = 'none'
    controlsEl.style.display = 'none'
    previewWrap.style.display = 'none'
    fileInput.value = ''
    previewEl.innerHTML = ''
  }

  function autoCalculateSlides() {
    if (!baseImg) return
    var imgW = baseImg.naturalWidth
    var imgH = baseImg.naturalHeight
    var auto
    if (direction === 'horizontal') {
      // For Instagram 1080px-wide slides
      auto = Math.max(2, Math.min(10, Math.round(imgW / 1080)))
    } else {
      auto = Math.max(2, Math.min(10, Math.round(imgH / 1080)))
    }
    slidesInput.value = auto
    autoHint.textContent = '(auto: ' + auto + ' for 1080px slides)'
  }

  // ── Rendering ──

  function render() {
    if (!baseImg) return
    var count = parseInt(slidesInput.value, 10) || 3
    if (count < 2) count = 2
    if (count > 10) count = 10

    var imgW = baseImg.naturalWidth
    var imgH = baseImg.naturalHeight
    var sliceW, sliceH

    if (direction === 'horizontal') {
      sliceW = Math.floor(imgW / count)
      sliceH = imgH
    } else {
      sliceW = imgW
      sliceH = Math.floor(imgH / count)
    }

    previewEl.innerHTML = ''
    previewEl.className = 'sg-preview' + (direction === 'vertical' ? ' vertical' : '')
    slideCanvases = []

    // Preview scale
    var maxPreviewDim = direction === 'horizontal' ? 150 : 200
    var previewScale
    if (direction === 'horizontal') {
      previewScale = Math.min(1, maxPreviewDim / sliceH)
    } else {
      previewScale = Math.min(1, maxPreviewDim / sliceW)
    }

    for (var i = 0; i < count; i++) {
      var sx, sy
      if (direction === 'horizontal') {
        sx = i * sliceW
        sy = 0
      } else {
        sx = 0
        sy = i * sliceH
      }

      // Full-res canvas
      var c = document.createElement('canvas')
      c.width = sliceW
      c.height = sliceH
      var cx = c.getContext('2d')
      cx.imageSmoothingEnabled = true
      cx.imageSmoothingQuality = 'high'
      cx.drawImage(baseImg, sx, sy, sliceW, sliceH, 0, 0, sliceW, sliceH)
      slideCanvases.push(c)

      // Preview canvas
      var previewW = Math.round(sliceW * previewScale)
      var previewH = Math.round(sliceH * previewScale)
      var pc = document.createElement('canvas')
      pc.width = previewW
      pc.height = previewH
      pc.style.width = previewW + 'px'
      pc.style.height = previewH + 'px'
      var pcx = pc.getContext('2d')
      pcx.imageSmoothingEnabled = true
      pcx.imageSmoothingQuality = 'high'
      pcx.drawImage(c, 0, 0, previewW, previewH)

      var card = document.createElement('div')
      card.className = 'sg-slide-card'
      card.appendChild(pc)
      var label = document.createElement('div')
      label.className = 'sg-slide-label'
      label.textContent = (i + 1)
      card.appendChild(label)
      previewEl.appendChild(card)
    }

    slideInfo.textContent = count + ' slides \u2014 each ' + sliceW + '\u00d7' + sliceH + ' px'
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

  // Direction toggle
  dirHBtn.addEventListener('click', function () {
    direction = 'horizontal'
    dirHBtn.classList.add('active')
    dirVBtn.classList.remove('active')
    autoCalculateSlides()
    render()
  })
  dirVBtn.addEventListener('click', function () {
    direction = 'vertical'
    dirVBtn.classList.add('active')
    dirHBtn.classList.remove('active')
    autoCalculateSlides()
    render()
  })

  slidesInput.addEventListener('input', render)

  // ── ZIP Download (using JSZip from CDN) ──

  downloadBtn.addEventListener('click', function () {
    if (slideCanvases.length === 0) return

    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
      alert('JSZip is still loading. Please try again in a moment.')
      return
    }

    downloadBtn.textContent = 'Generating ZIP\u2026'
    downloadBtn.disabled = true

    var zip = new JSZip()
    var pending = slideCanvases.length

    for (var i = 0; i < slideCanvases.length; i++) {
      (function (idx) {
        slideCanvases[idx].toBlob(function (blob) {
          var reader = new FileReader()
          reader.onload = function () {
            var name = 'slide-' + String(idx + 1).padStart(2, '0') + '.png'
            zip.file(name, new Uint8Array(reader.result))
            pending--
            if (pending === 0) {
              zip.generateAsync({ type: 'blob' }).then(function (content) {
                var url = URL.createObjectURL(content)
                var a = document.createElement('a')
                a.href = url
                a.download = 'carousel-slides.zip'
                a.click()
                URL.revokeObjectURL(url)
                downloadBtn.textContent = 'Download All as ZIP'
                downloadBtn.disabled = false
              })
            }
          }
          reader.readAsArrayBuffer(blob)
        }, 'image/png')
      })(i)
    }
  })
})()
