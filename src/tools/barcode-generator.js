(function () {
  'use strict'

  var contentInput = document.getElementById('bc-input')
  var formatSelect = document.getElementById('bc-format')
  var scaleInput = document.getElementById('bc-scale')
  var heightInput = document.getElementById('bc-height')
  var textCheckbox = document.getElementById('bc-text')
  var barColorInput = document.getElementById('bc-bar-color')
  var bgColorInput = document.getElementById('bc-bg-color')
  var canvas = document.getElementById('bc-canvas')
  var errorEl = document.getElementById('bc-error')
  var downloadBtn = document.getElementById('bc-download')
  var loadingEl = document.getElementById('bc-loading')

  var bwipjsLoaded = false

  function loadBwipJs() {
    if (bwipjsLoaded) return Promise.resolve()
    if (window._bwipPromise) return window._bwipPromise
    loadingEl.style.display = ''
    window._bwipPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/bwip-js@4.5.1/dist/bwip-js-min.js'
      script.onload = function () {
        bwipjsLoaded = true
        loadingEl.style.display = 'none'
        resolve()
      }
      script.onerror = function () {
        loadingEl.textContent = 'Failed to load barcode engine.'
        reject(new Error('bwip-js load failed'))
      }
      document.head.appendChild(script)
    })
    return window._bwipPromise
  }

  var is1D = { code128: true, ean13: true, upca: true, code39: true, itf14: true, pdf417: true }

  var debounceTimer = null
  function generate() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(doGenerate, 200)
  }

  function doGenerate() {
    var text = contentInput.value.trim()
    if (!text) {
      canvas.width = 0
      canvas.height = 0
      errorEl.textContent = ''
      downloadBtn.style.display = 'none'
      return
    }

    loadBwipJs().then(function () {
      try {
        errorEl.textContent = ''
        var fmt = formatSelect.value
        var oneD = !!is1D[fmt]

        var opts = {
          bcid: fmt,
          text: text,
          scale: parseInt(scaleInput.value, 10) || 3,
          includetext: oneD && textCheckbox.checked,
          textxalign: 'center',
          paddingwidth: 4,
          paddingheight: 4,
          barcolor: barColorInput.value.replace('#', ''),
          backgroundcolor: bgColorInput.value.replace('#', ''),
        }

        if (oneD) {
          opts.height = parseInt(heightInput.value, 10) || 15
        }

        bwipjs.toCanvas(canvas, opts)
        downloadBtn.style.display = ''
      } catch (err) {
        errorEl.textContent = err.message || 'Failed to generate barcode'
        downloadBtn.style.display = 'none'
      }
    })
  }

  // Inputs
  contentInput.addEventListener('input', generate)
  formatSelect.addEventListener('change', generate)
  scaleInput.addEventListener('input', generate)
  heightInput.addEventListener('input', generate)
  textCheckbox.addEventListener('change', generate)
  barColorInput.addEventListener('input', generate)
  bgColorInput.addEventListener('input', generate)

  // Download
  downloadBtn.addEventListener('click', function () {
    var link = document.createElement('a')
    link.download = formatSelect.value + '-' + Date.now() + '.png'
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  })
})()
