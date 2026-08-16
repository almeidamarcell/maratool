import { describe, it, expect } from 'vitest'
import {
  buildVideoToApngArgs,
  buildVideoToWebpArgs,
  buildVideoToAvifArgs,
  buildGifToMp4Args,
  buildMergeVideosArgs,
  buildReverseVideoArgs,
  buildVideoSpeedArgs,
  buildFreezeVideoArgs,
  buildVideoScreenshotArgs,
  buildImagesToVideoArgs,
  buildVideoFiltersArgs,
  buildVideoStabilizerArgs,
  buildSubtitlesArgs,
  buildInterpolateArgs,
  buildAnimatedToGifArgs,
  buildInterpolateFilter,
  buildInterpolateGifArgs,
  buildInterpolateGifPaletteArgs,
  buildEqFilterString,
  normalizeVideoFilterOptions,
  getVideoFilterPreset,
  isVideoFilterIdentity,
  isGifFile,
  clampInterpolateFps,
  getVideoExtOutputFilename,
  validateFps,
  VIDEO_FILTER_DEFAULTS,
} from './ezgif-video-ext-core.js'

describe('buildVideoToApngArgs', () => {
  it('trims, scales, and muxes to apng', () => {
    expect(buildVideoToApngArgs({
      inputName: 'in.mp4',
      outputName: 'out.apng',
      start: 1,
      end: 5,
      fps: 15,
      width: 480,
    })).toEqual([
      '-ss', '1',
      '-to', '5',
      '-i', 'in.mp4',
      '-vf', 'fps=15,scale=480:-1:flags=lanczos',
      '-f', 'apng',
      '-plays', '0',
      '-y', 'out.apng',
    ])
  })
})

describe('buildVideoToWebpArgs', () => {
  it('outputs animated webp', () => {
    const args = buildVideoToWebpArgs({ inputName: 'in.mp4', outputName: 'out.webp', fps: 10 })
    expect(args).toContain('-f')
    expect(args[args.indexOf('-f') + 1]).toBe('webp')
    expect(args).toContain('-loop')
  })
})

describe('buildGifToMp4Args', () => {
  it('converts gif to h264 mp4', () => {
    const args = buildGifToMp4Args({ inputName: 'in.gif', outputName: 'out.mp4' })
    expect(args).toContain('-i')
    expect(args).toContain('in.gif')
    expect(args).toContain('-c:v')
    expect(args[args.indexOf('-c:v') + 1]).toBe('libx264')
  })
})

describe('buildMergeVideosArgs', () => {
  it('builds concat demuxer file list args', () => {
    expect(buildMergeVideosArgs({
      listFile: 'list.txt',
      outputName: 'merged.mp4',
    })).toEqual([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'list.txt',
      '-c', 'copy',
      '-y', 'merged.mp4',
    ])
  })
})

describe('buildReverseVideoArgs', () => {
  it('reverses video and audio', () => {
    const args = buildReverseVideoArgs({ inputName: 'in.mp4', outputName: 'out.mp4' })
    expect(args.join(' ')).toContain('reverse')
  })
})

describe('buildVideoSpeedArgs', () => {
  it('speeds up video with setpts and atempo', () => {
    const args = buildVideoSpeedArgs({ inputName: 'in.mp4', outputName: 'out.mp4', speed: 2 })
    expect(args.join(' ')).toContain('setpts')
    expect(args.join(' ')).toContain('atempo')
  })
})

describe('buildFreezeVideoArgs', () => {
  it('inserts tpause filter at timestamp', () => {
    const args = buildFreezeVideoArgs({
      inputName: 'in.mp4',
      outputName: 'out.mp4',
      atSeconds: 2,
      durationSeconds: 1,
    })
    expect(args.join(' ')).toContain('tpad')
  })
})

describe('buildVideoScreenshotArgs', () => {
  it('extracts single frame as png', () => {
    expect(buildVideoScreenshotArgs({
      inputName: 'in.mp4',
      outputName: 'frame.png',
      atSeconds: 3.5,
    })).toEqual([
      '-ss', '3.5',
      '-i', 'in.mp4',
      '-frames:v', '1',
      '-y', 'frame.png',
    ])
  })
})

describe('buildImagesToVideoArgs', () => {
  it('builds slideshow from numbered pattern', () => {
    const args = buildImagesToVideoArgs({
      pattern: 'frame%03d.png',
      outputName: 'out.mp4',
      fps: 2,
    })
    expect(args).toContain('-framerate')
    expect(args).toContain('2')
    expect(args).toContain('frame%03d.png')
  })
})

describe('validateFps', () => {
  it('accepts 1-60 fps', () => {
    expect(validateFps(15).valid).toBe(true)
    expect(validateFps(0).valid).toBe(false)
    expect(validateFps(120).valid).toBe(false)
  })
})

describe('buildVideoFiltersArgs', () => {
  it('applies video filter', () => {
    const args = buildVideoFiltersArgs({ inputName: 'in.mp4', outputName: 'out.mp4', filter: 'hue=s=0' })
    expect(args.join(' ')).toContain('hue=s=0')
  })
})

describe('buildVideoStabilizerArgs', () => {
  it('uses deshake filter', () => {
    expect(buildVideoStabilizerArgs({ inputName: 'in.mp4', outputName: 'out.mp4' }).join(' ')).toContain('deshake')
  })
})

describe('buildSubtitlesArgs', () => {
  it('leaves the plain form untouched', () => {
    expect(buildSubtitlesArgs({ inputName: 'in.mp4', outputName: 'out.mp4', subtitlesFile: 'subs.srt' })).toEqual([
      '-i', 'in.mp4',
      '-vf', 'subtitles=subs.srt',
      '-c:v', 'libx264',
      '-c:a', 'copy',
      '-y', 'out.mp4',
    ])
  })

  it('points libass at a fonts directory and a style when given', () => {
    // Without fontsdir + a named face the wasm build has no font at all: it
    // exits 0 and burns in nothing.
    const args = buildSubtitlesArgs({
      inputName: 'in.mp4',
      outputName: 'out.mp4',
      subtitlesFile: 'subs.srt',
      fontsDir: '.',
      style: 'FontName=DejaVu Sans,FontSize=24',
    })
    expect(args[args.indexOf('-vf') + 1])
      .toBe("subtitles=subs.srt:fontsdir=.:force_style='FontName=DejaVu Sans,FontSize=24'")
  })
})

describe('buildInterpolateArgs', () => {
  it('uses minterpolate for higher fps', () => {
    expect(buildInterpolateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', fps: 30 }).join(' ')).toContain('minterpolate')
  })

  it('leaves mi_mode alone by default so the motion-compensated mode stays the default', () => {
    expect(buildInterpolateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', fps: 30 })).toEqual([
      '-i', 'in.mp4',
      '-vf', 'minterpolate=fps=30',
      '-c:v', 'libx264',
      '-c:a', 'copy',
      '-y', 'out.mp4',
    ])
  })

  it('switches to blend when asked', () => {
    expect(buildInterpolateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', fps: 48, method: 'blend' }).join(' '))
      .toContain('minterpolate=fps=48:mi_mode=blend')
  })
})

describe('clampInterpolateFps', () => {
  it('keeps the target inside the range minterpolate is useful in', () => {
    expect(clampInterpolateFps(30)).toBe(30)
    expect(clampInterpolateFps(5)).toBe(24)
    expect(clampInterpolateFps(240)).toBe(60)
    expect(clampInterpolateFps('nonsense')).toBe(30)
  })
})

describe('buildInterpolateFilter', () => {
  it('builds the same chain both GIF passes share', () => {
    expect(buildInterpolateFilter(50)).toBe('minterpolate=fps=50')
    expect(buildInterpolateFilter(50, 'blend')).toBe('minterpolate=fps=50:mi_mode=blend')
  })
})

describe('GIF interpolation passes', () => {
  it('generates a palette from the interpolated frames, not the source ones', () => {
    // Palettegen has to sit AFTER minterpolate: the in-between frames invent
    // colours the source GIF never had, and a palette built before them bands.
    const args = buildInterpolateGifPaletteArgs({ inputName: 'in.gif', paletteName: 'p.png', fps: 30 })
    expect(args).toEqual([
      '-i', 'in.gif',
      '-vf', 'minterpolate=fps=30,palettegen=stats_mode=diff',
      '-y', 'p.png',
    ])
  })

  it('encodes the GIF through the shared palette and loops forever', () => {
    const args = buildInterpolateGifArgs({ inputName: 'in.gif', paletteName: 'p.png', outputName: 'out.gif', fps: 30 })
    expect(args).toEqual([
      '-i', 'in.gif',
      '-i', 'p.png',
      '-lavfi', 'minterpolate=fps=30 [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
      '-loop', '0',
      '-y', 'out.gif',
    ])
  })

  it('carries the blend method into both passes', () => {
    expect(buildInterpolateGifPaletteArgs({ inputName: 'in.gif', paletteName: 'p.png', fps: 30, method: 'blend' }).join(' '))
      .toContain('mi_mode=blend')
    expect(buildInterpolateGifArgs({ inputName: 'in.gif', paletteName: 'p.png', outputName: 'o.gif', fps: 30, method: 'blend' }).join(' '))
      .toContain('mi_mode=blend')
  })
})

describe('isGifFile', () => {
  it('detects a GIF by MIME type or extension', () => {
    expect(isGifFile({ name: 'a.gif', type: 'image/gif' })).toBe(true)
    expect(isGifFile({ name: 'a.GIF', type: '' })).toBe(true)
    expect(isGifFile({ name: 'noextension', type: 'IMAGE/GIF' })).toBe(true)
    expect(isGifFile({ name: 'a.mp4', type: 'video/mp4' })).toBe(false)
    expect(isGifFile(null)).toBe(false)
  })
})

describe('normalizeVideoFilterOptions', () => {
  it('fills in defaults for missing values', () => {
    expect(normalizeVideoFilterOptions({})).toEqual(VIDEO_FILTER_DEFAULTS)
    expect(normalizeVideoFilterOptions()).toEqual(VIDEO_FILTER_DEFAULTS)
  })

  it('parses the strings a range input hands over', () => {
    const o = normalizeVideoFilterOptions({ brightness: '0.25', contrast: '1.5', negate: 'yes' })
    expect(o.brightness).toBe(0.25)
    expect(o.contrast).toBe(1.5)
    expect(o.negate).toBe(true)
  })

  it('clamps out-of-range and unparseable values instead of passing them to ffmpeg', () => {
    const o = normalizeVideoFilterOptions({ brightness: 9, contrast: -4, gamma: 0, blur: 100, saturation: 'abc' })
    expect(o.brightness).toBe(1)
    expect(o.contrast).toBe(0)
    expect(o.gamma).toBe(0.1)
    expect(o.blur).toBe(20)
    expect(o.saturation).toBe(1)
  })
})

describe('buildEqFilterString', () => {
  it('always emits a complete eq chain', () => {
    expect(buildEqFilterString({})).toBe('eq=brightness=0:contrast=1:saturation=1:gamma=1')
  })

  it('appends gblur only when the blur slider is off zero', () => {
    expect(buildEqFilterString({ blur: 0 })).not.toContain('gblur')
    expect(buildEqFilterString({ blur: 2.5 })).toContain('gblur=sigma=2.5')
  })

  it('appends negate last so it inverts the graded image', () => {
    expect(buildEqFilterString({ negate: true, blur: 1 }))
      .toBe('eq=brightness=0:contrast=1:saturation=1:gamma=1,gblur=sigma=1,negate')
  })

  it('rounds off float noise', () => {
    expect(buildEqFilterString({ brightness: 0.1 + 0.02 })).toContain('brightness=0.12')
  })
})

describe('getVideoFilterPreset', () => {
  it('reproduces the three presets the tool used to ship as a fixed select', () => {
    const vivid = getVideoFilterPreset('vivid')
    expect(buildEqFilterString(vivid)).toContain('brightness=0.06')
    expect(buildEqFilterString(vivid)).toContain('saturation=1.3')
    expect(buildEqFilterString(getVideoFilterPreset('grayscale'))).toContain('saturation=0')
    expect(buildEqFilterString(getVideoFilterPreset('negative'))).toContain('negate')
  })

  it('resets to the identity for an unknown name', () => {
    expect(isVideoFilterIdentity(getVideoFilterPreset('original'))).toBe(true)
    expect(isVideoFilterIdentity(getVideoFilterPreset('nope'))).toBe(true)
    expect(isVideoFilterIdentity(getVideoFilterPreset('vivid'))).toBe(false)
  })
})

describe('buildAnimatedToGifArgs', () => {
  it('converts animated format to gif with fps and scale', () => {
    const args = buildAnimatedToGifArgs({ inputName: 'in.webp', outputName: 'out.gif', fps: 10, width: 480 })
    expect(args.join(' ')).toContain('fps=10')
    expect(args.join(' ')).toContain('scale=480')
  })
})

describe('getVideoExtOutputFilename', () => {
  it('replaces extension with suffix', () => {
    expect(getVideoExtOutputFilename('clip.mp4', 'reversed', '.mp4')).toBe('clip-reversed.mp4')
    expect(getVideoExtOutputFilename('anim.gif', 'mp4', '.mp4')).toBe('anim-mp4.mp4')
  })
})
