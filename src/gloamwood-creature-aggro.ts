/**
 * Who has noticed the player, and who has not.
 *
 * Every creature in the valley is either passive or aggressive, and that is a
 * property of the creature, not of its family: the same armoured beetle grazes
 * on the bank and guards a nest mouth. Three families and two roles gives the
 * map its variety without a single new model.
 *
 * This is the only writer of `awake`. Aggro decided in two places is aggro that
 * disagrees with itself, and the shape of that defect - two systems each
 * internally reasonable with a boundary nobody checked - has already cost this
 * project four separate bugs.
 *
 * It also settles a promise made when the mutation layer was designed: a lure
 * that can drag an aggressive pack onto the player is not a tool, it is a trap.
 * Here a lure can only ever pull something that was not going to attack anyway,
 * and that rule lives in the authority rather than in the caller.
 */

export type GloamwoodCreatureRole = 'passive' | 'aggressive'

export const GLOAMWOOD_AGGRO = {
  /**
   * How far an aggressive creature notices the player.
   *
   * Under what the camera frames - roughly eighteen units either side - on
   * purpose. The player sees the pack before the pack sees the player, so
   * every fight on the road is one they chose to start.
   */
  noticeRadius: 11,
  /** How far a struck creature's cry carries to others of its kind. */
  wakeRadius: 4,
  /** Beyond this an awake creature starts losing interest. */
  leashRadius: 26,
  /** ...and gives up after holding that distance for this long. */
  leashSeconds: 3.5,
} as const

export interface GloamwoodAggroCreature {
  id: string
  role: GloamwoodCreatureRole
  x: number
  z: number
  awake: boolean
  /** Seconds spent outside the leash while awake. Reset on re-acquiring. */
  outOfReachSeconds: number
  /** Dead creatures are skipped rather than removed, so ids stay stable. */
  dead?: boolean
}

export interface GloamwoodAggroInput {
  playerX: number
  playerZ: number
  delta: number
  /** Creatures the player struck this frame. */
  struck?: readonly string[]
  /** Creatures a lure is pulling. Only passive ones can be pulled. */
  lured?: readonly string[]
  /**
   * Keeps an opening area calm without disabling the rest of creature life.
   * A struck creature still wakes immediately: this is a short reading and
   * orientation grace period, never a way to attack safely.
   */
  allowNotice?: boolean
}

export type GloamwoodWakeCause = 'noticed' | 'struck' | 'alarm' | 'lured'

export type GloamwoodAggroEvent =
  | { type: 'woke'; id: string; cause: GloamwoodWakeCause }
  | { type: 'slept'; id: string }
  | { type: 'lure-refused'; id: string }

export interface GloamwoodAggroResult {
  creatures: GloamwoodAggroCreature[]
  events: GloamwoodAggroEvent[]
}

export function updateGloamwoodAggro(
  creatures: readonly GloamwoodAggroCreature[],
  input: GloamwoodAggroInput,
): GloamwoodAggroResult {
  const events: GloamwoodAggroEvent[] = []
  const struck = new Set(input.struck ?? [])
  const lured = new Set(input.lured ?? [])
  const next = creatures.map((creature) => ({ ...creature }))
  const byId = new Map(next.map((creature) => [creature.id, creature]))

  const wake = (creature: GloamwoodAggroCreature, cause: GloamwoodWakeCause) => {
    creature.outOfReachSeconds = 0
    if (creature.awake) return
    creature.awake = true
    events.push({ type: 'woke', id: creature.id, cause })
  }

  for (const creature of next) {
    if (creature.dead) continue
    const distance = Math.hypot(creature.x - input.playerX, creature.z - input.playerZ)

    if (struck.has(creature.id)) {
      wake(creature, 'struck')
      continue
    }
    if (lured.has(creature.id)) {
      // Refused rather than silently ignored, so a lure that would have been a
      // trap is visible to the caller instead of quietly doing nothing.
      if (creature.role === 'aggressive') events.push({ type: 'lure-refused', id: creature.id })
      else wake(creature, 'lured')
      continue
    }
    if (input.allowNotice !== false && creature.role === 'aggressive' && distance <= GLOAMWOOD_AGGRO.noticeRadius) {
      wake(creature, 'noticed')
      continue
    }
    if (!creature.awake) continue

    if (distance > GLOAMWOOD_AGGRO.leashRadius) {
      creature.outOfReachSeconds += input.delta
      if (creature.outOfReachSeconds >= GLOAMWOOD_AGGRO.leashSeconds) {
        creature.awake = false
        creature.outOfReachSeconds = 0
        events.push({ type: 'slept', id: creature.id })
      }
    } else {
      creature.outOfReachSeconds = 0
    }
  }

  // The alarm spreads one hop, from the creatures actually struck. Letting it
  // chain would mean one hit on the edge of a clearing wakes everything in it,
  // and then everything next to that - which is the whole region arriving at
  // once, and no reason ever to pick a fight.
  for (const id of struck) {
    const source = byId.get(id)
    if (!source || source.dead) continue
    for (const creature of next) {
      if (creature.dead || creature.id === source.id || creature.awake) continue
      if (Math.hypot(creature.x - source.x, creature.z - source.z) <= GLOAMWOOD_AGGRO.wakeRadius) {
        wake(creature, 'alarm')
      }
    }
  }

  return { creatures: next, events }
}

/** Creatures currently coming for the player. */
export function gloamwoodAwakeCreatures(creatures: readonly GloamwoodAggroCreature[]) {
  return creatures.filter((creature) => creature.awake && !creature.dead)
}
