// Pure helpers for animated GIF frame manipulation — shared by ezgif-gap tools.

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

export function getGifOutputFilename(inputName, suffix) {
  if (!inputName || typeof inputName !== 'string') return 'output-' + suffix + '.gif'
  var stem = inputName.replace(/\.gif$/i, '')
  if (stem === inputName) {
    var dot = inputName.lastIndexOf('.')
    stem = dot > 0 ? inputName.substring(0, dot) : inputName
  }
  return stem + '-' + suffix + '.gif'
}
