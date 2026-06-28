/**
 * @vitest-environment jsdom
 */
import { describe, expect, test } from 'vitest'
import {
  detectInputFormat,
  getAvailableOutputs,
  stripRtf,
  textToRtf,
  rstToHtml,
  odtXmlToHtml,
  convertContent,
  buildFilename,
  htmlToPlainText,
} from './document-converter-core.js'

describe('detectInputFormat', () => {
  test('detects common extensions', () => {
    expect(detectInputFormat('report.docx')).toBe('docx')
    expect(detectInputFormat('notes.markdown')).toBe('md')
    expect(detectInputFormat('page.htm')).toBe('html')
    expect(detectInputFormat('book.epub')).toBe('epub')
    expect(detectInputFormat('data.csv')).toBe('csv')
  })

  test('falls back to txt for unknown extensions', () => {
    expect(detectInputFormat('readme.xyz')).toBe('txt')
  })
})

describe('getAvailableOutputs', () => {
  test('returns docx outputs including pdf', () => {
    expect(getAvailableOutputs('docx')).toContain('pdf')
    expect(getAvailableOutputs('docx')).toContain('html')
  })

  test('csv can convert to json', () => {
    expect(getAvailableOutputs('csv')).toEqual(['json', 'txt'])
  })
})

describe('stripRtf', () => {
  test('extracts plain text from simple RTF', () => {
    var rtf = '{\\rtf1\\ansi Hello\\par World}'
    expect(stripRtf(rtf)).toContain('Hello')
    expect(stripRtf(rtf)).toContain('World')
  })
})

describe('textToRtf', () => {
  test('wraps text in RTF header', () => {
    expect(textToRtf('Hi')).toContain('{\\rtf1')
    expect(textToRtf('Hi')).toContain('Hi')
  })
})

describe('rstToHtml', () => {
  test('converts headings', () => {
    var html = rstToHtml('Title\n=====\n\nBody text')
    expect(html).toContain('<h1>')
    expect(html).toContain('Title')
    expect(html).toContain('<p>')
  })
})

describe('odtXmlToHtml', () => {
  test('extracts paragraphs from ODT content.xml', () => {
    var xml = '<?xml version="1.0"?><office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text><text:p>Hello ODT</text:p></office:text></office:body></office:document>'
    var html = odtXmlToHtml(xml)
    expect(html).toContain('Hello ODT')
    expect(html).toContain('<p>')
  })
})

describe('convertContent', () => {
  test('markdown to html', () => {
    var parsed = { format: 'md', text: '# Hello', html: '<h1>Hello</h1>' }
    var result = convertContent(parsed, 'html')
    expect(result.type).toBe('html')
    expect(result.content).toContain('<h1>Hello</h1>')
  })

  test('csv to json', () => {
    var parsed = { format: 'csv', text: 'a,b\n1,2', html: '' }
    var result = convertContent(parsed, 'json')
    expect(result.content).toContain('"a"')
    expect(result.content).toContain('"1"')
  })

  test('html to plain text', () => {
    expect(htmlToPlainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world')
  })
})

describe('buildFilename', () => {
  test('replaces extension with output format', () => {
    expect(buildFilename('report.docx', 'pdf')).toBe('report.pdf')
    expect(buildFilename('data.json', 'csv')).toBe('data.csv')
  })
})
