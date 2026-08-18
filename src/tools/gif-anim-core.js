// Pure helpers for animated GIF frame manipulation — shared by ezgif-gap tools.

import { computeScaledDims } from './gif-compressor-core.js'

export const MIN_DELAY = 2 // hundredths of a second; browsers throttle below this

export function reverseFrameOrder(frames) {
  return frames.slice().reverse()
}

export function clampDelay(delay) {
  var d = Math.round(Number(delay) || 0)
  return Math.max(MIN_DELAY, d)
}

export function speedPercentToDelayFactor(percent) {
  var p = Number(percent)
  if (!p || p <= 0) return 1
  return 100 / p
}

export function scaleDelays(delays, speedPercent) {
  var factor = speedPercentToDelayFactor(speedPercent)
  return delays.map(function (d) {
    return clampDelay(Math.round((Number(d) || 0) * factor))
  })
}

// Walk past a GIF sub-block chain (length byte, that many bytes, repeat until a
// zero-length block). Returns the offset just past the terminator.
function skipSubBlocks(bytes, p) {
  while (p < bytes.length) {
    var len = bytes[p]
    p += 1
    if (len === 0) break
    p += len
  }
  return p
}

// Change playback speed by rewriting the delay field of every Graphic Control
// Extension in place, leaving the compressed pixel data untouched.
//
// The decode-and-re-encode path needs width × height × frames × 4 bytes of RAM
// (a 2808×1650 GIF with 597 frames wants 10.3 GB and kills the tab) and it
// requantizes to 256 colors on the way out. Speed is pure timing metadata, so
// none of that is necessary: copy the bytes, patch the delays, done.
export function rewriteGifDelays(bytes, speedPercent) {
  if (!bytes || bytes.length < 13) throw new Error('Not a valid GIF file.')
  if (bytes[0] !== 0x47 || bytes[1] !== 0x49 || bytes[2] !== 0x46) {
    throw new Error('Not a valid GIF file.')
  }
  var factor = speedPercentToDelayFactor(speedPercent)
  var out = bytes.slice()
  var packed = out[10]
  var p = 13
  if (packed & 0x80) p += 3 * (1 << ((packed & 7) + 1)) // global color table
  var patched = 0
  while (p < out.length) {
    var block = out[p]
    if (block === 0x3b) break // trailer
    if (block === 0x21) {
      // Extension. 0xF9 is the Graphic Control Extension, whose 2-byte
      // little-endian delay sits at +4 (after label, block size and flags).
      if (out[p + 1] === 0xf9) {
        var delay = out[p + 4] | (out[p + 5] << 8)
        var scaled = Math.min(clampDelay(Math.round(delay * factor)), 0xffff)
        out[p + 4] = scaled & 0xff
        out[p + 5] = (scaled >> 8) & 0xff
        patched += 1
      }
      p = skipSubBlocks(out, p + 2)
    } else if (block === 0x2c) {
      // Image descriptor: 10-byte header, optional local color table,
      // then the LZW minimum code size and the compressed sub-blocks.
      var ipacked = out[p + 9]
      p += 10
      if (ipacked & 0x80) p += 3 * (1 << ((ipacked & 7) + 1))
      p = skipSubBlocks(out, p + 1)
    } else {
      break // unrecognized block, stop rather than corrupt the stream
    }
  }
  if (!patched) throw new Error('This GIF has no frame timing to change.')
  return out
}

export function cutFramesByIndex(frames, startIdx, endIdx) {
  var start = Math.max(0, Math.floor(startIdx))
  var end = Math.min(frames.length, Math.floor(endIdx))
  if (start >= end) return []
  return frames.slice(start, end)
}

export function totalDurationMs(delays) {
  var sum = 0
  for (var i = 0; i < delays.length; i++) {
    sum += Number(delays[i]) || 0
  }
  return sum * 10 // hundredths → ms
}

export function frameIndexAtTime(delays, timeMs) {
  if (!delays.length) return 0
  var target = Math.max(0, Number(timeMs) || 0)
  var elapsed = 0
  for (var i = 0; i < delays.length; i++) {
    elapsed += (Number(delays[i]) || 0) * 10
    if (target < elapsed) return i
  }
  return delays.length - 1
}

export function cutFramesByTime(frames, delays, startMs, endMs) {
  if (!frames.length) return { frames: [], delays: [] }
  if (endMs <= startMs) return { frames: [], delays: [] }
  var startIdx = frameIndexAtTime(delays, startMs)
  var endIdx = frameIndexAtTime(delays, Math.max(startMs, endMs - 1))
  var cutFrames = cutFramesByIndex(frames, startIdx, endIdx + 1)
  var cutDelays = cutFramesByIndex(delays, startIdx, endIdx + 1)
  return { frames: cutFrames, delays: cutDelays }
}

export function pingPongFrames(frames) {
  if (frames.length <= 1) return frames.slice()
  return frames.concat(frames.slice(0, -1).reverse())
}

export function shuffleFrames(frames, rng) {
  var out = frames.slice()
  var random = rng || Math.random
  for (var i = out.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1))
    var tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

export function extendToDuration(frames, delays, targetMs) {
  var target = Math.max(0, Number(targetMs) || 0)
  if (!frames.length) return { frames: [], delays: [] }
  var outFrames = []
  var outDelays = []
  var total = 0
  var guard = 0
  while (total < target && guard < 10000) {
    for (var i = 0; i < frames.length; i++) {
      outFrames.push(frames[i])
      var d = Number(delays[i]) || MIN_DELAY
      outDelays.push(d)
      total += d * 10
      if (total >= target) break
    }
    guard++
  }
  return { frames: outFrames, delays: outDelays }
}

export function computeResizeDims(srcW, srcH, targetW, targetH, mode) {
  var sw = Math.max(1, Math.round(srcW))
  var sh = Math.max(1, Math.round(srcH))
  var tw = Math.max(1, Math.round(targetW))
  var th = Math.max(1, Math.round(targetH))
  if (mode === 'stretch') return { width: tw, height: th }
  var srcRatio = sw / sh
  var tgtRatio = tw / th
  if (mode === 'cover') {
    if (srcRatio > tgtRatio) {
      return { width: Math.round(th * srcRatio), height: th }
    }
    return { width: tw, height: Math.round(tw / srcRatio) }
  }
  // contain (default)
  if (srcRatio > tgtRatio) {
    return { width: tw, height: Math.round(tw / srcRatio) }
  }
  return { width: Math.round(th * srcRatio), height: th }
}

export function computeCropRegion(srcW, srcH, cropW, cropH, x, y) {
  var w = Math.round(cropW)
  var h = Math.round(cropH)
  if (w <= 0 || h <= 0) return null
  var maxX = Math.max(0, Math.round(srcW) - w)
  var maxY = Math.max(0, Math.round(srcH) - h)
  return {
    x: Math.min(Math.max(0, Math.round(x)), maxX),
    y: Math.min(Math.max(0, Math.round(y)), maxY),
    width: Math.min(w, Math.round(srcW)),
    height: Math.min(h, Math.round(srcH)),
  }
}

export function normalizeRotation(angle) {
  var a = Math.round(Number(angle) || 0) % 360
  return a < 0 ? a + 360 : a
}

export function combineLayoutDims(layout, sizes) {
  if (!sizes.length) return { width: 0, height: 0 }
  if (layout === 'horizontal') {
    var w = 0
    var h = 0
    sizes.forEach(function (s) {
      w += s.w
      h = Math.max(h, s.h)
    })
    return { width: w, height: h }
  }
  if (layout === 'vertical') {
    var w2 = 0
    var h2 = 0
    sizes.forEach(function (s) {
      w2 = Math.max(w2, s.w)
      h2 += s.h
    })
    return { width: w2, height: h2 }
  }
  if (layout === 'grid2x2') {
    var topW = Math.max(sizes[0]?.w || 0, sizes[1]?.w || 0)
    var botW = Math.max(sizes[2]?.w || 0, sizes[3]?.w || 0)
    var leftH = Math.max(sizes[0]?.h || 0, sizes[2]?.h || 0)
    var rightH = Math.max(sizes[1]?.h || 0, sizes[3]?.h || 0)
    return { width: topW + botW, height: leftH + rightH }
  }
  return { width: sizes[0].w, height: sizes[0].h }
}

export function validateLoopCount(n) {
  var v = Number(n)
  return Number.isInteger(v) && v >= 0
}

export function normalizeLoopCount(n) {
  if (!validateLoopCount(n)) return 0
  return Number(n)
}

// Decoding holds every frame as composited RGBA, so peak memory is
// width × height × frames × 4 regardless of how small the compressed file is.
// Returns null when the GIF fits the budget, or a user-facing message when it
// would blow the tab's memory.
export function decodedSizeError(width, height, frameCount, maxPixels) {
  var w = Number(width) || 0
  var h = Number(height) || 0
  var n = Number(frameCount) || 0
  if (w <= 0 || h <= 0 || n <= 0) return null
  var pixels = w * h * n
  if (pixels <= maxPixels) return null
  var mb = Math.round((pixels * 4) / 1048576)
  return (
    'This GIF is too big to process in the browser: ' + w + '×' + h + ' at ' + n +
    ' frames needs about ' + mb + ' MB of memory. Decoded size is what runs out, ' +
    'not file size. Try smaller dimensions or fewer frames.'
  )
}

// Ordered from least to most destructive. Resolution is given up before frames
// are dropped (a choppy GIF reads worse than a slightly smaller one), then both
// together once the budget gets tight.
export var FIT_LADDER = [
  { scale: 100, skip: 1 },
  { scale: 75, skip: 1 },
  { scale: 50, skip: 1 },
  { scale: 50, skip: 2 },
  { scale: 35, skip: 2 },
  { scale: 25, skip: 2 },
  { scale: 25, skip: 3 },
  { scale: 20, skip: 4 },
  { scale: 15, skip: 4 },
]

export function keptFrameCount(frameCount, skip) {
  var s = skip && skip > 1 ? skip : 1
  return Math.ceil(frameCount / s)
}

// Pick the least destructive downscale + frame-drop combination whose decoded
// frames fit the memory budget. Returns null when even the last rung overflows.
//
// This has to be decided up front so the decoder can shrink each frame as it
// goes: compressing after a full decode is pointless, because the full decode
// is what runs out of memory.
export function computeFitPlan(width, height, frameCount, budgetPixels) {
  var w = Number(width) || 0
  var h = Number(height) || 0
  var n = Number(frameCount) || 0
  if (w <= 0 || h <= 0 || n <= 0) return null
  for (var i = 0; i < FIT_LADDER.length; i++) {
    var rung = FIT_LADDER[i]
    var dims = computeScaledDims(w, h, rung.scale)
    var kept = keptFrameCount(n, rung.skip)
    if (dims.width * dims.height * kept <= budgetPixels) {
      return {
        scale: rung.scale,
        skip: rung.skip,
        width: dims.width,
        height: dims.height,
        frameCount: kept,
        sourceFrameCount: n,
        compressed: rung.scale < 100 || rung.skip > 1,
      }
    }
  }
  return null
}

// One line the user can act on, or '' when the GIF fit as-is.
export function describeFitPlan(plan, sourceWidth, sourceHeight) {
  if (!plan || !plan.compressed) return ''
  var parts = []
  if (plan.scale < 100) {
    parts.push('resized to ' + plan.width + '×' + plan.height +
      ' (from ' + sourceWidth + '×' + sourceHeight + ')')
  }
  if (plan.skip > 1) {
    parts.push('kept ' + plan.frameCount + ' of ' + plan.sourceFrameCount +
      ' frames, same total duration')
  }
  return 'Too big to process at full size, so it was ' + parts.join(' and ') + '.'
}

export function getGifOutputFilename(inputName, suffix) {
  if (!inputName || typeof inputName !== 'string') return 'output-' + suffix + '.gif'
  var stem = inputName.replace(/\.gif$/i, '')
  if (stem === inputName) {
    var dot = inputName.lastIndexOf('.')
    stem = dot > 0 ? inputName.substring(0, dot) : inputName
  }
  return stem + '-' + suffix + '.gif'
}
