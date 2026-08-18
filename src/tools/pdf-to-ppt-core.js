// Pure helpers for the PDF to PPT converter. No DOM, no pdf.js — everything
// here is unit-testable. Coordinate convention: PDF user space is bottom-left
// origin in points (1pt = 1/72in); PowerPoint wants top-left origin in inches.

export function ptToInch(pt) {
  return pt / 72
}

// PDF fonts embedded as subsets carry a 6-letter tag: "ABCDEF+Calibri-Bold".
export function stripSubsetPrefix(name) {
  if (!name || typeof name !== 'string') return ''
  return name.replace(/^[A-Z]{6}\+/, '')
}

var BASE14_MAP = [
  { re: /helvetica|arial/i, face: 'Arial' },
  { re: /times/i, face: 'Times New Roman' },
  { re: /courier/i, face: 'Courier New' },
  { re: /symbol/i, face: 'Symbol' },
  { re: /zapf|dingbat/i, face: 'Wingdings' },
]

// Maps a raw PDF font name to { face, bold, italic }. The face is a name
// PowerPoint can substitute sensibly; style flags come from the name because
// PDF subsets encode them there ("Calibri-BoldItalic").
export function mapFont(rawName) {
  var name = stripSubsetPrefix(rawName)
  var bold = /bold|black|heavy|semibold|demibold/i.test(name)
  var italic = /italic|oblique/i.test(name)
  var face = name.replace(/[-,_]?(bold|black|heavy|semibold|demibold|italic|oblique|regular|light|medium|mt|ps)/gi, '').replace(/[-,_]+$/, '').trim()
  for (var i = 0; i < BASE14_MAP.length; i++) {
    if (BASE14_MAP[i].re.test(name)) { face = BASE14_MAP[i].face; break }
  }
  if (!face) face = 'Arial'
  return { face: face, bold: bold, italic: italic }
}

export function rgbToHex(r, g, b) {
  function c(v) {
    v = Math.max(0, Math.min(255, Math.round(v)))
    return (v < 16 ? '0' : '') + v.toString(16).toUpperCase()
  }
  return c(r) + c(g) + c(b)
}

// A PDF with no text layer is a scan: the OCR offer replaces silent empty
// output. Threshold: fewer than 1 extracted char per page on average.
export function isScannedPdf(charCounts) {
  if (!charCounts || charCounts.length === 0) return false
  var total = 0
  for (var i = 0; i < charCounts.length; i++) total += charCounts[i]
  return total / charCounts.length < 1
}

// Groups pdf.js text items into visual lines by baseline Y. Items on the same
// baseline (within half the smaller font size) join one line, sorted by X.
// Each item: { str, x, y (baseline, bottom-left origin), width, height,
// fontName, fontSize, color }.
export function groupItemsIntoLines(items) {
  var lines = []
  for (var i = 0; i < items.length; i++) {
    var it = items[i]
    if (!it.str || !it.str.trim()) continue
    var placed = false
    for (var j = lines.length - 1; j >= 0 && j >= lines.length - 8; j--) {
      var tol = Math.max(2, Math.min(lines[j].fontSize, it.fontSize || 12) * 0.5)
      if (Math.abs(lines[j].y - it.y) <= tol) {
        lines[j].items.push(it)
        placed = true
        break
      }
    }
    if (!placed) {
      lines.push({ y: it.y, fontSize: it.fontSize || 12, items: [it] })
    }
  }
  lines.forEach(function (line) {
    line.items.sort(function (a, b) { return a.x - b.x })
    line.x = line.items[0].x
    var last = line.items[line.items.length - 1]
    line.xEnd = last.x + (last.width || 0)
    line.fontSize = line.items.reduce(function (m, x) { return Math.max(m, x.fontSize || 0) }, 0) || line.fontSize
    // Join items, inserting a space at positional word gaps — PDFs often
    // encode word spacing via TJ positioning with no literal space chars.
    var text = ''
    for (var t = 0; t < line.items.length; t++) {
      var cur = line.items[t]
      if (t > 0) {
        var prev = line.items[t - 1]
        var gap = cur.x - (prev.x + (prev.width || 0))
        var minGap = Math.min(prev.fontSize || 12, cur.fontSize || 12) * 0.3
        if (gap > minGap && !/\s$/.test(text) && !/^\s/.test(cur.str)) text += ' '
      }
      text += cur.str
    }
    line.text = text.replace(/^\s+/, '')
  })
  lines.sort(function (a, b) { return b.y - a.y }) // top of page first (PDF y grows up)
  return lines
}

// Groups lines into paragraph blocks: a new block starts when the vertical
// gap exceeds 1.8x the font size, or the left edge shifts by more than 3x
// the font size (column/indent change), or font size jumps (heading break).
export function groupLinesIntoBlocks(lines) {
  var blocks = []
  var cur = null
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    if (cur) {
      var prev = cur.lines[cur.lines.length - 1]
      var gap = prev.y - line.y
      var maxGap = Math.max(prev.fontSize, line.fontSize) * 1.8
      var leftShift = Math.abs(line.x - cur.x) > Math.max(prev.fontSize, line.fontSize) * 3
      var sizeJump = Math.max(prev.fontSize, line.fontSize) / Math.max(1, Math.min(prev.fontSize, line.fontSize)) > 1.3
      if (gap > maxGap || gap <= 0 || leftShift || sizeJump) cur = null
    }
    if (!cur) {
      cur = { x: line.x, lines: [] }
      blocks.push(cur)
    }
    cur.lines.push(line)
    cur.x = Math.min(cur.x, line.x)
  }
  blocks.forEach(function (b) {
    b.xEnd = b.lines.reduce(function (m, l) { return Math.max(m, l.xEnd) }, 0)
    b.yTop = b.lines[0].y + b.lines[0].fontSize
    b.yBottom = b.lines[b.lines.length - 1].y - b.lines[b.lines.length - 1].fontSize * 0.25
    b.fontSize = b.lines.reduce(function (m, l) { return Math.max(m, l.fontSize) }, 0)
  })
  return blocks
}

// Converts a block (PDF pts, bottom-left origin) into a PPT text box spec
// (inches, top-left origin). pageHeightPt flips the Y axis.
export function blockToTextBox(block, pageHeightPt) {
  var lineSpacingPt = null
  if (block.lines.length > 1) {
    var gaps = []
    for (var i = 1; i < block.lines.length; i++) {
      gaps.push(block.lines[i - 1].y - block.lines[i].y)
    }
    gaps.sort(function (a, b) { return a - b })
    lineSpacingPt = gaps[Math.floor(gaps.length / 2)]
  }
  return {
    x: ptToInch(block.x),
    y: ptToInch(pageHeightPt - block.yTop),
    w: ptToInch(block.xEnd - block.x) * 1.04 + 0.05, // slack so PPT wrapping never reflows
    h: ptToInch(block.yTop - block.yBottom) + 0.02,
    lineSpacingPt: lineSpacingPt,
    runs: block.lines.map(function (line) {
      var first = line.items[0]
      return {
        text: line.text,
        fontSize: Math.round(line.fontSize) || 12,
        fontName: first.fontName || '',
        color: first.color || '000000',
      }
    }),
  }
}

// Scale-to-fit for mixed page sizes: fits src into dst preserving aspect,
// centered. All units inches. Returns { x, y, w, h }.
export function fitRect(srcW, srcH, dstW, dstH) {
  var scale = Math.min(dstW / srcW, dstH / srcH)
  var w = srcW * scale
  var h = srcH * scale
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w: w, h: h }
}

// Merges nearby bounding boxes into clusters. Boxes: [{x,y,w,h}] in pts.
// Two boxes join a cluster when their gap is under `gapPt`. Used to turn a
// soup of vector-path bboxes into a few croppable regions.
export function clusterBoxes(boxes, gapPt) {
  var gap = gapPt == null ? 8 : gapPt
  var clusters = []
  for (var i = 0; i < boxes.length; i++) {
    var b = boxes[i]
    var target = null
    for (var j = 0; j < clusters.length; j++) {
      var c = clusters[j]
      if (b.x - gap <= c.x + c.w && b.x + b.w + gap >= c.x &&
          b.y - gap <= c.y + c.h && b.y + b.h + gap >= c.y) {
        target = c
        break
      }
    }
    if (target) {
      var x2 = Math.max(target.x + target.w, b.x + b.w)
      var y2 = Math.max(target.y + target.h, b.y + b.h)
      target.x = Math.min(target.x, b.x)
      target.y = Math.min(target.y, b.y)
      target.w = x2 - target.x
      target.h = y2 - target.y
      target.complex = target.complex || b.complex
      target.count = (target.count || 1) + 1
      target.shapes = target.shapes.concat(b.shape ? [b.shape] : [])
    } else {
      clusters.push({ x: b.x, y: b.y, w: b.w, h: b.h, complex: !!b.complex, count: 1, shapes: b.shape ? [b.shape] : [] })
    }
  }
  return clusters
}

// Classifies a constructPath sub-op sequence. ops/coords come straight from
// pdf.js OPS.constructPath args. Returns { kind: 'rect'|'line'|'complex',
// bbox: {x,y,w,h} } in path space (caller applies the CTM).
// Sub-op arg widths: moveTo/lineTo 2, curveTo 6, curveTo2/curveTo3 4,
// closePath 0, rectangle 4 (x, y, w, h).
export function classifyPath(ops, coords, OPS) {
  var xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity
  var kinds = { rect: 0, line: 0, curve: 0, move: 0 }
  var points = []
  var k = 0
  function pt(x, y) {
    if (x < xMin) xMin = x
    if (y < yMin) yMin = y
    if (x > xMax) xMax = x
    if (y > yMax) yMax = y
  }
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i]
    if (op === OPS.rectangle) {
      pt(coords[k], coords[k + 1])
      pt(coords[k] + coords[k + 2], coords[k + 1] + coords[k + 3])
      kinds.rect++
      k += 4
    } else if (op === OPS.moveTo) {
      pt(coords[k], coords[k + 1]); points.push([coords[k], coords[k + 1]]); kinds.move++; k += 2
    } else if (op === OPS.lineTo) {
      pt(coords[k], coords[k + 1]); points.push([coords[k], coords[k + 1]]); kinds.line++; k += 2
    } else if (op === OPS.curveTo) {
      pt(coords[k], coords[k + 1]); pt(coords[k + 2], coords[k + 3]); pt(coords[k + 4], coords[k + 5])
      kinds.curve++; k += 6
    } else if (op === OPS.curveTo2 || op === OPS.curveTo3) {
      pt(coords[k], coords[k + 1]); pt(coords[k + 2], coords[k + 3])
      kinds.curve++; k += 4
    }
    // closePath consumes nothing
  }
  if (xMin === Infinity) return null
  var bbox = { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin }
  var kind = 'complex'
  if (kinds.curve === 0 && kinds.rect === 1 && kinds.line === 0) kind = 'rect'
  else if (kinds.curve === 0 && kinds.rect === 0 && kinds.move === 1 && kinds.line === 1) kind = 'line'
  else if (kinds.curve === 0 && kinds.rect === 0 && kinds.move === 1 && isAxisAlignedRect(points)) kind = 'rect'
  return { kind: kind, bbox: bbox }
}

// True when a moveTo/lineTo point sequence traces an axis-aligned rectangle
// (4 corners, optionally re-closing on the start point). Rectangles drawn as
// explicit paths — pdf-lib, many chart libs — should still become native
// PPT shapes, not image crops.
function isAxisAlignedRect(points) {
  if (points.length < 4 || points.length > 5) return false
  var pts = points.slice()
  if (pts.length === 5) {
    var a = pts[0], z = pts[4]
    if (Math.abs(a[0] - z[0]) > 0.01 || Math.abs(a[1] - z[1]) > 0.01) return false
    pts.pop()
  }
  for (var i = 0; i < 4; i++) {
    var p = pts[i], q = pts[(i + 1) % 4]
    var dx = Math.abs(p[0] - q[0]), dy = Math.abs(p[1] - q[1])
    if (dx > 0.01 && dy > 0.01) return false // diagonal edge
    if (dx <= 0.01 && dy <= 0.01) return false // zero-length edge
  }
  return true
}

// Applies a PDF transform matrix [a,b,c,d,e,f] to a point.
export function applyTransform(m, x, y) {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] }
}

// Multiplies two PDF matrices: result = m2 applied after m1 (m1 × m2 in
// pdf.js convention, where transform(ctm, m) = concat).
export function multiplyTransform(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ]
}

// Transforms an axis-aligned bbox and returns the axis-aligned bounds of the
// transformed corners (handles rotation/flip by over-covering).
export function transformBbox(m, bbox) {
  var p1 = applyTransform(m, bbox.x, bbox.y)
  var p2 = applyTransform(m, bbox.x + bbox.w, bbox.y)
  var p3 = applyTransform(m, bbox.x, bbox.y + bbox.h)
  var p4 = applyTransform(m, bbox.x + bbox.w, bbox.y + bbox.h)
  var xMin = Math.min(p1.x, p2.x, p3.x, p4.x)
  var xMax = Math.max(p1.x, p2.x, p3.x, p4.x)
  var yMin = Math.min(p1.y, p2.y, p3.y, p4.y)
  var yMax = Math.max(p1.y, p2.y, p3.y, p4.y)
  return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin }
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string') return 'slides.pptx'
  var stem = inputName.replace(/\.pdf$/i, '')
  return (stem || 'slides') + '.pptx'
}

// Words from Tesseract ({ text, bbox: {x0,y0,x1,y1} } in canvas px, top-left
// origin) → the same item shape groupItemsIntoLines expects (PDF pts,
// bottom-left origin). pxPerPt is the canvas render scale.
export function ocrWordsToItems(words, canvasHeightPx, pxPerPt) {
  var s = pxPerPt || 1
  var items = []
  for (var i = 0; i < words.length; i++) {
    var w = words[i]
    if (!w.text || !w.text.trim()) continue
    var hPx = w.bbox.y1 - w.bbox.y0
    items.push({
      str: (items.length ? ' ' : '') + w.text,
      x: w.bbox.x0 / s,
      y: (canvasHeightPx - w.bbox.y1) / s, // baseline ≈ bottom of bbox
      width: (w.bbox.x1 - w.bbox.x0) / s,
      height: hPx / s,
      fontSize: hPx / s,
      fontName: 'Arial',
      color: '000000',
    })
  }
  return items
}
