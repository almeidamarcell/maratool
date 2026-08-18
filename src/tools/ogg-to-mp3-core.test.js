import { describe, it, expect } from 'vitest'
import {
  validateAudioFile,
  validateBitrate,
  buildConvertArgs,
  getOutputFilename,
  getMaxFileSize,
} from './ogg-to-mp3-core.js'

function fakeFile(name, type) {
  return { name: name, type: type || '' }
}

describe('validateAudioFile', () => {
  it('accepts a .ogg file', () => {
    expect(validateAudioFile(fakeFile('song.ogg', 'audio/ogg'))).toEqual({ valid: true })
  })

  it('accepts a .oga file', () => {
    expect(validateAudioFile(fakeFile('clip.oga', 'audio/ogg'))).toEqual({ valid: true })
  })

  it('accepts a .opus file', () => {
    expect(validateAudioFile(fakeFile('voice.opus', 'audio/opus'))).toEqual({ valid: true })
  })

  it('accepts uppercase extensions', () => {
    expect(validateAudioFile(fakeFile('SONG.OGG'))).toEqual({ valid: true })
    expect(validateAudioFile(fakeFile('VOICE.OPUS'))).toEqual({ valid: true })
  })

  it('accepts a correct MIME type even with an unknown extension', () => {
    expect(validateAudioFile(fakeFile('download.bin', 'audio/ogg'))).toEqual({ valid: true })
    expect(validateAudioFile(fakeFile('blob', 'application/ogg'))).toEqual({ valid: true })
    expect(validateAudioFile(fakeFile('stream', 'video/ogg'))).toEqual({ valid: true })
    expect(validateAudioFile(fakeFile('note', 'audio/opus'))).toEqual({ valid: true })
  })

  it('rejects an .mp3 file', () => {
    const r = validateAudioFile(fakeFile('song.mp3', 'audio/mpeg'))
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/\.ogg/i)
  })

  it('rejects a .wav file', () => {
    expect(validateAudioFile(fakeFile('audio.wav', 'audio/wav')).valid).toBe(false)
  })

  it('rejects an .mp4 file', () => {
    expect(validateAudioFile(fakeFile('video.mp4', 'video/mp4')).valid).toBe(false)
  })

  it('rejects null and undefined', () => {
    expect(validateAudioFile(null).valid).toBe(false)
    expect(validateAudioFile(undefined).valid).toBe(false)
  })

  it('error message names the accepted formats', () => {
    const r = validateAudioFile(fakeFile('doc.pdf', 'application/pdf'))
    expect(r.error).toMatch(/\.ogg/)
    expect(r.error).toMatch(/\.opus/)
  })
})

describe('validateBitrate (re-exported contract)', () => {
  it('accepts 128, 192, 320 as numbers', () => {
    expect(validateBitrate(128)).toEqual({ valid: true })
    expect(validateBitrate(192)).toEqual({ valid: true })
    expect(validateBitrate(320)).toEqual({ valid: true })
  })

  it('accepts numeric strings', () => {
    expect(validateBitrate('192')).toEqual({ valid: true })
  })

  it('rejects 256, 0, non-numeric, null', () => {
    expect(validateBitrate(256).valid).toBe(false)
    expect(validateBitrate(0).valid).toBe(false)
    expect(validateBitrate('bad').valid).toBe(false)
    expect(validateBitrate(null).valid).toBe(false)
  })
})

describe('buildConvertArgs', () => {
  it('produces the exact FFmpeg arg array for 192k', () => {
    expect(buildConvertArgs({ inputName: 'input.ogg', outputName: 'output.mp3', bitrate: 192 }))
      .toEqual(['-i', 'input.ogg', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', '-y', 'output.mp3'])
  })

  it('produces the exact FFmpeg arg array for 128k with an .opus input', () => {
    expect(buildConvertArgs({ inputName: 'voice.opus', outputName: 'out.mp3', bitrate: 128 }))
      .toEqual(['-i', 'voice.opus', '-vn', '-c:a', 'libmp3lame', '-b:a', '128k', '-y', 'out.mp3'])
  })

  it('produces the exact FFmpeg arg array for 320k', () => {
    expect(buildConvertArgs({ inputName: 'a.oga', outputName: 'a.mp3', bitrate: 320 }))
      .toEqual(['-i', 'a.oga', '-vn', '-c:a', 'libmp3lame', '-b:a', '320k', '-y', 'a.mp3'])
  })
})

describe('getOutputFilename (re-exported contract)', () => {
  it('replaces .ogg with .mp3', () => {
    expect(getOutputFilename('song.ogg')).toBe('song.mp3')
  })

  it('replaces .opus with .mp3, keeping earlier dots', () => {
    expect(getOutputFilename('a.b.opus')).toBe('a.b.mp3')
  })

  it('appends .mp3 when there is no extension', () => {
    expect(getOutputFilename('noext')).toBe('noext.mp3')
  })

  it('appends .mp3 to dotfiles', () => {
    expect(getOutputFilename('.hidden')).toBe('.hidden.mp3')
  })

  it('falls back to audio.mp3 for empty or invalid input', () => {
    expect(getOutputFilename('')).toBe('audio.mp3')
    expect(getOutputFilename(null)).toBe('audio.mp3')
  })
})

describe('getMaxFileSize', () => {
  it('returns 500 MB in bytes', () => {
    expect(getMaxFileSize()).toBe(500 * 1024 * 1024)
  })
})
