// Minimal store-only (no compression) ZIP writer.
//
// PNG and JPEG payloads are already compressed, so deflating them again buys
// nothing — every byte a batch tool wants to bundle is incompressible. That
// makes the "stored" method enough, and it keeps this dependency-free: a real
// deflate implementation would be an order of magnitude more code for output
// that is the same size.
//
// Layout written here (PKZIP APPNOTE 4.3):
//   [local header + name + data] × n
//   [central directory entry] × n
//   [end of central directory]

var crcTable = null

function makeCrcTable() {
  crcTable = new Int32Array(256)
  for (var i = 0; i < 256; i++) {
    var c = i
    for (var j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crcTable[i] = c
  }
}

export function crc32(bytes) {
  if (!crcTable) makeCrcTable()
  var crc = 0xFFFFFFFF
  for (var k = 0; k < bytes.length; k++) {
    crc = crcTable[(crc ^ bytes[k]) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// MS-DOS packed date/time. Anything before 1980 is unrepresentable, so it is
// clamped rather than allowed to wrap into a negative year field.
export function dosDateTime(date) {
  var d = date || new Date()
  var year = Math.max(1980, d.getFullYear())
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

function encodeName(name) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(name)
  var out = []
  for (var i = 0; i < name.length; i++) out.push(name.charCodeAt(i) & 0xFF)
  return new Uint8Array(out)
}

function toBytes(data) {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  return encodeName(String(data))
}

// files: [{ name, data: Uint8Array | ArrayBuffer }] → Uint8Array
export function buildZip(files, when) {
  var stamp = dosDateTime(when)
  var entries = files.map(function (f) {
    var nameBytes = encodeName(f.name)
    var data = toBytes(f.data)
    return { nameBytes: nameBytes, data: data, crc: crc32(data), offset: 0 }
  })

  var localSize = 0
  var centralSize = 0
  entries.forEach(function (e) {
    e.offset = localSize
    localSize += 30 + e.nameBytes.length + e.data.length
    centralSize += 46 + e.nameBytes.length
  })

  var out = new Uint8Array(localSize + centralSize + 22)
  var view = new DataView(out.buffer)
  var p = 0

  entries.forEach(function (e) {
    view.setUint32(p, 0x04034b50, true)
    view.setUint16(p + 4, 20, true)          // version needed
    view.setUint16(p + 6, 0x0800, true)      // flags: bit 11 = UTF-8 filename
    view.setUint16(p + 8, 0, true)           // method 0 = stored
    view.setUint16(p + 10, stamp.time, true)
    view.setUint16(p + 12, stamp.date, true)
    view.setUint32(p + 14, e.crc, true)
    view.setUint32(p + 18, e.data.length, true)
    view.setUint32(p + 22, e.data.length, true)
    view.setUint16(p + 26, e.nameBytes.length, true)
    view.setUint16(p + 28, 0, true)          // extra field length
    out.set(e.nameBytes, p + 30)
    out.set(e.data, p + 30 + e.nameBytes.length)
    p += 30 + e.nameBytes.length + e.data.length
  })

  entries.forEach(function (e) {
    view.setUint32(p, 0x02014b50, true)
    view.setUint16(p + 4, 20, true)          // version made by
    view.setUint16(p + 6, 20, true)          // version needed
    view.setUint16(p + 8, 0x0800, true)      // flags: bit 11 = UTF-8 filename
    view.setUint16(p + 10, 0, true)          // method 0 = stored
    view.setUint16(p + 12, stamp.time, true)
    view.setUint16(p + 14, stamp.date, true)
    view.setUint32(p + 16, e.crc, true)
    view.setUint32(p + 20, e.data.length, true)
    view.setUint32(p + 24, e.data.length, true)
    view.setUint16(p + 28, e.nameBytes.length, true)
    view.setUint16(p + 30, 0, true)
    view.setUint16(p + 32, 0, true)
    view.setUint16(p + 34, 0, true)          // disk number
    view.setUint16(p + 36, 0, true)          // internal attrs
    view.setUint32(p + 38, 0, true)          // external attrs
    view.setUint32(p + 42, e.offset, true)
    out.set(e.nameBytes, p + 46)
    p += 46 + e.nameBytes.length
  })

  view.setUint32(p, 0x06054b50, true)
  view.setUint16(p + 4, 0, true)
  view.setUint16(p + 6, 0, true)
  view.setUint16(p + 8, entries.length, true)
  view.setUint16(p + 10, entries.length, true)
  view.setUint32(p + 12, centralSize, true)
  view.setUint32(p + 16, localSize, true)
  view.setUint16(p + 20, 0, true)

  return out
}

// Keeps names unique inside one archive. Two tiles or two uploads can carry the
// same filename, and a duplicate entry makes some unzippers drop one silently.
export function uniqueZipName(name, taken) {
  if (!taken[name]) { taken[name] = 1; return name }
  var dot = name.lastIndexOf('.')
  var stem = dot > 0 ? name.slice(0, dot) : name
  var ext = dot > 0 ? name.slice(dot) : ''
  var n = taken[name]
  var candidate
  do {
    n++
    candidate = stem + '-' + n + ext
  } while (taken[candidate])
  taken[name] = n
  taken[candidate] = 1
  return candidate
}
