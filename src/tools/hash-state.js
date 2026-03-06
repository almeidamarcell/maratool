export function encode(state) {
  var pairs = []
  for (var key in state) {
    if (state[key] === '' || state[key] == null) continue
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(state[key]))
  }
  return pairs.join('&')
}

export function decode(hash) {
  var state = {}
  if (!hash) return state
  var parts = hash.split('&')
  for (var i = 0; i < parts.length; i++) {
    var idx = parts[i].indexOf('=')
    if (idx === -1) continue
    var key = decodeURIComponent(parts[i].slice(0, idx))
    var val = decodeURIComponent(parts[i].slice(idx + 1))
    state[key] = val
  }
  return state
}

export function debounce(fn, ms) {
  var timer
  return function () {
    clearTimeout(timer)
    timer = setTimeout(fn, ms)
  }
}

var MAX_HASH_LENGTH = 1800

export function parse() {
  var hash = (typeof window !== 'undefined' && window.location.hash || '').replace(/^#/, '')
  return decode(hash)
}

var _saveTimer = null

export function save(state) {
  if (typeof window === 'undefined') return
  clearTimeout(_saveTimer)
  _saveTimer = setTimeout(function () {
    var encoded = encode(state)
    if (encoded.length > MAX_HASH_LENGTH) {
      encoded = encoded.slice(0, MAX_HASH_LENGTH)
    }
    history.replaceState(null, '', encoded ? '#' + encoded : window.location.pathname)
  }, 300)
}

// Browser global
if (typeof window !== 'undefined') {
  window.HashState = { encode: encode, decode: decode, parse: parse, save: save, debounce: debounce }
}
