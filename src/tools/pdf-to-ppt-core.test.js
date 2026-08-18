import { describe, test, expect } from 'vitest'
import {
  ptToInch,
  stripSubsetPrefix,
  mapFont,
  rgbToHex,
  isScannedPdf,
  groupItemsIntoLines,
  groupLinesIntoBlocks,
  blockToTextBox,
  fitRect,
  clusterBoxes,
  classifyPath,
  applyTransform,
  multiplyTransform,
  transformBbox,
  getOutputFilename,
  ocrWordsToItems,
} from './pdf-to-ppt-core.js'

// Mirrors pdf.js OPS values used by classifyPath.
const OPS = { moveTo: 13, lineTo: 14, curveTo: 15, curveTo2: 16, curveTo3: 17, closePath: 18, rectangle: 19 }

function item(str, x, y, opts) {
  return Object.assign({ str, x, y, width: str.length * 5, height: 12, fontSize: 12, fontName: 'Arial', color: '000000' }, opts)
}

describe('ptToInch', () => {
  test('72pt is one inch', () => {
    expect(ptToInch(72)).toBe(1)
    expect(ptToInch(612)).toBeCloseTo(8.5)
  })
})

describe('font mapping', () => {
  test('strips subset prefix', () => {
    expect(stripSubsetPrefix('ABCDEF+Calibri-Bold')).toBe('Calibri-Bold')
    expect(stripSubsetPrefix('Calibri')).toBe('Calibri')
    expect(stripSubsetPrefix('')).toBe('')
  })

  test('maps base-14 fonts and detects style flags', () => {
    expect(mapFont('ABCDEF+Helvetica-BoldOblique')).toEqual({ face: 'Arial', bold: true, italic: true })
    expect(mapFont('Times-Roman')).toEqual({ face: 'Times New Roman', bold: false, italic: false })
    expect(mapFont('Courier')).toEqual({ face: 'Courier New', bold: false, italic: false })
  })

  test('passes real font names through without style suffix', () => {
    const f = mapFont('GHIJKL+Calibri-BoldItalic')
    expect(f.face).toBe('Calibri')
    expect(f.bold).toBe(true)
    expect(f.italic).toBe(true)
  })

  test('falls back to Arial on empty', () => {
    expect(mapFont('').face).toBe('Arial')
  })
})

describe('rgbToHex', () => {
  test('converts and clamps', () => {
    expect(rgbToHex(255, 0, 0)).toBe('FF0000')
    expect(rgbToHex(0, 128, 255)).toBe('0080FF')
    expect(rgbToHex(-5, 300, 12)).toBe('00FF0C')
  })
})

describe('isScannedPdf', () => {
  test('true when almost no text across pages', () => {
    expect(isScannedPdf([0, 0, 0])).toBe(true)
    expect(isScannedPdf([2, 0, 0])).toBe(true)
  })
  test('false for normal documents', () => {
    expect(isScannedPdf([500, 300])).toBe(false)
    expect(isScannedPdf([])).toBe(false)
  })
})

describe('groupItemsIntoLines', () => {
  test('joins same-baseline items, sorted by x', () => {
    const lines = groupItemsIntoLines([
      item('world', 60, 700),
      item('Hello ', 20, 700.5),
      item('Next line', 20, 680),
    ])
    expect(lines).toHaveLength(2)
    expect(lines[0].text).toBe('Hello world')
    expect(lines[1].text).toBe('Next line')
  })

  test('inserts a space at positional word gaps (TJ-encoded spacing)', () => {
    const lines = groupItemsIntoLines([
      item('Hello', 20, 700), // width 25, ends at 45
      item('world', 60, 700), // 15pt gap, no literal space anywhere
    ])
    expect(lines[0].text).toBe('Hello world')
  })

  test('does not double a space when items carry literal spaces', () => {
    const lines = groupItemsIntoLines([
      item('Hello ', 20, 700),
      item('world', 60, 700),
    ])
    expect(lines[0].text).toBe('Hello world')
  })

  test('skips whitespace-only items and orders top-down', () => {
    const lines = groupItemsIntoLines([
      item('  ', 10, 500),
      item('bottom', 10, 100),
      item('top', 10, 700),
    ])
    expect(lines.map(l => l.text)).toEqual(['top', 'bottom'])
  })
})

describe('groupLinesIntoBlocks', () => {
  test('splits on paragraph gap', () => {
    const lines = groupItemsIntoLines([
      item('para one line one', 20, 700),
      item('para one line two', 20, 686),
      item('para two after a gap', 20, 630),
    ])
    const blocks = groupLinesIntoBlocks(lines)
    expect(blocks).toHaveLength(2)
    expect(blocks[0].lines).toHaveLength(2)
  })

  test('splits on heading-size jump', () => {
    const lines = groupItemsIntoLines([
      item('Big Heading', 20, 700, { fontSize: 24, height: 24 }),
      item('body text right below', 20, 682),
    ])
    const blocks = groupLinesIntoBlocks(lines)
    expect(blocks).toHaveLength(2)
  })

  test('splits on column shift', () => {
    const lines = groupItemsIntoLines([
      item('left column', 20, 700),
      item('right column', 320, 686),
    ])
    expect(groupLinesIntoBlocks(lines)).toHaveLength(2)
  })
})

describe('blockToTextBox', () => {
  test('flips Y axis and converts to inches', () => {
    const lines = groupItemsIntoLines([item('hello', 72, 720 - 12)]) // top area of a 792pt page
    const box = blockToTextBox(groupLinesIntoBlocks(lines)[0], 792)
    expect(box.x).toBeCloseTo(1)
    expect(box.y).toBeCloseTo((792 - (708 + 12)) / 72, 2)
    expect(box.runs).toHaveLength(1)
    expect(box.runs[0].fontSize).toBe(12)
  })

  test('computes median line spacing for multi-line blocks', () => {
    const lines = groupItemsIntoLines([
      item('one', 20, 700),
      item('two', 20, 686),
      item('three', 20, 672),
    ])
    const box = blockToTextBox(groupLinesIntoBlocks(lines)[0], 792)
    expect(box.lineSpacingPt).toBe(14)
  })
})

describe('fitRect', () => {
  test('centers and preserves aspect', () => {
    const r = fitRect(10, 5, 20, 20)
    expect(r).toEqual({ x: 0, y: 5, w: 20, h: 10 })
  })
  test('identity when same size', () => {
    expect(fitRect(8.5, 11, 8.5, 11)).toEqual({ x: 0, y: 0, w: 8.5, h: 11 })
  })
})

describe('clusterBoxes', () => {
  test('merges overlapping/nearby boxes', () => {
    const clusters = clusterBoxes([
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 12, y: 0, w: 10, h: 10 },
      { x: 200, y: 200, w: 5, h: 5 },
    ], 8)
    expect(clusters).toHaveLength(2)
    expect(clusters[0].w).toBe(22)
    expect(clusters[0].count).toBe(2)
  })

  test('complex flag propagates', () => {
    const clusters = clusterBoxes([
      { x: 0, y: 0, w: 10, h: 10 },
      { x: 5, y: 5, w: 10, h: 10, complex: true },
    ], 0)
    expect(clusters[0].complex).toBe(true)
  })
})

describe('classifyPath', () => {
  test('single rectangle', () => {
    const r = classifyPath([OPS.rectangle], [10, 20, 100, 50], OPS)
    expect(r.kind).toBe('rect')
    expect(r.bbox).toEqual({ x: 10, y: 20, w: 100, h: 50 })
  })

  test('straight line', () => {
    const r = classifyPath([OPS.moveTo, OPS.lineTo], [0, 0, 100, 0], OPS)
    expect(r.kind).toBe('line')
  })

  test('curves are complex', () => {
    const r = classifyPath([OPS.moveTo, OPS.curveTo], [0, 0, 10, 10, 20, 20, 30, 0], OPS)
    expect(r.kind).toBe('complex')
  })

  test('axis-aligned closed polygon is a rect (pdf-lib style)', () => {
    // moveTo + 3 lineTo + closePath tracing a 200x60 rectangle
    const r = classifyPath(
      [OPS.moveTo, OPS.lineTo, OPS.lineTo, OPS.lineTo, OPS.closePath],
      [72, 560, 272, 560, 272, 620, 72, 620],
      OPS
    )
    expect(r.kind).toBe('rect')
    expect(r.bbox).toEqual({ x: 72, y: 560, w: 200, h: 60 })
  })

  test('diagonal polygon stays complex', () => {
    const r = classifyPath(
      [OPS.moveTo, OPS.lineTo, OPS.lineTo, OPS.lineTo],
      [0, 0, 10, 5, 20, 0, 10, -5],
      OPS
    )
    expect(r.kind).toBe('complex')
  })

  test('empty path returns null', () => {
    expect(classifyPath([OPS.closePath], [], OPS)).toBeNull()
  })
})

describe('transforms', () => {
  test('applyTransform translates and scales', () => {
    expect(applyTransform([2, 0, 0, 2, 10, 5], 3, 4)).toEqual({ x: 16, y: 13 })
  })

  test('multiplyTransform composes with identity', () => {
    const m = [2, 0, 0, 3, 4, 5]
    expect(multiplyTransform([1, 0, 0, 1, 0, 0], m)).toEqual(m)
  })

  test('transformBbox over-covers rotated boxes', () => {
    // 90° rotation: [0,1,-1,0,0,0]
    const r = transformBbox([0, 1, -1, 0, 0, 0], { x: 0, y: 0, w: 10, h: 20 })
    expect(r.w).toBe(20)
    expect(r.h).toBe(10)
  })
})

describe('getOutputFilename', () => {
  test('swaps extension', () => {
    expect(getOutputFilename('deck.pdf')).toBe('deck.pptx')
    expect(getOutputFilename('deck.PDF')).toBe('deck.pptx')
    expect(getOutputFilename('')).toBe('slides.pptx')
  })
})

describe('mapFont base-14 extras', () => {
  test('maps Symbol and ZapfDingbats', () => {
    expect(mapFont('Symbol').face).toBe('Symbol')
    expect(mapFont('ABCDEF+ZapfDingbats').face).toBe('Wingdings')
  })
})

describe('groupItemsIntoLines lookback window', () => {
  test('item matching a baseline beyond the 8-line window starts a new line', () => {
    const items = []
    for (let i = 0; i < 9; i++) items.push(item('line' + i, 20, 700 - i * 20))
    items.push(item('late', 200, 700)) // same baseline as line0, but 9 lines back
    const lines = groupItemsIntoLines(items)
    expect(lines).toHaveLength(10)
    expect(lines.filter(l => Math.abs(l.y - 700) < 0.01)).toHaveLength(2)
  })
})

describe('groupLinesIntoBlocks non-positive gap', () => {
  test('splits when the next line is not below the previous one', () => {
    const blocks = groupLinesIntoBlocks([
      { y: 700, x: 20, fontSize: 12, xEnd: 120 },
      { y: 706, x: 20, fontSize: 12, xEnd: 120 }, // above the previous line
    ])
    expect(blocks).toHaveLength(2)
  })
})

describe('fitRect height-constrained', () => {
  test('centers horizontally when height limits the scale', () => {
    expect(fitRect(5, 10, 20, 20)).toEqual({ x: 5, y: 0, w: 10, h: 20 })
  })
})

describe('clusterBoxes defaults and shapes', () => {
  test('uses 8pt gap by default and accumulates shapes', () => {
    const clusters = clusterBoxes([
      { x: 0, y: 0, w: 10, h: 10, shape: { kind: 'rect' } },
      { x: 15, y: 0, w: 10, h: 10, shape: { kind: 'line' } }, // 5pt gap < default 8
    ])
    expect(clusters).toHaveLength(1)
    expect(clusters[0].shapes).toHaveLength(2)
  })

  test('boxes without a shape leave shapes empty', () => {
    const clusters = clusterBoxes([{ x: 0, y: 0, w: 10, h: 10 }], 8)
    expect(clusters[0].shapes).toEqual([])
  })
})

describe('classifyPath curve variants', () => {
  test('curveTo2/curveTo3 consume 4 coords and are complex', () => {
    const r = classifyPath([OPS.moveTo, OPS.curveTo2, OPS.curveTo3], [0, 0, 10, 10, 20, 20, 30, 30, 40, 5], OPS)
    expect(r.kind).toBe('complex')
    expect(r.bbox).toEqual({ x: 0, y: 0, w: 40, h: 30 })
  })

  test('polygon that re-closes on its start point is a rect', () => {
    const r = classifyPath(
      [OPS.moveTo, OPS.lineTo, OPS.lineTo, OPS.lineTo, OPS.lineTo],
      [0, 0, 100, 0, 100, 50, 0, 50, 0, 0],
      OPS
    )
    expect(r.kind).toBe('rect')
    expect(r.bbox).toEqual({ x: 0, y: 0, w: 100, h: 50 })
  })
})

describe('multiplyTransform composition', () => {
  test('translate composed with scale applies scale first', () => {
    const m = multiplyTransform([1, 0, 0, 1, 10, 5], [2, 0, 0, 2, 0, 0])
    expect(m).toEqual([2, 0, 0, 2, 10, 5])
    expect(applyTransform(m, 1, 1)).toEqual({ x: 12, y: 7 })
  })
})

describe('getOutputFilename edge cases', () => {
  test('empty stem and missing extension', () => {
    expect(getOutputFilename('.pdf')).toBe('slides.pptx')
    expect(getOutputFilename('report')).toBe('report.pptx')
  })
})

describe('ocrWordsToItems', () => {
  test('converts px bboxes to pt items with flipped Y', () => {
    const items = ocrWordsToItems(
      [{ text: 'Hello', bbox: { x0: 144, y0: 100, x1: 244, y1: 124 } }],
      1584, // 792pt page at 2x
      2
    )
    expect(items).toHaveLength(1)
    expect(items[0].x).toBe(72)
    expect(items[0].y).toBe((1584 - 124) / 2)
    expect(items[0].fontSize).toBe(12)
  })

  test('skips empty words', () => {
    expect(ocrWordsToItems([{ text: ' ', bbox: { x0: 0, y0: 0, x1: 1, y1: 1 } }], 100, 1)).toHaveLength(0)
  })
})
