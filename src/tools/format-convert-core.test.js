import { describe, it, expect, vi } from 'vitest'
import { buildLosslessArgs, buildReencodeArgs, getOutputFilename, validateFormatInput } from './format-convert-core.js'

// Mock fps-converter-core validateVideoFile
vi.mock('./fps-converter-core.js', () => ({
  validateVideoFile: vi.fn((file) => {
    if (!file || !file.type) return { valid: false, error: 'No file selected' }
    var validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!validTypes.includes(file.type)) return { valid: false, error: 'Unsupported format. Use MP4, WebM, or MOV.' }
    return { valid: true }
  }),
}))

describe('buildLosslessArgs', () => {
  it('produces -c copy args in the correct order', () => {
    expect(buildLosslessArgs({ inputName: 'in.mov', outputName: 'out.mp4' }))
      .toEqual(['-i', 'in.mov', '-c', 'copy', '-y', 'out.mp4'])
  })

  it('uses the provided inputName and outputName verbatim', () => {
    var args = buildLosslessArgs({ inputName: 'video.mov', outputName: 'video.mp4' })
    expect(args[1]).toBe('video.mov')
    expect(args[5]).toBe('video.mp4')
  })
})

describe('buildReencodeArgs', () => {
  it('includes vcodec and acodec with -c:v and -c:a flags', () => {
    var args = buildReencodeArgs({ inputName: 'in.mp4', outputName: 'out.webm', vcodec: 'libvpx-vp9', acodec: 'libopus', extraVideoArgs: [] })
    expect(args).toContain('libvpx-vp9')
    expect(args).toContain('libopus')
    expect(args).toContain('-c:v')
    expect(args).toContain('-c:a')
  })

  it('slots extraVideoArgs between vcodec and acodec', () => {
    var args = buildReencodeArgs({
      inputName: 'in.mp4', outputName: 'out.webm',
      vcodec: 'libvpx-vp9', acodec: 'libopus',
      extraVideoArgs: ['-b:v', '1M', '-deadline', 'realtime', '-cpu-used', '5']
    })
    expect(args).toContain('-b:v')
    expect(args).toContain('1M')
    expect(args).toContain('-deadline')
    expect(args).toContain('realtime')
    expect(args).toContain('-cpu-used')
    expect(args).toContain('5')
    var aCodecIdx = args.indexOf('-c:a')
    var bvIdx = args.indexOf('-b:v')
    expect(bvIdx).toBeLessThan(aCodecIdx)
  })

  it('works with libx264 + aac and veryfast preset', () => {
    var args = buildReencodeArgs({
      inputName: 'in.mov', outputName: 'out.mp4',
      vcodec: 'libx264', acodec: 'aac',
      extraVideoArgs: ['-preset', 'veryfast', '-crf', '22']
    })
    expect(args).toContain('libx264')
    expect(args).toContain('aac')
    expect(args).toContain('-preset')
    expect(args).toContain('veryfast')
    expect(args).toContain('-crf')
    expect(args).toContain('22')
    expect(args[0]).toBe('-i')
    expect(args[1]).toBe('in.mov')
    expect(args[args.length - 1]).toBe('out.mp4')
    expect(args[args.length - 2]).toBe('-y')
  })

  it('handles missing extraVideoArgs gracefully', () => {
    var args = buildReencodeArgs({ inputName: 'in.mp4', outputName: 'out.webm', vcodec: 'libvpx-vp9', acodec: 'libopus' })
    expect(args).toContain('libvpx-vp9')
    expect(args).toContain('libopus')
    expect(args[args.length - 1]).toBe('out.webm')
  })
})

describe('getOutputFilename', () => {
  it('replaces the extension with outputExt (happy path)', () => {
    expect(getOutputFilename('video.mov', '.mp4')).toBe('video.mp4')
    expect(getOutputFilename('clip.mp4', '.webm')).toBe('clip.webm')
  })

  it('handles uppercase extensions', () => {
    expect(getOutputFilename('Recording.MOV', '.mp4')).toBe('Recording.mp4')
  })

  it('handles filenames with no extension', () => {
    expect(getOutputFilename('myvideo', '.mp4')).toBe('myvideo.mp4')
  })

  it('returns video+outputExt for null input', () => {
    expect(getOutputFilename(null, '.mp4')).toBe('video.mp4')
  })

  it('returns video+outputExt for empty string', () => {
    expect(getOutputFilename('', '.mp4')).toBe('video.mp4')
  })

  it('handles dot-files (leading dot)', () => {
    expect(getOutputFilename('.hidden', '.mp4')).toBe('.hidden.mp4')
  })
})

describe('validateFormatInput', () => {
  it('accepts a file whose type is in the allowedTypes list', () => {
    var file = { type: 'video/quicktime', name: 'clip.mov' }
    expect(validateFormatInput(file, ['video/quicktime'])).toEqual({ valid: true })
  })

  it('accepts video/mp4 when allowed', () => {
    var file = { type: 'video/mp4', name: 'clip.mp4' }
    expect(validateFormatInput(file, ['video/mp4'])).toEqual({ valid: true })
  })

  it('rejects a file whose type is NOT in allowedTypes', () => {
    var file = { type: 'video/webm', name: 'clip.webm' }
    var result = validateFormatInput(file, ['video/mp4'])
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/unsupported format/i)
  })

  it('rejects a completely invalid file (no type) — caught by validateVideoFile', () => {
    var file = { name: 'clip.txt' }
    var result = validateFormatInput(file, ['video/mp4'])
    expect(result.valid).toBe(false)
  })

  it('rejects null file', () => {
    var result = validateFormatInput(null, ['video/mp4'])
    expect(result.valid).toBe(false)
  })
})
