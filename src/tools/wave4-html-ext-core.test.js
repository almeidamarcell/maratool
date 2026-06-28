import { describe, test, expect } from 'vitest'
import {
  sanitizeHtmlPreview,
  beautifyCss,
  minifyJs,
  validateHtmlStructure,
  generateCssGrid,
  generateFlexbox,
  normalizeSvg,
} from './wave4-html-ext-core.js'

describe('sanitizeHtmlPreview', () => {
  test('strips script tags', () => {
    expect(sanitizeHtmlPreview('<script>alert(1)</script><p>x</p>')).not.toContain('script')
  })
})

describe('beautifyCss', () => {
  test('adds newlines', () => {
    expect(beautifyCss('a{color:red}')).toContain('{\n')
  })
})

describe('minifyJs', () => {
  test('removes comments', () => {
    expect(minifyJs('const x = 1; // hi')).toBe('const x=1;')
  })
})

describe('validateHtmlStructure', () => {
  test('flags mismatched tags', () => {
    const r = validateHtmlStructure('<div><span></div></span>')
    expect(r.valid).toBe(false)
  })
})

describe('generateCssGrid', () => {
  test('includes grid template', () => {
    expect(generateCssGrid(2, 2)).toContain('grid-template-columns: repeat(2, 1fr)')
  })
})

describe('generateFlexbox', () => {
  test('includes flex properties', () => {
    expect(generateFlexbox('column')).toContain('flex-direction: column')
  })
})

describe('normalizeSvg', () => {
  test('requires svg root', () => {
    expect(normalizeSvg('<svg></svg>').error).toBeNull()
    expect(normalizeSvg('<div></div>').error).toBeTruthy()
  })
})
