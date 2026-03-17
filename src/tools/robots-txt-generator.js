import './hash-state.js'
import { buildRobotsTxt } from './robots-txt-generator-core.js'
// Robots.txt Generator
;(function () {
  var sitemapInput = document.getElementById('rtg-sitemap')
  var crawlDelayCheck = document.getElementById('rtg-crawldelay-check')
  var crawlDelayInput = document.getElementById('rtg-crawldelay')
  var crawlDelayRow = document.getElementById('rtg-crawldelay-row')
  var output = document.getElementById('rtg-output')
  var copyBtn = document.getElementById('rtg-copy')
  var rulesContainer = document.getElementById('rtg-rules')
  var addRuleBtn = document.getElementById('rtg-add-rule')

  function parseRules() {
    var rules = []
    document.querySelectorAll('.rtg-rule').forEach(function (ruleEl) {
      var userAgent = ruleEl.querySelector('.rtg-ua').value.trim() || '*'
      var directives = []
      ruleEl.querySelectorAll('.rtg-directive').forEach(function (dirEl) {
        var type = dirEl.querySelector('.rtg-dir-type').value
        var path = dirEl.querySelector('.rtg-dir-path').value.trim()
        if (path) directives.push({ type: type, path: path })
      })
      if (directives.length) rules.push({ userAgent: userAgent, directives: directives })
    })
    return rules
  }

  function generate() {
    var rules = parseRules()
    var sitemap = sitemapInput.value.trim()
    var crawlDelay = crawlDelayCheck.checked ? parseInt(crawlDelayInput.value, 10) : null

    if (!rules.length) {
      output.value = '# robots.txt\n# Add rules using the builder above.'
      return
    }

    output.value = '# robots.txt\n\n' + buildRobotsTxt(rules, sitemap, crawlDelay)
    HashState.save({ sitemap: sitemap })
  }

  function addDirective(ruleEl) {
    var container = ruleEl.querySelector('.rtg-directives')
    var div = document.createElement('div')
    div.className = 'rtg-directive'
    div.innerHTML = '<select class="rtg-dir-type tool-input rtg-select"><option value="Disallow">Disallow</option><option value="Allow">Allow</option></select><input class="rtg-dir-path tool-input" placeholder="/path/" /><button class="rtg-remove-dir sg-remove-btn" type="button">&times;</button>'
    div.querySelector('.rtg-remove-dir').addEventListener('click', function () { div.remove(); generate() })
    div.querySelectorAll('input,select').forEach(function (el) { el.addEventListener('input', generate); el.addEventListener('change', generate) })
    container.appendChild(div)
  }

  function createRule(ua, dirs) {
    var div = document.createElement('div')
    div.className = 'rtg-rule'
    div.innerHTML = '<div class="rtg-rule-header"><input class="rtg-ua tool-input" placeholder="User-agent (e.g. * or Googlebot)" value="' + (ua || '*') + '" /><button class="rtg-remove-rule sg-remove-btn" type="button">&times;</button></div><div class="rtg-directives"></div><button class="sg-add-btn rtg-add-dir" type="button">+ Add path</button>'
    div.querySelector('.rtg-remove-rule').addEventListener('click', function () { div.remove(); generate() })
    div.querySelector('.rtg-ua').addEventListener('input', generate)
    div.querySelector('.rtg-add-dir').addEventListener('click', function () { addDirective(div); generate() })
    ;(dirs || [{ type: 'Disallow', path: '' }]).forEach(function (d) {
      var container = div.querySelector('.rtg-directives')
      var dDiv = document.createElement('div')
      dDiv.className = 'rtg-directive'
      dDiv.innerHTML = '<select class="rtg-dir-type tool-input rtg-select"><option value="Disallow"' + (d.type === 'Disallow' ? ' selected' : '') + '>Disallow</option><option value="Allow"' + (d.type === 'Allow' ? ' selected' : '') + '>Allow</option></select><input class="rtg-dir-path tool-input" placeholder="/path/" value="' + (d.path || '') + '" /><button class="rtg-remove-dir sg-remove-btn" type="button">&times;</button>'
      dDiv.querySelector('.rtg-remove-dir').addEventListener('click', function () { dDiv.remove(); generate() })
      dDiv.querySelectorAll('input,select').forEach(function (el) { el.addEventListener('input', generate); el.addEventListener('change', generate) })
      container.appendChild(dDiv)
    })
    return div
  }

  addRuleBtn.addEventListener('click', function () {
    rulesContainer.appendChild(createRule('*', []))
    generate()
  })

  crawlDelayCheck.addEventListener('change', function () {
    crawlDelayRow.style.display = crawlDelayCheck.checked ? '' : 'none'
    generate()
  })
  crawlDelayInput.addEventListener('input', generate)
  sitemapInput.addEventListener('input', generate)

  // Presets
  document.querySelectorAll('.rtg-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var preset = btn.dataset.preset
      rulesContainer.innerHTML = ''
      if (preset === 'allow-all') {
        rulesContainer.appendChild(createRule('*', [{ type: 'Allow', path: '/' }, { type: 'Disallow', path: '' }]))
      } else if (preset === 'block-all') {
        rulesContainer.appendChild(createRule('*', [{ type: 'Disallow', path: '/' }]))
      } else if (preset === 'block-ai') {
        var bots = ['GPTBot', 'CCBot', 'anthropic-ai', 'Claude-Web', 'Google-Extended']
        bots.forEach(function (bot) {
          rulesContainer.appendChild(createRule(bot, [{ type: 'Disallow', path: '/' }]))
        })
      } else if (preset === 'wordpress') {
        rulesContainer.appendChild(createRule('*', [
          { type: 'Disallow', path: '/wp-admin/' },
          { type: 'Allow', path: '/wp-admin/admin-ajax.php' },
          { type: 'Disallow', path: '/wp-includes/' },
          { type: 'Disallow', path: '/wp-content/plugins/' },
          { type: 'Disallow', path: '/wp-content/themes/' },
        ]))
      }
      generate()
    })
  })

  // Init with default rule
  rulesContainer.appendChild(createRule('*', [{ type: 'Disallow', path: '' }]))
  var s = HashState.parse()
  if (s.sitemap) sitemapInput.value = s.sitemap
  generate()
})()
