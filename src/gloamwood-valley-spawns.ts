import type { GloamwoodPreyKind } from './gloamwood-3d-ecology'
import { GLOAMWOOD_AGGRO, type GloamwoodCreatureRole } from './gloamwood-creature-aggro'
import { GLOAMWOOD_VALLEY_BRANCHES, gloamwoodValleyBranchHalfWidth } from './gloamwood-valley-branches'
import { GLOAMWOOD_PREY_BODY_RADII } from './gloamwood-3d-ecology'
import { gloamwoodModelledPreyFor } from './gloamwood-modelled-prey'
import { gloamwoodValleyEcologyPacks, resolveGloamwoodValleyEcology } from './gloamwood-valley-ecology'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyBranchPointAt,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyHalfWidth,
  gloamwoodValleyWalkableHalfWidth,
  gloamwoodValleyPointAt,
  gloamwoodValleyRoadHalfWidth,
  gloamwoodValleyRoadOffset,
  gloamwoodValleyWalkable,
  type GloamwoodValleyRegionId,
} from './gloamwood-valley-terrain'

/**
 * Who lives where in the valley.
 *
 * The counts and the mixes are the producer's, agreed before any of this was
 * written; this module only places them. Keeping the decision as data and the
 * placement as a function is what makes the decision reviewable without running
 * the game - and the numbers here are the ones in the plan, not numbers that
 * drifted while the code was written.
 *
 * Two rules do the real work:
 *
 * A pack is one anchor plus support. A group of one species teaches nothing;
 * the decision the player makes is which of a mixed group dies first, and that
 * only exists if the group is mixed.
 *
 * Packs are spaced further apart than an aggressive creature can notice from.
 * Without that the road is one continuous fight and there is never a reason to
 * choose to start one.
 */

export type GloamwoodValleySpawnTier = 'grazer' | 'pack' | 'nest' | 'elite' | 'boss'

export interface GloamwoodValleyRegionSpawnPlan {
  region: GloamwoodValleyRegionId
  /** Passive creatures scattered off the road. */
  grazers: number
  /**
   * Which family the region's grazers are.
   *
   * Family picks the body, so this is what decides whether a bank carries the
   * beetle or the horned grazer. Left as one family everywhere, three passive
   * bodies were built and only one could ever be chosen - which looked like the
   * others not loading rather than like a data gap.
   */
  grazerKinds: readonly GloamwoodPreyKind[]
  /** Share of the region's grazers placed down its branches rather than on the road. */
  grazersInBranches: number
  /** One entry per pack, listing exactly who is in it. */
  packs: readonly (readonly GloamwoodPreyKind[])[]
  /** Waves the region's one road nest runs. */
  nestWaves: number
}

export const GLOAMWOOD_VALLEY_SPAWN_PLAN: readonly GloamwoodValleyRegionSpawnPlan[] = [
  {
    region: 'shallows',
    grazers: 8,
    // Green and grassy, so both of the soft bodies belong here.
    grazerKinds: ['fang', 'shell'],
    grazersInBranches: 0.375,
    packs: [
      // Teaching order. A Fang anchor with two Swarm behind it: kill the anchor
      // or be worn down, which is the first decision the game asks for.
      ['fang', 'swarm', 'swarm'],
      // Then the same shape with an armoured anchor, so the answer has to
      // change - the Carapace front cannot be chewed through, and the Swarm
      // punish the time spent finding that out.
      ['shell', 'swarm', 'swarm'],
      ['fang', 'fang', 'swarm'],
    ],
    nestWaves: 2,
  },
  {
    region: 'gorge',
    grazers: 6,
    grazerKinds: ['shell', 'fang'],
    grazersInBranches: 0.5,
    packs: [
      ['shell', 'fang', 'swarm', 'swarm'],
      ['fang', 'fang', 'swarm', 'swarm'],
      ['shell', 'shell', 'swarm', 'swarm'],
    ],
    nestWaves: 2,
  },
  {
    region: 'headwater',
    grazers: 4,
    // Bare and high. The horned grazer belongs on the terraces; the scree
    // branches take the pebble, which the body lookup decides from the branch.
    grazerKinds: ['fang'],
    grazersInBranches: 0.5,
    packs: [
      ['shell', 'shell', 'fang', 'fang'],
      ['fang', 'fang', 'fang', 'swarm'],
      ['shell', 'fang', 'swarm', 'swarm'],
    ],
    nestWaves: 3,
  },
]

/**
 * How far apart two packs must sit.
 *
 * Derived from the notice radius rather than chosen, with room to spare: the
 * player has to be able to stand on top of one pack without a second one
 * having seen them. A margin, because packs have width - the anchor is what
 * gets placed, and its support stands around it.
 */
export const GLOAMWOOD_PACK_SPACING = GLOAMWOOD_AGGRO.noticeRadius * 2.6

export interface GloamwoodValleySpawn {
  id: string
  kind: GloamwoodPreyKind
  role: GloamwoodCreatureRole
  tier: GloamwoodValleySpawnTier
  x: number
  z: number
  /** Distance along the route, for region gating and for the session log. */
  s: number
  region: GloamwoodValleyRegionId
  /** Pack, nest or grazer group this creature belongs to. */
  group: string
  /** Branch it stands in, or null on the main road. */
  branch: string | null
}

/** The size a creature will actually be, so placement can leave room for it. */
function gloamwoodValleyModelledRadius(
  kind: GloamwoodPreyKind,
  role: 'passive' | 'aggressive',
  branch: string | null,
) {
  return gloamwoodModelledPreyFor(kind, role, branch)?.footprintRadius
    ?? GLOAMWOOD_PREY_BODY_RADII[kind]
}

export function planGloamwoodValleySpawns(seed: number, ecologyRunSeed = 'valley-run'): GloamwoodValleySpawn[] {
  const random = seededRandom(seed)
  const ecology = resolveGloamwoodValleyEcology(ecologyRunSeed)
  const spawns: GloamwoodValleySpawn[] = []

  for (const plan of GLOAMWOOD_VALLEY_SPAWN_PLAN) {
    const packs = gloamwoodValleyEcologyPacks(ecology, plan.region, plan.packs)
    const region = GLOAMWOOD_VALLEY.regions.find((entry) => entry.id === plan.region)
    if (!region) continue
    // Kept clear of both gates and of the boss bowl. A pack standing in a choke
    // is a wall, and one standing where the region boss will be turns its
    // arena into a brawl that was never designed.
    const usable = { from: region.from + 40, to: region.to - 40 }
    const blocked = [
      ...GLOAMWOOD_VALLEY.chokes.map((choke) => [choke - 50, choke + 50] as const),
      ...GLOAMWOOD_VALLEY.bossSlots.map((slot) => [slot - 45, slot + 45] as const),
    ]
    const free = (s: number) => !blocked.some(([from, to]) => s >= from && s <= to)

    const slots: number[] = []
    const wanted = packs.length + 1
    const step = (usable.to - usable.from) / wanted
    // Route distance two anchors must keep. The test asserts the world-space
    // version of this; encoding it here is what makes it true rather than
    // hoped for.
    const apart = GLOAMWOOD_PACK_SPACING
    for (let index = 0; index < wanted; index += 1) {
      let s = usable.from + step * (index + 0.5) + (random() - 0.5) * step * 0.4
      // Walk out of a blocked stretch rather than giving up on the slot: the
      // number of packs is a decision, and silently dropping one would change
      // the region's pressure without anything saying so.
      //
      // Clear of the slots already taken, too. Nudging alone walks every
      // blocked slot to the same first free position past the block, which put
      // two gorge packs four tenths of a unit apart - close enough that one
      // fight was six creatures and the region was a pack short.
      // Kept inside the region by a margin, not clamped to its edge. Nudging
      // off the end used to park the slot exactly on `usable.to`, and a pack
      // anchored on the boundary cannot spread along the route at all - every
      // member's route offset clamps back onto the same point and four
      // creatures spawned inside one another.
      const margin = GLOAMWOOD_PACK_SPACING * 0.5
      const low = usable.from + margin
      const high = Math.max(low + 1, usable.to - margin)
      // Wrapping happens inside the candidate, so the spacing check sees where
      // the slot will actually be. Wrapping after the check is how a slot that
      // passed at one end came to rest next to a slot at the other.
      const wrap = (candidate: number) => low + ((candidate - low) % (high - low) + (high - low)) % (high - low)
      const clear = (candidate: number) =>
        free(wrap(candidate)) && slots.every((taken) => Math.abs(taken - wrap(candidate)) >= apart)
      for (let nudge = 0; nudge < 120 && !clear(s); nudge += 1) s += 6
      slots.push(wrap(s))
    }

    // The nest takes the widest slot it can, because it is the one fight that
    // needs an arena rather than a stretch of road.
    const nestSlot = slots.reduce((best, s) => gloamwoodValleyHalfWidth(s) > gloamwoodValleyHalfWidth(best) ? s : best, slots[0])
    const packSlots = slots.filter((s) => s !== nestSlot).slice(0, packs.length)

    for (const [index, members] of packs.entries()) {
      const anchorS = packSlots[index] ?? slots[index]
      const group = `${plan.region}-pack-${index + 1}`
      for (const [memberIndex, kind] of members.entries()) {
        const angle = (memberIndex / members.length) * Math.PI * 2 + index
        // The ring has to clear the bodies standing on it. These were spaced
        // 2.2 when every creature was the family's collision radius; modelled
        // animals carry their own size and a Ford Fang is 1.55 across, so a
        // pack of three was placed 0.93 apart needing 2.97 and spawned inside
        // each other - the separation pass then shoved them off their own
        // ambush spots for the rest of the run.
        //
        // Chord length for `n` bodies on a ring of radius r is 2r·sin(π/n), so
        // the radius that fits them is the reverse of that.
        const body = gloamwoodValleyModelledRadius(kind, 'aggressive', null)
        const anchorBody = gloamwoodValleyModelledRadius(members[0], 'aggressive', null)
        const neighbours = Math.max(2, members.length - 1)
        // Two constraints, and the second was missed first time round. The ring
        // has to clear its own neighbours - chord length for `n` bodies on a
        // ring of radius r is 2r·sin(π/n), so the radius that fits them is the
        // reverse of that. And it has to clear the creature standing at the
        // centre, which the chord formula says nothing about: with member zero
        // on the anchor, a ring that fits its neighbours perfectly still put two
        // Ford Fangs 2.21 apart needing 3.10.
        const clearance = Math.max(
          (body * 2 + 0.4) / (2 * Math.sin(Math.PI / neighbours)),
          anchorBody + body + 0.4,
        )
        const spread = memberIndex === 0 ? 0 : Math.max(2.2, clearance) + random() * 1.2
        // Across the valley the ring is capped to the floor that exists; along
        // it, it is not. A ring wider than the corridor was not made smaller by
        // `placeInside`, it was flattened - every member clamped onto the same
        // edge, which is how a pack of four ended up 0.11 apart. A pack strung
        // out along a gorge is what a pack in a gorge looks like anyway.
        const room = Math.max(1.2, gloamwoodValleyWalkableHalfWidth(anchorS) - body - 0.3)
        const s = anchorS + Math.cos(angle) * spread
        const lateral = gloamwoodValleyRoadOffset(anchorS) + Math.sin(angle) * Math.min(spread, room)
        const point = placeInside(s, lateral)
        spawns.push({
          id: `${group}-${memberIndex}`,
          kind,
          role: 'aggressive',
          tier: 'pack',
          x: point.x, z: point.z, s: point.s,
          region: plan.region,
          group,
          branch: null,
        })
      }
    }

    // The nest's own waves are spawned by the nest at runtime; what is placed
    // here is the marker the player walks into.
    spawns.push({
      id: `${plan.region}-nest`,
      kind: 'shell',
      role: 'aggressive',
      tier: 'nest',
      ...placeInside(nestSlot, gloamwoodValleyRoadOffset(nestSlot)),
      region: plan.region,
      group: `${plan.region}-nest`,
      branch: null,
    })

    const regionBranches = GLOAMWOOD_VALLEY_BRANCHES
      .map((branch, branchIndex) => ({ branch, branchIndex }))
      .filter(({ branch }) => branch.mouthS >= region.from && branch.mouthS <= region.to)

    for (let index = 0; index < plan.grazers; index += 1) {
      const kind = plan.grazerKinds[index % plan.grazerKinds.length]
      // A share of them live down the branches. Without this the scree bodies
      // never appear at all: grazers only ever stood on the road, and the body
      // that reads as a boulder is worth nothing anywhere but among boulders.
      const inBranch = regionBranches.length > 0 && index < Math.round(plan.grazers * plan.grazersInBranches)
      let placed: { x: number; z: number; s: number; branch: string | null } | null = null
      for (let attempt = 0; attempt < 60 && !placed; attempt += 1) {
        if (inBranch) {
          const { branch, branchIndex } = regionBranches[index % regionBranches.length]
          const t = 0.35 + random() * 0.6
          const half = gloamwoodValleyBranchHalfWidth(branch, t)
          // Pushed off the branch's own path, not just onto walkable ground.
          // A grazer standing in a chamber's approach is standing in the fight
          // the player is walking into - the same rule the road already has,
          // and the branches were missing it.
          const side = random() < 0.5 ? -1 : 1
          const point = gloamwoodValleyBranchPointAt(branchIndex, t, side * (2.6 + random() * (half - 2.6)))
          if (!gloamwoodValleyWalkable(point.x, point.z)) continue
          const lane = gloamwoodValleyCorridorAt(point.x, point.z)
          if (lane.pathDistance < lane.pathHalfWidth + 1.6) continue
          if (spawns.some((other) => Math.hypot(other.x - point.x, other.z - point.z) < 4)) continue
          placed = { x: point.x, z: point.z, s: branch.mouthS, branch: branch.id }
          continue
        }
        const s = usable.from + random() * (usable.to - usable.from)
        const side = random() < 0.5 ? -1 : 1
        const road = gloamwoodValleyRoadOffset(s)
        const lateral = road + side * (gloamwoodValleyRoadHalfWidth(s) + 1.5 + random() * 6)
        const point = gloamwoodValleyPointAt(s, lateral)
        if (!gloamwoodValleyWalkable(point.x, point.z)) continue
        if (spawns.some((other) => Math.hypot(other.x - point.x, other.z - point.z) < 4)) continue
        placed = { x: point.x, z: point.z, s, branch: null }
      }
      if (!placed) continue
      spawns.push({
        id: `${plan.region}-grazer-${index + 1}`,
        kind,
        role: 'passive',
        tier: 'grazer',
        x: placed.x, z: placed.z, s: placed.s,
        region: plan.region,
        group: `${plan.region}-grazers`,
        branch: placed.branch,
      })
    }
  }

  // Elites live at the end of branches, and nowhere else. A branch is optional,
  // so what is down it has to be worth the walk; an elite on the main road
  // would just be a tougher pack the player has no choice about.
  for (const branch of GLOAMWOOD_VALLEY_BRANCHES) {
    const region = GLOAMWOOD_VALLEY.regions.find(
      (entry) => branch.mouthS >= entry.from && branch.mouthS <= entry.to,
    )
    if (!region) continue
    const index = GLOAMWOOD_VALLEY_BRANCHES.indexOf(branch)
    const chamber = gloamwoodValleyBranchPointAt(index, branch.kind === 'loop' ? 0.5 : 0.94, 0)
    spawns.push({
      id: `${branch.id}-elite`,
      kind: branch.terrain === 'marsh' || branch.terrain === 'hollow' ? 'fang' : 'shell',
      role: 'aggressive',
      tier: 'elite',
      x: chamber.x, z: chamber.z, s: branch.mouthS,
      region: region.id,
      group: `${branch.id}-elite`,
      branch: branch.id,
    })
  }

  for (const [index, slot] of GLOAMWOOD_VALLEY.bossSlots.entries()) {
    const region = GLOAMWOOD_VALLEY.regions.find((entry) => slot >= entry.from && slot <= entry.to)
    const point = placeInside(slot, gloamwoodValleyRoadOffset(slot))
    spawns.push({
      id: `region-boss-${index + 1}`,
      kind: 'shell',
      role: 'aggressive',
      tier: 'boss',
      ...point,
      region: region?.id ?? 'headwater',
      group: `region-boss-${index + 1}`,
      branch: null,
    })
  }

  return spawns
}

/**
 * Nudge a point onto ground the creature can actually stand on.
 *
 * Every spawn goes through this. A creature placed inside a wall or in the
 * river is one the player cannot reach and the run cannot clear, and the
 * arithmetic that puts it there is separate from the arithmetic that decides
 * where the floor is - which is the boundary this project keeps getting wrong.
 */
function placeInside(s: number, lateral: number) {
  const clampedS = Math.max(0, Math.min(GLOAMWOOD_VALLEY_LENGTH, s))
  const limit = gloamwoodValleyHalfWidth(clampedS) * GLOAMWOOD_VALLEY.walkShare
  let best = Math.max(-limit, Math.min(limit, lateral))
  const point = gloamwoodValleyPointAt(clampedS, best)
  if (gloamwoodValleyWalkable(point.x, point.z)) return { x: point.x, z: point.z, s: clampedS }
  // Search outward from where it wanted to be, toward the road first.
  for (let step = 0.5; step <= limit * 2; step += 0.5) {
    for (const side of [1, -1]) {
      const candidate = Math.max(-limit, Math.min(limit, best + side * step))
      const tried = gloamwoodValleyPointAt(clampedS, candidate)
      if (gloamwoodValleyWalkable(tried.x, tried.z)) return { x: tried.x, z: tried.z, s: clampedS }
    }
  }
  const fallback = gloamwoodValleyPointAt(clampedS, gloamwoodValleyRoadOffset(clampedS))
  return { x: fallback.x, z: fallback.z, s: clampedS }
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
