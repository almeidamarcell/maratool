export interface Tool {
  slug: string
  name: string
  emoji: string
  description: string
  category: string       // "Developer" | "Design" | "Content" | "Marketing"
  subcategory: string    // e.g. "Encoding", "Color", "Text", "Builder"
  keywords: string[]
  live: boolean
}

export const tools: Tool[] = [
  // ── Developer / Encoding ──
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    emoji: '🔐',
    description: 'Decode and inspect JWT tokens instantly — view header, payload, and signature.',
    category: 'Developer',
    subcategory: 'Encoding',
    keywords: ['jwt', 'json web token', 'decode', 'token', 'bearer', 'auth'],
    live: true,
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    emoji: '#️⃣',
    description: 'Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from any text input instantly.',
    category: 'Developer',
    subcategory: 'Encoding',
    keywords: ['hash', 'md5', 'sha', 'sha256', 'sha512', 'checksum', 'crypto'],
    live: true,
  },
  {
    slug: 'base64',
    name: 'Base64 Encode / Decode',
    emoji: '📦',
    description: 'Encode text to Base64 or decode Base64 back to text. Also supports image to Base64.',
    category: 'Developer',
    subcategory: 'Encoding',
    keywords: ['base64', 'encode', 'decode', 'encoding', 'binary', 'image'],
    live: true,
  },
  {
    slug: 'text-to-binary',
    name: 'Text to Binary',
    emoji: '💻',
    description: 'Convert text to binary, hex, and decimal representations instantly.',
    category: 'Developer',
    subcategory: 'Encoding',
    keywords: ['binary', 'text', 'hex', 'decimal', 'ascii', 'convert', 'encode'],
    live: true,
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    emoji: '📋',
    description: 'Format, minify and validate JSON instantly.',
    category: 'Developer',
    subcategory: 'Encoding',
    keywords: ['json', 'format', 'validate', 'minify', 'prettify'],
    live: true,
  },
  // ── Developer / Converter ──
  {
    slug: 'unix-timestamp',
    name: 'Unix Timestamp Converter',
    emoji: '⏱️',
    description: 'Convert Unix timestamps to human-readable dates and vice versa, with timezone support.',
    category: 'Developer',
    subcategory: 'Converter',
    keywords: ['unix', 'timestamp', 'epoch', 'date', 'time', 'convert'],
    live: true,
  },
  // ── Developer / Text ──
  {
    slug: 'diff-checker',
    name: 'Diff Checker',
    emoji: '🔍',
    description: 'Compare two blocks of text and highlight added, removed, and unchanged lines.',
    category: 'Developer',
    subcategory: 'Text',
    keywords: ['diff', 'compare', 'text', 'difference', 'patch', 'changes'],
    live: true,
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    emoji: '🔎',
    description: 'Test regular expressions with live match highlighting.',
    category: 'Developer',
    subcategory: 'Text',
    keywords: ['regex', 'regexp', 'pattern', 'test', 'match'],
    live: true,
  },
  // ── Developer / Generator ──
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    emoji: '🎲',
    description: 'Generate one or many UUIDs instantly — supports v1, v4, and v5.',
    category: 'Developer',
    subcategory: 'Generator',
    keywords: ['uuid', 'guid', 'unique', 'id', 'generate', 'random'],
    live: true,
  },
  {
    slug: 'cron-expression',
    name: 'Cron Expression',
    emoji: '⏰',
    description: 'Build and decode cron expressions with a visual editor.',
    category: 'Developer',
    subcategory: 'Generator',
    keywords: ['cron', 'schedule', 'expression', 'job', 'interval'],
    live: true,
  },
  // ── Design / Color ──
  {
    slug: 'css-gradient',
    name: 'CSS Gradient Generator',
    emoji: '🎨',
    description: 'Generate CSS gradients visually with live preview.',
    category: 'Design',
    subcategory: 'Color',
    keywords: ['css', 'gradient', 'linear', 'radial', 'color', 'background'],
    live: true,
  },
  {
    slug: 'color-shades',
    name: 'Color Shades Generator',
    emoji: '🎨',
    description: 'Generate color shades and Tailwind CSS palettes from a single hex color. Export as CSS variables, Tailwind config, or design tokens.',
    category: 'Design',
    subcategory: 'Color',
    keywords: ['color shades generator', 'tailwind color palette', 'generate shades from hex', 'color scale generator', 'shade generator', 'oklch palette', 'css color variables', 'design tokens'],
    live: true,
  },
  // ── Content / Text ──
  {
    slug: 'reading-time',
    name: 'Reading Time Calculator',
    emoji: '📖',
    description: 'Estimate how long it takes to read any text — shows slow, average, and fast reading times.',
    category: 'Content',
    subcategory: 'Text',
    keywords: ['reading time', 'wpm', 'word count', 'words per minute', 'text', 'article'],
    live: true,
  },
  {
    slug: 'markdown-editor',
    name: 'Markdown Editor',
    emoji: '✍️',
    description: 'Write markdown and preview the output in real time.',
    category: 'Content',
    subcategory: 'Text',
    keywords: ['markdown', 'editor', 'preview', 'md', 'html'],
    live: true,
  },
  // ── Content / Generator ──
  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    emoji: '📝',
    description: 'Generate lorem ipsum placeholder text instantly.',
    category: 'Content',
    subcategory: 'Generator',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy'],
    live: true,
  },
  {
    slug: 'mussum-ipsum',
    name: 'Mussum Ipsum',
    emoji: '🍺',
    description: 'Generate Mussum Ipsum placeholder text — a Brazilian lorem ipsum full of invented words and humor.',
    category: 'Content',
    subcategory: 'Generator',
    keywords: ['mussum', 'ipsum', 'placeholder', 'brazilian', 'lorem', 'gerador'],
    live: true,
  },
  {
    slug: 'dilmes-ipsum',
    name: 'Dilmes Ipsum',
    emoji: '🇧🇷',
    description: 'Generate Dilmes Ipsum placeholder text using real quotes from former Brazilian president Dilma Rousseff.',
    category: 'Content',
    subcategory: 'Generator',
    keywords: ['dilmes', 'dilma', 'ipsum', 'placeholder', 'brazilian', 'lorem', 'gerador'],
    live: true,
  },
  // ── Marketing / Builder ──
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
export const categoryOrder = ['Developer', 'Design', 'Content', 'Marketing'] as const

export const subcategoryOrderByCategory: Record<string, string[]> = {
  Developer: ['Encoding', 'Converter', 'Text', 'Generator'],
  Design: ['Color'],
  Content: ['Text', 'Generator'],
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
