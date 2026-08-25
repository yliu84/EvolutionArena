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
  /**
   * Four steps where both other forms have three, and the payoff sits at the
   * end instead of the middle.
   *
   * The Fang chain is Bite 16 / Pounce 18 / TailSwipe 14: 48 damage over 2.37s,
   * with the heavy hit in the middle. Shipping the Swarm form on that same chain
   * was a cost decision, not a design one, and it showed - the route's own
   * identity is speed and fragility, and it fought exactly like the Fang gecko.
   *
   * This chain opens with the leap instead of centring on it, so the first press
   * closes distance. The two rakes are the cheapest hits and have the shortest
   * reach of the first three steps, which forces the fragile body to stay close
   * through the part that pays least.
   *
   * It finishes on a committed kill bite. Every form used to end on TailSwipe,
   * which made the most distinctive step in a chain the one step all three
   * shared; this form now never throws a tail sweep at all. The finisher also
   * has the shortest reach in the chain, so the 42% of chain damage it carries
   * is only available right on top of the target - against the Fang chain's 29%
   * in its finisher, breaking off early costs far more here.
   *
   * Total comes to 50 damage over 2.60s against the Fang chain's 48 over 2.37s.
   * The trade is not raw time - four fast steps land in about the same window as
   * three ordinary ones - it is where the payoff sits and how close you must
   * stand to reach it.
   */
  combat: {
    ...CORAL_GECKO_PRESENTATION.combat,
    profileId: 'spore-stalker-combat-master-v1',
    system: 'basic-attack',
    skillsEnabled: false,
    primaryCombo: ['Pounce', 'Claw', 'Claw', 'Bite'],
    hitFeedback: {
      ...CORAL_GECKO_PRESENTATION.combat.hitFeedback,
      pounceDamage: 11,
      clawDamage: 9,
      biteDamage: 21,
      pounceRange: 3.05,
      clawRange: 2.72,
      // Shortest reach in the chain sits on the step that pays most, so the
      // payoff is only available at closest quarters.
      biteRange: 2.6,
      knockbackSpeed: 2.6,
      cameraTrauma: 0.3,
      particleCount: 7,
    },
    // A single Claw clip contains both paws, left then right, so playing it
    // twice in a row reads as a flurry rather than a stutter. Its motion is
    // roughly double a first pass the user reported as barely visible, with the
    // chest, head and hips counter-rotating so the whole silhouette moves - a
    // limb swinging alone still reads small at 13.3% of screen height.
    pounceDurationSeconds: 0.68,
    pounceContactSeconds: 0.32,
    clawDurationSeconds: 0.54,
    clawContactSeconds: 0.23,
    // The finisher is the longest step in the chain by a wide margin: wind-up,
    // driven strike, then a hold on the clamp. Fast symmetric motion is what
    // makes a heavy hit read as weightless.
    biteDurationSeconds: 0.84,
    biteContactSeconds: 0.4,
    comboResetSeconds: 1.3,
    targeting: {
      ...CORAL_GECKO_PRESENTATION.combat.targeting,
      mode: 'player-selected-live-target',
    },
  },
  asset: {
    triangles: 19_992,
    bones: 27,
    clips: ['Idle', 'Walk', 'Run', 'Turn', 'Bite', 'Claw', 'Pounce', 'TailSwipe', 'Hit', 'Death'],
    sourceModel: 'Meshy_AI_model_Animation_Walking_withSkin (4).glb',
    runtimeModel: 'spore-stalker-rigged-runtime-v1.glb',
    bodyPlan: 'long-limbed-bioluminescent-stalker',
    artStyle: 'stylized-handpainted-quadruped',
  },
  silhouette: {
    // Measured from the runtime GLB, not estimated.
    lengthToHeight: 2.01,
    widthToHeight: 0.65,
    // Measured over the upper 45% of the body, excluding the legs. Recorded
    // when the stage-2 form was produced: a bounding-box width gate rejected
    // that mesh at 0.809 before it was understood that the box measures this
    // family's leg stance rather than its body. The two forms' torsos are
    // within half a percent of each other.
    torsoWidthToHeight: 0.472,
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
    /**
     * Over 1.0 on purpose, for the same reason as its stage-2 form.
     *
     * Bloom reads the linear buffer before tone mapping, and the sac at
     * intensity 1 never reached the threshold, so the one feature this
     * silhouette is built around threw no light. The lift is safe only because
     * the emissive is a baked mask covering 5.7% of the texture; the hide
     * itself is untouched and still has to earn its shape from the scene lights.
     *
     * Held equal to the stage-2 grade on purpose - `tests/lantern-lynx-form`
     * asserts the two Swarm forms share one grade, which is the guard against
     * a stage-keyed lookup quietly handing this body the Shell's numbers.
     */
    emissiveIntensity: 2,
  },
} as const

export type SporeStalkerPresentation = typeof SPORE_STALKER_PRESENTATION
