import { describe, it, expect } from 'vitest'
import { minifyHtml, beautifyHtml } from './html-format-core.js'
import { minifyCss } from './css-minify-core.js'

describe('minifyHtml', () => {
  it('removes comments and extra whitespace', () => {
    var html = '<div>  hello <!-- c --> world </div>'
    expect(minifyHtml(html)).toBe('<div> hello world </div>')
  })
})

describe('beautifyHtml', () => {
  it('indents nested tags', () => {
    var out = beautifyHtml('<div><p>hi</p></div>')
    expect(out).toContain('<div>')
    expect(out).toContain('  <p>')
  })
})

describe('minifyCss', () => {
  it('removes comments and whitespace', () => {
    expect(minifyCss('.a { color: red; }')).toBe('.a{color:red}')
  })
})
