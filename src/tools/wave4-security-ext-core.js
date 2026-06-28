/** Wave 4 security / certificate utilities (paste-only) */

export function compareHashes(a, b) {
  const left = String(a || '').trim().toLowerCase()
  const right = String(b || '').trim().toLowerCase()
  if (!left || !right) return { match: false, error: 'Both hashes required' }
  return { match: left === right, error: null }
}

export function decodePem(pem) {
  const blocks = []
  const re = /-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/g
  let m
  while ((m = re.exec(String(pem || '')))) {
    const b64 = m[2].replace(/\s/g, '')
    blocks.push({ type: m[1].trim(), base64: b64, binaryLength: atobLen(b64) })
  }
  return blocks
}

function atobLen(b64) {
  try { return atob(b64).length } catch { return 0 }
}

export function formatPem(type, derBytes) {
  const b64 = bytesToBase64(derBytes)
  const lines = b64.match(/.{1,64}/g) || []
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`
}

function bytesToBase64(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

export function parseDerUtcTime(bytes, offset) {
  const tag = bytes[offset]
  const len = bytes[offset + 1]
  const str = String.fromCharCode(...bytes.slice(offset + 2, offset + 2 + len))
  if (tag === 0x17) return `20${str.slice(0, 2)}-${str.slice(2, 4)}-${str.slice(4, 6)}`
  return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`
}

export function parseCertificateValidity(derBytes) {
  const bytes = derBytes instanceof Uint8Array ? derBytes : new Uint8Array(derBytes)
  const times = []
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0x17 || bytes[i] === 0x18) {
      try { times.push(parseDerUtcTime(bytes, i)) } catch { /* skip */ }
    }
  }
  if (times.length < 2) return { notBefore: null, notAfter: null, error: 'Could not parse validity' }
  return { notBefore: times[0], notAfter: times[1], error: null }
}

export function decodeCertificatePem(pem) {
  const blocks = decodePem(pem)
  const cert = blocks.find(b => b.type === 'CERTIFICATE')
  if (!cert) return { error: 'No CERTIFICATE block found' }
  let der
  try { der = Uint8Array.from(atob(cert.base64), c => c.charCodeAt(0)) } catch {
    return { error: 'Invalid base64 in certificate' }
  }
  const validity = parseCertificateValidity(der)
  return {
    type: cert.type,
    sizeBytes: der.length,
    ...validity,
    error: validity.error,
  }
}

export function daysUntilExpiration(notAfter) {
  if (!notAfter) return null
  const end = new Date(notAfter)
  if (isNaN(end.getTime())) return null
  return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24))
}

export function buildCsrSubject(fields = {}) {
  const order = ['CN', 'O', 'OU', 'L', 'ST', 'C']
  return order
    .filter(k => fields[k])
    .map(k => `${k}=${fields[k]}`)
    .join(', ')
}

export async function generateRsaKeyPairPem() {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return { publicKeyPem: '', privateKeyPem: '', error: 'Web Crypto not available' }
  }
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  const pub = await crypto.subtle.exportKey('spki', pair.publicKey)
  const priv = await crypto.subtle.exportKey('pkcs8', pair.privateKey)
  return {
    publicKeyPem: formatPem('PUBLIC KEY', new Uint8Array(pub)),
    privateKeyPem: formatPem('PRIVATE KEY', new Uint8Array(priv)),
    error: null,
  }
}

export async function checksumText(text, algorithm = 'SHA-256') {
  if (typeof crypto === 'undefined' || !crypto.subtle) return { hex: '', error: 'Web Crypto not available' }
  const data = new TextEncoder().encode(text || '')
  const buf = await crypto.subtle.digest(algorithm, data)
  const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
  return { hex, algorithm, error: null }
}
