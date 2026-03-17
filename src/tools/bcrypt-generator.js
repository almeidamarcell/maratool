import './hash-state.js'
import { validateCostFactor, hashPassword, verifyPassword } from './bcrypt-generator-core.js'
// Bcrypt Generator
;(function () {
  var tabs = document.querySelectorAll('.bcrypt-tab')
  var panels = document.querySelectorAll('.bcrypt-panel')
  var currentTab = 'hash'

  // Hash tab elements
  var hashPasswordInput = document.getElementById('bcrypt-password')
  var costInput = document.getElementById('bcrypt-cost')
  var costValue = document.getElementById('bcrypt-cost-value')
  var hashBtn = document.getElementById('bcrypt-hash-btn')
  var hashOutput = document.getElementById('bcrypt-hash-output')
  var hashCopyBtn = document.getElementById('bcrypt-hash-copy')
  var hashStatus = document.getElementById('bcrypt-hash-status')

  // Verify tab elements
  var verifyPasswordInput = document.getElementById('bcrypt-verify-password')
  var verifyHashInput = document.getElementById('bcrypt-verify-hash')
  var verifyBtn = document.getElementById('bcrypt-verify-btn')
  var verifyResult = document.getElementById('bcrypt-verify-result')

  var bcrypt = null

  async function loadBcrypt() {
    if (bcrypt) return bcrypt
    return new Promise(function (resolve) {
      var script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js'
      script.onload = function () {
        bcrypt = window.dcodeIO && window.dcodeIO.bcrypt || window.bcrypt
        resolve(bcrypt)
      }
      document.head.appendChild(script)
    })
  }

  function switchTab(tab) {
    currentTab = tab
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === tab)
    })
    panels.forEach(function (p) {
      p.style.display = p.dataset.panel === tab ? '' : 'none'
    })
    HashState.save({ tab: tab })
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { switchTab(t.dataset.tab) })
  })

  costInput.addEventListener('input', function () {
    costValue.textContent = costInput.value
  })

  hashBtn.addEventListener('click', async function () {
    var password = hashPasswordInput.value
    if (!password) return

    var cost = parseInt(costInput.value, 10)
    var validation = validateCostFactor(cost)
    if (!validation.valid) {
      hashStatus.textContent = validation.error
      hashStatus.className = 'bcrypt-status bcrypt-error'
      return
    }

    hashBtn.disabled = true
    hashBtn.textContent = 'Hashing…'
    hashStatus.textContent = 'Computing bcrypt hash (cost factor ' + cost + ')…'
    hashStatus.className = 'bcrypt-status'
    hashOutput.value = ''

    try {
      var lib = await loadBcrypt()
      var hash = await hashPassword(password, cost, lib)
      hashOutput.value = hash
      hashStatus.textContent = 'Hash generated.'
      hashStatus.className = 'bcrypt-status bcrypt-ok'
    } catch (e) {
      hashStatus.textContent = 'Error: ' + e.message
      hashStatus.className = 'bcrypt-status bcrypt-error'
    } finally {
      hashBtn.disabled = false
      hashBtn.textContent = 'Generate hash'
    }
  })

  hashCopyBtn.addEventListener('click', function () {
    if (!hashOutput.value) return
    navigator.clipboard.writeText(hashOutput.value).then(function () {
      var orig = hashCopyBtn.textContent
      hashCopyBtn.textContent = 'Copied!'
      setTimeout(function () { hashCopyBtn.textContent = orig }, 2000)
    })
  })

  verifyBtn.addEventListener('click', async function () {
    var password = verifyPasswordInput.value
    var hash = verifyHashInput.value.trim()
    if (!password || !hash) {
      verifyResult.textContent = 'Enter both a password and a hash.'
      verifyResult.className = 'bcrypt-verify-result bcrypt-error'
      return
    }

    verifyBtn.disabled = true
    verifyBtn.textContent = 'Verifying…'
    verifyResult.textContent = ''
    verifyResult.className = 'bcrypt-verify-result'

    try {
      var lib = await loadBcrypt()
      var match = await verifyPassword(password, hash, lib)
      if (match) {
        verifyResult.textContent = '✓ Match — the password matches this hash.'
        verifyResult.className = 'bcrypt-verify-result bcrypt-match'
      } else {
        verifyResult.textContent = '✗ No match — the password does not match this hash.'
        verifyResult.className = 'bcrypt-verify-result bcrypt-nomatch'
      }
    } catch (e) {
      verifyResult.textContent = 'Error: ' + e.message
      verifyResult.className = 'bcrypt-verify-result bcrypt-error'
    } finally {
      verifyBtn.disabled = false
      verifyBtn.textContent = 'Verify'
    }
  })

  // Restore state
  var saved = HashState.parse()
  if (saved.tab) switchTab(saved.tab)
})()
