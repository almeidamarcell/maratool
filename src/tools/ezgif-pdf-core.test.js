import { describe, it, expect } from 'vitest'
import {
  parsePageRange,
  computePdfRenderScale,
  getPdfOutputFilename,
  validatePdfPageCount,
} from './ezgif-pdf-core.js'

describe('parsePageRange', () => {
  it('parses comma-separated pages and ranges', () => {
    expect(parsePageRange('1,3-5', 10)).toEqual([1, 3, 4, 5])
  })
  it('clamps to total pages', () => {
    expect(parsePageRange('8-12', 10)).toEqual([8, 9, 10])
  })
  it('returns all pages for empty spec', () => {
    expect(parsePageRange('', 3)).toEqual([1, 2, 3])
  })
})

describe('computePdfRenderScale', () => {
  it('scales page to fit max dimension', () => {
    expect(computePdfRenderScale(612, 792, 500)).toBeCloseTo(0.631, 2)
  })
})

describe('getPdfOutputFilename', () => {
  it('inserts suffix before extension', () => {
    expect(getPdfOutputFilename('doc.pdf', 'compressed', '.pdf')).toBe('doc-compressed.pdf')
  })
})

describe('validatePdfPageCount', () => {
  it('accepts positive integers up to 200', () => {
    expect(validatePdfPageCount(1).valid).toBe(true)
    expect(validatePdfPageCount(0).valid).toBe(false)
    expect(validatePdfPageCount(201).valid).toBe(false)
  })
})
