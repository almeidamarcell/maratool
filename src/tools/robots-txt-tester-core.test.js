import { describe, it, expect } from 'vitest'
import { parseRobotsTxt, testRobotsPath } from './robots-txt-tester-core.js'

var SAMPLE = `User-agent: *
Disallow: /admin/
Allow: /admin/public/

User-agent: Googlebot
Disallow: /private/`

describe('parseRobotsTxt', () => {
  it('parses user-agent blocks', () => {
    var parsed = parseRobotsTxt(SAMPLE)
    expect(parsed.rules.length).toBe(2)
    expect(parsed.rules[0].userAgent).toBe('*')
  })
})

describe('testRobotsPath', () => {
  it('blocks disallowed paths', () => {
    var parsed = parseRobotsTxt(SAMPLE)
    var result = testRobotsPath(parsed.rules, 'Googlebot', '/admin/secret')
    expect(result.allowed).toBe(false)
  })

  it('allows explicitly allowed subpaths', () => {
    var parsed = parseRobotsTxt(SAMPLE)
    var result = testRobotsPath(parsed.rules, 'Bingbot', '/admin/public/page')
    expect(result.allowed).toBe(true)
  })

  it('allows paths with no matching rule', () => {
    var parsed = parseRobotsTxt(SAMPLE)
    var result = testRobotsPath(parsed.rules, 'Googlebot', '/blog/post')
    expect(result.allowed).toBe(true)
  })
})
