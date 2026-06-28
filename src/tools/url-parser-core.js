/** Parse URL into components */

export function parseUrl(input) {
  const raw = String(input || '').trim()
  if (!raw) return { valid: false, error: 'Empty URL' }

  try {
    const u = new URL(raw.includes('://') ? raw : 'https://' + raw)
    const params = {}
    u.searchParams.forEach((value, key) => {
      if (params[key] === undefined) params[key] = value
      else if (Array.isArray(params[key])) params[key].push(value)
      else params[key] = [params[key], value]
    })
    return {
      valid: true,
      href: u.href,
      protocol: u.protocol,
      username: u.username,
      password: u.password ? '••••' : '',
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      origin: u.origin,
      params,
    }
  } catch {
    return { valid: false, error: 'Invalid URL' }
  }
}
