import { eliteAffixFor, type EliteAffixId } from './elite-affixes'
import { hashSeed } from './evolution'
import { GLOAMWOOD_VALLEY_BRANCHES } from './gloamwood-valley-branches'
import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'
import type { GloamwoodCreatureRole } from './gloamwood-creature-aggro'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyBranchPointAt,
  gloamwoodValleyConfine,
  gloamwoodValleyPointAt,
  gloamwoodValleyRoadOffset,
  gloamwoodValleyWalkable,
  gloamwoodValleyWalkableHalfWidth,
  type GloamwoodValleyRegionId,
} from './gloamwood-valley-terrain'

/**
 * What lives in the valley, and where.
 *
 * The map was finished and empty. These are the numbers behind filling it,
 * kept as data so the composition can be argued about without running the
 * game - which is the only way a producer can actually approve it.
 *
 * Two rules do most of the work:
 *
 *   - A pack is one anchor and its支持. A group of one species teaches
 *     nothing; a mixed one forces the player to decide who dies first, which
 *     is the whole of the moment-to-moment game.
 *   - The road carries what has to be fought; the branches carry what is worth
 *     going out of the way for. Every elite is down a branch.
 */

export type GloamwoodValleySpawnKind = 'grazer' | 'pack' | 'nest' | 'elite' | 'boss'

export interface GloamwoodValleyRegionPlan {
  region: GloamwoodValleyRegionId
  /** Passive creatures scattered on the banks. */
  grazers: number
  /** Aggressive groups on the road. Each entry is one group's make-up. */
  packs: readonly (readonly GloamwoodPreyKind[])[]
  /** Waves in this region's road nest. */
  nestWaves: readonly (readonly GloamwoodPreyKind[])[]
}

/**
 * Packs read as "kill that one first".
 *
 * The Fang is fast and hits hard, the Carapace is slow and armoured from the
 * front, the Swarm is nothing on its own and unbearable in threes. Every group
 * below is one of those anchoring a mix, and the mixes get harder to unpick
 * rather than simply bigger.
 */
export const GLOAMWOOD_VALLEY_PLAN: readonly GloamwoodValleyRegionPlan[] = [
  {
    region: 'shallows',
    grazers: 8,
    packs: [
      // Teaching order: a fast thing with chaff, then armour that must be
      // flanked, then two fast things at once.
      ['fang', 'swarm', 'swarm'],
      ['shell', 'swarm', 'swarm'],
      ['fang', 'fang', 'swarm'],
    ],
    nestWaves: [
      ['fang', 'swarm', 'swarm'],
      ['shell', 'fang', 'swarm', 'swarm'],
    ],
  },
  {
    region: 'gorge',
    grazers: 6,
    packs: [
      ['shell', 'fang', 'swarm', 'swarm'],
      ['fang', 'fang', 'swarm', 'swarm'],
      ['shell', 'shell', 'swarm', 'fang'],
    ],
    nestWaves: [
      ['shell', 'fang', 'swarm', 'swarm'],
      ['shell', 'fang', 'fang', 'swarm'],
    ],
  },
  {
    region: 'headwater',
    grazers: 4,
    packs: [
      ['shell', 'shell', 'fang', 'fang'],
      ['fang', 'fang', 'fang', 'swarm'],
      ['shell', 'fang', 'swarm', 'swarm'],
    ],
    nestWaves: [
      ['shell', 'shell', 'fang', 'swarm'],
      ['shell', 'fang', 'fang', 'swarm'],
      ['shell', 'shell', 'fang', 'fang'],
    ],
  },
]

/**
 * Which families ever graze.
 *
 * The Fang is a predator; a passive one is a contradiction the player would
 * read as a bug the first time one ignored them. Armour and swarms are what
 * the valley feeds.
 */
export const GLOAMWOOD_GRAZING_FAMILIES: readonly GloamwoodPreyKind[] = ['shell', 'swarm']

export interface GloamwoodValleySpawn {
  id: string
  kind: GloamwoodValleySpawnKind
  /** Null on a nest or a boss marker, which the encounter itself populates. */
  family: GloamwoodPreyKind | null
  role: GloamwoodCreatureRole
  x: number
  z: number
  /** Distance along the route, for region lookups and progression gates. */
  s: number
  region: GloamwoodValleyRegionId
  /** Set on pack members, so a pack can be woken and counted as a unit. */
  packId: string | null
  /** Set on anything down a branch. */
  branch: string | null
  affix: EliteAffixId | null
}

/** Nest sites on the road, one per region. */
export const GLOAMWOOD_VALLEY_NEST_SITES: Record<GloamwoodValleyRegionId, number> = {
  shallows: 250,
  gorge: 640,
  headwater: 1300,
}

/**
 * Lays out a whole run's creatures from a seed.
 *
 * Deterministic, because the run already is: a recorded session has to be
 * replayable against the encounters it actually happened against.
 */
export function planGloamwoodValleyEncounters(seed: string): GloamwoodValleySpawn[] {
  const random = seededRandom(hashSeed(seed))
  const spawns: GloamwoodValleySpawn[] = []

  for (const plan of GLOAMWOOD_VALLEY_PLAN) {
    const region = GLOAMWOOD_VALLEY.regions.find((entry) => entry.id === plan.region)
    if (!region) continue
    const span = region.to - region.from
    const nestS = GLOAMWOOD_VALLEY_NEST_SITES[plan.region]

    // Packs sit between the region's landmarks rather than on them: a group
    // standing on a nest mouth or a boss arena turns two encounters into one
    // the player never chose to take together.
    for (const [index, members] of plan.packs.entries()) {
      const packId = `${plan.region}-pack-${index + 1}`
      const at = freeSlot(region.from + span * (0.18 + 0.28 * index) + random() * 18, region, nestS)
      for (const [member, family] of members.entries()) {
        const spread = 1.9 + member * 0.55
        const angle = (member / members.length) * Math.PI * 2 + random()
        spawns.push(place({
          id: `${packId}-${member + 1}`,
          kind: 'pack',
          family,
          role: 'aggressive',
          s: at + Math.cos(angle) * spread,
          lateral: gloamwoodValleyRoadOffset(at) + Math.sin(angle) * spread,
          region: plan.region,
          packId,
          branch: null,
          affix: null,
        }))
      }
    }

    for (let index = 0; index < plan.grazers; index += 1) {
      const at = region.from + span * ((index + 0.5) / plan.grazers) + (random() - 0.5) * 24
      const limit = gloamwoodValleyWalkableHalfWidth(at)
      // On the bank, off the path - a grazer standing in the road is one the
      // player has to walk through and therefore has to fight.
      const side = random() < 0.5 ? -1 : 1
      const lateral = side * (limit * (0.55 + random() * 0.35))
      spawns.push(place({
        id: `${plan.region}-grazer-${index + 1}`,
        kind: 'grazer',
        family: GLOAMWOOD_GRAZING_FAMILIES[Math.floor(random() * GLOAMWOOD_GRAZING_FAMILIES.length)],
        role: 'passive',
        s: at,
        lateral,
        region: plan.region,
        packId: null,
        branch: null,
        affix: null,
      }))
    }

    spawns.push(place({
      id: `${plan.region}-nest`,
      kind: 'nest',
      family: null,
      role: 'aggressive',
      s: nestS,
      lateral: gloamwoodValleyRoadOffset(nestS),
      region: plan.region,
      packId: null,
      branch: null,
      affix: null,
    }))
  }

  // Every branch chamber holds an elite. The branches are optional, so what is
  // down them has to be worth the walk, and an elite is the only thing in the
  // map that reliably is.
  for (const [index, branch] of GLOAMWOOD_VALLEY_BRANCHES.entries()) {
    const region = GLOAMWOOD_VALLEY.regions.find(
      (entry) => branch.mouthS >= entry.from && branch.mouthS <= entry.to,
    ) ?? GLOAMWOOD_VALLEY.regions[0]
    const chamber = gloamwoodValleyBranchPointAt(index, branch.kind === 'loop' ? 0.5 : 0.92, 0)
    const confined = gloamwoodValleyConfine(chamber.x, chamber.z)
    spawns.push({
      id: `${branch.id}-elite`,
      kind: 'elite',
      family: eliteFamilyFor(random()),
      role: 'aggressive',
      x: confined.x,
      z: confined.z,
      s: branch.mouthS,
      region: region.id,
      packId: null,
      branch: branch.id,
      affix: eliteAffixFor(seed, `${branch.id}-elite`),
    })
  }

  for (const [index, at] of GLOAMWOOD_VALLEY.bossSlots.entries()) {
    const region = GLOAMWOOD_VALLEY.regions[Math.min(index, GLOAMWOOD_VALLEY.regions.length - 1)]
    spawns.push(place({
      id: `region-boss-${index + 1}`,
      kind: 'boss',
      family: null,
      role: 'aggressive',
      s: at,
      lateral: gloamwoodValleyRoadOffset(at),
      region: region.id,
      packId: null,
      branch: null,
      affix: null,
    }))
  }

  return spawns
}

/** Elites are the heavy families; a swarm elite is a bigger gnat. */
function eliteFamilyFor(sample: number): GloamwoodPreyKind {
  return sample < 0.5 ? 'shell' : 'fang'
}

/**
 * Nudges a pack clear of the region's landmarks.
 *
 * Nudged rather than dropped. Skipping a colliding slot silently produced a
 * region with two packs where the plan asked for three, which is the kind of
 * loss nothing downstream can see and no one would think to look for.
 */
function freeSlot(wanted: number, region: { from: number; to: number }, nestS: number) {
  if (!isReserved(wanted, nestS)) return wanted
  for (let offset = 4; offset <= 220; offset += 4) {
    for (const at of [wanted + offset, wanted - offset]) {
      if (at < region.from + 12 || at > region.to - 12) continue
      if (!isReserved(at, nestS)) return at
    }
  }
  return wanted
}

function isReserved(at: number, nestS: number) {
  if (Math.abs(at - nestS) < 34) return true
  if (GLOAMWOOD_VALLEY.chokes.some((choke) => Math.abs(at - choke) < GLOAMWOOD_VALLEY.chokeSpan)) return true
  return GLOAMWOOD_VALLEY.bossSlots.some((boss) => Math.abs(at - boss) < 40)
}

function place(spawn: Omit<GloamwoodValleySpawn, 'x' | 'z'> & { lateral: number }): GloamwoodValleySpawn {
  const point = gloamwoodValleyPointAt(spawn.s, spawn.lateral)
  // Confined on the way in rather than checked afterwards: a creature standing
  // in a wall is a creature the player cannot reach and the run cannot clear.
  const safe = gloamwoodValleyWalkable(point.x, point.z)
    ? point
    : gloamwoodValleyConfine(point.x, point.z)
  const { lateral, ...rest } = spawn
  void lateral
  return { ...rest, x: safe.x, z: safe.z }
}

function seededRandom(seed: number) {
  let value = seed >>> 0 || 1
  return () => {
    value ^= value << 13
    value ^= value >>> 17
    value ^= value << 5
    return ((value >>> 0) % 100000) / 100000
  }
}
