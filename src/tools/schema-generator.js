import './hash-state.js'
import {
  buildArticleSchema,
  buildProductSchema,
  buildFaqSchema,
  buildHowToSchema,
  buildLocalBusinessSchema,
  buildPersonSchema,
  formatJsonLd,
} from './schema-generator-core.js'
// Schema Markup Generator
;(function () {
  var typeBtns = document.querySelectorAll('.sg-type-btn')
  var forms = document.querySelectorAll('.sg-form')
  var output = document.getElementById('sg-output')
  var copyBtn = document.getElementById('sg-copy')
  var currentType = 'article'

  function switchType(type) {
    currentType = type
    typeBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.type === type) })
    forms.forEach(function (f) { f.style.display = f.dataset.form === type ? '' : 'none' })
    generate()
  }

  typeBtns.forEach(function (b) {
    b.addEventListener('click', function () { switchType(b.dataset.type) })
  })

  function val(id) {
    var el = document.getElementById(id)
    return el ? el.value.trim() : ''
  }

  function getFaqItems() {
    var items = []
    document.querySelectorAll('.sg-faq-item').forEach(function (row) {
      var q = row.querySelector('.sg-faq-q').value.trim()
      var a = row.querySelector('.sg-faq-a').value.trim()
      if (q || a) items.push({ question: q, answer: a })
    })
    return items
  }

  function getHowToSteps() {
    var steps = []
    document.querySelectorAll('.sg-howto-step').forEach(function (row) {
      var name = row.querySelector('.sg-step-name').value.trim()
      var text = row.querySelector('.sg-step-text').value.trim()
      if (name || text) steps.push({ name: name, text: text })
    })
    return steps
  }

  function generate() {
    var schema
    try {
      if (currentType === 'article') {
        schema = buildArticleSchema({ headline: val('sg-article-headline'), author: val('sg-article-author'), datePublished: val('sg-article-date'), url: val('sg-article-url'), imageUrl: val('sg-article-image') || undefined })
      } else if (currentType === 'product') {
        schema = buildProductSchema({ name: val('sg-product-name'), description: val('sg-product-desc'), price: val('sg-product-price'), currency: val('sg-product-currency') || 'USD', availability: val('sg-product-avail') || 'InStock', url: val('sg-product-url') })
      } else if (currentType === 'faq') {
        schema = buildFaqSchema(getFaqItems())
      } else if (currentType === 'howto') {
        schema = buildHowToSchema({ name: val('sg-howto-name'), description: val('sg-howto-desc'), steps: getHowToSteps() })
      } else if (currentType === 'localbusiness') {
        schema = buildLocalBusinessSchema({ name: val('sg-lb-name'), address: val('sg-lb-address'), phone: val('sg-lb-phone'), url: val('sg-lb-url'), openingHours: val('sg-lb-hours') || undefined })
      } else if (currentType === 'person') {
        schema = buildPersonSchema({ name: val('sg-person-name'), jobTitle: val('sg-person-title'), url: val('sg-person-url'), email: val('sg-person-email') })
      }
      output.value = formatJsonLd(schema)
    } catch (e) {
      output.value = '// Error: ' + e.message
    }
  }

  // FAQ: add/remove rows
  document.getElementById('sg-faq-add').addEventListener('click', function () {
    var container = document.getElementById('sg-faq-items')
    var row = document.createElement('div')
    row.className = 'sg-faq-item'
    row.innerHTML = '<input class="tool-input sg-faq-q" placeholder="Question" /><textarea class="tool-input sg-faq-a" rows="2" placeholder="Answer"></textarea><button class="sg-remove-btn" type="button">&times;</button>'
    row.querySelector('.sg-remove-btn').addEventListener('click', function () { row.remove(); generate() })
    row.querySelectorAll('input,textarea').forEach(function (el) { el.addEventListener('input', generate) })
    container.appendChild(row)
  })

  // HowTo: add/remove steps
  document.getElementById('sg-howto-add').addEventListener('click', function () {
    var container = document.getElementById('sg-howto-steps')
    var n = container.querySelectorAll('.sg-howto-step').length + 1
    var row = document.createElement('div')
    row.className = 'sg-howto-step'
    row.innerHTML = '<span class="sg-step-num">' + n + '</span><input class="tool-input sg-step-name" placeholder="Step name" /><textarea class="tool-input sg-step-text" rows="2" placeholder="Step description"></textarea><button class="sg-remove-btn" type="button">&times;</button>'
    row.querySelector('.sg-remove-btn').addEventListener('click', function () { row.remove(); generate() })
    row.querySelectorAll('input,textarea').forEach(function (el) { el.addEventListener('input', generate) })
    container.appendChild(row)
  })

  // Wire all static inputs
  document.querySelectorAll('.sg-form input, .sg-form textarea, .sg-form select').forEach(function (el) {
    el.addEventListener('input', generate)
  })

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = orig }, 2000)
    })
  })

  generate()
})()
