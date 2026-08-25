import { SPORE_STALKER_PRESENTATION } from './spore-stalker-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'

/**
 * Swarm stage-2 player form. The last family to get a second evolution.
 *
 * With this, all three routes change body, world height and combat chain on the
 * second evolution. Before it, `quality3DBodyStageForFamily(2, 'swarm')`
 * returned 1 and the Swarm second evolution changed nothing the player could
 * see - the same gap the Shell line had until `basalt-bulwark` shipped.
 *
 * **This is the second design for this slot.** The first passed every gate in
 * the contract and was rejected on sight: a thin, vented, spider-legged thing
 * with a blade for a head. The owner said they would not choose it, and that is
 * decisive - the evolution card is a choice, so a form nobody wants to become
 * deletes a third of the game. The contract now carries an appeal gate (§0) that
 * is judged by eye before any measurable gate, because every measurable one
 * passed.
 *
 * What replaced it: a big-cat / young-dragon with two large glowing eyes leading
 * the design, a ruff of four large cyan lantern pods at the shoulders, sturdy
 * muscular legs, a cream chest and a tufted tail. Few large features rather than
 * many small ones, because nothing below roughly 144 px reads in play.
 *
 * Sizing takes the 2.55 stage default with no override, as stage 1 took 2.16.
 */
export const LANTERN_LYNX_PRESENTATION = {
  baselineId: 'lantern-lynx-swarm-second-evolution-master-v1',
  // Legacy Quality 3D viewer only; the valley normalises by measured height.
  // Chosen so that viewer shows the same 2.55/2.16 step over the Swarm stage-1
  // form that the valley does.
  displayScale: 180.0,
  worldHeight: 2.55,
  stageGrowthRatio: 1.1806,
  templateId: 'meshy-quadruped-combat-v1',
  animation: {
    // Still the fastest cadence in the game, and slightly faster again than the
    // stage-1 form. Speed is this route's whole identity.
    idlePlaybackRate: 1.15,
    runPlaybackRate: 1.5,
    turnPlaybackRate: 1.22,
    crossfadeSeconds: 0.1,
    footstepEventsPerSecond: 7.8,
    authoredStrideAmplification: 1.32,
  },
  combat: {
    ...SPORE_STALKER_PRESENTATION.combat,
    profileId: 'lantern-lynx-combat-master-v1',
    system: 'basic-attack',
    skillsEnabled: false,
    /**
     * Four steps, inherited from stage 1, where both other families have three.
     * The payoff stays on the finisher and the finisher keeps the shortest reach
     * in the chain, so the step that pays most is only available at closest
     * quarters - which is the whole shape of this route: fragile, fast, and
     * forced to commit to get paid.
     */
    primaryCombo: ['Pounce', 'Claw', 'Claw', 'Bite'],
    comboResetSeconds: 1.1,
    /**
     * Every window equals its clip's authored length at playback rate 1, so the
     * whole motion plays.
     *
     * The stage-1 form does not manage this: its clips run 1.42s, 0.92s and
     * 1.50s against windows of 0.68s, 0.54s and 0.84s, so roughly half of each
     * authored attack has never been seen in play. Rather than inherit that,
     * the clips here were compressed at export to the tempo this form should
     * move at, and the windows were then set to match them.
     */
    pounceDurationSeconds: 0.71,
    pounceContactSeconds: 0.32,
    clawDurationSeconds: 0.46,
    clawContactSeconds: 0.23,
    biteDurationSeconds: 0.75,
    biteContactSeconds: 0.40,
    tailSwipeDurationSeconds: 0.63,
    tailSwipeContactSeconds: 0.31,
    attackPlaybackRate: { Bite: 1, Pounce: 1, Claw: 1, TailSwipe: 1 },
    attackNames: { Pounce: '孢跃', Claw: '裂爪', Bite: '巢噬' },
    hitFeedback: {
      ...SPORE_STALKER_PRESENTATION.combat.hitFeedback,
      /**
       * 49 damage over 2.38 seconds of committed animation - 20.6 per second,
       * matching the Fang stage-2 hunter's 20.5 and the Shell stage-2 bulwark's
       * 20.4. All three stage-2 forms hit equally hard; what differs is the
       * shape.
       *
       * This route's compensation is *not* damage. Its evolution candidates buy
       * speed, biomass and healing on kills and pay for them in health and
       * damage, so out-damaging the other two would contradict its own numbers.
       * It gets there in four fast steps instead of three slow ones, and 41% of
       * the total sits on the finisher.
       */
      pounceDamage: 11,
      clawDamage: 9,
      biteDamage: 20,
      // Reach grows about 8% with the body, and the finisher stays the shortest
      // step in the chain.
      pounceRange: 3.28,
      clawRange: 2.92,
      biteRange: 2.78,
      // Lightest feedback of the three stage-2 forms, matching the lightest body.
      // Presentation only; none of these decide damage or logical range.
      flashSeconds: 0.09,
      cameraTrauma: 0.32,
      knockbackSpeed: 2.7,
      particleCount: 8,
    },
  },
  asset: {
    triangles: 18_942,
    bones: 27,
    clips: ['Idle', 'Walk', 'Run', 'Turn', 'Bite', 'Claw', 'Pounce', 'TailSwipe', 'Hit', 'Death'],
    sourceModel: 'Meshy_AI_model_Animation_Walking_withSkin (10).glb',
    runtimeModel: 'lantern-lynx-rigged-v1.glb',
    bodyPlan: 'lantern-ruff-cat-drake',
    artStyle: 'stylized-handpainted-quadruped',
  },
  silhouette: {
    // Measured from the runtime GLB. This body stands on normal legs rather
    // than the previous design's splayed ones, so the bounding box and the
    // torso are close together: 1.59 wide against a 1.47 torso at 2.55.
    lengthToHeight: 1.714,
    widthToHeight: 0.624,
    torsoWidthToHeight: 0.578,
    attachmentCount: 0,
    dominantRead: 'blue-cat-drake-with-four-cyan-shoulder-lanterns',
  },
  material: {
    // The stage-1 Swarm grade. Emissive is a baked mask, never a global lift.
    //
    // This source ships `emissiveTexture` set to its own base colour with
    // `emissiveFactor [1,1,1]` - the same reuse the scarlet-gecko and the Spore
    // Toad both arrived with - so left alone the entire animal emits its own
    // albedo and becomes a lantern. Processing rebuilds it as a cyan-excess
    // mask covering 8.5% of the texture: the eyes, the four shoulder pods and
    // the tail tuft.
    //
    // The ramp had to move for this body. It is a saturated blue-teal where the
    // previous design was near-black, so the inherited 0.30-0.62 window sat
    // below its 75th percentile and put some glow on 29% of the texture. At
    // 0.40-0.70 it lights 8.5% at all and 4.8% weighted. Those are two different
    // numbers and only the second is what the 15% budget means.
    minimumRoughness: 0.52,
    maximumRoughness: 0.74,
    maximumMetalness: 0.04,
    normalStrength: 1,
    // The stage-1 value. A higher one was tried to lift this thinner body and
    // was pointless: the game has no `scene.environment`, only Hemisphere and
    // Directional lights, so `envMapIntensity` scales the contribution of an
    // environment map that does not exist. It is a no-op here for every form.
    environmentIntensity: 0.5,
    /**
     * Over 1.0 on purpose, and only safe because the emissive is a mask.
     *
     * Bloom thresholds against the linear buffer before tone mapping, so a
     * mask peaks around 0.66 luminance there and throws no light at all - the
     * four shoulder lanterns this form is named for were just pale paint. At 2
     * the pods reach about 1.3 and clear the 1.15 threshold.
     *
     * Measured, and it is a compromise. The mask is not evenly bright: the tail
     * tuft is the hottest part of it and the shoulder pods the coolest, so
     * there is no single multiplier that lights the pods without starting to
     * flatten the tuft. 2.2 lit the pods well and took the tuft to a white
     * lump; 1.6 kept the tuft and left the pods below the threshold. Fixing it
     * properly means re-baking the mask so the pods are as hot as the tuft,
     * which is an asset change, not a number.
     *
     * A global emissive lift at this value would flatten the animal, because
     * emissive does not vary with the surface normal. It does not here: the
     * mask covers 8.5% of the texture - the eyes, the four pods and the tail
     * tuft - and those are the parts that are *supposed* to be light rather
     * than form. The other 91.5% still takes the scene lighting exactly as
     * before.
     */
    emissiveIntensity: 2,
    emissiveMaskCoverage: 0.085,
  },
} as const

export type LanternLynxPresentation = typeof LANTERN_LYNX_PRESENTATION

/** Committed animation time for one full four-step chain, in seconds. */
export const LANTERN_LYNX_CHAIN_SECONDS =
  LANTERN_LYNX_PRESENTATION.combat.pounceDurationSeconds
  + LANTERN_LYNX_PRESENTATION.combat.clawDurationSeconds * 2
  + LANTERN_LYNX_PRESENTATION.combat.biteDurationSeconds

/** Total damage for one full chain, before any evolution or mutation modifier. */
export const LANTERN_LYNX_CHAIN_DAMAGE =
  LANTERN_LYNX_PRESENTATION.combat.hitFeedback.pounceDamage
  + LANTERN_LYNX_PRESENTATION.combat.hitFeedback.clawDamage * 2
  + LANTERN_LYNX_PRESENTATION.combat.hitFeedback.biteDamage

/** The Fang stage-2 chain, for the parity these damage numbers are chosen against. */
export const SCARLET_HUNTER_REFERENCE_RATE =
  (SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.clawDamage
    + SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.pounceDamage
    + SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.tailSwipeDamage)
  / (SCARLET_HUNTER_PRESENTATION.combat.clawDurationSeconds
    + SCARLET_HUNTER_PRESENTATION.combat.pounceDurationSeconds
    + SCARLET_HUNTER_PRESENTATION.combat.tailSwipeDurationSeconds)
