import { GLOAMWOOD_PREY, type GloamwoodPreyKind } from './gloamwood-3d-ecology'

/**
 * What a kill leaves behind, and what eating it is worth.
 *
 * The valley had no way to recover health between fights. Whatever the road
 * cost, the boss fight started with - a playtest arrived at the first gate on a
 * third of a bar and could not have won it at any difficulty. Lives replaced the
 * whole run; nothing replaced a wound.
 *
 * So a kill drops meat where it fell and walking over it eats it. That is the
 * whole interaction: no button, no inventory, no second verb. This game has one
 * attack chain on one key and is deliberately keeping it that way.
 *
 * Not a random drop. The complaint being answered is that the run is too hard,
 * and randomness makes the bad case worse - the fight you barely survived is
 * exactly the one that would have rolled nothing. Every kill feeds you; how much
 * depends on what you killed.
 */
export const GLOAMWOOD_MEAT = {
  /**
   * Share of a creature's biomass returned as health.
   *
   * Tied to biomass because that is already the measure of what a creature is
   * worth eating, and inventing a second table would let the two disagree about
   * which animal is the bigger meal.
   *
   * At 0.7 the shallows road - three packs, nine creatures - is worth about
   * fifty health if it is all fought, which is roughly what fighting it costs.
   * Clear the road and arrive whole; walk past it and arrive hurt but early.
   * That is the decision this is for.
   */
  healShare: 0.7,
  /** Nothing is worth less than this, or the swarm's drop reads as a bug. */
  minimumHeal: 2,
  /**
   * How long it lasts.
   *
   * Long enough to finish the fight it fell in and eat afterwards, short enough
   * that it cannot be stockpiled or walked back to. A larder the player returns
   * to would fight the shape of the map: the valley is a road.
   */
  lifetimeSeconds: 12,
  /** Faded over the last stretch of its life, so vanishing is never a surprise. */
  fadeSeconds: 3,
  /** Eaten by standing on it, measured to the player's body rather than a point. */
  reach: 1.15,
  /**
   * How far the meal falls toward the player rather than onto the corpse.
   *
   * A creature dies at its *attack* distance, which is by construction further
   * from the player than they can reach - measured in engine, three kills left
   * three meals lying on the ground and the player starved next to them,
   * 55 health down to 31 with two pieces in sight.
   *
   * So it spills toward whoever made the kill. It is still a place on the
   * ground rather than a pickup that flies at you: back away and you leave it,
   * hold the spot and it feeds you.
   */
  spillTowardPlayer: 0.45,
} as const

/**
 * Where the meal lands.
 *
 * Between the corpse and whoever killed it, because the corpse alone is out of
 * reach of the person standing where the fight was.
 */
export function gloamwoodMeatDropPosition(
  corpse: { x: number; z: number },
  killer: { x: number; z: number },
) {
  return {
    x: corpse.x + (killer.x - corpse.x) * GLOAMWOOD_MEAT.spillTowardPlayer,
    z: corpse.z + (killer.z - corpse.z) * GLOAMWOOD_MEAT.spillTowardPlayer,
  }
}

export function gloamwoodMeatHeal(kind: GloamwoodPreyKind) {
  return Math.max(
    GLOAMWOOD_MEAT.minimumHeal,
    Math.round(GLOAMWOOD_PREY[kind].biomass * GLOAMWOOD_MEAT.healShare),
  )
}

export interface GloamwoodMeatDrop {
  id: string
  kind: GloamwoodPreyKind
  x: number
  z: number
  heal: number
  age: number
}

export function createGloamwoodMeatDrop(id: string, kind: GloamwoodPreyKind, x: number, z: number): GloamwoodMeatDrop {
  return { id, kind, x, z, heal: gloamwoodMeatHeal(kind), age: 0 }
}

/** How faded a drop is drawn, 1 fresh to 0 gone. */
export function gloamwoodMeatOpacity(drop: Pick<GloamwoodMeatDrop, 'age'>) {
  const left = GLOAMWOOD_MEAT.lifetimeSeconds - drop.age
  if (left <= 0) return 0
  return Math.max(0, Math.min(1, left / GLOAMWOOD_MEAT.fadeSeconds))
}

export interface GloamwoodMeatFrame {
  drops: GloamwoodMeatDrop[]
  /** Health to give the player this frame, already summed. */
  healed: number
  /** What was eaten, for the sound and the floating number. */
  eaten: GloamwoodMeatDrop[]
}

/**
 * Ages every drop, and eats the ones the player is standing on.
 *
 * A player already at full health does not eat: the drop is left where it is so
 * it is still there after the next exchange, which is when it is worth
 * something. Spending it on nothing is the difference between a mechanic that
 * rewards fighting well and one that just deletes itself.
 */
export function stepGloamwoodMeat(
  drops: readonly GloamwoodMeatDrop[],
  deltaSeconds: number,
  player: { x: number; z: number; health: number; maxHealth: number; bodyRadius: number },
): GloamwoodMeatFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const hungry = player.health < player.maxHealth
  const eaten: GloamwoodMeatDrop[] = []
  const kept: GloamwoodMeatDrop[] = []
  let healed = 0
  for (const drop of drops) {
    const aged = { ...drop, age: drop.age + delta }
    if (aged.age >= GLOAMWOOD_MEAT.lifetimeSeconds) continue
    const distance = Math.hypot(aged.x - player.x, aged.z - player.z)
    if (hungry && distance <= player.bodyRadius + GLOAMWOOD_MEAT.reach) {
      eaten.push(aged)
      healed += aged.heal
      continue
    }
    kept.push(aged)
  }
  return { drops: kept, healed, eaten }
}
