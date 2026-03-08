(function () {
  'use strict'

  // Elements
  var dropzone = document.getElementById('br-dropzone')
  var fileInput = document.getElementById('br-file-input')
  var infoEl = document.getElementById('br-info')
  var progressEl = document.getElementById('br-progress')
  var progressText = document.getElementById('br-progress-text')
  var progressBar = document.getElementById('br-progress-bar')
  var progressDetail = document.getElementById('br-progress-detail')
  var processingEl = document.getElementById('br-processing')
  var errorEl = document.getElementById('br-error')
  var errorText = document.getElementById('br-error-text')
  var errorRetry = document.getElementById('br-error-retry')
  var resultEl = document.getElementById('br-result')
  var originalPreview = document.getElementById('br-original-preview')
  var resultPreview = document.getElementById('br-result-preview')
  var downloadBtn = document.getElementById('br-download')
  var newBtn = document.getElementById('br-new')

  var pipeline = null
  var segmenter = null
  var resultBlobUrl = null

  // --- State management ---
  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    infoEl.style.display = state === 'dropzone' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    processingEl.style.display = state === 'processing' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  // --- Drop zone ---
  dropzone.addEventListener('click', function () {
    fileInput.click()
  })

  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('drag-over')
  })

  dropzone.addEventListener('dragleave', function () {
    dropzone.classList.remove('drag-over')
  })

  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    var files = e.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  })

  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0])
  })

  // --- Load model ---
  async function loadModel() {
    if (segmenter) return segmenter

    showState('progress')
    progressText.textContent = 'Loading AI model...'
    progressBar.style.width = '0%'
    progressDetail.textContent = 'Downloading ~180 MB (cached after first use)'

    var transformers = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1')
    pipeline = transformers.pipeline

    segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
      device: 'webgpu',
      progress_callback: function (progress) {
        if (progress.status === 'progress' && progress.total) {
          var pct = Math.round((progress.loaded / progress.total) * 100)
          progressBar.style.width = pct + '%'
          var mb = (progress.loaded / 1048576).toFixed(1)
          var totalMb = (progress.total / 1048576).toFixed(1)
          progressDetail.textContent = mb + ' / ' + totalMb + ' MB'
        } else if (progress.status === 'ready') {
          progressBar.style.width = '100%'
          progressDetail.textContent = 'Model loaded'
        }
      }
    })

    return segmenter
  }

  async function loadModelWithFallback() {
    try {
      return await loadModel()
    } catch (err) {
      // WebGPU may fail — fall back to WASM
      if (segmenter) return segmenter
      console.warn('WebGPU failed, falling back to WASM:', err)

      progressText.textContent = 'Loading AI model (CPU fallback)...'
      progressBar.style.width = '0%'

      var transformers = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1')
      pipeline = transformers.pipeline

      segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
        device: 'wasm',
        progress_callback: function (progress) {
          if (progress.status === 'progress' && progress.total) {
            var pct = Math.round((progress.loaded / progress.total) * 100)
            progressBar.style.width = pct + '%'
            var mb = (progress.loaded / 1048576).toFixed(1)
            var totalMb = (progress.total / 1048576).toFixed(1)
            progressDetail.textContent = mb + ' / ' + totalMb + ' MB (CPU)'
          } else if (progress.status === 'ready') {
            progressBar.style.width = '100%'
            progressDetail.textContent = 'Model loaded'
          }
        }
      })

      return segmenter
    }
  }

  // --- Process image ---
  async function handleFile(file) {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      showError('Please select a PNG, JPG, or WebP image.')
      return
    }

    // Show original preview
    var objectUrl = URL.createObjectURL(file)
    originalPreview.src = objectUrl

    try {
      var model = await loadModelWithFallback()

      showState('processing')

      // Create an image URL for the model
      var imageUrl = URL.createObjectURL(file)
      var output = await model(imageUrl)
      URL.revokeObjectURL(imageUrl)

      // output is an array, the mask is in the first element
      if (!output || output.length === 0) {
        showError('The model did not return a result. Try a different image.')
        return
      }

      var maskBlob = output[0].mask
      // Apply mask to original image
      var resultBlob = await applyMask(file, maskBlob)

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      resultBlobUrl = URL.createObjectURL(resultBlob)
      resultPreview.src = resultBlobUrl

      showState('result')
    } catch (err) {
      console.error('Background removal failed:', err)
      showError('Processing failed: ' + (err.message || 'Unknown error'))
    }
  }

  // --- Apply mask to original ---
  async function applyMask(originalFile, maskRawImage) {
    var origBitmap = await createImageBitmap(originalFile)
    var w = origBitmap.width
    var h = origBitmap.height

    var canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    var ctx = canvas.getContext('2d')

    // Draw original
    ctx.drawImage(origBitmap, 0, 0, w, h)
    var imageData = ctx.getImageData(0, 0, w, h)

    // maskRawImage is a RawImage from @huggingface/transformers
    // Convert to canvas to get pixel data at the original image size
    var maskCanvas = maskRawImage.toCanvas()
    var maskScaled = document.createElement('canvas')
    maskScaled.width = w
    maskScaled.height = h
    var maskCtx = maskScaled.getContext('2d')
    maskCtx.drawImage(maskCanvas, 0, 0, w, h)
    var maskData = maskCtx.getImageData(0, 0, w, h)

    // Apply mask as alpha
    var pixels = imageData.data
    var mask = maskData.data
    for (var i = 0; i < pixels.length; i += 4) {
      pixels[i + 3] = mask[i] // R channel of mask = grayscale
    }

    ctx.putImageData(imageData, 0, 0)

    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob)
      }, 'image/png')
    })
  }

  // --- Download ---
  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl) return
    var a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = 'background-removed.png'
    a.click()
  })

  // --- Try again ---
  newBtn.addEventListener('click', function () {
    fileInput.value = ''
    if (resultBlobUrl) {
      URL.revokeObjectURL(resultBlobUrl)
      resultBlobUrl = null
    }
    showState('dropzone')
  })

  errorRetry.addEventListener('click', function () {
    fileInput.value = ''
    showState('dropzone')
  })

  // Init
  showState('dropzone')
})()
