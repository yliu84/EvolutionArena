import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'

/**
 * Swarm stage-1 player form.
 *
 * The Swarm route was the last stage-1 family with no body of its own: choosing
 * it handed the player the Fang gecko under a different name, so one of the
 * three evolution cards was telling the truth about its numbers and lying about
 * its animal.
 *
 * Sizing takes the stage-1 default height of 2.16 rather than an override. The
 * Shell form needed one because a low, long body inflates when normalised by
 * height alone; this body is already tall for its mass, so growth over stage 0
 * reads as height and reach, which is what a long-limbed runner should gain.
 * That puts it at 1.40 x 4.34 against the Fang form's 1.56 x 3.99 and the Shell
 * form's 1.58 x 4.57.
 *
 * What separates it is width, and only width. Measured proportions from the
 * runtime GLB: width:height 0.65 against Fang 0.72 and Shell 0.88. Note the
 * concept brief aimed for a body shorter than the Fang form's and did not get
 * it - length:height came out 2.01 against Fang's 1.85, so this form is
 * proportionally the longer of the two. The narrow, high-stanced read has to
 * carry the difference on its own at 13.3% of screen height.
 *
 * The chain keeps Bite -> Pounce -> TailSwipe. The Shell form had to replace
 * Pounce because short stout forelimbs cannot sell a leap; this one earns it,
 * with hind legs running 59% of standing height under a light body.
 */
export const SPORE_STALKER_PRESENTATION = {
  baselineId: 'spore-stalker-swarm-first-evolution-master-v1',
  displayScale: 166.1,
  worldHeight: 2.16,
  animation: {
    // Fastest cadence in the game. Speed is this route's whole identity, and a
    // heavy-footed gait would read as the wrong animal before the colour does.
    idlePlaybackRate: 1.12,
    runPlaybackRate: 1.46,
    turnPlaybackRate: 1.18,
    crossfadeSeconds: 0.12,
    footstepEventsPerSecond: 7.4,
    authoredStrideAmplification: 1.32,
  },
  combat: {
    ...CORAL_GECKO_PRESENTATION.combat,
    profileId: 'spore-stalker-combat-master-v1',
    system: 'basic-attack',
    skillsEnabled: false,
    primaryCombo: ['Bite', 'Pounce', 'TailSwipe'],
    targeting: {
      ...CORAL_GECKO_PRESENTATION.combat.targeting,
      mode: 'player-selected-live-target',
    },
  },
  asset: {
    triangles: 19_992,
    bones: 27,
    clips: ['Idle', 'Walk', 'Run', 'Turn', 'Bite', 'Pounce', 'TailSwipe', 'Hit', 'Death'],
    sourceModel: 'Meshy_AI_model_Animation_Walking_withSkin (4).glb',
    runtimeModel: 'spore-stalker-rigged-runtime-v1.glb',
    bodyPlan: 'long-limbed-bioluminescent-stalker',
    artStyle: 'stylized-handpainted-quadruped',
  },
  silhouette: {
    // Measured from the runtime GLB, not estimated.
    lengthToHeight: 2.01,
    widthToHeight: 0.65,
    attachmentCount: 0,
    dominantRead: 'narrow-high-stanced-glowing-flank',
  },
  material: {
    // Not the scarlet-gecko grade either: no warm tint over a near-black teal
    // hide. Emissive is genuine here but it is baked as a masked map covering
    // 5.7% of the texture - the spore sac, the spine speckles and the eye - so
    // the runtime must not lift emissive globally or the hide stops taking
    // light and the sac stops being the brightest thing on the body.
    minimumRoughness: 0.52,
    maximumRoughness: 0.74,
    maximumMetalness: 0.04,
    normalStrength: 1,
    environmentIntensity: 0.5,
    emissiveIntensity: 1,
  },
} as const

export type SporeStalkerPresentation = typeof SPORE_STALKER_PRESENTATION
