import { loadPdfJs, readFileAsArrayBuffer, setupDropzone, formatBytes } from './pdf-common.js'
import { downloadBlob } from './tool-utils.js'
import {
  ptToInch, mapFont, rgbToHex, isScannedPdf,
  groupItemsIntoLines, groupLinesIntoBlocks, blockToTextBox,
  fitRect, clusterBoxes, classifyPath, applyTransform, multiplyTransform, transformBbox,
  getOutputFilename, ocrWordsToItems,
} from './pdf-to-ppt-core.js'

// PDF to PPT converter — rebuilds each PDF page as editable PowerPoint
// elements (text boxes, images, native shapes) or, in fallback mode, as a
// page image with editable text boxes on top. Everything runs locally.
;(function () {
  'use strict'

  var dropzone = document.getElementById('pp-dropzone')
  var fileInput = document.getElementById('pp-file')
  var modeRow = document.getElementById('pp-mode')
  var modeInputs = modeRow.querySelectorAll('input[name="pp-mode"]')
  var passwordPanel = document.getElementById('pp-password')
  var passwordInput = document.getElementById('pp-password-input')
  var passwordBtn = document.getElementById('pp-password-btn')
  var passwordError = document.getElementById('pp-password-error')
  var ocrPanel = document.getElementById('pp-ocr')
  var ocrLang = document.getElementById('pp-ocr-lang')
  var ocrBtn = document.getElementById('pp-ocr-btn')
  var progressEl = document.getElementById('pp-progress')
  var warningEl = document.getElementById('pp-warning')
  var fileInfo = document.getElementById('pp-file-info')
  var thumbsEl = document.getElementById('pp-thumbs')
  var resultEl = document.getElementById('pp-result')
  var downloadBtn = document.getElementById('pp-download')
  var newBtn = document.getElementById('pp-new')

  var pptxgenPromise = null
  var tesseractPromise = null
  var state = { pdf: null, fileName: '', blob: null, converting: false, seq: 0 }

  function loadPptxGen() {
    if (pptxgenPromise) return pptxgenPromise
    pptxgenPromise = import('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/+esm').then(function (mod) {
      return mod.default || mod
    })
    return pptxgenPromise
  }

  function loadTesseract() {
    if (tesseractPromise) return tesseractPromise
    tesseractPromise = import('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js').then(function (mod) {
      return mod.default || mod
    })
    return tesseractPromise
  }

  function getMode() {
    for (var i = 0; i < modeInputs.length; i++) {
      if (modeInputs[i].checked) return modeInputs[i].value
    }
    return 'elements'
  }

  function show(el, on) { el.style.display = on ? '' : 'none' }

  function setPhase(phase) {
    show(dropzone, phase === 'idle')
    show(passwordPanel, phase === 'password')
    show(ocrPanel, phase === 'ocr')
    show(progressEl, phase === 'progress')
    show(resultEl, phase === 'done')
    if (phase === 'idle') {
      show(warningEl, false)
      thumbsEl.innerHTML = ''
      fileInfo.textContent = ''
    }
  }

  setupDropzone(dropzone, fileInput, openFile)
  setPhase('idle')

  function setModeDisabled(on) {
    for (var i = 0; i < modeInputs.length; i++) modeInputs[i].disabled = on
  }

  for (var mi = 0; mi < modeInputs.length; mi++) {
    modeInputs[mi].addEventListener('change', function () {
      // Reconvert with the new mode if a document is already loaded. During
      // the OCR offer the mode applies when OCR runs — don't convert early.
      if (!state.pdf || state.converting) return
      if (ocrPanel.style.display !== 'none') return
      convert()
    })
  }

  newBtn.addEventListener('click', function () {
    state.seq++
    if (state.pdf) { try { state.pdf.destroy() } catch (e) { /* already gone */ } }
    state.pdf = null
    state.blob = null
    window.__ppLastBlob = null // release the QA-hook reference too
    fileInput.value = ''
    setPhase('idle')
  })

  downloadBtn.addEventListener('click', function () {
    if (state.blob) downloadBlob(state.blob, getOutputFilename(state.fileName))
  })

  async function openFile(file) {
    state.seq++
    var seq = state.seq
    state.fileName = file.name
    fileInfo.textContent = file.name + ' (' + formatBytes(file.size) + ')'
    setPhase('progress')
    progressEl.textContent = 'Loading PDF library...'

    try {
      var pdfjsLib = await loadPdfJs()
      var data = await readFileAsArrayBuffer(file)
      if (seq !== state.seq) return
      progressEl.textContent = 'Opening PDF...'

      var loadingTask = pdfjsLib.getDocument({ data: data })
      loadingTask.onPassword = function (updatePassword, reason) {
        if (seq !== state.seq) return
        setPhase('password')
        passwordError.textContent = reason === 2 ? 'Incorrect password — try again.' : ''
        passwordInput.value = ''
        passwordInput.focus()
        passwordBtn.onclick = function () {
          setPhase('progress')
          progressEl.textContent = 'Opening PDF...'
          updatePassword(passwordInput.value)
        }
      }

      var doc = await loadingTask.promise
      if (seq !== state.seq) { doc.destroy(); return }
      if (state.pdf) { try { state.pdf.destroy() } catch (e2) { /* already destroyed */ } }
      state.pdf = doc

      show(warningEl, state.pdf.numPages > 50)

      // Scan detection: count extractable chars before committing to a path.
      progressEl.textContent = 'Checking text layer...'
      var charCounts = []
      var sample = Math.min(state.pdf.numPages, 10)
      for (var i = 1; i <= sample; i++) {
        var content = await state.pdf.getPage(i).then(function (p) { return p.getTextContent() })
        var chars = 0
        content.items.forEach(function (it) { chars += (it.str || '').trim().length })
        charCounts.push(chars)
      }
      if (seq !== state.seq) return

      if (isScannedPdf(charCounts)) {
        setPhase('ocr')
        ocrBtn.onclick = function () { if (!state.converting) convert(true) }
        return
      }

      convert()
    } catch (e) {
      if (seq !== state.seq) return
      progressEl.textContent = 'Error: ' + e.message
      setPhase('progress')
      setTimeout(function () { if (seq === state.seq) setPhase('idle') }, 4000)
    }
  }

  async function convert(useOcr) {
    var seq = ++state.seq
    state.converting = true
    state.blob = null
    thumbsEl.innerHTML = ''
    setPhase('progress')
    setModeDisabled(true)
    var ocrWorker = null

    try {
      progressEl.textContent = 'Loading PowerPoint library...'
      var PptxGenJS = await loadPptxGen()
      var pdf = state.pdf
      var mode = useOcr ? 'image' : getMode()

      var pptx = new PptxGenJS()
      var firstPage = await pdf.getPage(1)
      var firstVp = firstPage.getViewport({ scale: 1 })
      var slideW = ptToInch(firstVp.width)
      var slideH = ptToInch(firstVp.height)
      // PowerPoint rejects slides over 56in; scale oversized layouts down,
      // fitRect then fits every page into the clamped canvas.
      var clampScale = Math.min(1, 56 / slideW, 56 / slideH)
      slideW *= clampScale
      slideH *= clampScale
      pptx.defineLayout({ name: 'PDFPAGE', width: slideW, height: slideH })
      pptx.layout = 'PDFPAGE'

      if (useOcr) {
        progressEl.textContent = 'Loading OCR engine (' + ocrLang.options[ocrLang.selectedIndex].text + ')...'
        var Tesseract = await loadTesseract()
        ocrWorker = await Tesseract.createWorker(ocrLang.value)
      }
      if (seq !== state.seq) return

      for (var i = 1; i <= pdf.numPages; i++) {
        progressEl.textContent = (useOcr ? 'OCR on page ' : 'Converting page ') + i + ' of ' + pdf.numPages + '...'
        var page = await pdf.getPage(i)
        if (seq !== state.seq) return
        await convertPage(pptx, page, slideW, slideH, mode, ocrWorker, useOcr)
        if (seq !== state.seq) return
        page.cleanup()
      }

      progressEl.textContent = 'Building .pptx file...'
      state.blob = await pptx.write({ outputType: 'blob' })
      if (seq !== state.seq) return
      window.__ppLastBlob = state.blob // QA hook: lets automated tests grab the output
      setPhase('done')
      show(warningEl, false)
    } catch (e) {
      if (seq === state.seq) {
        progressEl.textContent = 'Error: ' + e.message
        setTimeout(function () { if (seq === state.seq) setPhase('idle') }, 4000)
      }
    } finally {
      if (ocrWorker) { try { ocrWorker.terminate() } catch (e2) { /* already terminated */ } }
      if (seq === state.seq) {
        state.converting = false
        setModeDisabled(false)
      }
    }
  }

  async function convertPage(pptx, page, slideW, slideH, mode, ocrWorker, useOcr) {
    var vp = page.getViewport({ scale: 1 })
    var renderScale = Math.min(2, 4096 / Math.max(vp.width, vp.height))
    var renderVp = page.getViewport({ scale: renderScale })

    var canvas = document.createElement('canvas')
    canvas.width = Math.ceil(renderVp.width)
    canvas.height = Math.ceil(renderVp.height)
    var ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport: renderVp }).promise

    addThumbnail(canvas)

    var slide = pptx.addSlide()

    // Mixed page sizes: fit this page's box into the page-1 layout.
    var pageWin = ptToInch(vp.width)
    var pageHin = ptToInch(vp.height)
    var frame = fitRect(pageWin, pageHin, slideW, slideH)
    var fs = frame.w / pageWin // extra scale applied to every element
    function fx(xIn) { return frame.x + xIn * fs }
    function fy(yIn) { return frame.y + yIn * fs }

    var textBoxes = []
    var rotatedBoxes = []
    var pageHeightPt = vp.height

    if (useOcr) {
      var rec = await ocrWorker.recognize(canvas)
      var words = (rec.data && rec.data.words) || []
      var items = ocrWordsToItems(words.map(function (w) { return { text: w.text, bbox: w.bbox } }), canvas.height, renderScale)
      buildBoxesFromItems(items, pageHeightPt, textBoxes)
      inpaintTextOnCanvas(ctx, textBoxes, pageHeightPt, renderScale)
      addCanvasAsBackground(slide, canvas, frame)
      addTextBoxes(slide, textBoxes, fx, fy, fs)
      return
    }

    var extracted = null
    try {
      extracted = await extractPageElements(page, vp)
    } catch (e) {
      extracted = null // element extraction failed — fall back to image mode for this page
    }

    if (!extracted || mode === 'image') {
      // Fallback: page image background + editable text on top.
      var fallbackItems = extracted ? extracted.items : null
      if (!fallbackItems) {
        var content = await page.getTextContent()
        fallbackItems = await contentToItems(page, content, null)
      }
      buildBoxesFromItems(fallbackItems.plain, pageHeightPt, textBoxes)
      rotatedBoxes = fallbackItems.rotated
      inpaintTextOnCanvas(ctx, textBoxes, pageHeightPt, renderScale)
      addCanvasAsBackground(slide, canvas, frame)
      addTextBoxes(slide, textBoxes, fx, fy, fs)
      addRotatedBoxes(slide, rotatedBoxes, pageHeightPt, fx, fy, fs)
      return
    }

    // Elements mode. Z-order: background fill → vector clusters → images → text.
    if (extracted.backgroundColor) {
      slide.background = { color: extracted.backgroundColor }
    }

    // Vector crops must not duplicate text: crop from a text-inpainted copy.
    buildBoxesFromItems(extracted.items.plain, pageHeightPt, textBoxes)
    rotatedBoxes = extracted.items.rotated
    var cropCanvas = null
    var clusters = clusterBoxes(extracted.vectorBoxes, 8)
    for (var c = 0; c < clusters.length; c++) {
      var cl = clusters[c]
      if (cl.w < 2 || cl.h < 2) continue
      if (!cl.complex && cl.count === 1 && cl.shapes.length === 1) {
        var sh = cl.shapes[0]
        var opts = {
          x: fx(ptToInch(sh.x)), y: fy(ptToInch(pageHeightPt - sh.y - sh.h)),
          w: Math.max(0.01, ptToInch(sh.w) * fs), h: Math.max(0.01, ptToInch(sh.h) * fs),
        }
        if (sh.kind === 'rect') {
          opts.fill = sh.fill ? { color: sh.fill } : { color: 'FFFFFF', transparency: 100 }
          opts.line = sh.stroke ? { color: sh.stroke, width: Math.max(0.25, sh.lineWidth || 1) } : { type: 'none' }
          slide.addShape(pptx.ShapeType.rect, opts)
        } else {
          opts.line = { color: sh.stroke || sh.fill || '000000', width: Math.max(0.5, sh.lineWidth || 1) }
          opts.flipV = sh.flipV
          slide.addShape(pptx.ShapeType.line, opts)
        }
      } else {
        if (!cropCanvas) {
          cropCanvas = cloneCanvas(canvas)
          inpaintTextOnCanvas(cropCanvas.getContext('2d', { willReadFrequently: true }),
            textBoxes, pageHeightPt, renderScale)
        }
        addCanvasCrop(slide, cropCanvas, cl, pageHeightPt, renderScale, fx, fy, fs)
      }
    }

    for (var im = 0; im < extracted.images.length; im++) {
      var img = extracted.images[im]
      slide.addImage({
        data: img.dataUrl,
        x: fx(ptToInch(img.x)), y: fy(ptToInch(pageHeightPt - img.y - img.h)),
        w: Math.max(0.01, ptToInch(img.w) * fs), h: Math.max(0.01, ptToInch(img.h) * fs),
      })
    }

    addTextBoxes(slide, textBoxes, fx, fy, fs)
    addRotatedBoxes(slide, rotatedBoxes, pageHeightPt, fx, fy, fs)
  }

  // ── Element extraction ────────────────────────────────────────────────

  async function extractPageElements(page, vp) {
    var pdfjsLib = await loadPdfJs()
    var OPS = pdfjsLib.OPS
    var opList = await page.getOperatorList()
    var content = await page.getTextContent()

    var ctm = [1, 0, 0, 1, 0, 0]
    var stack = []
    var fill = '000000'
    var stroke = '000000'
    var lineWidth = 1
    var textColors = []
    var images = []
    var vectorBoxes = []
    var pendingPath = null
    var backgroundColor = null
    var pageArea = vp.width * vp.height

    function toRgb(args) {
      var r = args[0], g = args[1], b = args[2]
      // pdf.js normally emits 0-255; raw 0-1 floats show up from some paths.
      if (r <= 1 && g <= 1 && b <= 1 && (r % 1 !== 0 || g % 1 !== 0 || b % 1 !== 0)) {
        r *= 255; g *= 255; b *= 255
      }
      return rgbToHex(r, g, b)
    }

    function flushPath(paintKind) {
      if (!pendingPath) return
      var p = pendingPath
      pendingPath = null
      var bbox = transformBbox(ctm, p.bbox)
      if (bbox.w * bbox.h > pageArea * 0.9 && p.kind === 'rect' && paintKind === 'fill') {
        backgroundColor = fill // full-page rect fill = slide background
        return
      }
      var shape = null
      if (p.kind === 'rect' || p.kind === 'line') {
        shape = {
          kind: p.kind, x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h,
          fill: paintKind !== 'stroke' ? fill : null,
          stroke: paintKind !== 'fill' ? stroke : null,
          lineWidth: lineWidth,
          flipV: p.kind === 'line' ? p.flipV : false,
        }
      }
      vectorBoxes.push({ x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h, complex: p.kind === 'complex', shape: shape })
    }

    for (var i = 0; i < opList.fnArray.length; i++) {
      var fn = opList.fnArray[i]
      var args = opList.argsArray[i]
      switch (fn) {
        case OPS.save: stack.push({ ctm: ctm, fill: fill, stroke: stroke, lw: lineWidth }); break
        case OPS.restore: {
          var s = stack.pop()
          if (s) { ctm = s.ctm; fill = s.fill; stroke = s.stroke; lineWidth = s.lw }
          break
        }
        case OPS.transform: ctm = multiplyTransform(ctm, args); break
        case OPS.paintFormXObjectBegin:
          stack.push({ ctm: ctm, fill: fill, stroke: stroke, lw: lineWidth, form: true })
          if (args && args[0]) ctm = multiplyTransform(ctm, args[0])
          break
        case OPS.paintFormXObjectEnd: {
          var f = stack.pop()
          if (f) { ctm = f.ctm; fill = f.fill; stroke = f.stroke; lineWidth = f.lw }
          break
        }
        case OPS.setLineWidth: lineWidth = args[0]; break
        case OPS.setFillRGBColor: fill = toRgb(args); break
        case OPS.setStrokeRGBColor: stroke = toRgb(args); break
        case OPS.setFillGray: fill = rgbToHex(args[0] * 255, args[0] * 255, args[0] * 255); break
        case OPS.setStrokeGray: stroke = rgbToHex(args[0] * 255, args[0] * 255, args[0] * 255); break
        case OPS.setFillCMYKColor: fill = cmykToHex(args); break
        case OPS.setStrokeCMYKColor: stroke = cmykToHex(args); break
        case OPS.showText:
        case OPS.showSpacedText:
        case OPS.nextLineShowText:
        case OPS.nextLineSetSpacingShowText:
          textColors.push(fill)
          break
        case OPS.constructPath: {
          var classified = classifyPath(args[0], args[1], OPS)
          if (classified) {
            pendingPath = classified
            if (classified.kind === 'line' && args[1].length >= 4) {
              // flipV when the line goes bottom-left → top-right in PPT space.
              // Compare CTM-transformed endpoints — a y-flipping CTM (common in
              // form XObjects) inverts the raw path-space direction.
              var lp1 = applyTransform(ctm, args[1][0], args[1][1])
              var lp2 = applyTransform(ctm, args[1][2], args[1][3])
              pendingPath.flipV = lp2.y > lp1.y
            }
          }
          break
        }
        case OPS.fill: case OPS.eoFill: flushPath('fill'); break
        case OPS.stroke: case OPS.closeStroke: flushPath('stroke'); break
        case OPS.fillStroke: case OPS.eoFillStroke:
        case OPS.closeFillStroke: case OPS.closeEOFillStroke: flushPath('fillStroke'); break
        case OPS.endPath: pendingPath = null; break
        case OPS.paintImageXObject:
        case OPS.paintInlineImageXObject: {
          var bbox = transformBbox(ctm, { x: 0, y: 0, w: 1, h: 1 })
          images.push({ name: args[0], inline: fn === OPS.paintInlineImageXObject, x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h })
          break
        }
      }
    }

    // Resolve image data → PNG data URLs.
    var resolved = []
    for (var j = 0; j < images.length; j++) {
      var dataUrl = await imageToDataUrl(page, images[j])
      if (dataUrl) {
        images[j].dataUrl = dataUrl
        resolved.push(images[j])
      }
    }

    var items = await contentToItems(page, content, textColors)
    return { items: items, images: resolved, vectorBoxes: vectorBoxes, textColors: textColors, backgroundColor: backgroundColor }
  }

  function cmykToHex(args) {
    var c = args[0], m = args[1], y = args[2], k = args[3]
    return rgbToHex(255 * (1 - Math.min(1, c + k)), 255 * (1 - Math.min(1, m + k)), 255 * (1 - Math.min(1, y + k)))
  }

  // pdf.js text items → core item shape, split into plain and rotated.
  async function contentToItems(page, content, textColors) {
    var plain = []
    var rotated = []
    for (var i = 0; i < content.items.length; i++) {
      var it = content.items[i]
      if (it.str == null) continue
      var m = it.transform
      var size = Math.hypot(m[2], m[3]) || Math.hypot(m[0], m[1]) || 12
      var angle = Math.atan2(m[1], m[0])
      var fontName = it.fontName
      var realName = ''
      try {
        var fontObj = page.commonObjs.get(fontName)
        realName = (fontObj && fontObj.name) || ''
      } catch (e) {
        var style = content.styles && content.styles[fontName]
        realName = (style && style.fontFamily) || ''
      }
      var color = (textColors && textColors[Math.min(i, textColors.length - 1)]) || '000000'
      var itemObj = {
        str: it.str,
        x: m[4], y: m[5],
        width: it.width || 0, height: it.height || size,
        fontSize: size, fontName: realName, color: color,
      }
      if (Math.abs(angle) > 0.02) {
        rotated.push({ item: itemObj, angleDeg: -angle * 180 / Math.PI })
      } else {
        plain.push(itemObj)
      }
    }
    return { plain: plain, rotated: rotated.map(rotatedItemToBox) }
  }

  function rotatedItemToBox(r) {
    var it = r.item
    return {
      angleDeg: r.angleDeg,
      box: {
        x: ptToInch(it.x),
        y: ptToInch(it.y), // converted against page height at add time
        yPt: it.y,
        xPt: it.x,
        w: ptToInch(Math.max(it.width, it.fontSize)) + 0.1,
        h: ptToInch(it.fontSize) + 0.05,
        runs: [{ text: it.str, fontSize: Math.round(it.fontSize) || 12, fontName: it.fontName, color: it.color }],
      },
    }
  }

  function buildBoxesFromItems(items, pageHeightPt, out) {
    var lines = groupItemsIntoLines(items)
    var blocks = groupLinesIntoBlocks(lines)
    for (var i = 0; i < blocks.length; i++) {
      out.push(blockToTextBox(blocks[i], pageHeightPt))
    }
  }

  function addTextBoxes(slide, boxes, fx, fy, fs) {
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i]
      var runs = b.runs.map(function (r, idx) {
        var font = mapFont(r.fontName)
        return {
          text: r.text,
          options: {
            fontSize: Math.max(1, Math.round(r.fontSize * fs)),
            fontFace: font.face,
            bold: font.bold,
            italic: font.italic,
            color: r.color,
            breakLine: idx < b.runs.length - 1,
          },
        }
      })
      var opts = {
        x: fx(b.x), y: fy(b.y), w: b.w * fs, h: b.h * fs,
        margin: 0, align: 'left', valign: 'top',
      }
      if (b.lineSpacingPt) opts.lineSpacing = b.lineSpacingPt * fs
      slide.addText(runs, opts)
    }
  }

  function addRotatedBoxes(slide, rotatedBoxes, pageHeightPt, fx, fy, fs) {
    for (var i = 0; i < rotatedBoxes.length; i++) {
      var r = rotatedBoxes[i]
      var b = r.box
      var font = mapFont(b.runs[0].fontName)
      slide.addText(b.runs[0].text, {
        x: fx(b.x), y: fy(ptToInch(pageHeightPt - b.yPt) - b.h), w: b.w * fs, h: b.h * fs,
        margin: 0, align: 'left', valign: 'bottom',
        fontSize: Math.max(1, Math.round(b.runs[0].fontSize * fs)),
        fontFace: font.face, bold: font.bold, italic: font.italic,
        color: b.runs[0].color,
        rotate: Math.round(((r.angleDeg % 360) + 360) % 360),
      })
    }
  }

  // ── Canvas helpers ────────────────────────────────────────────────────

  function cloneCanvas(src) {
    var c = document.createElement('canvas')
    c.width = src.width
    c.height = src.height
    // willReadFrequently must be set on the FIRST getContext call — the later
    // inpainting getImageData calls would otherwise hit a GPU-backed canvas.
    c.getContext('2d', { willReadFrequently: true }).drawImage(src, 0, 0)
    return c
  }

  // Paints text bounding boxes with the sampled surrounding background color
  // so the background image doesn't double the editable text on top of it.
  function inpaintTextOnCanvas(ctx, boxes, pageHeightPt, renderScale) {
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i]
      var x = Math.max(0, Math.floor(b.x * 72 * renderScale) - 1)
      var y = Math.max(0, Math.floor(b.y * 72 * renderScale) - 1)
      var w = Math.ceil(b.w * 72 * renderScale) + 2
      var h = Math.ceil(b.h * 72 * renderScale) + 2
      if (w < 1 || h < 1) continue
      ctx.fillStyle = sampleBorderColor(ctx, x, y, w, h)
      ctx.fillRect(x, y, w, h)
    }
  }

  function sampleBorderColor(ctx, x, y, w, h) {
    var samples = []
    var pts = [
      [x - 2, y - 2], [x + w / 2, y - 3], [x + w + 2, y - 2],
      [x - 3, y + h / 2], [x + w + 3, y + h / 2],
      [x - 2, y + h + 2], [x + w / 2, y + h + 3], [x + w + 2, y + h + 2],
    ]
    for (var i = 0; i < pts.length; i++) {
      var px = Math.round(pts[i][0]), py = Math.round(pts[i][1])
      if (px < 0 || py < 0 || px >= ctx.canvas.width || py >= ctx.canvas.height) continue
      var d = ctx.getImageData(px, py, 1, 1).data
      samples.push(d)
    }
    if (!samples.length) return '#ffffff'
    var r = 0, g = 0, b = 0
    samples.forEach(function (s) { r += s[0]; g += s[1]; b += s[2] })
    var n = samples.length
    return 'rgb(' + Math.round(r / n) + ',' + Math.round(g / n) + ',' + Math.round(b / n) + ')'
  }

  function addCanvasAsBackground(slide, canvas, frame) {
    slide.addImage({ data: canvas.toDataURL('image/png'), x: frame.x, y: frame.y, w: frame.w, h: frame.h })
  }

  function addCanvasCrop(slide, canvas, clusterPt, pageHeightPt, renderScale, fx, fy, fs) {
    var x = Math.max(0, Math.floor(clusterPt.x * renderScale))
    var yTopPt = pageHeightPt - clusterPt.y - clusterPt.h
    var y = Math.max(0, Math.floor(yTopPt * renderScale))
    var w = Math.min(canvas.width - x, Math.ceil(clusterPt.w * renderScale))
    var h = Math.min(canvas.height - y, Math.ceil(clusterPt.h * renderScale))
    if (w < 2 || h < 2) return
    var crop = document.createElement('canvas')
    crop.width = w
    crop.height = h
    crop.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h)
    slide.addImage({
      data: crop.toDataURL('image/png'),
      x: fx(ptToInch(clusterPt.x)), y: fy(ptToInch(yTopPt)),
      w: Math.max(0.01, ptToInch(clusterPt.w) * fs), h: Math.max(0.01, ptToInch(clusterPt.h) * fs),
    })
  }

  async function imageToDataUrl(page, imgRef) {
    try {
      var imgObj = await new Promise(function (resolve, reject) {
        var timer = setTimeout(function () { reject(new Error('image timeout')) }, 5000)
        try {
          if (imgRef.inline) {
            clearTimeout(timer)
            resolve(imgRef.name) // inline images arrive as the arg itself
            return
          }
          page.objs.get(imgRef.name, function (obj) {
            clearTimeout(timer)
            resolve(obj)
          })
        } catch (e) {
          clearTimeout(timer)
          reject(e)
        }
      })
      if (!imgObj) return null

      var c = document.createElement('canvas')
      c.width = imgObj.width
      c.height = imgObj.height
      var ctx = c.getContext('2d')
      if (imgObj.bitmap) {
        ctx.drawImage(imgObj.bitmap, 0, 0)
      } else if (imgObj.data) {
        var imageData = ctx.createImageData(imgObj.width, imgObj.height)
        var src = imgObj.data
        var dst = imageData.data
        var n = imgObj.width * imgObj.height
        if (src.length === n * 4) {
          dst.set(src)
        } else if (src.length === n * 3) {
          for (var p = 0, q = 0; p < n; p++, q += 3) {
            dst[p * 4] = src[q]; dst[p * 4 + 1] = src[q + 1]; dst[p * 4 + 2] = src[q + 2]; dst[p * 4 + 3] = 255
          }
        } else if (src.length === n) {
          for (var g = 0; g < n; g++) {
            dst[g * 4] = src[g]; dst[g * 4 + 1] = src[g]; dst[g * 4 + 2] = src[g]; dst[g * 4 + 3] = 255
          }
        } else {
          return null
        }
        ctx.putImageData(imageData, 0, 0)
      } else {
        return null
      }
      return c.toDataURL('image/png')
    } catch (e) {
      return null
    }
  }

  function addThumbnail(canvas) {
    var t = document.createElement('canvas')
    var scale = 180 / canvas.width
    t.width = 180
    t.height = Math.round(canvas.height * scale)
    t.getContext('2d').drawImage(canvas, 0, 0, t.width, t.height)
    t.className = 'pp-thumb'
    thumbsEl.appendChild(t)
  }
})()
