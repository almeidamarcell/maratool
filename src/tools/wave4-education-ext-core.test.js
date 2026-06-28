import { describe, test, expect } from 'vitest'
import {
  toRoman,
  fromRoman,
  formatApaCitation,
  formatMlaCitation,
  convertCitationStyle,
  formatFlashcards,
} from './wave4-education-ext-core.js'

describe('roman numerals', () => {
  test('converts both ways', () => {
    expect(toRoman(2026)).toBe('MMXXVI')
    expect(fromRoman('MMXXVI')).toBe(2026)
  })
})

describe('citations', () => {
  test('formats APA and MLA', () => {
    expect(formatApaCitation({ author: 'Smith, J.' })).toContain('Smith, J.')
    expect(formatMlaCitation({ author: 'Smith' })).toContain('"')
  })
  test('converts style', () => {
    expect(convertCitationStyle({}, 'apa')).toContain('(')
  })
})

describe('formatFlashcards', () => {
  test('formats Q/A pairs', () => {
    const out = formatFlashcards('capital\tParis')
    expect(out).toContain('**Q:** capital')
    expect(out).toContain('**A:** Paris')
  })
})
