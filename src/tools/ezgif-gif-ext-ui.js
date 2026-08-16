import {
  computeGifStats,
  computeOverlayPosition,
  getCanvasFilterForEffect,
  computeStaticGifKeyframes,
  formatFrameFilename,
  computeSpriteLayout,
  spriteSheetLimitError,
  spriteSheetCss,
} from './ezgif-gif-ext-core.js'
import { combineLayoutDims, getGifOutputFilename } from './gif-anim-core.js'
import {
  equalPartRanges,
  chunkRanges,
  parseRangeSpec,
  rangesFromCutPoints,
  cutPointsFromRanges,
  describeSegments,
  formatSegmentFilename,
  buildStoredZip,
} from './gif-split-core.js'
import { readGifLoopCount } from './gif-bytes-core.js'
import { downloadBlob, setVisible, nextPaint, makeProgress, formatSize, copyWithFeedback } from './tool-utils.js'
import { streamGifFrames } from './gif-shared.js'

var MAX_GIF = 50 * 1024 * 1024

async function loadGifenc() {
  return import('https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js')
}

// Delegates to the shared streaming decoder so a large GIF costs one
// source-size canvas instead of every frame at once. Keeps this module's
// { frames, width, height, raw } shape for its callers.
//
// onProgress(done, total) is optional and forwarded to the decoder. Streaming
// a large GIF is the slowest step in every one of these tools, so without it
// the progress panel sits frozen for the whole decode.
async function parseGifFile(file, onProgress) {
  var r = await streamGifFrames(file, onProgress ? { onProgress: onProgress } : undefined)
  return {
    frames: r.parsedFrames,
    width: r.width,
    height: r.height,
    raw: r.gif,
    notice: r.notice,
    // The splitter reads the source's Netscape loop block straight off the
    // bytes so every segment it writes inherits the same looping behaviour.
    arrayBuffer: r.arrayBuffer,
  }
}

async function encodeGifFrames(frameData, w, h, repeat, onProgress) {
  var mod = await loadGifenc()
  var enc = mod.GIFEncoder()
  for (var i = 0; i < frameData.length; i++) {
    var rgba = frameData[i].rgba
    var palette = mod.quantize(rgba, 256)
    var indexed = mod.applyPalette(rgba, palette)
    var opts = { palette: palette, delay: Math.max(frameData[i].delay || 20, 20) }
    if (i === 0 && repeat !== undefined) opts.repeat = repeat
    enc.writeFrame(indexed, w, h, opts)
    // Quantizing a frame blocks the main thread for tens of milliseconds; yield
    // between frames so the progress bar actually advances on screen.
    if (onProgress) {
      onProgress((i + 1) / frameData.length, i + 1, frameData.length)
      await nextPaint()
    }
  }
  enc.finish()
  return new Blob([enc.bytes()], { type: 'image/gif' })
}

export function initGifExtTool(config) {
  var mode = config.mode
  var suffix = config.suffix || mode
  var root = document.getElementById('ez-root')
  if (!root) return

  var multi = mode === 'combine'
  var extraInput = mode === 'overlay' ? '<input type="file" id="ei-overlay-file" accept="image/*" hidden />' : ''

  root.innerHTML =
    '<div class="ge-dropzone tool-dropzone" id="ge-dropzone">' +
      '<input type="file" id="ge-file" hidden accept="image/gif" ' + (multi ? 'multiple' : '') + ' />' +
      extraInput +
      '<p>Drop GIF' + (multi ? 's' : '') + ' or click to upload</p>' +
    '</div>' +
    '<div id="ge-settings" hidden></div>' +
    '<div id="ge-progress" class="tool-progress" hidden>' +
      '<p id="ge-progress-text" class="tool-progress-text">Reading GIF…</p>' +
      '<div class="tool-progress-bar"><div id="ge-progress-fill" class="tool-progress-fill"></div></div>' +
      '<p id="ge-progress-detail" class="tool-progress-detail"></p>' +
    '</div>' +
    '<div id="ge-result" hidden>' +
      '<img id="ge-preview" alt="Result" style="max-width:100%;" />' +
      '<pre id="ge-stats" class="tool-hint" style="white-space:pre-wrap;display:none;"></pre>' +
      '<div id="ge-frames" style="display:none;flex-wrap:wrap;gap:8px;"></div>' +
      '<div id="ge-segments" class="gif-segments" style="display:none;"></div>' +
      '<button type="button" class="tool-btn" id="ge-download" style="margin-top:1rem;">Download</button>' +
    '</div>' +
    '<p id="ge-error" class="tool-error" hidden><span id="ge-error-text"></span></p>'

  var dropzone = document.getElementById('ge-dropzone')
  var fileInput = document.getElementById('ge-file')
  var settingsEl = document.getElementById('ge-settings')
  var progressEl = document.getElementById('ge-progress')
  var progressDetail = document.getElementById('ge-progress-detail')
  var progress = makeProgress(
    document.getElementById('ge-progress-text'),
    document.getElementById('ge-progress-fill')
  )
  var resultEl = document.getElementById('ge-result')
  var preview = document.getElementById('ge-preview')
  var statsEl = document.getElementById('ge-stats')
  var framesEl = document.getElementById('ge-frames')
  var segmentsEl = document.getElementById('ge-segments')
  var downloadBtn = document.getElementById('ge-download')
  var errorEl = document.getElementById('ge-error')
  var errorText = document.getElementById('ge-error-text')

  var gifFiles = []
  var overlayImg = null
  var resultBlob = null
  // Set when the output is not a GIF (the sprite sheet is a PNG), so the
  // download does not hand back a .gif full of PNG bytes.
  var resultFilename = null
  var spriteCopyBtn = null
  var frameBlobs = []
  var lastPreviewUrl = null
  var frameUrls = []

  // ── split mode state ───────────────────────────────────────────────────────
  // Splitting decodes at upload time (the timeline needs thumbnails before the
  // user can pick cut points), so the frames outlive a single process() run.
  var splitFrames = null
  var splitWidth = 0
  var splitHeight = 0
  var splitLoop = null
  var splitThumbs = []
  var splitCuts = []
  var splitRanges = []
  var segments = []
  var segmentUrls = []
  // Past this many frames a thumbnail strip costs more than it explains; the
  // timeline falls back to numbered chips so the page still renders instantly.
  var MAX_TIMELINE_THUMBS = 240

  function showState(state) {
    setVisible(dropzone, state === 'upload')
    setVisible(settingsEl, state === 'settings')
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

  // Streaming a large GIF is the slowest step in every one of these tools.
  // streamGifFrames reports (done, total) frames as it composites them.
  function decodeProgress(label) {
    return function (done, total) {
      progress.set(label, total ? done / total : 0)
      setDetail('Frame ' + (done + 1) + ' of ' + total)
    }
  }

  function buildSettings() {
    var html = ''
    if (mode === 'overlay') {
      html += '<button type="button" class="tool-btn tool-btn-secondary" id="ge-pick-overlay">Choose overlay image</button>'
      html += '<label class="tool-label" for="ge-opt-pos">Position</label><select class="tool-input" id="ge-opt-pos"><option value="br">Bottom right</option><option value="mc">Center</option><option value="tl">Top left</option></select>'
    }
    if (mode === 'add-text') {
      html += '<label class="tool-label" for="ge-opt-text">Caption text</label><input class="tool-input" id="ge-opt-text" type="text" value="Hello" />'
      html += '<label class="tool-label" for="ge-opt-font">Font size</label><input class="tool-input" id="ge-opt-font" type="number" value="24" min="10" max="72" />'
    }
    if (mode === 'effects') {
      html += '<label class="tool-label" for="ge-opt-effect">Effect</label><select class="tool-input" id="ge-opt-effect"><option value="grayscale">Grayscale</option><option value="sepia">Sepia</option><option value="invert">Invert</option><option value="blur">Blur</option></select>'
    }
    if (mode === 'combine') {
      html += '<label class="tool-label" for="ge-opt-layout">Layout</label><select class="tool-input" id="ge-opt-layout"><option value="horizontal">Side by side</option><option value="vertical">Stacked</option></select>'
    }
    if (mode === 'split') {
      html += buildSplitSettingsHtml()
    }
    if (mode === 'sprite-sheet') {
      html += '<label class="tool-label" for="ge-opt-cols">Columns (0 = one long row)</label>' +
        '<input class="tool-input" id="ge-opt-cols" type="number" min="0" max="64" value="0" />' +
        '<label class="tool-label" for="ge-opt-sheet-bg">Background</label>' +
        '<select class="tool-input" id="ge-opt-sheet-bg">' +
          '<option value="transparent">Transparent</option>' +
          '<option value="#ffffff">White</option>' +
          '<option value="#000000">Black</option>' +
        '</select>'
    }
    if (mode !== 'analyzer') {
      var actionLabel = 'Process'
      if (mode === 'split') actionLabel = 'Split GIF'
      if (mode === 'sprite-sheet') actionLabel = 'Build sprite sheet'
      html += '<button type="button" class="tool-btn" id="ge-process" style="margin-top:1rem;">' + actionLabel + '</button>'
    }
    settingsEl.innerHTML = html
    var overlayBtn = document.getElementById('ge-pick-overlay')
    if (overlayBtn) {
      overlayBtn.addEventListener('click', function () {
        var inp = document.getElementById('ei-overlay-file') || document.getElementById('ge-overlay-file')
        if (!inp) {
          inp = document.createElement('input')
          inp.type = 'file'
          inp.id = 'ge-overlay-file'
          inp.accept = 'image/*'
          inp.hidden = true
          root.appendChild(inp)
          inp.addEventListener('change', function () {
            if (!inp.files[0]) return
            var reader = new FileReader()
            reader.onload = function () {
              var img = new Image()
              img.onload = function () { overlayImg = img }
              img.src = reader.result
            }
            reader.readAsDataURL(inp.files[0])
          })
        }
        inp.click()
      })
    }
    var btn = document.getElementById('ge-process')
    if (btn) btn.addEventListener('click', process)
    if (mode === 'split') wireSplitSettings()
    if (mode === 'analyzer') process()
  }

  // The CSS is the payoff of a sprite sheet, so it gets a copy button rather
  // than living as text the user has to select out of a <pre>.
  function showSpriteCopyButton(css) {
    if (!spriteCopyBtn) {
      spriteCopyBtn = document.createElement('button')
      spriteCopyBtn.type = 'button'
      spriteCopyBtn.className = 'tool-btn tool-btn-secondary'
      spriteCopyBtn.style.marginTop = '0.75rem'
      spriteCopyBtn.textContent = 'Copy CSS'
      resultEl.insertBefore(spriteCopyBtn, downloadBtn)
    }
    spriteCopyBtn.onclick = function () {
      copyWithFeedback(spriteCopyBtn, css, { idle: 'Copy CSS' })
    }
  }

  // ── split mode ─────────────────────────────────────────────────────────────

  function buildSplitSettingsHtml() {
    var n = splitFrames ? splitFrames.length : 0
    var half = Math.max(1, Math.ceil(n / 2))
    return '' +
      '<label class="tool-label" for="ge-opt-split-method">How to split</label>' +
      '<select class="tool-input" id="ge-opt-split-method">' +
        '<option value="parts">Into equal parts</option>' +
        '<option value="count">Every N frames</option>' +
        '<option value="ranges">Frame ranges I type</option>' +
        '<option value="cuts">Cut points I set on the timeline</option>' +
      '</select>' +
      '<div id="ge-split-parts">' +
        '<label class="tool-label" for="ge-opt-parts">Number of parts</label>' +
        '<input class="tool-input" id="ge-opt-parts" type="number" min="2" max="' + n + '" value="2" />' +
      '</div>' +
      '<div id="ge-split-count">' +
        '<label class="tool-label" for="ge-opt-per">Frames per part</label>' +
        '<input class="tool-input" id="ge-opt-per" type="number" min="1" max="' + n + '" value="' + half + '" />' +
      '</div>' +
      '<div id="ge-split-ranges">' +
        '<label class="tool-label" for="ge-opt-ranges">Frame ranges (first frame is 1, ends included)</label>' +
        '<input class="tool-input" id="ge-opt-ranges" type="text" value="1-' + half + ', ' + (half + 1) + '-' + n + '" />' +
      '</div>' +
      '<p class="tool-hint">' + n + ' frames. Click a frame on the timeline to start a new part there.</p>' +
      '<div class="gif-timeline" id="ge-timeline"></div>' +
      '<p class="tool-note" id="ge-split-summary"></p>'
  }

  function splitMethod() {
    var el = document.getElementById('ge-opt-split-method')
    return el ? el.value : 'parts'
  }

  function wireSplitSettings() {
    var method = document.getElementById('ge-opt-split-method')
    if (method) method.addEventListener('change', function () { syncSplitInputs(); updateSegments() })
    ;['ge-opt-parts', 'ge-opt-per', 'ge-opt-ranges'].forEach(function (id) {
      var el = document.getElementById(id)
      if (el) el.addEventListener('input', updateSegments)
    })
    buildTimeline()
    syncSplitInputs()
    updateSegments()
  }

  function syncSplitInputs() {
    var m = splitMethod()
    setVisible(document.getElementById('ge-split-parts'), m === 'parts')
    setVisible(document.getElementById('ge-split-count'), m === 'count')
    setVisible(document.getElementById('ge-split-ranges'), m === 'ranges')
  }

  function buildTimeline() {
    var el = document.getElementById('ge-timeline')
    if (!el || !splitFrames) return
    el.innerHTML = ''
    for (var i = 0; i < splitFrames.length; i++) {
      var chip = document.createElement('button')
      chip.type = 'button'
      chip.className = 'gif-timeline-frame'
      chip.dataset.index = String(i)
      chip.title = 'Frame ' + (i + 1)
      if (splitThumbs[i]) {
        var img = document.createElement('img')
        img.src = splitThumbs[i]
        img.alt = ''
        chip.appendChild(img)
      }
      var label = document.createElement('span')
      label.className = 'gif-timeline-index'
      label.textContent = String(i + 1)
      chip.appendChild(label)
      el.appendChild(chip)
    }
    el.addEventListener('click', onTimelineClick)
  }

  // Clicking a frame turns the current segmentation into hand-placed cuts and
  // toggles a cut before that frame, so the user keeps whatever the sliders
  // already produced instead of starting from one big segment.
  function onTimelineClick(e) {
    var chip = e.target.closest ? e.target.closest('.gif-timeline-frame') : null
    if (!chip) return
    var idx = parseInt(chip.dataset.index, 10)
    if (!idx) return // frame 1 always starts the first part
    if (splitMethod() !== 'cuts') {
      splitCuts = cutPointsFromRanges(splitRanges)
      var sel = document.getElementById('ge-opt-split-method')
      if (sel) sel.value = 'cuts'
      syncSplitInputs()
    }
    var at = splitCuts.indexOf(idx)
    if (at >= 0) splitCuts.splice(at, 1)
    else splitCuts.push(idx)
    updateSegments()
  }

  function currentRanges() {
    var n = splitFrames ? splitFrames.length : 0
    var m = splitMethod()
    if (m === 'cuts') return rangesFromCutPoints(n, splitCuts)
    if (m === 'ranges') {
      var spec = document.getElementById('ge-opt-ranges')
      return parseRangeSpec(spec ? spec.value : '', n)
    }
    if (m === 'count') {
      var per = document.getElementById('ge-opt-per')
      return chunkRanges(n, per ? parseInt(per.value, 10) : 1)
    }
    var parts = document.getElementById('ge-opt-parts')
    return equalPartRanges(n, parts ? parseInt(parts.value, 10) : 2)
  }

  function describeSplit(ranges) {
    var delays = splitFrames.map(function (f) { return f.delay })
    var described = describeSegments(ranges, delays)
    var shown = described.slice(0, 6).map(function (s) {
      return 'frames ' + (s.start + 1) + '–' + (s.end + 1) + ' (' + (s.durationMs / 1000).toFixed(2) + 's)'
    })
    if (described.length > shown.length) shown.push('+' + (described.length - shown.length) + ' more')
    return described.length + (described.length === 1 ? ' part: ' : ' parts: ') + shown.join(' · ')
  }

  function paintTimeline(ranges) {
    var el = document.getElementById('ge-timeline')
    if (!el) return
    var starts = {}
    for (var i = 0; i < ranges.length; i++) starts[ranges[i].start] = i
    var chips = el.children
    var seg = 0
    for (var k = 0; k < chips.length; k++) {
      var isStart = starts[k] !== undefined
      if (isStart) seg = starts[k]
      chips[k].classList.toggle('is-cut', isStart && k > 0)
      chips[k].classList.toggle('seg-odd', seg % 2 === 1)
      chips[k].classList.toggle('seg-even', seg % 2 === 0)
    }
  }

  function updateSegments() {
    var summary = document.getElementById('ge-split-summary')
    var btn = document.getElementById('ge-process')
    try {
      splitRanges = currentRanges()
      if (!splitRanges.length) throw new Error('That leaves no parts to write.')
      if (summary) {
        summary.classList.remove('tool-error')
        summary.textContent = describeSplit(splitRanges)
      }
      if (btn) btn.disabled = false
    } catch (e) {
      splitRanges = []
      if (summary) {
        summary.classList.add('tool-error')
        summary.textContent = e.message || String(e)
      }
      if (btn) btn.disabled = true
    }
    paintTimeline(splitRanges)
  }

  async function buildSplitThumbs() {
    splitThumbs = []
    if (splitFrames.length > MAX_TIMELINE_THUMBS) return
    var th = 44
    var tw = Math.max(1, Math.round(splitWidth * (th / splitHeight)))
    var src = document.createElement('canvas')
    src.width = splitWidth
    src.height = splitHeight
    var sctx = src.getContext('2d', { willReadFrequently: true })
    var dst = document.createElement('canvas')
    dst.width = tw
    dst.height = th
    var dctx = dst.getContext('2d')
    for (var i = 0; i < splitFrames.length; i++) {
      sctx.putImageData(new ImageData(splitFrames[i].rgba, splitWidth, splitHeight), 0, 0)
      dctx.clearRect(0, 0, tw, th)
      dctx.drawImage(src, 0, 0, splitWidth, splitHeight, 0, 0, tw, th)
      splitThumbs.push(dst.toDataURL('image/png'))
      if (i % 12 === 0) {
        progress.set('Building the frame timeline…', i / splitFrames.length)
        setDetail('Frame ' + (i + 1) + ' of ' + splitFrames.length)
        await nextPaint()
      }
    }
  }

  // Split decodes up front: the timeline has to exist before the user can
  // choose where to cut.
  async function prepareSplit() {
    progress.set('Decoding GIF…', 0)
    setDetail(gifFiles[0].name + ' · ' + formatSize(gifFiles[0].size))
    showState('progress')
    await nextPaint()
    try {
      var parsed = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
      splitFrames = parsed.frames
      splitWidth = parsed.width
      splitHeight = parsed.height
      splitLoop = parsed.arrayBuffer ? readGifLoopCount(new Uint8Array(parsed.arrayBuffer)) : null
      splitCuts = []
      if (splitFrames.length < 2) {
        showError('This GIF has a single frame, so there is nothing to split into parts. ' +
          'Use GIF to Frames if you want it as a still image.')
        return
      }
      await buildSplitThumbs()
      buildSettings()
      showState('settings')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  function clearSegments() {
    segmentUrls.forEach(function (u) { URL.revokeObjectURL(u) })
    segmentUrls = []
    segments = []
    if (segmentsEl) segmentsEl.innerHTML = ''
  }

  function renderSegments() {
    if (!segmentsEl) return
    segmentsEl.innerHTML = ''
    var stem = gifFiles[0].name.replace(/\.gif$/i, '')
    segments.forEach(function (seg, i) {
      var card = document.createElement('div')
      card.className = 'gif-segment-card'

      var img = document.createElement('img')
      var url = URL.createObjectURL(seg.blob)
      segmentUrls.push(url)
      img.src = url
      img.alt = 'Part ' + (i + 1)
      card.appendChild(img)

      var meta = document.createElement('p')
      meta.className = 'gif-segment-meta'
      meta.textContent = 'Part ' + (i + 1) + ' · frames ' + (seg.range.start + 1) + '–' + (seg.range.end + 1) +
        ' · ' + (seg.durationMs / 1000).toFixed(2) + 's · ' + formatSize(seg.blob.size)
      card.appendChild(meta)

      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'tool-btn tool-btn-secondary'
      btn.textContent = 'Download part ' + (i + 1)
      btn.addEventListener('click', function () {
        downloadBlob(seg.blob, formatSegmentFilename(stem, i + 1, segments.length, '.gif'))
      })
      card.appendChild(btn)

      segmentsEl.appendChild(card)
    })
  }

  async function processSplit() {
    if (!splitFrames) return
    if (!splitRanges.length) {
      showError('Set at least one frame range before splitting.')
      return
    }
    var ranges = splitRanges.slice()
    var delays = splitFrames.map(function (f) { return f.delay })
    progress.set('Writing part 1 of ' + ranges.length + '…', 0)
    showState('progress')
    await nextPaint()
    clearSegments()
    var repeat = splitLoop == null ? 0 : splitLoop
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i]
      var slice = splitFrames.slice(range.start, range.end + 1)
      var base = i / ranges.length
      var span = 1 / ranges.length
      var label = 'Writing part ' + (i + 1) + ' of ' + ranges.length + '…'
      setDetail('Frames ' + (range.start + 1) + '–' + (range.end + 1))
      var blob = await encodeGifFrames(slice, splitWidth, splitHeight, repeat, function (ratio) {
        progress.set(label, base + ratio * span)
      })
      var duration = 0
      for (var d = range.start; d <= range.end; d++) duration += Number(delays[d]) || 0
      segments.push({ blob: blob, range: range, durationMs: duration })
    }
    renderSegments()
    preview.style.display = 'none'
    statsEl.style.display = 'none'
    framesEl.style.display = 'none'
    segmentsEl.style.display = ''
    downloadBtn.textContent = 'Download all ' + segments.length + ' parts (ZIP)'
    showState('result')
  }

  async function process() {
    if (!gifFiles.length) return
    if (mode === 'split') {
      try {
        await processSplit()
      } catch (e) {
        showError(e.message || String(e))
      }
      return
    }
    progress.set('Decoding GIF…', 0)
    setDetail(gifFiles[0].name + ' · ' + formatSize(gifFiles[0].size))
    showState('progress')
    await nextPaint()
    try {
      if (mode === 'analyzer') {
        var parsed0 = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
        var delays = parsed0.frames.map(function (f) { return f.delay })
        var stats = computeGifStats(parsed0.frames.length, delays, parsed0.width, parsed0.height)
        statsEl.style.display = ''
        preview.style.display = 'none'
        downloadBtn.style.display = 'none'
        statsEl.textContent = 'Frames: ' + stats.frameCount + '\nSize: ' + parsed0.width + '×' + parsed0.height +
          '\nDuration: ' + (stats.durationMs / 1000).toFixed(2) + 's\nAvg delay: ' + stats.avgDelayCs + ' cs\nFPS: ' + stats.fps
        showState('result')
        return
      }

      if (mode === 'to-frames') {
        var parsedF = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
        framesEl.style.display = 'flex'
        framesEl.innerHTML = ''
        preview.style.display = 'none'
        segmentsEl.style.display = 'none'
        frameBlobs = []
        frameUrls.forEach(function (u) { URL.revokeObjectURL(u) })
        frameUrls = []
        for (var fi = 0; fi < parsedF.frames.length; fi++) {
          progress.set('Extracting frames…', fi / parsedF.frames.length)
          setDetail('Frame ' + (fi + 1) + ' of ' + parsedF.frames.length)
          var c = document.createElement('canvas')
          c.width = parsedF.width
          c.height = parsedF.height
          c.getContext('2d').putImageData(new ImageData(parsedF.frames[fi].rgba, parsedF.width, parsedF.height), 0, 0)
          var blob = await new Promise(function (res) { c.toBlob(res, 'image/png') })
          frameBlobs.push(blob)
          var thumb = document.createElement('img')
          var thumbUrl = URL.createObjectURL(blob)
          frameUrls.push(thumbUrl)
          thumb.src = thumbUrl
          thumb.style.width = '80px'
          thumb.alt = 'Frame ' + (fi + 1)
          framesEl.appendChild(thumb)
        }
        downloadBtn.textContent = 'Download all (ZIP)'
        showState('result')
        return
      }

      if (mode === 'sprite-sheet') {
        var parsedSp = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
        var colsInput = document.getElementById('ge-opt-cols')
        var cols = colsInput ? parseInt(colsInput.value, 10) || 0 : 0
        var layout = computeSpriteLayout(parsedSp.frames.length, parsedSp.width, parsedSp.height, cols)
        var limit = spriteSheetLimitError(layout)
        if (limit) { showError(limit); return }

        progress.set('Laying out frames…', 0)
        setDetail(parsedSp.frames.length + ' frames · ' + layout.columns + ' × ' + layout.rows + ' grid')
        await nextPaint()

        var bgSel = document.getElementById('ge-opt-sheet-bg')
        var bg = bgSel ? bgSel.value : 'transparent'
        var sheet = document.createElement('canvas')
        sheet.width = layout.width
        sheet.height = layout.height
        var sheetCtx = sheet.getContext('2d')
        if (bg !== 'transparent') {
          sheetCtx.fillStyle = bg
          sheetCtx.fillRect(0, 0, layout.width, layout.height)
        }
        var cell = document.createElement('canvas')
        cell.width = parsedSp.width
        cell.height = parsedSp.height
        var cellCtx = cell.getContext('2d')
        var totalMs = 0
        for (var sp = 0; sp < parsedSp.frames.length; sp++) {
          cellCtx.putImageData(new ImageData(parsedSp.frames[sp].rgba, parsedSp.width, parsedSp.height), 0, 0)
          sheetCtx.drawImage(cell, layout.cells[sp].x, layout.cells[sp].y)
          totalMs += Number(parsedSp.frames[sp].delay) || 0
          if (sp % 16 === 0) {
            progress.set('Laying out frames…', sp / parsedSp.frames.length)
            setDetail('Frame ' + (sp + 1) + ' of ' + parsedSp.frames.length)
            await nextPaint()
          }
        }

        resultBlob = await new Promise(function (res) { sheet.toBlob(res, 'image/png') })
        resultFilename = gifFiles[0].name.replace(/\.gif$/i, '') + '-sprite.png'
        var css = spriteSheetCss(layout, parsedSp.frames.length, totalMs, 'sprite')
        if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
        lastPreviewUrl = URL.createObjectURL(resultBlob)
        preview.src = lastPreviewUrl
        preview.style.display = ''
        framesEl.style.display = 'none'
        segmentsEl.style.display = 'none'
        statsEl.style.display = ''
        statsEl.textContent =
          'Sheet: ' + layout.width + '×' + layout.height + ' px (' + formatSize(resultBlob.size) + ')\n' +
          'Frames: ' + parsedSp.frames.length + ' in a ' + layout.columns + ' × ' + layout.rows + ' grid\n' +
          'Each frame: ' + layout.frameWidth + '×' + layout.frameHeight + ' px\n\n' + css
        showSpriteCopyButton(css)
        downloadBtn.textContent = 'Download sprite sheet (PNG)'
        showState('result')
        return
      }

      var parsed = await parseGifFile(gifFiles[0], decodeProgress('Decoding GIF…'))
      var outFrames = parsed.frames
      var outW = parsed.width
      var outH = parsed.height

      progress.pending('Applying changes…')
      setDetail(parsed.frames.length + ' frames · ' + parsed.width + '×' + parsed.height)
      await nextPaint()

      if (mode === 'effects') {
        var effect = document.getElementById('ge-opt-effect')?.value || 'grayscale'
        var filter = getCanvasFilterForEffect(effect)
        outFrames = outFrames.map(function (f) {
          var c = document.createElement('canvas')
          c.width = outW; c.height = outH
          var cx = c.getContext('2d')
          cx.filter = filter
          cx.putImageData(new ImageData(f.rgba, outW, outH), 0, 0)
          return { rgba: cx.getImageData(0, 0, outW, outH).data, delay: f.delay }
        })
      }

      if (mode === 'add-text') {
        var text = document.getElementById('ge-opt-text')?.value || ''
        var fontSize = parseInt(document.getElementById('ge-opt-font')?.value, 10) || 24
        outFrames = outFrames.map(function (f) {
          var c = document.createElement('canvas')
          c.width = outW; c.height = outH
          var cx = c.getContext('2d')
          cx.putImageData(new ImageData(f.rgba, outW, outH), 0, 0)
          cx.fillStyle = 'rgba(255,255,255,0.85)'
          cx.fillRect(0, outH - fontSize - 16, outW, fontSize + 16)
          cx.fillStyle = '#000'
          cx.font = 'bold ' + fontSize + 'px Inter, sans-serif'
          cx.fillText(text, 12, outH - 12)
          return { rgba: cx.getImageData(0, 0, outW, outH).data, delay: f.delay }
        })
      }

      if (mode === 'overlay' && overlayImg) {
        var pos = document.getElementById('ge-opt-pos')?.value || 'br'
        var ow = Math.round(outW * 0.25)
        var oh = Math.round(overlayImg.naturalHeight * (ow / overlayImg.naturalWidth))
        var offset = computeOverlayPosition(outW, outH, ow, oh, pos, 8)
        outFrames = outFrames.map(function (f) {
          var c = document.createElement('canvas')
          c.width = outW; c.height = outH
          var cx = c.getContext('2d')
          cx.putImageData(new ImageData(f.rgba, outW, outH), 0, 0)
          cx.drawImage(overlayImg, offset.x, offset.y, ow, oh)
          return { rgba: cx.getImageData(0, 0, outW, outH).data, delay: f.delay }
        })
      }

      if (mode === 'combine' && gifFiles.length >= 2) {
        var parsedB = await parseGifFile(gifFiles[1], decodeProgress('Decoding second GIF…'))
        var layout = document.getElementById('ge-opt-layout')?.value || 'horizontal'
        var sizes = [{ w: parsed.width, h: parsed.height }, { w: parsedB.width, h: parsedB.height }]
        var dims = combineLayoutDims(layout, sizes)
        outW = dims.width
        outH = dims.height
        var maxLen = Math.max(parsed.frames.length, parsedB.frames.length)
        outFrames = []
        for (var i = 0; i < maxLen; i++) {
          var fa = parsed.frames[i % parsed.frames.length]
          var fb = parsedB.frames[i % parsedB.frames.length]
          var c2 = document.createElement('canvas')
          c2.width = outW; c2.height = outH
          var cx2 = c2.getContext('2d')
          cx2.fillStyle = '#fff'
          cx2.fillRect(0, 0, outW, outH)
          if (layout === 'vertical') {
            cx2.putImageData(new ImageData(fa.rgba, parsed.width, parsed.height), 0, 0)
            cx2.putImageData(new ImageData(fb.rgba, parsedB.width, parsedB.height), 0, parsed.height)
          } else {
            cx2.putImageData(new ImageData(fa.rgba, parsed.width, parsed.height), 0, 0)
            cx2.putImageData(new ImageData(fb.rgba, parsedB.width, parsedB.height), parsed.width, 0)
          }
          outFrames.push({ rgba: cx2.getContext('2d').getImageData(0, 0, outW, outH).data, delay: fa.delay })
        }
      }

      resultBlob = await encodeGifFrames(outFrames, outW, outH, undefined, function (ratio, done, total) {
        progress.set('Encoding GIF…', ratio)
        setDetail('Frame ' + done + ' of ' + total)
      })
      if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl)
      lastPreviewUrl = URL.createObjectURL(resultBlob)
      preview.src = lastPreviewUrl
      preview.style.display = ''
      statsEl.style.display = 'none'
      framesEl.style.display = 'none'
      segmentsEl.style.display = 'none'
      downloadBtn.textContent = 'Download'
      showState('result')
    } catch (e) {
      showError(e.message || String(e))
    }
  }

  async function handleFiles(files) {
    gifFiles = []
    for (var i = 0; i < files.length; i++) {
      if (files[i].type !== 'image/gif') { showError('Please upload GIF files.'); return }
      if (files[i].size > MAX_GIF) { showError('GIF too large (max 50 MB).'); return }
      gifFiles.push(files[i])
    }
    if (mode === 'split') {
      await prepareSplit()
      return
    }
    buildSettings()
    showState('settings')
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
    if (mode === 'split' && segments.length) {
      var stem = gifFiles[0].name.replace(/\.gif$/i, '')
      var files = []
      for (var s = 0; s < segments.length; s++) {
        var buf = await segments[s].blob.arrayBuffer()
        files.push({
          name: formatSegmentFilename(stem, s + 1, segments.length, '.gif'),
          data: new Uint8Array(buf),
        })
      }
      downloadBlob(new Blob([buildStoredZip(files)], { type: 'application/zip' }), stem + '-parts.zip')
      return
    }
    if (mode === 'to-frames' && frameBlobs.length) {
      var stem = gifFiles[0].name.replace(/\.gif$/i, '')
      for (var i = 0; i < frameBlobs.length; i++) {
        downloadBlob(frameBlobs[i], formatFrameFilename(stem, i + 1, frameBlobs.length, '.png'))
      }
      return
    }
    if (!resultBlob) return
    downloadBlob(resultBlob, resultFilename || getGifOutputFilename(gifFiles[0].name, suffix))
  })

  showState('upload')
}

export { parseGifFile, encodeGifFrames }
