import { setVisible, nextPaint, makeProgress, formatSize, downloadBlob } from './tool-utils.js'

;(function () {
  var dropzone = document.getElementById('hjp-dropzone')
  var fileInput = document.getElementById('hjp-file')
  var fileInputMore = document.getElementById('hjp-file-more')
  var errorEl = document.getElementById('hjp-error')
  var settings = document.getElementById('hjp-settings')
  var queueInfo = document.getElementById('hjp-queue-info')
  var queueEl = document.getElementById('hjp-queue')
  var qualitySlider = document.getElementById('hjp-quality')
  var qualityVal = document.getElementById('hjp-quality-val')
  var convertBtn = document.getElementById('hjp-convert')
  var clearBtn = document.getElementById('hjp-clear')
  var progressEl = document.getElementById('hjp-progress')
  var progress = makeProgress(
    document.getElementById('hjp-progress-text'),
    document.getElementById('hjp-progress-fill')
  )
  var resultsEl = document.getElementById('hjp-results')
  var summaryEl = document.getElementById('hjp-summary')
  var listEl = document.getElementById('hjp-list')
  var downloadAllBtn = document.getElementById('hjp-download-all')
  var resetBtn = document.getElementById('hjp-reset')

  if (!dropzone) return

  var queue = []
  // Every thumbnail is an object URL. Without an explicit revoke on reset the
  // page holds on to the full decoded JPEG of every photo ever converted.
  var results = []
  var busy = false

  // ── HEIC detection ────────────────────────────────────────────────────
  // Safari reports image/heic; Chrome and Firefox usually report an empty
  // type for the same file, so the extension is the only reliable signal.
  var HEIC_MIMES = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']

  function isHeic(file) {
    if (!file) return false
    var name = (file.name || '').toLowerCase()
    if (/\.(heic|heif)$/.test(name)) return true
    return HEIC_MIMES.indexOf((file.type || '').toLowerCase()) !== -1
  }

  function stripExtension(name) {
    return (name || 'photo').replace(/\.[^.]+$/, '') || 'photo'
  }

  // ── Decoder loading ───────────────────────────────────────────────────
  // 2.7 MB of WebAssembly glue. Injected on first conversion and cached in a
  // promise so a second batch does not re-download or re-evaluate it.
  var heicLoader = null
  function loadHeicDecoder() {
    if (heicLoader) return heicLoader
    heicLoader = new Promise(function (resolve, reject) {
      if (window.HeicTo) return resolve(window.HeicTo)
      var script = document.createElement('script')
      script.src = '/vendor/heic-to.js'
      script.onload = function () {
        if (window.HeicTo) resolve(window.HeicTo)
        else reject(new Error('HEIC decoder failed to load'))
      }
      script.onerror = function () { reject(new Error('HEIC decoder failed to load')) }
      document.head.appendChild(script)
    })
    return heicLoader
  }

  // ── Errors ────────────────────────────────────────────────────────────
  function showError(message) {
    if (!message) { setVisible(errorEl, false); return }
    errorEl.textContent = message
    setVisible(errorEl, true)
  }

  // ── Queue ─────────────────────────────────────────────────────────────
  function addFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || [])
    if (!incoming.length) return
    var accepted = incoming.filter(isHeic)
    var rejected = incoming.length - accepted.length

    accepted.forEach(function (file) {
      var dupe = queue.some(function (q) { return q.name === file.name && q.size === file.size })
      if (!dupe) queue.push(file)
    })

    if (!queue.length) {
      showError('Those do not look like HEIC or HEIF files. Photos straight off an iPhone end in .heic.')
      return
    }
    showError(
      rejected > 0
        ? rejected + (rejected === 1 ? ' file was skipped — only HEIC and HEIF are handled here.' : ' files were skipped — only HEIC and HEIF are handled here.')
        : null
    )
    renderQueue()
  }

  function renderQueue() {
    queueEl.innerHTML = ''
    var total = 0
    queue.forEach(function (file) {
      total += file.size
      var li = document.createElement('li')
      var name = document.createElement('span')
      name.textContent = file.name
      var size = document.createElement('span')
      size.textContent = formatSize(file.size)
      li.appendChild(name)
      li.appendChild(size)
      queueEl.appendChild(li)
    })
    queueInfo.textContent = queue.length + (queue.length === 1 ? ' photo' : ' photos') + ' ready, ' + formatSize(total) + ' in total.'
    setVisible(dropzone, false)
    setVisible(settings, true)
    setVisible(resultsEl, false)
  }

  // ── Results ───────────────────────────────────────────────────────────
  function releaseResults() {
    results.forEach(function (r) { if (r.url) URL.revokeObjectURL(r.url) })
    results = []
    listEl.innerHTML = ''
  }

  function renderResult(result) {
    var li = document.createElement('li')
    li.className = 'hjp-item' + (result.error ? ' hjp-item-fail' : '')

    var thumb = document.createElement('img')
    thumb.className = 'hjp-thumb'
    thumb.alt = ''
    if (result.url) thumb.src = result.url
    li.appendChild(thumb)

    var body = document.createElement('div')
    body.className = 'hjp-item-body'
    var name = document.createElement('p')
    name.className = 'hjp-item-name'
    name.textContent = result.filename
    body.appendChild(name)

    var meta = document.createElement('p')
    meta.className = 'hjp-item-meta'
    if (result.error) {
      meta.textContent = result.error
    } else {
      meta.appendChild(document.createTextNode(formatSize(result.originalSize) + ' HEIC → ' + formatSize(result.size) + ' JPG '))
      var delta = document.createElement('span')
      var pct = result.originalSize > 0 ? (1 - result.size / result.originalSize) * 100 : 0
      if (pct > 0.5) {
        delta.className = 'hjp-delta saved'
        delta.textContent = '(' + pct.toFixed(0) + '% smaller)'
      } else {
        delta.className = 'hjp-delta'
        delta.textContent = '(' + Math.abs(pct).toFixed(0) + '% larger)'
      }
      meta.appendChild(delta)
    }
    body.appendChild(meta)
    li.appendChild(body)

    if (!result.error) {
      var btn = document.createElement('button')
      btn.className = 'tool-button'
      btn.type = 'button'
      btn.textContent = 'Download'
      btn.addEventListener('click', function () { downloadBlob(result.blob, result.filename) })
      li.appendChild(btn)
    }

    listEl.appendChild(li)
  }

  // ── Conversion ────────────────────────────────────────────────────────
  function convert() {
    if (busy || !queue.length) return
    busy = true
    convertBtn.disabled = true
    showError(null)
    releaseResults()
    setVisible(settings, false)
    setVisible(resultsEl, false)
    setVisible(progressEl, true)
    progress.pending('Loading the HEIC decoder…')

    var quality = Math.max(0.3, Math.min(1, parseInt(qualitySlider.value, 10) / 100))
    var files = queue.slice()

    nextPaint()
      .then(loadHeicDecoder)
      .then(function (heicTo) {
        // Sequential on purpose: each decode saturates the main thread, so
        // running them in parallel only makes the progress bar lie.
        var chain = Promise.resolve()
        files.forEach(function (file, i) {
          chain = chain
            .then(function () {
              progress.set('Converting ' + (i + 1) + ' of ' + files.length + ' — ' + file.name, i / files.length)
              return nextPaint()
            })
            .then(function () {
              return heicTo({ blob: file, type: 'image/jpeg', quality: quality })
            })
            .then(function (out) {
              var blob = Array.isArray(out) ? out[0] : out
              if (!blob) throw new Error('empty result')
              results.push({
                filename: stripExtension(file.name) + '.jpg',
                blob: blob,
                size: blob.size,
                originalSize: file.size,
                url: URL.createObjectURL(blob),
                error: null,
              })
            })
            .catch(function () {
              results.push({
                filename: file.name,
                blob: null,
                size: 0,
                originalSize: file.size,
                url: null,
                error: 'Could not decode this file. It may be a HEIC variant the decoder does not handle.',
              })
            })
        })
        return chain
      })
      .then(function () {
        progress.done('Done')
        return nextPaint()
      })
      .then(function () {
        setVisible(progressEl, false)
        showResults()
      })
      .catch(function () {
        setVisible(progressEl, false)
        setVisible(settings, true)
        showError('The HEIC decoder could not be loaded. Check your connection and try again.')
      })
      .then(function () {
        busy = false
        convertBtn.disabled = false
        progress.reset()
      })
  }

  function showResults() {
    var ok = results.filter(function (r) { return !r.error })
    var originalTotal = 0
    var newTotal = 0
    results.forEach(function (r) { renderResult(r) })
    ok.forEach(function (r) { originalTotal += r.originalSize; newTotal += r.size })

    var parts = [ok.length + (ok.length === 1 ? ' photo converted' : ' photos converted')]
    if (ok.length) parts.push(formatSize(originalTotal) + ' → ' + formatSize(newTotal))
    var failed = results.length - ok.length
    if (failed) parts.push(failed + (failed === 1 ? ' file failed' : ' files failed'))
    summaryEl.textContent = parts.join(' · ')

    downloadAllBtn.disabled = ok.length === 0
    setVisible(resultsEl, true)
  }

  function resetTool() {
    queue = []
    releaseResults()
    fileInput.value = ''
    if (fileInputMore) fileInputMore.value = ''
    queueEl.innerHTML = ''
    showError(null)
    progress.reset()
    setVisible(progressEl, false)
    setVisible(settings, false)
    setVisible(resultsEl, false)
    setVisible(dropzone, true)
  }

  // ── Wiring ────────────────────────────────────────────────────────────
  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    addFiles(e.dataTransfer && e.dataTransfer.files)
  })

  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = '' })
  if (fileInputMore) {
    fileInputMore.addEventListener('change', function () { addFiles(fileInputMore.files); fileInputMore.value = '' })
  }

  qualitySlider.addEventListener('input', function () {
    qualityVal.textContent = qualitySlider.value + '%'
  })
  qualityVal.textContent = qualitySlider.value + '%'

  convertBtn.addEventListener('click', convert)
  clearBtn.addEventListener('click', resetTool)
  resetBtn.addEventListener('click', resetTool)

  downloadAllBtn.addEventListener('click', function () {
    // Browsers throttle a burst of synthetic clicks, so the saves are spaced
    // out rather than fired in one loop.
    results.filter(function (r) { return !r.error }).forEach(function (r, i) {
      setTimeout(function () { downloadBlob(r.blob, r.filename) }, i * 350)
    })
  })

  window.addEventListener('pagehide', releaseResults)
})()
