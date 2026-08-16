import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import {
  equalPartRanges,
  chunkRanges,
  rangesFromCutPoints,
  cutPointsFromRanges,
  parseRangeSpec,
  segmentDurationMs,
  describeSegments,
  formatSegmentFilename,
  crc32,
  buildStoredZip,
} from './gif-split-core.js'

function covers(ranges, frameCount) {
  const seen = []
  for (const r of ranges) for (let i = r.start; i <= r.end; i++) seen.push(i)
  return seen.length === frameCount && seen.every((v, i) => v === i)
}

describe('equalPartRanges', () => {
  it('splits evenly when it divides', () => {
    expect(equalPartRanges(12, 3)).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 7 },
      { start: 8, end: 11 },
    ])
  })

  it('gives the remainder to the earlier parts so the last one is never a stub', () => {
    expect(equalPartRanges(10, 3)).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 6 },
      { start: 7, end: 9 },
    ])
  })

  it('covers every frame exactly once', () => {
    for (const parts of [2, 3, 5, 7]) {
      expect(covers(equalPartRanges(23, parts), 23)).toBe(true)
    }
  })

  it('never asks for more parts than there are frames', () => {
    expect(equalPartRanges(3, 10)).toHaveLength(3)
  })

  it('returns nothing for an empty GIF', () => {
    expect(equalPartRanges(0, 4)).toEqual([])
  })
})

describe('chunkRanges', () => {
  it('cuts fixed-size chunks and keeps the short tail', () => {
    expect(chunkRanges(10, 4)).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 7 },
      { start: 8, end: 9 },
    ])
  })

  it('covers every frame exactly once', () => {
    expect(covers(chunkRanges(17, 5), 17)).toBe(true)
  })

  it('treats a zero or negative size as one frame per part', () => {
    expect(chunkRanges(3, 0)).toHaveLength(3)
  })
})

describe('rangesFromCutPoints', () => {
  it('turns timeline clicks into segments', () => {
    expect(rangesFromCutPoints(10, [4, 7])).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 6 },
      { start: 7, end: 9 },
    ])
  })

  it('sorts, de-duplicates and drops out-of-range clicks', () => {
    expect(rangesFromCutPoints(6, [4, 0, 4, 99, -2, 2])).toEqual([
      { start: 0, end: 1 },
      { start: 2, end: 3 },
      { start: 4, end: 5 },
    ])
  })

  it('is one whole segment when nothing is cut', () => {
    expect(rangesFromCutPoints(5, [])).toEqual([{ start: 0, end: 4 }])
  })

  it('round-trips through cutPointsFromRanges', () => {
    const ranges = equalPartRanges(20, 4)
    expect(rangesFromCutPoints(20, cutPointsFromRanges(ranges))).toEqual(ranges)
  })
})

describe('parseRangeSpec', () => {
  it('reads 1-based inclusive ranges', () => {
    expect(parseRangeSpec('1-12, 13-24', 24)).toEqual([
      { start: 0, end: 11 },
      { start: 12, end: 23 },
    ])
  })

  it('accepts a single frame and odd separators', () => {
    expect(parseRangeSpec('3; 5 to 6\n8', 10)).toEqual([
      { start: 2, end: 2 },
      { start: 4, end: 5 },
      { start: 7, end: 7 },
    ])
  })

  it('allows overlapping ranges — the user may want the same frames twice', () => {
    expect(parseRangeSpec('1-5, 3-8', 10)).toHaveLength(2)
  })

  it('names the token it could not read', () => {
    expect(() => parseRangeSpec('1-4, banana', 10)).toThrow(/"banana"/)
  })

  it('says how many frames there are when a range runs past the end', () => {
    expect(() => parseRangeSpec('1-99', 24)).toThrow(/this GIF has 24/)
  })

  it('rejects a backwards range', () => {
    expect(() => parseRangeSpec('12-3', 24)).toThrow(/ends before it starts/)
  })

  it('rejects frame 0 — the timeline counts from 1', () => {
    expect(() => parseRangeSpec('0-4', 24)).toThrow(/before frame 1/)
  })

  it('rejects an empty spec with an example', () => {
    expect(() => parseRangeSpec('   ', 24)).toThrow(/for example/)
  })
})

describe('segment durations', () => {
  it('sums the per-frame delays inside a range', () => {
    expect(segmentDurationMs([100, 100, 50, 50], { start: 1, end: 3 })).toBe(200)
  })

  it('describes each segment for the summary line', () => {
    expect(describeSegments([{ start: 0, end: 1 }, { start: 2, end: 3 }], [40, 40, 60, 60])).toEqual([
      { index: 0, start: 0, end: 1, frameCount: 2, durationMs: 80 },
      { index: 1, start: 2, end: 3, frameCount: 2, durationMs: 120 },
    ])
  })
})

describe('formatSegmentFilename', () => {
  it('zero-pads to the widest index', () => {
    expect(formatSegmentFilename('clip', 3, 12, '.gif')).toBe('clip-part-03.gif')
    expect(formatSegmentFilename('clip', 3, 4, '.gif')).toBe('clip-part-3.gif')
  })
})

describe('buildStoredZip', () => {
  it('matches the reference CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })

  it('writes a local header, the payload and an end-of-central-directory record', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5])
    const zip = buildStoredZip([{ name: 'a.gif', data }])
    // Local file header magic.
    expect([zip[0], zip[1], zip[2], zip[3]]).toEqual([0x50, 0x4b, 0x03, 0x04])
    // End of central directory magic, last 22 bytes.
    const eocd = zip.length - 22
    expect([zip[eocd], zip[eocd + 1], zip[eocd + 2], zip[eocd + 3]]).toEqual([0x50, 0x4b, 0x05, 0x06])
    const view = new DataView(zip.buffer)
    expect(view.getUint16(eocd + 10, true)).toBe(1) // one entry
    // The payload is stored verbatim, right after the 30-byte header + name.
    expect(Array.from(zip.slice(35, 40))).toEqual([1, 2, 3, 4, 5])
  })

  it('records every file in the central directory', () => {
    const zip = buildStoredZip([
      { name: 'one.gif', data: new Uint8Array([9]) },
      { name: 'two.gif', data: new Uint8Array([8, 7]) },
    ])
    const view = new DataView(zip.buffer)
    const eocd = zip.length - 22
    expect(view.getUint16(eocd + 8, true)).toBe(2)
    expect(view.getUint16(eocd + 10, true)).toBe(2)
    // offset + size of the central directory must land exactly on the EOCD.
    expect(view.getUint32(eocd + 16, true) + view.getUint32(eocd + 12, true)).toBe(eocd)
  })

  it('handles an empty archive without producing garbage', () => {
    const zip = buildStoredZip([])
    expect(zip).toHaveLength(22)
    expect([zip[0], zip[1], zip[2], zip[3]]).toEqual([0x50, 0x4b, 0x05, 0x06])
  })
})

describe('the pages that ride these modes stay distinct', () => {
  // gif-split, gif-to-frames and gif-to-sprite were all shimmed to
  // mode 'to-frames', so three pages shipped one behaviour and two of them
  // answered a query they did not satisfy. Pin the wiring.
  const read = (f) => fs.readFileSync(f, 'utf8')

  it.each([
    ['src/tools/gif-split.js', "mode: 'split'"],
    ['src/tools/gif-to-frames.js', "mode: 'to-frames'"],
    ['src/tools/gif-to-sprite.js', "mode: 'sprite-sheet'"],
    ['src/tools/gif-repair.js', "op: 'repair'"],
    ['src/tools/gif-loop-count.js', "op: 'loop-count'"],
  ])('%s uses %s', (file, mode) => {
    expect(read(file)).toContain(mode)
  })

  it('no two GIF tool shims share a mode', () => {
    const files = fs.readdirSync('src/tools').filter((f) => /^gif-|^ping-pong|^insta|^white-box|^extend-gif/.test(f) && f.endsWith('.js'))
    const seen = new Map()
    for (const f of files) {
      const src = read(`src/tools/${f}`)
      const m = src.match(/init(?:GifExtTool|GifAnimTool)\(\{\s*(?:mode|op): '([^']+)'/)
      if (!m) continue
      const key = m[1]
      seen.set(key, (seen.get(key) || []).concat(f))
    }
    // A shared mode is allowed only where the pages genuinely target the same
    // job under different names; the three below are that case today.
    const shared = [...seen.entries()].filter(([, files]) => files.length > 1)
    const allowed = new Set(['resizer', 'add-text'])
    expect(shared.filter(([mode]) => !allowed.has(mode))).toEqual([])
  })
})
