import type { GloamwoodValleyCreature } from './gloamwood-valley-creatures'

/**
 * When a cleared creature comes back, and when it does not.
 *
 * Respawning is a real cost to the run's shape, so it is deliberately narrow.
 * Everything that comes back is a road pack; nothing else does. Clearing a
 * branch, an elite, a nest or a boss has to stay cleared, or the valley becomes
 * a place to farm rather than a place to get through - and the mutation pacing,
 * which thins out on purpose towards the headwater, would be undone by an
 * unlimited supply of biomass.
 *
 * Nothing returns while the player is close enough to watch. A creature that
 * appears in view has no explanation; one that is simply there when you come
 * back the other way does.
 *
 * And nothing returns in the region the player is still working through. That
 * is the difference between a road that stays alive behind you and a treadmill:
 * a playtest died at the first gate, respawned at the region entrance, walked
 * back through everything it had already killed, arrived with no health, and
 * died again. Ninety seconds is shorter than the walk, so the run could not
 * make progress at all.
 *
 * The purpose survives intact - the route folds and carries two loop branches,
 * so doubling back a region later still finds a living road. What it no longer
 * does is undo the run in front of the player.
 */
export const GLOAMWOOD_VALLEY_RESPAWN = {
  /** How long after a creature dies before it can return. */
  delaySeconds: 90,
  /** The player must be at least this far away for it to happen. */
  clearOfPlayer: 46,
  /** Corpses linger this long, then are gone. */
  corpseSeconds: 6,
} as const

export interface GloamwoodValleyRespawnState {
  /** Creature id to the time remaining before it may return. */
  pending: Record<string, number>
}

export function createGloamwoodValleyRespawnState(): GloamwoodValleyRespawnState {
  return { pending: {} }
}

/** Only road packs come back. */
export function gloamwoodValleyRespawns(creature: Pick<GloamwoodValleyCreature, 'tier'>) {
  return creature.tier === 'pack'
}

export interface GloamwoodValleyRespawnFrame {
  state: GloamwoodValleyRespawnState
  creatures: GloamwoodValleyCreature[]
  /** Creatures brought back this frame, for the session log to record. */
  returned: string[]
}

/**
 * Ages corpses, counts down cleared packs, and brings back the ones that are due.
 */
export function stepGloamwoodValleyRespawn(
  state: GloamwoodValleyRespawnState,
  creatures: readonly GloamwoodValleyCreature[],
  deltaSeconds: number,
  player: { x: number; z: number },
  /** Where the player is now. Nothing in it comes back while they are in it. */
  playerRegion: string | null = null,
): GloamwoodValleyRespawnFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const pending = { ...state.pending }
  const returned: string[] = []
  const revive = new Set<string>()

  // Each corpse keeps its own clock, started where it fell.
  //
  // It used to be one clock per pack, and it only began once every member of
  // that pack was dead - which meant a pack the player broke but did not finish
  // never came back at all. Kill two of three, walk on, and those two are gone
  // for the rest of the run: the road quietly decays into lone survivors and
  // holes, and the mixed packs the layout was built around stop existing.
  //
  // Reinforcements arriving mid-fight are ruled out by the distance below
  // rather than by waiting for the pack to be wiped. Nothing returns within
  // forty-six units of the player, and the player cannot be fighting something
  // that far away.
  for (const creature of creatures) {
    if (!gloamwoodValleyRespawns(creature)) continue
    if (creature.phase !== 'dead') {
      delete pending[creature.id]
      continue
    }
    // Held, not counted down. The clock resumes the moment the player moves on,
    // so leaving a region and coming back still finds it repopulating.
    if (playerRegion !== null && creature.region === playerRegion) {
      pending[creature.id] = pending[creature.id] ?? GLOAMWOOD_VALLEY_RESPAWN.delaySeconds
      continue
    }
    const next = (pending[creature.id] ?? GLOAMWOOD_VALLEY_RESPAWN.delaySeconds) - delta
    // Distance is measured from where it lives, not from where it died - a
    // creature that died chasing the player half a region away belongs to the
    // ground it was placed on.
    const away = Math.hypot(creature.homeX - player.x, creature.homeZ - player.z)
    if (next <= 0 && away >= GLOAMWOOD_VALLEY_RESPAWN.clearOfPlayer) {
      revive.add(creature.id)
      returned.push(creature.id)
      delete pending[creature.id]
    } else {
      pending[creature.id] = Math.max(0, next)
    }
  }

  const next = creatures.map((creature) => {
    if (creature.phase !== 'dead') {
      return creature.corpseSeconds === undefined ? creature : { ...creature, corpseSeconds: undefined }
    }
    if (revive.has(creature.id)) {
      return {
        ...creature,
        health: creature.maxHealth,
        phase: 'chase' as const,
        phaseElapsed: 0,
        attackResolved: false,
        awake: false,
        outOfReachSeconds: 0,
        x: creature.homeX,
        z: creature.homeZ,
        wanderX: creature.homeX,
        wanderZ: creature.homeZ,
        corpseSeconds: undefined,
      }
    }
    return { ...creature, corpseSeconds: (creature.corpseSeconds ?? 0) + delta }
  })

  return { state: { pending }, creatures: next, returned }
}

/** True once a corpse has lain long enough to be cleared from the scene. */
export function gloamwoodValleyCorpseGone(creature: Pick<GloamwoodValleyCreature, 'phase' | 'corpseSeconds'>) {
  return creature.phase === 'dead' && (creature.corpseSeconds ?? 0) >= GLOAMWOOD_VALLEY_RESPAWN.corpseSeconds
}
