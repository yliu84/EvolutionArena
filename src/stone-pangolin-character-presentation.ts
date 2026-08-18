import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'

/**
 * Shell stage-1 player form, accepted 2026-08-17.
 *
 * Sizing is form-specific rather than stage-based. The runtime normalises a
 * model by height alone, so this low, long body would inflate at the 2.16
 * stage-1 height; it is held at 1.80 instead, which puts it at 1.58 x 4.57
 * against the Fang form's 1.56 x 3.99. Growth over stage 0 reads as breadth and
 * mass rather than height, and evolving never looks like shrinking.
 *
 * The chain drops Pounce: short stout forelimbs and a low head cannot sell a
 * leap, so Slam drives the front plate mass down instead.
 */
export const STONE_PANGOLIN_PRESENTATION = {
  baselineId: 'stone-pangolin-shell-first-evolution-master-v1',
  displayScale: 166.1,
  worldHeight: 1.8,
  animation: {
    idlePlaybackRate: 0.85,
    runPlaybackRate: 1.28,
    turnPlaybackRate: 0.92,
    crossfadeSeconds: 0.16,
    // Heaviest cadence in the game, per the contract's weight clause.
    footstepEventsPerSecond: 4.6,
    authoredStrideAmplification: 1.18,
  },
  combat: {
    ...CORAL_GECKO_PRESENTATION.combat,
    profileId: 'stone-pangolin-combat-master-v1',
    system: 'basic-attack',
    skillsEnabled: false,
    // Slam is a clip name, not an action: the runtime redirects the Pounce clip
    // to Slam for this family and the authority still resolves Pounce. Written
    // as ['Bite', 'Slam', 'TailSwipe'] this block was unusable as a combat
    // profile, which is part of why it was never wired up - the whole file sat
    // as documentation while every stage-1 form ran the Fang numbers.
    primaryCombo: ['Bite', 'Pounce', 'TailSwipe'],
    targeting: {
      ...CORAL_GECKO_PRESENTATION.combat.targeting,
      mode: 'player-selected-live-target',
    },
  },
  asset: {
    triangles: 20_391,
    bones: 27,
    clips: ['Idle', 'Walk', 'Run', 'Turn', 'Bite', 'Slam', 'TailSwipe', 'Hit', 'Death'],
    sourceModel: 'Meshy_AI_model_Animation_Walking_withSkin (3).glb',
    runtimeModel: 'stone-pangolin-rigged-runtime-v2.glb',
    bodyPlan: 'overlapping-stone-plate-pangolin',
    artStyle: 'stylized-handpainted-quadruped',
  },
  silhouette: {
    // Measured from the runtime GLB, not estimated.
    lengthToHeight: 2.54,
    widthToHeight: 0.88,
    attachmentCount: 0,
    dominantRead: 'low-broad-overlapping-plate-mound',
  },
  material: {
    // Deliberately NOT the scarlet-gecko grade: no warm tint over grey stone, no
    // emissive fill, and full normal strength, because this form's plate relief
    // lives in its normal map.
    minimumRoughness: 0.58,
    maximumRoughness: 0.84,
    maximumMetalness: 0.08,
    normalStrength: 1,
    environmentIntensity: 0.55,
    emissiveIntensity: 0,
  },
} as const

export type StonePangolinPresentation = typeof STONE_PANGOLIN_PRESENTATION
