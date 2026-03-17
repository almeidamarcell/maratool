export function validateCostFactor(n) {
  var num = Number(n)
  if (isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, error: 'Cost factor must be an integer' }
  }
  if (num < 4) return { valid: false, error: 'Minimum cost factor is 4' }
  if (num > 12) return { valid: false, error: 'Maximum cost factor is 12 (higher values are very slow)' }
  return { valid: true }
}

export function hashPassword(password, rounds, bcrypt) {
  return bcrypt.hash(password, rounds)
}

export function verifyPassword(password, hash, bcrypt) {
  return bcrypt.compare(password, hash)
}
