import './hash-state.js'
import { parseMetaFromHtml } from './html-meta-parser-core.js'
import { resolveOgPreview, ogPreviewFromHtml } from './open-graph-preview-core.js'

;(function () {
  var tabPaste = document.getElementById('ogp-tab-paste')
  var tabManual = document.getElementById('ogp-tab-manual')
  var panelPaste = document.getElementById('ogp-panel-paste')
  var panelManual = document.getElementById('ogp-panel-manual')
  var htmlInput = document.getElementById('ogp-html')
  var fields = {
    title: document.getElementById('ogp-title'),
    description: document.getElementById('ogp-description'),
    image: document.getElementById('ogp-image'),
    url: document.getElementById('ogp-url'),
    siteName: document.getElementById('ogp-site'),
    card: document.getElementById('ogp-card'),
  }
  var cardEl = document.getElementById('ogp-card-preview')
  var cardImg = document.getElementById('ogp-card-img')
  var cardTitle = document.getElementById('ogp-card-title')
  var cardDesc = document.getElementById('ogp-card-desc')
  var cardHost = document.getElementById('ogp-card-host')
  var mode = 'paste'

  function setTab(which) {
    mode = which
    tabPaste.classList.toggle('active', which === 'paste')
    tabManual.classList.toggle('active', which === 'manual')
    panelPaste.style.display = which === 'paste' ? '' : 'none'
    panelManual.style.display = which === 'manual' ? '' : 'none'
    update()
  }

  function getPreview() {
    if (mode === 'paste') return ogPreviewFromHtml(htmlInput.value)
    return resolveOgPreview({
      title: fields.title.value,
      description: fields.description.value,
      ogTitle: fields.title.value,
      ogDescription: fields.description.value,
      ogImage: fields.image.value,
      ogUrl: fields.url.value,
      ogSiteName: fields.siteName.value,
      twitterCard: fields.card.value,
    })
  }

  function update() {
    var preview = getPreview()
    if (preview.error) {
      cardTitle.textContent = 'Paste HTML or fill fields'
      cardDesc.textContent = preview.error
      cardHost.textContent = ''
      cardImg.style.display = 'none'
      return
    }
    cardTitle.textContent = preview.title
    cardDesc.textContent = preview.description
    cardHost.textContent = preview.hostname
    if (preview.hasImage) {
      cardImg.src = preview.image
      cardImg.style.display = ''
    } else {
      cardImg.style.display = 'none'
    }
    HashState.save({
      mode: mode,
      html: htmlInput.value,
      title: fields.title.value,
      description: fields.description.value,
      image: fields.image.value,
      url: fields.url.value,
      siteName: fields.siteName.value,
      card: fields.card.value,
    })
  }

  tabPaste.addEventListener('click', function () { setTab('paste') })
  tabManual.addEventListener('click', function () { setTab('manual') })
  htmlInput.addEventListener('input', update)
  Object.keys(fields).forEach(function (k) {
    fields[k].addEventListener('input', update)
  })

  var saved = HashState.parse()
  if (saved.mode) setTab(saved.mode)
  if (saved.html) htmlInput.value = saved.html
  if (saved.title) fields.title.value = saved.title
  if (saved.description) fields.description.value = saved.description
  if (saved.image) fields.image.value = saved.image
  if (saved.url) fields.url.value = saved.url
  if (saved.siteName) fields.siteName.value = saved.siteName
  if (saved.card) fields.card.value = saved.card
  update()
})()
