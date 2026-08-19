import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinnedHierarchy } from 'three/examples/jsm/utils/SkeletonUtils.js'
import {
  formatGloamwoodPerformanceReadout,
  GloamwoodPerformanceSampler,
  readJavaScriptHeapMegabytes,
} from './gloamwood-performance'
import { gloamwoodJoystickVector } from './gloamwood-touch-controls'

import { resolveQuality3DGLBAsset, type Quality3DFormFamily } from './quality-3d-glb-assets'
import { STONE_PANGOLIN_PRESENTATION } from './stone-pangolin-character-presentation'
import { SPORE_STALKER_PRESENTATION } from './spore-stalker-character-presentation'
import { applyDocumentLocale, getLocale, persistLocale, setLocale, t, type Locale } from './i18n'
import { gloamwoodFamilyPortrait } from './gloamwood-family-portraits'
import { gloamwoodMutationIcon } from './gloamwood-mutation-icons'
import { GloamwoodSessionLog, summariseGloamwoodSession } from './gloamwood-3d-session-log'
import {
  GLOAMWOOD_BLADESHELL_BOSS,
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
  gloamwoodPreyBodyRadius,
  resolveGloamwoodPlayerPreyCollision,
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
  openGloamwoodEvolutionOffer,
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
import { classifyGloamwoodRunPace } from './gloamwood-3d-run'
import { deriveGloamwoodOnboardingStep, type GloamwoodOnboardingStep } from './gloamwood-3d-onboarding'
import { GloamwoodAudioBus, type GloamwoodSoundEvent } from './gloamwood-3d-audio'
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
import { gloamwoodOccludesCameraView } from './gloamwood-camera-occlusion'
import { createGloamwoodMap, gloamwoodMapStep, type GloamwoodMapContract } from './gloamwood-map'
import { buildGloamwoodValleyScene } from './gloamwood-valley-scene'
import { createGloamwoodValleyMap } from './gloamwood-valley-map'
import type { GloamwoodValleyCreature } from './gloamwood-valley-creatures'
import { gloamwoodValleyCorpseGone } from './gloamwood-valley-respawn'
import { gloamwoodValleyCorridorAt, gloamwoodValleyRegionAt } from './gloamwood-valley-terrain'
import {
  gloamwoodPreyClipForPhase,
  gloamwoodPreyClipRate,
  gloamwoodPreyWalkRate,
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
const GLOAMWOOD_RUN_LIVES = 3
const GLOAMWOOD_BOSS_ARENA_CLEAR_RADIUS = 7.8
const PLAYER_FEEDBACK_SETTINGS_KEY = 'evolution-arena-combat-feedback-v1'
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
  const override = family ? GLOAMWOOD_3D_FORM_WORLD_HEIGHTS[family] : undefined
  return override?.[index] ?? GLOAMWOOD_3D_CHARACTER_HEIGHTS[index]
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
 * Stage still answers for forms that have no profile of their own - stage 0 and
 * the late-stage endpoints are route-independent - but a form that declares one
 * gets it.
 */
function gloamwoodFormCombatProfile(formId: string | undefined, stage: number): GloamwoodCombatProfile {
  if (formId === 'spore-stalker') return SPORE_STALKER_PRESENTATION.combat
  if (formId === 'stone-pangolin') return STONE_PANGOLIN_PRESENTATION.combat
  if (stage >= 2) return SCARLET_HUNTER_PRESENTATION.combat
  if (stage >= 1) return SCARLET_GECKO_PRESENTATION.combat
  return CORAL_GECKO_PRESENTATION.combat
}

interface DustParticle {
  sprite: THREE.Sprite
  velocity: THREE.Vector3
  age: number
  duration: number
  active: boolean
  startScale: number
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
    selectedId: string | null
    selectedFamily: string | null
    modifiers: GloamwoodEvolutionCandidate['modifiers'] | null
  }
  run: { phase: GloamwoodRunPhase; elapsedSeconds: number; deaths: number }
  onboarding: { phase: GloamwoodOnboardingStep['phase']; step: number; totalSteps: number; title: string }
  settings: { paused: boolean; shake: boolean; flash: boolean; volume: number }
  audio: { lastEvent: GloamwoodSoundEvent | null; eventCount: number }
  input: { bindings: GloamwoodInputBindings; rebinding: GloamwoodInputAction | null }
  performance: {
    fps: number
    averageFrameMs: number
    p95FrameMs: number
    sampleCount: number
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
  preyModelError: string | null
  prey: Array<{
    id: string
    kind: GloamwoodPreyKind
    health: number
    phase: string
    x: number
    z: number
    clip: string | null
    clipTime: number
  }>
  camera: { fov: number; pitch: number; distance: number }
  world: {
    geometry: 'real-3d'
    groundMeshes: number
    environmentKit: string
    undergrowthInstances: number
    trees: number
    rocks: number
    shrinePieces: number
    collisionObstacles: number
    flatBackdrop: false
  }
}

export function isGloamwood3DHuntRequested(search = window.location.search) {
  const params = new URLSearchParams(search)
  return params.get('maplab') === '5'
    || params.get('world3d') === '1'
    || (params.get('maplab') === '4' && params.get('live') === '1')
}

export async function launchGloamwood3DHunt() {
  const container = document.querySelector<HTMLElement>('#game-container')
  if (!container) throw new Error('Missing #game-container for Gloamwood 3D hunt')
  document.body.classList.add('is-maplab', 'is-v4-live', 'is-gloamwood-3d')
  // English is the primary market, so the locale is resolved from the browser
  // before any player-facing string is built. ?lang=en|zh overrides for testing.
  applyDocumentLocale()
  document.title = t('document.title')
  const experience = new Gloamwood3DHunt(container)
  if (import.meta.env.DEV) {
    // Lets a review surface with no animation frames drive the loop and read
    // the state that results, rather than reading a snapshot frozen at startup.
    ;(window as unknown as Record<string, unknown>).__gloamwoodStep =
      (frames?: number, delta?: number) => experience.stepFramesForReview(frames, delta)
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
  private readonly shadowMaterials: THREE.MeshBasicMaterial[] = []
  private readonly nestRoot = new THREE.Group()
  private readonly preyVisuals = new Map<string, PreyVisual>()
  private preyModelError?: string
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
  private readonly map: GloamwoodMapContract = new URLSearchParams(window.location.search).get('map') === 'valley'
    ? createGloamwoodValleyMap(
      Number(new URLSearchParams(window.location.search).get('mapSeed') ?? 0) || 0x5a11e,
      async () => { await this.buildValleyScenery() },
      (camera, elapsed, delta) => this.valley?.update(camera, elapsed, delta),
      () => this.valleyGroundHeight,
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
  private readonly cameraOffset = new THREE.Vector3(
    this.map.cameraOffset.x,
    this.map.cameraOffset.y,
    this.map.cameraOffset.z,
  )
  /**
   * Creatures the player hit since the last creature step.
   *
   * The aggro layer wakes whatever is struck, and it can only do that if it is
   * told. Wired as an empty array when the map contract went in, which left
   * every passive creature in the valley taking hits without ever looking up.
   */
  private readonly struckThisFrame: string[] = []
  private snapCameraNextFrame = false
  private deathOverlay?: HTMLElement
  private valleyGroundHeight: ((x: number, z: number) => number) | null = null
  private valley: { update(camera: { x: number; z: number }, elapsed: number, delta: number): void } | null = null
  // Keyed by body rather than by family. One family can wear several bodies -
  // a hunter and a grazer, a pack member and the elite promoted from it - and
  // keying by family silently loaded whichever came last.
  private readonly preyTemplates = new Map<string, { scene: THREE.Group; clips: THREE.AnimationClip[]; config: GloamwoodModelledPreyConfig }>()
  private readonly feedbackMeshes: Array<{ mesh: THREE.Mesh; age: number; duration: number }> = []
  private readonly dustParticles: DustParticle[] = []
  private readonly footstepState = createGloamwoodFootstepState()
  private nestState: GloamwoodNestState = this.map.createCreatures()
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
  private livesRemaining = GLOAMWOOD_RUN_LIVES
  private resultOverlay?: HTMLElement
  /**
   * Modifiers granted by the one form evolution. Mutations stack on top of
   * these rather than replacing them, so both are folded in one place -
   * `applyProgressionModifiers()` - and nothing else writes them.
   */
  private evolutionModifiers = {
    damageMultiplier: 1, moveSpeedMultiplier: 1, damageReduction: 0,
    biomassMultiplier: 1, killHeal: 0, maximumHealthBonus: 0,
  }
  private damageMultiplier = 1
  private moveSpeedMultiplier = 1
  private damageReduction = 0
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
  private combatMessage = this.map.hasNest ? t('hud.msg.approachNest') : t('hud.msg.takeTheRoad')
  private hud?: HTMLElement
  private onboardingHud?: HTMLElement
  private settingsPanel?: HTMLElement
  private orientationGate?: HTMLElement
  private fullscreenToggle?: HTMLButtonElement
  private homeScreenTip?: HTMLElement
  private damageLayer?: HTMLElement
  private targetBar?: HTMLElement
  /**
   * Floating damage readouts. Pure presentation: each entry is spawned from an
   * already-resolved authoritative result and never feeds back into combat.
   */
  private readonly damageNumbers: { element: HTMLElement; world: THREE.Vector3; life: number; duration: number; drift: number }[] = []
  private onboardingAttackStarted = false
  private feedbackSettings: CombatFeedbackSettings = { ...DEFAULT_COMBAT_FEEDBACK_SETTINGS }
  private readonly audio: GloamwoodAudioBus
  private readonly performanceSampler = new GloamwoodPerformanceSampler()
  private paused = false
  private pauseStartedAt = 0
  private lastSoundEvent: GloamwoodSoundEvent | null = null
  private soundEventCount = 0
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
  private debugLive?: HTMLElement
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
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
    this.audio = new GloamwoodAudioBus(this.feedbackSettings.volume)
    const params = new URLSearchParams(window.location.search)
    this.evolutionState = createGloamwoodEvolutionState(params.get('evolutionSeed') ?? 'gloamwood-first-run')
    // Same seed as the form evolution: one seed reproduces a whole run, which is
    // what Goal 3's acceptance actually checks.
    this.mutationState = createGloamwoodMutationState(params.get('evolutionSeed') ?? 'gloamwood-first-run')
    this.scene.background = new THREE.Color(0x12251d)
    this.scene.fog = new THREE.FogExp2(0x1b3329, 0.026)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.38
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.domElement.className = 'gloamwood-3d-canvas'
    this.renderer.domElement.tabIndex = 0
    this.renderer.domElement.setAttribute('aria-label', t('a11y.canvas'))
    this.container.append(this.renderer.domElement)
    this.playerRoot.add(this.characterRoot)
    this.scene.add(this.playerRoot)
    this.scene.add(this.nestRoot)
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
    if (new URLSearchParams(window.location.search).get('preyModels') === '1') {
      // Reported rather than voided. A `void` on a failing load swallows the
      // reason and leaves creatures wearing their primitives, which is
      // indistinguishable from the feature being switched off.
      this.loadModelledPrey().catch((error) => {
        console.error('Modelled prey failed to load', error)
        this.preyModelError = error instanceof Error ? error.message : String(error)
      })
    }
    this.createHud()
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
    if (debugGatesAllowed && debugParams.get('bossGate') === '1') {
      this.openEvolutionGateForDebug()
      const choice = THREE.MathUtils.clamp(Number(debugParams.get('evolutionChoice')) || 0, 0, 2)
      await this.chooseEvolution(choice, 'boss')
    } else if (debugGatesAllowed && debugParams.get('evolutionGate') === '1') {
      this.openEvolutionGateForDebug()
    }
    this.lastFrameAt = performance.now()
    this.tick()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDown)
    this.renderer.domElement.removeEventListener('dblclick', this.suppressGesture)
    document.removeEventListener('gesturestart', this.suppressGesture)
    document.removeEventListener('gesturechange', this.suppressGesture)
    document.removeEventListener('gestureend', this.suppressGesture)
    document.removeEventListener('fullscreenchange', this.fullscreenChanged)
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
    this.renderer.domElement.remove()
    this.debugOutput?.remove()
    this.onboardingHud?.remove()
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
    sun.shadow.mapSize.set(2048, 2048)
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
    const telegraph = new THREE.Mesh(new THREE.RingGeometry(radius * 0.72, GLOAMWOOD_PREY[prey.kind].attackRange, 44).rotateX(-Math.PI / 2), telegraphMaterial)
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
    this.combatProfile = gloamwoodFormCombatProfile(asset?.formId, stage)
    this.characterFamilyMatched = resolved.matchedFamily
    if (!asset) throw new Error(`Missing stage-${stage} GLB`)
    const gltf = await this.loader.loadAsync(assetUrl(asset.url))
    if (this.disposed) return
    this.actions.clear()
    this.tailNodes.length = 0
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
        if (stage === 2) {
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
        } else if (asset.formId === 'spore-stalker') {
          // Graded by form for the same reason the branch above is: this hide is
          // a near-black teal that has to stay dark and take light, which is the
          // opposite of what the scarlet-gecko grade does.
          const grade = SPORE_STALKER_PRESENTATION.material
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
    this.mixer = new THREE.AnimationMixer(gltf.scene)
    for (const sourceClip of gltf.animations) {
      // The yaw/roll damping is a scarlet-gecko-specific repair for its source
      // Run's excessive torso sway. It must follow that form, not the stage, or
      // it flattens the authored motion of every other stage-1 body.
      const clip = asset.formId === 'scarlet-gecko' ? stabilizeScarletGeckoLocomotionClip(sourceClip) : sourceClip
      this.actions.set(clip.name, this.mixer.clipAction(clip))
    }
    this.modelReady = true
    this.setAction('Idle', true)
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
    this.renderer.domElement.focus()
  }

  private readonly suppressGesture = (event: Event) => {
    event.preventDefault()
  }

  private readonly fullscreenChanged = () => {
    this.updateFullscreenToggle()
    this.resize()
  }

  private readonly resize = () => {
    const width = Math.max(1, this.container.clientWidth)
    const height = Math.max(1, this.container.clientHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
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
  stepFramesForReview(frames = 1, delta = 1 / 60) {
    for (let index = 0; index < frames; index += 1) this.tick(delta)
    return this.getDebugState()
  }

  private tick = (forcedDelta?: number) => {
    if (this.disposed) return
    // Wrapped, not passed directly. The browser hands an rAF callback a
    // timestamp, and `tick` reads its first argument as a forced delta - so
    // registering `this.tick` itself made every real frame look like a manual
    // one, and the loop stopped scheduling after the first. The game ran
    // exactly one frame and then froze, on both maps, with nothing in the
    // console: input still arrived, nothing ever read it.
    if (forcedDelta === undefined) this.animationFrame = requestAnimationFrame(() => this.tick())
    const now = forcedDelta === undefined ? performance.now() : this.lastFrameAt + forcedDelta * 1000
    const frameMilliseconds = Math.max(0, now - this.lastFrameAt)
    this.frameCount += 1
    this.performanceSampler.record(frameMilliseconds)
    const delta = Math.min(0.05, frameMilliseconds / 1000)
    this.lastFrameAt = now
    this.foliageTime.value += delta
    this.updateFeedback(delta)
    this.updateDamageNumbers(delta)
    this.updateTargetBar()
    if (this.paused) {
      this.renderer.render(this.scene, this.camera)
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
      this.renderer.render(this.scene, this.camera)
      this.updateHud()
      this.updateDebug()
      return
    }
    if (this.runPhase === 'victory' || this.runPhase === 'defeat') {
      this.updateCamera(delta)
      this.renderer.render(this.scene, this.camera)
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
    this.updateSessionLog()
    this.updateModelledBoss(delta)
    this.updateHealthDecay(delta)
    this.updateMutationOffers()
    this.updateCamera(delta)
    this.renderer.render(this.scene, this.camera)
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
    this.updateAutoEngage()
    const inputX = Number(this.keys.has(this.inputBindings.moveRight) || this.keys.has('ArrowRight')) - Number(this.keys.has(this.inputBindings.moveLeft) || this.keys.has('ArrowLeft')) + this.touchMoveX
    const inputZ = Number(this.keys.has(this.inputBindings.moveDown) || this.keys.has('ArrowDown')) - Number(this.keys.has(this.inputBindings.moveUp) || this.keys.has('ArrowUp')) + this.touchMoveZ
    const cameraRelativeInput = gloamwoodScreenMovementVector(inputX, inputZ, this.cameraOffset)
    this.movement.set(cameraRelativeInput.x, 0, cameraRelativeInput.z)
    if (this.movement.lengthSq() > 0) {
      // Steering is the player taking the angle back. Drop the automation but
      // keep the lock, or flanking would cost a re-select every time.
      if (this.autoEngageTargetId) this.cancelAutoEngage()
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
    const hasMovementIntent = this.playerCombat.alive && this.movement.lengthSq() > 0.01 && !this.attackState.action
    if (hasMovementIntent) {
      const desiredFacing = gloamwoodMovementFacingRadians(this.movement.x, this.movement.z)
      const turn = stepGloamwoodTurnBeforeMove(this.lastFacing, desiredFacing, delta)
      this.lastFacing = turn.facingRadians
      this.facingErrorDegrees = turn.remainingErrorDegrees
      this.turning = !turn.canTranslate
      this.playerRoot.rotation.y = this.lastFacing
      this.resolveObstacles(this.playerRoot.position)
    } else {
      this.facingErrorDegrees = 0
      this.turning = false
    }
    this.moving = hasMovementIntent && !this.turning
    if (this.moving) {
      const next = this.playerRoot.position.clone().addScaledVector(this.movement, PLAYER_SPEED * this.moveSpeedMultiplier * this.movementInputStrength * delta)
      // Tested before it is taken, not corrected afterwards. A confine that
      // pushes a little way inside the limit throws the player back every frame
      // they hold a key against the wall, and they bounce there instead of
      // stopping.
      const stepped = gloamwoodMapStep(this.map, { x: this.playerRoot.position.x, z: this.playerRoot.position.z }, { x: next.x, z: next.z })
      next.x = stepped.x
      next.z = stepped.z
      this.confineToArena(next)
      this.resolveObstacles(next)
      this.playerRoot.position.x = next.x
      this.playerRoot.position.z = next.z
    }
    this.playerRoot.position.y = this.map.height(this.playerRoot.position.x, this.playerRoot.position.z)
    if (!this.playerCombat.alive) {
      this.setAction('Death')
      return
    }
    if (this.attackState.action) return
    this.setAction(this.turning ? 'Turn' : this.moving ? 'Run' : 'Idle')
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

  /** Identity of whatever is locked right now, so a standing order can tell
   *  that its target was replaced rather than merely moved. */
  private currentLockIdentity() {
    if (this.bossActive() && this.bossLocked) return 'boss'
    const prey = this.lockedPrey()
    return prey && prey.phase !== 'dead' ? prey.id : null
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
    const target = this.bossActive() && this.bossLocked
      ? { x: this.bossState.x, z: this.bossState.z, radius: GLOAMWOOD_BOSS.bodyRadius }
      : (() => {
          const prey = this.lockedPrey()
          return prey && prey.phase !== 'dead'
            ? { x: prey.x, z: prey.z, radius: gloamwoodPreyBodyRadius(prey) }
            : null
        })()
    if (!target) return this.cancelAutoEngage()

    const dx = target.x - this.playerRoot.position.x
    const dz = target.z - this.playerRoot.position.z
    const centreDistance = Math.hypot(dx, dz)
    // Reach is measured to the hurt surface, so the stop line follows the same rule.
    const surfaceDistance = centreDistance - target.radius
    // A stray press must not walk the player across the map - but the limit is
    // the lock's reach, not the Gloamwood nest's activation radius, which is a
    // number about a different thing entirely. At 12.6 the player could lock
    // something at 22, press attack, and simply stand there.
    //
    // If it can be locked it can be walked to. That is the whole contract of a
    // lock.
    if (centreDistance > GLOAMWOOD_LOCK_RANGE) return this.cancelAutoEngage()

    const reach = this.primaryAttackReach()
    if (surfaceDistance > reach - 0.35) {
      // Approach only closes distance; bearing is whatever the player chose.
      this.target.set(
        target.x - dx / centreDistance * (target.radius + reach - 0.5),
        0,
        target.z - dz / centreDistance * (target.radius + reach - 0.5),
      )
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
        this.playerRoot.position.set(GLOAMWOOD_3D_COMBAT.playerSpawnX, 0, GLOAMWOOD_3D_COMBAT.playerSpawnZ)
      }
      this.target.copy(this.playerRoot.position)
      this.attackState = createFormalHuntBasicAttackState()
      this.combatMessage = t('hud.msg.backToHunt')
      this.setAction('Idle', true)
    }
    if (!this.playerCombat.alive) return

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
    this.attackDurationSeconds = action === 'Bite'
      ? this.combatProfile.biteDurationSeconds
      : action === 'Pounce'
        ? this.combatProfile.pounceDurationSeconds
        : action === 'Claw'
          ? this.combatProfile.clawDurationSeconds
          : this.combatProfile.tailSwipeDurationSeconds
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
    this.struckThisFrame.push(target.id)
    this.playSound(damage.killed ? 'kill' : action === 'Pounce' || action === 'TailSwipe' ? 'hit-heavy' : 'hit-light')
    let displayedBiomass = damage.biomassGained
    if (damage.killed && this.biomassMultiplier !== 1) {
      displayedBiomass = Math.round(damage.biomassGained * this.biomassMultiplier)
      this.nestState = { ...this.nestState, biomass: this.nestState.biomass + displayedBiomass - damage.biomassGained }
    }
    if (damage.killed && this.mutationEffects.bonusOfferEveryKills) {
      this.killsTowardBonusOffer += 1
      if (this.killsTowardBonusOffer >= this.mutationEffects.bonusOfferEveryKills) {
        this.killsTowardBonusOffer = 0
        this.bonusOffersEarned += 1
      }
    }
    if (damage.killed && this.killHeal > 0) {
      this.playerCombat = { ...this.playerCombat, health: Math.min(this.playerCombat.maxHealth, this.playerCombat.health + this.killHeal) }
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
    if (damage.killed) {
      this.combatMessage = target.id === GLOAMWOOD_NEST_GUARDIAN.id
        ? t('hud.msg.guardianDown', { name: t('creature.guardian') })
        : t('hud.msg.kill', { name: this.preyName(target), biomass: displayedBiomass, gene: this.geneName(target.kind) })
      this.lockedPreyId = this.nearestLivePrey()?.id ?? null
    }
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
    if (action === 'TailSwipe') return feedback.tailSwipeRange
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
    }, this.struckThisFrame)
    this.struckThisFrame.length = 0
    // stepGloamwoodNest already holds prey at their action ring, and it does so
    // knowing where each one stood a frame ago - which is how it tells a prey
    // that closed the gap from a player who walked in. Re-running the same
    // separation here without that history treated every overlap as the prey's
    // fault and put the plough behaviour straight back.
    this.nestState = frame.state
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
        continue
      }
      if (event.type === 'wave-cleared') {
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
        this.playSound('player-hit')
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
        this.confineToArena(this.playerRoot.position)
        const held = this.map.confine(this.playerRoot.position.x, this.playerRoot.position.z)
        this.playerRoot.position.x = held.x
        this.playerRoot.position.z = held.z
        this.resolveObstacles(this.playerRoot.position)
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
      this.playSound('player-hit')
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
  private async buildValleyScenery() {
    const seed = Number(new URLSearchParams(window.location.search).get('mapSeed') ?? 0) || 0x5a11e
    // The valley scene loads its own kit templates - the same seven plants and
    // three rocks, through the same loader - so the Gloamwood's tree and rock
    // stores stay empty on this map and `createTree` is never reached.
    const valley = await buildGloamwoodValleyScene({
      seed,
      anisotropy: Math.min(8, this.renderer.capabilities.getMaxAnisotropy()),
    })
    this.scene.add(valley.root)
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
    }
  }

  private async loadModelledPrey() {
    // Only the bodies this map's creatures actually wear. A Gloamwood run does
    // not pay for the valley's boss models, and a valley run that never enters
    // a scree branch does not pay for the pebble.
    const wanted = new Map<string, GloamwoodModelledPreyConfig>()
    for (const prey of this.nestState.prey) {
      const config = this.map.bodyFor(prey)
      if (config) wanted.set(config.id, config)
    }
    for (const kind of Object.keys(GLOAMWOOD_PREY) as GloamwoodPreyKind[]) {
      const config = this.map.bodyFor({ id: `probe-${kind}`, kind } as GloamwoodNestPrey)
      if (config) wanted.set(config.id, config)
    }
    await Promise.all([...wanted.values()].map(async (config) => {
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
    }))
    // Anything already on screen keeps its primitives until it is replaced.
    for (const prey of this.nestState.prey) {
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
    for (const child of [...visual.body.children]) {
      visual.body.remove(child)
      child.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry.dispose()
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose()
      })
    }
    const body = cloneSkinnedHierarchy(template.scene)
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
    const selection = gloamwoodPreyClipForPhase(prey.phase, model.config, model.previousPhase, moving)
    const clip = model.clips.get(selection.clip)
    if (clip && (selection.clip !== model.clipName || selection.restart)) {
      const next = model.mixer.clipAction(clip)
      next.reset()
      next.setLoop(selection.once ? THREE.LoopOnce : THREE.LoopRepeat, selection.once ? 1 : Infinity)
      next.clampWhenFinished = selection.once
      // The authority decides when the blow lands; the clip is stretched onto
      // it. Nothing here ever reports back into the damage path.
      next.timeScale = selection.clip === model.config.clips.attack
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
    for (let index = 0; index < recipe.arcCount; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index === 0 ? recipe.color : recipe.accent,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(leapBite ? 0.2 : 0.16, leapBite ? 1.12 : 1.82), material)
      mesh.position.set(target.x, this.map.height(target.x, target.z) + (target.kind === 'shell' ? 1.28 : 0.94), target.z)
      mesh.rotation.set(0, -this.camera.rotation.y, leapBite ? (index === 0 ? 0.28 : Math.PI + 0.28) : (index === 0 ? -0.55 : 0.48))
      mesh.scale.setScalar(recipe.scale)
      mesh.renderOrder = 10
      this.scene.add(mesh)
      this.feedbackMeshes.push({ mesh, age: 0, duration: recipe.durationSeconds })
    }
  }

  private updateFeedback(delta: number) {
    this.cameraTrauma = Math.max(0, this.cameraTrauma - delta * 2.8)
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
    for (let index = this.feedbackMeshes.length - 1; index >= 0; index -= 1) {
      const feedback = this.feedbackMeshes[index]
      feedback.age += delta
      const progress = Math.min(1, feedback.age / feedback.duration)
      feedback.mesh.scale.multiplyScalar(1 + delta * 4.5)
      ;(feedback.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress
      if (progress >= 1) {
        feedback.mesh.geometry.dispose()
        ;(feedback.mesh.material as THREE.Material).dispose()
        this.scene.remove(feedback.mesh)
        this.feedbackMeshes.splice(index, 1)
      }
    }
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
      this.scene.remove(visual.root)
      visual.root.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry.dispose()
        const materials = Array.isArray(node.material) ? node.material : [node.material]
        for (const value of materials) value.dispose()
      })
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
      const telegraphing = prey.phase === 'telegraph'
      const telegraphProgress = telegraphing ? Math.min(1, prey.phaseElapsed / spec.telegraphSeconds) : 0
      ;(visual.telegraph.material as THREE.MeshBasicMaterial).opacity = telegraphing ? 0.18 + telegraphProgress * 0.64 : 0
      visual.telegraph.scale.setScalar(telegraphing ? 1.12 - telegraphProgress * 0.12 : 1)
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
    const presentation = this.stage === 2
      ? SCARLET_HUNTER_PRESENTATION
      : this.stage === 1
        ? SCARLET_GECKO_PRESENTATION
        : CORAL_GECKO_PRESENTATION
    const playbackRate = this.stage <= 1 && name === 'Pounce'
      ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipPlaybackRate
      : name === 'Run'
      ? presentation.animation.runPlaybackRate
      : name === 'Pounce' || name === 'Claw' || name === 'TailSwipe'
        ? SCARLET_HUNTER_PRESENTATION.combat.attackPlaybackRate[name]
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
    this.evolutionState = openGloamwoodEvolutionOffer(this.evolutionState, this.nestState.genes, this.nestState.recentHunts)
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
    const received = Math.max(1, Math.round(rawDamage * (1 - this.damageReduction) * (1 - reflect)))
    if (reflect > 0) this.reflectDamageToNearestPrey(Math.round(rawDamage * reflect))
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

  private applyProgressionModifiers() {
    const evolution = this.evolutionModifiers
    const mutation = this.mutationEffects
    this.damageMultiplier = evolution.damageMultiplier * (mutation.damageMultiplier ?? 1)
    this.moveSpeedMultiplier = evolution.moveSpeedMultiplier * (mutation.moveSpeedMultiplier ?? 1)
    this.damageReduction = evolution.damageReduction
    this.biomassMultiplier = evolution.biomassMultiplier * (mutation.biomassMultiplier ?? 1)
    // Symbiosis trades away kill healing outright, whatever granted it.
    this.killHeal = mutation.suppressKillHeal ? 0 : evolution.killHeal
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
  }

  private async chooseEvolution(index: number, nextEncounter: 'guardian' | 'boss' = 'guardian') {
    const candidate = this.evolutionState.candidates[index]
    if (!candidate || this.evolutionState.phase !== 'choosing') return
    this.evolutionState = selectGloamwoodEvolutionCandidate(this.evolutionState, candidate.id)
    this.playSound('evolution-select')
    if (this.evolutionOverlay) {
      this.evolutionOverlay.dataset.busy = 'true'
      for (const button of this.evolutionOverlay.querySelectorAll<HTMLButtonElement>('button')) button.disabled = true
    }
    this.evolutionModifiers = {
      damageMultiplier: candidate.modifiers.damageMultiplier,
      moveSpeedMultiplier: candidate.modifiers.moveSpeedMultiplier,
      damageReduction: candidate.modifiers.damageReduction,
      biomassMultiplier: candidate.modifiers.biomassMultiplier,
      killHeal: candidate.modifiers.killHeal,
      maximumHealthBonus: candidate.modifiers.maximumHealthBonus,
    }
    this.applyProgressionModifiers()
    this.attackState = createFormalHuntBasicAttackState()
    this.attackUntil = 0
    this.characterRoot.position.set(0, 0, 0)
    this.characterRoot.rotation.set(0, 0, 0)
    this.characterRoot.scale.setScalar(1)
    await this.loadCharacter(1, candidate.family)
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
    else this.startGuardianEncounter()
    this.renderer.domElement.focus()
  }

  private startGuardianEncounter() {
    this.runPhase = 'guardian'
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
    this.combatMessage = t('hud.msg.guardianRises', { name: t('creature.guardian') })
    this.syncPreyVisuals()
  }

  private startBossEncounter() {
    this.runPhase = 'boss'
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
    this.combatMessage = t('hud.msg.bossRises', { name: t('creature.boss') })
  }

  private completeRunVictory() {
    if (this.runPhase === 'victory') return
    this.runPhase = 'victory'
    this.bossLocked = false
    this.primaryHeld = false
    this.keys.clear()
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

  private showRunResult(victory: boolean, reason: string) {
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
    this.resultOverlay.innerHTML = [
      '<div class="g3d-result-panel">',
      `<span>${victory ? t('result.victory') : t('result.defeat')}</span>`,
      `<h1>${victory ? t('result.victoryLead') : t('result.defeatLead')}</h1>`,
      `<p>${reason}</p>`,
      `<aside data-pace="${pace.pace}"><strong>${pace.label}</strong><span>${pace.detail}</span></aside>`,
      '<dl>',
      `<div><dt>${t('result.time')}</dt><dd>${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}</dd></div>`,
      `<div><dt>${t('result.prey')}</dt><dd>${this.nestState.kills}</dd></div>`,
      `<div><dt>${t('result.evolution')}</dt><dd>${selected?.name ?? t('result.noEvolution')}</dd></div>`,
      `<div><dt>Boss</dt><dd>${this.bossState.health}/${this.bossState.maxHealth}</dd></div>`,
      '</dl>',
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
    hud.innerHTML = [
      `<header><span data-g3d-nest-title>${t('hud.nestTitle')}</span><strong data-g3d-message>${t('hud.initialMsg')}</strong></header>`,
      '<div class="g3d-combat-bars">',
      `<label>${t('hud.health')} <b data-g3d-player-health>100 / 100</b><i><em data-g3d-player-bar></em></i></label>`,
      '</div>',
      `<div class="g3d-nest-resources"><b data-g3d-remaining>${t('hud.undisturbed')}</b><span>${t('hud.lives')} <strong data-g3d-lives>${GLOAMWOOD_RUN_LIVES}</strong></span><span>${t('hud.biomass')} <strong data-g3d-biomass>0</strong></span><span>${t('hud.fang')} <strong data-g3d-fang>0</strong></span><span>${t('hud.shell')} <strong data-g3d-shell>0</strong></span><span>${t('hud.swarm')} <strong data-g3d-swarm>0</strong></span></div>`,
      // Mutations stack rather than replace, and a build the player cannot see
      // is a build they cannot plan around. Hidden until the first one is taken.
      '<div class="g3d-mutation-list" data-g3d-mutations hidden></div>',
      `<button class="g3d-hud-details-toggle" type="button" data-g3d-hud-details aria-expanded="false">${t('hud.expand')}</button>`,
      `<button class="g3d-fullscreen-toggle" type="button" data-g3d-fullscreen>${t('fs.enter')}</button>`,
      `<button class="g3d-settings-toggle" type="button" data-g3d-settings-toggle>${t('hud.settings')}</button>`,
    ].join('')
    this.hud = hud
    hud.dataset.mobileExpanded = 'false'
    this.container.append(hud)
    this.fullscreenToggle = hud.querySelector<HTMLButtonElement>('[data-g3d-fullscreen]') ?? undefined
    // Already launched from a home-screen icon: there is no browser chrome to hide.
    if (this.fullscreenToggle && gloamwoodStandaloneDisplay()) this.fullscreenToggle.hidden = true
    this.fullscreenToggle?.addEventListener('click', () => {
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
        sessionReport: () => summariseGloamwoodSession(this.sessionLog.all(), GLOAMWOOD_ARENA_PLAYER_RADIUS),
        sessionDump: () => JSON.stringify(this.sessionLog.all()),
      }
      ;(window as Window & { __EA_DEBUG__?: typeof api }).__EA_DEBUG__ = api
    }
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
    bar.innerHTML = '<b data-g3d-target-name></b><i><em data-g3d-target-fill></em></i>'
    this.targetBar = bar
    layer.append(bar)
  }

  private updateTargetBar() {
    const bar = this.targetBar
    if (!bar) return
    const boss = this.bossActive() && this.bossLocked
    const prey = boss ? null : this.lockedPrey()
    const live = boss
      ? { x: this.bossState.x, z: this.bossState.z, top: GLOAMWOOD_BOSS.bodyRadius * 1.9, health: this.bossState.health, max: this.bossState.maxHealth, name: t('creature.boss') }
      : prey && prey.phase !== 'dead'
        ? { x: prey.x, z: prey.z, top: gloamwoodPreyBodyRadius(prey) * 1.7, health: prey.health, max: prey.maxHealth, name: this.preyName(prey) }
        : null
    if (!live) {
      bar.hidden = true
      return
    }
    const projected = new THREE.Vector3(live.x, live.top, live.z).project(this.camera)
    if (projected.z > 1) {
      bar.hidden = true
      return
    }
    bar.hidden = false
    const x = (projected.x * 0.5 + 0.5) * this.container.clientWidth
    const y = (-projected.y * 0.5 + 0.5) * this.container.clientHeight
    bar.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
    const name = bar.querySelector<HTMLElement>('[data-g3d-target-name]')
    if (name && name.textContent !== live.name) name.textContent = live.name
    const fill = bar.querySelector<HTMLElement>('[data-g3d-target-fill]')
    if (fill) fill.style.width = `${Math.max(0, Math.min(1, live.health / Math.max(1, live.max))) * 100}%`
  }

  /**
   * @param world  where the hit landed, in world space
   * @param amount authoritative effective damage, already decided
   * @param tone   presentation only; picks colour and weight, never the number
   */
  private spawnDamageNumber(world: THREE.Vector3, amount: number, tone: 'hit' | 'weakness' | 'blocked' | 'kill' | 'player') {
    if (!this.damageLayer) return
    const element = document.createElement('span')
    element.className = 'g3d-damage-number'
    element.dataset.tone = tone
    element.textContent = String(amount)
    this.damageLayer.append(element)
    this.damageNumbers.push({
      element,
      world: world.clone(),
      life: 0,
      duration: tone === 'kill' ? 1.15 : 0.86,
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
      `<button type="button" data-g3d-setting="volume">${t('settings.volumeLabel', { value: 60 })}</button>`,
      `<button type="button" data-g3d-setting="language">${t('settings.language')}</button>`,
      `<button type="button" data-g3d-input-open>${t('settings.openInput')}</button>`,
      `<button class="primary" type="button" data-g3d-settings-resume>${t('settings.resume')}</button>`,
      `<output class="g3d-performance-readout" data-g3d-performance hidden>${t('settings.perfWaiting')}</output>`,
      `<small data-g3d-settings-summary>${t('settings.summary')}</small>`,
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
    else this.renderer.domElement.focus()
  }

  private cycleFeedbackSetting(setting: string) {
    // Language rebuilds the chrome rather than writing a feedback value, so it
    // returns before the persistence below.
    if (setting === 'language') return this.toggleLocale()
    if (setting === 'shake') this.feedbackSettings.shake = !this.feedbackSettings.shake
    else if (setting === 'flash') this.feedbackSettings.flash = !this.feedbackSettings.flash
    else if (setting === 'volume') this.feedbackSettings.volume = cycleFeedbackVolume(this.feedbackSettings.volume)
    this.audio.setVolume(this.feedbackSettings.volume)
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
    const volume = this.settingsPanel.querySelector<HTMLButtonElement>('[data-g3d-setting="volume"]')
    if (shake) shake.textContent = t('settings.shakeLabel', { state: this.feedbackSettings.shake ? t('toggle.on') : t('toggle.off') })
    if (flash) flash.textContent = t('settings.flashLabel', { state: this.feedbackSettings.flash ? t('toggle.on') : t('toggle.off') })
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
    setText('[data-g3d-remaining]', this.runPhase === 'boss'
      ? `${this.bossPatternName(this.bossState.pattern)} · ${this.bossState.state === 'telegraph' ? t('enemy.telegraph') : this.bossState.state === 'attack' ? t('enemy.strike') : t('enemy.watch')}`
      : !this.map.hasNest ? t('hud.fieldRemaining', { count: this.livePrey().length, kills: this.nestState.kills })
        : this.nestState.phase === 'dormant' ? t('hud.undisturbed') : this.nestState.phase === 'intermission' ? t('hud.incoming') : this.nestState.phase === 'cleared' ? t('hud.clearedKills', { kills: this.nestState.kills }) : t('hud.waveRemaining', { count: this.livePrey().length }))
    setText('[data-g3d-biomass]', `${this.nestState.biomass}`)
    setText('[data-g3d-fang]', `${this.nestState.genes.fang}`)
    setText('[data-g3d-shell]', `${this.nestState.genes.shell}`)
    setText('[data-g3d-swarm]', `${this.nestState.genes.swarm}`)
    setText('[data-g3d-settings-toggle]', t('hud.settingsKey', { key: formatGloamwoodInputCode(this.inputBindings.pause) }))
    this.renderPerformanceReadout()
    const playerBar = this.hud.querySelector<HTMLElement>('[data-g3d-player-bar]')
    if (playerBar) playerBar.style.width = `${Math.max(0, playerRatio) * 100}%`
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
    // The guide describes the Gloamwood's structure - a nest, waves, a
    // guardian, an evolution, a boss. On a map with none of those it walks the
    // player through an encounter that never arrives, which is worse than no
    // guide at all. The valley needs one of its own before it gets one.
    if (!this.map.hasNest) {
      this.onboardingHud.hidden = true
      return
    }
    const step = this.onboardingStep()
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


  private preyName(prey: GloamwoodNestPrey) {
    if (prey.id === GLOAMWOOD_NEST_GUARDIAN.id) return t('creature.guardian')
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
        selectedId: this.evolutionState.selected?.id ?? null,
        selectedFamily: this.evolutionState.selected?.family ?? null,
        modifiers: this.evolutionState.selected?.modifiers ?? null,
      },
      run: {
        phase: this.runPhase,
        elapsedSeconds: round(this.runElapsedSeconds()),
        deaths: this.runDeaths,
      },
      onboarding: (() => {
        const step = this.onboardingStep()
        return { phase: step.phase, step: step.step, totalSteps: step.totalSteps, title: step.title }
      })(),
      settings: { paused: this.paused, ...this.feedbackSettings },
      audio: { lastEvent: this.lastSoundEvent, eventCount: this.soundEventCount },
      input: { bindings: { ...this.inputBindings }, rebinding: this.rebindingAction },
      performance: {
        ...performanceSnapshot,
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
      preyModelError: this.preyModelError ?? null,
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
        shrinePieces: this.shrinePieces,
        collisionObstacles: this.obstacles.length,
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
    canTranslate: remainingErrorDegrees <= GLOAMWOOD_3D_MOVE_FACING_TOLERANCE_DEGREES,
  }
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
export const GLOAMWOOD_LOCK_RANGE = 22

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

