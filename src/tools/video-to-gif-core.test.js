import { describe, it, expect } from 'vitest'
import { buildBaseFilters, buildDrawtextFilter, escapeDrawtext, buildPalettePassArgs, buildEncodePassArgs, validateGifOptions } from './video-to-gif-core.js'

describe('buildBaseFilters', () => {
  it('returns fps filter when only fps provided', () => {
    expect(buildBaseFilters({ fps: 10 })).toBe('fps=10')
  })

  it('includes lanczos scale filter when width provided', () => {
    expect(buildBaseFilters({ fps: 10, width: 320 })).toBe('fps=10,scale=320:-1:flags=lanczos')
  })

  it('prepends setpts filter for speed 2x (double speed)', () => {
    expect(buildBaseFilters({ fps: 10, speed: 2 })).toBe('setpts=0.5*PTS,fps=10')
  })

  it('prepends setpts filter for speed 0.5x (half speed)', () => {
    expect(buildBaseFilters({ fps: 15, speed: 0.5 })).toBe('setpts=2*PTS,fps=15')
  })

  it('omits setpts filter when speed is 1', () => {
    expect(buildBaseFilters({ fps: 10, speed: 1 })).toBe('fps=10')
  })

  it('omits setpts filter when speed is undefined', () => {
    expect(buildBaseFilters({ fps: 10 })).toBe('fps=10')
  })

  it('appends reverse filter when reverse is true', () => {
    expect(buildBaseFilters({ fps: 10, reverse: true })).toBe('fps=10,reverse')
  })

  it('places reverse after fps and scale', () => {
    expect(buildBaseFilters({ fps: 10, width: 320, reverse: true })).toBe('fps=10,scale=320:-1:flags=lanczos,reverse')
  })

  it('omits reverse filter when reverse is false', () => {
    expect(buildBaseFilters({ fps: 10, reverse: false })).toBe('fps=10')
  })

  it('combines speed + scale + reverse in correct order', () => {
    expect(buildBaseFilters({ fps: 10, speed: 2, width: 320, reverse: true })).toBe('setpts=0.5*PTS,fps=10,scale=320:-1:flags=lanczos,reverse')
  })
})

describe('escapeDrawtext', () => {
  it('escapes single quotes', () => {
    expect(escapeDrawtext("it's")).toBe("it\\'s")
  })

  it('escapes colons', () => {
    expect(escapeDrawtext('time:now')).toBe('time\\:now')
  })

  it('escapes backslashes', () => {
    expect(escapeDrawtext('a\\b')).toBe('a\\\\b')
  })

  it('handles plain text unchanged', () => {
    expect(escapeDrawtext('Hello World')).toBe('Hello World')
  })

  it('escapes multiple special chars together', () => {
    expect(escapeDrawtext("it's 3:00")).toBe("it\\'s 3\\:00")
  })
})

describe('buildDrawtextFilter', () => {
  it('returns null for empty text', () => {
    expect(buildDrawtextFilter({ text: '', size: 36, position: 'bottom', color: 'white' })).toBe(null)
  })

  it('returns null for whitespace-only text', () => {
    expect(buildDrawtextFilter({ text: '   ', size: 36, position: 'bottom', color: 'white' })).toBe(null)
  })

  it('centers text horizontally', () => {
    var result = buildDrawtextFilter({ text: 'Hello', size: 36, position: 'bottom', color: 'white' })
    expect(result).toContain('x=(w-text_w)/2')
  })

  it('positions text at bottom', () => {
    var result = buildDrawtextFilter({ text: 'Hello', size: 36, position: 'bottom', color: 'white' })
    expect(result).toContain('y=h-text_h-20')
  })

  it('positions text at top', () => {
    var result = buildDrawtextFilter({ text: 'Hello', size: 36, position: 'top', color: 'white' })
    expect(result).toContain('y=20')
  })

  it('positions text at center', () => {
    var result = buildDrawtextFilter({ text: 'Hello', size: 36, position: 'center', color: 'white' })
    expect(result).toContain('y=(h-text_h)/2')
  })

  it('includes font size', () => {
    var result = buildDrawtextFilter({ text: 'Hello', size: 48, position: 'bottom', color: 'white' })
    expect(result).toContain('fontsize=48')
  })

  it('includes font color', () => {
    var result = buildDrawtextFilter({ text: 'Hello', size: 36, position: 'bottom', color: 'yellow' })
    expect(result).toContain('fontcolor=yellow')
  })

  it('includes black border for readability', () => {
    var result = buildDrawtextFilter({ text: 'Hello', size: 36, position: 'bottom', color: 'white' })
    expect(result).toContain('borderw=2')
    expect(result).toContain('bordercolor=black')
  })

  it('escapes special characters in text', () => {
    var result = buildDrawtextFilter({ text: "it's 3:00", size: 36, position: 'bottom', color: 'white' })
    expect(result).toContain("it\\'s 3\\:00")
  })
})

describe('buildPalettePassArgs', () => {
  it('builds correct args with base filters', () => {
    var args = buildPalettePassArgs({
      trimStart: 2, trimLen: 5, inputName: 'input.mp4', paletteName: 'palette.png', baseFilters: 'fps=10'
    })
    expect(args).toEqual([
      '-ss', '2', '-t', '5',
      '-i', 'input.mp4',
      '-vf', 'fps=10,palettegen=stats_mode=diff',
      '-y', 'palette.png'
    ])
  })

  it('includes palettegen stats_mode=diff', () => {
    var args = buildPalettePassArgs({
      trimStart: 0, trimLen: 3, inputName: 'in.webm', paletteName: 'p.png', baseFilters: 'fps=15,scale=320:-1:flags=lanczos'
    })
    expect(args).toContain('-vf')
    var vfIndex = args.indexOf('-vf')
    expect(args[vfIndex + 1]).toContain('palettegen=stats_mode=diff')
  })
})

describe('buildEncodePassArgs', () => {
  it('builds correct args without drawtext', () => {
    var args = buildEncodePassArgs({
      trimStart: 2, trimLen: 5, inputName: 'input.mp4', paletteName: 'palette.png',
      outputName: 'output.gif', baseFilters: 'fps=10', drawtextFilter: null, loop: 0
    })
    expect(args).toEqual([
      '-ss', '2', '-t', '5',
      '-i', 'input.mp4', '-i', 'palette.png',
      '-lavfi', 'fps=10 [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
      '-loop', '0',
      '-y', 'output.gif'
    ])
  })

  it('includes drawtext filter when provided', () => {
    var dt = "drawtext=text='Hi':fontsize=36:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-text_h-20"
    var args = buildEncodePassArgs({
      trimStart: 0, trimLen: 3, inputName: 'in.mp4', paletteName: 'p.png',
      outputName: 'out.gif', baseFilters: 'fps=10', drawtextFilter: dt, loop: 0
    })
    var lavfiIndex = args.indexOf('-lavfi')
    expect(args[lavfiIndex + 1]).toContain(dt)
    expect(args[lavfiIndex + 1]).toContain('paletteuse')
  })

  it('omits drawtext when null', () => {
    var args = buildEncodePassArgs({
      trimStart: 0, trimLen: 3, inputName: 'in.mp4', paletteName: 'p.png',
      outputName: 'out.gif', baseFilters: 'fps=10', drawtextFilter: null, loop: 0
    })
    var lavfiIndex = args.indexOf('-lavfi')
    expect(args[lavfiIndex + 1]).not.toContain('drawtext')
  })

  it('includes loop value', () => {
    var args = buildEncodePassArgs({
      trimStart: 0, trimLen: 3, inputName: 'in.mp4', paletteName: 'p.png',
      outputName: 'out.gif', baseFilters: 'fps=10', drawtextFilter: null, loop: 2
    })
    expect(args).toContain('-loop')
    var loopIndex = args.indexOf('-loop')
    expect(args[loopIndex + 1]).toBe('2')
  })
})

describe('validateGifOptions', () => {
  it('accepts valid options', () => {
    expect(validateGifOptions({ trimLen: 5, fps: 10, speed: 1 })).toEqual({ valid: true })
  })

  it('rejects trimLen <= 0', () => {
    var r = validateGifOptions({ trimLen: 0, fps: 10, speed: 1 })
    expect(r.valid).toBe(false)
    expect(r.error).toBeTruthy()
  })

  it('rejects trimLen > 60', () => {
    var r = validateGifOptions({ trimLen: 61, fps: 10, speed: 1 })
    expect(r.valid).toBe(false)
  })

  it('rejects fps < 1', () => {
    expect(validateGifOptions({ trimLen: 5, fps: 0, speed: 1 }).valid).toBe(false)
  })

  it('rejects fps > 50', () => {
    expect(validateGifOptions({ trimLen: 5, fps: 51, speed: 1 }).valid).toBe(false)
  })

  it('rejects speed <= 0', () => {
    expect(validateGifOptions({ trimLen: 5, fps: 10, speed: 0 }).valid).toBe(false)
    expect(validateGifOptions({ trimLen: 5, fps: 10, speed: -1 }).valid).toBe(false)
  })

  it('accepts speed undefined (defaults to 1)', () => {
    expect(validateGifOptions({ trimLen: 5, fps: 10 }).valid).toBe(true)
  })
})
