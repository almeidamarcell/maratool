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
  var stripExif = document.getElementById('icm-strip-exif')
  var compressBtn = document.getElementById('icm-compress')
  var changeBtn = document.getElementById('icm-change')
  var resultEl = document.getElementById('icm-result')
  var originalResultImg = document.getElementById('icm-original-result')
  var resultImg = document.getElementById('icm-result-img')
  var newSize = document.getElementById('icm-new-size')
  var savings = document.getElementById('icm-savings')
  var downloadBtn = document.getElementById('icm-download')

  var currentImg = null
  var currentFile = null
  var originalDataUrl = null
  var compressedBlob = null
  var compressedName = 'compressed.jpg'

  function handleFile(file) {
    if (!file || !isSupportedMime(file.type)) return
    currentFile = file
    var reader = new FileReader()
    reader.onload = function () {
      originalDataUrl = reader.result
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

  function resetTool() {
    currentImg = null
    currentFile = null
    originalDataUrl = null
    compressedBlob = null
    dropzone.style.display = ''
    settings.style.display = 'none'
    resultEl.style.display = 'none'
    fileInput.value = ''
  }

  changeBtn.addEventListener('click', resetTool)

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
    if (!stripExif || stripExif.checked) {
      ctx.fillStyle = '#ffffff'
      if (mime !== 'image/jpeg') ctx.clearRect(0, 0, dims.width, dims.height)
    }
    ctx.drawImage(currentImg, 0, 0, dims.width, dims.height)

    canvas.toBlob(function (blob) {
      if (!blob) return
      compressedBlob = blob
      var ext = formatSelect.value === 'png' ? 'png' : formatSelect.value === 'webp' ? 'webp' : 'jpg'
      compressedName = (currentFile.name.replace(/\.[^.]+$/, '') || 'image') + '-compressed.' + ext
      originalResultImg.src = originalDataUrl
      resultImg.src = URL.createObjectURL(blob)
      newSize.textContent = formatBytes(blob.size)
      var pct = compressionRatio(currentFile.size, blob.size)
      savings.textContent = (pct > 0 ? pct.toFixed(1) + '% smaller' : 'No reduction')
      resultEl.style.display = ''
      settings.style.display = 'none'
    }, mime, mime === 'image/png' ? undefined : quality)
  })

  downloadBtn.addEventListener('click', function () {
    if (!compressedBlob) return
    var a = document.createElement('a')
    a.href = URL.createObjectURL(compressedBlob)
    a.download = compressedName
    a.click()
  })

  var changeResultBtn = document.getElementById('icm-change-result')
  if (changeResultBtn) changeResultBtn.addEventListener('click', resetTool)

  qualityVal.textContent = qualitySlider.value + '%'
})()
