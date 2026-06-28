// File converter — format registry and routing
import {
  IMAGE_FORMATS,
  FFMPEG_FORMATS,
  VIDEO_FORMATS,
  DOCUMENT_FORMATS,
} from './vert-formats-data.js'

export const CATEGORIES = {
  image: { formats: [], canConvertTo: [] },
  audio: { formats: [], canConvertTo: ['video'] },
  video: { formats: [], canConvertTo: ['audio'] },
  doc: { formats: [], canConvertTo: [] },
}

function dotName(name) {
  return name.startsWith('.') ? name.toLowerCase() : '.' + name.toLowerCase()
}

function bareName(ext) {
  return ext.replace(/^\./, '').toLowerCase()
}

function toFormatMap(formats) {
  var map = new Map()
  for (var i = 0; i < formats.length; i++) {
    var f = formats[i]
    map.set(dotName(f.name), f)
  }
  return map
}

export const FORMAT_MAPS = {
  imagemagick: toFormatMap(IMAGE_FORMATS),
  ffmpeg: toFormatMap(FFMPEG_FORMATS),
  video: toFormatMap(VIDEO_FORMATS),
  pandoc: toFormatMap(DOCUMENT_FORMATS),
}

// Populate category output format lists
CATEGORIES.audio.formats = FFMPEG_FORMATS
  .filter(function (f) { return f.toSupported && f.isNative })
  .map(function (f) { return dotName(f.name) })

CATEGORIES.video.formats = VIDEO_FORMATS
  .filter(function (f) { return f.toSupported && f.isNative })
  .map(function (f) { return dotName(f.name) })

CATEGORIES.image.formats = IMAGE_FORMATS
  .filter(function (f) { return f.toSupported })
  .map(function (f) { return dotName(f.name) })

CATEGORIES.doc.formats = DOCUMENT_FORMATS
  .filter(function (f) { return f.toSupported && f.isNative })
  .map(function (f) { return dotName(f.name) })

export function normalizeExtension(ext) {
  if (!ext) return ''
  return dotName(ext)
}

export function detectExtension(filename) {
  var parts = (filename || '').split('.')
  if (parts.length < 2) return ''
  return normalizeExtension(parts.pop())
}

export function getCategory(ext) {
  var d = normalizeExtension(ext)
  if (FORMAT_MAPS.imagemagick.has(d)) return 'image'
  if (FORMAT_MAPS.pandoc.has(d)) return 'doc'
  if (FORMAT_MAPS.video.has(d)) return 'video'
  var ff = FORMAT_MAPS.ffmpeg.get(d)
  if (ff && ff.isNative) return 'audio'
  if (ff && !ff.isNative) return 'video'
  return null
}

export function getFormatsForCategory(category) {
  return (CATEGORIES[category] && CATEGORIES[category].formats) ? CATEGORIES[category].formats.slice() : []
}

export function getCategoryOutputTargets(category) {
  return (CATEGORIES[category] && CATEGORIES[category].canConvertTo) ? CATEGORIES[category].canConvertTo.slice() : []
}

function formatSupportsInput(map, ext) {
  var f = map.get(normalizeExtension(ext))
  return !!(f && f.fromSupported)
}

function formatSupportsOutput(map, ext) {
  var f = map.get(normalizeExtension(ext))
  return !!(f && f.toSupported)
}

function enginesForInput(ext) {
  var d = normalizeExtension(ext)
  var engines = []
  if (formatSupportsInput(FORMAT_MAPS.imagemagick, d)) engines.push('imagemagick')
  if (formatSupportsInput(FORMAT_MAPS.pandoc, d)) engines.push('pandoc')
  if (formatSupportsInput(FORMAT_MAPS.ffmpeg, d)) engines.push('ffmpeg')
  if (formatSupportsInput(FORMAT_MAPS.video, d)) engines.push('ffmpeg')
  return engines
}

export function findEngine(inputExt, outputExt) {
  var from = normalizeExtension(inputExt)
  var to = normalizeExtension(outputExt)
  var inputCat = getCategory(from)
  var outputCat = getCategory(to)

  if (inputCat === 'image' && outputCat === 'image') {
    if (formatSupportsInput(FORMAT_MAPS.imagemagick, from) && formatSupportsOutput(FORMAT_MAPS.imagemagick, to)) {
      return 'imagemagick'
    }
    return null
  }

  if (inputCat === 'doc' && outputCat === 'doc') {
    if (formatSupportsInput(FORMAT_MAPS.pandoc, from) && formatSupportsOutput(FORMAT_MAPS.pandoc, to)) {
      return 'pandoc'
    }
    return null
  }

  // FFmpeg handles audio↔audio, video→audio, audio→video, video→video
  if (inputCat === 'audio' || inputCat === 'video' || outputCat === 'audio' || outputCat === 'video') {
    var ffIn = formatSupportsInput(FORMAT_MAPS.ffmpeg, from) || formatSupportsInput(FORMAT_MAPS.video, from)
    var ffOut = formatSupportsOutput(FORMAT_MAPS.ffmpeg, to) || formatSupportsOutput(FORMAT_MAPS.video, to)
    if (ffIn && ffOut) return 'ffmpeg'
  }

  return null
}

export function canConvert(inputExt, outputExt) {
  return findEngine(inputExt, outputExt) !== null
}

export function getAvailableOutputs(inputExt) {
  var from = normalizeExtension(inputExt)
  var inputCat = getCategory(from)
  if (!inputCat) return []

  var outputs = new Set()
  var crossTargets = getCategoryOutputTargets(inputCat)

  // Same-category outputs
  var sameCat = getFormatsForCategory(inputCat)
  for (var i = 0; i < sameCat.length; i++) {
    if (sameCat[i] !== from && canConvert(from, sameCat[i])) outputs.add(sameCat[i])
  }

  // Cross-category (video↔audio)
  for (var j = 0; j < crossTargets.length; j++) {
    var targetCat = crossTargets[j]
    var targetFormats = getFormatsForCategory(targetCat)
    for (var k = 0; k < targetFormats.length; k++) {
      if (canConvert(from, targetFormats[k])) outputs.add(targetFormats[k])
    }
  }

  return [...outputs].sort()
}

export function getAllInputExtensions() {
  var all = new Set()
  IMAGE_FORMATS.forEach(function (f) { if (f.fromSupported) all.add(dotName(f.name)) })
  FFMPEG_FORMATS.forEach(function (f) { if (f.fromSupported) all.add(dotName(f.name)) })
  VIDEO_FORMATS.forEach(function (f) { if (f.fromSupported) all.add(dotName(f.name)) })
  DOCUMENT_FORMATS.forEach(function (f) { if (f.fromSupported) all.add(dotName(f.name)) })
  return [...all].sort()
}

export function buildOutputFilename(inputName, outputExt) {
  var ext = normalizeExtension(outputExt)
  var bare = bareName(ext)
  var stem = (inputName || 'converted').replace(/\.[^.]+$/, '') || 'converted'
  return stem + '.' + bare
}

export function getAcceptAttribute() {
  return getAllInputExtensions().map(function (e) { return bareName(e) }).join(',')
}

export function getEngineLabel(engine) {
  var labels = {
    imagemagick: 'ImageMagick WASM',
    ffmpeg: 'FFmpeg WASM',
    pandoc: 'Pandoc WASM',
  }
  return labels[engine] || engine
}

export function groupOutputsByCategory(outputs) {
  var groups = { image: [], audio: [], video: [], doc: [] }
  for (var i = 0; i < outputs.length; i++) {
    var cat = getCategory(outputs[i])
    if (cat && groups[cat]) groups[cat].push(outputs[i])
  }
  return groups
}
