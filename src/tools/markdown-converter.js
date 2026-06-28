import './hash-state.js'
import { markdownToHtml } from './markdown-to-html-core.js'
import { htmlToMarkdown } from './html-to-md.js'

;(function () {
  var tabMd = document.getElementById('mdc-tab-md')
  var tabHtml = document.getElementById('mdc-tab-html')
  var panelMd = document.getElementById('mdc-panel-md')
  var panelHtml = document.getElementById('mdc-panel-html')
  var mdInput = document.getElementById('mdc-md-input')
  var mdOutput = document.getElementById('mdc-md-output')
  var htmlInput = document.getElementById('mdc-html-input')
  var htmlOutput = document.getElementById('mdc-html-output')
  var copyMdBtn = document.getElementById('mdc-copy-md')
  var copyHtmlBtn = document.getElementById('mdc-copy-html')
  var activeTab = 'md'

  function setTab(tab) {
    activeTab = tab
    tabMd.classList.toggle('active', tab === 'md')
    tabHtml.classList.toggle('active', tab === 'html')
    panelMd.style.display = tab === 'md' ? '' : 'none'
    panelHtml.style.display = tab === 'html' ? '' : 'none'
    HashState.save({ tab: tab, md: mdInput.value, html: htmlInput.value })
  }

  function convertMd() {
    mdOutput.value = markdownToHtml(mdInput.value)
  }

  function convertHtml() {
    try {
      htmlOutput.value = htmlToMarkdown(htmlInput.value)
      htmlOutput.classList.remove('error-state')
    } catch (e) {
      htmlOutput.value = 'Error: ' + e.message
      htmlOutput.classList.add('error-state')
    }
  }

  tabMd.addEventListener('click', function () { setTab('md') })
  tabHtml.addEventListener('click', function () { setTab('html') })

  mdInput.addEventListener('input', function () {
    convertMd()
    HashState.save({ tab: activeTab, md: mdInput.value, html: htmlInput.value })
  })

  htmlInput.addEventListener('input', function () {
    convertHtml()
    HashState.save({ tab: activeTab, md: mdInput.value, html: htmlInput.value })
  })

  function copyWithFeedback(btn, text, label) {
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied!'
      btn.classList.add('copied')
      setTimeout(function () {
        btn.textContent = label
        btn.classList.remove('copied')
      }, 2000)
    })
  }

  copyMdBtn.addEventListener('click', function () {
    copyWithFeedback(copyMdBtn, mdOutput.value, 'Copy HTML')
  })

  copyHtmlBtn.addEventListener('click', function () {
    copyWithFeedback(copyHtmlBtn, htmlOutput.value, 'Copy Markdown')
  })

  var saved = HashState.parse()
  if (saved.tab) setTab(saved.tab)
  if (saved.md) { mdInput.value = saved.md; convertMd() }
  if (saved.html) { htmlInput.value = saved.html; convertHtml() }
})()
