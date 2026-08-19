import {
  canFormalHuntBasicAttackContact,
  createFormalHuntBasicAttackState,
  formalHuntAttackAimErrorDegrees,
  formalHuntTargetSurfaceDistance,
  requestFormalHuntBasicAttack,
  turnFormalHuntAttackToward,
  updateFormalHuntBasicAttack,
  type FormalHuntBasicAttackState,
} from './formal-hunt-basic-attack'
import { damageGloamwoodPreyList, gloamwoodPreyBodyRadius } from './gloamwood-3d-ecology'
import {
  GLOAMWOOD_VALLEY_LIFE_CAP,
  type GloamwoodValleyProgression,
} from './gloamwood-valley-progression'
import type { GloamwoodValleyCreature } from './gloamwood-valley-creatures'

/**
 * The player's side of a valley fight.
 *
 * Everything decided here is decided once. The attack chain is the same module
 * the hunt drives, the damage gate is the ecology's - now split so a flat list
 * of creatures goes through the same arithmetic a nest does - and the life
 * budget belongs to the progression layer. What is new is only what the valley
 * has and the Gloamwood does not: a target chosen from sixty-three creatures
 * spread over the map rather than from one wave standing in an arena.
 */

export const GLOAMWOOD_VALLEY_PLAYER = {
  maxHealth: 100,
  /** Reach, measured to the target's surface rather than its origin. */
  attackRange: 2.35,
  attackDamage: 14,
  knockback: 1.15,
  /**
   * How far a target may be and still be picked up.
   *
   * Shorter than the aggro notice radius on purpose: the player should not be
   * able to lock something that has not seen them, or the first move of every
   * fight is a free hit from outside the creature's world.
   */
  acquireRange: 9,
} as const

export interface GloamwoodValleyCombatState {
  health: number
  attack: FormalHuntBasicAttackState
  lockedId: string | null
  facingRadians: number
  /** Seconds of invulnerability left after being hit. */
  mercySeconds: number
}

export function createGloamwoodValleyCombat(): GloamwoodValleyCombatState {
  return {
    health: GLOAMWOOD_VALLEY_PLAYER.maxHealth,
    attack: createFormalHuntBasicAttackState(),
    lockedId: null,
    facingRadians: 0,
    mercySeconds: 0,
  }
}

/**
 * Nearest creature worth swinging at.
 *
 * Awake creatures first, whatever the distance, then anything else in reach.
 * Without that ordering the player fighting a pack keeps locking the grazer
 * standing behind it, which is both useless and how a fight becomes a mystery.
 */
export function gloamwoodValleyAcquire(
  creatures: readonly GloamwoodValleyCreature[],
  player: { x: number; z: number },
) {
  let best: { id: string; distance: number; awake: boolean } | null = null
  for (const creature of creatures) {
    if (creature.phase === 'dead') continue
    const distance = formalHuntTargetSurfaceDistance(
      Math.hypot(creature.x - player.x, creature.z - player.z),
      gloamwoodPreyBodyRadius(creature),
    )
    if (distance > GLOAMWOOD_VALLEY_PLAYER.acquireRange) continue
    if (!best || (creature.awake && !best.awake) || (creature.awake === best.awake && distance < best.distance)) {
      best = { id: creature.id, distance, awake: creature.awake }
    }
  }
  return best?.id ?? null
}

export interface GloamwoodValleyCombatFrame {
  state: GloamwoodValleyCombatState
  creatures: GloamwoodValleyCreature[]
  /** Ids struck this frame, for the aggro layer to wake. */
  struck: string[]
  hits: Array<{ id: string; damage: number; killed: boolean; blocked: boolean; weakness: boolean }>
  died: boolean
}

export function stepGloamwoodValleyCombat(
  state: GloamwoodValleyCombatState,
  creatures: readonly GloamwoodValleyCreature[],
  input: {
    now: number
    delta: number
    player: { x: number; z: number }
    attackHeld: boolean
    attackPressed: boolean
    facingRadians: number
  },
): GloamwoodValleyCombatFrame {
  let next: GloamwoodValleyCombatState = {
    ...state,
    facingRadians: input.facingRadians,
    mercySeconds: Math.max(0, state.mercySeconds - input.delta),
  }

  // The lock is refreshed rather than held: a target that died or wandered out
  // of reach must not keep the player swinging at nothing.
  const locked = creatures.find((creature) => creature.id === next.lockedId && creature.phase !== 'dead')
  if (!locked) next.lockedId = gloamwoodValleyAcquire(creatures, input.player)

  if (input.attackPressed) {
    next.attack = requestFormalHuntBasicAttack(next.attack, input.now)
    if (!next.lockedId) next.lockedId = gloamwoodValleyAcquire(creatures, input.player)
  }

  let list = [...creatures]
  const update = updateFormalHuntBasicAttack(next.attack, input.now, input.attackHeld)
  next.attack = update.state

  // Turn toward what is locked, at the shared turn rate. Without this a lock is
  // decoration: the player faces wherever they last walked, the contact test
  // rejects the aim, and every swing at a creature that circled behind them
  // misses for a reason nothing on screen explains.
  const aimAt = list.find((creature) => creature.id === next.lockedId && creature.phase !== 'dead')
  if (aimAt && next.attack.action) {
    next.facingRadians = turnFormalHuntAttackToward(
      next.facingRadians,
      Math.atan2(-(aimAt.z - input.player.z), aimAt.x - input.player.x),
      input.delta,
    )
  }

  const struck: string[] = []
  const hits: GloamwoodValleyCombatFrame['hits'] = []

  if (update.contactAction && next.lockedId) {
    const target = list.find((creature) => creature.id === next.lockedId && creature.phase !== 'dead')
    if (target) {
      const distance = Math.hypot(target.x - input.player.x, target.z - input.player.z)
      const aim = formalHuntAttackAimErrorDegrees(
        next.facingRadians,
        Math.atan2(-(target.z - input.player.z), target.x - input.player.x),
      )
      // The same gate the hunt uses, including the surface correction: reach is
      // measured to the target's hurt surface, or a large creature blocks the
      // player while its centre stays outside every action's range.
      const connects = canFormalHuntBasicAttackContact({
        targetLocked: true,
        targetAvailable: true,
        distance,
        range: GLOAMWOOD_VALLEY_PLAYER.attackRange,
        aimErrorDegrees: aim,
        targetRadius: gloamwoodPreyBodyRadius(target),
      })
      if (connects) {
        const hit = damageGloamwoodPreyList(
          list,
          target.id,
          GLOAMWOOD_VALLEY_PLAYER.attackDamage,
          update.contactAction,
          input.player,
          GLOAMWOOD_VALLEY_PLAYER.knockback,
        )
        list = hit.prey as GloamwoodValleyCreature[]
        struck.push(target.id)
        hits.push({
          id: target.id,
          damage: hit.effectiveDamage,
          killed: hit.killed,
          blocked: hit.blocked,
          weakness: hit.weakness,
        })
        if (hit.killed && next.lockedId === target.id) next.lockedId = null
      }
    }
  }

  return { state: next, creatures: list, struck, hits, died: false }
}

/**
 * Applies a creature's blow to the player.
 *
 * Separate from the swing because the two are separate events, and folding them
 * together is how a frame where both happen ends up resolving one of them
 * against state the other has already changed.
 */
export function takeGloamwoodValleyHit(
  state: GloamwoodValleyCombatState,
  damage: number,
): { state: GloamwoodValleyCombatState; died: boolean } {
  if (state.mercySeconds > 0) return { state, died: false }
  const health = Math.max(0, state.health - Math.max(0, damage))
  return {
    // A short window after every blow. Without it a pack of four resolves four
    // hits in the same frame and the player dies to something they had no frame
    // in which to answer.
    state: { ...state, health, mercySeconds: 0.45 },
    died: health <= 0,
  }
}

/** Spends a life and restores the player, or ends the run. */
export function spendGloamwoodValleyLife(
  combat: GloamwoodValleyCombatState,
  progression: GloamwoodValleyProgression,
): { combat: GloamwoodValleyCombatState; progression: GloamwoodValleyProgression; runOver: boolean } {
  const livesRemaining = progression.livesRemaining - 1
  if (livesRemaining <= 0) {
    return {
      combat: { ...combat, health: 0 },
      progression: { ...progression, livesRemaining: 0 },
      runOver: true,
    }
  }
  return {
    combat: {
      ...combat,
      health: GLOAMWOOD_VALLEY_PLAYER.maxHealth,
      lockedId: null,
      mercySeconds: 1.2,
    },
    progression: { ...progression, livesRemaining },
    runOver: false,
  }
}

export function gloamwoodValleyLivesAtStart() {
  return GLOAMWOOD_VALLEY_LIFE_CAP
}
