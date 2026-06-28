import { describe, test, expect } from 'vitest'
import { convertDelimiter, transposeCsv, mapCsvColumns, diffCsv, csvToExcelHtml, excelHtmlToCsv } from './wave4-csv-ext-core.js'

describe('convertDelimiter', () => {
  test('changes delimiter', () => {
    expect(convertDelimiter('a,b\n1,2', ';')).toBe('a;b\n1;2')
  })
})

describe('transposeCsv', () => {
  test('swaps rows and columns', () => {
    const out = transposeCsv('a,b\n1,2')
    expect(out).toContain('a,1')
  })
})

describe('mapCsvColumns', () => {
  test('renames and selects columns', () => {
    const out = mapCsvColumns('old\nx', [{ from: 'old', to: 'new' }])
    expect(out).toContain('new')
  })
})

describe('diffCsv', () => {
  test('detects row changes', () => {
    const d = diffCsv('h\na', 'h\nb')
    expect(d.added).toBe(1)
    expect(d.removed).toBe(1)
  })
})

describe('excel roundtrip via HTML', () => {
  test('csv to html table and back', () => {
    const html = csvToExcelHtml('name\nAda')
    const csv = excelHtmlToCsv(html)
    expect(csv).toContain('Ada')
  })
})
