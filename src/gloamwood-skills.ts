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
  /** A patch of ground at a distance, which slows and hurts what stands in it. */
  | { kind: 'zone'; castRange: number; radius: number; seconds: number; damagePerSecond: number; slow: number }

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
const BLOOM_RADIUS = defineGloamwoodTunable({
  id: 'swarm-bloom.radius', group: 'Skills', label: 'Spore bloom radius',
  value: 3.6, min: 1, max: 8, step: 0.1,
})
const BLOOM_DPS = defineGloamwoodTunable({
  id: 'swarm-bloom.damagePerSecond', group: 'Skills', label: 'Spore bloom damage/s',
  value: 9, min: 1, max: 30, step: 0.5,
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
        kind: 'zone',
        castRange: 11,
        radius: BLOOM_RADIUS.value,
        seconds: 4,
        damagePerSecond: BLOOM_DPS.value,
        slow: 0.45,
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
  const reach = shape.kind === 'dash' ? shape.range : shape.kind === 'zone' ? shape.castRange : Infinity
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
