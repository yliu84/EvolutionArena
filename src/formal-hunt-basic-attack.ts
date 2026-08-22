import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'

export type FormalHuntBasicAttackAction = 'Bite' | 'Claw' | 'Pounce' | 'TailSwipe'

export interface FormalHuntBasicAttackState {
  action: FormalHuntBasicAttackAction | null
  actionStartedAt: number
  contactResolved: boolean
  comboStep: number
  buffered: boolean
  resetAt: number
}

export interface FormalHuntBasicAttackUpdate {
  state: FormalHuntBasicAttackState
  contactAction: FormalHuntBasicAttackAction | null
}

const COMBAT = CORAL_GECKO_PRESENTATION.combat

export interface FormalHuntBasicAttackProfile {
  primaryCombo: readonly FormalHuntBasicAttackAction[]
  comboResetSeconds: number
  biteDurationSeconds: number
  biteContactSeconds: number
  pounceDurationSeconds: number
  pounceContactSeconds: number
  clawDurationSeconds: number
  clawContactSeconds: number
  tailSwipeDurationSeconds: number
  tailSwipeContactSeconds: number
}

export function createFormalHuntBasicAttackState(): FormalHuntBasicAttackState {
  return {
    action: null,
    actionStartedAt: 0,
    contactResolved: false,
    comboStep: 0,
    buffered: false,
    resetAt: 0,
  }
}

export function requestFormalHuntBasicAttack(
  state: FormalHuntBasicAttackState,
  now: number,
  profile: FormalHuntBasicAttackProfile = COMBAT,
): FormalHuntBasicAttackState {
  if (state.action) return { ...state, buffered: true }
  const resetState = state.resetAt > 0 && now >= state.resetAt
    ? { ...state, comboStep: 0, resetAt: 0 }
    : state
  return startComboAction(resetState, now, profile)
}

/**
 * Movement is an explicit defensive choice, not a delayed input.
 *
 * Clear the active swing and its one buffered follow-up together, so holding
 * the primary button cannot quietly resume a chain after the player has chosen
 * to leave a boss telegraph. The next deliberate attack starts at the safe
 * opener rather than preserving an invisible combo position.
 */
export function cancelFormalHuntBasicAttack(state: FormalHuntBasicAttackState): FormalHuntBasicAttackState {
  if (!state.action && !state.buffered) return state
  return {
    ...state,
    action: null,
    actionStartedAt: 0,
    contactResolved: false,
    comboStep: 0,
    buffered: false,
    resetAt: 0,
  }
}

export function updateFormalHuntBasicAttack(
  state: FormalHuntBasicAttackState,
  now: number,
  primaryHeld: boolean,
  profile: FormalHuntBasicAttackProfile = COMBAT,
): FormalHuntBasicAttackUpdate {
  if (!state.action) {
    if (state.resetAt > 0 && now >= state.resetAt) {
      return {
        state: { ...state, comboStep: 0, resetAt: 0 },
        contactAction: null,
      }
    }
    return { state, contactAction: null }
  }

  const action = state.action
  const elapsedSeconds = Math.max(0, now - state.actionStartedAt) / 1000
  const contactSeconds = contactSecondsFor(action, profile)
  const durationSeconds = durationSecondsFor(action, profile)
  const contactAction = !state.contactResolved && elapsedSeconds >= contactSeconds ? action : null
  let nextState = contactAction ? { ...state, contactResolved: true } : state

  if (elapsedSeconds < durationSeconds) return { state: nextState, contactAction }

  if (state.buffered || primaryHeld) {
    nextState = startComboAction({ ...nextState, action: null, buffered: false }, now, profile)
  } else {
    nextState = {
      ...nextState,
      action: null,
      actionStartedAt: 0,
      contactResolved: false,
      buffered: false,
      resetAt: now + profile.comboResetSeconds * 1000,
    }
  }
  return { state: nextState, contactAction }
}

export function formalHuntAttackAimErrorDegrees(currentAngle: number, targetAngle: number) {
  return Math.abs(Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle))) * 180 / Math.PI
}

export function turnFormalHuntAttackToward(
  currentAngle: number,
  targetAngle: number,
  deltaSeconds: number,
) {
  const difference = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle))
  const maximumTurn = COMBAT.targeting.turnSpeedRadiansPerSecond * Math.max(0, deltaSeconds)
  if (Math.abs(difference) <= maximumTurn) return targetAngle
  return currentAngle + Math.sign(difference) * maximumTurn
}

export function canFormalHuntBasicAttackContact(input: {
  targetLocked: boolean
  targetAvailable: boolean
  distance: number
  range: number
  aimErrorDegrees: number
  targetRadius?: number
}) {
  return input.targetLocked
    && input.targetAvailable
    && formalHuntTargetSurfaceDistance(input.distance, input.targetRadius) <= input.range
    && input.aimErrorDegrees <= COMBAT.targeting.contactToleranceDegrees
}

/**
 * Attack reach is measured to the target's hurt surface, not its transform
 * origin. Without this correction a large target can physically block the
 * player while its centre remains outside every melee action's range.
 */
export function formalHuntTargetSurfaceDistance(centerDistance: number, targetRadius = 0) {
  return Math.max(0, centerDistance - Math.max(0, targetRadius))
}

function startComboAction(
  state: FormalHuntBasicAttackState,
  now: number,
  profile: FormalHuntBasicAttackProfile,
): FormalHuntBasicAttackState {
  const action = profile.primaryCombo[state.comboStep]
  return {
    action,
    actionStartedAt: now,
    contactResolved: false,
    comboStep: (state.comboStep + 1) % profile.primaryCombo.length,
    buffered: false,
    resetAt: 0,
  }
}

function contactSecondsFor(action: FormalHuntBasicAttackAction, profile: FormalHuntBasicAttackProfile) {
  if (action === 'Bite') return profile.biteContactSeconds
  if (action === 'Pounce') return profile.pounceContactSeconds
  if (action === 'Claw') return profile.clawContactSeconds
  return profile.tailSwipeContactSeconds
}

function durationSecondsFor(action: FormalHuntBasicAttackAction, profile: FormalHuntBasicAttackProfile) {
  if (action === 'Bite') return profile.biteDurationSeconds
  if (action === 'Pounce') return profile.pounceDurationSeconds
  if (action === 'Claw') return profile.clawDurationSeconds
  return profile.tailSwipeDurationSeconds
}
