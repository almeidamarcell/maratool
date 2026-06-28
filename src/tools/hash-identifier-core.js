/** Identify common hash formats from pasted text */

const PATTERNS = [
  { type: 'bcrypt', re: /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/ },
  { type: 'MD5', re: /^[a-f0-9]{32}$/i },
  { type: 'SHA-1', re: /^[a-f0-9]{40}$/i },
  { type: 'SHA-256', re: /^[a-f0-9]{64}$/i },
  { type: 'SHA-512', re: /^[a-f0-9]{128}$/i },
]

export function identifyHash(input) {
  const s = String(input || '').trim()
  if (!s) return { type: 'unknown', message: 'Empty input' }

  for (const p of PATTERNS) {
    if (p.re.test(s)) {
      return { type: p.type, message: 'Matches ' + p.type + ' format' }
    }
  }

  if (/^[a-f0-9]+$/i.test(s)) {
    return { type: 'hex digest', message: 'Hex digest (' + s.length + ' chars) — length does not match common algorithms' }
  }

  return { type: 'unknown', message: 'Unrecognized hash format' }
}
