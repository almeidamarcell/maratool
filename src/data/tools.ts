export interface Tool {
  slug: string
  name: string
  emoji: string
  description: string
  category: string       // top-level: "Developer" (only one for now)
  subcategory: string    // "Encoding" | "Converter" | "Text" | "Generator"
  keywords: string[]
  live: boolean
}

export const tools: Tool[] = [
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
    slug: 'unix-timestamp',
    name: 'Unix Timestamp Converter',
    emoji: '⏱️',
    description: 'Convert Unix timestamps to human-readable dates and vice versa, with timezone support.',
    category: 'Developer',
    subcategory: 'Converter',
    keywords: ['unix', 'timestamp', 'epoch', 'date', 'time', 'convert'],
    live: true,
  },
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
    slug: 'reading-time',
    name: 'Reading Time Calculator',
    emoji: '📖',
    description: 'Estimate how long it takes to read any text — shows slow, average, and fast reading times.',
    category: 'Developer',
    subcategory: 'Text',
    keywords: ['reading time', 'wpm', 'word count', 'words per minute', 'text', 'article'],
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
  {
    slug: 'css-gradient',
    name: 'CSS Gradient Generator',
    emoji: '🎨',
    description: 'Generate CSS gradients visually with live preview.',
    category: 'Developer',
    subcategory: 'Design',
    keywords: ['css', 'gradient', 'linear', 'radial', 'color', 'background'],
    live: true,
  },
  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    emoji: '📝',
    description: 'Generate lorem ipsum placeholder text instantly.',
    category: 'Developer',
    subcategory: 'Generator',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'dummy'],
    live: true,
  },
  {
    slug: 'mussum-ipsum',
    name: 'Mussum Ipsum',
    emoji: '🍺',
    description: 'Gerador de Mussum Ipsum — placeholder text no estilo do imortil Mussum.',
    category: 'Developer',
    subcategory: 'Generator',
    keywords: ['mussum', 'ipsum', 'placeholder', 'brazilian', 'lorem', 'gerador'],
    live: true,
  },
  {
    slug: 'dilmes-ipsum',
    name: 'Dilmes Ipsum',
    emoji: '🇧🇷',
    description: 'Gerador de Dilmes Ipsum — placeholder text com frases da presidenta Dilma.',
    category: 'Developer',
    subcategory: 'Generator',
    keywords: ['dilmes', 'dilma', 'ipsum', 'placeholder', 'brazilian', 'lorem', 'gerador'],
    live: true,
  },
  {
    slug: 'markdown-editor',
    name: 'Markdown Editor',
    emoji: '✍️',
    description: 'Write markdown and preview the output in real time.',
    category: 'Developer',
    subcategory: 'Text',
    keywords: ['markdown', 'editor', 'preview', 'md', 'html'],
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
  {
    slug: 'color-picker',
    name: 'Color Picker',
    emoji: '🖌️',
    description: 'Pick colors and convert between HEX, RGB, and HSL.',
    category: 'Developer',
    subcategory: 'Design',
    keywords: ['color', 'picker', 'hex', 'rgb', 'hsl', 'palette'],
    live: true,
  },
]

// Ordered subcategories for consistent sidebar/page ordering
export const subcategoryOrder = ['Encoding', 'Converter', 'Text', 'Generator', 'Design']

export const toolsBySubcategory = subcategoryOrder.reduce<Record<string, Tool[]>>((acc, sub) => {
  acc[sub] = tools.filter(t => t.subcategory === sub)
  return acc
}, {})

// Legacy export kept for any existing consumers
export const toolsByCategory = { Developer: tools }
