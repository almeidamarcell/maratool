(function () {
  var decInput = document.getElementById('bc-dec')
  var hexInput = document.getElementById('bc-hex')
  var binInput = document.getElementById('bc-bin')
  var octInput = document.getElementById('bc-oct')
  var bitsContainer = document.getElementById('bc-bits')

  var BIT_COUNT = 16
  var currentValue = 0
  var updating = false

  // ── Bit visualization ──

  function buildBits() {
    bitsContainer.innerHTML = ''
    for (var i = BIT_COUNT - 1; i >= 0; i--) {
      var bit = document.createElement('div')
      bit.className = 'bc-bit'
      bit.setAttribute('data-bit', i)
      bit.textContent = '0'
      bitsContainer.appendChild(bit)
      // Add separator every 4 bits
      if (i > 0 && i % 4 === 0) {
        var sep = document.createElement('div')
        sep.className = 'bc-bit-sep'
        bitsContainer.appendChild(sep)
      }
    }
  }

  function updateBits(num) {
    for (var i = BIT_COUNT - 1; i >= 0; i--) {
      var bitEl = bitsContainer.querySelector('[data-bit="' + i + '"]')
      if (!bitEl) continue
      var on = (num >> i) & 1
      bitEl.textContent = on ? '1' : '0'
      if (on) {
        bitEl.classList.add('on')
      } else {
        bitEl.classList.remove('on')
      }
    }
  }

  // ── Convert and update all fields ──

  function updateAll(num, source) {
    if (updating) return
    updating = true

    currentValue = num

    if (source !== 'dec') decInput.value = num.toString(10)
    if (source !== 'hex') hexInput.value = num.toString(16).toUpperCase()
    if (source !== 'bin') binInput.value = num.toString(2)
    if (source !== 'oct') octInput.value = num.toString(8)

    updateBits(num)
    updating = false
  }

  function clearAll(source) {
    if (updating) return
    updating = true
    if (source !== 'dec') decInput.value = ''
    if (source !== 'hex') hexInput.value = ''
    if (source !== 'bin') binInput.value = ''
    if (source !== 'oct') octInput.value = ''
    currentValue = 0
    updateBits(0)
    updating = false
  }

  function handleInput(input, base, source) {
    input.addEventListener('input', function () {
      var val = input.value.trim()
      if (val === '') { clearAll(source); return }
      // Remove common prefixes
      val = val.replace(/^0x/i, '').replace(/^0b/i, '').replace(/^0o/i, '')
      var num = parseInt(val, base)
      if (isNaN(num) || num < 0) return
      updateAll(num, source)
    })
  }

  handleInput(decInput, 10, 'dec')
  handleInput(hexInput, 16, 'hex')
  handleInput(binInput, 2, 'bin')
  handleInput(octInput, 8, 'oct')

  // ── Bit click toggling ──

  bitsContainer.addEventListener('click', function (e) {
    var bitEl = e.target.closest('.bc-bit')
    if (!bitEl) return
    var idx = parseInt(bitEl.getAttribute('data-bit'))
    currentValue ^= (1 << idx)
    if (currentValue < 0) currentValue = 0
    updateAll(currentValue, 'bits')
  })

  // ── Copy buttons ──

  function copyText(text, btn) {
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      var orig = btn.textContent
      btn.textContent = 'Copied!'
      btn.classList.add('copied')
      setTimeout(function () {
        btn.textContent = orig
        btn.classList.remove('copied')
      }, 2000)
    })
  }

  document.querySelectorAll('[data-bc-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field = btn.getAttribute('data-bc-copy')
      var input = document.getElementById('bc-' + field)
      if (input) copyText(input.value, btn)
    })
  })

  // ── Init ──

  buildBits()
  updateBits(0)
})()
