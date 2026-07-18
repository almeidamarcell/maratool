// Shoe size conversion — pure logic, zero DOM.
//
// Ground truth is FOOT LENGTH in millimetres (the Mondopoint standard). Every
// national system is a documented linear function of foot length. We follow the
// US Brannock-device standard and the barleycorn / Paris-point definitions as
// published on Wikipedia's "Shoe size" article:
//
//   • US men   = 3 × footInch − 22   (Brannock)
//   • US women = 3 × footInch − 21   (Brannock; women = men + 1)
//   • UK       = 3 × footInch − 23   (unisex)
//   • EU       = 1.5 × footCm + 2    (Paris point, +2 pp foot→last allowance)
//   • MX       = 3 × footInch − 23.5
//   • BR       = EU − 2
//   • JP / cm / Mondopoint / inch — the physical foot length itself.
//   • Kids US  = 3 × footInch − 9.75, Kids UK = 3 × footInch − 10 (child scale)
//
// Barleycorn = 1/3 inch (8.47 mm); Paris point = 2/3 cm (6.67 mm). Real-world
// brand sizing varies by up to a full size (lasts and toe allowances differ);
// these are the standard values, not any single brand's chart. Rounding is
// applied per system at display time only, so the converter and the reference
// chart are generated from the same unrounded foot length and never drift.

const MM_PER_INCH = 25.4

// Barleycorn constant K per system: size = 3 × footInch − K.
const K = {
  ukAll: 23,
  usMen: 22,
  usWomen: 21, // Brannock standard: women = men + 1
  usWomenSneaker: 20.5, // Nike/Puma sneaker convention: women = men + 1.5
  mx: 23.5,
  usKid: 9.75,
  ukKid: 10,
}

// Fit conventions. "standard" = the US Brannock-device values. "sneaker" = the
// most common athletic-brand convention (Nike/Puma): women run 1.5 above men,
// and EU runs one point higher (2 cm toe allowance instead of ~1.3 cm). Brands
// vary — this preset represents the Nike/Puma cluster, not a universal rule.
export const FITS = ['standard', 'sneaker']
function euAllowance(fit) {
  return fit === 'sneaker' ? 3 : 2
}

export const CATEGORIES = ['men', 'women', 'kids']
export const SYSTEMS = ['us', 'uk', 'eu', 'br', 'mx', 'jp', 'au', 'cm', 'mondopoint', 'inch']
export const SYSTEM_LABELS = {
  us: 'US',
  uk: 'UK',
  eu: 'EU',
  br: 'BR',
  mx: 'MX',
  jp: 'JP',
  au: 'AU',
  cm: 'cm',
  mondopoint: 'Mondopoint',
  inch: 'inch',
}

// ── rounding helpers ──
export function roundHalf(n) {
  return Math.round(n * 2) / 2
}
export function round1(n) {
  return Math.round(n * 10) / 10
}

// US/UK children's sizes reset at 13.5 → 1Y. Convert a continuous barleycorn
// value into the "8.5C" / "1Y" label printed on kids' shoes.
function labelUsChild(exactChild) {
  const v = roundHalf(exactChild)
  if (v <= 13.5) return v + 'C'
  return roundHalf(v - 13) + 'Y'
}

// ── foot length (mm) → every system, for one category ──
export function footLengthToSizes(mm, category, fit) {
  if (!(mm > 0)) return null
  const cat = category || 'men'
  const sneaker = fit === 'sneaker'
  const inch = mm / MM_PER_INCH
  const cm = mm / 10
  const bar = 3 * inch // barleycorn base: subtract K per system

  const euExact = 1.5 * cm + euAllowance(fit)
  const mxRaw = roundHalf(bar - K.mx)
  const out = {
    cm: round1(cm),
    inch: round1(inch),
    mondopoint: Math.round(mm / 5) * 5,
    eu: roundHalf(euExact),
    br: Math.round(euExact) - 2,
    jp: roundHalf(cm),
    // Mexican numbering isn't defined for very small feet — suppress rather
    // than print a nonsensical zero/negative.
    mx: mxRaw >= 1 ? mxRaw : null,
  }

  if (cat === 'kids') {
    out.us = labelUsChild(bar - K.usKid)
    out.uk = labelUsChild(bar - K.ukKid)
    out.au = out.uk
  } else if (cat === 'women') {
    out.us = roundHalf(bar - (sneaker ? K.usWomenSneaker : K.usWomen))
    out.uk = roundHalf(bar - K.ukAll)
    out.au = out.us // Australian women follow US sizing
  } else {
    out.us = roundHalf(bar - K.usMen)
    out.uk = roundHalf(bar - K.ukAll)
    out.au = out.uk // Australian men follow UK sizing
  }

  return out
}

function barleycornFoot(size, k) {
  // size = 3 × footInch − k  →  footInch = (size + k) / 3
  return ((size + k) / 3) * MM_PER_INCH
}

// ── a size in one system (for a category) → foot length (mm) ──
export function sizeToFootLength(system, size, category, fit) {
  const n = Number(size)
  if (!Number.isFinite(n)) return null
  const cat = category || 'men'
  const sneaker = fit === 'sneaker'
  const euA = euAllowance(fit)

  // physical / unisex systems — independent of category
  switch (system) {
    case 'cm':
      return n > 0 ? n * 10 : null
    case 'mondopoint':
      return n > 0 ? n : null
    case 'inch':
      return n > 0 ? n * MM_PER_INCH : null
    case 'jp':
      return n > 0 ? n * 10 : null
    case 'eu':
      return ((n - euA) / 1.5) * 10
    case 'br':
      // br = round(eu) − 2  →  eu ≈ n + 2  →  cm = (eu − allowance) / 1.5
      return ((n + 2 - euA) / 1.5) * 10
    case 'mx':
      return barleycornFoot(n, K.mx)
  }

  // barleycorn systems — depend on category
  if (cat === 'kids') {
    // n is the continuous child-scale value (a "13C" size is 13; a "1Y" youth
    // size is 13 + 1 = 14 — see parseSizeInput).
    if (system === 'us') return barleycornFoot(n, K.usKid)
    if (system === 'uk' || system === 'au') return barleycornFoot(n, K.ukKid)
    return null
  }
  if (cat === 'women') {
    if (system === 'us' || system === 'au') return barleycornFoot(n, sneaker ? K.usWomenSneaker : K.usWomen)
    if (system === 'uk') return barleycornFoot(n, K.ukAll)
    return null
  }
  if (system === 'us') return barleycornFoot(n, K.usMen)
  if (system === 'uk' || system === 'au') return barleycornFoot(n, K.ukAll)
  return null
}

// Parse a raw user entry for a given system/category into the continuous
// numeric value sizeToFootLength expects. Handles kids' "13C" / "1Y" labels.
export function parseSizeInput(system, raw, category) {
  const str = String(raw == null ? '' : raw).trim().toUpperCase()
  if (!str) return null
  if (category === 'kids' && (system === 'us' || system === 'uk' || system === 'au')) {
    const m = str.match(/^(\d+(?:\.5)?)\s*(C|Y)?$/)
    if (!m) return null
    let v = parseFloat(m[1])
    if (m[2] === 'Y') v += 13
    return v
  }
  const v = parseFloat(str.replace(',', '.'))
  return Number.isFinite(v) ? v : null
}

// ── reference chart rows for a category ──
// Iterates the EU column across the category's useful range and expands every
// system, so the chart is generated from the exact same math as the converter.
export function referenceRows(category, fit) {
  const cat = category || 'men'
  const range = cat === 'kids' ? { from: 19, to: 35 } : cat === 'women' ? { from: 34, to: 45 } : { from: 38, to: 49 }
  const rows = []
  const seen = new Set()
  for (let eu = range.from; eu <= range.to; eu += 1) {
    const mm = sizeToFootLength('eu', eu, cat, fit)
    const sizes = footLengthToSizes(mm, cat, fit)
    if (!sizes) continue
    const key = String(sizes.us) + '|' + sizes.eu
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(sizes)
  }
  return rows
}
