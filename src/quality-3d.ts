import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  QUALITY_3D,
  canQuality3DTranslateAfterTurn,
  getQuality3DFootprint,
  inspectQuality3DFootprint,
  isQuality3DBridge,
  isQuality3DFootprintWalkable,
  isQuality3DWalkable,
  quality3DEastBoundaryX,
  quality3DRiverCenterZ,
  quality3DRiverHalfWidth,
  quality3DWestBoundaryX,
  shortestAngleDelta,
  terrainHeight,
  turnToward,
} from './quality-3d-layout'
import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'
import {
  QUALITY_3D_RESCUE_CAMERA,
  createQuality3DCameraPivot,
  quality3DVisibleHeightAtPivot,
  stepQuality3DCameraPivot,
} from './quality-3d-camera'
import {
  applyScarletGeckoSurfaceGrade,
  SCARLET_GECKO_PRESENTATION,
  stabilizeScarletGeckoLocomotionClip,
} from './scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'
import {
  getQuality3DEvolutionEnvelope,
  getQuality3DEvolutionStage,
  mixQuality3DMorphology,
  QUALITY_3D_EVOLUTION_STAGES,
  type Quality3DMorphology,
} from './quality-3d-evolution'
import { getQuality3DSpeciesForm, QUALITY_3D_LIZARD_DRAGON_FORMS, type Quality3DSpeciesForm } from './quality-3d-species-forms'
import { QUALITY_3D_GLB_ASSETS, type Quality3DGLBAsset } from './quality-3d-glb-assets'
import { getQuality3DAttackFeedback, type Quality3DBasicAttackAction } from './quality-3d-attack-feedback'
import { juvenileLeapBiteMotionFrame, juvenileSpinTailSwipeMotionFrame, quadrupedAttackMotionFrame, quadrupedPounceFrame } from './quadruped-combat-motion'
import { assetUrl } from './asset-url'

interface LegRig {
  hip: THREE.Group
  knee: THREE.Group
  foot: THREE.Mesh
  baseX: number
  baseZ: number
  phaseOffset: number
}

interface SpeciesFormRig {
  root: THREE.Group
  stage: number
  formId: string
  bodyPlan: string
  baseScale: number
  body: THREE.Group
  head: THREE.Group
  legs: THREE.Group[]
  feet: THREE.Object3D[]
  tailJoints: THREE.Group[]
  wings: THREE.Group[]
  assetSource?: 'procedural' | 'glb'
  mixer?: THREE.AnimationMixer
  actions?: Map<string, THREE.AnimationAction>
  activeAction?: string
  motion?: Quality3DGLBAsset['motion']
  materialTuning?: { materials: number; normalMapped: number; aoMapped: number }
  groundCorrection?: number
}

interface DrakeRig {
  root: THREE.Group
  bodyRig: THREE.Group
  headRig: THREE.Group
  body: THREE.Mesh
  belly: THREE.Mesh
  neck: THREE.Mesh
  head: THREE.Mesh
  snout: THREE.Mesh
  lowerJaw: THREE.Mesh
  horns: THREE.Mesh[]
  spines: THREE.Mesh[]
  wings: THREE.Group[]
  wingMembranes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[]
  tailSegments: THREE.Mesh[]
  claws: THREE.Mesh[]
  tailJoints: THREE.Group[]
  legs: LegRig[]
  shadow: {
    root: THREE.Group
    body: THREE.MeshBasicMaterial
    head: THREE.MeshBasicMaterial
    tail: THREE.MeshBasicMaterial
  }
  materials: {
    primary: THREE.MeshStandardMaterial
    secondary: THREE.MeshStandardMaterial
    armor: THREE.MeshStandardMaterial
    horn: THREE.MeshStandardMaterial
    eye: THREE.MeshPhysicalMaterial
  }
  evolutionFx: {
    group: THREE.Group
    rings: THREE.Mesh[]
    motes: THREE.Mesh[]
    light: THREE.PointLight
  }
  speciesForms: SpeciesFormRig[]
}

interface CombatDummyRig {
  root: THREE.Group
  visual: THREE.Group
  healthBar: THREE.Group
  healthFill: THREE.Mesh
  materials: THREE.MeshStandardMaterial[]
  health: number
  state: 'alive' | 'dead' | 'respawning'
  flashRemaining: number
  respawnRemaining: number
  knockbackVelocity: THREE.Vector3
  hits: number
  deaths: number
  lastHitAction: string
}

interface Quality3DDebugState {
  renderer: string
  position: { x: number; y: number; z: number }
  movement: { speed: number; state: string; facingDegrees: number; turnRemainingDegrees: number }
  grounding: { grounded: boolean; maxFootError: number; minimumFootClearance: number; surface: string }
  terrain: { actualHeight: number; walkable: boolean }
  collision: { footprintClear: boolean; blockedProbe: string | null; front: number; rear: number; halfWidth: number; maxHeightDelta: number }
  camera: { type: string; pitchDegrees: number; viewHeight: number; fovDegrees: number; distance: number; springLag: number }
  performance: { drawCalls: number; triangles: number; geometries: number; textures: number; pixelRatio: number }
  evolution: { enabled: boolean; stage: number; targetStage: number; name: string; formId: string; bodyPlan: string; state: string; progress: number; autoplay: boolean }
  asset: { baselineId: string; source: string; assetUrl: string; displayScale: number; loadedGLBs: number; activeClip: string; footBones: number; playbackRate: number; dustPuffs: number; tunedMaterials: number; normalMappedMaterials: number; aoMappedMaterials: number; rootScale: { x: number; y: number; z: number }; maximumBoneScaleDeviation: number }
  weight: { locomotionBlend: number; stepImpact: number; stopSettle: number; turnFollowDegrees: number; groundCorrection: number }
  combat: { profileId: string; system: string; skillsEnabled: boolean; action: string; elapsed: number; remaining: number; contactReached: boolean; comboStep: number; nextAction: string; buffered: boolean; targetLocked: boolean; aimErrorDegrees: number; hitStopRemaining: number; attackFx: number; leapBitePhase: string; leapBiteLift: number; leapBiteLandingEvents: number; leapBiteLandingDustPuffs: number; visualYawDegrees: number }
  combatTarget: { name: string; state: string; health: number; maxHealth: number; distance: number; inRange: boolean; hits: number; deaths: number; lastHitAction: string }
  shadow: { layers: number; shape: string; groundLift: number }
  fps: number
}

type CoralGeckoCombatAction = 'Bite' | 'Claw' | 'Pounce' | 'TailSwipe' | 'Hit' | 'Death'

declare global {
  interface Window {
    __EA_3D_DEBUG__?: {
      getState: () => Quality3DDebugState
      primaryAttack: () => void
      setEvolutionStage: (stage: number) => void
    }
  }
}

const UP = new THREE.Vector3(0, 1, 0)

class Quality3DExperience {
  private readonly container: HTMLElement
  private readonly scene = new THREE.Scene()
  private readonly renderer: THREE.WebGLRenderer
  private readonly camera = new THREE.PerspectiveCamera(
    QUALITY_3D_RESCUE_CAMERA.fovDegrees,
    1,
    QUALITY_3D_RESCUE_CAMERA.near,
    QUALITY_3D_RESCUE_CAMERA.far,
  )
  private readonly cameraPivot = createQuality3DCameraPivot()
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly gltfLoader = new GLTFLoader()
  private readonly terrain: THREE.Mesh
  private readonly drake: DrakeRig
  private readonly combatDummy: CombatDummyRig
  private readonly keys = new Set<string>()
  private readonly target = new THREE.Vector3()
  private readonly footstepDust: THREE.Sprite[] = []
  private readonly impactParticles: THREE.Mesh[] = []
  private readonly attackTrails: THREE.Group[] = []
  private readonly playerFill = new THREE.PointLight(0xffd8bd, 18, 15, 1.7)
  private readonly cameraLightDirection = new THREE.Vector3()
  private atmosphereMotes?: THREE.Points
  private waterMaterial?: THREE.ShaderMaterial
  private hasTarget = false
  private currentYaw = 0
  private gaitPhase = 0
  private footstepProgress = 0
  private animationState = 'idle-grounded'
  private turnRemaining = 0
  private turnAnimationRemaining = 0
  private locomotionBlend = 0
  private stepImpact = 0
  private stopSettleRemaining = 0
  private turnFollow = 0
  private wasMoving = false
  private combatAction: CoralGeckoCombatAction | null = null
  private combatActionElapsed = 0
  private combatActionRemaining = 0
  private combatContactReached = false
  private combatHitResolved = false
  private comboStep = 0
  private comboBuffered = false
  private comboResetRemaining = 0
  private attackTargetYaw: number | null = null
  private leapBiteLandingResolved = false
  private leapBiteLandingEvents = 0
  private leapBiteLandingDustPuffs = 0
  private maxFootError = 0
  private minimumFootClearance = 0
  private blockedProbe: string | null = null
  private loadedGLBCount = 0
  private smoothedFps = 60
  private readonly evolutionLabEnabled = new URLSearchParams(location.search).get('evolution') === '1'
  private currentEvolutionStage = 0
  private targetEvolutionStage = 0
  private evolutionFromMorph: Quality3DMorphology = getQuality3DEvolutionStage(0).morphology
  private evolutionElapsed = 0
  private evolutionProgress = 1
  private isEvolving = false
  private evolutionFormSwapped = false
  private autoEvolution = false
  private autoEvolutionCountdown = 1
  private cameraTrauma = 0
  private hitStopRemaining = 0
  private evolutionPanel?: HTMLElement
  private elapsedTime = 0
  private lastFrameTime = performance.now()
  private frameRequest = 0
  private previousWidth = 0
  private previousHeight = 0
  private readonly onResize = () => this.resize()
  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code)
    if (event.repeat) return
    if (event.code === 'Space') {
      event.preventDefault()
      this.requestPrimaryAttack()
    } else if (event.code === 'KeyH') this.triggerCombatAction('Hit')
    else if (event.code === 'KeyK') this.triggerCombatAction('Death')
    else if (event.code === 'KeyR') this.resetCombatPose()
  }
  private readonly onKeyUp = (event: KeyboardEvent) => this.keys.delete(event.code)
  private readonly onPointerDown = (event: PointerEvent) => this.setPointerTarget(event)

  constructor(container: HTMLElement) {
    this.container = container
    this.scene.background = new THREE.Color(0x07120e)
    this.scene.fog = new THREE.FogExp2(0x0b1812, 0.018)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    this.renderer.domElement.className = 'quality3d-canvas'
    this.renderer.domElement.setAttribute('aria-label', '真实3D地图与幼龙品质样板')
    this.container.append(this.renderer.domElement)

    this.addLights()
    this.scene.add(this.createTerrainBackdrop())
    this.terrain = this.createTerrain()
    this.scene.add(this.terrain)
    this.createWaterAndBridge()
    this.createEnvironment()
    this.createRescueLandmark()
    this.createAtmosphereMotes()
    this.createFootstepDust()
    this.drake = this.createDrake()
    const spawnMode = new URLSearchParams(location.search).get('spawn')
    const spawn = spawnMode === 'bridge'
      ? { x: QUALITY_3D.bridge.centerX, z: 11.2 }
      : spawnMode === 'north'
        ? { x: QUALITY_3D.bridge.centerX, z: 17 }
        : QUALITY_3D.spawn
    this.drake.root.position.set(spawn.x, terrainHeight(spawn.x, spawn.z), spawn.z)
    this.scene.add(this.drake.root)
    this.combatDummy = this.createCombatDummy()
    this.resetCombatDummy(true)
    this.createImpactParticles()
    this.createAttackTrails()
    this.applyEvolutionMorph(getQuality3DEvolutionStage(0).morphology)
    this.setSpeciesFormVisual(0)
    void this.loadGLBSpeciesForms()
    if (this.evolutionLabEnabled) {
      this.createEvolutionPanel()
      this.autoEvolution = new URLSearchParams(location.search).get('auto') !== '0'
      this.updateEvolutionPanel()
    }

    window.addEventListener('resize', this.onResize)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
    this.resize()
    this.updateCamera(true)
    this.frameRequest = requestAnimationFrame(() => this.animate())
  }

  dispose() {
    cancelAnimationFrame(this.frameRequest)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.evolutionPanel?.remove()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  getDebugState(): Quality3DDebugState {
    const position = this.drake.root.position
    const collisionStage = this.isEvolving ? this.targetEvolutionStage : this.currentEvolutionStage
    const footprint = getQuality3DFootprint(collisionStage)
    const footprintResult = inspectQuality3DFootprint(position.x, position.z, this.currentYaw, collisionStage)
    const activeForm = this.drake.speciesForms.find((form) => form.root.visible)
    const activePresentation = presentationForFormId(activeForm?.formId)
    const activeCombat = activeForm?.formId === 'scarlet-hunter'
      ? SCARLET_HUNTER_PRESENTATION.combat
      : activeForm?.formId === 'scarlet-gecko'
        ? SCARLET_GECKO_PRESENTATION.combat
        : CORAL_GECKO_PRESENTATION.combat
    const leapBite = activeForm && this.combatAction === 'Pounce'
      ? juvenileLeapBiteMotionFrame(this.combatActionElapsed, activeCombat.pounceDurationSeconds)
      : juvenileLeapBiteMotionFrame(0, 1)
    return {
      renderer: 'Three.js WebGL · real 3D meshes',
      position: { x: round(position.x), y: round(position.y), z: round(position.z) },
      movement: {
        speed: this.animationState === 'walk-grounded' ? QUALITY_3D.player.speed : 0,
        state: this.animationState,
        facingDegrees: round(THREE.MathUtils.radToDeg(this.currentYaw)),
        turnRemainingDegrees: round(THREE.MathUtils.radToDeg(this.turnRemaining)),
      },
      grounding: {
        grounded: this.maxFootError <= 0.16,
        maxFootError: round(this.maxFootError),
        minimumFootClearance: round(this.minimumFootClearance),
        surface: isQuality3DBridge(position.x, position.z) ? 'stone bridge' : 'heightfield ground',
      },
      terrain: { actualHeight: round(terrainHeight(position.x, position.z)), walkable: isQuality3DWalkable(position.x, position.z) },
      collision: {
        footprintClear: footprintResult.clear,
        blockedProbe: this.blockedProbe ?? footprintResult.blockedProbe,
        front: round(footprint.front),
        rear: round(footprint.rear),
        halfWidth: round(footprint.halfWidth),
        maxHeightDelta: round(footprintResult.maxHeightDelta),
      },
      camera: {
        type: 'PerspectiveCamera',
        pitchDegrees: QUALITY_3D_RESCUE_CAMERA.pitchDegrees,
        viewHeight: round(quality3DVisibleHeightAtPivot()),
        fovDegrees: QUALITY_3D_RESCUE_CAMERA.fovDegrees,
        distance: QUALITY_3D_RESCUE_CAMERA.distance,
        springLag: round(Math.hypot(
          this.cameraPivot.x - position.x,
          this.cameraPivot.z - position.z,
        )),
      },
      performance: {
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        pixelRatio: round(this.renderer.getPixelRatio()),
      },
      evolution: {
        enabled: this.evolutionLabEnabled,
        stage: this.currentEvolutionStage,
        targetStage: this.targetEvolutionStage,
        name: getQuality3DEvolutionStage(this.isEvolving ? this.targetEvolutionStage : this.currentEvolutionStage).name,
        formId: getQuality3DSpeciesForm(this.isEvolving ? this.targetEvolutionStage : this.currentEvolutionStage).formId,
        bodyPlan: getQuality3DSpeciesForm(this.isEvolving ? this.targetEvolutionStage : this.currentEvolutionStage).bodyPlan,
        state: this.isEvolving ? 'transforming' : 'stable',
        progress: round(this.evolutionProgress),
        autoplay: this.autoEvolution,
      },
      asset: {
        baselineId: activePresentation?.baselineId ?? 'unversioned',
        source: activeForm?.assetSource ?? 'procedural',
        assetUrl: QUALITY_3D_GLB_ASSETS.find((asset) => asset.formId === activeForm?.formId)?.url ?? 'procedural',
        displayScale: round(activeForm?.baseScale ?? 1),
        loadedGLBs: this.loadedGLBCount,
        activeClip: activeForm?.activeAction ?? 'procedural-motion',
        footBones: activeForm?.feet.length ?? 0,
        playbackRate: round(activeForm?.actions?.get(quality3DClipName(activeForm.formId, activeForm.activeAction ?? ''))?.getEffectiveTimeScale() ?? 1),
        dustPuffs: this.footstepDust.filter((puff) => puff.visible).length,
        tunedMaterials: activeForm?.materialTuning?.materials ?? 0,
        normalMappedMaterials: activeForm?.materialTuning?.normalMapped ?? 0,
        aoMappedMaterials: activeForm?.materialTuning?.aoMapped ?? 0,
        rootScale: {
          x: round(activeForm?.root.scale.x ?? 1),
          y: round(activeForm?.root.scale.y ?? 1),
          z: round(activeForm?.root.scale.z ?? 1),
        },
        maximumBoneScaleDeviation: round(maximumBoneScaleDeviation(activeForm?.root)),
      },
      weight: {
        locomotionBlend: round(this.locomotionBlend),
        stepImpact: round(this.stepImpact),
        stopSettle: round(this.stopSettleRemaining),
        turnFollowDegrees: round(THREE.MathUtils.radToDeg(this.turnFollow)),
        groundCorrection: round(activeForm?.groundCorrection ?? 0),
      },
      combat: {
        profileId: activePresentation?.combat.profileId ?? CORAL_GECKO_PRESENTATION.combat.profileId,
        system: CORAL_GECKO_PRESENTATION.combat.system,
        skillsEnabled: CORAL_GECKO_PRESENTATION.combat.skillsEnabled,
        action: this.combatAction ?? 'ready',
        elapsed: round(this.combatActionElapsed),
        remaining: round(this.combatActionRemaining),
        contactReached: this.combatContactReached,
        comboStep: this.comboStep,
        nextAction: activeCombat.primaryCombo[this.comboStep],
        buffered: this.comboBuffered,
        targetLocked: this.attackTargetYaw !== null && this.combatDummy.state === 'alive',
        aimErrorDegrees: round(THREE.MathUtils.radToDeg(this.getAttackAimError())),
        hitStopRemaining: round(this.hitStopRemaining),
        attackFx: this.attackTrails.filter((trail) => trail.visible).length,
        leapBitePhase: leapBite.phase,
        leapBiteLift: round(leapBite.liftOffset),
        leapBiteLandingEvents: this.leapBiteLandingEvents,
        leapBiteLandingDustPuffs: this.leapBiteLandingDustPuffs,
        visualYawDegrees: round(THREE.MathUtils.radToDeg(activeForm?.root.rotation.y ?? 0)),
      },
      combatTarget: {
        name: CORAL_GECKO_PRESENTATION.combat.demoTarget.name,
        state: this.combatDummy.state,
        health: this.combatDummy.health,
        maxHealth: CORAL_GECKO_PRESENTATION.combat.demoTarget.maxHealth,
        distance: round(this.combatDummy.root.position.distanceTo(this.drake.root.position)),
        inRange: this.isCombatDummyInRange(this.combatAction ?? 'Bite'),
        hits: this.combatDummy.hits,
        deaths: this.combatDummy.deaths,
        lastHitAction: this.combatDummy.lastHitAction,
      },
      shadow: {
        layers: 3,
        shape: 'body-head-tail ellipses',
        groundLift: CORAL_GECKO_PRESENTATION.contactShadow.groundLift,
      },
      fps: Math.round(this.smoothedFps),
    }
  }

  debugPrimaryAttack() {
    this.requestPrimaryAttack()
  }

  debugSetEvolutionStage(stage: number) {
    if (!this.evolutionLabEnabled || !Number.isInteger(stage) || stage < 0 || stage >= QUALITY_3D_EVOLUTION_STAGES.length) return
    this.setEvolutionStageImmediate(stage)
    this.autoEvolution = false
    this.updateEvolutionPanel()
  }

  private addLights() {
    this.scene.add(new THREE.HemisphereLight(0xcbe6d5, 0x263224, 2.05))
    const sun = new THREE.DirectionalLight(0xffe0a3, 4.2)
    sun.position.set(-14, 24, -10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -24
    sun.shadow.camera.right = 24
    sun.shadow.camera.top = 24
    sun.shadow.camera.bottom = -24
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 70
    sun.shadow.bias = -0.00035
    this.scene.add(sun)
    const rim = new THREE.DirectionalLight(0x5db69d, 1.15)
    rim.position.set(18, 9, 18)
    this.scene.add(rim)
    this.playerFill.name = 'player-presentation-fill'
    this.playerFill.castShadow = false
    this.scene.add(this.playerFill)
  }

  private createTerrain() {
    const geometry = new THREE.PlaneGeometry(QUALITY_3D.world.width, QUALITY_3D.world.depth, 104, 76)
    geometry.rotateX(-Math.PI / 2)
    const position = geometry.attributes.position
    const colors: number[] = []
    const color = new THREE.Color()
    for (let index = 0; index < position.count; index += 1) {
      const x = position.getX(index)
      const z = position.getZ(index)
      const y = terrainHeight(x, z)
      position.setY(index, y)
      const riverDistance = Math.abs(z - quality3DRiverCenterZ(x))
      const riverHalfWidth = quality3DRiverHalfWidth(x)
      if (riverDistance <= riverHalfWidth) color.setHex(0x526a67)
      else if (riverDistance <= riverHalfWidth + 1.45) color.setHex(0xb49b69)
      else if (y > 2.2) color.setHex(0x9ba89d)
      else {
        const path = Math.max(0, 1 - Math.abs(x * 0.025 + z * 0.018))
        color.setHex(path > 0.75 ? 0xd6c6a2 : 0x9db28f)
        color.offsetHSL(0, 0, Math.sin(x * 1.7 + z * 1.1) * 0.025)
      }
      colors.push(color.r, color.g, color.b)
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.computeVertexNormals()
    const groundTexture = this.loadRepeatedTexture('/assets/quality-3d/forest-ground-albedo-v1.png', 12, 9)
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: groundTexture,
      bumpMap: groundTexture,
      bumpScale: 0.16,
      roughness: 0.9,
      metalness: 0.02,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.receiveShadow = true
    mesh.name = 'authored-heightfield'
    return mesh
  }

  private createRescueLandmark() {
    const landmark = new THREE.Group()
    landmark.name = 'rescue-slice-broken-waygate'
    const x = -8.1
    const z = -5.4
    landmark.position.set(x, terrainHeight(x, z), z)
    landmark.rotation.y = 0.32
    landmark.scale.setScalar(0.72)
    const stone = new THREE.MeshStandardMaterial({ color: 0x566b62, roughness: 0.94, metalness: 0.01 })
    const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.76, 0.48, 0.86), stone, 20)
    const matrix = new THREE.Matrix4()
    const rotation = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    let blockIndex = 0
    const placeBlock = (px: number, py: number, angle: number, sx = 1, sy = 1) => {
      rotation.setFromEuler(new THREE.Euler(0, 0, angle))
      scale.set(sx, sy, 1)
      matrix.compose(new THREE.Vector3(px, py, 0), rotation, scale)
      blocks.setMatrixAt(blockIndex, matrix)
      blockIndex += 1
    }
    for (let row = 0; row < 7; row += 1) {
      placeBlock(-1.78 + Math.sin(row * 1.7) * 0.055, 0.24 + row * 0.47, 0.035 + row * 0.008, 1, 0.94)
      if (row < 6) placeBlock(1.78 + Math.sin(row * 1.3) * 0.05, 0.24 + row * 0.47, -0.06 - row * 0.012, 1, 0.94)
    }
    for (let segment = 0; segment < 7; segment += 1) {
      if (segment === 5) continue
      const angle = (segment / 6) * Math.PI
      placeBlock(Math.cos(angle) * 1.78, 2.78 + Math.sin(angle) * 1.42, angle - Math.PI / 2, 1.04, 0.9)
    }
    blocks.count = blockIndex
    blocks.instanceMatrix.needsUpdate = true
    blocks.castShadow = true
    blocks.receiveShadow = true
    landmark.add(blocks)
    const runeMaterial = new THREE.MeshBasicMaterial({
      color: 0x8ae4c8,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    for (let shardIndex = 0; shardIndex < 3; shardIndex += 1) {
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 + shardIndex * 0.035, 0), runeMaterial)
      shard.position.set((shardIndex - 1) * 0.42, 1.35 + shardIndex * 0.56, -0.1)
      shard.rotation.z = 0.35 + shardIndex * 0.7
      shard.renderOrder = 4
      landmark.add(shard)
    }
    const beacon = new THREE.PointLight(0x72d7b6, 7, 8, 2)
    beacon.position.set(0, 2.55, 0.6)
    landmark.add(beacon)
    this.scene.add(landmark)
  }

  private createAtmosphereMotes() {
    const positions: number[] = []
    for (let index = 0; index < 56; index += 1) {
      const angle = seeded(index + 31) * Math.PI * 2
      const radius = 3.5 + seeded(index + 71) * 16
      const x = -2 + Math.cos(angle) * radius
      const z = 1 + Math.sin(angle) * radius
      positions.push(x, terrainHeight(x, z) + 0.35 + seeded(index + 117) * 3.4, z)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: 0xd5f0cf,
      size: 0.055,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      sizeAttenuation: true,
    })
    this.atmosphereMotes = new THREE.Points(geometry, material)
    this.atmosphereMotes.name = 'forest-atmosphere-motes'
    this.scene.add(this.atmosphereMotes)
  }

  private createTerrainBackdrop() {
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 130),
      new THREE.MeshStandardMaterial({ color: 0x26362d, roughness: 1 }),
    )
    backdrop.rotation.x = -Math.PI / 2
    backdrop.position.y = -1.72
    backdrop.receiveShadow = true
    backdrop.name = 'distant-land-backdrop'
    return backdrop
  }

  private createWaterAndBridge() {
    const water = new THREE.Mesh(
      this.createRiverSurfaceGeometry(),
      this.createRiverMaterial(),
    )
    water.receiveShadow = true
    water.name = 'meandering-river-surface'
    this.scene.add(water)

    const sandMaterial = new THREE.MeshStandardMaterial({ color: 0x927f59, roughness: 0.98, metalness: 0 })
    const southBank = new THREE.Mesh(this.createRiverBankGeometry(-1), sandMaterial)
    const northBank = new THREE.Mesh(this.createRiverBankGeometry(1), sandMaterial)
    southBank.receiveShadow = true
    northBank.receiveShadow = true
    southBank.name = 'south-sand-riverbank'
    northBank.name = 'north-sand-riverbank'
    this.scene.add(southBank, northBank)
    this.createRiverbankRocks()

    const bridge = new THREE.Group()
    const stone = new THREE.MeshStandardMaterial({ color: 0x77776c, roughness: 0.84 })
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.48, 7.8), stone)
    deck.position.y = QUALITY_3D.bridge.height - 0.23
    deck.castShadow = true
    deck.receiveShadow = true
    bridge.add(deck)
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.09, 0.86), stone)
        slab.position.set((column - 2) * 1.08 + (row % 2) * 0.18, QUALITY_3D.bridge.height + 0.055, (row - 3) * 1.02)
        slab.rotation.y = (column % 2 ? -1 : 1) * 0.018
        slab.castShadow = true
        slab.receiveShadow = true
        bridge.add(slab)
      }
    }
    for (const side of [-1, 1]) {
      for (const z of [-3.3, 0, 3.3]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.3, 0.38), stone)
        post.position.set(side * 2.82, QUALITY_3D.bridge.height + 0.62, z)
        post.castShadow = true
        bridge.add(post)
      }
    }
    bridge.position.set(QUALITY_3D.bridge.centerX, 0, 12.05)
    this.scene.add(bridge)
  }

  private createRiverSurfaceGeometry() {
    const segments = 96
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments
      const x = -QUALITY_3D.world.width / 2 + t * QUALITY_3D.world.width
      const center = quality3DRiverCenterZ(x)
      const halfWidth = quality3DRiverHalfWidth(x) * 0.93
      const waterY = -0.73 + Math.sin(x * 0.19) * 0.018
      positions.push(x, waterY, center - halfWidth, x, waterY, center + halfWidth)
      uvs.push(t * 8, 0, t * 8, 1)
      if (index < segments) {
        const start = index * 2
        indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }

  private createRiverMaterial() {
    this.waterMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float flowA = sin(vUv.x * 9.0 - uTime * 1.7 + sin(vUv.y * 8.0) * 0.7);
          float flowB = sin(vUv.x * 15.0 - uTime * 2.3 + vUv.y * 18.0);
          float ripples = flowA * 0.5 + flowB * 0.25;
          float edge = 1.0 - smoothstep(0.0, 0.22, min(vUv.y, 1.0 - vUv.y));
          vec3 deepWater = vec3(0.045, 0.29, 0.32);
          vec3 movingWater = vec3(0.08, 0.43, 0.46);
          vec3 color = mix(deepWater, movingWater, 0.42 + ripples * 0.12 + edge * 0.2);
          float glint = smoothstep(0.55, 0.74, ripples) * 0.18;
          color += vec3(0.34, 0.62, 0.58) * glint;
          gl_FragColor = vec4(color, 0.92);
        }
      `,
    })
    return this.waterMaterial
  }

  private createRiverBankGeometry(side: -1 | 1) {
    const segments = 96
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments
      const x = -QUALITY_3D.world.width / 2 + t * QUALITY_3D.world.width
      const center = quality3DRiverCenterZ(x)
      const halfWidth = quality3DRiverHalfWidth(x)
      const innerZ = center + side * (halfWidth + 0.08)
      const outerZ = center + side * (halfWidth + 1.28)
      positions.push(
        x, terrainHeight(x, innerZ) + 0.025, innerZ,
        x, terrainHeight(x, outerZ) + 0.018, outerZ,
      )
      uvs.push(t * 10, 0, t * 10, 1)
      if (index < segments) {
        const start = index * 2
        indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }

  private createRiverbankRocks() {
    const dummy = new THREE.Object3D()
    const rocks = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: 0x74796f, roughness: 0.96 }),
      84,
    )
    let count = 0
    for (let index = 0; index < 48; index += 1) {
      const x = -28 + index * 1.22 + (seeded(index * 31) - 0.5) * 0.7
      if (Math.abs(x - QUALITY_3D.bridge.centerX) < 3.6) continue
      for (const side of [-1, 1] as const) {
        const center = quality3DRiverCenterZ(x)
        const z = center + side * (quality3DRiverHalfWidth(x) + 0.42 + seeded(index * 53 + side) * 0.72)
        const scale = 0.58 + seeded(index * 17 + side * 2) * 1.25
        dummy.position.set(x, terrainHeight(x, z) + 0.08 * scale, z)
        dummy.rotation.set(seeded(index * 7) * 0.45, seeded(index * 13) * Math.PI, seeded(index * 19) * 0.4)
        dummy.scale.set(scale * 1.25, scale * 0.48, scale)
        dummy.updateMatrix()
        rocks.setMatrixAt(count++, dummy.matrix)
        if (count === rocks.count) break
      }
      if (count === rocks.count) break
    }
    rocks.count = count
    rocks.instanceMatrix.needsUpdate = true
    rocks.receiveShadow = true
    rocks.castShadow = true
    rocks.name = 'instanced-riverbank-rocks'
    this.scene.add(rocks)
  }

  private createEnvironment() {
    const dummy = new THREE.Object3D()
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x3e4942, roughness: 0.95 })
    const mossMaterial = new THREE.MeshStandardMaterial({ color: 0x334d2b, roughness: 1 })
    const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), rockMaterial, 22)
    const mossRocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mossMaterial, 12)
    let rockCount = 0
    let mossRockCount = 0
    for (let index = 0; index < 34; index += 1) {
      const side = index % 2 === 0 ? -1 : 1
      const z = -17 + (index % 17) * 2.18
      const boundary = side < 0 ? quality3DWestBoundaryX(z) : quality3DEastBoundaryX(z)
      const x = boundary + side * (0.15 + seeded(index * 17) * 2.9)
      const radius = 0.55 + seeded(index * 31) * 1.15
      const scaleY = 0.8 + seeded(index * 7) * 1.8
      dummy.scale.set(radius, radius * scaleY, radius)
      dummy.position.set(x, terrainHeight(x, z) + radius * scaleY * 0.55, z)
      dummy.rotation.set(seeded(index) * 0.4, seeded(index + 9) * Math.PI, seeded(index + 2) * 0.3)
      dummy.updateMatrix()
      if (index % 3 === 0) mossRocks.setMatrixAt(mossRockCount++, dummy.matrix)
      else rocks.setMatrixAt(rockCount++, dummy.matrix)
    }
    rocks.count = rockCount
    mossRocks.count = mossRockCount
    rocks.instanceMatrix.needsUpdate = true
    mossRocks.instanceMatrix.needsUpdate = true
    rocks.castShadow = mossRocks.castShadow = true
    rocks.receiveShadow = mossRocks.receiveShadow = true
    rocks.name = 'instanced-cliff-rocks'
    mossRocks.name = 'instanced-moss-rocks'
    this.scene.add(rocks, mossRocks)

    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 1 })
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x244b32, roughness: 0.94 })
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.34, 1, 8), trunkMaterial, 28)
    const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 9), foliageMaterial, 84)
    let crownCount = 0
    for (let index = 0; index < 28; index += 1) {
      const side = index % 2 === 0 ? -1 : 1
      const z = -17 + seeded(index * 41) * 35
      const boundary = side < 0 ? quality3DWestBoundaryX(z) : quality3DEastBoundaryX(z)
      const x = boundary + side * (1.4 + seeded(index * 13) * 5.4)
      const height = 2.2 + seeded(index * 19) * 2.2
      const ground = terrainHeight(x, z)
      dummy.rotation.set(0, seeded(index * 31) * 0.35, 0)
      dummy.scale.set(1, height * 0.72, 1)
      dummy.position.set(x, ground + height * 0.36, z)
      dummy.updateMatrix()
      trunks.setMatrixAt(index, dummy.matrix)
      for (let level = 0; level < 3; level += 1) {
        const radius = 1.2 - level * 0.2
        dummy.scale.set(radius, 2, radius)
        dummy.position.set(x, ground + height * 0.58 + level * 0.72, z)
        dummy.updateMatrix()
        crowns.setMatrixAt(crownCount++, dummy.matrix)
      }
    }
    crowns.count = crownCount
    trunks.instanceMatrix.needsUpdate = true
    crowns.instanceMatrix.needsUpdate = true
    trunks.castShadow = crowns.castShadow = true
    trunks.name = 'instanced-tree-trunks'
    crowns.name = 'instanced-tree-crowns'
    this.scene.add(trunks, crowns)

    this.createInstancedGroundDetails()
  }

  private createInstancedGroundDetails() {
    const dummy = new THREE.Object3D()
    const grass = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.08, 0.62, 4),
      new THREE.MeshStandardMaterial({ color: 0x567447, roughness: 1, side: THREE.DoubleSide }),
      480,
    )
    let grassCount = 0
    for (let index = 0; index < 620; index += 1) {
      const x = -11.2 + seeded(index * 23) * 23.2
      const z = -17.2 + seeded(index * 47) * 36.4
      if (!isQuality3DWalkable(x, z) || (Math.abs(x) < 3.5 && Math.abs(z) < 4.2)) continue
      const scale = 0.68 + seeded(index * 11) * 0.72
      dummy.position.set(x, terrainHeight(x, z) + 0.21 * scale, z)
      dummy.rotation.set(0, seeded(index * 3) * Math.PI, (seeded(index * 29) - 0.5) * 0.24)
      dummy.scale.set(0.75 + seeded(index * 5) * 0.5, scale, 0.75 + seeded(index * 7) * 0.5)
      dummy.updateMatrix()
      grass.setMatrixAt(grassCount, dummy.matrix)
      grassCount += 1
      if (grassCount === grass.count) break
    }
    grass.count = grassCount
    grass.instanceMatrix.needsUpdate = true
    grass.frustumCulled = true
    grass.name = 'instanced-grass-detail'
    this.scene.add(grass)

    const pebbles = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.13, 0),
      new THREE.MeshStandardMaterial({ color: 0x667067, roughness: 0.98 }),
      210,
    )
    let pebbleCount = 0
    for (let index = 0; index < 340; index += 1) {
      const x = -11 + seeded(index * 37 + 5) * 22.8
      const z = -17 + seeded(index * 53 + 7) * 35.8
      if (!isQuality3DWalkable(x, z)) continue
      const scale = 0.55 + seeded(index * 17) * 1.35
      dummy.position.set(x, terrainHeight(x, z) + 0.055 * scale, z)
      dummy.rotation.set(seeded(index * 2) * 0.5, seeded(index * 13) * Math.PI, seeded(index * 31) * 0.42)
      dummy.scale.set(scale * 1.35, scale * 0.45, scale)
      dummy.updateMatrix()
      pebbles.setMatrixAt(pebbleCount++, dummy.matrix)
      if (pebbleCount === pebbles.count) break
    }
    pebbles.count = pebbleCount
    pebbles.instanceMatrix.needsUpdate = true
    pebbles.receiveShadow = true
    pebbles.name = 'instanced-pebble-detail'
    this.scene.add(pebbles)

    const stems = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.035, 0.05, 0.25, 6),
      new THREE.MeshStandardMaterial({ color: 0xd7d0aa, roughness: 0.88 }),
      42,
    )
    const caps = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0xb95a3c, roughness: 0.72 }),
      42,
    )
    let mushroomCount = 0
    for (let index = 0; index < 90; index += 1) {
      const x = -10.8 + seeded(index * 61 + 3) * 22.4
      const z = -16.5 + seeded(index * 71 + 9) * 34.6
      if (!isQuality3DWalkable(x, z)) continue
      const ground = terrainHeight(x, z)
      const scale = 0.72 + seeded(index * 19) * 0.66
      dummy.rotation.set(0, seeded(index * 43) * Math.PI, 0)
      dummy.scale.setScalar(scale)
      dummy.position.set(x, ground + 0.125 * scale, z)
      dummy.updateMatrix()
      stems.setMatrixAt(mushroomCount, dummy.matrix)
      dummy.position.y = ground + 0.27 * scale
      dummy.scale.set(scale * 1.1, scale * 0.72, scale * 1.1)
      dummy.updateMatrix()
      caps.setMatrixAt(mushroomCount, dummy.matrix)
      mushroomCount += 1
      if (mushroomCount === stems.count) break
    }
    stems.count = mushroomCount
    caps.count = mushroomCount
    stems.instanceMatrix.needsUpdate = true
    caps.instanceMatrix.needsUpdate = true
    stems.name = 'instanced-mushroom-stems'
    caps.name = 'instanced-mushroom-caps'
    this.scene.add(stems, caps)
  }

  private createDrake(): DrakeRig {
    const root = new THREE.Group()
    root.name = 'juvenile-drake-rig'
    const bodyRig = new THREE.Group()
    root.add(bodyRig)
    const scaleTexture = this.loadRepeatedTexture('/assets/quality-3d/drake-scales-albedo-v1.png', 3.2, 2.2)
    const green = new THREE.MeshStandardMaterial({
      color: 0xb8d8b8,
      map: scaleTexture,
      bumpMap: scaleTexture,
      bumpScale: 0.075,
      roughness: 0.42,
      metalness: 0.08,
    })
    const darkGreen = new THREE.MeshStandardMaterial({
      color: 0x4b876f,
      map: scaleTexture,
      bumpMap: scaleTexture,
      bumpScale: 0.06,
      roughness: 0.54,
    })
    const gold = new THREE.MeshStandardMaterial({ color: 0xb69045, roughness: 0.42, metalness: 0.16 })
    const horn = new THREE.MeshStandardMaterial({ color: 0xceb981, roughness: 0.72 })
    const eye = new THREE.MeshPhysicalMaterial({ color: 0xffa62b, emissive: 0x6a2200, emissiveIntensity: 1.1, roughness: 0.18, clearcoat: 1 })

    const body = this.mesh(new THREE.SphereGeometry(0.78, 24, 18), green, true)
    body.scale.set(1.7, 0.82, 0.92)
    body.position.set(-0.05, 0.98, 0)
    bodyRig.add(body)
    const belly = this.mesh(new THREE.SphereGeometry(0.66, 20, 14, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), gold, true)
    belly.scale.set(1.35, 0.52, 0.72)
    belly.position.set(0.18, 0.78, 0)
    belly.rotation.z = Math.PI / 2
    bodyRig.add(belly)

    const neck = this.mesh(new THREE.CapsuleGeometry(0.38, 0.66, 6, 12), green, true)
    neck.rotation.z = -Math.PI / 2.8
    neck.position.set(1.04, 1.18, 0)
    bodyRig.add(neck)
    const headRig = new THREE.Group()
    headRig.position.set(1.48, 1.38, 0)
    bodyRig.add(headRig)
    const head = this.mesh(new THREE.SphereGeometry(0.5, 22, 16), green, true)
    head.scale.set(1.15, 0.88, 0.92)
    headRig.add(head)
    const snout = this.mesh(new THREE.CapsuleGeometry(0.28, 0.46, 5, 10), darkGreen, true)
    snout.rotation.z = Math.PI / 2
    snout.position.set(0.52, -0.06, 0)
    headRig.add(snout)
    const lowerJaw = this.mesh(new THREE.CapsuleGeometry(0.19, 0.42, 5, 10), gold, true)
    lowerJaw.rotation.z = Math.PI / 2
    lowerJaw.position.set(0.5, -0.25, 0)
    lowerJaw.scale.set(1, 0.62, 0.86)
    headRig.add(lowerJaw)
    const horns: THREE.Mesh[] = []
    for (const side of [-1, 1]) {
      const eyeMesh = this.mesh(new THREE.SphereGeometry(0.105, 14, 10), eye, false)
      eyeMesh.position.set(0.27, 0.14, side * 0.38)
      headRig.add(eyeMesh)
      const brow = this.mesh(new THREE.ConeGeometry(0.1, 0.42, 8), horn, true)
      brow.rotation.z = -Math.PI / 2.8
      brow.position.set(0.02, 0.42, side * 0.28)
      headRig.add(brow)
      horns.push(brow)
      const crownHorn = this.mesh(new THREE.ConeGeometry(0.12, 0.62, 8), horn, true)
      crownHorn.rotation.set(side * 0.14, 0, -0.62)
      crownHorn.position.set(-0.28, 0.38, side * 0.34)
      headRig.add(crownHorn)
      horns.push(crownHorn)
    }

    const spines: THREE.Mesh[] = []
    for (let index = 0; index < 7; index += 1) {
      const spine = this.mesh(new THREE.ConeGeometry(0.11 + index * 0.006, 0.42 + index * 0.025, 6), gold, true)
      spine.position.set(0.75 - index * 0.34, 1.58 - Math.abs(index - 3) * 0.035, 0)
      spine.rotation.z = -0.12
      bodyRig.add(spine)
      spines.push(spine)
    }

    const legs: LegRig[] = []
    const claws: THREE.Mesh[] = []
    const legSpecs = [
      { x: 0.72, z: -0.58, phase: 0 },
      { x: 0.72, z: 0.58, phase: Math.PI },
      { x: -0.68, z: -0.6, phase: Math.PI },
      { x: -0.68, z: 0.6, phase: 0 },
    ]
    for (const spec of legSpecs) {
      const hip = new THREE.Group()
      hip.position.set(spec.x, 0.72, spec.z)
      bodyRig.add(hip)
      const upper = this.mesh(new THREE.CapsuleGeometry(0.15, 0.34, 5, 9), green, true)
      upper.position.y = -0.23
      hip.add(upper)
      const knee = new THREE.Group()
      knee.position.y = -0.42
      hip.add(knee)
      const lower = this.mesh(new THREE.CapsuleGeometry(0.12, 0.27, 5, 9), darkGreen, true)
      lower.position.y = -0.17
      knee.add(lower)
      const foot = this.mesh(new THREE.CapsuleGeometry(0.11, 0.34, 5, 9), gold, true)
      foot.rotation.z = Math.PI / 2
      foot.position.set(0.13, -0.31, 0)
      knee.add(foot)
      for (const toeZ of [-0.11, 0, 0.11]) {
        const claw = this.mesh(new THREE.ConeGeometry(0.045, 0.2, 7), horn, true)
        claw.rotation.z = -Math.PI / 2
        claw.position.set(0.43, -0.31, toeZ)
        knee.add(claw)
        claws.push(claw)
      }
      legs.push({ hip, knee, foot, baseX: spec.x, baseZ: spec.z, phaseOffset: spec.phase })
    }

    const tailJoints: THREE.Group[] = []
    const tailSegments: THREE.Mesh[] = []
    let parent = bodyRig
    for (let index = 0; index < 7; index += 1) {
      const joint = new THREE.Group()
      joint.position.set(index === 0 ? -1.25 : -0.52, index === 0 ? 1.02 : -0.02, 0)
      parent.add(joint)
      const segment = this.mesh(new THREE.CapsuleGeometry(Math.max(0.1, 0.28 - index * 0.026), 0.42, 5, 9), index % 2 === 0 ? green : darkGreen, true)
      segment.rotation.z = Math.PI / 2
      segment.position.x = -0.26
      joint.add(segment)
      tailSegments.push(segment)
      tailJoints.push(joint)
      parent = joint
    }

    const wings: THREE.Group[] = []
    const wingMembranes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = []
    for (const side of [-1, 1]) {
      const wing = new THREE.Group()
      wing.position.set(-0.12, 1.38, side * 0.45)
      wing.userData.side = side
      const wingBone = this.mesh(new THREE.CapsuleGeometry(0.045, 0.98, 5, 8), darkGreen, true)
      wingBone.rotation.x = side * Math.PI / 2
      wingBone.position.set(-0.08, 0.1, side * 0.58)
      wing.add(wingBone)
      const membraneGeometry = new THREE.BufferGeometry()
      membraneGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0,
        -0.12, 0.18, side * 1.45,
        -0.92, 0.06, side * 1.76,
        -1.46, -0.08, side * 1.24,
        -1.02, -0.14, side * 0.84,
        -1.58, -0.16, side * 0.36,
      ], 3))
      membraneGeometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5])
      membraneGeometry.computeVertexNormals()
      const membrane = new THREE.Mesh(
        membraneGeometry,
        new THREE.MeshBasicMaterial({ color: 0x315f55, transparent: true, opacity: 0.76, side: THREE.DoubleSide, depthWrite: false }),
      )
      wing.add(membrane)
      wingMembranes.push(membrane)
      for (const target of [new THREE.Vector3(-1.42, -0.07, side * 1.2), new THREE.Vector3(-1.52, -0.14, side * 0.38)]) {
        const length = target.length()
        const rib = this.mesh(new THREE.CylinderGeometry(0.022, 0.032, length, 6), darkGreen, true)
        rib.position.copy(target).multiplyScalar(0.5)
        rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().normalize())
        wing.add(rib)
      }
      bodyRig.add(wing)
      wings.push(wing)
    }

    const shadow = this.createContactShadow()
    root.add(shadow.root)
    const evolutionFx = this.createEvolutionFx(root)
    const speciesForms = QUALITY_3D_LIZARD_DRAGON_FORMS.map((form) => this.createSpeciesForm(form, scaleTexture))
    speciesForms.forEach((form) => root.add(form.root))
    bodyRig.visible = false
    root.scale.setScalar(1)
    return {
      root,
      bodyRig,
      headRig,
      body,
      belly,
      neck,
      head,
      snout,
      lowerJaw,
      horns,
      spines,
      wings,
      wingMembranes,
      tailSegments,
      claws,
      tailJoints,
      legs,
      shadow,
      materials: { primary: green, secondary: darkGreen, armor: gold, horn, eye },
      evolutionFx,
      speciesForms,
    }
  }

  private createContactShadow(): DrakeRig['shadow'] {
    const root = new THREE.Group()
    root.name = 'creature-contact-shadow'
    root.position.y = CORAL_GECKO_PRESENTATION.contactShadow.groundLift
    const createLayer = (name: string, width: number, length: number, x: number, opacity: number) => {
      const material = new THREE.MeshBasicMaterial({
        color: 0x020503,
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      })
      const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), material)
      mesh.name = name
      mesh.rotation.x = -Math.PI / 2
      mesh.scale.set(width, length, 1)
      mesh.position.x = x
      mesh.renderOrder = 2
      root.add(mesh)
      return material
    }
    const body = createLayer(
      'contact-shadow-body',
      CORAL_GECKO_PRESENTATION.contactShadow.bodyWidth,
      CORAL_GECKO_PRESENTATION.contactShadow.bodyLength,
      -0.08,
      CORAL_GECKO_PRESENTATION.contactShadow.bodyOpacity,
    )
    const head = createLayer(
      'contact-shadow-head',
      CORAL_GECKO_PRESENTATION.contactShadow.headWidth,
      CORAL_GECKO_PRESENTATION.contactShadow.headLength,
      0.72,
      CORAL_GECKO_PRESENTATION.contactShadow.headOpacity,
    )
    const tail = createLayer(
      'contact-shadow-tail',
      CORAL_GECKO_PRESENTATION.contactShadow.tailWidth,
      CORAL_GECKO_PRESENTATION.contactShadow.tailLength,
      -0.9,
      CORAL_GECKO_PRESENTATION.contactShadow.tailOpacity,
    )
    return { root, body, head, tail }
  }

  private createSpeciesForm(definition: Quality3DSpeciesForm, scaleTexture: THREE.Texture): SpeciesFormRig {
    const root = new THREE.Group()
    root.name = `species-form-${definition.formId}`
    root.visible = false
    root.scale.setScalar(definition.scale)
    const primary = new THREE.MeshStandardMaterial({
      color: definition.primary,
      // Keep the lineage palette readable at gameplay zoom. The scale texture is
      // retained as relief only; multiplying it into the albedo made cyan, red,
      // ice and gold forms all collapse into the same muddy green.
      map: null,
      bumpMap: scaleTexture,
      bumpScale: 0.06,
      roughness: definition.bodyPlan === 'ancient-dragon' ? 0.32 : 0.48,
      metalness: definition.bodyPlan === 'ancient-dragon' ? 0.38 : definition.armorLevel * 0.08,
      emissive: definition.bodyPlan === 'ancient-dragon' ? 0x2b1700 : 0x000000,
      emissiveIntensity: definition.bodyPlan === 'ancient-dragon' ? 0.18 : 0,
    })
    const secondary = new THREE.MeshStandardMaterial({ color: definition.secondary, bumpMap: scaleTexture, bumpScale: 0.045, roughness: 0.58 })
    const accent = new THREE.MeshStandardMaterial({ color: definition.accent, roughness: 0.44, metalness: definition.armorLevel * 0.22 })
    const horn = new THREE.MeshStandardMaterial({ color: definition.stage >= 5 ? definition.accent : 0xd9c99d, roughness: 0.7, metalness: definition.stage === 6 ? 0.25 : 0.04 })
    const eye = new THREE.MeshPhysicalMaterial({ color: definition.eye, emissive: definition.eye, emissiveIntensity: 0.75, roughness: 0.16, clearcoat: 1 })
    const body = new THREE.Group()
    root.add(body)

    const angularBody = definition.bodyPlan === 'armored-dragon' || definition.bodyPlan === 'ancient-dragon'
    const bodyMesh = this.mesh(
      angularBody ? new THREE.DodecahedronGeometry(0.5, 1) : new THREE.SphereGeometry(0.5, 22, 16),
      primary,
      true,
    )
    bodyMesh.scale.set(definition.bodyLength, definition.bodyHeight, definition.bodyWidth)
    bodyMesh.position.y = definition.bodyY
    body.add(bodyMesh)

    if (definition.stage >= 2) {
      const chest = this.mesh(new THREE.SphereGeometry(0.5, 18, 14), secondary, true)
      chest.scale.set(definition.bodyHeight * 0.8, definition.bodyHeight * (definition.stage >= 4 ? 0.92 : 0.7), definition.bodyWidth * 0.88)
      chest.position.set(definition.bodyLength * 0.32, definition.bodyY + definition.bodyHeight * 0.08, 0)
      body.add(chest)
    }

    const belly = this.mesh(new THREE.SphereGeometry(0.5, 18, 12), accent, true)
    belly.scale.set(definition.bodyLength * 0.7, definition.bodyHeight * 0.26, definition.bodyWidth * 0.62)
    belly.position.set(definition.bodyLength * 0.08, definition.bodyY - definition.bodyHeight * 0.38, 0)
    body.add(belly)

    const head = new THREE.Group()
    head.position.set(definition.headX, definition.headY, 0)
    body.add(head)
    const angularHead = definition.stage >= 2
    const skull = this.mesh(
      angularHead ? new THREE.DodecahedronGeometry(0.5, definition.stage >= 4 ? 1 : 0) : new THREE.SphereGeometry(0.5, 20, 14),
      primary,
      true,
    )
    skull.scale.set(definition.headLength, definition.headHeight, definition.headWidth)
    head.add(skull)
    const snoutMaterial = definition.stage === 1 ? accent : secondary
    const snout = this.mesh(
      new THREE.CapsuleGeometry(definition.headHeight * (definition.stage <= 1 ? 0.25 : 0.29), definition.snoutLength, 6, 12),
      snoutMaterial,
      true,
    )
    snout.rotation.z = Math.PI / 2
    snout.position.set(definition.headLength * 0.5 + definition.snoutLength * 0.42, -definition.headHeight * 0.08, 0)
    head.add(snout)
    if (definition.stage >= 2) {
      const jaw = this.mesh(new THREE.CapsuleGeometry(definition.headHeight * 0.18, definition.snoutLength * 0.82, 5, 10), secondary, true)
      jaw.rotation.z = Math.PI / 2
      jaw.position.set(definition.headLength * 0.5 + definition.snoutLength * 0.4, -definition.headHeight * 0.28, 0)
      head.add(jaw)
    }
    for (const side of [-1, 1]) {
      const eyeMesh = this.mesh(new THREE.SphereGeometry(definition.stage <= 1 ? 0.115 : 0.09, 12, 9), eye, false)
      eyeMesh.position.set(definition.headLength * 0.24, definition.headHeight * 0.18, side * definition.headWidth * 0.46)
      head.add(eyeMesh)
    }

    const neckStart = new THREE.Vector3(definition.bodyLength * 0.38, definition.bodyY + definition.bodyHeight * 0.12, 0)
    const neckEnd = new THREE.Vector3(definition.headX - definition.headLength * 0.38, definition.headY - definition.headHeight * 0.08, 0)
    const neckVector = neckEnd.clone().sub(neckStart)
    const neckMesh = this.mesh(new THREE.CapsuleGeometry(definition.bodyWidth * 0.23, Math.max(0.12, neckVector.length() - definition.bodyWidth * 0.46), 6, 11), primary, true)
    neckMesh.position.copy(neckStart).add(neckEnd).multiplyScalar(0.5)
    neckMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), neckVector.clone().normalize())
    body.add(neckMesh)

    for (let index = 0; index < definition.hornCount; index += 1) {
      const side = index % 2 === 0 ? -1 : 1
      const row = Math.floor(index / 2)
      const hornMesh = this.mesh(new THREE.ConeGeometry(0.07 + row * 0.014, 0.36 + row * 0.1, 7), horn, true)
      hornMesh.position.set(-definition.headLength * (0.08 + row * 0.1), definition.headHeight * (0.42 + row * 0.04), side * definition.headWidth * (0.28 + row * 0.045))
      hornMesh.rotation.set(side * 0.18, 0, -0.55 - row * 0.06)
      head.add(hornMesh)
    }

    for (let index = 0; index < definition.spineCount; index += 1) {
      const ratio = definition.spineCount <= 1 ? 0.5 : index / (definition.spineCount - 1)
      const isCrest = definition.bodyPlan === 'crested-gecko'
      const spine = this.mesh(
        isCrest ? new THREE.ConeGeometry(0.08, 0.46, 5) : new THREE.ConeGeometry(0.07 + definition.armorLevel * 0.04, 0.28 + definition.armorLevel * 0.28, 6),
        accent,
        true,
      )
      spine.position.set(definition.bodyLength * (0.42 - ratio * 0.82), definition.bodyY + definition.bodyHeight * 0.52, 0)
      if (isCrest) spine.scale.z = 2.1
      body.add(spine)
    }

    if (definition.armorLevel > 0.35) {
      const plateCount = 3 + Math.round(definition.armorLevel * 3)
      for (let index = 0; index < plateCount; index += 1) {
        const plate = this.mesh(new THREE.DodecahedronGeometry(0.24 + definition.armorLevel * 0.08, 0), accent, true)
        plate.scale.set(1.45, 0.36, 1.15)
        plate.position.set(definition.bodyLength * (0.3 - index / Math.max(1, plateCount - 1) * 0.62), definition.bodyY + definition.bodyHeight * 0.45, (index % 2 ? -1 : 1) * definition.bodyWidth * 0.22)
        body.add(plate)
      }
    }

    const legs: THREE.Group[] = []
    const legXs = definition.legCount === 2 ? [-definition.bodyLength * 0.22] : [definition.bodyLength * 0.28, -definition.bodyLength * 0.28]
    for (const x of legXs) {
      for (const side of [-1, 1]) {
        const frontLeg = x > 0
        const lengthScale = definition.bodyPlan === 'predator-drake' && frontLeg ? 0.72 : 1
        const legLength = definition.legLength * lengthScale
        const leg = new THREE.Group()
        leg.position.set(x, legLength * 0.92 + 0.05, side * definition.legSpread)
        if (definition.stage <= 1) leg.rotation.x = side * 0.28
        body.add(leg)
        const upper = this.mesh(new THREE.CapsuleGeometry(0.09 + definition.bodyHeight * 0.07, legLength * 0.36, 5, 8), primary, true)
        upper.position.y = -legLength * 0.23
        leg.add(upper)
        const lower = this.mesh(new THREE.CapsuleGeometry(0.075 + definition.bodyHeight * 0.05, legLength * 0.34, 5, 8), secondary, true)
        lower.position.set(frontLeg ? 0.08 : -0.06, -legLength * 0.66, 0)
        lower.rotation.z = frontLeg ? -0.2 : 0.28
        leg.add(lower)
        const foot = this.mesh(new THREE.DodecahedronGeometry(0.18 + definition.stage * 0.018, 1), accent, true)
        foot.scale.set(1.6, 0.46, 0.9)
        foot.position.set(0.14, -legLength * 0.92, 0)
        leg.add(foot)
        for (const toeSide of [-1, 0, 1]) {
          const toe = this.mesh(new THREE.ConeGeometry(0.025 + definition.stage * 0.004, 0.18 + definition.stage * 0.018, 6), horn, true)
          toe.rotation.z = -Math.PI / 2
          toe.position.set(0.27 + definition.stage * 0.012, -legLength * 0.94, toeSide * (0.07 + definition.stage * 0.006))
          leg.add(toe)
        }
        legs.push(leg)
      }
    }

    const tailJoints: THREE.Group[] = []
    const segmentLength = definition.tailLength / definition.tailSegments
    let tailParent = body
    for (let index = 0; index < definition.tailSegments; index += 1) {
      const joint = new THREE.Group()
      joint.position.set(index === 0 ? -definition.bodyLength * 0.48 : -segmentLength * 0.88, index === 0 ? definition.bodyY : -0.01, 0)
      tailParent.add(joint)
      const radius = Math.max(0.055, definition.bodyWidth * (0.26 - index / definition.tailSegments * 0.21))
      const segment = this.mesh(new THREE.CapsuleGeometry(radius, segmentLength * 0.72, 5, 8), index % 2 ? secondary : primary, true)
      segment.rotation.z = Math.PI / 2
      segment.position.x = -segmentLength * 0.44
      joint.add(segment)
      tailJoints.push(joint)
      tailParent = joint
    }

    const wings: THREE.Group[] = []
    if (definition.wingSpan > 0) {
      for (const side of [-1, 1] as const) {
        const wing = this.createSpeciesWing(definition, side, secondary, horn)
        wing.position.set(definition.bodyLength * 0.08, definition.bodyY + definition.bodyHeight * 0.32, side * definition.bodyWidth * 0.28)
        body.add(wing)
        wings.push(wing)
      }
    }

    return { root, stage: definition.stage, formId: definition.formId, bodyPlan: definition.bodyPlan, baseScale: definition.scale, body, head, legs, feet: [], tailJoints, wings, assetSource: 'procedural' }
  }

  private createSpeciesWing(definition: Quality3DSpeciesForm, side: -1 | 1, boneMaterial: THREE.Material, hornMaterial: THREE.Material) {
    const wing = new THREE.Group()
    wing.userData.side = side
    const span = definition.wingSpan
    const chord = definition.wingChord
    const membraneGeometry = new THREE.BufferGeometry()
    membraneGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      0.18, 0.22, side * span * 0.56,
      -chord * 0.28, 0.12, side * span,
      -chord * 0.92, -0.08, side * span * 0.72,
      -chord * 0.58, -0.15, side * span * 0.42,
      -chord, -0.18, side * span * 0.16,
    ], 3))
    membraneGeometry.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5])
    membraneGeometry.computeVertexNormals()
    const membrane = new THREE.Mesh(membraneGeometry, new THREE.MeshBasicMaterial({ color: definition.membrane, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false }))
    wing.add(membrane)
    for (const target of [
      new THREE.Vector3(-chord * 0.27, 0.1, side * span * 0.92),
      new THREE.Vector3(-chord * 0.88, -0.12, side * span * 0.68),
      new THREE.Vector3(-chord * 0.96, -0.16, side * span * 0.16),
    ]) {
      const rib = this.mesh(new THREE.CylinderGeometry(0.025 + definition.stage * 0.004, 0.038 + definition.stage * 0.004, target.length(), 7), boneMaterial, true)
      rib.position.copy(target).multiplyScalar(0.5)
      rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().normalize())
      wing.add(rib)
    }
    const hook = this.mesh(new THREE.ConeGeometry(0.06, 0.32, 7), hornMaterial, true)
    hook.position.set(-chord * 0.3, 0.1, side * span * 0.96)
    hook.rotation.x = side * Math.PI / 2
    wing.add(hook)
    return wing
  }

  private createEvolutionFx(parent: THREE.Group) {
    const group = new THREE.Group()
    group.name = 'evolution-energy-field'
    group.visible = false
    const rings: THREE.Mesh[] = []
    for (let index = 0; index < 3; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: index === 2 ? 0xffd76a : 0x74ffe4,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25 + index * 0.18, 0.028, 6, 64), material)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.35 + index * 0.48
      group.add(ring)
      rings.push(ring)
    }
    const moteMaterial = new THREE.MeshBasicMaterial({ color: 0xbaffee, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
    const moteGeometry = new THREE.SphereGeometry(0.045, 8, 6)
    const motes: THREE.Mesh[] = []
    for (let index = 0; index < 14; index += 1) {
      const mote = new THREE.Mesh(moteGeometry, moteMaterial.clone())
      mote.userData.phase = index / 14 * Math.PI * 2
      group.add(mote)
      motes.push(mote)
    }
    const light = new THREE.PointLight(0x7affdf, 0, 8, 2)
    light.position.y = 1.1
    group.add(light)
    parent.add(group)
    return { group, rings, motes, light }
  }

  private applyEvolutionMorph(morphology: Quality3DMorphology, _pulseScale = 1) {
    const { drake } = this
    drake.root.scale.setScalar(1)
    drake.body.scale.set(1.7 * morphology.bodyLength, 0.82 * morphology.bodyBulk, 0.92 * morphology.bodyBulk)
    drake.belly.scale.set(1.35 * morphology.bodyLength, 0.52 * morphology.bodyBulk, 0.72 * morphology.bodyBulk)
    drake.neck.scale.setScalar(morphology.neckScale)
    drake.neck.position.x = 1.04 + (morphology.bodyLength - 1) * 0.55
    drake.headRig.position.x = 1.48 + (morphology.bodyLength - 1) * 0.9
    drake.head.scale.set(1.15 * morphology.headScale, 0.88 * morphology.headScale, 0.92 * morphology.headScale)
    drake.snout.scale.set(1, 1 + (morphology.bodyLength - 1) * 0.85, 1)
    drake.lowerJaw.scale.set(1, (0.62 + (morphology.bodyLength - 1) * 0.3), 0.86)
    drake.horns.forEach((mesh, index) => mesh.scale.setScalar(morphology.hornGrowth * (index % 2 === 0 ? 1 : 1.08)))
    drake.spines.forEach((mesh, index) => mesh.scale.setScalar(morphology.spineGrowth * (0.9 + index * 0.025)))
    drake.wings.forEach((wing) => {
      wing.scale.setScalar(morphology.wingGrowth)
    })
    drake.wingMembranes.forEach((membrane) => membrane.material.color.setHex(morphology.secondary).lerp(new THREE.Color(morphology.primary), 0.45))
    drake.tailSegments.forEach((segment, index) => {
      segment.scale.set(1, morphology.tailGrowth * (1 + index * 0.015), 1)
    })
    drake.claws.forEach((claw) => claw.scale.setScalar(morphology.clawGrowth))
    drake.materials.primary.color.setHex(morphology.primary)
    drake.materials.secondary.color.setHex(morphology.secondary)
    drake.materials.armor.color.setHex(morphology.armor)
    drake.materials.horn.color.setHex(morphology.horn)
    drake.materials.eye.color.setHex(morphology.eye)
  }

  private async loadGLBSpeciesForms() {
    const results = await Promise.allSettled(QUALITY_3D_GLB_ASSETS.map(async (asset) => {
      const gltf = await this.gltfLoader.loadAsync(assetUrl(asset.url))
      this.replaceSpeciesFormWithGLB(asset, gltf)
    }))
    const failed = results.filter((result) => result.status === 'rejected')
    if (failed.length) console.warn(`Quality3D: ${failed.length} GLB species assets failed; procedural fallbacks remain active.`)
  }

  private replaceSpeciesFormWithGLB(asset: Quality3DGLBAsset, gltf: GLTF) {
    const existing = this.drake.speciesForms[asset.stage]
    if (!existing) return
    const missingNode = asset.requiredNodes.find((name) => !gltf.scene.getObjectByName(name))
    const missingClip = asset.requiredClips.find((name) => !gltf.animations.some((clip) => clip.name === name))
    if (missingNode || missingClip) throw new Error(`Invalid ${asset.formId} GLB: missing ${missingNode ?? missingClip}`)

    const root = new THREE.Group()
    root.name = `glb-species-form-${asset.formId}`
    root.visible = existing.root.visible
    root.scale.setScalar(asset.scale)
    gltf.scene.rotation.y = asset.modelYaw ?? 0
    root.add(gltf.scene)
    const materialTuning = { materials: 0, normalMapped: 0, aoMapped: 0 }
    const tunedMaterials = new Set<THREE.MeshStandardMaterial>()
    const materialProfile = asset.formId === 'scarlet-hunter'
      ? SCARLET_HUNTER_PRESENTATION.material
      : asset.formId === 'scarlet-gecko'
        ? SCARLET_GECKO_PRESENTATION.material
        : CORAL_GECKO_PRESENTATION.material
    gltf.scene.traverse((node) => {
      if (node.name === 'Icosphere') {
        node.visible = false
        if (node instanceof THREE.Mesh) {
          node.castShadow = false
          node.receiveShadow = false
        }
        return
      }
      if (node instanceof THREE.Mesh) {
        node.castShadow = true
        node.receiveShadow = true
        node.frustumCulled = true
        if (presentationForFormId(asset.formId)) {
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          for (const material of materials) {
            if (!(material instanceof THREE.MeshStandardMaterial) || tunedMaterials.has(material)) continue
            tunedMaterials.add(material)
            material.roughness = THREE.MathUtils.clamp(
              material.roughness * 1.06,
              materialProfile.minimumRoughness,
              materialProfile.maximumRoughness,
            )
            material.metalness = Math.min(material.metalness, materialProfile.maximumMetalness)
            material.envMapIntensity = materialProfile.environmentIntensity
            if (asset.formId === 'scarlet-gecko') {
              material.color.setHex(SCARLET_GECKO_PRESENTATION.material.colorTint)
              material.emissive.setHex(0xffffff)
              material.emissiveMap = material.map
              material.emissiveIntensity = SCARLET_GECKO_PRESENTATION.material.emissiveIntensity
              applyScarletGeckoSurfaceGrade(material)
            }
            if (asset.formId === 'scarlet-hunter') {
              material.flatShading = false
              material.normalMap = null
            }
            material.aoMapIntensity = materialProfile.aoStrength
            if (asset.formId === 'scarlet-hunter') {
              material.emissive.setHex(0x1b0603)
              material.emissiveIntensity = 0.14
            }
            if (material.normalMap) {
              material.normalScale.setScalar(materialProfile.normalStrength)
              materialTuning.normalMapped += 1
            }
            if (material.aoMap) materialTuning.aoMapped += 1
            for (const texture of [material.map, material.normalMap, material.roughnessMap, material.metalnessMap, material.aoMap]) {
              if (!texture) continue
              texture.anisotropy = Math.min(
                materialProfile.maximumAnisotropy,
                this.renderer.capabilities.getMaxAnisotropy(),
              )
              texture.needsUpdate = true
            }
            material.needsUpdate = true
          }
        }
      }
    })
    materialTuning.materials = tunedMaterials.size
    const body = (root.getObjectByName(asset.rig?.body ?? 'Body') ?? gltf.scene) as THREE.Group
    const head = (root.getObjectByName(asset.rig?.head ?? 'Head') ?? gltf.scene) as THREE.Group
    const legs = asset.requiredNodes.filter((name) => name.startsWith('Leg')).map((name) => root.getObjectByName(name) as THREE.Group)
    const footNames = asset.rig?.feet ?? asset.requiredNodes.filter((name) => name.startsWith('Foot'))
    const feet = footNames.map((name) => root.getObjectByName(name) as THREE.Object3D)
    const tailJoints: THREE.Group[] = []
    if (asset.rig) {
      for (const name of asset.rig.tail) tailJoints.push(root.getObjectByName(name) as THREE.Group)
    } else {
      for (let index = 0; ; index += 1) {
        const node = root.getObjectByName(`Tail_${index}`) as THREE.Group | undefined
        if (!node) break
        tailJoints.push(node)
      }
    }
    const wings = ['WingL', 'WingR'].map((name) => root.getObjectByName(name) as THREE.Group | undefined).filter((node): node is THREE.Group => Boolean(node))
    const mixer = new THREE.AnimationMixer(root)
    const actions = new Map(gltf.animations.map((sourceClip) => {
      const clip = asset.formId === 'scarlet-gecko' ? stabilizeScarletGeckoLocomotionClip(sourceClip) : sourceClip
      return [clip.name, mixer.clipAction(clip)] as const
    }))
    actions.get('Idle')?.play()

    this.drake.root.remove(existing.root)
    this.drake.root.add(root)
    this.drake.speciesForms[asset.stage] = {
      root,
      stage: asset.stage,
      formId: asset.formId,
      bodyPlan: getQuality3DSpeciesForm(asset.stage).bodyPlan,
      baseScale: asset.scale,
      body,
      head,
      legs,
      feet,
      tailJoints,
      wings,
      assetSource: 'glb',
      mixer,
      actions,
      activeAction: 'Idle',
      motion: asset.motion,
      materialTuning,
      groundCorrection: 0,
    }
    this.loadedGLBCount += 1
    this.setSpeciesFormVisual(this.isEvolving ? this.targetEvolutionStage : this.currentEvolutionStage)
  }

  private setGLBAction(form: SpeciesFormRig, name: string, force = false) {
    if (!form.actions) return
    const clipName = quality3DClipName(form.formId, name)
    const next = form.actions.get(clipName)
    if (!next) return
    const presentation = presentationForFormId(form.formId)
    const attackPlaybackRate = (form.formId === 'coral-gecko' || form.formId === 'scarlet-gecko') && name === 'Pounce'
      ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipPlaybackRate
      : form.formId === 'scarlet-hunter'
      && (name === 'Pounce' || name === 'Claw' || name === 'TailSwipe')
      ? SCARLET_HUNTER_PRESENTATION.combat.attackPlaybackRate[name]
      : null
    const playbackRate = attackPlaybackRate ?? (presentation
      ? name === 'Run'
        ? presentation.animation.runPlaybackRate
        : name === 'Turn'
          ? presentation.animation.turnPlaybackRate
          : presentation.animation.idlePlaybackRate
      : 1)
    next.setEffectiveTimeScale(playbackRate)
    const oneShot = name === 'Bite' || name === 'Claw' || name === 'Pounce' || name === 'TailSwipe' || name === 'Hit' || name === 'Death'
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity)
    next.clampWhenFinished = oneShot
    if (form.activeAction === name && !force) return
    const previous = form.actions.get(quality3DClipName(form.formId, form.activeAction ?? ''))
    const crossfade = oneShot
      ? presentation?.combat.oneShotCrossfadeSeconds ?? CORAL_GECKO_PRESENTATION.combat.oneShotCrossfadeSeconds
      : presentation?.animation.crossfadeSeconds ?? CORAL_GECKO_PRESENTATION.animation.crossfadeSeconds
    previous?.fadeOut(crossfade)
    next.reset().fadeIn(crossfade).play()
    form.activeAction = name
  }

  private setSpeciesFormVisual(stageIndex: number) {
    const stage = getQuality3DSpeciesForm(stageIndex)
    this.drake.speciesForms.forEach((form) => {
      form.root.visible = form.stage === stage.stage
      form.root.scale.setScalar(form.baseScale)
      form.root.position.set(0, 0, 0)
      form.root.rotation.set(0, 0, 0)
    })
  }

  private applySpeciesTransition(growth: number, impact: number) {
    const from = this.drake.speciesForms[this.currentEvolutionStage]
    const target = this.drake.speciesForms[this.targetEvolutionStage]
    if (!from || !target) return
    const switchPoint = 0.54
    if (growth < switchPoint) {
      this.drake.speciesForms.forEach((form) => { form.root.visible = form === from })
      from.root.scale.setScalar(from.baseScale * (1 - growth / switchPoint * 0.24))
      from.root.position.y = growth / switchPoint * 0.12
      from.root.rotation.z = -growth / switchPoint * 0.05
      return
    }
    if (!this.evolutionFormSwapped) {
      this.evolutionFormSwapped = true
      this.drake.speciesForms.forEach((form) => { form.root.visible = form === target })
    }
    const reveal = Math.min(1, (growth - switchPoint) / (1 - switchPoint))
    const easedReveal = 1 - Math.pow(1 - reveal, 3)
    target.root.scale.setScalar(target.baseScale * (0.7 + easedReveal * 0.3 + impact * 0.07))
    target.root.position.y = (1 - easedReveal) * 0.18
    target.root.rotation.z = (1 - easedReveal) * 0.08
  }

  private createEvolutionPanel() {
    const panel = document.createElement('section')
    panel.className = 'quality3d-evolution-panel'
    panel.setAttribute('aria-label', '幼龙六阶段进化演示')
    panel.innerHTML = `
      <header>
        <span>EVOLUTION SPECIES · 01</span>
        <strong data-evolution-name></strong>
        <small data-evolution-title></small>
      </header>
      <p data-evolution-description></p>
      <div class="quality3d-evolution-progress"><i data-evolution-progress></i></div>
      <div class="quality3d-evolution-stages" role="list" aria-label="进化阶段">
        ${QUALITY_3D_EVOLUTION_STAGES.map((stage) => `<button type="button" data-evolution-stage="${stage.stage}" aria-label="查看${stage.name}"><b>${stage.stage}</b><span>${stage.name}</span></button>`).join('')}
      </div>
      <footer>
        <span data-evolution-unlock></span>
        <button type="button" class="quality3d-evolution-auto" data-evolution-auto>暂停自动演示</button>
      </footer>
    `
    panel.addEventListener('pointerdown', (event) => event.stopPropagation())
    panel.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const stageButton = target.closest<HTMLButtonElement>('[data-evolution-stage]')
      if (stageButton) {
        this.autoEvolution = false
        this.startEvolution(Number(stageButton.dataset.evolutionStage))
        this.updateEvolutionPanel()
        return
      }
      if (target.closest('[data-evolution-auto]')) {
        this.autoEvolution = !this.autoEvolution
        if (this.autoEvolution) {
          if (this.currentEvolutionStage >= QUALITY_3D_EVOLUTION_STAGES.length - 1) this.setEvolutionStageImmediate(0)
          this.autoEvolutionCountdown = 0.55
        }
        this.updateEvolutionPanel()
      }
    })
    this.container.append(panel)
    this.evolutionPanel = panel
  }

  private startEvolution(stageIndex: number) {
    const stage = getQuality3DEvolutionStage(stageIndex)
    if (this.isEvolving || stage.stage === this.currentEvolutionStage) return
    this.targetEvolutionStage = stage.stage
    this.evolutionFromMorph = getQuality3DEvolutionStage(this.currentEvolutionStage).morphology
    this.evolutionElapsed = 0
    this.evolutionProgress = 0
    this.isEvolving = true
    this.evolutionFormSwapped = false
    this.hasTarget = false
    this.drake.evolutionFx.group.visible = true
    this.updateEvolutionPanel()
  }

  private setEvolutionStageImmediate(stageIndex: number) {
    const stage = getQuality3DEvolutionStage(stageIndex)
    this.currentEvolutionStage = stage.stage
    this.targetEvolutionStage = stage.stage
    this.evolutionProgress = 1
    this.isEvolving = false
    this.applyEvolutionMorph(stage.morphology)
    this.setSpeciesFormVisual(stage.stage)
    this.drake.evolutionFx.group.visible = false
    this.updateEvolutionPanel()
  }

  private updateEvolution(delta: number) {
    if (!this.evolutionLabEnabled) return
    if (!this.isEvolving) {
      if (!this.autoEvolution) return
      this.autoEvolutionCountdown -= delta
      if (this.autoEvolutionCountdown > 0) return
      if (this.currentEvolutionStage >= QUALITY_3D_EVOLUTION_STAGES.length - 1) {
        this.setEvolutionStageImmediate(0)
        this.autoEvolutionCountdown = 0.7
      } else this.startEvolution(this.currentEvolutionStage + 1)
      return
    }

    this.evolutionElapsed += delta
    const envelope = getQuality3DEvolutionEnvelope(this.evolutionElapsed)
    this.evolutionProgress = envelope.raw
    const target = getQuality3DEvolutionStage(this.targetEvolutionStage).morphology
    const morphology = mixQuality3DMorphology(this.evolutionFromMorph, target, envelope.growth)
    const anticipationSquash = (1 - envelope.growth) * envelope.anticipation * 0.055
    const pulse = 1 - anticipationSquash + envelope.impact * 0.095
    this.applyEvolutionMorph(morphology, pulse)
    this.applySpeciesTransition(envelope.growth, envelope.impact)
    this.animationState = `evolving-stage-${this.targetEvolutionStage}`
    this.cameraTrauma = Math.max(this.cameraTrauma, envelope.impact * 0.72)
    const fx = this.drake.evolutionFx
    fx.group.visible = true
    fx.light.color.setHex(target.eye)
    fx.light.intensity = 1.1 + envelope.anticipation * 2.4 + envelope.impact * 5.6
    fx.rings.forEach((ring, index) => {
      ring.rotation.z = this.evolutionElapsed * (index % 2 === 0 ? 1.8 : -1.45) + index
      ring.scale.setScalar(0.65 + envelope.growth * 0.72 + envelope.impact * 0.2 + index * 0.04)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.12 + envelope.anticipation * 0.28 + envelope.impact * 0.5
    })
    fx.motes.forEach((mote, index) => {
      const phase = mote.userData.phase as number
      const radius = 0.8 + (index % 3) * 0.28 + envelope.growth * 0.35
      mote.position.set(
        Math.cos(phase + this.evolutionElapsed * 2.3) * radius,
        0.18 + ((phase / (Math.PI * 2) + this.evolutionElapsed * 0.65) % 1) * 2.15,
        Math.sin(phase + this.evolutionElapsed * 2.3) * radius,
      )
      ;(mote.material as THREE.MeshBasicMaterial).opacity = 0.2 + envelope.anticipation * 0.58
    })
    this.drake.materials.primary.emissive.setHex(target.eye)
    this.drake.materials.primary.emissiveIntensity = envelope.impact * 0.55 + (1 - envelope.settle) * 0.08
    this.updateEvolutionPanel()

    if (!envelope.complete) return
    this.currentEvolutionStage = this.targetEvolutionStage
    this.evolutionProgress = 1
    this.isEvolving = false
    this.applyEvolutionMorph(target)
    this.setSpeciesFormVisual(this.currentEvolutionStage)
    this.drake.materials.primary.emissiveIntensity = 0
    fx.group.visible = false
    this.autoEvolutionCountdown = this.currentEvolutionStage === QUALITY_3D_EVOLUTION_STAGES.length - 1 ? 2.4 : 1.15
    this.updateEvolutionPanel()
  }

  private updateEvolutionPanel() {
    if (!this.evolutionPanel) return
    const stage = getQuality3DEvolutionStage(this.isEvolving ? this.targetEvolutionStage : this.currentEvolutionStage)
    const setText = (selector: string, value: string) => {
      const element = this.evolutionPanel?.querySelector<HTMLElement>(selector)
      if (element) element.textContent = value
    }
    setText('[data-evolution-name]', `${String(stage.stage).padStart(2, '0')} · ${stage.name}`)
    setText('[data-evolution-title]', stage.title)
    setText('[data-evolution-description]', stage.description)
    setText('[data-evolution-unlock]', this.isEvolving ? `正在完成${stage.unlock}` : stage.unlock)
    const progress = this.evolutionPanel.querySelector<HTMLElement>('[data-evolution-progress]')
    if (progress) progress.style.width = `${this.isEvolving ? Math.round(this.evolutionProgress * 100) : 100}%`
    this.evolutionPanel.dataset.state = this.isEvolving ? 'transforming' : 'stable'
    this.evolutionPanel.querySelectorAll<HTMLButtonElement>('[data-evolution-stage]').forEach((button) => {
      const active = Number(button.dataset.evolutionStage) === stage.stage
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-current', active ? 'step' : 'false')
    })
    const auto = this.evolutionPanel.querySelector<HTMLButtonElement>('[data-evolution-auto]')
    if (auto) auto.textContent = this.autoEvolution ? '暂停自动演示' : '自动播放六次进化'
  }

  private loadRepeatedTexture(path: string, repeatX: number, repeatY: number) {
    const texture = new THREE.TextureLoader().load(assetUrl(path))
    texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(repeatX, repeatY)
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    return texture
  }

  private mesh(geometry: THREE.BufferGeometry, material: THREE.Material, shadow: boolean) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = shadow
    mesh.receiveShadow = shadow
    return mesh
  }

  private createCombatDummy(): CombatDummyRig {
    const root = new THREE.Group()
    root.name = 'basic-attack-training-beetle'
    const visual = new THREE.Group()
    root.add(visual)

    const shell = new THREE.MeshStandardMaterial({ color: 0x6d3928, roughness: 0.64, metalness: 0.04 })
    const armor = new THREE.MeshStandardMaterial({ color: 0xb56b35, roughness: 0.52, metalness: 0.06 })
    const underside = new THREE.MeshStandardMaterial({ color: 0x34251f, roughness: 0.9 })
    const eye = new THREE.MeshStandardMaterial({ color: 0xffd46a, emissive: 0x7a3100, emissiveIntensity: 0.7, roughness: 0.32 })
    const materials = [shell, armor, underside]

    const body = this.mesh(new THREE.SphereGeometry(0.68, 20, 14), shell, true)
    body.scale.set(1.15, 0.66, 0.88)
    body.position.y = 0.58
    visual.add(body)
    const backPlate = this.mesh(new THREE.SphereGeometry(0.58, 18, 12), armor, true)
    backPlate.scale.set(1.02, 0.42, 0.82)
    backPlate.position.set(0.05, 0.79, 0)
    visual.add(backPlate)
    const head = this.mesh(new THREE.SphereGeometry(0.38, 16, 12), underside, true)
    head.scale.set(0.95, 0.72, 0.92)
    head.position.set(-0.72, 0.52, 0)
    visual.add(head)
    for (const side of [-1, 1]) {
      const eyeMesh = this.mesh(new THREE.SphereGeometry(0.07, 10, 8), eye, true)
      eyeMesh.position.set(-0.99, 0.62, side * 0.22)
      visual.add(eyeMesh)
      for (let index = 0; index < 3; index += 1) {
        const leg = this.mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.68, 7), underside, true)
        leg.position.set(-0.34 + index * 0.38, 0.27, side * (0.48 + index * 0.045))
        leg.rotation.x = side * (0.84 + index * 0.08)
        leg.rotation.z = (index - 1) * 0.28
        visual.add(leg)
      }
    }
    const horn = this.mesh(new THREE.ConeGeometry(0.13, 0.5, 8), armor, true)
    horn.rotation.z = Math.PI / 2
    horn.position.set(-1.02, 0.52, 0)
    visual.add(horn)

    const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x07100d, transparent: true, opacity: 0.34, depthWrite: false })
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.72, 32), shadowMaterial)
    shadow.rotation.x = -Math.PI / 2
    shadow.scale.set(1.25, 0.7, 1)
    shadow.position.y = 0.035
    root.add(shadow)

    const healthBar = new THREE.Group()
    healthBar.name = 'training-beetle-health-bar'
    const barBack = new THREE.Mesh(
      new THREE.PlaneGeometry(1.72, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x180e0b, transparent: true, opacity: 0.88, depthTest: false, depthWrite: false }),
    )
    const healthFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xf0b64d, depthTest: false, depthWrite: false }),
    )
    barBack.renderOrder = 30
    healthFill.position.z = 0.02
    healthFill.renderOrder = 31
    healthBar.add(barBack, healthFill)
    healthBar.renderOrder = 30
    this.scene.add(root, healthBar)

    return {
      root,
      visual,
      healthBar,
      healthFill,
      materials,
      health: CORAL_GECKO_PRESENTATION.combat.demoTarget.maxHealth,
      state: 'alive',
      flashRemaining: 0,
      respawnRemaining: 0,
      knockbackVelocity: new THREE.Vector3(),
      hits: 0,
      deaths: 0,
      lastHitAction: 'none',
    }
  }

  private createImpactParticles() {
    const geometry = new THREE.OctahedronGeometry(0.075, 0)
    const material = new THREE.MeshBasicMaterial({ color: 0xffc768, transparent: true, opacity: 0.94, depthWrite: false })
    for (let index = 0; index < 18; index += 1) {
      const particle = new THREE.Mesh(geometry, material)
      particle.visible = false
      particle.renderOrder = 20
      particle.userData.life = 0
      particle.userData.duration = 0.24
      particle.userData.velocity = new THREE.Vector3()
      this.scene.add(particle)
      this.impactParticles.push(particle)
    }
  }

  private createAttackTrails() {
    for (let poolIndex = 0; poolIndex < 3; poolIndex += 1) {
      const trail = new THREE.Group()
      trail.name = `basic-attack-contact-${poolIndex}`
      trail.visible = false
      trail.userData.life = 0
      trail.userData.duration = 0.2
      for (let arcIndex = 0; arcIndex < 3; arcIndex += 1) {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(0.78, 0.035, 6, 26, Math.PI * 0.82),
          new THREE.MeshBasicMaterial({
            color: 0xffd7a0,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        )
        arc.renderOrder = 24
        arc.userData.baseScale = 1
        trail.add(arc)
      }
      this.scene.add(trail)
      this.attackTrails.push(trail)
    }
  }

  private resetCombatDummy(initial = false) {
    const forward = new THREE.Vector3(Math.cos(this.currentYaw), 0, -Math.sin(this.currentYaw))
    const spawn = this.drake.root.position.clone().addScaledVector(forward, CORAL_GECKO_PRESENTATION.combat.demoTarget.spawnDistance)
    this.combatDummy.root.position.set(spawn.x, terrainHeight(spawn.x, spawn.z), spawn.z)
    this.combatDummy.root.visible = true
    this.combatDummy.visual.position.set(0, 0, 0)
    this.combatDummy.visual.rotation.set(0, 0, 0)
    this.combatDummy.visual.scale.setScalar(1)
    this.combatDummy.healthBar.visible = true
    this.combatDummy.health = CORAL_GECKO_PRESENTATION.combat.demoTarget.maxHealth
    this.combatDummy.state = 'alive'
    this.combatDummy.flashRemaining = 0
    this.combatDummy.respawnRemaining = 0
    this.combatDummy.knockbackVelocity.set(0, 0, 0)
    if (initial) {
      this.combatDummy.hits = 0
      this.combatDummy.deaths = 0
      this.combatDummy.lastHitAction = 'none'
    }
  }

  private isCombatDummyInRange(action: string) {
    if (this.combatDummy.state !== 'alive') return false
    const toTarget = this.combatDummy.root.position.clone().sub(this.drake.root.position).setY(0)
    const distance = toTarget.length()
    if (distance <= 0.001) return true
    const forward = new THREE.Vector3(Math.cos(this.currentYaw), 0, -Math.sin(this.currentYaw))
    const facing = forward.dot(toTarget.normalize())
    const profile = this.activeBasicAttackProfile()
    const range = action === 'TailSwipe'
      ? profile.hitFeedback.tailSwipeRange
      : action === 'Pounce'
        ? profile.hitFeedback.pounceRange
      : action === 'Claw'
        ? profile.hitFeedback.clawRange
        : profile.hitFeedback.biteRange
    return distance <= range && facing >= (action === 'TailSwipe' ? -0.05 : 0.38)
  }

  private activeBasicAttackProfile() {
    const activeForm = this.drake.speciesForms.find((form) => form.root.visible)
    if (activeForm?.formId === 'scarlet-hunter') return SCARLET_HUNTER_PRESENTATION.combat
    if (activeForm?.formId === 'scarlet-gecko') return SCARLET_GECKO_PRESENTATION.combat
    return CORAL_GECKO_PRESENTATION.combat
  }

  private getCombatTargetYaw() {
    if (this.combatDummy.state !== 'alive') return null
    const offset = this.combatDummy.root.position.clone().sub(this.drake.root.position).setY(0)
    if (offset.lengthSq() <= 0.0001) return this.currentYaw
    return Math.atan2(-offset.z, offset.x)
  }

  private getAttackAimError() {
    if (this.attackTargetYaw === null) return 0
    return Math.abs(shortestAngleDelta(this.currentYaw, this.attackTargetYaw))
  }

  private updateBasicAttackTargeting(delta: number) {
    const profile = this.activeBasicAttackProfile()
    if (!this.combatAction || !(profile.primaryCombo as readonly string[]).includes(this.combatAction)) return
    const targetYaw = this.getCombatTargetYaw()
    if (targetYaw === null) {
      this.attackTargetYaw = null
      return
    }
    this.attackTargetYaw = targetYaw
    this.currentYaw = turnToward(
      this.currentYaw,
      targetYaw,
      profile.targeting.turnSpeedRadiansPerSecond * delta,
    )
    this.drake.root.rotation.y = this.currentYaw
  }

  private resolveBasicAttackHit(action: CoralGeckoCombatAction) {
    const profile = this.activeBasicAttackProfile()
    if (!(profile.primaryCombo as readonly string[]).includes(action)) return
    if (this.attackTargetYaw !== null && this.getAttackAimError() > THREE.MathUtils.degToRad(profile.targeting.contactToleranceDegrees)) return
    if (!this.isCombatDummyInRange(action)) return
    const feedback = profile.hitFeedback
    const damage = action === 'Bite'
      ? feedback.biteDamage
      : action === 'Pounce'
        ? feedback.pounceDamage
        : action === 'Claw'
          ? feedback.clawDamage
          : feedback.tailSwipeDamage
    this.combatDummy.health = Math.max(0, this.combatDummy.health - damage)
    this.combatDummy.hits += 1
    this.combatDummy.lastHitAction = action
    this.combatDummy.flashRemaining = feedback.flashSeconds
    const contactRecipe = getQuality3DAttackFeedback(action as Quality3DBasicAttackAction)
    this.cameraTrauma = Math.max(this.cameraTrauma, feedback.cameraTrauma * contactRecipe.cameraTraumaMultiplier)
    this.hitStopRemaining = Math.max(this.hitStopRemaining, contactRecipe.hitStopSeconds)
    this.emitAttackTrail(action as Quality3DBasicAttackAction)
    const knockback = this.combatDummy.root.position.clone().sub(this.drake.root.position).setY(0).normalize()
    this.combatDummy.knockbackVelocity.copy(knockback).multiplyScalar(feedback.knockbackSpeed)
    this.emitImpactParticles(this.combatDummy.root.position.clone().add(new THREE.Vector3(-0.45, 0.72, 0)), feedback.particleCount)
    if (this.combatDummy.health <= 0) {
      this.combatDummy.state = 'dead'
      this.combatDummy.deaths += 1
      this.combatDummy.respawnRemaining = CORAL_GECKO_PRESENTATION.combat.demoTarget.respawnSeconds
      this.combatDummy.healthBar.visible = false
      this.cameraTrauma = Math.max(this.cameraTrauma, 0.52)
    }
  }

  private emitImpactParticles(origin: THREE.Vector3, count: number) {
    let emitted = 0
    for (const particle of this.impactParticles) {
      if (particle.visible) continue
      const angle = (emitted / Math.max(1, count)) * Math.PI * 2 + this.elapsedTime * 1.7
      const lift = 1.2 + (emitted % 3) * 0.24
      particle.position.copy(origin)
      particle.scale.setScalar(0.8 + (emitted % 2) * 0.35)
      particle.visible = true
      particle.userData.life = particle.userData.duration
      ;(particle.userData.velocity as THREE.Vector3).set(Math.cos(angle) * 1.45, lift, Math.sin(angle) * 1.45)
      emitted += 1
      if (emitted >= count) break
    }
  }

  private emitAttackTrail(action: Quality3DBasicAttackAction) {
    const recipe = getQuality3DAttackFeedback(action)
    const activeForm = this.drake.speciesForms.find((form) => form.root.visible)
    const visualAction = activeForm?.formId === 'coral-gecko' && action === 'Pounce' ? 'Bite' : action
    const trail = this.attackTrails.find((candidate) => !candidate.visible) ?? this.attackTrails[0]
    if (!trail) return
    trail.visible = true
    trail.userData.life = recipe.durationSeconds
    trail.userData.duration = recipe.durationSeconds
    trail.position.copy(this.combatDummy.root.position)
    trail.position.y += recipe.plane === 'ground' ? 0.1 : 0.72
    trail.rotation.set(recipe.plane === 'ground' ? -Math.PI / 2 : 0, this.currentYaw, 0)
    trail.scale.setScalar(recipe.scale)
    trail.children.forEach((child, index) => {
      const arc = child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
      arc.visible = index < recipe.arcCount
      arc.position.set(
        recipe.plane === 'ground' ? 0 : (index - 0.5) * 0.25,
        recipe.plane === 'ground' ? 0 : (index - 0.5) * 0.12,
        index * 0.012,
      )
      arc.rotation.z = visualAction === 'Claw' || visualAction === 'Pounce'
        ? -0.58 + index * 0.07
        : visualAction === 'Bite'
          ? (index === 0 ? 0.22 : Math.PI + 0.22)
          : -0.25 + index * 0.38
      arc.userData.baseScale = action === 'TailSwipe' ? 0.88 + index * 0.22 : 0.9 + index * 0.08
      arc.userData.baseScaleX = visualAction === 'Claw' || visualAction === 'Pounce'
        ? arc.userData.baseScale * 0.72
        : arc.userData.baseScale
      arc.userData.baseScaleY = visualAction === 'Claw' || visualAction === 'Pounce'
        ? arc.userData.baseScale * 1.34
        : arc.userData.baseScale
      arc.scale.set(arc.userData.baseScaleX, arc.userData.baseScaleY, arc.userData.baseScale)
      arc.material.color.setHex(index % 2 === 0 ? recipe.color : recipe.accent)
      arc.material.opacity = 0.9
    })
  }

  private updateAttackTrails(delta: number) {
    for (const trail of this.attackTrails) {
      if (!trail.visible) continue
      trail.userData.life = Math.max(0, trail.userData.life - delta)
      const progress = 1 - trail.userData.life / trail.userData.duration
      trail.children.forEach((child) => {
        const arc = child as THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>
        arc.material.opacity = Math.pow(1 - progress, 1.7) * 0.9
        const expansion = 1 + progress * 0.34
        arc.scale.set(
          arc.userData.baseScaleX * expansion,
          arc.userData.baseScaleY * expansion,
          arc.userData.baseScale * expansion,
        )
      })
      if (trail.userData.life <= 0) trail.visible = false
    }
  }

  private updateCombatDummy(delta: number) {
    const dummy = this.combatDummy
    if (dummy.state === 'dead') {
      dummy.respawnRemaining = Math.max(0, dummy.respawnRemaining - delta)
      dummy.visual.rotation.z = THREE.MathUtils.damp(dummy.visual.rotation.z, -1.28, 10, delta)
      dummy.visual.scale.y = THREE.MathUtils.damp(dummy.visual.scale.y, 0.55, 10, delta)
      if (dummy.respawnRemaining <= 0) this.resetCombatDummy()
    } else {
      dummy.flashRemaining = Math.max(0, dummy.flashRemaining - delta)
      const flash = dummy.flashRemaining > 0
      dummy.materials.forEach((material) => {
        material.emissive.setHex(flash ? 0xffffff : 0x000000)
        material.emissiveIntensity = flash ? 1.25 : 0
      })
      dummy.visual.position.addScaledVector(dummy.knockbackVelocity, delta)
      dummy.knockbackVelocity.multiplyScalar(Math.exp(-10 * delta))
      dummy.visual.position.x = THREE.MathUtils.damp(dummy.visual.position.x, 0, 8, delta)
      dummy.visual.position.z = THREE.MathUtils.damp(dummy.visual.position.z, 0, 8, delta)
      dummy.visual.rotation.z = THREE.MathUtils.damp(dummy.visual.rotation.z, 0, 13, delta)
      dummy.visual.scale.y = THREE.MathUtils.damp(dummy.visual.scale.y, 1, 13, delta)
      dummy.visual.position.y = Math.sin(this.elapsedTime * 2.4) * 0.018
      const healthRatio = dummy.health / CORAL_GECKO_PRESENTATION.combat.demoTarget.maxHealth
      dummy.healthFill.scale.x = Math.max(0.001, healthRatio)
      dummy.healthFill.position.x = -(1 - healthRatio) * 0.8
    }
    dummy.healthBar.position.set(dummy.root.position.x, dummy.root.position.y + 1.72, dummy.root.position.z)
    dummy.healthBar.quaternion.copy(this.camera.quaternion)

    for (const particle of this.impactParticles) {
      if (!particle.visible) continue
      particle.userData.life -= delta
      if (particle.userData.life <= 0) {
        particle.visible = false
        continue
      }
      const velocity = particle.userData.velocity as THREE.Vector3
      particle.position.addScaledVector(velocity, delta)
      velocity.y -= 5.8 * delta
      particle.scale.multiplyScalar(Math.max(0.1, 1 - delta * 3.2))
    }
  }

  private createFootstepDust() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const context = canvas.getContext('2d')
    if (!context) return
    const gradient = context.createRadialGradient(32, 32, 3, 32, 32, 30)
    gradient.addColorStop(0, CORAL_GECKO_PRESENTATION.dust.gradientCenter)
    gradient.addColorStop(0.42, CORAL_GECKO_PRESENTATION.dust.gradientMiddle)
    gradient.addColorStop(1, CORAL_GECKO_PRESENTATION.dust.gradientEdge)
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace

    for (let index = 0; index < CORAL_GECKO_PRESENTATION.dust.poolSize; index += 1) {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color: CORAL_GECKO_PRESENTATION.dust.materialColor,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        fog: true,
      })
      const puff = new THREE.Sprite(material)
      puff.visible = false
      puff.renderOrder = CORAL_GECKO_PRESENTATION.dust.renderOrder
      puff.userData.life = 0
      puff.userData.duration = CORAL_GECKO_PRESENTATION.dust.durationSeconds
      puff.userData.velocityX = 0
      puff.userData.velocityY = 0
      puff.userData.velocityZ = 0
      puff.userData.peakOpacity = CORAL_GECKO_PRESENTATION.dust.peakOpacity
      this.scene.add(puff)
      this.footstepDust.push(puff)
    }
  }

  private emitFootstepDust(intensity = 1) {
    this.stepImpact = 1
    let emitted = 0
    const forwardX = Math.cos(this.currentYaw)
    const forwardZ = -Math.sin(this.currentYaw)
    const lateralX = -forwardZ
    const lateralZ = forwardX

    for (const side of [-1, 1]) {
      const puff = this.footstepDust.find((candidate) => !candidate.visible)
      if (!puff) return emitted
      const variation = Math.sin(this.elapsedTime * 13.7 + side * 2.3)
      const x = this.drake.root.position.x - forwardX * CORAL_GECKO_PRESENTATION.dust.backOffset + lateralX * side * CORAL_GECKO_PRESENTATION.dust.lateralOffset
      const z = this.drake.root.position.z - forwardZ * CORAL_GECKO_PRESENTATION.dust.backOffset + lateralZ * side * CORAL_GECKO_PRESENTATION.dust.lateralOffset
      puff.position.set(x, terrainHeight(x, z) + CORAL_GECKO_PRESENTATION.dust.groundLift, z)
      puff.scale.setScalar((CORAL_GECKO_PRESENTATION.dust.startScale + Math.abs(variation) * CORAL_GECKO_PRESENTATION.dust.scaleVariance) * intensity)
      puff.visible = true
      puff.userData.life = puff.userData.duration
      puff.userData.velocityX = -forwardX * CORAL_GECKO_PRESENTATION.dust.backwardVelocity + lateralX * side * CORAL_GECKO_PRESENTATION.dust.lateralVelocity
      puff.userData.velocityY = (CORAL_GECKO_PRESENTATION.dust.liftVelocity + Math.abs(variation) * CORAL_GECKO_PRESENTATION.dust.liftVelocityVariance) * intensity
      puff.userData.velocityZ = -forwardZ * CORAL_GECKO_PRESENTATION.dust.backwardVelocity + lateralZ * side * CORAL_GECKO_PRESENTATION.dust.lateralVelocity
      puff.userData.peakOpacity = Math.min(0.86, CORAL_GECKO_PRESENTATION.dust.peakOpacity * intensity)
      ;(puff.material as THREE.SpriteMaterial).opacity = puff.userData.peakOpacity
      emitted += 1
    }
    return emitted
  }

  private updateFootstepDust(delta: number) {
    for (const puff of this.footstepDust) {
      if (!puff.visible) continue
      puff.userData.life -= delta
      if (puff.userData.life <= 0) {
        puff.visible = false
        ;(puff.material as THREE.SpriteMaterial).opacity = 0
        continue
      }
      const progress = 1 - puff.userData.life / puff.userData.duration
      puff.position.x += puff.userData.velocityX * delta
      puff.position.y += puff.userData.velocityY * delta
      puff.position.z += puff.userData.velocityZ * delta
      puff.scale.multiplyScalar(1 + delta * CORAL_GECKO_PRESENTATION.dust.expansionPerSecond)
      ;(puff.material as THREE.SpriteMaterial).opacity = (1 - progress) * puff.userData.peakOpacity
    }
  }

  private setPointerTarget(event: PointerEvent) {
    if (this.combatAction === 'Death') return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObject(this.terrain, false)[0]
    if (!hit || !isQuality3DWalkable(hit.point.x, hit.point.z)) return
    this.target.set(hit.point.x, terrainHeight(hit.point.x, hit.point.z), hit.point.z)
    this.hasTarget = true
  }

  private triggerCombatAction(action: CoralGeckoCombatAction) {
    if (this.isEvolving || (this.combatAction === 'Death' && action !== 'Death')) return
    const form = this.drake.speciesForms.find((candidate) => candidate.root.visible)
    if (!form?.actions?.has(quality3DClipName(form.formId, action))) return
    this.combatAction = action
    this.combatActionElapsed = 0
    this.combatContactReached = false
    this.combatHitResolved = false
    if (action === 'Pounce') this.leapBiteLandingResolved = false
    const profile = this.activeBasicAttackProfile()
    this.attackTargetYaw = (profile.primaryCombo as readonly string[]).includes(action)
      ? this.getCombatTargetYaw()
      : null
    this.combatActionRemaining = action === 'Bite'
      ? profile.biteDurationSeconds
      : action === 'Pounce'
        ? profile.pounceDurationSeconds
      : action === 'Claw'
        ? profile.clawDurationSeconds
        : action === 'TailSwipe'
          ? profile.tailSwipeDurationSeconds
      : action === 'Hit'
        ? CORAL_GECKO_PRESENTATION.combat.hitDurationSeconds
        : CORAL_GECKO_PRESENTATION.combat.deathDurationSeconds
    this.hasTarget = false
    if (!(profile.primaryCombo as readonly string[]).includes(action)) {
      this.comboStep = 0
      this.comboBuffered = false
      this.comboResetRemaining = 0
    }
    this.setGLBAction(form, action, true)
  }

  private requestPrimaryAttack() {
    if (this.isEvolving || this.combatAction === 'Death' || this.combatAction === 'Hit') return
    const profile = this.activeBasicAttackProfile()
    if (this.combatAction && (profile.primaryCombo as readonly string[]).includes(this.combatAction)) {
      this.comboBuffered = true
      return
    }
    const action = profile.primaryCombo[this.comboStep]
    this.comboStep = (this.comboStep + 1) % profile.primaryCombo.length
    this.comboResetRemaining = 0
    this.attackTargetYaw = null
    this.triggerCombatAction(action)
  }

  private resetCombatPose() {
    this.combatAction = null
    this.combatActionElapsed = 0
    this.combatActionRemaining = 0
    this.combatContactReached = false
    this.combatHitResolved = false
    this.comboStep = 0
    this.comboBuffered = false
    this.comboResetRemaining = 0
    this.attackTargetYaw = null
    const form = this.drake.speciesForms.find((candidate) => candidate.root.visible)
    if (form) this.setGLBAction(form, 'Idle', true)
  }

  private animate() {
    this.frameRequest = requestAnimationFrame(() => this.animate())
    const now = performance.now()
    const delta = Math.min((now - this.lastFrameTime) / 1000, 0.05)
    this.lastFrameTime = now
    this.elapsedTime += delta
    this.smoothedFps = THREE.MathUtils.lerp(this.smoothedFps, 1 / Math.max(delta, 0.001), 0.06)
    const simulationDelta = this.hitStopRemaining > 0 ? 0 : delta
    this.hitStopRemaining = Math.max(0, this.hitStopRemaining - delta)
    this.resize()
    this.updatePlayer(simulationDelta)
    this.updateCombatDummy(simulationDelta)
    this.updateEvolution(simulationDelta)
    this.updateFootstepDust(delta)
    this.updateAttackTrails(delta)
    this.updateCamera(false, delta)
    if (this.atmosphereMotes) {
      this.atmosphereMotes.rotation.y = Math.sin(this.elapsedTime * 0.08) * 0.018
      ;(this.atmosphereMotes.material as THREE.PointsMaterial).opacity = 0.4 + Math.sin(this.elapsedTime * 0.7) * 0.08
    }
    if (this.waterMaterial) this.waterMaterial.uniforms.uTime.value = this.elapsedTime
    this.renderer.render(this.scene, this.camera)
  }

  private updatePlayer(delta: number) {
    const combatProfile = this.activeBasicAttackProfile()
    if (!this.combatAction && this.comboResetRemaining > 0) {
      this.comboResetRemaining = Math.max(0, this.comboResetRemaining - delta)
      if (this.comboResetRemaining <= 0) this.comboStep = 0
    }
    if (this.combatAction) {
      this.updateBasicAttackTargeting(delta)
      this.combatActionElapsed += delta
      this.combatActionRemaining = Math.max(0, this.combatActionRemaining - delta)
      const contactTime = this.combatAction === 'Bite'
        ? combatProfile.biteContactSeconds
        : this.combatAction === 'Pounce'
          ? combatProfile.pounceContactSeconds
        : this.combatAction === 'Claw'
          ? combatProfile.clawContactSeconds
          : this.combatAction === 'TailSwipe'
            ? combatProfile.tailSwipeContactSeconds
            : Number.POSITIVE_INFINITY
      if (this.combatActionElapsed >= contactTime && !this.combatHitResolved) {
        this.combatContactReached = true
        this.combatHitResolved = true
        this.resolveBasicAttackHit(this.combatAction)
      }
      if (this.combatAction !== 'Death' && this.combatActionRemaining <= 0) {
        const completedAction = this.combatAction
        const continueCombo = (this.comboBuffered || this.keys.has('Space'))
          && (combatProfile.primaryCombo as readonly string[]).includes(completedAction)
        this.combatAction = null
        this.combatActionElapsed = 0
        this.combatContactReached = false
        this.combatHitResolved = false
        this.attackTargetYaw = null
        this.comboBuffered = false
        if (continueCombo) this.requestPrimaryAttack()
        else if ((combatProfile.primaryCombo as readonly string[]).includes(completedAction)) {
          this.comboResetRemaining = combatProfile.comboResetSeconds
        }
      }
    }
    this.turnAnimationRemaining = Math.max(0, this.turnAnimationRemaining - delta)
    const direction = new THREE.Vector3(
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')),
      0,
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')),
    )
    if (direction.lengthSq() > 0) {
      direction.normalize()
      this.hasTarget = false
    } else if (this.hasTarget) {
      direction.copy(this.target).sub(this.drake.root.position).setY(0)
      if (direction.length() < 0.18) {
        direction.set(0, 0, 0)
        this.hasTarget = false
      } else direction.normalize()
    }

    const moving = direction.lengthSq() > 0 && this.combatAction === null
    this.locomotionBlend = THREE.MathUtils.damp(
      this.locomotionBlend,
      moving ? 1 : 0,
      moving ? CORAL_GECKO_PRESENTATION.weight.accelerationDamping : CORAL_GECKO_PRESENTATION.weight.decelerationDamping,
      delta,
    )
    this.stepImpact = THREE.MathUtils.damp(this.stepImpact, 0, CORAL_GECKO_PRESENTATION.weight.stepImpactDecay, delta)
    this.turnFollow = THREE.MathUtils.damp(
      this.turnFollow,
      moving ? this.turnRemaining : 0,
      CORAL_GECKO_PRESENTATION.weight.turnFollowDamping,
      delta,
    )
    if (!moving && this.wasMoving) this.stopSettleRemaining = CORAL_GECKO_PRESENTATION.weight.stopSettleSeconds
    else this.stopSettleRemaining = Math.max(0, this.stopSettleRemaining - delta)
    this.wasMoving = moving
    if (moving) {
      const desiredYaw = Math.atan2(-direction.z, direction.x)
      const deltaYaw = shortestAngleDelta(this.currentYaw, desiredYaw)
      this.turnRemaining = deltaYaw
      if (Math.abs(deltaYaw) > CORAL_GECKO_PRESENTATION.animation.turnTriggerRadians) {
        this.turnAnimationRemaining = Math.max(this.turnAnimationRemaining, CORAL_GECKO_PRESENTATION.animation.turnHoldSeconds)
      }
      const collisionStage = this.isEvolving ? this.targetEvolutionStage : this.currentEvolutionStage
      const proposedYaw = turnToward(this.currentYaw, desiredYaw, QUALITY_3D.player.turnSpeed * delta)
      if (isQuality3DFootprintWalkable(this.drake.root.position.x, this.drake.root.position.z, proposedYaw, collisionStage)) {
        this.currentYaw = proposedYaw
      }
      this.drake.root.rotation.y = this.currentYaw
      const canTranslate = canQuality3DTranslateAfterTurn(this.currentYaw, desiredYaw)
      if (canTranslate) {
        this.turnAnimationRemaining = 0
        const step = QUALITY_3D.player.speed * delta
        const candidateX = this.drake.root.position.x + direction.x * step
        const candidateZ = this.drake.root.position.z + direction.z * step
        const candidateResult = inspectQuality3DFootprint(candidateX, candidateZ, this.currentYaw, collisionStage)
        if (candidateResult.clear) {
          this.drake.root.position.x = candidateX
          this.drake.root.position.z = candidateZ
          this.blockedProbe = null
        } else {
          // Slide along the free axis so touching a cliff does not make controls
          // feel sticky, while the full oriented body hull remains outside it.
          const slideX = inspectQuality3DFootprint(candidateX, this.drake.root.position.z, this.currentYaw, collisionStage)
          const slideZ = inspectQuality3DFootprint(this.drake.root.position.x, candidateZ, this.currentYaw, collisionStage)
          if (slideX.clear) this.drake.root.position.x = candidateX
          else if (slideZ.clear) this.drake.root.position.z = candidateZ
          else this.hasTarget = false
          this.blockedProbe = candidateResult.blockedProbe
        }
        this.gaitPhase += delta * 10.4
      }
      this.animationState = canTranslate ? 'walk-grounded' : 'turn-grounded'
    } else {
      this.turnRemaining = 0
      this.animationState = this.combatAction ? `${this.combatAction.toLowerCase()}-grounded` : 'idle-grounded'
    }
    const ground = terrainHeight(this.drake.root.position.x, this.drake.root.position.z)
    this.drake.root.position.y = THREE.MathUtils.damp(this.drake.root.position.y, ground, 18, delta)
    this.animateRig(moving, delta)
  }

  private animateRig(moving: boolean, delta: number) {
    const phase = this.gaitPhase
    const breathing = Math.sin(this.elapsedTime * 2.2)
    this.drake.bodyRig.position.y = moving ? Math.abs(Math.sin(phase)) * 0.035 : breathing * 0.022
    this.drake.bodyRig.rotation.z = THREE.MathUtils.damp(this.drake.bodyRig.rotation.z, -this.turnRemaining * 0.12, 9, delta)
    this.drake.headRig.rotation.y = THREE.MathUtils.damp(this.drake.headRig.rotation.y, this.turnRemaining * 0.34 + breathing * 0.025, 8, delta)
    this.drake.headRig.rotation.z = THREE.MathUtils.damp(this.drake.headRig.rotation.z, moving ? Math.sin(phase * 2) * 0.035 : breathing * 0.018, 9, delta)
    this.maxFootError = 0
    for (const leg of this.drake.legs) {
      const legPhase = phase + leg.phaseOffset
      const swing = moving ? Math.sin(legPhase) : 0
      const lift = moving ? Math.max(0, Math.sin(legPhase)) : 0
      leg.hip.rotation.z = THREE.MathUtils.damp(leg.hip.rotation.z, swing * 0.46, 14, delta)
      leg.knee.rotation.z = THREE.MathUtils.damp(leg.knee.rotation.z, -Math.max(0, swing) * 0.5 + Math.max(0, -swing) * 0.15, 14, delta)
      leg.foot.rotation.z = Math.PI / 2 - leg.hip.rotation.z - leg.knee.rotation.z * 0.6
      const localFoot = new THREE.Vector3(leg.baseX + swing * 0.24, 0, leg.baseZ).applyAxisAngle(UP, this.currentYaw)
      const footX = this.drake.root.position.x + localFoot.x
      const footZ = this.drake.root.position.z + localFoot.z
      const footGround = terrainHeight(footX, footZ)
      const groundDelta = footGround - this.drake.root.position.y
      leg.hip.position.y = 0.72 + groundDelta + lift * 0.08
      const estimatedSole = this.drake.root.position.y + leg.hip.position.y - 0.7 - lift * 0.08
      this.maxFootError = Math.max(this.maxFootError, Math.abs(estimatedSole - footGround))
    }
    this.drake.tailJoints.forEach((joint, index) => {
      joint.rotation.y = Math.sin(this.elapsedTime * (moving ? 5 : 1.8) - index * 0.48) * (moving ? 0.12 : 0.08) - this.turnRemaining * 0.08
      joint.rotation.z = 0.025 + Math.sin(this.elapsedTime * 1.3 - index * 0.25) * 0.018
    })
    this.drake.wings.forEach((wing, index) => {
      const side = wing.userData.side as number
      const wingBreath = Math.sin(this.elapsedTime * (moving ? 4.2 : 1.5) + index * Math.PI) * (moving ? 0.08 : 0.035)
      wing.rotation.x = THREE.MathUtils.damp(wing.rotation.x, side * (0.2 + wingBreath), 7, delta)
      wing.rotation.z = THREE.MathUtils.damp(wing.rotation.z, moving ? -0.08 : 0.02, 7, delta)
    })
    const shadowPulse = moving ? Math.abs(Math.sin(phase)) * 0.05 : breathing * 0.012
    this.updateContactShadow(1 + shadowPulse, CORAL_GECKO_PRESENTATION.weight.shadowBaseOpacity)
    this.animateSpeciesForm(moving, delta, phase, breathing, shadowPulse)
  }

  private animateSpeciesForm(moving: boolean, delta: number, phase: number, breathing: number, shadowPulse: number) {
    const form = this.drake.speciesForms.find((candidate) => candidate.root.visible)
    if (!form) return
    let attackRootFrame: ReturnType<typeof quadrupedAttackMotionFrame> | null = null
    let leapBiteFrame: ReturnType<typeof juvenileLeapBiteMotionFrame> | null = null
    if (form.assetSource === 'glb' && form.motion === 'embedded' && form.mixer) {
      const action = this.combatAction && form.actions?.has(quality3DClipName(form.formId, this.combatAction))
        ? this.combatAction
        : moving && this.turnAnimationRemaining > 0 && form.actions?.has('Turn')
          ? 'Turn'
          : moving
            ? 'Run'
            : 'Idle'
      this.setGLBAction(form, action)
      form.mixer.update(delta)
      if (!this.isEvolving) {
        const runPhase = (form.actions?.get('Run')?.time ?? 0) * Math.PI * 2
        const impact = this.stepImpact * this.stepImpact
        const settleProgress = this.stopSettleRemaining > 0
          ? 1 - this.stopSettleRemaining / CORAL_GECKO_PRESENTATION.weight.stopSettleSeconds
          : 1
        const settle = this.stopSettleRemaining > 0 ? Math.sin(settleProgress * Math.PI) : 0
        const compression = impact * CORAL_GECKO_PRESENTATION.weight.stepCompression
        const runLift = action === 'Run'
          ? Math.abs(Math.sin(runPhase * 2)) * CORAL_GECKO_PRESENTATION.weight.runLift * this.locomotionBlend
          : 0
        form.root.position.y = runLift - compression - settle * CORAL_GECKO_PRESENTATION.weight.stopSettleDepth
        const formPresentation = presentationForFormId(form.formId) ?? CORAL_GECKO_PRESENTATION
        if (action === 'Pounce') {
          leapBiteFrame = juvenileLeapBiteMotionFrame(
            this.combatActionElapsed,
            formPresentation.combat.pounceDurationSeconds,
          )
          attackRootFrame = leapBiteFrame
          if (form.formId === 'scarlet-gecko') {
            attackRootFrame = {
              ...attackRootFrame,
              forwardOffset: attackRootFrame.forwardOffset * SCARLET_GECKO_PRESENTATION.combat.pounceVisualTravelScale,
            }
          }
          if (leapBiteFrame.progress >= CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.landingProgress && !this.leapBiteLandingResolved) {
            this.leapBiteLandingResolved = true
            this.leapBiteLandingEvents += 1
            this.leapBiteLandingDustPuffs += this.emitFootstepDust(1.5)
            this.leapBiteLandingDustPuffs += this.emitFootstepDust(1.5)
            this.cameraTrauma = Math.max(this.cameraTrauma, CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.landingCameraTrauma)
          }
        } else if (action === 'TailSwipe') {
          attackRootFrame = juvenileSpinTailSwipeMotionFrame(
            this.combatActionElapsed,
            formPresentation.combat.tailSwipeDurationSeconds,
            formPresentation.combat.tailSwipeContactSeconds,
          )
        } else if (action === 'Bite' || action === 'Claw') {
          const profile = formPresentation.combat
          const duration = action === 'Bite'
            ? profile.biteDurationSeconds
            : action === 'Claw'
              ? profile.clawDurationSeconds
              : profile.tailSwipeDurationSeconds
          const contact = action === 'Bite'
            ? profile.biteContactSeconds
            : action === 'Claw'
              ? profile.clawContactSeconds
              : profile.tailSwipeContactSeconds
          attackRootFrame = quadrupedAttackMotionFrame(action, this.combatActionElapsed, duration, contact)
        }
        const pounce = quadrupedPounceFrame(0, 1, 0)
        form.root.position.x = pounce.forwardOffset + (attackRootFrame?.forwardOffset ?? 0)
        form.root.position.y += pounce.liftOffset + (attackRootFrame?.liftOffset ?? 0)
        const widthGain = compression * CORAL_GECKO_PRESENTATION.weight.widthCompensation
        if (attackRootFrame) form.root.scale.setScalar(form.baseScale)
        else {
          form.root.scale.set(
            form.baseScale * (1 + widthGain),
            form.baseScale * (1 - compression),
            form.baseScale * (1 + widthGain),
          )
        }
        form.root.rotation.y = attackRootFrame?.yawRadians ?? 0
        const inertialTurn = this.turnFollow * this.locomotionBlend
        form.head.rotation.z += inertialTurn * CORAL_GECKO_PRESENTATION.weight.headFollow
        form.tailJoints.forEach((joint, index) => {
          joint.rotation.z -= inertialTurn * (
            CORAL_GECKO_PRESENTATION.weight.tailCounterbalance
            + index * CORAL_GECKO_PRESENTATION.weight.tailCounterbalanceStep
          )
        })
      }
      form.root.rotation.z = THREE.MathUtils.damp(
        form.root.rotation.z,
        attackRootFrame?.pitchRadians ?? (moving ? -this.turnRemaining * CORAL_GECKO_PRESENTATION.weight.turnLean : 0),
        attackRootFrame ? 18 : 9,
        delta,
      )
      if (form.formId === 'coral-gecko' && action === 'Run') {
        this.footstepProgress += delta * CORAL_GECKO_PRESENTATION.animation.footstepEventsPerSecond
        while (this.footstepProgress >= 1) {
          this.emitFootstepDust()
          this.footstepProgress -= 1
        }
      } else this.footstepProgress = 0
      const leapIsAirborne = Boolean(leapBiteFrame && leapBiteFrame.airborneStrength > 0.08)
      if (form.feet.length && !leapIsAirborne) {
        form.root.updateWorldMatrix(true, true)
        const signedFootErrors = form.feet.map((foot) => {
          const position = foot.getWorldPosition(new THREE.Vector3())
          return position.y - terrainHeight(position.x, position.z)
        }).sort((left, right) => Math.abs(left) - Math.abs(right))
        const plantedFootErrors = signedFootErrors.slice(0, Math.min(2, signedFootErrors.length))
        const targetCorrection = THREE.MathUtils.clamp(
          -plantedFootErrors.reduce((sum, error) => sum + error, 0) / Math.max(1, plantedFootErrors.length),
          -CORAL_GECKO_PRESENTATION.weight.maximumGroundCorrection,
          CORAL_GECKO_PRESENTATION.weight.maximumGroundCorrection,
        )
        form.groundCorrection = THREE.MathUtils.damp(
          form.groundCorrection ?? 0,
          targetCorrection,
          CORAL_GECKO_PRESENTATION.weight.groundCorrectionDamping,
          delta,
        )
        form.root.position.y += form.groundCorrection
        form.root.updateWorldMatrix(true, true)
        let signedCorrectedFootErrors = form.feet.map((foot) => {
          const position = foot.getWorldPosition(new THREE.Vector3())
          return position.y - terrainHeight(position.x, position.z)
        })
        const attackPenetration = attackRootFrame ? Math.min(...signedCorrectedFootErrors) : 0
        if (attackPenetration < -0.015) {
          form.root.position.y += -0.015 - attackPenetration
          form.root.updateWorldMatrix(true, true)
          signedCorrectedFootErrors = form.feet.map((foot) => {
            const position = foot.getWorldPosition(new THREE.Vector3())
            return position.y - terrainHeight(position.x, position.z)
          })
        }
        this.minimumFootClearance = Math.min(...signedCorrectedFootErrors)
        const correctedFootErrors = signedCorrectedFootErrors.map(Math.abs).sort((left, right) => left - right)
        // Two feet lift during a diagonal quadruped stride; measure the two
        // planted feet so intentional lift is not reported as hovering.
        this.maxFootError = correctedFootErrors[Math.min(1, correctedFootErrors.length - 1)] ?? this.maxFootError
      } else if (leapBiteFrame) {
        form.groundCorrection = 0
        form.root.updateWorldMatrix(true, true)
        let airborneFootClearances = form.feet.map((foot) => {
          const position = foot.getWorldPosition(new THREE.Vector3())
          return position.y - terrainHeight(position.x, position.z)
        })
        const airbornePenetration = Math.min(...airborneFootClearances)
        if (airbornePenetration < -0.015) {
          form.root.position.y += -0.015 - airbornePenetration
          form.root.updateWorldMatrix(true, true)
          airborneFootClearances = form.feet.map((foot) => {
            const position = foot.getWorldPosition(new THREE.Vector3())
            return position.y - terrainHeight(position.x, position.z)
          })
        }
        this.minimumFootClearance = Math.min(...airborneFootClearances)
        this.maxFootError = leapBiteFrame.airborneStrength > 0.08 ? 0.2 : 0
      }
      const glbShadowSize = 0.72 + form.stage * 0.15 + (form.wings.length ? 0.2 : 0)
      const contact = this.stepImpact * this.stepImpact
      const shadowSettle = this.stopSettleRemaining > 0 ? 1 : 0
      const shadowSize = glbShadowSize + shadowPulse - contact * CORAL_GECKO_PRESENTATION.weight.shadowImpactContraction
      const leapShadowFade = leapBiteFrame ? leapBiteFrame.airborneStrength * 0.16 : 0
      const leapLanding = leapBiteFrame?.landingStrength ?? 0
      this.updateContactShadow(shadowSize + (leapBiteFrame?.airborneStrength ?? 0) * 0.1 - leapLanding * 0.05, THREE.MathUtils.clamp(
        CORAL_GECKO_PRESENTATION.weight.shadowBaseOpacity
          + contact * CORAL_GECKO_PRESENTATION.weight.shadowImpactOpacity
          + shadowSettle * CORAL_GECKO_PRESENTATION.weight.shadowSettleOpacity
          - leapShadowFade
          + leapLanding * 0.08,
          0,
          0.48,
      ))
      return
    }
    if (form.assetSource === 'glb' && form.motion === 'procedural-root') {
      if (!this.isEvolving) form.root.position.y = moving ? Math.abs(Math.sin(phase)) * 0.018 : breathing * 0.009
      form.root.rotation.z = THREE.MathUtils.damp(form.root.rotation.z, -this.turnRemaining * 0.09, 10, delta)
      form.root.rotation.x = THREE.MathUtils.damp(form.root.rotation.x, moving ? Math.sin(phase * 2) * 0.012 : breathing * 0.006, 10, delta)
      form.activeAction = moving ? 'ProceduralRun' : 'ProceduralIdle'
      const shadowSize = 0.72 + shadowPulse * 0.45
      this.updateContactShadow(shadowSize, CORAL_GECKO_PRESENTATION.weight.shadowBaseOpacity)
      return
    }
    if (!this.isEvolving) form.root.position.y = moving ? Math.abs(Math.sin(phase)) * 0.035 : breathing * 0.018
    form.body.rotation.z = THREE.MathUtils.damp(form.body.rotation.z, -this.turnRemaining * 0.1, 8, delta)
    form.head.rotation.y = THREE.MathUtils.damp(form.head.rotation.y, this.turnRemaining * 0.24 + breathing * 0.02, 8, delta)
    form.head.rotation.z = THREE.MathUtils.damp(form.head.rotation.z, moving ? Math.sin(phase * 2) * 0.025 : breathing * 0.015, 8, delta)
    form.legs.forEach((leg, index) => {
      const diagonalOffset = index % 2 === 0 ? 0 : Math.PI
      const rowOffset = index >= 2 ? Math.PI : 0
      const swing = moving ? Math.sin(phase + diagonalOffset + rowOffset) : 0
      leg.rotation.z = THREE.MathUtils.damp(leg.rotation.z, swing * (form.bodyPlan === 'predator-drake' ? 0.48 : 0.34), 12, delta)
    })
    form.tailJoints.forEach((joint, index) => {
      joint.rotation.y = Math.sin(this.elapsedTime * (moving ? 4.8 : 1.6) - index * 0.45) * (moving ? 0.13 : 0.075) - this.turnRemaining * 0.06
      joint.rotation.z = Math.sin(this.elapsedTime * 1.2 - index * 0.22) * 0.012
    })
    form.wings.forEach((wing, index) => {
      const side = wing.userData.side as number
      const restingSpread = form.bodyPlan === 'sky-wyvern' ? 0.34 : 0.22
      const flex = Math.sin(this.elapsedTime * (moving ? 3.8 : 1.25) + index * Math.PI) * (moving ? 0.075 : 0.028)
      wing.rotation.x = THREE.MathUtils.damp(wing.rotation.x, side * (restingSpread + flex), 6, delta)
      wing.rotation.z = THREE.MathUtils.damp(wing.rotation.z, moving ? -0.055 : 0.018, 6, delta)
    })
    const shadowSize = 0.74 + form.stage * 0.14 + (form.wings.length ? 0.18 : 0)
    this.updateContactShadow(shadowSize + shadowPulse, CORAL_GECKO_PRESENTATION.weight.shadowBaseOpacity)
  }

  private updateContactShadow(scale: number, opacity: number) {
    const shadow = this.drake.shadow
    shadow.root.scale.setScalar(scale)
    shadow.body.opacity = opacity
    shadow.head.opacity = opacity * (CORAL_GECKO_PRESENTATION.contactShadow.headOpacity / CORAL_GECKO_PRESENTATION.contactShadow.bodyOpacity)
    shadow.tail.opacity = opacity * (CORAL_GECKO_PRESENTATION.contactShadow.tailOpacity / CORAL_GECKO_PRESENTATION.contactShadow.bodyOpacity)
    const rootPosition = this.drake.root.position
    const forwardX = Math.cos(this.currentYaw)
    const forwardZ = -Math.sin(this.currentYaw)
    const lateralX = -forwardZ
    const lateralZ = forwardX
    const samples = [
      terrainHeight(rootPosition.x, rootPosition.z),
      terrainHeight(rootPosition.x + forwardX * 0.95, rootPosition.z + forwardZ * 0.95),
      terrainHeight(rootPosition.x - forwardX * 1.15, rootPosition.z - forwardZ * 1.15),
      terrainHeight(rootPosition.x + lateralX * 0.62, rootPosition.z + lateralZ * 0.62),
      terrainHeight(rootPosition.x - lateralX * 0.62, rootPosition.z - lateralZ * 0.62),
    ]
    shadow.root.position.y = Math.max(...samples) - rootPosition.y + CORAL_GECKO_PRESENTATION.contactShadow.groundLift
  }

  private updateCamera(immediate: boolean, delta = 1 / 60) {
    const focus = this.drake.root.position
    const forwardX = Math.cos(this.currentYaw)
    const forwardZ = -Math.sin(this.currentYaw)
    const lead = QUALITY_3D_RESCUE_CAMERA.lookAheadDistance * this.locomotionBlend
    if (immediate) this.cameraPivot.active = false
    stepQuality3DCameraPivot(
      this.cameraPivot,
      focus.x + forwardX * lead,
      focus.y + QUALITY_3D_RESCUE_CAMERA.pivotHeight,
      focus.z + forwardZ * lead,
      delta,
    )
    const pitch = THREE.MathUtils.degToRad(QUALITY_3D_RESCUE_CAMERA.pitchDegrees)
    const orbit = THREE.MathUtils.degToRad(QUALITY_3D_RESCUE_CAMERA.orbitDegrees)
    const horizontalDistance = Math.cos(pitch) * QUALITY_3D_RESCUE_CAMERA.distance
    const desired = new THREE.Vector3(
      this.cameraPivot.x + Math.sin(orbit) * horizontalDistance,
      this.cameraPivot.y + Math.sin(pitch) * QUALITY_3D_RESCUE_CAMERA.distance,
      this.cameraPivot.z + Math.cos(orbit) * horizontalDistance,
    )
    if (this.cameraTrauma > 0) {
      const shake = this.cameraTrauma * this.cameraTrauma
      desired.x += Math.sin(this.elapsedTime * 34) * 0.19 * shake
      desired.y += Math.sin(this.elapsedTime * 41 + 1.7) * 0.12 * shake
      desired.z += Math.sin(this.elapsedTime * 29 + 0.8) * 0.17 * shake
      this.cameraTrauma = Math.max(0, this.cameraTrauma - delta * 1.35)
    }
    this.camera.position.copy(desired)
    this.camera.lookAt(this.cameraPivot.x, this.cameraPivot.y, this.cameraPivot.z)
    const towardCamera = this.cameraLightDirection.set(
      desired.x - this.cameraPivot.x,
      0,
      desired.z - this.cameraPivot.z,
    ).normalize()
    this.playerFill.position.set(
      this.cameraPivot.x + towardCamera.x * 3.8,
      this.cameraPivot.y + 4.4,
      this.cameraPivot.z + towardCamera.z * 3.8,
    )
  }

  private resize() {
    const width = Math.max(1, this.container.clientWidth)
    const height = Math.max(1, this.container.clientHeight)
    if (width === this.previousWidth && height === this.previousHeight) return
    this.previousWidth = width
    this.previousHeight = height
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }
}

function maximumBoneScaleDeviation(root?: THREE.Object3D) {
  let maximum = 0
  root?.traverse((node) => {
    if (!(node instanceof THREE.Bone)) return
    maximum = Math.max(
      maximum,
      Math.abs(node.scale.x - 1),
      Math.abs(node.scale.y - 1),
      Math.abs(node.scale.z - 1),
    )
  })
  return maximum
}

function presentationForFormId(formId?: string) {
  if (formId === 'coral-gecko') return CORAL_GECKO_PRESENTATION
  if (formId === 'scarlet-gecko') return SCARLET_GECKO_PRESENTATION
  if (formId === 'scarlet-hunter') return SCARLET_HUNTER_PRESENTATION
  return null
}

function quality3DClipName(formId: string, action: string) {
  return (formId === 'coral-gecko' || formId === 'scarlet-gecko') && action === 'Pounce'
    ? CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.clipName
    : action
}

export function launchQuality3D() {
  const evolutionLab = new URLSearchParams(location.search).get('evolution') === '1'
  document.body.classList.add('is-maplab', 'is-quality3d')
  if (evolutionLab) document.body.classList.add('is-quality3d-evolution')
  document.title = evolutionLab ? '进化竞技场 · 幼龙六阶段进化' : '进化竞技场 · 真实3D品质切片'
  const overlay = document.querySelector<HTMLElement>('#starter-overlay')
  overlay?.classList.remove('is-open')
  overlay?.setAttribute('aria-hidden', 'true')
  overlay?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#evolution-hud')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#result-overlay')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#bestiary-overlay')?.setAttribute('hidden', '')
  const badge = document.querySelector<HTMLElement>('.prototype-badge')
  if (badge) badge.textContent = evolutionLab ? 'EVOLUTION SPECIES · SIX-STAGE DEMO' : 'Quality 3D · Orthographic Vertical Slice'
  const help = document.querySelector<HTMLElement>('.helpbar')
  if (help) help.innerHTML = evolutionLab
    ? [
        '<span><strong>自动演示</strong> 初始幼蜥 + 六次连续进化</span>',
        '<span class="divider">/</span>',
        '<span><strong>点击阶段</strong> 可单独查看任意形态</span>',
        '<span class="divider">/</span>',
        '<span class="optional">WASD / 点击地面仍可移动并观察各阶段步态</span>',
      ].join('')
    : [
        '<span><strong>WASD / 点击地面</strong> 任意方向移动</span>',
        '<span class="divider">/</span>',
        '<span><strong>Space 普攻连招</strong> 阶段0：快速咬 → 跃起重咬 → 尾扫；阶段1：咬击 → 爪击 → 尾扫；阶段2：裂爪 → 双爪前扑 → 尾砸</span>',
        '<span class="divider">/</span>',
        '<span><strong>命中训练虫</strong> 测试距离 · 受击闪光 · 击退 · 生命与死亡</span>',
        '<span class="divider">/</span>',
        '<span class="optional">技能系统仍关闭；训练虫死亡后会在角色前方自动重置</span>',
      ].join('')
  const container = document.querySelector<HTMLElement>('#game-container')
  if (!container) throw new Error('Missing game container')
  const experience = new Quality3DExperience(container)
  const debugRequested = new URLSearchParams(location.search).get('debug') === '1'
  if (import.meta.env.DEV || debugRequested) {
    window.__EA_3D_DEBUG__ = {
      getState: () => experience.getDebugState(),
      primaryAttack: () => experience.debugPrimaryAttack(),
      setEvolutionStage: (stage) => experience.debugSetEvolutionStage(stage),
    }
    if (debugRequested) {
      const output = document.createElement('output')
      output.id = 'debug-state'
      output.hidden = true
      document.body.append(output)
      const interval = window.setInterval(() => {
        if (!window.__EA_3D_DEBUG__) return window.clearInterval(interval)
        output.textContent = JSON.stringify(window.__EA_3D_DEBUG__.getState())
      }, 250)
    }
  }
  return () => {
    delete window.__EA_3D_DEBUG__
    document.body.classList.remove('is-quality3d-evolution')
    experience.dispose()
  }
}

function seeded(value: number) {
  const result = Math.sin(value * 12.9898 + 78.233) * 43758.5453
  return result - Math.floor(result)
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
