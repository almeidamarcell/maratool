/**
 * Instagram Video/Photo Downloader — client-side logic.
 * Validates URL, calls Cloudflare Worker, handles download.
 */
import { validateInstagramUrl, extractShortcode, errorMessage } from './instagram-core.js'

const API_BASE = 'https://maratool-instagram-api.maravilhosa.workers.dev'

// ── DOM refs ──
const form = document.getElementById('ig-form')
const input = document.getElementById('ig-url')
const submitBtn = document.getElementById('ig-submit')
const errorEl = document.getElementById('ig-error')
const errorText = document.getElementById('ig-error-text')
const resultEl = document.getElementById('ig-result')
const previewImg = document.getElementById('ig-preview')
const captionEl = document.getElementById('ig-caption')
const usernameEl = document.getElementById('ig-username')
const downloadBtn = document.getElementById('ig-download')
const newBtn = document.getElementById('ig-new')
const spinner = document.getElementById('ig-spinner')
const pasteBtn = document.getElementById('ig-paste')

let currentResult = null

function showError(code) {
  errorText.textContent = errorMessage(code)
  errorEl.style.display = 'flex'
  resultEl.style.display = 'none'
}

function hideError() {
  errorEl.style.display = 'none'
}

function setLoading(loading) {
  submitBtn.disabled = loading
  if (spinner) spinner.style.display = loading ? 'inline-block' : 'none'
  submitBtn.querySelector('.ig-btn-text').textContent = loading ? 'Fetching...' : 'Download'
}

function showResult(data) {
  resultEl.style.display = 'block'
  previewImg.src = data.thumbnailUrl
  previewImg.alt = data.caption ? data.caption.slice(0, 100) : 'Instagram post preview'
  captionEl.textContent = data.caption ? data.caption.slice(0, 200) : ''
  usernameEl.textContent = data.username ? `@${data.username}` : ''
  currentResult = data

  const isVideo = data.type === 'video'
  downloadBtn.textContent = isVideo ? 'Download Video' : 'Download Photo'
}

function reset() {
  input.value = ''
  hideError()
  resultEl.style.display = 'none'
  currentResult = null
  input.focus()
}

async function handleSubmit(e) {
  e.preventDefault()
  hideError()
  resultEl.style.display = 'none'

  const url = input.value.trim()
  const validation = validateInstagramUrl(url)
  if (!validation.valid) {
    showError(validation.error)
    return
  }

  const shortcode = extractShortcode(url)
  setLoading(true)

  try {
    const res = await fetch(`${API_BASE}/api/instagram/${shortcode}`)
    const data = await res.json()

    if (data.error) {
      showError(data.error)
      return
    }

    showResult(data)
  } catch {
    showError('server-error')
  } finally {
    setLoading(false)
  }
}

function handleDownload() {
  if (!currentResult) return

  const mediaUrl = currentResult.type === 'video' ? currentResult.videoUrl : currentResult.photoUrl
  const ext = currentResult.type === 'video' ? 'mp4' : 'jpg'
  const filename = `instagram-${currentResult.username || 'media'}-${Date.now()}.${ext}`

  const downloadUrl = `${API_BASE}/api/instagram/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename)}`

  const link = document.createElement('a')
  link.href = downloadUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      input.value = text
      form.dispatchEvent(new Event('submit'))
    }
  } catch {
    // Clipboard permission denied — user can paste manually
    input.focus()
  }
}

// ── Init ──
form.addEventListener('submit', handleSubmit)
downloadBtn.addEventListener('click', handleDownload)
newBtn.addEventListener('click', reset)
if (pasteBtn) pasteBtn.addEventListener('click', handlePaste)

// Auto-submit on paste into input
input.addEventListener('paste', () => {
  setTimeout(() => form.dispatchEvent(new Event('submit')), 50)
})
