import { attachCopyButton, setVisible } from './tool-utils.js'

// HTML Escape / Unescape — bidirectional, table-driven.
//
// Unescaping never touches innerHTML. Assigning untrusted text to innerHTML to
// "let the browser decode it" also runs any <script>, <img onerror>, or
// <svg onload> the string carries. The lookup table plus a numeric regex does
// the same job with no parser and no execution path.
;(function () {
  var raw = document.getElementById('hesc-raw')
  var escaped = document.getElementById('hesc-escaped')
  var nonAsciiEl = document.getElementById('hesc-nonascii')
  var quotesEl = document.getElementById('hesc-quotes')
  var errorEl = document.getElementById('hesc-error')
  var copyRaw = document.getElementById('hesc-copy-raw')
  var copyEscaped = document.getElementById('hesc-copy-escaped')
  var clearBtn = document.getElementById('hesc-clear')
  var statEntities = document.getElementById('hesc-stat-entities')
  var statUnknown = document.getElementById('hesc-stat-unknown')
  var statGrowth = document.getElementById('hesc-stat-growth')

  if (!raw || !escaped) return

  // &apos; is XML/HTML5 only — IE8 and some legacy XHTML parsers render it
  // literally, so the numeric &#39; is the safe apostrophe on output. Both are
  // accepted on input.
  var ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  var NAMED = {
    amp: 38, lt: 60, gt: 62, quot: 34, apos: 39, nbsp: 160,
    iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166,
    sect: 167, uml: 168, copy: 169, ordf: 170, laquo: 171, not: 172,
    shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178,
    sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184,
    sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190,
    iquest: 191, times: 215, divide: 247,
    Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197,
    AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203,
    Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209,
    Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, Oslash: 216,
    Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221, THORN: 222,
    szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227, auml: 228,
    aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234,
    euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240,
    ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246,
    oslash: 248, ugrave: 249, uacute: 250, ucirc: 251, uuml: 252, yacute: 253,
    thorn: 254, yuml: 255,
    OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402,
    circ: 710, tilde: 732,
    ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206,
    rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218,
    ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225,
    bull: 8226, hellip: 8230, permil: 8240, prime: 8242, Prime: 8243,
    lsaquo: 8249, rsaquo: 8250, oline: 8254, frasl: 8260, euro: 8364,
    trade: 8482, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596,
    crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659, hArr: 8660,
    forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711,
    isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721, minus: 8722,
    lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736, and: 8743,
    or: 8744, cap: 8745, cup: 8746, int: 8747, there4: 8756, sim: 8764,
    cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805,
    sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853,
    otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969,
    lfloor: 8970, rfloor: 8971, loz: 9674, spades: 9824, clubs: 9827,
    hearts: 9829, diams: 9830,
    Alpha: 913, Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918,
    Eta: 919, Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924,
    Nu: 925, Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932,
    Upsilon: 933, Phi: 934, Chi: 935, Psi: 936, Omega: 937,
    alpha: 945, beta: 946, gamma: 947, delta: 948, epsilon: 949, zeta: 950,
    eta: 951, theta: 952, iota: 953, kappa: 954, lambda: 955, mu: 956,
    nu: 957, xi: 958, omicron: 959, pi: 960, rho: 961, sigmaf: 962,
    sigma: 963, tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968,
    omega: 969,
  }

  // Windows-1252 bytes smuggled in as numeric references. &#151; is a real
  // thing in scraped content and decodes to U+0097 (a control char) if taken
  // literally; browsers remap it, so we do too.
  var CP1252 = {
    128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230, 134: 8224, 135: 8225,
    136: 710, 137: 8240, 138: 352, 139: 8249, 140: 338, 142: 381, 145: 8216,
    146: 8217, 147: 8220, 148: 8221, 149: 8226, 150: 8211, 151: 8212, 152: 732,
    153: 8482, 154: 353, 155: 8250, 156: 339, 158: 382, 159: 376,
  }

  var ENTITY_RE = /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,31});/g

  var lastUnknown = []

  function fromCodePoint(code) {
    if (CP1252[code]) code = CP1252[code]
    // Surrogate halves and out-of-range values are not valid scalar values;
    // String.fromCodePoint throws on the latter.
    if (code < 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return null
    return String.fromCodePoint(code)
  }

  function escapeHtml(text, opts) {
    var out = ''
    // Iterate by code point, not by UTF-16 unit, so an emoji is one item and
    // never gets split into two broken numeric references.
    var chars = Array.from(text)
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i]
      if (ch === '"' || ch === "'") {
        out += opts.quotes ? ESCAPE_MAP[ch] : ch
        continue
      }
      if (ESCAPE_MAP[ch]) { out += ESCAPE_MAP[ch]; continue }
      var code = ch.codePointAt(0)
      if (opts.nonAscii && code > 127) { out += '&#' + code + ';'; continue }
      out += ch
    }
    return out
  }

  function unescapeHtml(text) {
    var unknown = {}
    var result = text.replace(ENTITY_RE, function (match, body) {
      var ch
      if (body.charAt(0) === '#') {
        var hex = body.charAt(1) === 'x' || body.charAt(1) === 'X'
        var code = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10)
        ch = isNaN(code) ? null : fromCodePoint(code)
      } else if (Object.prototype.hasOwnProperty.call(NAMED, body)) {
        ch = fromCodePoint(NAMED[body])
      } else {
        // Unrecognized name: leave the source text untouched rather than
        // guessing. Deleting it would silently corrupt the input.
        unknown[body] = true
        return match
      }
      return ch === null ? match : ch
    })
    lastUnknown = Object.keys(unknown)
    return result
  }

  var updating = false
  var lastEdited = 'raw'

  function options() {
    return {
      nonAscii: !!(nonAsciiEl && nonAsciiEl.checked),
      quotes: !quotesEl || quotesEl.checked,
    }
  }

  function updateStats() {
    if (!statEntities) return
    var matches = escaped.value.match(ENTITY_RE)
    statEntities.textContent = String(matches ? matches.length : 0)
    statUnknown.textContent = String(lastUnknown.length)
    var a = raw.value.length
    var b = escaped.value.length
    statGrowth.textContent = a && b ? (b - a >= 0 ? '+' : '') + (b - a) + ' chars' : '—'
  }

  function note() {
    if (!errorEl) return
    if (lastEdited === 'escaped' && lastUnknown.length) {
      var list = lastUnknown.slice(0, 6).map(function (n) { return '&' + n + ';' }).join(', ')
      errorEl.textContent = 'Left as-is, not a known HTML entity: ' + list +
        (lastUnknown.length > 6 ? ' and ' + (lastUnknown.length - 6) + ' more.' : '')
      setVisible(errorEl, true)
    } else {
      setVisible(errorEl, false)
    }
  }

  function runEscape() {
    if (updating) return
    updating = true
    escaped.value = escapeHtml(raw.value, options())
    lastUnknown = []
    updating = false
    note()
    updateStats()
  }

  function runUnescape() {
    if (updating) return
    updating = true
    raw.value = unescapeHtml(escaped.value)
    updating = false
    note()
    updateStats()
  }

  raw.addEventListener('input', function () { lastEdited = 'raw'; runEscape() })
  escaped.addEventListener('input', function () { lastEdited = 'escaped'; runUnescape() })

  ;[nonAsciiEl, quotesEl].forEach(function (el) {
    if (el) el.addEventListener('change', function () {
      if (lastEdited === 'escaped') runUnescape()
      else runEscape()
    })
  })

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      updating = true
      raw.value = ''
      escaped.value = ''
      updating = false
      lastEdited = 'raw'
      lastUnknown = []
      note()
      updateStats()
      raw.focus()
    })
  }

  if (copyRaw) attachCopyButton(copyRaw, function () { return raw.value }, { idle: 'Copy plain text' })
  if (copyEscaped) attachCopyButton(copyEscaped, function () { return escaped.value }, { idle: 'Copy escaped' })

  if (!raw.value && !escaped.value) {
    raw.value = '<a href="/docs?a=1&b=2" title="Café & Croissant">Read the “docs”</a>'
    runEscape()
  } else {
    updateStats()
  }
})()
