(function () {
  'use strict'

  var dropzone = document.getElementById('it-dropzone')
  var fileInput = document.getElementById('it-file')
  var controls = document.getElementById('it-controls')
  var colorsInput = document.getElementById('it-colors')
  var colorsVal = document.getElementById('it-colors-val')
  var detailSelect = document.getElementById('it-detail')
  var blurInput = document.getElementById('it-blur')
  var blurVal = document.getElementById('it-blur-val')
  var cornerInput = document.getElementById('it-corner')
  var cornerVal = document.getElementById('it-corner-val')
  var traceBtn = document.getElementById('it-trace-btn')
  var preview = document.getElementById('it-preview')
  var originalImg = document.getElementById('it-original')
  var svgWrap = document.getElementById('it-svg-wrap')
  var statusEl = document.getElementById('it-status')
  var downloadBtn = document.getElementById('it-download')

  var imageDataUrl = null
  var svgString = null
  var tracerLoaded = false

  function loadTracer() {
    if (tracerLoaded) return Promise.resolve()
    if (window._tracerPromise) return window._tracerPromise
    window._tracerPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js'
      script.onload = function () { tracerLoaded = true; resolve() }
      script.onerror = function () { reject(new Error('Failed to load image tracer')) }
      document.head.appendChild(script)
    })
    return window._tracerPromise
  }

  // Dropzone
  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('dropzone-active')
  })
  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('dropzone-active')
  })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('dropzone-active')
    var file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) loadImage(file)
  })
  fileInput.addEventListener('change', function (e) {
    if (e.target.files[0]) loadImage(e.target.files[0])
  })

  function loadImage(file) {
    var reader = new FileReader()
    reader.onload = function () {
      imageDataUrl = reader.result
      originalImg.src = imageDataUrl
      controls.style.display = ''
      preview.style.display = ''
      svgWrap.innerHTML = '<span style="color:var(--text-3);">Click "Trace" to generate SVG</span>'
      downloadBtn.style.display = 'none'
      statusEl.textContent = ''
    }
    reader.readAsDataURL(file)
  }

  // Range displays
  colorsInput.addEventListener('input', function () { colorsVal.textContent = colorsInput.value })
  blurInput.addEventListener('input', function () { blurVal.textContent = blurInput.value })
  cornerInput.addEventListener('input', function () { cornerVal.textContent = cornerInput.value })

  // Trace button
  traceBtn.addEventListener('click', function () {
    if (!imageDataUrl) return
    traceBtn.disabled = true
    statusEl.textContent = 'Tracing image...'
    downloadBtn.style.display = 'none'

    loadTracer().then(function () {
      var detailMap = { low: { ltres: 5, qtres: 5 }, medium: { ltres: 1, qtres: 1 }, high: { ltres: 0.3, qtres: 0.3 } }
      var detail = detailMap[detailSelect.value] || detailMap.medium

      var opts = {
        numberofcolors: parseInt(colorsInput.value, 10) || 16,
        ltres: detail.ltres,
        qtres: detail.qtres,
        blurradius: parseInt(blurInput.value, 10) || 0,
        blurdelta: 20,
        rightangleenhance: parseFloat(cornerInput.value) > 90,
        pathomit: 8,
        colorsampling: 2,
        mincolorratio: 0,
        colorquantcycles: 3,
        scale: 1,
        strokewidth: 0,
        roundcoords: 1,
      }

      ImageTracer.imageToSVG(imageDataUrl, function (svg) {
        svgString = svg
        svgWrap.innerHTML = svg

        // Make SVG responsive
        var svgEl = svgWrap.querySelector('svg')
        if (svgEl) {
          var w = svgEl.getAttribute('width')
          var h = svgEl.getAttribute('height')
          if (w && h && !svgEl.getAttribute('viewBox')) {
            svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h)
          }
          svgEl.style.width = '100%'
          svgEl.style.height = 'auto'
          svgEl.style.maxHeight = '400px'
        }

        statusEl.textContent = 'Tracing complete.'
        downloadBtn.style.display = ''
        traceBtn.disabled = false
      }, opts)
    }).catch(function (err) {
      statusEl.textContent = 'Error: ' + err.message
      traceBtn.disabled = false
    })
  })

  // Download
  downloadBtn.addEventListener('click', function () {
    if (!svgString) return
    var blob = new Blob([svgString], { type: 'image/svg+xml' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'traced-' + Date.now() + '.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
})()
