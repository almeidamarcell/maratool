/** Luhn algorithm — credit card and identifier check */

export function luhnCheck(input) {
  const digits = String(input || '').replace(/[\s-]/g, '')
  if (!/^\d{2,}$/.test(digits)) {
    return { valid: false, message: 'Enter numeric digits only' }
  }

  let sum = 0
  let dbl = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (dbl) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    dbl = !dbl
  }

  const valid = sum % 10 === 0
  return { valid, message: valid ? 'Passes Luhn check' : 'Fails Luhn check' }
}
