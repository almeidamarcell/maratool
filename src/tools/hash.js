// Hash Generator — MD5 (pure JS) + SHA-1/256/512 (Web Crypto API)
(function () {
  const input = document.getElementById('hash-input')
  const outputs = {
    md5: document.getElementById('hash-md5'),
    sha1: document.getElementById('hash-sha1'),
    sha256: document.getElementById('hash-sha256'),
    sha512: document.getElementById('hash-sha512'),
  }

  // ---- MD5 pure JS implementation ----
  function md5(str) {
    function safeAdd(x, y) { const lsw = (x & 0xFFFF) + (y & 0xFFFF); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xFFFF) }
    function bitRotate(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)) }
    function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotate(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b) }
    function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t) }
    function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t) }
    function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t) }
    function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t) }

    const bs = unescape(encodeURIComponent(str))
    const l = bs.length
    const ws = []
    for (let i = 0; i < l; i++) ws[i >> 2] = (ws[i >> 2] || 0) | (bs.charCodeAt(i) << ((i % 4) * 8))
    ws[l >> 2] |= 0x80 << ((l % 4) * 8)
    ws[(((l + 8) >> 6) << 4) + 14] = l * 8

    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878

    for (let i = 0; i < ws.length; i += 16) {
      const [oa, ob, oc, od] = [a, b, c, d]
      a = md5ff(a,b,c,d,ws[i],7,-680876936);d=md5ff(d,a,b,c,ws[i+1],12,-389564586);c=md5ff(c,d,a,b,ws[i+2],17,606105819);b=md5ff(b,c,d,a,ws[i+3],22,-1044525330)
      a=md5ff(a,b,c,d,ws[i+4],7,-176418897);d=md5ff(d,a,b,c,ws[i+5],12,1200080426);c=md5ff(c,d,a,b,ws[i+6],17,-1473231341);b=md5ff(b,c,d,a,ws[i+7],22,-45705983)
      a=md5ff(a,b,c,d,ws[i+8],7,1770035416);d=md5ff(d,a,b,c,ws[i+9],12,-1958414417);c=md5ff(c,d,a,b,ws[i+10],17,-42063);b=md5ff(b,c,d,a,ws[i+11],22,-1990404162)
      a=md5ff(a,b,c,d,ws[i+12],7,1804603682);d=md5ff(d,a,b,c,ws[i+13],12,-40341101);c=md5ff(c,d,a,b,ws[i+14],17,-1502002290);b=md5ff(b,c,d,a,ws[i+15],22,1236535329)
      a=md5gg(a,b,c,d,ws[i+1],5,-165796510);d=md5gg(d,a,b,c,ws[i+6],9,-1069501632);c=md5gg(c,d,a,b,ws[i+11],14,643717713);b=md5gg(b,c,d,a,ws[i],20,-373897302)
      a=md5gg(a,b,c,d,ws[i+5],5,-701558691);d=md5gg(d,a,b,c,ws[i+10],9,38016083);c=md5gg(c,d,a,b,ws[i+15],14,-660478335);b=md5gg(b,c,d,a,ws[i+4],20,-405537848)
      a=md5gg(a,b,c,d,ws[i+9],5,568446438);d=md5gg(d,a,b,c,ws[i+14],9,-1019803690);c=md5gg(c,d,a,b,ws[i+3],14,-187363961);b=md5gg(b,c,d,a,ws[i+8],20,1163531501)
      a=md5gg(a,b,c,d,ws[i+13],5,-1444681467);d=md5gg(d,a,b,c,ws[i+2],9,-51403784);c=md5gg(c,d,a,b,ws[i+7],14,1735328473);b=md5gg(b,c,d,a,ws[i+12],20,-1926607734)
      a=md5hh(a,b,c,d,ws[i+5],4,-378558);d=md5hh(d,a,b,c,ws[i+8],11,-2022574463);c=md5hh(c,d,a,b,ws[i+11],16,1839030562);b=md5hh(b,c,d,a,ws[i+14],23,-35309556)
      a=md5hh(a,b,c,d,ws[i+1],4,-1530992060);d=md5hh(d,a,b,c,ws[i+4],11,1272893353);c=md5hh(c,d,a,b,ws[i+7],16,-155497632);b=md5hh(b,c,d,a,ws[i+10],23,-1094730640)
      a=md5hh(a,b,c,d,ws[i+13],4,681279174);d=md5hh(d,a,b,c,ws[i],11,-358537222);c=md5hh(c,d,a,b,ws[i+3],16,-722521979);b=md5hh(b,c,d,a,ws[i+6],23,76029189)
      a=md5hh(a,b,c,d,ws[i+9],4,-640364487);d=md5hh(d,a,b,c,ws[i+12],11,-421815835);c=md5hh(c,d,a,b,ws[i+15],16,530742520);b=md5hh(b,c,d,a,ws[i+2],23,-995338651)
      a=md5ii(a,b,c,d,ws[i],6,-198630844);d=md5ii(d,a,b,c,ws[i+7],10,1126891415);c=md5ii(c,d,a,b,ws[i+14],15,-1416354905);b=md5ii(b,c,d,a,ws[i+5],21,-57434055)
      a=md5ii(a,b,c,d,ws[i+12],6,1700485571);d=md5ii(d,a,b,c,ws[i+3],10,-1894986606);c=md5ii(c,d,a,b,ws[i+10],15,-1051523);b=md5ii(b,c,d,a,ws[i+1],21,-2054922799)
      a=md5ii(a,b,c,d,ws[i+8],6,1873313359);d=md5ii(d,a,b,c,ws[i+15],10,-30611744);c=md5ii(c,d,a,b,ws[i+6],15,-1560198380);b=md5ii(b,c,d,a,ws[i+13],21,1309151649)
      a=md5ii(a,b,c,d,ws[i+4],6,-145523070);d=md5ii(d,a,b,c,ws[i+11],10,-1120210379);c=md5ii(c,d,a,b,ws[i+2],15,718787259);b=md5ii(b,c,d,a,ws[i+9],21,-343485551)
      a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od)
    }

    return [a, b, c, d].map(n => {
      let s = ''
      for (let j = 0; j < 4; j++) s += ('0' + ((n >> (j * 8)) & 0xFF).toString(16)).slice(-2)
      return s
    }).join('')
  }

  // ---- SHA via Web Crypto ----
  async function sha(algorithm, text) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest(algorithm, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  function setCopyBtn(btn, value) {
    btn.onclick = () => {
      navigator.clipboard.writeText(value).then(() => {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = 'Copy'
          btn.classList.remove('copied')
        }, 2000)
      })
    }
  }

  async function update() {
    const text = input.value
    if (!text) {
      Object.values(outputs).forEach(o => { o.querySelector('.hash-value').textContent = '—' })
      return
    }

    // MD5 (sync)
    const md5val = md5(text)
    outputs.md5.querySelector('.hash-value').textContent = md5val
    setCopyBtn(outputs.md5.querySelector('.copy-btn'), md5val)

    // SHA (async)
    const [sha1val, sha256val, sha512val] = await Promise.all([
      sha('SHA-1', text),
      sha('SHA-256', text),
      sha('SHA-512', text),
    ])

    outputs.sha1.querySelector('.hash-value').textContent = sha1val
    outputs.sha256.querySelector('.hash-value').textContent = sha256val
    outputs.sha512.querySelector('.hash-value').textContent = sha512val

    setCopyBtn(outputs.sha1.querySelector('.copy-btn'), sha1val)
    setCopyBtn(outputs.sha256.querySelector('.copy-btn'), sha256val)
    setCopyBtn(outputs.sha512.querySelector('.copy-btn'), sha512val)
  }

  input.addEventListener('input', update)
})()
