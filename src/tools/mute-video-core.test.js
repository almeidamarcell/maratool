import { describe, it, expect } from 'vitest'
import { buildMuteArgs, getOutputFilename } from './mute-video-core.js'

describe('buildMuteArgs', () => {
  it('produces the exact arg array for muting', () => {
    expect(buildMuteArgs({ inputName: 'in.mp4', outputName: 'out.mp4' }))
      .toEqual(['-i', 'in.mp4', '-an', '-c:v', 'copy', '-y', 'out.mp4'])
  })

  it('uses the provided input and output names verbatim', () => {
    var args = buildMuteArgs({ inputName: 'clip.webm', outputName: 'clip-muted.webm' })
    expect(args[1]).toBe('clip.webm')
    expect(args[args.length - 1]).toBe('clip-muted.webm')
  })
})

describe('getOutputFilename', () => {
  it('inserts -muted before the extension', () => {
    expect(getOutputFilename('video.mp4')).toBe('video-muted.mp4')
    expect(getOutputFilename('clip.webm')).toBe('clip-muted.webm')
    expect(getOutputFilename('Movie.MOV')).toBe('Movie-muted.MOV')
  })

  it('handles names with no extension', () => {
    expect(getOutputFilename('no-extension')).toBe('no-extension-muted.mp4')
  })

  it('handles dot-files gracefully', () => {
    expect(getOutputFilename('.hidden')).toBe('.hidden-muted.mp4')
  })

  it('returns a default for missing input', () => {
    expect(getOutputFilename('')).toBe('video-muted.mp4')
    expect(getOutputFilename(null)).toBe('video-muted.mp4')
  })
})
