;(function () {
  var message = document.getElementById('hmac-message')
  var secret = document.getElementById('hmac-secret')
  var algo = document.getElementById('hmac-algo')
  var output = document.getElementById('hmac-output')
  var copyBtn = document.getElementById('hmac-copy')

  async function update() {
    var msg = message.value
    var key = secret.value
    if (!msg || !key) {
      output.textContent = '—'
      return
    }
    try {
      var enc = new TextEncoder()
      var cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: algo.value }, false, ['sign'])
      var sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg))
      var hex = Array.from(new Uint8Array(sig)).map(function (b) { return b.toString(16).padStart(2, '0') }).join('')
      output.textContent = hex
    } catch (e) {
      output.textContent = 'Error: ' + e.message
    }
  }

  ;[message, secret, algo].forEach(function (el) {
    el.addEventListener('input', update)
    el.addEventListener('change', update)
  })

  copyBtn.addEventListener('click', function () {
    if (output.textContent === '—') return
    navigator.clipboard.writeText(output.textContent).then(function () {
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = 'Copy' }, 2000)
    })
  })
})()
