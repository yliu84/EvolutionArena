import { GLOAMWOOD_PREY, type GloamwoodNestEvent, type GloamwoodPreyKind } from './gloamwood-3d-ecology'
import { GLOAMWOOD_VALLEY_SPAWN_PLAN } from './gloamwood-valley-spawns'
import type { GloamwoodValleyCreature } from './gloamwood-valley-creatures'
import {
  gloamwoodValleyConfine,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyPointAt,
  gloamwoodValleyProject,
  gloamwoodValleyRoadOffset,
} from './gloamwood-valley-terrain'

/**
 * The valley's set-piece fight.
 *
 * Everywhere else on this map the player picks their fights: they see a pack
 * before it sees them and can walk round it. A nest is the one place that
 * choice is taken away - walk in and the den empties itself at you, twice or
 * three times over. That contrast is the whole reason it exists, and it is why
 * the trigger is generous.
 *
 * What it is not, any more, is instant. Waves used to appear 6.4 units from the
 * player, and being told "wave 2 of 2" did not answer the question a playtest
 * actually asked: why do they come out of nowhere instead of being seen
 * crossing the map? They now start beyond the edge of the frame and run in, so
 * the pressure is something the player watches arrive.
 *
 * That does hand back the option of walking away, and it should. They are awake
 * and they chase, so leaving means fighting them somewhere else rather than not
 * fighting them - and a fight you can see coming and choose your ground for is
 * a better fight than one that lands on your head.
 */
export const GLOAMWOOD_VALLEY_NEST = {
  /** How close the player has to come. Wider than the lock, so it is never a surprise. */
  triggerRadius: 13,
  /** Breath between waves. Long enough to reposition, not to leave. */
  intermissionSeconds: 1.6,
  /**
   * How far out a wave comes from.
   *
   * It used to be 6.4 - close enough that the creatures simply existed, next to
   * the player, with no arrival. Told what was happening, a player still asked
   * the right question: why do they come out of nowhere instead of being seen
   * crossing the map? A label on the HUD is not the world making sense.
   *
   * The camera frames about eighteen units either side, so twenty-four is just
   * beyond the edge of the frame. A wave is born off screen and runs in, and
   * what the player sees is creatures entering the picture and closing - which
   * is what every other fight on this map looks like.
   */
  arrivalRadius: 24,
  /**
   * How much of the road's width a wave fans across as it comes.
   *
   * They arrive strung out rather than in single file, which is what lets the
   * player see how many are coming before the first one reaches them.
   */
  arrivalSpread: 0.55,
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
  /**
   * What just happened, so the player can be told.
   *
   * Without these the encounter is invisible. The shallows nest sits four units
   * from the first fork, so a player who stops there to choose a direction
   * fights three creatures, kills them, and watches three more appear 1.6
   * seconds later with nothing said - which reads as the respawn timer being
   * broken, not as a set-piece. It was reported as exactly that.
   */
  events: GloamwoodNestEvent[]
}

/**
 * The line to keep on screen while a nest is running.
 *
 * The events announce it once each, and a combat message is gone the moment the
 * next kill or miss writes over it - so a player at the first fork, where the
 * shallows nest sits four units off the road, cleared a wave and watched
 * another arrive with nothing on screen explaining it. Twice now.
 *
 * A wave count is only useful while the wave is happening.
 */
export function gloamwoodValleyNestStatus(nests: readonly GloamwoodValleyNestState[]) {
  const running = nests.find((nest) => nest.phase === 'wave' || nest.phase === 'intermission')
  if (!running) return null
  return { wave: running.wave, waves: running.waveCount, resting: running.phase === 'intermission' }
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
  const events: GloamwoodNestEvent[] = []

  const next = nests.map((nest) => {
    const state = { ...nest, phaseElapsed: nest.phaseElapsed + delta }
    if (state.phase === 'cleared') return state

    if (state.phase === 'dormant') {
      const distance = Math.hypot(player.x - state.x, player.z - state.z)
      if (distance > GLOAMWOOD_VALLEY_NEST.triggerRadius) return state
      spawned.push(...buildWave(state, 1, player))
      events.push({ type: 'valley-nest-entered', nestId: state.id, waves: state.waveCount })
      events.push({ type: 'valley-nest-wave', nestId: state.id, wave: 1, waves: state.waveCount })
      return { ...state, phase: 'wave' as const, wave: 1, phaseElapsed: 0 }
    }

    if (state.phase === 'intermission') {
      if (state.phaseElapsed < GLOAMWOOD_VALLEY_NEST.intermissionSeconds) return state
      const wave = state.wave + 1
      spawned.push(...buildWave(state, wave, player))
      events.push({ type: 'valley-nest-wave', nestId: state.id, wave, waves: state.waveCount })
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
      events.push({ type: 'valley-nest-cleared', nestId: state.id })
      return { ...state, phase: 'cleared' as const, phaseElapsed: 0 }
    }
    return { ...state, phase: 'intermission' as const, phaseElapsed: 0 }
  })

  return { nests: next, creatures: [...creatures, ...spawned], cleared, events }
}

function buildWave(
  nest: GloamwoodValleyNestState,
  wave: number,
  player: { x: number; z: number },
): GloamwoodValleyCreature[] {
  const kinds = waveComposition(nest.region, wave)
  // Down the road, not across a radial ring.
  //
  // A ring at twenty-four units does not fit: the valley is a corridor, and
  // confine was quietly dragging arrivals back to fourteen - through a wall, or
  // into the river. Placed along the route instead, the distance is real and
  // the ground is walkable by construction, and they come *along the valley*,
  // which is also the only direction that reads as somewhere to come from.
  const here = gloamwoodValleyProject(nest.x, nest.z)
  const standing = gloamwoodValleyProject(player.x, player.z)
  // From beyond the nest, away from whoever walked in. Nothing is born behind
  // the player's shoulder.
  const direction = here.s >= standing.s ? 1 : -1
  const arriveAt = here.s + direction * GLOAMWOOD_VALLEY_NEST.arrivalRadius
  const road = gloamwoodValleyRoadOffset(arriveAt)
  const lane = gloamwoodValleyCorridorAt(
    gloamwoodValleyPointAt(arriveAt, road).x,
    gloamwoodValleyPointAt(arriveAt, road).z,
  ).pathHalfWidth
  return kinds.map((kind, index) => {
    const across = kinds.length > 1
      ? (index / (kinds.length - 1) - 0.5) * GLOAMWOOD_VALLEY_NEST.arrivalSpread * lane * 2
      : 0
    const point = gloamwoodValleyPointAt(arriveAt, road + across)
    const held = gloamwoodValleyConfine(point.x, point.z)
    const angle = Math.atan2(nest.z - held.z, nest.x - held.x)
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
