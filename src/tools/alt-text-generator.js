import './hash-state.js'
// Alt Text Generator — uses HuggingFace transformers
;(function () {
  'use strict'

  var dropzone = document.getElementById('atg-dropzone')
  var fileInput = document.getElementById('atg-file')
  var progressEl = document.getElementById('atg-progress')
  var progressText = document.getElementById('atg-progress-text')
  var progressBar = document.getElementById('atg-progress-bar')
  var resultEl = document.getElementById('atg-result')
  var previewImg = document.getElementById('atg-preview')
  var output = document.getElementById('atg-output')
  var charCount = document.getElementById('atg-char-count')
  var copyBtn = document.getElementById('atg-copy')
  var regenerateBtn = document.getElementById('atg-regenerate')
  var newBtn = document.getElementById('atg-new')

  var pipeline = null
  var captioner = null
  var currentImageUrl = null

  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  // Dropzone
  dropzone.addEventListener('click', function () { fileInput.click() })
  fileInput.addEventListener('change', function (e) {
    if (e.target.files[0]) processImage(e.target.files[0])
  })
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
    if (file && file.type.startsWith('image/')) processImage(file)
  })

  async function loadModel() {
    if (captioner) return captioner

    progressText.textContent = 'Loading AI model (first time may take a minute)...'
    progressBar.style.width = '0%'

    var transformers = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.1')
    pipeline = transformers.pipeline

    captioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
      device: 'wasm',
      progress_callback: function (progress) {
        if (progress.status === 'progress' && progress.progress) {
          var pct = Math.round(progress.progress)
          progressBar.style.width = pct + '%'
          progressText.textContent = 'Downloading model... ' + pct + '%'
        } else if (progress.status === 'ready') {
          progressText.textContent = 'Model ready!'
          progressBar.style.width = '100%'
        }
      }
    })

    return captioner
  }

  async function processImage(file) {
    showState('progress')
    progressBar.style.width = '0%'

    try {
      // Read image
      var reader = new FileReader()
      var imageUrl = await new Promise(function (resolve) {
        reader.onload = function () { resolve(reader.result) }
        reader.readAsDataURL(file)
      })
      currentImageUrl = imageUrl
      previewImg.src = imageUrl

      // Load model
      var model = await loadModel()

      // Generate caption
      progressText.textContent = 'Generating alt text...'
      progressBar.style.width = '100%'

      var result = await model(imageUrl)
      var caption = result && result[0] ? result[0].generated_text : 'Could not generate description'

      output.value = caption
      updateCharCount()
      showState('result')
    } catch (e) {
      progressText.textContent = 'Error: ' + e.message
    }
  }

  function updateCharCount() {
    var len = output.value.length
    charCount.textContent = len + ' characters'
    charCount.className = 'atg-char-count' + (len > 125 ? ' atg-char-warn' : '')
  }

  output.addEventListener('input', updateCharCount)

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy alt text'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  regenerateBtn.addEventListener('click', async function () {
    if (!currentImageUrl || !captioner) return
    regenerateBtn.disabled = true
    try {
      var result = await captioner(currentImageUrl)
      output.value = result && result[0] ? result[0].generated_text : 'Could not generate description'
      updateCharCount()
    } catch (e) {
      output.value = 'Error: ' + e.message
    }
    regenerateBtn.disabled = false
  })

  newBtn.addEventListener('click', function () {
    output.value = ''
    fileInput.value = ''
    currentImageUrl = null
    charCount.textContent = ''
    showState('dropzone')
  })
})()
