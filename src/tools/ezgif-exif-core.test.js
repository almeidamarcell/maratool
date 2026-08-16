import { describe, it, expect } from 'vitest'
import {
  parseExif,
  findTiffHeader,
  detectContainer,
  formatExposureTime,
  formatFNumber,
  formatFocalLength,
  formatExifDate,
  formatFlash,
  dmsToDecimal,
  formatCoords,
  gpsMapsUrl,
  buildExifFields,
  extractGps,
  explainNoExif,
  ORIENTATION_LABELS,
} from './ezgif-exif-core.js'

// ── fixture builder ────────────────────────────────────────────────────
// The fixtures are assembled byte by byte rather than committed as binaries,
// so a reader can see exactly which bytes each assertion depends on and both
// byte orders come from the same code path.

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }

function encodeValue(type, values, le) {
  const out = []
  const push16 = v => (le ? out.push(v & 0xff, (v >> 8) & 0xff) : out.push((v >> 8) & 0xff, v & 0xff))
  const push32 = v => {
    const n = v >>> 0
    if (le) out.push(n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff)
    else out.push((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff)
  }
  if (type === 2) {
    for (const ch of values) out.push(ch.charCodeAt(0))
    out.push(0)
    return out
  }
  if (type === 1 || type === 7) {
    for (const v of values) out.push(v & 0xff)
    return out
  }
  for (const v of values) {
    if (type === 3) push16(v)
    else if (type === 4 || type === 9) push32(v)
    else if (type === 5 || type === 10) { push32(v[0]); push32(v[1]) }
  }
  return out
}

function valueCount(type, values) {
  return type === 2 ? values.length + 1 : values.length
}

// entries: [{ tag, type, values }]. Sub-IFD pointers are added by the caller
// through the `pointers` map (tag → resolved offset), filled in during layout.
function buildTiff({ le = true, ifd0 = [], exif = [], gps = [] } = {}) {
  const u32 = v => (le
    ? [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]
    : [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff])
  const u16 = v => (le ? [v & 0xff, (v >> 8) & 0xff] : [(v >> 8) & 0xff, v & 0xff])
  // 8-byte TIFF header: byte order, magic 42, then the offset of IFD0.
  const header = [...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8)]

  const ifd0Entries = ifd0.slice()
  // Placeholders; the real offsets are patched once the layout is known.
  if (exif.length) ifd0Entries.push({ tag: 0x8769, type: 4, values: [0], pointer: 'exif' })
  if (gps.length) ifd0Entries.push({ tag: 0x8825, type: 4, values: [0], pointer: 'gps' })

  const ifdSize = n => 2 + n * 12 + 4
  const ifd0Offset = 8
  const exifOffset = ifd0Offset + ifdSize(ifd0Entries.length)
  const gpsOffset = exifOffset + (exif.length ? ifdSize(exif.length) : 0)
  const poolOffset = gpsOffset + (gps.length ? ifdSize(gps.length) : 0)

  const pool = []
  const pointerOffsets = { exif: exifOffset, gps: gpsOffset }

  function emitIfd(entries) {
    const bytes = []
    bytes.push(...u16(entries.length))
    // Entries must be sorted by tag for a strictly valid file; readers do not
    // require it and keeping input order makes the fixtures easier to follow.
    for (const e of entries) {
      const values = e.pointer ? [pointerOffsets[e.pointer]] : e.values
      const count = valueCount(e.type, values)
      const data = encodeValue(e.type, values, le)
      bytes.push(...u16(e.tag), ...u16(e.type), ...u32(count))
      if (data.length <= 4) {
        bytes.push(...data)
        for (let i = data.length; i < 4; i++) bytes.push(0)
      } else {
        bytes.push(...u32(poolOffset + pool.length))
        pool.push(...data)
        if (pool.length % 2) pool.push(0)
      }
      const size = TYPE_SIZE[e.type] * count
      if (size !== data.length && e.type !== 2) throw new Error('size mismatch for tag ' + e.tag)
    }
    bytes.push(...u32(0))
    return bytes
  }

  const ifd0Bytes = emitIfd(ifd0Entries)
  const exifBytes = exif.length ? emitIfd(exif) : []
  const gpsBytes = gps.length ? emitIfd(gps) : []
  return new Uint8Array([...header, ...ifd0Bytes, ...exifBytes, ...gpsBytes, ...pool])
}

function jpegWithExif(tiff, { extraSegments = true } = {}) {
  const app1Payload = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00, ...tiff]
  const len = app1Payload.length + 2
  const bytes = [0xff, 0xd8]
  if (extraSegments) {
    // A JFIF APP0 sits in front of APP1 in most real files; the parser has to
    // walk past it rather than assuming Exif is the first segment.
    const jfif = [0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x02, 0, 0, 1, 0, 1, 0, 0]
    bytes.push(0xff, 0xe0, ((jfif.length + 2) >> 8) & 0xff, (jfif.length + 2) & 0xff, ...jfif)
  }
  bytes.push(0xff, 0xe1, (len >> 8) & 0xff, len & 0xff, ...app1Payload)
  bytes.push(0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9)
  return new Uint8Array(bytes)
}

function strippedJpeg() {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x00, 0xff, 0xda, 0x00, 0x02, 0x33, 0xff, 0xd9])
}

function pngWithExif(tiff) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const chunk = (type, data) => {
    const len = data.length
    return [
      (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff,
      ...type.split('').map(c => c.charCodeAt(0)),
      ...data,
      0, 0, 0, 0, // CRC — not checked by the reader
    ]
  }
  return new Uint8Array([
    ...sig,
    ...chunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]),
    ...chunk('eXIf', [...tiff]),
    ...chunk('IEND', []),
  ])
}

const FULL_PHOTO = {
  ifd0: [
    { tag: 0x010f, type: 2, values: 'NIKON CORPORATION' },
    { tag: 0x0110, type: 2, values: 'NIKON D750' },
    { tag: 0x0112, type: 3, values: [6] },
    { tag: 0x0131, type: 2, values: 'Ver.1.10' },
  ],
  exif: [
    { tag: 0x829a, type: 5, values: [[1, 250]] },
    { tag: 0x829d, type: 5, values: [[56, 10]] },
    { tag: 0x8827, type: 3, values: [400] },
    { tag: 0x9003, type: 2, values: '2024:05:03 14:22:01' },
    { tag: 0x9209, type: 3, values: [9] },
    { tag: 0x920a, type: 5, values: [[850, 10]] },
    { tag: 0xa002, type: 4, values: [6016] },
    { tag: 0xa003, type: 4, values: [4016] },
    { tag: 0xa434, type: 2, values: '85.0 mm f/1.8' },
  ],
  gps: [
    { tag: 0x0001, type: 2, values: 'N' },
    { tag: 0x0002, type: 5, values: [[37, 1], [46, 1], [2964, 100]] },
    { tag: 0x0003, type: 2, values: 'W' },
    { tag: 0x0004, type: 5, values: [[122, 1], [25, 1], [960, 100]] },
    { tag: 0x0006, type: 5, values: [[52, 1]] },
  ],
}

// ── tests ──────────────────────────────────────────────────────────────

describe('detectContainer', () => {
  it('recognises the formats the viewer accepts', () => {
    expect(detectContainer(jpegWithExif(buildTiff(FULL_PHOTO)))).toBe('jpeg')
    expect(detectContainer(pngWithExif(buildTiff({ ifd0: FULL_PHOTO.ifd0 })))).toBe('png')
    expect(detectContainer(buildTiff({ le: true }))).toBe('tiff')
    expect(detectContainer(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe('gif')
    expect(detectContainer(new Uint8Array([1, 2, 3, 4]))).toBe('unknown')
  })

  it('reads the brand out of an ISO-BMFF header', () => {
    const heic = new Uint8Array([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0, 0, 0])
    expect(detectContainer(heic)).toBe('heic')
  })
})

describe('findTiffHeader', () => {
  it('skips the JFIF APP0 segment to reach APP1', () => {
    const bytes = jpegWithExif(buildTiff(FULL_PHOTO))
    const offset = findTiffHeader(bytes)
    expect(offset).toBeGreaterThan(0)
    expect(bytes[offset]).toBe(0x49)
    expect(bytes[offset + 1]).toBe(0x49)
  })

  it('returns -1 for a JPEG with no APP1', () => {
    expect(findTiffHeader(strippedJpeg())).toBe(-1)
  })

  it('finds the eXIf chunk in a PNG', () => {
    const bytes = pngWithExif(buildTiff({ ifd0: FULL_PHOTO.ifd0 }))
    expect(findTiffHeader(bytes)).toBeGreaterThan(0)
  })
})

describe('parseExif', () => {
  it('pulls camera, exposure and GPS out of a little-endian JPEG', () => {
    const out = parseExif(jpegWithExif(buildTiff(FULL_PHOTO)))
    expect(out.found).toBe(true)
    expect(out.byteOrder).toBe('little-endian (Intel)')
    expect(out.tags.Make).toBe('NIKON CORPORATION')
    expect(out.tags.Model).toBe('NIKON D750')
    expect(out.tags.ISO).toBe(400)
    expect(out.tags.ExposureTime).toBeCloseTo(1 / 250)
    expect(out.tags.FNumber).toBeCloseTo(5.6)
    expect(out.tags.FocalLength).toBeCloseTo(85)
    expect(out.tags.LensModel).toBe('85.0 mm f/1.8')
    expect(out.gps.lat).toBeCloseTo(37.7749, 4)
    expect(out.gps.lon).toBeCloseTo(-122.4193, 3)
  })

  it('reads a big-endian file identically', () => {
    const le = parseExif(jpegWithExif(buildTiff({ ...FULL_PHOTO, le: true })))
    const be = parseExif(jpegWithExif(buildTiff({ ...FULL_PHOTO, le: false })))
    expect(be.byteOrder).toBe('big-endian (Motorola)')
    expect(be.tags).toEqual(le.tags)
    expect(be.gps.label).toBe(le.gps.label)
  })

  it('renders display rows in a fixed order', () => {
    const out = parseExif(jpegWithExif(buildTiff(FULL_PHOTO)))
    const labels = out.fields.map(f => f.label)
    expect(labels[0]).toBe('Camera')
    expect(labels).toContain('Shutter speed')
    expect(out.fields.find(f => f.label === 'Shutter speed').value).toBe('1/250 s')
    expect(out.fields.find(f => f.label === 'Aperture').value).toBe('f/5.6')
    expect(out.fields.find(f => f.label === 'Orientation').value).toBe('Rotated 90° CW')
    expect(out.fields.find(f => f.label === 'Date taken').value).toBe('2024-05-03 14:22:01')
    expect(out.fields.find(f => f.label === 'Recorded size').value).toBe('6016 × 4016')
  })

  it('reports found:false for a stripped JPEG instead of throwing', () => {
    const out = parseExif(strippedJpeg())
    expect(out.found).toBe(false)
    expect(out.container).toBe('jpeg')
    expect(out.fields).toEqual([])
    expect(out.gps).toBeNull()
  })

  it('reads EXIF out of a PNG eXIf chunk', () => {
    const out = parseExif(pngWithExif(buildTiff({ ifd0: FULL_PHOTO.ifd0 })))
    expect(out.found).toBe(true)
    expect(out.tags.Model).toBe('NIKON D750')
  })

  it('survives a truncated file', () => {
    const full = jpegWithExif(buildTiff(FULL_PHOTO))
    for (const cut of [12, 20, 40, 64]) {
      expect(() => parseExif(full.slice(0, cut))).not.toThrow()
    }
  })

  it('rejects a TIFF header with the wrong magic number', () => {
    const bytes = buildTiff(FULL_PHOTO)
    bytes[2] = 0x99
    expect(parseExif(bytes).found).toBe(false)
  })

  it('returns an empty result for an empty input', () => {
    expect(parseExif(new Uint8Array(0)).found).toBe(false)
    expect(parseExif(null).found).toBe(false)
  })

  it('ignores an IFD offset that points past the end of the file', () => {
    const bytes = buildTiff(FULL_PHOTO)
    bytes[4] = 0xff; bytes[5] = 0xff; bytes[6] = 0xff; bytes[7] = 0x7f
    expect(parseExif(bytes).found).toBe(false)
  })

  it('accepts an ArrayBuffer as well as a Uint8Array', () => {
    const bytes = jpegWithExif(buildTiff(FULL_PHOTO))
    const copy = bytes.slice()
    expect(parseExif(copy.buffer).tags.Model).toBe('NIKON D750')
  })
})

describe('value formatters', () => {
  it('formats sub-second exposures as a fraction', () => {
    expect(formatExposureTime(1 / 250)).toBe('1/250 s')
    expect(formatExposureTime(2)).toBe('2 s')
    expect(formatExposureTime(0.5)).toBe('1/2 s')
    expect(formatExposureTime(0)).toBeNull()
    expect(formatExposureTime('nope')).toBeNull()
  })

  it('formats aperture and focal length', () => {
    expect(formatFNumber(5.6)).toBe('f/5.6')
    expect(formatFNumber(8)).toBe('f/8')
    expect(formatFNumber(0)).toBeNull()
    expect(formatFocalLength(85)).toBe('85 mm')
    expect(formatFocalLength(24.5)).toBe('24.5 mm')
  })

  it('rewrites the EXIF date separator', () => {
    expect(formatExifDate('2024:05:03 14:22:01')).toBe('2024-05-03 14:22:01')
    expect(formatExifDate('garbage')).toBe('garbage')
    expect(formatExifDate(null)).toBeNull()
  })

  it('decodes the flash bitfield', () => {
    expect(formatFlash(0)).toBe('Did not fire')
    expect(formatFlash(1)).toBe('Fired')
    expect(formatFlash(9)).toBe('Fired, compulsory')
    expect(formatFlash(0x19)).toBe('Fired, auto mode')
  })

  it('labels all eight orientations', () => {
    expect(Object.keys(ORIENTATION_LABELS)).toHaveLength(8)
    expect(ORIENTATION_LABELS[1]).toBe('Normal')
    expect(ORIENTATION_LABELS[8]).toBe('Rotated 270° CW')
  })
})

describe('GPS conversion', () => {
  it('converts degrees/minutes/seconds to a signed decimal', () => {
    expect(dmsToDecimal([37, 46, 29.64], 'N')).toBeCloseTo(37.7749, 4)
    expect(dmsToDecimal([122, 25, 9.6], 'W')).toBeCloseTo(-122.4193, 4)
    expect(dmsToDecimal([33, 52, 4], 'S')).toBeCloseTo(-33.8678, 4)
  })

  it('returns null for missing or malformed coordinates', () => {
    expect(dmsToDecimal(null, 'N')).toBeNull()
    expect(dmsToDecimal([1], 'N')).toBeNull()
  })

  it('builds a label and a maps link', () => {
    expect(formatCoords(37.7749, -122.4193)).toBe('37.774900, -122.419300')
    expect(gpsMapsUrl(37.7749, -122.4193)).toBe('https://www.google.com/maps?q=37.774900,-122.419300')
    expect(gpsMapsUrl(null, null)).toBeNull()
  })

  it('reads altitude below sea level as negative', () => {
    const gps = extractGps({
      GPSLatitude: [37, 0, 0], GPSLatitudeRef: 'N',
      GPSLongitude: [122, 0, 0], GPSLongitudeRef: 'W',
      GPSAltitude: 12, GPSAltitudeRef: [1],
    })
    expect(gps.altitude).toBe('-12 m')
  })

  it('returns null when only one axis is present', () => {
    expect(extractGps({ GPSLatitude: [37, 0, 0], GPSLatitudeRef: 'N' })).toBeNull()
  })
})

describe('buildExifFields', () => {
  it('skips the stutter when the model already names the make', () => {
    const rows = buildExifFields({ Make: 'Canon', Model: 'Canon EOS R6' })
    expect(rows[0]).toEqual({ label: 'Camera', value: 'Canon EOS R6' })
  })

  it('joins make and model when they differ', () => {
    const rows = buildExifFields({ Make: 'NIKON CORPORATION', Model: 'NIKON D750' })
    expect(rows[0].value).toBe('NIKON D750')
    expect(buildExifFields({ Make: 'Apple', Model: 'iPhone 15 Pro' })[0].value).toBe('Apple iPhone 15 Pro')
  })

  it('describes a zoom lens from its LensSpecification', () => {
    const rows = buildExifFields({ LensSpecification: [24, 70, 2.8, 2.8] })
    expect(rows.find(r => r.label === 'Lens').value).toBe('24–70 mm f/2.8')
  })

  it('returns nothing for an empty tag set', () => {
    expect(buildExifFields({})).toEqual([])
    expect(buildExifFields(null)).toEqual([])
  })
})

describe('explainNoExif', () => {
  it('gives a format-specific reason', () => {
    expect(explainNoExif('png')).toMatch(/PNG/)
    expect(explainNoExif('gif')).toMatch(/GIF/)
    expect(explainNoExif('heic')).toMatch(/JPEG/)
    expect(explainNoExif('jpeg')).toMatch(/stripped/)
    expect(explainNoExif('whatever')).toMatch(/No EXIF/)
  })
})
