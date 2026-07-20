# OGG to MP3 Converter — Design Spec

**Date:** 2026-07-20
**Status:** Draft — awaiting review
**Verdict on feasibility:** Viable, low-risk. The entire pipeline already runs in production: `file-converter` converts OGG→MP3 today via ffmpeg.wasm, and `mp4-to-mp3` proves the dedicated-landing-page pattern (same loader, same libmp3lame args). This tool is an SEO play: a dedicated page targeting "ogg to mp3" queries, reusing existing infrastructure.

## Why browser-based works

- **Decode + encode:** ffmpeg.wasm (already loaded from CDN via `src/tools/ffmpeg-loader.js`, classic-Worker approach, no SharedArrayBuffer needed). It decodes OGG Vorbis **and** OGG Opus containers and encodes MP3 with `libmp3lame`. No server, no upload — files never leave the browser.
- **Proven precedent:** `mp4-to-mp3.js` uses the exact same flow (write file to WASM FS → `ff.exec(args)` → read output → Blob download). The ~25 MB engine downloads once and is cached.
- **Cloudflare 25 MiB limit:** not an issue — ffmpeg core comes from jsDelivr CDN (same solution as pandoc.wasm, commit 64541ab).
- **Browser support caveat:** the `<audio>` preview of the *input* OGG file does not play in Safari (no OGG support in the media element). Conversion still works (ffmpeg does the decoding, not the browser). The result MP3 preview plays everywhere. Input preview is therefore best-effort: hide the player if `audio.canPlayType('audio/ogg')` returns `''`.

## SEO

**Target query (pending Semrush validation):** "ogg to mp3" / "ogg to mp3 converter" — same family as mp4-to-mp3. Semrush was unavailable during spec writing (API units exhausted); validate volume/KD before merge and adjust title phrasing if a higher-intent variant appears (e.g. "convert ogg to mp3 online").

- **Page:** `/ogg-to-mp3`
- **Title:** `OGG to MP3 Converter — Free, No Upload | maratool`
- **h1 / tools.ts name:** `Convert OGG to MP3 — Free Online Converter`
- **description (140–160 chars):** "Convert OGG (Vorbis or Opus) files to MP3 in your browser. Pick a bitrate, convert, download — no upload, no signup, files never leave your device."
- **keywords:** `['ogg to mp3', 'convert ogg to mp3', 'ogg to mp3 converter', 'ogg to mp3 online', 'ogg file to mp3', 'convert ogg to mp3 free', 'opus to mp3', 'ogg converter']`
- **tools.ts entry:** `category: 'Converter'`, `subcategory: 'Audio'`, `live: true`, `blogPost: true`, added to the `slowTools` list (line ~5194) since it loads the ffmpeg engine.
- Schema: `WebApplication` + `FAQPage` (4 Q&A) — same as every tool page.
- Related tools: mp4-to-mp3, file-converter, compress-audio.

## Architecture

Three files, mirroring mp4-to-mp3 exactly:

```
src/tools/ogg-to-mp3-core.js        # pure logic, zero DOM, zero imports — unit tested
src/tools/ogg-to-mp3-core.test.js   # vitest, written FIRST (TDD)
src/tools/ogg-to-mp3.js             # DOM wiring, imports core + ffmpeg-loader.js
src/pages/ogg-to-mp3.astro          # page: ToolShell, <style is:global>, schema
src/pages/blog/ogg-to-mp3.astro     # blog post with <BlogToolEmbed slug="ogg-to-mp3" />
```

### Core module (`ogg-to-mp3-core.js`) — the tested unit

Pure functions, no DOM, no ffmpeg dependency (it only *builds* arguments):

1. **`validateAudioFile(file)`** → `{ valid, error? }`
   Accepts `.ogg`, `.oga`, `.opus` extensions or MIME types `audio/ogg`, `application/ogg`, `audio/opus`, `video/ogg` (OGG files are frequently mislabeled). Rejects null/undefined, empty name with unknown MIME, and non-OGG files with a message naming the accepted formats. Extension check is case-insensitive.
2. **`validateBitrate(bitrate)`** → `{ valid, error? }`
   Allowed: 128 (smaller file), 192 (default, recommended), 320 (max quality). Reuse pattern from mp4-to-mp3-core (accepts number or numeric string).
3. **`buildConvertArgs({ inputName, outputName, bitrate })`** → ffmpeg args array
   `['-i', inputName, '-vn', '-c:a', 'libmp3lame', '-b:a', '<n>k', '-y', outputName]` — `-vn` kept deliberately: `.ogg` can carry a Theora video stream and we only want audio.
4. **`getOutputFilename(inputName)`** → `song.ogg` → `song.mp3`; no/leading dot → append `.mp3`; empty/invalid → `audio.mp3`.
5. **`getMaxFileSize()`** → 500 MB (audio files; mp4-to-mp3 allows 2 GB for video, audio needs less headroom).

**Reuse decision:** `validateBitrate` and `getOutputFilename` are byte-identical to mp4-to-mp3-core. Import them from `./mp4-to-mp3-core.js` and re-export from `ogg-to-mp3-core.js`, so the UI module imports a single core. Cross-core imports are established practice (`mp4-to-mp3.js` already imports from `fps-converter-core.js`). The new tests still cover both functions through `ogg-to-mp3-core.js` — they pin the contract regardless of where the implementation lives.

### UI module (`ogg-to-mp3.js`)

Direct adaptation of `mp4-to-mp3.js` (IIFE, `var`, vanilla JS):

- **States:** dropzone → settings → progress → result | error (same `showState` pattern).
- **Dropzone:** click + drag-and-drop, `accept=".ogg,.oga,.opus,audio/ogg"`.
- **Settings panel:** input file name/size, best-effort `<audio>` preview (hidden on Safari via `canPlayType`), bitrate `<select>` (128/192/320, default 192), "Convert to MP3" button.
- **Progress:** reuse ffmpeg-loader progress callback (engine download %, then conversion % parsed from ffmpeg `time=` logs against input duration when known; if duration is unavailable — Safari can't load OGG metadata — show indeterminate "Converting…" text instead of a fake percentage).
- **Result:** `<audio>` player with MP3 blob, file size + bitrate stats, Download button (`song.mp3`), "Convert another" reset.
- **Errors:** validation errors and ffmpeg non-zero exit (last 3 log lines, same as mp4-to-mp3), Retry button.
- Blob URL hygiene: revoke previous URLs on every state change (same as mp4-to-mp3).

### Page (`ogg-to-mp3.astro`)

- ToolShell with tool UI above the fold, container `min-height` set (CLS rule).
- `<style is:global>` — mandatory (JS-created elements).
- "How to use" (3 steps), FAQ (4 questions), Related tools (mp4-to-mp3, file-converter, compress-audio).
- FAQ candidates (dev/user phrasing): "Is OGG better quality than MP3?", "Does converting OGG to MP3 lose quality?", "Are my files uploaded to a server?", "What's the difference between OGG Vorbis and Opus?".

### Blog post

`src/pages/blog/ogg-to-mp3.astro` per CLAUDE.md template: BlogPosting schema, job-phrased headline ("How to Convert OGG to MP3 in Your Browser"), `<BlogToolEmbed slug="ogg-to-mp3" />`, "How it works" 3 steps, sections on bitrate choice + why OGG→MP3 is lossy-to-lossy (recommend 192k+), footer links to tool + Converter hub. Add to `blog/index.astro` posts array (newest first).

## TDD Plan

Test framework: vitest (`npm test`). The core module is the testable unit; UI wiring and ffmpeg execution are verified manually in the browser (project convention — no DOM/ffmpeg mocking in existing tests).

**Red → Green cycle, in order:**

1. Write `ogg-to-mp3-core.test.js` covering:
   - `validateAudioFile`: accepts `.ogg`/`.oga`/`.opus` (upper & lower case), accepts correct MIME with wrong extension, rejects `.mp3`/`.wav`/`.mp4`, rejects null, error message names accepted formats.
   - `validateBitrate`: 128/192/320 as number and string valid; 256, 0, 'bad', null invalid.
   - `buildConvertArgs`: exact arg arrays for each bitrate; includes `-vn`; `-y` before output name.
   - `getOutputFilename`: `song.ogg`→`song.mp3`, `a.b.opus`→`a.b.mp3`, `noext`→`noext.mp3`, `.hidden`→`.hidden.mp3`, `''`/null→`audio.mp3`.
   - `getMaxFileSize`: returns 500 MB in bytes.
2. Run `npm test` → all new tests fail (module doesn't exist).
3. Implement `ogg-to-mp3-core.js` until green.
4. Existing quality-gate test (`blogPost: true` ⇒ blog file with BlogToolEmbed) goes red when the tools.ts entry lands → blog post makes it green.
5. `npm run build` zero errors/warnings.

**Manual browser verification (not automatable here):**
- Convert a real OGG Vorbis file and an Opus-in-OGG file; play the MP3 result.
- Check dropzone drag-over state, copy of progress text, "Convert another" reset.
- Inspect a JS-created element to confirm global styles applied (Astro scoping rule).
- Confirm no CLS (min-height on container).

## Error handling

| Failure | Behavior |
|---|---|
| Wrong file type | Validation error before any engine load: "Please select an OGG audio file (.ogg, .oga, .opus)." |
| File > 500 MB | Error with formatted size and limit |
| ffmpeg engine fetch fails (offline/CDN) | Error state + Retry (re-attempts load) |
| ffmpeg exec non-zero (corrupt file) | "Conversion failed" + last 3 ffmpeg log lines |
| Safari input preview | Player hidden, conversion unaffected |

## Out of scope (YAGNI)

- Batch conversion (file-converter covers it)
- Reverse direction MP3→OGG (file-converter covers it; separate SEO page could come later)
- VBR/quality-slider encoding — three CBR presets only, matching mp4-to-mp3
- Metadata/tag editing

## Pre-merge checklist

- [ ] Semrush keyword validation for "ogg to mp3" variants (blocked today: account out of API units — ask account owner)
- [ ] `npm test` green (new core tests + blog quality gate)
- [ ] `npm run build` clean
- [ ] Manual conversion test with real .ogg and .opus files in Chrome + Safari
- [ ] sitemap includes `/ogg-to-mp3` (automatic via @astrojs/sitemap)
