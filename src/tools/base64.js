// Base64 Encode/Decode
(function () {
  // ---- TAB SWITCHING ----
  const tabs = document.querySelectorAll('.tool-tab')
  const panels = document.querySelectorAll('.tab-panel')

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      panels.forEach(p => p.style.display = 'none')
      tab.classList.add('active')
      const target = document.getElementById(tab.dataset.panel)
      if (target) target.style.display = 'block'
    })
  })

  // ---- TEXT TAB ----
  const textInput = document.getElementById('b64-text')
  const b64Output = document.getElementById('b64-encoded')
  const copyTextBtn = document.getElementById('b64-text-copy')

  let updating = false

  function encodeText() {
    if (updating) return
    updating = true
    try {
      b64Output.value = btoa(unescape(encodeURIComponent(textInput.value)))
      b64Output.classList.remove('error-state')
    } catch (e) {
      b64Output.value = 'Error: could not encode'
      b64Output.classList.add('error-state')
    }
    updating = false
  }

  function decodeText() {
    if (updating) return
    updating = true
    try {
      textInput.value = decodeURIComponent(escape(atob(b64Output.value)))
      textInput.classList.remove('error-state')
    } catch (e) {
      textInput.classList.add('error-state')
    }
    updating = false
  }

  textInput.addEventListener('input', () => {
    textInput.classList.remove('error-state')
    encodeText()
  })

  b64Output.addEventListener('input', () => {
    b64Output.classList.remove('error-state')
    decodeText()
  })

  copyTextBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(b64Output.value).then(() => {
      copyTextBtn.textContent = 'Copied!'
      copyTextBtn.classList.add('copied')
      setTimeout(() => {
        copyTextBtn.textContent = 'Copy Base64'
        copyTextBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // ---- IMAGE TAB ----
  const imageInput = document.getElementById('b64-image-file')
  const imageOutput = document.getElementById('b64-image-output')
  const imagePreview = document.getElementById('b64-image-preview')
  const copyImageBtn = document.getElementById('b64-image-copy')

  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      imageOutput.value = dataUrl
      imagePreview.src = dataUrl
      imagePreview.style.display = 'block'
      copyImageBtn.style.display = 'inline-flex'
    }
    reader.readAsDataURL(file)
  })

  copyImageBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(imageOutput.value).then(() => {
      copyImageBtn.textContent = 'Copied!'
      copyImageBtn.classList.add('copied')
      setTimeout(() => {
        copyImageBtn.textContent = 'Copy Base64'
        copyImageBtn.classList.remove('copied')
      }, 2000)
    })
  })
})()
