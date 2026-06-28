// Pure helpers for ezgif-gap GIF extension tools.

import { totalDurationMs } from './gif-anim-core.js'

export function computeGifStats(frameCount, delays, width, height) {
  var count = Number(frameCount) || 0
  var durationMs = totalDurationMs(delays || [])
  var avg = count ? delays.reduce(function (a, b) { return a + (Number(b) || 0) }, 0) / count : 0
  var fps = durationMs > 0 ? (count / (durationMs / 1000)) : 0
  return {
    frameCount: count,
    durationMs: durationMs,
    width: width,
    height: height,
    avgDelayCs: Math.round(avg),
    fps: Math.round(fps * 10) / 10,
  }
}

var POSITION_OFFSETS = {
  tl: function (bw, bh, ow, oh, m) { return { x: m, y: m } },
  tc: function (bw, bh, ow, oh, m) { return { x: (bw - ow) / 2, y: m } },
  tr: function (bw, bh, ow, oh, m) { return { x: bw - ow - m, y: m } },
  ml: function (bw, bh, ow, oh, m) { return { x: m, y: (bh - oh) / 2 } },
  mc: function (bw, bh, ow, oh, m) { return { x: (bw - ow) / 2, y: (bh - oh) / 2 } },
  mr: function (bw, bh, ow, oh, m) { return { x: bw - ow - m, y: (bh - oh) / 2 } },
  bl: function (bw, bh, ow, oh, m) { return { x: m, y: bh - oh - m } },
  bc: function (bw, bh, ow, oh, m) { return { x: (bw - ow) / 2, y: bh - oh - m } },
  br: function (bw, bh, ow, oh, m) { return { x: bw - ow - m, y: bh - oh - m } },
}

export function computeOverlayPosition(baseW, baseH, overlayW, overlayH, position, margin) {
  var m = Math.max(0, Number(margin) || 0)
  var fn = POSITION_OFFSETS[position] || POSITION_OFFSETS.mc
  var pos = fn(baseW, baseH, overlayW, overlayH, m)
  return { x: Math.round(pos.x), y: Math.round(pos.y) }
}

var EFFECT_FILTERS = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(100%)',
  blur: 'blur(2px)',
  brightness: 'brightness(1.3)',
  contrast: 'contrast(1.4)',
  saturate: 'saturate(2)',
  invert: 'invert(100%)',
}

export function getCanvasFilterForEffect(effect) {
  return EFFECT_FILTERS[effect] || 'none'
}

export function computeStaticGifKeyframes(frameCount, style) {
  var n = Math.max(2, Math.min(60, Number(frameCount) || 8))
  var kf = []
  for (var i = 0; i < n; i++) {
    var t = i / (n - 1 || 1)
    var scale = 1
    var offsetX = 0
    var offsetY = 0
    if (style === 'zoom-in') {
      scale = 1 + t * 0.15
      offsetX = -t * 0.05
      offsetY = -t * 0.05
    } else if (style === 'zoom-out') {
      scale = 1.15 - t * 0.15
      offsetX = (1 - t) * -0.05
      offsetY = (1 - t) * -0.05
    } else if (style === 'pan-right') {
      offsetX = -t * 0.1
    } else if (style === 'pulse') {
      scale = 1 + Math.sin(t * Math.PI * 2) * 0.03
    }
    kf.push({ scale: scale, offsetX: offsetX, offsetY: offsetY })
  }
  return kf
}

export function formatFrameFilename(stem, index, total, ext) {
  var pad = String(total).length
  var num = String(index).padStart(pad, '0')
  return stem + '-frame-' + num + ext
}
