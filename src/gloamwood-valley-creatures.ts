import {
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
import { createGloamwoodElite, gloamwoodEliteMaxHealth } from './gloamwood-elite'
import {
  planGloamwoodValleySpawns,
  type GloamwoodValleySpawn,
  type GloamwoodValleySpawnTier,
} from './gloamwood-valley-spawns'
import { gloamwoodModelledPreyFor } from './gloamwood-modelled-prey'
import { gloamwoodValleyConfine, gloamwoodValleyHeight } from './gloamwood-valley-terrain'

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

export interface GloamwoodValleyCreature extends GloamwoodNestPrey, GloamwoodAggroCreature {
  tier: GloamwoodValleySpawnTier
  group: string
  branch: string | null
  region: string
  /** Where it was placed. Asleep, it returns here rather than drifting. */
  homeX: number
  homeZ: number
}

export function createGloamwoodValleyCreatures(seed: number, runSeed = 'valley-run'): GloamwoodValleyCreature[] {
  return planGloamwoodValleySpawns(seed).map((spawn, index) => fromSpawn(spawn, index, runSeed))
}

function fromSpawn(spawn: GloamwoodValleySpawn, index: number, runSeed: string): GloamwoodValleyCreature {
  const spec = GLOAMWOOD_PREY[spawn.kind]
  // Elites are tougher and carry an affix; everything else is its family.
  const elite = spawn.tier === 'elite' ? createGloamwoodElite(runSeed, spawn.id, gloamwoodEliteMaxHealth(spec.maxHealth)) : undefined
  const maxHealth = spawn.tier === 'elite' ? gloamwoodEliteMaxHealth(spec.maxHealth) : spec.maxHealth
  // The body it wears decides how big it is, so what blocks the player is the
  // creature they can see. Falls back to the family radius for anything with no
  // model yet.
  const body = gloamwoodModelledPreyFor(spawn.kind, spawn.role, spawn.branch)
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
    homeX: spawn.x,
    homeZ: spawn.z,
    bodyRadius: body?.footprintRadius,
    facingRadians: index * 2.399,
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
  input: { struck?: readonly string[]; lured?: readonly string[] } = {},
): GloamwoodValleyCreatureFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const aggro = updateGloamwoodAggro(
    creatures.map((creature) => ({ ...creature, dead: creature.phase === 'dead' })),
    { playerX: player.x, playerZ: player.z, delta, struck: input.struck, lured: input.lured },
  )
  const awakeById = new Map(aggro.creatures.map((entry) => [entry.id, entry]))
  const events: GloamwoodNestEvent[] = []

  const next = creatures.map((creature) => {
    const state = awakeById.get(creature.id)
    const woken = { ...creature, awake: state?.awake ?? false, outOfReachSeconds: state?.outOfReachSeconds ?? 0 }
    if (woken.phase === 'dead') return woken
    if (!woken.awake) return settle(woken, delta)
    const frame = stepPrey(woken, delta, player)
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

  return { creatures: separate(next), events, aggro: aggro.events }
}

/**
 * An unwoken creature drifts home and faces where it was put.
 *
 * Not a patrol. A grazer that wanders is a grazer the player cannot decide to
 * walk past, because it will not be where they last looked - and the placement
 * work that put it among the right rocks would be undone by the first frame.
 */
function settle(creature: GloamwoodValleyCreature, delta: number): GloamwoodValleyCreature {
  const dx = creature.homeX - creature.x
  const dz = creature.homeZ - creature.z
  const distance = Math.hypot(dx, dz)
  if (distance < 0.05) {
    return { ...creature, phase: 'chase', phaseElapsed: creature.phaseElapsed + delta, attackResolved: false }
  }
  const speed = GLOAMWOOD_PREY[creature.kind].moveSpeed * 0.45
  const step = Math.min(distance, speed * delta)
  const held = gloamwoodValleyConfine(creature.x + (dx / distance) * step, creature.z + (dz / distance) * step)
  return {
    ...creature,
    x: held.x,
    z: held.z,
    phase: 'chase',
    phaseElapsed: creature.phaseElapsed + delta,
    facingRadians: Math.atan2(-dz, dx),
    attackResolved: false,
  }
}

/** Keeps living creatures out of each other, so a pack does not stack up. */
function separate(creatures: GloamwoodValleyCreature[]): GloamwoodValleyCreature[] {
  const next = creatures.map((creature) => ({ ...creature }))
  for (let pass = 0; pass < 3; pass += 1) {
    for (let a = 0; a < next.length; a += 1) {
      if (next[a].phase === 'dead') continue
      for (let b = a + 1; b < next.length; b += 1) {
        if (next[b].phase === 'dead') continue
        const minimum = gloamwoodPreyBodyRadius(next[a]) + gloamwoodPreyBodyRadius(next[b])
        const dx = next[b].x - next[a].x
        const dz = next[b].z - next[a].z
        const distance = Math.hypot(dx, dz)
        if (distance >= minimum || distance < 0.0001) continue
        const push = (minimum - distance) / 2
        const nx = dx / distance
        const nz = dz / distance
        const left = gloamwoodValleyConfine(next[a].x - nx * push, next[a].z - nz * push)
        const right = gloamwoodValleyConfine(next[b].x + nx * push, next[b].z + nz * push)
        next[a].x = left.x
        next[a].z = left.z
        next[b].x = right.x
        next[b].z = right.z
      }
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
