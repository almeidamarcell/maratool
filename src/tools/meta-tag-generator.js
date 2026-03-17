import './hash-state.js'
import { countTitle, countDescription, buildBasicTags, buildOgTags, buildTwitterTags, combineAllTags } from './meta-tag-generator-core.js'
// Meta Tag Generator
;(function () {
  var titleInput = document.getElementById('mtg-title')
  var descInput = document.getElementById('mtg-desc')
  var canonicalInput = document.getElementById('mtg-canonical')
  var authorInput = document.getElementById('mtg-author')
  var robotsInput = document.getElementById('mtg-robots')
  var ogTitleInput = document.getElementById('mtg-og-title')
  var ogDescInput = document.getElementById('mtg-og-desc')
  var ogUrlInput = document.getElementById('mtg-og-url')
  var ogImageInput = document.getElementById('mtg-og-image')
  var ogTypeInput = document.getElementById('mtg-og-type')
  var ogSiteInput = document.getElementById('mtg-og-site')
  var twCardInput = document.getElementById('mtg-tw-card')
  var twTitleInput = document.getElementById('mtg-tw-title')
  var twDescInput = document.getElementById('mtg-tw-desc')
  var twImageInput = document.getElementById('mtg-tw-image')
  var twSiteInput = document.getElementById('mtg-tw-site')
  var output = document.getElementById('mtg-output')
  var copyBtn = document.getElementById('mtg-copy')
  var titleCount = document.getElementById('mtg-title-count')
  var descCount = document.getElementById('mtg-desc-count')

  function v(el) { return el ? el.value.trim() : '' }

  function updateCount(el, counterEl, checkFn) {
    var result = checkFn(el.value)
    counterEl.textContent = result.count + ' chars'
    counterEl.className = 'mtg-count mtg-count-' + result.status
  }

  function generate() {
    updateCount(titleInput, titleCount, countTitle)
    updateCount(descInput, descCount, countDescription)

    var basic = buildBasicTags({ title: v(titleInput), description: v(descInput), canonical: v(canonicalInput), author: v(authorInput), robots: v(robotsInput) })
    var og = buildOgTags({ title: v(ogTitleInput) || v(titleInput), description: v(ogDescInput) || v(descInput), url: v(ogUrlInput) || v(canonicalInput), type: v(ogTypeInput), siteName: v(ogSiteInput), imageUrl: v(ogImageInput) })
    var twitter = buildTwitterTags({ card: v(twCardInput), title: v(twTitleInput) || v(titleInput), description: v(twDescInput) || v(descInput), imageUrl: v(twImageInput), site: v(twSiteInput) })

    output.value = combineAllTags(basic, og, twitter)
    HashState.save({
      title: v(titleInput), desc: v(descInput), canonical: v(canonicalInput),
      author: v(authorInput), robots: v(robotsInput),
      ogImage: v(ogImageInput), ogType: v(ogTypeInput), ogSite: v(ogSiteInput),
      twCard: v(twCardInput), twSite: v(twSiteInput),
    })
  }

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = orig }, 2000)
    })
  })

  document.querySelectorAll('.mtg-input').forEach(function (el) {
    el.addEventListener('input', generate)
  })

  // Restore
  var s = HashState.parse()
  if (s.title) titleInput.value = s.title
  if (s.desc) descInput.value = s.desc
  if (s.canonical) canonicalInput.value = s.canonical
  if (s.author) authorInput.value = s.author
  if (s.robots) robotsInput.value = s.robots
  if (s.ogImage) ogImageInput.value = s.ogImage
  if (s.ogType) ogTypeInput.value = s.ogType
  if (s.ogSite) ogSiteInput.value = s.ogSite
  if (s.twCard) twCardInput.value = s.twCard
  if (s.twSite) twSiteInput.value = s.twSite

  generate()
})()
