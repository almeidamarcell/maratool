import {
  invertRgba,
  computeEnlargeDims,
  computeAspectPad,
  computeSpriteTiles,
  computeCollageCells,
  computeRoundedRadius,
  computePassportSize,
  buildDataUri,
  computeHalftoneCellSize,
  computeCensorRegion,
  formatImageOutputName,
  listPassportPresets,
  getPassportPreset,
  computeHeadGuide,
  computeCoverPlacement,
  resolveConvertTarget,
  formatConvertedName,
  clampQuality,
  formatTileName,
  computeImageDiff,
  formatDiffSummary,
} from './ezgif-image-core.js'
import { parseExif, explainNoExif } from './ezgif-exif-core.js'
import { buildZip, uniqueZipName } from './zip-store-core.js'
import { combineLayoutDims } from './gif-anim-core.js'
import {
  setVisible,
  nextPaint,
  makeProgress,
  readFileAsDataURL,
  copyWithFeedback,
  downloadBlob,
  formatSize,
} from './tool-utils.js'

var MAX_IMAGE = 25 * 1024 * 1024
var MAX_BATCH = 40
// Brand accent, duplicated here because canvas takes no CSS variables.
var ACCENT = '#c4553a'

// Human label for the work each mode does, shown while the canvas pass runs.
var PROCESS_LABEL = {
  exif: 'Converting image…',
  convert: 'Converting images…',
  metadata: 'Reading metadata…',
  halftone: 'Applying halftone…',
  enlarge: 'Enlarging image…',
  aspect: 'Changing aspect ratio…',
  censor: 'Blurring region…',
  passport: 'Building passport photo…',
  sprite: 'Cutting sprite…',
  collage: 'Building collage…',
  compare: 'Building comparison…',
  rounded: 'Rounding corners…',
  invert: 'Inverting colors…',
}

// Modes that take more than one file.
var MULTI_MODES = { compare: 1, collage: 1, convert: 1 }
// Modes whose controls stay on screen next to a live preview.
var LIVE_SETTINGS = { passport: 1 }

export function initImageTool(config) {
  var mode = config.mode
  var suffix = config.suffix || mode
  var target = resolveConvertTarget(config.target)
  var root = document.getElementById('ez-root')
  if (!root) return

  root.innerHTML =
    '<div class="ei-dropzone tool-dropzone" id="ei-dropzone">' +
      '<input type="file" id="ei-file" hidden ' + (MULTI_MODES[mode] ? 'multiple' : '') + ' accept="image/*" />' +
      '<p id="ei-drop-text">Drop image' + (mode === 'compare' ? 's (2)' : MULTI_MODES[mode] ? 's' : '') + ' or click to upload</p>' +
    '</div>' +
    '<div id="ei-settings" hidden></div>' +
    '<div id="ei-progress" class="tool-progress" hidden>' +
      '<p id="ei-progress-text" class="tool-progress-text">Reading file…</p>' +
      '<div class="tool-progress-bar"><div id="ei-progress-fill" class="tool-progress-fill"></div></div>' +
      '<p id="ei-progress-detail" class="tool-progress-detail"></p>' +
    '</div>' +
    '<div id="ei-result" hidden>' +
      '<div id="ei-views" class="tool-tabs" style="display:none;"></div>' +
      '<canvas id="ei-canvas" style="max-width:100%;"></canvas>' +
      '<img id="ei-preview" alt="Result" style="max-width:100%;display:none;" />' +
      '<div id="ei-meta-table" class="ei-meta-table" style="display:none;"></div>' +
      '<textarea id="ei-output" class="tool-textarea" style="display:none;min-height:120px;" readonly></textarea>' +
      '<p id="ei-info" class="ei-info" style="display:none;"></p>' +
      '<div id="ei-files" class="ei-files" style="display:none;"></div>' +
      '<button type="button" class="tool-btn" id="ei-download" style="margin-top:1rem;">Download</button>' +
      '<button type="button" class="tool-btn" id="ei-download-all" style="margin-top:1rem;display:none;">Download all (ZIP)</button>' +
      '<button type="button" class="tool-btn tool-btn-secondary" id="ei-copy" style="margin-top:0.5rem;display:none;">Copy</button>' +
    '</div>' +
    '<p id="ei-error" class="tool-error" hidden><span id="ei-error-text"></span></p>'

  var dropzone = document.getElementById('ei-dropzone')
  var fileInput = document.getElementById('ei-file')
  var settingsEl = document.getElementById('ei-settings')
  var progressEl = document.getElementById('ei-progress')
  var progressDetail = document.getElementById('ei-progress-detail')
  var progress = makeProgress(
    document.getElementById('ei-progress-text'),
    document.getElementById('ei-progress-fill')
  )
  var resultEl = document.getElementById('ei-result')
  var viewsEl = document.getElementById('ei-views')
  var canvas = document.getElementById('ei-canvas')
  var preview = document.getElementById('ei-preview')
  var metaTableEl = document.getElementById('ei-meta-table')
  var outputEl = document.getElementById('ei-output')
  var infoEl = document.getElementById('ei-info')
  var filesEl = document.getElementById('ei-files')
  var downloadBtn = document.getElementById('ei-download')
  var downloadAllBtn = document.getElementById('ei-download-all')
  var copyBtn = document.getElementById('ei-copy')
  var errorEl = document.getElementById('ei-error')
  var errorText = document.getElementById('ei-error-text')

  var images = []
  var resultBlob = null
  var resultMime = 'image/png'
  var currentNames = []
  // Set by modes whose canvas keeps changing after the run (compare views,
  // passport panning). Download re-encodes on click instead of handing back a
  // blob that was made before the last interaction.
  var liveOutput = null
  // Every entry holds an object URL for its thumbnail; they are revoked before
  // the next run and on pagehide, otherwise a second batch leaks the first.
  var outputFiles = []

  function showState(state) {
    setVisible(dropzone, state === 'upload')
    setVisible(settingsEl, state === 'settings' || (LIVE_SETTINGS[mode] && state === 'result'))
    setVisible(progressEl, state === 'progress')
    setVisible(resultEl, state === 'result')
    setVisible(errorEl, state === 'error')
    if (state !== 'progress') progress.reset()
  }

  function showError(msg) {
    errorText.textContent = msg
    showState('error')
  }

  function setDetail(text) {
    if (progressDetail) progressDetail.textContent = text || ''
  }

  function releaseFiles() {
    outputFiles.forEach(function (f) { if (f.url) URL.revokeObjectURL(f.url) })
    outputFiles = []
    filesEl.innerHTML = ''
  }

  async function loadImage(file, onProgress) {
    if (!file || !file.type.match(/^image\//)) throw new Error(file ? file.name + ' is not an image.' : 'Not an image')
    if (file.size > MAX_IMAGE) throw new Error(file.name + ' is too large (max 25 MB).')
    var dataUrl = await readFileAsDataURL(file, onProgress)
    var img = await new Promise(function (resolve, reject) {
      var el = new Image()
      el.onload = function () { resolve(el) }
      el.onerror = function () { reject(new Error('Could not decode ' + file.name + '.')) }
      el.src = dataUrl
    })
    return { img: img, file: file }
  }

  function buildSettings() {
    var html = ''
    if (mode === 'halftone') {
      html += '<label class="tool-label">Dot density</label><input class="tool-input" id="ei-opt-cells" type="number" value="40" min="10" max="120" />'
    }
    if (mode === 'rounded') {
      html += '<label class="tool-label">Corner radius (%)</label><input class="tool-input" id="ei-opt-radius" type="number" value="15" min="1" max="50" />'
    }
    if (mode === 'enlarge') {
      html += '<label class="tool-label">Scale (%)</label><input class="tool-input" id="ei-opt-scale" type="number" value="200" min="100" max="400" />'
    }
    if (mode === 'aspect') {
      html += '<label class="tool-label">Ratio W:H</label><div style="display:flex;gap:0.5rem;"><input class="tool-input" id="ei-opt-rw" type="number" value="16" /><input class="tool-input" id="ei-opt-rh" type="number" value="9" /></div>'
      html += '<label class="tool-label">Mode</label><select class="tool-input" id="ei-opt-mode"><option value="letterbox">Letterbox</option><option value="crop">Crop</option></select>'
    }
    if (mode === 'censor') {
      html += '<label class="tool-label">X</label><input class="tool-input" id="ei-opt-x" type="number" value="0" />'
      html += '<label class="tool-label">Y</label><input class="tool-input" id="ei-opt-y" type="number" value="0" />'
      html += '<label class="tool-label">Width</label><input class="tool-input" id="ei-opt-w" type="number" value="100" />'
      html += '<label class="tool-label">Height</label><input class="tool-input" id="ei-opt-h" type="number" value="100" />'
      html += '<label class="tool-label">Blur (px)</label><input class="tool-input" id="ei-opt-blur" type="number" value="12" min="2" max="40" />'
    }
    if (mode === 'passport') {
      html += '<label class="tool-label">Size</label><select class="tool-input" id="ei-opt-preset">'
      listPassportPresets().forEach(function (p) {
        html += '<option value="' + p.id + '">' + p.label + '</option>'
      })
      html += '</select>'
      html += '<label class="tool-label">Zoom</label><input class="ei-range" id="ei-opt-zoom" type="range" value="100" min="100" max="300" step="1" />'
      html += '<label class="tool-label">Background</label><select class="tool-input" id="ei-opt-bg">' +
        '<option value="#ffffff">White</option>' +
        '<option value="#f2f2f2">Off-white</option>' +
        '<option value="#dce9f5">Light blue</option>' +
        '</select>'
      html += '<label class="ei-check"><input type="checkbox" id="ei-opt-guides" checked /> Show head and eye-line guides</label>'
    }
    if (mode === 'sprite') {
      html += '<label class="tool-label">Rows</label><input class="tool-input" id="ei-opt-rows" type="number" value="2" min="1" max="20" />'
      html += '<label class="tool-label">Columns</label><input class="tool-input" id="ei-opt-cols" type="number" value="4" min="1" max="20" />'
    }
    if (mode === 'collage') {
      html += '<label class="tool-label">Layout</label><select class="tool-input" id="ei-opt-layout"><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option><option value="grid2x2">2×2 grid</option></select>'
      html += '<label class="tool-label">Gap (px)</label><input class="tool-input" id="ei-opt-gap" type="number" value="8" min="0" max="40" />'
    }
    if (mode === 'convert' && target.lossy) {
      html += '<label class="tool-label">' + target.label + ' quality <span id="ei-quality-val">90%</span></label>' +
        '<input class="ei-range" id="ei-opt-quality" type="range" value="90" min="30" max="100" step="1" />'
    }
    if (mode === 'convert') {
      html += '<p class="tool-hint" id="ei-convert-count">' + images.length +
        (images.length === 1 ? ' image ready.' : ' images ready.') + ' Every one is converted to ' + target.label + '.</p>'
    }
    html += '<button type="button" class="tool-btn" id="ei-process" style="margin-top:1rem;">' +
      (mode === 'metadata' || mode === 'datauri' ? 'Show result'
        : mode === 'convert' ? 'Convert to ' + target.label
        : 'Process') + '</button>'
    settingsEl.innerHTML = html
    var btn = document.getElementById('ei-process')
    if (btn) btn.addEventListener('click', process)

    if (mode === 'convert' && target.lossy) {
      var q = document.getElementById('ei-opt-quality')
      var qv = document.getElementById('ei-quality-val')
      q.addEventListener('input', function () { qv.textContent = q.value + '%' })
    }
    if (mode === 'passport') wirePassportControls()
  }

  function readOpt(id, fallback) {
    var el = document.getElementById(id)
    return el ? el.value : fallback
  }

  function drawRoundedRect(ctx, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(r, 0)
    ctx.lineTo(w - r, 0)
    ctx.quadraticCurveTo(w, 0, w, r)
    ctx.lineTo(w, h - r)
    ctx.quadraticCurveTo(w, h, w - r, h)
    ctx.lineTo(r, h)
    ctx.quadraticCurveTo(0, h, 0, h - r)
    ctx.lineTo(0, r)
    ctx.quadraticCurveTo(0, 0, r, 0)
    ctx.closePath()
  }

  function applyHalftone(ctx, w, h, cells) {
    var cell = computeHalftoneCellSize(w, h, cells)
    var img = ctx.getImageData(0, 0, w, h)
    var data = img.data
    for (var y = 0; y < h; y += cell) {
      for (var x = 0; x < w; x += cell) {
        var r = 0; var g = 0; var b = 0; var n = 0
        for (var dy = 0; dy < cell && y + dy < h; dy++) {
          for (var dx = 0; dx < cell && x + dx < w; dx++) {
            var i = ((y + dy) * w + (x + dx)) * 4
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
          }
        }
        var lum = (r / n + g / n + b / n) / 3
        var radius = (1 - lum / 255) * (cell / 2)
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // ── result panel plumbing ──────────────────────────────────────────────

  function hideResultPanels() {
    canvas.style.display = 'none'
    preview.style.display = 'none'
    metaTableEl.style.display = 'none'
    outputEl.style.display = 'none'
    infoEl.style.display = 'none'
    filesEl.style.display = 'none'
    viewsEl.style.display = 'none'
    downloadBtn.style.display = 'none'
    downloadAllBtn.style.display = 'none'
    copyBtn.style.display = 'none'
  }

  function toBlobAsync(cv, mime, quality) {
    return new Promise(function (resolve) {
      cv.toBlob(function (b) { resolve(b) }, mime, quality)
    })
  }

  function drawOnto(ctx, img, w, h, background) {
    if (background) {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)
  }

  // One row per produced file: thumbnail, name, size, its own download button.
  function renderFileList(items, layout) {
    filesEl.innerHTML = ''
    filesEl.className = 'ei-files' + (layout === 'grid' ? ' ei-files-grid' : '')
    items.forEach(function (item) {
      var row = document.createElement('div')
      row.className = 'ei-file'

      var thumb = document.createElement('img')
      thumb.className = 'ei-file-thumb'
      thumb.alt = ''
      thumb.loading = 'lazy'
      if (item.url) thumb.src = item.url
      row.appendChild(thumb)

      var body = document.createElement('div')
      body.className = 'ei-file-body'
      var name = document.createElement('p')
      name.className = 'ei-file-name'
      name.textContent = item.name
      body.appendChild(name)
      var meta = document.createElement('p')
      meta.className = 'ei-file-meta'
      meta.textContent = item.meta || ''
      body.appendChild(meta)
      row.appendChild(body)

      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'tool-btn tool-btn-secondary ei-file-btn'
      btn.textContent = 'Download'
      btn.addEventListener('click', function () { downloadBlob(item.blob, item.name) })
      row.appendChild(btn)

      filesEl.appendChild(row)
    })
    filesEl.style.display = ''
  }

  async function downloadZip(zipName) {
    if (!outputFiles.length) return
    downloadAllBtn.disabled = true
    var label = downloadAllBtn.textContent
    downloadAllBtn.textContent = 'Zipping…'
    try {
      var taken = {}
      var entries = []
      for (var i = 0; i < outputFiles.length; i++) {
        var buf = await outputFiles[i].blob.arrayBuffer()
        entries.push({ name: uniqueZipName(outputFiles[i].name, taken), data: new Uint8Array(buf) })
        if (i % 8 === 0) await nextPaint()
      }
      var zip = buildZip(entries)
      downloadBlob(new Blob([zip], { type: 'application/zip' }), zipName)
    } finally {
      downloadAllBtn.disabled = false
      downloadAllBtn.textContent = label
    }
  }

  // ── metadata ───────────────────────────────────────────────────────────

  function metaSection(title) {
    var h = document.createElement('p')
    h.className = 'ei-meta-section'
    h.textContent = title
    metaTableEl.appendChild(h)
  }

  function metaRow(label, value, href) {
    var row = document.createElement('div')
    row.className = 'ei-meta-row'
    var l = document.createElement('span')
    l.className = 'ei-meta-label'
    l.textContent = label
    var v = document.createElement('span')
    v.className = 'ei-meta-value'
    if (href) {
      var a = document.createElement('a')
      a.href = href
      a.textContent = value
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      v.appendChild(a)
    } else {
      v.textContent = value
    }
    row.appendChild(l)
    row.appendChild(v)
    metaTableEl.appendChild(row)
  }

  function metaNote(text, linkText, linkHref) {
    var p = document.createElement('p')
    p.className = 'ei-meta-note'
    p.textContent = text
    if (linkText) {
      p.appendChild(document.createTextNode(' '))
      var a = document.createElement('a')
      a.href = linkHref
      a.textContent = linkText
      p.appendChild(a)
    }
    metaTableEl.appendChild(p)
  }

  async function showMetadata() {
    var entry = images[0]
    var file = entry.file
    progress.pending('Reading metadata…')
    var buf = await file.arrayBuffer()
    var exif = parseExif(new Uint8Array(buf))

    metaTableEl.innerHTML = ''
    var plain = []
    function record(label, value) { plain.push(label + ': ' + value) }

    metaSection('File')
    metaRow('Name', file.name); record('Name', file.name)
    metaRow('Type', file.type || 'unknown'); record('Type', file.type || 'unknown')
    var sizeLabel = formatSize(file.size) + ' (' + file.size + ' bytes)'
    metaRow('Size', sizeLabel); record('Size', sizeLabel)
    var dims = entry.img.naturalWidth + ' × ' + entry.img.naturalHeight + ' px'
    metaRow('Dimensions', dims); record('Dimensions', dims)
    var mp = (entry.img.naturalWidth * entry.img.naturalHeight) / 1000000
    if (mp >= 0.1) { metaRow('Megapixels', mp.toFixed(1) + ' MP'); record('Megapixels', mp.toFixed(1) + ' MP') }
    if (file.lastModified) {
      var mod = new Date(file.lastModified).toISOString().slice(0, 19).replace('T', ' ')
      metaRow('File modified', mod + ' UTC'); record('File modified', mod + ' UTC')
    }

    if (exif.found) {
      metaSection('EXIF')
      exif.fields.forEach(function (f) {
        metaRow(f.label, f.value)
        record(f.label, f.value)
      })
      metaRow('Byte order', exif.byteOrder); record('Byte order', exif.byteOrder)
      if (exif.gps) {
        metaSection('Location')
        metaRow('Coordinates', exif.gps.label, exif.gps.mapsUrl)
        record('Coordinates', exif.gps.label)
        if (exif.gps.altitude) { metaRow('Altitude', exif.gps.altitude); record('Altitude', exif.gps.altitude) }
        if (exif.gps.date) { metaRow('GPS date', exif.gps.date); record('GPS date', exif.gps.date) }
        metaNote('This photo says where it was taken. Anyone you send the original to can read the same coordinates.',
          'Strip the metadata →', '/exif-remover/')
      } else {
        metaNote('No GPS tags in this file, so it does not say where it was taken.',
          'Strip the rest of the metadata →', '/exif-remover/')
      }
    } else {
      metaSection('EXIF')
      metaNote(explainNoExif(exif.container))
    }

    hideResultPanels()
    metaTableEl.style.display = ''
    copyBtn.style.display = ''
    copyBtn.onclick = function () { copyWithFeedback(copyBtn, plain.join('\n')) }
    showState('result')
  }

  // ── bulk format conversion ─────────────────────────────────────────────

  async function convertBatch() {
    releaseFiles()
    var quality = target.lossy ? clampQuality(readOpt('ei-opt-quality', '90'), 90) : undefined
    var work = document.createElement('canvas')
    var ctx = work.getContext('2d')
    var mismatch = null

    for (var i = 0; i < images.length; i++) {
      var entry = images[i]
      progress.set('Converting ' + (i + 1) + ' of ' + images.length + '…', i / images.length)
      setDetail(entry.file.name)
      await nextPaint()

      var w = entry.img.naturalWidth
      var h = entry.img.naturalHeight
      work.width = w
      work.height = h
      ctx.clearRect(0, 0, w, h)
      // JPEG has no alpha channel. Without a white plate underneath, every
      // transparent pixel encodes as black.
      drawOnto(ctx, entry.img, w, h, target.mime === 'image/jpeg' ? '#ffffff' : null)

      var blob = await toBlobAsync(work, target.mime, quality)
      if (!blob) throw new Error('Could not encode ' + entry.file.name + ' as ' + target.label + '.')
      if (blob.type && blob.type !== target.mime) mismatch = blob.type
      outputFiles.push({
        name: formatConvertedName(entry.file.name, target.ext),
        blob: blob,
        url: URL.createObjectURL(blob),
        meta: w + ' × ' + h + ' · ' + formatSize(entry.file.size) + ' → ' + formatSize(blob.size),
      })
    }

    progress.done('Done')
    hideResultPanels()
    renderFileList(outputFiles, 'list')
    if (outputFiles.length > 1) downloadAllBtn.style.display = ''
    infoEl.textContent = mismatch
      ? 'Your browser cannot write ' + target.label + ', so these were saved as ' + mismatch + ' instead.'
      : outputFiles.length + (outputFiles.length === 1 ? ' image converted to ' : ' images converted to ') + target.label + '.'
    infoEl.style.display = ''
    downloadAllBtn.onclick = function () { downloadZip('converted-' + target.format + '.zip') }
    showState('result')
  }

  // ── sprite sheet ───────────────────────────────────────────────────────

  async function cutSprite() {
    releaseFiles()
    var rows = parseInt(readOpt('ei-opt-rows', '2'), 10) || 2
    var cols = parseInt(readOpt('ei-opt-cols', '4'), 10) || 4
    var src = images[0].img
    var tiles = computeSpriteTiles(src.naturalWidth, src.naturalHeight, rows, cols)
    if (!tiles.length || !tiles[0].w || !tiles[0].h) {
      throw new Error('That grid is finer than the image — each tile would be less than a pixel.')
    }

    var work = document.createElement('canvas')
    work.width = tiles[0].w
    work.height = tiles[0].h
    var ctx = work.getContext('2d')

    for (var i = 0; i < tiles.length; i++) {
      var t = tiles[i]
      progress.set('Cutting tile ' + (i + 1) + ' of ' + tiles.length + '…', i / tiles.length)
      if (i % 4 === 0) await nextPaint()
      ctx.clearRect(0, 0, work.width, work.height)
      ctx.drawImage(src, t.x, t.y, t.w, t.h, 0, 0, t.w, t.h)
      var blob = await toBlobAsync(work, 'image/png')
      if (!blob) throw new Error('Could not encode tile ' + (i + 1) + '.')
      outputFiles.push({
        name: formatTileName(currentNames[0] || 'sprite', i, tiles.length),
        blob: blob,
        url: URL.createObjectURL(blob),
        meta: t.w + ' × ' + t.h + ' · ' + formatSize(blob.size),
      })
    }

    progress.done('Done')
    hideResultPanels()
    renderFileList(outputFiles, 'grid')
    infoEl.textContent = tiles.length + ' tiles cut on a ' + rows + ' × ' + cols + ' grid, ' +
      tiles[0].w + ' × ' + tiles[0].h + ' px each.'
    infoEl.style.display = ''
    downloadAllBtn.style.display = ''
    downloadAllBtn.onclick = function () {
      downloadZip(formatImageOutputName(currentNames[0] || 'sprite', 'tiles', '.zip'))
    }
    showState('result')
  }

  // ── image comparison ───────────────────────────────────────────────────

  var compareState = null

  function normaliseForCompare() {
    var a = images[0].img
    var b = images[1].img
    var w = Math.max(a.naturalWidth, b.naturalWidth)
    var h = Math.max(a.naturalHeight, b.naturalHeight)
    function plate(img) {
      var cv = document.createElement('canvas')
      cv.width = w
      cv.height = h
      var c = cv.getContext('2d')
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, w, h)
      c.drawImage(img, 0, 0)
      return cv
    }
    return {
      width: w,
      height: h,
      a: plate(a),
      b: plate(b),
      split: 0.5,
      view: 'side',
      mismatch: a.naturalWidth !== b.naturalWidth || a.naturalHeight !== b.naturalHeight,
    }
  }

  function renderCompareSide() {
    var a = images[0].img
    var b = images[1].img
    canvas.width = a.naturalWidth + b.naturalWidth + 8
    canvas.height = Math.max(a.naturalHeight, b.naturalHeight)
    var ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(a, 0, 0)
    ctx.drawImage(b, a.naturalWidth + 8, 0)
    infoEl.textContent = 'Left: ' + currentNames[0] + ' (' + a.naturalWidth + ' × ' + a.naturalHeight + ')' +
      ' · Right: ' + currentNames[1] + ' (' + b.naturalWidth + ' × ' + b.naturalHeight + ')'
  }

  function renderCompareSlider() {
    var s = compareState
    canvas.width = s.width
    canvas.height = s.height
    var ctx = canvas.getContext('2d')
    ctx.drawImage(s.a, 0, 0)
    var x = Math.round(s.split * s.width)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, x, s.height)
    ctx.clip()
    ctx.drawImage(s.b, 0, 0)
    ctx.restore()
    // Divider, drawn thick enough to stay visible once the canvas is scaled
    // down to the column width.
    var lineWidth = Math.max(2, Math.round(s.width / 400))
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - lineWidth, 0, lineWidth * 2, s.height)
    ctx.fillStyle = ACCENT
    ctx.fillRect(x - lineWidth / 2, 0, lineWidth, s.height)
    var r = Math.max(10, Math.round(s.width / 40))
    ctx.beginPath()
    ctx.arc(x, s.height / 2, r, 0, Math.PI * 2)
    ctx.fillStyle = ACCENT
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - r * 0.5, s.height / 2 - r * 0.12, r, r * 0.24)
    infoEl.textContent = 'Drag across the image to move the divider. Left of it: ' + currentNames[1] +
      '. Right of it: ' + currentNames[0] + '.'
  }

  function renderCompareDiff() {
    var s = compareState
    var aData = s.a.getContext('2d').getImageData(0, 0, s.width, s.height).data
    var bData = s.b.getContext('2d').getImageData(0, 0, s.width, s.height).data
    var stats = computeImageDiff(aData, bData)
    canvas.width = s.width
    canvas.height = s.height
    var ctx = canvas.getContext('2d')
    var out = ctx.createImageData(s.width, s.height)
    out.data.set(stats.data)
    ctx.putImageData(out, 0, 0)
    infoEl.textContent = formatDiffSummary(stats, s.mismatch) +
      '. Black means identical; the brighter a pixel, the further apart the two images are there.'
  }

  function renderCompare() {
    if (compareState.view === 'side') renderCompareSide()
    else if (compareState.view === 'slider') renderCompareSlider()
    else renderCompareDiff()
    canvas.style.display = ''
    infoEl.style.display = ''
    canvas.style.cursor = compareState.view === 'slider' ? 'ew-resize' : ''
    liveOutput = {
      canvas: canvas,
      mime: 'image/png',
      quality: 0.92,
      name: formatImageOutputName(currentNames[0] || 'image', suffix + '-' + compareState.view, '.png'),
    }
  }

  function buildViewTabs(views, onPick) {
    viewsEl.innerHTML = ''
    views.forEach(function (v) {
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'tool-tab' + (v.active ? ' active' : '')
      b.textContent = v.label
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(viewsEl.children, function (c) { c.classList.remove('active') })
        b.classList.add('active')
        onPick(v.id)
      })
      viewsEl.appendChild(b)
    })
    viewsEl.style.display = ''
  }

  function canvasPointerRatio(e) {
    var rect = canvas.getBoundingClientRect()
    if (!rect.width) return 0
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  function attachSliderDrag() {
    var dragging = false
    function move(e) {
      if (!compareState || compareState.view !== 'slider') return
      compareState.split = canvasPointerRatio(e)
      renderCompareSlider()
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (!compareState || compareState.view !== 'slider') return
      dragging = true
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId)
      move(e)
    })
    canvas.addEventListener('pointermove', function (e) { if (dragging) move(e) })
    canvas.addEventListener('pointerup', function () { dragging = false })
    canvas.addEventListener('pointercancel', function () { dragging = false })
  }

  function showCompare() {
    compareState = normaliseForCompare()
    hideResultPanels()
    buildViewTabs([
      { id: 'side', label: 'Side by side', active: true },
      { id: 'slider', label: 'Slider' },
      { id: 'difference', label: 'Difference' },
    ], function (id) {
      compareState.view = id
      renderCompare()
    })
    downloadBtn.style.display = ''
    renderCompare()
    showState('result')
  }

  // ── passport photo ─────────────────────────────────────────────────────

  var passportState = { offsetX: 0, offsetY: 0 }

  function drawPassportGuides(ctx, w, h, presetId) {
    var g = computeHeadGuide(presetId)
    function band(y0, y1, fill) {
      ctx.fillStyle = fill
      ctx.fillRect(0, y0 * h, w, (y1 - y0) * h)
    }
    function line(y, color, dash) {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(1, w / 250)
      if (dash) ctx.setLineDash([w / 40, w / 40])
      ctx.beginPath()
      ctx.moveTo(0, y * h)
      ctx.lineTo(w, y * h)
      ctx.stroke()
      ctx.restore()
    }
    band(g.eyeTop, g.eyeBottom, 'rgba(196,85,58,0.24)')
    band(g.headTopMin, g.headTopMax, 'rgba(196,85,58,0.12)')
    band(g.chinMin, g.chinMax, 'rgba(196,85,58,0.12)')
    line(g.eyeTop, 'rgba(196,85,58,0.95)')
    line(g.eyeBottom, 'rgba(196,85,58,0.95)')
    line(g.headTopMax, 'rgba(196,85,58,0.55)', true)
    line(g.chinMin, 'rgba(196,85,58,0.55)', true)
    ctx.save()
    ctx.strokeStyle = 'rgba(196,85,58,0.4)'
    ctx.lineWidth = Math.max(1, w / 400)
    ctx.setLineDash([w / 30, w / 30])
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.stroke()
    ctx.restore()

    var fontSize = Math.max(9, Math.round(w / 34))
    ctx.fillStyle = 'rgba(139,55,32,0.95)'
    ctx.font = '600 ' + fontSize + 'px system-ui, sans-serif'
    ctx.fillText('eye line', w * 0.03, g.eyeTop * h - fontSize * 0.35)
    ctx.fillText('top of head', w * 0.03, g.headTopMax * h - fontSize * 0.35)
    ctx.fillText('chin', w * 0.03, g.chinMin * h + fontSize * 1.1)
  }

  // Returns a clean canvas — no guide overlay — which is what gets downloaded.
  function renderPassportOutput() {
    var presetId = readOpt('ei-opt-preset', 'us')
    var size = computePassportSize(presetId)
    var zoom = (parseInt(readOpt('ei-opt-zoom', '100'), 10) || 100) / 100
    var bg = readOpt('ei-opt-bg', '#ffffff')
    var img = images[0].img
    var place = computeCoverPlacement(img.naturalWidth, img.naturalHeight, size.width, size.height, zoom,
      passportState.offsetX, passportState.offsetY)
    passportState.offsetX = place.offsetX
    passportState.offsetY = place.offsetY

    var out = document.createElement('canvas')
    out.width = size.width
    out.height = size.height
    var ctx = out.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size.width, size.height)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, place.drawX, place.drawY, place.drawW, place.drawH)
    return { canvas: out, presetId: presetId, size: size }
  }

  function renderPassport() {
    var out = renderPassportOutput()
    canvas.width = out.size.width
    canvas.height = out.size.height
    var ctx = canvas.getContext('2d')
    ctx.drawImage(out.canvas, 0, 0)
    var guidesEl = document.getElementById('ei-opt-guides')
    if (!guidesEl || guidesEl.checked) drawPassportGuides(ctx, out.size.width, out.size.height, out.presetId)

    var preset = getPassportPreset(out.presetId)
    infoEl.textContent = preset.label + ' · ' + preset.size + ' at 300 dpi (' + out.size.width + ' × ' + out.size.height +
      ' px). Drag the photo to position the face, then download. The guides are not saved into the file.'
    infoEl.style.display = ''
    canvas.style.display = ''
    canvas.style.cursor = 'grab'
    canvas.style.maxHeight = '60vh'
    canvas.style.width = 'auto'
    downloadBtn.style.display = ''
    liveOutput = {
      render: renderPassportOutput,
      mime: 'image/jpeg',
      quality: 0.95,
      name: formatImageOutputName(currentNames[0] || 'photo', suffix, '.jpg'),
    }
  }

  function wirePassportControls() {
    ;['ei-opt-preset', 'ei-opt-zoom', 'ei-opt-bg', 'ei-opt-guides'].forEach(function (id) {
      var el = document.getElementById(id)
      if (!el) return
      el.addEventListener('input', function () {
        if (!resultEl.hidden) renderPassport()
      })
      el.addEventListener('change', function () {
        if (!resultEl.hidden) renderPassport()
      })
    })
  }

  function attachPassportDrag() {
    var dragging = false
    var last = null
    function scale() {
      var rect = canvas.getBoundingClientRect()
      return rect.width ? canvas.width / rect.width : 1
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (mode !== 'passport' || resultEl.hidden) return
      dragging = true
      last = { x: e.clientX, y: e.clientY }
      canvas.style.cursor = 'grabbing'
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return
      var k = scale()
      passportState.offsetX += (e.clientX - last.x) * k
      passportState.offsetY += (e.clientY - last.y) * k
      last = { x: e.clientX, y: e.clientY }
      renderPassport()
    })
    function stop() {
      dragging = false
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerup', stop)
    canvas.addEventListener('pointercancel', stop)
  }

  // ── main dispatch ──────────────────────────────────────────────────────

  async function process() {
    if (!images.length) return
    // The canvas pass below is synchronous — without yielding a frame first the
    // browser never paints the progress panel and the click looks like a no-op.
    progress.pending(PROCESS_LABEL[mode] || 'Processing…')
    setDetail(currentNames[0] || '')
    showState('progress')
    liveOutput = null
    await nextPaint()
    try {
      if (mode === 'metadata') return await showMetadata()
      if (mode === 'convert') return await convertBatch()
      if (mode === 'sprite') return await cutSprite()
      if (mode === 'compare' && images.length >= 2) return showCompare()
      if (mode === 'passport') {
        hideResultPanels()
        renderPassport()
        showState('result')
        return
      }

      if (mode === 'datauri') {
        var buf = await images[0].file.arrayBuffer()
        var bytes = new Uint8Array(buf)
        // fromCharCode.apply over the whole array throws RangeError once the
        // file is more than ~100 KB, so walk it in chunks and report progress.
        var CHUNK = 0x8000
        var binary = ''
        for (var bi = 0; bi < bytes.length; bi += CHUNK) {
          binary += String.fromCharCode.apply(null, bytes.subarray(bi, bi + CHUNK))
          if (bi % (CHUNK * 32) === 0) {
            progress.set('Encoding base64…', bi / bytes.length)
            await nextPaint()
          }
        }
        var uri = buildDataUri(images[0].file.type || 'image/png', btoa(binary))
        hideResultPanels()
        outputEl.style.display = ''
        outputEl.value = uri
        copyBtn.style.display = ''
        copyBtn.onclick = function () { copyWithFeedback(copyBtn, uri) }
        showState('result')
        return
      }

      var outCanvas = document.createElement('canvas')
      var ctx = outCanvas.getContext('2d')

      if (mode === 'collage') {
        var layout = readOpt('ei-opt-layout', 'horizontal')
        var gap = parseInt(readOpt('ei-opt-gap', '8'), 10) || 0
        var sizes = images.map(function (it) { return { w: it.img.naturalWidth, h: it.img.naturalHeight } })
        var dims = combineLayoutDims(layout, sizes)
        if (layout === 'grid2x2' && sizes.length < 4) throw new Error('Grid layout needs 4 images.')
        outCanvas.width = dims.width + (layout === 'horizontal' ? gap * (sizes.length - 1) : layout === 'grid2x2' ? gap : 0)
        outCanvas.height = dims.height + (layout === 'vertical' ? gap * (sizes.length - 1) : layout === 'grid2x2' ? gap : 0)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, outCanvas.width, outCanvas.height)
        var cells = computeCollageCells(layout, sizes, gap)
        cells.forEach(function (cell, i) {
          if (images[i]) ctx.drawImage(images[i].img, cell.x, cell.y, cell.w, cell.h)
        })
      } else {
        var img = images[0].img
        var w = img.naturalWidth
        var h = img.naturalHeight

        if (mode === 'enlarge') {
          var dims2 = computeEnlargeDims(w, h, readOpt('ei-opt-scale', '200'))
          outCanvas.width = dims2.width
          outCanvas.height = dims2.height
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, dims2.width, dims2.height)
        } else if (mode === 'aspect') {
          var pad = computeAspectPad(w, h, readOpt('ei-opt-rw', '16'), readOpt('ei-opt-rh', '9'), readOpt('ei-opt-mode', 'letterbox'))
          outCanvas.width = pad.canvasW
          outCanvas.height = pad.canvasH
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, pad.canvasW, pad.canvasH)
          ctx.drawImage(img, pad.drawX, pad.drawY, pad.drawW, pad.drawH)
        } else if (mode === 'rounded') {
          var radius = computeRoundedRadius(w, h, readOpt('ei-opt-radius', '15'))
          outCanvas.width = w
          outCanvas.height = h
          drawRoundedRect(ctx, w, h, radius)
          ctx.clip()
          ctx.drawImage(img, 0, 0)
        } else if (mode === 'censor') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
          var reg = computeCensorRegion(w, h,
            parseInt(readOpt('ei-opt-x', '0'), 10),
            parseInt(readOpt('ei-opt-y', '0'), 10),
            parseInt(readOpt('ei-opt-w', '100'), 10),
            parseInt(readOpt('ei-opt-h', '100'), 10))
          var blur = parseInt(readOpt('ei-opt-blur', '12'), 10) || 12
          ctx.filter = 'blur(' + blur + 'px)'
          ctx.drawImage(outCanvas, reg.x, reg.y, reg.width, reg.height, reg.x, reg.y, reg.width, reg.height)
          ctx.filter = 'none'
        } else if (mode === 'invert') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
          var id = ctx.getImageData(0, 0, w, h)
          id.data.set(invertRgba(id.data))
          ctx.putImageData(id, 0, 0)
        } else if (mode === 'halftone') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, w, h)
          ctx.drawImage(img, 0, 0)
          applyHalftone(ctx, w, h, readOpt('ei-opt-cells', '40'))
        } else if (mode === 'exif') {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
          resultMime = images[0].file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
        } else {
          outCanvas.width = w
          outCanvas.height = h
          ctx.drawImage(img, 0, 0)
        }
      }

      canvas.width = outCanvas.width
      canvas.height = outCanvas.height
      canvas.getContext('2d').drawImage(outCanvas, 0, 0)
      hideResultPanels()
      canvas.style.display = ''
      downloadBtn.style.display = ''

      progress.pending('Encoding ' + (resultMime === 'image/jpeg' ? 'JPG' : 'PNG') + '…')
      resultBlob = await toBlobAsync(canvas, resultMime, 0.92)
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  async function handleFiles(fileList) {
    // Reading a 20 MB image off disk and decoding it takes real time. Show the
    // progress panel before the first read so the upload never looks ignored.
    var total = fileList.length
    progress.set(total > 1 ? 'Reading 1 of ' + total + '…' : 'Reading file…', 0)
    setDetail(fileList[0] ? fileList[0].name + ' · ' + formatSize(fileList[0].size) : '')
    showState('progress')
    await nextPaint()

    try {
      if (total > MAX_BATCH) throw new Error('That is ' + total + ' files. Please do at most ' + MAX_BATCH + ' at a time.')
      releaseFiles()
      liveOutput = null
      images = []
      currentNames = []
      passportState = { offsetX: 0, offsetY: 0 }
      for (var i = 0; i < total; i++) {
        var file = fileList[i]
        var base = i / total
        setDetail(file.name + ' · ' + formatSize(file.size))
        var label = total > 1 ? 'Reading ' + (i + 1) + ' of ' + total + '…' : 'Reading file…'
        progress.set(label, base)
        var loaded = await loadImage(file, (function (b, l) {
          return function (ratio) { progress.set(l, b + ratio / total) }
        })(base, label))
        images.push(loaded)
        currentNames.push(file.name)
      }
      if (mode === 'compare' && images.length < 2) {
        showError('Please upload two images to compare.')
        return
      }
      buildSettings()
      showState('settings')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault()
    dropzone.classList.add('drag-over')
  })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault()
    dropzone.classList.remove('drag-over')
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFiles(fileInput.files)
  })

  downloadBtn.addEventListener('click', async function () {
    if (liveOutput) {
      // The canvas has moved since the run (a slider drag, a passport pan), so
      // it is encoded now rather than served from a stale blob.
      var source = liveOutput.render ? liveOutput.render().canvas : liveOutput.canvas
      downloadBtn.disabled = true
      try {
        var blob = await toBlobAsync(source, liveOutput.mime, liveOutput.quality)
        if (blob) downloadBlob(blob, liveOutput.name)
      } finally {
        downloadBtn.disabled = false
      }
      return
    }
    if (!resultBlob) return
    var ext = resultMime === 'image/jpeg' ? '.jpg' : '.png'
    downloadBlob(resultBlob, formatImageOutputName(currentNames[0] || 'image', suffix, ext))
  })

  if (mode === 'compare') attachSliderDrag()
  if (mode === 'passport') attachPassportDrag()
  window.addEventListener('pagehide', releaseFiles)

  showState('upload')
}
