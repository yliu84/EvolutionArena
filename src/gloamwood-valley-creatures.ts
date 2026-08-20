import {
  GLOAMWOOD_COMBAT_SPACING,
  GLOAMWOOD_PREY,
  gloamwoodPreyBodyRadius,
  stepPrey,
  type GloamwoodNestEvent,
  type GloamwoodNestPrey,
  type GloamwoodPlayerPresence,
} from './gloamwood-3d-ecology'
import {
  updateGloamwoodAggro,
  type GloamwoodAggroCreature,
  type GloamwoodAggroEvent,
} from './gloamwood-creature-aggro'
import type { EliteAffixId } from './elite-affixes'
import { createGloamwoodElite, gloamwoodEliteAffixDeal, gloamwoodEliteMaxHealth } from './gloamwood-elite'
import {
  gloamwoodValleyBossSpecFor,
  stepGloamwoodValleyBoss,
  type GloamwoodValleyBossFields,
} from './gloamwood-valley-boss'
import {
  planGloamwoodValleySpawns,
  type GloamwoodValleySpawn,
  type GloamwoodValleySpawnTier,
} from './gloamwood-valley-spawns'
import { gloamwoodValleyBodyFor } from './gloamwood-modelled-prey'
import {
  gloamwoodValleyConfine,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyHeight,
  gloamwoodValleyWalkable,
} from './gloamwood-valley-terrain'

/**
 * The valley's creatures, as one authority.
 *
 * Everything here is assembled from parts that already exist and are already
 * tested: the spawn plan decides who and where, the aggro layer decides who has
 * noticed, `stepPrey` decides what a creature that has noticed does, and the
 * damage gate stays in the ecology. This module only holds them together and
 * adds the one thing neither had - a creature that has *not* noticed, which is
 * new because the Gloamwood has no such creature.
 *
 * The nest runs waves in a fixed arena; the valley scatters packs across 1590
 * units of route. What a creature does once it is coming for you is the same
 * question in both, and answering it twice is how the two drift apart.
 */

// `tier` is omitted and re-declared: the ecology types it loosely, because it
// has no business knowing a map's tier names, and here it narrows to this map's.
export interface GloamwoodValleyCreature
  extends Omit<GloamwoodNestPrey, 'tier'>, GloamwoodAggroCreature, GloamwoodValleyBossFields {
  tier: GloamwoodValleySpawnTier
  group: string
  branch: string | null
  region: string
  /** Where along the route it was placed. Decides which boss a boss is. */
  spawnS: number
  /** Where it was placed. It grazes around here and comes back to it. */
  homeX: number
  homeZ: number
  /** Where it is ambling to, and how long it stands before choosing again. */
  wanderX: number
  wanderZ: number
  wanderPauseSeconds: number
  /** Advanced every time a target is chosen, so a run replays identically. */
  wanderSeed: number
  /** How long this one has been dead. Undefined while it is alive. */
  corpseSeconds?: number
}

/**
 * How a grazer passes the time.
 *
 * It moves, because a map of statues reads as a diorama. It does not roam,
 * because a creature that is not where it was last seen cannot be walked past
 * on purpose - and the placement work that put the pebble among real boulders
 * would be undone by the first frame.
 *
 * So: a short leash around where it was placed, a slow amble, and long pauses.
 * The pauses matter as much as the movement. Something that ambles constantly
 * reads as agitated, which is the opposite of what a grazer is for.
 */
export const GLOAMWOOD_VALLEY_WANDER = {
  radius: 2.6,
  /** Share of its family's speed. A grazer strolls; it does not commute. */
  speed: 0.32,
  minPauseSeconds: 2.5,
  maxPauseSeconds: 7,
} as const

export function createGloamwoodValleyCreatures(seed: number, runSeed = 'valley-run'): GloamwoodValleyCreature[] {
  const spawns = planGloamwoodValleySpawns(seed)
  // Dealt across the whole set, not rolled one at a time. Rolled, the six
  // elites came out as three affixes doubled with two of the five never
  // appearing - and the tier exists so that the optional fight at the end of a
  // branch is a different fight each time.
  const affixes = gloamwoodEliteAffixDeal(
    runSeed,
    spawns.filter((spawn) => spawn.tier === 'elite').map((spawn) => spawn.id),
  )
  // Spawns are placed by group, then grazers and bosses are appended. A local
  // group check cannot see a grazer that happened to share a bank with a pack,
  // so resolve the complete field before the first frame. Home positions move
  // with the body or an unwoken creature would walk back into the overlap.
  return separate(spawns.map((spawn, index) => fromSpawn(spawn, index, runSeed, affixes[spawn.id])), true)
}

function fromSpawn(
  spawn: GloamwoodValleySpawn,
  index: number,
  runSeed: string,
  affix?: EliteAffixId,
): GloamwoodValleyCreature {
  const spec = GLOAMWOOD_PREY[spawn.kind]
  // Elites are tougher and carry an affix; everything else is its family.
  const elite = spawn.tier === 'elite'
    ? createGloamwoodElite(runSeed, spawn.id, gloamwoodEliteMaxHealth(spec.maxHealth), affix)
    : undefined
  // A boss brings its own health. Reading the family's left three region bosses
  // standing behind ninety-two hit points - the same as the beetle beside them,
  // and less than the elite down the branch.
  const boss = gloamwoodValleyBossSpecFor(spawn)
  const maxHealth = boss ? boss.maxHealth
    : spawn.tier === 'elite' ? gloamwoodEliteMaxHealth(spec.maxHealth) : spec.maxHealth
  // The body it wears decides how big it is, so what blocks the player is the
  // creature they can see. Falls back to the family radius for anything with no
  // model yet.
  const body = gloamwoodValleyBodyFor({
    kind: spawn.kind, role: spawn.role, branch: spawn.branch, tier: spawn.tier, s: spawn.s,
  })
  return {
    id: spawn.id,
    kind: spawn.kind,
    role: spawn.role,
    tier: spawn.tier,
    group: spawn.group,
    branch: spawn.branch,
    region: spawn.region,
    phase: 'chase',
    phaseElapsed: 0,
    health: maxHealth,
    maxHealth,
    x: spawn.x,
    z: spawn.z,
    spawnS: spawn.s,
    homeX: spawn.x,
    homeZ: spawn.z,
    wanderX: spawn.x,
    wanderZ: spawn.z,
    // Staggered from the index so a bank of grazers does not step off together.
    wanderPauseSeconds: (index % 7) * 0.9,
    wanderSeed: (index + 1) * 0x9e3779b1,
    bodyRadius: body?.footprintRadius,
    facingRadians: index * 2.399,
    bossPhase: boss ? 1 : undefined,
    bossTurn: boss ? 0 : undefined,
    attackResolved: false,
    slot: index % 6,
    awake: false,
    outOfReachSeconds: 0,
    elite,
  }
}

export interface GloamwoodValleyCreatureFrame {
  creatures: GloamwoodValleyCreature[]
  events: GloamwoodNestEvent[]
  aggro: GloamwoodAggroEvent[]
}

export function stepGloamwoodValleyCreatures(
  creatures: readonly GloamwoodValleyCreature[],
  deltaSeconds: number,
  player: GloamwoodPlayerPresence,
  input: { struck?: readonly string[]; lured?: readonly string[]; allowNotice?: boolean } = {},
): GloamwoodValleyCreatureFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const aggro = updateGloamwoodAggro(
    creatures.map((creature) => ({ ...creature, dead: creature.phase === 'dead' })),
    {
      playerX: player.x, playerZ: player.z, delta,
      struck: input.struck, lured: input.lured, allowNotice: input.allowNotice,
    },
  )
  const awakeById = new Map(aggro.creatures.map((entry) => [entry.id, entry]))
  const events: GloamwoodNestEvent[] = []

  const next = creatures.map((creature) => {
    const state = awakeById.get(creature.id)
    const woken = { ...creature, awake: state?.awake ?? false, outOfReachSeconds: state?.outOfReachSeconds ?? 0 }
    if (woken.phase === 'dead') return woken
    if (!woken.awake) return settle(woken, delta)
    // A boss is stepped by its own authority. Everything else - the aggro that
    // woke it, the confine below, the damage gate, the corpse clock - is shared
    // with every other creature, so a boss is a creature that fights
    // differently rather than a second kind of thing.
    const bossSpec = gloamwoodValleyBossSpecFor(woken)
    const frame = bossSpec
      ? stepGloamwoodValleyBoss(woken, bossSpec, delta, player)
      : stepPrey(woken, delta, player)
    events.push(...frame.events)
    const stepped = { ...woken, ...frame.state }
    // Confined here rather than by the caller. A creature pushed into the river
    // or through a wall by its own chase is one the player cannot reach, and the
    // arithmetic that moves it is separate from the arithmetic that says where
    // the floor is - which is the boundary this project keeps getting wrong.
    const held = gloamwoodValleyConfine(stepped.x, stepped.z)
    stepped.x = held.x
    stepped.z = held.z
    return stepped
  })

  // `stepPrey` widens `tier` back to the ecology's loose string on the way
  // through, so it is narrowed here rather than at every call site.
  return { creatures: separate(next as GloamwoodValleyCreature[]), events, aggro: aggro.events }
}

/**
 * An unwoken creature grazes where it was put.
 *
 * Aggressive creatures are deliberately excluded: a pack that drifts leaves the
 * spot it was placed to ambush from, and the spacing that keeps one pack from
 * waking the next is measured from where they stand.
 */
function settle(creature: GloamwoodValleyCreature, delta: number): GloamwoodValleyCreature {
  const next = {
    ...creature,
    phase: 'chase' as const,
    phaseElapsed: creature.phaseElapsed + delta,
    attackResolved: false,
  }
  if (creature.role !== 'passive') return holdStill(next, delta)

  if (next.wanderPauseSeconds > 0) {
    next.wanderPauseSeconds = Math.max(0, next.wanderPauseSeconds - delta)
    return next
  }

  const dx = next.wanderX - next.x
  const dz = next.wanderZ - next.z
  const distance = Math.hypot(dx, dz)
  if (distance < 0.12) {
    const chosen = chooseWanderTarget(next)
    next.wanderX = chosen.x
    next.wanderZ = chosen.z
    next.wanderSeed = chosen.seed
    next.wanderPauseSeconds = chosen.pause
    return next
  }

  const speed = GLOAMWOOD_PREY[creature.kind].moveSpeed * GLOAMWOOD_VALLEY_WANDER.speed
  const step = Math.min(distance, speed * delta)
  const held = gloamwoodValleyConfine(next.x + (dx / distance) * step, next.z + (dz / distance) * step)
  next.x = held.x
  next.z = held.z
  next.facingRadians = Math.atan2(-dz, dx)
  return next
}

/** Walks back to where it was placed, without grazing on the way. */
function holdStill(creature: GloamwoodValleyCreature, delta: number): GloamwoodValleyCreature {
  const dx = creature.homeX - creature.x
  const dz = creature.homeZ - creature.z
  const distance = Math.hypot(dx, dz)
  if (distance < 0.05) return creature
  const speed = GLOAMWOOD_PREY[creature.kind].moveSpeed * 0.45
  const step = Math.min(distance, speed * delta)
  const held = gloamwoodValleyConfine(creature.x + (dx / distance) * step, creature.z + (dz / distance) * step)
  return { ...creature, x: held.x, z: held.z, facingRadians: Math.atan2(-dz, dx) }
}

/**
 * Somewhere near home worth ambling to.
 *
 * Seeded from the creature rather than from `Math.random`, because a run has to
 * replay identically against the map it happened on - a recorded session is
 * worth nothing if the grazers stood somewhere else the second time.
 *
 * Rejects the road. Grazers are placed off it on purpose, and one that wanders
 * into the path is standing in the fight the player is walking into.
 */
function chooseWanderTarget(creature: GloamwoodValleyCreature) {
  let seed = creature.wanderSeed
  const random = () => {
    seed = (Math.imul(seed ^ (seed >>> 15), 0x2c1b3c6d) + 0x9e3779b1) >>> 0
    return (seed >>> 8) / 0x1000000
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const angle = random() * Math.PI * 2
    const reach = GLOAMWOOD_VALLEY_WANDER.radius * Math.sqrt(random())
    const x = creature.homeX + Math.cos(angle) * reach
    const z = creature.homeZ + Math.sin(angle) * reach
    if (!gloamwoodValleyWalkable(x, z)) continue
    const corridor = gloamwoodValleyCorridorAt(x, z)
    if (corridor.pathDistance < corridor.pathHalfWidth + gloamwoodPreyBodyRadius(creature)) continue
    return {
      x, z, seed,
      pause: GLOAMWOOD_VALLEY_WANDER.minPauseSeconds
        + random() * (GLOAMWOOD_VALLEY_WANDER.maxPauseSeconds - GLOAMWOOD_VALLEY_WANDER.minPauseSeconds),
    }
  }
  // Nowhere to go: stand where it is and try again later rather than teleport.
  return { x: creature.x, z: creature.z, seed, pause: GLOAMWOOD_VALLEY_WANDER.minPauseSeconds }
}

/** Keeps living creatures out of each other, so a pack does not stack up. */
function separate(creatures: GloamwoodValleyCreature[], settleHomes = false): GloamwoodValleyCreature[] {
  const next = creatures.map((creature) => ({ ...creature }))
  // Several pairs can share the same narrow clearing. Three passes made the
  // first pair look fixed while the last pair still began almost inside each
  // other, then the player saw a collision solve as soon as the map loaded.
  for (let pass = 0; pass < 10; pass += 1) {
    for (let a = 0; a < next.length; a += 1) {
      if (next[a].phase === 'dead') continue
      for (let b = a + 1; b < next.length; b += 1) {
        if (next[b].phase === 'dead') continue
        // A visible gap is part of combat space, not a cosmetic luxury: without
        // it a creature can be physically separate yet still erase the wind-up
        // and strike room of the creature beside it.
        const minimum = gloamwoodPreyBodyRadius(next[a])
          + gloamwoodPreyBodyRadius(next[b])
          + GLOAMWOOD_COMBAT_SPACING.pairGap
        const dx = next[b].x - next[a].x
        const dz = next[b].z - next[a].z
        const distance = Math.hypot(dx, dz)
        if (distance >= minimum) continue
        // Deterministic fallback for the rare exact overlap. Skipping it left
        // two bodies permanently stacked because their normal has no direction.
        const angle = distance < 0.0001 ? ((a * 0.61803398875 + b * 0.38196601125) % 1) * Math.PI * 2 : 0
        const push = (minimum - distance) / 2
        const nx = distance < 0.0001 ? Math.cos(angle) : dx / distance
        const nz = distance < 0.0001 ? Math.sin(angle) : dz / distance
        const left = gloamwoodValleyConfine(next[a].x - nx * push, next[a].z - nz * push)
        const right = gloamwoodValleyConfine(next[b].x + nx * push, next[b].z + nz * push)
        next[a].x = left.x
        next[a].z = left.z
        next[b].x = right.x
        next[b].z = right.z
      }
    }
  }
  if (settleHomes) {
    for (const creature of next) {
      creature.homeX = creature.x
      creature.homeZ = creature.z
      creature.wanderX = creature.x
      creature.wanderZ = creature.z
    }
  }
  return next
}

/** Ground height under a creature, so presentation never guesses it. */
export function gloamwoodValleyCreatureHeight(creature: Pick<GloamwoodValleyCreature, 'x' | 'z'>) {
  return gloamwoodValleyHeight(creature.x, creature.z)
}

/** Creatures currently coming for the player. */
export function gloamwoodValleyAwake(creatures: readonly GloamwoodValleyCreature[]) {
  return creatures.filter((creature) => creature.awake && creature.phase !== 'dead')
}
