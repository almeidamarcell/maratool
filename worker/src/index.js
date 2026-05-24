/**
 * Cloudflare Worker: Instagram API proxy for maratool.com
 *
 * Strategy: Use instagram120 RapidAPI as primary extraction,
 * with cobalt and kohi as fallbacks.
 *
 * Routes:
 *   GET /api/instagram/:shortcode  → Fetch post metadata
 *   GET /api/instagram/download    → Stream media for download
 *   GET /health                    → Health check
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

// Rate limiting
const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 15

function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

function corsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || 'https://maratool.com'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  })
}

/**
 * Primary: instagram120 RapidAPI — POST /api/instagram/links
 *
 * Response is an array of carousel items:
 * [{ urls: [{url, name, extension}], meta: {title, username, likeCount, ...}, pictureUrl }]
 *
 * For video reels, one item will have extension "mp4".
 * For photos, items have extension "webp"/"jpg".
 */
async function extractFromInstagram120(shortcode, env, originalUrl) {
  const apiKey = env.RAPIDAPI_KEY
  if (!apiKey) return null

  // Use the original URL if provided (preserves /reel/ vs /p/ format),
  // otherwise construct a URL trying /reel/ first (most common use case)
  const igUrl = originalUrl || `https://www.instagram.com/reel/${shortcode}/`


  try {
    const resp = await fetch('https://instagram120.p.rapidapi.com/api/instagram/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram120.p.rapidapi.com',
      },
      body: JSON.stringify({ url: igUrl }),
    })

    if (!resp.ok) return null

    const data = await resp.json()

    // Error response: { response: 4, success: false, message: "..." }
    if (data.success === false || data.response === 4) return null

    // data is an array of carousel items
    if (!Array.isArray(data) || data.length === 0) return null

    // Find the first video (mp4) item, or fall back to first item
    let videoItem = null
    let photoItem = null

    for (const item of data) {
      if (!item.urls || item.urls.length === 0) continue
      const mp4 = item.urls.find(u => u.extension === 'mp4')
      if (mp4 && !videoItem) {
        videoItem = { url: mp4.url, meta: item.meta, pictureUrl: item.pictureUrl }
      }
      const img = item.urls.find(u => u.extension === 'webp' || u.extension === 'jpg' || u.extension === 'png')
      if (img && !photoItem) {
        photoItem = { url: img.url, meta: item.meta, pictureUrl: item.pictureUrl }
      }
    }

    const meta = (videoItem || photoItem)?.meta || {}
    const caption = meta.title || ''
    const username = meta.username || ''

    if (videoItem) {
      return {
        type: 'video',
        videoUrl: videoItem.url,
        thumbnailUrl: videoItem.pictureUrl || '',
        caption,
        username,
        source: 'instagram120',
      }
    }

    if (photoItem) {
      return {
        type: 'photo',
        photoUrl: photoItem.url,
        thumbnailUrl: photoItem.pictureUrl || '',
        caption,
        username,
        source: 'instagram120',
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Fallback 1: Cobalt API
 */
async function extractFromCobalt(shortcode) {
  try {
    const resp = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.instagram.com/p/${shortcode}/`,
        downloadMode: 'auto',
      }),
    })

    if (!resp.ok) return null
    const data = await resp.json()

    if (data.status === 'tunnel' || data.status === 'redirect') {
      const mediaUrl = data.url
      if (!mediaUrl) return null
      const isVideo = mediaUrl.includes('.mp4') || data.filename?.includes('.mp4')
      return {
        type: isVideo ? 'video' : 'photo',
        videoUrl: isVideo ? mediaUrl : undefined,
        photoUrl: isVideo ? undefined : mediaUrl,
        thumbnailUrl: '',
        caption: '',
        username: '',
        source: 'cobalt',
      }
    }

    if (data.status === 'picker' && data.picker?.length > 0) {
      const first = data.picker[0]
      const mediaUrl = first.url
      const isVideo = first.type === 'video' || mediaUrl?.includes('.mp4')
      return {
        type: isVideo ? 'video' : 'photo',
        videoUrl: isVideo ? mediaUrl : undefined,
        photoUrl: isVideo ? undefined : mediaUrl,
        thumbnailUrl: first.thumb || '',
        caption: '',
        username: '',
        source: 'cobalt',
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Fallback 2: api-library-kohi
 */
async function extractFromKohi(shortcode) {
  try {
    const igUrl = encodeURIComponent(`https://www.instagram.com/p/${shortcode}/`)
    const resp = await fetch(`https://api-library-kohi.onrender.com/api/alldl?url=${igUrl}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': UA },
    })

    if (!resp.ok) return null
    const data = await resp.json()

    // Try { data: { videoUrl } } pattern (novaxmd format)
    if (data.status && data.data?.videoUrl) {
      return {
        type: 'video',
        videoUrl: data.data.videoUrl,
        thumbnailUrl: data.data.thumbnail || '',
        caption: data.data.title || '',
        username: data.data.username || '',
        source: 'kohi',
      }
    }

    // Try { result: { medias: [] } } pattern
    const medias = data?.result?.medias || data?.medias || []
    if (medias.length > 0) {
      const video = medias.find(m => m.type === 'video') || medias[0]
      const isVideo = video.type === 'video' || video.url?.includes('.mp4')
      return {
        type: isVideo ? 'video' : 'photo',
        videoUrl: isVideo ? video.url : undefined,
        photoUrl: isVideo ? undefined : video.url,
        thumbnailUrl: video.thumb || video.thumbnail || '',
        caption: data?.result?.title || '',
        username: data?.result?.username || '',
        source: 'kohi',
      }
    }

    return null
  } catch {
    return null
  }
}

async function handleFetch(shortcode, env, originalUrl) {
  // Primary: instagram120 RapidAPI (pass original URL to preserve /reel/ vs /p/)
  let result = await extractFromInstagram120(shortcode, env, originalUrl)

  // If failed and we used /reel/ format, retry with /p/ format (or vice versa)
  if (!result && originalUrl) {
    const altUrl = originalUrl.includes('/reel/')
      ? originalUrl.replace('/reel/', '/p/')
      : originalUrl.replace('/p/', '/reel/')
    if (altUrl !== originalUrl) {
      result = await extractFromInstagram120(shortcode, env, altUrl)
    }
  }

  // Fallbacks
  if (!result) result = await extractFromCobalt(shortcode)
  if (!result) result = await extractFromKohi(shortcode)

  if (!result) {
    return jsonResponse({ error: 'extraction-failed' }, 502, env)
  }

  return jsonResponse(result, 200, env)
}

// Strict allowlist — exact match or subdomain, https only.
// String.includes() was a substring match: `instagram.com.attacker.tld` passed.
const ALLOWED_DOWNLOAD_HOSTS = [
  'cdninstagram.com',
  'fbcdn.net',
  'instagram.com',
  'cobalt.tools',
  'onrender.com',
]

function isAllowedDownloadUrl(parsed) {
  if (parsed.protocol !== 'https:') return false
  const h = parsed.hostname
  return ALLOWED_DOWNLOAD_HOSTS.some(allowed => h === allowed || h.endsWith('.' + allowed))
}

// Allowlist of media types we'll proxy. Blocks attacker-controlled text/html
// from being served at the maratool.com origin (would be same-origin XSS).
function isAllowedMediaType(contentType) {
  if (!contentType) return false
  const ct = contentType.split(';')[0].trim().toLowerCase()
  return ct.startsWith('image/') || ct.startsWith('video/') || ct.startsWith('audio/')
}

// Strip CRLF + double-quote + backslash to keep Content-Disposition header well-formed.
function sanitizeFilename(name) {
  return (name || 'instagram-media').replace(/[\r\n"\\]/g, '_').slice(0, 200)
}

async function handleDownload(request, env) {
  const url = new URL(request.url)
  const mediaUrl = url.searchParams.get('url')
  const filename = sanitizeFilename(url.searchParams.get('filename'))

  if (!mediaUrl) {
    return jsonResponse({ error: 'missing-url' }, 400, env)
  }

  let parsed
  try { parsed = new URL(mediaUrl) } catch {
    return jsonResponse({ error: 'invalid-url' }, 400, env)
  }

  if (!isAllowedDownloadUrl(parsed)) {
    return jsonResponse({ error: 'invalid-url' }, 400, env)
  }

  const mediaResponse = await fetch(mediaUrl, {
    headers: { 'User-Agent': UA, 'Referer': 'https://www.instagram.com/' },
  })

  if (!mediaResponse.ok) {
    return jsonResponse({ error: 'download-failed' }, 502, env)
  }

  const upstreamType = mediaResponse.headers.get('Content-Type')
  if (!isAllowedMediaType(upstreamType)) {
    return jsonResponse({ error: 'invalid-content-type' }, 502, env)
  }

  const contentLength = mediaResponse.headers.get('Content-Length')

  // Always serve as attachment — never inline. Inline + attacker-controlled
  // Content-Type was the same-origin XSS vector.
  const responseHeaders = {
    'Content-Type': upstreamType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'X-Content-Type-Options': 'nosniff',
    ...corsHeaders(env),
  }
  if (contentLength) responseHeaders['Content-Length'] = contentLength

  return new Response(mediaResponse.body, { status: 200, headers: responseHeaders })
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders(env) })
      }

      if (request.method !== 'GET') {
        return jsonResponse({ error: 'method-not-allowed' }, 405, env)
      }

      const url = new URL(request.url)
      const path = url.pathname

      if (path === '/health') {
        return jsonResponse({ status: 'ok', version: '5.0' }, 200, env)
      }

      // Rate limiting
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
      if (isRateLimited(ip)) {
        return jsonResponse({ error: 'rate-limited' }, 429, env)
      }

      if (path === '/api/instagram/download') {
        return handleDownload(request, env)
      }

      const match = path.match(/^\/api\/instagram\/([a-zA-Z0-9_-]+)$/)
      if (match) {
        const originalUrl = url.searchParams.get('url') || null
        return handleFetch(match[1], env, originalUrl)
      }

      return jsonResponse({ error: 'not-found' }, 404, env)
    } catch (err) {
      console.error('worker error:', err)
      return jsonResponse({ error: 'server-error' }, 500, env)
    }
  },
}
