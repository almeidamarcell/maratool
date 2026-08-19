#!/usr/bin/env node
// Merge the two vendored exercise datasets into one normalized file plus a
// lightweight browse index. Runs in `npm run prebuild`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { normalizeMuscle, normalizeEquipment } from '../src/data/exercises/vocab.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const load = p => JSON.parse(readFileSync(resolve(ROOT, p), 'utf-8'))

const EK_ATTRIBUTION = 'Illustration: Everkinetic — CC BY-SA 4.0'
const FE_ATTRIBUTION = 'Photos: free-exercise-db — public domain (Unlicense)'

const ek = load('src/data/exercises/everkinetic.raw.json')
const fe = load('src/data/exercises/free-exercise-db.raw.json')

const slugify = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
// Hyphens are not in [a-z0-9 ], so this already normalizes "EZ-Bar" / "Close-Grip"
// to the same tokens as their spaced forms before splitting on whitespace.
const tokens = n => new Set(String(n ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean))
const jaccard = (a, b) => {
  const inter = [...a].filter(x => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

// Distinguishing-modifier guard: two names can score high on Jaccard while
// naming genuinely different exercises — different equipment, a different
// bench/body angle, or (more leniently) a different stance. Reject those
// pairs outright, independent of score.
const EQUIPMENT_GROUP = ['band', 'barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'smith']
// Angle changes the direction of resistance and therefore which muscle heads
// are emphasized — a genuinely different exercise. Strict: silence on either
// side still conflicts with a named angle on the other.
const ANGLE_GROUP = ['incline', 'decline', 'flat']
// Stance changes stability/comfort, not the working muscle's movement
// pattern. Lenient, same treatment as equipment: only a conflict when BOTH
// sides name a stance and they disagree.
const STANCE_GROUP = ['seated', 'standing', 'lying', 'kneeling']
const groupTokens = (toks, group) => group.filter(g => toks.has(g))
const setsEqual = (a, b) => a.length === b.length && a.every(t => b.includes(t))

function modifierConflict(ekToks, feToks) {
  // Equipment: only a conflict when BOTH sides name equipment and they
  // disagree. Silence on one side is not a conflict — this is what keeps
  // "Bent Arm Pullover" <-> "Bent-Arm Barbell Pullover" merging.
  const ekEquip = groupTokens(ekToks, EQUIPMENT_GROUP)
  const feEquip = groupTokens(feToks, EQUIPMENT_GROUP)
  if (ekEquip.length && feEquip.length && !setsEqual(ekEquip, feEquip)) return true

  // Angle: load-bearing for which muscle heads are worked, so — unlike
  // equipment — silence on one side IS a conflict here.
  const ekAngle = groupTokens(ekToks, ANGLE_GROUP)
  const feAngle = groupTokens(feToks, ANGLE_GROUP)
  if ((ekAngle.length || feAngle.length) && !setsEqual(ekAngle, feAngle)) return true

  // Stance: same lenient treatment as equipment — only a conflict when both
  // sides name a stance and they disagree.
  const ekStance = groupTokens(ekToks, STANCE_GROUP)
  const feStance = groupTokens(feToks, STANCE_GROUP)
  if (ekStance.length && feStance.length && !setsEqual(ekStance, feStance)) return true

  return false
}

// Split a comma-joined muscle string ("triceps, biceps") into canonical muscles.
const splitMuscles = raw =>
  String(raw ?? '').split(',').map(s => normalizeMuscle(s)).filter(Boolean)

// `mechanic` is rendered as a single pill on the exercise page, so it must be a
// single canonical value. free-exercise-db already stores one; Everkinetic's
// `type` fallback does not — a handful of its records carry comma-joined values
// like "isolation, compound", which used to reach the page verbatim. Take the
// first listed canonical value (the source lists the primary classification
// first) and drop anything outside the vocabulary rather than inventing one.
const MECHANICS = ['compound', 'isolation', 'isometric']
const normalizeMechanic = raw => {
  for (const part of String(raw ?? '').toLowerCase().split(',')) {
    const t = part.trim()
    if (MECHANICS.includes(t)) return t
  }
  return null
}

const uniq = a => [...new Set(a)]

// ---- global best-score-first matching ----
// Compute every (Everkinetic, free-db) candidate pair scoring >= threshold and
// passing the modifier guard across the WHOLE dataset, then assign greedily
// from the highest score down. Doing this in Everkinetic file order instead
// (claim the best still-available row, one Everkinetic record at a time) lets
// an early mediocre match consume a free-db row a later, better match needed.
const MATCH_THRESHOLD = 0.75

const ekIndexed = ek.map(x => {
  const name = x.title || x.name
  return { rec: x, name, toks: tokens(name) }
})
const feIndexed = fe.map(x => ({ rec: x, toks: tokens(x.name) }))

const candidates = []
for (const e of ekIndexed) {
  for (const f of feIndexed) {
    const score = jaccard(e.toks, f.toks)
    if (score < MATCH_THRESHOLD) continue
    if (modifierConflict(e.toks, f.toks)) continue
    candidates.push({ ek: e.rec, fe: f.rec, score })
  }
}
// Highest score first; ties broken deterministically (EK id_num, then FE id)
// so re-running the generator against unchanged source data is reproducible.
candidates.sort((a, b) =>
  b.score - a.score ||
  a.ek.id_num.localeCompare(b.ek.id_num) ||
  String(a.fe.id).localeCompare(String(b.fe.id))
)

const ekMatch = new Map() // ek.id -> matched fe record
const usedFe = new Set()  // fe.id already claimed
for (const c of candidates) {
  if (ekMatch.has(c.ek.id) || usedFe.has(c.fe.id)) continue
  ekMatch.set(c.ek.id, c.fe)
  usedFe.add(c.fe.id)
}

const out = []
const dropped = []

// ---- Everkinetic first: it owns the better (vector) media ----
for (const x of ek) {
  const name = x.title || x.name
  const matched = ekMatch.get(x.id) ?? null

  const primary = uniq([
    ...splitMuscles(x.primary),
    ...(matched?.primaryMuscles ?? []).map(normalizeMuscle).filter(Boolean),
  ])
  const secondary = uniq([
    ...(x.secondary ?? []).flatMap(splitMuscles),
    ...(matched?.secondaryMuscles ?? []).map(normalizeMuscle).filter(Boolean),
  ]).filter(m => !primary.includes(m))

  const equipment = uniq([
    ...(x.equipment ?? []).map(normalizeEquipment),
    ...(matched?.equipment ? [normalizeEquipment(matched.equipment)] : []),
  ])

  const instructions = (x.steps?.length ? x.steps : matched?.instructions) ?? []

  // Never invent a muscle. If, after merging in whatever the matched free-db
  // record contributes, there is still no primary muscle, drop the record
  // entirely rather than mislabel its anatomy.
  if (primary.length === 0) {
    dropped.push(`${name} (no primary muscle)`)
    continue
  }
  // Same principle applied to instructions: never fabricate steps. This
  // never actually fires for Everkinetic records (every one has non-empty
  // `steps` in the vendored data), but the guard is kept for symmetry.
  if (instructions.length === 0) {
    dropped.push(`${name} (no instructions)`)
    continue
  }

  out.push({
    slug: slugify(name),
    name,
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    equipment: equipment.length ? equipment : ['other'],
    category: matched?.category ?? 'strength',
    level: matched?.level ?? null,
    force: matched?.force ?? null,
    mechanic: normalizeMechanic(matched?.mechanic ?? x.type),
    instructions,
    media: {
      kind: 'vector',
      start: `/exercises/svg/${x.id_num}-relaxation.svg`,
      end: `/exercises/svg/${x.id_num}-tension.svg`,
    },
    source: 'everkinetic',
    attribution: EK_ATTRIBUTION,
    ...(matched ? { mergedFrom: matched.id } : {}),
  })
}

// ---- free-db records that were not merged into an Everkinetic record ----
for (const x of fe) {
  if (usedFe.has(x.id)) continue
  const imgs = (x.images ?? []).map(p => `/exercises/photos/${p.replace(/\//g, '__')}`)
  if (imgs.length < 2) {
    dropped.push(`${x.name} (fewer than 2 images)`)
    continue
  }
  const primary = uniq((x.primaryMuscles ?? []).map(normalizeMuscle).filter(Boolean))
  const secondary = uniq((x.secondaryMuscles ?? []).map(normalizeMuscle).filter(Boolean))
    .filter(m => !primary.includes(m))

  // Never invent a muscle — drop rather than mislabel.
  if (primary.length === 0) {
    dropped.push(`${x.name} (no primary muscle)`)
    continue
  }
  // Never fabricate instructions either — a handful of free-exercise-db
  // records ship with an empty `instructions` array upstream.
  const instructions = x.instructions ?? []
  if (instructions.length === 0) {
    dropped.push(`${x.name} (no instructions)`)
    continue
  }

  out.push({
    slug: slugify(x.name),
    name: x.name,
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    equipment: [normalizeEquipment(x.equipment)],
    category: x.category ?? 'strength',
    level: x.level ?? null,
    force: x.force ?? null,
    mechanic: normalizeMechanic(x.mechanic),
    instructions,
    media: { kind: 'photo', start: imgs[0], end: imgs[1] },
    source: 'free-exercise-db',
    attribution: FE_ATTRIBUTION,
  })
}

for (const name of dropped) console.log(`dropped: ${name}`)

// ---- thumbnail dimensions for card <img> tags (hub grids + exercise browser) ----
// Every card is a single <img src={media.start}> with explicit width/height so
// the browser reserves layout space before the image loads (zero CLS). Real
// dimensions vary per exercise — SVG viewBoxes range roughly 150-240 x 125-300,
// and photos are mostly 850x567 but a meaningful minority are portrait — so one
// guessed constant would reserve the wrong aspect ratio for many cards. Read the
// real numbers once here instead. This only touches exercises.json, which is
// build-time-only (imported by .astro files, never fetched by the browser), so
// it costs nothing on the wire.
const VIEWBOX_RE = /viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/
const photoTargets = []
for (const x of out) {
  if (x.media.kind === 'vector') {
    const svg = readFileSync(resolve(ROOT, 'public' + x.media.start), 'utf-8')
    const m = svg.match(VIEWBOX_RE)
    if (m) {
      x.media.width = Math.round(parseFloat(m[1]))
      x.media.height = Math.round(parseFloat(m[2]))
    }
  } else {
    photoTargets.push(x)
  }
}
// sharp reads only the file header for metadata (no full decode), but 769
// concurrent file handles risks exhausting descriptors on some systems — batch it.
const PHOTO_BATCH = 40
for (let i = 0; i < photoTargets.length; i += PHOTO_BATCH) {
  const batch = photoTargets.slice(i, i + PHOTO_BATCH)
  await Promise.all(batch.map(async x => {
    const meta = await sharp(resolve(ROOT, 'public' + x.media.start)).metadata()
    x.media.width = meta.width
    x.media.height = meta.height
  }))
}

// ---- slug collision resolution: every member of a colliding group is suffixed ----
const bySlug = new Map()
for (const x of out) {
  if (!bySlug.has(x.slug)) bySlug.set(x.slug, [])
  bySlug.get(x.slug).push(x)
}
for (const [slug, group] of bySlug) {
  if (group.length < 2) continue
  group.forEach((x, i) => { x.slug = `${slug}-${i + 1}` })
}

out.sort((a, b) => a.name.localeCompare(b.name))

mkdirSync(resolve(ROOT, 'public/exercises'), { recursive: true })
writeFileSync(resolve(ROOT, 'src/data/exercises/exercises.json'), JSON.stringify(out, null, 2))

// `media` carries just the start-frame path, not the full {kind,start,end}
// object — the browser only ever renders one thumbnail per card. This is the
// one deliberate size trade-off in this file: it adds ~1,035 short URL strings
// (~40KB minified) to a file every visitor downloads, in exchange for the
// search/browse page showing the same real thumbnail the hub pages show
// instead of no image at all. mediaKind stays for anything that still wants a
// vector/photo distinction without resolving the path.
const index = out.map(x => ({
  slug: x.slug,
  name: x.name,
  primaryMuscles: x.primaryMuscles,
  equipment: x.equipment,
  category: x.category,
  level: x.level,
  mediaKind: x.media.kind,
  media: x.media.start,
}))
writeFileSync(resolve(ROOT, 'public/exercises/browse-index.json'), JSON.stringify(index))

const vector = out.filter(x => x.media.kind === 'vector').length
const indexBytes = Buffer.byteLength(JSON.stringify(index), 'utf-8')
console.log(`gen-exercises: ${out.length} exercises (${vector} vector, ${out.length - vector} photo), ${out.filter(x => x.mergedFrom).length} merged, ${dropped.length} dropped`)
console.log(`gen-exercises: browse-index.json is ${indexBytes} bytes`)
