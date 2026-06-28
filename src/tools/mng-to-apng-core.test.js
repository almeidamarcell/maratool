import { describe, it, expect } from 'vitest'
import {
  ALLOWED_MNG_TYPES,
  MAX_FILE_SIZE,
  isMngFile,
  validateMngFile,
  buildMngToApngArgs,
  getOutputFilename,
} from './mng-to-apng-core.js'

describe('isMngFile', () => {
  it('accepts .mng extension regardless of MIME', () => {
    expect(isMngFile({ name: 'anim.mng', type: '' })).toBe(true)
    expect(isMngFile({ name: 'Anim.MNG', type: 'application/octet-stream' })).toBe(true)
  })

  it('accepts known MNG MIME types', () => {
    for (var i = 0; i < ALLOWED_MNG_TYPES.length; i++) {
      expect(isMngFile({ name: 'file', type: ALLOWED_MNG_TYPES[i] })).toBe(true)
    }
  })

  it('rejects non-MNG files', () => {
    expect(isMngFile({ name: 'photo.png', type: 'image/png' })).toBe(false)
    expect(isMngFile(null)).toBe(false)
  })
})

describe('validateMngFile', () => {
  it('accepts a valid MNG file under the size limit', () => {
    expect(validateMngFile({ name: 'clip.mng', type: 'video/x-mng', size: 1024 })).toEqual({ valid: true })
  })

  it('rejects files over 200 MB', () => {
    var result = validateMngFile({ name: 'big.mng', type: 'video/x-mng', size: MAX_FILE_SIZE + 1 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/200 MB/)
  })

  it('rejects unsupported formats', () => {
    var result = validateMngFile({ name: 'photo.png', type: 'image/png', size: 100 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/\.mng/)
  })

  it('rejects null file', () => {
    expect(validateMngFile(null).valid).toBe(false)
  })
})

describe('buildMngToApngArgs', () => {
  it('produces apng mux args with input and output paths', () => {
    expect(buildMngToApngArgs({ inputName: 'in.mng', outputName: 'out.apng' }))
      .toEqual(['-i', 'in.mng', '-f', 'apng', '-y', 'out.apng'])
  })
})

describe('getOutputFilename', () => {
  it('replaces .mng with .apng', () => {
    expect(getOutputFilename('animation.mng')).toBe('animation.apng')
    expect(getOutputFilename('legacy.MNG')).toBe('legacy.apng')
  })

  it('handles names without extension', () => {
    expect(getOutputFilename('myanim')).toBe('myanim.apng')
  })

  it('returns output.apng for empty input', () => {
    expect(getOutputFilename('')).toBe('output.apng')
    expect(getOutputFilename(null)).toBe('output.apng')
  })
})
