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
 */
export const GLOAMWOOD_VALLEY_RESPAWN = {
  /** How long after the last of a pack dies before it can return. */
  delaySeconds: 90,
  /** The player must be at least this far away for it to happen. */
  clearOfPlayer: 46,
  /** Corpses linger this long, then are gone. */
  corpseSeconds: 6,
} as const

export interface GloamwoodValleyRespawnState {
  /** Group id to the time remaining before it may return. */
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
  /** Groups brought back this frame, for the session log to record. */
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
): GloamwoodValleyRespawnFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const groups = new Map<string, GloamwoodValleyCreature[]>()
  for (const creature of creatures) {
    const list = groups.get(creature.group) ?? []
    list.push(creature)
    groups.set(creature.group, list)
  }

  const pending = { ...state.pending }
  const returned: string[] = []
  const revive = new Set<string>()

  for (const [group, members] of groups) {
    if (!gloamwoodValleyRespawns(members[0])) continue
    if (members.some((member) => member.phase !== 'dead')) {
      delete pending[group]
      continue
    }
    const remaining = pending[group] ?? GLOAMWOOD_VALLEY_RESPAWN.delaySeconds
    const next = remaining - delta
    // Distance is measured from where the pack lives, not from where it died -
    // a pack that died chasing the player half a region away belongs to the
    // ground it was placed on.
    const away = Math.hypot(members[0].homeX - player.x, members[0].homeZ - player.z)
    if (next <= 0 && away >= GLOAMWOOD_VALLEY_RESPAWN.clearOfPlayer) {
      revive.add(group)
      returned.push(group)
      delete pending[group]
    } else {
      pending[group] = Math.max(0, next)
    }
  }

  const next = creatures.map((creature) => {
    if (creature.phase !== 'dead') {
      return creature.corpseSeconds === undefined ? creature : { ...creature, corpseSeconds: undefined }
    }
    if (revive.has(creature.group)) {
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
