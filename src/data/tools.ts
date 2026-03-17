export interface Tool {
  slug: string
  name: string
  emoji: string
  description: string
  category: string       // "Converter" | "PDF" | "Text" | "Image" | "Color" | "Developer" | "Marketing"
  subcategory: string    // e.g. "Format", "Extract", "Analyze", "Transform", "Generate", "Crypto", "Builder"
  keywords: string[]
  live: boolean
}

export const tools: Tool[] = [
  // ── Converter / Format ──
  {
    slug: 'csv-to-json',
    name: 'Convert CSV to JSON',
    emoji: '🔄',
    description: 'Convert CSV to JSON or JSON to CSV instantly. Auto-detects delimiters — supports comma, semicolon, and tab.',
    category: 'Converter',
    subcategory: 'Format',
    keywords: ['csv to json', 'convert csv to json', 'csv to json converter', 'json to csv', 'csv to json online', 'csv parser'],
    live: true,
  },
  {
    slug: 'json-to-markdown-table',
    name: 'Convert JSON to Markdown Table',
    emoji: '📋',
    description: 'Paste a JSON array and instantly get a formatted Markdown table. Perfect for READMEs and documentation.',
    category: 'Converter',
    subcategory: 'Format',
    keywords: ['json to markdown table', 'json to table', 'json array to table', 'convert json to md table', 'json to github table'],
    live: true,
  },
  {
    slug: 'html-to-markdown',
    name: 'Convert HTML to Markdown',
    emoji: '🔄',
    description: 'Paste HTML and get clean Markdown instantly. Handles headings, lists, links, images, tables, and code blocks.',
    category: 'Converter',
    subcategory: 'Format',
    keywords: ['html to markdown', 'convert html to md', 'html to markdown converter', 'html to md online', 'paste html get markdown'],
    live: true,
  },
  {
    slug: 'base64',
    name: 'Base64 Encode / Decode',
    emoji: '📦',
    description: 'Encode text to Base64 or decode Base64 back to text. Also supports image to Base64.',
    category: 'Converter',
    subcategory: 'Format',
    keywords: ['base64', 'encode', 'decode', 'encoding', 'binary', 'image'],
    live: true,
  },
  {
    slug: 'text-to-binary',
    name: 'Text to Binary',
    emoji: '💻',
    description: 'Convert text to binary, hex, and decimal representations instantly.',
    category: 'Converter',
    subcategory: 'Format',
    keywords: ['binary', 'text', 'hex', 'decimal', 'ascii', 'convert', 'encode'],
    live: true,
  },
  // ── Converter / Unit ──
  {
    slug: 'unix-timestamp',
    name: 'Unix Timestamp Converter',
    emoji: '⏱️',
    description: 'Convert Unix timestamps to human-readable dates and vice versa, with timezone support.',
    category: 'Converter',
    subcategory: 'Unit',
    keywords: ['unix', 'timestamp', 'epoch', 'date', 'time', 'convert'],
    live: true,
  },
  {
    slug: 'px-to-rem',
    name: 'PX to REM Converter',
    emoji: '📏',
    description: 'Convert pixels to rem and rem to pixels instantly. Configurable base font size with a common conversions reference table.',
    category: 'Converter',
    subcategory: 'Unit',
    keywords: ['px to rem', 'rem to px', 'pixel to rem converter', 'css unit converter', 'rem calculator', 'font size converter'],
    live: true,
  },
  // ── PDF / Extract ──
  {
    slug: 'pdf-to-text',
    name: 'Extract Text from PDF',
    emoji: '📄',
    description: 'Extract text from any PDF file instantly in your browser. No upload to servers — runs 100% locally.',
    category: 'PDF',
    subcategory: 'Extract',
    keywords: ['pdf to text', 'extract text from pdf', 'pdf text extractor', 'copy text from pdf', 'pdf reader online', 'convert pdf to text'],
    live: true,
  },
  {
    slug: 'pdf-to-markdown',
    name: 'Convert PDF to Markdown',
    emoji: '📝',
    description: 'Convert PDF files to clean Markdown with heading detection. Ideal for LLM context and documentation.',
    category: 'PDF',
    subcategory: 'Extract',
    keywords: ['pdf to markdown', 'convert pdf to md', 'pdf to markdown converter', 'extract markdown from pdf', 'pdf to md online'],
    live: true,
  },
  // ── PDF / Edit ──
  {
    slug: 'pdf-merge-split',
    name: 'Merge and Split PDF Pages',
    emoji: '📑',
    description: 'Merge multiple PDF files or extract specific pages into a new PDF. Runs entirely in your browser.',
    category: 'PDF',
    subcategory: 'Edit',
    keywords: ['merge pdf', 'split pdf', 'combine pdf files', 'extract pdf pages', 'pdf merge online', 'split pdf pages'],
    live: true,
  },
  // ── PDF / Inspect ──
  {
    slug: 'pdf-metadata',
    name: 'PDF Page Counter & Metadata Viewer',
    emoji: '📊',
    description: 'View PDF page count, file size, author, creation date, and other metadata instantly in your browser.',
    category: 'PDF',
    subcategory: 'Inspect',
    keywords: ['pdf page counter', 'pdf metadata', 'pdf info', 'pdf properties', 'pdf details', 'how many pages in pdf'],
    live: true,
  },
  {
    slug: 'pdf-accessibility-checker',
    name: 'PDF Accessibility Checker',
    emoji: '♿',
    description: 'Check if your PDF has accessibility tags, document title, language, and other a11y requirements.',
    category: 'PDF',
    subcategory: 'Inspect',
    keywords: ['pdf accessibility checker', 'pdf a11y', 'tagged pdf checker', 'pdf wcag', 'pdf screen reader', 'pdf accessibility test'],
    live: true,
  },
  // ── Text / Analyze ──
  {
    slug: 'diff-checker',
    name: 'Diff Checker',
    emoji: '🔍',
    description: 'Compare two blocks of text and highlight added, removed, and unchanged lines.',
    category: 'Text',
    subcategory: 'Analyze',
    keywords: ['diff', 'compare', 'text', 'difference', 'patch', 'changes'],
    live: true,
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    emoji: '🔎',
    description: 'Test regular expressions with live match highlighting.',
    category: 'Text',
    subcategory: 'Analyze',
    keywords: ['regex', 'regexp', 'pattern', 'test', 'match'],
    live: true,
  },
  {
    slug: 'reading-time',
    name: 'Reading Time Calculator',
    emoji: '📖',
    description: 'Estimate how long it takes to read any text — shows slow, average, and fast reading times.',
    category: 'Text',
    subcategory: 'Analyze',
    keywords: ['reading time', 'wpm', 'word count', 'words per minute', 'text', 'article'],
    live: true,
  },
  // ── Text / Edit ──
  {
    slug: 'markdown-editor',
    name: 'Markdown Editor',
    emoji: '✍️',
    description: 'Write markdown and preview the output in real time.',
    category: 'Text',
    subcategory: 'Edit',
    keywords: ['markdown', 'editor', 'preview', 'md', 'html'],
    live: true,
  },
  {
    slug: 'markdown-table-generator',
    name: 'Markdown Table Generator',
    emoji: '📐',
    description: 'Build Markdown tables visually with a grid editor. Set alignment, add rows and columns, copy the output.',
    category: 'Text',
    subcategory: 'Edit',
    keywords: ['markdown table generator', 'markdown table maker', 'create markdown table', 'md table generator', 'github table generator'],
    live: true,
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    emoji: '📋',
    description: 'Format, minify and validate JSON instantly.',
    category: 'Text',
    subcategory: 'Edit',
    keywords: ['json', 'format', 'validate', 'minify', 'prettify'],
    live: true,
  },
  // ── Text / Generate ──
  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    emoji: '📝',
    description: 'Generate lorem ipsum placeholder text instantly.',
    category: 'Text',
    subcategory: 'Generate',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy'],
    live: true,
  },
  {
    slug: 'mussum-ipsum',
    name: 'Mussum Ipsum',
    emoji: '🍺',
    description: 'Generate Mussum Ipsum placeholder text — a Brazilian lorem ipsum full of invented words and humor.',
    category: 'Text',
    subcategory: 'Generate',
    keywords: ['mussum', 'ipsum', 'placeholder', 'brazilian', 'lorem', 'gerador'],
    live: true,
  },
  {
    slug: 'dilmes-ipsum',
    name: 'Dilmes Ipsum',
    emoji: '🇧🇷',
    description: 'Generate Dilmes Ipsum placeholder text using real quotes from former Brazilian president Dilma Rousseff.',
    category: 'Text',
    subcategory: 'Generate',
    keywords: ['dilmes', 'dilma', 'ipsum', 'placeholder', 'brazilian', 'lorem', 'gerador'],
    live: true,
  },
  // ── Image / Transform ──
  {
    slug: 'background-remover',
    name: 'Background Remover',
    emoji: '✂️',
    description: 'Remove image backgrounds instantly in your browser using AI. No upload, no sign-up — powered by a local ML model.',
    category: 'Image',
    subcategory: 'Transform',
    keywords: ['remove background', 'background remover', 'bg remover', 'transparent background', 'remove bg online', 'image background removal', 'ai background remover'],
    live: true,
  },
  {
    slug: 'svg-optimizer',
    name: 'SVG Optimizer',
    emoji: '✂️',
    description: 'Optimize and minify SVG files in the browser. Remove metadata, clean attributes, and reduce file size instantly.',
    category: 'Image',
    subcategory: 'Transform',
    keywords: ['svg optimizer', 'svg minifier', 'optimize svg online', 'svg cleaner', 'reduce svg size', 'svg compressor'],
    live: true,
  },
  {
    slug: 'favicon-generator',
    name: 'Favicon Generator',
    emoji: '🖼️',
    description: 'Generate favicons in all sizes from a single image. Download as ICO, PNG, or a complete ZIP with all sizes.',
    category: 'Image',
    subcategory: 'Transform',
    keywords: ['favicon generator', 'ico generator', 'favicon from png', 'apple touch icon', 'favicon sizes', 'favicon maker'],
    live: true,
  },
  // ── Image / Inspect ──
  {
    slug: 'base64-image-preview',
    name: 'Base64 Image Previewer',
    emoji: '🖼️',
    description: 'Paste a Base64 string or data URL and instantly preview the image with format, dimensions, and size.',
    category: 'Image',
    subcategory: 'Inspect',
    keywords: ['base64 image preview', 'base64 to image', 'preview base64 image', 'base64 data url preview', 'decode base64 image'],
    live: true,
  },
  {
    slug: 'alt-text-generator',
    name: 'Image Alt Text Generator',
    emoji: '🏷️',
    description: 'Generate alt text for images using AI — runs locally in your browser. No upload, no sign-up required.',
    category: 'Image',
    subcategory: 'Inspect',
    keywords: ['alt text generator', 'generate alt text', 'image description generator', 'alt tag generator', 'image caption generator', 'accessibility alt text'],
    live: true,
  },
  // ── Color / Generate ──
  {
    slug: 'css-gradient',
    name: 'CSS Gradient Generator',
    emoji: '🎨',
    description: 'Generate CSS gradients visually with live preview.',
    category: 'Color',
    subcategory: 'Generate',
    keywords: ['css', 'gradient', 'linear', 'radial', 'color', 'background'],
    live: true,
  },
  {
    slug: 'color-shades',
    name: 'Color Shades Generator',
    emoji: '🎨',
    description: 'Generate color shades and Tailwind CSS palettes from a single hex color. Export as CSS variables, Tailwind config, or design tokens.',
    category: 'Color',
    subcategory: 'Generate',
    keywords: ['color shades generator', 'tailwind color palette', 'generate shades from hex', 'color scale generator', 'shade generator', 'oklch palette', 'css color variables', 'design tokens'],
    live: true,
  },
  {
    slug: 'palette-generator',
    name: 'Palette Generator',
    emoji: '🎨',
    description: 'Generate beautiful color palettes with 28 strategies — color theory, moods, decades, nature, and culture. Lock, export, download.',
    category: 'Color',
    subcategory: 'Generate',
    keywords: ['color palette generator', 'palette maker', 'color scheme generator', 'random palette', 'complementary colors', 'analogous palette', 'triadic colors'],
    live: true,
  },
  {
    slug: 'tailwind-shades',
    name: 'Tailwind Shade Generator',
    emoji: '🎨',
    description: 'Generate a full Tailwind CSS color palette (50-950) from any hex color. Export as CSS variables or Tailwind config.',
    category: 'Color',
    subcategory: 'Generate',
    keywords: ['tailwind color generator', 'tailwind palette', 'shade generator', 'tailwind 50 to 950', 'color scale', 'css color palette'],
    live: true,
  },
  // ── Color / Check ──
  {
    slug: 'contrast-checker',
    name: 'Contrast Checker',
    emoji: '♿',
    description: 'Check color contrast ratios for WCAG AA and AAA compliance. Test foreground and background colors for accessibility.',
    category: 'Color',
    subcategory: 'Check',
    keywords: ['contrast checker', 'wcag contrast', 'color contrast ratio', 'accessibility checker', 'aa aaa compliance', 'color accessibility'],
    live: true,
  },
  // ── Developer / Crypto ──
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    emoji: '#️⃣',
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from any text input instantly.',
    category: 'Developer',
    subcategory: 'Crypto',
    keywords: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'checksum', 'crypto'],
    live: true,
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    emoji: '🔐',
    description: 'Decode and inspect JWT tokens instantly — view header, payload, and signature.',
    category: 'Developer',
    subcategory: 'Crypto',
    keywords: ['jwt', 'json web token', 'decode', 'token', 'bearer', 'auth'],
    live: true,
  },
  // ── Developer / Generate ──
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    emoji: '🎲',
    description: 'Generate one or many UUIDs instantly — supports v1, v4, and v5.',
    category: 'Developer',
    subcategory: 'Generate',
    keywords: ['uuid', 'guid', 'unique', 'id', 'generate', 'random'],
    live: true,
  },
  {
    slug: 'cron-expression',
    name: 'Cron Expression',
    emoji: '⏰',
    description: 'Build and decode cron expressions with a visual editor.',
    category: 'Developer',
    subcategory: 'Generate',
    keywords: ['cron', 'schedule', 'expression', 'job', 'interval'],
    live: true,
  },
  // ── Marketing / Builder ──
  {
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    emoji: '📱',
    description: 'Generate styled QR codes with custom colors, shapes, and logos. Download as PNG or SVG.',
    category: 'Marketing',
    subcategory: 'Builder',
    keywords: ['qr code generator', 'qr code maker', 'create qr code', 'qr code with logo', 'custom qr code', 'styled qr code'],
    live: true,
  },
  {
    slug: 'utm-builder',
    name: 'UTM Builder',
    emoji: '🔗',
    description: 'Build UTM-tagged URLs for campaign tracking in Google Analytics.',
    category: 'Marketing',
    subcategory: 'Builder',
    keywords: ['utm', 'campaign', 'tracking', 'url', 'google analytics', 'marketing'],
    live: false,
  },
]

// Ordered categories and their subcategories
export const categoryOrder = ['Converter', 'PDF', 'Text', 'Image', 'Color', 'Developer', 'Marketing'] as const

export const subcategoryOrderByCategory: Record<string, string[]> = {
  Converter: ['Format', 'Unit'],
  PDF: ['Extract', 'Edit', 'Inspect'],
  Text: ['Analyze', 'Edit', 'Generate'],
  Image: ['Transform', 'Inspect'],
  Color: ['Generate', 'Check'],
  Developer: ['Crypto', 'Generate'],
  Marketing: ['Builder'],
}

// Tools grouped by category → subcategory
export const toolsByCategory: Record<string, Record<string, Tool[]>> = categoryOrder.reduce<Record<string, Record<string, Tool[]>>>((acc, cat) => {
  const subs = subcategoryOrderByCategory[cat] ?? []
  acc[cat] = subs.reduce<Record<string, Tool[]>>((subAcc, sub) => {
    subAcc[sub] = tools.filter(t => t.category === cat && t.subcategory === sub)
    return subAcc
  }, {})
  return acc
}, {})

// Flat list of tools per category (for category landing pages)
export const toolsFlatByCategory: Record<string, Tool[]> = categoryOrder.reduce<Record<string, Tool[]>>((acc, cat) => {
  acc[cat] = tools.filter(t => t.category === cat)
  return acc
}, {})

// Legacy: subcategory order for Developer (kept for developer/[subcategory] page)
export const subcategoryOrder = subcategoryOrderByCategory.Developer
export const toolsBySubcategory = toolsByCategory.Developer ?? {}
