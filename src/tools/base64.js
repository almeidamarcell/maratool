import { attachCopyButton } from './tool-utils.js'
import './hash-state.js'
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
      if (typeof saveHash === 'function') saveHash()
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

  function getActiveTab() {
    var active = document.querySelector('.tool-tab.active')
    return active ? active.dataset.panel : 'tab-text'
  }

  function saveHash() {
    HashState.save({ tab: getActiveTab(), text: textInput.value, encoded: b64Output.value })
  }

  textInput.addEventListener('input', () => {
    textInput.classList.remove('error-state')
    encodeText()
    saveHash()
  })

  b64Output.addEventListener('input', () => {
    b64Output.classList.remove('error-state')
    decodeText()
    saveHash()
  })

  attachCopyButton(copyTextBtn, () => b64Output.value, { idle: 'Copy Base64' })

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

  attachCopyButton(copyImageBtn, () => imageOutput.value, { idle: 'Copy Base64' })

  // ---- HASH STATE RESTORE ----
  var saved = HashState.parse()
  if (saved.tab) {
    var tabEl = document.querySelector('.tool-tab[data-panel="' + saved.tab + '"]')
    if (tabEl) tabEl.click()
  }
  if (saved.text) {
    textInput.value = saved.text
    encodeText()
  } else if (saved.encoded) {
    b64Output.value = saved.encoded
    decodeText()
  }
})()
