// Pass-through Cloudflare Pages worker. Forces static asset serving
// for every path — fixes a 500 on /compare/* where a leftover worker
// from a previous deploy was intercepting these paths.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request)
  },
}
