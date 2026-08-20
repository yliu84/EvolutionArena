import { hashSeed } from './evolution'
import {
  ELITE_AFFIX_IDS,
  absorbEliteShield,
  eliteAffixFor,
  eliteCooldownMultiplier,
  eliteDamageMultiplier,
  eliteSpeedMultiplier,
  initialEliteShield,
  shouldTriggerBrood,
  siphonHealth,
  toxicBurstHits,
  type EliteAffixId,
} from './elite-affixes'

/**
 * Elites in the 3D body.
 *
 * The affix rules themselves already exist and are tested - they were written
 * for the frozen 2D prototype and none of that logic needs redoing. What cannot
 * be reused is its numbers: `TOXIC_BURST_RADIUS` is 132 because that stack
 * measures in screen pixels, and this one measures in world units, where a
 * region boss's ground slam covers 4.3 and the player is 0.72 across. Dropped
 * in unchanged it would be a burst covering the whole valley.
 *
 * So the pure decisions are imported and the spatial and temporal constants are
 * declared here in world units and seconds. That boundary - a tested module
 * reused across a change of units - is the same shape as every other defect
 * this project has shipped, which is why it gets its own module and its own
 * tests rather than a conversion at each call site.
 */

export const GLOAMWOOD_ELITE = {
  /**
   * Health over the base creature.
   *
   * A Fang at 46 becomes 101, which at the player's chain damage is a fight of
   * about twenty seconds rather than eight - long enough for an affix to
   * actually happen, which is the entire reason the tier exists.
   */
  healthMultiplier: 2.2,
  /**
   * Toxic burst, in world units. Between the boss slam's 4.3 and a prey attack
   * range of 2.6: an elite's parting shot should be worth stepping away from
   * and should not out-reach the region boss.
   */
  burstRadius: 3.6,
  burstDamage: 14,
  /** Long enough to walk out of, at the player's 6.2 units per second. */
  burstTelegraphSeconds: 0.72,
  broodCount: 2,
  /** Splits are a real threat, not a lap of honour. */
  broodHealthShare: 0.35,
} as const

export interface GloamwoodEliteState {
  affix: EliteAffixId
  shield: number
  broodTriggered: boolean
}

export interface GloamwoodEliteBurst {
  x: number
  z: number
  radius: number
  damage: number
  telegraphSeconds: number
}

export function createGloamwoodElite(
  runSeed: string,
  encounterId: string,
  maxHealth: number,
  /** Dealt by the caller when it knows the whole set. See gloamwoodEliteAffixDeal. */
  chosen?: EliteAffixId,
): GloamwoodEliteState {
  const affix = chosen ?? eliteAffixFor(runSeed, encounterId)
  return { affix, shield: initialEliteShield(affix, maxHealth), broodTriggered: false }
}

/**
 * One affix per elite, dealt rather than rolled.
 *
 * Rolling each elite independently is what a single encounter would do, and
 * across a set it does the wrong thing: the valley's six elites came out as
 * volatile, volatile, barrier, berserker, berserker, barrier - three affixes
 * doubled, with brood and siphon never appearing at all. Two of the five were
 * dead content, and the tier exists precisely so that the optional fight at the
 * end of a branch is a different fight each time.
 *
 * So they are dealt from a shuffled deck, reshuffled each time it runs out.
 * Every affix appears before any appears twice, and the order is still seeded,
 * so a recorded run replays against the elites it happened to.
 */
export function gloamwoodEliteAffixDeal(
  runSeed: string,
  encounterIds: readonly string[],
): Record<string, EliteAffixId> {
  const deal: Record<string, EliteAffixId> = {}
  let deck: EliteAffixId[] = []
  encounterIds.forEach((id, index) => {
    if (deck.length === 0) {
      deck = [...ELITE_AFFIX_IDS]
      // Seeded from the pass rather than the elite, so the whole deal is a
      // function of the run seed and nothing else.
      for (let slot = deck.length - 1; slot > 0; slot -= 1) {
        const swap = hashSeed(`${runSeed}:elite-deal:${index}:${slot}`) % (slot + 1)
        const held = deck[slot]
        deck[slot] = deck[swap]
        deck[swap] = held
      }
    }
    deal[id] = deck.pop()!
  })
  return deal
}

export function gloamwoodEliteMaxHealth(baseMaxHealth: number) {
  return Math.round(baseMaxHealth * GLOAMWOOD_ELITE.healthMultiplier)
}

/**
 * Runs incoming damage through the elite's barrier.
 *
 * Takes damage that has already been through the family multipliers and gives
 * back what actually reaches the creature. It is a step inside the one damage
 * gate, never a second one: nothing here decides how hard the player hits.
 */
export function gloamwoodEliteAbsorb(elite: GloamwoodEliteState | undefined, damage: number) {
  if (!elite || elite.shield <= 0) return { elite, damage, absorbed: 0 }
  const result = absorbEliteShield(damage, elite.shield)
  return {
    elite: { ...elite, shield: result.remainingShield },
    // Never below one. A barrier that reduces a hit to nothing reads as the
    // attack having missed, and the player stops attacking.
    damage: Math.max(result.absorbed > 0 && result.remainingDamage <= 0 ? 0 : 1, result.remainingDamage),
    absorbed: result.absorbed,
  }
}

/** Whether this hit is the one that splits a brood elite. */
export function gloamwoodEliteSplits(
  elite: GloamwoodEliteState | undefined,
  previousHealth: number,
  nextHealth: number,
  maxHealth: number,
) {
  if (!elite) return false
  return shouldTriggerBrood(elite.affix, previousHealth, nextHealth, maxHealth, elite.broodTriggered)
}

/**
 * Where a brood elite's splits stand when it breaks.
 *
 * Placed on a ring around the parent rather than on top of it: two creatures
 * born inside each other spend their first seconds being shoved apart by the
 * separation pass instead of coming for the player, which reads as a bug.
 *
 * The ring is measured from the bodies that have to fit on it, so it widens
 * with the family rather than being a constant that works for the swarm and
 * overlaps for the shell.
 */
export function gloamwoodEliteBroodPositions(x: number, z: number, bodyRadius: number, facingRadians = 0) {
  const ring = Math.max(0.6, bodyRadius * 2.1)
  return Array.from({ length: GLOAMWOOD_ELITE.broodCount }, (_, index) => {
    // Spread across the parent's back, so the player is not immediately
    // surrounded by something they have not seen yet.
    const angle = facingRadians + Math.PI + (index - (GLOAMWOOD_ELITE.broodCount - 1) / 2) * 0.9
    return { x: x + Math.cos(angle) * ring, z: z - Math.sin(angle) * ring, facingRadians }
  })
}

/** Health each split is born with. */
export function gloamwoodEliteBroodHealth(parentMaxHealth: number) {
  return Math.max(1, Math.round(parentMaxHealth * GLOAMWOOD_ELITE.broodHealthShare))
}

/** The burst a volatile elite leaves behind, or null for every other affix. */
export function gloamwoodEliteDeathBurst(
  elite: GloamwoodEliteState | undefined,
  x: number,
  z: number,
): GloamwoodEliteBurst | null {
  if (elite?.affix !== 'volatile') return null
  return {
    x,
    z,
    radius: GLOAMWOOD_ELITE.burstRadius,
    damage: GLOAMWOOD_ELITE.burstDamage,
    telegraphSeconds: GLOAMWOOD_ELITE.burstTelegraphSeconds,
  }
}

export function gloamwoodEliteBurstHits(burst: GloamwoodEliteBurst, x: number, z: number) {
  // The radius is passed rather than defaulted, which is what keeps the shared
  // helper unit-free.
  return toxicBurstHits(Math.hypot(x - burst.x, z - burst.z), burst.radius)
}

/** Health an elite recovers from landing a hit. */
export function gloamwoodEliteSiphon(
  elite: GloamwoodEliteState | undefined,
  health: number,
  maxHealth: number,
  damageDealt: number,
) {
  if (!elite) return health
  return siphonHealth(elite.affix, health, maxHealth, damageDealt)
}

export function gloamwoodEliteSpeed(elite: GloamwoodEliteState | undefined, health: number, maxHealth: number) {
  return elite ? eliteSpeedMultiplier(elite.affix, health, maxHealth) : 1
}

export function gloamwoodEliteCooldown(elite: GloamwoodEliteState | undefined, health: number, maxHealth: number) {
  return elite ? eliteCooldownMultiplier(elite.affix, health, maxHealth) : 1
}

export function gloamwoodEliteDamage(elite: GloamwoodEliteState | undefined, health: number, maxHealth: number) {
  return elite ? eliteDamageMultiplier(elite.affix, health, maxHealth) : 1
}
