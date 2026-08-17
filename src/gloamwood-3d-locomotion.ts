export interface GloamwoodFootstepState {
  stepIndex: number | null
}

export const GLOAMWOOD_3D_LOCOMOTION_FEEL = {
  // Two alternating foot plants are emitted per cycle. 1.28 therefore gives
  // the heavy stage-2 body about 2.56 visible impacts per second instead of
  // the previous 4.3 Hz bounce, without changing authoritative travel speed.
  runCyclesPerSecond: 1.28,
  minimumStepBlend: 0.58,
  bodyLift: 0.052,
  footPlantCompression: 0.072,
  stopSettleDepth: 0.082,
  bodyRockRadians: 0.028,
  impactDip: 0.026,
  impactDecayPerSecond: 8.5,
  footstepTrauma: 0.045,
  dustPoolSize: 36,
  dustPerStep: 8,
  dustDurationSeconds: 0.46,
} as const

export function createGloamwoodFootstepState(): GloamwoodFootstepState {
  return { stepIndex: null }
}

export function stepGloamwoodFootsteps(
  state: GloamwoodFootstepState,
  runPhase: number,
  locomotionBlend: number,
): { emitted: false; side: 0 } | { emitted: true; side: -1 | 1 } {
  const stepIndex = Math.floor((runPhase + Math.PI * 0.18) / Math.PI)
  if (locomotionBlend < GLOAMWOOD_3D_LOCOMOTION_FEEL.minimumStepBlend) {
    state.stepIndex = stepIndex
    return { emitted: false, side: 0 }
  }
  if (state.stepIndex === null) {
    state.stepIndex = stepIndex
    return { emitted: false, side: 0 }
  }
  if (stepIndex === state.stepIndex) return { emitted: false, side: 0 }
  state.stepIndex = stepIndex
  return { emitted: true, side: (stepIndex % 2 === 0 ? -1 : 1) as -1 | 1 }
}

export function gloamwoodWeightFrame(runPhase: number, locomotionBlend: number, impact: number) {
  const blend = Math.max(0, Math.min(1, locomotionBlend))
  const contact = Math.pow(Math.abs(Math.cos(runPhase)), 7) * blend
  const lift = Math.pow(Math.abs(Math.sin(runPhase)), 1.3) * GLOAMWOOD_3D_LOCOMOTION_FEEL.bodyLift * blend
  const compression = contact * GLOAMWOOD_3D_LOCOMOTION_FEEL.footPlantCompression
  return {
    contact,
    compression,
    yOffset: lift - compression - Math.max(0, impact) * GLOAMWOOD_3D_LOCOMOTION_FEEL.impactDip,
    bodyRock: Math.sin(runPhase) * GLOAMWOOD_3D_LOCOMOTION_FEEL.bodyRockRadians * blend,
  }
}
