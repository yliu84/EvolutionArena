import { GLOAMWOOD_PREY, type GloamwoodPreyKind } from './gloamwood-3d-ecology'
import { GLOAMWOOD_VALLEY_SPAWN_PLAN } from './gloamwood-valley-spawns'
import type { GloamwoodValleyCreature } from './gloamwood-valley-creatures'
import { gloamwoodValleyConfine } from './gloamwood-valley-terrain'

/**
 * The valley's set-piece fight.
 *
 * Everywhere else on this map the player picks their fights: they see a pack
 * before it sees them and can walk round it. A nest is the one place that
 * choice is taken away - walk in and the ground you are standing on is the
 * fight, twice or three times over. That contrast is the whole reason it
 * exists, and it is why the trigger is generous and the waves come without a
 * pause long enough to leave.
 */
export const GLOAMWOOD_VALLEY_NEST = {
  /** How close the player has to come. Wider than the lock, so it is never a surprise. */
  triggerRadius: 13,
  /** Breath between waves. Long enough to reposition, not to leave. */
  intermissionSeconds: 1.6,
  /** Ring the wave stands on when it arrives. */
  spawnRadius: 6.4,
} as const

export type GloamwoodValleyNestPhase = 'dormant' | 'wave' | 'intermission' | 'cleared'

export interface GloamwoodValleyNestState {
  id: string
  region: string
  x: number
  z: number
  phase: GloamwoodValleyNestPhase
  wave: number
  waveCount: number
  phaseElapsed: number
}

/** Waves per region. The headwater's nest is the long one, as its tier says. */
function waveCountFor(region: string) {
  return region === 'headwater' ? 3 : 2
}

/**
 * What a wave is made of.
 *
 * Drawn from the region's own pack table rather than a second list, so a nest
 * fight is the region's creatures at the region's mix - what makes it hard is
 * that there are two or three of them back to back with nowhere to walk.
 */
function waveComposition(region: string, wave: number): GloamwoodPreyKind[] {
  const plan = GLOAMWOOD_VALLEY_SPAWN_PLAN.find((entry) => entry.region === region)
  const packs = plan?.packs ?? []
  if (packs.length === 0) return ['fang', 'swarm']
  return [...packs[(wave - 1) % packs.length]]
}

export function createGloamwoodValleyNests(
  markers: readonly Pick<GloamwoodValleyCreature, 'id' | 'region' | 'homeX' | 'homeZ' | 'tier'>[],
): GloamwoodValleyNestState[] {
  return markers
    .filter((marker) => marker.tier === 'nest')
    .map((marker) => ({
      id: marker.id,
      region: marker.region,
      x: marker.homeX,
      z: marker.homeZ,
      phase: 'dormant' as const,
      wave: 0,
      waveCount: waveCountFor(marker.region),
      phaseElapsed: 0,
    }))
}

export interface GloamwoodValleyNestFrame {
  nests: GloamwoodValleyNestState[]
  creatures: GloamwoodValleyCreature[]
  /** Nest ids cleared this frame. */
  cleared: string[]
}

export function stepGloamwoodValleyNests(
  nests: readonly GloamwoodValleyNestState[],
  creatures: readonly GloamwoodValleyCreature[],
  deltaSeconds: number,
  player: { x: number; z: number },
): GloamwoodValleyNestFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const spawned: GloamwoodValleyCreature[] = []
  const cleared: string[] = []

  const next = nests.map((nest) => {
    const state = { ...nest, phaseElapsed: nest.phaseElapsed + delta }
    if (state.phase === 'cleared') return state

    if (state.phase === 'dormant') {
      const distance = Math.hypot(player.x - state.x, player.z - state.z)
      if (distance > GLOAMWOOD_VALLEY_NEST.triggerRadius) return state
      spawned.push(...buildWave(state, 1))
      return { ...state, phase: 'wave' as const, wave: 1, phaseElapsed: 0 }
    }

    if (state.phase === 'intermission') {
      if (state.phaseElapsed < GLOAMWOOD_VALLEY_NEST.intermissionSeconds) return state
      const wave = state.wave + 1
      spawned.push(...buildWave(state, wave))
      return { ...state, phase: 'wave' as const, wave, phaseElapsed: 0 }
    }

    // A wave is over when nothing it spawned is still standing - and the
    // marker counts.
    //
    // It did not, on the reasoning that it is the thing the player walked into
    // rather than part of the fight. That was wrong in the way that matters:
    // the marker is a real creature that fights back, so excluding it meant
    // waves arrived on top of a beetle the player was still working through.
    // "The first beetle isn't even dead and another one shows up." It is part
    // of the fight because it is fighting.
    const alive = creatures.some(
      (creature) => (creature.group === `${state.id}-wave` || creature.id === state.id)
        && creature.phase !== 'dead',
    )
    if (alive) return state
    if (state.wave >= state.waveCount) {
      cleared.push(state.id)
      return { ...state, phase: 'cleared' as const, phaseElapsed: 0 }
    }
    return { ...state, phase: 'intermission' as const, phaseElapsed: 0 }
  })

  return { nests: next, creatures: [...creatures, ...spawned], cleared }
}

function buildWave(nest: GloamwoodValleyNestState, wave: number): GloamwoodValleyCreature[] {
  const kinds = waveComposition(nest.region, wave)
  return kinds.map((kind, index) => {
    const angle = (index / Math.max(1, kinds.length)) * Math.PI * 2 + wave * 0.6
    const held = gloamwoodValleyConfine(
      nest.x + Math.cos(angle) * GLOAMWOOD_VALLEY_NEST.spawnRadius,
      nest.z + Math.sin(angle) * GLOAMWOOD_VALLEY_NEST.spawnRadius,
    )
    const spec = GLOAMWOOD_PREY[kind]
    return {
      id: `${nest.id}-w${wave}-${index}`,
      kind,
      role: 'aggressive',
      // Not 'pack'. Only road packs respawn, and a wave tagged as one put the
      // whole nest - every wave of it, together - back on a ninety second
      // clock the moment the player walked away from a fight they had won.
      tier: 'nest',
      group: `${nest.id}-wave`,
      branch: null,
      region: nest.region,
      phase: 'chase',
      phaseElapsed: 0,
      health: spec.maxHealth,
      maxHealth: spec.maxHealth,
      x: held.x,
      z: held.z,
      spawnS: 0,
      homeX: held.x,
      homeZ: held.z,
      wanderX: held.x,
      wanderZ: held.z,
      wanderPauseSeconds: 0,
      wanderSeed: (wave * 31 + index + 1) * 0x9e3779b1,
      facingRadians: angle + Math.PI,
      attackResolved: false,
      slot: index,
      // Awake on arrival. A wave that has to notice the player first would give
      // them a free opening the encounter is not meant to have.
      awake: true,
      outOfReachSeconds: 0,
    }
  })
}
