import { describe, it, expect } from 'vitest'
import { auditJwt } from './jwt-security-core.js'

describe('auditJwt', () => {
  it('flags alg none', () => {
    // header {"alg":"none","typ":"JWT"} payload {"sub":"x"}
    var token = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4In0.'
    var r = auditJwt(token)
    expect(r.issues.some(function (i) { return i.severity === 'high' })).toBe(true)
  })

  it('flags expired token', () => {
    var header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '')
    var payload = btoa(JSON.stringify({ exp: 1 })).replace(/=+$/, '')
    var r = auditJwt(header + '.' + payload + '.sig')
    expect(r.issues.some(function (i) { return i.code === 'expired' })).toBe(true)
  })

  it('returns error for malformed token', () => {
    expect(auditJwt('not-a-jwt').error).toBeTruthy()
  })
})
