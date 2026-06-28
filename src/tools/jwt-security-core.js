/** JWT security audit — decode and flag common issues */

function base64urlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const bin = typeof atob === 'function'
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('binary')
  try {
    return decodeURIComponent(
      Array.from(bin, c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    )
  } catch {
    return bin
  }
}

function decodePart(part) {
  return JSON.parse(base64urlDecode(part))
}

export function auditJwt(token) {
  const raw = String(token || '').trim().replace(/\s+/g, '')
  if (!raw) return { error: 'Empty token' }

  const parts = raw.split('.')
  if (parts.length !== 3) return { error: 'Invalid JWT: expected 3 parts' }

  let header
  let payload
  try {
    header = decodePart(parts[0])
    payload = decodePart(parts[1])
  } catch {
    return { error: 'Could not decode JWT' }
  }

  const issues = []
  const alg = String(header.alg || '').toLowerCase()

  if (!alg || alg === 'none') {
    issues.push({ severity: 'high', code: 'alg_none', message: 'Algorithm is "none" or missing — token is not signed' })
  }
  if (alg === 'hs256' && (!header.kid && !payload.iss)) {
    issues.push({ severity: 'medium', code: 'weak_symmetric', message: 'HS256 without key rotation metadata — verify secret strength server-side' })
  }

  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      issues.push({ severity: 'medium', code: 'expired', message: 'Token is expired (exp in the past)' })
    }
  } else {
    issues.push({ severity: 'low', code: 'no_exp', message: 'No exp claim — token may not expire' })
  }

  if (!payload.sub && !payload.user_id) {
    issues.push({ severity: 'low', code: 'no_subject', message: 'No sub or user identifier in payload' })
  }

  return {
    header,
    payload,
    issues,
    risk: issues.some(i => i.severity === 'high') ? 'high'
      : issues.some(i => i.severity === 'medium') ? 'medium'
      : issues.length ? 'low' : 'ok',
  }
}
