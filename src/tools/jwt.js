import './hash-state.js'
// JWT Decoder
(function () {
  const input = document.getElementById('jwt-input')
  const headerOut = document.getElementById('jwt-header')
  const payloadOut = document.getElementById('jwt-payload')
  const sigOut = document.getElementById('jwt-signature')

  function base64urlDecode(str) {
    // Convert base64url to base64
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding
    while (b64.length % 4) b64 += '='
    try {
      return decodeURIComponent(
        Array.from(atob(b64), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      )
    } catch {
      return atob(b64)
    }
  }

  function prettyJson(str) {
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }

  function decode() {
    const raw = input.value.replace(/\s+/g, '')
    const token = raw

    if (!token) {
      headerOut.textContent = ''
      payloadOut.textContent = ''
      sigOut.textContent = ''
      ;[headerOut, payloadOut, sigOut].forEach(el => el.classList.remove('error-state'))
      return
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      const msg = 'Invalid JWT: expected 3 parts separated by "."\nGot ' + parts.length + ' part(s).'
      headerOut.textContent = msg
      payloadOut.textContent = ''
      sigOut.textContent = ''
      headerOut.classList.add('error-state')
      payloadOut.classList.remove('error-state')
      sigOut.classList.remove('error-state')
      return
    }

    ;[headerOut, payloadOut, sigOut].forEach(el => el.classList.remove('error-state'))

    try {
      headerOut.textContent = prettyJson(base64urlDecode(parts[0]))
    } catch {
      headerOut.textContent = 'Error decoding header'
      headerOut.classList.add('error-state')
    }

    try {
      payloadOut.textContent = prettyJson(base64urlDecode(parts[1]))
    } catch {
      payloadOut.textContent = 'Error decoding payload'
      payloadOut.classList.add('error-state')
    }

    sigOut.textContent = parts[2]
  }

  var saved = HashState.parse()
  if (saved.input) {
    input.value = saved.input
    decode()
  }

  input.addEventListener('input', function () {
    decode()
    HashState.save({ input: input.value })
  })

  // Copy buttons
  document.querySelectorAll('[data-copy-from]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sourceId = btn.dataset.copyFrom
      const text = document.getElementById(sourceId).textContent
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = 'Copy'
          btn.classList.remove('copied')
        }, 2000)
      })
    })
  })
})()
