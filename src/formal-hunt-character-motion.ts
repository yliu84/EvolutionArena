export interface FormalHuntCharacterMotionState {
  locomotionBlend: number
  runPhase: number
  stopSettleRemaining: number
  wasMoving: boolean
}

export interface FormalHuntCharacterMotionFrame {
  yOffset: number
  verticalScale: number
  horizontalScale: number
  stride: number
  contact: number
  settle: number
  shadowScale: number
  shadowOpacity: number
}

export const FORMAL_HUNT_CHARACTER_MOTION = {
  accelerationDamping: 9.5,
  decelerationDamping: 13.5,
  runCyclesPerSecond: 2.15,
  runLift: 0.026,
  stepCompression: 0.034,
  widthCompensation: 0.42,
  stopSettleSeconds: 0.24,
  stopSettleDepth: 0.055,
  strideDegrees: 14,
  shinLiftDegrees: 9,
  footPlantDegrees: 7,
  shadowBaseOpacity: 0.34,
  shadowImpactOpacity: 0.13,
  shadowImpactContraction: 0.07,
} as const

export function createFormalHuntCharacterMotionState(): FormalHuntCharacterMotionState {
  return { locomotionBlend: 0, runPhase: 0, stopSettleRemaining: 0, wasMoving: false }
}

export function stepFormalHuntCharacterMotion(
  state: FormalHuntCharacterMotionState,
  moving: boolean,
  deltaSeconds: number,
): FormalHuntCharacterMotionFrame {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const damping = moving
    ? FORMAL_HUNT_CHARACTER_MOTION.accelerationDamping
    : FORMAL_HUNT_CHARACTER_MOTION.decelerationDamping
  const target = moving ? 1 : 0
  state.locomotionBlend += (target - state.locomotionBlend) * (1 - Math.exp(-damping * delta))
  if (moving) state.runPhase += delta * FORMAL_HUNT_CHARACTER_MOTION.runCyclesPerSecond * Math.PI * 2
  if (!moving && state.wasMoving) state.stopSettleRemaining = FORMAL_HUNT_CHARACTER_MOTION.stopSettleSeconds
  state.stopSettleRemaining = Math.max(0, state.stopSettleRemaining - delta)
  state.wasMoving = moving

  const stride = Math.sin(state.runPhase) * state.locomotionBlend
  const contact = Math.abs(Math.cos(state.runPhase)) * state.locomotionBlend
  const compression = contact * FORMAL_HUNT_CHARACTER_MOTION.stepCompression
  const runLift = Math.abs(Math.sin(state.runPhase * 2))
    * FORMAL_HUNT_CHARACTER_MOTION.runLift
    * state.locomotionBlend
  const settleProgress = state.stopSettleRemaining > 0
    ? 1 - state.stopSettleRemaining / FORMAL_HUNT_CHARACTER_MOTION.stopSettleSeconds
    : 1
  const settle = state.stopSettleRemaining > 0 ? Math.sin(settleProgress * Math.PI) : 0
  return {
    yOffset: runLift - compression - settle * FORMAL_HUNT_CHARACTER_MOTION.stopSettleDepth,
    verticalScale: 1 - compression,
    horizontalScale: 1 + compression * FORMAL_HUNT_CHARACTER_MOTION.widthCompensation,
    stride,
    contact,
    settle,
    shadowScale: 1 - contact * FORMAL_HUNT_CHARACTER_MOTION.shadowImpactContraction,
    shadowOpacity: FORMAL_HUNT_CHARACTER_MOTION.shadowBaseOpacity
      + contact * FORMAL_HUNT_CHARACTER_MOTION.shadowImpactOpacity
      + settle * 0.045,
  }
}
