import { auditJwt } from './jwt-security-core.js'

;(function () {
  var input = document.getElementById('jws-input')
  var risk = document.getElementById('jws-risk')
  var issues = document.getElementById('jws-issues')

  function update() {
    var r = auditJwt(input.value)
    if (r.error) {
      risk.textContent = '—'
      issues.innerHTML = '<li class="error-state">' + r.error + '</li>'
      return
    }
    risk.textContent = r.risk.toUpperCase()
    issues.innerHTML = r.issues.length
      ? r.issues.map(function (i) {
        return '<li><strong>' + i.severity + '</strong> — ' + i.message + '</li>'
      }).join('')
      : '<li>No security issues detected.</li>'
  }

  input.addEventListener('input', update)
  update()
})()
