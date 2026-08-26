import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinnedHierarchy } from 'three/examples/jsm/utils/SkeletonUtils.js'
import {
  formatGloamwoodPerformanceReadout,
  GloamwoodPerformanceSampler,
  GloamwoodRunPerformance,
  gloamwoodRunPerformanceVisible,
  type GloamwoodRunPerformanceReport,
  readJavaScriptHeapMegabytes,
} from './gloamwood-performance'
import {
  GLOAMWOOD_RENDER_QUALITY,
  resolveGloamwoodRenderPixelRatio,
  shouldGloamwoodRenderContinuously,
} from './gloamwood-render-quality'
import { gloamwoodJoystickVector } from './gloamwood-touch-controls'
import { gloamwoodMapFromEntry, type GloamwoodMapId } from './entry-routing'
import {
  applyGloamwoodRun,
  readGloamwoodAchievements,
  writeGloamwoodAchievements,
  type GloamwoodRunSummary,
} from './gloamwood-achievements'
import { createGloamwoodDefenceMap } from './gloamwood-defence-map'
import {
  GLOAMWOOD_DEFENCE_RUN,
  gloamwoodDefenceReward,
  type GloamwoodDefenceState,
} from './gloamwood-defence-director'
import { GLOAMWOOD_DEFENCE } from './gloamwood-defence-terrain'
import { buildGloamwoodDefenceScene } from './gloamwood-defence-scene'

import { quality3DBodyStageForFamily, resolveQuality3DGLBAsset, type Quality3DFormFamily } from './quality-3d-glb-assets'
import { STONE_PANGOLIN_PRESENTATION } from './stone-pangolin-character-presentation'
import { SPORE_STALKER_PRESENTATION } from './spore-stalker-character-presentation'
import { BASALT_BULWARK_PRESENTATION } from './basalt-bulwark-character-presentation'
import { LANTERN_LYNX_PRESENTATION } from './lantern-lynx-character-presentation'
import { amplifyGloamwoodAttackClip } from './gloamwood-attack-amplitude'
import { applyDocumentLocale, getLocale, persistLocale, setLocale, t, type Locale } from './i18n'
import { gloamwoodFamilyPortrait } from './gloamwood-family-portraits'
import { gloamwoodMutationIcon } from './gloamwood-mutation-icons'
import { gloamwoodMutationExpression } from './gloamwood-mutation-expression'
import {
  carapaceShellLayout,
  METABOLIC_VEINS,
  metabolicVeinLayout,
  moultHuskLayout,
  moultRhombusMeshData,
  mutationFxBurst,
  paintMetabolicChevron,
  paintRendingScratch,
  paintSkillFxTexture,
  paintSporeHazePatch,
  paintTailSweepHalo,
  rendingSparkBurst,
  RENDING_CRACK,
  SKILL_FX_TEXTURE_KINDS,
  SPORE_HAZE,
  sporeHazeLayout,
  tailSweepLayout,
  type MutationFxBurstId,
  type MutationFxMotion,
  type SkillFxTextureKind,
} from './gloamwood-mutation-fx'
import { GloamwoodSessionLog, summariseGloamwoodSession } from './gloamwood-3d-session-log'
import {
  GLOAMWOOD_BLADESHELL_BOSS,
  GLOAMWOOD_THORNHEART_WARDEN_BOSS,
  gloamwoodBossClipForState,
  gloamwoodBossClipRate,
  type GloamwoodModelledBossConfig,
} from './gloamwood-3d-modelled-boss'
import {
  GLOAMWOOD_MUTATION_POOL,
  accumulateGloamwoodMutationEffects,
  recordGloamwoodMutationMilestone,
  createGloamwoodMutationState,
  gloamwoodMutationOffersEarned,
  openGloamwoodMutationOffer,
  selectGloamwoodMutation,
  type GloamwoodMutationEffects,
  type GloamwoodMutationState,
} from './gloamwood-3d-mutations'
import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'
import {
  applyScarletGeckoSurfaceGrade,
  SCARLET_GECKO_PRESENTATION,
  stabilizeScarletGeckoLocomotionClip,
} from './scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'
import { juvenileLeapBiteMotionFrame, juvenileSpinTailSwipeMotionFrame, quadrupedAttackMotionFrame } from './quadruped-combat-motion'
import {
  canFormalHuntBasicAttackContact,
  cancelFormalHuntBasicAttack,
  createFormalHuntBasicAttackState,
  formalHuntAttackAimErrorDegrees,
  formalHuntTargetSurfaceDistance,
  requestFormalHuntBasicAttack,
  turnFormalHuntAttackToward,
  updateFormalHuntBasicAttack,
  type FormalHuntBasicAttackAction,
  type FormalHuntBasicAttackProfile,
  type FormalHuntBasicAttackState,
} from './formal-hunt-basic-attack'
import {
  GLOAMWOOD_3D_COMBAT,
  createGloamwoodPlayerCombatState,
  damageGloamwoodPlayer,
  gloamwoodPlayerDamageTaken,
  stepGloamwoodPlayerCombat,
  type GloamwoodPlayerCombatState,
} from './gloamwood-3d-combat'
import {
  GLOAMWOOD_NEST,
  GLOAMWOOD_NEST_GUARDIAN,
  GLOAMWOOD_PREY,
  awakenGloamwoodNestGuardian,
  clampGloamwoodPreyToArena,
  damageGloamwoodNestPrey,
  inspectGloamwoodPlayerPreyClearance,
  inspectGloamwoodPlayerPreyActionClearance,
  inspectGloamwoodPreyPairClearance,
  gloamwoodPreyTelegraphRadius,
  gloamwoodPreyBodyRadius,
  gloamwoodPreyGuardsItsFront,
  gloamwoodFlankApproachAngle,
  GLOAMWOOD_SHELL_FRONT_ARC,
  resolveGloamwoodPlayerPreyCollision,
  suppressGloamwoodNestPreyAround,
  type GloamwoodNestPrey,
  type GloamwoodNestState,
  type GloamwoodPreyKind,
  type GloamwoodPreyPhase,
} from './gloamwood-3d-ecology'
import { getQuality3DAttackFeedback } from './quality-3d-attack-feedback'
import {
  GLOAMWOOD_3D_LOCOMOTION_FEEL,
  createGloamwoodFootstepState,
  gloamwoodWeightFrame,
  stepGloamwoodFootsteps,
} from './gloamwood-3d-locomotion'
import {
  getGloamwoodPlayerCollisionProfile,
  inspectGloamwoodPlayerCollision,
  resolveGloamwoodPlayerCollision,
  type GloamwoodCircleObstacle,
} from './gloamwood-3d-collision'
import {
  GLOAMWOOD_BLOOM,
  createGloamwoodBloom,
  gloamwoodBloomRequested,
  type GloamwoodBloomPipeline,
  type GloamwoodBloomSettings,
} from './gloamwood-bloom'
import {
  GLOAMWOOD_ROCK_VARIANTS,
  GLOAMWOOD_TREE_VARIANTS,
  GLOAMWOOD_VEGETATION_VARIANTS,
  rockFootprint,
  rockVariantForIndex,
  treeFootprint,
  treeSizeFactor,
  treeVariantForIndex,
  vegetationWorldSize,
  type GloamwoodVegetationLayer,
} from './gloamwood-environment-kit'
import {
  createGloamwoodEvolutionState,
  gloamwoodEvolutionGrowthFor,
  openGloamwoodEvolutionOffer,
  openGloamwoodNextEvolutionOffer,
  refreshGloamwoodEvolutionOffer,
  selectGloamwoodEvolutionCandidate,
  type GloamwoodEvolutionCandidate,
  type GloamwoodEvolutionState,
} from './gloamwood-3d-evolution'
import {
  GLOAMWOOD_BOSS,
  clampGloamwoodBossToArena,
  createGloamwoodBossState,
  damageGloamwoodBoss,
  startGloamwoodBoss,
  stepGloamwoodBoss,
  type GloamwoodBossState,
} from './gloamwood-3d-boss'
import { classifyGloamwoodRunPace, gloamwoodRunPaceVisible } from './gloamwood-3d-run'
import { deriveGloamwoodOnboardingStep, type GloamwoodOnboardingStep } from './gloamwood-3d-onboarding'
import { GloamwoodAudioBus, type GloamwoodAudioSnapshot, type GloamwoodSoundEvent } from './gloamwood-3d-audio'
import {
  DEFAULT_COMBAT_FEEDBACK_SETTINGS,
  cycleFeedbackVolume,
  normalizeCombatFeedbackSettings,
  type CombatFeedbackSettings,
} from './player-hit-feedback'
import {
  DEFAULT_GLOAMWOOD_INPUT_BINDINGS,
  GLOAMWOOD_INPUT_BINDINGS_STORAGE_KEY,
  formatGloamwoodInputCode,
  gloamwoodMovementBindingLabel,
  normalizeGloamwoodInputBindings,
  rebindGloamwoodInput,
  type GloamwoodInputAction,
  type GloamwoodInputBindings,
} from './gloamwood-input-settings'
import { assetUrl } from './asset-url'
import { ELITE_AFFIXES } from './elite-affixes'
import { gloamwoodThreatMark, gloamwoodThreatTier, gloamwoodUsesWorldTargetPlate, type GloamwoodThreatTier } from './gloamwood-threat-presentation'
import {
  createGloamwoodMeatDrop,
  gloamwoodMeatDropPosition,
  gloamwoodMeatOpacity,
  stepGloamwoodMeat,
  type GloamwoodMeatDrop,
} from './gloamwood-meat'
import {
  createGloamwoodGeneCore,
  stepGloamwoodGeneCores,
  type GloamwoodGeneCore,
  type GloamwoodGeneCoreSource,
} from './gloamwood-gene-core'
import {
  gloamwoodEliteBroodHealth,
  gloamwoodEliteBroodPositions,
  gloamwoodEliteBurstHits,
  type GloamwoodEliteBurst,
} from './gloamwood-elite'
import { gloamwoodOccludesCameraView } from './gloamwood-camera-occlusion'
import {
  gloamwoodHuntRhythmStopsAutoEngage,
  resolveGloamwoodHuntRhythm,
  type GloamwoodHuntRhythm,
} from './gloamwood-hunt-rhythm'
import { GLOAMWOOD_WEATHER_SEED_PARAM, resolveGloamwoodWeatherRunSeed } from './gloamwood-run-weather'
import {
  GLOAMWOOD_ECOLOGY_SEED_PARAM,
  resolveGloamwoodEcologyRunSeed,
  resolveGloamwoodValleyEcology,
} from './gloamwood-valley-ecology'
import { createGloamwoodMap, gloamwoodMapStep, type GloamwoodMapContract } from './gloamwood-map'
import { buildGloamwoodValleyScene } from './gloamwood-valley-scene'
import { createGloamwoodValleyMap } from './gloamwood-valley-map'
import type { GloamwoodValleyCreature } from './gloamwood-valley-creatures'
import { resolveGloamwoodValleyWeather, type GloamwoodValleyWeather } from './gloamwood-valley-weather'
import {
  gloamwoodValleyBossClipForPhase,
  gloamwoodValleyBossSpecFor,
} from './gloamwood-valley-boss'
import { gloamwoodBossFxFrame } from './gloamwood-boss-fx'
import type { GloamwoodBossFxEntry, GloamwoodBossFxScene } from './gloamwood-boss-fx-scene'
import { gloamwoodValleyCorpseGone } from './gloamwood-valley-respawn'
import {
  createGloamwoodValleyProgression,
  enterGloamwoodValleyRegion,
  GLOAMWOOD_VALLEY_MILESTONES,
  gloamwoodValleyMilestone,
  gloamwoodValleyEvolutionDue,
  gloamwoodValleyNextGate,
  gloamwoodValleyNextEvolution,
  gloamwoodValleyTerminalBossDefeated,
  holdGloamwoodValleyAtGate,
  recordGloamwoodValleyMilestone,
  resolveGloamwoodValleyBossDefeat,
  type GloamwoodValleyProgression,
} from './gloamwood-valley-progression'
import { GLOAMWOOD_VALLEY, gloamwoodValleyCorridorAt, gloamwoodValleyRegionAt } from './gloamwood-valley-terrain'
import {
  gloamwoodRunEarnedSomething,
  loadGloamwoodRunRecord,
  recordGloamwoodRun,
  saveGloamwoodRunRecord,
} from './gloamwood-run-record'
import {
  GLOAMWOOD_VALLEY_RADAR_NORTH_UP,
  gloamwoodValleyRadarLocalBranchEndpoints,
  gloamwoodValleyRadarLocalBranchPaths,
  gloamwoodValleyRadarLocalMarker,
  gloamwoodValleyRadarLocalMarkerAt,
  gloamwoodValleyRadarLocalPointAt,
  gloamwoodValleyRadarLocalRegionPath,
  gloamwoodValleyRadarLocalRiverPath,
  gloamwoodValleyRadarLocalRoutePath,
  type GloamwoodValleyRadarViewport,
} from './gloamwood-valley-radar'
import {
  gloamwoodPreyClipForPhase,
  gloamwoodPreyClipRate,
  gloamwoodPreyWalkRate,
  summariseGloamwoodPreyModelLoads,
  type GloamwoodModelledPreyConfig,
} from './gloamwood-modelled-prey'
import {
  GLOAMWOOD_ROCK_GRADE,
  GLOAMWOOD_TREE_GRADE,
  GLOAMWOOD_VEGETATION_GRADE,
  loadGloamwoodKitTemplate,
  type GloamwoodKitGrade,
} from './gloamwood-kit-loader'

const WORLD_HALF_WIDTH = 25
const WORLD_HALF_DEPTH = 18
const PLAYER_SPEED = 6.2
const GLOAMWOOD_BOSS_ARENA = { x: 0, z: 0, playerX: -6, playerZ: 3 } as const
const GLOAMWOOD_BOSS_ARENA_RADIUS = 4.2
/**
 * Start the current regional Boss body before it wakes, without asking the
 * opening scene to download and decode every later 4–7 MB Boss GLB.
 */
const GLOAMWOOD_BOSS_MODEL_PREFETCH_DISTANCE = 42
/**
 * How far the player may stray from the arena during an arena fight.
 *
 * The boss is clamped inside 4.2 and the player was clamped only to the world,
 * which is 50 by 36: walk far enough and the boss physically cannot follow, so
 * it stands at the arena edge and never attacks again. Knockback pushes the
 * player out a little on every hit, which is why the fight died late rather
 * than immediately.
 *
 * The bound has to keep the boss able to reach its own preferred range - it can
 * only close to `playerDistance - 4.2` - so anything past 8.02 strands it. 7.6
 * leaves margin and sits just inside the 7.8 radius props are cleared from, so
 * the wall never lands the player inside scenery.
 */
const GLOAMWOOD_ARENA_PLAYER_RADIUS = 7.6
/** Lives a run starts with. Reaching zero ends it. */
// Lives now belong to the map, which is the thing that knows how long it is.
const GLOAMWOOD_BOSS_ARENA_CLEAR_RADIUS = 7.8
const PLAYER_FEEDBACK_SETTINGS_KEY = 'evolution-arena-combat-feedback-v1'
/**
 * How far over 1.0 the additive skill-effect colours are pushed, per texture.
 *
 * Bloom thresholds against the linear buffer before tone mapping, so a hit
 * spark authored as `0xffe7a8` peaks at a luminance of 0.81 there and can never
 * glow, however hot it looks after ACES. These gains lift the two textures that
 * were already drawn as light rather than as matter. Dust, pebbles and plates
 * are not in this table and are never gained: debris that blooms is a bug
 * report.
 *
 * One gain for both was wrong, and the numbers say why. Measured as the peak
 * count of pixels over 0.9 luminance in a 432-wide frame, a rending-claws hit
 * reached 13 and never produced a single near-white pixel; the tail sweep at
 * the same gain reached 912, with 136 pixels over 0.97. Seventy times the lit
 * area, from the same multiplier.
 *
 * The difference is what each texture is. `glow` is a small point-like sprite
 * and there are six of them in a spark burst. `streak` is long and thin - 0.16
 * by 0.72 units - and the tail sweep fires *twelve* of them in a ring around
 * the body at once, all additive, all overlapping. Screen area, not colour, is
 * what decides how much light lands.
 */
export const SKILL_FX_LIGHT_GAIN = {
  /** Small, point-like: hit sparks and regeneration motes. */
  glow: 2.4,
  /** Long and thin, and fired a dozen at a time. */
  streak: 1.5,
} as const

/**
 * The scene's tone mapping exposure.
 *
 * Deliberately hot, and left alone by the bloom work. Lowering it was the first
 * attempt at making the composer path match the direct one, and it half worked:
 * it could restore the brightness but recovered only a third of the lost
 * saturation, because the actual culprit was fog rather than exposure. See
 * `bloomFogScale` on the map contract.
 */
export const GLOAMWOOD_EXPOSURE = 1.38

/**
 * The gene core's over-range colours, hoisted so they can be checked.
 *
 * Whether one of these actually glows is a question about a number - its
 * luminance against the bloom threshold - and answering it by looking at a
 * screenshot of a reward that only drops off an elite is far harder than
 * asserting it. `tests/gloamwood-bloom` does the arithmetic.
 */
export const GLOAMWOOD_GENE_CORE_LIGHT = {
  /** The orbiting motes. These are the part that has to read from a distance. */
  mote: [2.9, 1.75, 0.68],
  /** The inner hoop. */
  innerRing: [2.5, 1.62, 0.72],
  /** The outer hoop, deliberately dimmer so the two do not read as one band. */
  outerRing: [1.35, 0.82, 0.3],
  moteOpacity: 0.85,
} as const
export const GLOAMWOOD_3D_CHARACTER_HEIGHTS = [1.8, 2.16, 2.55] as const
const CAMERA_OFFSET = new THREE.Vector3(9.2, 11.8, 13.4)
const CAMERA_LOOK_HEIGHT = 0.92
const CAMERA_DAMPING = 5.8
const RUN_POSE_WEIGHT = 1
const IDLE_SUPPORT_WEIGHT = 1 - RUN_POSE_WEIGHT
export const GLOAMWOOD_3D_TURN_SPEED_RADIANS = 5.8
export const GLOAMWOOD_3D_MOVE_FACING_TOLERANCE_DEGREES = 6
export const GLOAMWOOD_3D_CAMERA_DISTANCE = CAMERA_OFFSET.length()
export const GLOAMWOOD_PLAYER_HIT_REACTION = {
  recoverySeconds: 0.46,
  chainedKnockbackMultiplier: 0.2,
  maximumDistance: 0.72,
  familyScale: { fang: 0.26, shell: 0.34, swarm: 0.08 },
} as const

/**
 * Form-specific world heights, applied instead of the stage default.
 *
 * The runtime normalises a model by height alone, so a low, long body scaled to
 * the 2.16 stage-1 height inflates in length and width. The Shell stage-1 form
 * measured 2.16 x 6.98 that way, against the Fang form's 1.56 x 3.99. Holding it
 * at the stage-0 height instead makes it 1.80 x 5.82: it never reads as
 * shrinking on evolution, and its growth is carried by roughly +48% length and
 * +5% width over stage 0 rather than by height, which suits an armoured form
 * that should get heavier rather than taller.
 */
const GLOAMWOOD_3D_FORM_WORLD_HEIGHTS: Partial<Record<Quality3DFormFamily, readonly number[]>> = {
  shell: [1.8, 1.8, 2.55],
}

export function gloamwoodCharacterWorldHeight(stage: number, family?: Quality3DFormFamily) {
  const index = stage >= 2 ? 2 : stage >= 1 ? 1 : 0
  return (family && GLOAMWOOD_3D_FORM_WORLD_HEIGHTS[family]?.[index]) ?? GLOAMWOOD_3D_CHARACTER_HEIGHTS[index]
}

function createMoultShellGeometries(side: 1 | -1) {
  const mesh = moultRhombusMeshData(side)
  const fill = new THREE.BufferGeometry()
  fill.setAttribute('position', new THREE.Float32BufferAttribute(mesh.positions, 3))
  fill.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normals, 3))
  fill.setAttribute('color', new THREE.Float32BufferAttribute(mesh.colors, 3))
  fill.setAttribute('moultAlpha', new THREE.Float32BufferAttribute(mesh.alphas, 1))
  const edges = new THREE.BufferGeometry()
  edges.setAttribute('position', new THREE.Float32BufferAttribute(mesh.edgePositions, 3))
  edges.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.edgeNormals, 3))
  edges.setAttribute('moultAlpha', new THREE.Float32BufferAttribute(mesh.edgeAlphas, 1))
  return { fill, edges }
}

function applyMoultHeightFade(material: THREE.MeshStandardMaterial) {
  material.customProgramCacheKey = () => 'moult-height-fade'
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float moultAlpha;\nvarying float vMoultAlpha;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMoultAlpha = moultAlpha;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vMoultAlpha;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * vMoultAlpha );')
  }
}

/**
 * True when the page was launched from a home-screen icon rather than a browser
 * tab. iOS reports this only through the non-standard `navigator.standalone`.
 */
function gloamwoodStandaloneDisplay() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

function gloamwoodPlayerCombatBodyRadius(stage: number, family?: Quality3DFormFamily) {
  const profile = getGloamwoodPlayerCollisionProfile(stage, family)
  const neutralRadius = profile.radius + Math.max(profile.frontOffset, profile.rearOffset)
  // The reserve exists so a leaping form does not land inside another body. The
  // Shell chain replaces Pounce with a planted Slam, so it reserves nothing.
  const stageOnePounceReserve = stage === 1 && family !== 'shell'
    ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.visualTravel * SCARLET_GECKO_PRESENTATION.combat.pounceVisualTravelScale
    : 0
  return neutralRadius + stageOnePounceReserve
}

/**
 * Which authored baseline describes the body actually on screen.
 *
 * Keyed by form, never by stage. Stage 1 now serves the Fang scarlet-gecko, the
 * Shell stone-pangolin and the Swarm spore-stalker, so a stage test answers for
 * whichever of the three it was written before.
 */
function gloamwoodFormBaseline(formId: string | undefined, stage: number) {
  const byForm = {
    'stone-pangolin': STONE_PANGOLIN_PRESENTATION,
    'spore-stalker': SPORE_STALKER_PRESENTATION,
    'basalt-bulwark': BASALT_BULWARK_PRESENTATION,
    'lantern-lynx': LANTERN_LYNX_PRESENTATION,
    'scarlet-hunter': SCARLET_HUNTER_PRESENTATION,
    'scarlet-gecko': SCARLET_GECKO_PRESENTATION,
  } as const
  const presentation = formId && formId in byForm ? byForm[formId as keyof typeof byForm] : undefined
  if (presentation) {
    return {
      baselineId: presentation.baselineId,
      artStyle: presentation.asset.artStyle,
      triangles: presentation.asset.triangles,
    }
  }
  if (stage >= 2) {
    return {
      baselineId: SCARLET_HUNTER_PRESENTATION.baselineId,
      artStyle: SCARLET_HUNTER_PRESENTATION.asset.artStyle,
      triangles: SCARLET_HUNTER_PRESENTATION.asset.triangles,
    }
  }
  return { baselineId: 'inherited-pbr-baseline', artStyle: 'pbr', triangles: 32_000 }
}

/**
 * One profile carries both the chain state machine's timings and the reach and
 * damage each step resolves at. They were separate lookups keyed on different
 * things, which is how a form could be given its own combo and still fight with
 * another form's numbers.
 */
interface GloamwoodCombatHitFeedback {
  biteDamage: number
  pounceDamage: number
  clawDamage: number
  tailSwipeDamage: number
  biteRange: number
  pounceRange: number
  clawRange: number
  tailSwipeRange: number
  flashSeconds: number
  cameraTrauma: number
  knockbackSpeed: number
  particleCount: number
}

type GloamwoodCombatProfile = FormalHuntBasicAttackProfile & {
  hitFeedback: GloamwoodCombatHitFeedback
}

/**
 * The combat authority for the body actually on screen.
 *
 * Every produced form is named. Stage is only the fallback for the
 * route-independent late-stage endpoints, which have no profile of their own.
 *
 * The named branches are not decoration. `stage >= 2` used to answer for the
 * Fang hunter by position, which meant the next form to reach stage 2 - the
 * Shell line's, already contracted - would have silently fought with the
 * hunter's damage, reach and timings, and inherited a `Pounce` step a plated
 * body has no clip for. That exact defect already shipped once on Shell stage 1
 * and was only found in play. `matchedForm` is reported in debug state for the
 * same reason `matchedFamily` is: a body running another form's authority
 * should be visible, not silent.
 */
/**
 * Presentation for a form, or undefined when the form declares none.
 *
 * The route-independent late-stage endpoints have no presentation of their own;
 * everything the player can currently evolve into does.
 */
function gloamwoodFormPresentation(formId: string | undefined) {
  const byForm = {
    'spore-stalker': SPORE_STALKER_PRESENTATION,
    'stone-pangolin': STONE_PANGOLIN_PRESENTATION,
    'basalt-bulwark': BASALT_BULWARK_PRESENTATION,
    'lantern-lynx': LANTERN_LYNX_PRESENTATION,
    'scarlet-hunter': SCARLET_HUNTER_PRESENTATION,
    'scarlet-gecko': SCARLET_GECKO_PRESENTATION,
    'coral-gecko': CORAL_GECKO_PRESENTATION,
  } as const
  return formId && formId in byForm ? byForm[formId as keyof typeof byForm] : undefined
}

/**
 * Playback rate for one attack clip on the body actually on screen.
 *
 * This read `SCARLET_HUNTER_PRESENTATION.combat.attackPlaybackRate` for **every
 * form**, so the Fang stage-2 hunter's rates drove the coral gecko, both stage-1
 * bodies and the Shell stage-2 body, and any rate a form authored for itself was
 * dead data. Forms that declare none still fall back to that table, so the four
 * accepted forms which never declared one keep exactly the rate they ship with
 * today - this makes the value reachable, it does not retune anything.
 */
/**
 * Upper bound on fitting a strike clip into its window.
 *
 * The worst offenders need about 1.8x. Beyond 2x a strike stops reading as a
 * blow and starts reading as a stutter, and the right fix there is a shorter
 * clip rather than faster playback.
 */
export const GLOAMWOOD_ATTACK_FIT_CEILING = 2

/**
 * The fitting rule, as a pure function so it can be measured against the real
 * shipped clips rather than only exercised through a live scene.
 */
export function gloamwoodFittedAttackPlaybackRate(
  declaredRate: number,
  clipDurationSeconds: number,
  windowSeconds: number,
) {
  if (!(clipDurationSeconds > 0) || !(windowSeconds > 0)) return declaredRate
  return Math.min(GLOAMWOOD_ATTACK_FIT_CEILING, Math.max(declaredRate, clipDurationSeconds / windowSeconds))
}

function gloamwoodFormAttackPlaybackRate(formId: string | undefined, name: string) {
  const declared = (gloamwoodFormPresentation(formId)?.combat as {
    attackPlaybackRate?: Readonly<Record<string, number>>
  } | undefined)?.attackPlaybackRate
  const own = declared?.[name]
  if (own !== undefined) return own
  const inherited = (SCARLET_HUNTER_PRESENTATION.combat.attackPlaybackRate as Readonly<Record<string, number>>)[name]
  return inherited ?? 1
}

export function gloamwoodFormCombatProfile(formId: string | undefined, stage: number): {
  profile: GloamwoodCombatProfile
  matchedForm: boolean
} {
  const byForm = {
    'spore-stalker': SPORE_STALKER_PRESENTATION,
    'stone-pangolin': STONE_PANGOLIN_PRESENTATION,
    'basalt-bulwark': BASALT_BULWARK_PRESENTATION,
    'lantern-lynx': LANTERN_LYNX_PRESENTATION,
    'scarlet-hunter': SCARLET_HUNTER_PRESENTATION,
    'scarlet-gecko': SCARLET_GECKO_PRESENTATION,
    'coral-gecko': CORAL_GECKO_PRESENTATION,
  } as const
  const presentation = formId && formId in byForm ? byForm[formId as keyof typeof byForm] : undefined
  if (presentation) return { profile: presentation.combat, matchedForm: true }
  const profile = stage >= 2
    ? SCARLET_HUNTER_PRESENTATION.combat
    : stage >= 1
      ? SCARLET_GECKO_PRESENTATION.combat
      : CORAL_GECKO_PRESENTATION.combat
  return { profile, matchedForm: false }
}

interface DustParticle {
  sprite: THREE.Sprite
  velocity: THREE.Vector3
  age: number
  duration: number
  active: boolean
  startScale: number
}

type FeedbackTextureKind =
  | 'slash'
  | 'glow'
  | 'spore'
  | 'shard'
  | 'carapace'
  | 'moult'
  | 'metabolism'
  | 'regeneration'

/**
 * Mutation reactions and rending claws spawn skill particles.
 * Tail sweep dust/gravel is generated in `gloamwood-mutation-fx.ts`.
 */
const FEEDBACK_TEXTURE_ASSET_PATHS: Partial<Record<FeedbackTextureKind, string>> = {}

interface FeedbackSprite {
  sprite: THREE.Sprite
  velocity: THREE.Vector3
  age: number
  duration: number
  /** Rending marks draw outward; ordinary feedback expands with a fast ease-out. */
  growthStyle: 'ease-out' | 'tear'
  startScale: THREE.Vector2
  endScale: THREE.Vector2
  rotationSpeed: number
  peakOpacity: number
}

/**
 * A rending mark is deliberately built from actual lit geometry, not a
 * camera-facing card. The three claws draw forward in sequence, then shed
 * physical chitin sparks that arc down to the ground. It is presentation only:
 * combat has already confirmed the hit before this list is touched.
 */
interface RendingParticle {
  mesh: THREE.Mesh
  material: THREE.MeshStandardMaterial
  velocity: THREE.Vector3
  spin: THREE.Vector3
  age: number
  delay: number
  duration: number
  kind: 'spark'
}

/** A shader-generated wound surface; no bitmap or sprite is involved. */
interface RendingSurface {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  material: THREE.ShaderMaterial
  age: number
  duration: number
}

/** Additive skill particles. Presentation only. */
interface MutationParticle {
  object: THREE.Object3D
  material: THREE.SpriteMaterial | THREE.MeshBasicMaterial | THREE.ShaderMaterial | THREE.MeshStandardMaterial
  velocity: THREE.Vector3
  spin: number
  age: number
  duration: number
  gravity: number
  motion: MutationFxMotion
  peakOpacity: number
  startScale: THREE.Vector2
  endScale: THREE.Vector2
  attractTarget: THREE.Vector3
}

/** A rare pickup has a compact, bounded presentation bundle rather than a post-process. */
interface GeneCoreVisual {
  root: THREE.Group
  crystal: THREE.Mesh
  halo: THREE.Mesh
  rings: THREE.Mesh[]
  motes: THREE.Mesh[]
}

interface PreyVisual {
  root: THREE.Group
  body: THREE.Group
  materials: THREE.MeshStandardMaterial[]
  /** Set only when a modelled body replaced the primitive assembly. */
  model?: {
    config: GloamwoodModelledPreyConfig
    mixer: THREE.AnimationMixer
    clips: Map<string, THREE.AnimationClip>
    action?: THREE.AnimationAction
    clipName?: string
    previousPhase?: GloamwoodPreyPhase
    /** Last frame's position, so the walk cycle can follow real ground speed. */
    lastX?: number
    lastZ?: number
  }
  telegraph: THREE.Mesh
  targetRing: THREE.Mesh
  flashRemaining: number
  impactRemaining: number
  impactDuration: number
  impactStrength: number
}

type GloamwoodRunPhase = 'hunt' | 'evolution' | 'guardian' | 'boss' | 'victory' | 'defeat'

interface BossVisual {
  root: THREE.Group
  body: THREE.Group
  materials: THREE.MeshStandardMaterial[]
  /** Set only when a modelled boss replaced the primitive assembly. */
  model?: {
    config: GloamwoodModelledBossConfig
    mixer: THREE.AnimationMixer
    clips: Map<string, THREE.AnimationClip>
    current?: THREE.AnimationAction
    currentName?: string
    previous?: { state: GloamwoodBossState['state']; pattern: GloamwoodBossState['pattern'] }
  }
  targetRing: THREE.Mesh
  telegraph: THREE.Mesh
  innerTelegraph: THREE.Mesh
  chargeTelegraph: THREE.Mesh
}

interface DebugState {
  scene: 'gloamwood-3d-rebuild'
  deprecatedMapLab4: true
  renderer: 'three-webgl'
  stage: number
  model: string
  modelReady: boolean
  /** Route the player evolved into, and whether that route has its own body yet. */
  characterFamily: string
  characterFamilyMatched: boolean
  /** Whether the body on screen has its own combat authority or borrowed one. */
  combatProfileMatchedForm: boolean
  presentation: { baselineId: string; artStyle: string; triangles: number; modelUrl: string }
  activeClip: string
  attack: { visualOffset: number; liftOffset: number; pitchDegrees: number; yawDegrees: number; elapsedSeconds: number; leapBitePhase: string; landingEvents: number }
  moving: boolean
  grounded: boolean
  locomotion: {
    runPoseWeight: number
    idleSupportWeight: number
    additiveLegRotationDegrees: 0
    turning: boolean
    facingErrorDegrees: number
    moveFacingToleranceDegrees: number
    footstepEvents: number
    activeDustParticles: number
    activeActionWeights: Record<string, number>
  }
  player: { x: number; y: number; z: number; speed: number }
  collision: {
    profile: { radius: number; frontOffset: number; rearOffset: number }
    contacts: number
    closestObstacleId: string | null
    minimumClearance: number
    entityMinimumClearance: number
    actionSpaceClearance: number
    preyPairClearance: number
  }
  combat: {
    targetLocked: boolean
    playerHealth: number
    enemyHealth: number
    enemyPhase: string
    targetId: string | null
    targetKind: GloamwoodPreyKind | null
    comboAction: string
    skillsEnabled: false
    lockAssist: 'stable-wave-and-attacker'
    knockbackRecoverySeconds: number
    lastKnockbackDistance: number
  }
  nest: {
    phase: string
    wave: number
    remaining: number
    kills: number
    biomass: number
    genes: { fang: number; shell: number; swarm: number }
    maximumActivePrey: number
  }
  evolution: {
    phase: GloamwoodEvolutionState['phase']
    seed: number
    refreshesRemaining: number
    candidateIds: string[]
    mutationIds: string[]
    selectedId: string | null
    selectedFamily: string | null
    modifiers: GloamwoodEvolutionCandidate['modifiers'] | null
  }
  run: { phase: GloamwoodRunPhase; elapsedSeconds: number; deaths: number }
  /** Live river-valley route state; null in the focused Gloamwood combat lab. */
  valley: {
    region: string | null
    progress: string[]
    entered: string[]
    gateIndex: number | null
    evolutionsTaken: number
  } | null
  onboarding: { phase: GloamwoodOnboardingStep['phase']; step: number; totalSteps: number; title: string }
  settings: { paused: boolean; shake: boolean; flash: boolean; volume: number; muted: boolean }
  audio: GloamwoodAudioSnapshot & { lastEvent: GloamwoodSoundEvent | null; eventCount: number; recentEvents: GloamwoodSoundEvent[] }
  visualFeedback: { activeSprites: number; activeParticles: number; activeDecals: number; sporeHaze: number; sporeMistDrop: number; slowAuraRadius: number }
  input: { bindings: GloamwoodInputBindings; rebinding: GloamwoodInputAction | null }
  performance: {
    fps: number
    averageFrameMs: number
    p95FrameMs: number
    sampleCount: number
    run: GloamwoodRunPerformanceReport
    drawCalls: number
    triangles: number
    geometries: number
    textures: number
    jsHeapMegabytes: number | null
    viewport: { width: number; height: number; pixelRatio: number }
  }
  boss: { active: boolean; state: string; pattern: string; phase: number; health: number; maxHealth: number; x: number; z: number; locked: boolean }
  /** Modelled prey bodies loaded, and per creature the clip it is actually on. */
  frames: number
  keysHeld: string[]
  frozenBy: string | null
  preyModels: number
  /** Meat lying on the ground, so a kill that fed nobody is visible. */
  meatDrops: number
  /** Unclaimed Elite/Boss Gene Cores; confirms reward collection in browser QA. */
  geneCores: number
  preyModelError: string | null
  /**
   * Which authored body the boss is wearing, and the clip it is playing.
   *
   * `bossModel` is null while it wears its primitive assembly, which is both
   * the pre-model behaviour and the fallback when the GLB fails. Reported so a
   * boss silently running on primitives is visible rather than something a
   * reviewer has to notice by eye - the same reason `matchedForm` exists for
   * player bodies.
   */
  bossModel: string | null
  bossClip: string | null
  bossModelError: string | null
  /**
   * The altar defence run, when that is the map.
   *
   * Reported because the two things this mode is decided by - which wave is out
   * and how the altar is holding - are both invisible in a screenshot until the
   * moment the run ends.
   */
  defence: {
    phase: string
    wave: number
    waves: number
    altarHealth: number
    altarMaxHealth: number
  } | null
  prey: Array<{
    id: string
    kind: GloamwoodPreyKind
    health: number
    phase: string
    x: number
    z: number
    clip: string | null
    clipTime: number
    /**
     * How many meshes are actually in this creature's body, and where the
     * ground put it.
     *
     * A creature whose name and health bar are on screen with nothing drawn
     * under them is indistinguishable, from outside, from one standing behind a
     * bush. These two say which: no meshes means the body never mounted, and a
     * height far from its neighbours' means it is inside the terrain.
     */
    bodyMeshes: number
    y: number
  }>
  camera: { fov: number; pitch: number; distance: number }
  world: {
    geometry: 'real-3d'
    groundMeshes: number
    environmentKit: string
    undergrowthInstances: number
    trees: number
    rocks: number
    defenceProps: number
    defenceGroundVertices: number
    bloom: boolean
    shrinePieces: number
    collisionObstacles: number
    weather: string
    weatherSeed: string
    ecology: string
    ecologySeed: string
    flatBackdrop: false
  }
}

export function isGloamwood3DHuntRequested(search = window.location.search) {
  const params = new URLSearchParams(search)
  return params.get('maplab') === '5'
    || params.get('world3d') === '1'
    || (params.get('maplab') === '4' && params.get('live') === '1')
}

export async function launchGloamwood3DHunt(mapId: GloamwoodMapId = gloamwoodMapFromEntry()) {
  const container = document.querySelector<HTMLElement>('#game-container')
  if (!container) throw new Error('Missing #game-container for Gloamwood 3D hunt')
  document.body.classList.add('is-maplab', 'is-v4-live', 'is-gloamwood-3d')
  // English is the primary market, so the locale is resolved from the browser
  // before any player-facing string is built. ?lang=en|zh overrides for testing.
  applyDocumentLocale()
  document.title = t('document.title')
  const experience = new Gloamwood3DHunt(container, mapId)
  if (import.meta.env.DEV) {
    // Lets a review surface with no animation frames drive the loop and read
    // the state that results, rather than reading a snapshot frozen at startup.
    ;(window as unknown as Record<string, unknown>).__gloamwoodStep =
      (frames?: number, delta?: number) => experience.stepFramesForReview(frames, delta)
    // Bloom judged by eye needs the same frame twice, not two runs a few
    // seconds apart: creatures move, foliage sways, and the difference those
    // make to the picture is larger than the effect being judged.
    ;(window as unknown as Record<string, unknown>).__gloamwoodBloom =
      (enabled: boolean, settings?: Partial<GloamwoodBloomSettings>, exposureScale?: number) =>
        experience.setBloomForReview(enabled, settings, exposureScale)
    ;(window as unknown as Record<string, unknown>).__gloamwoodFog =
      (density?: number) => experience.fogDensityForReview(density)
    ;(window as unknown as Record<string, unknown>).__gloamwoodFxGain =
      (scale: number) => experience.skillFxGainForReview(scale)
  }
  try {
    await experience.start()
  } catch (error) {
    experience.dispose()
    throw error
  }
  return () => experience.dispose()
}

class Gloamwood3DHunt {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(44, 16 / 9, 0.1, 130)
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  private readonly loader = new GLTFLoader()
  private readonly playerRoot = new THREE.Group()
  private readonly characterRoot = new THREE.Group()
  private readonly target = new THREE.Vector3(-6, 0, 3)
  private readonly movement = new THREE.Vector3()
  /** Separate from layout and evolution so restarting a hunt changes ecology. */
  private readonly ecologyRunSeed = resolveGloamwoodEcologyRunSeed(
    new URLSearchParams(window.location.search).get(GLOAMWOOD_ECOLOGY_SEED_PARAM),
    () => window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  )
  private readonly ecology = resolveGloamwoodValleyEcology(this.ecologyRunSeed)
  private readonly desiredCamera = new THREE.Vector3()
  private readonly keys = new Set<string>()
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly obstacles: GloamwoodCircleObstacle[] = []
  private readonly trees: Array<{ group: THREE.Group; x: number; y: number; z: number; radius: number }> = []
  private readonly treeTemplates = new Map<string, THREE.Group>()
  private readonly rockTemplates = new Map<string, THREE.Group>()
  private readonly vegetationTemplates = new Map<GloamwoodVegetationLayer, THREE.Group>()
  private undergrowthInstances = 0
  private readonly foliageTime = { value: 0 }
  private readonly actions = new Map<string, THREE.AnimationAction>()
  private readonly tailNodes: THREE.Object3D[] = []
  /**
   * Mutation silhouette pieces are attached only to authored model nodes. They
   * are deliberately kept separate from the GLB so a body reload can remove
   * them without mutating shared model data.
   */
  private readonly mutationBodyAttachments: THREE.Object3D[] = []
  private sporeHaze: {
    root: THREE.Group
    /** A ground-following disc; its vertex heights are refreshed as it moves. */
    mist: {
      mesh: THREE.Mesh
      geometry: THREE.BufferGeometry
      material: THREE.ShaderMaterial
      lift: number
    }
    /** One mesh holding every spore; the cloud is animated in its shader. */
    motes: {
      mesh: THREE.Mesh
      geometry: THREE.BufferGeometry
      material: THREE.ShaderMaterial
    }
    texture: THREE.CanvasTexture
    previewBoost: number
    /** Where the heights were last sampled, so a standing player costs nothing. */
    centre: THREE.Vector2
  } | null = null
  private readonly sporeHazePlane = new THREE.PlaneGeometry(1, 1)
  private readonly shadowMaterials: THREE.MeshBasicMaterial[] = []
  private readonly nestRoot = new THREE.Group()
  private readonly preyVisuals = new Map<string, PreyVisual>()
  private preyModelError?: string
  private defenceScene?: Awaited<ReturnType<typeof buildGloamwoodDefenceScene>>
  private wardenBodyRequested = false
  private bossModelError?: string
  /**
   * The ground this run is played on.
   *
   * Read through a contract rather than off a module function, so the same
   * runtime can be handed a different map. Behaviour on the Gloamwood is
   * unchanged - the contract wraps the functions that were already there.
   */
  /**
   * The ground this run is played on.
   *
   * Chosen from the URL, because a map is a property of the run rather than of
   * the build. Everything downstream reads it through the contract, so the
   * player, the combat, the mutations, the HUD and the session log are the same
   * on either one.
   */
  /**
   * The ground this run is played on.
   *
   * Assigned in the constructor rather than declared with an initialiser,
   * because the map is now chosen by the player on the way in rather than read
   * out of the URL from in here. Everything downstream still goes through the
   * contract, so the player, the combat, the mutations, the HUD and the session
   * log are the same on either one.
   */
  private readonly map: GloamwoodMapContract
  /**
   * The map's progression is authoritative for gates and checkpoint lives.
   * Mutation state records the same opaque milestone ids, but it cannot own
   * these rules: a mutation offer being visible must never be what opens a
   * gate. Keeping both states explicit makes that boundary inspectable.
   */
  private valleyProgression: GloamwoodValleyProgression = createGloamwoodValleyProgression()
  /** Set in the constructor, because it is the map's and the map is a parameter. */
  private readonly cameraOffset = new THREE.Vector3()
  /**
   * Creatures the player hit since the last creature step.
   *
   * The aggro layer wakes whatever is struck, and it can only do that if it is
   * told. Wired as an empty array when the map contract went in, which left
   * every passive creature in the valley taking hits without ever looking up.
   */
  private readonly struckThisFrame: string[] = []
  /**
   * The boss telegraphs and impacts, drawn from state the authority already
   * decided. Empty on a map with no bosses, and its own module so that nothing
   * in the damage path can reach it.
   */
  /**
   * Boss ground tells are pure presentation and are only needed once a regional
   * Boss actually begins a telegraph. Keeping the renderer out of the opening
   * module gets the first hunt on screen earlier without changing authority.
   */
  private bloom?: GloamwoodBloomPipeline
  /** Review-only multiplier on the skill FX gains, so they can be swept live. */
  private skillFxGainScale = 1
  private bossFx?: GloamwoodBossFxScene
  private bossFxLoad?: Promise<void>
  private bossFxUnavailable = false
  /**
   * What each boss was doing last frame, kept for the effects alone.
   *
   * The clip selector keeps its own copy on the model and has already advanced
   * it by the time the effects are built - reading that one would mean the
   * impact never registers as new and the screen never shakes.
   */
  private readonly bossFxPhase = new Map<string, GloamwoodNestPrey['phase']>()
  /** Each Elite/Boss gets one arrival sting when authority first wakes it. */
  private readonly announcedThreats = new Set<string>()
  private snapCameraNextFrame = false
  /**
   * Where the map decided the player comes back, held until they do.
   *
   * One authority answers "where does a death put you", and it answers once -
   * when the life is spent. Coming back alive is a clock running out, not a
   * second chance to decide the question.
   */
  private respawnAt: { x: number; z: number } | null = null
  private deathOverlay?: HTMLElement
  private valleyGroundHeight: ((x: number, z: number) => number) | null = null
  private valley: { update(camera: { x: number; z: number }, elapsed: number, delta: number): void; weather: GloamwoodValleyWeather } | null = null
  // Keyed by body rather than by family. One family can wear several bodies -
  // a hunter and a grazer, a pack member and the elite promoted from it - and
  // keying by family silently loaded whichever came last.
  private readonly preyTemplates = new Map<string, { scene: THREE.Group; clips: THREE.AnimationClip[]; config: GloamwoodModelledPreyConfig }>()
  /** One GLB request per body, even while nearby-Boss checks run every frame. */
  private readonly preyTemplateLoads = new Map<string, Promise<void>>()
  /** A missing body stays on its deliberate primitive fallback without retry spam. */
  private readonly unavailablePreyTemplates = new Set<string>()
  /** Short-lived painterly hit feedback. It never participates in combat authority. */
  private readonly feedbackSprites: FeedbackSprite[] = []
  private readonly feedbackTextures = new Map<FeedbackTextureKind, THREE.Texture>()
  /** 3D-only rending feedback. Kept separate from the legacy sprite pool. */
  private readonly rendingParticles: RendingParticle[] = []
  private readonly rendingSurfaces: RendingSurface[] = []
  private readonly rendingGeometries = {
    spark: new THREE.TetrahedronGeometry(0.11, 0),
  }
  private readonly mutationParticles: MutationParticle[] = []
  private readonly skillFxTextures = new Map<SkillFxTextureKind, THREE.CanvasTexture>()
  private rendingScratchTexture: THREE.CanvasTexture | null = null
  private tailSweepHaloTexture: THREE.CanvasTexture | null = null
  private metabolicChevronTexture: THREE.CanvasTexture | null = null
  private metabolicPreviewDecayIn = 0
  /**
   * The always-on half of Starving Metabolism.
   *
   * The chevrons this mutation already had were one-shot bursts on a gain or a
   * decay tick, so the animal looked completely ordinary for the 29 seconds in
   * between - and the mutation is not an event, it is a trade the player is
   * paying for continuously.
   */
  private metabolicEmber: {
    root: THREE.Group
    veins: THREE.Mesh[]
    materials: THREE.MeshBasicMaterial[]
  } | null = null
  private readonly skillFxPlane = new THREE.PlaneGeometry(1, 1)
  private readonly tailSweepShock = new THREE.RingGeometry(1.52, 2.1, 64)
  /** Unit hex prism. Y is thickness; scaled per plate. */
  private readonly carapacePlate = new THREE.CylinderGeometry(0.5, 0.5, 1, 6)
  /** Faceted rhombus half-shells. Packed tiles, not scattered ornaments. */
  private readonly moultHuskLeft = createMoultShellGeometries(-1)
  private readonly moultHuskRight = createMoultShellGeometries(1)
  private readonly carapaceUp = new THREE.Vector3(0, 1, 0)
  private readonly carapaceOutward = new THREE.Vector3()
  private readonly metabolicFace = new THREE.Vector3(0, 0, 1)
  private readonly tailSweepBounds = new THREE.Box3()
  private readonly tailSweepMeshBounds = new THREE.Box3()
  private readonly tailSweepSize = new THREE.Vector3()
  /** Standing visual half-width. Cached so a spinning tail cannot inflate the ring. */
  private playerVisualGroundRadius = 1.48
  /** Debug previews linger; ordinary confirmed combat effects keep their tuned timing. */
  private feedbackDurationMultiplier = 1
  private readonly dustParticles: DustParticle[] = []
  private readonly footstepState = createGloamwoodFootstepState()
  private nestState: GloamwoodNestState
  private playerCombat: GloamwoodPlayerCombatState = createGloamwoodPlayerCombatState()
  private attackState: FormalHuntBasicAttackState = createFormalHuntBasicAttackState()
  private combatProfile: GloamwoodCombatProfile = CORAL_GECKO_PRESENTATION.combat
  private evolutionState: GloamwoodEvolutionState
  private evolutionOverlay?: HTMLElement
  private evolutionAccent?: THREE.Group
  private bossState: GloamwoodBossState = createGloamwoodBossState(GLOAMWOOD_BOSS_ARENA.x, GLOAMWOOD_BOSS_ARENA.z)
  private bossVisual?: BossVisual
  private bossLocked = false
  private runPhase: GloamwoodRunPhase = 'hunt'
  private runStartedAt = performance.now()
  private runDeaths = 0
  /**
   * Lives left this run.
   *
   * Playtest, 2026-08-18: the run was cleared in two and a half minutes with
   * two thirds of the player's health after several deaths, because a death
   * cost nothing at all - prey were repositioned and every point of biomass,
   * gene and mutation was kept. A roguelite's pull is "I died there, so next
   * run I go another way", and there is no first half of that sentence while
   * dying is free.
   *
   * Three is deliberately forgiving. The point is that the number can reach
   * zero, not that it usually does.
   */
  private livesRemaining: number
  private resultOverlay?: HTMLElement
  /** Ids unlocked by the run that just ended, for the result panel. */
  private earnedThisRun: string[] = []
  /**
   * Modifiers granted by the one form evolution. Mutations stack on top of
   * these rather than replacing them, so both are folded in one place -
   * `applyProgressionModifiers()` - and nothing else writes them.
   */
  private evolutionModifiers = {
    damageMultiplier: 1, moveSpeedMultiplier: 1, damageReduction: 0,
    biomassMultiplier: 1, killHeal: 0, maximumHealthBonus: 0, flatArmour: 0,
  }
  /** How many evolutions this run has taken. The valley grants more than one. */
  private evolutionsTaken = 0
  private damageMultiplier = 1
  private moveSpeedMultiplier = 1
  private damageReduction = 0
  /** Points taken off every blow, earned by growing rather than by route. */
  private flatArmour = 0
  /**
   * Toxic bursts left by dying elites, waiting to go off.
   *
   * The affix computed its burst, the damage gate returned it, and nothing read
   * it - so the Volatile elite, which is the affix both of the first two carry,
   * did precisely nothing. Its whole design is a parting shot you have to step
   * away from, and it was a bigger health bar.
   */
  /**
   * Meat left by kills, waiting to be walked over.
   *
   * The valley had no way to recover health between fights: whatever the road
   * cost, the boss fight started with. A playtest arrived at the first gate on
   * a third of a bar, which no amount of boss tuning would have saved.
   */
  private meatDrops: GloamwoodMeatDrop[] = []
  private meatVisuals = new Map<string, THREE.Mesh>()
  private meatSequence = 0
  /** Optional Elite and regional Boss rewards, collected by moving over them. */
  private geneCores: GloamwoodGeneCore[] = []
  private geneCoreVisuals = new Map<string, GeneCoreVisual>()
  private geneCoreSequence = 0
  /** Boss milestones wait here while their physical reward is still on ground. */
  private pendingBossCoreMilestones = new Set<string>()
  private eliteBursts: Array<{
    burst: GloamwoodEliteBurst
    elapsed: number
    resolved: boolean
    mesh: THREE.Mesh
  }> = []
  private biomassMultiplier = 1
  private killHeal = 0
  private mutationState: GloamwoodMutationState = createGloamwoodMutationState('gloamwood-first-run')
  private mutationEffects: GloamwoodMutationEffects = {}
  private mutationOverlay?: HTMLElement
  /** Kills counted toward Gluttony's bonus offer, reset each time it pays out. */
  private killsTowardBonusOffer = 0
  /** Bonus offers Gluttony has bought, added to the biomass-earned count. */
  private bonusOffersEarned = 0
  private mutationOffersTaken = 0
  /** Runs once the current mutation panel is answered, if anything was waiting. */
  private afterMutationChoice?: () => void
  /**
   * Observation only, never a decision.
   *
   * Every runtime defect so far was spotted by a person watching and then
   * diagnosed by simulation, and one of those simulations was wrong. A recording
   * takes the guessing out of the second half.
   */
  private readonly sessionLog = new GloamwoodSessionLog()
  private sessionSampleAt = 0
  private sessionRunPhase = 'hunt'
  private healthDecayElapsed = 0
  private reviveUsed = false
  private stage = 0
  /** Gene family whose body the player currently wears; undefined before evolving. */
  private characterFamily?: Quality3DFormFamily
  /** False when the route had no authored model and borrowed another family's. */
  private characterFamilyMatched = true
  /** False when the body on screen is running another form's combat authority. */
  private combatProfileMatchedForm = true
  /** Form id of the body on screen, so clip timing can be keyed on it. */
  private characterFormId?: string
  private lockedPreyId: string | null = null
  private primaryHeld = false
  /**
   * Standing order to close on the locked target and keep swinging.
   *
   * It only automates distance and repetition. The approach runs along the
   * player's current bearing rather than pathing to the nearest reachable face,
   * because walking to the closest point would deliver them onto the Carapace
   * family's armoured front - the one angle the guide tells them to avoid.
   * Angle stays a manual decision; steering cancels the automation but keeps
   * the lock, so flanking costs no extra input.
   */
  private autoEngageTargetId: string | null = null
  private touchMoveX = 0
  private touchMoveZ = 0
  private movementInputStrength = 0
  private hitStopRemaining = 0
  private cameraTrauma = 0
  private playerFlashRemaining = 0
  private knockbackRecoverySeconds = 0
  private lastKnockbackDistance = 0
  // The opening line depends on what the map opens with. On the Gloamwood that
  // is a nest to walk into; in the valley it is a road with things living
  // beside it, and telling the player to approach a nest that does not exist is
  // the first thing they read.
  private combatMessage: string
  private hud?: HTMLElement
  private onboardingHud?: HTMLElement
  private settingsPanel?: HTMLElement
  private orientationGate?: HTMLElement
  private fullscreenToggle?: HTMLButtonElement
  private homeScreenTip?: HTMLElement
  private damageLayer?: HTMLElement
  private targetBar?: HTMLElement
  private bossPlate?: HTMLElement
  private altarPlate?: HTMLElement
  /**
   * Floating damage readouts. Pure presentation: each entry is spawned from an
   * already-resolved authoritative result and never feeds back into combat.
   */
  private readonly damageNumbers: { element: HTMLElement; world: THREE.Vector3; life: number; duration: number; drift: number }[] = []
  private onboardingAttackStarted = false
  /**
   * A short quiet opening lets a new player read the one small guide and find
   * the controls before a nearby pack can make its first choice for them.
   * Striking still wakes a creature immediately, so this never trivialises a
   * fight or creates a free opening hit.
   */
  private valleyOpeningSafetySeconds = 18
  private feedbackSettings: CombatFeedbackSettings = { ...DEFAULT_COMBAT_FEEDBACK_SETTINGS }
  private readonly audio: GloamwoodAudioBus
  private readonly performanceSampler = new GloamwoodPerformanceSampler()
  /**
   * The whole run's cost, kept beside the rolling sampler rather than instead
   * of it. The sampler answers "how is it going"; this answers "did this device
   * hold up", which is the Goal 5 question and the one still unanswered.
   */
  private readonly runPerformance = new GloamwoodRunPerformance()
  private paused = false
  private pauseStartedAt = 0
  private lastSoundEvent: GloamwoodSoundEvent | null = null
  private soundEventCount = 0
  private readonly recentSoundEvents: GloamwoodSoundEvent[] = []
  private inputBindings: GloamwoodInputBindings = { ...DEFAULT_GLOAMWOOD_INPUT_BINDINGS }
  private rebindingAction: GloamwoodInputAction | null = null
  private mixer?: THREE.AnimationMixer
  private activeClip = 'Loading'
  private character?: THREE.Object3D
  private ground?: THREE.Mesh
  private disposed = false
  private modelReady = false
  private moving = false
  private turning = false
  private facingErrorDegrees = 0
  private runBlend = 0
  private locomotionPhase = 0
  private stopSettle = 0
  private locomotionImpact = 0
  private footstepEvents = 0
  private dustSequence = 0
  private lastFacing = Math.PI
  private attackUntil = 0
  private attackStartedAt = 0
  private attackDurationSeconds = 0
  private leapBiteLandingResolved = false
  private leapBiteLandingEvents = 0
  private animationFrame = 0
  private lastFrameAt = performance.now()
  /**
   * Frames run, and keys currently held.
   *
   * "Nothing responds" has two causes that look identical from outside - a loop
   * that has stopped, and input that never arrives - and no screenshot can tell
   * them apart. These two numbers can.
   */
  private frameCount = 0
  private treeCount = 0
  private rockCount = 0
  private shrinePieces = 0
  private collisionContacts = 0
  private debugOutput?: HTMLOutputElement
  private mutationLab?: HTMLElement
  private debugLive?: HTMLElement
  private defenceRadar?: {
    root: HTMLElement
    player: SVGElement
    altar: SVGElement
    portal: SVGElement
    prey: SVGElement
    label: HTMLElement
    toView(x: number, z: number): { x: number; y: number }
  }
  private valleyRadar?: {
    root: HTMLElement
    player: SVGElement
    arrow: SVGElement
    objective: SVGElement
    elite: SVGElement
    label: HTMLElement
    route: SVGPathElement
    river: SVGPathElement
    regions: SVGPathElement[]
    branches: SVGPathElement[]
    branchNodes: SVGCircleElement[]
    gates: SVGPathElement[]
    terrainX: number
    terrainZ: number
    nextTerrainUpdateAt: number
  }
  /** Generated once for a new run; query-string seeds remain reproducible. */
  private readonly weatherRunSeed: string
  private readonly container: HTMLElement

  constructor(container: HTMLElement, mapId: GloamwoodMapId) {
    this.container = container
    this.map = mapId === 'defence'
      ? createGloamwoodDefenceMap(
        async () => { await this.buildDefenceScenery() },
        (_camera, elapsed) => this.defenceScene?.update(elapsed),
      )
      : mapId === 'valley'
      ? createGloamwoodValleyMap(
        Number(new URLSearchParams(window.location.search).get('mapSeed') ?? 0) || 0x5a11e,
        async () => { await this.buildValleyScenery() },
        (camera, elapsed, delta) => this.valley?.update(camera, elapsed, delta),
        () => this.valleyGroundHeight,
        this.ecologyRunSeed,
      )
      : createGloamwoodMap(
        terrainHeight,
        { halfWidth: WORLD_HALF_WIDTH, halfDepth: WORLD_HALF_DEPTH },
        async () => {
          // Lighting belongs to the map for the same reason the scenery does.
          // Run unconditionally it stacked on top of the valley's own rig -
          // hemisphere 3.2 and directional 7.35 against the 1.15 and 2.1 that map
          // was lit for - which is most of why it read as flat and fake.
          this.createLighting()
          this.createTerrain()
          this.createPath()
          await this.loadEnvironmentModels()
          this.createForest()
          this.createUndergrowth()
          this.createShrine()
          this.createAtmosphere()
        },
        (state) => ({
          state: this.nestRingReset(state),
          playerAt: { x: GLOAMWOOD_BOSS_ARENA.playerX, z: GLOAMWOOD_BOSS_ARENA.playerZ },
        }),
      )
    // These four are the map's, so they are set here with it rather than in a
    // field initialiser - a field initialiser runs before the constructor body
    // and would be reading a map that does not exist yet.
    this.cameraOffset.set(this.map.cameraOffset.x, this.map.cameraOffset.y, this.map.cameraOffset.z)
    this.nestState = this.map.createCreatures()
    this.livesRemaining = this.map.lives
    this.combatMessage = this.map.hasNest ? t('hud.msg.approachNest') : t('hud.msg.takeTheRoad')
    try {
      this.feedbackSettings = normalizeCombatFeedbackSettings(JSON.parse(localStorage.getItem(PLAYER_FEEDBACK_SETTINGS_KEY) ?? 'null'))
    } catch {
      this.feedbackSettings = { ...DEFAULT_COMBAT_FEEDBACK_SETTINGS }
    }
    try {
      this.inputBindings = normalizeGloamwoodInputBindings(JSON.parse(localStorage.getItem(GLOAMWOOD_INPUT_BINDINGS_STORAGE_KEY) ?? 'null'))
    } catch {
      this.inputBindings = { ...DEFAULT_GLOAMWOOD_INPUT_BINDINGS }
    }
    this.audio = new GloamwoodAudioBus(this.feedbackSettings.volume, this.feedbackSettings.muted)
    const params = new URLSearchParams(window.location.search)
    this.weatherRunSeed = resolveGloamwoodWeatherRunSeed(
      params.get(GLOAMWOOD_WEATHER_SEED_PARAM),
      () => window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    )
    this.evolutionState = createGloamwoodEvolutionState(params.get('evolutionSeed') ?? 'gloamwood-first-run')
    // Same seed as the form evolution: one seed reproduces a whole run, which is
    // what Goal 3's acceptance actually checks.
    this.mutationState = createGloamwoodMutationState(params.get('evolutionSeed') ?? 'gloamwood-first-run')
    this.scene.background = new THREE.Color(0x12251d)
    this.scene.fog = new THREE.FogExp2(0x1b3329, 0.026)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = GLOAMWOOD_EXPOSURE
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.domElement.className = 'gloamwood-3d-canvas'
    this.renderer.domElement.tabIndex = 0
    this.renderer.domElement.setAttribute('aria-label', t('a11y.canvas'))
    this.container.append(this.renderer.domElement)
    this.playerRoot.add(this.characterRoot)
    this.scene.add(this.playerRoot)
    this.scene.add(this.nestRoot)
    this.preloadFeedbackTextures()
    this.bakeSkillFxTextures()
  }

  async start() {
    // The scenery is the map's, and the only part of one that cannot be shared.
    // Everything after this line is the same on any ground.
    await this.map.buildScenery()
    this.createContactShadows()
    this.createDustPool()
    if (this.map.hasNest) this.createNest()
    this.createBossVisual()
    // The Bladeshell was authored for the valley's first chokepoint, and the
    // valley does not exist yet. Putting a river crustacean in the Gloamwood by
    // default would be wrong, so it loads only when asked for - which is enough
    // to judge the model and the clip driver in engine.
    if (new URLSearchParams(window.location.search).get('bossModel') === 'bladeshell') {
      void this.loadModelledBoss(GLOAMWOOD_BLADESHELL_BOSS)
    }
    // Not gated on import.meta.env.DEV. A switch that only exists in dev is a
    // switch that silently does nothing on the deployed site, which is where
    // this actually gets reviewed - `bossGate` and `evolutionGate` both shipped
    // that way and were dead on arrival.
    // The map decides. The valley's creatures *are* its models - without them
    // it is a road with geometry blocks standing where the fights are, which is
    // what a tester saw on a bare link. The flag stays for the Gloamwood, whose
    // accepted look is the primitives.
    if (this.map.modelledCreatures || new URLSearchParams(window.location.search).get('preyModels') === '1') {
      // Reported rather than voided. A `void` on a failing load swallows the
      // reason and leaves creatures wearing their primitives, which is
      // indistinguishable from the feature being switched off.
      this.loadModelledPrey().catch((error) => {
        console.error('Modelled prey failed to load', error)
        this.preyModelError = error instanceof Error ? error.message : String(error)
      })
    }
    this.createHud()
    this.createValleyRadar()
    this.createDefenceRadar()
    this.bindInput()
    const debugSettings = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
    if (debugSettings?.get('settings') === '1' || debugSettings?.get('inputSettings') === '1') this.toggleSettings(true)
    if (debugSettings?.get('inputSettings') === '1') this.showInputSettings(true)
    this.resize()
    const spawnAtNestForDebug = import.meta.env.DEV
      && new URLSearchParams(window.location.search).get('spawnNest') === '1'
    this.playerRoot.position.set(
      spawnAtNestForDebug ? 0 : this.map.spawn.x,
      0,
      spawnAtNestForDebug ? GLOAMWOOD_NEST.centerZ : this.map.spawn.z,
    )
    this.target.copy(this.playerRoot.position)
    this.camera.position.copy(this.playerRoot.position).add(this.cameraOffset)
    this.camera.lookAt(this.playerRoot.position.x, CAMERA_LOOK_HEIGHT, this.playerRoot.position.z)
    await this.loadCharacter()
    const debugParams = new URLSearchParams(window.location.search)
    // These jump straight to an encounter, and they used to require a dev build,
    // which made them useless on the deployed site - the one place the game is
    // actually reviewed. They now follow the same rule as every other debug
    // surface: available when ?debug=1 is present.
    const debugGatesAllowed = import.meta.env.DEV || debugParams.get('debug') === '1'
    // A reviewer needs to be able to inspect an earned body mutation without
    // replaying an entire run. This remains a debug-only, validated list and
    // uses the same state/effect path as an actual choice.
    const debugMutations = (debugParams.get('mutationDebug') ?? '')
      .split(',')
      .filter((id) => GLOAMWOOD_MUTATION_POOL.some((mutation) => mutation.id === id))
    if (debugGatesAllowed && debugMutations.length > 0) {
      this.mutationState = { ...this.mutationState, taken: [...new Set(debugMutations)] }
      this.mutationEffects = accumulateGloamwoodMutationEffects(this.mutationState.taken)
      this.applyProgressionModifiers()
      this.refreshMutationBodyPresentation()
      this.updateMutationList()
    }
    // Debug links are already explicit QA entry points. Keep the state lab on
    // that surface so a reviewer never has to hand-edit another URL just to
    // inspect a body or mutation.
    if (debugGatesAllowed) this.createMutationLab()
    if (debugGatesAllowed && debugParams.get('bossGate') === '1') {
      this.openEvolutionGateForDebug()
      const choice = THREE.MathUtils.clamp(Number(debugParams.get('evolutionChoice')) || 0, 0, 2)
      await this.chooseEvolution(choice, this.map.id === 'valley' ? 'none' : 'boss')
      if (this.map.id === 'valley') this.standAtValleyBoss(Number(debugParams.get('bossIndex')) || 0)
    } else if (debugGatesAllowed && debugParams.get('evolutionGate') === '1') {
      this.openEvolutionGateForDebug()
    }
    // Built here rather than in the constructor because the composer sizes
    // itself from the renderer, and the renderer has no size until its canvas
    // is in the document.
    if (gloamwoodBloomRequested(window.location.search)) {
      this.bloom = createGloamwoodBloom(this.renderer, this.scene, this.camera) ?? undefined
      this.resize()
    }
    this.lastFrameAt = performance.now()
    this.tick()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    this.animationFrame = 0
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown)
    this.renderer.domElement.removeEventListener('dblclick', this.suppressGesture)
    document.removeEventListener('gesturestart', this.suppressGesture)
    document.removeEventListener('gesturechange', this.suppressGesture)
    document.removeEventListener('gestureend', this.suppressGesture)
    document.removeEventListener('visibilitychange', this.visibilityChanged)
    document.removeEventListener('fullscreenchange', this.fullscreenChanged)
    this.bloom?.dispose()
    this.bloom = undefined
    this.bossFx?.dispose()
    this.bossFx = undefined
    this.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.geometry.dispose()
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) material.dispose()
    })
    this.renderer.dispose()
    this.audio.dispose()
    for (const particle of this.dustParticles) {
      particle.sprite.geometry.dispose()
      particle.sprite.material.dispose()
    }
    for (const feedback of this.feedbackSprites) feedback.sprite.material.dispose()
    for (const particle of this.rendingParticles) particle.material.dispose()
    for (const particle of this.mutationParticles) particle.material.dispose()
    for (const surface of this.rendingSurfaces) {
      surface.mesh.geometry.dispose()
      surface.material.dispose()
    }
    for (const texture of this.feedbackTextures.values()) texture.dispose()
    for (const texture of this.skillFxTextures.values()) texture.dispose()
    this.feedbackSprites.length = 0
    this.rendingParticles.length = 0
    this.mutationParticles.length = 0
    this.rendingSurfaces.length = 0
    this.feedbackTextures.clear()
    this.skillFxTextures.clear()
    this.rendingScratchTexture?.dispose()
    this.rendingScratchTexture = null
    this.tailSweepHaloTexture?.dispose()
    this.tailSweepHaloTexture = null
    this.metabolicChevronTexture?.dispose()
    this.metabolicChevronTexture = null
    this.rendingGeometries.spark.dispose()
    this.skillFxPlane.dispose()
    this.tailSweepShock.dispose()
    this.carapacePlate.dispose()
    this.moultHuskLeft.fill.dispose()
    this.moultHuskLeft.edges.dispose()
    this.moultHuskRight.fill.dispose()
    this.moultHuskRight.edges.dispose()
    this.disposeSporeHaze()
    this.disposeMetabolicEmber()
    this.sporeHazePlane.dispose()
    this.renderer.domElement.remove()
    this.debugOutput?.remove()
    this.mutationLab?.remove()
    this.onboardingHud?.remove()
    this.valleyRadar?.root.remove()
    this.deathOverlay?.remove()
    this.settingsPanel?.remove()
    this.orientationGate?.remove()
    this.homeScreenTip?.remove()
    this.damageLayer?.remove()
    this.evolutionOverlay?.remove()
    this.resultOverlay?.remove()
    document.querySelector('.gloamwood-3d-hud')?.remove()
    document.querySelector('.gloamwood-3d-touch')?.remove()
  }

  private createLighting() {
    this.scene.add(new THREE.HemisphereLight(0xb9dbc7, 0x283426, 2.05))
    const sun = new THREE.DirectionalLight(0xffd18b, 4.6)
    sun.position.set(-12, 22, 10)
    sun.castShadow = true
    // This is still a detailed directional shadow, but costs 44% fewer shadow
    // texels than the old 2048 map every rendered frame.
    sun.shadow.mapSize.set(GLOAMWOOD_RENDER_QUALITY.shadowMapSize, GLOAMWOOD_RENDER_QUALITY.shadowMapSize)
    sun.shadow.camera.left = -30
    sun.shadow.camera.right = 30
    sun.shadow.camera.top = 24
    sun.shadow.camera.bottom = -24
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 70
    sun.shadow.bias = -0.00035
    // The 2048 map covers 60x48 world units, so a single armour plate on the
    // Shell body spans roughly ten texels. Overlapping plate shells at that
    // density self-shadow into black bands that read as holes in the back.
    // normalBias offsets the lookup along the surface normal, which is the fix
    // for grazing-angle acne; depth bias alone cannot reach it.
    sun.shadow.normalBias = 0.03
    this.scene.add(sun)
    const fill = new THREE.DirectionalLight(0x5c9f91, 0.65)
    fill.position.set(14, 6, -18)
    this.scene.add(fill)
  }

  private createTerrain() {
    const geometry = new THREE.PlaneGeometry(58, 43, 58, 43)
    geometry.rotateX(-Math.PI / 2)
    const position = geometry.attributes.position
    // Vertex colors break the single-tone ground plane: broad moss/floor
    // mottling, a warm dirt feather along the walkable path so it does not
    // end in a hard seam, and darkened world edges to sell the gloam.
    const vertexColors = new Float32Array(position.count * 3)
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index)
      const z = position.getZ(index)
      const edge = Math.max(0, Math.abs(x) - 18) * 0.075 + Math.max(0, Math.abs(z) - 12) * 0.11
      const rolling = Math.sin(x * 0.24) * 0.16 + Math.cos(z * 0.3) * 0.12 + Math.sin((x + z) * 0.17) * 0.1
      const pathFlatten = Math.exp(-Math.pow(z - Math.sin(x * 0.2) * 2.2, 2) / 18)
      position.setY(index, (rolling + edge) * (1 - pathFlatten * 0.72))

      const mottle = Math.sin(x * 0.43 + z * 0.31) * Math.cos(z * 0.37 - x * 0.21) * 0.55
        + Math.sin(x * 0.11) * Math.cos(z * 0.13) * 0.45
      let red = 0.97 + mottle * 0.09
      let green = 1.03 + mottle * 0.15
      let blue = 0.93 + mottle * 0.07
      const pathDistance = Math.abs(z - Math.sin(x * 0.2) * 2.2)
      const pathBlend = Math.max(0, 1 - pathDistance / 3.4)
      red += pathBlend * 0.24
      green += pathBlend * 0.09
      blue -= pathBlend * 0.05
      const vignette = Math.min(1, Math.max(0, (Math.abs(x) - 17) / 11) + Math.max(0, (Math.abs(z) - 11) / 9))
      const gloom = 1 - vignette * 0.44
      vertexColors[index * 3] = red * gloom
      vertexColors[index * 3 + 1] = green * gloom
      vertexColors[index * 3 + 2] = blue * gloom
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3))
    geometry.computeVertexNormals()
    const groundTexture = new THREE.TextureLoader().load(assetUrl('/assets/terrain/forest.jpg'))
    groundTexture.wrapS = THREE.RepeatWrapping
    groundTexture.wrapT = THREE.RepeatWrapping
    groundTexture.repeat.set(11, 8)
    groundTexture.colorSpace = THREE.SRGBColorSpace
    groundTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    const material = new THREE.MeshStandardMaterial({
      color: 0x718064,
      map: groundTexture,
      roughness: 0.98,
      metalness: 0,
      vertexColors: true,
    })
    const ground = new THREE.Mesh(geometry, material)
    ground.receiveShadow = true
    ground.name = 'GloamwoodTerrain'
    this.ground = ground
    this.scene.add(ground)

    const mossPatches = new THREE.InstancedMesh(
      new THREE.CircleGeometry(0.5, 12).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x496139, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false }),
      90,
    )
    const matrix = new THREE.Matrix4()
    const random = seededRandom(0x6a10a)
    for (let index = 0; index < 90; index += 1) {
      const x = (random() - 0.5) * 48
      const z = (random() - 0.5) * 34
      const scale = 0.35 + random() * 1.25
      matrix.compose(
        new THREE.Vector3(x, this.map.height(x, z) + 0.014, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI),
        new THREE.Vector3(scale * (0.7 + random() * 0.8), 1, scale),
      )
      mossPatches.setMatrixAt(index, matrix)
    }
    mossPatches.receiveShadow = true
    this.scene.add(mossPatches)
  }

  private createPath() {
    const points = [
      new THREE.Vector3(-27, 0.035, 6.8),
      new THREE.Vector3(-17, 0.035, 1.5),
      new THREE.Vector3(-7, 0.035, 3),
      new THREE.Vector3(2, 0.035, -1.2),
      new THREE.Vector3(12, 0.035, 1.6),
      new THREE.Vector3(27, 0.035, -4.5),
    ]
    const curve = new THREE.CatmullRomCurve3(points)
    const segments = 90
    const vertices: number[] = []
    const indices: number[] = []
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments
      const point = curve.getPoint(t)
      const tangent = curve.getTangent(t).normalize()
      const width = 1.8 + Math.sin(t * Math.PI * 5) * 0.18
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
      for (const side of [-1, 1]) {
        vertices.push(point.x + normal.x * width * side, this.map.height(point.x, point.z) + 0.045, point.z + normal.z * width * side)
      }
      if (index < segments) {
        const base = index * 2
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const dirtTexture = new THREE.TextureLoader().load(assetUrl('/assets/terrain/dirt.jpg'))
    dirtTexture.wrapS = THREE.RepeatWrapping
    dirtTexture.wrapT = THREE.RepeatWrapping
    dirtTexture.repeat.set(9, 2)
    dirtTexture.colorSpace = THREE.SRGBColorSpace
    dirtTexture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    const path = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x9b815d, map: dirtTexture, roughness: 0.96 }))
    path.receiveShadow = true
    path.name = 'WalkableHuntPath'
    this.scene.add(path)

    const pebbles = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.09, 0),
      new THREE.MeshStandardMaterial({ color: 0x81745e, roughness: 0.96 }),
      110,
    )
    const random = seededRandom(0x4151)
    const matrix = new THREE.Matrix4()
    for (let index = 0; index < 110; index += 1) {
      const t = random()
      const point = curve.getPoint(t)
      const tangent = curve.getTangent(t).normalize()
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x)
      const offset = (random() - 0.5) * 3.2
      const x = point.x + normal.x * offset
      const z = point.z + normal.z * offset
      const scale = 0.45 + random() * 1.2
      matrix.compose(new THREE.Vector3(x, this.map.height(x, z) + 0.08, z), new THREE.Quaternion().random(), new THREE.Vector3(scale, scale * 0.55, scale))
      pebbles.setMatrixAt(index, matrix)
    }
    pebbles.castShadow = true
    pebbles.receiveShadow = true
    this.scene.add(pebbles)
  }

  private createForest() {
    const random = seededRandom(0x51a7f0)
    const treeSpots: Array<{ x: number; z: number; scale: number }> = []
    for (let attempt = 0; attempt < 180 && treeSpots.length < 42; attempt += 1) {
      const x = (random() - 0.5) * 56
      const z = (random() - 0.5) * 41
      const pathZ = Math.sin(x * 0.2) * 2.2
      if (Math.abs(z - pathZ) < 6.2 || Math.hypot(x - 8, z + 5) < 7.8) continue
      if (Math.hypot(x - GLOAMWOOD_BOSS_ARENA.x, z - GLOAMWOOD_BOSS_ARENA.z) < GLOAMWOOD_BOSS_ARENA_CLEAR_RADIUS) continue
      if (distanceToSegment(x, z, -6, 3, -6 + CAMERA_OFFSET.x, 3 + CAMERA_OFFSET.z) < 4.4) continue
      if (treeSpots.some((tree) => Math.hypot(tree.x - x, tree.z - z) < 2.5)) continue
      treeSpots.push({ x, z, scale: 0.78 + random() * 0.72 })
    }
    for (const [index, tree] of treeSpots.entries()) this.createTree(tree.x, tree.z, tree.scale, index)
    this.treeCount = treeSpots.length

    for (let index = 0; index < 38; index += 1) {
      const x = (random() - 0.5) * 52
      const z = (random() - 0.5) * 37
      if (Math.abs(z - Math.sin(x * 0.2) * 2.2) < 2.8) continue
      if (Math.hypot(x - GLOAMWOOD_BOSS_ARENA.x, z - GLOAMWOOD_BOSS_ARENA.z) < GLOAMWOOD_BOSS_ARENA_CLEAR_RADIUS) continue
      this.createRock(x, z, 0.35 + random() * 0.9, random(), index)
    }
  }

  /**
   * Scatters the decorative undergrowth layers (bush / grass / tall grass /
   * fern / mushroom) as InstancedMesh batches. Purely visual — no layer
   * registers a collision obstacle.
   */
  private createUndergrowth() {
    const placement = new THREE.Matrix4()
    const instanceMatrix = new THREE.Matrix4()
    const rotation = new THREE.Quaternion()
    const worldUp = new THREE.Vector3(0, 1, 0)
    const tint = new THREE.Color()
    for (const [variantIndex, variant] of GLOAMWOOD_VEGETATION_VARIANTS.entries()) {
      const template = this.vegetationTemplates.get(variant.id)
      if (!template) continue
      template.updateMatrixWorld(true)
      const parts: Array<{ geometry: THREE.BufferGeometry; material: THREE.Material; local: THREE.Matrix4 }> = []
      template.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          parts.push({
            geometry: node.geometry as THREE.BufferGeometry,
            material: node.material as THREE.Material,
            local: node.matrixWorld.clone(),
          })
        }
      })
      const random = seededRandom(0x7a3f + variantIndex * 0x9e37)
      const spots: Array<{ x: number; z: number; yaw: number; size: number; shade: number }> = []
      for (let attempt = 0; attempt < variant.count * 6 && spots.length < variant.count; attempt += 1) {
        let x: number
        let z: number
        if (variant.anchorToTrees && this.trees.length > 0) {
          const tree = this.trees[Math.floor(random() * this.trees.length)]
          const angle = random() * Math.PI * 2
          const distance = 1.1 + random() * 1.7
          x = tree.x + Math.cos(angle) * distance
          z = tree.z + Math.sin(angle) * distance
        } else {
          x = (random() - 0.5) * 54
          z = (random() - 0.5) * 39
        }
        if (Math.abs(x) > 27 || Math.abs(z) > 19.5) continue
        if (Math.abs(z - Math.sin(x * 0.2) * 2.2) < variant.pathClearance) continue
        if (Math.hypot(x - 8, z + 5) < 5.6) continue
        if (Math.hypot(x - GLOAMWOOD_NEST.centerX, z - GLOAMWOOD_NEST.centerZ) < 6.4) continue
        if (Math.hypot(x - GLOAMWOOD_BOSS_ARENA.x, z - GLOAMWOOD_BOSS_ARENA.z) < GLOAMWOOD_BOSS_ARENA_CLEAR_RADIUS) continue
        if (Math.hypot(x + 6, z - 3) < 2.2) continue
        spots.push({
          x,
          z,
          yaw: random() * Math.PI * 2,
          size: vegetationWorldSize(variant, random()),
          shade: 0.78 + random() * 0.34,
        })
      }
      for (const part of parts) {
        const batch = new THREE.InstancedMesh(part.geometry, part.material, spots.length)
        for (const [index, spot] of spots.entries()) {
          placement.compose(
            new THREE.Vector3(spot.x, this.map.height(spot.x, spot.z) - 0.02, spot.z),
            rotation.setFromAxisAngle(worldUp, spot.yaw),
            new THREE.Vector3(spot.size, spot.size, spot.size),
          )
          instanceMatrix.multiplyMatrices(placement, part.local)
          batch.setMatrixAt(index, instanceMatrix)
          // Warm-green jitter: keeps clumps from reading as one repeated prop.
          batch.setColorAt(index, tint.setRGB(0.62 + spot.shade * 0.18, 0.82 + spot.shade * 0.16, 0.42 + spot.shade * 0.1))
        }
        batch.castShadow = variant.castShadow
        batch.receiveShadow = true
        batch.name = `GloamwoodUndergrowth-${variant.id}`
        this.scene.add(batch)
      }
      this.undergrowthInstances += spots.length
    }
  }

  /**
   * Loads the CC0 Quaternius nature GLBs once and normalizes each template:
   * ground contact at y=0, centered on x/z, unit height (trees) or unit
   * lateral diameter (rocks) so `treeFootprint` / `rockFootprint` numbers
   * translate directly into world units.
   */
  private async loadEnvironmentModels() {
    const load = (url: string, mode: 'height' | 'lateral', grade: GloamwoodKitGrade) =>
      loadGloamwoodKitTemplate(this.loader, url, mode, grade, this.foliageTime)
    const uniqueTrees = [...new Map(GLOAMWOOD_TREE_VARIANTS.map((variant) => [variant.id, variant])).values()]
    await Promise.all([
      ...uniqueTrees.map(async (variant) => {
        this.treeTemplates.set(variant.id, await load(variant.url, 'height', GLOAMWOOD_TREE_GRADE))
      }),
      ...GLOAMWOOD_ROCK_VARIANTS.map(async (variant) => {
        this.rockTemplates.set(variant.id, await load(variant.url, 'lateral', GLOAMWOOD_ROCK_GRADE))
      }),
      ...GLOAMWOOD_VEGETATION_VARIANTS.map(async (variant) => {
        this.vegetationTemplates.set(variant.id, await load(variant.url, variant.mode, GLOAMWOOD_VEGETATION_GRADE))
      }),
    ])
  }

  private createTree(x: number, z: number, scale: number, index: number) {
    const variant = treeVariantForIndex(index)
    const template = this.treeTemplates.get(variant.id)
    if (!template) return
    const footprint = treeFootprint(variant, treeSizeFactor(scale))
    const group = template.clone(true)
    group.scale.multiplyScalar(footprint.height)
    group.position.set(x, this.map.height(x, z), z)
    group.rotation.y = (index * 2.399) % (Math.PI * 2)
    this.scene.add(group)
    // Track the crown as a 3D occluder. A ground-plane trunk test misses crowns
    // that overlap the camera sightline high above their trunk center.
    this.trees.push({
      group,
      x,
      y: group.position.y + footprint.canopyCenterY,
      z,
      radius: footprint.canopyRadius,
    })
    this.obstacles.push({ id: `tree-${index}`, kind: 'tree', x, z, radius: footprint.trunkRadius })
  }

  private createRock(x: number, z: number, scale: number, randomValue: number, index: number) {
    const variant = rockVariantForIndex(index)
    const template = this.rockTemplates.get(variant.id)
    if (!template) return
    const footprint = rockFootprint(variant, scale)
    if (Math.hypot(x - GLOAMWOOD_BOSS_ARENA.x, z - GLOAMWOOD_BOSS_ARENA.z) < GLOAMWOOD_BOSS_ARENA_CLEAR_RADIUS + footprint.radius) return
    const rock = template.clone(true)
    rock.scale.multiplyScalar(footprint.diameter)
    // Sink slightly so irregular bases read as bedded into the terrain.
    rock.position.set(x, this.map.height(x, z) - footprint.diameter * 0.05, z)
    rock.rotation.y = randomValue * Math.PI * 2
    this.scene.add(rock)
    this.obstacles.push({ id: `rock-${index}`, kind: 'rock', x, z, radius: footprint.radius })
    this.rockCount += 1
  }

  private createShrine() {
    const center = new THREE.Vector3(8, this.map.height(8, -5), -5)
    const stone = new THREE.MeshStandardMaterial({ color: 0x6a7264, roughness: 0.9 })
    const moss = new THREE.MeshStandardMaterial({ color: 0x405b37, roughness: 1 })
    const base = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.8, 0.62, 14), stone)
    base.position.copy(center).add(new THREE.Vector3(0, 0.31, 0))
    base.castShadow = true
    base.receiveShadow = true
    this.scene.add(base)
    this.shrinePieces += 1
    for (let ring = 0; ring < 3; ring += 1) {
      const step = new THREE.Mesh(new THREE.TorusGeometry(3.2 - ring * 0.62, 0.18, 7, 32), ring === 1 ? moss : stone)
      step.rotation.x = Math.PI / 2
      step.position.copy(center).add(new THREE.Vector3(0, 0.68 + ring * 0.16, 0))
      step.castShadow = true
      step.receiveShadow = true
      this.scene.add(step)
      this.shrinePieces += 1
    }
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.9, 0.36, 18), stone)
    dais.position.copy(center).add(new THREE.Vector3(0, 0.76, 0))
    dais.castShadow = true
    dais.receiveShadow = true
    this.scene.add(dais)
    this.shrinePieces += 1
    for (let index = 0; index < 7; index += 1) {
      const angle = index / 7 * Math.PI * 2
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.1 + (index % 2) * 0.65, 0.55), stone)
      pillar.position.copy(center).add(new THREE.Vector3(Math.cos(angle) * 4.25, 1.5, Math.sin(angle) * 4.25))
      pillar.rotation.y = -angle
      pillar.castShadow = true
      pillar.receiveShadow = true
      this.scene.add(pillar)
      this.obstacles.push({ id: `shrine-pillar-${index}`, kind: 'pillar', x: pillar.position.x, z: pillar.position.z, radius: 0.48 })
      this.shrinePieces += 1
    }
    const rune = new THREE.PointLight(0xffb64c, 5.2, 10, 2)
    rune.position.copy(center).add(new THREE.Vector3(0, 1.6, 0))
    this.scene.add(rune)
    const runeDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.04, 32),
      new THREE.MeshBasicMaterial({ color: 0xf4a83e, transparent: true, opacity: 0.82 }),
    )
    runeDisc.position.copy(center).add(new THREE.Vector3(0, 0.96, 0))
    this.scene.add(runeDisc)
    this.shrinePieces += 1
    this.obstacles.push({ id: 'shrine-base', kind: 'shrine', x: center.x, z: center.z, radius: 5.8 })
  }

  private createAtmosphere() {
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const random = seededRandom(0xf09)
    for (let index = 0; index < 120; index += 1) {
      positions.push((random() - 0.5) * 52, 0.5 + random() * 8, (random() - 0.5) * 38)
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    const motes = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffd67d, size: 0.045, transparent: true, opacity: 0.56, depthWrite: false }))
    motes.name = 'ForestLightMotes'
    this.scene.add(motes)
    this.createLightShafts()
  }

  /**
   * Fake volumetric sun shafts: additive gradient planes leaning along the
   * key-light direction, anchored beside canopy trees away from the path.
   */
  private createLightShafts() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) return
    const gradient = context.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, 'rgba(255, 224, 158, 0.55)')
    gradient.addColorStop(0.55, 'rgba(255, 214, 125, 0.2)')
    gradient.addColorStop(1, 'rgba(255, 205, 110, 0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 256)
    const sideFade = context.createLinearGradient(0, 0, 64, 0)
    sideFade.addColorStop(0, 'rgba(0,0,0,1)')
    sideFade.addColorStop(0.28, 'rgba(0,0,0,0)')
    sideFade.addColorStop(0.72, 'rgba(0,0,0,0)')
    sideFade.addColorStop(1, 'rgba(0,0,0,1)')
    context.globalCompositeOperation = 'destination-out'
    context.fillStyle = sideFade
    context.fillRect(0, 0, 64, 256)
    const texture = new THREE.CanvasTexture(canvas)
    const shaftGeometry = new THREE.PlaneGeometry(2.3, 9.5)
    const random = seededRandom(0x5a11)
    const candidates = this.trees.filter((tree) => Math.abs(tree.z - Math.sin(tree.x * 0.2) * 2.2) > 4)
    for (let index = 0; index < Math.min(7, candidates.length); index += 1) {
      const tree = candidates[Math.floor(random() * candidates.length)]
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.13 + random() * 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      })
      const shaft = new THREE.Mesh(shaftGeometry, material)
      const x = tree.x + (random() - 0.5) * 3
      const z = tree.z + (random() - 0.5) * 3
      shaft.position.set(x, this.map.height(x, z) + 4.4, z)
      // Lean along the key light (sun sits at -12, 22, 10 → beams fall +x, -z).
      shaft.rotation.set(0.1, random() * Math.PI, -0.26)
      shaft.renderOrder = 3
      shaft.name = 'GloamwoodLightShaft'
      this.scene.add(shaft)
    }
  }

  private createContactShadows() {
    const layers = [
      { radius: 0.88, opacity: 0.31, scaleX: 1.55, z: 0.1 },
      { radius: 0.55, opacity: 0.22, scaleX: 1.25, z: -0.42 },
      { radius: 0.38, opacity: 0.16, scaleX: 1.65, z: 0.74 },
    ]
    for (const [index, layer] of layers.entries()) {
      const material = new THREE.MeshBasicMaterial({ color: 0x020403, transparent: true, opacity: layer.opacity, depthWrite: false })
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(layer.radius, 32).rotateX(-Math.PI / 2), material)
      shadow.position.set(0, 0.018 + index * 0.003, layer.z)
      shadow.scale.x = layer.scaleX
      shadow.renderOrder = 2
      this.playerRoot.add(shadow)
      this.shadowMaterials.push(material)
    }
  }

  private createDustPool() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')
    if (!context) return
    const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 30)
    gradient.addColorStop(0, 'rgba(221, 190, 132, .82)')
    gradient.addColorStop(0.42, 'rgba(174, 139, 89, .52)')
    gradient.addColorStop(1, 'rgba(118, 91, 57, 0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    for (let index = 0; index < GLOAMWOOD_3D_LOCOMOTION_FEEL.dustPoolSize; index += 1) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: index % 3 === 0 ? 0xe0bd7c : 0xc39458,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
      })
      const sprite = new THREE.Sprite(material)
      sprite.visible = false
      sprite.renderOrder = 3
      this.scene.add(sprite)
      this.dustParticles.push({
        sprite,
        velocity: new THREE.Vector3(),
        age: 0,
        duration: GLOAMWOOD_3D_LOCOMOTION_FEEL.dustDurationSeconds,
        active: false,
        startScale: 0.24,
      })
    }
  }

  /**
   * Load the authored mutation effects ahead of the first combat event. A load
   * failure leaves the small canvas fallback intact, so a missing optional art
   * file cannot interrupt a fight or change combat authority.
   */
  private preloadFeedbackTextures() {
    const loader = new THREE.TextureLoader()
    for (const [kind, source] of Object.entries(FEEDBACK_TEXTURE_ASSET_PATHS) as Array<[FeedbackTextureKind, string]>) {
      loader.load(source, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        if (this.disposed) {
          texture.dispose()
          return
        }
        this.feedbackTextures.set(kind, texture)
      })
    }
  }

  /** Soft additive skill sprites: glow, crescent slash, shock ring, streak. */
  private bakeSkillFxTextures() {
    for (const kind of SKILL_FX_TEXTURE_KINDS) {
      const canvas = document.createElement('canvas')
      canvas.width = kind === 'glow' || kind === 'pebble' ? 64 : kind === 'dust' || kind === 'plate' ? 128 : 256
      canvas.height = kind === 'streak' ? 128 : kind === 'glow' || kind === 'pebble' ? 64 : kind === 'dust' || kind === 'plate' ? 128 : 256
      const context = canvas.getContext('2d')
      if (!context) continue
      paintSkillFxTexture(kind, context, canvas.width, canvas.height)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      this.skillFxTextures.set(kind, texture)
    }
    const scratch = document.createElement('canvas')
    scratch.width = 512
    scratch.height = 512
    const scratchContext = scratch.getContext('2d')
    if (scratchContext) {
      paintRendingScratch(scratchContext, scratch.width, scratch.height)
      this.rendingScratchTexture = new THREE.CanvasTexture(scratch)
      this.rendingScratchTexture.colorSpace = THREE.SRGBColorSpace
      this.rendingScratchTexture.generateMipmaps = false
      this.rendingScratchTexture.minFilter = THREE.LinearFilter
      this.rendingScratchTexture.magFilter = THREE.LinearFilter
    }
    const halo = document.createElement('canvas')
    halo.width = 256
    halo.height = 256
    const haloContext = halo.getContext('2d')
    if (haloContext) {
      paintTailSweepHalo(haloContext, halo.width, halo.height)
      this.tailSweepHaloTexture = new THREE.CanvasTexture(halo)
      this.tailSweepHaloTexture.colorSpace = THREE.SRGBColorSpace
    }
    const chevron = document.createElement('canvas')
    chevron.width = 128
    chevron.height = 256
    const chevronContext = chevron.getContext('2d')
    if (chevronContext) {
      paintMetabolicChevron(chevronContext, chevron.width, chevron.height)
      this.metabolicChevronTexture = new THREE.CanvasTexture(chevron)
      this.metabolicChevronTexture.colorSpace = THREE.SRGBColorSpace
    }
  }

  /**
   * Ordinary combat keeps compact procedural fallback marks. Mutation and
   * rending bursts use shared lit meshes instead of these canvases.
   */
  private feedbackTexture(kind: FeedbackTextureKind) {
    const existing = this.feedbackTextures.get(kind)
    if (existing) return existing
    const canvas = document.createElement('canvas')
    const square = kind !== 'slash'
    canvas.width = square ? 192 : 320
    canvas.height = square ? 192 : 96
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Unable to create combat feedback texture')
    const width = canvas.width
    const height = canvas.height
    context.clearRect(0, 0, width, height)
    context.lineCap = 'round'
    context.lineJoin = 'round'

    if (kind === 'slash') {
      const stroke = context.createLinearGradient(12, height / 2, width - 12, height / 2)
      stroke.addColorStop(0, 'rgba(255,255,255,0)')
      stroke.addColorStop(0.2, 'rgba(255,255,255,.38)')
      stroke.addColorStop(0.5, 'rgba(255,255,255,1)')
      stroke.addColorStop(0.82, 'rgba(255,255,255,.44)')
      stroke.addColorStop(1, 'rgba(255,255,255,0)')
      context.strokeStyle = stroke
      context.shadowColor = 'rgba(255,255,255,.95)'
      context.shadowBlur = 12
      for (const [offset, widthScale] of [[-14, 10], [0, 7], [15, 4]] as const) {
        context.lineWidth = widthScale
        context.beginPath()
        context.moveTo(18, height * 0.58 + offset * 0.15)
        context.quadraticCurveTo(width * 0.46, height * 0.12 + offset, width - 18, height * 0.48 + offset * 0.25)
        context.stroke()
      }
    } else if (kind === 'shard') {
      context.save()
      context.translate(width / 2, height / 2)
      context.shadowColor = 'rgba(255,255,255,.84)'
      context.shadowBlur = 9
      context.fillStyle = 'rgba(255,255,255,.88)'
      for (const angle of [0, 2.1, 4.15]) {
        context.save()
        context.rotate(angle)
        context.beginPath()
        context.moveTo(0, -62)
        context.lineTo(13, 18)
        context.lineTo(-11, 38)
        context.closePath()
        context.fill()
        context.restore()
      }
      context.restore()
    } else {
      const glow = context.createRadialGradient(width / 2, height / 2, 3, width / 2, height / 2, width * 0.46)
      glow.addColorStop(0, 'rgba(255,255,255,1)')
      glow.addColorStop(0.24, 'rgba(255,255,255,.78)')
      glow.addColorStop(0.62, 'rgba(255,255,255,.18)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    this.feedbackTextures.set(kind, texture)
    return texture
  }

  private spawnFeedbackSprite(
    kind: FeedbackTextureKind,
    position: THREE.Vector3,
    color: number,
    startScale: [number, number],
    endScale: [number, number],
    duration: number,
    velocity = new THREE.Vector3(),
    rotation = 0,
    rotationSpeed = 0,
    peakOpacity = 0.9,
    growthStyle: FeedbackSprite['growthStyle'] = 'ease-out',
  ) {
    const material = new THREE.SpriteMaterial({
      map: this.feedbackTexture(kind),
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      // A confirmed impact must win against the victim's own model. Effects
      // are shorter than a blink, so rendering over nearby foliage improves
      // readability without becoming a permanent through-wall marker.
      depthTest: false,
      // Every mutation owns a palette. Additive blending was pushing every
      // texture toward white on the bright river-valley floor, making eight
      // different effects read as the same anonymous halo. Alpha-blended
      // sprites retain their authored coral, jade, amber and spore colours.
      blending: THREE.NormalBlending,
      rotation,
    })
    const sprite = new THREE.Sprite(material)
    sprite.position.copy(position)
    sprite.scale.set(startScale[0], startScale[1], 1)
    sprite.renderOrder = 10
    this.scene.add(sprite)
    this.feedbackSprites.push({
      sprite,
      velocity,
      age: 0,
      duration: duration * this.feedbackDurationMultiplier,
      growthStyle,
      startScale: new THREE.Vector2(...startScale),
      endScale: new THREE.Vector2(...endScale),
      rotationSpeed,
      peakOpacity,
    })
  }

  /** Presentation-only skill burst. Combat authority has already resolved. */
  private spawnMutationFxBurst(id: MutationFxBurstId, facing = this.lastFacing, origin?: THREE.Vector3) {
    const x = origin?.x ?? this.playerRoot.position.x
    const z = origin?.z ?? this.playerRoot.position.z
    const y = origin?.y ?? this.map.height(x, z)
    const burst = id === 'tail-sweep' || id === 'carapace' || id === 'moult'
      ? mutationFxBurst(id, facing, this.playerVisualGroundRadius)
      : mutationFxBurst(id, facing)
    const pace = this.feedbackDurationMultiplier
    this.cameraTrauma = Math.min(1, this.cameraTrauma + burst.trauma)
    const attract = new THREE.Vector3(x, y + 0.82, z)
    for (const spec of burst.particles) {
      const map = this.skillFxTextures.get(spec.texture)
      // `glow` and `streak` are the two textures that were already drawn as
      // light rather than as matter, and they are the only two that blend
      // additively. Those get pushed over 1.0 so the bloom pass can find them:
      // it thresholds against the linear buffer before tone mapping, and a
      // colour that clamps at 1.0 there never glows however hot it looks.
      //
      // Dust, pebbles and plates are deliberately left alone. They are debris,
      // and debris that blooms is a bug report.
      const gain = spec.texture === 'glow' || spec.texture === 'streak'
        ? SKILL_FX_LIGHT_GAIN[spec.texture] * this.skillFxGainScale
        : 0
      const lit = gain > 0
      const common = {
        map,
        color: lit ? new THREE.Color(spec.color).multiplyScalar(gain) : new THREE.Color(spec.color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: spec.depthTest === true,
        blending: lit ? THREE.AdditiveBlending : THREE.NormalBlending,
        fog: false,
      } as const
      let object: THREE.Object3D
      let material: THREE.SpriteMaterial | THREE.MeshBasicMaterial
      if (spec.billboard === 'camera') {
        material = new THREE.SpriteMaterial({ ...common, rotation: spec.roll })
        const sprite = new THREE.Sprite(material)
        sprite.position.set(x + spec.offset[0], y + spec.offset[1], z + spec.offset[2])
        sprite.scale.set(spec.startScale[0], spec.startScale[1], 1)
        sprite.renderOrder = spec.depthTest ? 3 : 12
        object = sprite
      } else {
        material = new THREE.MeshBasicMaterial({ ...common, side: THREE.DoubleSide })
        const mesh = new THREE.Mesh(this.skillFxPlane, material)
        mesh.position.set(x + spec.offset[0], y + spec.offset[1], z + spec.offset[2])
        mesh.scale.set(spec.startScale[0], spec.startScale[1], 1)
        mesh.renderOrder = spec.billboard === 'slash' ? 13 : spec.depthTest ? 3 : 11
        if (spec.billboard === 'ground') mesh.rotation.set(-Math.PI / 2, facing, 0)
        else mesh.rotation.set(0.22, facing, spec.roll)
        object = mesh
      }
      this.scene.add(object)
      this.mutationParticles.push({
        object,
        material,
        velocity: new THREE.Vector3(spec.velocity[0], spec.velocity[1], spec.velocity[2]),
        spin: spec.spin,
        age: -spec.delay * pace,
        duration: spec.duration * pace,
        gravity: spec.gravity,
        motion: spec.motion,
        peakOpacity: spec.peakOpacity,
        startScale: new THREE.Vector2(spec.startScale[0], spec.startScale[1]),
        endScale: new THREE.Vector2(spec.endScale[0], spec.endScale[1]),
        attractTarget: attract.clone(),
      })
    }
    while (this.mutationParticles.length > 80) this.retireMutationParticle(this.mutationParticles.shift()!)
  }

  /**
   * Three tapered hunting claws on the hit. Grown short-to-long.
   * White-hot core, orange body, needle tips. Presentation only.
   */
  private spawnRendingClaws(contact: THREE.Vector3, _facing: THREE.Vector3) {
    const pace = this.feedbackDurationMultiplier
    this.cameraTrauma = Math.min(1, this.cameraTrauma + RENDING_CRACK.trauma)
    const map = this.rendingScratchTexture
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: map },
        uProgress: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: `varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv;
        uniform sampler2D uMap;
        uniform float uProgress;
        uniform float uOpacity;
        void main() {
          vec4 texel = texture2D(uMap, vUv);
          float along = vUv.x * 0.78 + (1.0 - vUv.y) * 0.22;
          float drawn = step(along, uProgress);
          gl_FragColor = vec4(texel.rgb * 1.55, texel.a * drawn * uOpacity);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(RENDING_CRACK.planeWidth, RENDING_CRACK.planeHeight),
      material,
    )
    const towardCamera = this.camera.position.clone().sub(contact)
    if (towardCamera.lengthSq() < 0.0001) towardCamera.set(0, 1, 0)
    towardCamera.normalize()
    mesh.position.copy(contact).addScaledVector(towardCamera, 0.12)
    mesh.lookAt(this.camera.position)
    mesh.renderOrder = 14
    this.scene.add(mesh)
    this.rendingSurfaces.push({
      mesh,
      material,
      age: 0,
      duration: RENDING_CRACK.durationSeconds * pace,
    })
    while (this.rendingSurfaces.length > 4) this.retireRendingSurface(this.rendingSurfaces.shift()!)
    this.spawnRendingSparks(contact, pace)
  }

  private spawnRendingSparks(origin: THREE.Vector3, pace: number) {
    for (const spec of rendingSparkBurst()) {
      const material = new THREE.SpriteMaterial({
        map: this.skillFxTextures.get(spec.texture),
        color: new THREE.Color(spec.color).multiplyScalar(SKILL_FX_LIGHT_GAIN.glow * this.skillFxGainScale),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        rotation: spec.roll,
      })
      const sprite = new THREE.Sprite(material)
      sprite.position.set(
        origin.x + spec.offset[0],
        origin.y + spec.offset[1],
        origin.z + spec.offset[2],
      )
      sprite.scale.set(spec.startScale[0], spec.startScale[1], 1)
      sprite.renderOrder = 15
      this.scene.add(sprite)
      this.mutationParticles.push({
        object: sprite,
        material,
        velocity: new THREE.Vector3(spec.velocity[0], spec.velocity[1], spec.velocity[2]),
        spin: spec.spin,
        age: -spec.delay * pace,
        duration: spec.duration * pace,
        gravity: spec.gravity,
        motion: spec.motion,
        peakOpacity: spec.peakOpacity,
        startScale: new THREE.Vector2(spec.startScale[0], spec.startScale[1]),
        endScale: new THREE.Vector2(spec.endScale[0], spec.endScale[1]),
        attractTarget: origin.clone(),
      })
    }
    while (this.mutationParticles.length > 80) this.retireMutationParticle(this.mutationParticles.shift()!)
  }

  private retireMutationParticle(particle: MutationParticle) {
    const materials = new Set<THREE.Material>()
    particle.object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      const material = node.material
      if (Array.isArray(material)) material.forEach((entry) => materials.add(entry))
      else materials.add(material)
    })
    this.scene.remove(particle.object)
    for (const material of materials) material.dispose()
    if (!materials.has(particle.material)) particle.material.dispose()
  }

  private updateMutationParticles(delta: number) {
    for (let index = this.mutationParticles.length - 1; index >= 0; index -= 1) {
      const particle = this.mutationParticles[index]
      particle.age += delta
      if (particle.age < 0) {
        particle.object.visible = false
        continue
      }
      particle.object.visible = true
      const progress = Math.min(1, particle.age / particle.duration)
      const fade = particle.motion === 'draw'
        ? (progress < 0.62 ? 1 : 1 - (progress - 0.62) / 0.38)
        : Math.min(1, progress / 0.08) * (1 - Math.max(0, (progress - 0.62) / 0.38))
      const scaleProgress = particle.motion === 'draw' || particle.motion === 'expand'
        ? 1 - (1 - progress) ** 3
        : progress
      const scaleX = THREE.MathUtils.lerp(particle.startScale.x, particle.endScale.x, scaleProgress)
      const scaleY = THREE.MathUtils.lerp(particle.startScale.y, particle.endScale.y, scaleProgress)
      if (particle.object instanceof THREE.Sprite) {
        particle.object.scale.set(scaleX, scaleY, 1)
        particle.object.material.rotation += particle.spin * delta
      } else if (particle.object.userData.moultCap) {
        const depth = Number(particle.object.userData.depth) || scaleX
        const grow = particle.startScale.x === 0 ? 1 : scaleX / particle.startScale.x
        particle.object.scale.set(scaleX, scaleY, depth * grow)
        if (particle.spin) particle.object.rotateOnAxis(this.carapaceUp, particle.spin * delta)
        particle.object.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return
          const material = node.material
          if (!(material instanceof THREE.MeshStandardMaterial) && !(material instanceof THREE.MeshBasicMaterial)) return
          material.opacity = fade * Number(node.userData.moultPeak ?? particle.peakOpacity)
        })
      } else if (particle.object.userData.volumeKind === 'ellipsoid') {
        const depth = Number(particle.object.userData.depth) || scaleX
        const grow = particle.startScale.x === 0 ? 1 : scaleX / particle.startScale.x
        particle.object.scale.set(scaleX, scaleY, depth * grow)
        if (particle.spin) particle.object.rotateOnAxis(this.carapaceUp, particle.spin * delta)
      } else if (particle.object.userData.carapaceVolume) {
        particle.object.scale.set(scaleX, scaleY, scaleX)
        if (particle.spin) particle.object.rotateOnAxis(this.carapaceUp, particle.spin * delta)
      } else {
        particle.object.scale.set(scaleX, scaleY, 1)
        particle.object.rotation.z += particle.spin * delta
      }
      if (particle.motion === 'attract') {
        particle.object.position.lerp(particle.attractTarget, 1 - Math.exp(-9.5 * delta))
      } else if (particle.motion !== 'expand' && particle.motion !== 'draw') {
        if (particle.motion === 'drift') particle.velocity.y += 0.55 * delta
        particle.velocity.y -= particle.gravity * delta
        particle.object.position.addScaledVector(particle.velocity, delta)
        particle.velocity.multiplyScalar(Math.exp((particle.motion === 'ballistic' ? -2.4 : -1.4) * delta))
      }
      if (!particle.object.userData.moultCap) {
        particle.material.opacity = fade * particle.peakOpacity
      }
      if (particle.material instanceof THREE.ShaderMaterial && particle.material.uniforms.uOpacity) {
        particle.material.uniforms.uOpacity.value = fade * particle.peakOpacity
      }
      if (progress >= 1) {
        this.retireMutationParticle(particle)
        this.mutationParticles.splice(index, 1)
      }
    }
  }

  private retireRendingParticle(particle: RendingParticle) {
    this.scene.remove(particle.mesh)
    particle.material.dispose()
  }

  private retireRendingSurface(surface: RendingSurface) {
    this.scene.remove(surface.mesh)
    surface.mesh.geometry.dispose()
    surface.material.dispose()
  }

  private updateRendingParticles(delta: number) {
    for (let index = this.rendingSurfaces.length - 1; index >= 0; index -= 1) {
      const surface = this.rendingSurfaces[index]
      surface.age += delta
      const progress = Math.min(1, surface.age / surface.duration)
      const reveal = Math.min(1, progress / 0.4)
      const fade = progress < 0.68 ? 1 : 1 - (progress - 0.68) / 0.32
      surface.material.uniforms.uProgress.value = reveal
      surface.material.uniforms.uOpacity.value = fade
      if (progress >= 1) {
        this.retireRendingSurface(surface)
        this.rendingSurfaces.splice(index, 1)
      }
    }
    for (let index = this.rendingParticles.length - 1; index >= 0; index -= 1) {
      const particle = this.rendingParticles[index]
      particle.age += delta
      if (particle.age < 0) {
        particle.mesh.visible = false
        continue
      }
      particle.mesh.visible = true
      const progress = Math.min(1, particle.age / particle.duration)
      const fade = Math.min(1, progress / 0.08) * (1 - Math.max(0, (progress - 0.62) / 0.38))

      particle.velocity.y -= 7.6 * delta
      particle.mesh.position.addScaledVector(particle.velocity, delta)
      particle.velocity.multiplyScalar(Math.exp(-2.5 * delta))
      const ground = this.map.height(particle.mesh.position.x, particle.mesh.position.z) + 0.035
      if (particle.mesh.position.y < ground && particle.velocity.y < 0) {
        particle.mesh.position.y = ground
        particle.velocity.y *= -0.26
        particle.velocity.x *= 0.64
        particle.velocity.z *= 0.64
      }
      const scale = THREE.MathUtils.lerp(1, 0.24, progress)
      particle.mesh.scale.setScalar(scale)
      particle.mesh.rotation.x += particle.spin.x * delta
      particle.mesh.rotation.y += particle.spin.y * delta
      particle.mesh.rotation.z += particle.spin.z * delta
      particle.material.opacity = fade * 0.92

      if (progress >= 1) {
        this.retireRendingParticle(particle)
        this.rendingParticles.splice(index, 1)
      }
    }
  }

  private createNest() {
    this.nestRoot.name = 'CorruptedBroodNest'
    this.nestRoot.position.set(GLOAMWOOD_NEST.centerX, this.map.height(GLOAMWOOD_NEST.centerX, GLOAMWOOD_NEST.centerZ) + 0.94, GLOAMWOOD_NEST.centerZ)
    const rootMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2826, roughness: 0.94 })
    const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x7f322d, roughness: 0.7, emissive: 0x2d0906, emissiveIntensity: 0.7 })
    const sporeMaterial = new THREE.MeshStandardMaterial({ color: 0xa6d65c, roughness: 0.58, emissive: 0x213e0f, emissiveIntensity: 0.8 })
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 1), coreMaterial)
    core.scale.set(1.35, 0.58, 1.12)
    core.castShadow = true
    core.receiveShadow = true
    this.nestRoot.add(core)
    for (let index = 0; index < 9; index += 1) {
      const angle = index / 9 * Math.PI * 2
      const root = new THREE.Mesh(new THREE.ConeGeometry(0.15 + index % 2 * 0.04, 1.8 + index % 3 * 0.18, 7), rootMaterial)
      root.position.set(Math.cos(angle) * 1.05, -0.36, Math.sin(angle) * 1.05)
      root.rotation.z = Math.PI / 2.35
      root.rotation.y = -angle
      root.castShadow = true
      this.nestRoot.add(root)
      if (index % 2 === 0) {
        const spore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + index * 0.008, 0), sporeMaterial)
        spore.position.set(Math.cos(angle) * 0.75, 0.32 + index % 3 * 0.14, Math.sin(angle) * 0.75)
        spore.castShadow = true
        this.nestRoot.add(spore)
      }
    }
  }

  private createBossVisual() {
    const root = new THREE.Group()
    const body = new THREE.Group()
    const materials: THREE.MeshStandardMaterial[] = []
    const material = (color: number, roughness: number, emissive = 0x000000) => {
      const value = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity: emissive ? 0.42 : 0 })
      materials.push(value)
      return value
    }
    const add = (geometry: THREE.BufferGeometry, value: THREE.Material, position: [number, number, number], scale: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometry, value)
      mesh.position.set(...position)
      mesh.scale.set(...scale)
      mesh.rotation.set(...rotation)
      mesh.castShadow = true
      mesh.receiveShadow = true
      body.add(mesh)
    }
    const bark = material(0x63382b, 0.92)
    const armor = material(0x75905a, 0.82)
    const thorn = material(0xe0b169, 0.7)
    const heart = material(0xe24e53, 0.48, 0x6a1018)
    add(new THREE.DodecahedronGeometry(0.92, 1), bark, [0, 1.18, 0], [1.58, 0.94, 1.06])
    add(new THREE.IcosahedronGeometry(0.64, 1), armor, [0.98, 1.32, 0], [1.34, 0.86, 0.9])
    add(new THREE.IcosahedronGeometry(0.34, 1), heart, [1.36, 1.28, 0], [1, 1, 1])
    add(new THREE.IcosahedronGeometry(0.24, 1), heart, [1.42, 1.7, 0], [1, 1, 1])
    add(new THREE.ConeGeometry(0.42, 2.8, 8), bark, [-1.28, 1.04, 0], [1, 1, 0.9], [0, 0, Math.PI / 2])
    for (const side of [-1, 1]) {
      for (const x of [-0.72, 0.48]) {
        add(new THREE.CylinderGeometry(0.18, 0.26, 1.35, 7), bark, [x, 0.54, side * 0.78], [1, 1, 1], [side * 0.32, 0, x * 0.18])
      }
      add(new THREE.ConeGeometry(0.16, 1.0, 7), thorn, [1.52, 1.2, side * 0.42], [1, 1, 1], [side * 0.18, 0, -Math.PI / 2])
    }
    for (let index = 0; index < 7; index += 1) {
      add(new THREE.ConeGeometry(0.16, 0.82 + index % 2 * 0.18, 7), thorn, [-0.82 + index * 0.3, 2.05, 0], [1, 1, 1], [0, 0, (index - 3) * 0.08])
    }
    for (let index = 0; index < 5; index += 1) {
      add(new THREE.DodecahedronGeometry(0.36, 0), armor, [-0.72 + index * 0.36, 1.83, 0], [1.25, 0.38, 1.05])
    }
    for (const side of [-1, 1]) {
      add(new THREE.ConeGeometry(0.12, 1.1, 7), thorn, [1.58, 1.62, side * 0.34], [1, 1, 1], [side * 0.26, 0, -Math.PI / 2])
      add(new THREE.ConeGeometry(0.14, 1.22, 7), thorn, [0.98, 2.02, side * 0.46], [1, 1, 1], [side * 0.28, 0, -0.55])
    }
    root.add(body)
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(GLOAMWOOD_BOSS.bodyRadius + 0.08, GLOAMWOOD_BOSS.bodyRadius + 0.22, 56).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffd06a, transparent: true, opacity: 0.92, depthWrite: false }),
    )
    targetRing.position.y = 0.04
    root.add(targetRing)
    const telegraph = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 1, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff654d, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    )
    telegraph.position.y = 0.055
    root.add(telegraph)
    const innerTelegraph = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x79e2a6, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    )
    innerTelegraph.position.y = 0.06
    root.add(innerTelegraph)
    const chargeTelegraph = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff8a4f, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    )
    chargeTelegraph.position.y = 0.058
    root.add(chargeTelegraph)
    root.visible = false
    root.name = 'ThornHeartWarden'
    this.scene.add(root)
    this.bossVisual = { root, body, materials, targetRing, telegraph, innerTelegraph, chargeTelegraph }
  }

  private createPreyVisual(prey: GloamwoodNestPrey) {
    const root = new THREE.Group()
    const body = new THREE.Group()
    root.name = `NestPrey-${prey.id}`
    root.userData.preyId = prey.id
    root.add(body)
    const materials: THREE.MeshStandardMaterial[] = []
    const material = (color: number, roughness = 0.78, emissive = 0x000000) => {
      const value = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.01, emissive })
      materials.push(value)
      return value
    }
    const add = (geometry: THREE.BufferGeometry, value: THREE.Material, position: [number, number, number], scale: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometry, value)
      mesh.position.set(...position)
      mesh.scale.set(...scale)
      mesh.rotation.set(...rotation)
      mesh.castShadow = true
      mesh.receiveShadow = true
      body.add(mesh)
      return mesh
    }

    if (prey.kind === 'fang') {
      const hide = material(0xa43c31, 0.76)
      const dark = material(0x321d22, 0.9)
      const bone = material(0xe0c47e, 0.7)
      add(new THREE.IcosahedronGeometry(0.66, 1), hide, [-0.12, 0.7, 0], [1.42, 0.68, 0.72])
      add(new THREE.DodecahedronGeometry(0.48, 1), dark, [0.74, 0.68, 0], [1.25, 0.62, 0.72])
      add(new THREE.ConeGeometry(0.26, 1.7, 8), hide, [-1.02, 0.68, 0], [0.75, 1, 0.72], [0, 0, Math.PI / 2])
      for (const side of [-1, 1]) {
        add(new THREE.ConeGeometry(0.105, 0.75, 7), bone, [1.2, 0.58, side * 0.24], [1, 1, 1], [side * 0.24, 0, -Math.PI / 2])
        for (const x of [-0.45, 0.38]) add(new THREE.CylinderGeometry(0.07, 0.11, 0.72, 7), dark, [x, 0.3, side * 0.48], [1, 1, 1], [side * 0.8, 0, x * 0.22])
      }
      for (let index = 0; index < 4; index += 1) add(new THREE.ConeGeometry(0.09, 0.42, 6), bone, [0.42 - index * 0.36, 1.18, 0], [1, 1, 1])
    } else if (prey.kind === 'shell') {
      const plate = material(0x3a746c, 0.58)
      const rim = material(0x79a77b, 0.7)
      const under = material(0x172f31, 0.92)
      add(new THREE.SphereGeometry(0.88, 18, 12), plate, [-0.16, 0.76, 0], [1.35, 0.75, 1.04])
      add(new THREE.CylinderGeometry(0.72, 0.88, 0.48, 8), rim, [0.73, 0.7, 0], [1, 1.2, 1], [0, 0, -Math.PI / 2])
      add(new THREE.CylinderGeometry(0.6, 0.76, 0.3, 8), plate, [1.12, 0.66, 0], [1, 1.25, 1], [0, 0, -Math.PI / 2])
      add(new THREE.BoxGeometry(0.22, 1.08, 1.38), rim, [0.57, 0.73, 0], [1, 1, 1], [0, 0, -0.1])
      for (const side of [-1, 1]) for (const x of [-0.55, 0.05, 0.58]) add(new THREE.CylinderGeometry(0.075, 0.11, 0.88, 7), under, [x, 0.34, side * 0.68], [1, 1, 1], [side * 0.88, 0, (x + 0.1) * 0.22])
      for (const side of [-1, 1]) add(new THREE.ConeGeometry(0.13, 0.86, 7), rim, [1.52, 0.62, side * 0.28], [1, 1, 1], [side * 0.18, 0, -Math.PI / 2])
      root.scale.setScalar(1.12)
    } else {
      const glow = material(0x9fcf63, 0.56, 0x294314)
      const dark = material(0x263c32, 0.86)
      const wing = material(0xd4e7a2, 0.5, 0x263513)
      add(new THREE.IcosahedronGeometry(0.38, 1), glow, [-0.16, 0.58, 0], [1.28, 0.72, 0.78])
      add(new THREE.DodecahedronGeometry(0.28, 0), dark, [0.36, 0.56, 0], [1.1, 0.78, 0.84])
      for (const side of [-1, 1]) {
        add(new THREE.ConeGeometry(0.08, 0.64, 6), wing, [-0.18, 0.85, side * 0.32], [1, 1, 1], [side * 0.85, 0, -0.2])
        for (const x of [-0.32, 0.1, 0.4]) add(new THREE.CylinderGeometry(0.035, 0.055, 0.56, 6), dark, [x, 0.31, side * 0.36], [1, 1, 1], [side * 0.95, 0, x * 0.3])
      }
      root.scale.setScalar(0.82)
    }

    if (prey.id === GLOAMWOOD_NEST_GUARDIAN.id) {
      root.scale.multiplyScalar(GLOAMWOOD_NEST_GUARDIAN.bodyScale)
      for (const value of materials) {
        value.color.multiplyScalar(0.72)
        value.roughness = Math.min(1, value.roughness + 0.1)
        value.emissive.setHex(0x231207)
        value.emissiveIntensity = 0.28
      }
    }

    const radius = prey.kind === 'shell' ? 1.45 : prey.kind === 'fang' ? 1.12 : 0.76
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xf4d277, transparent: true, opacity: 0.88, depthWrite: false })
    const targetRing = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.12, 40).rotateX(-Math.PI / 2), ringMaterial)
    targetRing.position.y = 0.025
    targetRing.visible = false
    root.add(targetRing)
    const telegraphMaterial = new THREE.MeshBasicMaterial({ color: prey.kind === 'shell' ? 0xffa640 : 0xff5b46, transparent: true, opacity: 0, depthWrite: false })
    // A unit ring. Its size is not knowable here - it depends on the player's
    // body, which grows with every evolution - so syncPreyVisuals scales it
    // every frame from the same function the hit test uses.
    const telegraph = new THREE.Mesh(new THREE.RingGeometry(0.34, 1, 44).rotateX(-Math.PI / 2), telegraphMaterial)
    telegraph.position.y = 0.04
    root.add(telegraph)
    this.scene.add(root)
    const visual: PreyVisual = { root, body, materials, telegraph, targetRing, flashRemaining: 0, impactRemaining: 0, impactDuration: 0.22, impactStrength: 0 }
    this.applyPreyModel(visual, prey)
    this.preyVisuals.set(prey.id, visual)
    return visual
  }

  private async loadCharacter(stageOverride?: number, familyOverride?: Quality3DFormFamily) {
    const params = new URLSearchParams(window.location.search)
    const requestedStage = stageOverride ?? Number(params.get('evolutionStage'))
    // The documented MapLab 5 entries already carry evolutionRoute, but only the
    // stage was ever read, so a route could not be inspected without playing to
    // the evolution. Reading it here lets any form be loaded straight into the
    // free-movement hunt, which is where footprint and traversal are checked.
    if (!familyOverride) {
      const route = params.get('evolutionRoute')
      if (route === 'fang' || route === 'shell' || route === 'swarm') this.characterFamily = route
    }
    const stage = requestedStage >= 2 ? 2 : requestedStage >= 1 ? 1 : 0
    this.stage = stage
    if (familyOverride) this.characterFamily = familyOverride
    const resolved = resolveQuality3DGLBAsset(stage, this.characterFamily)
    const asset = resolved.asset
    // Keyed by form, not by stage. Selecting on stage alone meant all three
    // stage-1 bodies ran the Fang gecko's damage, reach, timing and combo, so
    // the per-form combat blocks in their presentation modules were dead data
    // and every form fought identically no matter what it looked like.
    this.characterFormId = asset?.formId
    const combat = gloamwoodFormCombatProfile(asset?.formId, stage)
    this.combatProfile = combat.profile
    this.combatProfileMatchedForm = combat.matchedForm
    this.characterFamilyMatched = resolved.matchedFamily
    if (!asset) throw new Error(`Missing stage-${stage} GLB`)
    const gltf = await this.loader.loadAsync(assetUrl(asset.url))
    if (this.disposed) return
    this.actions.clear()
    this.tailNodes.length = 0
    this.clearMutationBodyAttachments()
    this.mixer?.stopAllAction()
    if (this.character) this.characterRoot.remove(this.character)
    if (this.evolutionAccent) {
      this.characterRoot.remove(this.evolutionAccent)
      this.evolutionAccent = undefined
    }
    this.character = gltf.scene
    gltf.scene.rotation.y = asset.modelYaw ?? 0
    gltf.scene.traverse((node) => {
      if (node.name === 'Icosphere') {
        node.visible = false
        node.castShadow = false
        node.receiveShadow = false
        return
      }
      node.castShadow = true
      node.receiveShadow = true
      if (/^Tail_\d+$/.test(node.name) || asset.rig?.tail.includes(node.name)) this.tailNodes.push(node)
      if (!(node instanceof THREE.Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue
        // Keyed by form, not by stage, for the same reason the grade below it
        // is: this one drops the normal map, which is right for the hunter's
        // smooth toon surface and destructive for a body whose identity is
        // plate relief. `stage === 2` and `scarlet-hunter` are the same set
        // today, so this changes nothing now - it changes what happens when the
        // Shell line's contracted stage-2 body arrives.
        if (asset.formId === 'scarlet-hunter') {
          material.flatShading = false
          material.normalMap = null
          material.roughness = 0.82
          material.metalness = 0
          material.envMapIntensity = 0.48
          material.needsUpdate = true
        } else if (asset.formId === 'scarlet-gecko') {
          // This whole grade is tuned for the scarlet gecko's coral/teal/cream
          // source and its over-bright emissive export. Applying it by stage
          // instead of by form tinted the Shell body warm, added an emissive
          // fill that erases body planes, and cut its normal map to 62%, which
          // flattened the plate relief into a muddy patch.
          material.flatShading = false
          material.color.setHex(SCARLET_GECKO_PRESENTATION.material.colorTint)
          material.roughness = THREE.MathUtils.clamp(
            material.roughness,
            SCARLET_GECKO_PRESENTATION.material.minimumRoughness,
            SCARLET_GECKO_PRESENTATION.material.maximumRoughness,
          )
          material.metalness = 0
          material.envMapIntensity = SCARLET_GECKO_PRESENTATION.material.environmentIntensity
          // The Meshy export reused its base-color texture as a full-strength
          // emissive map. Keep only a restrained color fill so the forest
          // lights shape the body without crushing texture detail in shadow.
          material.emissive.setHex(0xffffff)
          material.emissiveMap = material.map
          material.emissiveIntensity = SCARLET_GECKO_PRESENTATION.material.emissiveIntensity
          applyScarletGeckoSurfaceGrade(material)
          if (material.normalMap) material.normalScale.setScalar(SCARLET_GECKO_PRESENTATION.material.normalStrength)
          material.needsUpdate = true
        } else if (asset.formId === 'spore-stalker' || asset.formId === 'lantern-lynx') {
          // Graded by form for the same reason the branch above is: this hide is
          // a near-black teal that has to stay dark and take light, which is the
          // opposite of what the scarlet-gecko grade does.
          //
          // Both Swarm forms share it. Without this the stage-2 body fell into
          // the generic branch below and took a 0.58-0.84 roughness clamp and a
          // 0.55 environment intensity that were never chosen for it - the same
          // class of silent substitution the combat profile used to make.
          const grade = asset.formId === 'lantern-lynx'
            ? LANTERN_LYNX_PRESENTATION.material
            : SPORE_STALKER_PRESENTATION.material
          material.flatShading = false
          material.roughness = THREE.MathUtils.clamp(material.roughness, grade.minimumRoughness, grade.maximumRoughness)
          material.metalness = Math.min(material.metalness, grade.maximumMetalness)
          material.envMapIntensity = grade.environmentIntensity
          // Emissive is genuine on this form, but it is a baked mask covering
          // 5.7% of the texture - the spore sac, spine speckles and eye. Never
          // substitute the base-color map here the way the scarlet-gecko branch
          // does: that lights the whole body, and the sac stops being the
          // brightest thing on a creature whose silhouette is built around it.
          material.emissiveIntensity = grade.emissiveIntensity
          material.needsUpdate = true
        } else {
          material.roughness = THREE.MathUtils.clamp(material.roughness, 0.58, 0.84)
          material.metalness = Math.min(material.metalness, 0.08)
          material.envMapIntensity = 0.55
        }
      }
    })
    gltf.scene.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(gltf.scene)
    const size = bounds.getSize(new THREE.Vector3())
    const scale = gloamwoodCharacterWorldHeight(stage, this.characterFamily) / Math.max(0.001, size.y)
    gltf.scene.scale.setScalar(scale)
    gltf.scene.updateMatrixWorld(true)
    const groundedBounds = new THREE.Box3().setFromObject(gltf.scene)
    gltf.scene.position.y -= groundedBounds.min.y
    this.characterRoot.add(gltf.scene)
    this.refreshMutationBodyPresentation()
    this.cachePlayerVisualGroundRadius()
    this.mixer = new THREE.AnimationMixer(gltf.scene)
    for (const sourceClip of gltf.animations) {
      // The yaw/roll damping is a scarlet-gecko-specific repair for its source
      // Run's excessive torso sway. It must follow that form, not the stage, or
      // it flattens the authored motion of every other stage-1 body.
      const stabilized = asset.formId === 'scarlet-gecko' ? stabilizeScarletGeckoLocomotionClip(sourceClip) : sourceClip
      // The early forms' strikes measured far quieter than the late ones - the
      // Fang stage-1 Bite moves twelve degrees across the whole body. Amplified
      // here rather than re-exported because two of the four affected forms
      // have no source in this repository to re-export from.
      const clip = amplifyGloamwoodAttackClip(stabilized, asset.formId)
      this.actions.set(clip.name, this.mixer.clipAction(clip))
    }
    this.modelReady = true
    this.setAction('Idle', true)
  }

  /**
   * Removes only the small meshes created for held mutations. GLB geometry is
   * shared by the loader cache, so it is never disposed here.
   */
  private clearMutationBodyAttachments() {
    for (const attachment of this.mutationBodyAttachments) {
      attachment.parent?.remove(attachment)
      attachment.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry.dispose()
        const materials = Array.isArray(node.material) ? node.material : [node.material]
        for (const material of materials) material.dispose()
      })
    }
    this.mutationBodyAttachments.length = 0
  }

  /**
   * Placeholder geometry is intentionally forbidden here. The earlier
   * foot-needles and forearm rods demonstrated that a primitive can be bound to
   * the correct bone and still look like a broken rig. Mutation bodies wait for
   * an authored/graded model module; confirmed attack and hit feedback remain
   * available for playtesting without pretending a rough proxy is finished.
   */
  private refreshMutationBodyPresentation() {
    this.clearMutationBodyAttachments()
  }

  private bindInput() {
    window.addEventListener('resize', this.resize)
    window.addEventListener('keydown', this.keyDown)
    window.addEventListener('keyup', this.keyUp)
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDown)
    this.renderer.domElement.addEventListener('dblclick', this.suppressGesture)
    // Two-thumb play (joystick plus attack) reads as a pinch in Safari, which
    // ignores `user-scalable=no`. Only Safari fires these gesture events, and
    // they are bound at document level because a page-level pinch does not
    // necessarily originate inside the game container.
    document.addEventListener('gesturestart', this.suppressGesture)
    document.addEventListener('gesturechange', this.suppressGesture)
    document.addEventListener('gestureend', this.suppressGesture)
    document.addEventListener('visibilitychange', this.visibilityChanged)
    this.renderer.domElement.focus()
  }

  private readonly suppressGesture = (event: Event) => {
    event.preventDefault()
  }

  private readonly fullscreenChanged = () => {
    this.audio.resume()
    this.updateFullscreenToggle()
    this.resize()
  }

  private readonly visibilityChanged = () => {
    if (document.visibilityState === 'visible') this.audio.resume()
  }

  private readonly resize = () => {
    const width = Math.max(1, this.container.clientWidth)
    const height = Math.max(1, this.container.clientHeight)
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
    const pixelRatio = resolveGloamwoodRenderPixelRatio(window.devicePixelRatio || 1, coarsePointer)
    this.renderer.setPixelRatio(pixelRatio)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
    // The composer owns its own render targets and will not learn about a new
    // window on its own; one left at the old size stretches the whole frame.
    this.bloom?.setSize(width, height, pixelRatio)
  }

  /**
   * Draw the frame.
   *
   * Every path through `tick` ends here rather than calling the renderer
   * directly. There are five of them - paused, an open offer panel, the result
   * screen, the valley's terminal boss death, and the ordinary frame - and when
   * each made its own render call, any change to how the game is drawn had to
   * be made five times. Bloom applied to only the ordinary frame would ship as
   * a visible flicker every time a panel opened.
   */
  private present() {
    if (!this.bloom) {
      this.renderer.render(this.scene, this.camera)
      return
    }
    // The fog is thinned for the duration of the composer's draw and put back
    // straight after, rather than being scaled once when bloom is switched on.
    // The valley eases its fog density toward a per-region target every frame,
    // so a scale written into the fog itself would be re-applied on top of an
    // already-scaled value and compound away to nothing within a second.
    const fog = this.scene.fog instanceof THREE.FogExp2 ? this.scene.fog : null
    const scale = this.map.bloomFogScale ?? 1
    const authored = fog ? fog.density : 0
    if (fog && scale !== 1) fog.density = authored * scale
    this.bloom.render()
    if (fog && scale !== 1) fog.density = authored
  }

  private readonly keyDown = (event: KeyboardEvent) => {
    this.audio.unlock()
    if (this.paused && this.rebindingAction) {
      event.preventDefault()
      if (event.code === 'Escape') this.rebindingAction = null
      else this.commitInputBinding(this.rebindingAction, event.code)
      this.renderInputBindings()
      return
    }
    if (event.code === this.inputBindings.pause) {
      event.preventDefault()
      this.toggleSettings(!this.paused)
      return
    }
    if (this.paused) return
    if (this.evolutionState.phase === 'choosing') {
      if (event.key === '1' || event.key === '2' || event.key === '3') {
        event.preventDefault()
        this.chooseEvolution(Number(event.key) - 1)
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        this.refreshEvolution()
      }
      return
    }
    this.keys.add(event.code)
    if (event.code === this.inputBindings.lock) {
      event.preventDefault()
      this.toggleEnemyLock()
    }
    if (event.code === this.inputBindings.attack) {
      event.preventDefault()
      // Only the initial press arms the chain. Browsers repeat keydown while a
      // key is held, and re-arming on every repeat put primaryHeld straight back
      // after the order released it, so holding the key still cleared a pack.
      if (!event.repeat) {
        this.primaryHeld = true
        this.requestPrimaryAttack()
      }
    }
  }

  private readonly keyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
    if (event.code === this.inputBindings.attack) this.primaryHeld = false
  }

  private readonly pointerDown = (event: PointerEvent) => {
    this.audio.unlock()
    if (this.paused) return
    if (this.evolutionState.phase === 'choosing') return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    if (this.bossActive() && this.bossVisual && this.raycaster.intersectObject(this.bossVisual.root, true)[0]) {
      this.bossLocked = true
      this.lockedPreyId = null
      this.combatMessage = t('hud.msg.locked', { name: t('creature.boss') })
      return
    }
    for (const prey of this.livePrey()) {
      const visual = this.preyVisuals.get(prey.id)
      if (visual && this.raycaster.intersectObject(visual.root, true)[0]) {
        this.lockedPreyId = prey.id
        this.combatMessage = t('hud.msg.locked', { name: this.preyName(prey) })
        return
      }
    }
    if (!this.ground) return
    const intersection = this.raycaster.intersectObject(this.ground, false)[0]
    if (intersection) this.target.set(intersection.point.x, 0, intersection.point.z)
  }

  /**
   * Runs the frame loop by hand, for a review surface that has no animation frames.
   *
   * The pane these builds get looked at in renders, but never fires
   * requestAnimationFrame - so the debug readout freezes on whatever the last
   * real frame wrote, and anything driven by a mixer never advances. Reading
   * that frozen snapshot as the current state has now cost this session two
   * false diagnoses: a fade that was working and a model load that had already
   * succeeded. Stepping the loop explicitly is the only honest way to inspect
   * time-dependent state there.
   */
  skillFxGainForReview(scale: number) {
    this.skillFxGainScale = scale
    return scale
  }

  fogDensityForReview(density?: number) {
    const fog = this.scene.fog as THREE.FogExp2 | null
    if (!fog) return null
    if (density !== undefined) fog.density = density
    return fog.density
  }

  setBloomForReview(
    enabled: boolean,
    settings?: Partial<GloamwoodBloomSettings>,
    exposureScale?: number,
  ) {
    this.bloom?.dispose()
    this.bloom = undefined
    this.renderer.toneMappingExposure = GLOAMWOOD_EXPOSURE * (enabled ? exposureScale ?? 1 : 1)
    if (!enabled) return false
    this.bloom = createGloamwoodBloom(this.renderer, this.scene, this.camera, {
      ...GLOAMWOOD_BLOOM,
      ...settings,
    }) ?? undefined
    this.resize()
    return this.bloom !== undefined
  }

  stepFramesForReview(frames = 1, delta = 1 / 60) {
    for (let index = 0; index < frames; index += 1) this.tick(delta)
    return this.getDebugState()
  }

  private shouldRenderContinuously() {
    return shouldGloamwoodRenderContinuously({
      paused: this.paused,
      evolutionChoosing: this.evolutionState.phase === 'choosing',
      mutationOffering: this.mutationState.offering,
      terminal: this.runPhase === 'victory' || this.runPhase === 'defeat',
    })
  }

  private requestNextFrame(resetClock = false) {
    if (this.disposed || this.animationFrame !== 0) return
    if (resetClock) this.lastFrameAt = performance.now()
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = 0
      this.tick()
    })
  }

  private tick = (forcedDelta?: number) => {
    if (this.disposed) return
    // Wrapped, not passed directly. The browser hands an rAF callback a
    // timestamp, and `tick` reads its first argument as a forced delta - so
    // registering `this.tick` itself made every real frame look like a manual
    // one, and the loop stopped scheduling after the first. The game ran
    // exactly one frame and then froze, on both maps, with nothing in the
    // console: input still arrived, nothing ever read it.
    if (forcedDelta === undefined && this.shouldRenderContinuously()) this.requestNextFrame()
    const now = forcedDelta === undefined ? performance.now() : this.lastFrameAt + forcedDelta * 1000
    const frameMilliseconds = Math.max(0, now - this.lastFrameAt)
    this.frameCount += 1
    this.performanceSampler.record(frameMilliseconds)
    // Not while paused, and not on a stepped review frame: neither is a frame
    // the device was asked to produce, and both would flatter or ruin the
    // figure depending on which way they went.
    if (!this.paused && forcedDelta === undefined) this.runPerformance.record(frameMilliseconds)
    const delta = Math.min(0.05, frameMilliseconds / 1000)
    this.lastFrameAt = now
    this.foliageTime.value += delta
    this.updateFeedback(delta)
    this.updateDamageNumbers(delta)
    this.updateTargetBar()
    if (this.paused) {
      this.present()
      this.updateHud()
      this.updateDebug()
      return
    }
    // A mutation panel stops the world for the same reason the evolution panel
    // does: two of the five milestones land inside the guardian and boss fights,
    // and reading three rules and three costs while something is still swinging
    // at you is not a choice.
    if (this.evolutionState.phase === 'choosing' || this.mutationState.offering) {
      this.updateCamera(delta)
      this.present()
      this.updateHud()
      this.updateDebug()
      return
    }
    if (this.runPhase === 'victory' || this.runPhase === 'defeat') {
      this.updateCamera(delta)
      this.present()
      this.updateHud()
      this.updateDebug()
      return
    }
    if (this.hitStopRemaining > 0) {
      this.hitStopRemaining = Math.max(0, this.hitStopRemaining - delta)
    } else {
      this.updateCombat(now, delta)
      this.updatePlayer(delta)
      this.updateEnemy(delta)
      this.updateCharacterMotion(delta)
      this.mixer?.update(delta)
      this.applySecondaryMotion()
    }
    this.updateMeat(delta)
    this.updateGeneCores(delta)
    this.updateEliteBursts(delta)
    // `resolvePlayerContact` normally ends the run on the killing hit. Keep
    // the authoritative death-state check here as well: final completion must
    // not depend on whether a particular model/body registry resolved during
    // that contact frame.
    if (this.resolveValleyTerminalBossDeath()) {
      this.updateCamera(delta)
      this.present()
      this.updateHud()
      this.updateDebug()
      return
    }
    this.updateValleyProgression()
    this.updateSessionLog()
    this.updateModelledBoss(delta)
    this.updateHealthDecay(delta)
    this.updateMutationOffers()
    this.updateCamera(delta)
    this.present()
    this.updateHud()
    this.updateDebug()
  }

  /**
   * Hold the player inside the arena during an arena fight.
   *
   * Called from movement and from knockback, because knockback writes the
   * player's position directly and would otherwise walk them out one hit at a
   * time - which is how the boss fight died three quarters of the way in rather
   * than at the start.
   */
  private confineToArena(position: THREE.Vector3) {
    if (this.runPhase !== 'guardian' && this.runPhase !== 'boss') return
    const offsetX = position.x - GLOAMWOOD_BOSS_ARENA.x
    const offsetZ = position.z - GLOAMWOOD_BOSS_ARENA.z
    const distance = Math.hypot(offsetX, offsetZ)
    if (distance <= GLOAMWOOD_ARENA_PLAYER_RADIUS || distance < 0.001) return
    position.x = GLOAMWOOD_BOSS_ARENA.x + offsetX / distance * GLOAMWOOD_ARENA_PLAYER_RADIUS
    position.z = GLOAMWOOD_BOSS_ARENA.z + offsetZ / distance * GLOAMWOOD_ARENA_PLAYER_RADIUS
  }

  private updatePlayer(delta: number) {
    const inputX = Number(this.keys.has(this.inputBindings.moveRight) || this.keys.has('ArrowRight')) - Number(this.keys.has(this.inputBindings.moveLeft) || this.keys.has('ArrowLeft')) + this.touchMoveX
    const inputZ = Number(this.keys.has(this.inputBindings.moveDown) || this.keys.has('ArrowDown')) - Number(this.keys.has(this.inputBindings.moveUp) || this.keys.has('ArrowUp')) + this.touchMoveZ
    const manualMovement = Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01
    // A direction is the player's answer to danger. It must win before an
    // auto-approach can re-arm another swing, otherwise tapping away from a
    // Boss telegraph still spends a frame rooted in the old combo.
    if (manualMovement) {
      this.cancelAutoEngage()
      this.cancelAttackForMovement()
    } else this.updateAutoEngage()
    const cameraRelativeInput = gloamwoodScreenMovementVector(inputX, inputZ, this.cameraOffset)
    this.movement.set(cameraRelativeInput.x, 0, cameraRelativeInput.z)
    if (this.movement.lengthSq() > 0) {
      this.movementInputStrength = Math.min(1, this.movement.length())
      this.movement.normalize()
      this.target.copy(this.playerRoot.position).addScaledVector(this.movement, 1.8)
    } else {
      this.movement.copy(this.target).sub(this.playerRoot.position).setY(0)
      if (this.movement.length() > 0.15) {
        this.movementInputStrength = 1
        this.movement.normalize()
      } else {
        this.movementInputStrength = 0
        this.movement.set(0, 0, 0)
      }
    }
    const hasMovementIntent = this.playerCombat.alive && this.movement.lengthSq() > 0.01
    if (hasMovementIntent) {
      const desiredFacing = gloamwoodMovementFacingRadians(this.movement.x, this.movement.z)
      const turn = stepGloamwoodTurnBeforeMove(this.lastFacing, desiredFacing, delta)
      this.lastFacing = turn.facingRadians
      this.facingErrorDegrees = turn.remainingErrorDegrees
      this.turning = turn.remainingErrorDegrees > 0.1
      this.playerRoot.rotation.y = this.lastFacing
      this.resolveObstacles(this.playerRoot.position)
    } else {
      this.facingErrorDegrees = 0
      this.turning = false
    }
    // The model continues its turn while the body translates. Combat still
    // applies its own target-facing contact gate; this only removes the input
    // freeze that made backing out of a telegraph feel impossible.
    this.moving = hasMovementIntent
    if (this.moving) {
      const next = this.playerRoot.position.clone().addScaledVector(this.movement, PLAYER_SPEED * this.moveSpeedMultiplier * this.movementInputStrength * delta)
      // Tested before it is taken, not corrected afterwards. A confine that
      // pushes a little way inside the limit throws the player back every frame
      // they hold a key against the wall, and they bounce there instead of
      // stopping.
      const stepped = gloamwoodMapStep(this.map, { x: this.playerRoot.position.x, z: this.playerRoot.position.z }, { x: next.x, z: next.z })
      next.x = stepped.x
      next.z = stepped.z
      this.holdValleyGate(next)
      this.confineToArena(next)
      this.resolveObstacles(next)
      // A solid tree/rock can push a player a fraction of a unit while it is
      // resolving. Re-apply the route authority afterwards so collision cannot
      // be used to slip through a shut regional gate.
      if (this.holdValleyGate(next)) this.target.copy(next)
      this.playerRoot.position.x = next.x
      this.playerRoot.position.z = next.z
    }
    this.playerRoot.position.y = this.map.height(this.playerRoot.position.x, this.playerRoot.position.z)
    if (!this.playerCombat.alive) {
      this.setAction('Death')
      return
    }
    if (this.attackState.action) return
    this.setAction(this.moving ? 'Run' : this.turning ? 'Turn' : 'Idle')
  }

  /** Shortest reach in the current form's chain, so approach stops where the
   *  opener can actually land rather than where the longest step could. */
  private primaryAttackReach() {
    // Over the steps this form actually runs. Hardcoding Bite/Pounce/TailSwipe
    // measured a Bite the Swarm chain never throws while ignoring the Claw it
    // leans on, so the approach stopped at the wrong distance for that form.
    return Math.min(...this.combatProfile.primaryCombo.map((action) => this.attackRange(action)))
  }

  private cancelAutoEngage() {
    this.autoEngageTargetId = null
    // The order drives the chain by holding primaryHeld down, so releasing the
    // order has to release that too. Clearing only the bookkeeping left the
    // chain running and one press still cleared a whole pack.
    this.primaryHeld = false
  }

  /** Stop the current basic chain when the player actively chooses movement. */
  private cancelAttackForMovement() {
    if (!this.attackState.action && !this.attackState.buffered) return
    this.attackState = cancelFormalHuntBasicAttack(this.attackState)
    this.primaryHeld = false
    this.attackUntil = 0
    this.attackStartedAt = 0
    this.attackDurationSeconds = 0
    this.leapBiteLandingResolved = false
  }

  /** Identity of whatever is locked right now, so a standing order can tell
   *  that its target was replaced rather than merely moved. */
  private currentLockIdentity() {
    if (this.bossActive() && this.bossLocked) return 'boss'
    const prey = this.lockedPrey()
    return prey && prey.phase !== 'dead' ? prey.id : null
  }

  /** Where whatever is locked stands, how wide it is, and which way it faces. */
  private lockedTargetGeometry() {
    if (this.bossActive() && this.bossLocked) {
      return {
        x: this.bossState.x, z: this.bossState.z, radius: GLOAMWOOD_BOSS.bodyRadius,
        facingRadians: this.bossState.facingRadians, guardsFront: false,
      }
    }
    const prey = this.lockedPrey()
    if (!prey || prey.phase === 'dead') return null
    return {
      x: prey.x, z: prey.z, radius: gloamwoodPreyBodyRadius(prey),
      facingRadians: prey.facingRadians, guardsFront: gloamwoodPreyGuardsItsFront(prey.kind),
    }
  }

  /** The Boss authority names its phase; this only maps it to an actionable
   * player-facing beat. Ordinary prey keep the exact standing-order behaviour
   * they already had. */
  private lockedBossRhythm(): GloamwoodHuntRhythm {
    if (this.bossActive() && this.bossLocked) {
      return resolveGloamwoodHuntRhythm(true, this.bossState.state)
    }
    const prey = this.lockedPrey()
    return resolveGloamwoodHuntRhythm(
      Boolean(prey && gloamwoodValleyBossSpecFor(prey as GloamwoodValleyCreature)),
      prey?.phase,
    )
  }

  /**
   * Close on the locked target along the current bearing and keep the chain
   * running. Never re-aims the approach, and never decides a hit: contact still
   * goes through the same range, live-target and eight-degree checks.
   */
  private updateAutoEngage() {
    if (!this.autoEngageTargetId) return
    if (!this.playerCombat.alive || this.paused || this.evolutionState.phase === 'choosing') return this.cancelAutoEngage()
    // One press commits to one enemy. Killing it auto-locks the next threat and
    // being hit can assist-lock an attacker; without this the order would ride
    // those handovers and clear a whole pack with no further input.
    if (this.currentLockIdentity() !== this.autoEngageTargetId) return this.cancelAutoEngage()
    const target = this.lockedTargetGeometry()
    if (!target) return this.cancelAutoEngage()

    // A standing order can close distance and continue an existing chain, but
    // it cannot decide to tank a telegraph for the player. Keep the lock and
    // leave manual movement completely free; a direction press still cancels
    // the order under Goal 9. Recovery re-opens the same one-button order.
    if (gloamwoodHuntRhythmStopsAutoEngage(this.lockedBossRhythm())) {
      this.primaryHeld = false
      this.target.copy(this.playerRoot.position)
      return
    }

    const dx = target.x - this.playerRoot.position.x
    const dz = target.z - this.playerRoot.position.z
    const centreDistance = Math.hypot(dx, dz)
    // A stray press must not walk the player across the map - but the limit is
    // the lock's reach, not the Gloamwood nest's activation radius, which is a
    // number about a different thing entirely. At 12.6 the player could lock
    // something at 22, press attack, and simply stand there.
    //
    // If it can be locked it can be walked to. That is the whole contract of a
    // lock.
    if (centreDistance > GLOAMWOOD_LOCK_RANGE) return this.cancelAutoEngage()

    const reach = this.primaryAttackReach()
    // Reach is measured to the hurt surface, so the stop line follows the same rule.
    if (centreDistance - target.radius > reach - 0.35) {
      const stand = target.radius + reach - 0.5
      // Approach only closes distance, and the bearing is whatever the player
      // chose - unless that bearing is the arc the target is armoured against,
      // in which case it moves to the nearest edge of it and no further.
      //
      // Head-on is where an unsteered approach always ends up, and head-on is
      // the one place a beetle sheds 72% of the blow while taking 35% extra
      // from anywhere else. The assist was walking the player into the worst
      // angle in the game and they read it as their attack getting weaker.
      const approachAngle = Math.atan2(dz, -dx)
      const angle = target.guardsFront
        ? gloamwoodFlankApproachAngle(target.facingRadians, approachAngle, GLOAMWOOD_SHELL_FRONT_ARC)
        : approachAngle
      this.target.set(target.x + Math.cos(angle) * stand, 0, target.z - Math.sin(angle) * stand)
      return
    }
    this.target.copy(this.playerRoot.position)
    this.primaryHeld = true
    // primaryHeld only continues a chain that is already running; it cannot open
    // one. The swing that opened the order has almost always finished by the
    // time the approach lands, so arriving has to start the next chain itself -
    // otherwise the player walks all the way in and then waits for a second press.
    if (!this.attackState.action) this.requestPrimaryAttack()
  }

  private requestPrimaryAttack() {
    if (this.evolutionState.phase === 'choosing') return
    if (!this.playerCombat.alive) return
    if (this.map.hasNest && this.nestState.phase === 'dormant') {
      this.combatMessage = t('hud.msg.nearNest')
      return
    }
    if (this.runPhase === 'victory' || this.runPhase === 'defeat') return
    if (this.bossActive()) {
      this.bossLocked = true
      this.lockedPreyId = null
    } else if (this.map.hasNest && this.nestState.phase === 'cleared') {
      this.combatMessage = this.evolutionState.phase === 'selected' ? t('hud.msg.bossWaking') : t('hud.msg.chooseEvolution')
      return
    }
    if (!this.bossActive() && !this.lockedPrey()) this.lockedPreyId = this.nearestLivePrey()?.id ?? null
    if (!this.bossLocked && !this.lockedPreyId) {
      this.combatMessage = t('hud.msg.reinforcements')
      return
    }
    // Bind the order to whatever is locked now, after the lock is resolved.
    // A fresh press is what starts the next enemy, so one press is one enemy.
    this.autoEngageTargetId = this.currentLockIdentity()
    // Out of reach is a walk, not a swing.
    //
    // A running attack suppresses movement for its whole duration, so opening
    // the chain here gave the order and then blocked it: the player threw one
    // whiff at empty ground, read "target out of reach", and only started
    // walking once the swing and its recovery had finished. Holding the button
    // renewed the swing before they ever got a step in, which is why it could
    // look like they never moved at all.
    //
    // The approach opens the chain itself when it arrives, so nothing is lost
    // by waiting. Beyond the lock's own range the order will not run, and there
    // the swing and its honest miss are still the right answer.
    const measured = this.lockedTargetGeometry()
    if (measured && gloamwoodPrimaryAttackShouldClose(
      Math.hypot(measured.x - this.playerRoot.position.x, measured.z - this.playerRoot.position.z),
      measured.radius,
      this.primaryAttackReach(),
    )) {
      this.combatMessage = t('hud.msg.closingIn')
      return
    }
    const now = performance.now()
    const previous = this.attackState.action
    this.attackState = requestFormalHuntBasicAttack(this.attackState, now, this.combatProfile)
    const action = this.attackState.action
    if (action && action !== previous) this.startAttackPresentation(action, now)
  }

  private toggleEnemyLock() {
    if (this.bossActive()) {
      this.bossLocked = true
      this.lockedPreyId = null
      this.combatMessage = t('hud.msg.locked', { name: t('creature.boss') })
      return
    }
    const nextId = nextGloamwoodLockTarget(
      this.nestState.prey,
      this.lockedPreyId,
      { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
    )
    if (!nextId) {
      this.lockedPreyId = null
      this.combatMessage = this.nestState.phase === 'cleared' ? t('hud.msg.nestCleared') : t('hud.msg.noTarget')
      return
    }
    const next = this.nestState.prey.find((prey) => prey.id === nextId)!
    this.lockedPreyId = nextId
    this.combatMessage = t('hud.msg.locked', { name: this.preyName(next) })
  }

  private updateCombat(now: number, delta: number) {
    this.knockbackRecoverySeconds = Math.max(0, this.knockbackRecoverySeconds - delta)
    const previousAlive = this.playerCombat.alive
    this.playerCombat = stepGloamwoodPlayerCombat(this.playerCombat, delta)
    if (!previousAlive && this.playerCombat.alive) {
      this.playerCombat = { ...this.playerCombat, invulnerabilitySeconds: 1.5 }
      // Respawning at the hunt's spawn point during the guardian or the boss
      // would teleport the player out of the encounter they just spent a life
      // on, and neither fight can be re-entered.
      const arenaFight = this.runPhase === 'guardian' || this.runPhase === 'boss'
      if (arenaFight) {
        this.playerRoot.position.set(
          GLOAMWOOD_BOSS_ARENA.playerX,
          this.map.height(GLOAMWOOD_BOSS_ARENA.playerX, GLOAMWOOD_BOSS_ARENA.playerZ),
          GLOAMWOOD_BOSS_ARENA.playerZ,
        )
      } else {
        // Where the *map* put them when the life was spent, not the Gloamwood's
        // hardcoded spawn. This ran on the valley too and teleported the player
        // to (-6, 3) at ground level zero a few seconds after they clicked
        // revive: a blank patch behind the head of the route, off the corridor,
        // with no scatter on it - and the first step they took slid them back
        // onto the road, which is what made it read as the game changing its
        // mind about where they were.
        const back = this.respawnAt ?? this.map.spawn
        const moved = Math.hypot(back.x - this.playerRoot.position.x, back.z - this.playerRoot.position.z)
        this.playerRoot.position.set(back.x, this.map.height(back.x, back.z), back.z)
        if (moved > 0.5) this.snapCameraNextFrame = true
      }
      this.respawnAt = null
      this.target.copy(this.playerRoot.position)
      this.attackState = createFormalHuntBasicAttackState()
      this.combatMessage = t('hud.msg.backToHunt')
      this.setAction('Idle', true)
    }
    if (!this.playerCombat.alive) return

    // updateCombat runs before updatePlayer. Cancel here as well, so the frame
    // in which a direction is pressed cannot still resolve a late melee hit or
    // keep the player rooted before the movement pass receives that input.
    if (hasPressedGloamwoodMovement(this.keys, this.inputBindings, this.touchMoveX, this.touchMoveZ)) {
      // Combat is evaluated before movement. Cancel the standing order here as
      // well, so even a very brief direction tap cannot be followed by the
      // auto-engage path immediately starting another Bite.
      this.cancelAutoEngage()
      this.cancelAttackForMovement()
    }

    const locked = this.lockedPrey()
    const lockedPosition = this.bossActive() && this.bossLocked ? this.bossState : locked
    if (this.attackState.action && lockedPosition) {
      const dx = lockedPosition.x - this.playerRoot.position.x
      const dz = lockedPosition.z - this.playerRoot.position.z
      const targetFacing = gloamwoodMovementFacingRadians(dx, dz)
      this.lastFacing = turnFormalHuntAttackToward(this.lastFacing, targetFacing, delta)
      this.playerRoot.rotation.y = this.lastFacing
      this.resolveObstacles(this.playerRoot.position)
    }
    const previousAction = this.attackState.action
    const update = updateFormalHuntBasicAttack(this.attackState, now, this.primaryHeld, this.combatProfile)
    this.attackState = update.state
    if (update.contactAction) this.resolvePlayerContact(update.contactAction)
    if (this.attackState.action !== previousAction && this.attackState.action) this.startAttackPresentation(this.attackState.action, now)
  }

  private startAttackPresentation(action: FormalHuntBasicAttackAction, now: number) {
    this.onboardingAttackStarted = true
    this.playSound(action === 'Bite' ? 'attack-bite' : action === 'Pounce' ? 'attack-pounce' : action === 'Claw' ? 'attack-claw' : 'attack-tail')
    this.attackStartedAt = now
    this.attackDurationSeconds = this.attackWindowSeconds(action)
    this.attackUntil = now + this.attackDurationSeconds * 1000
    if (action === 'Pounce') this.leapBiteLandingResolved = false
    this.setAction(action, true)
  }

  private resolvePlayerContact(action: FormalHuntBasicAttackAction) {
    if (this.bossActive() && this.bossLocked) {
      this.resolveBossContact(action)
      return
    }
    const target = this.lockedPrey()
    if (!target) {
      this.combatMessage = t('hud.msg.missNoLock')
      return
    }
    const dx = target.x - this.playerRoot.position.x
    const dz = target.z - this.playerRoot.position.z
    const distance = Math.hypot(dx, dz)
    const targetRadius = gloamwoodPreyBodyRadius(target)
    const surfaceDistance = formalHuntTargetSurfaceDistance(distance, targetRadius)
    const targetFacing = gloamwoodMovementFacingRadians(dx, dz)
    const range = this.attackRange(action)
    const valid = canFormalHuntBasicAttackContact({
      targetLocked: this.lockedPreyId === target.id,
      targetAvailable: target.phase !== 'dead',
      distance,
      range,
      aimErrorDegrees: formalHuntAttackAimErrorDegrees(this.lastFacing, targetFacing),
      targetRadius,
    })
    this.logSession({
      kind: 'attack', by: 'player', who: target.kind, action, hit: valid, distance: Number(surfaceDistance.toFixed(2)),
      reason: valid ? undefined : surfaceDistance > range ? 'out-of-range' : 'off-angle',
    })
    if (!valid) {
      this.combatMessage = surfaceDistance > range ? t('hud.msg.missRange') : t('hud.msg.missAngle')
      return
    }
    const combo = this.combatProfile.primaryCombo
    const isFinisher = action === combo[combo.length - 1]
    const knockback = (action === 'TailSwipe' ? 0.72 : action === 'Pounce' ? 0.52 : 0.34)
      + (action === 'TailSwipe' ? 0 : this.mutationEffects.frontHitKnockback ?? 0)
      + (isFinisher ? this.mutationEffects.finisherKnockback ?? 0 : 0)
    const baseDamage = this.attackBaseDamage(action)
      * this.mutationDamageMultiplierAgainst(target.health / target.maxHealth)
    const damage = damageGloamwoodNestPrey(
      this.nestState,
      target.id,
      Math.round(baseDamage * this.damageMultiplier),
      action,
      { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
      knockback,
    )
    this.nestState = damage.state
    if (action !== 'TailSwipe' && this.mutationState.taken.includes('fang-thin-hide')) {
      this.logSession({ kind: 'mutation-effect', id: 'fang-thin-hide', effect: 'rending-hit' })
    }
    if (action === 'TailSwipe' && damage.effectiveDamage > 0 && this.mutationEffects.tailSwipeCleaveRadius) {
      this.nestState = suppressGloamwoodNestPreyAround(
        this.nestState,
        this.playerRoot.position,
        this.mutationEffects.tailSwipeCleaveRadius,
        1.15,
        target.id,
      )
      this.spawnTailSuppressionFeedback()
      this.logSession({ kind: 'mutation-effect', id: 'shell-quake', effect: 'tail-suppression' })
    }
    this.struckThisFrame.push(target.id)
    this.playSound(damage.killed ? 'kill' : action === 'Pounce' || action === 'TailSwipe' ? 'hit-heavy' : 'hit-light')
    let displayedBiomass = damage.biomassGained
    if (damage.killed && this.biomassMultiplier !== 1) {
      displayedBiomass = Math.round(damage.biomassGained * this.biomassMultiplier)
      this.nestState = { ...this.nestState, biomass: this.nestState.biomass + displayedBiomass - damage.biomassGained }
      if (this.mutationState.taken.includes('neutral-starving-metabolism')) {
        this.spawnMetabolicFeedback('gain')
        this.logSession({ kind: 'mutation-effect', id: 'neutral-starving-metabolism', effect: 'metabolic-gain' })
      }
    }
    if (damage.killed && this.mutationEffects.bonusOfferEveryKills) {
      this.killsTowardBonusOffer += 1
      if (this.killsTowardBonusOffer >= this.mutationEffects.bonusOfferEveryKills) {
        this.killsTowardBonusOffer = 0
        this.bonusOffersEarned += 1
      }
    }
    if (damage.killed && this.killHeal > 0) {
      const before = this.playerCombat.health
      this.playerCombat = { ...this.playerCombat, health: Math.min(this.playerCombat.maxHealth, before + this.killHeal) }
      const restored = this.playerCombat.health - before
      if (restored > 0) {
        this.spawnFeedingFeedback(restored)
        if (this.mutationState.taken.includes('neutral-gluttony')) {
          this.logSession({ kind: 'mutation-effect', id: 'neutral-gluttony', effect: 'feeding-heal' })
        }
      }
    }
    const recipe = getQuality3DAttackFeedback(action)
    this.hitStopRemaining = recipe.hitStopSeconds
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.4 * recipe.cameraTraumaMultiplier)
    const visual = this.preyVisuals.get(target.id)
    if (visual) {
      visual.flashRemaining = this.feedbackSettings.flash ? 0.15 : 0
      visual.impactDuration = recipe.hitStopSeconds + 0.2
      visual.impactRemaining = visual.impactDuration
      // A hit that did not cut the creature's action short gets a much smaller
      // reaction. Playing the full stagger on every hit made the guardian look
      // perpetually interrupted long after it had stopped being interrupted -
      // measured at one wasted wind-up per thirty seconds, against a stagger on
      // every single hit.
      const reaction = action === 'TailSwipe' ? 1 : action === 'Pounce' ? 0.94 : 0.76
      visual.impactStrength = damage.interrupted ? reaction : reaction * 0.34
      if (!damage.interrupted) visual.impactDuration = recipe.hitStopSeconds + 0.08
      visual.impactRemaining = visual.impactDuration
    }
    this.spawnSlashFeedback(action, target)
    // Feedback goes where the player is looking - on the target - rather than
    // into a corner of the HUD. The number is the resolved authoritative result.
    this.spawnDamageNumber(
      new THREE.Vector3(target.x, gloamwoodCharacterWorldHeight(1) * 0.9, target.z),
      damage.effectiveDamage,
      damage.killed ? 'kill' : damage.blocked ? 'blocked' : damage.weakness ? 'weakness' : 'hit',
    )
    // A blue-grey 6 does not teach anything. The shell family sheds 72% of a
    // frontal blow and takes 35% *extra* from anywhere else, which is the
    // sharpest decision in the game - and a player who has not been told simply
    // reads it as "my attack is weak now" and grinds through fifteen hits.
    if (damage.blocked && !damage.killed) this.combatMessage = t('hud.msg.blockedFront')
    if (damage.killed) {
      this.dropMeat(target)
      if ((target as GloamwoodValleyCreature).tier === 'elite') this.dropGeneCore(target, 'elite')
    }
    if (damage.burst) this.spawnEliteBurst(damage.burst)
    if (damage.splits) this.spawnEliteBrood(target)
    if (damage.killed) {
      this.combatMessage = target.id === GLOAMWOOD_NEST_GUARDIAN.id
        ? t('hud.msg.guardianDown', { name: t('creature.guardian') })
        : t('hud.msg.kill', { name: this.preyName(target), biomass: displayedBiomass, gene: this.geneName(target.kind) })
      this.lockedPreyId = this.nearestLivePrey()?.id ?? null
      this.handleValleyBossDefeat(target)
    }
  }

  /**
   * Region bosses are ordinary creatures for movement and damage, but their
   * deaths are run boundaries. Previously that connection existed only in the
   * map's pure milestone query: a gate could stay conceptually closed while a
   * dead boss lay behind it, and the final boss never ended the run.
   */
  private handleValleyBossDefeat(target: GloamwoodNestPrey) {
    if (this.map.id !== 'valley') return
    const creature = target as GloamwoodValleyCreature
    if (creature.tier !== 'boss') return
    const resolution = resolveGloamwoodValleyBossDefeat(this.valleyProgression, creature.region)
    const { milestone } = resolution
    this.valleyProgression = resolution.state
    if (resolution.victory) {
      this.completeRunVictory()
      return
    }
    // The pass unlocks on the authoritative defeat, but the existing mutation
    // milestone waits for the visible Boss Core to be claimed. That turns what
    // used to feel like an invisible bookkeeping event into a clear reward,
    // without adding a sixth choice, a new skill, or a separate upgrade table.
    if (milestone) {
      this.pendingBossCoreMilestones.add(milestone.id)
      this.dropGeneCore(target, 'boss', milestone.id)
    }
    this.combatMessage = t('hud.msg.bossCoreDropped', { name: this.preyName(target) })
  }

  /** Safety net for every way a valley creature can become dead. */
  private resolveValleyTerminalBossDeath() {
    if (this.map.id !== 'valley' || this.runPhase !== 'hunt') return false
    const terminalBoss = this.nestState.prey.find((prey) =>
      gloamwoodValleyTerminalBossDefeated(prey as GloamwoodValleyCreature),
    )
    if (!terminalBoss) return false
    this.completeRunVictory()
    return true
  }

  private resolveBossContact(action: FormalHuntBasicAttackAction) {
    const dx = this.bossState.x - this.playerRoot.position.x
    const dz = this.bossState.z - this.playerRoot.position.z
    const distance = Math.hypot(dx, dz)
    const surfaceDistance = formalHuntTargetSurfaceDistance(distance, GLOAMWOOD_BOSS.bodyRadius)
    const targetFacing = gloamwoodMovementFacingRadians(dx, dz)
    const range = this.attackRange(action)
    const valid = canFormalHuntBasicAttackContact({
      targetLocked: this.bossLocked,
      targetAvailable: this.bossActive(),
      distance,
      range,
      aimErrorDegrees: formalHuntAttackAimErrorDegrees(this.lastFacing, targetFacing),
      targetRadius: GLOAMWOOD_BOSS.bodyRadius,
    })
    if (!valid) {
      this.combatMessage = surfaceDistance > range ? t('hud.msg.missBossRange') : t('hud.msg.missAngle')
      return
    }
    const baseDamage = this.attackBaseDamage(action)
    const result = damageGloamwoodBoss(
      this.bossState,
      baseDamage
        * this.damageMultiplier
        * this.mutationDamageMultiplierAgainst(this.bossState.health / this.bossState.maxHealth),
    )
    this.bossState = result.state
    if (result.effectiveDamage <= 0) return
    this.playSound(result.defeated ? 'kill' : action === 'Pounce' || action === 'TailSwipe' ? 'hit-heavy' : 'hit-light')
    this.hitStopRemaining = result.defeated ? 0.13 : 0.065
    this.cameraTrauma = Math.min(1, this.cameraTrauma + (result.defeated ? 0.9 : 0.5))
    this.spawnBossHitFeedback(action)
    this.spawnDamageNumber(
      new THREE.Vector3(this.bossState.x, GLOAMWOOD_BOSS.bodyRadius * 1.35, this.bossState.z),
      result.effectiveDamage,
      result.defeated ? 'kill' : 'hit',
    )
    if (result.defeated) this.combatMessage = t('hud.msg.bossDown', { name: t('creature.boss') })
    if (result.defeated) this.completeRunVictory()
  }

  private spawnBossHitFeedback(action: FormalHuntBasicAttackAction) {
    const target: GloamwoodNestPrey = {
      id: GLOAMWOOD_BOSS.id,
      kind: 'shell',
      phase: 'stunned',
      phaseElapsed: 0,
      health: this.bossState.health,
      maxHealth: this.bossState.maxHealth,
      x: this.bossState.x,
      z: this.bossState.z,
      facingRadians: this.bossState.facingRadians,
      attackResolved: false,
      slot: 0,
    }
    this.spawnSlashFeedback(action, target)
  }

  private combatHitFeedback() {
    // Follows the armed profile rather than the stage. Keyed on stage this
    // returned the Fang gecko's damage and reach for every stage-1 body, so
    // giving a form its own combat block changed the order of its chain and
    // nothing else about it.
    return this.combatProfile.hitFeedback
  }

  /** Authoritative reach for one chain step, from the armed profile. */
  private attackRange(action: FormalHuntBasicAttackAction) {
    const feedback = this.combatHitFeedback()
    if (action === 'Pounce') return feedback.pounceRange
    if (action === 'Claw') return feedback.clawRange
    if (action === 'TailSwipe') return feedback.tailSwipeRange * (this.mutationEffects.tailSwipeRangeMultiplier ?? 1)
    return feedback.biteRange
  }

  /** Authoritative damage for one chain step, from the armed profile. */
  private attackBaseDamage(action: FormalHuntBasicAttackAction) {
    const feedback = this.combatHitFeedback()
    if (action === 'Pounce') return feedback.pounceDamage
    if (action === 'Claw') return feedback.clawDamage
    if (action === 'TailSwipe') return feedback.tailSwipeDamage
    return feedback.biteDamage
  }

  /**
   * Mutation multipliers that depend on the target rather than the attack.
   *
   * Kept beside the base damage so every caller picks them up. Killer Instinct
   * paying out only on the prey path and not on the boss is exactly the kind of
   * split this file has been consolidating all day.
   */
  private mutationDamageMultiplierAgainst(healthFraction: number) {
    const effects = this.mutationEffects
    let multiplier = 1
    if (effects.executeBelow !== undefined && effects.executeMultiplier !== undefined
      && healthFraction < effects.executeBelow) multiplier *= effects.executeMultiplier
    if (effects.healthyTargetMultiplier !== undefined && healthFraction >= 0.999) {
      multiplier *= effects.healthyTargetMultiplier
    }
    return multiplier
  }

  /** Whether the short, non-hostile opening guide is still in effect. */
  private valleyOpeningSafetyActive(delta: number) {
    if (this.map.hasNest || this.onboardingAttackStarted) return false
    const moved = Math.hypot(
      this.playerRoot.position.x - this.map.spawn.x,
      this.playerRoot.position.z - this.map.spawn.z,
    )
    // Once the player intentionally takes the road, normal awareness is more
    // useful than protection. The grace time covers reading the compact guide
    // at spawn, not travelling through an encounter without risk.
    if (moved >= 14 || this.valleyOpeningSafetySeconds <= 0) {
      this.valleyOpeningSafetySeconds = 0
      return false
    }
    this.valleyOpeningSafetySeconds = Math.max(0, this.valleyOpeningSafetySeconds - delta)
    return true
  }

  private updateEnemy(delta: number) {
    if (this.bossActive()) {
      this.updateBoss(delta)
      return
    }
    const frame = this.map.stepCreatures(this.nestState, delta, {
      x: this.playerRoot.position.x,
      z: this.playerRoot.position.z,
      alive: this.playerCombat.alive,
      bodyRadius: gloamwoodPlayerCombatBodyRadius(this.stage, this.characterFamily),
      // Sporehaze slows whatever is already on top of the player. It is not a
      // lure: nothing in this game may pull more prey in until the map can tell
      // an aggressive creature from a passive one.
      slowAuraRadius: this.mutationEffects.slowAuraRadius,
      slowAuraFactor: this.mutationEffects.slowAuraFactor,
    }, this.struckThisFrame, { allowNotice: !this.valleyOpeningSafetyActive(delta) })
    this.struckThisFrame.length = 0
    // stepGloamwoodNest already holds prey at their action ring, and it does so
    // knowing where each one stood a frame ago - which is how it tells a prey
    // that closed the gap from a player who walked in. Re-running the same
    // separation here without that history treated every overlap as the prey's
    // fault and put the plough behaviour straight back.
    this.nestState = frame.state
    this.announceAwakenedThreats()
    if (this.runPhase === 'guardian') {
      this.nestState = {
        ...this.nestState,
        prey: this.nestState.prey.map((prey) => clampGloamwoodPreyToArena(prey, GLOAMWOOD_BOSS_ARENA, GLOAMWOOD_BOSS_ARENA_RADIUS)),
      }
    }
    for (const event of frame.events) {
      if (event.type === 'nest-started') {
        this.combatMessage = t('hud.msg.nestAwake')
        continue
      }
      if (event.type === 'wave-started') {
        this.lockedPreyId = nextGloamwoodLockTarget(
          this.nestState.prey,
          null,
          { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
        )
        this.combatMessage = t('hud.msg.waveStart', { wave: event.wave, hint: this.waveHint(event.wave) })
        this.ensureUpcomingDefenceBossBody()
        continue
      }
      if (event.type === 'defence-altar-damaged') {
        // The one number this mode is lost by, said out loud every time it
        // moves. A player who never sees the altar take a hit cannot learn that
        // letting something past is what costs them the run.
        this.combatMessage = t('hud.msg.altarStruck', { remaining: event.remaining, max: event.max })
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.22)
        // The same cue an enemy landing on the player gets: on this map the
        // altar is the second thing that can be hurt, and the player has to
        // hear it happen behind them.
        this.playSound('enemy-hit-player')
        continue
      }
      if (event.type === 'defence-run-won') {
        this.completeRunVictory()
        continue
      }
      if (event.type === 'defence-run-lost') {
        this.completeRunDefeat(t('hud.msg.altarFell'))
        continue
      }
      if (event.type === 'wave-cleared') {
        if (this.map.id === 'defence') {
          this.lockedPreyId = null
          this.combatMessage = t('hud.msg.waveClear', { wave: event.wave })
          this.presentDefenceGrowth(event.wave)
          continue
        }
        // Guardian waves are not hunt waves; the guardian pays out on its own
        // milestone below, or it would grant two.
        if (this.runPhase === 'hunt' && event.wave < GLOAMWOOD_NEST.waveCount) {
          this.mutationState = recordGloamwoodMutationMilestone(this.mutationState, `wave-${event.wave}-cleared`)
        }
        this.lockedPreyId = null
        this.combatMessage = event.wave >= GLOAMWOOD_NEST.waveCount ? t('hud.msg.lastWave') : t('hud.msg.waveClear', { wave: event.wave })
        continue
      }
      if (event.type === 'nest-cleared') {
        this.mutationState = recordGloamwoodMutationMilestone(
          this.mutationState,
          this.runPhase === 'guardian' ? 'guardian-defeated' : 'nest-cleared',
        )
        this.lockedPreyId = null
        if (this.runPhase === 'guardian') {
          this.combatMessage = t('hud.msg.guardianBroken', { name: t('creature.guardian') })
          // The guardian's reward is taken between the two fights, not during
          // the boss it leads straight into, so the boss waits for the pick.
          if (!this.presentGuardianMutation()) this.startBossEncounter()
          continue
        }
        this.combatMessage = t('hud.msg.nestDone', { biomass: event.biomass })
        this.evolutionState = openGloamwoodEvolutionOffer(this.evolutionState, this.nestState.genes, this.nestState.recentHunts)
        this.runPhase = 'evolution'
        this.showEvolutionOverlay()
        continue
      }
      if (event.type === 'boss-enraged') {
        // Said out loud, because the tell is that the patterns changed rather
        // than that a bar moved. The colour of every telegraph shifts with it.
        const enraged = this.nestState.prey.find((prey) => prey.id === event.preyId)
        const boss = enraged ? gloamwoodValleyBossSpecFor(enraged as GloamwoodValleyCreature) : undefined
        this.combatMessage = t('hud.msg.bossEnraged', { name: boss?.displayName ?? '' })
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.7)
        this.playSound('boss-phase')
        continue
      }
      if (event.type === 'valley-nest-entered') {
        // Announced, because it is the one fight on this map the player does
        // not get to walk around. Unannounced it read as the respawn timer
        // being broken: three creatures killed, three more 1.6 seconds later,
        // nothing said.
        this.combatMessage = t('hud.msg.valleyNestEntered', { waves: event.waves })
        // The phase-change sting, borrowed: it is the game's existing "this
        // just became a fight" sound, and inventing a second one for the same
        // meaning is how a soundscape stops meaning anything.
        this.playSound('boss-phase')
        continue
      }
      if (event.type === 'valley-nest-wave') {
        // The lock moves to whatever just arrived, as the Gloamwood's waves do.
        this.lockedPreyId = nextGloamwoodLockTarget(
          this.nestState.prey,
          null,
          { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
        )
        if (event.wave > 1) this.combatMessage = t('hud.msg.valleyNestWave', { wave: event.wave, waves: event.waves })
        continue
      }
      if (event.type === 'valley-nest-cleared') {
        this.combatMessage = t('hud.msg.valleyNestCleared')
        this.lockedPreyId = null
        continue
      }
      if (event.type !== 'prey-attack') continue
      const attacker = this.nestState.prey.find((prey) => prey.id === event.preyId)
      if (!attacker) continue
      const previousHealth = this.playerCombat.health
      this.logSession({
        kind: 'attack', by: 'enemy', who: event.kind, action: 'strike', hit: true,
        distance: Number(Math.hypot(attacker.x - this.playerRoot.position.x, attacker.z - this.playerRoot.position.z).toFixed(2)),
      })
      const receivedDamage = this.takePlayerDamage(event.damage)
      if (this.playerCombat.health < previousHealth) {
        this.playSound('enemy-hit-player')
        this.lockedPreyId = assistGloamwoodAttackerLock(this.nestState.prey, this.lockedPreyId, attacker.id)
        const dx = this.playerRoot.position.x - attacker.x
        const dz = this.playerRoot.position.z - attacker.z
        const inverse = 1 / Math.max(0.001, Math.hypot(dx, dz))
        const knockbackDistance = gloamwoodPlayerHitKnockbackDistance(
          event.kind,
          event.knockback,
          this.knockbackRecoverySeconds,
        )
        this.lastKnockbackDistance = knockbackDistance
        this.knockbackRecoverySeconds = GLOAMWOOD_PLAYER_HIT_REACTION.recoverySeconds
        this.playerRoot.position.x += dx * inverse * knockbackDistance
        this.playerRoot.position.z += dz * inverse * knockbackDistance
        this.holdValleyGate(this.playerRoot.position)
        this.confineToArena(this.playerRoot.position)
        const held = this.map.confine(this.playerRoot.position.x, this.playerRoot.position.z)
        this.playerRoot.position.x = held.x
        this.playerRoot.position.z = held.z
        this.resolveObstacles(this.playerRoot.position)
        this.holdValleyGate(this.playerRoot.position)
        // Knockback is a completed hit reaction, not a new move command. Reset
        // the click-to-move destination so the controller does not immediately
        // auto-run back into the attacker after every impact.
        this.target.copy(this.playerRoot.position)
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.48)
        this.playerFlashRemaining = this.feedbackSettings.flash ? 0.18 : 0
        this.spawnDamageNumber(
          new THREE.Vector3(this.playerRoot.position.x, gloamwoodCharacterWorldHeight(this.stage, this.characterFamily) * 1.05, this.playerRoot.position.z),
          receivedDamage,
          'player',
        )
        if (!this.playerCombat.alive) this.combatMessage = t('hud.msg.downed')
        if (!this.playerCombat.alive) {
          this.attackState = createFormalHuntBasicAttackState()
          this.lockedPreyId = null
          const reason = this.runPhase === 'guardian'
            ? t('hud.msg.killedByGuardian', { name: t('creature.guardian') })
            : t('hud.msg.killedByPrey')
          if (!this.spendLifeOrEndRun(reason) && this.runPhase !== 'guardian') this.resetLivePreyToNest()
        }
      }
    }
    this.syncPreyVisuals(delta)
  }

  private bossActive() {
    return this.runPhase === 'boss' && this.bossState.state !== 'dormant' && this.bossState.state !== 'dead'
  }

  /** Presentation observes `awake`; it never decides detection or encounter state. */
  private announceAwakenedThreats() {
    if (this.map.id !== 'valley') return
    for (const prey of this.nestState.prey) {
      const creature = prey as GloamwoodValleyCreature
      if (!creature.awake || creature.phase === 'dead' || this.announcedThreats.has(creature.id)) continue
      if (creature.tier !== 'elite' && creature.tier !== 'boss') continue
      this.announcedThreats.add(creature.id)
      this.playSound(creature.tier === 'boss' ? 'boss-intro' : 'elite-intro')
    }
  }

  private updateBoss(delta: number) {
    const frame = stepGloamwoodBoss(this.bossState, delta, {
      x: this.playerRoot.position.x,
      z: this.playerRoot.position.z,
      alive: this.playerCombat.alive,
    })
    this.bossState = clampGloamwoodBossToArena(
      frame.state,
      GLOAMWOOD_BOSS_ARENA,
      GLOAMWOOD_BOSS_ARENA_RADIUS,
    )
    for (const event of frame.events) {
      if (event.type === 'phase-changed') {
        this.playSound('boss-phase')
        this.combatMessage = t('hud.msg.bossPhase2', { name: t('creature.boss') })
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.74)
        continue
      }
      if (event.type !== 'boss-attack') continue
      const previousHealth = this.playerCombat.health
      this.logSession({
        kind: 'attack', by: 'enemy', who: 'boss', action: event.pattern, hit: true,
        distance: Number(Math.hypot(this.bossState.x - this.playerRoot.position.x, this.bossState.z - this.playerRoot.position.z).toFixed(2)),
      })
      const receivedDamage = this.takePlayerDamage(event.damage)
      if (this.playerCombat.health >= previousHealth) continue
      this.playSound('enemy-hit-player')
      const dx = this.playerRoot.position.x - this.bossState.x
      const dz = this.playerRoot.position.z - this.bossState.z
      const inverse = 1 / Math.max(0.001, Math.hypot(dx, dz))
      const knockback = Math.min(0.78, event.knockback * 0.38)
      this.playerRoot.position.x += dx * inverse * knockback
      this.playerRoot.position.z += dz * inverse * knockback
      // The boss's own knockback pushes outward from it, so without this it
      // walks the player out of the arena it cannot leave.
      this.confineToArena(this.playerRoot.position)
      this.resolveObstacles(this.playerRoot.position)
      this.target.copy(this.playerRoot.position)
      this.playerFlashRemaining = this.feedbackSettings.flash ? 0.2 : 0
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.66)
      this.combatMessage = this.playerCombat.alive
        ? t('hud.msg.bossHit', { name: this.bossPatternName(event.pattern), damage: receivedDamage })
        : t('hud.msg.bossFatal', { name: this.bossPatternName(event.pattern) })
      if (!this.playerCombat.alive) this.spendLifeOrEndRun(t('hud.msg.killedByBoss', { name: this.bossPatternName(event.pattern) }))
    }
    this.syncBossVisual()
  }

  private syncBossVisual() {
    const visual = this.bossVisual
    if (!visual) return
    visual.root.visible = this.runPhase === 'boss' || this.runPhase === 'victory'
    visual.root.position.set(this.bossState.x, this.map.height(this.bossState.x, this.bossState.z), this.bossState.z)
    visual.root.rotation.y = this.bossState.facingRadians
    visual.targetRing.visible = this.bossActive() && this.bossLocked
    const telegraphing = this.bossState.state === 'telegraph'
    const spec = GLOAMWOOD_BOSS.patterns[this.bossState.pattern]
    const progress = telegraphing ? Math.min(1, this.bossState.elapsed / spec.telegraphSeconds) : 0
    const telegraphMaterial = visual.telegraph.material as THREE.MeshBasicMaterial
    const innerMaterial = visual.innerTelegraph.material as THREE.MeshBasicMaterial
    const chargeMaterial = visual.chargeTelegraph.material as THREE.MeshBasicMaterial
    telegraphMaterial.opacity = telegraphing ? 0.22 + progress * 0.5 : 0
    innerMaterial.opacity = 0
    chargeMaterial.opacity = 0
    visual.telegraph.rotation.y = 0
    if (this.bossState.pattern === 'root-slam') {
      visual.telegraph.scale.setScalar(GLOAMWOOD_BOSS.patterns['root-slam'].radius)
    } else if (this.bossState.pattern === 'spore-ring') {
      visual.telegraph.scale.setScalar(GLOAMWOOD_BOSS.patterns['spore-ring'].outerRadius)
      visual.innerTelegraph.scale.setScalar(GLOAMWOOD_BOSS.patterns['spore-ring'].innerRadius)
      innerMaterial.opacity = telegraphing ? 0.22 : 0
    } else {
      const charge = GLOAMWOOD_BOSS.patterns['thorn-charge']
      telegraphMaterial.opacity = 0
      chargeMaterial.opacity = telegraphing ? 0.18 + progress * 0.46 : 0
      visual.chargeTelegraph.position.x = charge.length * 0.5
      visual.chargeTelegraph.scale.set(charge.length, 1, charge.halfWidth * 2)
    }
    const strike = this.bossState.state === 'attack' ? Math.sin(Math.min(1, this.bossState.elapsed / spec.attackSeconds) * Math.PI) : 0
    const intro = this.bossState.state === 'intro' ? Math.min(1, this.bossState.elapsed / GLOAMWOOD_BOSS.introSeconds) : 1
    visual.root.scale.setScalar(0.72 + intro * 0.28)
    // A modelled boss animates itself; nudging its root as well would double the
    // motion and desynchronise it from the clip.
    visual.body.position.x = visual.model ? 0 : strike * 0.65
    visual.body.position.y = this.bossState.phase === 2 ? Math.sin(performance.now() * 0.009) * 0.05 : 0
    for (const material of visual.materials) material.emissiveIntensity = this.bossState.phase === 2 ? 0.78 : 0.42
  }

  /**
   * Swap the primitive boss assembly for an authored model.
   *
   * The telegraph rings stay: they are the authority's own shapes and a model
   * cannot be allowed to imply a different reach than the one that resolves.
   */
  /**
   * Loads one body per family that has a model, once, to be cloned per creature.
   *
   * Scaled by footprint rather than by height, unlike the boss and the player
   * forms. Prey are what the player collides with constantly, and the
   * authoritative radius is a circle on the ground: a river animal three times
   * longer than it is tall, sized by height, would stand a third of the size
   * its collision says it is.
   */
  /**
   * Builds the valley's ground, water and scatter into the scene.
   *
   * The kit templates load first because the valley's scatter is made of them:
   * the same seven plants and three rocks the Gloamwood uses, spread over 1590
   * units instead of 58.
   */
  /**
   * The defence map's scenery.
   *
   * Far smaller than the valley's: one ground mesh and one instanced draw per
   * kit piece, no cells and no streaming, because the whole map is 52 x 68.
   * Lighting is built here for the same reason the Gloamwood builds its own -
   * run unconditionally, the rigs stack.
   */
  private async buildDefenceScenery() {
    this.createLighting()
    const params = new URLSearchParams(window.location.search)
    const seed = Number(params.get('mapSeed') ?? 0) || 0x5a11e
    const scene = await buildGloamwoodDefenceScene({
      seed,
      anisotropy: Math.min(8, this.renderer.capabilities.getMaxAnisotropy()),
    })
    this.scene.add(scene.root)
    this.scene.background = new THREE.Color(0x131c14)
    this.scene.fog = new THREE.FogExp2(0x18251a, 0.017)
    this.defenceScene = scene
  }

  private async buildValleyScenery() {
    const params = new URLSearchParams(window.location.search)
    const seed = Number(params.get('mapSeed') ?? 0) || 0x5a11e
    const weather = resolveGloamwoodValleyWeather(
      params.get('weather'),
      this.weatherRunSeed,
    )
    // The valley scene loads its own kit templates - the same seven plants and
    // three rocks, through the same loader - so the Gloamwood's tree and rock
    // stores stay empty on this map and `createTree` is never reached.
    const valley = await buildGloamwoodValleyScene({
      seed,
      anisotropy: Math.min(8, this.renderer.capabilities.getMaxAnisotropy()),
      weather,
    })
    this.scene.add(valley.root)
    this.scene.background = new THREE.Color(valley.weather.backgroundColor)
    // The scenery owns its own scatter. Registering its colliders here means a
    // rock or trunk that the player sees is the same rock or trunk the movement
    // resolver feels; no duplicate hand-placed collision map can drift away
    // from the dressed valley.
    this.obstacles.push(...valley.colliders)
    // Everything that stands on the valley now reads the surface that is drawn
    // rather than the function it was generated from.
    this.valleyGroundHeight = valley.heightAt
    const fog = this.scene.fog instanceof THREE.FogExp2 ? this.scene.fog : new THREE.FogExp2(0x1b3329, 0.02)
    this.scene.fog = fog
    this.valley = {
      update: (camera, elapsed) => {
        const corridor = gloamwoodValleyCorridorAt(camera.x, camera.z)
        valley.update({ x: camera.x, z: camera.z, s: corridor.s }, elapsed, fog)
      },
      weather: valley.weather,
    }
  }

  /**
   * Fetch the next altar-defence boss's body before that boss walks.
   *
   * `loadModelledPrey` skips boss-tier creatures on purpose - that is Goal 15E,
   * which stopped the opening scene downloading every 4-7 MB boss GLB - so
   * without this the Warden came down the road wearing the Carapace family's
   * primitive fallback.
   *
   * Called when a wave starts, which gives the fetch a whole wave of head
   * start, and from the review hook that skips waves, because a skip does not
   * fire the event and checking a boss body by skipping to it is exactly what
   * that hook is for.
   *
   * Reported rather than voided: a body that failed leaves the boss in its
   * fallback, which looks identical to the feature never having been wired up.
   */
  private ensureUpcomingDefenceBossBody() {
    if (this.map.id !== 'defence') return
    const upcoming = (this.map as { upcomingBossBody?: () => GloamwoodModelledPreyConfig | undefined })
      .upcomingBossBody?.()
    if (!upcoming) return
    this.ensureModelledPreyTemplate(upcoming).catch((error) => {
      this.preyModelError = `Primitive fallback: ${upcoming.id} (${error instanceof Error ? error.message : String(error)})`
    })
  }

  private async loadModelledPrey() {
    // The opening only pays for ordinary bodies. Regional Boss bodies keep
    // their deliberate primitive fallback until the player approaches them.
    const wanted = new Map<string, GloamwoodModelledPreyConfig>()
    for (const prey of this.nestState.prey) {
      if (prey.tier === 'boss') continue
      const config = this.map.bodyFor(prey)
      if (config) wanted.set(config.id, config)
    }
    for (const kind of Object.keys(GLOAMWOOD_PREY) as GloamwoodPreyKind[]) {
      const config = this.map.bodyFor({ id: `probe-${kind}`, kind } as GloamwoodNestPrey)
      if (config) wanted.set(config.id, config)
    }
    const configs = [...wanted.values()]
    // Each body switches as soon as it has decoded. Waiting for the full batch
    // made a single bad or slow GLB leave *every* River Valley creature in its
    // primitive fallback, which looks exactly like the model feature vanished.
    const results = await Promise.allSettled(configs.map((config) => this.ensureModelledPreyTemplate(config)))
    const summary = summariseGloamwoodPreyModelLoads(
      configs.map((config) => config.id),
      results.flatMap((result, index) => result.status === 'rejected' ? [configs[index].id] : []),
    )
    if (summary.failedIds.length > 0) {
      this.preyModelError = `Primitive fallback: ${summary.failedIds.join(', ')}`
      console.warn('Some River Valley creature models could not load; their primitive fallbacks remain.', summary.failedIds)
    }
  }

  private ensureModelledPreyTemplate(config: GloamwoodModelledPreyConfig) {
    if (this.preyTemplates.has(config.id) || this.unavailablePreyTemplates.has(config.id)) return Promise.resolve()
    const existing = this.preyTemplateLoads.get(config.id)
    if (existing) return existing
    const request = this.loadModelledPreyTemplate(config)
      .catch((error) => {
        this.unavailablePreyTemplates.add(config.id)
        throw error
      })
      .finally(() => this.preyTemplateLoads.delete(config.id))
    this.preyTemplateLoads.set(config.id, request)
    return request
  }

  private preloadNearbyBossModel(prey: GloamwoodNestPrey) {
    if (prey.phase === 'dead') return
    const distance = Math.hypot(prey.x - this.playerRoot.position.x, prey.z - this.playerRoot.position.z)
    if (distance > GLOAMWOOD_BOSS_MODEL_PREFETCH_DISTANCE) return
    const config = this.map.bodyFor(prey)
    if (!config) return
    void this.ensureModelledPreyTemplate(config).catch((error) => {
      this.preyModelError = `Primitive fallback: ${config.id} (${error instanceof Error ? error.message : String(error)})`
    })
  }

  private async loadModelledPreyTemplate(config: GloamwoodModelledPreyConfig) {
    const gltf = await this.loader.loadAsync(assetUrl(config.url))
    if (this.disposed) return
    gltf.scene.updateMatrixWorld(true)
    const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3())
    // Re-derived here rather than trusted from the export. The processing
    // script already scales to this, so the factor should be one - and if a
    // model is ever re-exported at a different scale, the visible footprint
    // still matches what blocks the player rather than silently drifting.
    const halfExtent = Math.max(size.x, size.z) / 2
    gltf.scene.scale.setScalar(config.footprintRadius / Math.max(0.001, halfExtent))
    gltf.scene.updateMatrixWorld(true)
    gltf.scene.position.y -= new THREE.Box3().setFromObject(gltf.scene).min.y
    gltf.scene.rotation.y = config.modelYaw
    gltf.scene.traverse((node) => {
      node.castShadow = true
      node.receiveShadow = true
    })
    this.preyTemplates.set(config.id, { scene: gltf.scene, clips: gltf.animations, config })
    // Existing creatures do not have to wait for unrelated bodies. Creatures
    // born after this point mount the template in createPreyVisual instead.
    for (const prey of this.nestState.prey) {
      if (this.map.bodyFor(prey)?.id !== config.id) continue
      const visual = this.preyVisuals.get(prey.id)
      if (visual && !visual.model) this.applyPreyModel(visual, prey)
    }
  }

  /**
   * Swaps a creature's primitive body for its modelled one.
   *
   * The primitives are built first and thrown away, which is the same trade the
   * modelled boss makes: the fallback stays the single construction path, so a
   * family without a model and a family whose model has not finished loading
   * take exactly the same code, and there is no second assembly to keep in step.
   */
  private applyPreyModel(visual: PreyVisual, prey: GloamwoodNestPrey) {
    const config = this.map.bodyFor(prey)
    const template = config ? this.preyTemplates.get(config.id) : undefined
    if (!template) return
    // Built before the fallback is torn down, never after. Clearing first and
    // cloning second means anything that goes wrong in between - a skeleton the
    // cloner will not follow, a template swapped out from under it - leaves a
    // creature with no body at all: its name, its health bar and its lock ring
    // on screen with nothing underneath them.
    const body = cloneSkinnedHierarchy(template.scene)
    // Marked as the template's, because it is. SkeletonUtils.clone copies the
    // hierarchy and the skeleton but *shares* geometry and materials with every
    // other creature wearing this body, so the teardown below must not free
    // them - see disposePreyVisual.
    body.traverse((node) => {
      node.userData.sharedWithTemplate = true
    })
    for (const child of [...visual.body.children]) {
      visual.body.remove(child)
      child.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry.dispose()
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose()
      })
    }
    visual.body.add(body)
    visual.materials.length = 0
    body.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (material instanceof THREE.MeshStandardMaterial) visual.materials.push(material)
      }
    })
    visual.model = {
      config: template.config,
      mixer: new THREE.AnimationMixer(body),
      clips: new Map(template.clips.map((clip) => [clip.name, clip])),
    }
  }

  /** Drives one modelled creature's clip from its authoritative phase. */
  private updatePreyClip(visual: PreyVisual, prey: GloamwoodNestPrey, delta: number) {
    const model = visual.model
    if (!model) return
    const spec = GLOAMWOOD_PREY[prey.kind]
    // Kept on the model rather than read off the root. The root has already
    // been moved to this frame's position by the time the clip is chosen, so
    // measuring against it gives zero every frame and the walk never speeds up.
    const travelled = Math.hypot(prey.x - (model.lastX ?? prey.x), prey.z - (model.lastZ ?? prey.z))
    const groundSpeed = delta > 0 ? travelled / delta : 0
    model.lastX = prey.x
    model.lastZ = prey.z
    const moving = prey.phase === 'chase'
    // A boss has one clip per pattern where prey have one attack clip for
    // everything, so the two selectors cannot be shared. Which pattern is
    // playing was decided by the authority; this only looks it up.
    const bossSpec = gloamwoodValleyBossSpecFor(prey as GloamwoodValleyCreature)
    const bossPattern = bossSpec
      ? model.clips.get(bossSpec.patterns[(prey as GloamwoodValleyCreature).bossPattern ?? '']?.clip ?? '')
      : undefined
    const selection = bossSpec
      ? gloamwoodValleyBossClipForPhase(
        prey as GloamwoodValleyCreature,
        bossSpec,
        model.config,
        bossPattern?.duration ?? 1,
        model.previousPhase,
      )
      : { ...gloamwoodPreyClipForPhase(prey.phase, model.config, model.previousPhase, moving), rate: 0 }
    const clip = model.clips.get(selection.clip)
    if (clip && (selection.clip !== model.clipName || selection.restart)) {
      const next = model.mixer.clipAction(clip)
      next.reset()
      next.setLoop(selection.once ? THREE.LoopOnce : THREE.LoopRepeat, selection.once ? 1 : Infinity)
      next.clampWhenFinished = selection.once
      // The authority decides when the blow lands; the clip is stretched onto
      // it. Nothing here ever reports back into the damage path.
      next.timeScale = bossSpec ? selection.rate
        : selection.clip === model.config.clips.attack
        ? gloamwoodPreyClipRate(clip.duration, spec.telegraphSeconds, spec.strikeSeconds)
        : 1
      if (model.action && model.action !== next) model.action.fadeOut(0.12)
      next.fadeIn(0.12).play()
      model.action = next
      model.clipName = selection.clip
    }
    // A walk cycle at a fixed rate slides: the creature is carried by its
    // movement and its legs swing at whatever they were authored for. Re-applied
    // every frame because ground speed changes continuously.
    if (model.clipName === model.config.clips.walk && model.action) {
      const walk = model.clips.get(model.config.clips.walk)
      if (walk) {
        model.action.timeScale = gloamwoodPreyWalkRate(walk.duration, model.config.footprintRadius, groundSpeed)
      }
    }
    model.previousPhase = prey.phase
    model.mixer.update(delta)
  }

  /**
   * Start the Gloamwood boss's body downloading, at most once.
   *
   * Called from both the guardian encounter and the boss encounter, because the
   * guardian can be skipped - the debug `startBoss()` hook goes straight to the
   * arena, and so did every review of this fight.
   */
  private ensureThornheartWardenBody() {
    if (this.map.id !== 'gloamwood') return
    if (this.wardenBodyRequested || this.bossVisual?.model) return
    // The Bladeshell override exists to judge a valley body in this arena. If
    // someone asked for it, loading the Warden on top would swap it back out.
    if (new URLSearchParams(window.location.search).get('bossModel') === 'bladeshell') return
    this.wardenBodyRequested = true
    // Reported rather than voided: a `void` on a failing load swallows the
    // reason and leaves the boss wearing its primitives, which is
    // indistinguishable from the model never having been wired up.
    this.loadModelledBoss(GLOAMWOOD_THORNHEART_WARDEN_BOSS).catch((error) => {
      console.error('Thornheart Warden body failed to load', error)
      this.bossModelError = error instanceof Error ? error.message : String(error)
    })
  }

  private async loadModelledBoss(config: GloamwoodModelledBossConfig) {
    const visual = this.bossVisual
    if (!visual) return
    const gltf = await this.loader.loadAsync(assetUrl(config.url))
    if (this.disposed) return
    for (const child of [...visual.body.children]) visual.body.remove(child)
    gltf.scene.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(gltf.scene)
    const size = bounds.getSize(new THREE.Vector3())
    gltf.scene.scale.setScalar(config.worldHeight / Math.max(0.001, size.y))
    gltf.scene.updateMatrixWorld(true)
    const grounded = new THREE.Box3().setFromObject(gltf.scene)
    gltf.scene.position.y -= grounded.min.y
    // Same correction the player forms apply through modelYaw. The boss root is
    // rotated by facingRadians, where zero is +X, and a Y-up export faces +Z.
    gltf.scene.rotation.y = config.modelYaw
    visual.body.add(gltf.scene)
    visual.materials.length = 0
    gltf.scene.traverse((node) => {
      node.castShadow = true
      node.receiveShadow = true
      if (!(node instanceof THREE.Mesh)) return
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (material instanceof THREE.MeshStandardMaterial) visual.materials.push(material)
      }
    })
    visual.model = {
      config,
      mixer: new THREE.AnimationMixer(gltf.scene),
      clips: new Map(gltf.animations.map((clip) => [clip.name, clip])),
    }
  }

  /** Drive the modelled boss's clip from the authority's state, never the reverse. */
  private updateModelledBoss(delta: number) {
    const model = this.bossVisual?.model
    if (!model) return
    const selection = gloamwoodBossClipForState(this.bossState, model.config, model.previous)
    const clip = model.clips.get(selection.clip)
    if (clip && (selection.restart || model.currentName !== selection.clip)) {
      const next = model.mixer.clipAction(clip)
      next.reset()
      next.setLoop(selection.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity)
      next.clampWhenFinished = selection.once
      if (selection.once) {
        const spec = GLOAMWOOD_BOSS.patterns[this.bossState.pattern]
        const attackSeconds = 'attackSeconds' in spec ? spec.attackSeconds : 0.3
        next.timeScale = gloamwoodBossClipRate(clip.duration, spec.telegraphSeconds, attackSeconds)
      } else next.timeScale = 1
      if (model.current && model.current !== next) model.current.fadeOut(0.16)
      next.fadeIn(0.16).play()
      model.current = next
      model.currentName = selection.clip
    }
    model.previous = { state: this.bossState.state, pattern: this.bossState.pattern }
    model.mixer.update(delta)
  }

  private bossPatternName(pattern: GloamwoodBossState['pattern']) {
    if (pattern === 'root-slam') return t('attack.rootSlam')
    if (pattern === 'thorn-charge') return t('attack.thornCharge')
    return t('attack.sporeRing')
  }

  private spawnSlashFeedback(action: FormalHuntBasicAttackAction, target: GloamwoodNestPrey) {
    const recipe = getQuality3DAttackFeedback(action)
    const leapBite = this.stage === 0 && action === 'Pounce'
    const rendingClaws = action !== 'TailSwipe' && this.mutationState.taken.some((id) =>
      gloamwoodMutationExpression(id)?.reaction === 'double-slash',
    )
    const arcCount = rendingClaws ? 0 : recipe.arcCount
    const targetY = this.map.height(target.x, target.z) + (target.kind === 'shell' ? 1.28 : 0.94)
    const rendingDirection = new THREE.Vector3(
      target.x - this.playerRoot.position.x,
      0,
      target.z - this.playerRoot.position.z,
    )
    if (rendingDirection.lengthSq() > 0.0001) rendingDirection.normalize()
    else rendingDirection.set(Math.cos(this.lastFacing), 0, -Math.sin(this.lastFacing))
    if (rendingClaws) {
      // Anchor the wound to the side of the victim that faces the attacker.
      // A world-centred mark can cut through a large body and appear to float.
      const surfaceContact = new THREE.Vector3(target.x, targetY, target.z)
        .addScaledVector(rendingDirection, -gloamwoodPreyBodyRadius(target) * 0.48)
      this.spawnRendingClaws(surfaceContact, rendingDirection)
      return
    }
    for (let index = 0; index < arcCount; index += 1) {
      const color = index === 0 ? recipe.color : recipe.accent
      const length = (leapBite ? 1.24 : 1.94) * recipe.scale
      this.spawnFeedbackSprite(
        'slash',
        new THREE.Vector3(target.x, targetY + index * 0.08, target.z),
        color,
        [length * 0.62, 0.3], [length * 1.08, 0.5], recipe.durationSeconds,
        new THREE.Vector3(0, 0.2 + index * 0.05, 0),
        leapBite ? (index === 0 ? 0.32 : -0.2) : (index === 0 ? -0.58 : 0.5),
        index === 0 ? 1.2 : -0.9,
        0.96,
        'ease-out',
      )
      // Ordinary attacks keep two small sparks without changing their combat contract.
      const sparkCount = 2
      for (let spark = 0; spark < sparkCount; spark += 1) {
        const angle = index * 1.8 + spark * 1.37
        this.spawnFeedbackSprite(
          'shard',
          new THREE.Vector3(target.x + Math.cos(angle) * 0.1, targetY + 0.05 + spark * 0.035, target.z + Math.sin(angle) * 0.1),
          spark % 2 === 0 ? 0xffdf8a : color,
          [0.12, 0.12],
          [0.34, 0.34],
          0.2 + spark * 0.025,
          new THREE.Vector3(Math.cos(angle) * 0.82, 0.52 + spark * 0.08, Math.sin(angle) * 0.82),
          angle,
          5 - spark * 0.5,
          0.68,
        )
      }
    }
  }

  /** Standing body half-width. Idle bind pose, so a spinning tail cannot enlarge the ring. */
  private cachePlayerVisualGroundRadius() {
    const combat = gloamwoodPlayerCombatBodyRadius(this.stage, this.characterFamily)
    const mesh = this.character
    if (!mesh) {
      this.playerVisualGroundRadius = combat
      return
    }
    mesh.updateWorldMatrix(true, true)
    this.tailSweepBounds.makeEmpty()
    mesh.traverse((node) => {
      if (!node.visible || node.name === 'Icosphere' || !(node instanceof THREE.Mesh)) return
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox()
      const geometryBox = node.geometry.boundingBox
      if (!geometryBox) return
      this.tailSweepMeshBounds.copy(geometryBox).applyMatrix4(node.matrixWorld)
      this.tailSweepBounds.union(this.tailSweepMeshBounds)
    })
    if (this.tailSweepBounds.isEmpty()) {
      this.playerVisualGroundRadius = combat
      return
    }
    this.tailSweepBounds.getSize(this.tailSweepSize)
    const halfWidth = Math.min(this.tailSweepSize.x, this.tailSweepSize.z) * 0.5
    const halfLength = Math.max(this.tailSweepSize.x, this.tailSweepSize.z) * 0.5
    this.playerVisualGroundRadius = Math.max(combat, halfWidth, halfLength * 0.5)
  }

  /** A connected enhanced tail sweep kicks gravel and dust around the body. */
  private spawnTailSuppressionFeedback() {
    this.spawnMutationFxBurst('tail-sweep')
    this.spawnTailSweepHalo()
  }

  /** Ground-slam band plus a softer dusty skirt. The body stays in the hole. */
  private spawnTailSweepHalo() {
    const x = this.playerRoot.position.x
    const z = this.playerRoot.position.z
    const y = this.map.height(x, z) + 0.2
    const pace = this.feedbackDurationMultiplier
    const shock = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xffe9b8) },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        varying vec2 vLocal;
        void main() {
          vLocal = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vLocal;
        void main() {
          float r = length(vLocal);
          float t = clamp((r - 1.52) / 0.58, 0.0, 1.0);
          float core = 1.0 - smoothstep(0.06, 0.28, abs(t - 0.36));
          float dust = smoothstep(0.0, 0.16, t) * (1.0 - smoothstep(0.48, 1.0, t)) * 0.4;
          // Clamped, which used to make no difference and now makes all of it.
          // Where the core and the dusty skirt overlap this reached about 1.4,
          // and on the direct path an alpha over 1 simply clipped. With a
          // composer the same fragment lands in a linear HDR buffer, so the
          // overshoot survives, crosses the bloom threshold and turns the ring
          // into a flare.
          gl_FragColor = vec4(uColor, min(1.0, core + dust) * uOpacity);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
    const shockMesh = new THREE.Mesh(this.tailSweepShock, shock)
    shockMesh.position.set(x, y, z)
    shockMesh.rotation.x = -Math.PI / 2
    const layout = tailSweepLayout(this.playerVisualGroundRadius)
    shockMesh.scale.set(layout.shockStart, layout.shockStart, 1)
    shockMesh.renderOrder = 4
    this.scene.add(shockMesh)
    this.mutationParticles.push({
      object: shockMesh,
      material: shock,
      velocity: new THREE.Vector3(),
      spin: 0.15,
      age: 0,
      duration: 0.42 * pace,
      gravity: 0,
      motion: 'expand',
      // Down from 0.95. Additive at near-full alpha the cream washes to flat
      // white, which is both brighter than it needs to be and less interesting
      // - backing it off lets the colour survive.
      peakOpacity: 0.78,
      startScale: new THREE.Vector2(layout.shockStart, layout.shockStart),
      endScale: new THREE.Vector2(layout.shockEnd, layout.shockEnd),
      attractTarget: shockMesh.position.clone(),
    })
    const map = this.tailSweepHaloTexture
    if (!map) return
    const skirt = new THREE.MeshBasicMaterial({
      map,
      color: 0xc4ae8c,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      fog: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    const skirtMesh = new THREE.Mesh(this.skillFxPlane, skirt)
    skirtMesh.position.set(x, y + 0.02, z)
    skirtMesh.rotation.x = -Math.PI / 2
    skirtMesh.scale.set(layout.skirtStart, layout.skirtStart, 1)
    skirtMesh.renderOrder = 3
    this.scene.add(skirtMesh)
    this.mutationParticles.push({
      object: skirtMesh,
      material: skirt,
      velocity: new THREE.Vector3(),
      spin: 0.08,
      age: 0,
      duration: 0.5 * pace,
      gravity: 0,
      motion: 'expand',
      peakOpacity: 0.55,
      startScale: new THREE.Vector2(layout.skirtStart, layout.skirtStart),
      endScale: new THREE.Vector2(layout.skirtEnd, layout.skirtEnd),
      attractTarget: skirtMesh.position.clone(),
    })
  }

  /** A confirmed kill returns health and makes that return readable at the body. */
  private spawnFeedingFeedback(restored: number) {
    this.spawnMutationFxBurst('regeneration')
    this.spawnDamageNumber(
      new THREE.Vector3(this.playerRoot.position.x, this.map.height(this.playerRoot.position.x, this.playerRoot.position.z) + 1.5, this.playerRoot.position.z),
      restored,
      'heal',
    )
  }

  /**
   * A slow burn on the flanks for as long as the mutation is held.
   *
   * Deliberately not larger than the burst chevrons it sits beside. The
   * readable-from-the-camera problem is real, but scaling body decoration up
   * until it reads is how a silhouette gets flattened - the Lantern Lynx paid
   * that price already. What was missing was not size but *continuity*: this is
   * quiet, and it is always there.
   *
   * And it carries the number. The colour walks from the gain amber toward the
   * decay red as the ceiling comes down, and the breathing quickens with it, so
   * a glance at the animal says how deep into the trade this run has gone
   * rather than merely that the trade was taken.
   */
  private updateMetabolicEmber() {
    const perInterval = this.mutationEffects.healthDecayPerInterval
    const interval = this.mutationEffects.healthDecayIntervalSeconds
    const map = this.metabolicChevronTexture
    if (!perInterval || !interval || !map) {
      this.disposeMetabolicEmber()
      return
    }
    if (!this.metabolicEmber) {
      const root = new THREE.Group()
      root.name = 'MetabolicEmber'
      const veins: THREE.Mesh[] = []
      const materials: THREE.MeshBasicMaterial[] = []
      /**
       * Pushed out past the hide.
       *
       * The shared vein layout places its chevrons at 0.4 to 0.52 of the body
       * radius, which is *inside* the animal. That works for the burst, whose
       * particles immediately rise and travel outward, and does not work at all
       * for something that has to sit still: at full opacity the first build
       * showed six slivers poking out of a body that had swallowed the rest.
       */
      const OUTWARD = 1.45
      for (const vein of metabolicVeinLayout(this.playerVisualGroundRadius).veins) {
        const material = new THREE.MeshBasicMaterial({
          map,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          fog: false,
          // Tone-mapped, unlike the burst chevrons beside it. `toneMapped:
          // false` writes a display-referred colour into what is now a linear
          // HDR buffer, where the bloom pass reads it as light.
        })
        const mesh = new THREE.Mesh(this.skillFxPlane, material)
        // Sideways only. Scaling the fore-aft component as well swung the
        // chevrons off the flank and out past the shoulder and the tail.
        mesh.userData.local = [vein.local[0] * OUTWARD, vein.local[1], vein.local[2]]
        mesh.scale.set(vein.width, vein.height, 1)
        mesh.renderOrder = 6
        root.add(mesh)
        veins.push(mesh)
        materials.push(material)
      }
      this.scene.add(root)
      this.metabolicEmber = { root, veins, materials }
    }
    const ember = this.metabolicEmber
    const x = this.playerRoot.position.x
    const z = this.playerRoot.position.z
    const ground = this.map.height(x, z)
    const facing = this.lastFacing
    const forwardX = Math.cos(facing)
    const forwardZ = -Math.sin(facing)
    const rightX = Math.cos(facing - Math.PI / 2)
    const rightZ = -Math.sin(facing - Math.PI / 2)
    const chestY = ground + 0.72
    // How far into the trade this run is. Ten ticks - five minutes of holding
    // it - is taken as fully committed; past that it simply stays there.
    const spent = Math.min(1, this.decayedMaximumHealth / (perInterval * 10))
    const seconds = performance.now() * 0.001
    const breath = 0.5 + 0.5 * Math.sin(seconds * (1.05 + spent * 1.5))
    const colour = new THREE.Color(METABOLIC_VEINS.gainColor)
      .lerp(new THREE.Color(METABOLIC_VEINS.decayColor), spent)
    for (const [index, mesh] of ember.veins.entries()) {
      const local = mesh.userData.local as [number, number, number]
      const worldX = x + rightX * local[0] + forwardX * local[2]
      const worldZ = z + rightZ * local[0] + forwardZ * local[2]
      mesh.position.set(worldX, chestY + local[1], worldZ)
      this.carapaceOutward.set(worldX - x, 0, worldZ - z)
      if (this.carapaceOutward.lengthSq() < 0.0001) this.carapaceOutward.set(local[0], 0, local[2])
      this.carapaceOutward.normalize()
      mesh.quaternion.setFromUnitVectors(this.metabolicFace, this.carapaceOutward)
      const material = ember.materials[index]
      material.color.copy(colour)
      // Staggered up the flank, so it reads as something travelling through the
      // animal rather than six panels switching on together.
      const stagger = 0.5 + 0.5 * Math.sin(seconds * (1.05 + spent * 1.5) - index * 0.5)
      // Calibrated against the body, not guessed, and it runs far higher than
      // the word "subtle" suggests. Two earlier passes sat at 0.12-0.23 and
      // then 0.34-0.53 and *neither was visible at all*. The chevron's texture
      // is an hourglass outline that is mostly transparent, so the alpha that
      // reaches the frame is a fraction of this number, and it is being added
      // to a hide the scene lights already. Anything under about 0.6 is below
      // the noise floor.
      material.opacity = (0.62 + spent * 0.16) + stagger * (0.1 + spent * 0.07) + breath * 0.04
    }
  }

  private disposeMetabolicEmber() {
    const ember = this.metabolicEmber
    if (!ember) return
    this.scene.remove(ember.root)
    for (const material of ember.materials) material.dispose()
    this.metabolicEmber = null
  }

  /** The metabolism trade must show both hunger and the unusually fast gain. */
  private spawnMetabolicFeedback(event: 'gain' | 'decay' | 'preview') {
    if (event === 'preview') {
      this.spawnMetabolicVeins('gain')
      this.spawnMutationFxBurst('metabolism-gain')
      this.metabolicPreviewDecayIn = 0.72
      return
    }
    this.spawnMetabolicVeins(event)
    this.spawnMutationFxBurst(event === 'decay' ? 'metabolism-decay' : 'metabolism-gain')
  }

  /** Hourglass veins on the flanks. Gain climbs from the belly; decay sheds downward. */
  private spawnMetabolicVeins(event: 'gain' | 'decay') {
    const map = this.metabolicChevronTexture
    if (!map) return
    const x = this.playerRoot.position.x
    const z = this.playerRoot.position.z
    const ground = this.map.height(x, z)
    const facing = this.lastFacing
    const pace = this.feedbackDurationMultiplier
    const layout = metabolicVeinLayout(this.playerVisualGroundRadius)
    const color = event === 'gain' ? layout.gainColor : layout.decayColor
    const forwardX = Math.cos(facing)
    const forwardZ = -Math.sin(facing)
    const rightX = Math.cos(facing - Math.PI / 2)
    const rightZ = -Math.sin(facing - Math.PI / 2)
    const chestY = ground + 0.72
    const maxRow = Math.max(...layout.veins.map((vein) => vein.row))
    for (const vein of layout.veins) {
      const worldX = x + rightX * vein.local[0] + forwardX * vein.local[2]
      const worldY = chestY + vein.local[1]
      const worldZ = z + rightZ * vein.local[0] + forwardZ * vein.local[2]
      const material = new THREE.MeshBasicMaterial({
        map,
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: event === 'gain' ? THREE.AdditiveBlending : THREE.NormalBlending,
        fog: false,
      })
      const mesh = new THREE.Mesh(this.skillFxPlane, material)
      mesh.position.set(worldX, worldY, worldZ)
      this.carapaceOutward.set(worldX - x, 0, worldZ - z)
      if (this.carapaceOutward.lengthSq() < 0.0001) this.carapaceOutward.set(vein.local[0], 0, vein.local[2])
      this.carapaceOutward.normalize()
      mesh.quaternion.setFromUnitVectors(this.metabolicFace, this.carapaceOutward)
      mesh.scale.set(vein.width, vein.height, 1)
      mesh.renderOrder = 6
      this.scene.add(mesh)
      const delay = event === 'gain' ? vein.row * 0.07 : (maxRow - vein.row) * 0.07
      this.mutationParticles.push({
        object: mesh,
        material,
        velocity: event === 'gain'
          ? new THREE.Vector3(0, 0.42, 0)
          : new THREE.Vector3(this.carapaceOutward.x * 0.35, -0.55, this.carapaceOutward.z * 0.35),
        spin: 0,
        age: -delay * pace,
        duration: (event === 'gain' ? 0.62 : 0.78) * pace,
        gravity: event === 'gain' ? 0 : 2.4,
        motion: event === 'gain' ? 'rise' : 'ballistic',
        peakOpacity: layout.peakOpacity,
        startScale: new THREE.Vector2(vein.width, vein.height),
        endScale: event === 'gain'
          ? new THREE.Vector2(vein.width * 1.08, vein.height * 1.12)
          : new THREE.Vector2(vein.width * 0.72, vein.height * 0.82),
        attractTarget: mesh.position.clone(),
      })
    }
  }

  /** Moult is a rare fatal-hit rescue, so it gets the largest non-Boss burst. */
  private spawnMoultFeedback() {
    this.spawnMutationFxBurst('moult')
    this.spawnMoultHusks()
  }

  /** Hovering rhombus-tiled shell above the back. Splits in the air, never drops. */
  private spawnMoultHusks() {
    const x = this.playerRoot.position.x
    const z = this.playerRoot.position.z
    const ground = this.map.height(x, z)
    const facing = this.lastFacing
    const pace = this.feedbackDurationMultiplier
    const layout = moultHuskLayout(this.playerVisualGroundRadius)
    const [rx, ry, rz] = layout.scale
    const forwardX = Math.cos(facing)
    const forwardZ = -Math.sin(facing)
    const rightX = Math.cos(facing - Math.PI / 2)
    const rightZ = -Math.sin(facing - Math.PI / 2)
    const shellY = ground + layout.lift
    const duration = 1.15 * pace
    for (const side of layout.sides) {
      const fillMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.46,
        metalness: 0.05,
        emissive: 0x5c4018,
        emissiveIntensity: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
      })
      applyMoultHeightFade(fillMaterial)
      const edgeMaterial = new THREE.MeshStandardMaterial({
        color: layout.edgeColor,
        roughness: 0.62,
        metalness: 0.02,
        emissive: 0x3a2810,
        emissiveIntensity: 0.04,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
      applyMoultHeightFade(edgeMaterial)
      const geometries = side.half === 'left' ? this.moultHuskLeft : this.moultHuskRight
      const fill = new THREE.Mesh(geometries.fill, fillMaterial)
      fill.userData.moultPeak = layout.peakOpacity
      const edges = new THREE.Mesh(geometries.edges, edgeMaterial)
      edges.userData.moultPeak = layout.edgeOpacity
      const group = new THREE.Group()
      group.add(fill, edges)
      group.position.set(
        x - forwardX * layout.shiftBack,
        shellY,
        z - forwardZ * layout.shiftBack,
      )
      group.rotation.set(0, facing, 0)
      group.scale.set(rx, ry, rz)
      group.userData.moultCap = true
      group.userData.depth = rz
      group.renderOrder = 5
      this.scene.add(group)
      this.mutationParticles.push({
        object: group,
        material: fillMaterial,
        velocity: new THREE.Vector3(rightX * side.peel * 0.42, 0.12, rightZ * side.peel * 0.42),
        spin: side.spin,
        age: 0,
        duration,
        gravity: 0,
        motion: 'ballistic',
        peakOpacity: layout.peakOpacity,
        startScale: new THREE.Vector2(rx, ry),
        endScale: new THREE.Vector2(rx * 1.04, ry * 1.04),
        attractTarget: group.position.clone(),
      })
    }
  }

  private updateFeedback(delta: number) {
    this.cameraTrauma = Math.max(0, this.cameraTrauma - delta * 2.8)
    this.updateRendingParticles(delta)
    this.updateMutationParticles(delta)
    this.updateSporeHazePresentation(delta)
    this.updateMetabolicEmber()
    if (this.metabolicPreviewDecayIn > 0) {
      this.metabolicPreviewDecayIn = Math.max(0, this.metabolicPreviewDecayIn - delta)
      if (this.metabolicPreviewDecayIn === 0) this.spawnMetabolicFeedback('decay')
    }
    this.updateDust(delta)
    this.playerFlashRemaining = Math.max(0, this.playerFlashRemaining - delta)
    for (const visual of this.preyVisuals.values()) {
      visual.flashRemaining = Math.max(0, visual.flashRemaining - delta)
      visual.impactRemaining = Math.max(0, visual.impactRemaining - delta)
      for (const material of visual.materials) {
        if (visual.flashRemaining > 0) material.emissive.setHex(0xd33c24)
        else if (material.color.getHex() === 0x9fcf63) material.emissive.setHex(0x294314)
        else material.emissive.setHex(0x000000)
      }
    }
    for (let index = this.feedbackSprites.length - 1; index >= 0; index -= 1) {
      const feedback = this.feedbackSprites[index]
      feedback.age += delta
      const progress = Math.min(1, feedback.age / feedback.duration)
      const scaleProgress = feedback.growthStyle === 'tear'
        ? progress ** 1.25
        : 1 - (1 - progress) ** 3
      feedback.sprite.position.addScaledVector(feedback.velocity, delta)
      feedback.velocity.multiplyScalar(Math.exp(-3.1 * delta))
      feedback.sprite.scale.set(
        THREE.MathUtils.lerp(feedback.startScale.x, feedback.endScale.x, scaleProgress),
        THREE.MathUtils.lerp(feedback.startScale.y, feedback.endScale.y, scaleProgress),
        1,
      )
      const material = feedback.sprite.material as THREE.SpriteMaterial
      const opacity = feedback.growthStyle === 'tear'
        ? Math.min(1, progress / 0.1) * (1 - Math.max(0, (progress - 0.7) / 0.3))
        : Math.sin(progress * Math.PI)
      material.opacity = opacity * feedback.peakOpacity
      material.rotation += feedback.rotationSpeed * delta
      if (progress >= 1) {
        material.dispose()
        this.scene.remove(feedback.sprite)
        this.feedbackSprites.splice(index, 1)
      }
    }
  }

  /** Persistent low haze while the mutation is held. Never a pulsing skill burst. */
  private updateSporeHazePresentation(delta: number) {
    const radius = this.mutationEffects.slowAuraRadius ?? 0
    if (radius <= 0) {
      this.disposeSporeHaze()
      return
    }
    if (!this.sporeHaze) this.sporeHaze = this.createSporeHaze(radius)
    const haze = this.sporeHaze
    const x = this.playerRoot.position.x
    const z = this.playerRoot.position.z
    haze.root.position.set(x, this.map.height(x, z) + 0.08, z)
    haze.previewBoost = Math.max(0, haze.previewBoost - delta * 1.4)
    const breathe = 0.86 + 0.14 * Math.sin(performance.now() * 0.0011)
    const hazeOpacity = (SPORE_HAZE.hazeOpacity + haze.previewBoost * 0.08) * breathe
    const moteOpacity = (SPORE_HAZE.moteOpacity + haze.previewBoost * 0.06) * breathe
    const time = performance.now() * 0.001
    haze.mist.material.uniforms.uTime.value = time
    haze.mist.material.uniforms.uOpacity.value = hazeOpacity
    this.settleSporeMistOnGround(haze, x, z)
    haze.motes.material.uniforms.uTime.value = time
    haze.motes.material.uniforms.uOpacity.value = moteOpacity
  }

  /**
   * Drop every mist vertex onto the terrain under it.
   *
   * Re-sampled only once the player has walked far enough for it to matter.
   * `map.height` on the valley is a route lookup rather than an array read, and
   * this is a few hundred calls; doing it every frame for a standing player
   * would be paying that bill for a picture that cannot have changed.
   */
  /** The mist's vertical span, for the debug read-out. */
  private sporeMistDrop() {
    const haze = this.sporeHaze
    if (!haze) return 0
    const attribute = haze.mist.geometry.attributes.position as THREE.BufferAttribute
    let low = Infinity
    let high = -Infinity
    for (let index = 0; index < attribute.count; index += 1) {
      const y = attribute.getY(index)
      low = Math.min(low, y)
      high = Math.max(high, y)
    }
    return high - low
  }

  private settleSporeMistOnGround(
    haze: NonNullable<typeof this.sporeHaze>,
    x: number,
    z: number,
  ) {
    if (Math.abs(haze.centre.x - x) < 0.2 && Math.abs(haze.centre.y - z) < 0.2) return
    haze.centre.set(x, z)
    const attribute = haze.mist.geometry.attributes.position as THREE.BufferAttribute
    const drop = haze.mist.geometry.attributes.aDrop as THREE.BufferAttribute
    const ground = this.map.height(x, z)
    for (let index = 0; index < attribute.count; index += 1) {
      const localX = attribute.getX(index)
      const localZ = attribute.getZ(index)
      // Local, because the root is already parked at the player's own ground
      // height - what is stored is the difference between the terrain here and
      // the terrain under the animal.
      const delta = this.map.height(x + localX, z + localZ) - ground
      attribute.setY(index, delta + haze.mist.lift)
      drop.setX(index, delta)
    }
    attribute.needsUpdate = true
    drop.needsUpdate = true
  }

  private createSporeHaze(radius: number) {
    const layout = sporeHazeLayout(radius)
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Spore haze texture needs a 2D canvas.')
    paintSporeHazePatch(context, canvas.width, canvas.height)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const root = new THREE.Group()
    /**
     * The mist: one disc whose vertices sit on the terrain.
     *
     * It used to be seven flat quads parked at the player's own ground height.
     * On level ground that looks fine; on anything else the terrain rises
     * through them, wins the depth test, and slices the mist off along a
     * contour - the owner saw it as a hard straight edge with nothing beyond it.
     * Raising the quads until they cleared the ground was tried and fixes the
     * edge by making the mist float around the animal's back, which is not
     * mist. So the disc samples `map.height` at every vertex instead, and the
     * heights are refreshed as the player walks.
     */
    const rings = layout.mistRings
    const segments = layout.mistSegments
    const mistPositions: number[] = [0, 0, 0]
    const mistFalloff: number[] = [0]
    for (let ring = 1; ring <= rings; ring += 1) {
      const t = ring / rings
      for (let segment = 0; segment < segments; segment += 1) {
        const angle = (segment / segments) * Math.PI * 2
        mistPositions.push(Math.cos(angle) * layout.radius * t, 0, Math.sin(angle) * layout.radius * t)
        mistFalloff.push(t)
      }
    }
    const mistIndices: number[] = []
    for (let segment = 0; segment < segments; segment += 1) {
      mistIndices.push(0, 1 + segment, 1 + ((segment + 1) % segments))
    }
    for (let ring = 0; ring < rings - 1; ring += 1) {
      const inner = 1 + ring * segments
      const outer = inner + segments
      for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments
        mistIndices.push(inner + segment, outer + segment, outer + next)
        mistIndices.push(inner + segment, outer + next, inner + next)
      }
    }
    const mistGeometry = new THREE.BufferGeometry()
    mistGeometry.setAttribute('position', new THREE.Float32BufferAttribute(mistPositions, 3))
    mistGeometry.setAttribute('aFalloff', new THREE.Float32BufferAttribute(mistFalloff, 1))
    // Refreshed with the heights: how far this vertex sits from the player's own
    // level, so the shader can fade the mist out rather than drape it down a
    // bank. Measured walking the valley, the disc bends as much as eight units
    // over its five-unit radius where the route runs along a wall.
    mistGeometry.setAttribute('aDrop', new THREE.Float32BufferAttribute(new Float32Array(mistFalloff.length), 1))
    mistGeometry.setIndex(mistIndices)
    const mistMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: layout.hazeOpacity },
        uColor: { value: new THREE.Color(layout.color) },
      },
      vertexShader: `
        attribute float aFalloff;
        attribute float aDrop;
        varying float vFalloff;
        varying float vDrop;
        varying vec2 vLocal;
        void main() {
          vFalloff = aFalloff;
          vDrop = aDrop;
          vLocal = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vFalloff;
        varying float vDrop;
        varying vec2 vLocal;
        void main() {
          // Densest in the middle, gone at the rim, and never a hard edge.
          float body = 1.0 - smoothstep(0.15, 1.0, vFalloff);
          // ...and gone again wherever the ground has run away from the player's
          // own level. Ground mist that climbs a bank reads as a sheet hung over
          // it; fading it out is both truer and cheaper than clamping the
          // geometry, which would only put the slicing back.
          body *= 1.0 - smoothstep(0.7, 1.9, abs(vDrop));
          // Slow unevenness so it does not read as a painted disc. Driven off
          // radius rather than off two angular harmonics - the portal already
          // proved that two low harmonics beat into a visible pinwheel.
          float drift = length(vLocal);
          float curl = sin(drift * 1.6 - uTime * 0.5) * 0.5 + 0.5;
          float wisp = sin(drift * 2.9 + uTime * 0.31 + vLocal.x * 0.4) * 0.5 + 0.5;
          float texture = 0.62 + 0.38 * (curl * 0.6 + wisp * 0.4);
          gl_FragColor = vec4(uColor, body * texture * uOpacity);
        }
      `,
    })
    const mist = new THREE.Mesh(mistGeometry, mistMaterial)
    mist.frustumCulled = false
    mist.renderOrder = 2
    root.add(mist)
    /**
     * The spores: many small points of light, on one billboarded mesh.
     *
     * The six sprites this replaces were a metre across and drawn with the same
     * soft gradient as the mist, so at the game's camera distance they read as
     * pale bubbles parked around the animal. What sells an aura is a *drift* -
     * points too small to read as objects individually, rising and fading on
     * their own beats.
     *
     * One mesh with the whole cloud in it, animated in the vertex shader from a
     * clock uniform, so 54 spores cost one draw call and nothing per frame on
     * the CPU. Quads expanded in view space rather than `THREE.Points`, because
     * a points shader has to size itself in pixels and would need the viewport
     * height fed back to it on every resize.
     */
    const CORNERS = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]
    const count = layout.motes.length
    const positions = new Float32Array(count * 4 * 3)
    const corners = new Float32Array(count * 4 * 2)
    const params = new Float32Array(count * 4 * 4)
    const indices = new Uint16Array(count * 6)
    for (const [index, mote] of layout.motes.entries()) {
      for (let corner = 0; corner < 4; corner += 1) {
        const vertex = index * 4 + corner
        positions[vertex * 3] = mote.angle
        positions[vertex * 3 + 1] = mote.distance
        positions[vertex * 3 + 2] = mote.phase
        corners[vertex * 2] = CORNERS[corner][0]
        corners[vertex * 2 + 1] = CORNERS[corner][1]
        params[vertex * 4] = mote.size
        params[vertex * 4 + 1] = mote.rise
        params[vertex * 4 + 2] = mote.drift
        params[vertex * 4 + 3] = mote.twinkle
      }
      const base = index * 4
      indices.set([base, base + 1, base + 2, base, base + 2, base + 3], index * 6)
    }
    const moteGeometry = new THREE.BufferGeometry()
    // `position` carries (bearing, distance, phase), not a location.
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    moteGeometry.setAttribute('aCorner', new THREE.BufferAttribute(corners, 2))
    moteGeometry.setAttribute('aParams', new THREE.BufferAttribute(params, 4))
    moteGeometry.setIndex(new THREE.BufferAttribute(indices, 1))
    const moteMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: layout.moteOpacity },
        uRise: { value: layout.moteRise },
        uBase: { value: SPORE_HAZE.height },
        // Over-range, so the cores clear the bloom threshold and the spores
        // read as light rather than as green dots. Spore yellow-green is a
        // cheap colour to do this with - the threshold is on luminance, and
        // this hue is mostly green.
        uTint: { value: new THREE.Color(0x8ede2e).multiplyScalar(1.7) },
        uCore: { value: new THREE.Color(0xeaffc4).multiplyScalar(1.8) },
      },
      vertexShader: `
        attribute vec2 aCorner;
        attribute vec4 aParams;
        uniform float uTime;
        uniform float uRise;
        uniform float uBase;
        varying vec2 vCorner;
        varying float vAlpha;

        void main() {
          float phase = position.z;
          // Each spore climbs, fades out at the top and restarts at the bottom.
          // Wrapping the life rather than respawning means nothing has to be
          // tracked between frames.
          float life = fract(uTime * aParams.y + phase);
          float bearing = position.x + uTime * aParams.z;
          float distance = position.y * (1.0 + life * 0.12);
          vec3 centre = vec3(
            cos(bearing) * distance,
            uBase + life * uRise,
            sin(bearing) * distance
          );

          // In and out over the climb, so a spore is never born or killed on
          // screen, plus its own twinkle on top.
          // A plateau rather than a bell: squaring the fade left every spore
          // dim for most of its climb and the cloud barely registered.
          float fade = smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.72, 1.0, life));
          float twinkle = 0.7 + sin(uTime * aParams.w + phase * 12.0) * 0.3;
          vAlpha = fade * twinkle;
          vCorner = aCorner;

          vec4 viewPosition = modelViewMatrix * vec4(centre, 1.0);
          viewPosition.xy += aCorner * aParams.x;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uTint;
        uniform vec3 uCore;
        uniform float uOpacity;
        varying vec2 vCorner;
        varying float vAlpha;

        void main() {
          float distance = length(vCorner) * 2.0;
          if (distance > 1.0) discard;
          float halo = smoothstep(1.0, 0.0, distance);
          float core = smoothstep(0.46, 0.0, distance);
          // The core never goes all the way to white. At full weight every
          // spore read as a plain white speck and the whole point of the colour
          // was lost - what is wanted is a green mote with a hot middle.
          vec3 colour = mix(uTint, uCore, core * 0.55);
          float alpha = (halo * halo * 0.4 + core) * vAlpha * uOpacity;
          gl_FragColor = vec4(colour * alpha, alpha);
        }
      `,
    })
    const moteMesh = new THREE.Mesh(moteGeometry, moteMaterial)
    // The bounding sphere would be computed from orbit parameters rather than
    // coordinates, so it describes nothing real and culling against it would
    // make the cloud flicker.
    moteMesh.frustumCulled = false
    moteMesh.renderOrder = 3
    root.add(moteMesh)
    const motes = { mesh: moteMesh, geometry: moteGeometry, material: moteMaterial }
    this.scene.add(root)
    return {
      root,
      mist: { mesh: mist, geometry: mistGeometry, material: mistMaterial, lift: layout.mistLift },
      motes,
      texture,
      previewBoost: 0,
      centre: new THREE.Vector2(Number.NaN, Number.NaN),
    }
  }

  private disposeSporeHaze() {
    const haze = this.sporeHaze
    if (!haze) return
    this.scene.remove(haze.root)
    haze.mist.geometry.dispose()
    haze.mist.material.dispose()
    haze.motes.geometry.dispose()
    haze.motes.material.dispose()
    haze.texture.dispose()
    this.sporeHaze = null
  }

  /**
   * Takes one creature off the map and frees what it owns - and only that.
   *
   * A modelled body is a clone, and SkeletonUtils.clone shares its geometry and
   * its materials with the template every other creature of that family is also
   * wearing. Freeing them when a single corpse ages out pulls the buffers out
   * from under the whole family, which is how a living creature ends up with a
   * name, a health bar and a lock ring and nothing drawn between them.
   *
   * The primitives, the target ring and the telegraph are built per creature
   * and are genuinely this visual's to release.
   */
  private disposePreyVisual(visual: PreyVisual) {
    this.scene.remove(visual.root)
    visual.model?.mixer.stopAllAction()
    visual.root.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || node.userData.sharedWithTemplate) return
      node.geometry.dispose()
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const value of materials) value.dispose()
    })
  }

  private syncPreyVisuals(delta = 0) {
    // A corpse that has lain long enough stops being drawn. It stays in the
    // state - the respawn clock and the run's kill count both need it - it just
    // leaves the scene, so a cleared stretch of road looks cleared.
    const activeIds = new Set(
      this.nestState.prey
        .filter((prey) => !gloamwoodValleyCorpseGone(prey as GloamwoodValleyCreature))
        .map((prey) => prey.id),
    )
    for (const [id, visual] of this.preyVisuals) {
      if (activeIds.has(id)) continue
      this.disposePreyVisual(visual)
      this.preyVisuals.delete(id)
    }
    for (const prey of this.nestState.prey) {
      if (!activeIds.has(prey.id)) continue
      const visual = this.preyVisuals.get(prey.id) ?? this.createPreyVisual(prey)
      const spec = GLOAMWOOD_PREY[prey.kind]
      visual.root.position.set(prey.x, this.map.height(prey.x, prey.z), prey.z)
      visual.root.rotation.y = prey.facingRadians
      visual.root.visible = true
      visual.targetRing.visible = prey.phase !== 'dead' && this.lockedPreyId === prey.id
      // A boss draws its own areas, at the size its patterns actually test. The
      // family ring is the prey action ring and would sit inside the real one
      // marking ground that is not where the blow lands.
      const bossSpec = gloamwoodValleyBossSpecFor(prey as GloamwoodValleyCreature)
      if (bossSpec) this.preloadNearbyBossModel(prey)
      // The mark stays up through the blow, not just the wind-up.
      //
      // It used to vanish the instant the phase left 'telegraph' - and contact
      // resolves 0.1s into the *strike*, so the circle went dark while the area
      // was still live. Back out of it, watch it disappear, step back in, get
      // hit: measured at four hits taken either way, which is what makes an
      // elite read as unbeatable and its reach read as a lie. Held out for the
      // whole committed window, the same fight costs zero hits.
      const windingUp = prey.phase === 'telegraph' && !bossSpec
      const striking = prey.phase === 'strike' && !bossSpec
      const telegraphing = windingUp || striking
      const telegraphProgress = windingUp ? Math.min(1, prey.phaseElapsed / spec.telegraphSeconds) : 1
      // The wind-up fills; the blow flares and fades over its own length, so
      // "gone" means the danger is actually over.
      const strikeProgress = striking ? Math.min(1, prey.phaseElapsed / Math.max(0.001, spec.strikeSeconds)) : 0
      ;(visual.telegraph.material as THREE.MeshBasicMaterial).opacity = striking
        ? 0.95 * (1 - strikeProgress) ** 1.4
        : windingUp ? 0.18 + telegraphProgress * 0.64 : 0
      // Asked of the authority rather than drawn from a constant, and asked
      // every frame: it depends on the player's body, which grows with every
      // evolution. It closes onto the true circle over the wind-up, so the edge
      // is exact at the instant the blow is tested - the edge being the one the
      // player's *body* crosses, which is how a mark on the ground is read.
      const reach = gloamwoodPreyTelegraphRadius(prey, gloamwoodPlayerCombatBodyRadius(this.stage, this.characterFamily))
      visual.telegraph.scale.setScalar(reach * (telegraphing ? 1.12 - telegraphProgress * 0.12 : 1))
      if (visual.model) {
        // One writer for the body. The primitive gait, strike lunge and stun
        // wobble below are the fallback's animation; running them as well would
        // add a hand-written bounce on top of an authored clip.
        this.updatePreyClip(visual, prey, delta)
        visual.body.position.set(0, 0, 0)
        visual.body.rotation.set(0, 0, 0)
        visual.body.scale.setScalar(1)
        continue
      }
      const gaitSpeed = prey.kind === 'shell' ? 0.009 : prey.kind === 'swarm' ? 0.022 : 0.016
      const gait = prey.phase === 'chase' ? Math.sin(performance.now() * gaitSpeed + prey.slot) : 0
      const strike = prey.phase === 'strike' ? Math.sin(Math.min(1, prey.phaseElapsed / spec.strikeSeconds) * Math.PI) : 0
      const stunned = prey.phase === 'stunned' ? Math.sin(prey.phaseElapsed * 42) * 0.08 : 0
      const impact = visual.impactDuration > 0 ? (visual.impactRemaining / visual.impactDuration) ** 2 * visual.impactStrength : 0
      visual.body.position.set(strike * (prey.kind === 'shell' ? 0.72 : 0.48) - impact * 0.34, Math.abs(gait) * (prey.kind === 'shell' ? 0.035 : 0.07) + impact * 0.08, stunned + impact * 0.06)
      visual.body.rotation.z = prey.phase === 'dead' ? -Math.PI / 2 : gait * (prey.kind === 'swarm' ? 0.08 : 0.035) + stunned + impact * 0.11
      visual.body.scale.set(1 + strike * 0.1 - impact * 0.09, 1 - strike * 0.14 + impact * 0.08, 1 + strike * 0.06 + impact * 0.12)
    }
    this.syncBossFx(delta)
  }

  /**
   * The boss effects, built from state that has already been decided.
   *
   * Every number handed over comes from the pattern the authority chose - the
   * area is the pattern's own shape object, and the trauma is asked for by the
   * frame rather than measured off the screen. The blow has already been
   * resolved by the time anything here runs, so no effect can decide one, and
   * a run with the shake setting off takes identical damage.
   */
  private syncBossFx(delta: number) {
    const entries: GloamwoodBossFxEntry[] = []
    for (const prey of this.nestState.prey) {
      const spec = gloamwoodValleyBossSpecFor(prey as GloamwoodValleyCreature)
      if (!spec) continue
      const creature = prey as GloamwoodValleyCreature
      const frame = gloamwoodBossFxFrame(creature, spec, this.bossFxPhase.get(prey.id))
      this.bossFxPhase.set(prey.id, prey.phase)
      entries.push({ id: prey.id, x: prey.x, z: prey.z, groundY: this.map.height(prey.x, prey.z), frame })
    }
    if (entries.length === 0 && this.bossFxPhase.size === 0) return
    if (!this.bossFx) {
      // `frame` is non-null only for the actual telegraph/strike window. The
      // preceding travel and idle time never need this presentation renderer.
      // Import failures intentionally leave authority untouched: the same
      // telegraph still deals its existing damage and the game remains playable.
      if (entries.some((entry) => entry.frame !== null)) this.ensureBossFx()
      return
    }
    const trauma = this.bossFx.update(entries, delta)
    if (trauma > 0) {
      this.cameraTrauma = Math.min(1, this.cameraTrauma + trauma)
    }
  }

  private ensureBossFx() {
    if (this.disposed || this.bossFx || this.bossFxLoad || this.bossFxUnavailable) return
    this.bossFxLoad = import('./gloamwood-boss-fx-scene')
      .then(({ createGloamwoodBossFxScene }) => {
        const bossFx = createGloamwoodBossFxScene()
        if (this.disposed) {
          bossFx.dispose()
          return
        }
        this.bossFx = bossFx
        this.scene.add(bossFx.root)
      })
      .catch(() => {
        // A presentation chunk must not become a run-ending network failure.
        // Mark it once so a transient offline review does not retry every frame.
        this.bossFxUnavailable = true
      })
      .finally(() => {
        this.bossFxLoad = undefined
      })
  }

  private spawnFootstepDust(side: -1 | 1) {
    this.footstepEvents += 1
    this.dustSequence += 1
    const forward = new THREE.Vector3(Math.cos(this.lastFacing), 0, -Math.sin(this.lastFacing))
    const right = new THREE.Vector3(-forward.z, 0, forward.x)
    const baseX = this.playerRoot.position.x - forward.x * 0.5 + right.x * side * 0.38
    const baseZ = this.playerRoot.position.z - forward.z * 0.5 + right.z * side * 0.38
    for (let index = 0; index < GLOAMWOOD_3D_LOCOMOTION_FEEL.dustPerStep; index += 1) {
      const particle = this.dustParticles.find((candidate) => !candidate.active)
      if (!particle) break
      const seed = this.dustSequence * 17.17 + index * 9.31
      const spread = Math.sin(seed) * 0.34
      const rearward = 0.08 + (Math.cos(seed * 1.7) * 0.5 + 0.5) * 0.24
      const x = baseX + right.x * spread - forward.x * rearward
      const z = baseZ + right.z * spread - forward.z * rearward
      particle.active = true
      particle.age = 0
      particle.duration = GLOAMWOOD_3D_LOCOMOTION_FEEL.dustDurationSeconds * (0.86 + (index % 3) * 0.09)
      particle.startScale = 0.26 + (index % 4) * 0.045
      particle.sprite.position.set(x, this.map.height(x, z) + 0.11 + (index % 2) * 0.04, z)
      particle.sprite.scale.setScalar(particle.startScale)
      particle.sprite.visible = true
      particle.velocity.set(
        right.x * spread * 0.8 - forward.x * (0.18 + rearward * 0.35),
        0.32 + (index % 3) * 0.06,
        right.z * spread * 0.8 - forward.z * (0.18 + rearward * 0.35),
      )
      ;(particle.sprite.material as THREE.SpriteMaterial).opacity = 0
    }
  }

  /**
   * Breaks a brood elite into its two splits.
   *
   * The gate decides *that* it splits and stamps the parent so it can only
   * happen once; nothing built the splits, so the affix did nothing at all.
   *
   * They are spread copies of the parent, which is how every other creature in
   * this pipeline is derived - the valley fields a creature carries (region,
   * home, wander, branch) survive the copy rather than being rebuilt and
   * quietly dropped. What is overridden is what a split is not: it is not an
   * elite, so no affix and no shield; it is not road furniture, so it never
   * respawns; and it wears the family's own body at the family's own size
   * rather than the elite's, which is the tell that it is the weaker thing.
   */
  private spawnEliteBrood(parent: GloamwoodNestPrey) {
    const valley = parent as GloamwoodValleyCreature
    // 'nest' is what the body registry and the respawn clock both read as
    // "spawned into a fight, not placed on the road" - the base body, and
    // nothing brings it back.
    const born = { ...valley, tier: 'nest' as const, elite: undefined }
    const body = this.map.bodyFor(born)
    const health = gloamwoodEliteBroodHealth(parent.maxHealth)
    const places = gloamwoodEliteBroodPositions(
      parent.x, parent.z,
      body?.footprintRadius ?? gloamwoodPreyBodyRadius(parent),
      parent.facingRadians,
    )
    const splits = places.map((place, index) => {
      const held = this.map.confine(place.x, place.z)
      return {
        ...born,
        id: `${parent.id}-brood-${index}`,
        health,
        maxHealth: health,
        x: held.x,
        z: held.z,
        homeX: held.x,
        homeZ: held.z,
        wanderX: held.x,
        wanderZ: held.z,
        phase: 'chase' as const,
        phaseElapsed: 0,
        attackResolved: false,
        stunImmuneSeconds: 0,
        corpseSeconds: undefined,
        // Born into a fight already in progress. A split that has to notice the
        // player first would give away the moment it exists for.
        awake: true,
        outOfReachSeconds: 0,
        slot: (parent.slot ?? 0) + index + 1,
        bodyRadius: body?.footprintRadius,
      }
    })
    this.nestState = { ...this.nestState, prey: [...this.nestState.prey, ...splits] as GloamwoodNestPrey[] }
    this.combatMessage = t('hud.msg.eliteBrood')
    this.playSound('boss-phase')
  }

  /**
   * Marks the ground a dying elite is about to poison.
   *
   * Drawn at the radius the player's *body* crosses, not the one their centre
   * does - the hit is a centre-to-centre test, and a disc drawn at the full
   * radius covers the player's own body as well, which is what made the prey
   * telegraph read as an area attack the size of a house.
   */
  private spawnEliteBurst(burst: GloamwoodEliteBurst) {
    const drawn = Math.max(0.3, burst.radius - gloamwoodPlayerCombatBodyRadius(this.stage, this.characterFamily))
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(drawn * 0.34, drawn, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: ELITE_AFFIXES.volatile.color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    )
    mesh.position.set(burst.x, this.map.height(burst.x, burst.z) + 0.07, burst.z)
    mesh.renderOrder = 3
    this.scene.add(mesh)
    this.eliteBursts.push({ burst, elapsed: 0, resolved: false, mesh })
    this.combatMessage = t('hud.msg.eliteBurst')
  }

  /** Leaves a meal where a creature fell. */
  private dropMeat(target: GloamwoodNestPrey) {
    // Only where a run can be worn down over distance. The Gloamwood is one
    // nest in a clearing and its pacing was accepted without this.
    if (this.map.hasNest) return
    this.meatSequence += 1
    // Toward the player, not onto the corpse: a creature dies at its attack
    // distance, which is further than the player can reach from where they are
    // standing. Measured in engine, three kills left three meals on the ground
    // and the player went from 55 health to 31 with two of them in sight.
    // Meat spills toward the player because it is recovery. A Gene Core is a
    // trophy: leave it at the Elite/Boss centre so it is clearly visible and
    // requires one intentional step forward rather than being vacuumed up by
    // the attack's existing stand-off distance.
    const at = { x: target.x, z: target.z }
    const drop = createGloamwoodMeatDrop(`meat-${this.meatSequence}`, target.kind, at.x, at.z)
    this.meatDrops.push(drop)
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34, 0),
      new THREE.MeshStandardMaterial({
        color: 0xb8443a, roughness: 0.62, metalness: 0,
        emissive: 0x2e0b08, emissiveIntensity: 0.5,
        transparent: true, opacity: 1,
      }),
    )
    mesh.scale.set(1.25, 0.72, 1)
    mesh.castShadow = true
    mesh.position.set(drop.x, this.map.height(drop.x, drop.z) + 0.26, drop.z)
    mesh.rotation.y = this.meatSequence * 1.1
    this.scene.add(mesh)
    this.meatVisuals.set(drop.id, mesh)
  }

  private updateMeat(delta: number) {
    if (this.meatDrops.length === 0) return
    const frame = stepGloamwoodMeat(this.meatDrops, delta, {
      x: this.playerRoot.position.x,
      z: this.playerRoot.position.z,
      health: this.playerCombat.health,
      maxHealth: this.playerCombat.maxHealth,
      bodyRadius: gloamwoodPlayerCombatBodyRadius(this.stage, this.characterFamily),
    })
    this.meatDrops = frame.drops
    for (const eaten of frame.eaten) {
      const mesh = this.meatVisuals.get(eaten.id)
      if (mesh) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
        this.meatVisuals.delete(eaten.id)
      }
      this.spawnDamageNumber(
        new THREE.Vector3(eaten.x, gloamwoodCharacterWorldHeight(1) * 0.9, eaten.z),
        eaten.heal,
        'kill',
      )
    }
    if (frame.healed > 0) {
      this.playerCombat = {
        ...this.playerCombat,
        health: Math.min(this.playerCombat.maxHealth, this.playerCombat.health + frame.healed),
      }
      this.playSound('evolution-select')
      this.combatMessage = t('hud.msg.ate', { health: frame.healed })
    }
    // Anything the authority dropped this frame - eaten or expired - leaves the
    // scene with it, so a mesh can never outlive the thing it is drawing.
    const alive = new Set(this.meatDrops.map((drop) => drop.id))
    for (const [id, mesh] of this.meatVisuals) {
      if (!alive.has(id)) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
        this.meatVisuals.delete(id)
        continue
      }
      const drop = this.meatDrops.find((entry) => entry.id === id)!
      const material = mesh.material as THREE.MeshStandardMaterial
      material.opacity = gloamwoodMeatOpacity(drop)
      // A slow bob, so a piece lying in grass still reads as a thing to take.
      mesh.position.y = this.map.height(drop.x, drop.z) + 0.26 + Math.sin(drop.age * 3.1) * 0.06
      mesh.rotation.y += delta * 0.9
    }
  }

  /** Leaves a gold core only for the fights that are optional or gate a region. */
  private dropGeneCore(
    target: GloamwoodNestPrey,
    source: GloamwoodGeneCoreSource,
    milestone?: string,
  ) {
    if (this.map.hasNest) return
    this.geneCoreSequence += 1
    const at = gloamwoodMeatDropPosition(target, this.playerRoot.position)
    const core = createGloamwoodGeneCore(
      `gene-core-${this.geneCoreSequence}`,
      source,
      target.kind,
      at.x,
      at.z,
      milestone,
    )
    this.geneCores.push(core)
    const visual = this.createGeneCoreVisual(core)
    visual.root.position.set(core.x, this.map.height(core.x, core.z) + (source === 'boss' ? 0.7 : 0.48), core.z)
    visual.root.rotation.y = this.geneCoreSequence * 0.77
    this.scene.add(visual.root)
    this.geneCoreVisuals.set(core.id, visual)
    if (source === 'elite') this.combatMessage = t('hud.msg.eliteCoreDropped', { gene: this.geneName(core.kind) })
  }

  /**
   * Three quiet layers make a rare pickup legible at a glance: a warm faceted
   * core, a low ground rune, and orbiting rings/motes. This is intentionally real
   * geometry with bounded transparent materials - no full-screen bloom, no
   * shader, and never more than eight small meshes per reward.
   */
  private createGeneCoreVisual(core: GloamwoodGeneCore): GeneCoreVisual {
    const boss = core.source === 'boss'
    const size = boss ? 1.38 : 1
    const root = new THREE.Group()
    root.name = boss ? 'BossGeneCore' : 'EliteGeneCore'
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.42 * size, 0),
      new THREE.MeshStandardMaterial({
        // The crystal needs to read as physical amber/bronze under the valley
        // light, rather than a near-white additive effect. Low emissive lets
        // the octahedron's faceted normals and terrain shadows do the work.
        color: boss ? 0xc48734 : 0x8a551d,
        emissive: boss ? 0x3a1303 : 0x210901,
        emissiveIntensity: boss ? 0.52 : 0.32,
        roughness: boss ? 0.44 : 0.58,
        metalness: boss ? 0.52 : 0.38,
        flatShading: true,
      }),
    )
    crystal.castShadow = true
    root.add(crystal)
    // No vertical cone: in the elevated camera it read as an opaque fan/traffic
    // cone over the ground. A thin circular rune makes the reward location
    // clear while leaving the terrain, nearby corpse and combat telegraphs legible.
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.72 * size, 1.12 * size, 32),
      new THREE.MeshBasicMaterial({
        color: boss ? 0xc58d3b : 0x80501e,
        transparent: true,
        opacity: boss ? 0.16 : 0.12,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    )
    halo.rotation.x = -Math.PI / 2
    halo.position.y = boss ? -0.62 : -0.42
    halo.renderOrder = 1
    root.add(halo)
    /**
     * The rings and motes are light; the crystal is not.
     *
     * These colours are deliberately over-range - `THREE.Color` components
     * above 1.0 - because the bloom pass thresholds against the linear buffer
     * before tone mapping, and anything that clamps at 1.0 there can never
     * glow however bright it looks on screen. Amber is a cheap colour to do
     * this with: the threshold is on luminance, which is 71% green, so a warm
     * hue clears the bar at a much lower value than the portal's violet needed.
     *
     * Only the small things are pushed. The crystal keeps its low emissive so
     * its facets and the terrain shadow still do the reading - the altar gem
     * taught that lesson twice - and the wide ground rune keeps its 12%
     * opacity, because a glowing disc on the floor is a light leak, not a
     * trophy.
     */
    const rings = [0, 1].map((index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry((0.52 + index * 0.2) * size, 0.026 * size, 6, 20),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(...(index === 0
            ? GLOAMWOOD_GENE_CORE_LIGHT.innerRing
            : GLOAMWOOD_GENE_CORE_LIGHT.outerRing)),
          transparent: true,
          opacity: boss ? 0.56 : 0.42,
          depthWrite: false,
          // Additive, so the two hoops read as light rather than as painted
          // wire. They are 0.026 units thick, so there is not enough of them
          // on screen for additive to wash anything out.
          blending: THREE.AdditiveBlending,
        }),
      )
      ring.rotation.x = Math.PI / 2 + (index ? 0.36 : -0.2)
      ring.position.y = 0.08 + index * 0.26
      ring.renderOrder = 3
      root.add(ring)
      return ring
    })
    const motes = Array.from({ length: boss ? 4 : 3 }, (_, index) => {
      const mote = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.065 * size, 0),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(...GLOAMWOOD_GENE_CORE_LIGHT.mote),
          transparent: true,
          opacity: GLOAMWOOD_GENE_CORE_LIGHT.moteOpacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      )
      const angle = index / (boss ? 4 : 3) * Math.PI * 2
      mote.position.set(Math.cos(angle) * 0.72 * size, 0.18 + index * 0.16, Math.sin(angle) * 0.72 * size)
      mote.renderOrder = 4
      root.add(mote)
      return mote
    })
    return { root, crystal, halo, rings, motes }
  }

  private disposeGeneCoreVisual(visual: GeneCoreVisual) {
    this.scene.remove(visual.root)
    visual.root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      node.geometry.dispose()
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) material.dispose()
    })
  }

  /** Applies the build reward only when the player has visibly claimed it. */
  private updateGeneCores(delta: number) {
    if (this.geneCores.length === 0) return
    const frame = stepGloamwoodGeneCores(this.geneCores, delta, {
      x: this.playerRoot.position.x,
      z: this.playerRoot.position.z,
      bodyRadius: gloamwoodPlayerCombatBodyRadius(this.stage, this.characterFamily),
    })
    this.geneCores = frame.cores
    for (const core of frame.collected) {
      const visual = this.geneCoreVisuals.get(core.id)
      if (visual) {
        this.disposeGeneCoreVisual(visual)
        this.geneCoreVisuals.delete(core.id)
      }
      this.nestState = {
        ...this.nestState,
        genes: { ...this.nestState.genes, [core.kind]: this.nestState.genes[core.kind] + core.bonus },
      }
      this.spawnDamageNumber(
        new THREE.Vector3(core.x, this.map.height(core.x, core.z) + 1.25, core.z),
        core.bonus,
        'kill',
      )
      this.playSound('evolution-select')
      if (core.milestone) {
        this.pendingBossCoreMilestones.delete(core.milestone)
        this.mutationState = recordGloamwoodMutationMilestone(this.mutationState, core.milestone)
        this.logSession({ kind: 'phase', phase: core.milestone })
      }
      this.combatMessage = core.source === 'boss'
        ? t('hud.msg.bossCoreClaimed', { gene: this.geneName(core.kind), bonus: core.bonus })
        : t('hud.msg.eliteCoreClaimed', { gene: this.geneName(core.kind), bonus: core.bonus })
    }
    const alive = new Set(this.geneCores.map((core) => core.id))
    for (const [id, visual] of this.geneCoreVisuals) {
      if (!alive.has(id)) continue
      const core = this.geneCores.find((entry) => entry.id === id)!
      const boss = core.source === 'boss'
      const pulse = 1 + Math.sin(core.age * (boss ? 3.4 : 2.8)) * (boss ? 0.1 : 0.065)
      visual.root.position.y = this.map.height(core.x, core.z) + (boss ? 0.7 : 0.48) + Math.sin(core.age * 2.35) * 0.12
      visual.root.rotation.y += delta * (boss ? 2.6 : 2)
      visual.crystal.rotation.y += delta * (boss ? 3.9 : 3.1)
      visual.crystal.scale.setScalar(pulse)
      visual.halo.scale.set(pulse, 0.92 + pulse * 0.08, pulse)
      ;(visual.halo.material as THREE.MeshBasicMaterial).opacity = (boss ? 0.16 : 0.12) * (0.82 + pulse * 0.18)
      for (const [index, ring] of visual.rings.entries()) {
        ring.rotation.z += delta * (index ? -1.8 : 2.25)
        ring.scale.setScalar(pulse * (1 + index * 0.06))
      }
      for (const [index, mote] of visual.motes.entries()) {
        const angle = core.age * (1.6 + index * 0.13) + index * 2.1
        mote.position.x = Math.cos(angle) * (boss ? 0.92 : 0.7)
        mote.position.z = Math.sin(angle) * (boss ? 0.92 : 0.7)
        mote.position.y = 0.28 + (index / visual.motes.length) * (boss ? 1.45 : 0.95) + Math.sin(core.age * 3 + index) * 0.09
      }
    }
  }

  private updateEliteBursts(delta: number) {
    for (const entry of [...this.eliteBursts]) {
      entry.elapsed += delta
      const material = entry.mesh.material as THREE.MeshBasicMaterial
      const winding = Math.min(1, entry.elapsed / Math.max(0.001, entry.burst.telegraphSeconds))
      if (!entry.resolved) {
        material.opacity = 0.2 + winding * 0.62
        if (entry.elapsed >= entry.burst.telegraphSeconds) {
          entry.resolved = true
          // The authority decides. Presentation has only ever drawn where.
          if (gloamwoodEliteBurstHits(entry.burst, this.playerRoot.position.x, this.playerRoot.position.z)) {
            this.takePlayerDamage(entry.burst.damage)
            this.playSound('enemy-hit-player')
          }
          this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.5)
        }
        continue
      }
      // Flares and fades over its own length, so "gone" means it is over -
      // the same rule the creature telegraphs follow.
      const after = entry.elapsed - entry.burst.telegraphSeconds
      material.opacity = Math.max(0, 0.95 * (1 - after / GLOAMWOOD_ELITE_BURST_FADE))
      if (after >= GLOAMWOOD_ELITE_BURST_FADE) {
        this.scene.remove(entry.mesh)
        entry.mesh.geometry.dispose()
        material.dispose()
        this.eliteBursts = this.eliteBursts.filter((other) => other !== entry)
      }
    }
  }

  private updateDust(delta: number) {
    for (const particle of this.dustParticles) {
      if (!particle.active) continue
      particle.age += delta
      const progress = Math.min(1, particle.age / particle.duration)
      particle.sprite.position.addScaledVector(particle.velocity, delta)
      particle.velocity.multiplyScalar(Math.exp(-2.8 * delta))
      const scale = particle.startScale + Math.sin(progress * Math.PI * 0.72) * 0.56
      particle.sprite.scale.setScalar(scale)
      ;(particle.sprite.material as THREE.SpriteMaterial).opacity = Math.sin(progress * Math.PI) * 0.72
      if (progress >= 1) {
        particle.active = false
        particle.sprite.visible = false
        ;(particle.sprite.material as THREE.SpriteMaterial).opacity = 0
      }
    }
  }


  private livePrey() {
    return this.nestState.prey.filter((prey) => prey.phase !== 'dead')
  }

  private lockedPrey() {
    return this.nestState.prey.find((prey) => prey.id === this.lockedPreyId && prey.phase !== 'dead') ?? null
  }

  private distanceToPlayer(prey: GloamwoodNestPrey) {
    return Math.hypot(prey.x - this.playerRoot.position.x, prey.z - this.playerRoot.position.z)
  }

  private nearestLivePrey() {
    return this.livePrey().sort((a, b) => this.distanceToPlayer(a) - this.distanceToPlayer(b))[0] ?? null
  }

  private geneName(kind: GloamwoodPreyKind) {
    return kind === 'fang' ? t('gene.fang') : kind === 'shell' ? t('gene.shell') : t('gene.swarm')
  }

  private waveHint(wave: number) {
    if (wave === 1) return t('wave.fangPincer')
    if (wave === 2) return t('wave.shellSwarm')
    return t('wave.mixed')
  }

  /** Sends whatever the map says, wherever the map says. */
  private resetLivePreyToNest() {
    const reset = this.map.resetAfterDeath(this.nestState, {
      x: this.playerRoot.position.x,
      z: this.playerRoot.position.z,
    })
    this.nestState = reset.state
    // Remembered as well as applied. The respawn timer runs down *after* the
    // death prompt is dismissed and used to place the player a second time, at
    // a different point, from a different authority.
    this.respawnAt = { x: reset.playerAt.x, z: reset.playerAt.z }
    this.playerRoot.position.set(reset.playerAt.x, this.map.height(reset.playerAt.x, reset.playerAt.z), reset.playerAt.z)
    this.target.copy(this.playerRoot.position)
    this.lockedPreyId = null
    this.snapCameraNextFrame = true
  }

  /** The Gloamwood's ring around its nest. */
  private nestRingReset(state: GloamwoodNestState): GloamwoodNestState {
    const living = state.prey.filter((prey) => prey.phase !== 'dead')
    const count = Math.max(1, living.length)
    return {
      ...state,
      prey: state.prey.map((prey) => {
        if (prey.phase === 'dead') return prey
        const angle = prey.slot / count * Math.PI * 2 + state.wave * 0.55
        const radius = prey.kind === 'swarm' ? 3.2 + prey.slot % 2 * 0.7 : 2.6 + prey.slot * 0.45
        return {
          ...prey,
          phase: 'chase',
          phaseElapsed: 0,
          attackResolved: false,
          x: GLOAMWOOD_NEST.centerX + Math.cos(angle) * radius,
          z: GLOAMWOOD_NEST.centerZ + Math.sin(angle) * radius,
          facingRadians: angle + Math.PI,
        }
      }),
    }
  }

  private resolveObstacles(next: THREE.Vector3) {
    const collision = resolveGloamwoodPlayerCollision(next, this.lastFacing, this.stage, this.obstacles, 6, this.characterFamily)
    next.x = collision.x
    next.z = collision.z
    const bodyRadius = gloamwoodPlayerCombatBodyRadius(this.stage, this.characterFamily)
    if (this.bossActive()) {
      let dx = next.x - this.bossState.x
      let dz = next.z - this.bossState.z
      let distance = Math.hypot(dx, dz)
      const minimum = bodyRadius + GLOAMWOOD_BOSS.bodyRadius + 0.22
      if (distance < minimum) {
        if (distance < 0.001) {
          dx = -Math.cos(this.lastFacing)
          dz = Math.sin(this.lastFacing)
          distance = 1
        }
        next.x = this.bossState.x + dx / distance * minimum
        next.z = this.bossState.z + dz / distance * minimum
        this.collisionContacts = collision.contacts + 1
        return
      }
    }
    const preyCollision = resolveGloamwoodPlayerPreyCollision(next, bodyRadius, this.nestState.prey)
    next.x = preyCollision.x
    next.z = preyCollision.z
    if (preyCollision.contacts > 0) {
      const worldCorrection = resolveGloamwoodPlayerCollision(next, this.lastFacing, this.stage, this.obstacles, 6, this.characterFamily)
      next.x = worldCorrection.x
      next.z = worldCorrection.z
      this.collisionContacts = collision.contacts + preyCollision.contacts + worldCorrection.contacts
    } else this.collisionContacts = collision.contacts
  }

  private updateCamera(delta: number) {
    this.desiredCamera.copy(this.playerRoot.position).add(this.cameraOffset)
    if (this.snapCameraNextFrame) {
      // Cut, do not travel. Respawning moves the player to the entrance of a
      // region, which can be hundreds of units away, and a damped follow sweeps
      // the whole map to get there - the player watches the valley slide past
      // for several seconds before they can act.
      this.camera.position.copy(this.desiredCamera)
      this.snapCameraNextFrame = false
    } else {
      this.camera.position.lerp(this.desiredCamera, 1 - Math.exp(-CAMERA_DAMPING * delta))
    }
    if (this.cameraTrauma > 0 && this.feedbackSettings.shake && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const phase = performance.now() * 0.047
      this.camera.position.x += Math.sin(phase) * this.cameraTrauma * 0.2
      this.camera.position.y += Math.cos(phase * 1.37) * this.cameraTrauma * 0.13
    }
    this.camera.lookAt(this.playerRoot.position.x, this.playerRoot.position.y + CAMERA_LOOK_HEIGHT, this.playerRoot.position.z)
    this.updateTreeOcclusion()
    // The map's own per-frame work: the valley culls by cell and moves its fog
    // with the player. Driven from here because it follows the camera, and the
    // camera has just been placed.
    this.map.update?.(
      { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
      performance.now() / 1000,
      delta,
    )
  }

  private updateTreeOcclusion() {
    // The geometry is shared with the valley; only the response differs. Forty
    // trees can be switched outright, and thousands of instanced props cannot.
    const from = {
      x: this.playerRoot.position.x,
      y: this.playerRoot.position.y + CAMERA_LOOK_HEIGHT,
      z: this.playerRoot.position.z,
    }
    for (const tree of this.trees) {
      tree.group.visible = !gloamwoodOccludesCameraView(tree, from, this.camera.position)
    }
  }

  private updateCharacterMotion(delta: number) {
    const targetBlend = this.moving ? 1 : 0
    const previousBlend = this.runBlend
    this.runBlend += (targetBlend - this.runBlend) * (1 - Math.exp(-(this.moving ? 8.5 : 13) * delta))
    const runCyclesPerSecond = this.stage === 1
      ? SCARLET_GECKO_PRESENTATION.animation.runPlaybackRate
      : GLOAMWOOD_3D_LOCOMOTION_FEEL.runCyclesPerSecond
    if (this.moving) this.locomotionPhase += delta * runCyclesPerSecond * Math.PI * 2
    if (!this.moving && previousBlend > 0.18 && this.runBlend <= 0.18) this.stopSettle = 0.24
    this.stopSettle = Math.max(0, this.stopSettle - delta)
    this.locomotionImpact = Math.max(0, this.locomotionImpact - delta * GLOAMWOOD_3D_LOCOMOTION_FEEL.impactDecayPerSecond)
    const footstep = stepGloamwoodFootsteps(this.footstepState, this.locomotionPhase, this.runBlend)
    if (footstep.emitted) {
      this.playSound('footstep')
      this.locomotionImpact = 1
      this.spawnFootstepDust(footstep.side)
      this.cameraTrauma = Math.min(1, this.cameraTrauma + GLOAMWOOD_3D_LOCOMOTION_FEEL.footstepTrauma)
    }
    const weight = gloamwoodWeightFrame(this.locomotionPhase, this.runBlend, this.locomotionImpact)
    const { contact, compression } = weight
    const settle = this.stopSettle > 0 ? Math.sin((1 - this.stopSettle / 0.24) * Math.PI) : 0
    const baseY = weight.yOffset - settle * GLOAMWOOD_3D_LOCOMOTION_FEEL.stopSettleDepth
    const now = performance.now()
    const attackAction = now < this.attackUntil && isBasicAttackAction(this.activeClip)
      ? this.activeClip
      : null
    const attackElapsedSeconds = (now - this.attackStartedAt) / 1000
    const leapBite = attackAction === 'Pounce'
      ? this.stage === 1
        ? gloamwoodStageOnePounceFrame(attackElapsedSeconds, Math.max(0.001, this.attackDurationSeconds))
        : juvenileLeapBiteMotionFrame(attackElapsedSeconds, Math.max(0.001, this.attackDurationSeconds))
      : null
    const juvenileTailSpin = attackAction === 'TailSwipe'
      ? juvenileSpinTailSwipeMotionFrame(
          (now - this.attackStartedAt) / 1000,
          Math.max(0.001, this.attackDurationSeconds),
          this.attackContactSeconds(attackAction),
        )
      : null
    const attack = leapBite ?? juvenileTailSpin ?? (attackAction
      ? quadrupedAttackMotionFrame(
          attackAction,
          (now - this.attackStartedAt) / 1000,
          Math.max(0.001, this.attackDurationSeconds),
          this.attackContactSeconds(attackAction),
        )
      : quadrupedAttackMotionFrame('Claw', 0, 1, 0.5))
    if (leapBite && leapBite.progress >= CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.landingProgress && !this.leapBiteLandingResolved) {
      this.leapBiteLandingResolved = true
      this.leapBiteLandingEvents += 1
      this.playSound('land')
      this.spawnFootstepDust(-1)
      this.spawnFootstepDust(1)
      this.locomotionImpact = 1
      this.cameraTrauma = Math.min(1, this.cameraTrauma + CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.landingCameraTrauma)
    }
    this.characterRoot.position.x = attack.forwardOffset
    this.characterRoot.position.y = baseY + attack.liftOffset
    this.characterRoot.rotation.y = attack.yawRadians
    this.characterRoot.rotation.z = weight.bodyRock + attack.pitchRadians
    if (leapBite || juvenileTailSpin) this.characterRoot.scale.setScalar(1)
    else {
      this.characterRoot.scale.set(
        (1 + compression * 0.42) * attack.forwardScale,
        (1 - compression) * attack.verticalScale,
        (1 + compression * 0.42) * attack.widthScale,
      )
    }
    for (const [index, material] of this.shadowMaterials.entries()) {
      material.opacity = (0.32 - index * 0.07)
        + contact * 0.18
        + settle * 0.05
        - (leapBite?.airborneStrength ?? 0) * 0.13
        + (leapBite?.landingStrength ?? 0) * 0.08
    }
  }

  private applySecondaryMotion() {
    if (!this.character || this.runBlend <= 0.002) return
    // The embedded Run clip already owns every leg and foot transform. Adding
    // another Euler stride here rotates weighted limb vertices twice and makes
    // the near-side legs stretch in profile. Secondary motion is therefore
    // restricted to the tail; leg volume stays entirely under the authored GLB.
    for (const [index, tail] of this.tailNodes.entries()) tail.rotation.y += Math.sin(this.locomotionPhase - index * 0.35) * this.runBlend * (0.025 + index * 0.008)
  }

  private attackContactSeconds(action: FormalHuntBasicAttackAction) {
    if (action === 'Bite') return this.combatProfile.biteContactSeconds
    if (action === 'Pounce') return this.combatProfile.pounceContactSeconds
    if (action === 'Claw') return this.combatProfile.clawContactSeconds
    return this.combatProfile.tailSwipeContactSeconds
  }

  /**
   * Play a strike clip fast enough that it finishes inside its authority window.
   *
   * A one-shot action is stopped when `attackUntil` passes, so a clip longer
   * than its window is simply cut. Measured across the whole cast, only the Fang
   * hunter's TailSwipe ever completed: the rest played 56% to 84% of themselves,
   * and what is lost is always the tail of the motion - the recovery and the
   * settle back to rest. The player sees the strike stop mid-pose and crossfade
   * to Idle from wherever it happened to be, which is most of why the attacks
   * did not read as finished blows.
   *
   * Fitting is done here rather than by lengthening the windows because the
   * windows are combat authority: damage, reach and the contact instant are
   * timed against them and were playtested that way. This changes only how fast
   * the animation is played back, and nothing about when damage lands.
   *
   * Clamped, because a clip needing more than double speed would read as a
   * twitch; those are better fixed by shortening the clip at export, which is
   * what the two stage-2 forms already do - their windows equal their clip
   * lengths, so they come out at 1.0 and are untouched by this.
   */
  private fittedAttackPlaybackRate(name: string, clipDuration: number) {
    return gloamwoodFittedAttackPlaybackRate(
      gloamwoodFormAttackPlaybackRate(this.characterFormId, name),
      clipDuration,
      this.attackWindowSeconds(name as FormalHuntBasicAttackAction),
    )
  }

  /** How long the authority gives this step. The clip has to fit inside it. */
  private attackWindowSeconds(action: FormalHuntBasicAttackAction) {
    if (action === 'Bite') return this.combatProfile.biteDurationSeconds
    if (action === 'Pounce') return this.combatProfile.pounceDurationSeconds
    if (action === 'Claw') return this.combatProfile.clawDurationSeconds
    return this.combatProfile.tailSwipeDurationSeconds
  }

  private setAction(name: string, force = false) {
    // The Shell form has no Pounce: short stout forelimbs cannot sell a leap, so
    // the contract replaces it with a planted Slam. Only the clip is redirected -
    // damage, range and timing stay on the existing authority untouched.
    const clipName = this.characterFamily === 'shell' && name === 'Pounce'
      ? 'Slam'
      : this.stage <= 1 && name === 'Pounce'
        ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipName
        : name
    const next = this.actions.get(clipName)
    if (!next || (!force && name === this.activeClip)) return
    const previousClipName = this.stage <= 1 && this.activeClip === 'Pounce'
      ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipName
      : this.activeClip
    const previous = this.actions.get(previousClipName)
    const oneShot = name === 'Bite' || name === 'Pounce' || name === 'Claw' || name === 'TailSwipe' || name === 'Hit' || name === 'Death'
    // Keyed by form. Selecting the presentation by stage gave every stage-2 body
    // the Fang hunter's locomotion rates, the same defect class as the three
    // recorded in the Shell stage-2 contract.
    const presentation = gloamwoodFormPresentation(this.characterFormId)
      ?? (this.stage === 2
        ? SCARLET_HUNTER_PRESENTATION
        : this.stage === 1
          ? SCARLET_GECKO_PRESENTATION
          : CORAL_GECKO_PRESENTATION)
    const playbackRate = this.stage <= 1 && name === 'Pounce'
      ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipPlaybackRate
      : name === 'Run'
      ? presentation.animation.runPlaybackRate
      : name === 'Bite' || name === 'Pounce' || name === 'Claw' || name === 'TailSwipe'
        ? this.fittedAttackPlaybackRate(name, next.getClip().duration)
        : 1
    if (name === 'Run') {
      stopGloamwoodActionsExcept(this.actions.values(), next)
      next.reset().setEffectiveTimeScale(playbackRate).setEffectiveWeight(RUN_POSE_WEIGHT)
      next.setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.16).play()
      this.activeClip = name
      return
    }
    if (name === 'Idle') {
      stopGloamwoodActionsExcept(this.actions.values(), next)
      next.enabled = true
      next.setEffectiveTimeScale(1).setEffectiveWeight(1)
      next.reset().fadeIn(0.12).play()
      this.activeClip = name
      return
    }
    for (const action of this.actions.values()) {
      if (action !== next && action !== previous && action.isScheduled()) action.stop()
    }
    next.reset().setEffectiveTimeScale(playbackRate).setEffectiveWeight(1)
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity)
    next.clampWhenFinished = oneShot
    if (previous && previous !== next) previous.crossFadeTo(next, oneShot ? 0.08 : 0.18, false)
    next.play()
    this.activeClip = name
  }

  private openEvolutionGateForDebug() {
    this.nestState = {
      ...this.nestState,
      phase: 'cleared',
      wave: GLOAMWOOD_NEST.waveCount,
      kills: 11,
      biomass: 76,
      genes: { fang: 3, shell: 2, swarm: 6 },
      recentHunts: ['shell', 'swarm', 'swarm', 'fang', 'swarm', 'swarm'],
    }
    // `openGloamwoodEvolutionOffer` refuses once anything has been selected,
    // which is right for the first gate and useless for every later one. This
    // helper could therefore only ever open evolution one: a reviewer driving it
    // twice got a silent no-op the second time, and the run looked as though a
    // second evolution had happened and changed nothing. It is the same call the
    // road itself makes once a selection exists.
    this.evolutionState = this.evolutionState.phase === 'selected'
      ? openGloamwoodNextEvolutionOffer(this.evolutionState, this.nestState.genes, this.nestState.recentHunts)
      : openGloamwoodEvolutionOffer(this.evolutionState, this.nestState.genes, this.nestState.recentHunts)
    this.showEvolutionOverlay()
  }

  private showEvolutionOverlay() {
    if (!this.evolutionOverlay) {
      const overlay = document.createElement('section')
      overlay.className = 'gloamwood-evolution-overlay'
      overlay.setAttribute('role', 'dialog')
      overlay.setAttribute('aria-modal', 'true')
      overlay.setAttribute('aria-label', t('evo.chooseTitle'))
      this.evolutionOverlay = overlay
      this.container.append(overlay)
    }
    this.keys.clear()
    this.runPhase = 'evolution'
    this.primaryHeld = false
    this.touchMoveX = 0
    this.touchMoveZ = 0
    this.renderEvolutionOffer()
    this.evolutionOverlay.hidden = false
    this.playSound('evolution-open')
    this.evolutionOverlay.querySelector<HTMLButtonElement>('[data-evolution-choice]')?.focus()
  }

  private renderEvolutionOffer() {
    if (!this.evolutionOverlay) return
    this.evolutionOverlay.innerHTML = [
      `<div class="g3d-evolution-panel" data-busy-label="${t('evo.busy')}">`,
      `<header><span>${t('evo.eyebrow')}</span><h1>${t('evo.headline')}</h1>`,
      '</header>',
      '<div class="g3d-evolution-choices">',
      ...this.evolutionState.candidates.map((candidate, index) => [
        `<button data-evolution-choice="${index}" data-family="${candidate.family}">`,
        `<span><kbd>${index + 1}</kbd>${t('evo.routeChip', { family: candidate.familyName, probability: candidate.probability })}</span>`,
        // The still reads the route. Both candidates in a family share one body,
        // so a unique creature picture would imply a difference that does not exist.
        gloamwoodFamilyPortrait(candidate.family),
        `<strong>${candidate.name}</strong>`,
        `<b>${candidate.statLine}</b>`,
        '</button>',
      ].join('')),
      '</div>',
      '<footer>',
      `<button data-evolution-refresh ${this.evolutionState.refreshesRemaining <= 0 ? 'disabled' : ''}>${t('evo.rerollBtn', { count: this.evolutionState.refreshesRemaining })}</button>`,
      '</footer>',
      '</div>',
    ].join('')
    for (const button of this.evolutionOverlay.querySelectorAll<HTMLButtonElement>('[data-evolution-choice]')) {
      button.addEventListener('click', () => this.chooseEvolution(Number(button.dataset.evolutionChoice)))
    }
    this.evolutionOverlay.querySelector<HTMLButtonElement>('[data-evolution-refresh]')?.addEventListener('click', () => this.refreshEvolution())
  }

  private refreshEvolution() {
    const previous = this.evolutionState
    this.evolutionState = refreshGloamwoodEvolutionOffer(previous, this.nestState.genes, this.nestState.recentHunts)
    if (this.evolutionState === previous) return
    this.combatMessage = t('evo.rerolled')
    this.renderEvolutionOffer()
    this.evolutionOverlay?.querySelector<HTMLButtonElement>('[data-evolution-choice]')?.focus()
  }

  /**
   * Fold the form evolution and every mutation held into the live modifiers.
   *
   * One writer. Mutations stack on the evolution rather than replacing it, and
   * routing both through here is what keeps a mutation from becoming a fourth
   * place that decides damage - the failure this project has already paid for
   * with three separate stage-keyed damage lookups.
   */
  /**
   * One gate for every hit the player takes.
   *
   * Symbiosis redirects a share of it and Moult catches the killing blow, and
   * both had to sit here rather than beside each incoming-damage site: prey and
   * boss damage arrive through two different event loops, and a mutation that
   * only worked against one of them would be a bug nobody notices until the
   * boss fight.
   */
  private takePlayerDamage(rawDamage: number) {
    const reflect = this.mutationEffects.reflectFraction ?? 0
    const received = gloamwoodPlayerDamageTaken(rawDamage * (1 - reflect), this.damageReduction, this.flatArmour)
    if (reflect > 0) {
      this.reflectDamageToNearestPrey(Math.round(rawDamage * reflect))
      this.spawnCarapaceFeedback()
      this.logSession({ kind: 'mutation-effect', id: 'shell-symbiosis', effect: 'carapace-reflect' })
    }
    this.playerCombat = damageGloamwoodPlayer(this.playerCombat, received)
    // Moult spends itself on the blow that would have ended the run.
    const revive = this.mutationEffects.reviveFraction
    if (!this.playerCombat.alive && revive && !this.reviveUsed) {
      this.reviveUsed = true
      this.playerCombat = {
        ...this.playerCombat,
        alive: true,
        health: Math.max(1, Math.round(this.playerCombat.maxHealth * revive)),
      }
      this.spawnMoultFeedback()
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.28)
      this.logSession({ kind: 'mutation-effect', id: 'swarm-moult', effect: 'moult-revive' })
      this.combatMessage = t('mutation.moulted')
      this.playSound('evolution-select')
    }
    return received
  }

  /** Symbiosis pays its redirected share to whoever is closest, prey only. */
  private reflectDamageToNearestPrey(amount: number) {
    if (amount <= 0) return
    let nearest: { id: string; distance: number } | null = null
    for (const prey of this.nestState.prey) {
      if (prey.phase === 'dead') continue
      const distance = Math.hypot(prey.x - this.playerRoot.position.x, prey.z - this.playerRoot.position.z)
      if (!nearest || distance < nearest.distance) nearest = { id: prey.id, distance }
    }
    if (!nearest) return
    const result = damageGloamwoodNestPrey(
      this.nestState,
      nearest.id,
      amount,
      'Claw',
      { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
      0,
    )
    this.nestState = result.state
  }

  /** Incoming hard-shell mitigation is not silent: plates flash and shed chips. */
  private spawnCarapaceFeedback() {
    this.spawnMutationFxBurst('carapace')
    this.spawnCarapaceShell()
  }

  /** Thick hex plates wrapped around the torso, facing outward. Not a painted card. */
  private spawnCarapaceShell() {
    const x = this.playerRoot.position.x
    const z = this.playerRoot.position.z
    const ground = this.map.height(x, z)
    const facing = this.lastFacing
    const pace = this.feedbackDurationMultiplier
    const layout = carapaceShellLayout(this.playerVisualGroundRadius)
    const forwardX = Math.cos(facing)
    const forwardZ = -Math.sin(facing)
    const rightX = Math.cos(facing - Math.PI / 2)
    const rightZ = -Math.sin(facing - Math.PI / 2)
    const chestY = ground + 0.82
    for (const [index, plate] of layout.entries()) {
      const worldX = x + rightX * plate.local[0] + forwardX * plate.local[2]
      const worldY = chestY + plate.local[1]
      const worldZ = z + rightZ * plate.local[0] + forwardZ * plate.local[2]
      const material = new THREE.MeshStandardMaterial({
        color: index % 2 ? 0xc4a070 : 0x8a6a44,
        roughness: 0.46,
        metalness: 0.14,
        emissive: 0x4a3014,
        emissiveIntensity: 0.42,
        transparent: true,
        opacity: 0,
        depthWrite: true,
        depthTest: true,
      })
      const mesh = new THREE.Mesh(this.carapacePlate, material)
      mesh.position.set(worldX, worldY, worldZ)
      this.carapaceOutward.set(worldX - x, worldY - chestY, worldZ - z)
      if (this.carapaceOutward.lengthSq() < 0.0001) this.carapaceOutward.set(0, 1, 0)
      else this.carapaceOutward.normalize()
      mesh.quaternion.setFromUnitVectors(this.carapaceUp, this.carapaceOutward)
      mesh.userData.carapaceVolume = true
      mesh.renderOrder = 5
      const size = plate.size
      const thickness = size * 0.187
      mesh.scale.set(size, thickness, size)
      this.scene.add(mesh)
      this.mutationParticles.push({
        object: mesh,
        material,
        velocity: new THREE.Vector3(),
        spin: 0,
        age: 0,
        duration: 0.52 * pace,
        gravity: 0,
        motion: 'expand',
        peakOpacity: 0.72,
        startScale: new THREE.Vector2(size, thickness),
        endScale: new THREE.Vector2(size * 1.08, thickness * 1.08),
        attractTarget: mesh.position.clone(),
      })
      if (index % 2 !== 0) continue
      const chipMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a4030,
        roughness: 0.62,
        metalness: 0.08,
        transparent: true,
        opacity: 0,
        depthWrite: true,
        depthTest: true,
      })
      const chip = new THREE.Mesh(this.carapacePlate, chipMaterial)
      chip.position.copy(mesh.position)
      chip.quaternion.copy(mesh.quaternion)
      chip.userData.carapaceVolume = true
      chip.renderOrder = 6
      const chipSize = size * 0.38
      const chipThick = chipSize * 0.227
      chip.scale.set(chipSize, chipThick, chipSize)
      this.scene.add(chip)
      this.mutationParticles.push({
        object: chip,
        material: chipMaterial,
        velocity: this.carapaceOutward.clone().multiplyScalar(2.4).add(new THREE.Vector3(0, 1.4, 0)),
        spin: 6.2,
        age: index * 0.006,
        duration: 0.55 * pace,
        gravity: 9.2,
        motion: 'ballistic',
        peakOpacity: 0.82,
        startScale: new THREE.Vector2(chipSize, chipThick),
        endScale: new THREE.Vector2(chipSize * 0.45, chipThick * 0.45),
        attractTarget: chip.position.clone(),
      })
    }
  }

  private applyProgressionModifiers() {
    const evolution = this.evolutionModifiers
    const mutation = this.mutationEffects
    this.damageMultiplier = evolution.damageMultiplier * (mutation.damageMultiplier ?? 1)
    this.moveSpeedMultiplier = evolution.moveSpeedMultiplier * (mutation.moveSpeedMultiplier ?? 1)
    this.damageReduction = 1 - (1 - evolution.damageReduction) * (1 - (mutation.incomingDamageReduction ?? 0))
    this.flatArmour = evolution.flatArmour
    this.biomassMultiplier = evolution.biomassMultiplier * (mutation.biomassMultiplier ?? 1)
    // Symbiosis trades away kill healing outright, whatever granted it.
    this.killHeal = mutation.suppressKillHeal ? 0 : evolution.killHeal + (mutation.killHeal ?? 0)
    const previousMaximum = this.playerCombat.maxHealth
    const maximumHealth = Math.max(
      20,
      GLOAMWOOD_3D_COMBAT.playerMaxHealth
        + evolution.maximumHealthBonus
        + (mutation.maximumHealthBonus ?? 0)
        - this.decayedMaximumHealth,
    )
    this.playerCombat = {
      ...this.playerCombat,
      maxHealth: maximumHealth,
      health: Math.min(maximumHealth, this.playerCombat.health + Math.max(0, maximumHealth - previousMaximum)),
    }
  }

  /** Maximum health already shed to Starving Metabolism. */
  private decayedMaximumHealth = 0

  /**
   * Offers are earned by biomass, plus whatever Gluttony has bought. They are
   * withheld while a form evolution, the guardian or the boss is on screen: two
   * choice panels stacked on one another means the player remembers neither.
   */
  /**
   * The held-mutation strip.
   *
   * Effects accumulate - multipliers compound, bonuses add - so by the end of a
   * run the player is carrying five of them at once. Without somewhere to read
   * that back, the stacking is invisible and there is nothing to plan the next
   * pick around, which is most of what the layer is for.
   */
  private updateMutationList() {
    const list = this.hud?.querySelector<HTMLElement>('[data-g3d-mutations]')
    if (!list) return
    const held = this.mutationState.taken
    if (held.length === 0) {
      list.hidden = true
      return
    }
    const signature = held.join('|')
    if (list.dataset.signature === signature) return
    list.dataset.signature = signature
    list.hidden = false
    const pool = new Map(GLOAMWOOD_MUTATION_POOL.map((mutation) => [mutation.id, mutation.family]))
    list.innerHTML = held.map((id) => {
      const name = t(`mutation.${id}.name` as 'mutation.fang-thin-hide.name')
      const rule = t(`mutation.${id}.rule` as 'mutation.fang-thin-hide.rule')
      const cost = t(`mutation.${id}.cost` as 'mutation.fang-thin-hide.cost')
      return [
        // A button rather than a div: hover is not available on the phone this
        // is meant to be played on, so the tooltip has to open on tap and on
        // keyboard focus too.
        `<button type="button" class="g3d-mutation-chip" data-family="${pool.get(id) ?? 'neutral'}"`,
        ` aria-expanded="false" aria-label="${name}">`,
        gloamwoodMutationIcon(id),
        `<i><strong>${name}</strong><span>${rule}</span><em>${cost}</em></i>`,
        '</button>',
      ].join('')
    }).join('')
    for (const chip of list.querySelectorAll<HTMLButtonElement>('.g3d-mutation-chip')) {
      chip.addEventListener('click', () => {
        const open = chip.getAttribute('aria-expanded') === 'true'
        for (const other of list.querySelectorAll('.g3d-mutation-chip')) other.setAttribute('aria-expanded', 'false')
        chip.setAttribute('aria-expanded', open ? 'false' : 'true')
      })
    }
  }

  /** Append to the recording, stamping the time so callers never have to. */
  private logSession(event: Parameters<GloamwoodSessionLog['record']>[0] extends infer E
    ? E extends { t: number } ? Omit<E, 't'> : never : never) {
    this.sessionLog.record({ ...event, t: Number(((performance.now() - this.runStartedAt) / 1000).toFixed(2)) } as never)
  }

  /**
   * Periodic sample plus a phase marker.
   *
   * Four a second is enough to catch a player drifting outside the arena or an
   * encounter going quiet, and cheap enough to leave on for a whole run.
   */
  /**
   * Records whatever boundaries the map says the run has crossed.
   *
   * The mutation layer takes opaque ids and counts them, so this is a change of
   * source and not of system: the Gloamwood keeps firing its milestones from
   * nest events and answers nothing here.
   */
  private updateValleyProgression() {
    const reached = this.map.reachedMilestones(
      this.nestState,
      { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
      this.mutationState.reached,
    )
    for (const milestone of reached) {
      // The map can correctly observe a dead Boss before the player reaches the
      // core it left behind. The gate is already authoritative, but the reward
      // must remain a physical claim rather than a hidden auto-grant.
      if (this.pendingBossCoreMilestones.has(milestone)) continue
      this.mutationState = recordGloamwoodMutationMilestone(this.mutationState, milestone)
      this.valleyProgression = recordGloamwoodValleyMilestone(this.valleyProgression, milestone)
      const milestoneDefinition = gloamwoodValleyMilestone(milestone)
      // Entering a region tops the life budget back up rather than adding to
      // it. A region is a checkpoint: the player arrives at a new tier whole,
      // and a careful run through the shallows does not bank lives to spend
      // carelessly in the headwater.
      if (milestoneDefinition?.kind === 'region-entry') {
        this.valleyProgression = enterGloamwoodValleyRegion(this.valleyProgression, milestoneDefinition.region)
        this.livesRemaining = this.valleyProgression.livesRemaining
      }
      this.logSession({ kind: 'phase', phase: milestone })
    }
    // The valley's two form evolutions are biomass-paid. Without this bridge,
    // a player could clear the whole road in their starting body.
    if (
      this.runPhase === 'hunt'
      && this.evolutionState.phase !== 'choosing'
      && gloamwoodValleyEvolutionDue(this.nestState.biomass, this.evolutionsTaken)
    ) {
      this.evolutionState = openGloamwoodNextEvolutionOffer(
        this.evolutionState,
        this.nestState.genes,
        this.nestState.recentHunts,
      )
      this.runPhase = 'evolution'
      this.combatMessage = t('hud.msg.chooseEvolution')
      this.showEvolutionOverlay()
    }
  }

  /**
   * Holds ordinary movement and knockback on the near side of an unopened
   * regional gate. The pure valley progression module owns the geometry; this
   * runtime method is deliberately only the one bridge from authoritative run
   * state to a player position.
   */
  private holdValleyGate(position: THREE.Vector3) {
    if (this.map.id !== 'valley') return false
    const held = holdGloamwoodValleyAtGate(this.valleyProgression, position.x, position.z)
    const blocked = Math.hypot(held.x - position.x, held.z - position.z) > 0.02
    position.x = held.x
    position.z = held.z
    if (!blocked) return false
    const gate = gloamwoodValleyNextGate(
      this.valleyProgression,
      gloamwoodValleyCorridorAt(position.x, position.z).s,
    )
    if (!gate) return false
    const boss = this.nestState.prey.find((prey) => {
      const creature = prey as GloamwoodValleyCreature
      return creature.tier === 'boss' && creature.spawnS < gate.s && creature.phase !== 'dead'
    })
    this.combatMessage = boss
      ? t('hud.msg.valleyGateHeld', { name: this.preyName(boss) })
      : t('hud.msg.takeTheRoad')
    return true
  }

  private updateSessionLog() {
    if (this.runPhase !== this.sessionRunPhase) {
      this.sessionRunPhase = this.runPhase
      this.logSession({ kind: 'phase', phase: this.runPhase })
    }
    const now = performance.now()
    if (now - this.sessionSampleAt < 250) return
    this.sessionSampleAt = now
    this.logSession({
      kind: 'sample',
      phase: this.runPhase,
      arenaOffset: Number(Math.hypot(
        this.playerRoot.position.x - GLOAMWOOD_BOSS_ARENA.x,
        this.playerRoot.position.z - GLOAMWOOD_BOSS_ARENA.z,
      ).toFixed(2)),
      health: this.playerCombat.health,
    })
  }

  private updateMutationOffers() {
    if (this.mutationState.offering || this.paused) return
    // Offers now arrive on run milestones, and two of those land inside the
    // guardian and boss fights, so this can no longer refuse to run outside the
    // hunt. It still refuses to stack on the evolution choice or a finished run.
    if (this.evolutionState.phase === 'choosing') return
    if (this.runPhase === 'victory' || this.runPhase === 'defeat') return
    // Never inside an encounter. A panel mid-fight is not unfair - the world
    // stops - but it asks for a considered choice from a player still in the
    // headspace of dodging, and they answer it in a second.
    if (this.runPhase === 'guardian' || this.runPhase === 'boss') return
    const earned = gloamwoodMutationOffersEarned(this.mutationState) + this.bonusOffersEarned
    if (earned <= this.mutationOffersTaken) return
    this.mutationState = openGloamwoodMutationOffer(this.mutationState, this.nestState.genes)
    if (!this.mutationState.offering) {
      // Pool exhausted. Count it as taken so the check stops re-running.
      this.mutationOffersTaken = earned
      return
    }
    this.showMutationOverlay()
  }

  /**
   * Offer the guardian's mutation before the boss begins.
   *
   * Returns true when a panel opened, in which case starting the boss is the
   * panel's job. Clearing the guardian runs straight into the boss encounter, so
   * without this the reward arrives during the intro and is read while something
   * is already winding up.
   */
  /**
   * Pay the player for clearing a wave of the altar defence.
   *
   * Taken during the intermission, which is the only quiet the mode has: the
   * field is clear by definition and the next wave is six seconds away, so a
   * choice is never made with something chewing on the altar.
   *
   * Without this the player fought all twelve waves as a stage-zero body with
   * an empty mutation deck while the creatures scaled to 2.9x health - which is
   * what the owner actually ran into, not a tuning problem.
   */
  private presentDefenceGrowth(wave: number) {
    const reward = gloamwoodDefenceReward(wave)
    if (reward === 'none') return
    if (reward === 'evolution') {
      // Two different openers, and using the wrong one is a defect this project
      // has already shipped once: `openGloamwoodEvolutionOffer` returns the
      // state unchanged when a form has already been selected, so it can only
      // ever open the *first* evolution. The debug gate had exactly this bug and
      // silently did nothing on the second.
      this.evolutionState = this.evolutionState.phase === 'selected'
        ? openGloamwoodNextEvolutionOffer(this.evolutionState, this.nestState.genes, this.nestState.recentHunts)
        : openGloamwoodEvolutionOffer(this.evolutionState, this.nestState.genes, this.nestState.recentHunts)
      if (this.evolutionState.phase !== 'choosing') return
      this.runPhase = 'evolution'
      this.showEvolutionOverlay()
      return
    }
    this.mutationState = recordGloamwoodMutationMilestone(this.mutationState, `defence-wave-${wave}`)
    const earned = gloamwoodMutationOffersEarned(this.mutationState) + this.bonusOffersEarned
    if (earned <= this.mutationOffersTaken) return
    this.mutationState = openGloamwoodMutationOffer(this.mutationState, this.nestState.genes)
    if (!this.mutationState.offering) {
      // Nothing left in the pool. Bank the offer so it is not re-counted every
      // wave for the rest of the run.
      this.mutationOffersTaken = earned
      return
    }
    this.showMutationOverlay()
  }

  private presentGuardianMutation() {
    const earned = gloamwoodMutationOffersEarned(this.mutationState) + this.bonusOffersEarned
    if (earned <= this.mutationOffersTaken) return false
    this.mutationState = openGloamwoodMutationOffer(this.mutationState, this.nestState.genes)
    if (!this.mutationState.offering) {
      this.mutationOffersTaken = earned
      return false
    }
    this.afterMutationChoice = () => this.startBossEncounter()
    this.showMutationOverlay()
    return true
  }

  private showMutationOverlay() {
    if (!this.mutationOverlay) {
      const overlay = document.createElement('section')
      overlay.className = 'gloamwood-evolution-overlay gloamwood-mutation-overlay'
      overlay.setAttribute('role', 'dialog')
      overlay.setAttribute('aria-modal', 'true')
      overlay.setAttribute('aria-label', t('mutation.title'))
      this.mutationOverlay = overlay
      this.container.append(overlay)
    }
    this.keys.clear()
    this.primaryHeld = false
    this.touchMoveX = 0
    this.touchMoveZ = 0
    this.cancelAutoEngage()
    this.renderMutationOffer()
    this.mutationOverlay.hidden = false
    this.playSound('evolution-open')
    this.mutationOverlay.querySelector<HTMLButtonElement>('[data-mutation-choice]')?.focus()
  }

  private renderMutationOffer() {
    if (!this.mutationOverlay) return
    this.mutationOverlay.innerHTML = [
      '<div class="g3d-evolution-panel">',
      `<header><span>${t('mutation.eyebrow')}</span><h1>${t('mutation.title')}</h1></header>`,
      '<div class="g3d-evolution-choices">',
      ...this.mutationState.candidates.map((candidate, index) => [
        `<button data-mutation-choice="${index}" data-family="${candidate.family}">`,
        `<span><kbd>${index + 1}</kbd>${t(`family.${candidate.family}` as 'family.fang')}</span>`,
        `<strong>${candidate.name}</strong>`,
        // The rule comes first and the price second, because the price is what
        // makes it a decision rather than a reward.
        `<b>${candidate.rule}</b>`,
        `<em>${candidate.cost}</em>`,
        '</button>',
      ].join('')),
      '</div>',
      '</div>',
    ].join('')
    for (const button of this.mutationOverlay.querySelectorAll<HTMLButtonElement>('[data-mutation-choice]')) {
      button.addEventListener('click', () => this.chooseMutation(Number(button.dataset.mutationChoice)))
    }
  }

  private chooseMutation(index: number) {
    const candidate = this.mutationState.candidates[index]
    if (!candidate || !this.mutationState.offering) return
    this.mutationState = selectGloamwoodMutation(this.mutationState, candidate.id)
    this.mutationEffects = accumulateGloamwoodMutationEffects(this.mutationState.taken)
    this.mutationOffersTaken += 1
    this.applyProgressionModifiers()
    this.refreshMutationBodyPresentation()
    // Update the strip here rather than waiting for the next HUD tick: the
    // panel closes on this click, and the chip should already be there when it
    // does.
    this.updateMutationList()
    this.logSession({ kind: 'mutation', id: candidate.id, phase: this.runPhase })
    this.playSound('evolution-select')
    this.combatMessage = t('mutation.gained', { name: candidate.name })
    if (this.mutationOverlay) this.mutationOverlay.hidden = true
    this.renderer.domElement.focus()
    const queued = this.afterMutationChoice
    this.afterMutationChoice = undefined
    queued?.()
    this.requestNextFrame(true)
  }

  /** Starving Metabolism sheds maximum health on a clock rather than on hits. */
  private updateHealthDecay(delta: number) {
    const perInterval = this.mutationEffects.healthDecayPerInterval
    const interval = this.mutationEffects.healthDecayIntervalSeconds
    if (!perInterval || !interval) return
    this.healthDecayElapsed += delta
    if (this.healthDecayElapsed < interval) return
    this.healthDecayElapsed -= interval
    this.decayedMaximumHealth += perInterval
    this.applyProgressionModifiers()
    this.spawnMetabolicFeedback('decay')
    // The cost, said out loud. This tick used to happen in silence: a 0.7s
    // flicker of veins on the animal's flank and a second number in the HUD
    // quietly getting smaller. A player could lose forty points of ceiling over
    // a run and never see the moment they paid for any of it.
    this.spawnDamageNumber(
      new THREE.Vector3(
        this.playerRoot.position.x,
        this.map.height(this.playerRoot.position.x, this.playerRoot.position.z) + 1.5,
        this.playerRoot.position.z,
      ),
      perInterval,
      'drain',
      t('hud.maxHealthLost', { amount: perInterval }),
    )
    this.logSession({ kind: 'mutation-effect', id: 'neutral-starving-metabolism', effect: 'metabolic-decay' })
  }

  private async chooseEvolution(
    index: number,
    // 'none' is the valley: its evolution is earned on the road and hands the
    // player straight back to it. The Gloamwood's two callers lead into an
    // encounter because that map's evolution sits between two fights.
    nextEncounter: 'guardian' | 'boss' | 'none' = this.map.hasNest ? 'guardian' : 'none',
  ) {
    const candidate = this.evolutionState.candidates[index]
    if (!candidate || this.evolutionState.phase !== 'choosing') return
    this.evolutionState = selectGloamwoodEvolutionCandidate(this.evolutionState, candidate.id)
    this.requestNextFrame(true)
    this.playSound('evolution-select')
    if (this.evolutionOverlay) {
      this.evolutionOverlay.dataset.busy = 'true'
      for (const button of this.evolutionOverlay.querySelectorAll<HTMLButtonElement>('button')) button.disabled = true
    }
    // Compounded, not replaced. A second evolution that overwrote the first
    // would hand the player a new body and quietly take back what the last one
    // gave them, which reads as the upgrade having made them weaker.
    const held = this.evolutionModifiers
    // Growth fills what this route left alone - attack for the line that took
    // armour, armour for the line that took teeth - so it never just widens the
    // gap a route was already winning, and never refunds a trade it made.
    const growth = gloamwoodEvolutionGrowthFor(candidate.modifiers)
    this.evolutionModifiers = {
      damageMultiplier: held.damageMultiplier * candidate.modifiers.damageMultiplier * growth.damageMultiplier,
      moveSpeedMultiplier: held.moveSpeedMultiplier * candidate.modifiers.moveSpeedMultiplier,
      damageReduction: 1 - (1 - held.damageReduction) * (1 - candidate.modifiers.damageReduction),
      biomassMultiplier: held.biomassMultiplier * candidate.modifiers.biomassMultiplier,
      killHeal: held.killHeal + candidate.modifiers.killHeal,
      maximumHealthBonus: held.maximumHealthBonus
        + candidate.modifiers.maximumHealthBonus
        + growth.maximumHealthBonus,
      flatArmour: held.flatArmour + growth.flatArmour,
    }
    this.evolutionsTaken += 1
    this.applyProgressionModifiers()
    // A new body arrives whole. Twice a run, earned with biomass, and the
    // moment it lands is the one the run is named after - finishing an
    // evolution on eleven health is the opposite of what it is for.
    this.playerCombat = { ...this.playerCombat, health: this.playerCombat.maxHealth }
    this.attackState = createFormalHuntBasicAttackState()
    this.attackUntil = 0
    this.characterRoot.position.set(0, 0, 0)
    this.characterRoot.rotation.set(0, 0, 0)
    this.characterRoot.scale.setScalar(1)
    // The stage this evolution reaches, and the body the route actually has for
    // it: stage 2 exists only for the Fang line, and a route with no body of its
    // own keeps the one it has rather than borrowing another family's animal.
    const stage = Math.min(2, this.evolutionsTaken)
    await this.loadCharacter(quality3DBodyStageForFamily(stage, candidate.family), candidate.family)
    // The accent is a placeholder for a route with no body of its own: it marks
    // an evolution the model cannot show. A family that loaded its own form
    // already wears its identity, and bolting primitives onto it would be the
    // floating decoration the creature standard forbids.
    if (!this.characterFamilyMatched) this.createEvolutionAccent(candidate.family)
    this.combatMessage = t('hud.msg.evolved', { name: candidate.name, stats: candidate.statLine })
    if (this.evolutionOverlay) {
      this.evolutionOverlay.hidden = true
      this.evolutionOverlay.dataset.busy = 'false'
    }
    if (nextEncounter === 'boss') this.startBossEncounter()
    else if (nextEncounter === 'guardian') this.startGuardianEncounter()
    else this.runPhase = 'hunt'
    this.renderer.domElement.focus()
  }

  private startGuardianEncounter() {
    this.runPhase = 'guardian'
    // The guardian is the step before the boss, so this is where the Warden's
    // body starts downloading: out of the opening scene, which is the whole
    // point of Goal 15E, but with a whole guardian fight of head start. If it
    // has not finished by the time the arena opens, the boss simply wears its
    // primitive assembly until it does, exactly as it did before this model
    // existed.
    this.ensureThornheartWardenBody()
    const guardianState = awakenGloamwoodNestGuardian(this.nestState)
    this.nestState = {
      ...guardianState,
      prey: guardianState.prey.map((prey) => ({ ...prey, x: GLOAMWOOD_BOSS_ARENA.x, z: GLOAMWOOD_BOSS_ARENA.z })),
    }
    this.bossLocked = false
    this.lockedPreyId = GLOAMWOOD_NEST_GUARDIAN.id
    this.nestRoot.visible = false
    this.playerRoot.position.set(
      GLOAMWOOD_BOSS_ARENA.playerX,
      this.map.height(GLOAMWOOD_BOSS_ARENA.playerX, GLOAMWOOD_BOSS_ARENA.playerZ),
      GLOAMWOOD_BOSS_ARENA.playerZ,
    )
    this.resolveObstacles(this.playerRoot.position)
    this.playerCombat = {
      ...this.playerCombat,
      health: Math.min(this.playerCombat.maxHealth, this.playerCombat.health + Math.round(this.playerCombat.maxHealth * 0.36)),
      invulnerabilitySeconds: 0.9,
    }
    this.target.copy(this.playerRoot.position)
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.56)
    this.playSound('elite-intro')
    this.combatMessage = t('hud.msg.guardianRises', { name: t('creature.guardian') })
    this.syncPreyVisuals()
  }

  private startBossEncounter() {
    this.runPhase = 'boss'
    this.ensureThornheartWardenBody()
    this.bossState = startGloamwoodBoss(createGloamwoodBossState(GLOAMWOOD_BOSS_ARENA.x, GLOAMWOOD_BOSS_ARENA.z))
    this.bossLocked = true
    this.lockedPreyId = null
    this.nestRoot.visible = false
    this.playerRoot.position.set(
      GLOAMWOOD_BOSS_ARENA.playerX,
      this.map.height(GLOAMWOOD_BOSS_ARENA.playerX, GLOAMWOOD_BOSS_ARENA.playerZ),
      GLOAMWOOD_BOSS_ARENA.playerZ,
    )
    this.resolveObstacles(this.playerRoot.position)
    this.target.copy(this.playerRoot.position)
    this.playerCombat = { ...this.playerCombat, health: this.playerCombat.maxHealth, invulnerabilitySeconds: 1.1 }
    this.attackState = createFormalHuntBasicAttackState()
    this.syncBossVisual()
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.72)
    this.playSound('boss-intro')
    this.combatMessage = t('hud.msg.bossRises', { name: t('creature.boss') })
  }

  private completeRunVictory() {
    if (this.runPhase === 'victory') return
    this.runPhase = 'victory'
    this.bossLocked = false
    this.primaryHeld = false
    this.keys.clear()
    this.touchMoveX = 0
    this.touchMoveZ = 0
    this.movement.set(0, 0, 0)
    this.target.copy(this.playerRoot.position)
    this.moving = false
    this.turning = false
    this.attackState = createFormalHuntBasicAttackState()
    this.cameraTrauma = 1
    this.playSound('victory')
    this.showRunResult(true, t('result.bossDown'))
  }

  /**
   * Spend a life on this death. Returns true when the run is over.
   *
   * Every death routes through here - hunt, guardian and boss alike - so the
   * budget cannot be bypassed by whichever encounter happened to kill you. The
   * Moult mutation is not handled here: it revives inside takePlayerDamage
   * before the player is ever counted as dead, which makes it a death that
   * costs no life rather than a fourth one.
   */
  private spendLifeOrEndRun(reason: string) {
    this.logSession({ kind: 'death', who: 'player', livesLeft: Math.max(0, this.livesRemaining - 1) })
    this.livesRemaining -= 1
    if (this.livesRemaining <= 0) {
      this.completeRunDefeat(reason)
      return true
    }
    this.playSound('player-death')
    this.combatMessage = t('hud.msg.livesLeft', { count: this.livesRemaining })
    // Asked for rather than assumed. Dying used to put the player back on their
    // feet somewhere else with a line of HUD text, which is easy to miss in the
    // middle of a fight - so a life could be spent without the player ever
    // registering that one had been.
    this.showDeathPrompt()
    return false
  }

  /**
   * The pause between dying and coming back.
   *
   * It stops the world, which is the point: the player has just lost something
   * and the game should wait for them to say they are ready rather than drop
   * them back into the same fight mid-swing.
   */
  private showDeathPrompt() {
    this.paused = true
    this.keys.clear()
    this.primaryHeld = false
    if (!this.deathOverlay) {
      const overlay = document.createElement('section')
      overlay.className = 'gloamwood-death-prompt'
      overlay.setAttribute('role', 'dialog')
      overlay.setAttribute('aria-modal', 'true')
      this.deathOverlay = overlay
      this.container.append(overlay)
    }
    const region = this.map.hasNest ? '' : t('death.where', { region: this.currentRegionName() })
    this.deathOverlay.innerHTML = [
      '<div>',
      `<h2>${escapeGloamwoodHtml(t('death.title'))}</h2>`,
      `<p>${escapeGloamwoodHtml(t('death.livesLeft', { count: this.livesRemaining }))}</p>`,
      region ? `<small>${escapeGloamwoodHtml(region)}</small>` : '',
      '<menu>',
      `<button type="button" data-g3d-revive>${escapeGloamwoodHtml(t('death.revive'))}</button>`,
      `<button type="button" data-g3d-restart>${escapeGloamwoodHtml(t('death.restart'))}</button>`,
      '</menu>',
      '</div>',
    ].join('')
    this.deathOverlay.hidden = false
    this.deathOverlay.querySelector<HTMLButtonElement>('[data-g3d-revive]')?.addEventListener('click', () => {
      this.dismissDeathPrompt()
    }, { once: true })
    this.deathOverlay.querySelector<HTMLButtonElement>('[data-g3d-restart]')?.addEventListener('click', () => {
      window.location.reload()
    }, { once: true })
    this.deathOverlay.querySelector<HTMLButtonElement>('[data-g3d-revive]')?.focus()
  }

  private dismissDeathPrompt() {
    if (this.deathOverlay) this.deathOverlay.hidden = true
    this.paused = false
    this.snapCameraNextFrame = true
    this.renderer.domElement.focus()
    // The performance pass deliberately stops rAF while a death dialog is
    // open. A revive returns the simulation to the respawn countdown, so it
    // must explicitly restart that loop just like Settings and evolution do.
    this.requestNextFrame(true)
  }

  /** Name of the region the player is standing in, for the death prompt. */
  private currentRegionName() {
    const corridor = gloamwoodValleyCorridorAt(this.playerRoot.position.x, this.playerRoot.position.z)
    const region = gloamwoodValleyRegionAt(corridor.s)
    return region ? t(`valley.region.${region.id}`) : t('valley.region.shallows')
  }

  private completeRunDefeat(reason: string) {
    if (this.runPhase === 'defeat') return
    this.runPhase = 'defeat'
    this.runDeaths += 1
    this.bossLocked = false
    this.primaryHeld = false
    this.keys.clear()
    this.attackState = createFormalHuntBasicAttackState()
    this.playSound('defeat')
    this.showRunResult(false, reason)
  }

  /**
   * Folds the run that just ended into the record kept on this device.
   *
   * Called from the result screen because that is the only place a run is
   * finished: reviving continues the same run, so the record counts runs rather
   * than deaths.
   */
  private recordFinishedRun() {
    const regions = this.map.hasNest ? [] : GLOAMWOOD_VALLEY.regions
    const standing = gloamwoodValleyRegionAt(
      gloamwoodValleyCorridorAt(this.playerRoot.position.x, this.playerRoot.position.z).s,
    )
    const merged = recordGloamwoodRun(loadGloamwoodRunRecord(window.localStorage), {
      regionIndex: regions.findIndex((region) => region.id === standing?.id),
      biomass: this.nestState.biomass,
      kills: this.nestState.kills,
      bossesFelled: this.nestState.prey
        .filter((prey) => (prey as GloamwoodValleyCreature).tier === 'boss' && prey.phase === 'dead')
        .map((prey) => prey.id),
      familiesHunted: [...new Set(this.nestState.recentHunts)],
    })
    saveGloamwoodRunRecord(window.localStorage, merged.record)
    return merged
  }

  /**
   * What this run leaves behind for the achievement layer.
   *
   * Read off the same values the result screen is about to print, so the two
   * can never disagree - an achievement that fires on a number the player is
   * not being shown is a bug report nobody can reproduce.
   */
  private runSummary(victory: boolean): GloamwoodRunSummary {
    const defence = (this.map as { defenceRun?: () => GloamwoodDefenceState }).defenceRun?.()
    return {
      map: this.map.id === 'defence' ? 'defence' : this.map.hasNest ? 'gloamwood' : 'valley',
      victory,
      seconds: Math.round(this.runElapsedSeconds()),
      kills: this.nestState.kills,
      biomass: this.nestState.biomass,
      mutations: this.mutationState.taken.length,
      evolutions: this.evolutionsTaken,
      livesLost: Math.max(0, this.map.lives - this.livesRemaining),
      wave: defence?.wave ?? 0,
      altarRemaining: defence?.altarHealth ?? 0,
      altarMax: defence?.altarMaxHealth ?? 0,
    }
  }

  private showRunResult(victory: boolean, reason: string) {
    // Folded before the overlay is built, so the panel can show what this run
    // just earned rather than making the player go and look.
    const outcome = applyGloamwoodRun(this.runSummary(victory), readGloamwoodAchievements())
    writeGloamwoodAchievements(outcome.progress)
    this.earnedThisRun = outcome.earned
    if (!this.resultOverlay) {
      const overlay = document.createElement('section')
      overlay.className = 'gloamwood-run-result'
      overlay.setAttribute('role', 'dialog')
      overlay.setAttribute('aria-modal', 'true')
      this.resultOverlay = overlay
      this.container.append(overlay)
    }
    const elapsedSeconds = Math.round(this.runElapsedSeconds())
    const selected = this.evolutionState.selected
    const params = new URLSearchParams(window.location.search)
    const debugSkip = params.get('evolutionGate') === '1' || params.get('bossGate') === '1'
    const pace = classifyGloamwoodRunPace(elapsedSeconds, debugSkip)
    const valleyBuild = this.map.hasNest || this.map.id === 'defence' ? '' : [
      '<section class="g3d-result-story">',
      `<strong>${escapeGloamwoodHtml(t('result.valleyBuild'))}</strong>`,
      `<div><b>${escapeGloamwoodHtml(t('result.valleyGenes'))}</b><span>${escapeGloamwoodHtml([
        `${t('gene.fang')} ${this.nestState.genes.fang}`,
        `${t('gene.shell')} ${this.nestState.genes.shell}`,
        `${t('gene.swarm')} ${this.nestState.genes.swarm}`,
      ].join(' · '))}</span></div>`,
      `<small>${escapeGloamwoodHtml(t('result.valleyGeneReason'))}</small>`,
      `<div><b>${escapeGloamwoodHtml(t('result.valleyMutations'))}</b><span>${escapeGloamwoodHtml(
        this.mutationState.taken.length
          ? this.mutationState.taken.map((id) => t(`mutation.${id}.name` as 'mutation.fang-thin-hide.name')).join(' · ')
          : '—',
      )}</span></div>`,
      '</section>',
    ].join('')
    this.resultOverlay.innerHTML = [
      '<div class="g3d-result-panel">',
      `<span>${victory ? t('result.victory') : t('result.defeat')}</span>`,
      // The lead names what beat you. On the valley it named the Gloamwood's
      // warden, a creature on the other map - and with a third map the same
      // two-way split sent the altar defence's endings out under the valley's
      // river copy, which is the same defect one map further on.
      `<h1>${t(
        this.map.id === 'defence'
          ? (victory ? 'result.defenceVictoryLead' : 'result.defenceDefeatLead')
          : this.map.hasNest
            ? (victory ? 'result.victoryLead' : 'result.defeatLead')
            : (victory ? 'result.valleyVictoryLead' : 'result.valleyDefeatLead'),
      )}</h1>`,
      `<p>${reason}</p>`,
      ...(gloamwoodRunPaceVisible(window.location.search)
        ? [`<aside data-pace="${pace.pace}"><strong>${pace.label}</strong><span>${pace.detail}</span></aside>`]
        : []),
      ...(gloamwoodRunPerformanceVisible(window.location.search)
        ? [(() => {
          const run = this.runPerformance.report()
          const share = (value: number) => `${(value * 100).toFixed(1)}%`
          return `<aside data-perf="${run.belowThirtyShare > 0.05 ? 'poor' : 'ok'}">`
            + `<strong>${escapeGloamwoodHtml(t('result.perf'))}</strong>`
            + `<span>${escapeGloamwoodHtml(t('result.perfDetail', {
              fps: run.meanFps.toFixed(1),
              below: share(run.belowThirtyShare),
              worst: run.worstFrameMs.toFixed(0),
              frames: run.frames,
            }) + (run.stalls > 0 ? t('result.perfStalls', { stalls: run.stalls }) : ''))}</span>`
            + '</aside>'
        })()]
        : []),
      ...(this.earnedThisRun.length > 0
        ? [`<aside data-earned="true"><strong>${escapeGloamwoodHtml(t('result.achievements'))}</strong>`
          + this.earnedThisRun
            .map((id) => `<span>${escapeGloamwoodHtml(t(`achievement.${id}.name` as 'achievement.altar-held.name'))}</span>`)
            .join('')
          + '</aside>']
        : []),
      '<dl>',
      `<div><dt>${t('result.time')}</dt><dd>${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}</dd></div>`,
      `<div><dt>${t('result.prey')}</dt><dd>${this.nestState.kills}</dd></div>`,
      `<div><dt>${t('result.evolution')}</dt><dd>${selected?.name ?? t('result.noEvolution')}</dd></div>`,
      // The bill has to be about the run that happened. On the valley the boss
      // row reported the Gloamwood warden - 420/420, every time, for a creature
      // the player never met - while the things they actually earned went
      // unmentioned: how far up the road they got, what the biomass bought,
      // how much of the milestone track they opened.
      ...(this.map.id === 'defence'
        ? (() => {
          const run = (this.map as { defenceRun?: () => GloamwoodDefenceState }).defenceRun?.()
          // What this run was actually about: how far into the twelve you got,
          // and what was left of the thing you were holding.
          return [
            `<div><dt>${t('result.defenceWave')}</dt><dd>${run?.wave ?? 0}/${GLOAMWOOD_DEFENCE_RUN.waves}</dd></div>`,
            `<div><dt>${t('result.defenceAltar')}</dt><dd>${run?.altarHealth ?? 0}/${run?.altarMaxHealth ?? 0}</dd></div>`,
            `<div><dt>${t('hud.biomass')}</dt><dd>${this.nestState.biomass}</dd></div>`,
          ]
        })()
        : this.map.hasNest
        ? [`<div><dt>Boss</dt><dd>${this.bossState.health}/${this.bossState.maxHealth}</dd></div>`]
        : [
          `<div><dt>${t('result.reached')}</dt><dd>${escapeGloamwoodHtml(this.currentRegionName())}</dd></div>`,
          `<div><dt>${t('hud.biomass')}</dt><dd>${this.nestState.biomass}</dd></div>`,
          `<div><dt>${t('hud.mutationTrack')}</dt><dd>${GLOAMWOOD_VALLEY_MILESTONES.filter((milestone) => this.mutationState.reached.includes(milestone.id)).length}/${GLOAMWOOD_VALLEY_MILESTONES.length}</dd></div>`,
        ]),
      '</dl>',
      valleyBuild,
      // What the run left behind. Checked against the deployed build, storage
      // held nothing at all - a player who died had no reason to open the page
      // again, which is the first thing a public listing needs.
      // Regions and valley boss slots, neither of which this mode has. It keeps
      // its own progress in the rows above.
      ...(this.map.hasNest || this.map.id === 'defence' ? [] : (() => {
        const { record, gains } = this.recordFinishedRun()
        const deepest = GLOAMWOOD_VALLEY.regions[record.deepestRegion]
        return [
          '<section class="g3d-result-record">',
          `<span>${t('result.recordTitle', { runs: record.runs })}</span>`,
          '<dl>',
          ...(deepest ? [`<div${gains.deeper ? ' data-new="true"' : ''}><dt>${t('result.bestReached')}</dt><dd>${escapeGloamwoodHtml(t(`valley.region.${deepest.id}` as never))}</dd></div>`] : []),
          `<div${gains.biomass ? ' data-new="true"' : ''}><dt>${t('result.bestBiomass')}</dt><dd>${record.bestBiomass}</dd></div>`,
          `<div${gains.kills ? ' data-new="true"' : ''}><dt>${t('result.bestKills')}</dt><dd>${record.bestKills}</dd></div>`,
          `<div><dt>${t('result.bossesFelled')}</dt><dd>${record.bossesFelled.length}/${GLOAMWOOD_VALLEY.bossSlots.length}</dd></div>`,
          '</dl>',
          gloamwoodRunEarnedSomething(gains)
            ? `<strong>${t('result.newGround')}</strong>`
            : `<small>${t('result.noNewGround')}</small>`,
          '</section>',
        ]
      })()),
      `<button data-run-restart>${t('result.restart')}</button>`,
      '</div>',
    ].join('')
    this.resultOverlay.hidden = false
    this.resultOverlay.querySelector<HTMLButtonElement>('[data-run-restart]')?.addEventListener('click', () => window.location.reload())
    this.resultOverlay.querySelector<HTMLButtonElement>('[data-run-restart]')?.focus()
  }

  private createEvolutionAccent(family: GloamwoodPreyKind) {
    if (this.evolutionAccent) this.characterRoot.remove(this.evolutionAccent)
    const root = new THREE.Group()
    root.name = `EvolutionAccent-${family}`
    if (family === 'fang') {
      const material = new THREE.MeshStandardMaterial({ color: 0x9f2f28, roughness: 0.58, metalness: 0 })
      for (const side of [-1, 1]) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.72, 6), material)
        blade.position.set(0.18, 1.2, side * 0.58)
        blade.rotation.z = -0.72
        blade.rotation.x = side * 0.18
        blade.castShadow = true
        root.add(blade)
      }
    } else if (family === 'shell') {
      const material = new THREE.MeshStandardMaterial({ color: 0x526f59, roughness: 0.86, metalness: 0 })
      for (let index = 0; index < 4; index += 1) {
        const plate = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34 - index * 0.035, 0), material)
        plate.scale.set(1.3, 0.42, 1)
        plate.position.set(-0.12 - index * 0.34, 1.48 - index * 0.05, 0)
        plate.castShadow = true
        root.add(plate)
      }
    } else {
      const material = new THREE.MeshStandardMaterial({ color: 0x68d8b4, emissive: 0x153c32, emissiveIntensity: 0.55, roughness: 0.48 })
      for (let index = 0; index < 3; index += 1) {
        const symbiote = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), material)
        const angle = index / 3 * Math.PI * 2
        symbiote.position.set(-0.15 + Math.cos(angle) * 0.78, 1.15 + index * 0.2, Math.sin(angle) * 0.78)
        symbiote.castShadow = true
        root.add(symbiote)
      }
    }
    this.evolutionAccent = root
    this.characterRoot.add(root)
  }

  private createHud() {
    const hud = document.createElement('section')
    hud.className = 'gloamwood-3d-hud'
    // Two panels, not one block.
    //
    // Everything lived in a single box in the top-left and it covered a real
    // part of the view. Split by what the player is doing with it: the left
    // panel is what they react to - what is happening and how much health they
    // have - and the right is how the run is going, which is read between
    // fights. The right one sits in the corner nothing else uses.
    hud.innerHTML = [
      '<div class="g3d-hud-left">',
      `<header><span data-g3d-nest-title>${t('hud.nestTitle')}</span><strong data-g3d-message>${t('hud.initialMsg')}</strong></header>`,
      '<div class="g3d-combat-bars">',
      `<label>${t('hud.health')} <b data-g3d-player-health>100 / 100</b><i><em data-g3d-player-bar></em><s data-g3d-player-scar aria-hidden="true"></s></i></label>`,
      '</div>',
      // The status line belongs with the message: both answer "what is
      // happening right now", and the nest's wave count is only useful while
      // the player is inside it.
      `<b class="g3d-status-line" data-g3d-remaining>${t('hud.undisturbed')}</b>`,
      '</div>',
      '<div class="g3d-hud-right">',
      '<div class="g3d-hud-run">',
      `<div class="g3d-nest-resources"><span>${t('hud.lives')} <strong data-g3d-lives>${this.map.lives}</strong></span><span>${t('hud.biomass')} <strong data-g3d-biomass>0</strong></span><span data-g3d-mutation-progress-cell hidden>${t('hud.mutationTrack')} <strong data-g3d-mutation-progress>0/0</strong></span><span data-g3d-gene-cell>${t('hud.fang')} <strong data-g3d-fang>0</strong></span><span data-g3d-gene-cell>${t('hud.shell')} <strong data-g3d-shell>0</strong></span><span data-g3d-gene-cell>${t('hud.swarm')} <strong data-g3d-swarm>0</strong></span></div>`,
      // Mutations stack rather than replace, and a build the player cannot see
      // is a build they cannot plan around. Hidden until the first one is taken.
      '<div class="g3d-mutation-list" data-g3d-mutations hidden></div>',
      '<div class="g3d-hud-actions">',
      `<button class="g3d-hud-details-toggle" type="button" data-g3d-hud-details aria-expanded="false">${t('hud.expand')}</button>`,
      `<button class="g3d-fullscreen-toggle" type="button" data-g3d-fullscreen>${t('fs.enter')}</button>`,
      `<button class="g3d-settings-toggle" type="button" data-g3d-settings-toggle>${t('hud.settings')}</button>`,
      '</div>',
      '</div>',
      '<div class="g3d-hud-radar-slot" data-g3d-radar-slot></div>',
      '</div>',
    ].join('')
    this.hud = hud
    hud.dataset.mobileExpanded = 'false'
    this.container.append(hud)
    const bossPlate = document.createElement('section')
    bossPlate.className = 'g3d-boss-plate'
    bossPlate.hidden = true
    bossPlate.setAttribute('aria-live', 'polite')
    bossPlate.innerHTML = [
      '<span data-g3d-boss-badge></span>',
      '<div><small data-g3d-boss-eyebrow></small><strong data-g3d-boss-name></strong></div>',
      '<b data-g3d-boss-phase></b>',
      '<i><em data-g3d-boss-fill></em></i>',
    ].join('')
    this.bossPlate = bossPlate
    this.container.append(bossPlate)

    // The altar's own bar, and it needs to be a bar. The mode is lost by one
    // number and until now that number lived only as a figure on the status
    // line, which the owner did not see at all. A run is lost by something
    // happening behind the player while they look up the road, so the thing
    // being lost has to be readable without being read.
    if (this.map.id === 'defence') {
      const altarPlate = document.createElement('section')
      altarPlate.className = 'g3d-altar-plate'
      altarPlate.setAttribute('aria-live', 'polite')
      altarPlate.innerHTML = [
        '<span>\u25C7</span>',
        '<div><small data-g3d-altar-eyebrow></small><strong data-g3d-altar-value></strong></div>',
        '<i><em data-g3d-altar-fill></em></i>',
      ].join('')
      this.altarPlate = altarPlate
      this.container.append(altarPlate)
    }
    this.fullscreenToggle = hud.querySelector<HTMLButtonElement>('[data-g3d-fullscreen]') ?? undefined
    // Already launched from a home-screen icon: there is no browser chrome to hide.
    if (this.fullscreenToggle && gloamwoodStandaloneDisplay()) this.fullscreenToggle.hidden = true
    this.fullscreenToggle?.addEventListener('click', () => {
      this.audio.unlock()
      if (document.fullscreenEnabled) void this.toggleFullscreenPresentation()
      else this.toggleHomeScreenTip()
    })
    document.addEventListener('fullscreenchange', this.fullscreenChanged)
    this.createHomeScreenTip()
    this.createDamageLayer()
    this.updateFullscreenToggle()
    const onboarding = document.createElement('aside')
    onboarding.className = 'gloamwood-onboarding'
    onboarding.dataset.tone = 'guide'
    onboarding.setAttribute('aria-live', 'polite')
    onboarding.innerHTML = [
      `<header><span data-g3d-guide-eyebrow>${t('guide.eyebrow', { step: 1, total: 7 })}</span><b data-g3d-guide-progress>${t('guide.move.progress')}</b></header>`,
      `<strong data-g3d-guide-title>${t('guide.move.title')}</strong>`,
      `<p data-g3d-guide-instruction>${t('guide.move.instruction', { move: 'W/A/S/D' })}</p>`,
      `<small data-g3d-guide-reason>${t('guide.move.reason')}</small>`,
      '<i aria-hidden="true"><em data-g3d-guide-bar></em></i>',
    ].join('')
    this.onboardingHud = onboarding
    this.container.append(onboarding)
    this.createOrientationGate()
    this.createSettingsPanel()
    this.createTouchControls()
    if (import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1') {
      this.debugOutput = document.createElement('output')
      this.debugOutput.id = 'debug-state'
      this.debugOutput.hidden = true
      // A visible one-line readout beside it. The hidden JSON needs a console
      // to read, and the fastest way to tell a stopped loop from unheard input
      // is to look at the screen while pressing a key.
      const live = document.createElement('div')
      live.id = 'debug-live'
      live.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:9999;font:12px ui-monospace,monospace;color:#cfe;background:rgba(0,0,0,.62);padding:4px 8px;border-radius:4px;pointer-events:none'
      document.body.append(live)
      this.debugLive = live
      document.body.append(this.debugOutput)
      const api = {
        getState: () => this.getDebugState(),
        setMoveTarget: (x: number, z: number) => {
          const held = this.map.confine(x, z)
          this.target.set(held.x, 0, held.z)
        },
        toggleTargetLock: () => this.toggleEnemyLock(),
        // Spends a life on demand. The death prompt and the respawn cut are
        // both things that only happen when the player dies, and waiting to be
        // killed is a poor way to check them.
        killPlayer: () => {
          this.playerCombat = { ...this.playerCombat, health: 0, alive: false }
          if (!this.spendLifeOrEndRun('debug')) this.resetLivePreyToNest()
        },
        attack: () => this.requestPrimaryAttack(),
        chooseEvolution: (index: number) => this.chooseEvolution(index),
        refreshEvolution: () => this.refreshEvolution(),
        toggleSettings: (open: boolean) => this.toggleSettings(open),
        // Separates self-shadow acne from real geometry gaps on plated bodies.
        setCharacterShadowCasting: (enabled: boolean) => {
          this.character?.traverse((node) => { node.castShadow = enabled })
        },
        openEvolutionGate: () => this.openEvolutionGateForDebug(),
        startBoss: () => {
          if (this.evolutionState.phase !== 'selected') this.openEvolutionGateForDebug()
          if (this.evolutionState.phase === 'choosing') void this.chooseEvolution(0)
          else this.startBossEncounter()
        },
        // Puts the player in front of a region boss. Reaching the third one on
        // foot is twelve hundred units of road, and every check of a pattern
        // would begin with that walk.
        standAtBoss: (index = 0) => this.standAtValleyBoss(index),
        damageBoss: (damage: number) => {
          if (!this.bossActive()) return
          const result = damageGloamwoodBoss(this.bossState, damage)
          this.bossState = result.state
          if (result.defeated) this.completeRunVictory()
        },
        damageGuardian: (damage: number) => {
          if (this.runPhase !== 'guardian') return
          const guardian = this.nestState.prey.find((prey) => prey.id === GLOAMWOOD_NEST_GUARDIAN.id)
          if (!guardian || guardian.phase === 'dead') return
          this.nestState = damageGloamwoodNestPrey(
            this.nestState,
            guardian.id,
            damage,
            'TailSwipe',
            { x: guardian.x - 2, z: guardian.z },
            0,
          ).state
        },
        // Mutation offers are earned by biomass inside the frame loop, so
        // reaching one normally means playing a third of a run. This opens the
        // next one directly, for checking the panel and for trying a build
        // without farming up to it.
        offerMutation: () => {
          if (this.mutationState.offering) return this.mutationState.candidates.map((candidate) => candidate.id)
          this.mutationState = openGloamwoodMutationOffer(this.mutationState, this.nestState.genes)
          if (!this.mutationState.offering) return []
          this.showMutationOverlay()
          return this.mutationState.candidates.map((candidate) => candidate.id)
        },
        mutationsHeld: () => [...this.mutationState.taken],
        // What actually happened, and what looks wrong about it. Paste the
        // report into the conversation instead of describing the symptom.
        // Altar defence review. Both of this mode's endings are minutes from the
        // start, so playing to them is not a way to check they fire.
        defenceDamageAltar: (damage: number) => {
          const map = this.map as { defenceDamageAltar?: (damage: number) => number }
          return map.defenceDamageAltar?.(damage) ?? null
        },
        /**
         * Empty the field, so a wave clears and the run can be driven to its
         * end. Goes through the same death the player's own kills produce -
         * a hook that set the phase directly would not be exercising the path
         * that decides whether a wave is over.
         */
        defenceClearField: () => {
          let cleared = 0
          this.nestState = {
            ...this.nestState,
            prey: this.nestState.prey.map((prey) => {
              if (prey.phase === 'dead') return prey
              cleared += 1
              return { ...prey, health: 0, phase: 'dead' as const, phaseElapsed: 0 }
            }),
          }
          this.syncPreyVisuals()
          return cleared
        },
        defenceSkipToWave: (wave: number) => {
          const map = this.map as { defenceSkipToWave?: (wave: number) => number }
          const skipped = map.defenceSkipToWave?.(wave) ?? null
          // A skip does not fire `wave-started`, and checking a boss body by
          // skipping to its wave is exactly what this hook is for.
          this.ensureUpcomingDefenceBossBody()
          return skipped
        },
        sessionReport: () => summariseGloamwoodSession(this.sessionLog.all(), GLOAMWOOD_ARENA_PLAYER_RADIUS),
        sessionDump: () => JSON.stringify(this.sessionLog.all()),
      }
      ;(window as Window & { __EA_DEBUG__?: typeof api }).__EA_DEBUG__ = api
    }
  }

  /** A geographic hint, not a second combat HUD: normal prey never appears. */
  /**
   * The altar defence minimap.
   *
   * A different job from the valley's radar, which is a local view that scrolls
   * with the player because that map is 1,590 units of folded road. This one
   * shows the *whole* map at a fixed scale and never moves, because the whole
   * question it answers is "what is on the road right now" - the owner's ask was
   * to be able to tell when a wave has started without walking up to look.
   *
   * Drawn from the terrain constants, so it cannot disagree with the ground.
   */
  private createDefenceRadar() {
    if (this.map.id !== 'defence') return
    const { bounds, arena, altar, portal, road } = GLOAMWOOD_DEFENCE
    // World to a 100x100 viewBox, preserving aspect: the map is twice as deep
    // as it is wide, so a square viewBox would squash the road.
    const span = Math.max(bounds.halfWidth, bounds.halfDepth) * 2
    const toView = (x: number, z: number) => ({
      x: 50 + (x / span) * 100,
      y: 50 + (z / span) * 100,
    })
    const arenaAt = toView(arena.x, arena.z)
    const altarAt = toView(altar.x, altar.z)
    const portalAt = toView(portal.x, portal.z)
    const roadTop = toView(-road.halfWidth, portal.z)
    const roadBottom = toView(-road.mouthHalfWidth, road.endZ)
    const roadRightTop = toView(road.halfWidth, portal.z)
    const roadRightBottom = toView(road.mouthHalfWidth, road.endZ)

    const radar = document.createElement('aside')
    radar.className = 'g3d-defence-radar'
    radar.setAttribute('aria-label', t('radar.defenceLabel'))
    radar.innerHTML = [
      '<svg viewBox="0 0 100 100" aria-hidden="true">',
      `<path class="g3d-dradar-road" d="M${roadTop.x} ${roadTop.y} L${roadRightTop.x} ${roadRightTop.y} L${roadRightBottom.x} ${roadRightBottom.y} L${roadBottom.x} ${roadBottom.y} Z"/>`,
      `<circle class="g3d-dradar-bowl" cx="${arenaAt.x}" cy="${arenaAt.y}" r="${(arena.radius / span) * 100}"/>`,
      `<circle class="g3d-dradar-portal" data-g3d-dradar-portal cx="${portalAt.x}" cy="${portalAt.y}" r="3.4"/>`,
      `<rect class="g3d-dradar-altar" data-g3d-dradar-altar x="${altarAt.x - 3}" y="${altarAt.y - 2.2}" width="6" height="4.4" rx="1.2"/>`,
      '<g data-g3d-dradar-prey></g>',
      '<circle class="g3d-dradar-player" data-g3d-dradar-player r="2.6"/>',
      '</svg>',
      '<small data-g3d-dradar-label></small>',
    ].join('')
    const slot = this.hud?.querySelector<HTMLElement>('[data-g3d-radar-slot]')
    ;(slot ?? this.container).append(radar)
    this.defenceRadar = {
      root: radar,
      player: radar.querySelector('[data-g3d-dradar-player]')!,
      altar: radar.querySelector('[data-g3d-dradar-altar]')!,
      portal: radar.querySelector('[data-g3d-dradar-portal]')!,
      prey: radar.querySelector('[data-g3d-dradar-prey]')!,
      label: radar.querySelector('[data-g3d-dradar-label]')!,
      toView,
    }
  }

  private updateAltarPlate() {
    const plate = this.altarPlate
    if (!plate) return
    const run = (this.map as { defenceRun?: () => GloamwoodDefenceState }).defenceRun?.()
    if (!run) return
    const fraction = run.altarMaxHealth > 0 ? run.altarHealth / run.altarMaxHealth : 0
    const fill = plate.querySelector<HTMLElement>('[data-g3d-altar-fill]')
    if (fill) fill.style.width = `${Math.max(0, Math.min(1, fraction)) * 100}%`
    // Three bands rather than a gradient: the player is reading this out of the
    // corner of an eye during a fight, and a colour change is what carries at
    // that glance.
    plate.setAttribute('data-health', fraction > 0.6 ? 'high' : fraction > 0.3 ? 'mid' : 'low')
    const eyebrow = plate.querySelector<HTMLElement>('[data-g3d-altar-eyebrow]')
    if (eyebrow) eyebrow.textContent = t('hud.altarEyebrow')
    const value = plate.querySelector<HTMLElement>('[data-g3d-altar-value]')
    if (value) value.textContent = `${run.altarHealth} / ${run.altarMaxHealth}`
  }

  private updateDefenceRadar() {
    const radar = this.defenceRadar
    if (!radar) return
    const run = (this.map as { defenceRun?: () => GloamwoodDefenceState }).defenceRun?.()
    if (!run) return

    const at = radar.toView(this.playerRoot.position.x, this.playerRoot.position.z)
    radar.player.setAttribute('cx', at.x.toFixed(2))
    radar.player.setAttribute('cy', at.y.toFixed(2))

    // Rebuilt rather than pooled: there are at most eleven of them and this
    // runs once a frame on a map whose whole budget is one instanced draw per
    // kit piece.
    const marks: string[] = []
    for (const prey of this.nestState.prey) {
      if (prey.phase === 'dead') continue
      const point = radar.toView(prey.x, prey.z)
      const boss = prey.tier === 'boss'
      marks.push(`<circle class="g3d-dradar-prey${boss ? ' is-boss' : ''}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${boss ? 2.8 : 1.5}"/>`)
    }
    radar.prey.innerHTML = marks.join('')

    const fraction = run.altarMaxHealth > 0 ? run.altarHealth / run.altarMaxHealth : 0
    radar.altar.setAttribute('data-health', fraction > 0.6 ? 'high' : fraction > 0.3 ? 'mid' : 'low')
    // The portal lights while a wave is stepping through, which is the cue the
    // owner asked for: knowing a wave has started without going to look.
    radar.portal.setAttribute('data-active', run.phase === 'spawning' ? 'true' : 'false')

    if (run.phase === 'intermission') {
      const remaining = Math.max(0, GLOAMWOOD_DEFENCE_RUN.intermissionSeconds - run.phaseElapsed)
      radar.label.textContent = t('radar.defenceNext', { seconds: Math.ceil(remaining) })
    } else if (run.phase === 'won' || run.phase === 'lost') {
      radar.label.textContent = t('radar.defenceOver')
    } else {
      radar.label.textContent = t('radar.defenceWave', { wave: run.wave, waves: GLOAMWOOD_DEFENCE_RUN.waves })
    }
  }

  private createValleyRadar() {
    if (this.map.id !== 'valley') return
    const radar = document.createElement('aside')
    radar.className = 'g3d-valley-radar'
    radar.setAttribute('aria-label', t('radar.label'))
    radar.innerHTML = [
      '<svg viewBox="0 0 100 100" aria-hidden="true">',
      '<defs><clipPath id="g3d-radar-local-clip"><circle cx="50" cy="50" r="43"/></clipPath></defs>',
      '<circle class="g3d-radar-range g3d-radar-range-far" cx="50" cy="50" r="40"/>',
      '<circle class="g3d-radar-range" cx="50" cy="50" r="25"/>',
      '<g clip-path="url(#g3d-radar-local-clip)">',
      '<path class="g3d-radar-region g3d-radar-region-shallows" data-g3d-radar-region/>',
      '<path class="g3d-radar-region g3d-radar-region-gorge" data-g3d-radar-region/>',
      '<path class="g3d-radar-region g3d-radar-region-headwater" data-g3d-radar-region/>',
      '<path class="g3d-radar-river" data-g3d-radar-river/>',
      ...Array.from({ length: 6 }, () => '<path class="g3d-radar-branch" data-g3d-radar-branch/>'),
      ...Array.from({ length: 6 }, () => '<circle class="g3d-radar-branch-node" data-g3d-radar-branch-node r="1.35"/>'),
      ...GLOAMWOOD_VALLEY.chokes.map(() => '<path class="g3d-radar-gate" data-g3d-radar-gate/>'),
      '<path class="g3d-radar-route" data-g3d-radar-route/>',
      '</g>',
      '<path class="g3d-radar-forward" d="M50 5 L53 10 L50 8.5 L47 10 Z"/>',
      '<circle class="g3d-radar-player" data-g3d-radar-player r="3.2"/>',
      '<path class="g3d-radar-arrow" data-g3d-radar-arrow d="M0 -5 L3.6 3 L0 1.6 L-3.6 3 Z"/>',
      '<circle class="g3d-radar-objective" data-g3d-radar-objective visibility="hidden" r="3.6"/>',
      '<rect class="g3d-radar-elite" data-g3d-radar-elite visibility="hidden" x="-2.7" y="-2.7" width="5.4" height="5.4" rx="1"/>',
      '</svg>',
      '<small data-g3d-radar-label></small>',
    ].join('')
    const slot = this.hud?.querySelector<HTMLElement>('[data-g3d-radar-slot]')
    ;(slot ?? this.container).append(radar)
    this.valleyRadar = {
      root: radar,
      player: radar.querySelector('[data-g3d-radar-player]')!,
      arrow: radar.querySelector('[data-g3d-radar-arrow]')!,
      objective: radar.querySelector('[data-g3d-radar-objective]')!,
      elite: radar.querySelector('[data-g3d-radar-elite]')!,
      label: radar.querySelector('[data-g3d-radar-label]')!,
      route: radar.querySelector('[data-g3d-radar-route]')!,
      river: radar.querySelector('[data-g3d-radar-river]')!,
      regions: Array.from(radar.querySelectorAll('[data-g3d-radar-region]')),
      branches: Array.from(radar.querySelectorAll('[data-g3d-radar-branch]')),
      branchNodes: Array.from(radar.querySelectorAll('[data-g3d-radar-branch-node]')),
      gates: Array.from(radar.querySelectorAll('[data-g3d-radar-gate]')),
      terrainX: Number.NaN,
      terrainZ: Number.NaN,
      nextTerrainUpdateAt: 0,
    }
  }

  private updateValleyRadar() {
    const radar = this.valleyRadar
    if (!radar) return
    const viewport: GloamwoodValleyRadarViewport = {
      x: this.playerRoot.position.x,
      z: this.playerRoot.position.z,
      // North-up radar: the geography stays stable while the player arrow
      // turns. It lets players build a spatial memory of the river and forks.
      facingRadians: GLOAMWOOD_VALLEY_RADAR_NORTH_UP,
    }
    this.updateValleyRadarTerrain(radar, viewport)
    radar.player.setAttribute('cx', '50'); radar.player.setAttribute('cy', '50')
    radar.arrow.setAttribute('transform', `translate(50 50) rotate(${(this.lastFacing * 180 / Math.PI).toFixed(1)})`)
    const corridor = gloamwoodValleyCorridorAt(this.playerRoot.position.x, this.playerRoot.position.z)
    const region = gloamwoodValleyRegionAt(corridor.s)
    const regionLabel = region ? t(`radar.region.${region.id}`) : t('radar.region.shallows')
    const ecologyLabel = t(this.ecology.labelKey)
    const label = `${regionLabel} · ${ecologyLabel}`
    if (radar.label.textContent !== label) radar.label.textContent = label
    let boss: GloamwoodValleyCreature | undefined
    for (const candidate of this.nestState.prey) {
      const creature = candidate as GloamwoodValleyCreature
      if (creature.tier !== 'boss' || creature.phase === 'dead' || creature.spawnS < corridor.s - 20) continue
      if (!boss || creature.spawnS < boss.spawnS) boss = creature
    }
    const gate = gloamwoodValleyNextGate(this.valleyProgression, corridor.s)
    const target = boss
      ? gloamwoodValleyRadarLocalMarker(boss.x, boss.z, viewport)
      : gate ? gloamwoodValleyRadarLocalMarkerAt(gate.s, viewport) : null
    radar.objective.setAttribute('visibility', target ? 'visible' : 'hidden')
    if (target) {
      radar.objective.setAttribute('cx', target.x.toFixed(2)); radar.objective.setAttribute('cy', target.y.toFixed(2))
      radar.objective.dataset.offscreen = target.offscreen ? 'true' : 'false'
    }
    const locked = this.lockedPrey() as GloamwoodValleyCreature | undefined
    const elite = locked?.tier === 'elite' && locked.phase !== 'dead' ? gloamwoodValleyRadarLocalMarker(locked.x, locked.z, viewport) : null
    radar.elite.setAttribute('visibility', elite ? 'visible' : 'hidden')
    if (elite) radar.elite.setAttribute('transform', `translate(${elite.x.toFixed(2)} ${elite.y.toFixed(2)})`)
  }

  private updateValleyRadarTerrain(radar: NonNullable<Gloamwood3DHunt['valleyRadar']>, viewport: GloamwoodValleyRadarViewport) {
    const now = performance.now()
    const firstLayout = !Number.isFinite(radar.terrainX)
    const moved = Math.hypot(viewport.x - radar.terrainX, viewport.z - radar.terrainZ) > 1.25
    if (now < radar.nextTerrainUpdateAt || (!firstLayout && !moved)) return
    radar.route.setAttribute('d', gloamwoodValleyRadarLocalRoutePath(viewport))
    radar.river.setAttribute('d', gloamwoodValleyRadarLocalRiverPath(viewport))
    const regionIds = ['shallows', 'gorge', 'headwater'] as const
    radar.regions.forEach((element, index) => element.setAttribute('d', gloamwoodValleyRadarLocalRegionPath(regionIds[index], viewport)))
    gloamwoodValleyRadarLocalBranchPaths(viewport).forEach((path, index) => radar.branches[index]?.setAttribute('d', path))
    gloamwoodValleyRadarLocalBranchEndpoints(viewport).forEach((point, index) => {
      const element = radar.branchNodes[index]
      element?.setAttribute('cx', point.x.toFixed(2)); element?.setAttribute('cy', point.y.toFixed(2))
    })
    GLOAMWOOD_VALLEY.chokes.forEach((s, index) => {
      const point = gloamwoodValleyRadarLocalPointAt(s, viewport)
      radar.gates[index]?.setAttribute('d', this.valleyRadarGatePath(point.x, point.y))
    })
    radar.terrainX = viewport.x
    radar.terrainZ = viewport.z
    radar.nextTerrainUpdateAt = now + 80
  }

  private valleyRadarGatePath(x: number, y: number) {
    return `M${(x - 2.1).toFixed(2)} ${(y - 2.1).toFixed(2)} L${(x + 2.1).toFixed(2)} ${(y + 2.1).toFixed(2)} M${(x + 2.1).toFixed(2)} ${(y - 2.1).toFixed(2)} L${(x - 2.1).toFixed(2)} ${(y + 2.1).toFixed(2)}`
  }

  /**
   * A reviewer-facing, debug-only form and mutation switchboard. It reloads the
   * same River Valley into an explicit state so every selection exercises the
   * normal model/effect startup path instead of a second test-only character.
   */
  private createMutationLab() {
    this.mutationLab?.remove()
    const panel = document.createElement('aside')
    panel.className = 'g3d-mutation-lab'
    panel.setAttribute('aria-label', 'Evolution test lab')
    const forms: Array<{ label: string; stage: number; family: Quality3DFormFamily }> = [
      { label: 'Origin', stage: 0, family: 'fang' },
      { label: 'Fang I', stage: 1, family: 'fang' },
      { label: 'Fang II', stage: 2, family: 'fang' },
      { label: 'Shell I', stage: 1, family: 'shell' },
      { label: 'Shell II', stage: 2, family: 'shell' },
      { label: 'Swarm I', stage: 1, family: 'swarm' },
      { label: 'Swarm II', stage: 2, family: 'swarm' },
    ]
    panel.innerHTML = [
      '<header><span>DEBUG</span><strong>Evolution Lab</strong><button type="button" data-mutation-lab-close aria-label="Close evolution lab">×</button></header>',
      '<p>Pick a body or one mutation. The river valley and normal controls stay active.</p>',
      '<b>Body</b>',
      '<div class="g3d-mutation-lab-grid">',
      ...forms.map((form) => `<button type="button" data-mutation-lab-stage="${form.stage}" data-mutation-lab-family="${form.family}">${form.label}</button>`),
      '</div>',
      '<b>Mutation</b>',
      '<div class="g3d-mutation-lab-grid">',
      '<button type="button" data-mutation-lab-mutation="">None</button>',
      ...GLOAMWOOD_MUTATION_POOL.map((mutation) => `<button type="button" data-mutation-lab-mutation="${mutation.id}">${escapeGloamwoodHtml(t(`mutation.${mutation.id}.name` as 'mutation.fang-thin-hide.name'))}</button>`),
      '</div>',
      '<button class="g3d-mutation-lab-preview" type="button" data-mutation-lab-preview>Preview current effect</button>',
    ].join('')
    const updateUrl = (update: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(window.location.search)
      params.set('debug', '1')
      params.set('maplab', '5')
      params.set('mutationLab', '1')
      update(params)
      window.location.search = params.toString()
    }
    for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-mutation-lab-stage]')) {
      button.addEventListener('click', () => updateUrl((params) => {
        params.set('evolutionStage', button.dataset.mutationLabStage ?? '0')
        params.set('evolutionRoute', button.dataset.mutationLabFamily ?? 'fang')
      }))
    }
    for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-mutation-lab-mutation]')) {
      button.addEventListener('click', () => updateUrl((params) => {
        const mutation = button.dataset.mutationLabMutation ?? ''
        if (mutation) params.set('mutationDebug', mutation)
        else params.delete('mutationDebug')
      }))
    }
    panel.querySelector<HTMLButtonElement>('[data-mutation-lab-preview]')?.addEventListener('click', () => this.previewMutationFeedback())
    panel.querySelector<HTMLButtonElement>('[data-mutation-lab-close]')?.addEventListener('click', () => {
      panel.hidden = true
      this.renderer.domElement.focus()
    })
    this.mutationLab = panel
    this.container.append(panel)
  }

  /** Debug-only presentation check. It never reaches combat state, health, range or a target. */
  private previewMutationFeedback() {
    // Long enough to inspect, short enough that a drawn rending mark still
    // reads as an attack instead of a slowly appearing decal.
    this.feedbackDurationMultiplier = 2.6
    window.setTimeout(() => { this.feedbackDurationMultiplier = 1 }, 1600)
    const x = this.playerRoot.position.x
    const z = this.playerRoot.position.z
    const ground = this.map.height(x, z)
    const forward = new THREE.Vector3(Math.cos(this.lastFacing), 0, -Math.sin(this.lastFacing))
    const at = new THREE.Vector3(x, ground + 0.7, z)
    const reaction = this.mutationState.taken
      .map((id) => gloamwoodMutationExpression(id)?.reaction)
      .find((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    if (reaction === 'double-slash') {
      const target = this.livePrey()
        .filter((prey) => prey.phase !== 'dead')
        .sort((left, right) => (
          Math.hypot(left.x - x, left.z - z) - Math.hypot(right.x - x, right.z - z)
        ))[0]
      const close = target && Math.hypot(target.x - x, target.z - z) <= 5.5
      if (target && close) {
        const targetDirection = new THREE.Vector3(target.x - x, 0, target.z - z)
        if (targetDirection.lengthSq() > 0.0001) targetDirection.normalize()
        else targetDirection.copy(forward)
        const targetY = this.map.height(target.x, target.z) + (target.kind === 'shell' ? 1.28 : 0.94)
        const surfaceContact = new THREE.Vector3(target.x, targetY, target.z)
          .addScaledVector(targetDirection, -gloamwoodPreyBodyRadius(target) * 0.48)
        this.spawnRendingClaws(surfaceContact, targetDirection)
      } else this.spawnRendingClaws(at, forward)
    } else if (reaction === 'suppression-ring') {
      this.spawnTailSuppressionFeedback()
    } else if (reaction === 'armour-shards') {
      this.spawnCarapaceFeedback()
    } else if (reaction === 'feeding-pulse') {
      this.spawnFeedingFeedback(Math.max(1, this.killHeal || 8))
    } else if (reaction === 'slow-gait') {
      if (this.sporeHaze) this.sporeHaze.previewBoost = 1
      this.spawnMutationFxBurst('spore-preview')
    } else if (reaction === 'moult-burst') {
      this.spawnMoultFeedback()
    } else if (reaction === 'metabolic-pulse') {
      this.spawnMetabolicFeedback('preview')
    } else {
      this.spawnFeedbackSprite('glow', at, 0xf6ca72, [0.18, 0.18], [0.86, 0.86], 0.34, new THREE.Vector3(0, 0.3, 0), 0, 0, 0.7)
    }
    this.combatMessage = 'Debug effect preview — no damage'
  }

  private createOrientationGate() {
    const gate = document.createElement('section')
    gate.className = 'gloamwood-orientation-gate'
    gate.setAttribute('role', 'dialog')
    gate.setAttribute('aria-label', t('a11y.orientation'))
    gate.innerHTML = [
      '<div>',
      '<i aria-hidden="true"><span>↻</span></i>',
      `<span>${t('orient.eyebrow')}</span>`,
      `<h2>${t('orient.title')}</h2>`,
      `<p>${t('orient.body')}</p>`,
      `<button class="primary" type="button" data-g3d-landscape>${t('orient.enter')}</button>`,
      `<button type="button" data-g3d-portrait-continue>${t('orient.continue')}</button>`,
      `<small data-g3d-orientation-status>${t('orient.status')}</small>`,
      '</div>',
    ].join('')
    gate.querySelector<HTMLButtonElement>('[data-g3d-landscape]')?.addEventListener('click', () => {
      void this.requestLandscapePresentation(gate)
    })
    gate.querySelector<HTMLButtonElement>('[data-g3d-portrait-continue]')?.addEventListener('click', () => {
      gate.dataset.dismissed = 'true'
      this.renderer.domElement.focus()
    })
    this.orientationGate = gate
    this.container.append(gate)
  }

  private async requestLandscapePresentation(gate: HTMLElement) {
    const status = gate.querySelector<HTMLElement>('[data-g3d-orientation-status]')
    const { fullscreenAccepted, orientationAccepted } = await this.enterLandscapeFullscreen()
    if (status) status.textContent = orientationAccepted
      ? t('orient.rotated')
      : fullscreenAccepted
        ? t('orient.fsOnly')
        : t('orient.unsupported')
  }

  /**
   * Shared full-screen entry. The portrait rotation gate is not reachable once
   * the phone is already landscape, so the HUD toggle needs the same path to
   * reclaim the height the browser URL bar occupies.
   */
  private async enterLandscapeFullscreen() {
    let fullscreenAccepted = document.fullscreenElement !== null
    try {
      if (!fullscreenAccepted && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
        fullscreenAccepted = true
      }
    } catch {
      fullscreenAccepted = false
    }
    let orientationAccepted = false
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> }
      if (orientation.lock) {
        await orientation.lock('landscape')
        orientationAccepted = true
      }
    } catch {
      orientationAccepted = false
    }
    return { fullscreenAccepted, orientationAccepted }
  }

  private async toggleFullscreenPresentation() {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // Leaving full screen is best-effort; the hunt keeps running either way.
      }
    } else {
      await this.enterLandscapeFullscreen()
    }
    this.updateFullscreenToggle()
  }

  private updateFullscreenToggle() {
    if (!this.fullscreenToggle) return
    if (!document.fullscreenEnabled) {
      // iPhone Safari exposes no Fullscreen API, so the button explains the only
      // route that removes the address bar instead of silently disappearing.
      this.fullscreenToggle.dataset.active = 'false'
      this.fullscreenToggle.textContent = t('fs.howTo')
      this.fullscreenToggle.setAttribute('aria-label', t('fs.howToAria'))
      return
    }
    const active = document.fullscreenElement !== null
    this.fullscreenToggle.dataset.active = active ? 'true' : 'false'
    this.fullscreenToggle.textContent = active ? t('fs.exit') : t('fs.enter')
    this.fullscreenToggle.setAttribute('aria-label', active ? t('fs.exit') : t('fs.enterAria'))
  }

  /**
   * Swap language and rebuild the chrome.
   *
   * The HUD, guide, settings and touch controls bake their copy in at creation,
   * so a live switch has to recreate them; per-frame text alone would leave the
   * static labels in the old language. The panel is reopened afterwards because
   * the player is standing in it when they press the button.
   */
  private toggleLocale() {
    const next: Locale = getLocale() === 'en' ? 'zh' : 'en'
    setLocale(next)
    persistLocale(next)
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.dataset.locale = next
    document.title = t('document.title')

    const settingsWereOpen = this.settingsPanel ? !this.settingsPanel.hidden : false
    this.hud?.remove()
    this.onboardingHud?.remove()
    this.deathOverlay?.remove()
    this.settingsPanel?.remove()
    this.orientationGate?.remove()
    this.homeScreenTip?.remove()
    this.damageLayer?.remove()
    this.container.querySelector('.gloamwood-3d-touch')?.remove()
    this.damageNumbers.length = 0
    this.targetBar = undefined
    this.bossPlate = undefined
    this.fullscreenToggle = undefined

    this.createHud()
    if (this.evolutionOverlay && !this.evolutionOverlay.hidden) this.renderEvolutionOffer()
    if (settingsWereOpen && this.settingsPanel) {
      this.settingsPanel.hidden = false
      this.settingsPanel.dataset.page = 'feedback'
    }
    this.updateHud()
  }

  private createDamageLayer() {
    const layer = document.createElement('div')
    layer.className = 'gloamwood-damage-layer'
    layer.setAttribute('aria-hidden', 'true')
    this.damageLayer = layer
    this.container.append(layer)

    // Health for the locked target rides above its head rather than sitting in
    // the HUD corner, for the same reason the damage numbers moved: that is
    // where the player is already looking. It also doubles as confirmation of
    // which enemy is selected, so only the locked one ever shows a bar.
    const bar = document.createElement('div')
    bar.className = 'g3d-target-bar'
    bar.hidden = true
    bar.innerHTML = [
      '<span class="g3d-target-mark" data-g3d-target-mark aria-hidden="true"></span>',
      '<small data-g3d-target-tier></small>',
      '<b data-g3d-target-name></b>',
      '<em class="g3d-target-affix" data-g3d-target-affix></em>',
      '<i><em data-g3d-target-fill></em></i>',
    ].join('')
    this.targetBar = bar
    layer.append(bar)
  }

  private updateTargetBar() {
    const bar = this.targetBar
    if (!bar) return
    const boss = this.bossActive() && this.bossLocked
    const prey = boss ? null : this.lockedPrey()
    const live = boss
      ? {
          x: this.bossState.x, z: this.bossState.z, top: GLOAMWOOD_BOSS.bodyRadius * 1.9,
          health: this.bossState.health, max: this.bossState.maxHealth, name: t('creature.boss'),
          tier: 'boss' as GloamwoodThreatTier, affix: undefined, phase: this.bossState.phase,
          rhythm: resolveGloamwoodHuntRhythm(true, this.bossState.state),
        }
      : prey && prey.phase !== 'dead'
        ? (() => {
            const creature = prey as GloamwoodValleyCreature
            const valleyBoss = gloamwoodValleyBossSpecFor(creature)
            return {
              x: prey.x, z: prey.z, top: gloamwoodPreyBodyRadius(prey) * 1.7,
              health: prey.health, max: prey.maxHealth, name: this.preyName(prey),
              tier: gloamwoodThreatTier({ tier: creature.tier, eliteAffix: creature.elite?.affix, boss: Boolean(valleyBoss) }),
              affix: creature.elite?.affix,
              phase: creature.bossPhase ?? 1,
              rhythm: resolveGloamwoodHuntRhythm(Boolean(valleyBoss), prey.phase),
            }
          })()
        : null
    if (!live) {
      bar.hidden = true
      this.updateBossPlate(null)
      return
    }
    this.updateBossPlate(live.tier === 'boss' ? live : null)
    // Boss identity, phase and health deliberately live in one stable place:
    // the encounter plate. The ground seal still marks the boss in-world, but
    // a duplicate card over the model hides telegraphs and competes with hits.
    if (!gloamwoodUsesWorldTargetPlate(live.tier)) {
      bar.hidden = true
      return
    }
    const projected = new THREE.Vector3(live.x, live.top, live.z).project(this.camera)
    if (projected.z > 1) {
      bar.hidden = true
      this.updateBossPlate(null)
      return
    }
    bar.hidden = false
    bar.dataset.tier = live.tier
    const x = (projected.x * 0.5 + 0.5) * this.container.clientWidth
    const y = (-projected.y * 0.5 + 0.5) * this.container.clientHeight
    bar.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
    const name = bar.querySelector<HTMLElement>('[data-g3d-target-name]')
    if (name && name.textContent !== live.name) name.textContent = live.name
    const mark = bar.querySelector<HTMLElement>('[data-g3d-target-mark]')
    if (mark) mark.textContent = gloamwoodThreatMark(live.tier)
    const tier = bar.querySelector<HTMLElement>('[data-g3d-target-tier]')
    if (tier) tier.textContent = live.tier === 'elite' ? t('threat.elite.label') : ''
    const affix = bar.querySelector<HTMLElement>('[data-g3d-target-affix]')
    if (affix) affix.textContent = live.tier === 'elite' && live.affix
      ? `${ELITE_AFFIXES[live.affix].icon} ${t(`elite.affix.${live.affix}` as 'elite.affix.berserker')}`
      : ''
    const fill = bar.querySelector<HTMLElement>('[data-g3d-target-fill]')
    if (fill) fill.style.width = `${Math.max(0, Math.min(1, live.health / Math.max(1, live.max))) * 100}%`
  }

  private updateBossPlate(boss: {
    health: number
    max: number
    name: string
    phase: 1 | 2
    rhythm: GloamwoodHuntRhythm
  } | null) {
    const plate = this.bossPlate
    if (!plate) return
    if (!boss) {
      plate.hidden = true
      return
    }
    plate.hidden = false
    const setText = (selector: string, value: string) => {
      const element = plate.querySelector<HTMLElement>(selector)
      if (element && element.textContent !== value) element.textContent = value
    }
    setText('[data-g3d-boss-badge]', gloamwoodThreatMark('boss'))
    setText('[data-g3d-boss-eyebrow]', t('threat.boss.eyebrow'))
    setText('[data-g3d-boss-name]', boss.name)
    const beat = boss.rhythm === 'evade'
      ? t('boss.beat.evade')
      : boss.rhythm === 'counter'
        ? t('boss.beat.counter')
        : t('boss.beat.pressure')
    setText('[data-g3d-boss-phase]', `${t('threat.boss.phase', { phase: boss.phase })} · ${beat}`)
    const fill = plate.querySelector<HTMLElement>('[data-g3d-boss-fill]')
    if (fill) fill.style.width = `${Math.max(0, Math.min(1, boss.health / Math.max(1, boss.max))) * 100}%`
    plate.dataset.phase = String(boss.phase)
    plate.dataset.rhythm = boss.rhythm
  }

  /**
   * @param world  where the hit landed, in world space
   * @param amount authoritative effective damage, already decided
   * @param tone   presentation only; picks colour and weight, never the number
   */
  private spawnDamageNumber(
    world: THREE.Vector3,
    amount: number,
    tone: 'hit' | 'weakness' | 'blocked' | 'kill' | 'player' | 'heal' | 'drain',
    /**
     * Overrides the text. Every number in this game until now has been a plain
     * quantity of health, so the figure alone was unambiguous. Starving
     * Metabolism spends *maximum* health, which is a different currency and
     * reads as ordinary damage without a word attached to it.
     */
    label?: string,
  ) {
    if (!this.damageLayer) return
    const element = document.createElement('span')
    element.className = 'g3d-damage-number'
    element.dataset.tone = tone
    element.textContent = label ?? String(amount)
    this.damageLayer.append(element)
    this.damageNumbers.push({
      element,
      world: world.clone(),
      life: 0,
      // A drain lingers. Every other number here is a quantity read at a glance
      // during a fast exchange; this one has a word in it, fires once every
      // thirty seconds, and is the only notice the player gets that their
      // ceiling just came down.
      duration: tone === 'drain' ? 1.7 : tone === 'kill' ? 1.15 : 0.86,
      // Spread repeated hits so a fast chain does not stack numbers in one spot.
      drift: (Math.random() - 0.5) * 46,
    })
    // Bound the pool so a long fight cannot grow the DOM without limit.
    while (this.damageNumbers.length > 24) {
      const oldest = this.damageNumbers.shift()
      oldest?.element.remove()
    }
  }

  private updateDamageNumbers(delta: number) {
    if (this.damageNumbers.length === 0) return
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    for (let index = this.damageNumbers.length - 1; index >= 0; index -= 1) {
      const entry = this.damageNumbers[index]
      entry.life += delta
      const progress = entry.life / entry.duration
      if (progress >= 1) {
        entry.element.remove()
        this.damageNumbers.splice(index, 1)
        continue
      }
      const projected = entry.world.clone().project(this.camera)
      // Behind the camera projects to a mirrored point; hide rather than draw it.
      if (projected.z > 1) {
        entry.element.style.opacity = '0'
        continue
      }
      const x = (projected.x * 0.5 + 0.5) * width + entry.drift * progress
      const y = (-projected.y * 0.5 + 0.5) * height - progress * 54
      entry.element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${1 + (1 - progress) * 0.18})`
      entry.element.style.opacity = String(progress < 0.72 ? 1 : (1 - progress) / 0.28)
    }
  }

  private createHomeScreenTip() {
    const tip = document.createElement('aside')
    tip.className = 'gloamwood-homescreen-tip'
    tip.hidden = true
    tip.setAttribute('role', 'dialog')
    tip.setAttribute('aria-label', t('a11y.fsTip'))
    tip.innerHTML = [
      '<div>',
      `<span>${t('fs.eyebrow')}</span>`,
      `<p>${t('fs.tipBody')}</p>`,
      `<small>${t('fs.tipNote')}</small>`,
      `<button type="button" data-g3d-tip-close>${t('fs.tipClose')}</button>`,
      '</div>',
    ].join('')
    tip.querySelector<HTMLButtonElement>('[data-g3d-tip-close]')?.addEventListener('click', () => {
      tip.hidden = true
      this.renderer.domElement.focus()
    })
    this.homeScreenTip = tip
    this.container.append(tip)
  }

  private toggleHomeScreenTip() {
    if (!this.homeScreenTip) return
    this.homeScreenTip.hidden = !this.homeScreenTip.hidden
    if (!this.homeScreenTip.hidden) {
      this.homeScreenTip.querySelector<HTMLButtonElement>('[data-g3d-tip-close]')?.focus()
    }
  }

  private createSettingsPanel() {
    const panel = document.createElement('section')
    panel.className = 'gloamwood-settings-panel'
    panel.hidden = true
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-modal', 'true')
    panel.setAttribute('aria-labelledby', 'g3d-settings-title')
    panel.innerHTML = [
      '<div>',
      '<section data-g3d-settings-feedback>',
      `<span>${t('settings.eyebrow')}</span>`,
      `<h2 id="g3d-settings-title">${t('settings.title')}</h2>`,
      `<p>${t('settings.body')}</p>`,
      `<button type="button" data-g3d-setting="shake">${t('settings.shakeLabel', { state: t('toggle.on') })}</button>`,
      `<button type="button" data-g3d-setting="flash">${t('settings.flashLabel', { state: t('toggle.on') })}</button>`,
      `<button type="button" data-g3d-setting="mute">${t('settings.muteLabel', { state: t('toggle.off') })}</button>`,
      `<button type="button" data-g3d-setting="volume">${t('settings.volumeLabel', { value: 60 })}</button>`,
      `<button type="button" data-g3d-setting="language">${t('settings.language')}</button>`,
      `<button type="button" data-g3d-input-open>${t('settings.openInput')}</button>`,
      `<button class="primary" type="button" data-g3d-settings-resume>${t('settings.resume')}</button>`,
      `<output class="g3d-performance-readout" data-g3d-performance hidden>${t('settings.perfWaiting')}</output>`,
      `<small data-g3d-settings-summary>${t('settings.summary')}</small>`,
      // Required attribution, not decoration: the Coral Gecko source chain is
      // CC BY 4.0, and docs/ASSET-LICENSE-REGISTER.md names this credit and
      // requires it in game as well as on the public page.
      `<small class="g3d-credits" data-g3d-credits>${t('settings.credits')}</small>`,
      '</section>',
      '<section data-g3d-settings-input hidden>',
      `<span>${t('input.eyebrow')}</span>`,
      `<h2>${t('input.title')}</h2>`,
      `<p>${t('input.body')}</p>`,
      '<div class="g3d-input-bindings">',
      `<button type="button" data-g3d-bind="moveUp">${t('bind.moveUp')}</button>`,
      `<button type="button" data-g3d-bind="moveDown">${t('bind.moveDown')}</button>`,
      `<button type="button" data-g3d-bind="moveLeft">${t('bind.moveLeft')}</button>`,
      `<button type="button" data-g3d-bind="moveRight">${t('bind.moveRight')}</button>`,
      `<button type="button" data-g3d-bind="lock">${t('bind.lock')}</button>`,
      `<button type="button" data-g3d-bind="attack">${t('bind.attack')}</button>`,
      `<button type="button" data-g3d-bind="pause">${t('bind.pause')}</button>`,
      '</div>',
      `<div class="g3d-input-footer"><button type="button" data-g3d-bind-reset>${t('input.reset')}</button><button class="primary" type="button" data-g3d-input-back>${t('input.back')}</button></div>`,
      '</section>',
      '</div>',
    ].join('')
    for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-g3d-setting]')) {
      button.addEventListener('click', () => this.cycleFeedbackSetting(button.dataset.g3dSetting ?? ''))
    }
    panel.querySelector<HTMLButtonElement>('[data-g3d-settings-resume]')?.addEventListener('click', () => this.toggleSettings(false))
    panel.querySelector<HTMLButtonElement>('[data-g3d-input-open]')?.addEventListener('click', () => this.showInputSettings(true))
    panel.querySelector<HTMLButtonElement>('[data-g3d-input-back]')?.addEventListener('click', () => this.showInputSettings(false))
    panel.querySelector<HTMLButtonElement>('[data-g3d-bind-reset]')?.addEventListener('click', () => {
      this.inputBindings = { ...DEFAULT_GLOAMWOOD_INPUT_BINDINGS }
      this.rebindingAction = null
      this.saveInputBindings()
      this.renderInputBindings()
    })
    for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-g3d-bind]')) {
      button.addEventListener('click', () => {
        this.rebindingAction = button.dataset.g3dBind as GloamwoodInputAction
        this.renderInputBindings()
      })
    }
    this.settingsPanel = panel
    const performanceReadout = panel.querySelector<HTMLOutputElement>('[data-g3d-performance]')
    if (performanceReadout) performanceReadout.hidden = !(import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1')
    this.container.append(panel)
    this.hud?.querySelector<HTMLButtonElement>('[data-g3d-settings-toggle]')?.addEventListener('click', () => {
      this.audio.unlock()
      this.toggleSettings(true)
    })
    this.hud?.querySelector<HTMLButtonElement>('[data-g3d-hud-details]')?.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement
      const expanded = this.hud?.dataset.mobileExpanded !== 'true'
      if (this.hud) this.hud.dataset.mobileExpanded = String(expanded)
      button.setAttribute('aria-expanded', String(expanded))
      button.textContent = expanded ? t('hud.collapse') : t('hud.expand')
    })
    this.renderFeedbackSettings()
    this.renderInputBindings()
  }

  private toggleSettings(open: boolean) {
    if (!this.settingsPanel || this.runPhase === 'victory' || this.runPhase === 'defeat') return
    if (open === this.paused) return
    const now = performance.now()
    if (open) this.pauseStartedAt = now
    else if (this.pauseStartedAt > 0) {
      this.runStartedAt += now - this.pauseStartedAt
      this.pauseStartedAt = 0
    }
    this.paused = open
    this.settingsPanel.hidden = !open
    this.rebindingAction = null
    this.showInputSettings(false)
    this.keys.clear()
    this.primaryHeld = false
    this.touchMoveX = 0
    this.touchMoveZ = 0
    if (open) this.settingsPanel.querySelector<HTMLButtonElement>('[data-g3d-settings-resume]')?.focus()
    else {
      this.renderer.domElement.focus()
      this.requestNextFrame(true)
    }
  }

  private cycleFeedbackSetting(setting: string) {
    // Language rebuilds the chrome rather than writing a feedback value, so it
    // returns before the persistence below.
    if (setting === 'language') return this.toggleLocale()
    if (setting === 'shake') this.feedbackSettings.shake = !this.feedbackSettings.shake
    else if (setting === 'flash') this.feedbackSettings.flash = !this.feedbackSettings.flash
    else if (setting === 'mute') this.feedbackSettings.muted = !this.feedbackSettings.muted
    else if (setting === 'volume') this.feedbackSettings.volume = cycleFeedbackVolume(this.feedbackSettings.volume)
    this.audio.setVolume(this.feedbackSettings.volume)
    this.audio.setMuted(this.feedbackSettings.muted)
    try {
      localStorage.setItem(PLAYER_FEEDBACK_SETTINGS_KEY, JSON.stringify(this.feedbackSettings))
    } catch {
      // Settings remain active for this session if storage is unavailable.
    }
    this.renderFeedbackSettings()
  }

  private renderFeedbackSettings() {
    if (!this.settingsPanel) return
    const shake = this.settingsPanel.querySelector<HTMLButtonElement>('[data-g3d-setting="shake"]')
    const flash = this.settingsPanel.querySelector<HTMLButtonElement>('[data-g3d-setting="flash"]')
    const mute = this.settingsPanel.querySelector<HTMLButtonElement>('[data-g3d-setting="mute"]')
    const volume = this.settingsPanel.querySelector<HTMLButtonElement>('[data-g3d-setting="volume"]')
    if (shake) shake.textContent = t('settings.shakeLabel', { state: this.feedbackSettings.shake ? t('toggle.on') : t('toggle.off') })
    if (flash) flash.textContent = t('settings.flashLabel', { state: this.feedbackSettings.flash ? t('toggle.on') : t('toggle.off') })
    if (mute) mute.textContent = t('settings.muteLabel', { state: this.feedbackSettings.muted ? t('toggle.on') : t('toggle.off') })
    if (volume) volume.textContent = t('settings.volumeLabel', { value: Math.round(this.feedbackSettings.volume * 100) })
    // Labelled in its own language, so it reads as the language you would get.
    const language = this.settingsPanel.querySelector<HTMLButtonElement>('[data-g3d-setting="language"]')
    if (language) language.textContent = t('settings.language')
    const summary = this.settingsPanel.querySelector<HTMLElement>('[data-g3d-settings-summary]')
    if (summary) summary.textContent = t('settings.summaryDyn', { pause: formatGloamwoodInputCode(this.inputBindings.pause), move: gloamwoodMovementBindingLabel(this.inputBindings), lock: formatGloamwoodInputCode(this.inputBindings.lock), attack: formatGloamwoodInputCode(this.inputBindings.attack) })
    this.renderPerformanceReadout()
  }

  private renderPerformanceReadout() {
    const output = this.settingsPanel?.querySelector<HTMLOutputElement>('[data-g3d-performance]')
    if (!output || output.hidden) return
    const canvas = this.renderer.domElement
    output.textContent = formatGloamwoodPerformanceReadout(this.performanceSampler.snapshot(), {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      heapMegabytes: readJavaScriptHeapMegabytes(),
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      pixelRatio: this.renderer.getPixelRatio(),
    })
  }

  private showInputSettings(show: boolean) {
    if (!this.settingsPanel) return
    const feedback = this.settingsPanel.querySelector<HTMLElement>('[data-g3d-settings-feedback]')
    const input = this.settingsPanel.querySelector<HTMLElement>('[data-g3d-settings-input]')
    if (feedback) feedback.hidden = show
    if (input) input.hidden = !show
    this.rebindingAction = null
    if (show) {
      this.renderInputBindings()
      input?.querySelector<HTMLButtonElement>('[data-g3d-bind]')?.focus()
    } else feedback?.querySelector<HTMLButtonElement>('[data-g3d-setting]')?.focus()
  }

  private commitInputBinding(action: GloamwoodInputAction, code: string) {
    this.inputBindings = rebindGloamwoodInput(this.inputBindings, action, code)
    this.rebindingAction = null
    this.keys.clear()
    this.primaryHeld = false
    this.saveInputBindings()
  }

  private saveInputBindings() {
    try {
      localStorage.setItem(GLOAMWOOD_INPUT_BINDINGS_STORAGE_KEY, JSON.stringify(this.inputBindings))
    } catch {
      // Bindings remain active for this session if storage is unavailable.
    }
    this.renderFeedbackSettings()
  }

  private renderInputBindings() {
    if (!this.settingsPanel) return
    const labels: Record<GloamwoodInputAction, string> = {
      moveUp: t('bind.moveUp'), moveDown: t('bind.moveDown'), moveLeft: t('bind.moveLeft'), moveRight: t('bind.moveRight'),
      lock: t('bind.lock'), attack: t('bind.attack'), pause: t('bind.pause'),
    }
    for (const button of this.settingsPanel.querySelectorAll<HTMLButtonElement>('[data-g3d-bind]')) {
      const action = button.dataset.g3dBind as GloamwoodInputAction
      const capturing = this.rebindingAction === action
      button.dataset.capturing = String(capturing)
      button.textContent = capturing ? t('bind.capturing', { action: labels[action] }) : t('bind.current', { action: labels[action], key: formatGloamwoodInputCode(this.inputBindings[action]) })
    }
  }

  private playSound(event: GloamwoodSoundEvent) {
    this.lastSoundEvent = event
    this.soundEventCount += 1
    this.recentSoundEvents.push(event)
    if (this.recentSoundEvents.length > 16) this.recentSoundEvents.shift()
    this.audio.play(event)
  }

  private runElapsedSeconds() {
    const now = this.paused && this.pauseStartedAt > 0 ? this.pauseStartedAt : performance.now()
    return Math.max(0, (now - this.runStartedAt) / 1000)
  }

  private createTouchControls() {
    const controls = document.createElement('section')
    controls.className = 'gloamwood-3d-touch'
    controls.setAttribute('aria-label', t('a11y.touch'))
    controls.innerHTML = [
      `<div class="g3d-joystick" data-joystick role="application" aria-label="${t('touch.joystickAria')}">`,
      '<i data-joystick-knob aria-hidden="true"></i>',
      `<span aria-hidden="true">${t('touch.move')}</span>`,
      '</div>',
      '<div class="g3d-actions">',
      `<button data-lock aria-label="${t('bind.lock')}">${t('touch.lock')}</button>`,
      `<button class="primary" data-attack aria-label="${t('touch.attackAria')}">${t('touch.attack')}<small>${t('touch.attackHint')}</small></button>`,
      '</div>',
    ].join('')
    const joystick = controls.querySelector<HTMLElement>('[data-joystick]')
    const joystickKnob = controls.querySelector<HTMLElement>('[data-joystick-knob]')
    let joystickPointerId: number | null = null
    const moveJoystick = (event: PointerEvent) => {
      if (!joystick || joystickPointerId !== event.pointerId) return
      const bounds = joystick.getBoundingClientRect()
      const vector = gloamwoodJoystickVector(
        event.clientX - (bounds.left + bounds.width / 2),
        event.clientY - (bounds.top + bounds.height / 2),
      )
      this.touchMoveX = vector.x
      this.touchMoveZ = vector.z
      if (joystickKnob) joystickKnob.style.transform = `translate(${vector.visualX}px, ${vector.visualY}px)`
      joystick.dataset.active = vector.strength > 0 ? 'true' : 'false'
    }
    const releaseJoystick = (event?: PointerEvent) => {
      if (event && joystickPointerId !== event.pointerId) return
      joystickPointerId = null
      this.touchMoveX = 0
      this.touchMoveZ = 0
      if (joystickKnob) joystickKnob.style.transform = 'translate(0, 0)'
      if (joystick) joystick.dataset.active = 'false'
    }
    joystick?.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      this.audio.unlock()
      if (this.paused) return
      joystickPointerId = event.pointerId
      joystick.setPointerCapture(event.pointerId)
      moveJoystick(event)
    })
    joystick?.addEventListener('pointermove', moveJoystick)
    joystick?.addEventListener('pointerup', releaseJoystick)
    joystick?.addEventListener('pointercancel', releaseJoystick)
    joystick?.addEventListener('lostpointercapture', releaseJoystick)
    controls.querySelector<HTMLButtonElement>('[data-lock]')?.addEventListener('click', () => {
      this.audio.unlock()
      if (this.paused) return
      this.toggleEnemyLock()
    })
    const attack = controls.querySelector<HTMLButtonElement>('[data-attack]')
    attack?.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      this.audio.unlock()
      if (this.paused) return
      attack.setPointerCapture(event.pointerId)
      this.primaryHeld = true
      this.requestPrimaryAttack()
    })
    const releaseAttack = () => { this.primaryHeld = false }
    attack?.addEventListener('pointerup', releaseAttack)
    attack?.addEventListener('pointercancel', releaseAttack)
    attack?.addEventListener('lostpointercapture', releaseAttack)
    this.container.append(controls)
  }

  private updateHud() {
    this.updateValleyRadar()
    this.updateDefenceRadar()
    this.updateAltarPlate()
    if (!this.hud) return
    const playerRatio = this.playerCombat.health / this.playerCombat.maxHealth
    const setText = (selector: string, value: string) => {
      const element = this.hud?.querySelector<HTMLElement>(selector)
      if (element && element.textContent !== value) element.textContent = value
    }
    setText('[data-g3d-message]', this.combatMessage)
    setText('[data-g3d-nest-title]', this.runPhase === 'boss'
      ? t('hud.titleBoss', { name: t('creature.boss'), phase: this.bossState.phase })
      : this.runPhase === 'guardian'
        ? t('hud.titleGuardian', { name: t('creature.guardian') })
      : this.runPhase === 'victory'
        ? t('hud.titleVictory')
        // A map with no nest has no wave to name. Reading the nest's phase
        // anyway is how the valley opened with "nest cleared" written across a
        // map that has never had one.
        : !this.map.hasNest ? t('hud.titleField')
          : this.nestState.phase === 'cleared' ? t('hud.titleCleared') : t('hud.titleNest', { suffix: this.nestState.wave ? t('hud.waveSuffix', { wave: this.nestState.wave, total: GLOAMWOOD_NEST.waveCount }) : '' }))
    setText('[data-g3d-player-health]', `${this.playerCombat.health} / ${this.playerCombat.maxHealth}`)
    setText('[data-g3d-lives]', String(Math.max(0, this.livesRemaining)))
    this.updateMutationList()
    // The map speaks first. Its set-piece is the one thing on screen the player
    // cannot walk away from, and it needs saying for as long as it is true.
    const mapStatus = this.map.status?.()
    setText('[data-g3d-remaining]', mapStatus ? t(mapStatus.key as never, mapStatus.params)
      : this.runPhase === 'boss'
      ? `${this.bossPatternName(this.bossState.pattern)} · ${this.bossState.state === 'telegraph' ? t('boss.beat.evade') : this.bossState.state === 'attack' ? t('boss.beat.evade') : this.bossState.state === 'recover' ? t('boss.beat.counter') : t('boss.beat.pressure')}`
      : !this.map.hasNest ? t('hud.fieldRemaining', { count: this.livePrey().length, kills: this.nestState.kills })
        : this.nestState.phase === 'dormant' ? t('hud.undisturbed') : this.nestState.phase === 'intermission' ? t('hud.incoming') : this.nestState.phase === 'cleared' ? t('hud.clearedKills', { kills: this.nestState.kills }) : t('hud.waveRemaining', { count: this.livePrey().length }))
    // Biomass against the thing it is buying. On its own it read as a score,
    // and a player watched it reach 156 before asking whether evolution was
    // broken - the number failing to say what it was for.
    const nextEvolution = this.map.hasNest
      ? null
      : gloamwoodValleyNextEvolution(this.nestState.biomass, this.evolutionsTaken)
    setText('[data-g3d-biomass]', nextEvolution
      ? `${this.nestState.biomass} / ${nextEvolution.target}`
      : `${this.nestState.biomass}`)
    // And the milestone track, which existed entirely out of sight: five
    // meaningful boundaries show whether a short run actually progressed.
    const progressCell = this.hud.querySelector<HTMLElement>('[data-g3d-mutation-progress-cell]')
    if (progressCell) {
      const total = this.map.hasNest ? 0 : GLOAMWOOD_VALLEY_MILESTONES.length
      progressCell.hidden = total === 0
      if (total > 0) {
        const reached = GLOAMWOOD_VALLEY_MILESTONES
          .filter((milestone) => this.mutationState.reached.includes(milestone.id)).length
        setText('[data-g3d-mutation-progress]', `${reached}/${total}`)
      }
    }
    setText('[data-g3d-fang]', `${this.nestState.genes.fang}`)
    setText('[data-g3d-shell]', `${this.nestState.genes.shell}`)
    setText('[data-g3d-swarm]', `${this.nestState.genes.swarm}`)
    setText('[data-g3d-settings-toggle]', t('hud.settingsKey', { key: formatGloamwoodInputCode(this.inputBindings.pause) }))
    this.renderPerformanceReadout()
    /**
     * The bar is scaled against the ceiling this run *started* with, so
     * Starving Metabolism physically shortens it.
     *
     * Before this it was drawn as `health / maxHealth`, and maxHealth is the
     * value the mutation eats. Both numbers shrank together, so the bar stayed
     * exactly as long as it always was and the one cost the mutation charges
     * was invisible on the one gauge the player actually watches. The lost
     * ceiling is left behind as a dim scar at the right end, and because it
     * accumulates, four ticks in it tells the whole story of the run at a
     * glance - which no indicator above the animal's head could.
     */
    const ceiling = this.playerCombat.maxHealth + this.decayedMaximumHealth
    const playerBar = this.hud.querySelector<HTMLElement>('[data-g3d-player-bar]')
    if (playerBar) {
      playerBar.style.width = `${Math.max(0, ceiling > 0 ? this.playerCombat.health / ceiling : 0) * 100}%`
    }
    const playerScar = this.hud.querySelector<HTMLElement>('[data-g3d-player-scar]')
    if (playerScar) {
      playerScar.style.width = `${(ceiling > 0 ? this.decayedMaximumHealth / ceiling : 0) * 100}%`
    }
    this.hud.dataset.critical = playerRatio <= 0.3 ? 'true' : 'false'
    this.updateOnboardingHud()
  }

  private onboardingStep() {
    const objectiveX = this.runPhase === 'guardian' || this.runPhase === 'boss' ? GLOAMWOOD_BOSS_ARENA.x : GLOAMWOOD_NEST.centerX
    const objectiveZ = this.runPhase === 'guardian' || this.runPhase === 'boss' ? GLOAMWOOD_BOSS_ARENA.z : GLOAMWOOD_NEST.centerZ
    return deriveGloamwoodOnboardingStep({
      runPhase: this.runPhase,
      // From where this map actually starts the player. Hard-coded to the
      // Gloamwood's spawn, this read as tens of units before anyone had moved
      // on the valley, and the guide skipped its first steps.
      movedDistance: Math.hypot(
        this.playerRoot.position.x - this.map.spawn.x,
        this.playerRoot.position.z - this.map.spawn.z,
      ),
      nestPhase: this.nestState.phase,
      targetLocked: this.bossLocked || Boolean(this.lockedPrey()),
      targetKind: this.lockedPrey()?.kind ?? null,
      attackStarted: this.onboardingAttackStarted,
      kills: this.nestState.kills,
      biomass: this.nestState.biomass,
      genes: this.nestState.genes,
      evolutionPhase: this.evolutionState.phase,
      objectiveDistance: Math.hypot(objectiveX - this.playerRoot.position.x, objectiveZ - this.playerRoot.position.z),
      bossPattern: this.bossState.pattern,
      bossPhase: this.bossState.phase,
      controls: {
        move: gloamwoodMovementBindingLabel(this.inputBindings),
        lock: formatGloamwoodInputCode(this.inputBindings.lock),
        attack: formatGloamwoodInputCode(this.inputBindings.attack),
      },
    })
  }

  private updateOnboardingHud() {
    if (!this.onboardingHud) return
    const step = this.map.hasNest ? this.onboardingStep() : this.valleyOnboardingStep()
    if (!step) {
      this.onboardingHud.hidden = true
      return
    }
    this.onboardingHud.hidden = false
    const setText = (selector: string, value: string) => {
      const element = this.onboardingHud?.querySelector<HTMLElement>(selector)
      if (element && element.textContent !== value) element.textContent = value
    }
    this.onboardingHud.dataset.phase = step.phase
    this.onboardingHud.dataset.tone = step.tone
    setText('[data-g3d-guide-eyebrow]', step.eyebrow)
    setText('[data-g3d-guide-title]', step.title)
    setText('[data-g3d-guide-instruction]', step.instruction)
    setText('[data-g3d-guide-reason]', step.reason)
    setText('[data-g3d-guide-progress]', step.progress)
    const progress = this.onboardingHud.querySelector<HTMLElement>('[data-g3d-guide-bar]')
    if (progress) progress.style.width = `${Math.max(1, step.step) / step.totalSteps * 100}%`
  }

  /** A two-beat guide for the open valley, without a tutorial card stack. */
  private valleyOnboardingStep(): GloamwoodOnboardingStep | null {
    if (this.onboardingAttackStarted || this.nestState.kills > 0) return null
    const locked = this.lockedPrey()
    if (locked) {
      return {
        phase: 'attack', step: 2, totalSteps: 2,
        eyebrow: t('valley.guide.eyebrow'), title: t('valley.guide.lockTitle'),
        instruction: t('valley.guide.lockInstruction', { attack: formatGloamwoodInputCode(this.inputBindings.attack) }),
        reason: t('guide.attack.reason'), progress: t('valley.guide.lockProgress'), tone: 'combat',
      }
    }
    return {
      phase: 'move', step: 1, totalSteps: 2,
      eyebrow: t('valley.guide.eyebrow'), title: t('valley.guide.title'),
      instruction: t('valley.guide.instruction', { move: gloamwoodMovementBindingLabel(this.inputBindings) }),
      reason: t('valley.guide.reason'), progress: t('valley.guide.progress'), tone: 'guide',
    }
  }

  /** Teleports a reviewer to a real valley boss, never to the legacy arena. */
  private standAtValleyBoss(index = 0) {
    if (this.map.hasNest) return null
    const bosses = this.nestState.prey
      .filter((prey) => (prey as GloamwoodValleyCreature).tier === 'boss')
      .sort((a, b) => (a as GloamwoodValleyCreature).spawnS - (b as GloamwoodValleyCreature).spawnS)
    const boss = bosses[Math.max(0, Math.min(bosses.length - 1, index))]
    if (!boss) return null
    const spec = gloamwoodValleyBossSpecFor(boss as GloamwoodValleyCreature)
    // Stand at the playable range, on the camera's far side of the body. This
    // frames the fight and guarantees the same range rule a real approach uses.
    const stand = this.map.confine(boss.x - (spec?.preferredRange ?? 6), boss.z)
    this.playerRoot.position.set(stand.x, this.map.height(stand.x, stand.z), stand.z)
    this.target.set(stand.x, 0, stand.z)
    this.lockedPreyId = boss.id
    this.bossLocked = false
    this.playerCombat = { ...this.playerCombat, health: this.playerCombat.maxHealth, invulnerabilitySeconds: 0.8 }
    this.combatMessage = t('hud.msg.bossTest')
    this.snapCameraNextFrame = true
    return { id: boss.id, boss: spec?.bodyId ?? null, x: boss.x, z: boss.z }
  }


  private preyName(prey: GloamwoodNestPrey) {
    if (prey.id === GLOAMWOOD_NEST_GUARDIAN.id) return t('creature.guardian')
    const valleyBoss = gloamwoodValleyBossSpecFor(prey as GloamwoodValleyCreature)
    if (valleyBoss) return t(`valley.boss.${valleyBoss.bodyId}` as 'valley.boss.tide-cleaver')
    return prey.kind === 'fang' ? t('creature.fang') : prey.kind === 'shell' ? t('creature.shell') : t('creature.swarm')
  }

  private getDebugState(): DebugState {
    const stage = this.stage
    const asset = resolveQuality3DGLBAsset(stage >= 2 ? 2 : stage >= 1 ? 1 : 0, this.characterFamily).asset
    const collisionProfile = getGloamwoodPlayerCollisionProfile(stage, this.characterFamily)
    const collision = inspectGloamwoodPlayerCollision(this.playerRoot.position, this.lastFacing, stage, this.obstacles, this.characterFamily)
    const playerBodyRadius = gloamwoodPlayerCombatBodyRadius(stage, this.characterFamily)
    const leapBite = this.activeClip === 'Pounce'
      ? this.stage === 1
        ? gloamwoodStageOnePounceFrame(Math.max(0, performance.now() - this.attackStartedAt) / 1000, Math.max(0.001, this.attackDurationSeconds))
        : juvenileLeapBiteMotionFrame(Math.max(0, performance.now() - this.attackStartedAt) / 1000, Math.max(0.001, this.attackDurationSeconds))
      : juvenileLeapBiteMotionFrame(0, 1)
    const performanceSnapshot = this.performanceSampler.snapshot()
    return {
      scene: 'gloamwood-3d-rebuild',
      deprecatedMapLab4: true,
      renderer: 'three-webgl',
      stage,
      model: asset?.formId ?? 'missing',
      modelReady: this.modelReady,
      characterFamily: this.characterFamily ?? 'origin',
      characterFamilyMatched: this.characterFamilyMatched,
      combatProfileMatchedForm: this.combatProfileMatchedForm,
      // Reported by form rather than by stage: three different bodies now share
      // stage 1, and a stage-keyed chain silently reports whichever one it was
      // written for. Looking the form up means adding a body cannot leave this
      // describing a different creature than the one on screen.
      presentation: {
        ...gloamwoodFormBaseline(asset?.formId, stage),
        modelUrl: asset?.url ?? 'missing',
      },
      activeClip: this.activeClip,
      attack: {
        visualOffset: round(this.characterRoot.position.x),
        liftOffset: round(this.characterRoot.position.y),
        pitchDegrees: round(THREE.MathUtils.radToDeg(this.characterRoot.rotation.z)),
        yawDegrees: round(THREE.MathUtils.radToDeg(this.characterRoot.rotation.y)),
        elapsedSeconds: round(this.attackStartedAt > 0 ? Math.max(0, performance.now() - this.attackStartedAt) / 1000 : 0),
        leapBitePhase: leapBite.phase,
        landingEvents: this.leapBiteLandingEvents,
      },
      moving: this.moving,
      grounded: Math.abs(this.playerRoot.position.y - this.map.height(this.playerRoot.position.x, this.playerRoot.position.z)) < 0.001,
      locomotion: {
        runPoseWeight: RUN_POSE_WEIGHT,
        idleSupportWeight: IDLE_SUPPORT_WEIGHT,
        additiveLegRotationDegrees: 0,
        turning: this.turning,
        facingErrorDegrees: round(this.facingErrorDegrees),
        moveFacingToleranceDegrees: GLOAMWOOD_3D_MOVE_FACING_TOLERANCE_DEGREES,
        footstepEvents: this.footstepEvents,
        activeDustParticles: this.dustParticles.filter((particle) => particle.active).length,
        activeActionWeights: Object.fromEntries(
          [...this.actions.entries()]
            .map(([name, action]) => [name, round(action.getEffectiveWeight())] as const)
            .filter(([name, weight]) => weight > 0.01 && (this.actions.get(name)?.isRunning() || this.actions.get(name)?.paused)),
        ),
      },
      player: { x: round(this.playerRoot.position.x), y: round(this.playerRoot.position.y), z: round(this.playerRoot.position.z), speed: this.moving ? round(PLAYER_SPEED * this.moveSpeedMultiplier * this.movementInputStrength) : 0 },
      collision: {
        profile: { ...collisionProfile },
        contacts: this.collisionContacts,
        closestObstacleId: collision.closestObstacleId,
        minimumClearance: round(collision.minimumClearance),
        entityMinimumClearance: round(inspectGloamwoodPlayerPreyClearance(this.playerRoot.position, playerBodyRadius, this.nestState.prey)),
        actionSpaceClearance: round(inspectGloamwoodPlayerPreyActionClearance(this.playerRoot.position, playerBodyRadius, this.nestState.prey)),
        preyPairClearance: round(inspectGloamwoodPreyPairClearance(this.nestState.prey)),
      },
      combat: {
        targetLocked: Boolean(this.lockedPrey()) || (this.bossActive() && this.bossLocked),
        playerHealth: this.playerCombat.health,
        enemyHealth: this.bossActive() && this.bossLocked ? this.bossState.health : this.lockedPrey()?.health ?? 0,
        enemyPhase: this.bossActive() && this.bossLocked ? this.bossState.state : this.lockedPrey()?.phase ?? 'none',
        targetId: this.bossActive() && this.bossLocked ? GLOAMWOOD_BOSS.id : this.lockedPrey()?.id ?? null,
        targetKind: this.lockedPrey()?.kind ?? null,
        comboAction: this.attackState.action ?? 'none',
        skillsEnabled: false,
        lockAssist: 'stable-wave-and-attacker',
        knockbackRecoverySeconds: round(this.knockbackRecoverySeconds),
        lastKnockbackDistance: round(this.lastKnockbackDistance),
      },
      nest: {
        phase: this.nestState.phase,
        wave: this.nestState.wave,
        remaining: this.livePrey().length,
        kills: this.nestState.kills,
        biomass: this.nestState.biomass,
        genes: { ...this.nestState.genes },
        maximumActivePrey: GLOAMWOOD_NEST.maximumActivePrey,
      },
      evolution: {
        phase: this.evolutionState.phase,
        seed: this.evolutionState.seed,
        refreshesRemaining: this.evolutionState.refreshesRemaining,
        candidateIds: this.evolutionState.candidates.map((candidate) => candidate.id),
        mutationIds: [...this.mutationState.taken],
        selectedId: this.evolutionState.selected?.id ?? null,
        selectedFamily: this.evolutionState.selected?.family ?? null,
        modifiers: this.evolutionState.selected?.modifiers ?? null,
      },
      run: {
        phase: this.runPhase,
        elapsedSeconds: round(this.runElapsedSeconds()),
        deaths: this.runDeaths,
      },
      valley: this.map.id === 'valley' ? (() => {
        const corridor = gloamwoodValleyCorridorAt(this.playerRoot.position.x, this.playerRoot.position.z)
        const gate = gloamwoodValleyNextGate(this.valleyProgression, corridor.s)
        return {
          region: gloamwoodValleyRegionAt(corridor.s)?.id ?? null,
          progress: [...this.valleyProgression.reached],
          entered: [...this.valleyProgression.entered],
          gateIndex: gate?.index ?? null,
          evolutionsTaken: this.evolutionsTaken,
        }
      })() : null,
      onboarding: (() => {
        const step = this.map.hasNest ? this.onboardingStep() : this.valleyOnboardingStep()
        if (!step) return { phase: 'complete' as const, step: 2, totalSteps: 2, title: '' }
        return { phase: step.phase, step: step.step, totalSteps: step.totalSteps, title: step.title }
      })(),
      settings: { paused: this.paused, ...this.feedbackSettings },
      audio: {
        ...this.audio.snapshot(),
        lastEvent: this.lastSoundEvent,
        eventCount: this.soundEventCount,
        recentEvents: [...this.recentSoundEvents],
      },
      visualFeedback: {
        activeSprites: this.feedbackSprites.length,
        activeParticles: this.rendingParticles.length + this.rendingSurfaces.length + this.mutationParticles.length,
        activeDecals: 0,
        // The spore count rather than a patch count: the mist is one mesh now,
        // so counting it only ever reported 1 or 0, and what is worth reporting
        // is whether the drift is actually there.
        sporeHaze: this.sporeHaze ? SPORE_HAZE.moteCount : 0,
        // How far the mist bends from its highest vertex to its lowest. Zero on
        // level ground and non-zero on a slope, which is the difference between
        // a disc that follows the terrain and the flat quads that used to get
        // sliced in half by it - a defect that is invisible in a still frame
        // taken anywhere flat.
        sporeMistDrop: round(this.sporeMistDrop()),
        slowAuraRadius: this.mutationEffects.slowAuraRadius ?? 0,
      },
      input: { bindings: { ...this.inputBindings }, rebinding: this.rebindingAction },
      performance: {
        ...performanceSnapshot,
        // The whole run rather than the last three seconds. A review can read
        // this without waiting for a result screen or opening an overlay.
        run: this.runPerformance.report(),
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        jsHeapMegabytes: readJavaScriptHeapMegabytes(),
        viewport: {
          width: this.renderer.domElement.clientWidth,
          height: this.renderer.domElement.clientHeight,
          pixelRatio: round(this.renderer.getPixelRatio()),
        },
      },
      boss: {
        active: this.bossActive(),
        state: this.bossState.state,
        pattern: this.bossState.pattern,
        phase: this.bossState.phase,
        health: this.bossState.health,
        maxHealth: this.bossState.maxHealth,
        x: round(this.bossState.x),
        z: round(this.bossState.z),
        locked: this.bossLocked,
      },
      // `facing` and `playerBearing` make the shell flank window observable on a
      // real device, where remote developer tools are not available.
      frames: this.frameCount,
      keysHeld: [...this.keys],
      // The two flags that stop the world without showing anything on a map
      // whose panels are not wired.
      frozenBy: this.paused ? 'paused'
        : this.evolutionState.phase === 'choosing' ? 'evolution'
        : this.mutationState.offering ? 'mutation'
        : this.runPhase === 'victory' || this.runPhase === 'defeat' ? this.runPhase
        : null,
      preyModels: this.preyTemplates.size,
      meatDrops: this.meatDrops.length,
      geneCores: this.geneCores.length,
      preyModelError: this.preyModelError ?? null,
      bossModel: this.bossVisual?.model?.config.url.split('/').pop()?.split('?')[0] ?? null,
      bossClip: this.bossVisual?.model?.currentName ?? null,
      bossModelError: this.bossModelError ?? null,
      defence: (() => {
        const run = (this.map as { defenceRun?: () => GloamwoodDefenceState }).defenceRun?.()
        if (!run) return null
        return {
          phase: run.phase,
          wave: run.wave,
          waves: GLOAMWOOD_DEFENCE_RUN.waves,
          altarHealth: run.altarHealth,
          altarMaxHealth: run.altarMaxHealth,
        }
      })(),
      prey: this.nestState.prey.map((prey) => ({
        id: prey.id,
        kind: prey.kind,
        health: prey.health,
        phase: prey.phase,
        x: round(prey.x),
        z: round(prey.z),
        facing: round(prey.facingRadians),
        // Which authored clip this creature is on, and where in it. Reported
        // because a model that loaded, mounted and then never advanced looks
        // exactly like one that is idling, and a screenshot cannot tell the
        // two apart - this project has twice taken one as proof of wiring that
        // was not connected.
        clip: this.preyVisuals.get(prey.id)?.model?.clipName ?? null,
        clipTime: round(this.preyVisuals.get(prey.id)?.model?.action?.time ?? 0),
        bodyMeshes: (() => {
          const visual = this.preyVisuals.get(prey.id)
          if (!visual) return -1
          let meshes = 0
          visual.body.traverse((node) => {
            if (node instanceof THREE.Mesh) meshes += 1
          })
          return meshes
        })(),
        y: round(this.preyVisuals.get(prey.id)?.root.position.y ?? 0),
        playerBearing: round(Math.atan2(-(this.playerRoot.position.z - prey.z), this.playerRoot.position.x - prey.x)),
      })),
      camera: { fov: this.camera.fov, pitch: 36, distance: round(GLOAMWOOD_3D_CAMERA_DISTANCE) },
      world: {
        geometry: 'real-3d',
        groundMeshes: 3,
        environmentKit: 'quaternius-stylized-nature-megakit-cc0',
        undergrowthInstances: this.undergrowthInstances,
        trees: this.treeCount,
        rocks: this.rockCount,
        // Reported rather than eyeballed. On the defence map the promise the
        // layout makes is that the fighting ground is clear, and a scatter that
        // silently placed nothing at all looks identical in a screenshot to one
        // that placed it correctly outside the bowl.
        defenceProps: this.defenceScene?.stats.props ?? 0,
        defenceGroundVertices: this.defenceScene?.stats.groundVertices ?? 0,
        bloom: this.bloom !== undefined,
        shrinePieces: this.shrinePieces,
        collisionObstacles: this.obstacles.length,
        weather: this.valley?.weather.id ?? 'gloamwood-static',
        weatherSeed: this.map.id === 'valley' ? this.weatherRunSeed : 'gloamwood-static',
        ecology: this.map.id === 'valley' ? this.ecology.id : 'gloamwood-static',
        ecologySeed: this.map.id === 'valley' ? this.ecologyRunSeed : 'gloamwood-static',
        flatBackdrop: false,
      },
    }
  }

  private updateDebug() {
    if (this.debugOutput) this.debugOutput.textContent = JSON.stringify(this.getDebugState())
    if (this.debugLive) {
      const frozen = this.paused ? 'paused'
        : this.evolutionState.phase === 'choosing' ? 'evolution'
        : this.mutationState.offering ? 'mutation'
        : this.runPhase === 'victory' || this.runPhase === 'defeat' ? this.runPhase
        : null
      this.debugLive.textContent = `frames ${this.frameCount}　keys [${[...this.keys].join(' ') || '-'}]　pos ${this.playerRoot.position.x.toFixed(1)},${this.playerRoot.position.z.toFixed(1)}${frozen ? `　FROZEN: ${frozen}` : ''}`
    }
  }

}

/** Escapes text going into a template string, so a translation cannot inject markup. */
function escapeGloamwoodHtml(value: string) {
  const holder = document.createElement('span')
  holder.textContent = value
  return holder.innerHTML
}

function terrainHeight(x: number, z: number) {
  const edge = Math.max(0, Math.abs(x) - 18) * 0.075 + Math.max(0, Math.abs(z) - 12) * 0.11
  const rolling = Math.sin(x * 0.24) * 0.16 + Math.cos(z * 0.3) * 0.12 + Math.sin((x + z) * 0.17) * 0.1
  const pathFlatten = Math.exp(-Math.pow(z - Math.sin(x * 0.2) * 2.2, 2) / 18)
  return (rolling + edge) * (1 - pathFlatten * 0.72)
}

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = Math.imul(value ^ value >>> 15, 1 | value)
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value)
    return ((value ^ value >>> 14) >>> 0) / 4294967296
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function isBasicAttackAction(value: string): value is FormalHuntBasicAttackAction {
  return value === 'Bite' || value === 'Claw' || value === 'Pounce' || value === 'TailSwipe'
}

export function stepGloamwoodTurnBeforeMove(currentFacing: number, desiredFacing: number, deltaSeconds: number) {
  const error = shortestAngleDelta(currentFacing, desiredFacing)
  const maximumTurn = GLOAMWOOD_3D_TURN_SPEED_RADIANS * Math.max(0, Math.min(0.05, deltaSeconds))
  const facingRadians = normalizeAngle(currentFacing + THREE.MathUtils.clamp(error, -maximumTurn, maximumTurn))
  const remainingErrorDegrees = Math.abs(THREE.MathUtils.radToDeg(shortestAngleDelta(facingRadians, desiredFacing)))
  return {
    facingRadians,
    remainingErrorDegrees,
    // Translation follows player intent immediately. The remaining error is
    // still exposed for animation/debug review, while combat keeps its own
    // stricter target-facing test at the instant a blow connects.
    canTranslate: true,
  }
}

function hasPressedGloamwoodMovement(
  keys: ReadonlySet<string>,
  bindings: GloamwoodInputBindings,
  touchMoveX: number,
  touchMoveZ: number,
) {
  const inputX = Number(keys.has(bindings.moveRight) || keys.has('ArrowRight')) - Number(keys.has(bindings.moveLeft) || keys.has('ArrowLeft')) + touchMoveX
  const inputZ = Number(keys.has(bindings.moveDown) || keys.has('ArrowDown')) - Number(keys.has(bindings.moveUp) || keys.has('ArrowUp')) + touchMoveZ
  return Math.abs(inputX) > 0.01 || Math.abs(inputZ) > 0.01
}

export function gloamwoodMovementFacingRadians(movementX: number, movementZ: number) {
  return Math.atan2(-movementZ, movementX)
}

export function gloamwoodScreenMovementVector(
  inputX: number,
  inputY: number,
  // Defaults to the Gloamwood's, so every existing caller and test is
  // unchanged. Passed in by the runtime, because which way W walks has to
  // follow the camera the map is actually framed by.
  offset: { x: number; z: number } = CAMERA_OFFSET,
) {
  const inverseLength = 1 / Math.hypot(offset.x, offset.z)
  const forwardX = -offset.x * inverseLength
  const forwardZ = -offset.z * inverseLength
  // Screen-right is camera-forward crossed with world-up. The previous signs
  // produced screen-left, so A/D were visually mirrored even though the four
  // vectors remained orthogonal in unit tests.
  const rightX = -forwardZ
  const rightZ = forwardX
  return {
    x: inputX * rightX - inputY * forwardX,
    z: inputX * rightZ - inputY * forwardZ,
  }
}

export function gloamwoodPlayerHitKnockbackDistance(
  kind: GloamwoodPreyKind,
  authoredDistance: number,
  recoverySeconds: number,
) {
  const chainScale = recoverySeconds > 0 ? GLOAMWOOD_PLAYER_HIT_REACTION.chainedKnockbackMultiplier : 1
  return Math.min(
    GLOAMWOOD_PLAYER_HIT_REACTION.maximumDistance,
    Math.max(0, authoredDistance) * GLOAMWOOD_PLAYER_HIT_REACTION.familyScale[kind] * chainScale,
  )
}

/**
 * How far the lock reaches.
 *
 * The camera frames about eighteen units either side of the player, so this is
 * a little past what they can see - far enough to pick something out before it
 * notices you at eleven, and not so far that the cycle walks off screen.
 *
 * Without a limit the cycle ran the whole map. On the Gloamwood that is one
 * wave of six standing in front of you; in the valley it is sixty-three spread
 * over 1590 units, so a second press of Tab jumped to something a hundred metres
 * away and the lock read as lost for good.
 */
/** How long a spent burst takes to clear, so "gone" means the ground is safe. */
const GLOAMWOOD_ELITE_BURST_FADE = 0.4

export const GLOAMWOOD_LOCK_RANGE = 22

/**
 * Does a press of attack walk the player in rather than swing?
 *
 * A running attack suppresses movement for its whole duration, so a press that
 * opens the chain out of reach gives the standing order and then blocks it: one
 * whiff at empty ground, "target out of reach", and the walk only begins once
 * the swing and its recovery are done. Held down, the next swing starts before
 * a step is taken and the player never moves at all.
 *
 * Reach is measured to the hurt surface, as everywhere else. Past the lock's own
 * range the order will not run, and there the swing and its honest miss are
 * still the right answer - refusing to swing as well would leave the button
 * doing nothing whatsoever.
 */
export function gloamwoodPrimaryAttackShouldClose(
  centreDistance: number,
  targetRadius: number,
  reach: number,
  lockRange = GLOAMWOOD_LOCK_RANGE,
) {
  return centreDistance - targetRadius > reach && centreDistance <= lockRange
}

export function nextGloamwoodLockTarget(
  prey: readonly GloamwoodNestPrey[],
  currentId: string | null,
  player: { x: number; z: number },
  range = GLOAMWOOD_LOCK_RANGE,
) {
  // Sorted by distance, not by spawn slot. A slot order is arbitrary once
  // creatures are scattered across a map, so the cycle jumped about; nearest
  // first is the order the player already has in their head.
  const live = prey
    .filter((candidate) => candidate.phase !== 'dead')
    .map((candidate) => ({ candidate, distance: Math.hypot(candidate.x - player.x, candidate.z - player.z) }))
    .filter((entry) => entry.distance <= range)
    .sort((left, right) => left.distance - right.distance || left.candidate.id.localeCompare(right.candidate.id))
    .map((entry) => entry.candidate)
  if (live.length === 0) return null
  const index = live.findIndex((candidate) => candidate.id === currentId)
  // Nothing locked, or what was locked has died or walked out of range: take
  // the nearest rather than giving up, which is what made a second press feel
  // like it had thrown the target away.
  if (index < 0) return live[0].id
  return live[(index + 1) % live.length].id
}

export function assistGloamwoodAttackerLock(
  prey: readonly GloamwoodNestPrey[],
  currentId: string | null,
  attackerId: string,
) {
  const currentIsLive = prey.some((candidate) => candidate.id === currentId && candidate.phase !== 'dead')
  if (currentIsLive) return currentId
  return prey.some((candidate) => candidate.id === attackerId && candidate.phase !== 'dead') ? attackerId : null
}

export function gloamwoodStageOnePounceFrame(elapsedSeconds: number, durationSeconds: number) {
  const frame = juvenileLeapBiteMotionFrame(elapsedSeconds, durationSeconds)
  return {
    ...frame,
    forwardOffset: frame.forwardOffset * SCARLET_GECKO_PRESENTATION.combat.pounceVisualTravelScale,
    liftOffset: frame.liftOffset * SCARLET_GECKO_PRESENTATION.combat.pounceVisualLiftScale,
  }
}

export interface GloamwoodStoppableAction {
  stop: () => unknown
}

export function stopGloamwoodActionsExcept<T extends GloamwoodStoppableAction>(
  actions: Iterable<T>,
  keep: T,
) {
  for (const action of actions) {
    if (action !== keep) action.stop()
  }
}

function shortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

function normalizeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}


function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const abX = bx - ax
  const abZ = bz - az
  const lengthSquared = abX * abX + abZ * abZ
  const t = lengthSquared > 0 ? THREE.MathUtils.clamp(((px - ax) * abX + (pz - az) * abZ) / lengthSquared, 0, 1) : 0
  return Math.hypot(px - (ax + abX * t), pz - (az + abZ * t))
}
