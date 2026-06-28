/** Validate IBAN using mod-97 check */

function normalize(iban) {
  return String(iban || '').replace(/\s+/g, '').toUpperCase()
}

function mod97(iban) {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let remainder = ''
  for (let i = 0; i < rearranged.length; i++) {
    const ch = rearranged[i]
    const val = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch
    remainder += val
    if (remainder.length > 9) {
      remainder = String(Number(remainder) % 97)
    }
  }
  return Number(remainder) % 97
}

export function validateIban(iban) {
  const normalized = normalize(iban)
  if (normalized.length < 15 || normalized.length > 34) {
    return { valid: false, formatted: normalized, message: 'IBAN length out of range' }
  }
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(normalized)) {
    return { valid: false, formatted: normalized, message: 'Invalid IBAN structure' }
  }
  const valid = mod97(normalized) === 1
  const formatted = normalized.replace(/(.{4})(?=.)/g, '$1 ').trim()
  return {
    valid,
    formatted,
    country: normalized.slice(0, 2),
    message: valid ? 'Valid IBAN check digits' : 'Invalid IBAN check digits',
  }
}
