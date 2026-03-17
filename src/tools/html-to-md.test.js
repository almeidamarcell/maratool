/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from 'vitest'
import { htmlToMarkdown } from './html-to-md.js'

describe('htmlToMarkdown', () => {
  test('converts headings', () => {
    expect(htmlToMarkdown('<h1>Title</h1>')).toContain('# Title')
    expect(htmlToMarkdown('<h2>Subtitle</h2>')).toContain('## Subtitle')
    expect(htmlToMarkdown('<h3>Sub</h3>')).toContain('### Sub')
  })

  test('converts paragraphs', () => {
    expect(htmlToMarkdown('<p>Hello world</p>')).toContain('Hello world')
  })

  test('converts bold and italic', () => {
    expect(htmlToMarkdown('<strong>bold</strong>')).toContain('**bold**')
    expect(htmlToMarkdown('<b>bold</b>')).toContain('**bold**')
    expect(htmlToMarkdown('<em>italic</em>')).toContain('*italic*')
    expect(htmlToMarkdown('<i>italic</i>')).toContain('*italic*')
  })

  test('converts inline code', () => {
    expect(htmlToMarkdown('<code>foo</code>')).toContain('`foo`')
  })

  test('converts code blocks', () => {
    var result = htmlToMarkdown('<pre><code>const x = 1</code></pre>')
    expect(result).toContain('```\nconst x = 1\n```')
  })

  test('converts links', () => {
    expect(htmlToMarkdown('<a href="https://example.com">click</a>')).toContain('[click](https://example.com)')
  })

  test('converts images', () => {
    expect(htmlToMarkdown('<img src="img.png" alt="logo">')).toContain('![logo](img.png)')
  })

  test('converts unordered lists', () => {
    var result = htmlToMarkdown('<ul><li>one</li><li>two</li></ul>')
    expect(result).toContain('- one')
    expect(result).toContain('- two')
  })

  test('converts ordered lists', () => {
    var result = htmlToMarkdown('<ol><li>first</li><li>second</li></ol>')
    expect(result).toContain('1. first')
    expect(result).toContain('2. second')
  })

  test('converts tables', () => {
    var html = '<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>'
    var result = htmlToMarkdown(html)
    expect(result).toContain('| Name | Age |')
    expect(result).toContain('| --- | --- |')
    expect(result).toContain('| Alice | 30 |')
  })

  test('converts blockquotes', () => {
    var result = htmlToMarkdown('<blockquote>quoted text</blockquote>')
    expect(result).toContain('> quoted text')
  })

  test('converts horizontal rules', () => {
    expect(htmlToMarkdown('<hr>')).toContain('---')
  })

  test('handles empty input', () => {
    expect(htmlToMarkdown('')).toBe('')
    expect(htmlToMarkdown('   ')).toBe('')
  })

  test('handles nested formatting', () => {
    var result = htmlToMarkdown('<p>This is <strong>bold and <em>italic</em></strong></p>')
    expect(result).toContain('**bold and *italic***')
  })
})
