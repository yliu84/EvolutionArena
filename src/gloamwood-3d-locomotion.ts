export interface GloamwoodFootstepState {
  stepIndex: number | null
}

export const GLOAMWOOD_3D_LOCOMOTION_FEEL = {
  // Two alternating foot plants are emitted per cycle. 1.28 therefore gives
  // the heavy stage-2 body about 2.56 visible impacts per second instead of
  // the previous 4.3 Hz bounce, without changing authoritative travel speed.
  runCyclesPerSecond: 1.28,
  minimumStepBlend: 0.58,
  // Playtest, 2026-08-19: "the walk feels too light, there is no weight to it".
  // The system was already here and its amplitudes were two to three percent of
  // a 2.55-unit body, which is below what the eye reads as mass at this camera
  // distance. Roughly doubled. None of this touches authoritative travel speed -
  // the creature covers exactly the same ground, it just costs it something.
  bodyLift: 0.075,
  footPlantCompression: 0.13,
  stopSettleDepth: 0.13,
  bodyRockRadians: 0.042,
  impactDip: 0.05,
  // Slower recovery than the drop. A body that springs back as fast as it fell
  // reads as a ball; one that takes longer to come up reads as heavy.
  impactDecayPerSecond: 6.2,
  footstepTrauma: 0.075,
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
  // A wider contact window than the original 7. At that exponent the plant was
  // a flicker two frames long, so the compression never had time to be seen.
  const contact = Math.pow(Math.abs(Math.cos(runPhase)), 5) * blend
  const lift = Math.pow(Math.abs(Math.sin(runPhase)), 1.3) * GLOAMWOOD_3D_LOCOMOTION_FEEL.bodyLift * blend
  const compression = contact * GLOAMWOOD_3D_LOCOMOTION_FEEL.footPlantCompression
  return {
    contact,
    compression,
    yOffset: lift - compression - Math.max(0, impact) * GLOAMWOOD_3D_LOCOMOTION_FEEL.impactDip,
    bodyRock: Math.sin(runPhase) * GLOAMWOOD_3D_LOCOMOTION_FEEL.bodyRockRadians * blend,
  }
}
