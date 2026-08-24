import { STONE_PANGOLIN_PRESENTATION } from './stone-pangolin-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'

/**
 * Shell stage-2 player form. The second evolution the Shell line never had.
 *
 * Before this, `quality3DBodyStageForFamily(2, 'shell')` fell back to 1 and a
 * Shell run's second evolution changed nothing the player could see: same mesh,
 * same 1.80 world height, same chain. Measured in a live browser, taking the
 * Shell candidate twice from a clean run produced an identical body both times.
 *
 * Sizing stays form-specific, as at stage 1, but the correction runs the other
 * way. Stage 1 was held *down* to 1.80 because a long low body normalised to
 * 2.16 would have inflated to 6.98 units. This body was contracted to fix that
 * at the source instead: it measures l/h 1.980 and w/h 1.059 against stage 1's
 * 2.542 and 0.883, so at the full 2.55 stage height it lands at 2.70 x 5.05 -
 * the widest body in the game, and still shorter than the 6.48 a scaled-up
 * stage-1 body would have produced.
 *
 * Growth over stage 1 is +70% width, +42% height and only +10% length. The
 * Shell line grows upward and outward; it does not get longer.
 */
export const BASALT_BULWARK_PRESENTATION = {
  baselineId: 'basalt-bulwark-shell-second-evolution-candidate-v1',
  // Only the legacy Quality 3D viewer reads this; the valley normalises by
  // measured world height. Chosen so that viewer shows the same 2.55/1.80 ratio
  // over the Shell stage-1 form that the valley does.
  displayScale: 184.4,
  worldHeight: 2.55,
  stageGrowthRatio: 1.4167,
  templateId: 'meshy-quadruped-combat-v1',
  animation: {
    // Slowest cadence in the game, taking the title from the stage-1 Shell.
    idlePlaybackRate: 0.78,
    runPlaybackRate: 1.18,
    turnPlaybackRate: 0.84,
    crossfadeSeconds: 0.18,
    footstepEventsPerSecond: 4.1,
    authoredStrideAmplification: 1.12,
  },
  combat: {
    ...STONE_PANGOLIN_PRESENTATION.combat,
    profileId: 'basalt-bulwark-combat-candidate-v1',
    system: 'basic-attack',
    skillsEnabled: false,
    /**
     * `Slam` is a clip name, not an action. The authority resolves `Pounce` and
     * `setAction` redirects the clip to `Slam` for the whole shell family, keyed
     * on family rather than stage - which is why this stage-2 body inherits the
     * redirect correctly. Written as ['Bite', 'Slam', 'TailSwipe'] this block
     * would be unusable as a combat profile, exactly as at stage 1.
     *
     * Pounce stays absent as an *animation*: a heavier, taller version of a body
     * that could not sell a leap still cannot sell one.
     */
    primaryCombo: ['Bite', 'Pounce', 'TailSwipe'],
    // Longer than stage 1's inherited 1.15 and than the hunter's 1.28. Each
    // step here commits for longer, so the window to continue has to match or
    // the chain drops itself mid-swing.
    comboResetSeconds: 1.42,
    /**
     * Every window matches its clip's authored length at 24 fps, and every
     * playback rate is 1, so the whole authored motion plays.
     *
     * It did not before. `setAction` read the Fang hunter's playback rates for
     * every form, and the clip is cut off when its action window ends, so Bite
     * played 64% of itself and Slam 65% - the anticipation and the contact, and
     * never the recovery. That is measurable across the whole cast: only the
     * hunter's own TailSwipe currently completes. Fixing it for the accepted
     * forms would retune feel they were playtested with, so the mechanism is now
     * form-keyed and only this form opts into fitting its window.
     *
     * Contact seconds are the animation's own contact frames: 7/24, 18/24, 20/24.
     */
    biteDurationSeconds: 0.58,
    biteContactSeconds: 0.29,
    pounceDurationSeconds: 1.20,
    pounceContactSeconds: 0.75,
    tailSwipeDurationSeconds: 1.35,
    tailSwipeContactSeconds: 0.83,
    attackPlaybackRate: { Bite: 1, Pounce: 1, TailSwipe: 1 },
    attackNames: { Bite: '碎岩咬', Pounce: '山崩压', TailSwipe: '磐锤横扫' },
    hitFeedback: {
      ...STONE_PANGOLIN_PRESENTATION.combat.hitFeedback,
      /**
       * Where the payoff sits is what stage 2 actually changes.
       *
       * Stage 1 put it in the middle, on Slam, and ended on the lightest step.
       * This source carries a fused stone club at the tail tip, so TailSwipe
       * stops being a sweep and becomes a mace: it is now the heaviest single
       * blow in the game, and the chain rises to it.
       *
       * Total is 64 over 3.13 seconds of committed animation - 20.4 damage per
       * second, which is parity with the Fang stage-2 hunter's 52 over 2.54s.
       * The two stage-2 forms hit equally hard; this one does it in fewer,
       * slower, heavier blows, so it is harder to land and far more expensive to
       * whiff. The Shell line's compensation stays where it has always been:
       * mitigation, not damage.
       */
      biteDamage: 16,
      pounceDamage: 22,
      tailSwipeDamage: 26,
      // Reach grows with the body, and the club reaches furthest of anything.
      biteRange: 2.75,
      pounceRange: 3.20,
      tailSwipeRange: 3.60,
      // Heaviest feedback in the game, matching the heaviest body. All four are
      // presentation only and never decide damage or logical range.
      flashSeconds: 0.12,
      cameraTrauma: 0.5,
      knockbackSpeed: 3.2,
      particleCount: 14,
    },
  },
  asset: {
    triangles: 20_659,
    bones: 27,
    clips: ['Idle', 'Walk', 'Run', 'Turn', 'Bite', 'Slam', 'TailSwipe', 'Hit', 'Death'],
    sourceModel: 'Meshy_AI_model_Animation_Walking_withSkin (8).glb',
    runtimeModel: 'basalt-bulwark-rigged-v1.glb',
    bodyPlan: 'megalith-slab-bulwark',
    artStyle: 'stylized-handpainted-quadruped',
  },
  silhouette: {
    // Measured from the runtime GLB by scripts/measure-glb-proportions.mjs,
    // not estimated. These are the contract's two hard gates: l/h <= 2.20 and
    // w/h >= 0.95.
    lengthToHeight: 1.98,
    widthToHeight: 1.059,
    attachmentCount: 0,
    dominantRead: 'megalith-slabs-with-upright-shoulder-and-hip-ridges',
  },
  material: {
    // The stage-1 Shell grade, unchanged, and for the same reason: this form's
    // relief lives in its normal map. It must never receive the hunter's
    // stage-2 grade, which sets normalMap = null - correct for a smooth toon
    // surface and destructive for cracked cliff rock.
    minimumRoughness: 0.58,
    maximumRoughness: 0.84,
    maximumMetalness: 0.08,
    normalStrength: 1,
    environmentIntensity: 0.55,
    emissiveIntensity: 0,
  },
} as const

export type BasaltBulwarkPresentation = typeof BASALT_BULWARK_PRESENTATION

/** Committed animation time for one full chain, in seconds. */
export const BASALT_BULWARK_CHAIN_SECONDS =
  BASALT_BULWARK_PRESENTATION.combat.biteDurationSeconds
  + BASALT_BULWARK_PRESENTATION.combat.pounceDurationSeconds
  + BASALT_BULWARK_PRESENTATION.combat.tailSwipeDurationSeconds

/** Total damage for one full chain, before any evolution or mutation modifier. */
export const BASALT_BULWARK_CHAIN_DAMAGE =
  BASALT_BULWARK_PRESENTATION.combat.hitFeedback.biteDamage
  + BASALT_BULWARK_PRESENTATION.combat.hitFeedback.pounceDamage
  + BASALT_BULWARK_PRESENTATION.combat.hitFeedback.tailSwipeDamage

/** The Fang stage-2 chain, for the parity the damage numbers are chosen against. */
export const SCARLET_HUNTER_CHAIN_SECONDS =
  SCARLET_HUNTER_PRESENTATION.combat.clawDurationSeconds
  + SCARLET_HUNTER_PRESENTATION.combat.pounceDurationSeconds
  + SCARLET_HUNTER_PRESENTATION.combat.tailSwipeDurationSeconds

export const SCARLET_HUNTER_CHAIN_DAMAGE =
  SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.clawDamage
  + SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.pounceDamage
  + SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.tailSwipeDamage
