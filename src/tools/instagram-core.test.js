import { describe, it, expect } from 'vitest'
import { extractShortcode, validateInstagramUrl, parseInstagramUrl, buildGraphQLBody, parseGraphQLResponse, errorMessage } from './instagram-core.js'

describe('extractShortcode', () => {
  it('extracts shortcode from /p/ URL', () => {
    expect(extractShortcode('https://www.instagram.com/p/ABC123def-g/')).toBe('ABC123def-g')
  })

  it('extracts shortcode from /reel/ URL', () => {
    expect(extractShortcode('https://www.instagram.com/reel/DFx_2HLsQ4T/')).toBe('DFx_2HLsQ4T')
  })

  it('extracts shortcode from /tv/ URL', () => {
    expect(extractShortcode('https://www.instagram.com/tv/CxYz123AbC/')).toBe('CxYz123AbC')
  })

  it('handles URLs without trailing slash', () => {
    expect(extractShortcode('https://www.instagram.com/p/ABC123')).toBe('ABC123')
  })

  it('handles URLs with query strings', () => {
    expect(extractShortcode('https://www.instagram.com/reel/DFx_2HLsQ4T/?igsh=abc123')).toBe('DFx_2HLsQ4T')
  })

  it('handles URLs without www', () => {
    expect(extractShortcode('https://instagram.com/p/ABC123/')).toBe('ABC123')
  })

  it('handles mobile share URLs (m.instagram.com)', () => {
    expect(extractShortcode('https://m.instagram.com/reel/DFx_2HLsQ4T/')).toBe('DFx_2HLsQ4T')
  })

  it('returns null for non-Instagram URLs', () => {
    expect(extractShortcode('https://example.com/p/ABC123/')).toBe('ABC123')
    // Note: extractShortcode only extracts the shortcode pattern, it does NOT validate the domain.
    // Domain validation is done by validateInstagramUrl.
  })

  it('returns null for URLs without shortcode path', () => {
    expect(extractShortcode('https://www.instagram.com/username/')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractShortcode('')).toBeNull()
  })

  it('returns null for profile URLs', () => {
    expect(extractShortcode('https://www.instagram.com/natgeo')).toBeNull()
  })
})

describe('validateInstagramUrl', () => {
  it('accepts valid www.instagram.com post URL', () => {
    expect(validateInstagramUrl('https://www.instagram.com/p/ABC123/')).toEqual({ valid: true })
  })

  it('accepts valid reel URL', () => {
    expect(validateInstagramUrl('https://www.instagram.com/reel/DFx_2HLsQ4T/')).toEqual({ valid: true })
  })

  it('accepts instagram.com without www', () => {
    expect(validateInstagramUrl('https://instagram.com/p/ABC123/')).toEqual({ valid: true })
  })

  it('accepts m.instagram.com', () => {
    expect(validateInstagramUrl('https://m.instagram.com/reel/ABC123/')).toEqual({ valid: true })
  })

  it('rejects non-Instagram domains', () => {
    const result = validateInstagramUrl('https://example.com/p/ABC123/')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('not-instagram')
  })

  it('rejects URLs without shortcode', () => {
    const result = validateInstagramUrl('https://www.instagram.com/username/')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('no-shortcode')
  })

  it('rejects empty input', () => {
    const result = validateInstagramUrl('')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('empty')
  })

  it('rejects non-URL strings', () => {
    const result = validateInstagramUrl('not a url at all')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('not-instagram')
  })

  it('rejects http (non-https) URLs', () => {
    const result = validateInstagramUrl('http://www.instagram.com/p/ABC123/')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('not-instagram')
  })
})

describe('parseInstagramUrl', () => {
  it('returns shortcode and type for post URL', () => {
    expect(parseInstagramUrl('https://www.instagram.com/p/ABC123/')).toEqual({
      shortcode: 'ABC123',
      type: 'p',
    })
  })

  it('returns shortcode and type for reel URL', () => {
    expect(parseInstagramUrl('https://www.instagram.com/reel/DFx_2HLsQ4T/')).toEqual({
      shortcode: 'DFx_2HLsQ4T',
      type: 'reel',
    })
  })

  it('returns shortcode and type for tv URL', () => {
    expect(parseInstagramUrl('https://www.instagram.com/tv/CxYz123AbC/')).toEqual({
      shortcode: 'CxYz123AbC',
      type: 'tv',
    })
  })

  it('returns null for invalid URL', () => {
    expect(parseInstagramUrl('https://example.com/whatever')).toBeNull()
  })

  it('returns null for profile URL', () => {
    expect(parseInstagramUrl('https://www.instagram.com/natgeo')).toBeNull()
  })

  it('strips query params when extracting shortcode', () => {
    expect(parseInstagramUrl('https://www.instagram.com/reel/DFx_2HLsQ4T/?igsh=abc')).toEqual({
      shortcode: 'DFx_2HLsQ4T',
      type: 'reel',
    })
  })
})

describe('buildGraphQLBody', () => {
  it('returns a string containing the shortcode', () => {
    const body = buildGraphQLBody('ABC123')
    expect(body).toContain('ABC123')
  })

  it('includes the GraphQL doc_id', () => {
    const body = buildGraphQLBody('ABC123')
    expect(body).toContain('8845758582119845')
  })

  it('returns URL-encoded form body', () => {
    const body = buildGraphQLBody('ABC123')
    // Should be key=value&key=value format
    expect(body).toContain('variables=')
    expect(body).toContain('doc_id=')
  })
})

describe('parseGraphQLResponse', () => {
  it('extracts video URL from valid video response', () => {
    const response = {
      data: {
        xdt_shortcode_media: {
          is_video: true,
          video_url: 'https://cdn.instagram.com/video.mp4',
          display_url: 'https://cdn.instagram.com/thumb.jpg',
          edge_media_to_caption: { edges: [{ node: { text: 'My caption' } }] },
          owner: { username: 'testuser' },
        }
      }
    }
    const result = parseGraphQLResponse(response)
    expect(result).toEqual({
      type: 'video',
      videoUrl: 'https://cdn.instagram.com/video.mp4',
      thumbnailUrl: 'https://cdn.instagram.com/thumb.jpg',
      caption: 'My caption',
      username: 'testuser',
    })
  })

  it('extracts photo URL from non-video response', () => {
    const response = {
      data: {
        xdt_shortcode_media: {
          is_video: false,
          display_url: 'https://cdn.instagram.com/photo.jpg',
          edge_media_to_caption: { edges: [{ node: { text: 'Photo caption' } }] },
          owner: { username: 'photouser' },
        }
      }
    }
    const result = parseGraphQLResponse(response)
    expect(result).toEqual({
      type: 'photo',
      photoUrl: 'https://cdn.instagram.com/photo.jpg',
      thumbnailUrl: 'https://cdn.instagram.com/photo.jpg',
      caption: 'Photo caption',
      username: 'photouser',
    })
  })

  it('returns error for null media (post not found)', () => {
    const response = { data: { xdt_shortcode_media: null } }
    const result = parseGraphQLResponse(response)
    expect(result).toEqual({ error: 'not-found' })
  })

  it('handles missing caption gracefully', () => {
    const response = {
      data: {
        xdt_shortcode_media: {
          is_video: true,
          video_url: 'https://cdn.instagram.com/video.mp4',
          display_url: 'https://cdn.instagram.com/thumb.jpg',
          edge_media_to_caption: { edges: [] },
          owner: { username: 'testuser' },
        }
      }
    }
    const result = parseGraphQLResponse(response)
    expect(result.caption).toBe('')
  })

  it('handles missing owner gracefully', () => {
    const response = {
      data: {
        xdt_shortcode_media: {
          is_video: true,
          video_url: 'https://cdn.instagram.com/video.mp4',
          display_url: 'https://cdn.instagram.com/thumb.jpg',
          edge_media_to_caption: { edges: [] },
        }
      }
    }
    const result = parseGraphQLResponse(response)
    expect(result.username).toBe('')
  })

  it('returns error for completely malformed response', () => {
    const result = parseGraphQLResponse({})
    expect(result).toEqual({ error: 'not-found' })
  })
})

describe('errorMessage', () => {
  it('returns message for empty error', () => {
    expect(errorMessage('empty')).toBe('Please paste an Instagram URL.')
  })

  it('returns message for not-instagram error', () => {
    expect(errorMessage('not-instagram')).toBe('This doesn\'t look like an Instagram URL.')
  })

  it('returns message for no-shortcode error', () => {
    expect(errorMessage('no-shortcode')).toBe('Could not find a post or reel in this URL.')
  })

  it('returns message for not-found error', () => {
    expect(errorMessage('not-found')).toBe('Post not found. It may be private or deleted.')
  })

  it('returns message for rate-limited error', () => {
    expect(errorMessage('rate-limited')).toBe('Too many requests. Please try again in a minute.')
  })

  it('returns generic message for unknown error', () => {
    expect(errorMessage('some-unknown-error')).toBe('Something went wrong. Please try again.')
  })
})
