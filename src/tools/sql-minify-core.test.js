import { describe, it, expect } from 'vitest'
import { minifySql } from './sql-minify-core.js'

describe('minifySql', () => {
  it('returns empty string for blank input', () => {
    expect(minifySql('')).toBe('')
    expect(minifySql('   ')).toBe('')
  })

  it('collapses whitespace', () => {
    expect(minifySql('SELECT  id\n  FROM   users')).toBe('SELECT id FROM users')
  })

  it('removes line comments', () => {
    expect(minifySql('SELECT 1 -- comment\nFROM t')).toBe('SELECT 1 FROM t')
  })

  it('removes block comments', () => {
    expect(minifySql('SELECT /* block */ 1 FROM t')).toBe('SELECT 1 FROM t')
  })
})
