#!/usr/bin/env node
// Merge the two vendored exercise datasets into one normalized file plus a
// lightweight browse index. Runs in `npm run prebuild`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMuscle, normalizeEquipment } from '../src/data/exercises/vocab.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const load = p => JSON.parse(readFileSync(resolve(ROOT, p), 'utf-8'))

const EK_ATTRIBUTION = 'Illustration: Everkinetic — CC BY-SA 4.0'
const FE_ATTRIBUTION = 'Photos: free-exercise-db — public domain (Unlicense)'

const ek = load('src/data/exercises/everkinetic.raw.json')
const fe = load('src/data/exercises/free-exercise-db.raw.json')

const slugify = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
const tokens = n => new Set(String(n ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean))
const jaccard = (a, b) => {
  const inter = [...a].filter(x => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

// Split a comma-joined muscle string ("triceps, biceps") into canonical muscles.
const splitMuscles = raw =>
  String(raw ?? '').split(',').map(s => normalizeMuscle(s)).filter(Boolean)

const uniq = a => [...new Set(a)]

// ---- index free-db by token set for fuzzy matching ----
const feIndexed = fe.map(x => ({ rec: x, toks: tokens(x.name) }))
const MATCH_THRESHOLD = 0.75

const usedFe = new Set()
const out = []
const dropped = []

// ---- Everkinetic first: it owns the better (vector) media ----
for (const x of ek) {
  const name = x.title || x.name
  const toks = tokens(name)
  let best = 0, bestRec = null
  for (const cand of feIndexed) {
    if (usedFe.has(cand.rec.id)) continue
    const j = jaccard(toks, cand.toks)
    if (j > best) { best = j; bestRec = cand.rec }
  }
  const matched = best >= MATCH_THRESHOLD ? bestRec : null
  if (matched) usedFe.add(matched.id)

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
    mechanic: matched?.mechanic ?? x.type ?? null,
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
  if (imgs.length < 2) continue
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
    mechanic: x.mechanic ?? null,
    instructions,
    media: { kind: 'photo', start: imgs[0], end: imgs[1] },
    source: 'free-exercise-db',
    attribution: FE_ATTRIBUTION,
  })
}

for (const name of dropped) console.log(`dropped: ${name}`)

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

const index = out.map(x => ({
  slug: x.slug,
  name: x.name,
  primaryMuscles: x.primaryMuscles,
  equipment: x.equipment,
  category: x.category,
  level: x.level,
  mediaKind: x.media.kind,
}))
writeFileSync(resolve(ROOT, 'public/exercises/browse-index.json'), JSON.stringify(index))

const vector = out.filter(x => x.media.kind === 'vector').length
console.log(`gen-exercises: ${out.length} exercises (${vector} vector, ${out.length - vector} photo), ${out.filter(x => x.mergedFrom).length} merged, ${dropped.length} dropped`)
