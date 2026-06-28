;(function () {
  var COMMON = ['password', '123456', '12345678', 'qwerty', 'abc123', 'password1', 'letmein', 'welcome', 'admin', 'login']

  function score(pw) {
    if (!pw) return { score: 0, label: 'No password', color: '#a8a8a0', crack: '—', tips: ['Enter a password to check'] }
    var s = 0
    var tips = []
    if (pw.length >= 8) s += 1
    else tips.push('Use at least 8 characters')
    if (pw.length >= 12) s += 1
    if (pw.length >= 16) s += 1
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1
    else tips.push('Mix uppercase and lowercase')
    if (/\d/.test(pw)) s += 1
    else tips.push('Add numbers')
    if (/[^a-zA-Z0-9]/.test(pw)) s += 1
    else tips.push('Add special characters')
    if (COMMON.includes(pw.toLowerCase())) { s = 0; tips = ['This is a commonly used password'] }
    var labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
    var colors = ['#c53030', '#e53e3e', '#d4842a', '#d69e2e', '#38a169', '#276749']
    var entropy = pw.length * Math.log2((/[a-z]/.test(pw) ? 26 : 0) + (/[A-Z]/.test(pw) ? 26 : 0) + (/\d/.test(pw) ? 10 : 0) + (/[^a-zA-Z0-9]/.test(pw) ? 32 : 0) || 1)
    var guesses = Math.pow(2, entropy)
    var crack
    if (guesses < 1e6) crack = 'Instant'
    else if (guesses < 1e9) crack = 'Minutes'
    else if (guesses < 1e12) crack = 'Hours'
    else if (guesses < 1e15) crack = 'Days'
    else crack = 'Years+'
    return { score: s, label: labels[Math.min(s, 5)], color: colors[Math.min(s, 5)], crack: crack, tips: tips.length ? tips : ['Good password!'] }
  }

  var input = document.getElementById('pw-input')
  var bar = document.getElementById('pw-bar')
  var label = document.getElementById('pw-label')
  var crack = document.getElementById('pw-crack')
  var tips = document.getElementById('pw-tips')

  function update() {
    var result = score(input.value)
    bar.style.width = (result.score / 5 * 100) + '%'
    bar.style.background = result.color
    label.textContent = result.label
    label.style.color = result.color
    crack.textContent = 'Estimated crack time: ' + result.crack
    tips.innerHTML = result.tips.map(function (t) { return '<li>' + t + '</li>' }).join('')
  }

  input.addEventListener('input', update)
  update()
})()
