// UUID Generator
(function () {
  const versionSelect = document.getElementById('uuid-version')
  const quantityInput = document.getElementById('uuid-quantity')
  const generateBtn = document.getElementById('uuid-generate')
  const output = document.getElementById('uuid-output')
  const copyAllBtn = document.getElementById('uuid-copy-all')

  function generateV4() {
    return crypto.randomUUID()
  }

  function generateV1() {
    // Simple v1-like UUID using timestamp (not spec-compliant but useful)
    const now = Date.now()
    const timeHex = now.toString(16).padStart(12, '0')
    const rand = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0')
    return [
      timeHex.slice(-8),
      timeHex.slice(-12, -8),
      '1' + timeHex.slice(0, 3),
      (Math.floor(Math.random() * 0x4000) | 0x8000).toString(16),
      rand() + rand() + rand()
    ].join('-')
  }

  function generateV5(name) {
    // Simplified: hash using available tools for demo
    // In production, use a proper SHA-1 implementation
    let hash = 0
    const str = 'ns:' + name + Date.now()
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    const h = Math.abs(hash).toString(16).padStart(8, '0')
    const r = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0')
    return [h, r(), '5' + r().slice(1), (Math.floor(Math.random() * 0x4000) | 0x8000).toString(16), r() + r() + r()].join('-')
  }

  function generate() {
    const version = versionSelect.value
    const qty = Math.min(100, Math.max(1, parseInt(quantityInput.value) || 1))
    quantityInput.value = qty

    const uuids = []
    for (let i = 0; i < qty; i++) {
      if (version === 'v4') uuids.push(generateV4())
      else if (version === 'v1') uuids.push(generateV1())
      else uuids.push(generateV5('maratool'))
    }

    output.innerHTML = ''
    uuids.forEach(uuid => {
      const item = document.createElement('li')
      item.className = 'uuid-item'
      item.innerHTML = `
        <span class="uuid-value">${uuid}</span>
        <button class="copy-btn" data-value="${uuid}">Copy</button>
      `
      output.appendChild(item)
    })

    copyAllBtn.style.display = 'inline-flex'

    output.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.value).then(() => {
          btn.textContent = 'Copied!'
          btn.classList.add('copied')
          setTimeout(() => {
            btn.textContent = 'Copy'
            btn.classList.remove('copied')
          }, 2000)
        })
      })
    })
  }

  generateBtn.addEventListener('click', generate)

  copyAllBtn.addEventListener('click', () => {
    const all = [...output.querySelectorAll('.uuid-value')].map(el => el.textContent).join('\n')
    navigator.clipboard.writeText(all).then(() => {
      copyAllBtn.textContent = 'Copied!'
      copyAllBtn.classList.add('copied')
      setTimeout(() => {
        copyAllBtn.textContent = 'Copy all'
        copyAllBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Generate one on load
  generate()
})()
