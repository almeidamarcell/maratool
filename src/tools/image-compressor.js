import { validateQuality, calculateDimensions, formatBytes, compressionRatio, getOutputMime, isSupportedMime } from './image-compressor-core.js'

;(function () {
  var dropzone = document.getElementById('icm-dropzone')
  var fileInput = document.getElementById('icm-file')
  var settings = document.getElementById('icm-settings')
  var previewImg = document.getElementById('icm-preview')
  var origSize = document.getElementById('icm-orig-size')
  var origDims = document.getElementById('icm-orig-dims')
  var qualitySlider = document.getElementById('icm-quality')
  var qualityVal = document.getElementById('icm-quality-val')
  var scaleSelect = document.getElementById('icm-scale')
  var formatSelect = document.getElementById('icm-format')
  var compressBtn = document.getElementById('icm-compress')
  var changeBtn = document.getElementById('icm-change')
  var resultEl = document.getElementById('icm-result')
  var resultImg = document.getElementById('icm-result-img')
  var newSize = document.getElementById('icm-new-size')
  var savings = document.getElementById('icm-savings')
  var downloadBtn = document.getElementById('icm-download')

  var currentImg = null
  var currentFile = null
  var compressedBlob = null
  var compressedName = 'compressed.jpg'

  function handleFile(file) {
    if (!file || !isSupportedMime(file.type)) return
    currentFile = file
    var reader = new FileReader()
    reader.onload = function () {
      var img = new Image()
      img.onload = function () {
        currentImg = img
        previewImg.src = img.src
        origSize.textContent = formatBytes(file.size)
        origDims.textContent = img.naturalWidth + ' × ' + img.naturalHeight
        dropzone.style.display = 'none'
        settings.style.display = ''
        resultEl.style.display = 'none'
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('dragover') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('dragover') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('dragover')
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) handleFile(fileInput.files[0])
  })

  qualitySlider.addEventListener('input', function () {
    qualityVal.textContent = qualitySlider.value + '%'
  })

  changeBtn.addEventListener('click', function () {
    currentImg = null
    currentFile = null
    compressedBlob = null
    dropzone.style.display = ''
    settings.style.display = 'none'
    resultEl.style.display = 'none'
    fileInput.value = ''
  })

  compressBtn.addEventListener('click', function () {
    if (!currentImg) return
    var qCheck = validateQuality(qualitySlider.value)
    if (!qCheck.valid) return

    var dims = calculateDimensions(currentImg.naturalWidth, currentImg.naturalHeight, scaleSelect.value)
    var mime = getOutputMime(formatSelect.value)
    var quality = qCheck.value / 100

    var canvas = document.createElement('canvas')
    canvas.width = dims.width
    canvas.height = dims.height
    var ctx = canvas.getContext('2d')
    ctx.drawImage(currentImg, 0, 0, dims.width, dims.height)

    canvas.toBlob(function (blob) {
      if (!blob) return
      compressedBlob = blob
      var ext = formatSelect.value === 'png' ? 'png' : formatSelect.value === 'webp' ? 'webp' : 'jpg'
      compressedName = (currentFile.name.replace(/\.[^.]+$/, '') || 'image') + '-compressed.' + ext
      resultImg.src = URL.createObjectURL(blob)
      newSize.textContent = formatBytes(blob.size)
      savings.textContent = compressionRatio(currentFile.size, blob.size).toFixed(1) + '% smaller'
      resultEl.style.display = ''
    }, mime, mime === 'image/png' ? undefined : quality)
  })

  downloadBtn.addEventListener('click', function () {
    if (!compressedBlob) return
    var a = document.createElement('a')
    a.href = URL.createObjectURL(compressedBlob)
    a.download = compressedName
    a.click()
  })

  qualityVal.textContent = qualitySlider.value + '%'
})()
