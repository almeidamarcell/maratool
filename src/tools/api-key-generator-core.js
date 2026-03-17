var VALID_FORMATS = ['hex', 'base64', 'alphanumeric']
var ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function validateApiKeyOptions(options) {
  if (!VALID_FORMATS.includes(options.format)) {
    return { valid: false, error: 'Format must be one of: ' + VALID_FORMATS.join(', ') }
  }
  if (options.length < 8) {
    return { valid: false, error: 'Length must be at least 8' }
  }
  if (options.length > 128) {
    return { valid: false, error: 'Length must be at most 128' }
  }
  return { valid: true }
}

export function generateApiKey(options) {
  var format = options.format
  var length = options.length

  if (format === 'hex') {
    var bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    return Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, '0') }).join('')
  }

  if (format === 'base64') {
    var rawBytes = new Uint8Array(length)
    crypto.getRandomValues(rawBytes)
    var binary = ''
    for (var i = 0; i < rawBytes.length; i++) binary += String.fromCharCode(rawBytes[i])
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_')
  }

  if (format === 'alphanumeric') {
    var arr = new Uint32Array(length)
    crypto.getRandomValues(arr)
    return Array.from(arr).map(function (n) { return ALPHANUM[n % ALPHANUM.length] }).join('')
  }

  return ''
}
