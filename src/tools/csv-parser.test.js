import { describe, test, expect } from 'vitest'
import { detectDelimiter, parseCsv, csvToJson, jsonToCsv } from './csv-parser.js'

describe('detectDelimiter', () => {
  test('detects comma', () => {
    expect(detectDelimiter('name,age,city')).toBe(',')
  })
  test('detects semicolon', () => {
    expect(detectDelimiter('name;age;city')).toBe(';')
  })
  test('detects tab', () => {
    expect(detectDelimiter('name\tage\tcity')).toBe('\t')
  })
  test('defaults to comma for ambiguous input', () => {
    expect(detectDelimiter('hello')).toBe(',')
  })
})

describe('parseCsv', () => {
  test('parses simple CSV', () => {
    var res = parseCsv('name,age\nAlice,30\nBob,25', ',')
    expect(res.headers).toEqual(['name', 'age'])
    expect(res.rows).toEqual([['Alice', '30'], ['Bob', '25']])
  })
  test('handles quoted fields with commas', () => {
    var res = parseCsv('name,desc\nAlice,"hello, world"', ',')
    expect(res.rows[0]).toEqual(['Alice', 'hello, world'])
  })
  test('handles quoted fields with newlines', () => {
    var res = parseCsv('name,desc\nAlice,"line1\nline2"', ',')
    expect(res.rows[0]).toEqual(['Alice', 'line1\nline2'])
  })
  test('handles escaped quotes', () => {
    var res = parseCsv('name,desc\nAlice,"say ""hello"""', ',')
    expect(res.rows[0]).toEqual(['Alice', 'say "hello"'])
  })
  test('handles empty fields', () => {
    var res = parseCsv('a,b,c\n1,,3', ',')
    expect(res.rows[0]).toEqual(['1', '', '3'])
  })
  test('handles trailing newline', () => {
    var res = parseCsv('a,b\n1,2\n', ',')
    expect(res.rows).toEqual([['1', '2']])
  })
  test('handles CRLF line endings', () => {
    var res = parseCsv('a,b\r\n1,2\r\n', ',')
    expect(res.rows).toEqual([['1', '2']])
  })
  test('returns empty for empty input', () => {
    var res = parseCsv('', ',')
    expect(res.headers).toEqual([])
    expect(res.rows).toEqual([])
  })
})

describe('csvToJson', () => {
  test('converts CSV to array of objects', () => {
    var result = csvToJson('name,age\nAlice,30\nBob,25', ',')
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' },
    ])
  })
  test('handles missing columns', () => {
    var result = csvToJson('a,b,c\n1,2', ',')
    expect(result[0]).toEqual({ a: '1', b: '2', c: '' })
  })
})

describe('jsonToCsv', () => {
  test('converts array of objects to CSV', () => {
    var result = jsonToCsv([{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }], ',')
    expect(result).toBe('name,age\nAlice,30\nBob,25')
  })
  test('escapes fields with commas', () => {
    var result = jsonToCsv([{ name: 'Alice, Jr.' }], ',')
    expect(result).toBe('name\n"Alice, Jr."')
  })
  test('escapes fields with quotes', () => {
    var result = jsonToCsv([{ name: 'say "hi"' }], ',')
    expect(result).toBe('name\n"say ""hi"""')
  })
  test('returns empty for empty array', () => {
    expect(jsonToCsv([], ',')).toBe('')
  })
  test('handles missing keys across objects', () => {
    var result = jsonToCsv([{ a: 1 }, { b: 2 }], ',')
    expect(result).toBe('a,b\n1,\n,2')
  })
})

describe('round-trip', () => {
  test('csvToJson then jsonToCsv preserves data', () => {
    var csv = 'name,age\nAlice,30\nBob,25'
    var json = csvToJson(csv, ',')
    var backToCsv = jsonToCsv(json, ',')
    expect(backToCsv).toBe(csv)
  })
})
