import './hash-state.js'
// Text to Binary Converter
(function () {
  const tabs = document.querySelectorAll('.tool-tab')
  const panels = document.querySelectorAll('.tab-panel')

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      panels.forEach(p => p.style.display = 'none')
      tab.classList.add('active')
      const target = document.getElementById(tab.dataset.panel)
      if (target) target.style.display = 'block'
      if (typeof saveHash === 'function') saveHash()
    })
  })

  // ---- Text → Binary ----
  const textIn = document.getElementById('bin-text-input')
  const binOut = document.getElementById('bin-binary-output')
  const hexOut = document.getElementById('bin-hex-output')
  const decOut = document.getElementById('bin-decimal-output')

  function textToBin() {
    const text = textIn.value
    if (!text) {
      binOut.textContent = ''
      hexOut.textContent = ''
      decOut.textContent = ''
      return
    }
    const bytes = Array.from(new TextEncoder().encode(text))
    binOut.textContent = bytes.map(b => b.toString(2).padStart(8, '0')).join(' ')
    hexOut.textContent = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')
    decOut.textContent = bytes.join(' ')
  }

  function getActiveTab() {
    var active = document.querySelector('.tool-tab.active')
    return active ? active.dataset.panel : 'tab-text-bin'
  }

  function saveHash() {
    HashState.save({ tab: getActiveTab(), text: textIn.value, binary: binIn.value })
  }

  textIn.addEventListener('input', function () {
    textToBin()
    saveHash()
  })

  document.querySelectorAll('[data-copy-from]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = document.getElementById(btn.dataset.copyFrom).textContent
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

  // ---- Binary → Text ----
  const binIn = document.getElementById('bin-binary-input')
  const textOut = document.getElementById('bin-text-output')
  const binDecodeBtn = document.getElementById('bin-decode-btn')

  function binToText() {
    const raw = binIn.value.trim()
    if (!raw) {
      textOut.textContent = ''
      textOut.classList.remove('error-state')
      return
    }
    try {
      const bytes = raw.split(/\s+/).map(b => {
        const n = parseInt(b, 2)
        if (isNaN(n) || b.length === 0) throw new Error('Invalid binary: ' + b)
        return n
      })
      textOut.textContent = new TextDecoder().decode(new Uint8Array(bytes))
      textOut.classList.remove('error-state')
    } catch (e) {
      textOut.textContent = 'Error: ' + e.message
      textOut.classList.add('error-state')
    }
  }

  binIn.addEventListener('input', function () {
    binToText()
    saveHash()
  })

  const copyBinOut = document.getElementById('bin-copy-output')
  if (copyBinOut) {
    copyBinOut.addEventListener('click', () => {
      navigator.clipboard.writeText(textOut.textContent).then(() => {
        copyBinOut.textContent = 'Copied!'
        copyBinOut.classList.add('copied')
        setTimeout(() => {
          copyBinOut.textContent = 'Copy'
          copyBinOut.classList.remove('copied')
        }, 2000)
      })
    })
  }

  // ---- HASH STATE RESTORE ----
  var saved = HashState.parse()
  if (saved.tab) {
    var tabEl = document.querySelector('.tool-tab[data-panel="' + saved.tab + '"]')
    if (tabEl) tabEl.click()
  }
  if (saved.tab === 'tab-bin-text' && saved.binary) {
    binIn.value = saved.binary
    binToText()
  } else if (saved.text) {
    textIn.value = saved.text
    textToBin()
  }
})()
