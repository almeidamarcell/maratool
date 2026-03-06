import './hash-state.js'
// Unix Timestamp Converter
(function () {
  const liveClock = document.getElementById('unix-live')
  const liveDate = document.getElementById('unix-live-date')
  const tzToggle = document.getElementById('unix-tz')

  // Section 1: timestamp → date
  const tsInput = document.getElementById('unix-ts-input')
  const tsOutput = document.getElementById('unix-ts-output')
  const tsCopyBtn = document.getElementById('unix-ts-copy')

  // Section 2: date → timestamp
  const dtInput = document.getElementById('unix-dt-input')
  const dtOutput = document.getElementById('unix-dt-output')
  const dtCopyBtn = document.getElementById('unix-dt-copy')

  function getZone() {
    return tzToggle.value === 'utc' ? 'UTC' : Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  function formatDate(date, zone) {
    return date.toLocaleString('en-US', {
      timeZone: zone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  // Live clock
  function updateClock() {
    const now = Math.floor(Date.now() / 1000)
    liveClock.textContent = now
    liveDate.textContent = formatDate(new Date(), getZone())
  }
  updateClock()
  setInterval(updateClock, 1000)

  function saveHash() {
    HashState.save({ ts: tsInput.value, dt: dtInput.value, tz: tzToggle.value })
  }

  tzToggle.addEventListener('change', () => {
    updateClock()
    convertTs()
    saveHash()
  })

  // Timestamp → date
  function convertTs() {
    const raw = tsInput.value.trim()
    if (!raw) {
      tsOutput.textContent = ''
      tsOutput.classList.remove('error-state')
      return
    }
    const n = parseInt(raw)
    if (isNaN(n)) {
      tsOutput.textContent = 'Invalid timestamp'
      tsOutput.classList.add('error-state')
      return
    }
    // Handle ms vs seconds
    const ms = raw.length >= 13 ? n : n * 1000
    try {
      tsOutput.textContent = formatDate(new Date(ms), getZone())
      tsOutput.classList.remove('error-state')
    } catch {
      tsOutput.textContent = 'Invalid timestamp'
      tsOutput.classList.add('error-state')
    }
  }

  tsInput.addEventListener('input', () => {
    convertTs()
    saveHash()
  })

  tsCopyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(tsOutput.textContent).then(() => {
      tsCopyBtn.textContent = 'Copied!'
      tsCopyBtn.classList.add('copied')
      setTimeout(() => {
        tsCopyBtn.textContent = 'Copy'
        tsCopyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Date → timestamp
  function convertDt() {
    const val = dtInput.value
    if (!val) {
      dtOutput.textContent = ''
      dtOutput.classList.remove('error-state')
      return
    }
    const d = new Date(val)
    if (isNaN(d.getTime())) {
      dtOutput.textContent = 'Invalid date'
      dtOutput.classList.add('error-state')
      return
    }
    dtOutput.textContent = Math.floor(d.getTime() / 1000)
    dtOutput.classList.remove('error-state')
  }

  // Set datetime input to now
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  dtInput.value = new Date(now - offset).toISOString().slice(0, 16)
  convertDt()

  dtInput.addEventListener('input', () => {
    convertDt()
    saveHash()
  })

  dtCopyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(dtOutput.textContent).then(() => {
      dtCopyBtn.textContent = 'Copied!'
      dtCopyBtn.classList.add('copied')
      setTimeout(() => {
        dtCopyBtn.textContent = 'Copy'
        dtCopyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // ---- HASH STATE RESTORE ----
  var saved = HashState.parse()
  if (saved.tz) {
    tzToggle.value = saved.tz
    updateClock()
  }
  if (saved.ts) {
    tsInput.value = saved.ts
    convertTs()
  }
  if (saved.dt) {
    dtInput.value = saved.dt
    convertDt()
  }
})()
