// EXIF reader used by the image metadata viewer.
//
// Everything here is pure: it takes the raw bytes of a file and returns plain
// objects. No DOM, no canvas — the UI module does the rendering.
//
// Coverage: the TIFF/Exif block wherever it hides. JPEG carries it in an APP1
// segment, PNG in an `eXIf` chunk, WebP in an `EXIF` RIFF chunk, and a .tif is
// itself a TIFF file. Anything else (or a JPEG that has been stripped) reports
// `found: false` rather than throwing, because "this photo has no EXIF" is a
// real answer people come to the page for.

var BYTE = 1
var ASCII = 2
var SHORT = 3
var LONG = 4
var RATIONAL = 5
var UNDEFINED = 7
var SLONG = 9
var SRATIONAL = 10

var TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 }

var IFD0_TAGS = {
  0x010e: 'ImageDescription',
  0x010f: 'Make',
  0x0110: 'Model',
  0x0112: 'Orientation',
  0x011a: 'XResolution',
  0x011b: 'YResolution',
  0x0128: 'ResolutionUnit',
  0x0131: 'Software',
  0x0132: 'DateTime',
  0x013b: 'Artist',
  0x8298: 'Copyright',
  0x8769: 'ExifIFDPointer',
  0x8825: 'GPSInfoIFDPointer',
}

var EXIF_TAGS = {
  0x829a: 'ExposureTime',
  0x829d: 'FNumber',
  0x8822: 'ExposureProgram',
  0x8827: 'ISO',
  0x9000: 'ExifVersion',
  0x9003: 'DateTimeOriginal',
  0x9004: 'DateTimeDigitized',
  0x9201: 'ShutterSpeedValue',
  0x9202: 'ApertureValue',
  0x9204: 'ExposureBias',
  0x9207: 'MeteringMode',
  0x9209: 'Flash',
  0x920a: 'FocalLength',
  0xa002: 'PixelXDimension',
  0xa003: 'PixelYDimension',
  0xa402: 'ExposureMode',
  0xa403: 'WhiteBalance',
  0xa405: 'FocalLengthIn35mmFilm',
  0xa406: 'SceneCaptureType',
  0xa431: 'BodySerialNumber',
  0xa432: 'LensSpecification',
  0xa433: 'LensMake',
  0xa434: 'LensModel',
}

var GPS_TAGS = {
  0x0001: 'GPSLatitudeRef',
  0x0002: 'GPSLatitude',
  0x0003: 'GPSLongitudeRef',
  0x0004: 'GPSLongitude',
  0x0005: 'GPSAltitudeRef',
  0x0006: 'GPSAltitude',
  0x0007: 'GPSTimeStamp',
  0x001d: 'GPSDateStamp',
}

export var ORIENTATION_LABELS = {
  1: 'Normal',
  2: 'Mirrored horizontally',
  3: 'Rotated 180°',
  4: 'Mirrored vertically',
  5: 'Mirrored horizontally, rotated 270° CW',
  6: 'Rotated 90° CW',
  7: 'Mirrored horizontally, rotated 90° CW',
  8: 'Rotated 270° CW',
}

var METERING_LABELS = {
  0: 'Unknown', 1: 'Average', 2: 'Center-weighted average', 3: 'Spot',
  4: 'Multi-spot', 5: 'Pattern', 6: 'Partial', 255: 'Other',
}

var EXPOSURE_PROGRAM_LABELS = {
  0: 'Not defined', 1: 'Manual', 2: 'Program AE', 3: 'Aperture priority',
  4: 'Shutter priority', 5: 'Creative', 6: 'Action', 7: 'Portrait', 8: 'Landscape',
}

var WHITE_BALANCE_LABELS = { 0: 'Auto', 1: 'Manual' }

// ── container sniffing ───────────────────────────────────────────────────

function toBytes(input) {
  if (input instanceof Uint8Array) return input
  if (input instanceof ArrayBuffer) return new Uint8Array(input)
  if (input && ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
  return new Uint8Array(0)
}

function ascii(bytes, offset, length) {
  var s = ''
  for (var i = 0; i < length; i++) s += String.fromCharCode(bytes[offset + i])
  return s
}

function u32be(bytes, o) {
  return ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0
}

function u32le(bytes, o) {
  return (bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0
}

function hasExifPrefix(bytes, o) {
  return ascii(bytes, o, 4) === 'Exif' && bytes[o + 4] === 0
}

export function detectContainer(input) {
  var b = toBytes(input)
  if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8) return 'jpeg'
  if (b.length >= 8 && b[0] === 0x89 && ascii(b, 1, 3) === 'PNG') return 'png'
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp'
  if (b.length >= 6 && ascii(b, 0, 3) === 'GIF') return 'gif'
  if (b.length >= 8 && (ascii(b, 4, 4) === 'ftyp')) {
    var brand = ascii(b, 8, 4)
    if (brand === 'avif' || brand === 'avis') return 'avif'
    if (brand === 'heic' || brand === 'heix' || brand === 'mif1' || brand === 'heim') return 'heic'
    return 'iso-bmff'
  }
  if (b.length >= 4 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2A && b[3] === 0x00) ||
                        (b[0] === 0x4D && b[1] === 0x4D && b[2] === 0x00 && b[3] === 0x2A))) return 'tiff'
  return 'unknown'
}

function jpegTiffOffset(b) {
  var i = 2
  while (i + 3 < b.length) {
    if (b[i] !== 0xFF) { i++; continue }
    var marker = b[i + 1]
    // Standalone markers carry no length word.
    if (marker === 0xFF || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD9)) { i += 2; continue }
    // Start of scan: compressed data follows, no more metadata segments.
    if (marker === 0xDA) return -1
    var len = (b[i + 2] << 8) | b[i + 3]
    if (len < 2) return -1
    if (marker === 0xE1 && i + 10 <= b.length && hasExifPrefix(b, i + 4)) return i + 10
    i += 2 + len
  }
  return -1
}

function pngTiffOffset(b) {
  var i = 8
  while (i + 8 <= b.length) {
    var len = u32be(b, i)
    var type = ascii(b, i + 4, 4)
    if (type === 'eXIf') {
      var start = i + 8
      return hasExifPrefix(b, start) ? start + 6 : start
    }
    if (type === 'IEND') return -1
    i += 12 + len
    if (len < 0 || i <= 0) return -1
  }
  return -1
}

function webpTiffOffset(b) {
  var i = 12
  while (i + 8 <= b.length) {
    var tag = ascii(b, i, 4)
    var size = u32le(b, i + 4)
    if (tag === 'EXIF') {
      var start = i + 8
      return hasExifPrefix(b, start) ? start + 6 : start
    }
    // RIFF chunks are padded to an even length.
    i += 8 + size + (size % 2)
  }
  return -1
}

// Byte offset of the TIFF header (the "II*\0" / "MM\0*" bit), or -1.
export function findTiffHeader(input) {
  var b = toBytes(input)
  var kind = detectContainer(b)
  if (kind === 'jpeg') return jpegTiffOffset(b)
  if (kind === 'png') return pngTiffOffset(b)
  if (kind === 'webp') return webpTiffOffset(b)
  if (kind === 'tiff') return 0
  return -1
}

// ── TIFF walking ─────────────────────────────────────────────────────────

function makeReader(b, tiff, le) {
  return {
    u16: function (o) {
      var a = b[tiff + o], c = b[tiff + o + 1]
      return le ? (a | (c << 8)) : ((a << 8) | c)
    },
    u32: function (o) {
      return le ? u32le(b, tiff + o) : u32be(b, tiff + o)
    },
    i32: function (o) {
      var v = le ? u32le(b, tiff + o) : u32be(b, tiff + o)
      return v > 0x7FFFFFFF ? v - 0x100000000 : v
    },
    byteAt: function (o) { return b[tiff + o] },
    length: b.length - tiff,
  }
}

function readValue(r, type, count, offset) {
  var i
  if (type === ASCII) {
    var s = ''
    for (i = 0; i < count; i++) {
      var ch = r.byteAt(offset + i)
      if (ch === 0) break
      s += String.fromCharCode(ch)
    }
    return s.trim()
  }
  if (type === UNDEFINED || type === BYTE) {
    var bytes = []
    for (i = 0; i < count; i++) bytes.push(r.byteAt(offset + i))
    return bytes
  }
  var out = []
  for (i = 0; i < count; i++) {
    if (type === SHORT) out.push(r.u16(offset + i * 2))
    else if (type === LONG) out.push(r.u32(offset + i * 4))
    else if (type === SLONG) out.push(r.i32(offset + i * 4))
    else if (type === RATIONAL) {
      var num = r.u32(offset + i * 8)
      var den = r.u32(offset + i * 8 + 4)
      out.push(den === 0 ? 0 : num / den)
    } else if (type === SRATIONAL) {
      var snum = r.i32(offset + i * 8)
      var sden = r.i32(offset + i * 8 + 4)
      out.push(sden === 0 ? 0 : snum / sden)
    } else return null
  }
  return out.length === 1 ? out[0] : out
}

function readIfd(r, offset, tagMap, out) {
  if (offset <= 0 || offset + 2 > r.length) return
  var count = r.u16(offset)
  // A bogus offset can read a huge entry count out of pixel data; cap it.
  if (count <= 0 || count > 512) return
  for (var i = 0; i < count; i++) {
    var entry = offset + 2 + i * 12
    if (entry + 12 > r.length) return
    var tag = r.u16(entry)
    var type = r.u16(entry + 2)
    var n = r.u32(entry + 4)
    var size = TYPE_SIZE[type]
    if (!size || n > 0x10000) continue
    var total = size * n
    var valueOffset = total <= 4 ? entry + 8 : r.u32(entry + 8)
    if (valueOffset < 0 || valueOffset + total > r.length) continue
    var name = tagMap[tag]
    if (!name) continue
    var value = readValue(r, type, n, valueOffset)
    if (value !== null && value !== '') out[name] = value
  }
}

// ── formatting ───────────────────────────────────────────────────────────

function trimNumber(n, places) {
  var s = Number(n).toFixed(places == null ? 1 : places)
  return s.replace(/\.?0+$/, '')
}

export function formatExposureTime(seconds) {
  var v = Number(seconds)
  if (!isFinite(v) || v <= 0) return null
  if (v >= 1) return trimNumber(v, 1) + ' s'
  return '1/' + Math.round(1 / v) + ' s'
}

export function formatFNumber(f) {
  var v = Number(f)
  if (!isFinite(v) || v <= 0) return null
  return 'f/' + trimNumber(v, 1)
}

export function formatFocalLength(mm) {
  var v = Number(mm)
  if (!isFinite(v) || v <= 0) return null
  return trimNumber(v, 1) + ' mm'
}

export function formatExifDate(raw) {
  if (typeof raw !== 'string') return null
  var m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!m) return raw || null
  return m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6]
}

export function formatFlash(value) {
  var v = Number(value)
  if (!isFinite(v)) return null
  var fired = (v & 1) === 1
  if (!fired) return 'Did not fire'
  if ((v & 0x18) === 0x18) return 'Fired, auto mode'
  if ((v & 0x08) === 0x08) return 'Fired, compulsory'
  return 'Fired'
}

// EXIF stores GPS as degrees/minutes/seconds plus an N/S/E/W reference.
export function dmsToDecimal(dms, ref) {
  if (!Array.isArray(dms) || dms.length < 2) return null
  var deg = Number(dms[0]) || 0
  var min = Number(dms[1]) || 0
  var sec = Number(dms[2]) || 0
  var value = deg + min / 60 + sec / 3600
  if (!isFinite(value)) return null
  var r = String(ref || '').toUpperCase()
  if (r === 'S' || r === 'W') value = -value
  return value
}

export function formatCoords(lat, lon) {
  if (lat == null || lon == null) return null
  return lat.toFixed(6) + ', ' + lon.toFixed(6)
}

export function gpsMapsUrl(lat, lon) {
  if (lat == null || lon == null) return null
  return 'https://www.google.com/maps?q=' + lat.toFixed(6) + ',' + lon.toFixed(6)
}

function joinCamera(make, model) {
  if (!make && !model) return null
  if (!make) return model
  if (!model) return make
  // "NIKON CORPORATION" + "NIKON D750" would read as a stutter.
  var m = String(model)
  return m.toLowerCase().indexOf(String(make).toLowerCase().split(' ')[0].toLowerCase()) === 0
    ? m
    : make + ' ' + m
}

function lensSpecLabel(spec) {
  if (!Array.isArray(spec) || spec.length < 4) return null
  var minF = Number(spec[0]), maxF = Number(spec[1])
  if (!minF || !maxF) return null
  var range = minF === maxF ? trimNumber(minF, 1) + ' mm' : trimNumber(minF, 1) + '–' + trimNumber(maxF, 1) + ' mm'
  var minA = Number(spec[2]), maxA = Number(spec[3])
  if (minA > 0 && maxA > 0) {
    range += minA === maxA ? ' f/' + trimNumber(minA, 1) : ' f/' + trimNumber(minA, 1) + '–' + trimNumber(maxA, 1)
  }
  return range
}

// Ordered, display-ready rows. Only the tags actually present come back, so a
// phone snapshot with three tags renders three rows instead of a wall of "—".
export function buildExifFields(tags) {
  var t = tags || {}
  var rows = []
  function push(label, value) {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return
    rows.push({ label: label, value: String(value) })
  }

  push('Camera', joinCamera(t.Make, t.Model))
  push('Lens', t.LensModel || lensSpecLabel(t.LensSpecification))
  push('Lens make', t.LensMake)
  push('Focal length', formatFocalLength(t.FocalLength))
  push('35mm equivalent', t.FocalLengthIn35mmFilm ? t.FocalLengthIn35mmFilm + ' mm' : null)
  push('Aperture', formatFNumber(t.FNumber))
  push('Shutter speed', formatExposureTime(t.ExposureTime))
  push('ISO', Array.isArray(t.ISO) ? t.ISO[0] : t.ISO)
  push('Exposure program', EXPOSURE_PROGRAM_LABELS[t.ExposureProgram])
  push('Exposure bias', t.ExposureBias != null ? trimNumber(t.ExposureBias, 2) + ' EV' : null)
  push('Metering', METERING_LABELS[t.MeteringMode])
  push('White balance', WHITE_BALANCE_LABELS[t.WhiteBalance])
  push('Flash', t.Flash != null ? formatFlash(t.Flash) : null)
  push('Orientation', ORIENTATION_LABELS[t.Orientation])
  push('Date taken', formatExifDate(t.DateTimeOriginal || t.DateTime))
  push('Digitised', t.DateTimeDigitized && t.DateTimeDigitized !== t.DateTimeOriginal ? formatExifDate(t.DateTimeDigitized) : null)
  push('Recorded size', t.PixelXDimension && t.PixelYDimension ? t.PixelXDimension + ' × ' + t.PixelYDimension : null)
  push('Software', t.Software)
  push('Artist', t.Artist)
  push('Copyright', t.Copyright)
  push('Description', t.ImageDescription)
  push('Serial number', t.BodySerialNumber)
  return rows
}

export function extractGps(tags) {
  var t = tags || {}
  var lat = dmsToDecimal(t.GPSLatitude, t.GPSLatitudeRef)
  var lon = dmsToDecimal(t.GPSLongitude, t.GPSLongitudeRef)
  if (lat == null || lon == null) return null
  var alt = null
  if (t.GPSAltitude != null) {
    var a = Number(t.GPSAltitude)
    if (isFinite(a)) alt = (t.GPSAltitudeRef === 1 || (Array.isArray(t.GPSAltitudeRef) && t.GPSAltitudeRef[0] === 1) ? -a : a)
  }
  return {
    lat: lat,
    lon: lon,
    label: formatCoords(lat, lon),
    mapsUrl: gpsMapsUrl(lat, lon),
    altitude: alt == null ? null : Math.round(alt) + ' m',
    date: t.GPSDateStamp ? String(t.GPSDateStamp).replace(/:/g, '-') : null,
  }
}

// ── entry point ──────────────────────────────────────────────────────────

export function parseExif(input) {
  var bytes = toBytes(input)
  var container = detectContainer(bytes)
  var tiff = findTiffHeader(bytes)
  var empty = { found: false, container: container, byteOrder: null, tags: {}, fields: [], gps: null }
  if (tiff < 0 || tiff + 8 > bytes.length) return empty

  var b0 = bytes[tiff]
  var b1 = bytes[tiff + 1]
  var le
  if (b0 === 0x49 && b1 === 0x49) le = true
  else if (b0 === 0x4D && b1 === 0x4D) le = false
  else return empty

  var r = makeReader(bytes, tiff, le)
  if (r.u16(2) !== 42) return empty

  var tags = {}
  var ifd0 = r.u32(4)
  readIfd(r, ifd0, IFD0_TAGS, tags)
  if (tags.ExifIFDPointer) readIfd(r, tags.ExifIFDPointer, EXIF_TAGS, tags)
  if (tags.GPSInfoIFDPointer) readIfd(r, tags.GPSInfoIFDPointer, GPS_TAGS, tags)
  delete tags.ExifIFDPointer
  delete tags.GPSInfoIFDPointer

  var fields = buildExifFields(tags)
  var gps = extractGps(tags)
  return {
    found: fields.length > 0 || gps != null,
    container: container,
    byteOrder: le ? 'little-endian (Intel)' : 'big-endian (Motorola)',
    tags: tags,
    fields: fields,
    gps: gps,
  }
}

// One plain sentence for the "no EXIF here" case, phrased per container so the
// answer is useful instead of just negative.
export function explainNoExif(container) {
  if (container === 'png') return 'PNG files almost never carry EXIF, and this one has no eXIf chunk. Camera data lives in JPEG, HEIC, and TIFF files.'
  if (container === 'gif') return 'GIF has no EXIF block at all — the format predates it. Nothing about the camera can be stored in this file.'
  if (container === 'webp') return 'This WebP has no EXIF chunk. Most converters drop metadata when they write WebP.'
  if (container === 'avif' || container === 'heic' || container === 'iso-bmff') {
    return 'HEIC and AVIF store EXIF inside an ISO-BMFF box that browsers do not expose. Convert the photo to JPEG first to read its camera data here.'
  }
  if (container === 'jpeg') return 'This JPEG carries no EXIF block. It was either stripped by an editor or by the app that exported it — screenshots and social-media downloads arrive this way.'
  return 'No EXIF block was found in this file.'
}
