export type Quality3DBasicAttackAction = 'Bite' | 'Claw' | 'Pounce' | 'TailSwipe'

export interface Quality3DAttackFeedbackRecipe {
  color: number
  accent: number
  arcCount: number
  durationSeconds: number
  hitStopSeconds: number
  cameraTraumaMultiplier: number
  plane: 'vertical' | 'ground'
  scale: number
}

export const QUALITY_3D_ATTACK_FEEDBACK: Record<Quality3DBasicAttackAction, Quality3DAttackFeedbackRecipe> = {
  Claw: {
    color: 0xffd7a0,
    accent: 0xff6f42,
    arcCount: 2,
    durationSeconds: 0.18,
    hitStopSeconds: 0.06,
    cameraTraumaMultiplier: 1,
    plane: 'vertical',
    scale: 0.9,
  },
  Bite: {
    color: 0xfff0c2,
    accent: 0xc63b31,
    arcCount: 2,
    durationSeconds: 0.15,
    hitStopSeconds: 0.075,
    cameraTraumaMultiplier: 1.08,
    plane: 'vertical',
    scale: 0.72,
  },
  Pounce: {
    color: 0xffc58f,
    accent: 0xff4f38,
    arcCount: 2,
    durationSeconds: 0.22,
    hitStopSeconds: 0.095,
    cameraTraumaMultiplier: 1.25,
    plane: 'vertical',
    scale: 1.18,
  },
  TailSwipe: {
    color: 0xf0b15f,
    accent: 0x6fe5ca,
    arcCount: 2,
    durationSeconds: 0.24,
    hitStopSeconds: 0.105,
    cameraTraumaMultiplier: 1.3,
    plane: 'ground',
    scale: 1.3,
  },
}

export function getQuality3DAttackFeedback(action: Quality3DBasicAttackAction) {
  return QUALITY_3D_ATTACK_FEEDBACK[action]
}
