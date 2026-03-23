/**
 * Instagram URL parsing and validation utilities.
 * Pure functions — no DOM, no fetch, fully testable.
 */

const SHORTCODE_RE = /\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/
const INSTAGRAM_HOST_RE = /^(www\.)?instagram\.com$|^m\.instagram\.com$/

/**
 * Extract the shortcode from an Instagram URL.
 * Supports /p/, /reel/, and /tv/ paths.
 * NOTE: Does not validate domain — use validateInstagramUrl for that.
 * @param {string} url
 * @returns {string|null} shortcode or null if not found
 */
export function extractShortcode(url) {
  const match = url.match(SHORTCODE_RE)
  return match ? match[2] : null
}

/**
 * Validate that a string is a usable Instagram post/reel URL.
 * @param {string} url
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
export function validateInstagramUrl(url) {
  if (!url || !url.trim()) {
    return { valid: false, error: 'empty' }
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, error: 'not-instagram' }
  }

  if (parsed.protocol !== 'https:' || !INSTAGRAM_HOST_RE.test(parsed.hostname)) {
    return { valid: false, error: 'not-instagram' }
  }

  if (!extractShortcode(url)) {
    return { valid: false, error: 'no-shortcode' }
  }

  return { valid: true }
}

/**
 * Parse an Instagram URL into shortcode and type.
 * Returns null if the URL doesn't contain a valid shortcode path.
 * @param {string} url
 * @returns {{ shortcode: string, type: string } | null}
 */
export function parseInstagramUrl(url) {
  const match = url.match(SHORTCODE_RE)
  if (!match) return null
  return { shortcode: match[2], type: match[1] }
}

// ── GraphQL request building (used by Cloudflare Worker) ──

const GRAPHQL_DOC_ID = '8845758582119845'

/**
 * Build the URL-encoded form body for Instagram's GraphQL endpoint.
 * @param {string} shortcode
 * @returns {string}
 */
export function buildGraphQLBody(shortcode) {
  const variables = JSON.stringify({
    shortcode,
    fetch_tagged_user_count: null,
    hoisted_comment_id: null,
    hoisted_reply_id: null,
  })
  const params = new URLSearchParams({
    variables,
    doc_id: GRAPHQL_DOC_ID,
    lsd: 'AVrqPT0gJDo',
  })
  return params.toString()
}

/**
 * Parse Instagram's GraphQL response into a normalized result.
 * @param {object} response - raw JSON from Instagram
 * @returns {{ type: 'video', videoUrl: string, thumbnailUrl: string, caption: string, username: string }
 *         | { type: 'photo', photoUrl: string, thumbnailUrl: string, caption: string, username: string }
 *         | { error: string }}
 */
export function parseGraphQLResponse(response) {
  const media = response?.data?.xdt_shortcode_media
  if (!media) return { error: 'not-found' }

  const captionEdges = media.edge_media_to_caption?.edges ?? []
  const caption = captionEdges.length > 0 ? captionEdges[0].node.text : ''
  const username = media.owner?.username ?? ''
  const thumbnailUrl = media.display_url ?? ''

  if (media.is_video) {
    return {
      type: 'video',
      videoUrl: media.video_url,
      thumbnailUrl,
      caption,
      username,
    }
  }

  return {
    type: 'photo',
    photoUrl: media.display_url,
    thumbnailUrl,
    caption,
    username,
  }
}

// ── User-facing error messages ──

const ERROR_MESSAGES = {
  'empty': 'Please paste an Instagram URL.',
  'not-instagram': "This doesn't look like an Instagram URL.",
  'no-shortcode': 'Could not find a post or reel in this URL.',
  'not-found': 'Post not found. It may be private or deleted.',
  'rate-limited': 'Too many requests. Please try again in a minute.',
  'not-video': 'This post is not a video.',
  'server-error': 'Something went wrong. Please try again.',
}

/**
 * Get a user-facing error message for a given error code.
 * @param {string} code
 * @returns {string}
 */
export function errorMessage(code) {
  return ERROR_MESSAGES[code] ?? 'Something went wrong. Please try again.'
}
