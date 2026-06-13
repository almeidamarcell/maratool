import { describe, it, expect } from 'vitest'
import { validateRotation, buildRotateArgs, getOutputFilename } from './rotate-video-core.js'

describe('validateRotation', () => {
  it('accepts 90cw', () => {
    expect(validateRotation('90cw')).toEqual({ valid: true })
  })

  it('accepts 90ccw', () => {
    expect(validateRotation('90ccw')).toEqual({ valid: true })
  })

  it('accepts 180', () => {
    expect(validateRotation('180')).toEqual({ valid: true })
  })

  it('rejects uppercase variants', () => {
    expect(validateRotation('90CW').valid).toBe(false)
    expect(validateRotation('90CCW').valid).toBe(false)
    expect(validateRotation('180deg').valid).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validateRotation('').valid).toBe(false)
  })

  it('rejects null', () => {
    expect(validateRotation(null).valid).toBe(false)
  })

  it('rejects undefined', () => {
    expect(validateRotation(undefined).valid).toBe(false)
  })

  it('rejects numbers', () => {
    expect(validateRotation(90).valid).toBe(false)
  })

  it('rejects arbitrary strings', () => {
    expect(validateRotation('flip').valid).toBe(false)
    expect(validateRotation('rotate').valid).toBe(false)
  })
})

describe('buildRotateArgs', () => {
  it('produces correct args for 90cw (transpose=1)', () => {
    expect(buildRotateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', rotation: '90cw' }))
      .toEqual(['-i', 'in.mp4', '-vf', 'transpose=1', '-c:a', 'copy', '-y', 'out.mp4'])
  })

  it('produces correct args for 90ccw (transpose=2)', () => {
    expect(buildRotateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', rotation: '90ccw' }))
      .toEqual(['-i', 'in.mp4', '-vf', 'transpose=2', '-c:a', 'copy', '-y', 'out.mp4'])
  })

  it('produces correct args for 180 (transpose=2,transpose=2)', () => {
    expect(buildRotateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', rotation: '180' }))
      .toEqual(['-i', 'in.mp4', '-vf', 'transpose=2,transpose=2', '-c:a', 'copy', '-y', 'out.mp4'])
  })

  it('throws for invalid rotation', () => {
    expect(() => buildRotateArgs({ inputName: 'in.mp4', outputName: 'out.mp4', rotation: '270' })).toThrow()
  })
})

describe('getOutputFilename', () => {
  it('inserts -rotated-<rotation> before the extension', () => {
    expect(getOutputFilename('video.mp4', '90cw')).toBe('video-rotated-90cw.mp4')
    expect(getOutputFilename('clip.webm', '90ccw')).toBe('clip-rotated-90ccw.webm')
    expect(getOutputFilename('Movie.MOV', '180')).toBe('Movie-rotated-180.MOV')
  })

  it('handles names with no extension', () => {
    expect(getOutputFilename('no-extension', '90cw')).toBe('no-extension-rotated-90cw.mp4')
  })

  it('handles dot-files gracefully', () => {
    expect(getOutputFilename('.hidden', '180')).toBe('.hidden-rotated-180.mp4')
  })

  it('returns a default for missing input', () => {
    expect(getOutputFilename('', '90cw')).toBe('video-rotated-90cw.mp4')
    expect(getOutputFilename(null, '90ccw')).toBe('video-rotated-90ccw.mp4')
  })
})
