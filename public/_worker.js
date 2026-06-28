import {
  applyEmbedFrameHeaders,
  isEmbedRequest,
} from "./embed-frame-headers.js";

// Pass-through Cloudflare Pages worker. Forces static asset serving
// for every path — fixes a 500 on /compare/* where a leftover worker
// from a previous deploy was intercepting these paths.
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    if (!isEmbedRequest(url)) {
      return response;
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: applyEmbedFrameHeaders(response.headers),
    });
  },
};
