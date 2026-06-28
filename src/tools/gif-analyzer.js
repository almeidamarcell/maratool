import { parseGifFile, formatSize, downloadBlob, isGifFile } from './gif-shared.js'

;(function () {
  var P = 'gan'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var analysis = null

  var DISPOSAL = ['Unspecified', 'None', 'Restore to background', 'Restore to previous']

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function paletteHtml(colors, title) {
    if (!colors || !colors.length) return ''
    var swatches = colors.map(function (c) {
      var hex = '#' + [c[0], c[1], c[2]].map(function (v) {
        return ('0' + v.toString(16)).slice(-2)
      }).join('')
      return '<span class="' + P + '-swatch" style="background:' + hex + '" title="' + hex + '"></span>'
    }).join('')
    return '<div class="' + P + '-palette"><strong>' + title + '</strong> (' + colors.length + ' colors)<div class="' + P + '-swatches">' + swatches + '</div></div>'
  }

  function buildWorkspace() {
    var a = analysis
    var loop = a.gif.lsd && a.gif.lsd.loopCount != null ? a.gif.lsd.loopCount : '—'
    var gct = a.gif.gct && a.gif.gct.colors ? a.gif.gct.colors : null

    var frameRows = a.rawFrames.map(function (f, i) {
      var lp = f.colorTable && f.colorTable.colors ? f.colorTable.colors : null
      return '<tr><td>' + (i + 1) + '</td><td>' + f.dims.width + '×' + f.dims.height + '</td><td>' +
        f.dims.left + ',' + f.dims.top + '</td><td>' + (f.delay || 0) + ' cs</td><td>' +
        (DISPOSAL[f.disposalType] || f.disposalType) + '</td><td>' +
        (lp ? lp.length + ' local' : 'global') + '</td></tr>'
    }).join('')

    workspace.innerHTML =
      '<div class="' + P + '-summary">' +
      '<div class="' + P + '-stat"><span class="' + P + '-stat-val">' + a.width + '×' + a.height + '</span><span>Dimensions</span></div>' +
      '<div class="' + P + '-stat"><span class="' + P + '-stat-val">' + formatSize(a.fileSize) + '</span><span>File size</span></div>' +
      '<div class="' + P + '-stat"><span class="' + P + '-stat-val">' + a.rawFrames.length + '</span><span>Frames</span></div>' +
      '<div class="' + P + '-stat"><span class="' + P + '-stat-val">' + loop + '</span><span>Loop count</span></div>' +
      '</div>' +
      paletteHtml(gct, 'Global palette') +
      '<div class="' + P + '-table-wrap"><table class="' + P + '-table"><thead><tr><th>#</th><th>Size</th><th>Offset</th><th>Delay</th><th>Disposal</th><th>Palette</th></tr></thead><tbody>' +
      frameRows + '</tbody></table></div>' +
      '<div class="' + P + '-actions"><button class="tool-button" id="' + P + '-export">Export JSON</button>' +
      '<button class="copy-btn" id="' + P + '-change">Analyze another</button></div>'

  workspace.style.display = ''
    document.getElementById(P + '-export').addEventListener('click', exportJson)
    document.getElementById(P + '-change').addEventListener('click', reset)

    var style = document.getElementById(P + '-extra-style')
    if (!style) {
      style = document.createElement('style')
      style.id = P + '-extra-style'
      style.textContent =
        '.' + P + '-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem; }' +
        '.' + P + '-stat { background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.75rem; text-align: center; }' +
        '.' + P + '-stat-val { display: block; font-weight: 600; font-size: 1.125rem; }' +
        '.' + P + '-swatches { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 0.5rem; }' +
        '.' + P + '-swatch { width: 16px; height: 16px; border: 1px solid var(--border); border-radius: 2px; }' +
        '.' + P + '-table-wrap { overflow-x: auto; margin: 1rem 0; }' +
        '.' + P + '-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }' +
        '.' + P + '-table th, .' + P + '-table td { border: 1px solid var(--border); padding: 0.375rem 0.5rem; text-align: left; }' +
        '.' + P + '-palette { margin-bottom: 1rem; font-size: 0.875rem; }'
      document.head.appendChild(style)
    }
  }

  function exportJson() {
    var a = analysis
    var payload = {
      dimensions: { width: a.width, height: a.height },
      fileSize: a.fileSize,
      frameCount: a.rawFrames.length,
      loopCount: a.gif.lsd ? a.gif.lsd.loopCount : null,
      globalPaletteSize: a.gif.gct && a.gif.gct.colors ? a.gif.gct.colors.length : 0,
      frames: a.rawFrames.map(function (f, i) {
        return {
          index: i,
          width: f.dims.width,
          height: f.dims.height,
          left: f.dims.left,
          top: f.dims.top,
          delay: f.delay,
          disposalType: f.disposalType,
          localPaletteSize: f.colorTable && f.colorTable.colors ? f.colorTable.colors.length : 0,
        }
      }),
    }
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    downloadBlob(blob, (a.fileName || 'gif').replace(/\.gif$/i, '') + '-metadata.json')
  }

  async function handleFile(file) {
    if (!isGifFile(file)) { showErr('Please upload a GIF file.'); return }
    dropzone.style.display = 'none'
    progress.style.display = ''
    try {
      var data = await parseGifFile(file)
      analysis = {
        gif: data.gif,
        rawFrames: data.rawFrames,
        width: data.width,
        height: data.height,
        fileSize: file.size,
        fileName: file.name,
      }
      progress.style.display = 'none'
      buildWorkspace()
    } catch (e) {
      showErr(e.message || String(e))
      dropzone.style.display = ''
    }
  }

  function reset() {
    analysis = null
    workspace.innerHTML = ''
    workspace.style.display = 'none'
    dropzone.style.display = ''
    fileInput.value = ''
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) handleFile(fileInput.files[0])
  })
})()
