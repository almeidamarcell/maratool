var UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
var UPPER_AMBIGUOUS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
var LOWER = 'abcdefghjkmnpqrstuvwxyz'
var LOWER_AMBIGUOUS = 'abcdefghijklmnopqrstuvwxyz'
var DIGITS = '23456789'
var DIGITS_AMBIGUOUS = '0123456789'
var SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'

export function getCharSets(options) {
  var set = ''
  if (options.upper) set += options.excludeAmbiguous ? UPPER : UPPER_AMBIGUOUS
  if (options.lower) set += options.excludeAmbiguous ? LOWER : LOWER_AMBIGUOUS
  if (options.digits) set += options.excludeAmbiguous ? DIGITS : DIGITS_AMBIGUOUS
  if (options.symbols) set += SYMBOLS
  return set
}

export function generatePassword(length, charSets) {
  if (!charSets || length <= 0) return ''
  var array = new Uint32Array(length)
  crypto.getRandomValues(array)
  var result = ''
  for (var i = 0; i < length; i++) {
    result += charSets[array[i] % charSets.length]
  }
  return result
}

export function calculateStrength(password) {
  // 4 criteria: length>=12, uppercase, digits, symbols
  var score = 0
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  var labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return { score: score, label: labels[score] }
}
