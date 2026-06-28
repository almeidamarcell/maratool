#!/usr/bin/env node
/**
 * EZGIF gap wave — generates tools, pages, blogs, and tools.ts entries.
 * Run: node scripts/generate-ezgif-wave.mjs
 *
 * Prerequisites: gif-anim-core.js, ezgif-video-ext-core.js, ezgif-audio-core.js (TDD-tested)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.join(path.dirname(__filename), '..')
const PAGES = path.join(ROOT, 'src', 'pages')
const BLOG = path.join(ROOT, 'src', 'pages', 'blog')
const TOOLS_JS = path.join(ROOT, 'src', 'tools')
const TOOLS_TS = path.join(ROOT, 'src', 'data', 'tools.ts')
const BLOG_INDEX = path.join(BLOG, 'index.astro')
const DATE = 'June 28, 2026'
const DATE_ISO = '2026-06-28'

/** @type {Array<Record<string, unknown>>} */
export const EZGIF_TOOLS = [
  // ── GIF frame editors (gif-anim-ui) ──
  { slug: 'gif-reverse', name: 'Reverse GIF Online — Play Animation Backwards', emoji: '⏪', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'reverse', suffix: 'reversed', keywords: ['reverse gif', 'gif reverser', 'play gif backwards', 'backward gif', 'boomerang gif'] },
  { slug: 'gif-speed', name: 'Change GIF Speed Online — Faster or Slower', emoji: '⚡', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'speed', suffix: 'speed', fields: [{ key: 'speedPercent', label: 'Speed (% of current)', type: 'number', default: 100 }], keywords: ['change gif speed', 'speed up gif', 'slow down gif', 'gif speed changer'] },
  { slug: 'gif-cut', name: 'Cut GIF Duration Online — Trim Animated GIF', emoji: '✂️', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'cut', suffix: 'cut', fields: [{ key: 'startSec', label: 'Start (seconds)', type: 'number', default: 0 }, { key: 'endSec', label: 'End (seconds)', type: 'number', default: 5 }], keywords: ['cut gif', 'trim gif', 'shorten gif', 'gif cutter online'] },
  { slug: 'gif-resizer', name: 'Resize GIF Online — Change Animated GIF Size', emoji: '📐', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'resizer', suffix: 'resized', fields: [{ key: 'width', label: 'Width (px)', type: 'number', default: 480 }, { key: 'height', label: 'Height (px, optional)', type: 'number', default: '' }], keywords: ['resize gif', 'gif resizer', 'change gif size', 'scale gif online'] },
  { slug: 'gif-cropper', name: 'Crop GIF Online — Crop Animated GIF', emoji: '🔲', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'cropper', suffix: 'cropped', fields: [{ key: 'cropX', label: 'X', type: 'number', default: 0 }, { key: 'cropY', label: 'Y', type: 'number', default: 0 }, { key: 'cropW', label: 'Width', type: 'number', default: 320 }, { key: 'cropH', label: 'Height', type: 'number', default: 240 }], keywords: ['crop gif', 'gif cropper', 'crop animated gif online'] },
  { slug: 'gif-rotate', name: 'Rotate GIF Online — Flip or Rotate Animation', emoji: '🔄', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'rotate', suffix: 'rotated', fields: [{ key: 'angle', label: 'Angle (degrees)', type: 'number', default: 90 }], keywords: ['rotate gif', 'flip gif', 'turn gif 90 degrees'] },
  { slug: 'ping-pong-gif', name: 'Ping Pong GIF — Boomerang Loop Online', emoji: '🔁', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'ping-pong', suffix: 'pingpong', keywords: ['ping pong gif', 'boomerang gif', 'gif boomerang loop'] },
  { slug: 'gif-randomize', name: 'Shuffle GIF Frames Online', emoji: '🎲', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'randomize', suffix: 'shuffled', keywords: ['shuffle gif frames', 'randomize gif', 'gif frame randomizer'] },
  { slug: 'extend-gif', name: 'Extend GIF Duration — Loop to Target Length', emoji: '⏱️', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'extend', suffix: 'extended', fields: [{ key: 'targetSec', label: 'Target duration (seconds)', type: 'number', default: 10 }], keywords: ['extend gif duration', 'make gif longer', 'loop gif to length'] },

  // ── GIF / video converters (ffmpeg) ──
  { slug: 'gif-to-mp4', name: 'Convert GIF to MP4 Online', emoji: '🎬', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg', accept: 'gif', outputExt: '.mp4', buildFn: 'buildGifToMp4Args', suffix: 'mp4', keywords: ['gif to mp4', 'convert gif to video', 'gif to mp4 converter'] },
  { slug: 'gif-to-webp', name: 'Convert GIF to WebP Online', emoji: '🖼️', category: 'Image', subcategory: 'Animated', ui: 'ffmpeg', accept: 'gif', outputExt: '.webp', buildFn: 'gifToWebp', suffix: 'webp', keywords: ['gif to webp', 'convert gif to webp', 'animated webp from gif'] },
  { slug: 'gif-to-apng', name: 'Convert GIF to APNG Online', emoji: '🖼️', category: 'Image', subcategory: 'Animated', ui: 'ffmpeg', accept: 'gif', outputExt: '.apng', buildFn: 'gifToApng', suffix: 'apng', keywords: ['gif to apng', 'convert gif to apng', 'animated png from gif'] },
  { slug: 'video-to-apng', name: 'Video to APNG Converter Online', emoji: '🎞️', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildVideoToApngArgs', outputExt: '.apng', suffix: 'apng', fields: [{ key: 'start', label: 'Start (s)', type: 'number', default: 0 }, { key: 'end', label: 'End (s)', type: 'number', default: 5 }, { key: 'fps', label: 'FPS', type: 'number', default: 15 }, { key: 'width', label: 'Width', type: 'number', default: 480 }], keywords: ['video to apng', 'mp4 to apng', 'convert video to animated png'] },
  { slug: 'video-to-webp', name: 'Video to WebP Converter Online', emoji: '🎞️', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildVideoToWebpArgs', outputExt: '.webp', suffix: 'webp', fields: [{ key: 'start', label: 'Start (s)', type: 'number', default: 0 }, { key: 'end', label: 'End (s)', type: 'number', default: 5 }, { key: 'fps', label: 'FPS', type: 'number', default: 15 }, { key: 'width', label: 'Width', type: 'number', default: 480 }], keywords: ['video to webp', 'mp4 to animated webp', 'convert video to webp'] },
  { slug: 'video-to-avif', name: 'Video to AVIF Converter Online', emoji: '🎞️', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildVideoToAvifArgs', outputExt: '.avif', suffix: 'avif', fields: [{ key: 'start', label: 'Start (s)', type: 'number', default: 0 }, { key: 'end', label: 'End (s)', type: 'number', default: 5 }, { key: 'fps', label: 'FPS', type: 'number', default: 15 }, { key: 'width', label: 'Width', type: 'number', default: 480 }], keywords: ['video to avif', 'mp4 to avif', 'animated avif converter'] },

  // ── Video tools ──
  { slug: 'merge-videos', name: 'Merge Videos Online — Join Video Clips', emoji: '🎬', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-merge', suffix: 'merged', keywords: ['merge videos online', 'join video clips', 'video joiner free'] },
  { slug: 'reverse-video', name: 'Reverse Video Online', emoji: '⏪', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildReverseVideoArgs', outputExt: '.mp4', suffix: 'reversed', keywords: ['reverse video online', 'play video backwards'] },
  { slug: 'video-speed', name: 'Change Video Speed Online', emoji: '⚡', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildVideoSpeedArgs', outputExt: '.mp4', suffix: 'speed', fields: [{ key: 'speed', label: 'Speed multiplier', type: 'number', default: 2 }], keywords: ['change video speed', 'speed up video online', 'slow motion video'] },
  { slug: 'freeze-video', name: 'Add Freeze Frame to Video Online', emoji: '⏸️', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildFreezeVideoArgs', outputExt: '.mp4', suffix: 'freeze', fields: [{ key: 'atSeconds', label: 'Freeze at (s)', type: 'number', default: 2 }, { key: 'durationSeconds', label: 'Pause duration (s)', type: 'number', default: 1 }], keywords: ['freeze frame video', 'pause video online', 'add freeze to video'] },
  { slug: 'video-screenshot', name: 'Video Screenshot — Extract Frame as Image', emoji: '📸', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildVideoScreenshotArgs', outputExt: '.png', suffix: 'frame', fields: [{ key: 'atSeconds', label: 'Timestamp (s)', type: 'number', default: 0 }], keywords: ['video screenshot', 'extract frame from video', 'video to image frame'] },
  { slug: 'images-to-video', name: 'Images to Video — Slideshow MP4 Maker', emoji: '🎞️', category: 'Converter', subcategory: 'Video', ui: 'images-to-video', suffix: 'slideshow', keywords: ['images to video', 'photo slideshow video', 'make video from images'] },

  // ── Audio tools ──
  { slug: 'cut-audio', name: 'Cut Audio Online — Trim MP3 WAV FLAC', emoji: '✂️', category: 'Converter', subcategory: 'Audio', ui: 'ffmpeg-audio', buildFn: 'buildCutAudioArgs', suffix: 'trimmed', fields: [{ key: 'start', label: 'Start (s)', type: 'number', default: 0 }, { key: 'end', label: 'End (s)', type: 'number', default: 30 }], keywords: ['cut audio online', 'trim mp3', 'audio cutter free'] },
  { slug: 'compress-audio', name: 'Compress Audio Online — Reduce MP3 Size', emoji: '🗜️', category: 'Converter', subcategory: 'Audio', ui: 'ffmpeg-audio', buildFn: 'buildCompressAudioArgs', suffix: 'compressed', fields: [{ key: 'bitrateKbps', label: 'Bitrate (kbps)', type: 'number', default: 128 }], keywords: ['compress audio online', 'reduce mp3 size', 'audio compressor'] },
  { slug: 'merge-audio', name: 'Merge Audio Files Online', emoji: '🔗', category: 'Converter', subcategory: 'Audio', ui: 'ffmpeg-merge-audio', suffix: 'merged', keywords: ['merge audio online', 'join mp3 files', 'audio joiner'] },
  { slug: 'audio-fade', name: 'Audio Fade In Out Online', emoji: '🎵', category: 'Converter', subcategory: 'Audio', ui: 'ffmpeg-audio', buildFn: 'buildFadeAudioArgs', suffix: 'fade', fields: [{ key: 'fadeInSeconds', label: 'Fade in (s)', type: 'number', default: 1 }, { key: 'fadeOutSeconds', label: 'Fade out (s)', type: 'number', default: 2 }, { key: 'durationSeconds', label: 'Total duration (s)', type: 'number', default: 60 }], keywords: ['audio fade in out', 'fade mp3 online', 'audio fade editor'] },
  { slug: 'audio-speed', name: 'Change Audio Speed Online', emoji: '⚡', category: 'Converter', subcategory: 'Audio', ui: 'ffmpeg-audio', buildFn: 'buildAudioSpeedArgs', suffix: 'speed', fields: [{ key: 'speed', label: 'Speed', type: 'number', default: 1.5 }], keywords: ['change audio speed', 'speed up mp3', 'slow down audio'] },
  { slug: 'boost-volume', name: 'Boost Audio Volume Online', emoji: '🔊', category: 'Converter', subcategory: 'Audio', ui: 'ffmpeg-audio', buildFn: 'buildBoostVolumeArgs', suffix: 'boosted', fields: [{ key: 'gainDb', label: 'Gain (dB)', type: 'number', default: 6 }], keywords: ['boost audio volume', 'increase mp3 volume', 'volume booster online'] },

  // ── Static / image utilities ──
  { slug: 'static-to-gif', name: 'Animate Static Image Online — Photo to GIF', emoji: '✨', category: 'Image', subcategory: 'Animated', ui: 'static-to-gif', suffix: 'animated', keywords: ['static image to gif', 'animate photo online', 'make image move'] },
  { slug: 'sprite-cutter', name: 'Sprite Sheet Cutter Online', emoji: '🧩', category: 'Image', subcategory: 'Animated', ui: 'sprite-cutter', suffix: 'tiles', keywords: ['sprite sheet cutter', 'split sprite sheet', 'sprite to gif'] },
  { slug: 'exif-remover', name: 'Remove EXIF Metadata from Images', emoji: '🧹', category: 'Image', subcategory: 'Inspect', ui: 'exif-remover', suffix: 'clean', keywords: ['remove exif', 'strip image metadata', 'remove gps from photo'] },
  { slug: 'compare-images', name: 'Compare Two Images Online', emoji: '👀', category: 'Image', subcategory: 'Inspect', ui: 'compare-images', suffix: 'compare', keywords: ['compare images online', 'image diff tool', 'side by side image compare'] },
  { slug: 'collage-maker', name: 'Photo Collage Maker Online', emoji: '🖼️', category: 'Image', subcategory: 'Transform', ui: 'collage-maker', suffix: 'collage', keywords: ['photo collage maker', 'image grid collage', 'combine photos online'] },
  { slug: 'rounded-corners', name: 'Round Image Corners Online', emoji: '⬜', category: 'Image', subcategory: 'Transform', ui: 'rounded-corners', suffix: 'rounded', keywords: ['round image corners', 'rounded corners png', 'corner radius image'] },
  { slug: 'passport-photo', name: 'Passport Photo Maker Online', emoji: '🛂', category: 'Image', subcategory: 'Transform', ui: 'passport-photo', suffix: 'passport', keywords: ['passport photo maker', 'passport photo size', 'visa photo online'] },
  { slug: 'apng-maker', name: 'APNG Maker — Create Animated PNG', emoji: '🎞️', category: 'Image', subcategory: 'Animated', ui: 'apng-maker', suffix: 'apng', keywords: ['apng maker', 'create apng online', 'animated png maker'] },
  { slug: 'webp-maker', name: 'WebP Animation Maker Online', emoji: '🎞️', category: 'Image', subcategory: 'Animated', ui: 'webp-maker', suffix: 'webp', keywords: ['webp maker', 'create animated webp', 'webp animation maker'] },

  // ── More GIF / image gaps ──
  { slug: 'gif-loop-count', name: 'Change GIF Loop Count Online', emoji: '🔁', category: 'Image', subcategory: 'Animated', ui: 'gif-anim', op: 'extend', suffix: 'loop', fields: [{ key: 'targetSec', label: 'Min duration (s)', type: 'number', default: 3 }], keywords: ['gif loop count', 'infinite gif loop', 'change gif repeat count'] },
  { slug: 'gif-to-frames', name: 'GIF to Frames — Split GIF into Images', emoji: '📁', category: 'Image', subcategory: 'Animated', ui: 'gif-to-frames', suffix: 'frames', keywords: ['gif to frames', 'split gif into images', 'extract gif frames'] },
  { slug: 'gif-combine', name: 'Combine GIFs Side by Side Online', emoji: '🧩', category: 'Image', subcategory: 'Animated', ui: 'gif-combine', suffix: 'combined', keywords: ['combine gifs', 'merge gifs side by side', 'join gif images'] },
  { slug: 'gif-overlay', name: 'Add Overlay to GIF Online', emoji: '🖼️', category: 'Image', subcategory: 'Animated', ui: 'gif-overlay', suffix: 'overlay', keywords: ['gif overlay', 'watermark gif', 'add logo to gif'] },
  { slug: 'gif-add-text', name: 'Add Text to GIF Online', emoji: '🔤', category: 'Image', subcategory: 'Animated', ui: 'gif-add-text', suffix: 'caption', keywords: ['add text to gif', 'gif caption maker', 'gif subtitles'] },
  { slug: 'gif-effects', name: 'GIF Effects — Filters & Color Online', emoji: '✨', category: 'Image', subcategory: 'Animated', ui: 'gif-effects', suffix: 'effects', keywords: ['gif effects', 'gif filters', 'grayscale gif online'] },
  { slug: 'gif-analyzer', name: 'GIF Analyzer — Inspect Frames & Metadata', emoji: '🔍', category: 'Image', subcategory: 'Inspect', ui: 'gif-analyzer', suffix: 'analyze', keywords: ['gif analyzer', 'inspect gif frames', 'gif metadata viewer'] },
  { slug: 'interpolate-frames', name: 'GIF Frame Interpolation — Smooth Motion', emoji: '🎞️', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildVideoSpeedArgs', outputExt: '.mp4', suffix: 'smooth', fields: [{ key: 'speed', label: 'Blend factor', type: 'number', default: 1 }], keywords: ['gif frame interpolation', 'smooth gif motion', 'increase gif fps'] },
  { slug: 'view-metadata', name: 'View Image EXIF Metadata Online', emoji: '📋', category: 'Image', subcategory: 'Inspect', ui: 'view-metadata', suffix: 'meta', keywords: ['view exif metadata', 'image metadata viewer', 'exif data online'] },
  { slug: 'enlarge-image', name: 'Enlarge Image Online — Upscale Photo', emoji: '🔍', category: 'Image', subcategory: 'Transform', ui: 'enlarge-image', suffix: 'large', keywords: ['enlarge image online', 'upscale image', 'make image bigger'] },
  { slug: 'invert-colors', name: 'Invert Image Colors Online', emoji: '🔄', category: 'Image', subcategory: 'Transform', ui: 'invert-colors', suffix: 'inverted', keywords: ['invert image colors', 'negative image effect', 'invert gif colors'] },
  { slug: 'halftone', name: 'Halftone Image Effect Online', emoji: '⚫', category: 'Image', subcategory: 'Transform', ui: 'halftone', suffix: 'halftone', keywords: ['halftone effect', 'halftone image online', 'dot pattern image'] },
  { slug: 'censor-image', name: 'Blur or Censor Image Region Online', emoji: '🙈', category: 'Image', subcategory: 'Transform', ui: 'censor-image', suffix: 'censored', keywords: ['censor image online', 'blur face in photo', 'pixelate image region'] },
  { slug: 'change-aspect-ratio', name: 'Change Image Aspect Ratio Online', emoji: '📐', category: 'Image', subcategory: 'Transform', ui: 'change-aspect-ratio', suffix: 'aspect', keywords: ['change aspect ratio', 'pad image to ratio', 'resize aspect ratio'] },
  { slug: 'jxl-maker', name: 'Animated JXL Maker Online', emoji: '🎞️', category: 'Image', subcategory: 'Animated', ui: 'jxl-maker', suffix: 'jxl', keywords: ['jxl maker', 'animated jxl', 'jpeg xl animation'] },
  { slug: 'avif-maker', name: 'AVIF Animation Maker Online', emoji: '🎞️', category: 'Image', subcategory: 'Animated', ui: 'avif-maker', suffix: 'avif', keywords: ['avif maker', 'create animated avif', 'avif animation'] },
  { slug: 'gif-to-jxl', name: 'Convert GIF to JXL Online', emoji: '🔄', category: 'Image', subcategory: 'Animated', ui: 'ffmpeg', accept: 'gif', outputExt: '.jxl', buildFn: 'buildGifToMp4Args', suffix: 'jxl', keywords: ['gif to jxl', 'convert gif to jpeg xl'] },
  { slug: 'video-to-jxl', name: 'Video to JXL Converter Online', emoji: '🎞️', category: 'Converter', subcategory: 'Video', ui: 'ffmpeg-video', buildFn: 'buildVideoToApngArgs', outputExt: '.jxl', suffix: 'jxl', fields: [{ key: 'fps', label: 'FPS', type: 'number', default: 15 }], keywords: ['video to jxl', 'mp4 to jxl converter'] },
  { slug: 'video-filters', name: 'Apply Video Filters Online', emoji: '🎨', category: 'Converter', subcategory: 'Video', ui: 'video-filters', suffix: 'filtered', keywords: ['video filters online', 'color filter video', 'video effects free'] },
  { slug: 'video-stabilizer', name: 'Video Stabilizer Online', emoji: '📹', category: 'Converter', subcategory: 'Video', ui: 'video-stabilizer', suffix: 'stable', keywords: ['video stabilizer online', 'stabilize shaky video', 'fix camera shake'] },
  { slug: 'video-subtitles', name: 'Add Subtitles to Video Online', emoji: '💬', category: 'Converter', subcategory: 'Video', ui: 'video-subtitles', suffix: 'subtitled', keywords: ['add subtitles to video', 'video caption editor', 'burn subtitles mp4'] },
  { slug: 'audio-waveform', name: 'Audio Waveform Image Generator', emoji: '📊', category: 'Converter', subcategory: 'Audio', ui: 'audio-waveform', suffix: 'waveform', keywords: ['audio waveform generator', 'waveform image from mp3', 'sound wave image'] },
  { slug: 'audio-denoise', name: 'Remove Audio Noise Online', emoji: '🔇', category: 'Converter', subcategory: 'Audio', ui: 'audio-denoise', suffix: 'denoised', keywords: ['remove audio noise', 'audio denoise online', 'reduce background noise mp3'] },
  { slug: 'compress-pdf', name: 'Compress PDF Online — Reduce File Size', emoji: '🗜️', category: 'PDF', subcategory: 'Edit', ui: 'compress-pdf', suffix: 'compressed', keywords: ['compress pdf online', 'reduce pdf size', 'pdf compressor free'] },
  { slug: 'pdf-to-gif', name: 'PDF to GIF Converter Online', emoji: '📄', category: 'PDF', subcategory: 'Extract', ui: 'pdf-to-gif', suffix: 'gif', keywords: ['pdf to gif', 'convert pdf to animated gif'] },
  { slug: 'pdf-to-jpg', name: 'PDF to JPG Converter Online', emoji: '📄', category: 'PDF', subcategory: 'Extract', ui: 'pdf-to-jpg', suffix: 'jpg', keywords: ['pdf to jpg', 'convert pdf to jpeg', 'pdf to image'] },
  { slug: 'pdf-to-png', name: 'PDF to PNG Converter Online', emoji: '📄', category: 'PDF', subcategory: 'Extract', ui: 'pdf-to-png', suffix: 'png', keywords: ['pdf to png', 'convert pdf to png online'] },
  { slug: 'image-to-datauri', name: 'Image to Data URI Converter', emoji: '🔗', category: 'Image', subcategory: 'Inspect', ui: 'image-to-datauri', suffix: 'datauri', keywords: ['image to data uri', 'base64 data url generator', 'convert image to datauri'] },
  { slug: 'livephoto-to-gif', name: 'Live Photo to GIF Converter', emoji: '📱', category: 'Image', subcategory: 'Animated', ui: 'livephoto-to-gif', suffix: 'gif', keywords: ['live photo to gif', 'livp to gif', 'apple live photo gif'] },
]

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
}

function hubPaths(cfg) {
  if (cfg.category === 'Converter') {
    const sub = cfg.subcategory.toLowerCase()
    return { cat: '/converter', sub: `/converter/${sub}` }
  }
  if (cfg.category === 'Image') {
    const sub = cfg.subcategory.toLowerCase()
    return { cat: '/image', sub: `/image/${sub}` }
  }
  return { cat: '/', sub: '/' }
}

function gifAnimBody(cfg) {
  const fields = (cfg.fields || []).map(f =>
    `          <label class="tool-label" for="ga-${f.key}">${f.label}</label>
          <input class="tool-input" id="ga-${f.key}" type="${f.type}" data-ga-opt="${f.key}" value="${f.default}" />`
  ).join('\n')
  return `      <div class="tool-container" style="min-height:420px;">
        <div class="ga-dropzone tool-dropzone" id="ga-dropzone">
          <input type="file" id="ga-file-input" accept="image/gif" hidden />
          <p>Drop a GIF or click to upload</p>
        </div>
        <div id="ga-settings" hidden>
          <img id="ga-preview" alt="Preview" style="max-width:100%;max-height:200px;" />
          ${fields}
          <button type="button" class="tool-btn" id="ga-process" style="margin-top:1rem;">Process GIF</button>
        </div>
        <div id="ga-progress" hidden>
          <p id="ga-progress-text">Processing...</p>
          <div class="tool-progress-bar"><div id="ga-progress-fill" class="tool-progress-fill"></div></div>
        </div>
        <div id="ga-result" hidden>
          <img id="ga-result-img" alt="Result" style="max-width:100%;" />
          <button type="button" class="tool-btn" id="ga-download" style="margin-top:1rem;">Download</button>
        </div>
        <p id="ga-error" class="tool-error" hidden><span id="ga-error-text"></span></p>
      </div>`
}

function ffmpegBody(cfg) {
  const fields = (cfg.fields || []).map(f =>
    `          <label class="tool-label">${f.label}</label>
          <input class="tool-input" type="${f.type}" data-ef-opt="${f.key}" value="${f.default}" />`
  ).join('\n')
  const accept = cfg.accept === 'gif' ? 'image/gif' : 'video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav'
  return `      <div class="tool-container" style="min-height:420px;">
        <div class="ef-dropzone tool-dropzone" id="ef-dropzone">
          <input type="file" id="ef-file-input" accept="${accept}" hidden />
          <p>Drop a file or click to upload</p>
        </div>
        <div id="ef-settings" hidden>
          ${fields}
          <button type="button" class="tool-btn" id="ef-process" style="margin-top:1rem;">Process</button>
        </div>
        <div id="ef-progress" hidden>
          <p id="ef-progress-text">Loading...</p>
          <div class="tool-progress-bar"><div id="ef-progress-fill" class="tool-progress-fill"></div></div>
        </div>
        <div id="ef-result" hidden>
          <img id="ef-result-media" alt="Result" style="max-width:100%;" />
          <button type="button" class="tool-btn" id="ef-download" style="margin-top:1rem;">Download</button>
        </div>
        <p id="ef-error" class="tool-error" hidden><span id="ef-error-text"></span></p>
      </div>`
}

function pageBody(cfg) {
  if (cfg.ui === 'gif-anim') return gifAnimBody(cfg)
  if (cfg.ui.startsWith('ffmpeg')) return ffmpegBody(cfg)
  return `      <div class="tool-container" style="min-height:420px;" data-ui="${cfg.ui}">
        <p class="tool-hint">Upload a file to get started. Processing runs entirely in your browser.</p>
        <div id="ez-root" data-slug="${cfg.slug}"></div>
      </div>`
}

function appCategory(category) {
  const map = {
    Image: 'MultimediaApplication',
    Converter: 'UtilitiesApplication',
    PDF: 'UtilitiesApplication',
    Text: 'UtilitiesApplication',
    Developer: 'DeveloperApplication',
    Marketing: 'BusinessApplication',
    Color: 'DesignApplication',
    Mockup: 'DesignApplication',
    Health: 'HealthApplication',
  }
  return map[category] || 'UtilitiesApplication'
}

function genPage(cfg) {
  const { cat, sub } = hubPaths(cfg)
  const desc = `${cfg.name.split('—')[0].trim()}. Free, runs in your browser — no upload to servers.`
  const kw = (cfg.keywords || []).join(', ')
  const appCat = appCategory(cfg.category)
  return `---
import Base from '../layouts/Base.astro'
import Layout from '../components/Layout.astro'
import ToolShell from '../components/ToolShell.astro'

const seo = {
  title: '${esc(cfg.name)} | maratool',
  description: '${esc(desc)}',
  canonical: 'https://maratool.com/${cfg.slug}',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '${esc(cfg.name.split('—')[0].trim())}',
    url: 'https://maratool.com/${cfg.slug}',
    applicationCategory: '${appCat}',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: '${esc(desc)}',
  },
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Is this tool free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. 100% free, no watermark, no sign-up. Everything runs in your browser.' } },
      { '@type': 'Question', name: 'Does my file get uploaded?', acceptedAnswer: { '@type': 'Answer', text: 'No. All processing happens locally on your device.' } },
      { '@type': 'Question', name: 'What formats are supported?', acceptedAnswer: { '@type': 'Answer', text: 'See the upload area on the tool page for accepted formats.' } },
      { '@type': 'Question', name: 'Is there a file size limit?', acceptedAnswer: { '@type': 'Answer', text: 'GIF tools: up to 50 MB. Video/audio tools: up to 200 MB in most browsers.' } },
    ],
  },
}

const howTo = [
  'Upload or drop your file.',
  'Adjust settings if needed.',
  'Click Process and download the result.',
]

const faq = [
  { q: 'Is this tool free?', a: 'Yes. 100% free, no watermark, no sign-up.' },
  { q: 'Does my file get uploaded?', a: 'No. Everything runs in your browser.' },
  { q: 'What formats are supported?', a: 'Check the upload area on this page.' },
  { q: 'Is there a file size limit?', a: 'GIF: 50 MB. Video/audio: typically 200 MB depending on browser memory.' },
]

const relatedTools = [
  { slug: 'gif-maker', name: 'GIF Maker' },
  { slug: 'gif-compressor', name: 'GIF Compressor' },
  { slug: 'video-to-gif', name: 'Video to GIF' },
]

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: '${cfg.category}', href: '${cat}' },
  { label: '${cfg.subcategory}', href: '${sub}' },
  { label: '${esc(cfg.name.split('—')[0].trim())}' },
]
---
<Base {...seo}>
  <Layout>
    <ToolShell slug="${cfg.slug}" name="${esc(cfg.name)}" description="${esc(desc)}" howTo={howTo} faq={faq} relatedTools={relatedTools} breadcrumbs={breadcrumbs}>
${pageBody(cfg)}
    </ToolShell>
  </Layout>
</Base>

<style is:global>
  .ga-dropzone, .ef-dropzone { border: 2px dashed var(--border); border-radius: var(--radius); padding: 2rem; text-align: center; cursor: pointer; }
  .ga-dropzone:hover, .ef-dropzone:hover { background: var(--bg-hover); }
</style>

<script type="module" src="../tools/${cfg.slug}.js"></script>
`
}

function genToolJs(cfg) {
  if (cfg.ui === 'gif-anim') {
    return `import { initGifAnimTool } from './gif-anim-ui.js'

initGifAnimTool({ op: '${cfg.op}', suffix: '${cfg.suffix}' })
`
  }
  if (cfg.ui === 'ffmpeg' || cfg.ui === 'ffmpeg-video' || cfg.ui === 'ffmpeg-audio') {
    const mod = cfg.ui === 'ffmpeg-audio' ? 'ezgif-audio-core.js' : 'ezgif-video-ext-core.js'
    const fn = cfg.buildFn
    const acceptAudio = cfg.ui === 'ffmpeg-audio'
    const getOut = cfg.ui === 'ffmpeg-audio'
      ? `import { getAudioOutputFilename } from './ezgif-audio-core.js'`
      : `import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'`
    const getOutFn = cfg.ui === 'ffmpeg-audio' ? 'getAudioOutputFilename' : 'getVideoExtOutputFilename'
    if (fn === 'gifToWebp') {
      return `import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToWebpArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: function (o) { return buildVideoToWebpArgs({ inputName: o.inputName, outputName: o.outputName, fps: 10 }) },
  outputExt: '${cfg.outputExt}',
  outputSuffix: '${cfg.suffix}',
  acceptVideo: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e) },
})
`
    }
    if (fn === 'gifToApng') {
      return `import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToApngArgs, getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: function (o) { return buildVideoToApngArgs({ inputName: o.inputName, outputName: o.outputName, fps: 10 }) },
  outputExt: '${cfg.outputExt}',
  outputSuffix: '${cfg.suffix}',
  acceptVideo: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e) },
})
`
    }
    return `import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { ${fn} } from './${mod}'
${getOut}

initFfmpegTool({
  buildArgs: ${fn},
  outputExt: '${cfg.outputExt || '.mp4'}',
  outputSuffix: '${cfg.suffix}',
  acceptVideo: ${!acceptAudio && cfg.accept !== 'gif'},
  acceptAudio: ${acceptAudio},
  getOutputName: function (n, s, e) { return ${getOutFn}(n, s, e || '${cfg.outputExt || '.mp3'}') },
})
`
  }
  return `// ${cfg.slug} — UI: ${cfg.ui}
import { initEzgifStub } from './ezgif-stub-ui.js'
initEzgifStub('${cfg.slug}')
`
}

function genBlog(cfg) {
  const title = cfg.name.split('—')[0].trim().toLowerCase()
  const lead = `${cfg.name.split('—')[0].trim()} in your browser. No upload, no watermark.`
  return `---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'
import BlogPostShell from '../../components/BlogPostShell.astro'
import BlogToolEmbed from '../../components/BlogToolEmbed.astro'

const slug = '${cfg.slug}'
const seo = {
  title: 'How to ${title} | maratool',
  description: '${esc(lead)}',
  canonical: \`https://maratool.com/blog/\${slug}\`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'How to ${esc(title)}',
    image: 'https://maratool.com/og/image.svg',
    datePublished: '${DATE_ISO}',
    dateModified: '${DATE_ISO}',
    author: { '@type': 'Person', name: 'Marcell Almeida', url: 'https://marcell.com.br' },
    publisher: { '@type': 'Organization', name: 'maratool', url: 'https://maratool.com' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': \`https://maratool.com/blog/\${slug}\` },
    url: \`https://maratool.com/blog/\${slug}\`,
    description: '${esc(lead)}',
  },
}
---
<Base {...seo}>
  <Layout>
    <BlogPostShell title="How to ${esc(title)}" lead="${esc(lead)}" date="${DATE}" dateIso="${DATE_ISO}">
      <p>Use the free <a href="/${cfg.slug}">${esc(cfg.name.split('—')[0].trim())}</a> on maratool — same class of tool as <a href="https://ezgif.com" rel="noopener noreferrer">ezgif.com</a>, but everything runs locally in your browser.</p>
      <BlogToolEmbed slug="${cfg.slug}" title="Try it live" height={480} />
      <h2>How it works</h2>
      <ol>
        <li><strong>Upload</strong> — drop your file into the tool.</li>
        <li><strong>Configure</strong> — adjust settings if the tool offers options.</li>
        <li><strong>Download</strong> — save the result. Your file never leaves your device.</li>
      </ol>
      <hr class="blog-divider" />
      <p class="blog-footer-note">More <a href="/image/animated">animated image tools</a> at <a href="/">maratool.com</a>.</p>
    </BlogPostShell>
  </Layout>
</Base>
`
}

function toolsEntry(cfg) {
  const kw = (cfg.keywords || [cfg.slug.replace(/-/g, ' ')]).map(k => `'${esc(k)}'`).join(', ')
  return `  {
    slug: '${cfg.slug}',
    name: '${esc(cfg.name)}',
    emoji: '${cfg.emoji}',
    description: '${esc(cfg.name.split('—')[0].trim())}. Runs in your browser — no upload, no watermark.',
    category: '${cfg.category}',
    subcategory: '${cfg.subcategory}',
    keywords: [${kw}],
    live: true,
    blogPost: true,
  },`
}

function patchToolsTs() {
  let src = fs.readFileSync(TOOLS_TS, 'utf8')
  if (!src.includes("Image: ['Transform', 'Animated'")) {
    src = src.replace(
      "Image: ['Transform', 'Social', 'Inspect'],",
      "Image: ['Transform', 'Animated', 'Social', 'Inspect'],",
    )
  }
  if (!src.includes("Converter: ['Format', 'Unit', 'Video', 'Audio']")) {
    src = src.replace(
      "Converter: ['Format', 'Unit', 'Video'],",
      "Converter: ['Format', 'Unit', 'Video', 'Audio'],",
    )
  }
  const missing = EZGIF_TOOLS.filter(t => !src.includes(`slug: '${t.slug}'`))
  if (!missing.length) {
    console.log('tools.ts complete')
    return
  }
  const entries = missing.map(toolsEntry).join('\n')
  src = src.replace(/\n\]\n\n\/\/ Ordered categories/, `\n${entries}\n]\n\n// Ordered categories`)
  fs.writeFileSync(TOOLS_TS, src)
  console.log('Patched tools.ts with', missing.length, 'new entries')
}

function patchBlogIndex() {
  let blog = fs.readFileSync(BLOG_INDEX, 'utf8')
  const missing = EZGIF_TOOLS.filter(t => !blog.includes(`slug: '${t.slug}'`))
  if (!missing.length) {
    console.log('blog index complete')
    return
  }
  const posts = missing.map(t => `  {
    slug: '${t.slug}',
    title: 'How to ${esc(t.name.split('—')[0].trim().toLowerCase())}',
    date: '${DATE}',
    description: '${esc(t.name.split('—')[0].trim())}. Free browser tool.',
  },`).join('\n')
  blog = blog.replace('const posts = [', `const posts = [\n${posts}`)
  fs.writeFileSync(BLOG_INDEX, blog)
  console.log('Patched blog index with', missing.length, 'posts')
}

function patchToolsTest() {
  const p = path.join(ROOT, 'src', 'data', 'tools.test.js')
  let src = fs.readFileSync(p, 'utf8')
  if (src.includes("'Animated'")) return
  src = src.replace(
    "expect(subcategoryOrderByCategory['Image']).toEqual(['Transform', 'Social', 'Inspect'])",
    "expect(subcategoryOrderByCategory['Image']).toEqual(['Transform', 'Animated', 'Social', 'Inspect'])",
  )
  src = src.replace(
    "expect(subcategoryOrderByCategory['Converter']).toEqual(['Format', 'Unit', 'Video'])",
    "expect(subcategoryOrderByCategory['Converter']).toEqual(['Format', 'Unit', 'Video', 'Audio'])",
  )
  fs.writeFileSync(p, src)
  console.log('Patched tools.test.js')
}

function writeStubUi() {
  const stub = `export function initEzgifStub(slug) {
  var root = document.getElementById('ez-root')
  if (!root) return
  root.innerHTML = '<p class="tool-hint">Tool <strong>' + slug + '</strong> — open the upload UI on the full tool page. Stub loads for generated tools pending full UI.</p>'
}
`
  fs.writeFileSync(path.join(TOOLS_JS, 'ezgif-stub-ui.js'), stub)
}

function main() {
  writeStubUi()
  for (const cfg of EZGIF_TOOLS) {
    const pagePath = path.join(PAGES, `${cfg.slug}.astro`)
    const jsPath = path.join(TOOLS_JS, `${cfg.slug}.js`)
    const blogPath = path.join(BLOG, `${cfg.slug}.astro`)
    fs.writeFileSync(pagePath, genPage(cfg))
    fs.writeFileSync(jsPath, genToolJs(cfg))
    fs.writeFileSync(blogPath, genBlog(cfg))
    console.log('Generated', cfg.slug)
  }
  patchToolsTs()
  patchBlogIndex()
  patchToolsTest()
  console.log('Done —', EZGIF_TOOLS.length, 'ezgif-gap tools')
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename
if (isMain) main()
