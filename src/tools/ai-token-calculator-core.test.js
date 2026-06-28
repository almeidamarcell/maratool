import { describe, it, expect } from 'vitest'
import { countTokens, countWords, getTextStats } from './ai-token-calculator-core.js'

describe('countWords', () => {
  it('returns 0 for empty text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })

  it('counts words in a sentence', () => {
    expect(countWords('hello world')).toBe(2)
  })
})

describe('countTokens', () => {
  it('returns 0 for empty text', () => {
    expect(countTokens('', 'gpt-4o')).toBe(0)
  })

  it('estimates tokens for short text', () => {
    expect(countTokens('hello', 'gpt-4o')).toBeGreaterThan(0)
  })

  it('longer text yields more tokens', () => {
    var short = countTokens('hello world', 'gpt-4o')
    var long = countTokens('hello world this is a longer sentence with more words', 'gpt-4o')
    expect(long).toBeGreaterThan(short)
  })

  it('uses model-specific ratios', () => {
    var text = 'The quick brown fox jumps over the lazy dog'
    var gpt = countTokens(text, 'gpt-4o')
    var claude = countTokens(text, 'claude-sonnet')
    expect(claude).toBeGreaterThanOrEqual(gpt)
  })
})

describe('getTextStats', () => {
  it('returns characters, words, and tokens', () => {
    var stats = getTextStats('hello world', 'gpt-4o')
    expect(stats.characters).toBe(11)
    expect(stats.words).toBe(2)
    expect(stats.tokens).toBeGreaterThan(0)
  })
})
