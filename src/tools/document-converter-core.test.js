/**
 * @vitest-environment jsdom
 */
import { describe, expect, test } from 'vitest'
import {
  detectInputFormat,
  getAvailableOutputs,
  pandocReader,
  pandocWriter,
  buildConversionOptions,
  buildFilename,
  parseConversionResult,
  wrapHtmlPreview,
} from './document-converter-core.js'

describe('detectInputFormat', () => {
  test('detects common extensions', () => {
    expect(detectInputFormat('report.docx')).toBe('docx')
    expect(detectInputFormat('notes.markdown')).toBe('md')
    expect(detectInputFormat('book.epub')).toBe('epub')
    expect(detectInputFormat('data.tsv')).toBe('tsv')
  })
})

describe('getAvailableOutputs', () => {
  test('excludes input format', () => {
    expect(getAvailableOutputs('docx')).not.toContain('docx')
    expect(getAvailableOutputs('docx')).toContain('html')
    expect(getAvailableOutputs('docx')).toContain('epub')
  })
})

describe('pandocReader', () => {
  test('maps doc to docx reader', () => {
    expect(pandocReader('doc')).toBe('docx')
    expect(pandocReader('txt')).toBe('plain')
  })
})

describe('buildConversionOptions', () => {
  test('adds input-files for binary inputs', () => {
    var opts = buildConversionOptions('docx', 'html', 'report.docx')
    expect(opts['input-files']).toEqual(['report.docx'])
    expect(opts.from).toBe('docx')
    expect(opts.to).toBe('html')
    expect(opts.standalone).toBe(true)
  })

  test('uses output-file for binary outputs', () => {
    var opts = buildConversionOptions('md', 'docx', 'notes.md')
    expect(opts['output-file']).toBe('output.docx')
  })
})

describe('parseConversionResult', () => {
  test('returns text result from stdout', () => {
    var parsed = parseConversionResult({ stdout: '# Hi', stderr: '', warnings: [], mediaFiles: {} }, 'md', {})
    expect(parsed.type).toBe('text')
    expect(parsed.content).toBe('# Hi')
  })

  test('throws on stderr-only failure', () => {
    expect(function () {
      parseConversionResult({ stdout: '', stderr: 'ERROR: bad file', warnings: [], mediaFiles: {} }, 'html', {})
    }).toThrow('ERROR: bad file')
  })
})

describe('buildFilename', () => {
  test('replaces extension with output format', () => {
    expect(buildFilename('report.docx', 'html')).toBe('report.html')
    expect(buildFilename('data.json', 'csv')).toBe('data.csv')
    expect(buildFilename('report.docx', 'html', true)).toBe('report.zip')
  })
})

describe('wrapHtmlPreview', () => {
  test('wraps fragment in document shell', () => {
    expect(wrapHtmlPreview('<p>Hi</p>')).toContain('<!DOCTYPE html>')
    expect(wrapHtmlPreview('<p>Hi</p>')).toContain('<p>Hi</p>')
  })
})
