/** GTIN / EAN-13 / UPC check digit validation */

export function calcCheckDigit(digits12) {
  let sum = 0
  for (let i = 0; i < digits12.length; i++) {
    const n = parseInt(digits12[i], 10)
    sum += i % 2 === 0 ? n : n * 3
  }
  return (10 - (sum % 10)) % 10
}

export function validateGtin(code) {
  const digits = String(code).replace(/\D/g, '')
  if (digits.length !== 12 && digits.length !== 13 && digits.length !== 8) {
    return { valid: false, error: 'GTIN must be 8, 12, or 13 digits' }
  }
  const body = digits.length === 13 ? digits.slice(0, 12) : digits.slice(0, -1)
  const check = parseInt(digits[digits.length - 1], 10)
  const expected = calcCheckDigit(body.length === 11 ? '0' + body : body)
  const valid = check === expected
  return {
    valid,
    type: digits.length === 13 ? 'EAN-13' : digits.length === 12 ? 'UPC-A' : 'EAN-8',
    checkDigit: check,
    expectedCheckDigit: expected,
    error: valid ? null : `Invalid check digit: expected ${expected}, got ${check}`,
  }
}
