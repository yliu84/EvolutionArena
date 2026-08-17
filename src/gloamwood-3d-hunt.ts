import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  formatGloamwoodPerformanceReadout,
  GloamwoodPerformanceSampler,
  readJavaScriptHeapMegabytes,
} from './gloamwood-performance'
import { gloamwoodJoystickVector } from './gloamwood-touch-controls'

import { resolveQuality3DGLBAsset, type Quality3DFormFamily } from './quality-3d-glb-assets'
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
  createGloamwoodNestState,
  damageGloamwoodNestPrey,
  inspectGloamwoodPlayerPreyClearance,
  inspectGloamwoodPlayerPreyActionClearance,
  inspectGloamwoodPreyPairClearance,
  gloamwoodPreyBodyRadius,
  resolveGloamwoodPreyAroundPlayer,
  resolveGloamwoodPlayerPreyCollision,
  stepGloamwoodNest,
  type GloamwoodNestPrey,
  type GloamwoodNestState,
  type GloamwoodPreyKind,
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

const WORLD_HALF_WIDTH = 25
const WORLD_HALF_DEPTH = 18
const PLAYER_SPEED = 6.2
const GLOAMWOOD_BOSS_ARENA = { x: 0, z: 0, playerX: -6, playerZ: 3 } as const
const GLOAMWOOD_BOSS_ARENA_RADIUS = 4.2
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

export function gloamwoodCharacterWorldHeight(stage: number) {
  return GLOAMWOOD_3D_CHARACTER_HEIGHTS[stage >= 2 ? 2 : stage >= 1 ? 1 : 0]
}

/**
 * True when the page was launched from a home-screen icon rather than a browser
 * tab. iOS reports this only through the non-standard `navigator.standalone`.
 */
function gloamwoodStandaloneDisplay() {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

function gloamwoodPlayerCombatBodyRadius(stage: number) {
  const profile = getGloamwoodPlayerCollisionProfile(stage)
  const neutralRadius = profile.radius + Math.max(profile.frontOffset, profile.rearOffset)
  const stageOnePounceReserve = stage === 1
    ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.visualTravel * SCARLET_GECKO_PRESENTATION.combat.pounceVisualTravelScale
    : 0
  return neutralRadius + stageOnePounceReserve
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
  prey: Array<{ id: string; kind: GloamwoodPreyKind; health: number; phase: string; x: number; z: number }>
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
  document.title = '进化竞技场 Lite · 幽影林地 3D 重制'
  const experience = new Gloamwood3DHunt(container)
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
  private readonly feedbackMeshes: Array<{ mesh: THREE.Mesh; age: number; duration: number }> = []
  private readonly dustParticles: DustParticle[] = []
  private readonly footstepState = createGloamwoodFootstepState()
  private nestState: GloamwoodNestState = createGloamwoodNestState()
  private playerCombat: GloamwoodPlayerCombatState = createGloamwoodPlayerCombatState()
  private attackState: FormalHuntBasicAttackState = createFormalHuntBasicAttackState()
  private combatProfile: FormalHuntBasicAttackProfile = CORAL_GECKO_PRESENTATION.combat
  private evolutionState: GloamwoodEvolutionState
  private evolutionOverlay?: HTMLElement
  private evolutionAccent?: THREE.Group
  private bossState: GloamwoodBossState = createGloamwoodBossState(GLOAMWOOD_BOSS_ARENA.x, GLOAMWOOD_BOSS_ARENA.z)
  private bossVisual?: BossVisual
  private bossLocked = false
  private runPhase: GloamwoodRunPhase = 'hunt'
  private runStartedAt = performance.now()
  private runDeaths = 0
  private resultOverlay?: HTMLElement
  private damageMultiplier = 1
  private moveSpeedMultiplier = 1
  private damageReduction = 0
  private biomassMultiplier = 1
  private killHeal = 0
  private stage = 0
  /** Gene family whose body the player currently wears; undefined before evolving. */
  private characterFamily?: Quality3DFormFamily
  /** False when the route had no authored model and borrowed another family's. */
  private characterFamilyMatched = true
  private lockedPreyId: string | null = null
  private primaryHeld = false
  private touchMoveX = 0
  private touchMoveZ = 0
  private movementInputStrength = 0
  private hitStopRemaining = 0
  private cameraTrauma = 0
  private playerFlashRemaining = 0
  private knockbackRecoverySeconds = 0
  private lastKnockbackDistance = 0
  private combatMessage = '接近腐根孵育巢开始清理'
  private hud?: HTMLElement
  private onboardingHud?: HTMLElement
  private settingsPanel?: HTMLElement
  private orientationGate?: HTMLElement
  private fullscreenToggle?: HTMLButtonElement
  private homeScreenTip?: HTMLElement
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
  private treeCount = 0
  private rockCount = 0
  private shrinePieces = 0
  private collisionContacts = 0
  private debugOutput?: HTMLOutputElement
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
    this.renderer.domElement.setAttribute('aria-label', '幽影林地 3D 狩猎地图')
    this.container.append(this.renderer.domElement)
    this.playerRoot.add(this.characterRoot)
    this.scene.add(this.playerRoot)
    this.scene.add(this.nestRoot)
  }

  async start() {
    this.createLighting()
    this.createTerrain()
    this.createPath()
    await this.loadEnvironmentModels()
    this.createForest()
    this.createUndergrowth()
    this.createShrine()
    this.createAtmosphere()
    this.createContactShadows()
    this.createDustPool()
    this.createNest()
    this.createBossVisual()
    this.createHud()
    this.bindInput()
    const debugSettings = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
    if (debugSettings?.get('settings') === '1' || debugSettings?.get('inputSettings') === '1') this.toggleSettings(true)
    if (debugSettings?.get('inputSettings') === '1') this.showInputSettings(true)
    this.resize()
    const spawnAtNestForDebug = import.meta.env.DEV
      && new URLSearchParams(window.location.search).get('spawnNest') === '1'
    this.playerRoot.position.set(
      spawnAtNestForDebug ? 0 : -6,
      0,
      spawnAtNestForDebug ? GLOAMWOOD_NEST.centerZ : 3,
    )
    this.target.copy(this.playerRoot.position)
    this.camera.position.copy(this.playerRoot.position).add(CAMERA_OFFSET)
    this.camera.lookAt(this.playerRoot.position.x, CAMERA_LOOK_HEIGHT, this.playerRoot.position.z)
    await this.loadCharacter()
    const debugParams = new URLSearchParams(window.location.search)
    if (import.meta.env.DEV && debugParams.get('bossGate') === '1') {
      this.openEvolutionGateForDebug()
      const choice = THREE.MathUtils.clamp(Number(debugParams.get('evolutionChoice')) || 0, 0, 2)
      await this.chooseEvolution(choice, 'boss')
    } else if (import.meta.env.DEV && debugParams.get('evolutionGate') === '1') {
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
    this.settingsPanel?.remove()
    this.orientationGate?.remove()
    this.homeScreenTip?.remove()
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
    const groundTexture = new THREE.TextureLoader().load('/assets/terrain/forest.jpg')
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
        new THREE.Vector3(x, terrainHeight(x, z) + 0.014, z),
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
        vertices.push(point.x + normal.x * width * side, terrainHeight(point.x, point.z) + 0.045, point.z + normal.z * width * side)
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
    const dirtTexture = new THREE.TextureLoader().load('/assets/terrain/dirt.jpg')
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
      matrix.compose(new THREE.Vector3(x, terrainHeight(x, z) + 0.08, z), new THREE.Quaternion().random(), new THREE.Vector3(scale, scale * 0.55, scale))
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
            new THREE.Vector3(spot.x, terrainHeight(spot.x, spot.z) - 0.02, spot.z),
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
    interface KitGrade {
      saturation: number
      exposure: number
      tint: readonly [number, number, number]
      windAmp: number
    }
    const TREE_GRADE: KitGrade = { saturation: -0.06, exposure: 0.72, tint: [0.92, 0.98, 0.86], windAmp: 0.038 }
    const ROCK_GRADE: KitGrade = { saturation: -0.12, exposure: 0.68, tint: [1, 1, 1], windAmp: 0 }
    const VEGETATION_GRADE: KitGrade = { saturation: -0.02, exposure: 0.92, tint: [1.02, 1.06, 0.78], windAmp: 0.22 }
    const loadTemplate = async (url: string, mode: 'height' | 'lateral', grade: KitGrade) => {
      const gltf = await this.loader.loadAsync(url)
      const source = gltf.scene
      source.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.castShadow = true
        node.receiveShadow = true
        const hasVertexColors = Boolean(node.geometry.attributes.color)
        node.material = Array.isArray(node.material)
          ? node.material.map((material) => this.toKitMaterial(material, grade, hasVertexColors))
          : this.toKitMaterial(node.material, grade, hasVertexColors)
      })
      const box = new THREE.Box3().setFromObject(source)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      source.position.set(-center.x, -box.min.y, -center.z)
      const wrapper = new THREE.Group()
      wrapper.add(source)
      const extent = mode === 'height' ? size.y : Math.max(size.x, size.z)
      wrapper.scale.setScalar(1 / Math.max(extent, 0.0001))
      return wrapper
    }
    const uniqueTrees = [...new Map(GLOAMWOOD_TREE_VARIANTS.map((variant) => [variant.id, variant])).values()]
    await Promise.all([
      ...uniqueTrees.map(async (variant) => {
        this.treeTemplates.set(variant.id, await loadTemplate(variant.url, 'height', TREE_GRADE))
      }),
      ...GLOAMWOOD_ROCK_VARIANTS.map(async (variant) => {
        this.rockTemplates.set(variant.id, await loadTemplate(variant.url, 'lateral', ROCK_GRADE))
      }),
      ...GLOAMWOOD_VEGETATION_VARIANTS.map(async (variant) => {
        this.vegetationTemplates.set(variant.id, await loadTemplate(variant.url, variant.mode, VEGETATION_GRADE))
      }),
    ])
  }

  private toKitMaterial(
    material: THREE.Material,
    grade: { saturation: number; exposure: number; tint: readonly [number, number, number]; windAmp: number },
    vertexColors: boolean,
  ) {
    const color = 'color' in material && material.color instanceof THREE.Color
      ? material.color.clone()
      : new THREE.Color(0xffffff)
    color.offsetHSL(0, grade.saturation, 0)
    color.multiplyScalar(grade.exposure)
    color.r *= grade.tint[0]
    color.g *= grade.tint[1]
    color.b *= grade.tint[2]
    const map = 'map' in material && material.map instanceof THREE.Texture ? material.map : null
    const name = `${material.name} ${map?.name ?? ''}`
    const isFoliage = material.transparent
      || material.alphaTest > 0
      || /leaf|leaves|grass|fern|plant|bush/i.test(name)
    const lit = new THREE.MeshStandardMaterial({
      color,
      map,
      roughness: 0.92,
      metalness: 0,
      // Foliage vertex colors in this kit darken billboard cards to near-black
      // under the overhead camera; keep them on bark/rock only.
      vertexColors: vertexColors && !isFoliage,
      side: isFoliage ? THREE.DoubleSide : THREE.FrontSide,
      alphaTest: isFoliage && map ? 0.18 : 0,
      transparent: false,
      depthWrite: true,
    })
    if (isFoliage && grade.windAmp > 0) this.applyFoliageWind(lit, grade.windAmp)
    return lit
  }

  private applyFoliageWind(material: THREE.MeshStandardMaterial, amplitude: number) {
    const time = this.foliageTime
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uFoliageTime = time
      shader.uniforms.uWindAmp = { value: amplitude }
      shader.vertexShader = `uniform float uFoliageTime;\nuniform float uWindAmp;\n${shader.vertexShader}`
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          float lift = clamp(transformed.y * 0.18, 0.0, 1.0);
          vec3 windPos = transformed;
          #ifdef USE_INSTANCING
            windPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
          #endif
          float gust = sin(uFoliageTime * 1.18 + windPos.x * 0.42 + windPos.z * 0.31);
          transformed.x += gust * uWindAmp * lift;
          transformed.z += cos(uFoliageTime * 0.94 + windPos.z * 0.27) * uWindAmp * 0.65 * lift;
        }`,
      )
    }
    material.customProgramCacheKey = () => `gloamwood-foliage-wind:${amplitude}`
  }

  private createTree(x: number, z: number, scale: number, index: number) {
    const variant = treeVariantForIndex(index)
    const template = this.treeTemplates.get(variant.id)
    if (!template) return
    const footprint = treeFootprint(variant, treeSizeFactor(scale))
    const group = template.clone(true)
    group.scale.multiplyScalar(footprint.height)
    group.position.set(x, terrainHeight(x, z), z)
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
    rock.position.set(x, terrainHeight(x, z) - footprint.diameter * 0.05, z)
    rock.rotation.y = randomValue * Math.PI * 2
    this.scene.add(rock)
    this.obstacles.push({ id: `rock-${index}`, kind: 'rock', x, z, radius: footprint.radius })
    this.rockCount += 1
  }

  private createShrine() {
    const center = new THREE.Vector3(8, terrainHeight(8, -5), -5)
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
      shaft.position.set(x, terrainHeight(x, z) + 4.4, z)
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
    this.nestRoot.position.set(GLOAMWOOD_NEST.centerX, terrainHeight(GLOAMWOOD_NEST.centerX, GLOAMWOOD_NEST.centerZ) + 0.94, GLOAMWOOD_NEST.centerZ)
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
    const visual = { root, body, materials, telegraph, targetRing, flashRemaining: 0, impactRemaining: 0, impactDuration: 0.22, impactStrength: 0 }
    this.preyVisuals.set(prey.id, visual)
    return visual
  }

  private async loadCharacter(stageOverride?: number, familyOverride?: Quality3DFormFamily) {
    const params = new URLSearchParams(window.location.search)
    const requestedStage = stageOverride ?? Number(params.get('evolutionStage'))
    const stage = requestedStage >= 2 ? 2 : requestedStage >= 1 ? 1 : 0
    this.stage = stage
    if (familyOverride) this.characterFamily = familyOverride
    this.combatProfile = stage >= 2
      ? SCARLET_HUNTER_PRESENTATION.combat
      : stage >= 1
        ? SCARLET_GECKO_PRESENTATION.combat
        : CORAL_GECKO_PRESENTATION.combat
    const resolved = resolveQuality3DGLBAsset(stage, this.characterFamily)
    const asset = resolved.asset
    this.characterFamilyMatched = resolved.matchedFamily
    if (!asset) throw new Error(`Missing stage-${stage} GLB`)
    const gltf = await this.loader.loadAsync(asset.url)
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
        } else if (stage === 1) {
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
    const scale = gloamwoodCharacterWorldHeight(stage) / Math.max(0.001, size.y)
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
      this.primaryHeld = true
      if (!event.repeat) this.requestPrimaryAttack()
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
      this.combatMessage = `已锁定 · ${GLOAMWOOD_BOSS.name}`
      return
    }
    for (const prey of this.livePrey()) {
      const visual = this.preyVisuals.get(prey.id)
      if (visual && this.raycaster.intersectObject(visual.root, true)[0]) {
        this.lockedPreyId = prey.id
        this.combatMessage = `已锁定 · ${this.preyName(prey)}`
        return
      }
    }
    if (!this.ground) return
    const intersection = this.raycaster.intersectObject(this.ground, false)[0]
    if (intersection) this.target.set(intersection.point.x, 0, intersection.point.z)
  }

  private tick = () => {
    if (this.disposed) return
    this.animationFrame = requestAnimationFrame(this.tick)
    const now = performance.now()
    const frameMilliseconds = Math.max(0, now - this.lastFrameAt)
    this.performanceSampler.record(frameMilliseconds)
    const delta = Math.min(0.05, frameMilliseconds / 1000)
    this.lastFrameAt = now
    this.foliageTime.value += delta
    this.updateFeedback(delta)
    if (this.paused) {
      this.renderer.render(this.scene, this.camera)
      this.updateHud()
      this.updateDebug()
      return
    }
    if (this.evolutionState.phase === 'choosing') {
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
    this.updateCamera(delta)
    this.renderer.render(this.scene, this.camera)
    this.updateHud()
    this.updateDebug()
  }

  private updatePlayer(delta: number) {
    const inputX = Number(this.keys.has(this.inputBindings.moveRight) || this.keys.has('ArrowRight')) - Number(this.keys.has(this.inputBindings.moveLeft) || this.keys.has('ArrowLeft')) + this.touchMoveX
    const inputZ = Number(this.keys.has(this.inputBindings.moveDown) || this.keys.has('ArrowDown')) - Number(this.keys.has(this.inputBindings.moveUp) || this.keys.has('ArrowUp')) + this.touchMoveZ
    const cameraRelativeInput = gloamwoodScreenMovementVector(inputX, inputZ)
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
      next.x = THREE.MathUtils.clamp(next.x, -WORLD_HALF_WIDTH, WORLD_HALF_WIDTH)
      next.z = THREE.MathUtils.clamp(next.z, -WORLD_HALF_DEPTH, WORLD_HALF_DEPTH)
      this.resolveObstacles(next)
      this.playerRoot.position.x = next.x
      this.playerRoot.position.z = next.z
    }
    this.playerRoot.position.y = terrainHeight(this.playerRoot.position.x, this.playerRoot.position.z)
    if (!this.playerCombat.alive) {
      this.setAction('Death')
      return
    }
    if (this.attackState.action) return
    this.setAction(this.turning ? 'Turn' : this.moving ? 'Run' : 'Idle')
  }

  private requestPrimaryAttack() {
    if (this.evolutionState.phase === 'choosing') return
    if (!this.playerCombat.alive) return
    if (this.nestState.phase === 'dormant') {
      this.combatMessage = '靠近腐根孵育巢以开始清理'
      return
    }
    if (this.runPhase === 'victory' || this.runPhase === 'defeat') return
    if (this.bossActive()) {
      this.bossLocked = true
      this.lockedPreyId = null
    } else if (this.nestState.phase === 'cleared') {
      this.combatMessage = this.evolutionState.phase === 'selected' ? '荆心守卫即将苏醒' : '窝点已清理 · 请先选择进化'
      return
    }
    if (!this.bossActive() && !this.lockedPrey()) this.lockedPreyId = this.nearestLivePrey()?.id ?? null
    if (!this.bossLocked && !this.lockedPreyId) {
      this.combatMessage = '增援正在逼近'
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
      this.combatMessage = `已锁定 · ${GLOAMWOOD_BOSS.name}`
      return
    }
    const nextId = nextGloamwoodLockTarget(
      this.nestState.prey,
      this.lockedPreyId,
      { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
    )
    if (!nextId) {
      this.lockedPreyId = null
      this.combatMessage = this.nestState.phase === 'cleared' ? '窝点已清理' : '当前没有可锁定目标'
      return
    }
    const next = this.nestState.prey.find((prey) => prey.id === nextId)!
    this.lockedPreyId = nextId
    this.combatMessage = `已锁定 · ${this.preyName(next)}`
  }

  private updateCombat(now: number, delta: number) {
    this.knockbackRecoverySeconds = Math.max(0, this.knockbackRecoverySeconds - delta)
    const previousAlive = this.playerCombat.alive
    this.playerCombat = stepGloamwoodPlayerCombat(this.playerCombat, delta)
    if (!previousAlive && this.playerCombat.alive) {
      this.playerCombat = { ...this.playerCombat, invulnerabilitySeconds: 1.5 }
      this.playerRoot.position.set(GLOAMWOOD_3D_COMBAT.playerSpawnX, 0, GLOAMWOOD_3D_COMBAT.playerSpawnZ)
      this.target.copy(this.playerRoot.position)
      this.attackState = createFormalHuntBasicAttackState()
      this.combatMessage = '重新投入狩猎'
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
    this.combatMessage = `攻击 · ${this.attackName(action)}`
  }

  private resolvePlayerContact(action: FormalHuntBasicAttackAction) {
    if (this.bossActive() && this.bossLocked) {
      this.resolveBossContact(action)
      return
    }
    const target = this.lockedPrey()
    if (!target) {
      this.combatMessage = '挥空 · 没有锁定目标'
      return
    }
    const dx = target.x - this.playerRoot.position.x
    const dz = target.z - this.playerRoot.position.z
    const distance = Math.hypot(dx, dz)
    const targetRadius = gloamwoodPreyBodyRadius(target)
    const surfaceDistance = formalHuntTargetSurfaceDistance(distance, targetRadius)
    const targetFacing = gloamwoodMovementFacingRadians(dx, dz)
    const range = action === 'Pounce'
      ? this.stage >= 2
        ? SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.pounceRange
        : CORAL_GECKO_PRESENTATION.combat.hitFeedback.pounceRange
      : action === 'Claw'
        ? SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.clawRange
        : action === 'TailSwipe'
          ? SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.tailSwipeRange
          : 2.72
    const valid = canFormalHuntBasicAttackContact({
      targetLocked: this.lockedPreyId === target.id,
      targetAvailable: target.phase !== 'dead',
      distance,
      range,
      aimErrorDegrees: formalHuntAttackAimErrorDegrees(this.lastFacing, targetFacing),
      targetRadius,
    })
    if (!valid) {
      this.combatMessage = surfaceDistance > range ? '挥空 · 目标超出攻击距离' : '挥空 · 接触角度超过 8°'
      return
    }
    const knockback = action === 'TailSwipe' ? 0.72 : action === 'Pounce' ? 0.52 : 0.34
    const baseDamage = action === 'Pounce'
      ? this.stage >= 2
        ? SCARLET_HUNTER_PRESENTATION.combat.hitFeedback.pounceDamage
        : CORAL_GECKO_PRESENTATION.combat.hitFeedback.pounceDamage
      : GLOAMWOOD_3D_COMBAT.attackDamage[action]
    const damage = damageGloamwoodNestPrey(
      this.nestState,
      target.id,
      Math.round(baseDamage * this.damageMultiplier),
      action,
      { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
      knockback,
    )
    this.nestState = damage.state
    this.playSound(damage.killed ? 'kill' : action === 'Pounce' || action === 'TailSwipe' ? 'hit-heavy' : 'hit-light')
    let displayedBiomass = damage.biomassGained
    if (damage.killed && this.biomassMultiplier !== 1) {
      displayedBiomass = Math.round(damage.biomassGained * this.biomassMultiplier)
      this.nestState = { ...this.nestState, biomass: this.nestState.biomass + displayedBiomass - damage.biomassGained }
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
      visual.impactStrength = action === 'TailSwipe' ? 1 : action === 'Pounce' ? 0.94 : 0.76
    }
    this.spawnSlashFeedback(action, target)
    if (damage.killed) {
      this.combatMessage = target.id === GLOAMWOOD_NEST_GUARDIAN.id
        ? `破防 · ${GLOAMWOOD_NEST_GUARDIAN.displayName}已倒下 · 终局猎杀通道开启`
        : `击杀 · ${this.preyName(target)} · +${displayedBiomass} 生物质 · +1 ${this.geneName(target.kind)}`
      this.lockedPreyId = this.nearestLivePrey()?.id ?? null
    } else if (damage.blocked) {
      this.combatMessage = `正面格挡 · 仅造成 ${damage.effectiveDamage} 伤害 · 绕到岩盾背后`
    } else {
      this.combatMessage = `${this.attackName(action)}命中 · ${damage.effectiveDamage} 伤害`
    }
  }

  private resolveBossContact(action: FormalHuntBasicAttackAction) {
    const dx = this.bossState.x - this.playerRoot.position.x
    const dz = this.bossState.z - this.playerRoot.position.z
    const distance = Math.hypot(dx, dz)
    const surfaceDistance = formalHuntTargetSurfaceDistance(distance, GLOAMWOOD_BOSS.bodyRadius)
    const targetFacing = gloamwoodMovementFacingRadians(dx, dz)
    const hitFeedback = this.combatHitFeedback()
    const range = action === 'Pounce'
      ? hitFeedback.pounceRange
      : action === 'Claw'
        ? hitFeedback.clawRange
        : action === 'TailSwipe'
          ? hitFeedback.tailSwipeRange
          : hitFeedback.biteRange
    const valid = canFormalHuntBasicAttackContact({
      targetLocked: this.bossLocked,
      targetAvailable: this.bossActive(),
      distance,
      range,
      aimErrorDegrees: formalHuntAttackAimErrorDegrees(this.lastFacing, targetFacing),
      targetRadius: GLOAMWOOD_BOSS.bodyRadius,
    })
    if (!valid) {
      this.combatMessage = surfaceDistance > range ? '挥空 · Boss 超出攻击距离' : '挥空 · 接触角度超过 8°'
      return
    }
    const baseDamage = action === 'Pounce'
      ? hitFeedback.pounceDamage
      : action === 'Claw'
        ? hitFeedback.clawDamage
        : action === 'TailSwipe'
          ? hitFeedback.tailSwipeDamage
          : hitFeedback.biteDamage
    const result = damageGloamwoodBoss(this.bossState, baseDamage * this.damageMultiplier)
    this.bossState = result.state
    if (result.effectiveDamage <= 0) return
    this.playSound(result.defeated ? 'kill' : action === 'Pounce' || action === 'TailSwipe' ? 'hit-heavy' : 'hit-light')
    this.hitStopRemaining = result.defeated ? 0.13 : 0.065
    this.cameraTrauma = Math.min(1, this.cameraTrauma + (result.defeated ? 0.9 : 0.5))
    this.spawnBossHitFeedback(action)
    this.combatMessage = result.defeated
      ? `${GLOAMWOOD_BOSS.name}已倒下 · 幽影林地已净化`
      : `${this.attackName(action)}命中 Boss · ${result.effectiveDamage} 伤害`
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
    return this.stage >= 2
      ? SCARLET_HUNTER_PRESENTATION.combat.hitFeedback
      : this.stage >= 1
        ? SCARLET_GECKO_PRESENTATION.combat.hitFeedback
        : CORAL_GECKO_PRESENTATION.combat.hitFeedback
  }

  private updateEnemy(delta: number) {
    if (this.bossActive()) {
      this.updateBoss(delta)
      return
    }
    const frame = stepGloamwoodNest(this.nestState, delta, {
      x: this.playerRoot.position.x,
      z: this.playerRoot.position.z,
      alive: this.playerCombat.alive,
      bodyRadius: gloamwoodPlayerCombatBodyRadius(this.stage),
    })
    this.nestState = {
      ...frame.state,
      prey: resolveGloamwoodPreyAroundPlayer(
        frame.state.prey,
        { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
        gloamwoodPlayerCombatBodyRadius(this.stage),
      ),
    }
    if (this.runPhase === 'guardian') {
      this.nestState = {
        ...this.nestState,
        prey: this.nestState.prey.map((prey) => clampGloamwoodPreyToArena(prey, GLOAMWOOD_BOSS_ARENA, GLOAMWOOD_BOSS_ARENA_RADIUS)),
      }
    }
    for (const event of frame.events) {
      if (event.type === 'nest-started') {
        this.combatMessage = '腐根孵育巢苏醒 · 第一波来袭'
        continue
      }
      if (event.type === 'wave-started') {
        this.lockedPreyId = nextGloamwoodLockTarget(
          this.nestState.prey,
          null,
          { x: this.playerRoot.position.x, z: this.playerRoot.position.z },
        )
        this.combatMessage = `第 ${event.wave} 波 · ${this.waveHint(event.wave)}`
        continue
      }
      if (event.type === 'wave-cleared') {
        this.lockedPreyId = null
        this.combatMessage = event.wave >= GLOAMWOOD_NEST.waveCount ? '最后一波已击溃' : `第 ${event.wave} 波清理完成 · 警惕增援`
        continue
      }
      if (event.type === 'nest-cleared') {
        this.lockedPreyId = null
        if (this.runPhase === 'guardian') {
          this.combatMessage = `${GLOAMWOOD_NEST_GUARDIAN.displayName}已被击破 · 荒林中心出现异动`
          this.startBossEncounter()
          continue
        }
        this.combatMessage = `窝点清理完成 · ${event.biomass} 生物质 · 进化候选已形成`
        this.evolutionState = openGloamwoodEvolutionOffer(this.evolutionState, this.nestState.genes, this.nestState.recentHunts)
        this.runPhase = 'evolution'
        this.showEvolutionOverlay()
        continue
      }
      if (event.type !== 'prey-attack') continue
      const attacker = this.nestState.prey.find((prey) => prey.id === event.preyId)
      if (!attacker) continue
      const previousHealth = this.playerCombat.health
      const receivedDamage = Math.max(1, Math.round(event.damage * (1 - this.damageReduction)))
      this.playerCombat = damageGloamwoodPlayer(this.playerCombat, receivedDamage)
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
        this.playerRoot.position.x = THREE.MathUtils.clamp(this.playerRoot.position.x, -WORLD_HALF_WIDTH, WORLD_HALF_WIDTH)
        this.playerRoot.position.z = THREE.MathUtils.clamp(this.playerRoot.position.z, -WORLD_HALF_DEPTH, WORLD_HALF_DEPTH)
        this.resolveObstacles(this.playerRoot.position)
        // Knockback is a completed hit reaction, not a new move command. Reset
        // the click-to-move destination so the controller does not immediately
        // auto-run back into the attacker after every impact.
        this.target.copy(this.playerRoot.position)
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.48)
        this.playerFlashRemaining = this.feedbackSettings.flash ? 0.18 : 0
        this.combatMessage = this.playerCombat.alive ? `受到 ${receivedDamage} 伤害` : '倒下 · 即将重返狩猎'
        if (!this.playerCombat.alive) {
          this.attackState = createFormalHuntBasicAttackState()
          this.lockedPreyId = null
          if (this.runPhase === 'guardian') this.completeRunDefeat(`${GLOAMWOOD_NEST_GUARDIAN.displayName}的重击终结了本次狩猎`)
          else this.resetLivePreyToNest()
        }
      }
    }
    this.syncPreyVisuals()
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
        this.combatMessage = `${GLOAMWOOD_BOSS.name}暴走 · 第二阶段攻势加快`
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.74)
        continue
      }
      if (event.type !== 'boss-attack') continue
      const receivedDamage = Math.max(1, Math.round(event.damage * (1 - this.damageReduction)))
      const previousHealth = this.playerCombat.health
      this.playerCombat = damageGloamwoodPlayer(this.playerCombat, receivedDamage)
      if (this.playerCombat.health >= previousHealth) continue
      this.playSound('player-hit')
      const dx = this.playerRoot.position.x - this.bossState.x
      const dz = this.playerRoot.position.z - this.bossState.z
      const inverse = 1 / Math.max(0.001, Math.hypot(dx, dz))
      const knockback = Math.min(0.78, event.knockback * 0.38)
      this.playerRoot.position.x += dx * inverse * knockback
      this.playerRoot.position.z += dz * inverse * knockback
      this.resolveObstacles(this.playerRoot.position)
      this.target.copy(this.playerRoot.position)
      this.playerFlashRemaining = this.feedbackSettings.flash ? 0.2 : 0
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.66)
      this.combatMessage = this.playerCombat.alive
        ? `${this.bossPatternName(event.pattern)}命中 · 受到 ${receivedDamage} 伤害`
        : `${this.bossPatternName(event.pattern)}致命 · 本局失败`
      if (!this.playerCombat.alive) this.completeRunDefeat(`${this.bossPatternName(event.pattern)}命中时未离开预警区`)
    }
    this.syncBossVisual()
  }

  private syncBossVisual() {
    const visual = this.bossVisual
    if (!visual) return
    visual.root.visible = this.runPhase === 'boss' || this.runPhase === 'victory'
    visual.root.position.set(this.bossState.x, terrainHeight(this.bossState.x, this.bossState.z), this.bossState.z)
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
    visual.body.position.x = strike * 0.65
    visual.body.position.y = this.bossState.phase === 2 ? Math.sin(performance.now() * 0.009) * 0.05 : 0
    for (const material of visual.materials) material.emissiveIntensity = this.bossState.phase === 2 ? 0.78 : 0.42
  }

  private bossPatternName(pattern: GloamwoodBossState['pattern']) {
    if (pattern === 'root-slam') return '根须震击'
    if (pattern === 'thorn-charge') return '荆棘冲锋'
    return '孢子环爆'
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
      mesh.position.set(target.x, terrainHeight(target.x, target.z) + (target.kind === 'shell' ? 1.28 : 0.94), target.z)
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

  private syncPreyVisuals() {
    const activeIds = new Set(this.nestState.prey.map((prey) => prey.id))
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
      const visual = this.preyVisuals.get(prey.id) ?? this.createPreyVisual(prey)
      const spec = GLOAMWOOD_PREY[prey.kind]
      visual.root.position.set(prey.x, terrainHeight(prey.x, prey.z), prey.z)
      visual.root.rotation.y = prey.facingRadians
      visual.root.visible = true
      visual.targetRing.visible = prey.phase !== 'dead' && this.lockedPreyId === prey.id
      const telegraphing = prey.phase === 'telegraph'
      const telegraphProgress = telegraphing ? Math.min(1, prey.phaseElapsed / spec.telegraphSeconds) : 0
      ;(visual.telegraph.material as THREE.MeshBasicMaterial).opacity = telegraphing ? 0.18 + telegraphProgress * 0.64 : 0
      visual.telegraph.scale.setScalar(telegraphing ? 1.12 - telegraphProgress * 0.12 : 1)
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
      particle.sprite.position.set(x, terrainHeight(x, z) + 0.11 + (index % 2) * 0.04, z)
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

  private attackName(action: FormalHuntBasicAttackAction) {
    if (this.stage === 0) {
      if (action === 'Bite') return CORAL_GECKO_PRESENTATION.combat.attackNames.Bite
      if (action === 'Pounce') return CORAL_GECKO_PRESENTATION.combat.attackNames.Pounce
      if (action === 'TailSwipe') return CORAL_GECKO_PRESENTATION.combat.attackNames.TailSwipe
    }
    if (this.stage === 1) {
      if (action === 'Bite') return SCARLET_GECKO_PRESENTATION.combat.attackNames.Bite
      if (action === 'Pounce') return SCARLET_GECKO_PRESENTATION.combat.attackNames.Pounce
      if (action === 'TailSwipe') return SCARLET_GECKO_PRESENTATION.combat.attackNames.TailSwipe
    }
    if (action === 'Bite') return '撕咬'
    return SCARLET_HUNTER_PRESENTATION.combat.attackNames[action]
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
    return kind === 'fang' ? '裂牙基因' : kind === 'shell' ? '岩盾基因' : '群生基因'
  }

  private waveHint(wave: number) {
    if (wave === 1) return '快速裂牙会主动夹击'
    if (wave === 2) return '绕开岩盾正面，先处理群虫'
    return '混合生态群 · 选择正确攻击与站位'
  }

  private resetLivePreyToNest() {
    const living = this.nestState.prey.filter((prey) => prey.phase !== 'dead')
    const count = Math.max(1, living.length)
    this.nestState = {
      ...this.nestState,
      prey: this.nestState.prey.map((prey) => {
        if (prey.phase === 'dead') return prey
        const angle = prey.slot / count * Math.PI * 2 + this.nestState.wave * 0.55
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
    const collision = resolveGloamwoodPlayerCollision(next, this.lastFacing, this.stage, this.obstacles)
    next.x = collision.x
    next.z = collision.z
    const bodyRadius = gloamwoodPlayerCombatBodyRadius(this.stage)
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
      const worldCorrection = resolveGloamwoodPlayerCollision(next, this.lastFacing, this.stage, this.obstacles)
      next.x = worldCorrection.x
      next.z = worldCorrection.z
      this.collisionContacts = collision.contacts + preyCollision.contacts + worldCorrection.contacts
    } else this.collisionContacts = collision.contacts
  }

  private updateCamera(delta: number) {
    this.desiredCamera.copy(this.playerRoot.position).add(CAMERA_OFFSET)
    this.camera.position.lerp(this.desiredCamera, 1 - Math.exp(-CAMERA_DAMPING * delta))
    if (this.cameraTrauma > 0 && this.feedbackSettings.shake && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const phase = performance.now() * 0.047
      this.camera.position.x += Math.sin(phase) * this.cameraTrauma * 0.2
      this.camera.position.y += Math.cos(phase * 1.37) * this.cameraTrauma * 0.13
    }
    this.camera.lookAt(this.playerRoot.position.x, this.playerRoot.position.y + CAMERA_LOOK_HEIGHT, this.playerRoot.position.z)
    this.updateTreeOcclusion()
  }

  private updateTreeOcclusion() {
    const fromX = this.playerRoot.position.x
    const fromY = this.playerRoot.position.y + CAMERA_LOOK_HEIGHT
    const fromZ = this.playerRoot.position.z
    const toX = this.camera.position.x
    const toY = this.camera.position.y
    const toZ = this.camera.position.z
    for (const tree of this.trees) {
      const blocksView = distanceToSegment3D(tree.x, tree.y, tree.z, fromX, fromY, fromZ, toX, toY, toZ) < tree.radius
        && squaredDistance(tree.x, tree.z, fromX, fromZ) < squaredDistance(toX, toZ, fromX, fromZ)
      tree.group.visible = !blocksView
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
    const clipName = this.stage <= 1 && name === 'Pounce'
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
      overlay.setAttribute('aria-label', '选择第一次随机进化')
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
      '<div class="g3d-evolution-panel">',
      '<header><span>第一次进化 · 猎食塑形</span><h1>你吃掉了什么，身体就更可能成为什么</h1>',
      `<p>本次种子 <code>${this.evolutionState.seed}</code> · 三项均为带代价的实战构筑，不是单纯换皮。</p></header>`,
      '<div class="g3d-evolution-choices">',
      ...this.evolutionState.candidates.map((candidate, index) => [
        `<button data-evolution-choice="${index}" data-family="${candidate.family}">`,
        `<span><kbd>${index + 1}</kbd>${candidate.familyName}路线 · 权重 ${candidate.probability}%</span>`,
        `<strong>${candidate.name}</strong>`,
        `<b>${candidate.statLine}</b>`,
        `<p>${candidate.description}</p>`,
        `<small>${candidate.reason}</small>`,
        '</button>',
      ].join('')),
      '</div>',
      '<footer>',
      `<button data-evolution-refresh ${this.evolutionState.refreshesRemaining <= 0 ? 'disabled' : ''}>抗拒这组 <small>R · 剩余 ${this.evolutionState.refreshesRemaining} 次</small></button>`,
      '<p>选择后立即进入一级形态；技能攻击仍保持关闭。</p>',
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
    this.combatMessage = '已抗拒一次 · 身体重新组合候选'
    this.renderEvolutionOffer()
    this.evolutionOverlay?.querySelector<HTMLButtonElement>('[data-evolution-choice]')?.focus()
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
    this.damageMultiplier = candidate.modifiers.damageMultiplier
    this.moveSpeedMultiplier = candidate.modifiers.moveSpeedMultiplier
    this.damageReduction = candidate.modifiers.damageReduction
    this.biomassMultiplier = candidate.modifiers.biomassMultiplier
    this.killHeal = candidate.modifiers.killHeal
    this.attackState = createFormalHuntBasicAttackState()
    this.attackUntil = 0
    this.characterRoot.position.set(0, 0, 0)
    this.characterRoot.rotation.set(0, 0, 0)
    this.characterRoot.scale.setScalar(1)
    const previousMaximum = this.playerCombat.maxHealth
    const maximumHealth = Math.max(50, GLOAMWOOD_3D_COMBAT.playerMaxHealth + candidate.modifiers.maximumHealthBonus)
    this.playerCombat = {
      ...this.playerCombat,
      maxHealth: maximumHealth,
      health: Math.min(maximumHealth, this.playerCombat.health + Math.max(0, maximumHealth - previousMaximum)),
    }
    await this.loadCharacter(1, candidate.family)
    this.createEvolutionAccent(candidate.family)
    this.combatMessage = `进化完成 · ${candidate.name} · ${candidate.statLine}`
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
      terrainHeight(GLOAMWOOD_BOSS_ARENA.playerX, GLOAMWOOD_BOSS_ARENA.playerZ),
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
    this.combatMessage = `${GLOAMWOOD_NEST_GUARDIAN.displayName}破土而出 · 正面甲壳减伤极高，绕后破防`
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
      terrainHeight(GLOAMWOOD_BOSS_ARENA.playerX, GLOAMWOOD_BOSS_ARENA.playerZ),
      GLOAMWOOD_BOSS_ARENA.playerZ,
    )
    this.resolveObstacles(this.playerRoot.position)
    this.target.copy(this.playerRoot.position)
    this.playerCombat = { ...this.playerCombat, health: this.playerCombat.maxHealth, invulnerabilitySeconds: 1.1 }
    this.attackState = createFormalHuntBasicAttackState()
    this.syncBossVisual()
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.72)
    this.combatMessage = `${GLOAMWOOD_BOSS.name}从腐根中苏醒 · 观察地面预警`
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
    this.showRunResult(true, '荆心守卫已倒下')
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
      `<span>${victory ? '猎杀完成' : '猎杀失败'}</span>`,
      `<h1>${victory ? '幽影林地已净化' : '荆心仍在跳动'}</h1>`,
      `<p>${reason}</p>`,
      `<aside data-pace="${pace.pace}"><strong>${pace.label}</strong><span>${pace.detail}</span></aside>`,
      '<dl>',
      `<div><dt>用时</dt><dd>${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}</dd></div>`,
      `<div><dt>猎物</dt><dd>${this.nestState.kills}</dd></div>`,
      `<div><dt>进化</dt><dd>${selected?.name ?? '未进化'}</dd></div>`,
      `<div><dt>Boss</dt><dd>${this.bossState.health}/${this.bossState.maxHealth}</dd></div>`,
      '</dl>',
      '<button data-run-restart>重新开始一局</button>',
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
      '<header><span data-g3d-nest-title>幽影林地 · 腐根孵育巢</span><strong data-g3d-message>接近窝点开始清理</strong></header>',
      '<div class="g3d-combat-bars">',
      '<label>生命 <b data-g3d-player-health>100 / 100</b><i><em data-g3d-player-bar></em></i></label>',
      '<label><span data-g3d-target-label>尚未锁定猎物</span> <b data-g3d-enemy-health>--</b><i><em data-g3d-enemy-bar></em></i></label>',
      '</div>',
      '<div class="g3d-nest-resources"><b data-g3d-remaining>未惊动</b><span>生物质 <strong data-g3d-biomass>0</strong></span><span>裂牙 <strong data-g3d-fang>0</strong></span><span>岩盾 <strong data-g3d-shell>0</strong></span><span>群生 <strong data-g3d-swarm>0</strong></span></div>',
      '<p data-g3d-controls><kbd data-g3d-move-label>W/A/S/D / 触控</kbd> 移动 · <kbd data-g3d-lock-label>Tab / 锁定</kbd> 选敌 · <kbd data-g3d-attack-label>Space / 攻击</kbd> 单键连招</p>',
      '<small data-g3d-state>技能关闭 · 三类猎物拥有不同弱点与基因</small>',
      '<button class="g3d-hud-details-toggle" type="button" data-g3d-hud-details aria-expanded="false">展开信息</button>',
      '<button class="g3d-fullscreen-toggle" type="button" data-g3d-fullscreen>全屏游戏</button>',
      '<button class="g3d-settings-toggle" type="button" data-g3d-settings-toggle>体验设置 · Esc</button>',
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
    this.updateFullscreenToggle()
    const onboarding = document.createElement('aside')
    onboarding.className = 'gloamwood-onboarding'
    onboarding.dataset.tone = 'guide'
    onboarding.setAttribute('aria-live', 'polite')
    onboarding.innerHTML = [
      '<header><span data-g3d-guide-eyebrow>猎手指引 · 1/7</span><b data-g3d-guide-progress>移动一小段开始狩猎</b></header>',
      '<strong data-g3d-guide-title>先学会控制身体</strong>',
      '<p data-g3d-guide-instruction>使用WASD、方向键或左侧触控移动；角色会先转身再前进。</p>',
      '<small data-g3d-guide-reason>移动、锁定和攻击在键鼠与触控上遵循同一套规则。</small>',
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
      document.body.append(this.debugOutput)
      const api = {
        getState: () => this.getDebugState(),
        setMoveTarget: (x: number, z: number) => this.target.set(
          THREE.MathUtils.clamp(x, -WORLD_HALF_WIDTH, WORLD_HALF_WIDTH),
          0,
          THREE.MathUtils.clamp(z, -WORLD_HALF_DEPTH, WORLD_HALF_DEPTH),
        ),
        toggleTargetLock: () => this.toggleEnemyLock(),
        attack: () => this.requestPrimaryAttack(),
        chooseEvolution: (index: number) => this.chooseEvolution(index),
        refreshEvolution: () => this.refreshEvolution(),
        toggleSettings: (open: boolean) => this.toggleSettings(open),
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
      }
      ;(window as Window & { __EA_DEBUG__?: typeof api }).__EA_DEBUG__ = api
    }
  }

  private createOrientationGate() {
    const gate = document.createElement('section')
    gate.className = 'gloamwood-orientation-gate'
    gate.setAttribute('role', 'dialog')
    gate.setAttribute('aria-label', '横屏游戏提示')
    gate.innerHTML = [
      '<div>',
      '<i aria-hidden="true"><span>↻</span></i>',
      '<span>MOBILE PLAY / 手机试玩</span>',
      '<h2>请把手机横过来</h2>',
      '<p>横屏会保留更大的战斗视野，并把移动与攻击分到屏幕两侧。</p>',
      '<button class="primary" type="button" data-g3d-landscape>进入全屏横屏</button>',
      '<button type="button" data-g3d-portrait-continue>暂时以竖屏继续</button>',
      '<small data-g3d-orientation-status>如果没有旋转，请先关闭手机的竖屏方向锁定，再手动横放。</small>',
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
      ? '已请求横屏；如果画面未变化，请手动把手机横放。'
      : fullscreenAccepted
        ? '已进入全屏。请关闭系统竖屏锁定，再把手机横放。'
        : '浏览器不支持自动旋转；请关闭系统竖屏锁定并手动横放。'
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
      this.fullscreenToggle.textContent = '全屏方法'
      this.fullscreenToggle.setAttribute('aria-label', '查看如何全屏游玩，隐藏浏览器地址栏')
      return
    }
    const active = document.fullscreenElement !== null
    this.fullscreenToggle.dataset.active = active ? 'true' : 'false'
    this.fullscreenToggle.textContent = active ? '退出全屏' : '全屏游戏'
    this.fullscreenToggle.setAttribute('aria-label', active ? '退出全屏' : '进入全屏，隐藏浏览器地址栏')
  }

  private createHomeScreenTip() {
    const tip = document.createElement('aside')
    tip.className = 'gloamwood-homescreen-tip'
    tip.hidden = true
    tip.setAttribute('role', 'dialog')
    tip.setAttribute('aria-label', '全屏游玩方法')
    tip.innerHTML = [
      '<div>',
      '<span>FULL SCREEN / 全屏游玩</span>',
      '<p>此浏览器不支持网页全屏。点击底部的<b>分享</b>按钮，选择<b>添加到主屏幕</b>，之后从主屏图标启动，地址栏与标签栏都会消失。</p>',
      '<small>横屏方向仍由系统控制；如果不旋转，请先关闭手机的竖屏方向锁定。</small>',
      '<button type="button" data-g3d-tip-close>知道了</button>',
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
      '<span>PAUSED / 体验设置</span>',
      '<h2 id="g3d-settings-title">让反馈适合你的屏幕与设备</h2>',
      '<p>设置即时生效并保存在本机；调整期间狩猎已暂停。</p>',
      '<button type="button" data-g3d-setting="shake">镜头震动：开</button>',
      '<button type="button" data-g3d-setting="flash">受击闪光：开</button>',
      '<button type="button" data-g3d-setting="volume">音效音量：60%</button>',
      '<button type="button" data-g3d-input-open>基础按键设置</button>',
      '<button class="primary" type="button" data-g3d-settings-resume>继续狩猎</button>',
      '<output class="g3d-performance-readout" data-g3d-performance hidden>PERF · 等待稳定采样</output>',
      '<small data-g3d-settings-summary>键盘：Esc 暂停/继续 · 移动 W/A/S/D · 锁定 Tab · 普攻 Space</small>',
      '</section>',
      '<section data-g3d-settings-input hidden>',
      '<span>KEY BINDINGS / 基础按键</span>',
      '<h2>选择动作，再按下新按键</h2>',
      '<p>若新按键已经被占用，两个动作会自动交换；Esc取消当前录入。</p>',
      '<div class="g3d-input-bindings">',
      '<button type="button" data-g3d-bind="moveUp">向上移动</button>',
      '<button type="button" data-g3d-bind="moveDown">向下移动</button>',
      '<button type="button" data-g3d-bind="moveLeft">向左移动</button>',
      '<button type="button" data-g3d-bind="moveRight">向右移动</button>',
      '<button type="button" data-g3d-bind="lock">锁定目标</button>',
      '<button type="button" data-g3d-bind="attack">普通攻击</button>',
      '<button type="button" data-g3d-bind="pause">暂停/继续</button>',
      '</div>',
      '<div class="g3d-input-footer"><button type="button" data-g3d-bind-reset>恢复默认</button><button class="primary" type="button" data-g3d-input-back>返回体验设置</button></div>',
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
      button.textContent = expanded ? '收起信息' : '展开信息'
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
    if (shake) shake.textContent = `镜头震动：${this.feedbackSettings.shake ? '开' : '关'}`
    if (flash) flash.textContent = `受击闪光：${this.feedbackSettings.flash ? '开' : '关'}`
    if (volume) volume.textContent = `音效音量：${Math.round(this.feedbackSettings.volume * 100)}%`
    const summary = this.settingsPanel.querySelector<HTMLElement>('[data-g3d-settings-summary]')
    if (summary) summary.textContent = `键盘：${formatGloamwoodInputCode(this.inputBindings.pause)} 暂停/继续 · 移动 ${gloamwoodMovementBindingLabel(this.inputBindings)} · 锁定 ${formatGloamwoodInputCode(this.inputBindings.lock)} · 普攻 ${formatGloamwoodInputCode(this.inputBindings.attack)}`
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
      moveUp: '向上移动', moveDown: '向下移动', moveLeft: '向左移动', moveRight: '向右移动',
      lock: '锁定目标', attack: '普通攻击', pause: '暂停/继续',
    }
    for (const button of this.settingsPanel.querySelectorAll<HTMLButtonElement>('[data-g3d-bind]')) {
      const action = button.dataset.g3dBind as GloamwoodInputAction
      const capturing = this.rebindingAction === action
      button.dataset.capturing = String(capturing)
      button.textContent = capturing ? `${labels[action]}：请按新按键…` : `${labels[action]}：${formatGloamwoodInputCode(this.inputBindings[action])}`
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
    controls.setAttribute('aria-label', '触控操作')
    controls.innerHTML = [
      '<div class="g3d-joystick" data-joystick role="application" aria-label="拖动虚拟摇杆移动">',
      '<i data-joystick-knob aria-hidden="true"></i>',
      '<span aria-hidden="true">移动</span>',
      '</div>',
      '<div class="g3d-actions">',
      '<button data-lock aria-label="锁定目标">锁定</button>',
      '<button class="primary" data-attack aria-label="按住执行普通攻击连招">攻击<small>按住连招</small></button>',
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
    const target = this.lockedPrey()
    const bossTargeted = this.bossActive() && this.bossLocked
    const enemyRatio = bossTargeted ? this.bossState.health / this.bossState.maxHealth : target ? target.health / target.maxHealth : 0
    const setText = (selector: string, value: string) => {
      const element = this.hud?.querySelector<HTMLElement>(selector)
      if (element && element.textContent !== value) element.textContent = value
    }
    setText('[data-g3d-message]', this.combatMessage)
    setText('[data-g3d-nest-title]', this.runPhase === 'boss'
      ? `幽影林地 · ${GLOAMWOOD_BOSS.name} · 阶段 ${this.bossState.phase}/2`
      : this.runPhase === 'guardian'
        ? `幽影林地 · ${GLOAMWOOD_NEST_GUARDIAN.displayName} · 窝点最后防线`
      : this.runPhase === 'victory'
        ? '幽影林地 · 猎杀完成'
        : this.nestState.phase === 'cleared' ? '幽影林地 · 窝点已净化' : `幽影林地 · 腐根孵育巢${this.nestState.wave ? ` · 第 ${this.nestState.wave}/${GLOAMWOOD_NEST.waveCount} 波` : ''}`)
    setText('[data-g3d-player-health]', `${this.playerCombat.health} / ${this.playerCombat.maxHealth}`)
    setText('[data-g3d-target-label]', bossTargeted ? GLOAMWOOD_BOSS.name : target ? this.preyName(target) : '尚未锁定猎物')
    setText('[data-g3d-enemy-health]', bossTargeted ? `${this.bossState.health} / ${this.bossState.maxHealth}` : target ? `${target.health} / ${target.maxHealth}` : '--')
    setText('[data-g3d-remaining]', this.runPhase === 'boss'
      ? `${this.bossPatternName(this.bossState.pattern)} · ${this.bossState.state === 'telegraph' ? '预警' : this.bossState.state === 'attack' ? '攻击' : '观察'}`
      : this.nestState.phase === 'dormant' ? '未惊动' : this.nestState.phase === 'intermission' ? '增援逼近' : this.nestState.phase === 'cleared' ? `清理完成 · ${this.nestState.kills} 击杀` : `本波剩余 ${this.livePrey().length}`)
    setText('[data-g3d-biomass]', `${this.nestState.biomass}`)
    setText('[data-g3d-fang]', `${this.nestState.genes.fang}`)
    setText('[data-g3d-shell]', `${this.nestState.genes.shell}`)
    setText('[data-g3d-swarm]', `${this.nestState.genes.swarm}`)
    setText('[data-g3d-state]', bossTargeted
      ? this.bossState.pattern === 'root-slam' ? '根须震击：离开内圈 · 技能关闭'
        : this.bossState.pattern === 'thorn-charge' ? '荆棘冲锋：横向离开锁向通道 · 技能关闭'
          : '孢子环爆：贴近内圈或退到外圈 · 技能关闭'
      : target ? `目标 ${this.enemyPhaseName(target)} · ${target.kind === 'shell' ? '正面高减伤，绕后攻击' : target.kind === 'swarm' ? '尾扫伤害更高' : '爪击伤害更高'} · 技能关闭` : 'Tab 循环锁定 · 三类猎物拥有不同弱点 · 技能关闭')
    setText('[data-g3d-move-label]', `${gloamwoodMovementBindingLabel(this.inputBindings)} / 触控`)
    setText('[data-g3d-lock-label]', `${formatGloamwoodInputCode(this.inputBindings.lock)} / 锁定`)
    setText('[data-g3d-attack-label]', `${formatGloamwoodInputCode(this.inputBindings.attack)} / 攻击`)
    setText('[data-g3d-settings-toggle]', `体验设置 · ${formatGloamwoodInputCode(this.inputBindings.pause)}`)
    this.renderPerformanceReadout()
    const playerBar = this.hud.querySelector<HTMLElement>('[data-g3d-player-bar]')
    const enemyBar = this.hud.querySelector<HTMLElement>('[data-g3d-enemy-bar]')
    if (playerBar) playerBar.style.width = `${Math.max(0, playerRatio) * 100}%`
    if (enemyBar) enemyBar.style.width = `${Math.max(0, enemyRatio) * 100}%`
    this.hud.dataset.critical = playerRatio <= 0.3 ? 'true' : 'false'
    this.updateOnboardingHud()
  }

  private onboardingStep() {
    const objectiveX = this.runPhase === 'guardian' || this.runPhase === 'boss' ? GLOAMWOOD_BOSS_ARENA.x : GLOAMWOOD_NEST.centerX
    const objectiveZ = this.runPhase === 'guardian' || this.runPhase === 'boss' ? GLOAMWOOD_BOSS_ARENA.z : GLOAMWOOD_NEST.centerZ
    return deriveGloamwoodOnboardingStep({
      runPhase: this.runPhase,
      movedDistance: Math.hypot(this.playerRoot.position.x + 6, this.playerRoot.position.z - 3),
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

  private enemyPhaseName(prey: GloamwoodNestPrey) {
    const names: Record<string, string> = {
      chase: '追击', telegraph: '预警', strike: '攻击', recover: '恢复', stunned: '硬直', dead: '死亡',
    }
    return names[prey.phase] ?? prey.phase
  }

  private preyName(prey: GloamwoodNestPrey) {
    return prey.id === GLOAMWOOD_NEST_GUARDIAN.id ? GLOAMWOOD_NEST_GUARDIAN.displayName : GLOAMWOOD_PREY[prey.kind].displayName
  }

  private getDebugState(): DebugState {
    const stage = this.stage
    const asset = resolveQuality3DGLBAsset(stage >= 2 ? 2 : stage >= 1 ? 1 : 0, this.characterFamily).asset
    const collisionProfile = getGloamwoodPlayerCollisionProfile(stage)
    const collision = inspectGloamwoodPlayerCollision(this.playerRoot.position, this.lastFacing, stage, this.obstacles)
    const playerBodyRadius = gloamwoodPlayerCombatBodyRadius(stage)
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
      presentation: {
        baselineId: stage >= 2
          ? SCARLET_HUNTER_PRESENTATION.baselineId
          : stage >= 1
            ? SCARLET_GECKO_PRESENTATION.baselineId
            : 'inherited-pbr-baseline',
        artStyle: stage >= 2
          ? SCARLET_HUNTER_PRESENTATION.asset.artStyle
          : stage >= 1
            ? SCARLET_GECKO_PRESENTATION.asset.artStyle
            : 'pbr',
        triangles: stage >= 2
          ? SCARLET_HUNTER_PRESENTATION.asset.triangles
          : stage >= 1
            ? SCARLET_GECKO_PRESENTATION.asset.triangles
            : 32_000,
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
      grounded: Math.abs(this.playerRoot.position.y - terrainHeight(this.playerRoot.position.x, this.playerRoot.position.z)) < 0.001,
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
      prey: this.nestState.prey.map((prey) => ({
        id: prey.id,
        kind: prey.kind,
        health: prey.health,
        phase: prey.phase,
        x: round(prey.x),
        z: round(prey.z),
        facing: round(prey.facingRadians),
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
  }

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

export function gloamwoodScreenMovementVector(inputX: number, inputY: number) {
  const inverseLength = 1 / Math.hypot(CAMERA_OFFSET.x, CAMERA_OFFSET.z)
  const forwardX = -CAMERA_OFFSET.x * inverseLength
  const forwardZ = -CAMERA_OFFSET.z * inverseLength
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

export function nextGloamwoodLockTarget(
  prey: readonly GloamwoodNestPrey[],
  currentId: string | null,
  player: { x: number; z: number },
) {
  const live = prey.filter((candidate) => candidate.phase !== 'dead')
  if (live.length === 0) return null
  if (!currentId || !live.some((candidate) => candidate.id === currentId)) {
    return [...live].sort((left, right) => {
      const distanceDelta = Math.hypot(left.x - player.x, left.z - player.z) - Math.hypot(right.x - player.x, right.z - player.z)
      return Math.abs(distanceDelta) > 0.000001 ? distanceDelta : left.id.localeCompare(right.id)
    })[0].id
  }
  const stable = [...live].sort((left, right) => left.slot - right.slot || left.id.localeCompare(right.id))
  const index = stable.findIndex((candidate) => candidate.id === currentId)
  return stable[(index + 1) % stable.length].id
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

function squaredDistance(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx
  const dz = az - bz
  return dx * dx + dz * dz
}

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const abX = bx - ax
  const abZ = bz - az
  const lengthSquared = abX * abX + abZ * abZ
  const t = lengthSquared > 0 ? THREE.MathUtils.clamp(((px - ax) * abX + (pz - az) * abZ) / lengthSquared, 0, 1) : 0
  return Math.hypot(px - (ax + abX * t), pz - (az + abZ * t))
}

function distanceToSegment3D(
  px: number,
  py: number,
  pz: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
) {
  const abX = bx - ax
  const abY = by - ay
  const abZ = bz - az
  const lengthSquared = abX * abX + abY * abY + abZ * abZ
  const t = lengthSquared > 0
    ? THREE.MathUtils.clamp(((px - ax) * abX + (py - ay) * abY + (pz - az) * abZ) / lengthSquared, 0, 1)
    : 0
  return Math.hypot(px - (ax + abX * t), py - (ay + abY * t), pz - (az + abZ * t))
}
