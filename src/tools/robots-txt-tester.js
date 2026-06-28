import './hash-state.js'
import { parseRobotsTxt, testRobotsPath } from './robots-txt-tester-core.js'

;(function () {
  var robotsInput = document.getElementById('rtt-robots')
  var pathInput = document.getElementById('rtt-path')
  var uaInput = document.getElementById('rtt-ua')
  var resultEl = document.getElementById('rtt-result')
  var reasonEl = document.getElementById('rtt-reason')

  function update() {
    var parsed = parseRobotsTxt(robotsInput.value)
    if (parsed.error) {
      resultEl.textContent = '—'
      resultEl.className = 'tool-stat-value'
      reasonEl.textContent = parsed.error
      return
    }
    var test = testRobotsPath(parsed.rules, uaInput.value || '*', pathInput.value || '/')
    resultEl.textContent = test.allowed ? 'Allowed' : 'Blocked'
    resultEl.className = 'tool-stat-value ' + (test.allowed ? 'rtt-allowed' : 'rtt-blocked')
    reasonEl.textContent = test.reason
    HashState.save({ robots: robotsInput.value, path: pathInput.value, ua: uaInput.value })
  }

  ;[robotsInput, pathInput, uaInput].forEach(function (el) {
    el.addEventListener('input', update)
  })

  var saved = HashState.parse()
  if (saved.robots) robotsInput.value = saved.robots
  if (saved.path) pathInput.value = saved.path
  if (saved.ua) uaInput.value = saved.ua
  update()
})()
