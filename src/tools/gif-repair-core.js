// Diagnosis and salvage for broken GIFs.
//
// The old "repair" was a loop-count rewrite: it re-encoded the file and set the
// Netscape looping block. That fixes exactly one failure ("my GIF will not
// animate") and silently does nothing for the others people actually arrive
// with — a download that stopped half way, a trailer that was never written,
// bytes glued on after the terminator, frames with a zero delay, a colour table
// the decoder cannot use.
//
// This module reads the file the way a forensic tool would: it never gives up
// on the first bad byte, it records what it found, and it produces a byte
// stream that a normal decoder will accept so the recoverable frames can be
// re-encoded. Everything here is pure — the UI does the decoding and the
// re-encode.

import {
  BLOCK_TRAILER,
  detectFileKind,
  findGifHeaderOffset,
  scanGifBytes,
} from './gif-bytes-core.js'

// Browsers already clamp 0 and 1 hundredths to 100 ms, which is why a
// zero-delay GIF plays at a different speed in every viewer. Writing the value
// the browsers use makes playback consistent instead of merely legal.
export var DEFAULT_DELAY_MS = 100
export var MIN_DELAY_MS = 20
export var MAX_DELAY_MS = 60000

export function repairDelayMs(ms) {
  var d = Number(ms)
  if (!isFinite(d) || d < MIN_DELAY_MS) return DEFAULT_DELAY_MS
  if (d > MAX_DELAY_MS) return MAX_DELAY_MS
  return Math.round(d)
}

// Returns the fixed delays plus a count of each kind of fix, so the readout can
// say "3 frames had no delay" rather than just "delays fixed".
export function repairDelaysMs(list) {
  var delays = []
  var zeroFixed = 0
  var cappedFixed = 0
  var src = list || []
  for (var i = 0; i < src.length; i++) {
    var raw = Number(src[i])
    var fixed = repairDelayMs(raw)
    if (!isFinite(raw) || raw < MIN_DELAY_MS) zeroFixed += 1
    else if (raw > MAX_DELAY_MS) cappedFixed += 1
    delays.push(fixed)
  }
  return { delays: delays, zeroFixed: zeroFixed, cappedFixed: cappedFixed }
}

function asBytes(input) {
  if (input instanceof Uint8Array) return input
  if (input && typeof input.byteLength === 'number') return new Uint8Array(input)
  return new Uint8Array(0)
}

function fatalReport(reason, issues) {
  return { fatal: true, reason: reason, issues: issues || [], stats: null, bytes: null }
}

// A neutral grayscale palette. Used only so a decoder has *something* to index
// into; the re-encode quantizes real pixels and throws this away.
function grayscaleTable(entries) {
  var table = new Uint8Array(entries * 3)
  for (var i = 0; i < entries; i++) {
    var v = Math.round((i / Math.max(1, entries - 1)) * 255)
    table[i * 3] = v
    table[i * 3 + 1] = v
    table[i * 3 + 2] = v
  }
  return table
}

// Inserts a 256-entry global colour table and flips the flag that says it is
// there. For a GIF whose frames carry no local table either, this is the
// difference between "decodes" and "does not decode".
export function addGlobalColorTable(input) {
  var bytes = asBytes(input)
  var table = grayscaleTable(256)
  var out = new Uint8Array(bytes.length + table.length)
  out.set(bytes.subarray(0, 13), 0)
  out.set(table, 13)
  out.set(bytes.subarray(13), 13 + table.length)
  out[10] = (out[10] | 0x80 | 0x07) & 0xff
  return out
}

// Writes the first image descriptor's size into a logical screen descriptor
// that says 0x0. A zero canvas renders as nothing at all in most viewers.
export function patchCanvasSize(input, width, height) {
  var out = asBytes(input).slice()
  out[6] = width & 0xff
  out[7] = (width >> 8) & 0xff
  out[8] = height & 0xff
  out[9] = (height >> 8) & 0xff
  return out
}

function frameDescriptorSize(bytes, start) {
  return {
    width: bytes[start + 5] | (bytes[start + 6] << 8),
    height: bytes[start + 7] | (bytes[start + 8] << 8),
  }
}

function truncateAt(bytes, end) {
  var out = new Uint8Array(end + 1)
  out.set(bytes.subarray(0, end), 0)
  out[end] = BLOCK_TRAILER
  return out
}

function sumDelaysMs(frames) {
  var total = 0
  for (var i = 0; i < frames.length; i++) total += repairDelayMs(frames[i].delayCs * 10)
  return total
}

/**
 * Full analysis of a GIF's byte structure.
 *
 * Returns either a fatal report with a reason specific enough to act on, or a
 * list of findings plus a salvaged byte stream that decodes cleanly.
 */
export function analyzeGif(input) {
  var bytes = asBytes(input)
  var issues = []

  if (!bytes.length) {
    return fatalReport('The file is empty (0 bytes), so there is nothing to recover.')
  }

  var headerOffset = findGifHeaderOffset(bytes)
  if (headerOffset < 0) {
    var kind = detectFileKind(bytes)
    return fatalReport(
      kind
        ? 'This is not a GIF — the bytes say it is a ' + kind + '. Nothing in the first 64 KB contains a GIF header.'
        : 'This file has no GIF header. The signature "GIF87a" or "GIF89a" does not appear anywhere in the first 64 KB, so there is no GIF structure to rebuild.'
    )
  }

  if (bytes.length - headerOffset < 13) {
    return fatalReport(
      'The file ends ' + (bytes.length - headerOffset) + ' bytes into the GIF header. A GIF needs 13 bytes ' +
      'of header before any image data, so nothing was written that could be recovered.'
    )
  }

  var work = bytes
  if (headerOffset > 0) {
    issues.push({
      code: 'leading-junk',
      found: headerOffset + ' byte(s) of data in front of the GIF header',
      fix: 'stripped, so the rebuilt file starts at the header',
    })
    work = bytes.slice(headerOffset)
  }

  var scan = scanGifBytes(work, 0)

  if (!scan.signatureOk) {
    issues.push({
      code: 'bad-signature',
      found: 'the version field reads "' + scan.version + '" instead of 87a or 89a',
      fix: 'header rewritten as GIF89a',
    })
    work = work.slice()
    work[0] = 0x47; work[1] = 0x49; work[2] = 0x46
    work[3] = 0x38; work[4] = 0x39; work[5] = 0x61
    scan = scanGifBytes(work, 0)
  }

  if (scan.gct.present && !scan.gct.complete) {
    var have = Math.max(0, work.length - scan.gct.start)
    return fatalReport(
      'The global colour table is cut short — ' + have + ' of ' + scan.gct.byteLength + ' bytes are present ' +
      'and the file ends there. No frame data was ever written, so there is nothing to rebuild.',
      issues.concat([{
        code: 'truncated-color-table',
        found: 'global colour table holds ' + have + ' of ' + scan.gct.byteLength + ' bytes',
        fix: 'not recoverable — the file ends inside the table',
      }])
    )
  }

  if (!scan.frames.length) {
    return fatalReport(
      scan.unknownBlock >= 0
        ? 'The header is intact but the first block after it is 0x' +
          work[scan.unknownBlock].toString(16).padStart(2, '0') +
          ', which is not a GIF block. No frame was ever written to this file.'
        : 'The header is intact but the file contains no image blocks at all — every frame is missing, so there is nothing to rebuild.',
      issues
    )
  }

  var complete = scan.frames.filter(function (f) { return f.complete })
  if (!complete.length) {
    return fatalReport(
      'The first frame\'s compressed pixel data stops part way through, so not one complete frame survived. ' +
      'A GIF cut off this early cannot be rebuilt — only re-downloaded.',
      issues
    )
  }

  var dropped = scan.frames.length - complete.length
  if (dropped > 0) {
    issues.push({
      code: 'truncated-frame',
      found: 'frame ' + scan.frames.length + ' stops part way through its pixel data (the download was cut off)',
      fix: 'dropped — the ' + complete.length + ' complete frame(s) before it are kept',
    })
  }

  if (scan.unknownBlock >= 0) {
    issues.push({
      code: 'unknown-block',
      found: 'byte 0x' + work[scan.unknownBlock].toString(16).padStart(2, '0') +
        ' at offset ' + scan.unknownBlock + ' is not a valid GIF block',
      fix: 'the stream is cut there — the ' + complete.length + ' frame(s) before it are kept',
    })
  }

  if (scan.trailerOffset < 0) {
    issues.push({
      code: 'missing-trailer',
      found: 'the file has no trailer byte (0x3B) marking the end of the GIF',
      fix: 'a trailer is written after the last complete frame',
    })
  } else if (scan.trailingBytes > 0) {
    issues.push({
      code: 'trailing-garbage',
      found: scan.trailingBytes + ' byte(s) of data after the GIF trailer',
      fix: 'removed',
    })
  }

  if (complete.length > 1) {
    if (!scan.netscape.present) {
      issues.push({
        code: 'missing-loop-block',
        found: 'no Netscape looping block, so strict viewers play the animation once and stop',
        fix: 'a looping block is written',
      })
    } else if (!scan.netscape.valid) {
      issues.push({
        code: 'bad-loop-block',
        found: 'the Netscape looping block is malformed, so the loop count cannot be read',
        fix: 'rebuilt',
      })
    }

    var zeroDelay = complete.filter(function (f) { return !f.hasGce || f.delayCs * 10 < MIN_DELAY_MS }).length
    if (zeroDelay) {
      issues.push({
        code: 'zero-delay',
        found: zeroDelay + ' frame(s) have no delay set, which every browser plays at a different speed',
        fix: 'set to ' + DEFAULT_DELAY_MS + ' ms',
      })
    }
    var absurdDelay = complete.filter(function (f) { return f.delayCs * 10 > MAX_DELAY_MS }).length
    if (absurdDelay) {
      issues.push({
        code: 'absurd-delay',
        found: absurdDelay + ' frame(s) hold for longer than ' + (MAX_DELAY_MS / 1000) + ' s, which reads as a frozen image',
        fix: 'capped at ' + (MAX_DELAY_MS / 1000) + ' s',
      })
    }
  }

  var out = truncateAt(work, scan.endOffset)

  var width = scan.width
  var height = scan.height
  if ((!width || !height) && complete.length) {
    var dims = frameDescriptorSize(out, complete[0].start)
    if (dims.width && dims.height) {
      issues.push({
        code: 'zero-canvas',
        found: 'the header declares a ' + scan.width + '×' + scan.height + ' canvas, so viewers draw nothing',
        fix: 'set to ' + dims.width + '×' + dims.height + ', taken from the first frame',
      })
      out = patchCanvasSize(out, dims.width, dims.height)
      width = dims.width
      height = dims.height
    }
  }

  var noPalette = !scan.gct.present && !complete.some(function (f) { return f.hasLocalTable })
  if (noPalette) {
    issues.push({
      code: 'missing-color-table',
      found: 'there is no global colour table and no frame carries one, so a decoder has no palette to draw with',
      fix: 'a grayscale table is inserted so the frames decode; the rebuilt file gets a palette built from the pixels',
    })
    out = addGlobalColorTable(out)
  }

  return {
    fatal: false,
    reason: null,
    issues: issues,
    bytes: out,
    stats: {
      width: width,
      height: height,
      frameCount: complete.length,
      sourceFrameCount: scan.frames.length,
      droppedFrames: dropped,
      durationMs: sumDelaysMs(complete),
      loopCount: scan.loopCount,
      hasLoopBlock: scan.netscape.present && scan.netscape.valid,
    },
  }
}

// Same analysis, but throws on a file nothing can be done with so the caller
// can surface the specific reason instead of a generic failure.
export function planGifRepair(input) {
  var report = analyzeGif(input)
  if (report.fatal) {
    var err = new Error(report.reason)
    err.code = 'gif-unrecoverable'
    err.report = report
    throw err
  }
  return report
}

export function diagnoseGif(input) {
  return analyzeGif(input)
}

// The line above the findings list. A clean file still gets rebuilt — that is
// what makes the download worth taking — so say so rather than claiming a fix.
export function summarizeRepair(report) {
  if (!report) return ''
  if (report.fatal) return report.reason || 'This GIF cannot be repaired.'
  var n = report.issues.length
  if (!n) {
    return 'No structural problems found. This file is already a valid GIF; it was re-encoded with clean timing and a fresh loop block anyway.'
  }
  return n === 1
    ? '1 problem found and repaired.'
    : n + ' problems found and repaired.'
}
