// Reading Time Calculator
(function () {
  const textarea = document.getElementById('reading-input')
  const statWords = document.getElementById('stat-words')
  const statChars = document.getElementById('stat-chars')
  const statParas = document.getElementById('stat-paras')
  const statSents = document.getElementById('stat-sents')
  const statSlow = document.getElementById('stat-slow')
  const statAvg = document.getElementById('stat-avg')
  const statFast = document.getElementById('stat-fast')

  const WPM_SLOW = 150
  const WPM_AVG = 238
  const WPM_FAST = 350

  function formatTime(minutes) {
    if (minutes < 1) return '< 1 min'
    const m = Math.round(minutes)
    return m === 1 ? '1 min' : m + ' min'
  }

  function countSentences(text) {
    const matches = text.match(/[^.!?]*[.!?]+/g)
    return matches ? matches.length : (text.trim().length > 0 ? 1 : 0)
  }

  function update() {
    const text = textarea.value
    const trimmed = text.trim()

    if (!trimmed) {
      statWords.textContent = '0'
      statChars.textContent = '0'
      statParas.textContent = '0'
      statSents.textContent = '0'
      statSlow.textContent = '—'
      statAvg.textContent = '—'
      statFast.textContent = '—'
      return
    }

    const words = trimmed.split(/\s+/).filter(Boolean).length
    const chars = trimmed.length
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    const sentences = countSentences(trimmed)

    statWords.textContent = words.toLocaleString()
    statChars.textContent = chars.toLocaleString()
    statParas.textContent = paragraphs.toLocaleString()
    statSents.textContent = sentences.toLocaleString()
    statSlow.textContent = formatTime(words / WPM_SLOW)
    statAvg.textContent = formatTime(words / WPM_AVG)
    statFast.textContent = formatTime(words / WPM_FAST)
  }

  textarea.addEventListener('input', update)
})()
