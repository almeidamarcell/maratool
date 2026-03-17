import './hash-state.js'
import { normalizeUrl, validateUrl, buildUtmUrl } from './utm-builder-core.js'
// UTM Builder
;(function () {
  var urlInput = document.getElementById('utm-url')
  var sourceInput = document.getElementById('utm-source')
  var mediumInput = document.getElementById('utm-medium')
  var campaignInput = document.getElementById('utm-campaign')
  var termInput = document.getElementById('utm-term')
  var contentInput = document.getElementById('utm-content')

  var output = document.getElementById('utm-output')
  var copyBtn = document.getElementById('utm-copy')
  var resetBtn = document.getElementById('utm-reset')
  var shareBtn = document.getElementById('utm-share')
  var urlError = document.getElementById('utm-url-error')

  function getState() {
    return {
      url: urlInput.value,
      source: sourceInput.value,
      medium: mediumInput.value,
      campaign: campaignInput.value,
      term: termInput.value,
      content: contentInput.value,
    }
  }

  function setState(state) {
    if (state.url) urlInput.value = state.url
    if (state.source) sourceInput.value = state.source
    if (state.medium) mediumInput.value = state.medium
    if (state.campaign) campaignInput.value = state.campaign
    if (state.term) termInput.value = state.term
    if (state.content) contentInput.value = state.content
  }

  function generate() {
    var raw = urlInput.value.trim()
    urlError.textContent = ''

    if (!raw) {
      output.value = ''
      HashState.save(getState())
      return
    }

    var normalized = normalizeUrl(raw)
    var validation = validateUrl(normalized)

    if (!validation.valid) {
      urlError.textContent = validation.error
      output.value = ''
      HashState.save(getState())
      return
    }

    var result = buildUtmUrl(normalized, {
      source: sourceInput.value.trim(),
      medium: mediumInput.value.trim(),
      campaign: campaignInput.value.trim(),
      term: termInput.value.trim(),
      content: contentInput.value.trim(),
    })

    output.value = result
    HashState.save(getState())
  }

  function copyText(text, btn, label) {
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      var original = btn.textContent
      btn.textContent = label || 'Copied!'
      setTimeout(function () { btn.textContent = original }, 2000)
    })
  }

  copyBtn.addEventListener('click', function () {
    copyText(output.value, copyBtn)
  })

  resetBtn.addEventListener('click', function () {
    urlInput.value = ''
    sourceInput.value = ''
    mediumInput.value = ''
    campaignInput.value = ''
    termInput.value = ''
    contentInput.value = ''
    output.value = ''
    urlError.textContent = ''
    HashState.save({})
  })

  shareBtn.addEventListener('click', function () {
    var state = getState()
    var encoded = HashState.encode(state)
    var shareUrl = window.location.origin + window.location.pathname + (encoded ? '#' + encoded : '')
    copyText(shareUrl, shareBtn, 'Link copied!')
  })

  var inputs = [urlInput, sourceInput, mediumInput, campaignInput, termInput, contentInput]
  inputs.forEach(function (el) {
    el.addEventListener('input', generate)
  })

  // Restore state from hash
  var saved = HashState.parse()
  if (saved && Object.keys(saved).length) {
    setState(saved)
    generate()
  }
})()
