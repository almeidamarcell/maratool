import {
  parseGifFile, encodeFramesToGif, downloadBlob, stemFilename, isGifFile,
} from './gif-shared.js'

;(function () {
  var P = 'cgf'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var gifs = []

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function buildWorkspace() {
    var list = gifs.map(function (g, i) {
      return '<li>GIF ' + (i + 1) + ': ' + g.parsedFrames.length + ' frames, ' + g.width + '×' + g.height + '</li>'
    }).join('')
    workspace.innerHTML =
      '<ul class="' + P + '-list">' + list + '</ul>' +
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Layout <select id="' + P + '-layout" class="tool-input">' +
      '<option value="horizontal">Side by side</option><option value="vertical">Stacked</option></select></label>' +
      '<label class="tool-label">Align <select id="' + P + '-align" class="tool-input">' +
      '<option value="longest">Longest animation</option><option value="shortest">Shortest animation</option></select></label>' +
      '<label><input type="checkbox" id="' + P + '-resize" checked /> Resize to match</label></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="copy-btn" id="' + P + '-add">Add another GIF</button>' +
      '<button class="tool-button" id="' + P + '-merge">Combine & download</button>' +
      '<button class="copy-btn" id="' + P + '-reset">Start over</button></div></div>'
    workspace.style.display = ''
    document.getElementById(P + '-merge').addEventListener('click', merge)
    document.getElementById(P + '-add').addEventListener('click', function () { fileInput.click() })
    document.getElementById(P + '-reset').addEventListener('click', reset)
  }

  function getFrameAt(gif, index) {
    var frames = gif.parsedFrames
    if (index < frames.length) return frames[index]
    var last = frames[frames.length - 1]
    return last
  }

  async function merge() {
    if (gifs.length < 2) { showErr('Add at least two GIFs.'); return }
    var layout = document.getElementById(P + '-layout').value
    var align = document.getElementById(P + '-align').value
    var resize = document.getElementById(P + '-resize').checked

    var frameCounts = gifs.map(function (g) { return g.parsedFrames.length })
    var totalFrames = align === 'shortest' ? Math.min.apply(null, frameCounts) : Math.max.apply(null, frameCounts)

    var cellW = resize
      ? Math.max.apply(null, gifs.map(function (g) { return g.width }))
      : gifs.map(function (g) { return g.width })
    var cellH = resize
      ? Math.max.apply(null, gifs.map(function (g) { return g.height }))
      : gifs.map(function (g) { return g.height })

    var outW, outH
    if (layout === 'horizontal') {
      outW = resize ? cellW * gifs.length : gifs.reduce(function (s, g) { return s + g.width }, 0)
      outH = resize ? cellH : Math.max.apply(null, gifs.map(function (g) { return g.height }))
    } else {
      outW = resize ? cellW : Math.max.apply(null, gifs.map(function (g) { return g.width }))
      outH = resize ? cellH * gifs.length : gifs.reduce(function (s, g) { return s + g.height }, 0)
    }

    progress.style.display = ''
    workspace.style.display = 'none'
    errorEl.style.display = 'none'

    try {
      var combined = []
      for (var fi = 0; fi < totalFrames; fi++) {
        var canvas = document.createElement('canvas')
        canvas.width = outW; canvas.height = outH
        var ctx = canvas.getContext('2d')
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, outW, outH)

        var offsetX = 0, offsetY = 0
        for (var gi = 0; gi < gifs.length; gi++) {
          var g = gifs[gi]
          var frame = getFrameAt(g, fi)
          var cw = resize ? cellW : g.width
          var ch = resize ? cellH : g.height
          var tmp = document.createElement('canvas')
          tmp.width = g.width; tmp.height = g.height
          tmp.getContext('2d').putImageData(
            new ImageData(new Uint8ClampedArray(frame.rgba), g.width, g.height), 0, 0
          )
          var dx = layout === 'horizontal' ? offsetX : offsetX + Math.floor((outW - cw) / 2)
          var dy = layout === 'vertical' ? offsetY : offsetY + Math.floor((outH - ch) / 2)
          if (!resize) {
            dx = layout === 'horizontal' ? offsetX : Math.floor((outW - g.width) / 2)
            dy = layout === 'vertical' ? offsetY : Math.floor((outH - g.height) / 2)
            ctx.drawImage(tmp, dx, dy)
            if (layout === 'horizontal') offsetX += g.width
            else offsetY += g.height
          } else {
            ctx.drawImage(tmp, 0, 0, g.width, g.height, dx, dy, cw, ch)
            if (layout === 'horizontal') offsetX += cw
            else offsetY += ch
          }
        }

        var maxDelay = 0
        gifs.forEach(function (g, gi) {
          var f = getFrameAt(g, fi)
          if (f.delay > maxDelay) maxDelay = f.delay
        })
        combined.push({ rgba: ctx.getImageData(0, 0, outW, outH).data, delay: maxDelay || 100 })
        progressFill.style.width = Math.round((fi / totalFrames) * 80) + '%'
        progressText.textContent = 'Compositing frame ' + (fi + 1) + ' / ' + totalFrames
        if (fi % 3 === 2) await new Promise(function (r) { setTimeout(r, 0) })
      }

      var blob = await encodeFramesToGif(combined, outW, outH, {
        onProgress: function (k, t) {
          progressFill.style.width = 80 + Math.round((k / t) * 20) + '%'
          progressText.textContent = 'Encoding ' + (k + 1) + ' / ' + t
        },
      })
      downloadBlob(blob, 'combined.gif')
      progress.style.display = 'none'
      workspace.style.display = ''
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  async function addGif(file) {
    if (!isGifFile(file)) { showErr('Please upload GIF files only.'); return }
    progress.style.display = ''
    try {
      var data = await parseGifFile(file)
      gifs.push(data)
      progress.style.display = 'none'
      dropzone.style.display = 'none'
      buildWorkspace()
    } catch (e) {
      showErr(e.message || String(e))
    }
  }

  function reset() {
    gifs = []
    workspace.innerHTML = ''
    workspace.style.display = 'none'
    dropzone.style.display = ''
    fileInput.value = ''
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  fileInput.setAttribute('multiple', 'multiple')
  fileInput.setAttribute('accept', 'image/gif')
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('drag-over')
    var files = Array.from(e.dataTransfer.files).filter(isGifFile)
    if (!files.length) return
    ;(async function () {
      for (var i = 0; i < files.length; i++) await addGif(files[i])
    })()
  })
  fileInput.addEventListener('change', function () {
    ;(async function () {
      for (var i = 0; i < fileInput.files.length; i++) await addGif(fileInput.files[i])
    })()
  })
})()
