# Wave B — SEO Audit Tools (Paste-Only)

**Selected shape:** B — Paste-based auditors with explicit limitation messaging

## Key limitation (all tools)

**Cannot fetch live URLs.** Browsers block cross-origin HTML/XML fetches (CORS). All Wave B tools analyze **pasted content only**. UI must state this prominently via `PasteOnlyNotice` + FAQ.

## Tools

| Tool | Input | Does NOT do |
|------|-------|-------------|
| meta-tag-checker | Pasted HTML | Fetch URL |
| open-graph-preview | Pasted HTML or manual OG fields | Fetch URL, exact platform render |
| robots-txt-tester | Pasted robots.txt + path | Fetch live robots.txt |
| sitemap-validator | Pasted sitemap XML | Fetch URL, HTTP status checks |
| schema-validator | Pasted JSON-LD | Fetch URL, Google Rich Results |

## Category

Developer / **Audit** (new subcategory)
