# Wave A + C Tools — Shaping Doc

**Selected shape:** A — Browser-native calculators & converters (core logic in `*-core.js`, vanilla JS UI, no server)

---

## Requirements (R)

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | All tools run entirely in the browser — no uploads, no API calls | Core goal |
| R1 | Core business logic is unit-tested via Vitest (`*-core.js`) | Must-have |
| R2 | Each tool has unique SEO (title, description, schema, FAQ) | Must-have |
| R3 | Real-time or instant results on input change | Must-have |
| R4 | Copy buttons with 2s "Copied!" feedback | Must-have |
| R5 | `min-height` on tool containers (zero CLS) | Must-have |
| R6 | Registered in `tools.ts` with job-phrased names | Must-have |

---

## Fit Check (R × A)

| Req | Requirement | Status | A |
|-----|-------------|--------|---|
| R0 | All tools run entirely in the browser | Core goal | ✅ |
| R1 | Core business logic is unit-tested | Must-have | ✅ |
| R2 | Each tool has unique SEO | Must-have | ✅ |
| R3 | Real-time or instant results | Must-have | ✅ |
| R4 | Copy buttons with feedback | Must-have | ✅ |
| R5 | min-height on tool containers | Must-have | ✅ |
| R6 | Registered in tools.ts | Must-have | ✅ |

---

## Parts

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | `ai-token-calculator-core.js` — token count by model (char/word heuristic) | |
| **A2** | `ai-cost-calculator-core.js` — cost from tokens × model pricing table | |
| **A3** | `ab-test-calculator-core.js` — z-test for two proportions, p-value, lift | |
| **A4** | `markdown-to-html-core.js` + reuse `html-to-md.js` — bidirectional converter page | |
| **A5** | `image-compressor-core.js` + Canvas compression UI | |
| **C1** | `campaign-roi-calculator-core.js` — ROI, ROAS, profit | |
| **C2** | `cac-ltv-calculator-core.js` — CAC, LTV, ratio, payback | |

---

## Slices

| Slice | Tools | Demo |
|-------|-------|------|
| V1 | AI Token + AI Cost | Paste text → see tokens + estimated cost |
| V2 | A/B Test + Campaign ROI + CAC/LTV | Enter numbers → see stats instantly |
| V3 | Markdown Converter | Tab between MD↔HTML, live conversion |
| V4 | Image Compressor | Upload image → compress → download |
