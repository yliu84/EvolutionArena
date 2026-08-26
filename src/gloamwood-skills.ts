import type { GloamwoodPoisonSpec } from './gloamwood-poison'
import { defineGloamwoodTunable } from './gloamwood-tuning'

/**
 * One skill per evolution line, and the first thing the player has ever been
 * able to *choose to do* beyond walking and swinging.
 *
 * Every form in this game shipped with `skillsEnabled: false`. The flag has sat
 * there unused since it was written, and the practical result is that a run has
 * exactly one verb - close the distance and hit the thing - whatever body the
 * player is wearing. Forms differ in numbers and in silhouette and in nothing
 * the hands can feel.
 *
 * Bound to the family rather than unlocked freely, for two reasons. Mutations
 * are already the free-form layer - family-tagged, gene-weighted, rule-changing
 * - and a second unlockable layer beside them would blur both. And the ranged
 * attackers this game does not have yet are coming, at which point "walk up and
 * hit it" stops being an answer; the three lines then need three *different*
 * answers to the same problem, which is the thing that makes a form worth
 * choosing rather than a skin.
 *
 * So each line gets a different verb against distance:
 *
 *   fang   CLOSE   - delete the gap, and be standing there in a thin hide
 *   shell  ENDURE  - do not close faster, close anyway, through the shots
 *   swarm  DENY    - never close at all; make the ground where they stand hostile
 *
 * This module decides nothing about damage. It answers "may this fire, and what
 * shape does it ask for", and the runtime resolves it through the same combat
 * authority a basic attack goes through.
 */

export type GloamwoodSkillFamily = 'fang' | 'shell' | 'swarm'
export type GloamwoodSkillId = 'fang-pounce' | 'shell-bulwark' | 'swarm-bloom'

/** What the runtime has to do with a fired skill. */
export type GloamwoodSkillShape =
  /** Travel to the locked target and land a blow on arrival. */
  | { kind: 'dash'; range: number; damage: number; knockback: number }
  /**
   * No target; a window during which incoming damage is cut - and, on the
   * frame it opens, a shove that clears the ground around the caster.
   *
   * The shove is not decoration. A guard with no outward effect fires
   * correctly, cuts the damage it says it cuts, and still reads to the player
   * as an input the game ignored: nothing on screen moves, nothing takes a
   * hit, and the only evidence is a number going down more slowly than it
   * would have. Shoving the ring of things that were crowding you is the same
   * fantasy - brace, and come through - said out loud.
   */
  | {
    kind: 'guard'
    seconds: number
    reduction: number
    speedMultiplier: number
    shoveRadius: number
    shoveKnockback: number
  }
  /**
   * Something spat from the mouth, which flies, strikes a body, and leaves a
   * poison on it.
   *
   * This replaced a patch of burning ground, and the replacement was asked for
   * in exactly those terms: is this even a skill? The zone was a correct
   * simulation of area denial and it read as nothing happening. Damage came off
   * whatever stood in it at a fraction of a point per frame, so no number ever
   * appeared; the effect was on the floor, so nothing about the creature
   * changed; and the cast produced no motion from the animal at all.
   *
   * Every part of this shape is one of those failures answered. The orb is the
   * cast made visible. The impact is the moment of contact, on the body. The
   * poison is the payload, and it is specified in whole instalments on a slow
   * beat because that is what turns damage into something a player can read.
   * The splash is the only thing kept from the zone: the Swarm line's answer to
   * distance is still attrition across a crowd, not a single big hit.
   */
  | {
    kind: 'projectile'
    castRange: number
    /** World units a second. Slow enough to watch cross the gap. */
    speed: number
    /** Landed on contact, so the strike itself is worth something. */
    impactDamage: number
    /** Bodies this close to the struck one are poisoned too. */
    splashRadius: number
    poison: GloamwoodPoisonSpec
  }

export interface GloamwoodSkill {
  id: GloamwoodSkillId
  family: GloamwoodSkillFamily
  cooldownSeconds: number
  /**
   * Whether firing needs something locked.
   *
   * The guard does not, and that is deliberate: a form whose answer to being
   * shot at requires a target it cannot reach would have no answer at all.
   */
  needsTarget: boolean
  shape: GloamwoodSkillShape
}

const POUNCE_RANGE = defineGloamwoodTunable({
  id: 'fang-pounce.range', group: 'Skills', label: 'Pounce range',
  value: 9, min: 3, max: 18, step: 0.5,
  note: 'Has to out-reach a ranged attacker, or the fang line has no answer to one.',
})
const POUNCE_DAMAGE = defineGloamwoodTunable({
  id: 'fang-pounce.damage', group: 'Skills', label: 'Pounce damage',
  value: 26, min: 5, max: 60, step: 1,
})
const BULWARK_SECONDS = defineGloamwoodTunable({
  id: 'shell-bulwark.seconds', group: 'Skills', label: 'Bulwark window',
  value: 3.2, min: 1, max: 8, step: 0.1,
  note: 'Long enough to cross open ground under fire; that crossing is the whole skill.',
})
const BULWARK_REDUCTION = defineGloamwoodTunable({
  id: 'shell-bulwark.reduction', group: 'Skills', label: 'Bulwark reduction',
  value: 0.65, min: 0, max: 0.95, step: 0.05,
})
const BULWARK_SHOVE = defineGloamwoodTunable({
  id: 'shell-bulwark.shoveRadius', group: 'Skills', label: 'Bulwark shove radius',
  value: 3.4, min: 0, max: 8, step: 0.1,
  note: 'What the button visibly does. Without it the guard reads as a dropped input.',
})
const BLOOM_SPLASH = defineGloamwoodTunable({
  id: 'swarm-bloom.splashRadius', group: 'Skills', label: 'Spore bloom splash',
  value: 2.6, min: 0, max: 6, step: 0.1,
  note: 'The one thing kept from the ground zone this replaced. Attrition across a crowd is the Swarm line\'s identity; a single-target spit would be the Fang line with extra steps.',
})
const BLOOM_IMPACT = defineGloamwoodTunable({
  id: 'swarm-bloom.impactDamage', group: 'Skills', label: 'Spore bloom impact',
  value: 12, min: 0, max: 40, step: 1,
})
const BLOOM_TICK_DAMAGE = defineGloamwoodTunable({
  id: 'swarm-bloom.poisonPerTick', group: 'Skills', label: 'Spore poison per tick',
  value: 10, min: 1, max: 30, step: 1,
  note: 'Whole health on a slow beat, because a number the player can read is the point. Sized against a combo: swarm stage 1 is 11+9+9+21 = 50 on one target with no cooldown, so 12 + six tens has to be worth a nine-second wait and a cast from eleven metres.',
})

export const GLOAMWOOD_SKILLS: Record<GloamwoodSkillFamily, GloamwoodSkill> = {
  fang: {
    id: 'fang-pounce',
    family: 'fang',
    cooldownSeconds: 7,
    needsTarget: true,
    get shape(): GloamwoodSkillShape {
      return { kind: 'dash', range: POUNCE_RANGE.value, damage: POUNCE_DAMAGE.value, knockback: 0.9 }
    },
  },
  shell: {
    id: 'shell-bulwark',
    family: 'shell',
    cooldownSeconds: 11,
    needsTarget: false,
    get shape(): GloamwoodSkillShape {
      return {
        kind: 'guard',
        seconds: BULWARK_SECONDS.value,
        reduction: BULWARK_REDUCTION.value,
        // Faster than this form normally moves, but nowhere near a dash. The
        // shell fantasy is arriving anyway, not arriving first.
        speedMultiplier: 1.15,
        shoveRadius: BULWARK_SHOVE.value,
        shoveKnockback: 1.35,
      }
    },
  },
  swarm: {
    id: 'swarm-bloom',
    family: 'swarm',
    cooldownSeconds: 9,
    needsTarget: true,
    get shape(): GloamwoodSkillShape {
      return {
        kind: 'projectile',
        castRange: 11,
        speed: 15,
        impactDamage: BLOOM_IMPACT.value,
        splashRadius: BLOOM_SPLASH.value,
        // Six instalments over 3.6 seconds. The beat is slow on purpose: at a
        // quarter of this the numbers overlap into a smear and stop being
        // countable, which is the whole thing the poison is here to be.
        poison: { tickSeconds: 0.6, damagePerTick: BLOOM_TICK_DAMAGE.value, ticks: 6 },
      }
    },
  },
}

export function gloamwoodSkillFor(family: string | null | undefined): GloamwoodSkill | null {
  if (family === 'fang' || family === 'shell' || family === 'swarm') return GLOAMWOOD_SKILLS[family]
  // The origin form has no line yet, so it has no skill. Deliberately null
  // rather than a default: handing everyone the fang's pounce until they
  // evolve would make the first evolution feel like a downgrade for two of
  // the three lines.
  return null
}

export interface GloamwoodSkillState {
  /** Seconds until it can fire again. Zero means ready. */
  cooldownRemaining: number
  /** Seconds left on the shell's guard window; zero when not guarding. */
  guardRemaining: number
}

export function createGloamwoodSkillState(): GloamwoodSkillState {
  return { cooldownRemaining: 0, guardRemaining: 0 }
}

export function stepGloamwoodSkillState(
  state: GloamwoodSkillState,
  delta: number,
): GloamwoodSkillState {
  if (state.cooldownRemaining <= 0 && state.guardRemaining <= 0) return state
  return {
    cooldownRemaining: Math.max(0, state.cooldownRemaining - delta),
    guardRemaining: Math.max(0, state.guardRemaining - delta),
  }
}

export type GloamwoodSkillRefusal = 'no-skill' | 'cooling' | 'no-target' | 'out-of-range' | 'dead'

export interface GloamwoodSkillAttempt {
  fired: boolean
  refusal: GloamwoodSkillRefusal | null
  skill: GloamwoodSkill | null
  state: GloamwoodSkillState
}

/**
 * May this fire, and what does it become.
 *
 * Pure, and the runtime is expected to do exactly what it says: refusals are
 * reasons a player is told, not silent no-ops. A skill that quietly does
 * nothing when it is on cooldown reads as an input that was dropped.
 */
export function tryGloamwoodSkill(input: {
  family: string | null | undefined
  state: GloamwoodSkillState
  alive: boolean
  hasTarget: boolean
  targetDistance: number
}): GloamwoodSkillAttempt {
  const skill = gloamwoodSkillFor(input.family)
  const refuse = (refusal: GloamwoodSkillRefusal): GloamwoodSkillAttempt =>
    ({ fired: false, refusal, skill, state: input.state })
  if (!skill) return refuse('no-skill')
  if (!input.alive) return refuse('dead')
  if (input.state.cooldownRemaining > 0) return refuse('cooling')
  if (skill.needsTarget && !input.hasTarget) return refuse('no-target')
  const shape = skill.shape
  const reach = shape.kind === 'dash' ? shape.range : shape.kind === 'projectile' ? shape.castRange : Infinity
  if (skill.needsTarget && input.targetDistance > reach) return refuse('out-of-range')
  return {
    fired: true,
    refusal: null,
    skill,
    state: {
      cooldownRemaining: skill.cooldownSeconds,
      guardRemaining: shape.kind === 'guard' ? shape.seconds : input.state.guardRemaining,
    },
  }
}

/** Where a dash should stop: at the target's surface, not inside it. */
export function gloamwoodDashLanding(
  from: { x: number; z: number },
  to: { x: number; z: number },
  targetRadius: number,
  bodyRadius: number,
) {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const distance = Math.hypot(dx, dz)
  // Standing inside the thing you pounced on is how a body ends up pushed
  // through it by the separation pass on the next frame.
  const stop = Math.max(0, distance - targetRadius - bodyRadius * 0.85)
  if (distance < 1e-4) return { x: from.x, z: from.z }
  return { x: from.x + (dx / distance) * stop, z: from.z + (dz / distance) * stop }
}

/**
 * The phases of a leap, as fractions of its own window.
 *
 * Mirrors the values the character motion already drives the stage-1 pounce
 * with. They live here as well so the *travel* can be tested without a
 * browser - the first version of this dash used a duration picked out of the
 * air, 0.26s against a 0.9s window, and the whole move finished while the
 * animal was still crouching. What played was a crouching body sliding across
 * the ground, and no amount of looking at numbers like "clip = Pounce" caught
 * it; only asking what phase it was in did.
 */
export const GLOAMWOOD_DASH_PHASES = {
  crouchEnd: 0.22,
  contact: 0.478,
  landing: 0.68,
} as const

/**
 * How far along its travel a dash is, at a given point in its window.
 *
 * Zero until the crouch ends and one from the landing frame on, so the body is
 * planted while it gathers and planted again once it arrives. Movement only
 * happens across the part of the leap the animal is committed to and airborne
 * for; moving during either of the other two is what reads as a slide.
 */
export function gloamwoodDashTravel(progress: number) {
  const span = GLOAMWOOD_DASH_PHASES.landing - GLOAMWOOD_DASH_PHASES.crouchEnd
  const t = Math.min(1, Math.max(0, (progress - GLOAMWOOD_DASH_PHASES.crouchEnd) / span))
  // Smoothstep: leaves the ground quickly and settles into the landing rather
  // than arriving at a constant rate.
  return t * t * (3 - 2 * t)
}

/**
 * How much of the turn toward the pounced-at target is complete, at a point in
 * the leap's window.
 *
 * Finished by the end of the crouch, which is the one part of the leap the
 * animal spends planted - so it turns while it gathers, and every frame it is
 * airborne it is airborne head-first.
 *
 * Without this the dash set the facing *value* on the frame it fired and
 * nothing ever wrote that value to the body: the yaw is only pushed to the
 * model by the movement pass and by the basic attack, and a skill dash is
 * neither. Pouncing on something behind you played the whole leap backwards,
 * exactly as it was reported.
 */
export function gloamwoodDashTurn(progress: number) {
  const t = Math.min(1, Math.max(0, progress / GLOAMWOOD_DASH_PHASES.crouchEnd))
  return t * t * (3 - 2 * t)
}

/** A thing a skill can be aimed at, whichever authority owns its health. */
export interface GloamwoodSkillTarget {
  id: string
  x: number
  z: number
  /** Body radius, so a dash stops at the surface and a splash measures to it. */
  radius: number
  /** Whether damage has to go through the boss authority rather than the prey one. */
  boss: boolean
}

/**
 * What a skill is aimed at.
 *
 * Pure, and separated out because of the shape of the bug it replaces. The
 * runtime read `bossActive() && bossLocked ? null : nearestPrey()` - the boss
 * branch handed back *nothing*, because the boss does not live in
 * `nestState.prey` and skills only knew about prey. Both targeted skills
 * therefore refused to fire in a boss fight, with "no target", which is the one
 * fight a player would most want them in: two of the three lines had no verb at
 * the moment the run is decided.
 *
 * It is one line of logic and it is here rather than inline so that the
 * behaviour can be asserted without a WebGL context, since the whole failure
 * was invisible everywhere except in a boss fight.
 */
export function gloamwoodSkillTargetChoice(input: {
  bossActive: boolean
  bossLocked: boolean
  boss: Omit<GloamwoodSkillTarget, 'boss'> | null
  prey: Omit<GloamwoodSkillTarget, 'boss'> | null
}): GloamwoodSkillTarget | null {
  if (input.bossActive && input.bossLocked && input.boss) return { ...input.boss, boss: true }
  if (input.prey) return { ...input.prey, boss: false }
  // A boss that is present but not locked is still a legal target when there is
  // nothing else on the field - otherwise clicking away from it disarms the
  // skill until the player remembers to re-lock.
  if (input.bossActive && input.boss) return { ...input.boss, boss: true }
  return null
}
