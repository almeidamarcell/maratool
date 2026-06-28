/** CSP applied when ?embed=1 — allows any parent site to iframe the tool. */
export const EMBED_FRAME_ANCESTORS_CSP = "frame-ancestors *";

/**
 * @param {URL} url
 * @returns {boolean}
 */
export function isEmbedRequest(url) {
  return url.searchParams.get("embed") === "1";
}

/**
 * Strip X-Frame-Options and allow external framing for embed mode.
 * @param {Headers} headers
 * @returns {Headers}
 */
export function applyEmbedFrameHeaders(headers) {
  const next = new Headers(headers);
  next.delete("X-Frame-Options");
  next.set("Content-Security-Policy", EMBED_FRAME_ANCESTORS_CSP);
  return next;
}
