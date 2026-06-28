#!/usr/bin/env node
/**
 * Generate .astro tool pages + blog posts for GIF backlog tools.
 * Run: node scripts/generate-gif-backlog-tools.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.join(import.meta.dirname, '..')
const PAGES = path.join(ROOT, 'src', 'pages')
const BLOG = path.join(PAGES, 'blog')
const DATE = 'June 28, 2026'
const DATE_ISO = '2026-06-28'

const tools = [
  {
    slug: 'add-text-to-gif',
    name: 'Add Text to GIF — Write Captions on Animated GIFs',
    shortName: 'Add Text to GIF',
    seoTitle: 'Add Text to GIF — Write Captions on Animated GIFs | maratool',
    description: 'Add text overlays and captions to animated GIFs in your browser. Pick fonts, colors, position, and download — no upload, no watermark.',
    keywords: ['add text to gif', 'gif caption maker', 'write on gif online', 'gif text editor', 'gif meme maker', 'caption gif'],
    subcategory: 'Transform',
    prefix: 'atg',
    minHeight: 520,
    howTo: ['Upload an animated GIF.', 'Type your caption, pick font, size, color, and position.', 'Preview live, then download the captioned GIF.'],
    faq: [
      { q: 'Can I add text to every frame of a GIF?', a: 'Yes. Text is burned into each frame. You can apply to all frames or a specific frame range.' },
      { q: 'Does my GIF get uploaded?', a: 'No. Parsing, rendering, and encoding all run locally in your browser.' },
      { q: 'Can I drag the text to any position?', a: 'Yes. Choose top, center, bottom presets or drag the text overlay freely on the preview.' },
      { q: 'What fonts are available?', a: 'System fonts plus a curated set of Google Fonts loaded on demand.' },
    ],
    related: ['gif-maker', 'gif-compressor', 'gif-overlay'],
    blogTitle: 'How to add text and captions to a GIF',
    blogLead: 'Upload a GIF, type your caption, style it, and download — all in your browser.',
    embedHeight: 640,
  },
  {
    slug: 'webp-to-mp4',
    name: 'Convert Animated WebP to MP4',
    shortName: 'WebP to MP4 Converter',
    seoTitle: 'WebP to MP4 Converter — Animated WebP to Video | maratool',
    description: 'Convert animated WebP images to MP4 video in your browser. Adjust quality and resolution, then download — no upload required.',
    keywords: ['webp to mp4', 'convert webp to mp4', 'animated webp to mp4', 'webp to video', 'webp to mp4 online', 'webp converter'],
    category: 'Converter',
    subcategory: 'Video',
    prefix: 'w2m',
    minHeight: 420,
    howTo: ['Upload an animated WebP file.', 'Set quality and output resolution.', 'Convert and download the MP4.'],
    faq: [
      { q: 'Does this work with animated WebP?', a: 'Yes. Static WebP files also convert to a short MP4 with a single frame.' },
      { q: 'Is FFmpeg used?', a: 'Yes — FFmpeg runs as WebAssembly in your browser. Your file never leaves your device.' },
      { q: 'Can I convert multiple files?', a: 'Yes. Use batch mode to convert several WebP files and download them as a ZIP.' },
      { q: 'Why convert WebP to MP4?', a: 'MP4 plays everywhere — social platforms, editors, and older apps that do not support animated WebP.' },
    ],
    related: ['video-to-gif', 'file-converter', 'mov-to-mp4'],
    blogTitle: 'How to convert animated WebP to MP4',
    blogLead: 'Turn animated WebP into MP4 video with FFmpeg in your browser.',
    embedHeight: 520,
  },
  {
    slug: 'censor-image',
    name: 'Censor Image Online — Pixelate or Blur Areas',
    shortName: 'Censor Image',
    seoTitle: 'Censor Image Online — Pixelate or Blur Faces & Areas | maratool',
    description: 'Pixelate or blur specific areas of images and GIFs. Draw rectangles over faces or sensitive content, then download.',
    keywords: ['pixelate image online', 'blur face in image', 'censor image online', 'pixelate gif', 'blur image area', 'censor photo'],
    subcategory: 'Transform',
    prefix: 'cen',
    minHeight: 480,
    howTo: ['Upload an image or animated GIF.', 'Draw rectangles over areas to censor and pick pixelate or blur.', 'Apply and download the result.'],
    faq: [
      { q: 'Does this work on GIFs?', a: 'Yes. Draw censor regions once and they apply to every frame, or limit to a frame range.' },
      { q: 'Pixelate vs blur?', a: 'Pixelate replaces blocks with averaged colors. Blur applies a gaussian blur — better for faces.' },
      { q: 'Can I add multiple regions?', a: 'Yes. Draw as many rectangles as you need before applying.' },
      { q: 'Is processing local?', a: 'Yes. Your image or GIF never leaves your browser.' },
    ],
    related: ['gif-compressor', 'background-remover', 'image-compressor'],
    blogTitle: 'How to pixelate or blur areas in an image',
    blogLead: 'Draw rectangles over sensitive areas and censor them with pixelate or blur.',
    embedHeight: 560,
  },
  {
    slug: 'combine-gifs',
    name: 'Combine GIFs Side by Side',
    shortName: 'Combine GIFs',
    seoTitle: 'Combine GIFs Side by Side — Merge Animated GIFs | maratool',
    description: 'Merge two or more GIFs into one animation — side by side or stacked. Align timing and download the combined GIF.',
    keywords: ['combine gifs', 'merge gifs side by side', 'join gifs online', 'gif combiner', 'stack gifs', 'merge animated gifs'],
    subcategory: 'Transform',
    prefix: 'cgf',
    minHeight: 460,
    howTo: ['Upload two or more GIF files.', 'Choose horizontal or vertical layout and alignment.', 'Download the merged GIF.'],
    faq: [
      { q: 'How are different frame counts handled?', a: 'Align to the longest or shortest animation — shorter GIFs loop or hold their last frame.' },
      { q: 'Can GIFs have different sizes?', a: 'Yes. Enable resize to match dimensions so frames align cleanly.' },
      { q: 'Minimum number of GIFs?', a: 'Two. You can add more — each appears in the combined layout.' },
      { q: 'Runs in browser?', a: 'Yes. No server upload.' },
    ],
    related: ['gif-maker', 'gif-overlay', 'add-text-to-gif'],
    blogTitle: 'How to combine GIFs side by side',
    blogLead: 'Merge multiple animated GIFs into one file — horizontal or vertical layout.',
    embedHeight: 520,
  },
  {
    slug: 'gif-overlay',
    name: 'GIF Overlay — Add Image on Top of GIF',
    shortName: 'GIF Overlay',
    seoTitle: 'GIF Overlay — Add Logo or Watermark to Animated GIF | maratool',
    description: 'Overlay a static image or another GIF on top of an animated GIF. Drag to position, resize, set opacity, and download.',
    keywords: ['gif overlay', 'add watermark to gif', 'logo on gif', 'overlay image on gif', 'gif watermark maker', 'put image on gif'],
    subcategory: 'Transform',
    prefix: 'gov',
    minHeight: 500,
    howTo: ['Upload the base GIF and an overlay image or GIF.', 'Drag, resize, and set overlay opacity.', 'Apply to all frames or a range, then download.'],
    faq: [
      { q: 'Can the overlay be another GIF?', a: 'Yes. Animated overlays play on top of the base GIF.' },
      { q: 'Watermark opacity?', a: 'Use the opacity slider — from fully transparent to solid.' },
      { q: 'Frame range?', a: 'Apply the overlay to all frames or only a specific range.' },
      { q: 'Privacy?', a: 'Everything runs locally in your browser.' },
    ],
    related: ['add-text-to-gif', 'combine-gifs', 'gif-compressor'],
    blogTitle: 'How to overlay an image or logo on a GIF',
    blogLead: 'Add a watermark or logo on top of any animated GIF.',
    embedHeight: 580,
  },
  {
    slug: 'gif-analyzer',
    name: 'GIF Analyzer — Inspect GIF Structure',
    shortName: 'GIF Analyzer',
    seoTitle: 'GIF Analyzer — Inspect Animated GIF Structure | maratool',
    description: 'Inspect animated GIF internals: dimensions, frame count, delays, palettes, and disposal methods. Export metadata as JSON.',
    keywords: ['gif analyzer', 'inspect gif', 'gif metadata', 'gif frame info', 'gif structure', 'debug gif'],
    subcategory: 'Inspect',
    prefix: 'gan',
    minHeight: 480,
    howTo: ['Upload a GIF file.', 'Review summary stats and per-frame details.', 'Export the metadata as JSON if needed.'],
    faq: [
      { q: 'What can I learn from the analyzer?', a: 'Dimensions, file size, frame count, loop count, per-frame delays, offsets, disposal methods, and color palettes.' },
      { q: 'Why inspect GIF structure?', a: 'Debug broken animations, optimize file size, or understand how a GIF was built.' },
      { q: 'Color table visualization?', a: 'Yes — see the actual colors in global and local palettes.' },
      { q: 'Upload required?', a: 'No server upload. Parsing happens in your browser.' },
    ],
    related: ['gif-compressor', 'gif-maker', 'image-compressor'],
    blogTitle: 'How to inspect GIF frame structure and metadata',
    blogLead: 'Upload a GIF and see every frame, delay, palette, and disposal method.',
    embedHeight: 600,
  },
  {
    slug: 'square-gif',
    name: 'Square GIF for Instagram',
    shortName: 'Square GIF',
    seoTitle: 'Square GIF for Instagram — Crop & Pad Animated GIFs | maratool',
    description: 'Convert GIFs to square 1:1 format with padding or crop — optimized for Instagram and social feeds. Free, in your browser.',
    keywords: ['square gif', 'instagram gif', 'gif crop square', '1:1 gif', 'gif padding', 'social media gif'],
    subcategory: 'Social',
    prefix: 'sqg',
    minHeight: 460,
    howTo: ['Upload an animated GIF.', 'Choose crop or pad with background color.', 'Download the square GIF.'],
    faq: [
      { q: 'Crop vs pad?', a: 'Crop cuts to a centered square. Pad adds colored borders to reach 1:1 without losing content.' },
      { q: 'Output size?', a: 'Defaults to 1080×1080 — standard for Instagram posts.' },
      { q: 'Works on animated GIFs?', a: 'Yes. Every frame is processed the same way.' },
      { q: 'Local processing?', a: 'Yes. No upload to servers.' },
    ],
    related: ['matte-generator', 'gif-compressor', 'add-text-to-gif'],
    blogTitle: 'How to make a square GIF for Instagram',
    blogLead: 'Crop or pad any GIF to 1:1 for Instagram and social feeds.',
    embedHeight: 520,
  },
  {
    slug: 'shuffle-gif-frames',
    name: 'Shuffle GIF Frames — Randomize Frame Order',
    shortName: 'Shuffle GIF Frames',
    seoTitle: 'Shuffle GIF Frames — Randomize Animated GIF Order | maratool',
    description: 'Randomize the frame order of a GIF for glitch or chaotic effects. Full shuffle or partial shuffle every N frames.',
    keywords: ['shuffle gif frames', 'randomize gif', 'gif glitch effect', 'scramble gif frames', 'chaotic gif'],
    subcategory: 'Transform',
    prefix: 'sgf',
    minHeight: 400,
    howTo: ['Upload a GIF.', 'Choose full shuffle or partial shuffle every N frames.', 'Preview and download.'],
    faq: [
      { q: 'What is partial shuffle?', a: 'Shuffles frames within groups of N — keeps some local order while scrambling sections.' },
      { q: 'Reversible?', a: 'No — shuffling is random. Keep your original file if you need to undo.' },
      { q: 'Preview before download?', a: 'Yes. The preview plays the shuffled animation.' },
      { q: 'Browser-based?', a: 'Yes.' },
    ],
    related: ['gif-maker', 'gif-compressor', 'animate-image-gif'],
    blogTitle: 'How to shuffle GIF frames for glitch effects',
    blogLead: 'Randomize frame order for chaotic or glitch-style GIFs.',
    embedHeight: 440,
  },
  {
    slug: 'animate-image-gif',
    name: 'Animate Image to GIF — Zoom, Pan & Effects',
    shortName: 'Animate Image to GIF',
    seoTitle: 'Animate Image to GIF — Zoom, Pan & Bounce Effects | maratool',
    description: 'Turn a still image into an animated GIF with zoom, pan, bounce, rotate, or fade effects. Set duration and FPS, then download.',
    keywords: ['animate image to gif', 'image to gif animation', 'zoom gif maker', 'pan gif effect', 'still image animator', 'photo to gif effect'],
    subcategory: 'Transform',
    prefix: 'aig',
    minHeight: 480,
    howTo: ['Upload a static image.', 'Pick an effect, duration, and FPS.', 'Preview and download the animated GIF.'],
    faq: [
      { q: 'How is this different from GIF Maker?', a: 'GIF Maker combines multiple images into frames. This animates a single image with motion effects.' },
      { q: 'Which effects are available?', a: 'Zoom in/out, pan left/right/up/down, bounce, rotate, and fade in/out.' },
      { q: 'FPS and duration?', a: 'Set total duration in seconds and frames per second — the tool generates intermediate frames.' },
      { q: 'Local processing?', a: 'Yes.' },
    ],
    related: ['gif-maker', 'video-to-gif', 'shuffle-gif-frames'],
    blogTitle: 'How to animate a still image into a GIF',
    blogLead: 'Add zoom, pan, bounce, or fade motion to a single photo.',
    embedHeight: 520,
  },
  {
    slug: 'round-corners',
    name: 'Round Corners for Images & GIFs',
    shortName: 'Round Corners',
    seoTitle: 'Round Corners for Images & GIFs Online | maratool',
    description: 'Add rounded corners or circle crop to images and animated GIFs. Pick radius and background color, then download.',
    keywords: ['round corners image', 'rounded corners gif', 'circle crop image', 'round image corners online', 'border radius image'],
    subcategory: 'Transform',
    prefix: 'rcr',
    minHeight: 420,
    howTo: ['Upload an image or GIF.', 'Set corner radius or enable circle crop.', 'Download with transparent or colored corners.'],
    faq: [
      { q: 'Transparent corners?', a: 'Yes — leave background empty for PNG/GIF transparency outside the rounded shape.' },
      { q: 'Circle crop?', a: 'Enable circle mode to crop to a perfect circle inscribed in the image.' },
      { q: 'GIF support?', a: 'Yes. Rounded corners apply to every frame.' },
      { q: 'Free?', a: 'Yes. Runs in your browser.' },
    ],
    related: ['matte-generator', 'square-gif', 'image-compressor'],
    blogTitle: 'How to add rounded corners to images and GIFs',
    blogLead: 'Set corner radius or circle crop — works on still images and animated GIFs.',
    embedHeight: 480,
  },
  {
    slug: 'invert-colors',
    name: 'Invert Colors in Images & GIFs',
    shortName: 'Invert Colors',
    seoTitle: 'Invert Colors in Images & GIFs Online | maratool',
    description: 'Invert or negate colors in images and animated GIFs. Full inversion or per-channel control. Preview and download instantly.',
    keywords: ['invert colors image', 'invert gif colors', 'negative image online', 'color invert photo', 'invert image online'],
    subcategory: 'Transform',
    prefix: 'inv',
    minHeight: 400,
    howTo: ['Upload an image or GIF.', 'Choose full inversion or toggle individual RGB channels.', 'Download the inverted result.'],
    faq: [
      { q: 'Partial inversion?', a: 'Toggle red, green, or blue channels independently for creative effects.' },
      { q: 'GIF frames?', a: 'Inversion applies to every frame consistently.' },
      { q: 'Lossless?', a: 'Color inversion is mathematical — no quality loss beyond GIF palette limits.' },
      { q: 'Local?', a: 'Yes.' },
    ],
    related: ['halftone-effect', 'round-corners', 'image-compressor'],
    blogTitle: 'How to invert colors in an image or GIF',
    blogLead: 'Create a negative or channel-specific color inversion.',
    embedHeight: 440,
  },
  {
    slug: 'halftone-effect',
    name: 'Halftone Effect for Images & GIFs',
    shortName: 'Halftone Effect',
    seoTitle: 'Halftone Effect for Images & GIFs Online | maratool',
    description: 'Apply halftone dot, line, or diamond patterns to images and GIFs. Black & white or colored halftone — preview and download.',
    keywords: ['halftone effect online', 'halftone image', 'halftone gif', 'dot pattern image', 'newspaper print effect'],
    subcategory: 'Transform',
    prefix: 'hlf',
    minHeight: 420,
    howTo: ['Upload an image or GIF.', 'Pick pattern type, dot size, and color mode.', 'Preview and download.'],
    faq: [
      { q: 'Pattern types?', a: 'Dots, lines, and diamonds — classic halftone styles.' },
      { q: 'Colored halftone?', a: 'Yes — preserve original hues in the dot pattern, or use black & white.' },
      { q: 'GIF support?', a: 'Yes. The effect renders on every frame.' },
      { q: 'Browser-based?', a: 'Yes.' },
    ],
    related: ['invert-colors', 'round-corners', 'censor-image'],
    blogTitle: 'How to apply a halftone effect to an image',
    blogLead: 'Dots, lines, or diamonds — B&W or colored halftone in your browser.',
    embedHeight: 480,
  },
]

function faqSchemaItems(faq) {
  return faq.map(function (f) {
    return `      {
        '@type': 'Question',
        name: '${f.q.replace(/'/g, "\\'")}',
        acceptedAnswer: { '@type': 'Answer', text: '${f.a.replace(/'/g, "\\'")}' }
      }`
  }).join(',\n')
}

function toolPage(t) {
  var cat = t.category || 'Image'
  var appCategory = cat === 'Converter' ? 'UtilitiesApplication' : 'MultimediaApplication'
  var catHref = cat === 'Converter' ? '/converter' : '/image'
  var subHref = cat === 'Converter' ? '/converter/video' : '/image/' + t.subcategory.toLowerCase()
  var related = t.related.map(function (s) {
    var name = s.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1) }).join(' ')
    return `  { slug: '${s}', name: '${name}' },`
  }).join('\n')

  return `---
import Base from '../layouts/Base.astro'
import Layout from '../components/Layout.astro'
import ToolShell from '../components/ToolShell.astro'

const seo = {
  title: '${t.seoTitle}',
  description: '${t.description}',
  canonical: 'https://maratool.com/${t.slug}',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '${t.shortName}',
    url: 'https://maratool.com/${t.slug}',
    applicationCategory: '${appCategory}',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: '${t.description.replace(/'/g, "\\'")}',
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: '${cat}', item: 'https://maratool.com${catHref}' },
      { '@type': 'ListItem', position: 3, name: '${t.subcategory}', item: 'https://maratool.com${subHref}' },
      { '@type': 'ListItem', position: 4, name: '${t.shortName}', item: 'https://maratool.com/${t.slug}' },
    ],
  },
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
${faqSchemaItems(t.faq)}
    ]
  }
}

const howTo = ${JSON.stringify(t.howTo, null, 2).replace(/"/g, "'")}
const faq = ${JSON.stringify(t.faq, null, 2).replace(/"/g, "'")}
const relatedTools = [
${related}
]
const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: '${cat}', href: '${catHref}' },
  { label: '${t.subcategory}', href: '${subHref}' },
  { label: '${t.shortName}' },
]
---
<Base {...seo}>
  <Layout>
    <ToolShell slug="${t.slug}" name="${t.name}" description="${t.description}" howTo={howTo} faq={faq} relatedTools={relatedTools} breadcrumbs={breadcrumbs}>
      <div class="tool-container ${t.prefix}-root" style="min-height:${t.minHeight}px;">
        <div class="${t.prefix}-dropzone" id="${t.prefix}-dropzone">
          <input type="file" id="${t.prefix}-file" hidden />
          <p class="${t.prefix}-drop-title">Drop a file here</p>
          <p class="${t.prefix}-drop-sub">or click to select</p>
        </div>
        <div id="${t.prefix}-workspace" style="display:none;"></div>
        <div id="${t.prefix}-progress" class="${t.prefix}-progress" style="display:none;">
          <div id="${t.prefix}-progress-text">Processing...</div>
          <div class="${t.prefix}-progress-track"><div id="${t.prefix}-progress-fill" class="${t.prefix}-progress-fill"></div></div>
        </div>
        <div id="${t.prefix}-error" class="${t.prefix}-error" style="display:none;"><span id="${t.prefix}-error-text"></span></div>
        <div id="${t.prefix}-result" style="display:none;"></div>
      </div>
    </ToolShell>
  </Layout>
</Base>
<style is:global>
  .${t.prefix}-dropzone {
    border: 2px dashed var(--border); border-radius: var(--radius);
    padding: 3rem 2rem; text-align: center; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .${t.prefix}-dropzone:hover, .${t.prefix}-dropzone.drag-over { border-color: var(--accent); background: var(--bg-soft); }
  .${t.prefix}-drop-title { font-size: 1.125rem; font-weight: 600; margin: 0; }
  .${t.prefix}-drop-sub { font-size: 0.875rem; color: var(--text-2); margin: 0.5rem 0 0; }
  .${t.prefix}-progress { text-align: center; padding: 2rem; }
  .${t.prefix}-progress-track { width: 100%; max-width: 400px; height: 8px; background: var(--bg-hover); border-radius: 4px; margin: 1rem auto; overflow: hidden; }
  .${t.prefix}-progress-fill { height: 100%; background: var(--accent); width: 0%; transition: width 0.3s; }
  .${t.prefix}-error { background: var(--error-bg); border: 1px solid var(--error-border); border-radius: var(--radius); padding: 1rem; color: #c53030; font-size: 0.875rem; }
  .${t.prefix}-preview-wrap {
    background: repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
    border: 1px solid var(--border); border-radius: var(--radius); padding: 0.5rem;
    display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
  }
  .${t.prefix}-preview-wrap canvas, .${t.prefix}-preview-wrap img { max-width: 100%; max-height: 360px; display: block; }
  .${t.prefix}-controls { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
  .${t.prefix}-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
  .${t.prefix}-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.5rem; }
</style>
<script src="../tools/${t.slug}.js"></script>
`
}

function blogPage(t) {
  return `---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'

const seo = {
  title: '${t.blogTitle} | maratool',
  description: '${t.description}',
  canonical: 'https://maratool.com/blog/${t.slug}',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: '${t.blogTitle}',
    image: 'https://maratool.com/og/image.svg',
    datePublished: '${DATE_ISO}',
    dateModified: '${DATE_ISO}',
    author: { '@type': 'Person', name: 'Marcell Almeida', url: 'https://marcell.com.br' },
    publisher: {
      '@type': 'Organization',
      name: 'maratool',
      url: 'https://maratool.com',
      logo: { '@type': 'ImageObject', url: 'https://maratool.com/favicon.svg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://maratool.com/blog/${t.slug}' },
    url: 'https://maratool.com/blog/${t.slug}',
    description: '${t.description.replace(/'/g, "\\'")}',
  },
}
---
<Base {...seo}>
  <Layout>
    <article class="blog-post">
      <header class="blog-post-header">
        <div class="blog-post-meta">
          <a href="/blog" class="blog-back">← Blog</a>
          <time datetime="${DATE_ISO}" class="blog-post-date">${DATE}</time>
        </div>
        <h1 class="blog-post-title">${t.blogTitle}</h1>
        <p class="blog-post-lead">${t.blogLead}</p>
      </header>
      <div class="blog-body">
        <p>The <a href="/${t.slug}">${t.shortName}</a> tool runs entirely in your browser — no upload, no watermark.</p>
        <h2>How it works</h2>
        <ol>
${t.howTo.map(function (s) { return '          <li>' + s + '</li>' }).join('\n')}
        </ol>
        <p>${t.description}</p>
        <hr class="blog-divider" />
        <p class="blog-footer-note">Try the <a href="/${t.slug}">${t.shortName}</a> free at <a href="/image">maratool.com/image</a>.</p>
      </div>
    </article>
  </Layout>
</Base>
`
}

for (const t of tools) {
  fs.writeFileSync(path.join(PAGES, t.slug + '.astro'), toolPage(t))
  fs.writeFileSync(path.join(BLOG, t.slug + '.astro'), blogPage(t))
  console.log('Generated', t.slug)
}

console.log('Done —', tools.length, 'tools')
