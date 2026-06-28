import { formatFileSize } from './fps-converter-core.js'
import { validateMngFile, buildMngToApngArgs, getOutputFilename } from './mng-to-apng-core.js'

;(function () {
  'use strict'

  var dropzone = document.getElementById('m2a-dropzone')
  var fileInput = document.getElementById('m2a-file-input')
  var infoEl = document.getElementById('m2a-info')
  var mobileBanner = document.getElementById('m2a-mobile-banner')
  var mobileBannerDismiss = document.getElementById('m2a-mobile-banner-dismiss')
  var settingsEl = document.getElementById('m2a-settings')
  var filenameEl = document.getElementById('m2a-filename')
  var filesizeEl = document.getElementById('m2a-filesize')
  var convertBtn = document.getElementById('m2a-convert')
  var changeBtn = document.getElementById('m2a-change')
  var progressEl = document.getElementById('m2a-progress')
  var progressText = document.getElementById('m2a-progress-text')
  var progressFill = document.getElementById('m2a-progress-fill')
  var progressDetail = document.getElementById('m2a-progress-detail')
  var errorEl = document.getElementById('m2a-error')
  var errorText = document.getElementById('m2a-error-text')
  var errorRetry = document.getElementById('m2a-error-retry')
  var resultEl = document.getElementById('m2a-result')
  var resultImg = document.getElementById('m2a-result-img')
  var resultStats = document.getElementById('m2a-result-stats')
  var downloadBtn = document.getElementById('m2a-download')
  var newBtn = document.getElementById('m2a-new')

  var ffmpeg = null
  var ffmpegLoaded = false
  var fetchFile = null
  var currentFile = null
  var resultBlobUrl = null

  if (mobileBanner && window.matchMedia('(max-width: 768px)').matches) {
    var dismissed = false
    try { dismissed = localStorage.getItem('mt:mng-apng-mobile-nudge') === '1' } catch (_) {}
    if (!dismissed) mobileBanner.style.display = ''
  }
  if (mobileBannerDismiss) {
    mobileBannerDismiss.addEventListener('click', function () {
      mobileBanner.style.display = 'none'
      try { localStorage.setItem('mt:mng-apng-mobile-nudge', '1') } catch (_) {}
    })
  }

  function showState(state) {
    dropzone.style.display = state === 'dropzone' ? '' : 'none'
    infoEl.style.display = state === 'dropzone' ? '' : 'none'
    settingsEl.style.display = state === 'settings' ? '' : 'none'
    progressEl.style.display = state === 'progress' ? '' : 'none'
    errorEl.style.display = state === 'error' ? '' : 'none'
    resultEl.style.display = state === 'result' ? '' : 'none'
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length > 0) handleFile(fileInput.files[0])
  })

  function handleFile(file) {
    var validation = validateMngFile(file)
    if (!validation.valid) {
      showError(validation.error)
      return
    }
    currentFile = file
    filenameEl.textContent = file.name
    filesizeEl.textContent = formatFileSize(file.size)
    showState('settings')
  }

  async function loadFfmpeg() {
    if (ffmpeg && ffmpegLoaded) return ffmpeg

    showState('progress')
    progressText.textContent = 'Loading FFmpeg engine...'
    progressFill.style.width = '0%'
    progressDetail.textContent = 'Downloading ~25 MB (cached after first use)'

    var loader = await import('./ffmpeg-loader.js')
    var result = await loader.loadFFmpeg(function (pct, detail) {
      progressFill.style.width = pct + '%'
      progressDetail.textContent = detail
    })

    var ff = result.ff
    fetchFile = result.fetchFile

    ff.on('log', function (e) {
      if (e.message) {
        console.log('[ffmpeg]', e.message)
        ff._lastLogs.push(e.message)
        if (ff._lastLogs.length > 30) ff._lastLogs.shift()
        if (/frame=\s*\d+/i.test(e.message)) {
          progressDetail.textContent = 'Converting frames...'
        }
      }
    })

    ffmpeg = ff
    ffmpegLoaded = true
    progressFill.style.width = '50%'
    return ffmpeg
  }

  convertBtn.addEventListener('click', async function () {
    try {
      var ff = await loadFfmpeg()
      progressText.textContent = 'Converting MNG to APNG...'
      progressFill.style.width = '50%'
      progressDetail.textContent = 'Writing file to memory...'

      var inputName = 'input.mng'
      var outputName = 'output.apng'

      var fileData = await fetchFile(currentFile)
      await ff.writeFile(inputName, fileData)

      ff._lastLogs.length = 0
      progressDetail.textContent = 'Encoding APNG (preserving frames and timing)...'
      var args = buildMngToApngArgs({ inputName: inputName, outputName: outputName })
      var ret = await ff.exec(args)

      if (ret !== 0) {
        throw new Error('Conversion failed (code ' + ret + '): ' + ff._lastLogs.slice(-3).join(' '))
      }

      progressFill.style.width = '95%'
      progressDetail.textContent = 'Reading output...'

      var outputData = await ff.readFile(outputName)
      try { await ff.deleteFile(inputName) } catch (_) {}
      try { await ff.deleteFile(outputName) } catch (_) {}

      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
      var blob = new Blob([outputData.buffer || outputData], { type: 'image/apng' })
      resultBlobUrl = URL.createObjectURL(blob)

      resultImg.src = resultBlobUrl
      resultStats.innerHTML = '<strong>' + formatFileSize(blob.size) + '</strong> — APNG output'

      showState('result')
    } catch (err) {
      console.error('Conversion failed:', err)
      showError('Conversion failed: ' + (err.message || String(err)).split('\n')[0])
    }
  })

  downloadBtn.addEventListener('click', function () {
    if (!resultBlobUrl || !currentFile) return
    var a = document.createElement('a')
    a.href = resultBlobUrl
    a.download = getOutputFilename(currentFile.name)
    a.click()
  })

  function reset() {
    fileInput.value = ''
    currentFile = null
    if (resultBlobUrl) {
      URL.revokeObjectURL(resultBlobUrl)
      resultBlobUrl = null
    }
    resultImg.removeAttribute('src')
    showState('dropzone')
  }

  changeBtn.addEventListener('click', reset)
  newBtn.addEventListener('click', reset)
  errorRetry.addEventListener('click', reset)

  showState('dropzone')
})()
