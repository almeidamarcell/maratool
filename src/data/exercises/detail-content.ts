import { byMuscle, equipmentLabel } from './index'
import type { Exercise } from './index'

/**
 * Body copy for `/exercises/{slug}/`.
 *
 * The 1,035 detail pages used to be the how-to steps and nothing else — a
 * median of 184 words in the article body, 661 pages under 200. That is the
 * shape Google's thin-content systems look for on a templated set this size.
 *
 * The fix has one rule: **every sentence is derived from that record's own
 * fields.** No sentence is written once and then handed the exercise name.
 * Concretely:
 *
 * - Muscle prose comes from a per-muscle anatomy table, so a lats page and a
 *   calves page share no wording at all.
 * - The force x mechanic explanations are thirteen separately written
 *   paragraphs in a lookup — not one paragraph with the words swapped. The
 *   dataset really does contain thirteen combinations (including the null and
 *   `isometric` ones the summary stats miss).
 * - The equipment alternatives are computed against the whole dataset, so
 *   they are unique per page and double as internal links.
 *
 * When a field is null the sentence that would have used it is dropped
 * entirely. Nothing here ever renders "unknown", "not available" or an empty
 * value — a page with three good sections beats one with four where the
 * fourth apologises.
 *
 * Everything is a pure function of the JSON dataset: no randomness, no dates,
 * no I/O, so the build is byte-reproducible.
 */

/* ------------------------------------------------------------------ */
/* Muscle anatomy table                                                */
/* ------------------------------------------------------------------ */

interface MuscleFacts {
  /** Anatomical name, ready to drop after "the". */
  anatomy: string
  /** What it does, as a verb phrase following "which …". */
  action: string
  /** Its job when it is a supporting muscle, as a full lowercase clause. */
  support: string
  /**
   * Whether `anatomy` is grammatically plural. "the deltoids … which raise"
   * needs "are"; "the pectoralis major … which drives" needs "is". Without
   * this flag a third of the pages read as broken English.
   */
  plural: boolean
}

/**
 * One entry per distinct muscle value in the dataset (17 of them, and the same
 * 17 appear in both the primary and secondary fields). These are the sentences
 * that make two pages read differently, so they are written per muscle rather
 * than generated.
 */
const MUSCLES: Record<string, MuscleFacts> = {
  abdominals: {
    anatomy: 'rectus abdominis and the obliques',
    action: 'flex the trunk forward and resist it being pulled into extension or twisted out of line',
    support: 'the abdominals brace the trunk so force can pass between the hips and the shoulders',
    plural: true,
  },
  abductors: {
    anatomy: 'hip abductors — gluteus medius and minimus',
    action: 'drive the thigh away from the midline and keep the pelvis level when you stand on one leg',
    support: 'the abductors stop the knee collapsing inward and hold the pelvis square',
    plural: true,
  },
  adductors: {
    anatomy: 'adductor group down the inner thigh',
    action: 'pulls the leg back toward the midline and controls the hip as it opens',
    support: 'the adductors steady the thigh against the pull away from the midline',
    plural: false,
  },
  biceps: {
    anatomy: 'biceps brachii',
    action: 'bends the elbow and rotates the forearm palm-up',
    support: 'the biceps add force at the elbow',
    plural: false,
  },
  calves: {
    anatomy: 'calves — gastrocnemius over the knee and soleus beneath it',
    action: 'point the foot down and absorb load every time the ankle takes weight',
    support: 'the calves control the ankle and hold the heel position',
    plural: true,
  },
  chest: {
    anatomy: 'pectoralis major',
    action: 'drives the upper arm forward and across the body',
    support: 'the chest adds pushing force at the shoulder',
    plural: false,
  },
  forearms: {
    anatomy: 'forearm flexors and extensors',
    action: 'move the wrist and keep the hand closed around whatever you are holding',
    support: 'the forearms hold the grip, which is often what gives out first',
    plural: true,
  },
  glutes: {
    anatomy: 'gluteus maximus',
    action: 'is the strongest hip extensor you have and drives the pelvis forward at the top of the movement',
    support: 'the glutes finish hip extension',
    plural: false,
  },
  hamstrings: {
    anatomy: 'hamstrings',
    action: 'extend the hip and bend the knee, frequently at both joints in the same repetition',
    support: 'the hamstrings assist hip extension and slow the knee down',
    plural: true,
  },
  lats: {
    anatomy: 'latissimus dorsi',
    action: 'pulls the upper arm down and back toward the ribcage',
    support: 'the lats keep the upper arm drawn in toward the torso',
    plural: false,
  },
  'lower back': {
    anatomy: 'spinal erectors running either side of the lumbar spine',
    action: 'hold the spine extended instead of letting it round under load',
    support: 'the lower back keeps the spine from rounding',
    plural: true,
  },
  'middle back': {
    anatomy: 'rhomboids and mid-trapezius',
    action: 'draw the shoulder blades together and back down the ribcage',
    support: 'the mid-back retracts the shoulder blades so the shoulder has something solid to work from',
    plural: true,
  },
  neck: {
    anatomy: 'cervical flexors and extensors',
    action: 'move the head and hold it steady on top of the spine',
    support: 'the neck muscles keep the head from being dragged out of position',
    plural: true,
  },
  quadriceps: {
    anatomy: 'quadriceps across the front of the thigh',
    action: 'straighten the knee and, just as importantly, control it on the way back down',
    support: 'the quadriceps straighten the knee and take load on the descent',
    plural: true,
  },
  shoulders: {
    anatomy: 'deltoids',
    action: 'raise and rotate the upper arm at the shoulder joint',
    support: 'the deltoids stabilise the shoulder and add force at the top of the range',
    plural: true,
  },
  traps: {
    anatomy: 'trapezius',
    action: 'shrugs the shoulder blade up, rotates it, and pulls it back down',
    support: 'the traps anchor the shoulder blade against the load',
    plural: false,
  },
  triceps: {
    anatomy: 'triceps brachii',
    action: 'straightens the elbow, and through its long head helps pull the arm back at the shoulder',
    support: 'the triceps straighten the elbow to finish the movement',
    plural: false,
  },
}

/* ------------------------------------------------------------------ */
/* force x mechanic                                                    */
/* ------------------------------------------------------------------ */

/**
 * Thirteen combinations actually occur across the 1,035 records:
 *
 *   push|compound 266   pull|compound 201   pull|isolation 154
 *   null|isolation 134  push|isolation  96  static|null     52
 *   static|isolation 44 null|compound   42  null|null       17
 *   pull|null       14  static|compound  7  push|null        5
 *   null|isometric   3
 *
 * Each gets its own explanation of what those two flags mean *for a movement
 * of that shape* — how the load behaves, and what that implies for how you
 * would run a set. `null|null` is absent from the table on purpose: with
 * neither flag there is nothing to explain, so the section is dropped rather
 * than filled with a hedge.
 *
 * These are the most-repeated sentences on the section — one of them appears on
 * 266 pages — so they are kept deliberately short. Length belongs in the blocks
 * that differ per page, not in the ones that do not.
 */
const MOVEMENT: Record<string, string> = {
  'push|compound':
    'The working muscles shorten as they drive the load away from you, and more than one joint changes angle to do it. Load spreads down a chain instead of sitting on one muscle, which is why a compound push handles more weight than any single-joint alternative — and why joint position, not the muscle, is usually what fails first.',
  'pull|compound':
    'The load travels toward you and several joints bend to bring it there. The arms finish work the back starts, so grip and elbow flexors sit in the path of every repetition: when people stall on a compound pull, it is more often the hands giving out than the primary muscle running out of force.',
  'pull|isolation':
    'One joint changes angle and the resistance travels toward you along a single arc. Nothing is positioned to help, so tension stays where you aimed it and the usable load drops sharply against a multi-joint pull for the same muscle. Protect the range of motion; buying weight by shortening the arc defeats the point.',
  'push|isolation':
    'One joint moves, and it moves the load away from the body. With nothing recruited to assist, the target muscle reaches its own limit rather than the limit of the weakest link in a chain — which makes this useful for adding volume after the heavy compound work, not for opening a session.',
  'null|isolation':
    'Everything happens at one joint. That gives you direct control over where the tension sits; the trade-off is that the muscle gets no help, so the load that feels hard here is a fraction of what a multi-joint version of the pattern would take. Slow, complete repetitions beat heavy ones.',
  'null|compound':
    'Several joints move together, so effort spreads across a chain rather than concentrating in one place. Coordination is part of the difficulty: the movement is only as good as its weakest link, and improving it often means fixing a position somewhere other than the muscle you meant to train.',
  'static|null':
    'Nothing travels once you are in position. The muscle holds a length under tension instead of working through a range, so effort is measured in seconds rather than repetitions — and the honest progression is more time in a good position, not a deeper one forced early.',
  'static|isolation':
    'You get into position and hold. One joint sets the angle and one muscle group takes the tension, so the load stays exactly where you put it. Hold for time, breathe normally, and come out the moment the position drifts: a shape that has quietly shifted is no longer training what you set it up to train.',
  'static|compound':
    'Several joints combine to set the position, and then everything stops. Because the shape is held rather than repeated, the limit is how long the whole chain stays where you put it — not how strong any single muscle in that chain happens to be.',
  'push|null':
    'Force goes away from the body: the muscles press against the floor, a wall or your own opposite limb rather than drawing anything in. There is no weight to add, so the position you can reach and keep is the whole variable.',
  'pull|null':
    'Force comes toward the body — you draw a limb, or your own bodyweight, in against whatever resists it. What changes between sessions is how far into the position you can get and hold, not how much is loading it.',
  'null|isometric':
    'The muscle contracts without changing length and without the joint travelling. There is no lowering or lifting phase to count, so effort is prescribed in seconds of tension, and you can push hard without asking the joint to tolerate any range at all.',
}

/* ------------------------------------------------------------------ */
/* category                                                            */
/* ------------------------------------------------------------------ */

/** One per category value: strength 744, stretching 123, plyometrics 61,
 *  powerlifting 38, olympic weightlifting 34, strongman 21, cardio 14. */
const CATEGORY: Record<string, string> = {
  strength:
    'It is filed under strength: produce force against resistance for a countable number of repetitions, and progress the resistance over time.',
  stretching:
    'It is filed under stretching, so the target is range of motion rather than force — a position you can settle into and breathe in, held long enough for the tissue to give.',
  plyometrics:
    'It is filed under plyometrics, which trains the stretch-shortening cycle: loaded fast, released immediately. Contact time matters more than volume, so these belong early in a session.',
  powerlifting:
    'It is filed under powerlifting — the squat, bench and deadlift family and their accessory work. Technique is judged by whether it survives a near-maximal single, not merely by whether the weight moves.',
  'olympic weightlifting':
    'It is filed under olympic weightlifting. The bar must move fast enough for you to get underneath it, which makes this a skill rather than a grind: low repetitions, well short of where fatigue starts editing technique.',
  strongman:
    'It is filed under strongman, where the load is deliberately awkward rather than balanced. Most of the difficulty goes on holding on and staying braced.',
  cardio:
    'It is filed under cardio. The work is continuous and paced rather than counted in sets, so progress shows up as duration, distance or a lower heart rate at the same effort.',
}

/* ------------------------------------------------------------------ */
/* equipment                                                           */
/* ------------------------------------------------------------------ */

/**
 * What each piece of kit actually changes about the movement. `other` is
 * deliberately absent: it is the generator's fallback for records whose source
 * names no equipment (201 of them), and inventing a sentence about it would be
 * exactly the hedge this module exists to avoid. Those pages simply skip
 * straight to the alternatives.
 */
const EQUIPMENT: Record<string, string> = {
  barbell:
    'A barbell locks both hands to one bar, so neither side can drift and the load climbs in plate-sized steps. That makes it the simplest way to add weight and the least forgiving thing to bail out of.',
  dumbbell:
    'Dumbbells let each side work on its own, surfacing a strength difference between limbs that a barbell would quietly cover for, and leaving the wrist free to rotate through the movement.',
  cable:
    'A cable holds tension for the whole range, including the point where a free weight would go slack. Moving the pulley changes the angle the resistance arrives from without changing the movement.',
  machine:
    'The machine fixes the path, removing the balance demand and letting you train close to failure without a spotter. The cost is the stabilising work a free weight would have made you do.',
  'body only':
    'No equipment at all. The resistance is your own bodyweight, so you progress by changing leverage, range or tempo rather than by adding plates — and you can do it anywhere.',
  kettlebell:
    "A kettlebell's mass hangs below and outside the handle, so it pulls away from the grip and the wrist has to stay packed. That offset is why racked and swinging variations feel nothing like the dumbbell version.",
  bench: 'A bench fixes the torso angle and gives you something to drive against, which is what lets the load go up without your position wandering.',
  band:
    'A band gets harder the further it stretches, so resistance peaks at the end of the range rather than the middle. It is also the easiest way to scale a movement in small steps.',
  'medicine ball':
    'A medicine ball can be thrown and caught, which suits movements where you keep accelerating the load all the way through instead of decelerating it to spare a joint.',
  'exercise ball':
    'The exercise ball is an unstable base on purpose. It shortens the leverage you can hold and demands constant small corrections, so the trunk works even when the movement is aimed elsewhere.',
  'foam roll':
    'A foam roll is a firm rolling contact point — depending where you put it, it either applies pressure to tissue or takes the stability out from under you.',
  'smith machine':
    'A Smith machine runs the bar on a fixed track. You never have to balance it, so you can chase the target muscle harder, but your joints have to accept the path the rails picked.',
  'e-z curl bar':
    'The cambered EZ bar sets the hands half-way between palms-up and palms-in, taking strain off the wrist and elbow compared with a straight bar.',
}

/* ------------------------------------------------------------------ */
/* level                                                               */
/* ------------------------------------------------------------------ */

const LEVEL: Record<string, string> = {
  beginner:
    'Listed at beginner level: the pattern is simple enough to pick up without coaching, and a position that goes wrong mid-set is obvious enough to correct on the next repetition.',
  intermediate:
    'Listed at intermediate level. It assumes you already own the underlying pattern and can hold position under load — if the position breaks before the target muscle tires, drop back to a beginner variation until it does not.',
  expert:
    'Listed at expert level. It asks for range, stability or speed that takes time to build, and it punishes a rushed set-up much harder than an easier movement would.',
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export interface Alternative {
  slug: string
  name: string
  /** Display label for the kit it needs, e.g. "cable" or "no equipment listed". */
  equipment: string
}

export interface MuscleLink {
  label: string
  href: string
}

export interface LevelContext {
  note: string
  label: string
  href: string
  muscle: string
  muscleHref: string
  sameLevel: number
  muscleTotal: number
}

export interface ExerciseDetailContent {
  /** Sentences of the "Muscles worked" paragraph. */
  muscles: string[]
  /** Hub links for every muscle named in that paragraph. */
  muscleLinks: MuscleLink[]
  /** Sentences of the "How this movement works" paragraph. */
  movement: string[]
  /** One sentence per named piece of equipment. Empty when none is named. */
  equipment: string[]
  /** Hub links for the named equipment this exercise uses. */
  equipmentLinks: MuscleLink[]
  /** Same primary muscle, kit this exercise does not use. */
  alternatives: Alternative[]
  /** Lead-in for the alternatives list. Empty when there are none. */
  alternativesLead: string
  level: LevelContext | null
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const slugify = (s: string) => s.replace(/ /g, '-')

/** "a, b and c" — Oxford comma omitted deliberately; matches the site's copy. */
function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * The primary-muscle sentence, framed by what the category says the muscle is
 * doing. A stretching record's `primaryMuscles` is the muscle being lengthened,
 * not the prime mover, so calling it the prime mover would be wrong — hence
 * four framings rather than one.
 */
function primarySentences(ex: Exercise): string[] {
  const parts = ex.primaryMuscles.filter(m => MUSCLES[m])
  if (parts.length === 0) return []

  const describe = (m: string) => `the ${MUSCLES[m].anatomy}, which ${MUSCLES[m].action}`
  const joined = list(parts.map(describe))

  // Two primary muscles are plural regardless; one takes the muscle's own flag.
  const plural = parts.length > 1 || MUSCLES[parts[0]].plural
  const is = plural ? 'are' : 'is'
  const them = plural ? 'them' : 'it'
  const they = plural ? 'they' : 'it'

  if (ex.category === 'stretching') {
    return [
      `The ${plural ? 'muscles' : 'muscle'} under tension ${is} ${joined}.`,
      `A stretch loads ${them} at the far end of the range ${they} normally ${plural ? 'work' : 'works'} in, so the position you hold is itself the resistance.`,
    ]
  }
  if (ex.category === 'plyometrics') {
    return [
      `The force comes from ${joined}.`,
      `A plyometric repetition is over before a slow contraction could contribute anything, so ${they} ${plural ? 'have' : 'has'} to produce that force immediately on contact.`,
    ]
  }
  if (ex.category === 'cardio') {
    return [
      `The repetitive work falls on ${joined}.`,
      'Holding a sustainable output for minutes at a time is a different demand from a heavy set, which is why fatigue here shows up as a gradual fade rather than a rep you suddenly cannot finish.',
    ]
  }
  return [
    parts.length > 1
      ? `Two muscle groups share the work: ${joined}.`
      : `The prime mover${plural ? 's' : ''} ${is} ${joined}.`,
  ]
}

/**
 * The supporting-muscle sentence. Its opening clause is drawn from `mechanic`,
 * because the reason the secondary muscles show up at all is whether more than
 * one joint is moving.
 */
function secondarySentences(ex: Exercise): string[] {
  const named = ex.secondaryMuscles.filter(m => MUSCLES[m])
  if (named.length === 0) return []

  // Three roles spelled out is as much as a sentence carries; beyond that the
  // remaining muscles are named rather than described.
  const shown = named.slice(0, 3).map(m => MUSCLES[m].support)
  const rest = named.slice(3)

  // The reason support muscles appear at all is how the movement is shaped, so
  // the opening clause comes from `mechanic` and `force` rather than being
  // written once. `static` is checked before `mechanic`, because "because more
  // than one joint is moving" is plainly false of a position you hold still.
  const lead =
    ex.mechanic === 'isometric'
      ? 'Holding the contraction still pulls in support: '
      : ex.force === 'static'
        ? 'Nothing travels, but holding the position is not the target muscle’s job alone: '
        : ex.mechanic === 'compound'
          ? 'Because more than one joint is moving, the work does not stay in one place: '
          : ex.mechanic === 'isolation'
            ? 'Even with a single joint doing the moving, the muscle is not working alone — '
            : 'Other muscle groups are involved too: '

  const out = [`${lead}${shown.join('; ')}.`]
  if (rest.length > 0) {
    out.push(`The ${list(rest)} take a share of the work as well.`)
  }
  return out
}

/**
 * Other exercises hitting the same primary muscle with kit this one does not
 * use. Two properties matter:
 *
 * 1. **Variety.** Walking each muscle group from index 0 would hand every page
 *    the same alphabetically-first suggestions. The walk is seeded at the
 *    exercise's own position in the group and wraps around, the same technique
 *    `relatedExercises` uses, so neighbouring pages suggest different things.
 * 2. **Determinism.** No randomness; the walk order is a pure function of the
 *    dataset order and the exercise's index within it.
 *
 * One candidate per distinct lead equipment value, so the list reads as a menu
 * of options rather than six barbell variations. Candidates whose only
 * equipment value is `other` are skipped: `other` is the generator's fallback
 * for records that name no equipment, so such a row could not honour the
 * promise the list makes.
 */
export function equipmentAlternatives(ex: Exercise, limit = 5): Alternative[] {
  const own = new Set(ex.equipment)
  const usedEquipment = new Set<string>()
  const seen = new Set<string>([ex.slug])
  const out: Alternative[] = []

  for (const m of ex.primaryMuscles) {
    const group = byMuscle[m]
    if (!group) continue
    const i = group.findIndex(g => g.slug === ex.slug)
    const rotated = i >= 0 ? [...group.slice(i + 1), ...group.slice(0, i)] : group

    for (const c of rotated) {
      if (out.length >= limit) return out
      if (seen.has(c.slug)) continue
      const kit = c.equipment.filter(e => e !== 'other')
      // Must name kit, and it must be kit this exercise does not already use —
      // that is the entire point of the list.
      if (kit.length === 0 || kit.some(e => own.has(e))) continue
      const bucket = kit[0]
      if (usedEquipment.has(bucket)) continue
      usedEquipment.add(bucket)
      seen.add(c.slug)
      out.push({ slug: c.slug, name: c.name, equipment: kit.join(' + ') })
    }
  }
  return out
}

export function exerciseDetailContent(ex: Exercise): ExerciseDetailContent {
  const muscles = [...primarySentences(ex), ...secondarySentences(ex)]

  // Primary plus the first four supporting muscles: enough to be a useful index
  // without turning the paragraph into a link farm.
  const linked = [...ex.primaryMuscles, ...ex.secondaryMuscles.slice(0, 4)]
  const muscleLinks = [...new Set(linked)]
    .filter(m => byMuscle[m])
    .map(m => ({ label: cap(m), href: `/exercises/muscle/${slugify(m)}/` }))

  const movementKey = `${ex.force ?? 'null'}|${ex.mechanic ?? 'null'}`
  const movement = [MOVEMENT[movementKey], CATEGORY[ex.category]].filter(Boolean) as string[]

  const equipment = ex.equipment.map(e => EQUIPMENT[e]).filter(Boolean) as string[]
  // `other` is the fallback for records naming no equipment; a chip reading
  // "No equipment listed" is noise next to prose, so it is left off.
  const equipmentLinks = ex.equipment
    .filter(e => e !== 'other')
    .map(e => ({ label: cap(e), href: `/exercises/equipment/${slugify(e)}/` }))

  const alternatives = equipmentAlternatives(ex)
  const alternativesLead =
    alternatives.length > 0 && ex.primaryMuscles.length > 0
      ? `These train the ${list(ex.primaryMuscles)} too, using equipment this one does not:`
      : ''

  let level: LevelContext | null = null
  const primary = ex.primaryMuscles[0]
  if (ex.level && LEVEL[ex.level] && primary && byMuscle[primary]) {
    const group = byMuscle[primary]
    level = {
      note: LEVEL[ex.level],
      label: cap(ex.level),
      href: `/exercises/level/${slugify(ex.level)}/`,
      muscle: primary,
      muscleHref: `/exercises/muscle/${slugify(primary)}/`,
      sameLevel: group.filter(g => g.level === ex.level).length,
      muscleTotal: group.length,
    }
  }

  return {
    muscles,
    muscleLinks,
    movement,
    equipment,
    equipmentLinks,
    alternatives,
    alternativesLead,
    level,
  }
}

/** Every distinct muscle key the anatomy table covers — used by the tests. */
export const COVERED_MUSCLES = Object.keys(MUSCLES)
/** Every force|mechanic key the movement table covers — used by the tests. */
export const COVERED_MOVEMENTS = Object.keys(MOVEMENT)
