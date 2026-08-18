// Byte-level GIF structure scanner.
//
// Every other GIF tool here decodes with gifuct-js, which throws on the first
// thing it does not understand and tells you nothing about where it gave up.
// Repair needs the opposite behaviour: read as far as the bytes allow, remember
// exactly where the stream stopped making sense and why, and hand back
// something a human can read. Splitting needs one small piece of the same
// scan — the Netscape loop count — so it can carry the loop flag into every
// segment it writes.
//
// Pure functions over a Uint8Array. No DOM, no decoding of pixel data.

export var BLOCK_TRAILER = 0x3b
export var BLOCK_EXTENSION = 0x21
export var BLOCK_IMAGE = 0x2c
export var LABEL_GCE = 0xf9
export var LABEL_APPLICATION = 0xff
export var LABEL_COMMENT = 0xfe
export var LABEL_PLAIN_TEXT = 0x01

// How far into a file we are willing to look for a misplaced GIF header.
// Mail clients and broken downloads prepend a few hundred bytes at most.
var HEADER_SEARCH_LIMIT = 65536

function asBytes(input) {
  if (input instanceof Uint8Array) return input
  if (input && typeof input.byteLength === 'number') return new Uint8Array(input)
  return new Uint8Array(0)
}

function readAscii(bytes, start, length) {
  var s = ''
  for (var i = 0; i < length; i++) {
    var c = bytes[start + i]
    if (c === undefined) return s
    s += String.fromCharCode(c)
  }
  return s
}

function startsWith(bytes, magic, offset) {
  var at = offset || 0
  for (var i = 0; i < magic.length; i++) {
    if (bytes[at + i] !== magic[i]) return false
  }
  return true
}

var MAGICS = [
  { kind: 'PNG image', magic: [0x89, 0x50, 0x4e, 0x47] },
  { kind: 'JPEG image', magic: [0xff, 0xd8, 0xff] },
  { kind: 'PDF document', magic: [0x25, 0x50, 0x44, 0x46] },
  { kind: 'ZIP archive', magic: [0x50, 0x4b, 0x03, 0x04] },
  { kind: 'BMP image', magic: [0x42, 0x4d] },
  { kind: 'HTML page', magic: [0x3c, 0x21] },
  { kind: 'HTML page', magic: [0x3c, 0x68] },
]

// Names the format a "broken GIF" actually turned out to be, so the failure
// message can say "this is a PNG" instead of "invalid file".
export function detectFileKind(input) {
  var bytes = asBytes(input)
  if (!bytes.length) return ''
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && readAscii(bytes, 8, 4) === 'WEBP') return 'WebP image'
  if (readAscii(bytes, 4, 4) === 'ftyp') return 'MP4 video'
  for (var i = 0; i < MAGICS.length; i++) {
    if (startsWith(bytes, MAGICS[i].magic)) return MAGICS[i].kind
  }
  return ''
}

// Offset of the "GIF8" signature, or -1. A non-zero result means something was
// written in front of the GIF (mail preamble, HTTP headers, a failed download
// that kept the wrapper) — recoverable by slicing it off.
export function findGifHeaderOffset(input) {
  var bytes = asBytes(input)
  var limit = Math.min(bytes.length - 4, HEADER_SEARCH_LIMIT)
  for (var i = 0; i <= limit; i++) {
    if (bytes[i] === 0x47 && bytes[i + 1] === 0x49 && bytes[i + 2] === 0x46 && bytes[i + 3] === 0x38) {
      return i
    }
  }
  return -1
}

// Walk a GIF sub-block chain: a length byte, that many bytes, repeating until a
// zero length. `complete` is false when the file ends inside the chain, which is
// what a truncated download looks like from here.
export function skipSubBlocks(bytes, p) {
  while (p < bytes.length) {
    var len = bytes[p]
    p += 1
    if (len === 0) return { end: p, complete: true }
    if (p + len > bytes.length) return { end: bytes.length, complete: false }
    p += len
  }
  return { end: bytes.length, complete: false }
}

// Reads the structure of a GIF without ever touching compressed pixel data.
//
// `endOffset` is the safe truncation point: the offset just past the last
// top-level block that was complete. Cutting there and appending a trailer
// gives a file every decoder will accept, which is the whole repair strategy.
export function scanGifBytes(input, offset) {
  var bytes = asBytes(input)
  var base = offset || 0
  var out = {
    headerOffset: base,
    signatureOk: false,
    version: '',
    width: 0,
    height: 0,
    gct: { present: false, entries: 0, byteLength: 0, start: 0, complete: true },
    frames: [],
    netscape: { present: false, valid: false },
    loopCount: null,
    commentBlocks: 0,
    trailerOffset: -1,
    trailingBytes: 0,
    truncated: false,
    unknownBlock: -1,
    endOffset: base,
  }

  if (bytes.length - base < 6) {
    out.truncated = true
    out.endOffset = bytes.length
    return out
  }

  out.version = readAscii(bytes, base + 3, 3)
  out.signatureOk =
    bytes[base] === 0x47 && bytes[base + 1] === 0x49 && bytes[base + 2] === 0x46 &&
    (out.version === '87a' || out.version === '89a')

  if (bytes.length - base < 13) {
    out.truncated = true
    out.endOffset = bytes.length
    return out
  }

  out.width = bytes[base + 6] | (bytes[base + 7] << 8)
  out.height = bytes[base + 8] | (bytes[base + 9] << 8)

  var packed = bytes[base + 10]
  var p = base + 13
  if (packed & 0x80) {
    var entries = 1 << ((packed & 7) + 1)
    out.gct.present = true
    out.gct.entries = entries
    out.gct.byteLength = entries * 3
    out.gct.start = p
    out.gct.complete = p + entries * 3 <= bytes.length
    p += entries * 3
  }
  if (!out.gct.complete) {
    out.truncated = true
    out.endOffset = bytes.length
    return out
  }

  var lastGood = p
  var pendingDelay = null
  var pendingDisposal = 0

  while (p < bytes.length) {
    var block = bytes[p]

    if (block === BLOCK_TRAILER) {
      out.trailerOffset = p
      out.trailingBytes = bytes.length - p - 1
      lastGood = p
      break
    }

    if (block === BLOCK_EXTENSION) {
      if (p + 2 >= bytes.length) { out.truncated = true; break }
      var label = bytes[p + 1]
      if (label === LABEL_GCE) {
        if (p + 6 >= bytes.length) { out.truncated = true; break }
        pendingDelay = bytes[p + 4] | (bytes[p + 5] << 8)
        pendingDisposal = (bytes[p + 3] >> 2) & 7
      } else if (label === LABEL_APPLICATION) {
        var appSize = bytes[p + 2]
        if (readAscii(bytes, p + 3, 11) === 'NETSCAPE2.0') {
          out.netscape.present = true
          var sp = p + 3 + appSize
          if (appSize === 11 && bytes[sp] === 3 && bytes[sp + 1] === 1 && sp + 3 < bytes.length) {
            out.netscape.valid = true
            out.loopCount = bytes[sp + 2] | (bytes[sp + 3] << 8)
          }
        }
      } else if (label === LABEL_COMMENT) {
        out.commentBlocks += 1
      }
      var ext = skipSubBlocks(bytes, p + 2)
      if (!ext.complete) { out.truncated = true; break }
      p = ext.end
      lastGood = p
      continue
    }

    if (block === BLOCK_IMAGE) {
      if (p + 10 > bytes.length) {
        out.truncated = true
        out.frames.push(incompleteFrame(p, pendingDelay, pendingDisposal, false))
        break
      }
      var ipacked = bytes[p + 9]
      var q = p + 10
      var hasLocal = !!(ipacked & 0x80)
      if (hasLocal) q += 3 * (1 << ((ipacked & 7) + 1))
      if (q + 1 > bytes.length) {
        out.truncated = true
        out.frames.push(incompleteFrame(p, pendingDelay, pendingDisposal, hasLocal))
        break
      }
      var data = skipSubBlocks(bytes, q + 1)
      out.frames.push({
        start: p,
        delayCs: pendingDelay == null ? 0 : pendingDelay,
        hasGce: pendingDelay != null,
        disposal: pendingDisposal,
        hasLocalTable: hasLocal,
        complete: data.complete,
      })
      pendingDelay = null
      pendingDisposal = 0
      if (!data.complete) { out.truncated = true; break }
      p = data.end
      lastGood = p
      continue
    }

    out.unknownBlock = p
    break
  }

  if (out.trailerOffset < 0 && out.unknownBlock < 0 && p >= bytes.length) out.truncated = true
  out.endOffset = lastGood
  return out
}

function incompleteFrame(start, delay, disposal, hasLocal) {
  return {
    start: start,
    delayCs: delay == null ? 0 : delay,
    hasGce: delay != null,
    disposal: disposal,
    hasLocalTable: hasLocal,
    complete: false,
  }
}

// Netscape loop count: 0 means "loop forever", n means "play n times", and null
// means the file never said. Segments written by the splitter inherit it so a
// looping source does not turn into a one-shot part.
export function readGifLoopCount(input) {
  var bytes = asBytes(input)
  var at = findGifHeaderOffset(bytes)
  if (at < 0) return null
  return scanGifBytes(bytes, at).loopCount
}
