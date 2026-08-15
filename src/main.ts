import './style.css'
import { MapLabScene, isMapLabRequested } from './map-lab'
import { MapLabV2Scene } from './map-lab-v2'
import { MAP_LAB_V2, isMapLabV2Requested, type MapLabV2Stage } from './map-lab-v2-config'
import { GloamwoodSpaceLabScene } from './map-lab-space'
import { GLOAMWOOD_SPACE_LAYOUT, isGloamwoodSpaceLabRequested } from './gloamwood-space-layout'
import { GloamwoodExplorationLabScene } from './map-lab-exploration'
import { GLOAMWOOD_EXPLORATION_LAYOUT, isGloamwoodExplorationLabRequested } from './gloamwood-exploration-layout'
import { QualitySliceScene } from './quality-slice-scene'
import { QUALITY_SLICE, isQualitySliceRequested } from './quality-slice-layout'
import { isQuality3DRequested } from './quality-3d-layout'
import {
  MONSTER_NEST_LAB,
  canDamageNestCore,
  isMonsterNestLabRequested,
  type MonsterNestPhase,
} from './monster-nest'
import {
  GLOAMWOOD_HUNT_SLICE,
  GLOAMWOOD_SLICE_PROPS,
  GLOAMWOOD_SLICE_PROP_ASSETS,
  isGloamwoodHuntSliceRequested,
  pointInsideWorldRect,
  shouldFadeSliceProp,
  slicePropCollisionCenter,
  type GloamwoodSliceProp,
} from './gloamwood-hunt-slice'
import {
  RIFT_WARDEN,
  bossCooldown,
  bossFailureOutcome,
  bossPatternForTurn,
  bossPhase,
  type BossPattern,
  type BossState,
} from './boss'
import {
  loadBestiary,
  recordMonsterKill,
  saveBestiary,
  unlockedMonsterTypes,
  type BestiaryState,
} from './bestiary'
import {
  cameraProfileFor,
  isCompactViewport,
  worldViewSize,
} from './camera-feel'
import {
  ATTACK_BUFFER_MS,
  COMBAT_STYLES,
  COMBAT_STYLE_ORDER,
  PLAYER_PROJECTILE_SPEED,
  attackDamage,
  attackBufferExpiresAt,
  clampAttackPoint,
  isAttackBufferAlive,
  isInsideMeleeArc,
  isWithinAttackRange,
  projectileLifetimeMs,
  type CombatStyle,
} from './combat'
import { drawCombatJuiceFrame, drawCombatTelegraph, type CombatJuiceBurst } from './combat-fx'
import {
  COMBAT_JUICE,
  hitstopMsForImpact,
  juiceBurstMs,
  juiceProgress,
  juiceTint,
  shakeIntensityForImpact,
  sparkCountForImpact,
} from './combat-juice'
import {
  paintAllMonsterTextures,
  paintBossTexture,
  paintCombatProjectiles,
  paintPlayerTexture,
  paintWorldObjectTextures,
} from './creature-art'
import {
  autoLockPulse,
  shouldAutoLockAttacker,
  healthRatio,
  isTalentSignalActive,
  shouldShowEnemyHealthBar,
} from './combat-feedback'
import {
  EVOLUTION_CONFIG,
  GENE_COLORS,
  GENE_FAMILIES,
  GENE_LABELS,
  MAX_EVOLUTION_STAGES,
  MUTATIONS,
  applyMutationEffect,
  createSeededRandom,
  currentFormName,
  dominantGene,
  emptyGenes,
  evolutionCollisionScale,
  evolutionRequirementForStage,
  evolutionScaleForStage,
  geneLean,
  hashSeed,
  isEvolutionPreviewReady,
  leanReason,
  resistEvolutionProgress,
  resolveHuntEvolution,
  type EvolutionRecord,
  type GeneCounts,
  type GeneFamily,
  type MutationRanks,
  type MutationStatState,
} from './evolution'
import { EVOLUTION_STAGE_NAMES, evolutionVisualFamily, playerEvolutionAppearance } from './player-evolution-visual'
import { playerAnimationPose, type PlayerAnimationPose } from './player-animation'
import {
  STAGE_THREAT_CONFIG,
  biomeThreatCopy,
  difficultyForBiome,
  formatEvolutionStageLabel,
  huntObjectiveCopy,
  isEncounterEliteAtStage,
  lairPromptCopy,
  scaledBossDamage,
  scaledBossHealth,
  scaledEnemyCooldown,
  scaledEnemyDamage,
  scaledEnemyHealth,
  threatForEvolutionStage,
  whiteOrbMultiplier,
} from './difficulty'
import {
  ELITE_AFFIXES,
  TOXIC_BURST_DAMAGE,
  TOXIC_BURST_RADIUS,
  TOXIC_BURST_TELEGRAPH_MS,
  absorbEliteShield,
  eliteAffixFor,
  eliteCooldownMultiplier,
  eliteDamageMultiplier,
  eliteSpeedMultiplier,
  initialEliteShield,
  isBerserkerActive,
  shouldTriggerBrood,
  siphonHealth,
  toxicBurstHits,
  type EliteAffixId,
} from './elite-affixes'
import {
  SOUL_ORB_CONFIG,
  bossSoulOrbDrop,
  collectSoulOrb,
  eliteOrbBuffModifiers,
  eliteOrbBuffRemainingMs,
  formatDerivedStats,
  derivedStatsFromGenes,
  soulOrbDropFor,
  soulOrbTierConfig,
  type EliteOrbBuff,
  type SoulOrbDrop,
  type SoulOrbTier,
} from './soul-orbs'
import {
  MONSTERS,
  MONSTER_TYPES,
  LINEAGE_TALENTS,
  VENOM_DURATION_MS,
  VENOM_TICK_DAMAGE,
  VENOM_TICK_MS,
  canDealContactDamage,
  canDetectTarget,
  lifeStealHealth,
  lineageIncomingDamage,
  lineageOutgoingDamage,
  lineageProjectileCount,
  lineagePursuitSpeed,
  lineageRecoveryMs,
  projectileAngles,
  regenerateHealth,
  shouldDisengage,
  type EnemyState,
  type MonsterType,
  type MonsterAttackKind,
  type MonsterLineage,
} from './monsters'
import {
  DODGE,
  HIT_STUN_MS,
  canStartDodge,
  directionToMoveTarget,
  dodgeCooldownRemaining,
  resolveDodgeDirection,
  type WorldPoint,
  type PlayerMovementState,
} from './player-movement'
import {
  isLairUnlocked,
  canChallengeBoss,
  rewardSiteForGuard,
  applyEventHazard,
  selectEventOutcome,
  type RewardSiteState,
  type SigilId,
  type WorldEventDefinition,
} from './rewards'
import { createRunMap } from './run-map'
import {
  STARTER_ORDER,
  STARTER_VARIANTS,
  isStarterVariantId,
  mitigateDamage,
  randomStarter,
  type StarterVariant,
  type StarterVariantId,
} from './starter-variants'
import {
  FOG_CELL_SIZE,
  REVEAL_RADIUS,
  START_POSITION,
  TARGET_LOCK_RADIUS,
  VISION_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createFogGrid,
  getBiomeAt,
  revealFogCells,
  type BiomeId,
  type FogCell,
} from './world'
import { createWorldPropTextures, paintRunWorld } from './world-art'
import { FX_DEPTH, GROUND_DEPTH, UNIT_ORIGIN, worldDepth } from './iso'

const FOG_REFRESH_MS = 120
const LANDMARK_DISCOVERY_RADIUS = 310
const INTERACTION_RADIUS = 150
const EVENT_TRIGGER_RADIUS = 175
const SWARM_LINK_RADIUS = 650
let selectedStarter: StarterVariant = STARTER_VARIANTS['spine-stalker']

interface PendingPlayerAttack {
  style: CombatStyle
  impactAt: number
  aimX: number
  aimY: number
  aimAngle: number
  damage: number
  target?: Phaser.Physics.Arcade.Image
}

interface BufferedAttack {
  fallbackX: number
  fallbackY: number
  expiresAt: number
}

interface EnemySpawnOptions {
  elite?: boolean
  affix?: EliteAffixId | null
  healthScale?: number
  visualScale?: number
  biomassValue?: number
  spawnedFrom?: string
}

interface ToxicBurst {
  id: number
  x: number
  y: number
  radius: number
  damage: number
  detonatesAt: number
  graphics: Phaser.GameObjects.Graphics
}

class PrototypeScene extends Phaser.Scene {
  private readonly huntSliceEnabled = isGloamwoodHuntSliceRequested()
  private readonly nestLabEnabled = isMonsterNestLabRequested()
  private starter = selectedStarter
  private runSeed = new URLSearchParams(window.location.search).get('seed')
    ?? (this.huntSliceEnabled ? GLOAMWOOD_HUNT_SLICE.validationSeed : String(Date.now()))
  private runMap = createRunMap(this.runSeed)
  private player!: Phaser.Physics.Arcade.Image
  private enemies!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private biomass!: Phaser.Physics.Arcade.Group
  private huntSliceCollisionBodies?: Phaser.Physics.Arcade.StaticGroup
  private huntSlicePropImages: Array<{ definition: GloamwoodSliceProp; image: Phaser.GameObjects.Image }> = []
  private fadedSlicePropIds = new Set<string>()
  private sliceCollisionContactIds = new Set<string>()
  private lastSliceCollisionId: string | null = null
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'E' | 'B' | 'R' | 'SPACE' | 'TAB', Phaser.Input.Keyboard.Key>
  private combatKeys!: Record<'ONE' | 'TWO' | 'THREE', Phaser.Input.Keyboard.Key>
  private dodgeKey!: Phaser.Input.Keyboard.Key
  private health = this.starter.maxHealth
  private maxHealth = this.starter.maxHealth
  private defenseReduction = this.starter.defenseReduction
  private evolution = 0
  private evolutionStage = 0
  private kills = 0
  private genes: GeneCounts = emptyGenes()
  private recentHunts: GeneFamily[] = []
  private mutationRanks: MutationRanks = {}
  private evolutionChain: EvolutionRecord[] = []
  private recentAppliedFamilies: GeneFamily[] = []
  private resistCharges = EVOLUTION_CONFIG.resistCharges
  private pendingEvolutionAt = 0
  private runOver = false
  private runStartedAt = 0
  private isBestiaryOpen = false
  private bestiaryState: BestiaryState = loadBestiary(window.localStorage)
  private playerSpeed = this.starter.speed
  private movementState: PlayerMovementState = 'normal'
  private movementStateUntil = 0
  private nextDodgeAt = 0
  private dodgeVelocity = { x: 0, y: 0 }
  private lastDodgeAt = 0
  private lastHitStunAt = 0
  private bulletDamage = 1
  private combatDamageBonuses: Record<CombatStyle, number> = { melee: 0, ranged: 0, magic: 0 }
  private dodgeCooldownMultiplier = 1
  private biomassGainMultiplier = 1
  private eliteOrbBuff: EliteOrbBuff | null = null
  private consumedGoldOrb = false
  private goldOrbSummary: string | null = null
  private collectedOrbCounts: Record<SoulOrbTier, number> = { common: 0, elite: 0, boss: 0 }
  private lastOrbMessage = ''
  private lastBuffHudSecond = -1
  private killHeal = 0
  private contactRetaliationDamage = 0
  private shotCooldown = Math.round(COMBAT_STYLES.ranged.cooldownMs * this.starter.cooldownMultiplier.ranged)
  private magicCooldown = Math.round(COMBAT_STYLES.magic.cooldownMs * this.starter.cooldownMultiplier.magic)
  private magicRadius = Math.round(COMBAT_STYLES.magic.radius * this.starter.magicRadiusMultiplier)
  private combatStyle: CombatStyle = this.starter.startingStyle
  private pendingAttack?: PendingPlayerAttack
  private bufferedAttack?: BufferedAttack
  private recoverUntil = 0
  private attackRangeWarningUntil = 0
  private lastCombatImpact: { style: CombatStyle; hits: number } | undefined
  private juiceBurst: CombatJuiceBurst | undefined
  private hitstopUntilReal = 0
  private activeSparkCount = 0
  private random = createSeededRandom(hashSeed(this.runSeed))
  private lastShot = 0
  private lastDamage = 0
  private invulnerableUntil = 0
  private lastDamageSource = 'none'
  private poisonedUntil = 0
  private nextPoisonTick = 0
  private poisonTicksTaken = 0
  private healthBar!: Phaser.GameObjects.Graphics
  private evolutionBar!: Phaser.GameObjects.Graphics
  private statusText!: Phaser.GameObjects.Text
  private messageText!: Phaser.GameObjects.Text
  private biomeText!: Phaser.GameObjects.Text
  private minimapGraphics!: Phaser.GameObjects.Graphics
  private unknownFog!: Phaser.GameObjects.Graphics
  private exploredFog!: Phaser.GameObjects.Graphics
  private visionEdgeFog!: Phaser.GameObjects.Graphics
  private fogCells: FogCell[] = []
  private lastFogRefresh = 0
  private currentBiome: BiomeId = 'gloamwood'
  private visitedBiomes = new Set<BiomeId>(['gloamwood'])
  private discoveredLandmarks = new Set<string>()
  private rewardStates = new Map(this.runMap.rewardSites.map((site) => [site.id, 'sealed' as RewardSiteState]))
  private rewardObjects = new Map<string, Phaser.GameObjects.Image>()
  private eventObjects = new Map<string, Phaser.GameObjects.Image>()
  private triggeredEvents = new Set<string>()
  private collectedSigils = new Set<SigilId>()
  private shrineUsed = false
  private interactionText!: Phaser.GameObjects.Text
  private objectiveText!: Phaser.GameObjects.Text
  private targetText!: Phaser.GameObjects.Text
  private targetMarker!: Phaser.GameObjects.Graphics
  private enemyStatusGraphics!: Phaser.GameObjects.Graphics
  private talentFeedbackGraphics!: Phaser.GameObjects.Graphics
  private eliteAffixGraphics!: Phaser.GameObjects.Graphics
  private playerStatusGraphics!: Phaser.GameObjects.Graphics
  private playerEvolutionGraphics!: Phaser.GameObjects.Graphics
  private evolutionBurstUntil = 0
  private lastConsumeAt = -10000
  private combatTelegraph!: Phaser.GameObjects.Graphics
  private combatEffect!: Phaser.GameObjects.Graphics
  private combatHud!: Phaser.GameObjects.Graphics
  private combatStyleTexts: Phaser.GameObjects.Text[] = []
  private dodgeText!: Phaser.GameObjects.Text
  private dodgeTrail!: Phaser.GameObjects.Graphics
  private moveMarker!: Phaser.GameObjects.Graphics
  private moveTarget?: WorldPoint
  private selectedTarget?: Phaser.Physics.Arcade.Image
  private nestCore?: Phaser.Physics.Arcade.Image
  private nestAura?: Phaser.GameObjects.Graphics
  private nestLabel?: Phaser.GameObjects.Text
  private nestPhase: MonsterNestPhase = 'dormant'
  private nestCoreHealth: number = MONSTER_NEST_LAB.coreMaxHealth
  private nestIntermissionUntil = 0
  private nestFogRevealCount = 0
  private nestRewardGranted = false
  private lastAutoLockAt = 0
  private lastAutoLockedId: string | null = null
  private visibleEnemyHealthBars = 0
  private activeTalentSignals = new Set<string>()
  private activeEliteAffixSignals = new Set<string>()
  private toxicBursts: ToxicBurst[] = []
  private nextToxicBurstId = 1
  private cameraZoom = 1
  private cameraLookAhead = { x: 0, y: 0 }
  private compactViewport = false
  private activeInteraction: { kind: 'cache' | 'shrine' | 'lair'; id: string } | undefined
  private boss!: Phaser.Physics.Arcade.Image
  private bossWarning!: Phaser.GameObjects.Graphics
  private bossBar!: Phaser.GameObjects.Graphics
  private bossText!: Phaser.GameObjects.Text
  private bossHealth = RIFT_WARDEN.maxHealth
  private bossMaxHealth = RIFT_WARDEN.maxHealth
  private bossState: BossState = 'dormant'
  private bossPattern: BossPattern = 'shockwave'
  private bossStateUntil = 0
  private bossTurn = 0
  private bossAimAngle = 0
  private bossPhaseValue: 1 | 2 = 1
  private bossActive = false
  private bossDefeated = false

  constructor() {
    super('prototype')
  }

  preload() {
    if (this.huntSliceEnabled) {
      this.load.image(GLOAMWOOD_HUNT_SLICE.assetKey, GLOAMWOOD_HUNT_SLICE.assetPath)
      for (const asset of Object.values(GLOAMWOOD_SLICE_PROP_ASSETS)) {
        this.load.image(asset.assetKey, asset.assetPath)
      }
    }
  }

  create() {
    this.createTextures()
    this.drawWorld()

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.player = this.physics.add.image(START_POSITION.x, START_POSITION.y, 'player')
    this.player.setOrigin(UNIT_ORIGIN.x, UNIT_ORIGIN.y)
    this.player.setCollideWorldBounds(true).setCircle(EVOLUTION_CONFIG.baseCollisionRadius).setAlpha(0)
    this.syncPlayerSpeedCap()
    this.runStartedAt = this.time.now
    this.syncPlayerBodyScale()
    document.addEventListener('visibilitychange', this.handleVisibilityChange)

    this.enemies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image })
    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 80 })
    this.enemyProjectiles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 48 })
    this.biomass = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 80 })
    this.boss = this.physics.add.image(this.runMap.bossPosition.x, this.runMap.bossPosition.y, 'boss-rift-warden')
    this.boss.setOrigin(UNIT_ORIGIN.x, UNIT_ORIGIN.y)
    this.boss.setCircle(54).disableBody(true, true)
    if (this.nestLabEnabled) this.createMonsterNestCore()
    this.bossWarning = this.add.graphics().setDepth(FX_DEPTH - 1)
    this.combatTelegraph = this.add.graphics().setDepth(FX_DEPTH)
    this.combatEffect = this.add.graphics().setDepth(FX_DEPTH + 0.2).setBlendMode(Phaser.BlendModes.ADD)
    this.enemyStatusGraphics = this.add.graphics().setDepth(FX_DEPTH - 2)
    this.talentFeedbackGraphics = this.add.graphics().setDepth(FX_DEPTH - 2)
    this.eliteAffixGraphics = this.add.graphics().setDepth(FX_DEPTH - 2)
    this.playerStatusGraphics = this.add.graphics().setDepth(FX_DEPTH - 1)
    this.playerEvolutionGraphics = this.add.graphics().setDepth(worldDepth(START_POSITION.y, 0.2))
    this.dodgeTrail = this.add.graphics().setDepth(worldDepth(START_POSITION.y, -0.4))
    this.moveMarker = this.add.graphics().setDepth(FX_DEPTH - 3)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,B,R,SPACE,TAB') as typeof this.keys
    this.combatKeys = this.input.keyboard!.addKeys({
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
    }) as typeof this.combatKeys
    this.dodgeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
    this.input.keyboard!.addCapture('TAB')
    this.input.keyboard!.on('keydown-B', (event: KeyboardEvent) => {
      if (!event.repeat) this.toggleBestiary()
    })
    document.querySelector('#resist-evolution')?.addEventListener('click', () => this.resistPendingEvolution())

    this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this)
    this.physics.add.overlap(this.player, this.enemies, this.damagePlayer, undefined, this)
    this.physics.add.overlap(this.player, this.enemyProjectiles, this.damagePlayerFromProjectile, undefined, this)
    this.physics.add.overlap(this.player, this.biomass, this.collectBiomass, undefined, this)
    this.physics.add.overlap(this.bullets, this.boss, this.hitBoss, undefined, this)
    if (this.nestCore) this.physics.add.overlap(this.bullets, this.nestCore, this.hitNestCore, undefined, this)
    this.physics.add.overlap(this.player, this.boss, this.damagePlayerFromBoss, undefined, this)
    if (this.huntSliceCollisionBodies) {
      this.physics.add.collider(this.player, this.huntSliceCollisionBodies, (_player, obstacle) => {
        const id = (obstacle as Phaser.Physics.Arcade.Image).getData('slicePropId') as string
        this.sliceCollisionContactIds.add(id)
        this.lastSliceCollisionId = id
      })
      this.physics.add.collider(this.enemies, this.huntSliceCollisionBodies)
    }

    this.applyCameraProfile()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.applyCameraProfile, this)

    this.createFogOfWar()
    this.createHud()
    if (!this.nestLabEnabled) {
      this.runMap.encounters.forEach((encounter) => this.spawnEnemy(
        encounter.id,
        encounter.monsterType,
        encounter.x,
        encounter.y,
        encounter.biome,
      ))
    }
    this.refreshExploration()
    this.flashMessage(this.nestLabEnabled
      ? `${MONSTER_NEST_LAB.name} · 进入警戒圈触发守卫`
      : this.huntSliceEnabled ? '幽影林地 · 战斗可读性切片' : `${this.runMap.archetypeName} · ${this.runMap.layoutName}`)

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePrimaryPointer(pointer))
  }

  private applyCameraProfile() {
    const profile = cameraProfileFor(window.innerWidth, window.innerHeight, this.bossActive)
    this.cameraZoom = profile.zoom
    this.compactViewport = isCompactViewport(window.innerWidth, window.innerHeight)
    this.cameras.main.setZoom(profile.zoom)
    if (this.bossActive) {
      const view = worldViewSize(this.cameras.main.width, this.cameras.main.height, profile.zoom)
      this.cameras.main.stopFollow().setFollowOffset(0, 0)
      this.cameras.main.setScroll(WORLD_WIDTH - view.width, this.runMap.bossPosition.y - view.height / 2)
      this.cameraLookAhead = { x: 0, y: 0 }
    } else {
      this.cameraLookAhead = { x: 0, y: 0 }
      this.cameras.main.startFollow(this.player, true, profile.followLerp, profile.followLerp).setFollowOffset(0, 0)
    }
  }

  private updateCameraFeel() {
    if (this.bossActive) return
    this.cameraLookAhead = { x: 0, y: 0 }
    this.cameras.main.setFollowOffset(0, 0)
  }

  update(time: number) {
    if (this.runOver) {
      this.clearHitstop()
      this.player.setVelocity(0)
      return
    }
    if (this.isBestiaryOpen) {
      this.clearHitstop()
      this.player.setVelocity(0)
      return
    }
    this.syncHitstop()
    this.updatePoison(time)
    const left = this.cursors.left.isDown || this.keys.A.isDown
    const right = this.cursors.right.isDown || this.keys.D.isDown
    const up = this.cursors.up.isDown || this.keys.W.isDown
    const down = this.cursors.down.isDown || this.keys.S.isDown
    const inputX = Number(right) - Number(left)
    const inputY = Number(down) - Number(up)
    if (inputX !== 0 || inputY !== 0) this.clearMoveTarget()
    if (Phaser.Input.Keyboard.JustDown(this.dodgeKey)) this.beginDodge(time, inputX, inputY)
    this.updatePlayerMovement(time, inputX, inputY)

    if (this.bossActive) {
      this.boss.setPosition(
        Phaser.Math.Clamp(this.boss.x, 4300, 5070),
        Phaser.Math.Clamp(this.boss.y, 1320, 1880),
      )
      this.player.setPosition(
        Phaser.Math.Clamp(this.player.x, 4000, 5160),
        Phaser.Math.Clamp(this.player.y, 1280, 1920),
      )
    }

    if (time - this.lastFogRefresh >= FOG_REFRESH_MS) {
      this.refreshExploration()
      this.lastFogRefresh = time
    }
    this.updateExplorationInteractions()
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useActiveInteraction()
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.resistPendingEvolution()
    if (Phaser.Input.Keyboard.JustDown(this.keys.TAB)) this.cycleVisibleTarget()
    if (Phaser.Input.Keyboard.JustDown(this.combatKeys.ONE)) this.selectCombatStyle('melee')
    if (Phaser.Input.Keyboard.JustDown(this.combatKeys.TWO)) this.selectCombatStyle('ranged')
    if (Phaser.Input.Keyboard.JustDown(this.combatKeys.THREE)) this.selectCombatStyle('magic')
    this.validateSelectedTarget()

    const pointer = this.input.activePointer
    const aim = this.getAimPoint(pointer.worldX, pointer.worldY)
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, aim.x, aim.y)
    this.player.setRotation(angle)
    this.updateCameraFeel()
    if (this.keys.SPACE.isDown) {
      this.attackSelectedOrPoint(pointer.worldX, pointer.worldY)
    }
    this.trackPendingAttackTarget()
    this.updatePendingAttack(time)
    this.updateAttackBuffer(time)

    this.enemies.children.iterate((child) => {
      const enemy = child as Phaser.Physics.Arcade.Image
      if (enemy.active) this.updateEnemy(enemy, time)
      return true
    })
    if (this.nestLabEnabled) this.updateMonsterNest(time)

    this.bullets.children.iterate((child) => {
      const bullet = child as Phaser.Physics.Arcade.Image
      if (bullet.active && time >= (bullet.getData('expiresAt') as number || bullet.getData('born') as number + 1100)) {
        bullet.disableBody(true, true)
      }
      return true
    })
    this.enemyProjectiles.children.iterate((child) => {
      const projectile = child as Phaser.Physics.Arcade.Image
      if (projectile.active && time - projectile.getData('born') > 3200) projectile.disableBody(true, true)
      return true
    })
    this.updateToxicBursts(time)
    this.updateEliteOrbBuff(time)
    if (this.pendingEvolutionAt > 0 && time >= this.pendingEvolutionAt) this.commitHuntEvolution()
    if (this.bossActive && !this.bossDefeated) this.updateBoss(time)
    this.renderTargeting()
    this.renderCombatFeedback(time)
    this.renderPlayerEvolutionAppearance(time)
    this.renderCombatTelegraph()
    this.renderCombatJuice(time)
    this.captureBulletTrailHeads()
    this.renderCombatHud()
    this.renderDodgeFeedback(time)
    this.renderMoveTarget(time)
    this.syncWorldSort()
  }

  private syncWorldSort() {
    if (!this.player) return
    const playerDepth = worldDepth(this.player.y)
    this.player.setDepth(playerDepth)
    this.playerEvolutionGraphics.setDepth(playerDepth + 0.2)
    this.dodgeTrail.setDepth(playerDepth - 0.4)
    this.enemies.children.iterate((child) => {
      const enemy = child as Phaser.Physics.Arcade.Image
      if (enemy.active) enemy.setDepth(worldDepth(enemy.y))
      const affixLabel = enemy.getData('affixLabel') as Phaser.GameObjects.Text | undefined
      if (affixLabel) affixLabel.setDepth(worldDepth(enemy.y, 3))
      return true
    })
    if (this.boss.active) this.boss.setDepth(worldDepth(this.boss.y, 0.4))
    if (this.nestCore?.active) this.nestCore.setDepth(worldDepth(this.nestCore.y, 0.35))
    this.biomass.children.iterate((child) => {
      const orb = child as Phaser.Physics.Arcade.Image
      if (orb.active) orb.setDepth(worldDepth(orb.y, -0.2))
      return true
    })
    this.bullets.children.iterate((child) => {
      const bullet = child as Phaser.Physics.Arcade.Image
      if (bullet.active) bullet.setDepth(FX_DEPTH)
      return true
    })
    this.enemyProjectiles.children.iterate((child) => {
      const projectile = child as Phaser.Physics.Arcade.Image
      if (projectile.active) projectile.setDepth(FX_DEPTH)
      return true
    })
    for (const cache of this.rewardObjects.values()) cache.setDepth(worldDepth(cache.y))
    for (const marker of this.eventObjects.values()) marker.setDepth(worldDepth(marker.y, -0.1))
    this.fadedSlicePropIds.clear()
    for (const { definition, image } of this.huntSlicePropImages) {
      const faded = shouldFadeSliceProp(this.player.x, this.player.y, definition)
      image.setDepth(worldDepth(definition.y, 0.15)).setAlpha(faded ? 0.52 : 1)
      if (faded) this.fadedSlicePropIds.add(definition.id)
    }
  }

  getDebugState() {
    const enemies = this.enemies.getChildren()
      .filter((child) => child.active)
      .map((child) => {
        const enemy = child as Phaser.Physics.Arcade.Image
        return {
          id: enemy.getData('encounterId') as string,
          x: Math.round(enemy.x), y: Math.round(enemy.y),
          type: enemy.getData('type') as MonsterType,
          attackKind: MONSTERS[enemy.getData('type') as MonsterType].attackKind,
          lineage: MONSTERS[enemy.getData('type') as MonsterType].lineage,
          talentHint: MONSTERS[enemy.getData('type') as MonsterType].talentHint,
          texture: enemy.texture.key,
          state: enemy.getData('state') as EnemyState,
          hp: Math.round((enemy.getData('hp') as number) * 10) / 10,
          maxHp: enemy.getData('maxHp') as number,
          homeX: enemy.getData('homeX') as number,
          homeY: enemy.getData('homeY') as number,
          gene: enemy.getData('gene') as GeneFamily,
          biome: enemy.getData('biome') as BiomeId,
          threatLevel: enemy.getData('threatLevel') as number,
          stageThreat: enemy.getData('stageThreat') as number,
          speedMultiplier: enemy.getData('speedMultiplier') as number,
          damageMultiplier: enemy.getData('damageMultiplier') as number,
          cooldownMultiplier: enemy.getData('cooldownMultiplier') as number,
          elite: enemy.getData('elite') as boolean,
          soulOrbTier: (enemy.getData('soulOrbTier') as SoulOrbTier | undefined) ?? null,
          biomassValue: enemy.getData('biomassValue') as number,
          eliteAffix: (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null,
          eliteAffixName: (enemy.getData('eliteAffix') as EliteAffixId | null)
            ? ELITE_AFFIXES[enemy.getData('eliteAffix') as EliteAffixId].name
            : null,
          eliteShield: enemy.getData('eliteShield') as number,
          eliteShieldMax: enemy.getData('eliteShieldMax') as number,
          eliteAffixActivations: enemy.getData('eliteAffixActivations') as number,
          splitTriggered: enemy.getData('splitTriggered') as boolean,
          spawnedFrom: (enemy.getData('spawnedFrom') as string | undefined) ?? null,
          lastLifeStealAt: enemy.getData('lastLifeStealAt') as number,
          talentActivations: enemy.getData('talentActivations') as number,
          lastTalentAt: enemy.getData('lastTalentAt') as number,
          swarmBuffActive: enemy.getData('swarmBuffActive') as boolean,
        }
      })
    const biomass = this.biomass.getChildren()
      .filter((child) => child.active)
      .map((child) => {
        const drop = child as Phaser.Physics.Arcade.Image
        return {
          x: Math.round(drop.x),
          y: Math.round(drop.y),
          value: (drop.getData('value') as number) || SOUL_ORB_CONFIG.common.biomass,
          tier: (drop.getData('tier') as SoulOrbTier) || 'common',
          gene: (drop.getData('gene') as GeneFamily | undefined) ?? null,
          texture: drop.texture.key,
        }
      })
    return {
      player: {
        x: Math.round(this.player.x), y: Math.round(this.player.y),
        velocityX: Math.round((this.player.body as Phaser.Physics.Arcade.Body).velocity.x),
        velocityY: Math.round((this.player.body as Phaser.Physics.Arcade.Body).velocity.y),
        movementState: this.movementState,
        dodgeCooldownMs: Math.round(dodgeCooldownRemaining(this.time.now, this.nextDodgeAt)),
        lastDodgeAt: Math.round(this.lastDodgeAt),
        lastHitStunAt: Math.round(this.lastHitStunAt),
        moveTarget: this.moveTarget ? { x: Math.round(this.moveTarget.x), y: Math.round(this.moveTarget.y) } : null,
      },
      camera: {
        x: Math.round(this.cameras.main.worldView.x), y: Math.round(this.cameras.main.worldView.y),
        width: Math.round(this.cameras.main.worldView.width), height: Math.round(this.cameras.main.worldView.height),
        zoom: Math.round(this.cameraZoom * 100) / 100,
        compact: this.compactViewport,
        lookAheadX: Math.round(this.cameraLookAhead.x), lookAheadY: Math.round(this.cameraLookAhead.y),
      },
      health: this.health,
      maxHealth: this.maxHealth,
      statusEffects: {
        poisoned: this.time.now < this.poisonedUntil,
        poisonedUntil: Math.round(this.poisonedUntil),
        poisonTicksTaken: this.poisonTicksTaken,
      },
      evolution: this.evolution,
      evolutionSystem: {
        stage: this.evolutionStage,
        maximumStages: MAX_EVOLUTION_STAGES,
        required: evolutionRequirementForStage(this.evolutionStage),
        scale: evolutionScaleForStage(this.evolutionStage),
        recentHunts: [...this.recentHunts],
        dominantGene: dominantGene(this.genes, this.recentHunts),
        visualFamily: this.currentEvolutionVisualFamily(),
        lean: geneLean(this.genes, this.recentHunts),
        formName: currentFormName(this.mutationRanks, this.genes, this.recentHunts),
        pending: this.pendingEvolutionAt > 0,
        resistCharges: this.resistCharges,
        visualScale: evolutionScaleForStage(this.evolutionStage),
        collisionScale: evolutionCollisionScale(evolutionScaleForStage(this.evolutionStage)),
        chain: this.evolutionChain.map((entry) => entry.mutationId),
        familyRanks: Object.fromEntries(GENE_FAMILIES.map((family) => [
          family,
          MUTATIONS.filter((mutation) => mutation.family === family)
            .reduce((sum, mutation) => sum + (this.mutationRanks[mutation.id] ?? 0), 0),
        ])),
        appearance: (() => {
          const route = this.currentEvolutionVisualFamily()
          const appearance = playerEvolutionAppearance(this.evolutionStage, route, this.mutationRanks)
          return {
            ...appearance,
            stageName: EVOLUTION_STAGE_NAMES[appearance.stage],
            visibleTraits: [...appearance.visibleTraits],
          }
        })(),
        animation: this.currentPlayerAnimation(this.time.now),
      },
      kills: this.kills,
      genes: { ...this.genes },
      runOver: this.runOver,
      mutationRanks: { ...this.mutationRanks },
      starter: {
        id: this.starter.id,
        name: this.starter.name,
        defenseReduction: this.defenseReduction,
        damageMultiplier: { ...this.starter.damageMultiplier },
      },
      stats: {
        playerSpeed: Math.round(this.playerSpeed), bulletDamage: this.bulletDamage,
        shotCooldown: this.shotCooldown, magicCooldown: this.magicCooldown, magicRadius: this.magicRadius,
        combatDamageBonuses: { ...this.combatDamageBonuses },
        dodgeCooldownMultiplier: this.dodgeCooldownMultiplier,
        biomassGainMultiplier: this.biomassGainMultiplier,
        killHeal: this.killHeal,
        contactRetaliationDamage: this.contactRetaliationDamage,
        derivedStats: derivedStatsFromGenes(this.genes),
        eliteOrbBuff: this.eliteOrbBuff
          ? {
              affix: this.eliteOrbBuff.affix,
              remainingMs: eliteOrbBuffRemainingMs(this.eliteOrbBuff, this.time.now),
            }
          : null,
      },
      combat: {
        style: this.combatStyle,
        phase: this.pendingAttack ? 'telegraph' : this.time.now < this.recoverUntil ? 'recover' : 'ready',
        pendingStyle: this.pendingAttack?.style ?? null,
        buffered: this.bufferedAttack !== undefined,
        bufferWindowMs: ATTACK_BUFFER_MS,
        rangeWarning: this.time.now < this.attackRangeWarningUntil,
        lastImpact: this.lastCombatImpact ? { ...this.lastCombatImpact } : null,
        juice: {
          hitstop: performance.now() < this.hitstopUntilReal,
          burstStyle: this.juiceBurst?.style ?? null,
          burstProgress: this.juiceBurst
            ? juiceProgress(this.juiceBurst.startedAt, this.time.now, this.juiceBurst.durationMs)
            : 0,
          timeScale: this.time.timeScale,
        },
      },
      world: { width: WORLD_WIDTH, height: WORLD_HEIGHT },
      runMap: {
        seed: this.runMap.seed,
        archetypeId: this.runMap.archetypeId,
        layoutId: this.runMap.layoutId,
      },
      exploration: {
        currentBiome: this.currentBiome,
        threatLevel: difficultyForBiome(this.currentBiome).threatLevel,
        stageThreat: threatForEvolutionStage(this.evolutionStage),
        whiteOrbMultiplier: whiteOrbMultiplier(this.currentBiome, this.evolutionStage),
        gloamwoodWhiteOrbMultiplier: whiteOrbMultiplier('gloamwood', this.evolutionStage),
        visitedBiomes: [...this.visitedBiomes],
        exploredCells: this.fogCells.filter((cell) => cell.explored).length,
        totalCells: this.fogCells.length,
        percent: Math.round(this.fogCells.filter((cell) => cell.explored).length / this.fogCells.length * 1000) / 10,
        discoveredLandmarks: [...this.discoveredLandmarks],
      },
      monsterNest: {
        enabled: this.nestLabEnabled,
        id: this.nestLabEnabled ? MONSTER_NEST_LAB.id : null,
        phase: this.nestPhase,
        activeWaveEnemies: this.nestLabEnabled ? this.activeNestEnemies().length : 0,
        coreHealth: this.nestCoreHealth,
        coreMaxHealth: MONSTER_NEST_LAB.coreMaxHealth,
        coreVulnerable: canDamageNestCore(this.nestPhase),
        rewardGranted: this.nestRewardGranted,
        fogRevealCount: this.nestFogRevealCount,
        reward: { ...MONSTER_NEST_LAB.reward },
      },
      rewards: {
        sites: this.runMap.rewardSites.map((site) => ({ id: site.id, state: this.rewardStates.get(site.id) })),
        triggeredEvents: [...this.triggeredEvents],
        collectedSigils: [...this.collectedSigils],
        lairUnlocked: isLairUnlocked(this.collectedSigils, this.runMap.rewardSites),
        shrineUsed: this.shrineUsed,
        interaction: this.activeInteraction ? { ...this.activeInteraction } : null,
      },
      bestiary: {
        open: this.isBestiaryOpen,
        unlockedTypes: unlockedMonsterTypes(this.bestiaryState),
        kills: { ...this.bestiaryState.kills },
      },
      targeting: {
        selectedId: this.getTargetId(this.selectedTarget) ?? null,
        visibleIds: this.getVisibleTargets().map((target) => this.getTargetId(target)),
        lastAutoLockAt: Math.round(this.lastAutoLockAt),
        lastAutoLockedId: this.lastAutoLockedId,
      },
      combatFeedback: {
        visibleEnemyHealthBars: this.visibleEnemyHealthBars,
        activeTalentSignals: [...this.activeTalentSignals],
        autoLockPulse: Math.round(autoLockPulse(this.time.now, this.lastAutoLockAt) * 100) / 100,
        poisonIndicator: this.time.now < this.poisonedUntil,
      },
      eliteAffixes: {
        activeSignals: [...this.activeEliteAffixSignals],
        toxicBursts: this.toxicBursts.map((burst) => ({
          id: burst.id,
          x: Math.round(burst.x),
          y: Math.round(burst.y),
          radius: burst.radius,
          detonatesInMs: Math.max(0, Math.round(burst.detonatesAt - this.time.now)),
        })),
      },
      boss: {
        active: this.bossActive,
        defeated: this.bossDefeated,
        state: this.bossState,
        pattern: this.bossPattern,
        health: this.bossHealth,
        maxHealth: this.bossMaxHealth,
        phase: this.bossPhaseValue,
        x: Math.round(this.boss.x),
        y: Math.round(this.boss.y),
      },
      enemyProjectiles: this.enemyProjectiles.countActive(true),
      enemyProjectileDetails: this.enemyProjectiles.getChildren()
        .filter((child) => child.active)
        .map((child) => ({
          x: Math.round((child as Phaser.Physics.Arcade.Image).x),
          y: Math.round((child as Phaser.Physics.Arcade.Image).y),
          source: (child as Phaser.Physics.Arcade.Image).getData('source') as string,
        })),
      activeEntities:
        this.enemies.getLength() +
        this.bullets.countActive(true) +
        this.enemyProjectiles.countActive(true) +
        this.biomass.getLength(),
      fps: Math.round(this.game.loop.actualFps),
      art: {
        huntSlice: {
          enabled: this.huntSliceEnabled,
          id: this.huntSliceEnabled ? GLOAMWOOD_HUNT_SLICE.id : null,
          asset: this.huntSliceEnabled ? GLOAMWOOD_HUNT_SLICE.assetPath : null,
          region: this.huntSliceEnabled ? { ...GLOAMWOOD_HUNT_SLICE.region } : null,
          activeEnemiesInside: this.huntSliceEnabled
            ? enemies.filter((enemy) => pointInsideWorldRect(enemy.x, enemy.y, GLOAMWOOD_HUNT_SLICE.region)).length
            : 0,
          expectedEncounterIds: this.huntSliceEnabled ? [...GLOAMWOOD_HUNT_SLICE.expectedEncounterIds] : [],
          props: this.huntSlicePropImages.map(({ definition, image }) => ({
            id: definition.id,
            kind: definition.kind,
            x: definition.x,
            y: definition.y,
            depth: Math.round(image.depth * 1000) / 1000,
            alpha: Math.round(image.alpha * 100) / 100,
            collision: {
              width: definition.collisionWidth,
              height: definition.collisionHeight,
              center: slicePropCollisionCenter(definition),
              actual: (() => {
                const collider = this.huntSliceCollisionBodies?.getChildren()
                  .find((child) => (child as Phaser.Physics.Arcade.Image).getData('slicePropId') === definition.id) as Phaser.Physics.Arcade.Image | undefined
                const body = collider?.body as Phaser.Physics.Arcade.StaticBody | undefined
                return body ? { x: Math.round(body.x), y: Math.round(body.y), width: body.width, height: body.height } : null
              })(),
            },
          })),
          fadedPropIds: [...this.fadedSlicePropIds],
          collisionContactIds: [...this.sliceCollisionContactIds],
          lastCollisionId: this.lastSliceCollisionId,
        },
        player: {
          texture: this.player.texture.key,
          width: this.player.width,
          height: this.player.height,
          originY: this.player.originY,
          depth: Math.round(this.player.depth * 1000) / 1000,
        },
        textures: Object.fromEntries(
          ['player', 'prop-tree', 'ground-gloamwood', 'monster-pouncer', 'fx-hit', 'boss-rift-warden'].map((key) => {
            if (!this.textures.exists(key)) return [key, null]
            const source = this.textures.get(key).getSourceImage() as { width: number; height: number }
            return [key, { w: source.width, h: source.height }]
          }),
        ),
        treeCount: this.children.list.filter((child) => 'texture' in child && (child as Phaser.GameObjects.Image).texture?.key === 'prop-tree').length,
        fxDepth: this.combatEffect.depth,
      },
      lastDamageSource: this.lastDamageSource,
      hud: {
        objective: huntObjectiveCopy(this.huntObjectiveState()),
        biomeThreat: biomeThreatCopy(this.currentBiome, this.evolutionStage),
        stageLabel: formatEvolutionStageLabel(this.evolutionStage, EVOLUTION_CONFIG.maxStages),
      },
      soulOrbs: {
        collected: { ...this.collectedOrbCounts },
        lastMessage: this.lastOrbMessage,
        consumedGoldOrb: this.consumedGoldOrb,
        goldOrbSummary: this.goldOrbSummary,
        derivedStats: formatDerivedStats(this.genes),
        buff: this.eliteOrbBuff
          ? {
              affix: this.eliteOrbBuff.affix,
              name: this.eliteOrbBuff.name,
              hint: this.eliteOrbBuff.hint,
              remainingMs: eliteOrbBuffRemainingMs(this.eliteOrbBuff, this.time.now),
            }
          : null,
      },
      enemies,
      biomass,
      bullets: this.bullets.getChildren()
        .filter((child) => child.active)
        .map((child) => ({
          x: Math.round((child as Phaser.Physics.Arcade.Image).x),
          y: Math.round((child as Phaser.Physics.Arcade.Image).y),
        })),
    }
  }

  applyDebugStage(stage: number) {
    this.evolutionStage = Math.max(0, Math.floor(stage))
    this.syncPlayerBodyScale()
    this.refreshWorldThreat(false)
    this.renderHud()
  }

  applyDebugEvolutionRoute(family: GeneFamily, stage: number) {
    if (!GENE_FAMILIES.includes(family)) return
    this.evolutionStage = Math.max(0, Math.min(EVOLUTION_CONFIG.maxStages, Math.floor(stage)))
    this.genes = emptyGenes()
    this.genes[family] = 24
    this.recentHunts = Array.from({ length: 6 }, () => family)
    this.mutationRanks = {}
    const familyMutations = MUTATIONS.filter((mutation) => mutation.family === family)
    let ranksToAssign = Math.min(4, this.evolutionStage)
    for (const mutation of familyMutations) {
      const rank = Math.min(mutation.maxRank, ranksToAssign)
      if (rank > 0) this.mutationRanks[mutation.id] = rank
      ranksToAssign -= rank
    }
    this.evolutionBurstUntil = this.time.now + 900
    this.syncPlayerBodyScale()
    this.renderHud()
  }

  advanceDebugNest() {
    if (!this.nestLabEnabled) return
    if (this.nestPhase === 'dormant') {
      this.startMonsterNestWave(1)
      return
    }
    if (this.nestPhase === 'wave-1' || this.nestPhase === 'wave-2') {
      for (const enemy of this.activeNestEnemies()) {
        enemy.setData('eliteShield', 0)
        this.applyDamageToEnemy(enemy, 9999)
      }
      this.updateMonsterNest(this.time.now)
      return
    }
    if (this.nestPhase === 'intermission-1') {
      this.nestIntermissionUntil = 0
      this.updateMonsterNest(this.time.now)
      return
    }
    if (this.nestPhase === 'core-vulnerable') this.applyDamageToNestCore(9999)
  }

  grantDebugSigils() {
    for (const site of this.runMap.rewardSites) {
      this.collectedSigils.add(site.sigil)
      this.rewardStates.set(site.id, 'opened')
      this.rewardObjects.get(site.id)?.setTexture('cache-opened')
    }
    this.renderHud()
  }

  private huntObjectiveState() {
    return {
      bossDefeated: this.bossDefeated,
      bossActive: this.bossActive,
      bossPhase: this.bossPhaseValue,
      canChallenge: canChallengeBoss(this.collectedSigils, this.evolutionStage, this.runMap.rewardSites),
      lairUnlocked: isLairUnlocked(this.collectedSigils, this.runMap.rewardSites),
      sigilCount: this.collectedSigils.size,
      sigilRequired: this.runMap.rewardSites.length,
      stage: this.evolutionStage,
      requiredStage: STAGE_THREAT_CONFIG.requiredBossStage,
      victorySummary: this.goldOrbSummary,
    }
  }

  private monsterNestObjectiveCopy() {
    const alive = this.activeNestEnemies().length
    if (this.nestPhase === 'dormant') return `目标：进入${MONSTER_NEST_LAB.name}警戒圈`
    if (this.nestPhase === 'wave-1') return `目标：清除第一波守卫 · 剩余 ${alive}`
    if (this.nestPhase === 'intermission-1') return '目标：准备迎战第二波守卫'
    if (this.nestPhase === 'wave-2') return `目标：清除第二波守卫 · 剩余 ${alive}`
    if (this.nestPhase === 'core-vulnerable') return `目标：摧毁暴露核心 · ${Math.ceil(this.nestCoreHealth)}/${MONSTER_NEST_LAB.coreMaxHealth}`
    return `已清理：猎牙基因 +${MONSTER_NEST_LAB.reward.fangGenes} · 揭开 ${this.nestFogRevealCount} 格迷雾`
  }

  private createTextures() {
    const g = this.add.graphics({ x: 0, y: 0 }).setVisible(false)
    paintPlayerTexture(g, this.starter)
    paintAllMonsterTextures(g)

    for (const tier of ['common', 'elite', 'boss'] as const) {
      const visual = SOUL_ORB_CONFIG[tier].visual
      const size = visual.size
      const center = size / 2
      const radius = center - 1
      g.fillStyle(visual.fill, 1).fillCircle(center, center, radius)
      g.lineStyle(tier === 'common' ? 2 : 3, visual.stroke, 0.95).strokeCircle(center, center, radius)
      g.fillStyle(visual.core, 0.92).fillCircle(
        center - size * 0.14,
        center - size * 0.14,
        Math.max(2, radius * 0.28),
      )
      if (tier === 'boss') g.lineStyle(2, visual.stroke, 0.5).strokeCircle(center, center, Math.max(4, radius - 4))
      g.generateTexture(visual.texture, size, size).clear()
    }
    g.fillStyle(SOUL_ORB_CONFIG.common.visual.fill).fillCircle(8, 8, 7)
    g.lineStyle(2, SOUL_ORB_CONFIG.common.visual.stroke, 0.85).strokeCircle(8, 8, 7)
    g.generateTexture('biomass', 16, 16).clear()
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4)
    g.generateTexture('slice-collision-marker', 4, 4).clear()
    g.fillStyle(0x160b0b, 1).fillCircle(56, 56, 48)
    g.lineStyle(7, 0x74382c, 0.95).strokeCircle(56, 56, 44)
    for (let index = 0; index < 10; index += 1) {
      const angle = index / 10 * Math.PI * 2
      const innerX = 56 + Math.cos(angle) * 30
      const innerY = 56 + Math.sin(angle) * 30
      const outerX = 56 + Math.cos(angle) * 53
      const outerY = 56 + Math.sin(angle) * 53
      g.lineStyle(8, 0x9b5941, 0.92).lineBetween(innerX, innerY, outerX, outerY)
    }
    g.fillStyle(0xd55b42, 0.95).fillCircle(56, 56, 23)
    g.fillStyle(0xffbd67, 0.9).fillCircle(49, 48, 8)
    g.generateTexture('nest-core-thorn', 112, 112).clear()
    paintCombatProjectiles(g)
    paintWorldObjectTextures(g)
    createWorldPropTextures(g)
    paintBossTexture(g)
    g.destroy()
  }

  private drawWorld() {
    const graphics = this.add.graphics()
    paintRunWorld(this, this.runMap, graphics, this.huntSliceEnabled
      ? { excludePropsInside: GLOAMWOOD_HUNT_SLICE.region }
      : undefined)
    if (this.nestLabEnabled) {
      const { x, y } = MONSTER_NEST_LAB.center
      graphics.fillStyle(0x140b08, 0.78).fillEllipse(x, y + 18, 560, 350)
      graphics.lineStyle(18, 0x43271b, 0.9).strokeEllipse(x, y + 18, 510, 315)
      graphics.lineStyle(5, 0xb86b3c, 0.55).strokeCircle(x, y, MONSTER_NEST_LAB.triggerRadius)
      for (let index = 0; index < 12; index += 1) {
        const angle = index / 12 * Math.PI * 2
        const radius = 185 + (index % 3) * 34
        graphics.fillStyle(index % 2 === 0 ? 0x5f3322 : 0x321c15, 0.95)
        graphics.fillTriangle(
          x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius,
          x + Math.cos(angle - 0.1) * (radius + 55),
          y + Math.sin(angle - 0.1) * (radius + 55),
          x + Math.cos(angle + 0.1) * (radius + 55),
          y + Math.sin(angle + 0.1) * (radius + 55),
        )
      }
    }
    if (this.huntSliceEnabled) {
      const region = GLOAMWOOD_HUNT_SLICE.region
      this.add.image(region.x, region.y, GLOAMWOOD_HUNT_SLICE.assetKey)
        .setOrigin(0)
        .setDisplaySize(region.width, region.height)
        .setDepth(GROUND_DEPTH + 0.35)
      this.createHuntSliceProps()
    }

    for (const landmark of this.runMap.landmarks) {
      const marker = this.add.graphics().setDepth(worldDepth(landmark.y, -0.3))
      const color = landmark.kind === 'boss-lair' ? 0xff6d4a : 0xffc857
      marker.lineStyle(5, color, 0.86).strokeCircle(landmark.x, landmark.y, landmark.kind === 'boss-lair' ? 88 : 54)
      marker.lineStyle(2, color, 0.45).strokeCircle(landmark.x, landmark.y, landmark.kind === 'boss-lair' ? 116 : 72)
      marker.fillStyle(color, 0.7).fillCircle(landmark.x, landmark.y, landmark.kind === 'boss-lair' ? 18 : 11)
      this.add.text(landmark.x, landmark.y + (landmark.kind === 'boss-lair' ? 132 : 88), landmark.name, {
        fontFamily: 'Arial, sans-serif', fontSize: landmark.kind === 'boss-lair' ? '24px' : '18px',
        color: landmark.kind === 'boss-lair' ? '#ff9a7e' : '#ffe7a0',
        backgroundColor: '#08110dcc', padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setDepth(worldDepth(landmark.y, 2))
    }

    for (const site of this.runMap.rewardSites) {
      const cache = this.add.image(site.x, site.y, 'cache-sealed')
        .setOrigin(UNIT_ORIGIN.x, UNIT_ORIGIN.y)
        .setDepth(worldDepth(site.y))
      this.rewardObjects.set(site.id, cache)
      this.add.text(site.x, site.y + 52, site.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#d9c9a0',
        backgroundColor: '#08110dcc', padding: { x: 9, y: 4 },
      }).setOrigin(0.5).setDepth(worldDepth(site.y, 2))
    }

    for (const event of this.runMap.worldEvents) {
      const marker = this.add.image(event.x, event.y, 'world-event')
        .setOrigin(UNIT_ORIGIN.x, UNIT_ORIGIN.y)
        .setDepth(worldDepth(event.y, -0.1))
        .setAlpha(0.8)
      this.eventObjects.set(event.id, marker)
      this.add.text(event.x, event.y + 62, event.name, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#a7d9bd',
      }).setOrigin(0.5).setDepth(worldDepth(event.y, 2)).setAlpha(0.75)
    }
  }

  private createHuntSliceProps() {
    this.huntSliceCollisionBodies = this.physics.add.staticGroup()
    for (const definition of GLOAMWOOD_SLICE_PROPS) {
      const asset = GLOAMWOOD_SLICE_PROP_ASSETS[definition.kind]
      const texture = this.textures.get(asset.assetKey).getSourceImage() as { width: number; height: number }
      const displayWidth = definition.displayHeight * texture.width / texture.height
      this.add.ellipse(
        definition.x,
        definition.y - 8,
        definition.collisionWidth * 1.9,
        definition.collisionHeight * 0.72,
        0x020604,
        0.42,
      ).setDepth(GROUND_DEPTH + 0.5)
      const image = this.add.image(definition.x, definition.y, asset.assetKey)
        .setOrigin(0.5, 0.96)
        .setDisplaySize(displayWidth, definition.displayHeight)
        .setDepth(worldDepth(definition.y, 0.15))
        .setData('slicePropId', definition.id)
      this.huntSlicePropImages.push({ definition, image })

      const center = slicePropCollisionCenter(definition)
      const collider = this.huntSliceCollisionBodies.create(
        center.x,
        center.y,
        'slice-collision-marker',
      ) as Phaser.Physics.Arcade.Image
      collider
        .setDisplaySize(definition.collisionWidth, definition.collisionHeight)
        .setVisible(false)
        .setData('slicePropId', definition.id)
      const body = collider.body as Phaser.Physics.Arcade.StaticBody
      body.updateFromGameObject().setSize(definition.collisionWidth, definition.collisionHeight, true)
    }
  }

  private createFogOfWar() {
    this.fogCells = createFogGrid()
    this.unknownFog = this.add.graphics().setDepth(50)
    this.exploredFog = this.add.graphics().setDepth(51)
    this.visionEdgeFog = this.add.graphics().setDepth(52)
  }

  private refreshExploration() {
    revealFogCells(this.fogCells, this.player.x, this.player.y, REVEAL_RADIUS)
    const biome = getBiomeAt(this.player.x, this.player.y)
    if (biome.id !== this.currentBiome) {
      this.currentBiome = biome.id
      const firstVisit = !this.visitedBiomes.has(biome.id)
      this.visitedBiomes.add(biome.id)
      if (firstVisit) this.flashMessage(`发现区域 · ${biome.name} · ${difficultyForBiome(biome.id).threatLabel}`)
    }

    for (const landmark of this.runMap.landmarks) {
      if (this.discoveredLandmarks.has(landmark.id)) continue
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, landmark.x, landmark.y) <= LANDMARK_DISCOVERY_RADIUS) {
        this.discoveredLandmarks.add(landmark.id)
        this.flashMessage(`发现地标 · ${landmark.name}`)
      }
    }

    if (this.bossActive) {
      this.unknownFog.clear()
      this.exploredFog.clear()
      this.visionEdgeFog.clear()
      this.renderHud()
      return
    }

    const visionSquared = VISION_RADIUS * VISION_RADIUS
    const revealSquared = REVEAL_RADIUS * REVEAL_RADIUS
    this.unknownFog.clear().fillStyle(0x07140c, 0.78)
    this.exploredFog.clear().fillStyle(0x081610, 0.34)
    this.visionEdgeFog.clear().fillStyle(0x081610, 0.14)
    for (const cell of this.fogCells) {
      const dx = cell.centerX - this.player.x
      const dy = cell.centerY - this.player.y
      const distanceSquared = dx * dx + dy * dy
      const isVisible = distanceSquared <= visionSquared
      if (isVisible) continue
      const isVisionEdge = cell.explored && distanceSquared <= revealSquared
      const target = !cell.explored ? this.unknownFog : isVisionEdge ? this.visionEdgeFog : this.exploredFog
      target.fillRect(cell.x, cell.y, FOG_CELL_SIZE + 1, FOG_CELL_SIZE + 1)
    }
    this.renderHud()
  }

  private createHud() {
    this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(100)
    this.evolutionBar = this.add.graphics().setScrollFactor(0).setDepth(100)
    this.statusText = this.add.text(22, 72, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#d9efe5',
    }).setScrollFactor(0).setDepth(101)
    this.biomeText = this.add.text(640, 28, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#d8e6dc',
      backgroundColor: '#040b08cc', padding: { x: 14, y: 8 }, letterSpacing: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101)
    this.objectiveText = this.add.text(22, 101, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#f4d98b',
    }).setScrollFactor(0).setDepth(101)
    this.targetText = this.add.text(640, 76, '无锁定时受击会补锁 · 已锁定不抢', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#d6e9df',
      backgroundColor: '#040b08cc', padding: { x: 12, y: 7 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101)
    this.targetMarker = this.add.graphics().setDepth(FX_DEPTH - 0.5)
    this.combatHud = this.add.graphics().setScrollFactor(0).setDepth(101)
    this.combatStyleTexts = COMBAT_STYLE_ORDER.map((style, index) => this.add.text(1000 + index * 82, 176, `${index + 1} ${COMBAT_STYLES[style].shortName}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#b6cfc2', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102))
    this.dodgeText = this.add.text(1152, 211, 'Shift 闪避 · 就绪', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#b8ffe0', fontStyle: 'bold',
      backgroundColor: '#030907cc', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102)
    this.interactionText = this.add.text(640, 644, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#fff1bd', fontStyle: 'bold',
      backgroundColor: '#030907e6', padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setVisible(false)
    this.minimapGraphics = this.add.graphics().setScrollFactor(0).setDepth(101)
    this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(103).setVisible(false)
    this.bossText = this.add.text(640, 666, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#ffdce7', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(104).setVisible(false)
    this.messageText = this.add.text(640, 150, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffc857', fontStyle: 'bold',
      stroke: '#071a16', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0)
    this.renderHud()
  }

  private renderHud() {
    this.healthBar.clear()
    this.healthBar.fillStyle(0x06110e, 0.82).fillRoundedRect(20, 20, 250, 20, 6)
    this.healthBar.fillStyle(0xff6b5f).fillRoundedRect(23, 23, 244 * Math.max(0, this.health) / this.maxHealth, 14, 4)
    this.evolutionBar.clear()
    this.evolutionBar.fillStyle(0x06110e, 0.82).fillRoundedRect(20, 48, 250, 14, 5)
    const required = evolutionRequirementForStage(this.evolutionStage)
    const evolutionRatio = required > 0 ? Math.min(1, this.evolution / required) : 1
    this.evolutionBar.fillStyle(this.pendingEvolutionAt > 0 ? 0xff8a5c : 0xffc857).fillRoundedRect(23, 51, 244 * evolutionRatio, 8, 3)
    const strongestGene = dominantGene(this.genes, this.recentHunts)
    const formName = currentFormName(this.mutationRanks, this.genes, this.recentHunts)
    const geneStatus = strongestGene ? `   ·   ${formName}` : ''
    const poisonStatus = this.time.now < this.poisonedUntil ? '   ·   中毒' : ''
    this.statusText.setText(
      `${this.starter.name}   ·   生命 ${this.health}/${this.maxHealth}   ·   防御 ${Math.round(this.defenseReduction * 100)}%   ·   进化 ${formatEvolutionStageLabel(this.evolutionStage, EVOLUTION_CONFIG.maxStages)}   ·   ${this.evolution}/${required}   ·   击杀 ${this.kills}${geneStatus}${poisonStatus}`,
    )
    const biome = getBiomeAt(this.player.x, this.player.y)
    this.biomeText.setText(`${this.runMap.archetypeName} · ${this.runMap.layoutName}  /  ${biome.name} · ${biomeThreatCopy(biome.id, this.evolutionStage)}`)
    this.objectiveText.setText(this.nestLabEnabled ? this.monsterNestObjectiveCopy() : huntObjectiveCopy(this.huntObjectiveState()))
    this.renderBossHud()
    this.renderMinimap()
    this.renderCombatHud()
    this.syncEvolutionHud()
  }

  private renderBossHud() {
    if (!this.bossActive || this.bossDefeated) {
      this.bossBar?.setVisible(false)
      this.bossText?.setVisible(false)
      return
    }
    this.bossBar.setVisible(true).clear()
    this.bossBar.fillStyle(0x090407, 0.9).fillRoundedRect(390, 692, 500, 16, 6)
    this.bossBar.fillStyle(this.bossPhaseValue === 1 ? 0xd85e88 : 0xff7a4d).fillRoundedRect(
      394, 696, 492 * Math.max(0, this.bossHealth) / this.bossMaxHealth, 8, 4,
    )
    this.bossText.setVisible(true).setText(`${RIFT_WARDEN.name} · 阶段 ${this.bossPhaseValue}`)
  }

  private renderMinimap() {
    if (!this.minimapGraphics || this.fogCells.length === 0) return
    const x = 1042
    const y = 20
    const width = 216
    const height = 134
    const scaleX = width / WORLD_WIDTH
    const scaleY = height / WORLD_HEIGHT
    this.minimapGraphics.clear()
    this.minimapGraphics.fillStyle(0x020705, 0.9).fillRoundedRect(x - 8, y - 8, width + 16, height + 16, 8)
    for (const cell of this.fogCells) {
      if (!cell.explored) continue
      const biome = getBiomeAt(cell.centerX, cell.centerY)
      this.minimapGraphics.fillStyle(biome.detailColor, 0.86).fillRect(
        x + cell.x * scaleX,
        y + cell.y * scaleY,
        Math.max(1, FOG_CELL_SIZE * scaleX + 0.4),
        Math.max(1, FOG_CELL_SIZE * scaleY + 0.4),
      )
    }
    this.minimapGraphics.lineStyle(2, 0x779b87, 0.55).strokeRoundedRect(x - 8, y - 8, width + 16, height + 16, 8)
    this.minimapGraphics.fillStyle(0xffe48a).fillCircle(
      x + this.player.x * scaleX,
      y + this.player.y * scaleY,
      4,
    )
  }

  private beginDodge(time: number, inputX: number, inputY: number) {
    if (!canStartDodge(time, this.nextDodgeAt, this.movementState)) return
    const direction = resolveDodgeDirection(inputX, inputY, this.player.rotation)
    this.movementState = 'dodge'
    this.movementStateUntil = time + DODGE.durationMs
    this.nextDodgeAt = time + Math.round(DODGE.cooldownMs * this.dodgeCooldownMultiplier)
    this.lastDodgeAt = time
    this.invulnerableUntil = Math.max(this.invulnerableUntil, this.movementStateUntil)
    this.dodgeVelocity = { x: direction.x * DODGE.speed, y: direction.y * DODGE.speed }
    this.pendingAttack = undefined
    this.bufferedAttack = undefined
    this.combatTelegraph.clear()
    ;(this.player.body as Phaser.Physics.Arcade.Body).setMaxSpeed(DODGE.speed)
    this.player.clearTint().setAlpha(0.58).setVelocity(this.dodgeVelocity.x, this.dodgeVelocity.y)
  }

  private updatePlayerMovement(time: number, inputX: number, inputY: number) {
    if (this.movementState !== 'normal' && time >= this.movementStateUntil) {
      this.movementState = 'normal'
      this.syncPlayerSpeedCap()
      this.player.setAlpha(1).clearTint()
    }
    if (this.movementState === 'dodge') {
      this.player.setVelocity(this.dodgeVelocity.x, this.dodgeVelocity.y)
      return
    }
    if (this.movementState === 'hitstun') return
    const clickDirection = inputX === 0 && inputY === 0
      ? directionToMoveTarget(this.player.x, this.player.y, this.moveTarget)
      : undefined
    if (this.moveTarget && !clickDirection && inputX === 0 && inputY === 0) this.clearMoveTarget()
    const direction = new Phaser.Math.Vector2(clickDirection?.x ?? inputX, clickDirection?.y ?? inputY)
    if (direction.lengthSq() > 0) direction.normalize().scale(this.effectivePlayerSpeed())
    this.player.setVelocity(direction.x, direction.y)
  }

  private currentBuffModifiers() {
    return eliteOrbBuffModifiers(this.eliteOrbBuff, this.time.now)
  }

  private effectivePlayerSpeed() {
    return Math.round(this.playerSpeed * this.currentBuffModifiers().speedMultiplier)
  }

  private syncPlayerSpeedCap() {
    if (!this.player || this.movementState === 'dodge') return
    ;(this.player.body as Phaser.Physics.Arcade.Body).setMaxSpeed(this.effectivePlayerSpeed())
  }

  private updateEliteOrbBuff(time: number) {
    if (this.eliteOrbBuff && time >= this.eliteOrbBuff.expiresAt) {
      this.eliteOrbBuff = null
      this.syncPlayerSpeedCap()
      this.flashMessage('精英余韵消退')
      this.renderHud()
    }
    const remaining = Math.ceil(eliteOrbBuffRemainingMs(this.eliteOrbBuff, time) / 1000)
    if (remaining !== this.lastBuffHudSecond) {
      this.lastBuffHudSecond = remaining
      this.syncEvolutionHud()
    }
  }

  private clearMoveTarget() {
    this.moveTarget = undefined
    this.moveMarker?.clear()
  }

  private renderMoveTarget(time: number) {
    this.moveMarker.clear()
    if (!this.moveTarget) return
    const pulse = 0.72 + Math.sin(time / 110) * 0.16
    this.moveMarker.lineStyle(2, 0x9effcf, pulse).strokeCircle(this.moveTarget.x, this.moveTarget.y, 12)
    this.moveMarker.fillStyle(0x9effcf, 0.28).fillCircle(this.moveTarget.x, this.moveTarget.y, 4)
  }

  private renderDodgeFeedback(time: number) {
    this.dodgeTrail.clear()
    if (this.movementState === 'dodge') {
      const direction = new Phaser.Math.Vector2(this.dodgeVelocity.x, this.dodgeVelocity.y).normalize()
      this.dodgeTrail.lineStyle(18, 0x79f2d0, 0.22).lineBetween(
        this.player.x,
        this.player.y,
        this.player.x - direction.x * 82,
        this.player.y - direction.y * 82,
      )
    }
    const remaining = dodgeCooldownRemaining(time, this.nextDodgeAt)
    if (this.movementState === 'dodge') this.dodgeText.setColor('#fff0b0').setText('Shift 闪避 · 无敌')
    else if (remaining > 0) this.dodgeText.setColor('#82998f').setText(`Shift 闪避 · ${(remaining / 1000).toFixed(1)}s`)
    else this.dodgeText.setColor('#b8ffe0').setText('Shift 闪避 · 就绪')
  }

  private createMonsterNestCore() {
    const { x, y } = MONSTER_NEST_LAB.center
    this.nestAura = this.add.graphics().setDepth(worldDepth(y, -0.3))
    this.nestCore = this.physics.add.image(x, y, 'nest-core-thorn')
      .setOrigin(0.5)
      .setCircle(48)
      .setTint(0x6f6259)
      .setAlpha(0.9)
    this.nestCore.setData('nestId', MONSTER_NEST_LAB.id)
    this.nestLabel = this.add.text(x, y + 104, `${MONSTER_NEST_LAB.name} · 核心封闭`, {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#e7b98d', fontStyle: 'bold',
      backgroundColor: '#120a07dd', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(worldDepth(y, 2))
  }

  private activeNestEnemies() {
    return this.enemies.getChildren()
      .map((child) => child as Phaser.Physics.Arcade.Image)
      .filter((enemy) => enemy.active && String(enemy.getData('encounterId')).startsWith(`${MONSTER_NEST_LAB.id}-w`))
  }

  private startMonsterNestWave(wave: 1 | 2) {
    this.nestPhase = wave === 1 ? 'wave-1' : 'wave-2'
    for (const spawn of MONSTER_NEST_LAB.waves[wave - 1]) {
      this.spawnEnemy(
        spawn.id,
        spawn.type,
        MONSTER_NEST_LAB.center.x + spawn.offsetX,
        MONSTER_NEST_LAB.center.y + spawn.offsetY,
        'gloamwood',
        { elite: 'elite' in spawn ? spawn.elite : false, healthScale: wave === 2 ? 1.18 : 1 },
      )
    }
    this.nestLabel?.setText(`${MONSTER_NEST_LAB.name} · 守卫 ${wave}/2`)
    this.flashMessage(`${MONSTER_NEST_LAB.name} · 第 ${wave} 波守卫苏醒`)
  }

  private updateMonsterNest(time: number) {
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      MONSTER_NEST_LAB.center.x,
      MONSTER_NEST_LAB.center.y,
    )
    if (this.nestPhase === 'dormant' && distance <= MONSTER_NEST_LAB.triggerRadius) {
      this.startMonsterNestWave(1)
    } else if (this.nestPhase === 'wave-1' && this.activeNestEnemies().length === 0) {
      this.nestPhase = 'intermission-1'
      this.nestIntermissionUntil = time + MONSTER_NEST_LAB.intermissionMs
      this.nestLabel?.setText(`${MONSTER_NEST_LAB.name} · 地穴震动`)
      this.flashMessage('第一波清除 · 地穴深处正在苏醒')
    } else if (this.nestPhase === 'intermission-1' && time >= this.nestIntermissionUntil) {
      this.startMonsterNestWave(2)
    } else if (this.nestPhase === 'wave-2' && this.activeNestEnemies().length === 0) {
      this.nestPhase = 'core-vulnerable'
      this.nestCore?.clearTint().setAlpha(1)
      this.nestLabel?.setText(`${MONSTER_NEST_LAB.name} · 核心暴露`)
      this.flashMessage('守卫全灭 · 点击核心并用任意战斗方式摧毁')
    }
    this.renderMonsterNestAura(time)
  }

  private renderMonsterNestAura(time: number) {
    if (!this.nestAura || this.nestPhase === 'cleared') return
    const { x, y } = MONSTER_NEST_LAB.center
    const pulse = 1 + Math.sin(time / 180) * 0.08
    this.nestAura.clear()
    this.nestAura.lineStyle(
      canDamageNestCore(this.nestPhase) ? 8 : 4,
      canDamageNestCore(this.nestPhase) ? 0xff8a54 : 0x9f5a3a,
      canDamageNestCore(this.nestPhase) ? 0.72 : 0.38,
    ).strokeCircle(x, y, 74 * pulse)
    this.nestAura.fillStyle(0xff673d, canDamageNestCore(this.nestPhase) ? 0.12 : 0.05).fillCircle(x, y, 64 * pulse)
  }

  private hitNestCore(firstObject: unknown, secondObject: unknown) {
    const first = firstObject as Phaser.Physics.Arcade.Image
    const second = secondObject as Phaser.Physics.Arcade.Image
    const bullet = first.texture.key === 'bullet' ? first : second
    if (!bullet.active) return
    bullet.disableBody(true, true)
    if (!canDamageNestCore(this.nestPhase)) {
      this.flashMessage('核心仍被守卫的血肉封锁')
      return
    }
    this.applyRangedConnectJuice(MONSTER_NEST_LAB.center.x, MONSTER_NEST_LAB.center.y)
    this.applyDamageToNestCore((bullet.getData('damage') as number) || this.bulletDamage)
  }

  private applyDamageToNestCore(damage: number) {
    if (!this.nestCore?.active || !canDamageNestCore(this.nestPhase)) return
    this.nestCoreHealth = Math.max(0, this.nestCoreHealth - damage)
    this.showFloatingDamage(this.nestCore.x, this.nestCore.y, damage, '#ffbd67')
    this.nestCore.setTintFill(0xffffff)
    this.time.delayedCall(65, () => {
      if (this.nestCore?.active) this.nestCore.clearTint()
    })
    this.nestLabel?.setText(`${MONSTER_NEST_LAB.name} · 核心 ${Math.ceil(this.nestCoreHealth)}/${MONSTER_NEST_LAB.coreMaxHealth}`)
    if (this.nestCoreHealth <= 0) this.clearMonsterNest()
  }

  private clearMonsterNest() {
    if (this.nestRewardGranted) return
    this.nestPhase = 'cleared'
    this.nestRewardGranted = true
    this.selectedTarget = undefined
    this.nestCore?.disableBody(true, true)
    this.nestAura?.clear().lineStyle(5, 0x74d89b, 0.7).strokeCircle(
      MONSTER_NEST_LAB.center.x,
      MONSTER_NEST_LAB.center.y,
      86,
    )
    this.nestLabel?.setColor('#9af0b8').setText(`${MONSTER_NEST_LAB.name} · 已清理`)
    this.genes = { ...this.genes, fang: this.genes.fang + MONSTER_NEST_LAB.reward.fangGenes }
    this.recentHunts = [...this.recentHunts, ...Array<GeneFamily>(3).fill('fang')].slice(-8)
    this.addEvolution(MONSTER_NEST_LAB.reward.evolution)
    this.nestFogRevealCount = revealFogCells(
      this.fogCells,
      MONSTER_NEST_LAB.center.x,
      MONSTER_NEST_LAB.center.y,
      MONSTER_NEST_LAB.revealRadius,
    )
    this.refreshExploration()
    this.cameras.main.flash(280, 130, 242, 164, false)
    this.cameras.main.shake(260, 0.008)
    this.flashMessage(`窝点清理 · 猎牙基因 +${MONSTER_NEST_LAB.reward.fangGenes} · 周边迷雾揭开`)
    this.renderHud()
  }

  private getTargetId(target?: Phaser.Physics.Arcade.Image) {
    if (!target) return undefined
    if (target === this.boss) return 'rift-warden'
    if (target === this.nestCore) return MONSTER_NEST_LAB.id
    return target.getData('encounterId') as string | undefined
  }

  private isTargetVisible(target?: Phaser.Physics.Arcade.Image) {
    if (!target?.active) return false
    if (target === this.boss) {
      if (!this.bossActive || this.bossDefeated) return false
      return this.cameras.main.worldView.contains(target.x, target.y)
    }
    if (target === this.nestCore) {
      return canDamageNestCore(this.nestPhase)
        && Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y) <= TARGET_LOCK_RADIUS
    }
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y) <= TARGET_LOCK_RADIUS
  }

  private getVisibleTargets() {
    const targets = this.enemies.getChildren()
      .map((child) => child as Phaser.Physics.Arcade.Image)
      .filter((enemy) => this.isTargetVisible(enemy))
    if (this.isTargetVisible(this.boss)) targets.push(this.boss)
    if (this.nestCore && this.isTargetVisible(this.nestCore)) targets.push(this.nestCore)
    return targets.sort((a, b) => {
      const distanceA = Phaser.Math.Distance.Squared(this.player.x, this.player.y, a.x, a.y)
      const distanceB = Phaser.Math.Distance.Squared(this.player.x, this.player.y, b.x, b.y)
      return distanceA - distanceB
    })
  }

  private pickTargetAt(worldX: number, worldY: number) {
    return this.getVisibleTargets()
      .map((target) => ({ target, distance: Phaser.Math.Distance.Between(worldX, worldY, target.x, target.y) }))
      .filter(({ target, distance }) => distance <= Math.max(46, target.displayWidth * 0.72))
      .sort((a, b) => a.distance - b.distance)[0]?.target
  }

  private handlePrimaryPointer(pointer: Phaser.Input.Pointer) {
    if (pointer.button !== 0) return
    const clickedTarget = this.pickTargetAt(pointer.worldX, pointer.worldY)
    if (clickedTarget) {
      this.clearMoveTarget()
      this.selectedTarget = clickedTarget
      this.attackSelectedOrPoint(pointer.worldX, pointer.worldY)
      return
    }
    this.selectedTarget = undefined
    this.bufferedAttack = undefined
    this.moveTarget = {
      x: Phaser.Math.Clamp(pointer.worldX, 0, WORLD_WIDTH),
      y: Phaser.Math.Clamp(pointer.worldY, 0, WORLD_HEIGHT),
    }
  }

  private cycleVisibleTarget() {
    const targets = this.getVisibleTargets()
    if (targets.length === 0) {
      this.selectedTarget = undefined
      return
    }
    const currentIndex = this.selectedTarget ? targets.indexOf(this.selectedTarget) : -1
    this.selectedTarget = targets[(currentIndex + 1) % targets.length]
    this.flashMessage(`锁定 · ${this.getTargetName(this.selectedTarget)}`)
  }

  private validateSelectedTarget() {
    if (!this.isTargetVisible(this.selectedTarget)) this.selectedTarget = undefined
  }

  private getAimPoint(fallbackX: number, fallbackY: number) {
    if (this.isTargetVisible(this.selectedTarget)) return { x: this.selectedTarget!.x, y: this.selectedTarget!.y }
    return { x: fallbackX, y: fallbackY }
  }

  private attackSelectedOrPoint(fallbackX: number, fallbackY: number, allowBuffer = true) {
    const now = this.time.now
    const definition = COMBAT_STYLES[this.combatStyle]
    const cooldown = this.combatStyle === 'ranged'
      ? this.shotCooldown
      : this.combatStyle === 'magic' ? this.magicCooldown : definition.cooldownMs
    if (this.movementState !== 'normal' || this.pendingAttack || now < this.recoverUntil || now - this.lastShot < cooldown) {
      if (allowBuffer) this.bufferedAttack = { fallbackX, fallbackY, expiresAt: attackBufferExpiresAt(now) }
      return
    }

    const rawAim = this.getAimPoint(fallbackX, fallbackY)
    const aim = clampAttackPoint(this.player.x, this.player.y, rawAim.x, rawAim.y, definition.range)
    if (this.selectedTarget) {
      const targetDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.selectedTarget.x, this.selectedTarget.y)
      if (!isWithinAttackRange(this.combatStyle, targetDistance)) {
        this.attackRangeWarningUntil = now + 720
        this.bufferedAttack = undefined
        return
      }
    }

    this.bufferedAttack = undefined
    this.attackRangeWarningUntil = 0
    this.lastShot = now
    this.pendingAttack = {
      style: this.combatStyle,
      impactAt: now + definition.telegraphMs,
      aimX: aim.x,
      aimY: aim.y,
      aimAngle: Phaser.Math.Angle.Between(this.player.x, this.player.y, aim.x, aim.y),
      damage: attackDamage(
        this.combatStyle,
        this.bulletDamage,
        this.starter.damageMultiplier[this.combatStyle] * this.currentBuffModifiers().damageMultiplier,
        this.combatDamageBonuses[this.combatStyle],
      ),
      target: this.selectedTarget,
    }
    this.player.setTintFill(this.combatStyle === 'melee' ? 0xffd36e : this.combatStyle === 'magic' ? 0xc78cff : 0xb8ffe0)
  }

  private updateAttackBuffer(time: number) {
    if (!this.bufferedAttack) return
    if (!isAttackBufferAlive(time, this.bufferedAttack.expiresAt)) {
      this.bufferedAttack = undefined
      return
    }
    const buffered = this.bufferedAttack
    this.attackSelectedOrPoint(buffered.fallbackX, buffered.fallbackY, false)
  }

  private trackPendingAttackTarget() {
    const attack = this.pendingAttack
    if (!attack || !this.isTargetVisible(attack.target)) return
    const target = attack.target!
    const aim = clampAttackPoint(
      this.player.x,
      this.player.y,
      target.x,
      target.y,
      COMBAT_STYLES[attack.style].range,
    )
    attack.aimX = aim.x
    attack.aimY = aim.y
    attack.aimAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, aim.x, aim.y)
  }

  private getTargetName(target: Phaser.Physics.Arcade.Image) {
    if (target === this.boss) return RIFT_WARDEN.name
    if (target === this.nestCore) return `${MONSTER_NEST_LAB.name}核心`
    const name = MONSTERS[target.getData('type') as MonsterType].name
    const affix = (target.getData('eliteAffix') as EliteAffixId | null) ?? null
    return affix ? `【${ELITE_AFFIXES[affix].name}】${name}` : name
  }

  private renderTargeting() {
    this.targetMarker.clear()
    if (!this.isTargetVisible(this.selectedTarget)) {
      this.targetText.setColor('#d6e9df').setText(`${COMBAT_STYLES[this.combatStyle].name} · 点击怪物或按 Tab 选择`)
      return
    }
    const target = this.selectedTarget!
    const radius = Math.max(target.displayWidth, target.displayHeight) * 0.62 + 8
    const retaliationPulse = autoLockPulse(this.time.now, this.lastAutoLockAt)
    const pulseRadius = radius + retaliationPulse * 12
    this.targetMarker.lineStyle(3 + retaliationPulse * 3, 0xffd36e, 0.95).strokeCircle(target.x, target.y, pulseRadius)
    this.targetMarker.lineStyle(1, 0xfff0a8, 0.58).strokeCircle(target.x, target.y, radius + 6)
    if (retaliationPulse > 0 && this.getTargetId(target) === this.lastAutoLockedId) {
      this.targetMarker.fillStyle(0xffd36e, 0.65 + retaliationPulse * 0.35).fillTriangle(
        target.x,
        target.y - pulseRadius - 6,
        target.x - 8,
        target.y - pulseRadius - 20,
        target.x + 8,
        target.y - pulseRadius - 20,
      )
    }
    const hp = target === this.boss ? this.bossHealth : target === this.nestCore ? this.nestCoreHealth : target.getData('hp') as number
    const maxHp = target === this.boss ? this.bossMaxHealth : target === this.nestCore ? MONSTER_NEST_LAB.coreMaxHealth : target.getData('maxHp') as number
    const eliteShield = target === this.boss || target === this.nestCore ? 0 : target.getData('eliteShield') as number
    const shieldStatus = eliteShield > 0 ? ` · 护盾 ${Math.ceil(eliteShield)}` : ''
    const distance = Math.round(Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y))
    const range = COMBAT_STYLES[this.combatStyle].range
    if (this.time.now < this.attackRangeWarningUntil) {
      this.targetText.setColor('#ff9a7e').setText(`目标过远 ${distance}/${range} · 向目标靠近后再攻击`)
    } else {
      this.targetText.setColor('#d6e9df').setText(
        `锁定 ${this.getTargetName(target)} · 生命 ${Math.ceil(hp)}/${maxHp}${shieldStatus} · 距离 ${distance}/${range} · ${COMBAT_STYLES[this.combatStyle].shortName}`,
      )
    }
  }

  private renderCombatFeedback(time: number) {
    this.enemyStatusGraphics.clear()
    this.talentFeedbackGraphics.clear()
    this.eliteAffixGraphics.clear()
    this.playerStatusGraphics.clear()
    this.visibleEnemyHealthBars = 0
    this.activeTalentSignals.clear()
    this.activeEliteAffixSignals.clear()
    const worldView = this.cameras.main.worldView
    const enemies = this.enemies.getChildren().map((child) => child as Phaser.Physics.Arcade.Image)

    for (const enemy of enemies) {
      if (!enemy.active) continue
      const type = enemy.getData('type') as MonsterType
      const definition = MONSTERS[type]
      const state = enemy.getData('state') as EnemyState
      const hp = enemy.getData('hp') as number
      const maxHp = enemy.getData('maxHp') as number
      const inView = worldView.contains(enemy.x, enemy.y)
      const selected = this.selectedTarget === enemy
      if (shouldShowEnemyHealthBar(enemy.active, inView, state, hp, maxHp, selected)) {
        const barWidth = selected ? 54 : 42
        const barHeight = selected ? 6 : 4
        const barX = enemy.x - barWidth / 2
        const barY = enemy.y - Math.max(28, enemy.displayHeight * 0.62) - 13
        const ratio = healthRatio(hp, maxHp)
        const color = ratio > 0.55 ? 0x7ee5a3 : ratio > 0.25 ? 0xffc857 : 0xff6b5f
        this.enemyStatusGraphics.fillStyle(0x020806, 0.88).fillRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 3)
        this.enemyStatusGraphics.fillStyle(color, 0.96).fillRoundedRect(barX, barY, barWidth * ratio, barHeight, 2)
        if (selected) this.enemyStatusGraphics.lineStyle(1, 0xffe89a, 0.8).strokeRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 3)
        this.visibleEnemyHealthBars += 1
      }

      const eliteAffix = (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null
      const affixLabel = enemy.getData('affixLabel') as Phaser.GameObjects.Text | undefined
      if (affixLabel) {
        const berserkerActive = isBerserkerActive(eliteAffix, hp, maxHp)
        affixLabel.setVisible(inView).setPosition(enemy.x, enemy.y - Math.max(38, enemy.displayHeight * 0.68) - 26)
        affixLabel.setText(`精英 · ${ELITE_AFFIXES[eliteAffix!].name}${berserkerActive ? ' 爆发' : ''}`)
      }
      if (eliteAffix && inView) {
        const affix = ELITE_AFFIXES[eliteAffix]
        const enemyId = this.getTargetId(enemy) ?? type
        const affixRadius = Math.max(31, enemy.displayWidth * 0.67)
        const recentlyActivated = time - (enemy.getData('lastEliteAffixAt') as number) <= 520
        const berserkerActive = isBerserkerActive(eliteAffix, hp, maxHp)
        const signalActive = recentlyActivated || berserkerActive || (eliteAffix === 'barrier' && (enemy.getData('eliteShield') as number) > 0)
        this.activeEliteAffixSignals.add(`${enemyId}:${eliteAffix}${signalActive ? ':active' : ''}`)
        this.eliteAffixGraphics.lineStyle(signalActive ? 4 : 2, affix.color, signalActive ? 0.82 : 0.42)
          .strokeCircle(enemy.x, enemy.y, affixRadius)

        if (eliteAffix === 'berserker' && berserkerActive) {
          const flare = affixRadius + 7 + Math.sin(time / 70) * 4
          this.eliteAffixGraphics.lineStyle(5, affix.color, 0.64).strokeCircle(enemy.x, enemy.y, flare)
        } else if (eliteAffix === 'siphon') {
          this.eliteAffixGraphics.fillStyle(affix.color, recentlyActivated ? 0.9 : 0.48)
            .fillCircle(enemy.x - affixRadius, enemy.y - 4, 5)
            .fillCircle(enemy.x + affixRadius, enemy.y + 7, 4)
        } else if (eliteAffix === 'brood') {
          this.eliteAffixGraphics.lineStyle(3, affix.color, 0.68)
            .strokeCircle(enemy.x - affixRadius - 7, enemy.y, 7)
            .strokeCircle(enemy.x + affixRadius + 7, enemy.y, 7)
        } else if (eliteAffix === 'barrier' && (enemy.getData('eliteShield') as number) > 0) {
          const shieldRatio = healthRatio(enemy.getData('eliteShield') as number, enemy.getData('eliteShieldMax') as number)
          this.eliteAffixGraphics.lineStyle(6, affix.color, 0.45 + shieldRatio * 0.4)
            .strokeCircle(enemy.x, enemy.y, affixRadius + 7)
        } else if (eliteAffix === 'volatile') {
          this.eliteAffixGraphics.lineStyle(2, affix.color, 0.35)
            .strokeCircle(enemy.x, enemy.y, affixRadius + 8 + Math.sin(time / 110) * 3)
        }
      }

      const enemyId = this.getTargetId(enemy) ?? type
      const signalActive = isTalentSignalActive(definition.lineage, time, enemy.getData('lastTalentAt') as number)
      const fangActive = definition.lineage === 'fang' && this.health / this.maxHealth <= 0.4 && !['idle', 'return', 'regenerate'].includes(state)
      const swarmActive = definition.lineage === 'swarm' && enemy.getData('swarmBuffActive') as boolean
      if (signalActive || fangActive || swarmActive) this.activeTalentSignals.add(`${enemyId}:${definition.lineage}`)

      if (fangActive) {
        const beat = 0.45 + Math.sin(time / 80) * 0.16
        this.talentFeedbackGraphics.lineStyle(5, 0xff4e4e, beat).strokeCircle(enemy.x, enemy.y, Math.max(25, enemy.displayWidth * 0.62))
      }
      if (definition.lineage === 'wing' && signalActive) {
        const behindX = enemy.x - Math.cos(enemy.rotation) * 30
        const behindY = enemy.y - Math.sin(enemy.rotation) * 30
        this.talentFeedbackGraphics.lineStyle(4, 0xa8ffe6, 0.7)
          .lineBetween(behindX, behindY - 10, behindX - Math.cos(enemy.rotation) * 28, behindY - 10 - Math.sin(enemy.rotation) * 28)
          .lineBetween(behindX, behindY + 10, behindX - Math.cos(enemy.rotation) * 28, behindY + 10 - Math.sin(enemy.rotation) * 28)
      }
      if (definition.lineage === 'carapace' && (signalActive || state === 'brace')) {
        const shieldRadius = Math.max(28, enemy.displayWidth * 0.66)
        this.talentFeedbackGraphics.lineStyle(5, 0x8fd8ff, state === 'brace' ? 0.85 : 0.58).strokeCircle(enemy.x, enemy.y, shieldRadius)
        this.talentFeedbackGraphics.lineStyle(2, 0xd4f3ff, 0.6).strokeCircle(enemy.x, enemy.y, shieldRadius + 5)
      }
      if (definition.lineage === 'swarm' && swarmActive) {
        this.talentFeedbackGraphics.lineStyle(2, 0x9cff70, 0.7).strokeCircle(enemy.x, enemy.y, Math.max(24, enemy.displayWidth * 0.58))
        for (const ally of enemies) {
          if (!ally.active || ally === enemy || this.getTargetId(ally)! <= enemyId) continue
          const allyDefinition = MONSTERS[ally.getData('type') as MonsterType]
          if (allyDefinition.lineage !== 'swarm' || !ally.getData('swarmBuffActive')) continue
          if (Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y) <= SWARM_LINK_RADIUS) {
            this.talentFeedbackGraphics.lineStyle(2, 0x8ff36d, 0.25).lineBetween(enemy.x, enemy.y, ally.x, ally.y)
          }
        }
      }
      if (definition.lineage === 'venom' && signalActive) {
        this.talentFeedbackGraphics.fillStyle(0x9af06f, 0.75)
          .fillCircle(enemy.x - 18, enemy.y - 25, 4)
          .fillCircle(enemy.x + 15, enemy.y - 31, 3)
          .fillCircle(enemy.x + 24, enemy.y - 19, 2)
      }
      if (definition.lineage === 'rift' && signalActive) {
        const portalRadius = 30 + Math.sin(time / 55) * 5
        this.talentFeedbackGraphics.lineStyle(5, 0xcb76ff, 0.72).strokeCircle(enemy.x, enemy.y, portalRadius)
        this.talentFeedbackGraphics.lineStyle(2, 0xffb36b, 0.75).strokeCircle(enemy.x, enemy.y, portalRadius + 7)
      }
    }

    if (time < this.poisonedUntil) {
      this.activeTalentSignals.add('player:venom')
      const orbit = time / 180
      this.playerStatusGraphics.lineStyle(4, 0x8fe85f, 0.72).strokeCircle(this.player.x, this.player.y, 31)
      for (let index = 0; index < 3; index += 1) {
        const angle = orbit + index * Math.PI * 2 / 3
        this.playerStatusGraphics.fillStyle(0xb7ff7d, 0.85).fillCircle(
          this.player.x + Math.cos(angle) * 35,
          this.player.y + Math.sin(angle) * 35,
          4,
        )
      }
    }
  }

  private showFloatingDamage(x: number, y: number, damage: number, color: string, suffix = '') {
    if (damage <= 0) return
    const text = this.add.text(x, y - 26, `${Math.max(1, Math.round(damage))}${suffix}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color, fontStyle: 'bold',
      stroke: '#020806', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(FX_DEPTH + 1)
    this.tweens.add({
      targets: text, y: y - 62, alpha: 0, scale: 1.12, duration: 650, ease: 'Cubic.Out',
      onComplete: () => text.destroy(),
    })
  }

  private selectCombatStyle(style: CombatStyle) {
    if (this.pendingAttack || this.combatStyle === style) return
    this.combatStyle = style
    this.bufferedAttack = undefined
    this.flashMessage(`${COMBAT_STYLES[style].name} · 已切换`)
    this.renderCombatHud()
  }

  private updatePendingAttack(time: number) {
    if (!this.pendingAttack || time < this.pendingAttack.impactAt) return
    const attack = this.pendingAttack
    this.pendingAttack = undefined
    this.recoverUntil = time + COMBAT_STYLES[attack.style].recoveryMs
    this.player.clearTint()

    let hits = 0
    if (attack.style === 'ranged') {
      const liveAim = this.isTargetVisible(attack.target) ? { x: attack.target!.x, y: attack.target!.y } : { x: attack.aimX, y: attack.aimY }
      this.firePlayerProjectile(liveAim.x, liveAim.y, attack.damage)
    } else if (attack.style === 'melee') {
      hits = this.executeMeleeAttack(attack)
    } else {
      hits = this.executeMagicAttack(attack)
    }
    this.lastCombatImpact = { style: attack.style, hits }
    this.showCombatImpact(attack)
  }

  private firePlayerProjectile(targetX: number, targetY: number, damage: number) {
    const bullet = this.bullets.get(this.player.x, this.player.y, 'bullet') as Phaser.Physics.Arcade.Image
    if (!bullet) return
    bullet.enableBody(true, this.player.x, this.player.y, true, true)
    bullet.setData('born', this.time.now)
      .setData('expiresAt', this.time.now + projectileLifetimeMs(COMBAT_STYLES.ranged.range, PLAYER_PROJECTILE_SPEED))
      .setData('damage', damage).setDepth(FX_DEPTH)
    this.physics.moveTo(bullet, targetX, targetY, PLAYER_PROJECTILE_SPEED)
    bullet.setRotation(Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY))
    bullet.setData('prevX', this.player.x).setData('prevY', this.player.y)
    this.player.setAlpha(0.86)
    this.time.delayedCall(45, () => this.player.setAlpha(1))
  }

  private getDamageableTargets() {
    const targets = this.enemies.getChildren()
      .map((child) => child as Phaser.Physics.Arcade.Image)
      .filter((enemy) => enemy.active)
    if (this.bossActive && !this.bossDefeated && this.boss.active) targets.push(this.boss)
    if (this.nestCore?.active && canDamageNestCore(this.nestPhase)) targets.push(this.nestCore)
    return targets
  }

  private executeMeleeAttack(attack: PendingPlayerAttack) {
    let hits = 0
    for (const target of this.getDamageableTargets()) {
      if (!isInsideMeleeArc(this.player.x, this.player.y, attack.aimAngle, target.x, target.y, COMBAT_STYLES.melee.range)) continue
      this.applyDamageToTarget(target, attack.damage)
      hits += 1
    }
    return hits
  }

  private executeMagicAttack(attack: PendingPlayerAttack) {
    let hits = 0
    for (const target of this.getDamageableTargets()) {
      if (Phaser.Math.Distance.Between(attack.aimX, attack.aimY, target.x, target.y) > this.magicRadius) continue
      this.applyDamageToTarget(target, attack.damage)
      hits += 1
    }
    return hits
  }

  private applyDamageToTarget(target: Phaser.Physics.Arcade.Image, damage: number) {
    if (target === this.boss) this.applyDamageToBoss(damage)
    else if (target === this.nestCore) this.applyDamageToNestCore(damage)
    else this.applyDamageToEnemy(target, damage)
  }

  private renderCombatTelegraph() {
    const attack = this.pendingAttack
    if (!attack) {
      this.combatTelegraph.clear()
      return
    }
    drawCombatTelegraph(
      this.combatTelegraph,
      attack.style,
      this.player.x,
      this.player.y,
      attack.aimX,
      attack.aimY,
      attack.aimAngle,
      this.magicRadius,
    )
  }

  private showCombatImpact(attack: PendingPlayerAttack) {
    const hits = this.lastCombatImpact?.hits ?? 0
    this.juiceBurst = {
      style: attack.style,
      originX: this.player.x,
      originY: this.player.y,
      aimX: attack.aimX,
      aimY: attack.aimY,
      aimAngle: attack.aimAngle,
      magicRadius: this.magicRadius,
      hits,
      startedAt: this.time.now,
      durationMs: juiceBurstMs(attack.style),
    }
    this.applyHitstop(hitstopMsForImpact(attack.style, hits))
    this.cameras.main.shake(90, shakeIntensityForImpact(attack.style, hits))
    this.spawnStyleSparks(attack, hits)
  }

  private renderCombatJuice(time: number) {
    const tracers = this.bullets.getChildren()
      .map((child) => child as Phaser.Physics.Arcade.Image)
      .filter((bullet) => bullet.active)
      .map((bullet) => ({
        x: bullet.x,
        y: bullet.y,
        prevX: (bullet.getData('prevX') as number) ?? bullet.x,
        prevY: (bullet.getData('prevY') as number) ?? bullet.y,
      }))
    if (this.juiceBurst && juiceProgress(this.juiceBurst.startedAt, time, this.juiceBurst.durationMs) >= 1) {
      this.juiceBurst = undefined
    }
    if (!this.juiceBurst && tracers.length === 0) {
      this.combatEffect.clear()
      return
    }
    drawCombatJuiceFrame(this.combatEffect, this.juiceBurst, time, tracers)
  }

  private captureBulletTrailHeads() {
    this.bullets.children.iterate((child) => {
      const bullet = child as Phaser.Physics.Arcade.Image
      if (bullet.active) bullet.setData('prevX', bullet.x).setData('prevY', bullet.y)
      return true
    })
  }

  private applyHitstop(ms: number) {
    if (ms <= 0) return
    this.hitstopUntilReal = Math.max(this.hitstopUntilReal, performance.now() + ms)
    this.syncHitstop()
  }

  private syncHitstop() {
    const active = performance.now() < this.hitstopUntilReal
    const scale = active ? COMBAT_JUICE.hitstopTimeScale : 1
    this.time.timeScale = scale
    this.physics.world.timeScale = scale
  }

  private clearHitstop() {
    this.hitstopUntilReal = 0
    this.time.timeScale = 1
    this.physics.world.timeScale = 1
  }

  private spawnStyleSparks(attack: PendingPlayerAttack, hits: number) {
    const count = sparkCountForImpact(attack.style, hits)
    const tint = juiceTint(attack.style)
    if (attack.style === 'melee') {
      for (let index = 0; index < count; index += 1) {
        const along = 0.45 + index * 0.1
        const offset = (index - (count - 1) / 2) * 0.12
        this.spawnHitSpark(
          this.player.x + Math.cos(attack.aimAngle + offset) * COMBAT_STYLES.melee.range * along,
          this.player.y + Math.sin(attack.aimAngle + offset) * COMBAT_STYLES.melee.range * along,
          tint,
        )
      }
      return
    }
    if (attack.style === 'magic') {
      this.spawnHitSpark(attack.aimX, attack.aimY, tint)
      this.spawnHitSpark(attack.aimX + 18, attack.aimY - 10, tint)
      return
    }
    this.spawnHitSpark(this.player.x + Math.cos(attack.aimAngle) * 28, this.player.y + Math.sin(attack.aimAngle) * 28, tint)
  }

  private spawnHitSpark(x: number, y: number, tint: number = COMBAT_JUICE.meleeTint) {
    if (this.activeSparkCount >= COMBAT_JUICE.maxActiveSparks) return
    if (!this.cameras.main.worldView.contains(x, y)) return
    this.activeSparkCount += 1
    const spark = this.add.image(x, y, 'fx-hit')
      .setDepth(FX_DEPTH + 0.5)
      .setTint(tint)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.15)
    this.tweens.add({
      targets: spark,
      scale: 2.6,
      alpha: 0,
      duration: COMBAT_JUICE.sparkLifetimeMs,
      onComplete: () => {
        this.activeSparkCount = Math.max(0, this.activeSparkCount - 1)
        spark.destroy()
      },
    })
  }

  private renderCombatHud() {
    if (!this.combatHud || this.combatStyleTexts.length === 0) return
    this.combatHud.clear()
    COMBAT_STYLE_ORDER.forEach((style, index) => {
      const selected = style === this.combatStyle
      const x = 962 + index * 82
      this.combatHud.fillStyle(selected ? 0x264f3e : 0x030907, selected ? 0.96 : 0.78).fillRoundedRect(x, 158, 76, 36, 7)
      this.combatHud.lineStyle(selected ? 2 : 1, selected ? 0xffd36e : 0x6f9180, selected ? 0.95 : 0.4).strokeRoundedRect(x, 158, 76, 36, 7)
      this.combatStyleTexts[index].setColor(selected ? '#fff0b0' : '#9db8aa').setText(`${index + 1} ${COMBAT_STYLES[style].shortName}`)
    })
  }

  private updateExplorationInteractions() {
    for (const event of this.runMap.worldEvents) {
      if (this.triggeredEvents.has(event.id)) continue
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, event.x, event.y) <= EVENT_TRIGGER_RADIUS) {
        this.triggerWorldEvent(event)
        break
      }
    }

    this.activeInteraction = undefined
    let prompt = ''
    const nearbySite = this.runMap.rewardSites
      .map((site) => ({ site, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, site.x, site.y) }))
      .filter(({ distance }) => distance <= INTERACTION_RADIUS)
      .sort((a, b) => a.distance - b.distance)[0]?.site

    if (nearbySite) {
      const state = this.rewardStates.get(nearbySite.id)
      if (state === 'sealed') prompt = `${nearbySite.name} · 精英守卫仍在附近`
      if (state === 'ready') {
        prompt = `按 E 开启 ${nearbySite.name}`
        this.activeInteraction = { kind: 'cache', id: nearbySite.id }
      }
      if (state === 'opened') prompt = `${nearbySite.name} · 已开启`
    }

    const shrine = this.runMap.landmarks.find((landmark) => landmark.id === 'drowned-shrine')!
    if (!this.shrineUsed && Phaser.Math.Distance.Between(this.player.x, this.player.y, shrine.x, shrine.y) <= INTERACTION_RADIUS) {
      prompt = '按 E 触碰沉没祭坛'
      this.activeInteraction = { kind: 'shrine', id: shrine.id }
    }

    const lair = this.runMap.landmarks.find((landmark) => landmark.id === 'sealed-lair')!
    if (!this.bossActive && !this.bossDefeated && Phaser.Math.Distance.Between(this.player.x, this.player.y, lair.x, lair.y) <= 210) {
      const remaining = this.runMap.rewardSites.length - this.collectedSigils.size
      prompt = lairPromptCopy({
        canChallenge: canChallengeBoss(this.collectedSigils, this.evolutionStage, this.runMap.rewardSites),
        lairUnlocked: isLairUnlocked(this.collectedSigils, this.runMap.rewardSites),
        remainingSigils: remaining,
        stage: this.evolutionStage,
        requiredStage: STAGE_THREAT_CONFIG.requiredBossStage,
      })
      if (canChallengeBoss(this.collectedSigils, this.evolutionStage, this.runMap.rewardSites)) {
        this.activeInteraction = { kind: 'lair', id: lair.id }
      }
    }

    this.interactionText.setText(prompt).setVisible(prompt.length > 0)
  }

  private useActiveInteraction() {
    if (!this.activeInteraction) return
    if (this.activeInteraction.kind === 'cache') this.openRewardSite(this.activeInteraction.id)
    if (this.activeInteraction.kind === 'shrine') this.activateShrine()
    if (this.activeInteraction.kind === 'lair') this.startBossFight()
  }

  private openRewardSite(siteId: string) {
    const site = this.runMap.rewardSites.find((candidate) => candidate.id === siteId)
    if (!site || this.rewardStates.get(siteId) !== 'ready') return
    this.rewardStates.set(siteId, 'opened')
    this.collectedSigils.add(site.sigil)
    this.rewardObjects.get(siteId)?.setTexture('cache-opened')
    this.health = Math.min(this.maxHealth, this.health + 25)
    this.addEvolution(35)
    this.flashMessage(`${site.sigilName} · 进化能量 +35`)
    if (canChallengeBoss(this.collectedSigils, this.evolutionStage, this.runMap.rewardSites)) {
      this.time.delayedCall(950, () => this.flashMessage('巢穴已开放 · 现在打Boss，或留下继续猎杀'))
    } else if (isLairUnlocked(this.collectedSigils, this.runMap.rewardSites)) {
      this.time.delayedCall(950, () => this.flashMessage('三印齐聚 · 完成第6次进化后可进巢穴'))
    }
    this.renderHud()
  }

  private activateShrine() {
    if (this.shrineUsed) return
    this.shrineUsed = true
    this.maxHealth += 15
    this.health = Math.min(this.maxHealth, this.health + 45)
    this.flashMessage('沉没祭坛回应 · 生命上限 +15')
    this.renderHud()
  }

  private triggerWorldEvent(event: WorldEventDefinition) {
    this.triggeredEvents.add(event.id)
    this.eventObjects.get(event.id)?.setAlpha(0.18).setTint(0x53665b)
    const outcome = applyEventHazard(selectEventOutcome(this.random), this.evolutionStage)
    if (outcome.health >= 0) {
      this.health = Math.min(this.maxHealth, this.health + outcome.health)
    } else {
      this.health = Math.max(0, this.health + outcome.health)
      this.lastDamageSource = event.name
      this.showFloatingDamage(this.player.x, this.player.y, -outcome.health, '#ff9385')
    }
    if (outcome.genes > 0) this.genes[event.gene] += outcome.genes
    if (outcome.evolution > 0) this.addEvolution(outcome.evolution)
    this.flashMessage(`${event.name} · ${outcome.name}`)
    this.renderHud()
    if (this.health === 0) this.endRun('death')
  }

  private addEvolution(amount: number) {
    const required = evolutionRequirementForStage(this.evolutionStage)
    this.evolution = Math.min(required, this.evolution + amount)
    this.renderHud()
    if (this.evolution >= required && this.pendingEvolutionAt === 0) {
      this.pendingEvolutionAt = this.time.now + EVOLUTION_CONFIG.pendingMs
      this.flashMessage(
        this.evolutionStage >= EVOLUTION_CONFIG.maxStages
          ? '过载生长酝酿中 · 猎场会更险'
          : '身体正在改写 · 继续猎杀仍可扭转',
      )
    }
  }

  private scaledCurrentBossDamage(baseDamage: number) {
    return scaledBossDamage(baseDamage, this.evolutionStage)
  }

  private startBossFight() {
    if (!canChallengeBoss(this.collectedSigils, this.evolutionStage, this.runMap.rewardSites) || this.bossActive || this.bossDefeated) return
    this.bossActive = true
    this.bossMaxHealth = scaledBossHealth(RIFT_WARDEN.maxHealth, this.evolutionStage)
    this.bossHealth = this.bossMaxHealth
    this.bossState = 'recover'
    this.bossStateUntil = this.time.now + 1100
    this.bossTurn = 0
    this.bossPhaseValue = 1
    this.health = this.maxHealth
    this.player.setPosition(this.runMap.bossPosition.x - 550, this.runMap.bossPosition.y).setVelocity(0)
    this.applyCameraProfile()
    this.boss.enableBody(true, this.runMap.bossPosition.x, this.runMap.bossPosition.y, true, true).setScale(1).setAlpha(0).setAngle(-35)
    this.boss.setVelocity(0).clearTint()
    this.tweens.add({ targets: this.boss, alpha: 1, angle: 0, duration: 650, ease: 'Cubic.Out' })
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Image
      if (enemy.active && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.runMap.bossPosition.x, this.runMap.bossPosition.y) < 1050) {
        enemy.disableBody(true, true)
      }
    })
    this.cameras.main.flash(450, 112, 25, 53, false)
    this.flashMessage(
      this.evolutionStage > STAGE_THREAT_CONFIG.requiredBossStage
        ? `${RIFT_WARDEN.name} · 过载苏醒`
        : `${RIFT_WARDEN.name} · 苏醒`,
    )
    this.renderHud()
  }

  private updateBoss(time: number) {
    const nextPhase = bossPhase(this.bossHealth, this.bossMaxHealth)
    if (nextPhase !== this.bossPhaseValue) {
      this.bossPhaseValue = nextPhase
      this.cameras.main.shake(260, 0.009)
      this.cameras.main.flash(240, 255, 91, 55, false)
      this.flashMessage('裂隙暴走 · 第二阶段')
      this.renderHud()
    }

    if (this.bossState === 'recover') {
      this.boss.setVelocity(0)
      if (time >= this.bossStateUntil) this.beginBossTelegraph(time)
      return
    }
    if (this.bossState === 'telegraph' && time >= this.bossStateUntil) {
      this.executeBossPattern(time)
      return
    }
    if (this.bossState === 'attack' && time >= this.bossStateUntil) {
      this.bossState = 'recover'
      this.bossStateUntil = time + RIFT_WARDEN.patterns[this.bossPattern].recoveryMs + bossCooldown(this.bossPhaseValue)
      this.boss.setVelocity(0).clearTint().setScale(1)
      this.bossWarning.clear()
    }
  }

  private beginBossTelegraph(time: number) {
    this.bossPattern = bossPatternForTurn(this.bossTurn, this.bossPhaseValue)
    this.bossTurn += 1
    this.bossState = 'telegraph'
    this.bossAimAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y)
    this.bossStateUntil = time + RIFT_WARDEN.patterns[this.bossPattern].telegraphMs
    this.boss.setVelocity(0).setTintFill(0xffd36e).setScale(1.12)
    this.bossWarning.clear()
    if (this.bossPattern === 'shockwave') {
      this.bossWarning.lineStyle(9, 0xff6f61, 0.9).strokeCircle(this.boss.x, this.boss.y, 250)
      this.bossWarning.lineStyle(3, 0xffd36e, 0.8).strokeCircle(this.boss.x, this.boss.y, 205)
    } else if (this.bossPattern === 'ember-volley') {
      this.bossWarning.lineStyle(7, 0xcf6cff, 0.8)
      for (let offset = -0.42; offset <= 0.42; offset += 0.14) {
        this.bossWarning.lineBetween(
          this.boss.x,
          this.boss.y,
          this.boss.x + Math.cos(this.bossAimAngle + offset) * 620,
          this.boss.y + Math.sin(this.bossAimAngle + offset) * 620,
        )
      }
    } else {
      this.bossWarning.lineStyle(18, 0xff9b55, 0.52).lineBetween(
        this.boss.x,
        this.boss.y,
        this.boss.x + Math.cos(this.bossAimAngle) * 720,
        this.boss.y + Math.sin(this.bossAimAngle) * 720,
      )
    }
  }

  private executeBossPattern(time: number) {
    const pattern = RIFT_WARDEN.patterns[this.bossPattern]
    this.bossState = 'attack'
    this.bossStateUntil = time + pattern.activeMs
    this.boss.clearTint().setScale(1)
    if (this.bossPattern === 'shockwave') {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y) <= 250) {
        const damageDealt = this.applyPlayerDamage(this.scaledCurrentBossDamage(pattern.damage), '裂隙震波', this.boss.x, this.boss.y)
        if (damageDealt > 0) this.autoLockAttacker(this.boss)
      }
      this.bossWarning.clear().fillStyle(0xff624f, 0.3).fillCircle(this.boss.x, this.boss.y, 250)
    } else if (this.bossPattern === 'ember-volley') {
      this.bossWarning.clear()
      const count = this.bossPhaseValue === 1 ? 5 : 7
      for (let index = 0; index < count; index += 1) {
        const spread = (index - (count - 1) / 2) * 0.13
        this.fireBossProjectile(this.bossAimAngle + spread, this.scaledCurrentBossDamage(pattern.damage))
      }
    } else {
      this.bossWarning.clear()
      this.boss.setVelocity(Math.cos(this.bossAimAngle) * 760, Math.sin(this.bossAimAngle) * 760)
    }
  }

  private fireBossProjectile(angle: number, damage: number) {
    const projectile = this.enemyProjectiles.get(this.boss.x, this.boss.y, 'enemy-projectile') as Phaser.Physics.Arcade.Image
    if (!projectile) return
    projectile.enableBody(true, this.boss.x, this.boss.y, true, true)
    projectile.setData('born', this.time.now).setData('damage', damage).setData('source', '余烬弹幕')
      .setData('lineage', null).setData('sourceTargetId', 'rift-warden').setDepth(FX_DEPTH)
    projectile.setScale(1.35).setTint(0xff7a9f)
    projectile.setVelocity(Math.cos(angle) * 390, Math.sin(angle) * 390)
  }

  private hitBoss(firstObject: unknown, secondObject: unknown) {
    const first = firstObject as Phaser.Physics.Arcade.Image
    const second = secondObject as Phaser.Physics.Arcade.Image
    const boss = first.texture.key === 'boss-rift-warden' ? first : second
    const bullet = boss === first ? second : first
    if (!this.bossActive || this.bossDefeated || !bullet.active) return
    bullet.disableBody(true, true)
    this.applyRangedConnectJuice(this.boss.x, this.boss.y)
    this.applyDamageToBoss((bullet.getData('damage') as number) || this.bulletDamage)
  }

  private applyDamageToBoss(damage: number) {
    if (!this.bossActive || this.bossDefeated || !this.boss.active) return
    this.bossHealth = Math.max(0, this.bossHealth - damage)
    this.showFloatingDamage(this.boss.x, this.boss.y, damage, '#ffe39a')
    this.spawnHitSpark(this.boss.x, this.boss.y, juiceTint('magic'))
    this.applyPlayerLifesteal(damage)
    this.boss.setTintFill(0xffffff)
    this.time.delayedCall(55, () => {
      if (!this.boss.active) return
      if (this.bossState === 'telegraph') this.boss.setTintFill(0xffd36e)
      else this.boss.clearTint()
    })
    const nextPhase = bossPhase(this.bossHealth, this.bossMaxHealth)
    if (this.bossHealth > 0 && nextPhase !== this.bossPhaseValue) {
      this.bossPhaseValue = nextPhase
      this.bossState = 'recover'
      this.bossStateUntil = this.time.now + 1000
      this.boss.setVelocity(0).setTintFill(0xff7a4d).setScale(1.18)
      this.bossWarning.clear()
      this.cameras.main.shake(260, 0.009)
      this.cameras.main.flash(240, 255, 91, 55, false)
      this.flashMessage('裂隙暴走 · 第二阶段')
    }
    this.renderBossHud()
    if (this.bossHealth === 0) this.completeBossFight()
  }

  private damagePlayerFromBoss(_: unknown, bossObject: unknown) {
    if (!this.bossActive || this.bossState !== 'attack' || this.bossPattern !== 'rift-charge') return
    const boss = bossObject as Phaser.Physics.Arcade.Image
    const damageDealt = this.applyPlayerDamage(
      this.scaledCurrentBossDamage(RIFT_WARDEN.patterns['rift-charge'].damage),
      '裂隙冲锋',
      boss.x,
      boss.y,
    )
    if (damageDealt > 0) this.autoLockAttacker(boss)
  }

  private endRunFromBossDeath() {
    this.resetPlayerCombatState()
    this.endRun(bossFailureOutcome())
  }

  private completeBossFight() {
    this.resetPlayerCombatState()
    this.bossDefeated = true
    this.bossActive = false
    this.bossState = 'defeated'
    this.boss.disableBody(true, true)
    this.bossWarning.clear()
    this.enemyProjectiles.getChildren().forEach((child) => (child as Phaser.Physics.Arcade.Image).disableBody(true, true))
    this.cameras.main.flash(700, 255, 220, 132, false)
    this.cameras.main.shake(420, 0.012)
    this.player.setVelocity(0)
    this.physics.world.pause()
    this.settleBossSoulOrb()
    this.renderHud()
    this.time.delayedCall(SOUL_ORB_CONFIG.goldSettleDelayMs, () => this.endRun('victory'))
  }

  private spawnEnemy(
    encounterId: string,
    type: MonsterType,
    x: number,
    y: number,
    biome: BiomeId,
    options: EnemySpawnOptions = {},
  ) {
    if (this.enemies.countActive(true) >= 32) return
    const definition = MONSTERS[type]
    const enemy = this.enemies.get(x, y, definition.texture) as Phaser.Physics.Arcade.Image
    enemy.enableBody(true, x, y, true, true)
    const difficulty = difficultyForBiome(biome)
    const threat = threatForEvolutionStage(this.evolutionStage)
    const isGuard = rewardSiteForGuard(encounterId, this.runMap.rewardSites) !== undefined
    const elite = options.elite ?? isEncounterEliteAtStage(
      encounterId,
      this.runSeed,
      this.evolutionStage,
      isGuard,
    )
    const affix = elite
      ? options.affix !== undefined ? options.affix : eliteAffixFor(this.runSeed, encounterId)
      : null
    const healthScale = options.healthScale ?? 1
    const normalScale = options.visualScale ?? (elite ? 1.38 : 1)
    const maxHp = Math.max(1, Math.ceil(scaledEnemyHealth(definition.health, biome, elite, this.evolutionStage) * healthScale))
    const eliteShield = initialEliteShield(affix, maxHp)
    const previousAffixLabel = enemy.getData('affixLabel') as Phaser.GameObjects.Text | undefined
    previousAffixLabel?.destroy()
    enemy.setTexture(definition.texture).setDataEnabled()
    enemy.setOrigin(UNIT_ORIGIN.x, UNIT_ORIGIN.y)
    enemy.setData('type', type).setData('gene', definition.gene).setData('hp', maxHp).setData('maxHp', maxHp)
    enemy.setData('attackKind', definition.attackKind).setData('lastLifeStealAt', 0)
    enemy.setData('talentActivations', 0).setData('lastTalentAt', 0)
    enemy.setData('swarmBuffActive', false)
    enemy.setData('eliteAffix', affix).setData('eliteShield', eliteShield).setData('eliteShieldMax', eliteShield)
    enemy.setData('eliteAffixActivations', 0).setData('lastEliteAffixAt', 0).setData('splitTriggered', false)
    const drop = soulOrbDropFor({
      gene: definition.gene,
      elite,
      fragment: Boolean(options.spawnedFrom),
      eliteAffix: affix,
      biome,
      stage: this.evolutionStage,
    })
    enemy.setData('spawnedFrom', options.spawnedFrom)
      .setData('biomassValue', options.biomassValue ?? drop.biomass)
      .setData('soulOrbTier', drop.tier)
      .setData('baseHealth', definition.health)
      .setData('healthScale', healthScale)
    enemy.setData('encounterId', encounterId).setData('biome', biome).setData('homeX', x).setData('homeY', y)
    enemy.setData('nestDamageScale', encounterId.startsWith(`${MONSTER_NEST_LAB.id}-w`) ? 0.55 : 1)
    enemy.setData('threatLevel', difficulty.threatLevel)
      .setData('stageThreat', threat.healthMultiplier)
      .setData('speedMultiplier', difficulty.speedMultiplier * threat.speedMultiplier)
      .setData('damageMultiplier', difficulty.damageMultiplier * threat.damageMultiplier)
      .setData('cooldownMultiplier', difficulty.cooldownMultiplier * threat.cooldownMultiplier)
      .setData('projectileSpeedMultiplier', difficulty.projectileSpeedMultiplier)
    enemy.setData('elite', elite).setData('normalScale', normalScale)
    enemy.setData('state', 'idle' satisfies EnemyState).setData('stateUntil', 0)
    enemy.setData('nextAction', this.time.now + 700 + this.random() * scaledEnemyCooldown(definition.cooldownMs, biome, this.evolutionStage))
    enemy.setData('aimAngle', 0).setData('facingAngle', this.random() * Math.PI * 2).setDepth(worldDepth(y))
    enemy.setData('flankSign', this.random() < 0.5 ? -1 : 1)
    enemy.setData('regenStartsAt', 0).setData('lastRegenAt', 0)
    const radius = type === 'shellback' ? 21 : type === 'bloodleech' || type === 'riftweaver' ? 19 : 17
    enemy.setCircle(radius, enemy.width / 2 - radius, enemy.height / 2 - radius)
    enemy.setScale(0.2).setAlpha(0)
    if (elite) {
      enemy.setTint(0xffd36e)
      const affixLabel = this.add.text(x, y - 50, `精英 · ${ELITE_AFFIXES[affix!].name}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#fff0b0', fontStyle: 'bold',
        backgroundColor: '#07100dcc', padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setDepth(worldDepth(y, 3))
      enemy.setData('affixLabel', affixLabel)
    } else {
      enemy.setData('affixLabel', undefined)
    }
    this.tweens.add({ targets: enemy, scale: normalScale, alpha: 1, duration: 220, ease: 'Back.Out' })
  }

  private refreshWorldThreat(announce = false) {
    let promoted = 0
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Image
      if (!enemy.active) return
      if (enemy.getData('spawnedFrom')) {
        this.applyStageStatsToEnemy(enemy)
        return
      }
      const encounterId = enemy.getData('encounterId') as string
      const isGuard = rewardSiteForGuard(encounterId, this.runMap.rewardSites) !== undefined
      const shouldElite = isEncounterEliteAtStage(encounterId, this.runSeed, this.evolutionStage, isGuard)
      if (shouldElite && !(enemy.getData('elite') as boolean)) {
        this.promoteEnemyToElite(enemy)
        promoted += 1
      } else {
        this.applyStageStatsToEnemy(enemy)
      }
    })
    if (announce && threatForEvolutionStage(this.evolutionStage).surge) {
      this.time.delayedCall(240, () => this.flashMessage(
        promoted > 0
          ? `猎场变险 · ${promoted} 处猎物长成精英，林地白球变少`
          : '猎场变险 · 林地白球变少，红球仍值得追',
      ))
    }
  }

  private promoteEnemyToElite(enemy: Phaser.Physics.Arcade.Image) {
    const encounterId = enemy.getData('encounterId') as string
    const affix = eliteAffixFor(this.runSeed, encounterId)
    enemy.setData('elite', true)
    enemy.setData('eliteAffix', affix)
    enemy.setData('normalScale', 1.38)
    enemy.setScale(1.38)
    this.applyStageStatsToEnemy(enemy)
    const maxHp = enemy.getData('maxHp') as number
    const eliteShield = initialEliteShield(affix, maxHp)
    enemy.setData('eliteShield', eliteShield).setData('eliteShieldMax', eliteShield)
    enemy.setTint(0xffd36e)
    const previousLabel = enemy.getData('affixLabel') as Phaser.GameObjects.Text | undefined
    previousLabel?.destroy()
    const affixLabel = this.add.text(enemy.x, enemy.y - 50, `精英 · ${ELITE_AFFIXES[affix].name}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#fff0b0', fontStyle: 'bold',
      backgroundColor: '#07100dcc', padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(worldDepth(enemy.y, 3))
    enemy.setData('affixLabel', affixLabel)
  }

  private applyStageStatsToEnemy(enemy: Phaser.Physics.Arcade.Image) {
    const type = enemy.getData('type') as MonsterType
    const biome = enemy.getData('biome') as BiomeId
    const elite = enemy.getData('elite') as boolean
    const definition = MONSTERS[type]
    const difficulty = difficultyForBiome(biome)
    const threat = threatForEvolutionStage(this.evolutionStage)
    const baseHealth = (enemy.getData('baseHealth') as number | undefined) ?? definition.health
    const healthScale = (enemy.getData('healthScale') as number | undefined) ?? 1
    const previousMax = Math.max(1, enemy.getData('maxHp') as number)
    const previousHp = enemy.getData('hp') as number
    const maxHp = Math.max(1, Math.ceil(scaledEnemyHealth(baseHealth, biome, elite, this.evolutionStage) * healthScale))
    const hp = Math.max(1, Math.min(maxHp, Math.ceil(maxHp * (previousHp / previousMax))))
    const drop = soulOrbDropFor({
      gene: definition.gene,
      elite,
      fragment: Boolean(enemy.getData('spawnedFrom')),
      eliteAffix: (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null,
      biome,
      stage: this.evolutionStage,
    })
    enemy.setData('maxHp', maxHp).setData('hp', hp)
    enemy.setData('biomassValue', drop.biomass).setData('soulOrbTier', drop.tier)
    enemy.setData('threatLevel', difficulty.threatLevel)
      .setData('stageThreat', threat.healthMultiplier)
      .setData('speedMultiplier', difficulty.speedMultiplier * threat.speedMultiplier)
      .setData('damageMultiplier', difficulty.damageMultiplier * threat.damageMultiplier)
      .setData('cooldownMultiplier', difficulty.cooldownMultiplier * threat.cooldownMultiplier)
  }

  private updateEnemy(enemy: Phaser.Physics.Arcade.Image, time: number) {
    const type = enemy.getData('type') as MonsterType
    const definition = MONSTERS[type]
    const state = enemy.getData('state') as EnemyState
    const normalScale = enemy.getData('normalScale') as number
    const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)
    const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
    const homeX = enemy.getData('homeX') as number
    const homeY = enemy.getData('homeY') as number
    const homeDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, homeX, homeY)
    const speedMultiplier = enemy.getData('speedMultiplier') as number
    const biome = enemy.getData('biome') as BiomeId
    const hp = enemy.getData('hp') as number
    const maxHp = enemy.getData('maxHp') as number
    const eliteAffix = (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null
    const affixSpeed = eliteSpeedMultiplier(eliteAffix, hp, maxHp)
    const actionCooldown = Math.round(
      scaledEnemyCooldown(definition.cooldownMs, biome, this.evolutionStage) * eliteCooldownMultiplier(eliteAffix, hp, maxHp),
    )
    const nearbySwarmAllies = definition.lineage === 'swarm'
      ? this.enemies.getChildren().filter((child) => {
          const ally = child as Phaser.Physics.Arcade.Image
          if (!ally.active || ally === enemy) return false
          const allyDefinition = MONSTERS[ally.getData('type') as MonsterType]
          return allyDefinition.lineage === 'swarm' && Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y) <= SWARM_LINK_RADIUS
        }).length
      : 0
    const swarmBuffActive = nearbySwarmAllies > 0
    if (swarmBuffActive && !enemy.getData('swarmBuffActive')) this.markTalentActivation(enemy)
    enemy.setData('swarmBuffActive', swarmBuffActive)
    const pursuitSpeed = lineagePursuitSpeed(definition.speed, definition.lineage, nearbySwarmAllies) * speedMultiplier * affixSpeed

    if (state === 'return') {
      if (homeDistance <= 12) {
        enemy.setPosition(homeX, homeY).setVelocity(0)
        enemy.setData('state', 'regenerate' satisfies EnemyState)
        enemy.setData('regenStartsAt', time + definition.regenDelayMs).setData('lastRegenAt', time + definition.regenDelayMs)
        this.restoreEnemyAppearance(enemy)
      } else {
        enemy.setRotation(Phaser.Math.Angle.Between(enemy.x, enemy.y, homeX, homeY))
        this.physics.moveTo(enemy, homeX, homeY, definition.returnSpeed * speedMultiplier * affixSpeed)
      }
      return
    }

    if (state === 'regenerate') {
      enemy.setVelocity(0)
      const facingAngle = enemy.getData('facingAngle') as number
      enemy.setRotation(facingAngle)
      if (canDetectTarget(distance, angleToPlayer, facingAngle, definition)) {
        this.enterAlert(enemy, time, angleToPlayer)
        return
      }
      const regenStartsAt = enemy.getData('regenStartsAt') as number
      if (time < regenStartsAt) return
      const lastRegenAt = enemy.getData('lastRegenAt') as number
      const maxHp = enemy.getData('maxHp') as number
      const hp = regenerateHealth(enemy.getData('hp') as number, maxHp, definition.regenPercentPerSecond, time - lastRegenAt)
      enemy.setData('hp', hp).setData('lastRegenAt', time)
      if (hp >= maxHp) enemy.setData('state', 'idle' satisfies EnemyState)
      return
    }

    if (state === 'idle') {
      enemy.setVelocity(0)
      const facingAngle = enemy.getData('facingAngle') as number
      enemy.setRotation(facingAngle)
      if (canDetectTarget(distance, angleToPlayer, facingAngle, definition)) this.enterAlert(enemy, time, angleToPlayer)
      return
    }

    if (state === 'alert') {
      enemy.setVelocity(0).setRotation(angleToPlayer)
      if (shouldDisengage(homeDistance, distance, definition)) {
        this.enterReturn(enemy)
      } else if (time >= enemy.getData('stateUntil')) {
        enemy.setData('state', 'pursue' satisfies EnemyState)
        enemy.setData('nextAction', time + Math.min(300, actionCooldown * 0.25))
        this.restoreEnemyAppearance(enemy)
      }
      return
    }

    if (shouldDisengage(homeDistance, distance, definition)) {
      this.enterReturn(enemy)
      return
    }

    enemy.setRotation(angleToPlayer)

    if (state === 'telegraph' && time >= enemy.getData('stateUntil')) {
      if (definition.attackKind === 'pounce' || definition.attackKind === 'dash' || definition.attackKind === 'drain') {
        enemy.setData('state', 'attack' satisfies EnemyState)
        enemy.setData('stateUntil', time + definition.activeMs)
        const aimAngle = enemy.getData('aimAngle') as number
        enemy.clearTint().setScale(normalScale)
        const dashSpeed = definition.dashSpeed ?? 540
        enemy.setVelocity(
          Math.cos(aimAngle) * dashSpeed * speedMultiplier * affixSpeed,
          Math.sin(aimAngle) * dashSpeed * speedMultiplier * affixSpeed,
        )
      } else if (definition.attackKind === 'projectile' || definition.attackKind === 'spread') {
        this.fireEnemyProjectile(enemy, enemy.getData('aimAngle') as number)
        this.enterRecovery(enemy, time, definition)
      } else {
        enemy.setData('state', 'brace' satisfies EnemyState)
        enemy.setData('stateUntil', time + definition.activeMs)
        enemy.setTintFill(0x8fc8ff).setScale(normalScale * 1.12)
      }
      return
    }

    if ((state === 'attack' || state === 'brace') && time >= enemy.getData('stateUntil')) {
      this.enterRecovery(enemy, time, definition)
      return
    }

    if (state === 'recover') {
      enemy.setVelocity(0)
      if (time >= enemy.getData('stateUntil')) {
        enemy.setData('state', 'pursue' satisfies EnemyState)
        enemy.setData('nextAction', time + actionCooldown)
      }
      return
    }

    if (state === 'telegraph' || state === 'brace') {
      enemy.setVelocity(0)
      return
    }

    if (state === 'attack') return

    if (time >= enemy.getData('nextAction') && distance <= definition.preferredMaxRange) {
      enemy.setData('state', 'telegraph' satisfies EnemyState)
      enemy.setData('stateUntil', time + definition.telegraphMs)
      const flankSign = enemy.getData('flankSign') as number
      const aimAngle = definition.attackKind === 'dash' ? angleToPlayer + flankSign * 0.2 : angleToPlayer
      enemy.setData('aimAngle', aimAngle)
      if (definition.attackKind === 'dash') enemy.setData('flankSign', -flankSign)
      enemy.setVelocity(0).setTintFill(0xffdc73).setScale(normalScale * 1.16)
      return
    }

    if (definition.attackKind === 'projectile' || definition.attackKind === 'spread') {
      if (distance > definition.preferredMaxRange) {
        this.physics.moveToObject(enemy, this.player, pursuitSpeed)
      } else if (distance < definition.preferredMinRange) {
        enemy.setVelocity(
          -Math.cos(angleToPlayer) * pursuitSpeed,
          -Math.sin(angleToPlayer) * pursuitSpeed,
        )
      } else {
        enemy.setVelocity(0)
      }
    } else {
      this.physics.moveToObject(enemy, this.player, pursuitSpeed)
    }
  }

  private enterAlert(enemy: Phaser.Physics.Arcade.Image, time: number, angleToPlayer: number) {
    const definition = MONSTERS[enemy.getData('type') as MonsterType]
    enemy.setData('state', 'alert' satisfies EnemyState)
    enemy.setData('stateUntil', time + definition.alertMs)
    enemy.setData('aimAngle', angleToPlayer)
    enemy.setVelocity(0).setRotation(angleToPlayer).setTintFill(0xffb44f)
    enemy.setScale((enemy.getData('normalScale') as number) * 1.1)
  }

  private enterReturn(enemy: Phaser.Physics.Arcade.Image) {
    enemy.setData('state', 'return' satisfies EnemyState)
    enemy.setVelocity(0)
    this.restoreEnemyAppearance(enemy)
  }

  private restoreEnemyAppearance(enemy: Phaser.Physics.Arcade.Image) {
    enemy.clearTint().setScale(enemy.getData('normalScale') as number)
    if (enemy.getData('elite') as boolean) enemy.setTint(0xffd36e)
  }

  private enterRecovery(enemy: Phaser.Physics.Arcade.Image, time: number, definition: (typeof MONSTERS)[MonsterType]) {
    enemy.setData('state', 'recover' satisfies EnemyState)
    const recoveryMs = lineageRecoveryMs(definition.recoveryMs, definition.lineage)
    enemy.setData('stateUntil', time + recoveryMs)
    if (definition.lineage === 'wing') this.markTalentActivation(enemy)
    enemy.setVelocity(0)
    this.restoreEnemyAppearance(enemy)
  }

  private markTalentActivation(enemy: Phaser.Physics.Arcade.Image) {
    enemy.setData('talentActivations', (enemy.getData('talentActivations') as number) + 1)
    enemy.setData('lastTalentAt', this.time.now)
  }

  private markEliteAffixActivation(enemy: Phaser.Physics.Arcade.Image) {
    enemy.setData('eliteAffixActivations', (enemy.getData('eliteAffixActivations') as number) + 1)
    enemy.setData('lastEliteAffixAt', this.time.now)
  }

  private spawnBroodFragments(enemy: Phaser.Physics.Arcade.Image) {
    const encounterId = enemy.getData('encounterId') as string
    const type = enemy.getData('type') as MonsterType
    const biome = enemy.getData('biome') as BiomeId
    const perpendicular = enemy.rotation + Math.PI / 2
    for (const [index, direction] of [-1, 1].entries()) {
      const offset = direction * 48
      this.spawnEnemy(
        `${encounterId}-brood-${index + 1}`,
        type,
        Phaser.Math.Clamp(enemy.x + Math.cos(perpendicular) * offset, 40, WORLD_WIDTH - 40),
        Phaser.Math.Clamp(enemy.y + Math.sin(perpendicular) * offset, 40, WORLD_HEIGHT - 40),
        biome,
        {
          elite: false,
          affix: null,
          healthScale: 0.7,
          visualScale: 0.72,
          spawnedFrom: encounterId,
        },
      )
    }
    this.flashMessage('分裂精英 · 产生两只弱化分体')
  }

  private applyEliteSiphon(enemy: Phaser.Physics.Arcade.Image | undefined, damageDealt: number) {
    if (!enemy?.active || damageDealt <= 0) return
    const eliteAffix = (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null
    const previousHp = enemy.getData('hp') as number
    const healedHp = siphonHealth(eliteAffix, previousHp, enemy.getData('maxHp') as number, damageDealt)
    if (healedHp <= previousHp) return
    enemy.setData('hp', healedHp).setData('lastLifeStealAt', this.time.now).setTintFill(0xff6688)
    this.markEliteAffixActivation(enemy)
    this.showFloatingDamage(enemy.x, enemy.y, healedHp - previousHp, '#ff91ac', ' 吸血')
    this.time.delayedCall(110, () => {
      if (enemy.active) this.restoreEnemyAppearance(enemy)
    })
  }

  private scheduleToxicBurst(x: number, y: number) {
    const graphics = this.add.graphics().setDepth(FX_DEPTH)
    this.toxicBursts.push({
      id: this.nextToxicBurstId++,
      x,
      y,
      radius: TOXIC_BURST_RADIUS,
      damage: TOXIC_BURST_DAMAGE,
      detonatesAt: this.time.now + TOXIC_BURST_TELEGRAPH_MS,
      graphics,
    })
    this.flashMessage('毒爆预警 · 立刻离开绿色范围')
  }

  private updateToxicBursts(time: number) {
    this.toxicBursts = this.toxicBursts.filter((burst) => {
      const remaining = burst.detonatesAt - time
      burst.graphics.clear()
      if (remaining <= 0) {
        burst.graphics.fillStyle(0x9ff56b, 0.28).fillCircle(burst.x, burst.y, burst.radius)
        if (toxicBurstHits(Phaser.Math.Distance.Between(this.player.x, this.player.y, burst.x, burst.y), burst.radius)) {
          this.applyPlayerDamage(burst.damage, '精英毒爆', burst.x, burst.y)
        }
        burst.graphics.destroy()
        return false
      }
      const progress = 1 - remaining / TOXIC_BURST_TELEGRAPH_MS
      const pulseRadius = burst.radius * (0.82 + progress * 0.18)
      burst.graphics.fillStyle(0x8fe85f, 0.08 + progress * 0.12).fillCircle(burst.x, burst.y, pulseRadius)
      burst.graphics.lineStyle(4 + progress * 3, 0xb7ff7d, 0.55 + progress * 0.35).strokeCircle(burst.x, burst.y, pulseRadius)
      burst.graphics.lineStyle(2, 0x274f2c, 0.9).strokeCircle(burst.x, burst.y, burst.radius * Math.max(0.2, 1 - progress))
      return true
    })
  }

  private fireEnemyProjectile(enemy: Phaser.Physics.Arcade.Image, angle: number) {
    const definition = MONSTERS[enemy.getData('type') as MonsterType]
    const biome = enemy.getData('biome') as BiomeId
    const eliteAffix = (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null
    const hp = enemy.getData('hp') as number
    const maxHp = enemy.getData('maxHp') as number
    const speed = (definition.projectileSpeed ?? 250) * (enemy.getData('projectileSpeedMultiplier') as number)
    const source = definition.attackKind === 'spread' ? '裂隙弹幕' : '电脉弹'
    const projectileCount = lineageProjectileCount(definition.projectileCount ?? 1, definition.lineage)
    if (definition.lineage === 'rift') this.markTalentActivation(enemy)
    for (const projectileAngle of projectileAngles(angle, projectileCount, definition.projectileSpreadRadians)) {
      const projectile = this.enemyProjectiles.get(enemy.x, enemy.y, 'enemy-projectile') as Phaser.Physics.Arcade.Image
      if (!projectile) continue
      projectile.enableBody(true, enemy.x, enemy.y, true, true)
      projectile.setTexture('enemy-projectile').setData('born', this.time.now)
        .setData('damage', Math.max(1, Math.round(
          scaledEnemyDamage(definition.projectileDamage ?? 10, biome, this.evolutionStage)
            * eliteDamageMultiplier(eliteAffix, hp, maxHp)
            * ((enemy.getData('nestDamageScale') as number) || 1),
        )))
        .setData('source', source)
        .setData('lineage', definition.lineage)
        .setData('eliteAffix', eliteAffix)
        .setData('sourceTargetId', enemy.getData('encounterId') as string)
        .setDepth(FX_DEPTH)
      projectile.setScale(definition.attackKind === 'spread' ? 1.15 : 1).clearTint()
      if (definition.attackKind === 'spread') projectile.setTint(0xffa35c)
      projectile.setVelocity(Math.cos(projectileAngle) * speed, Math.sin(projectileAngle) * speed)
    }
  }

  private hitEnemy(bulletObject: unknown, enemyObject: unknown) {
    const first = bulletObject as Phaser.Physics.Arcade.Image
    const second = enemyObject as Phaser.Physics.Arcade.Image
    const bullet = first.texture.key === 'bullet' ? first : second
    const enemy = bullet === first ? second : first
    if (!bullet.active || !enemy.active) return
    bullet.disableBody(true, true)
    this.applyRangedConnectJuice(enemy.x, enemy.y)
    this.applyDamageToEnemy(enemy, (bullet.getData('damage') as number) || this.bulletDamage)
  }

  private applyRangedConnectJuice(x: number, y: number) {
    this.applyHitstop(COMBAT_JUICE.hitstopRangedConnectMs)
    this.cameras.main.shake(70, COMBAT_JUICE.connectShake)
    for (let index = 0; index < COMBAT_JUICE.sparkCountRangedConnect; index += 1) {
      this.spawnHitSpark(x + (index - 1.5) * 8, y + (index % 2 === 0 ? -6 : 6), juiceTint('ranged'))
    }
  }

  private applyDamageToEnemy(enemy: Phaser.Physics.Arcade.Image, incomingDamage: number) {
    if (!enemy.active) return
    const definition = MONSTERS[enemy.getData('type') as MonsterType]
    const isBraced = definition.attackKind === 'brace' && enemy.getData('state') === 'brace'
    const previousHp = enemy.getData('hp') as number
    const maxHp = enemy.getData('maxHp') as number
    const eliteAffix = (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null
    const lineageDamage = lineageIncomingDamage(incomingDamage, definition.lineage, isBraced)
    if (definition.lineage === 'carapace' && incomingDamage > lineageDamage) this.markTalentActivation(enemy)
    const shieldResult = absorbEliteShield(lineageDamage, enemy.getData('eliteShield') as number)
    const damage = shieldResult.remainingDamage
    const hp = previousHp - damage
    enemy.setData('eliteShield', shieldResult.remainingShield)
    enemy.setData('hp', hp)
    if (shieldResult.absorbed > 0) {
      this.markEliteAffixActivation(enemy)
      this.showFloatingDamage(enemy.x, enemy.y, shieldResult.absorbed, '#8fddff', ' 护盾')
    }
    if (damage > 0) {
      this.showFloatingDamage(
        enemy.x,
        enemy.y,
        damage,
        definition.lineage === 'carapace' ? '#a8ddff' : '#fff1ad',
        definition.lineage === 'carapace' && incomingDamage > lineageDamage ? ' 护甲' : '',
      )
      this.applyPlayerLifesteal(damage)
      this.spawnHitSpark(enemy.x, enemy.y, juiceTint(this.combatStyle))
    }
    if (!isBerserkerActive(eliteAffix, previousHp, maxHp) && isBerserkerActive(eliteAffix, hp, maxHp)) {
      this.markEliteAffixActivation(enemy)
    }
    if (shouldTriggerBrood(
      eliteAffix,
      previousHp,
      hp,
      maxHp,
      enemy.getData('splitTriggered') as boolean,
    )) {
      enemy.setData('splitTriggered', true)
      this.markEliteAffixActivation(enemy)
      this.spawnBroodFragments(enemy)
    }
    if (hp > 0 && enemy.getData('state') !== 'alert') {
      this.enterAlert(enemy, this.time.now, Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y))
    }
    enemy.setTintFill(isBraced ? 0x8fc8ff : 0xffffff)
    this.time.delayedCall(55, () => {
      if (!enemy.active) return
      const state = enemy.getData('state') as EnemyState
      if (state === 'alert') enemy.setTintFill(0xffb44f)
      else if (state === 'telegraph') enemy.setTintFill(0xffdc73)
      else if (state === 'brace') enemy.setTintFill(0x8fc8ff)
      else this.restoreEnemyAppearance(enemy)
    })
    const normalScale = enemy.getData('normalScale') as number
    this.tweens.add({ targets: enemy, scale: normalScale * (isBraced ? 1.12 : 1.18), duration: 45, yoyo: true })
    if (hp <= 0) {
      if (this.selectedTarget === enemy) this.selectedTarget = undefined
      this.kills += 1
      const type = enemy.getData('type') as MonsterType
      const isNewSpecies = (this.bestiaryState.kills[type] ?? 0) === 0
      this.bestiaryState = recordMonsterKill(this.bestiaryState, type)
      saveBestiary(window.localStorage, this.bestiaryState)
      const gene = enemy.getData('gene') as GeneFamily
      if (this.killHeal > 0) this.health = Math.min(this.maxHealth, this.health + this.killHeal)
      const drop = soulOrbDropFor({
        gene,
        elite: enemy.getData('elite') as boolean,
        fragment: Boolean(enemy.getData('spawnedFrom')),
        eliteAffix,
        biome: enemy.getData('biome') as BiomeId,
        stage: this.evolutionStage,
      })
      if (drop.biomass > 0) this.spawnSoulOrbDrop(enemy.x, enemy.y, drop)
      if (eliteAffix === 'volatile') this.scheduleToxicBurst(enemy.x, enemy.y)
      const affixLabel = enemy.getData('affixLabel') as Phaser.GameObjects.Text | undefined
      affixLabel?.destroy()
      enemy.disableBody(true, true)
      const guardedSite = rewardSiteForGuard(enemy.getData('encounterId') as string, this.runMap.rewardSites)
      if (guardedSite && this.rewardStates.get(guardedSite.id) === 'sealed') {
        this.rewardStates.set(guardedSite.id, 'ready')
        this.rewardObjects.get(guardedSite.id)?.setTexture('cache-ready')
        this.flashMessage(`精英已击败 · ${guardedSite.name}解除封锁`)
      }
      if (isNewSpecies) this.time.delayedCall(320, () => this.flashMessage(`图鉴解锁 · ${MONSTERS[type].name}`))
      this.cameras.main.shake(55, 0.0018)
      this.renderHud()
    }
  }

  private damagePlayer(_: unknown, enemyObject: unknown) {
    if (this.time.now < this.invulnerableUntil || this.time.now - this.lastDamage < 600) return
    const enemy = enemyObject as Phaser.Physics.Arcade.Image
    const type = enemy.getData('type') as MonsterType
    const state = enemy.getData('state') as EnemyState
    const definition = MONSTERS[type]
    if (!canDealContactDamage(definition.attackKind, state)) return
    const biome = enemy.getData('biome') as BiomeId
    const baseDamage = scaledEnemyDamage(definition.contactDamage, biome, this.evolutionStage)
      * ((enemy.getData('nestDamageScale') as number) || 1)
    const eliteAffix = (enemy.getData('eliteAffix') as EliteAffixId | null) ?? null
    const affixDamage = Math.max(1, Math.round(
      baseDamage * eliteDamageMultiplier(eliteAffix, enemy.getData('hp') as number, enemy.getData('maxHp') as number),
    ))
    const outgoingDamage = lineageOutgoingDamage(affixDamage, definition.lineage, this.health / this.maxHealth)
    if (definition.lineage === 'fang' && outgoingDamage > affixDamage) this.markTalentActivation(enemy)
    const damageDealt = this.applyPlayerDamage(outgoingDamage, definition.name, enemy.x, enemy.y)
    if (damageDealt > 0) this.autoLockAttacker(enemy)
    const retaliation = this.contactRetaliationDamage + this.currentBuffModifiers().contactRetaliation
    if (damageDealt > 0 && retaliation > 0) {
      this.applyDamageToEnemy(enemy, retaliation)
    }
    this.applyEliteSiphon(enemy, damageDealt)
    if (damageDealt > 0 && definition.lineage === 'venom') {
      this.applyVenom(enemy)
    }
    if (damageDealt > 0 && definition.attackKind === 'drain') {
      const healed = lifeStealHealth(
        enemy.getData('hp') as number,
        enemy.getData('maxHp') as number,
        definition.lifeStealPercent,
      )
      enemy.setData('hp', healed).setData('lastLifeStealAt', this.time.now).setTintFill(0xff6688)
      this.time.delayedCall(100, () => {
        if (enemy.active) this.restoreEnemyAppearance(enemy)
      })
    }
  }

  private damagePlayerFromProjectile(_: unknown, projectileObject: unknown) {
    const projectile = projectileObject as Phaser.Physics.Arcade.Image
    if (!projectile.active || this.time.now < this.invulnerableUntil || this.time.now - this.lastDamage < 600) return
    projectile.disableBody(true, true)
    const sourceTarget = this.resolveDamageSourceTarget(projectile.getData('sourceTargetId') as string | undefined)
    const damageDealt = this.applyPlayerDamage(
      projectile.getData('damage') as number,
      (projectile.getData('source') as string) || '电脉弹',
      projectile.x,
      projectile.y,
    )
    if (damageDealt > 0) this.autoLockAttacker(sourceTarget)
    if (sourceTarget !== this.boss) this.applyEliteSiphon(sourceTarget, damageDealt)
    if (damageDealt > 0 && projectile.getData('lineage') === 'venom') {
      this.applyVenom(sourceTarget === this.boss ? undefined : sourceTarget)
    }
  }

  private resolveDamageSourceTarget(sourceTargetId?: string) {
    if (sourceTargetId === 'rift-warden') return this.bossActive && this.boss.active ? this.boss : undefined
    if (!sourceTargetId) return undefined
    return this.enemies.getChildren().find((child) => {
      const enemy = child as Phaser.Physics.Arcade.Image
      return enemy.active && enemy.getData('encounterId') === sourceTargetId
    }) as Phaser.Physics.Arcade.Image | undefined
  }

  private autoLockAttacker(attacker?: Phaser.Physics.Arcade.Image) {
    if (!attacker?.active || !this.isTargetVisible(attacker)) return
    const attackerId = this.getTargetId(attacker)
    if (!attackerId) return
    const hasVisibleLock = this.isTargetVisible(this.selectedTarget)
    const lockIsAttacker = this.selectedTarget === attacker
    if (!shouldAutoLockAttacker(hasVisibleLock, lockIsAttacker)) return
    const changed = this.selectedTarget !== attacker
    this.selectedTarget = attacker
    this.lastAutoLockAt = this.time.now
    this.lastAutoLockedId = attackerId
    if (changed) this.flashMessage(`反击锁定 · ${this.getTargetName(attacker)}`)
  }

  private applyVenom(sourceEnemy?: Phaser.Physics.Arcade.Image) {
    this.poisonedUntil = Math.max(this.poisonedUntil, this.time.now + VENOM_DURATION_MS)
    this.nextPoisonTick = Math.max(this.nextPoisonTick, this.time.now + VENOM_TICK_MS)
    if (sourceEnemy?.active) this.markTalentActivation(sourceEnemy)
    this.renderHud()
  }

  private updatePoison(time: number) {
    if (time >= this.poisonedUntil) {
      if (this.poisonedUntil > 0) {
        this.poisonedUntil = 0
        this.nextPoisonTick = 0
        this.renderHud()
      }
      return
    }
    if (time < this.nextPoisonTick) return
    this.nextPoisonTick = time + VENOM_TICK_MS
    this.poisonTicksTaken += 1
    this.lastDamageSource = '毒腺侵蚀'
    const poisonDamage = mitigateDamage(VENOM_TICK_DAMAGE, this.defenseReduction + this.currentBuffModifiers().defenseBonus)
    this.health = Math.max(0, this.health - poisonDamage)
    this.showFloatingDamage(this.player.x, this.player.y, poisonDamage, '#a8ff73', ' 毒')
    this.player.setTintFill(0x9af06f)
    this.time.delayedCall(90, () => this.player.clearTint())
    this.renderHud()
    if (this.health === 0) {
      this.resetPlayerCombatState()
      if (this.bossActive) {
        this.endRunFromBossDeath()
        return
      }
      this.endRun('death')
    }
  }

  private applyPlayerDamage(damage: number, source: string, sourceX: number, sourceY: number) {
    if (this.time.now < this.invulnerableUntil || this.time.now - this.lastDamage < 600) return 0
    this.lastDamage = this.time.now
    this.lastDamageSource = source
    const mitigatedDamage = mitigateDamage(damage, this.defenseReduction + this.currentBuffModifiers().defenseBonus)
    this.health = Math.max(0, this.health - mitigatedDamage)
    this.showFloatingDamage(this.player.x, this.player.y, mitigatedDamage, '#ff9385')
    this.movementState = 'hitstun'
    this.movementStateUntil = this.time.now + HIT_STUN_MS
    this.lastHitStunAt = this.time.now
    this.pendingAttack = undefined
    this.bufferedAttack = undefined
    this.combatTelegraph.clear()
    const knockback = new Phaser.Math.Vector2(this.player.x - sourceX, this.player.y - sourceY).normalize().scale(340)
    ;(this.player.body as Phaser.Physics.Arcade.Body).setMaxSpeed(340)
    this.player.setAlpha(0).setVelocity(knockback.x, knockback.y).setTintFill(0xffd5ce)
    this.time.delayedCall(110, () => {
      if (this.movementState === 'hitstun') this.player.clearTint()
    })
    this.cameras.main.shake(100, 0.007)
    this.renderHud()
    if (this.health === 0) {
      this.resetPlayerCombatState()
      if (this.bossActive) {
        this.endRunFromBossDeath()
        return mitigatedDamage
      }
      this.endRun('death')
    }
    return mitigatedDamage
  }

  private resetPlayerCombatState() {
    this.pendingAttack = undefined
    this.bufferedAttack = undefined
    this.recoverUntil = 0
    this.movementState = 'normal'
    this.movementStateUntil = 0
    this.poisonedUntil = 0
    this.nextPoisonTick = 0
    this.syncPlayerSpeedCap()
    this.player.setAlpha(0).clearTint()
    this.juiceBurst = undefined
    this.clearHitstop()
    this.combatTelegraph?.clear()
    this.combatEffect?.clear()
  }

  private collectBiomass(_: unknown, biomassObject: unknown) {
    const dropSprite = biomassObject as Phaser.Physics.Arcade.Image
    const drop = this.soulOrbDropFromSprite(dropSprite)
    dropSprite.disableBody(true, true)
    this.applyCollectedSoulOrb(drop)
  }

  private spawnSoulOrbDrop(x: number, y: number, drop: SoulOrbDrop) {
    const orb = this.biomass.get(x, y, drop.texture) as Phaser.Physics.Arcade.Image
    if (!orb) return undefined
    orb.setTexture(drop.texture)
    orb.enableBody(true, x, y, true, true).setDepth(worldDepth(y, -0.2))
    orb.setData('value', drop.biomass)
      .setData('tier', drop.tier)
      .setData('gene', drop.gene)
      .setData('eliteAffix', drop.eliteAffix)
      .setData('displayScale', drop.displayScale)
    orb.setScale(0.2)
    this.tweens.add({
      targets: orb,
      scale: { from: 0.2, to: drop.displayScale },
      angle: 180,
      duration: 260,
      ease: 'Back.Out',
    })
    return orb
  }

  private soulOrbDropFromSprite(sprite: Phaser.Physics.Arcade.Image): SoulOrbDrop {
    const tier = ((sprite.getData('tier') as SoulOrbTier | undefined) ?? 'common')
    const config = soulOrbTierConfig(tier)
    return {
      tier,
      biomass: (sprite.getData('value') as number) || config.biomass,
      gene: (sprite.getData('gene') as GeneFamily | undefined) ?? 'fang',
      eliteAffix: (sprite.getData('eliteAffix') as EliteAffixId | null) ?? null,
      texture: sprite.texture.key || config.visual.texture,
      displayScale: (sprite.getData('displayScale') as number) || config.visual.displayScale,
      color: config.visual.fill,
    }
  }

  private applyCollectedSoulOrb(drop: SoulOrbDrop) {
    const result = collectSoulOrb({
      genes: this.genes,
      recentHunts: this.recentHunts,
      biomassGainMultiplier: this.biomassGainMultiplier,
      now: this.time.now,
      activeBuff: this.eliteOrbBuff,
      consumedGoldOrb: this.consumedGoldOrb,
    }, drop)
    this.genes = result.genes
    this.recentHunts = result.recentHunts
    this.eliteOrbBuff = result.buff
    this.consumedGoldOrb = result.consumedGoldOrb
    if (result.goldOrbSummary) this.goldOrbSummary = result.goldOrbSummary
    this.collectedOrbCounts[drop.tier] += 1
    this.lastOrbMessage = result.message
    this.lastConsumeAt = this.time.now
    this.addEvolution(result.biomassGranted)
    this.syncPlayerBodyScale()
    this.syncPlayerSpeedCap()
    this.flashMessage(result.message)
    this.tweens.add({ targets: this.player, alpha: 0.72, duration: 90, yoyo: true, ease: 'Sine.Out' })
  }

  private settleBossSoulOrb() {
    if (this.pendingEvolutionAt > 0) this.commitHuntEvolution()
    const drop = bossSoulOrbDrop(dominantGene(this.genes, this.recentHunts) ?? 'rift')
    const orb = this.spawnSoulOrbDrop(this.boss.x, this.boss.y, drop)
    this.applyCollectedSoulOrb(drop)
    orb?.disableBody(true, false)
    const required = evolutionRequirementForStage(this.evolutionStage)
    if (this.evolution >= required) {
      this.pendingEvolutionAt = this.time.now
      this.commitHuntEvolution()
    }
  }

  private applyPlayerLifesteal(damageDealt: number) {
    const ratio = this.currentBuffModifiers().lifestealRatio
    if (ratio <= 0 || damageDealt <= 0) return
    const healed = Math.max(1, Math.round(damageDealt * ratio))
    const nextHealth = Math.min(this.maxHealth, this.health + healed)
    const gained = nextHealth - this.health
    if (gained <= 0) return
    this.health = nextHealth
    this.showFloatingDamage(this.player.x, this.player.y, gained, '#ff91ac', ' 吸血')
    this.renderHud()
  }

  private mutationStats(): MutationStatState {
    return {
      bulletDamage: this.bulletDamage,
      meleeDamageBonus: this.combatDamageBonuses.melee,
      rangedDamageBonus: this.combatDamageBonuses.ranged,
      magicDamageBonus: this.combatDamageBonuses.magic,
      playerSpeed: this.playerSpeed,
      dodgeCooldownMultiplier: this.dodgeCooldownMultiplier,
      maxHealth: this.maxHealth,
      health: this.health,
      defenseReduction: this.defenseReduction,
      biomassGainMultiplier: this.biomassGainMultiplier,
      killHeal: this.killHeal,
      contactRetaliationDamage: this.contactRetaliationDamage,
      shotCooldown: this.shotCooldown,
      magicRadius: this.magicRadius,
    }
  }

  private writeMutationStats(state: MutationStatState) {
    this.bulletDamage = state.bulletDamage
    this.combatDamageBonuses = {
      melee: state.meleeDamageBonus,
      ranged: state.rangedDamageBonus,
      magic: state.magicDamageBonus,
    }
    this.playerSpeed = state.playerSpeed
    this.dodgeCooldownMultiplier = state.dodgeCooldownMultiplier
    this.maxHealth = state.maxHealth
    this.health = state.health
    this.defenseReduction = state.defenseReduction
    this.biomassGainMultiplier = state.biomassGainMultiplier
    this.killHeal = state.killHeal
    this.contactRetaliationDamage = state.contactRetaliationDamage
    this.shotCooldown = state.shotCooldown
    this.magicRadius = state.magicRadius
    this.syncPlayerSpeedCap()
  }

  private syncPlayerBodyScale() {
    const visual = evolutionScaleForStage(this.evolutionStage)
    const collision = evolutionCollisionScale(visual)
    this.player.setScale(visual)
    const radius = Math.round(EVOLUTION_CONFIG.baseCollisionRadius * collision)
    this.player.setCircle(radius, this.player.width / 2 - radius, this.player.height / 2 - radius)
  }

  private commitHuntEvolution() {
    if (this.pendingEvolutionAt === 0) return
    const resolved = resolveHuntEvolution(
      MUTATIONS,
      this.genes,
      this.mutationRanks,
      this.recentHunts,
      this.random,
      this.recentAppliedFamilies,
    )
    this.pendingEvolutionAt = 0
    if (!resolved) {
      if (this.evolutionStage >= EVOLUTION_CONFIG.maxStages) {
        this.evolutionStage += 1
        this.evolution = 0
        this.flashMessage('过载生长 · 猎场威胁上升')
        this.refreshWorldThreat(true)
      } else {
        this.evolution = 0
      }
      this.renderHud()
      return
    }

    this.mutationRanks[resolved.mutation.id] = (this.mutationRanks[resolved.mutation.id] ?? 0) + 1
    this.writeMutationStats(applyMutationEffect(this.mutationStats(), resolved.mutation.effect))
    this.evolutionStage += 1
    this.evolution = 0
    this.recentAppliedFamilies = [...this.recentAppliedFamilies, resolved.family].slice(-4)
    this.evolutionChain.push({
      stage: this.evolutionStage,
      mutationId: resolved.mutation.id,
      family: resolved.family,
      name: resolved.mutation.name,
      kind: resolved.kind,
      reason: resolved.reason,
      comboName: resolved.comboName,
      kills: this.kills,
    })
    this.invulnerableUntil = this.time.now + 900
    this.evolutionBurstUntil = this.time.now + 1100
    this.syncPlayerBodyScale()
    const form = currentFormName(this.mutationRanks, this.genes, this.recentHunts)
    this.flashMessage(`${resolved.mutation.name} · ${form}`)
    this.cameras.main.flash(160, 121, 242, 161, false)
    this.refreshWorldThreat(this.evolutionStage >= STAGE_THREAT_CONFIG.surgeFromStage)
    if (this.evolutionStage === EVOLUTION_CONFIG.maxStages) {
      this.time.delayedCall(700, () => this.flashMessage('可立刻进巢穴打Boss，也可留下继续猎杀'))
    } else if (this.evolutionStage > EVOLUTION_CONFIG.maxStages) {
      this.time.delayedCall(700, () => this.flashMessage('过载猎杀 · 林地白球更穷，红球仍值得追'))
    }
    this.renderHud()
  }

  private resistPendingEvolution() {
    if (this.pendingEvolutionAt === 0 || this.resistCharges <= 0 || this.runOver) return
    const required = evolutionRequirementForStage(this.evolutionStage)
    this.resistCharges -= 1
    this.pendingEvolutionAt = 0
    this.evolution = resistEvolutionProgress(this.evolution, required)
    this.flashMessage('生长被压下 · 继续猎杀以改写倾向')
    this.renderHud()
  }

  private handleVisibilityChange = () => {
    if (this.runOver) return
    if (document.hidden) {
      this.player.setVelocity(0)
      this.physics.world.pause()
      this.time.paused = true
      return
    }
    if (!this.isBestiaryOpen) {
      this.time.paused = false
      this.physics.world.resume()
    }
  }

  private endRun(outcome: 'victory' | 'death') {
    if (this.runOver) return
    this.runOver = true
    this.pendingEvolutionAt = 0
    this.player.setVelocity(0)
    this.renderPlayerEvolutionAppearance(this.time.now)
    this.physics.world.pause()
    this.time.paused = true
    const formName = currentFormName(this.mutationRanks, this.genes, this.recentHunts)
    const mutations = this.evolutionChain.map((entry) => (
      `${entry.stage}. ${entry.name}${entry.comboName ? ` · ${entry.comboName}` : ''}`
    ))
    if (this.goldOrbSummary) mutations.push(this.goldOrbSummary)
    showRunResult({
      outcome,
      formName,
      elapsedSeconds: Math.max(1, Math.round((this.time.now - this.runStartedAt) / 1000)),
      kills: this.kills + (outcome === 'victory' ? 1 : 0),
      exploredPercent: Math.round(this.fogCells.filter((cell) => cell.explored).length / this.fogCells.length * 100),
      mutations,
      reason: this.goldOrbSummary
        ?? this.evolutionChain.at(-1)?.reason
        ?? '猎杀尚未改写身体',
      derivedStats: formatDerivedStats(this.genes),
    })
  }

  private currentPlayerAnimation(time: number): PlayerAnimationPose {
    const velocity = this.player?.body as Phaser.Physics.Arcade.Body | undefined
    const attackStyle = this.pendingAttack || time < this.recoverUntil
      ? this.pendingAttack?.style ?? this.combatStyle
      : null
    return playerAnimationPose({
      now: time,
      runOver: this.runOver,
      health: this.health,
      movementState: this.movementState,
      movementRemainingMs: Math.max(0, this.movementStateUntil - time),
      speed: velocity?.velocity.length() ?? 0,
      attackStyle,
      attackWindupRemainingMs: Math.max(0, (this.pendingAttack?.impactAt ?? time) - time),
      attackRecoverRemainingMs: Math.max(0, this.recoverUntil - time),
      consumeRemainingMs: Math.max(0, this.lastConsumeAt + 460 - time),
    })
  }

  private currentEvolutionVisualFamily(): GeneFamily | null {
    return evolutionVisualFamily(this.evolutionChain, this.genes, this.recentHunts)
  }

  private renderPlayerEvolutionAppearance(time: number) {
    const graphics = this.playerEvolutionGraphics
    graphics.clear()
    if (!this.player) return
    const pose = this.currentPlayerAnimation(time)
    graphics.setAlpha(pose.alpha)
    const x = this.player.x
    const y = this.player.y
    const angle = this.player.rotation
    const visual = evolutionScaleForStage(this.evolutionStage)
    const ranks = this.mutationRanks
    const lean = geneLean(this.genes, this.recentHunts)
    const dominant = this.currentEvolutionVisualFamily()
    const appearance = playerEvolutionAppearance(this.evolutionStage, dominant, ranks)
    const pulse = 1 + Math.sin(time / 180) * (appearance.apex ? 0.045 : 0.025)
    const bodyColor = dominant ? GENE_COLORS[dominant] : this.starter.primaryColor
    const undersideColor = this.starter.secondaryColor
    const poseX = x + Math.cos(angle) * pose.forwardOffset * visual
    const bodyY = y - 30 * visual + Math.sin(angle) * pose.forwardOffset * visual + pose.bob * visual
    const point = (forward: number, side: number) => ({
      x: poseX + Math.cos(angle) * forward * pose.forwardScale * visual + Math.cos(angle + Math.PI / 2) * side * pose.sideScale * visual,
      y: bodyY + Math.sin(angle) * forward * pose.forwardScale * visual + Math.sin(angle + Math.PI / 2) * side * pose.sideScale * visual,
    })
    const bodyLength = appearance.bodyLength * pulse
    const bodyWidth = appearance.bodyWidth * pulse

    graphics.fillStyle(0x000000, 0.42)
    graphics.fillEllipse(x + 4, y + 8, bodyLength * 1.28 * visual, bodyWidth * 0.54 * visual)

    const tailBase = point(-bodyLength * 0.38, 0)
    const tailTip = point(-bodyLength * 0.5 - appearance.tailLength, 0)
    graphics.lineStyle(Math.max(5, appearance.limbThickness * 1.35) * visual, undersideColor, 0.96)
    graphics.lineBetween(tailBase.x, tailBase.y, tailTip.x, tailTip.y)
    graphics.fillStyle(bodyColor, 0.95).fillCircle(tailTip.x, tailTip.y, Math.max(3, appearance.limbThickness * 0.76) * visual)

    const drawLeg = (forward: number, side: number, reachScale = 1) => {
      const root = point(forward, side * bodyWidth * 0.32)
      const stride = pose.limbSweep * 8 * side
      const elbow = point(forward - 2 + stride * 0.45, side * (bodyWidth * 0.54 + appearance.limbReach * 0.32))
      const tip = point(forward + appearance.limbReach * 0.18 + stride, side * (bodyWidth * 0.56 + appearance.limbReach * 0.62 * reachScale))
      graphics.lineStyle(appearance.limbThickness * visual, undersideColor, 1)
      graphics.lineBetween(root.x, root.y, elbow.x, elbow.y)
      graphics.lineStyle(Math.max(2, appearance.limbThickness * 0.62) * visual, bodyColor, 1)
      graphics.lineBetween(elbow.x, elbow.y, tip.x, tip.y)
    }
    for (const forward of [-bodyLength * 0.24, bodyLength * 0.12]) {
      drawLeg(forward, -1, forward > 0 ? 1.12 : 0.88)
      drawLeg(forward, 1, forward > 0 ? 1.12 : 0.88)
    }

    const nose = point(bodyLength * 0.54, 0)
    const right = point(1, bodyWidth * 0.5)
    const rear = point(-bodyLength * 0.5, 0)
    const left = point(1, -bodyWidth * 0.5)
    const undersideOffset = point(-2, 2)
    graphics.fillStyle(undersideColor, 1).fillPoints([
      { x: nose.x + 4, y: nose.y + 5 },
      { x: right.x + 4, y: right.y + 5 },
      { x: rear.x + 4, y: rear.y + 5 },
      { x: left.x + 4, y: left.y + 5 },
    ], true)
    graphics.fillStyle(bodyColor, 1).fillPoints([nose, right, rear, left], true)
    const abdomen = point(-bodyLength * 0.18, 0)
    const thorax = point(bodyLength * 0.2, 0)
    graphics.fillStyle(undersideColor, 0.96).fillCircle(abdomen.x + 3, abdomen.y + 4, bodyWidth * 0.47 * visual)
    graphics.fillStyle(bodyColor, 1).fillCircle(abdomen.x, abdomen.y, bodyWidth * 0.47 * visual)
    graphics.fillStyle(undersideColor, 0.96).fillCircle(thorax.x + 3, thorax.y + 4, bodyWidth * 0.36 * visual)
    graphics.fillStyle(bodyColor, 1).fillCircle(thorax.x, thorax.y, bodyWidth * 0.36 * visual)
    graphics.fillStyle(0xffffff, 0.16).fillEllipse(
      undersideOffset.x + Math.cos(angle) * 7 * visual,
      undersideOffset.y + Math.sin(angle) * 7 * visual,
      bodyLength * 0.42 * visual,
      bodyWidth * 0.28 * visual,
    )

    for (let index = 0; index < appearance.dorsalSpikes; index += 1) {
      const progress = appearance.dorsalSpikes <= 1 ? 0.5 : index / (appearance.dorsalSpikes - 1)
      const forward = -bodyLength * 0.32 + bodyLength * 0.58 * progress
      const root = point(forward, -bodyWidth * 0.38)
      const rootBack = point(forward - 5, -bodyWidth * 0.33)
      const tip = point(forward - 1, -bodyWidth * (0.62 + this.evolutionStage * 0.025))
      graphics.fillStyle(dominant === 'fang' ? 0xffdf8b : bodyColor, 0.94).fillTriangle(
        rootBack.x, rootBack.y, root.x, root.y, tip.x, tip.y,
      )
    }

    const head = point(bodyLength * 0.47 - pose.headDip, 0)
    graphics.fillStyle(undersideColor, 1).fillCircle(head.x + 3, head.y + 4, appearance.headRadius * visual)
    graphics.fillStyle(bodyColor, 1).fillCircle(head.x, head.y, appearance.headRadius * visual)
    const eye = point(bodyLength * 0.54, -appearance.headRadius * 0.42)
    graphics.fillStyle(0xfff1b5, 1).fillCircle(eye.x, eye.y, Math.max(2.4, 2.4 + this.evolutionStage * 0.18) * visual)
    graphics.fillStyle(0x08100c, 0.95).fillCircle(eye.x + Math.cos(angle) * visual, eye.y + Math.sin(angle) * visual, 1.2 * visual)

    if (dominant === 'fang' || (ranks['serrated-claws'] ?? 0) + (ranks['execution-fangs'] ?? 0) > 0) {
      for (const side of [-1, 1]) {
        const clawRoot = point(bodyLength * 0.18, side * bodyWidth * 0.34)
        const clawJoint = point(bodyLength * 0.28, side * (bodyWidth * 0.55 + appearance.limbReach * 0.3))
        const clawTip = point(bodyLength * 0.62 + appearance.limbReach * 0.45, side * (bodyWidth * 0.5 + appearance.limbReach * 0.48))
        graphics.lineStyle((appearance.limbThickness + 1.5) * visual, 0xb86a35, 1)
        graphics.lineBetween(clawRoot.x, clawRoot.y, clawJoint.x, clawJoint.y)
        graphics.lineStyle(Math.max(3, appearance.limbThickness * 0.66) * visual, 0xffd37a, 1)
        graphics.lineBetween(clawJoint.x, clawJoint.y, clawTip.x, clawTip.y)
        const bladeBase = point(bodyLength * 0.49 + appearance.limbReach * 0.18, side * (bodyWidth * 0.45 + appearance.limbReach * 0.34))
        graphics.fillStyle(0xffd37a, 0.98).fillTriangle(
          clawJoint.x, clawJoint.y,
          clawTip.x, clawTip.y,
          bladeBase.x, bladeBase.y,
        )
        const fangRoot = point(bodyLength * 0.53, side * appearance.headRadius * 0.48)
        const fangTip = point(bodyLength * 0.57 + appearance.fangLength, side * appearance.headRadius * 0.62)
        graphics.lineStyle(Math.max(2, appearance.fangLength * 0.3) * visual, 0xffedbf, 1)
        graphics.lineBetween(fangRoot.x, fangRoot.y, fangTip.x, fangTip.y)
      }
    }
    if ((ranks['swift-nerves'] ?? 0) + (ranks['wind-sacs'] ?? 0) > 0) {
      for (let pair = 0; pair < appearance.wingPairCount; pair += 1) {
        const pairScale = 1 - pair * 0.24
        const forward = 5 - pair * 12
        for (const side of [-1, 1]) {
          const root = point(forward, side * bodyWidth * 0.28)
          const tip = point(forward - 3, side * (bodyWidth * 0.48 + appearance.wingSpan * pairScale))
          const trailing = point(-bodyLength * (0.34 + pair * 0.08), side * (bodyWidth * 0.42 + appearance.wingSpan * 0.5 * pairScale))
          graphics.fillStyle(pair === 0 ? 0x79f2a1 : 0xbfffd7, pair === 0 ? 0.5 : 0.34)
            .fillTriangle(root.x, root.y, tip.x, tip.y, trailing.x, trailing.y)
          graphics.lineStyle(1.5 * visual, 0xd9ffe8, 0.58)
            .lineBetween(root.x, root.y, tip.x, tip.y)
            .lineBetween(root.x, root.y, trailing.x, trailing.y)
        }
      }
      if (appearance.stage >= 4) {
        for (const side of [-1, 0, 1]) {
          const trailStart = point(-bodyLength * 0.46, side * 5)
          const trailEnd = point(-bodyLength * 0.8 - appearance.stage * 2, side * (8 + Math.abs(side) * 5))
          graphics.lineStyle((2.6 - Math.abs(side) * 0.5) * visual, 0x79f2a1, 0.28)
            .lineBetween(trailStart.x, trailStart.y, trailEnd.x, trailEnd.y)
        }
      }
    }
    if ((ranks['reactive-shell'] ?? 0) + (ranks['mirror-carapace'] ?? 0) > 0) {
      for (let index = 0; index < appearance.armorPlateCount; index += 1) {
        const progress = (index + 1) / (appearance.armorPlateCount + 1)
        const forward = -bodyLength * 0.4 + bodyLength * 0.78 * progress
        const halfWidth = bodyWidth * (0.48 - Math.abs(progress - 0.5) * 0.16) * appearance.armorBulk
        const frontLeft = point(forward + 4.5, -halfWidth)
        const frontRight = point(forward + 4.5, halfWidth)
        const backRight = point(forward - 5.5, halfWidth * 0.9)
        const backLeft = point(forward - 5.5, -halfWidth * 0.9)
        graphics.fillStyle(index % 2 === 0 ? 0x4d82bd : 0x315f98, 0.96)
        graphics.fillPoints([frontLeft, frontRight, backRight, backLeft], true)
        graphics.lineStyle(1.5 * visual, 0xa9dcff, 0.72)
        graphics.lineBetween(frontLeft.x, frontLeft.y, frontRight.x, frontRight.y)
      }
      if (appearance.stage >= 4) {
        for (const side of [-1, 1]) {
          const inner = point(bodyLength * 0.2, side * bodyWidth * 0.42)
          const outer = point(bodyLength * 0.24, side * bodyWidth * appearance.armorBulk * 0.78)
          const rearShield = point(-bodyLength * 0.04, side * bodyWidth * appearance.armorBulk * 0.7)
          graphics.fillStyle(0x65a9ff, 0.96).fillTriangle(
            inner.x, inner.y, outer.x, outer.y, rearShield.x, rearShield.y,
          )
          graphics.lineStyle(2 * visual, 0xc4e6ff, 0.76).lineBetween(outer.x, outer.y, rearShield.x, rearShield.y)
        }
      }
    }
    if ((ranks['symbiotic-brood'] ?? 0) + (ranks['devouring-colony'] ?? 0) > 0) {
      const sac = point(-bodyLength * 0.22, 0)
      const sacPulse = 1 + Math.sin(time / 150) * 0.08
      graphics.fillStyle(0x174f46, 0.98).fillCircle(sac.x + 2, sac.y + 3, appearance.broodSacRadius * 1.25 * visual)
      graphics.fillStyle(0x74e8d1, 0.92).fillCircle(sac.x, sac.y, appearance.broodSacRadius * sacPulse * visual)
      graphics.fillStyle(0xe0fff8, 0.62).fillCircle(
        sac.x - appearance.broodSacRadius * 0.28 * visual,
        sac.y - appearance.broodSacRadius * 0.3 * visual,
        appearance.broodSacRadius * 0.28 * visual,
      )
      const broodOrbit = (bodyWidth * 0.72 + 10) * visual
      for (let index = 0; index < appearance.broodCount; index += 1) {
        const broodAngle = -time / 680 + index / appearance.broodCount * Math.PI * 2
        const broodX = x + Math.cos(broodAngle) * broodOrbit
        const broodY = bodyY + Math.sin(broodAngle) * broodOrbit * 0.54
        const broodRadius = (2.8 + (index % 2) * 0.8 + appearance.stage * 0.12) * visual
        graphics.fillStyle(0x153d36, 0.94).fillCircle(broodX + 1.5, broodY + 2, broodRadius * 1.2)
        graphics.fillStyle(index % 2 === 0 ? 0xa8ffe9 : 0x63d8c0, 0.96).fillCircle(broodX, broodY, broodRadius)
      }
    }
    if ((ranks['toxin-coating'] ?? 0) + (ranks['toxic-blood'] ?? 0) > 0) {
      const gland = point(-bodyLength * 0.48 - appearance.tailLength * 0.35, 0)
      for (let segment = 0; segment < 3; segment += 1) {
        const segmentPoint = point(-bodyLength * (0.34 + segment * 0.14), Math.sin(time / 220 + segment) * 2.4)
        graphics.fillStyle(segment % 2 === 0 ? 0x6aa83c : 0x47752c, 0.98)
          .fillCircle(segmentPoint.x, segmentPoint.y, (appearance.venomGlandRadius * (0.72 - segment * 0.08)) * visual)
      }
      graphics.fillStyle(0x345c28, 1).fillCircle(gland.x + 2, gland.y + 3, appearance.venomGlandRadius * 1.18 * visual)
      graphics.fillStyle(GENE_COLORS.venom, 0.96).fillCircle(gland.x, gland.y, appearance.venomGlandRadius * visual)
      graphics.fillStyle(0xe8ffb8, 0.62).fillCircle(
        gland.x - appearance.venomGlandRadius * 0.28 * visual,
        gland.y - appearance.venomGlandRadius * 0.3 * visual,
        appearance.venomGlandRadius * 0.26 * visual,
      )
      const needleTip = point(-bodyLength * 0.52 - appearance.venomNeedleLength, 0)
      const needleLeft = point(-bodyLength * 0.52 - appearance.venomNeedleLength * 0.28, -appearance.venomGlandRadius * 0.46)
      const needleRight = point(-bodyLength * 0.52 - appearance.venomNeedleLength * 0.28, appearance.venomGlandRadius * 0.46)
      graphics.fillStyle(0xe8ffb8, 0.98).fillTriangle(
        needleTip.x, needleTip.y, needleLeft.x, needleLeft.y, needleRight.x, needleRight.y,
      )
      if (appearance.stage >= 4) {
        for (const side of [-1, 1]) {
          const drop = point(-bodyLength * 0.28, side * (bodyWidth * 0.48 + 5))
          graphics.fillStyle(0xa7ef62, 0.72).fillCircle(drop.x, drop.y + Math.sin(time / 180 + side) * 3 * visual, 2.5 * visual)
        }
      }
    }
    if ((ranks['pulse-gland'] ?? 0) + (ranks['rift-chamber'] ?? 0) > 0) {
      const core = point(bodyLength * 0.06, 0)
      const riftPulse = 1 + Math.sin(time / 105) * 0.12
      graphics.fillStyle(0x25113c, 0.98).fillCircle(core.x, core.y, appearance.riftCoreRadius * 1.45 * visual)
      graphics.lineStyle(3 * visual, GENE_COLORS.rift, 0.82).strokeCircle(core.x, core.y, appearance.riftCoreRadius * riftPulse * visual)
      graphics.fillStyle(0xf2d9ff, 0.86).fillCircle(core.x, core.y, Math.max(2.5, appearance.riftCoreRadius * 0.34) * visual)
      const orbitRadius = (18 + appearance.stage * 2.2) * visual
      for (let index = 0; index < appearance.riftOrbCount; index += 1) {
        const orbitAngle = time / 420 + index / appearance.riftOrbCount * Math.PI * 2
        const orbX = core.x + Math.cos(orbitAngle) * orbitRadius
        const orbY = core.y + Math.sin(orbitAngle) * orbitRadius * 0.56
        graphics.lineStyle(1.2 * visual, GENE_COLORS.rift, 0.18).lineBetween(core.x, core.y, orbX, orbY)
        graphics.fillStyle(index % 2 === 0 ? 0xe0b0ff : 0x8c5cff, 0.9)
          .fillCircle(orbX, orbY, (2.5 + appearance.stage * 0.24) * visual)
      }
      if (appearance.stage >= 3) {
        for (const side of [-1, 1]) {
          const root = point(-bodyLength * 0.34, side * bodyWidth * 0.22)
          const bend = point(-bodyLength * 0.58, side * (bodyWidth * 0.45 + 5))
          const tip = point(-bodyLength * 0.7 - appearance.stage * 1.5, side * (bodyWidth * 0.7 + 8))
          graphics.lineStyle((3.5 - Math.abs(side) * 0.5) * visual, 0x8d58c4, 0.82)
          graphics.lineBetween(root.x, root.y, bend.x, bend.y)
          graphics.lineStyle(2 * visual, 0xd9a6ff, 0.72).lineBetween(bend.x, bend.y, tip.x, tip.y)
        }
      }
    }

    if (appearance.apex) {
      const alpha = 0.42 + Math.sin(time / 120) * 0.18
      if (dominant !== 'rift') {
        graphics.lineStyle(3 * visual, bodyColor, alpha)
        graphics.strokeEllipse(x, bodyY, (bodyLength + 22) * visual, (bodyWidth + 20) * visual)
      }
      const crown = point(bodyLength * 0.38, 0)
      if (dominant === 'carapace') {
        const crownFront = point(bodyLength * 0.7, 0)
        const crownLeft = point(bodyLength * 0.38, -appearance.headRadius * 1.15)
        const crownRight = point(bodyLength * 0.38, appearance.headRadius * 1.15)
        const crownRear = point(bodyLength * 0.18, 0)
        graphics.fillStyle(0x2f5f96, 0.98).fillPoints([crownFront, crownRight, crownRear, crownLeft], true)
        graphics.lineStyle(3 * visual, 0xc4e6ff, 0.86)
          .lineBetween(crownLeft.x, crownLeft.y, crownFront.x, crownFront.y)
          .lineBetween(crownFront.x, crownFront.y, crownRight.x, crownRight.y)
        graphics.fillStyle(0xe9f7ff, 0.82).fillCircle(crownFront.x, crownFront.y, 3.5 * visual)
      } else if (dominant === 'rift') {
        graphics.lineStyle(3 * visual, 0xd9a6ff, 0.72)
          .strokeCircle(crown.x, crown.y, appearance.headRadius * 1.32 * visual)
        graphics.fillStyle(0xffffff, 0.86).fillCircle(crown.x, crown.y, 4 * visual)
      } else if (dominant === 'wing') {
        for (const side of [-1, 1]) {
          const root = point(bodyLength * 0.38, side * appearance.headRadius * 0.48)
          const inner = point(bodyLength * 0.5, side * appearance.headRadius * 0.86)
          const tip = point(bodyLength * 0.72, side * appearance.headRadius * 1.35)
          graphics.fillStyle(0xbfffd7, 0.9).fillTriangle(root.x, root.y, inner.x, inner.y, tip.x, tip.y)
        }
        graphics.fillStyle(0xf0fff6, 0.8).fillCircle(crown.x, crown.y, 3.5 * visual)
      } else if (dominant === 'swarm') {
        for (const side of [-1, 0, 1]) {
          const node = point(bodyLength * (0.45 + (side === 0 ? 0.13 : 0)), side * appearance.headRadius * 0.82)
          graphics.fillStyle(side === 0 ? 0xdffff7 : 0x74e8d1, 0.94)
            .fillCircle(node.x, node.y, (side === 0 ? 5 : 4) * visual)
        }
      } else if (dominant === 'venom') {
        const needleBaseLeft = point(bodyLength * 0.38, -appearance.headRadius * 0.6)
        const needleBaseRight = point(bodyLength * 0.38, appearance.headRadius * 0.6)
        const needleCrown = point(bodyLength * 0.82, 0)
        graphics.fillStyle(0xe8ffb8, 0.96).fillTriangle(
          needleBaseLeft.x, needleBaseLeft.y,
          needleBaseRight.x, needleBaseRight.y,
          needleCrown.x, needleCrown.y,
        )
        graphics.fillStyle(0xa7ef62, 0.9).fillCircle(crown.x, crown.y, 4.5 * visual)
      } else {
        for (const side of [-1, 0, 1]) {
          const root = point(bodyLength * 0.4, side * appearance.headRadius * 0.55)
          const rootBack = point(bodyLength * 0.3, side * appearance.headRadius * 0.72)
          const tip = point(bodyLength * (0.72 + (side === 0 ? 0.08 : 0)), side * appearance.headRadius * 0.85)
          graphics.fillStyle(side === 0 ? 0xfff3bd : 0xffd37a, 0.94).fillTriangle(
            root.x, root.y, rootBack.x, rootBack.y, tip.x, tip.y,
          )
        }
        graphics.fillStyle(0xffffff, 0.72).fillCircle(crown.x, crown.y, 3.5 * visual)
      }
    }

    if (time < this.evolutionBurstUntil) {
      const progress = 1 - Math.max(0, this.evolutionBurstUntil - time) / 1100
      graphics.lineStyle((6 - progress * 4) * visual, bodyColor, 0.8 * (1 - progress))
      graphics.strokeCircle(x, bodyY, (32 + progress * 54) * visual)
    }

    if (isEvolutionPreviewReady(this.evolution, evolutionRequirementForStage(this.evolutionStage)) && dominant) {
      graphics.lineStyle(2, GENE_COLORS[dominant], 0.35 + lean[dominant] * 0.4)
      graphics.strokeEllipse(x, bodyY, (bodyLength + 24) * visual, (bodyWidth + 24) * visual)
    }
    const buffActive = eliteOrbBuffRemainingMs(this.eliteOrbBuff, time) > 0
    if (buffActive && this.eliteOrbBuff) {
      graphics.lineStyle(3, ELITE_AFFIXES[this.eliteOrbBuff.affix].color, 0.45 + Math.sin(time / 90) * 0.2)
      graphics.strokeEllipse(x, bodyY, (bodyLength + 30) * visual, (bodyWidth + 30) * visual)
    }
  }

  private syncEvolutionHud() {
    const required = evolutionRequirementForStage(this.evolutionStage)
    const lean = geneLean(this.genes, this.recentHunts)
    const pending = this.pendingEvolutionAt > 0
    const preview = pending || isEvolutionPreviewReady(this.evolution, required)
    renderEvolutionHud({
      lean,
      reason: leanReason(lean, this.recentHunts),
      formName: currentFormName(this.mutationRanks, this.genes, this.recentHunts),
      preview,
      pending,
      canResist: pending && this.resistCharges > 0,
      resistCharges: this.resistCharges,
      stage: this.evolutionStage,
      maxStages: EVOLUTION_CONFIG.maxStages,
      stageLabel: formatEvolutionStageLabel(this.evolutionStage, EVOLUTION_CONFIG.maxStages),
      derivedStats: formatDerivedStats(this.genes),
      buffHint: this.eliteOrbBuff && eliteOrbBuffRemainingMs(this.eliteOrbBuff, this.time.now) > 0
        ? `${this.eliteOrbBuff.hint} · ${Math.ceil(eliteOrbBuffRemainingMs(this.eliteOrbBuff, this.time.now) / 1000)}秒`
        : null,
    })
  }

  private flashMessage(message: string) {
    this.messageText.setText(message).setAlpha(1).setScale(0.75)
    this.messageText.setY(150)
    this.tweens.add({ targets: this.messageText, alpha: 0, scale: 1, y: 136, duration: 1100, ease: 'Cubic.Out' })
  }

  private toggleBestiary() {
    if (this.runOver || this.bossDefeated) return
    this.isBestiaryOpen = !this.isBestiaryOpen
    if (this.isBestiaryOpen) {
      this.player.setVelocity(0)
      this.physics.world.pause()
      this.time.paused = true
      showBestiary(
        this.bestiaryState,
        (type) => this.textures.getBase64(MONSTERS[type].texture),
        () => this.toggleBestiary(),
      )
    } else {
      hideBestiary()
      this.time.paused = false
      this.physics.world.resume()
    }
  }
}

const bestiaryOverlay = document.querySelector<HTMLElement>('#bestiary-overlay')!
const bestiaryGrid = document.querySelector<HTMLElement>('#bestiary-grid')!
const bestiaryProgress = document.querySelector<HTMLElement>('#bestiary-progress')!
const bestiaryClose = document.querySelector<HTMLButtonElement>('#bestiary-close')!
const ATTACK_KIND_LABELS: Record<MonsterAttackKind, string> = {
  pounce: '扑击', dash: '冲刺', brace: '甲壳防御', drain: '吸血', projectile: '远程喷射', spread: '扇形弹幕',
}
const LINEAGE_LABELS: Record<MonsterLineage, string> = {
  fang: '猎牙族', wing: '飞翼族', carapace: '重甲族', swarm: '群巢族', venom: '毒腺族', rift: '裂隙族',
}
let bestiaryCloseHandler: (() => void) | undefined

function showBestiary(
  state: BestiaryState,
  getTexture: (type: MonsterType) => string,
  onClose: () => void,
) {
  bestiaryCloseHandler = onClose
  const unlocked = new Set(unlockedMonsterTypes(state))
  bestiaryProgress.textContent = `已发现 ${unlocked.size} / ${MONSTER_TYPES.length}`
  bestiaryGrid.replaceChildren()

  for (const type of MONSTER_TYPES) {
    const definition = MONSTERS[type]
    const isUnlocked = unlocked.has(type)
    const card = document.createElement('article')
    card.className = `bestiary-card${isUnlocked ? '' : ' is-locked'}`
    card.setAttribute('role', 'listitem')
    if (isUnlocked) {
      card.innerHTML = `
        <span class="bestiary-specimen"><img src="${getTexture(type)}" alt="${definition.name}"></span>
        <span class="bestiary-copy">
          <strong>${definition.name}</strong>
          <small>${LINEAGE_LABELS[definition.lineage]} · 猎杀 ${state.kills[type]}</small>
          <span>${ATTACK_KIND_LABELS[definition.attackKind]} · 掉落${GENE_LABELS[definition.gene]}基因</span>
          <em>${LINEAGE_TALENTS[definition.lineage].name}：${LINEAGE_TALENTS[definition.lineage].description}</em>
        </span>
      `
    } else {
      card.innerHTML = `
        <span class="bestiary-specimen" aria-hidden="true"></span>
        <span class="bestiary-copy"><strong>未发现物种</strong><small>战争迷雾中</small><span>完成首次猎杀以记录</span></span>
      `
    }
    bestiaryGrid.append(card)
  }

  bestiaryOverlay.classList.add('is-open')
  bestiaryOverlay.setAttribute('aria-hidden', 'false')
  window.setTimeout(() => bestiaryClose.focus(), 60)
}

function hideBestiary() {
  bestiaryOverlay.classList.remove('is-open')
  bestiaryOverlay.setAttribute('aria-hidden', 'true')
  bestiaryCloseHandler = undefined
}

bestiaryClose.addEventListener('click', () => bestiaryCloseHandler?.())

interface EvolutionHudState {
  lean: GeneCounts
  reason: string
  formName: string
  preview: boolean
  pending: boolean
  canResist: boolean
  resistCharges: number
  stage: number
  maxStages: number
  stageLabel: string
  derivedStats: string
  buffHint: string | null
}

function renderEvolutionHud(state: EvolutionHudState) {
  const bars = document.querySelector<HTMLElement>('#lean-bars')
  const reason = document.querySelector<HTMLElement>('#lean-reason')
  const preview = document.querySelector<HTMLElement>('#form-preview')
  const derived = document.querySelector<HTMLElement>('#derived-stats')
  const buff = document.querySelector<HTMLElement>('#orb-buff')
  const resist = document.querySelector<HTMLButtonElement>('#resist-evolution')
  if (!bars || !reason || !preview || !resist) return
  bars.replaceChildren()
  for (const family of GENE_FAMILIES) {
    const row = document.createElement('div')
    row.className = 'lean-row'
    row.innerHTML = `<span>${GENE_LABELS[family]}</span><i style="width:${Math.round(state.lean[family] * 100)}%"></i>`
    bars.append(row)
  }
  reason.textContent = state.reason
  preview.textContent = state.preview
    ? `即将定型 · ${state.formName} · ${state.stageLabel}`
    : `${state.formName} · ${state.stageLabel}`
  if (derived) derived.textContent = state.derivedStats
  if (buff) {
    buff.hidden = !state.buffHint
    buff.textContent = state.buffHint ?? ''
  }
  resist.hidden = !state.canResist
  resist.textContent = `抗拒这次生长 · R（剩${state.resistCharges}）`
}

interface RunResult {
  outcome: 'victory' | 'death'
  formName: string
  elapsedSeconds: number
  kills: number
  exploredPercent: number
  mutations: string[]
  reason: string
  derivedStats: string
}

function showRunResult(result: RunResult) {
  const overlay = document.querySelector<HTMLElement>('#result-overlay')!
  const title = document.querySelector<HTMLElement>('#result-title')!
  const lead = overlay.querySelector('.result-lead')
  const stats = document.querySelector<HTMLElement>('#result-stats')!
  const mutations = document.querySelector<HTMLElement>('#result-mutations')!
  const minutes = Math.floor(result.elapsedSeconds / 60)
  const seconds = String(result.elapsedSeconds % 60).padStart(2, '0')
  title.textContent = result.outcome === 'victory' ? `${result.formName} 猎杀成功` : `${result.formName} 倒在猎场`
  if (lead) lead.textContent = result.reason
  stats.innerHTML = `
    <div class="result-stat"><strong>${minutes}:${seconds}</strong><span>本局时长</span></div>
    <div class="result-stat"><strong>${result.kills}</strong><span>猎物击杀</span></div>
    <div class="result-stat"><strong>${result.exploredPercent}%</strong><span>地图探索</span></div>
    <div class="result-stat"><strong>${result.outcome === 'victory' ? '完成' : '失败'}</strong><span>Boss结果</span></div>
  `
  const chain = result.mutations.length > 0
    ? `进化基因链：${result.mutations.join(' → ')}`
    : '进化基因链：原始形态'
  mutations.textContent = `${chain} · ${result.derivedStats}`
  overlay.classList.add('is-open')
  overlay.setAttribute('aria-hidden', 'false')
  window.setTimeout(() => document.querySelector<HTMLButtonElement>('#restart-run')?.focus(), 120)
}

document.querySelector<HTMLButtonElement>('#restart-run')?.addEventListener('click', () => {
  if (document.body.classList.contains('is-v4-live')) {
    const params = new URLSearchParams(window.location.search)
    params.set('spawnSeed', `gloamwood-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`)
    params.delete('boss')
    params.delete('prop')
    params.delete('nest')
    params.delete('enemy')
    params.delete('health')
    params.delete('hazard')
    params.delete('combatStyle')
    params.delete('evolutionRoute')
    params.delete('evolutionStage')
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  }
  window.location.reload()
})

const debugRequested = new URLSearchParams(window.location.search).get('debug') === '1'
let game: Phaser.Game | undefined
let quality3DCleanup: (() => void) | undefined
let starterKeyHandler: ((event: KeyboardEvent) => void) | undefined

function installDebugApi(activeGame: Phaser.Game) {
  if (!import.meta.env.DEV && !debugRequested) return
  const scene = () => activeGame.scene.getScene('prototype') as PrototypeScene
  const debugApi = {
    getState: () => scene().getDebugState(),
    setStage: (stage: number) => scene().applyDebugStage(stage),
    setEvolutionRoute: (family: GeneFamily, stage: number) => scene().applyDebugEvolutionRoute(family, stage),
    grantSigils: () => scene().grantDebugSigils(),
    advanceNest: () => scene().advanceDebugNest(),
  }
  ;(window as Window & { __EA_DEBUG__?: typeof debugApi }).__EA_DEBUG__ = debugApi
  if (debugRequested) {
    const debugOutput = document.createElement('output')
    debugOutput.id = 'debug-state'
    debugOutput.hidden = true
    document.body.append(debugOutput)
    const debugInterval = window.setInterval(() => {
      try {
        debugOutput.textContent = JSON.stringify(debugApi.getState())
      } catch {
        window.clearInterval(debugInterval)
      }
    }, 100)
    window.addEventListener('beforeunload', () => window.clearInterval(debugInterval), { once: true })
    const search = new URLSearchParams(window.location.search)
    const route = search.get('evolutionRoute') as GeneFamily | null
    const stage = Number(search.get('evolutionStage'))
    if (route && GENE_FAMILIES.includes(route) && Number.isFinite(stage)) {
      window.setTimeout(() => scene().applyDebugEvolutionRoute(route, stage), 420)
    }
  }
}

function launchRun(starterId: StarterVariantId) {
  if (game) return
  const huntSliceRequested = isGloamwoodHuntSliceRequested()
  const nestLabRequested = isMonsterNestLabRequested()
  selectedStarter = STARTER_VARIANTS[starterId]
  if (starterKeyHandler) window.removeEventListener('keydown', starterKeyHandler)
  const overlay = document.querySelector<HTMLElement>('#starter-overlay')!
  overlay.classList.add('is-leaving')
  overlay.setAttribute('aria-hidden', 'true')
  if (!huntSliceRequested && !nestLabRequested) {
    const params = new URLSearchParams(window.location.search)
    params.set('maplab', '4')
    params.set('live', '1')
    params.set('starter', starterId)
    if (!params.has('spawnSeed')) {
      params.set('spawnSeed', `gloamwood-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`)
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    window.setTimeout(() => {
      overlay.classList.remove('is-open', 'is-leaving')
      launchGloamwoodExplorationLab()
    }, 220)
    return
  }
  if (huntSliceRequested) {
    document.title = '猎杀切片 · 幽影林地战斗可读性'
    const badge = document.querySelector<HTMLElement>('.prototype-badge')
    if (badge) badge.textContent = 'Hunt Lab · 林地战斗切片'
  } else if (nestLabRequested) {
    document.title = '窝点实战 · 棘牙地穴'
    const badge = document.querySelector<HTMLElement>('.prototype-badge')
    if (badge) badge.textContent = 'Nest Lab · 两波守卫与核心'
    const help = document.querySelector<HTMLElement>('.helpbar')
    if (help) help.innerHTML = [
      '<span><strong>点击 / Tab</strong> 锁定 · <strong>1 / 2 / 3</strong> 近战、远程、魔法 · 清除两波守卫后摧毁核心</span>',
      debugRequested ? '<button class="maplab-stage-button" type="button" data-nest-debug="advance">QA 推进阶段</button>' : '',
    ].join('')
  }

  window.setTimeout(() => {
    overlay.classList.remove('is-open', 'is-leaving')
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 1280,
      height: 720,
      backgroundColor: '#071a16',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: PrototypeScene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, pixelArt: false },
    })
    installDebugApi(game)
    if (nestLabRequested && debugRequested) {
      document.querySelector<HTMLButtonElement>('[data-nest-debug="advance"]')?.addEventListener('click', () => {
        const scene = game?.scene.getScene('prototype') as PrototypeScene | undefined
        scene?.advanceDebugNest()
      })
    }
  }, 220)
}

function launchLegacyMapLab() {
  if (game) return
  document.body.classList.add('is-maplab')
  document.title = '地图工坊 · 树木'
  const overlay = document.querySelector<HTMLElement>('#starter-overlay')
  overlay?.classList.remove('is-open')
  overlay?.setAttribute('aria-hidden', 'true')
  overlay?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#evolution-hud')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#result-overlay')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#bestiary-overlay')?.setAttribute('hidden', '')
  const badge = document.querySelector<HTMLElement>('.prototype-badge')
  if (badge) badge.textContent = 'Map Lab · 林地 · 树木'
  const help = document.querySelector<HTMLElement>('.helpbar')
  if (help) {
    help.innerHTML = [
      '<span><strong>WASD / 方向键</strong> 平移</span>',
      '<span class="divider">/</span>',
      '<span><strong>拖拽</strong> 移动镜头</span>',
      '<span class="divider">/</span>',
      '<span><strong>滚轮 · Q / E</strong> 缩放</span>',
      '<span class="divider">/</span>',
      '<span class="optional">约 70° 高机位 · 立体树冠 · 角色身高参考</span>',
    ].join('')
  }
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#08140e',
    scene: MapLabScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
  })
  const debugRequested = new URLSearchParams(window.location.search).get('debug') === '1'
  if (import.meta.env.DEV || debugRequested) {
    const scene = () => game!.scene.getScene('map-lab') as MapLabScene
    const debugApi = { getState: () => scene().getDebugState() }
    ;(window as Window & { __EA_DEBUG__?: typeof debugApi }).__EA_DEBUG__ = debugApi
  }
}

function launchMapLabV2() {
  if (game) return
  document.body.classList.add('is-maplab')
  document.title = '地图工坊 V2 · 雾光氛围'
  const overlay = document.querySelector<HTMLElement>('#starter-overlay')
  overlay?.classList.remove('is-open')
  overlay?.setAttribute('aria-hidden', 'true')
  overlay?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#evolution-hud')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#result-overlay')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#bestiary-overlay')?.setAttribute('hidden', '')
  const badge = document.querySelector<HTMLElement>('.prototype-badge')
  if (badge) badge.textContent = 'Map Lab V2 · 第六层 · 氛围'
  const help = document.querySelector<HTMLElement>('.helpbar')
  if (help) {
    help.innerHTML = [
      '<button class="maplab-stage-button" type="button" data-maplab-stage="ground" aria-pressed="false"><strong>1</strong> 基础地面</button>',
      '<button class="maplab-stage-button" type="button" data-maplab-stage="elevation" aria-pressed="false"><strong>2</strong> 高差悬崖</button>',
      '<button class="maplab-stage-button" type="button" data-maplab-stage="riverbanks" aria-pressed="false"><strong>3</strong> 河岸浅滩</button>',
      '<button class="maplab-stage-button" type="button" data-maplab-stage="trees" aria-pressed="false"><strong>4</strong> 树木分层</button>',
      '<button class="maplab-stage-button" type="button" data-maplab-stage="landmarks" aria-pressed="false"><strong>5</strong> 岩石遗迹</button>',
      '<button class="maplab-stage-button is-active" type="button" data-maplab-stage="atmosphere" aria-pressed="true"><strong>6</strong> 雾光氛围</button>',
      '<span class="maplab-camera-help"><strong>WASD / 拖拽</strong> 平移 · <strong>滚轮 · Q/E</strong> 缩放</span>',
      '<span class="divider">/</span>',
      '<span class="optional">第六层只验收薄雾、冷暖光与路线可读性</span>',
    ].join('')
  }
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#050906',
    scene: MapLabV2Scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
  })
  const debugRequested = new URLSearchParams(window.location.search).get('debug') === '1'
  if (import.meta.env.DEV || debugRequested) {
    const scene = () => game!.scene.getScene(MAP_LAB_V2.sceneKey) as MapLabV2Scene
    const debugApi = { getState: () => scene().getDebugState() }
    ;(window as Window & { __EA_DEBUG__?: typeof debugApi }).__EA_DEBUG__ = debugApi
  }
  document.querySelectorAll<HTMLButtonElement>('[data-maplab-stage]').forEach((button) => {
    button.addEventListener('click', () => {
      const stage = button.dataset.maplabStage
      if (stage === 'ground' || stage === 'elevation' || stage === 'riverbanks' || stage === 'trees' || stage === 'landmarks' || stage === 'atmosphere') {
        const scene = game!.scene.getScene(MAP_LAB_V2.sceneKey) as MapLabV2Scene
        scene.setStage(stage)
      }
    })
  })
  window.addEventListener('keydown', (event) => {
    if (event.key !== '1' && event.key !== '2' && event.key !== '3' && event.key !== '4' && event.key !== '5' && event.key !== '6') return
    const scene = game!.scene.getScene(MAP_LAB_V2.sceneKey) as MapLabV2Scene
    const stages: Record<string, MapLabV2Stage> = { '1': 'ground', '2': 'elevation', '3': 'riverbanks', '4': 'trees', '5': 'landmarks', '6': 'atmosphere' }
    scene.setStage(stages[event.key])
  })
}

function launchQualitySlice() {
  if (game) return
  document.body.classList.add('is-maplab')
  document.body.classList.add('is-quality-slice')
  document.title = '进化竞技场 · 品质基准样板'
  const overlay = document.querySelector<HTMLElement>('#starter-overlay')
  overlay?.classList.remove('is-open')
  overlay?.setAttribute('aria-hidden', 'true')
  overlay?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#evolution-hud')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#result-overlay')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#bestiary-overlay')?.setAttribute('hidden', '')
  const badge = document.querySelector<HTMLElement>('.prototype-badge')
  if (badge) badge.textContent = 'Quality Slice · 地图与角色比例'
  const help = document.querySelector<HTMLElement>('.helpbar')
  if (help) help.innerHTML = [
    '<button class="maplab-stage-button" type="button" data-quality-action="collision" aria-pressed="false"><strong>C</strong> 碰撞校验</button>',
    '<span class="maplab-camera-help"><strong>WASD / 点击地面</strong> 移动 · 高崖、森林壁和水域不可穿越</span>',
    '<span class="divider">/</span>',
    '<span class="optional">幼龙四足步态 · 可见身高约112px · 主路可并排5.5个角色</span>',
  ].join('')
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: window.innerHeight <= 500 ? 590 : 720,
    backgroundColor: '#07100b',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: QualitySliceScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
  })
  const scene = () => game!.scene.getScene(QUALITY_SLICE.sceneKey) as QualitySliceScene
  const debugRequested = new URLSearchParams(window.location.search).get('debug') === '1'
  if (import.meta.env.DEV || debugRequested) {
    const debugApi = { getState: () => scene().getDebugState() }
    ;(window as Window & { __EA_DEBUG__?: typeof debugApi }).__EA_DEBUG__ = debugApi
    if (debugRequested) {
      const output = document.createElement('output')
      output.id = 'debug-state'
      output.hidden = true
      document.body.append(output)
      window.setInterval(() => { output.textContent = JSON.stringify(debugApi.getState()) }, 250)
    }
  }
  document.querySelector<HTMLButtonElement>('[data-quality-action="collision"]')?.addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement
    scene().toggleCollisionDebug()
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'))
  })
}

function launchGloamwoodSpaceLab() {
  if (game) return
  document.body.classList.add('is-maplab')
  document.title = '地图工坊 V3 · 宽阔空间骨架'
  const overlay = document.querySelector<HTMLElement>('#starter-overlay')
  overlay?.classList.remove('is-open')
  overlay?.setAttribute('aria-hidden', 'true')
  overlay?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#evolution-hud')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#result-overlay')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#bestiary-overlay')?.setAttribute('hidden', '')
  const badge = document.querySelector<HTMLElement>('.prototype-badge')
  if (badge) badge.textContent = 'Map Lab V3 · 第一层 · 宽阔地面'
  const help = document.querySelector<HTMLElement>('.helpbar')
  if (help) {
    help.innerHTML = [
      '<button class="maplab-stage-button is-active" type="button" data-space-action="ranges" aria-pressed="true"><strong>R</strong> 攻击尺度</button>',
      '<button class="maplab-stage-button" type="button" data-space-action="layer" aria-pressed="false"><strong>G</strong> 骨架对照</button>',
      '<button class="maplab-stage-button" type="button" data-space-action="overview" aria-pressed="false"><strong>M</strong> 全图总览</button>',
      '<span class="maplab-camera-help"><strong>WASD / 点击地面</strong> 移动 · 黄圈远程 390 · 紫圈魔法 430</span>',
      '<span class="divider">/</span>',
      '<span class="optional">四个大空间 · 五条宽猎路 · 暂不铺最终美术</span>',
    ].join('')
  }
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#07100c',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: GloamwoodSpaceLabScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
  })
  const scene = () => game!.scene.getScene(GLOAMWOOD_SPACE_LAYOUT.sceneKey) as GloamwoodSpaceLabScene
  const debugRequested = new URLSearchParams(window.location.search).get('debug') === '1'
  if (import.meta.env.DEV || debugRequested) {
    const debugApi = { getState: () => scene().getDebugState() }
    ;(window as Window & { __EA_DEBUG__?: typeof debugApi }).__EA_DEBUG__ = debugApi
    if (debugRequested) {
      const debugOutput = document.createElement('output')
      debugOutput.id = 'debug-state'
      debugOutput.hidden = true
      document.body.append(debugOutput)
      const debugInterval = window.setInterval(() => {
        try {
          debugOutput.textContent = JSON.stringify(debugApi.getState())
        } catch {
          window.clearInterval(debugInterval)
        }
      }, 250)
    }
  }
  document.querySelector<HTMLButtonElement>('[data-space-action="ranges"]')?.addEventListener('click', () => scene().toggleRanges())
  document.querySelector<HTMLButtonElement>('[data-space-action="layer"]')?.addEventListener('click', () => scene().toggleSkeleton())
  document.querySelector<HTMLButtonElement>('[data-space-action="overview"]')?.addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement
    scene().setOverview(button.getAttribute('aria-pressed') !== 'true')
  })
  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'r') scene().toggleRanges()
    if (event.key.toLowerCase() === 'g') scene().toggleSkeleton()
    if (event.key.toLowerCase() === 'm') {
      const button = document.querySelector<HTMLButtonElement>('[data-space-action="overview"]')
      scene().setOverview(button?.getAttribute('aria-pressed') !== 'true')
    }
  })
}

function launchGloamwoodExplorationLab() {
  if (game) return
  const searchParams = new URLSearchParams(window.location.search)
  const debugRequested = searchParams.get('debug') === '1'
  const liveRunRequested = searchParams.get('live') === '1'
  const debugNestId = searchParams.get('nest')
  const debugHazardId = searchParams.get('hazard')
  const debugMonsterType = searchParams.get('enemy')
  const debugCombatStyle = searchParams.get('style')
  const debugHealth = Number(searchParams.get('health'))
  const debugBoss = searchParams.get('boss')
  const debugPropValue = searchParams.get('prop')
  const debugProp = debugPropValue === null ? Number.NaN : Number(debugPropValue)
  document.body.classList.add('is-maplab')
  document.body.classList.toggle('is-v4-live', liveRunRequested)
  document.title = liveRunRequested ? '进化竞技场 Lite · 幽影林地' : '地图工坊 V4 · 八大生态窝点'
  const overlay = document.querySelector<HTMLElement>('#starter-overlay')
  overlay?.classList.remove('is-open')
  overlay?.setAttribute('aria-hidden', 'true')
  overlay?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#evolution-hud')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#result-overlay')?.setAttribute('hidden', '')
  document.querySelector<HTMLElement>('#bestiary-overlay')?.setAttribute('hidden', '')
  const badge = document.querySelector<HTMLElement>('.prototype-badge')
  if (badge) badge.textContent = liveRunRequested ? '幽影林地 · Hunt & Evolve' : 'Map Lab V4 · 八大特色战斗窝点'
  const help = document.querySelector<HTMLElement>('.helpbar')
  if (help) {
    help.innerHTML = [
      !liveRunRequested || debugRequested ? '<button class="maplab-stage-button" type="button" data-exploration-action="nests" aria-pressed="false"><strong>N</strong> 窝点范围</button>' : '',
      liveRunRequested ? '' : '<button class="maplab-stage-button" type="button" data-exploration-action="spawn"><strong>S</strong> 随机出生</button>',
      liveRunRequested ? '' : '<button class="maplab-stage-button" type="button" data-exploration-action="thorn"><strong>T</strong> 切换窝点</button>',
      `<button class="maplab-stage-button" type="button" data-exploration-action="overview" aria-pressed="false"><strong>M</strong> ${liveRunRequested ? '探索地图' : '全图总览'}</button>`,
      debugRequested ? '<button class="maplab-stage-button" type="button" data-exploration-action="advance"><strong>Q</strong> QA推进</button>' : '',
      '<button class="maplab-stage-button" type="button" data-exploration-action="feedback" aria-expanded="false"><strong>F</strong> 反馈</button>',
      `<span class="maplab-camera-help"><strong>WASD</strong> 移动 · <strong>点击/Tab</strong> 锁定 · <strong>1/2/3 + Space</strong> 战斗${liveRunRequested ? ' · <strong>R</strong> 抗拒生长' : ''}</span>`,
      '<span class="divider">/</span>',
      `<span class="optional">${liveRunRequested ? '猎杀吞噬决定进化 · 清理窝点后挑战古林之心' : '8个窝点拥有独立入口、2/3波节奏、机制、核心与奖励'}</span>`,
    ].join('')
  }
  const feedbackPanel = document.createElement('section')
  feedbackPanel.className = 'combat-feedback-panel'
  feedbackPanel.dataset.combatFeedbackPanel = ''
  feedbackPanel.setAttribute('aria-label', '战斗反馈设置')
  feedbackPanel.hidden = true
  feedbackPanel.innerHTML = [
    '<header><strong>战斗反馈</strong><span>即时生效并保存在本机</span></header>',
    '<button type="button" data-feedback-setting="shake">镜头震动：开</button>',
    '<button type="button" data-feedback-setting="flash">受击闪光：开</button>',
    '<button type="button" data-feedback-setting="volume">音效音量：60%</button>',
  ].join('')
  document.querySelector('#game-container')?.append(feedbackPanel)
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#050b08',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: GloamwoodExplorationLabScene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, pixelArt: false },
  })
  const scene = () => game!.scene.getScene(GLOAMWOOD_EXPLORATION_LAYOUT.sceneKey) as GloamwoodExplorationLabScene
  if (import.meta.env.DEV || debugRequested) {
    const debugApi = {
      getState: () => scene().getDebugState(),
      teleportToFirstNest: () => scene().teleportToFirstNest(),
      teleportToNest: (id: string) => scene().teleportToNestById(id),
      teleportToHazard: (id?: string) => scene().teleportToArenaHazard(id),
      teleportToMonsterSkill: (type: string) => scene().teleportToMonsterSkill(type),
      setCombatStyle: (style: string) => scene().setCombatStyleForDebug(style),
      setPlayerHealth: (value: number) => scene().setPlayerHealthForDebug(value),
      teleportToNextNest: () => scene().teleportToNextNest(),
      advanceFirstNest: () => scene().advanceFirstNestDebug(),
      startBoss: () => scene().startBossForDebug(),
      defeatBoss: () => scene().defeatBossForDebug(),
      teleportToProp: (index = 0) => scene().teleportToEnvironmentPropForDebug(index),
    }
    ;(window as Window & { __EA_DEBUG__?: typeof debugApi }).__EA_DEBUG__ = debugApi
    if (debugRequested && debugNestId) {
      window.setTimeout(() => {
        try {
          scene().teleportToNestById(debugNestId)
          if (debugHazardId) scene().teleportToArenaHazard(debugHazardId === 'first' ? undefined : debugHazardId)
        } catch {
          // Invalid QA-only nest ids should not prevent the lab from launching.
        }
      }, 300)
      if (debugCombatStyle) {
        window.setTimeout(() => scene().setCombatStyleForDebug(debugCombatStyle), 520)
      }
      if (Number.isFinite(debugHealth) && debugHealth > 0) {
        window.setTimeout(() => scene().setPlayerHealthForDebug(debugHealth), 620)
      }
      if (debugMonsterType) {
        window.setTimeout(() => {
          try {
            scene().teleportToMonsterSkill(debugMonsterType)
          } catch {
            // QA-only monster selectors must not prevent the lab from launching.
          }
        }, 560)
      }
    }
    if (debugRequested && (debugBoss === 'start' || debugBoss === 'defeat')) {
      window.setTimeout(() => scene().startBossForDebug(), 700)
      if (debugBoss === 'defeat') window.setTimeout(() => scene().defeatBossForDebug(), 1900)
    }
    if (debugRequested && Number.isFinite(debugProp) && debugProp >= 0) {
      window.setTimeout(() => scene().teleportToEnvironmentPropForDebug(debugProp), 720)
    }
    if (debugRequested) {
      const debugOutput = document.createElement('output')
      debugOutput.id = 'debug-state'
      debugOutput.hidden = true
      document.body.append(debugOutput)
      const debugInterval = window.setInterval(() => {
        try {
          debugOutput.textContent = JSON.stringify(debugApi.getState())
        } catch {
          window.clearInterval(debugInterval)
        }
      }, 250)
    }
  }
  document.querySelector<HTMLButtonElement>('[data-exploration-action="nests"]')?.addEventListener('click', () => scene().toggleNestRanges())
  document.querySelector<HTMLButtonElement>('[data-exploration-action="spawn"]')?.addEventListener('click', () => scene().randomizeSpawn())
  document.querySelector<HTMLButtonElement>('[data-exploration-action="thorn"]')?.addEventListener('click', () => scene().teleportToNextNest())
  document.querySelector<HTMLButtonElement>('[data-exploration-action="advance"]')?.addEventListener('click', () => scene().advanceFirstNestDebug())
  document.querySelector<HTMLButtonElement>('[data-exploration-action="overview"]')?.addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement
    scene().setOverview(button.getAttribute('aria-pressed') !== 'true')
  })
  const feedbackToggle = document.querySelector<HTMLButtonElement>('[data-exploration-action="feedback"]')
  const renderFeedbackSettings = () => {
    const settings = scene().getCombatFeedbackSettings()
    const shake = feedbackPanel.querySelector<HTMLButtonElement>('[data-feedback-setting="shake"]')
    const flash = feedbackPanel.querySelector<HTMLButtonElement>('[data-feedback-setting="flash"]')
    const volume = feedbackPanel.querySelector<HTMLButtonElement>('[data-feedback-setting="volume"]')
    if (shake) shake.textContent = `镜头震动：${settings.shake ? '开' : '关'}`
    if (flash) flash.textContent = `受击闪光：${settings.flash ? '开' : '关'}`
    if (volume) volume.textContent = `音效音量：${Math.round(settings.volume * 100)}%`
  }
  feedbackToggle?.addEventListener('click', () => {
    feedbackPanel.hidden = !feedbackPanel.hidden
    feedbackToggle.setAttribute('aria-expanded', String(!feedbackPanel.hidden))
    feedbackToggle.classList.toggle('is-active', !feedbackPanel.hidden)
    if (!feedbackPanel.hidden) renderFeedbackSettings()
  })
  feedbackPanel.querySelectorAll<HTMLButtonElement>('[data-feedback-setting]').forEach((button) => {
    button.addEventListener('click', () => {
      scene().cycleCombatFeedbackSetting(button.dataset.feedbackSetting ?? '')
      renderFeedbackSettings()
    })
  })
  window.addEventListener('keydown', (event) => {
    if (!liveRunRequested && event.key.toLowerCase() === 'n') scene().toggleNestRanges()
    if (!liveRunRequested && event.key.toLowerCase() === 's') scene().randomizeSpawn()
    if (!liveRunRequested && event.key.toLowerCase() === 't') scene().teleportToNextNest()
    if (event.key.toLowerCase() === 'q' && debugRequested) scene().advanceFirstNestDebug()
    if (event.key.toLowerCase() === 'm') {
      const button = document.querySelector<HTMLButtonElement>('[data-exploration-action="overview"]')
      scene().setOverview(button?.getAttribute('aria-pressed') !== 'true')
    }
  })
}

document.querySelectorAll<HTMLButtonElement>('[data-starter]').forEach((button) => {
  button.addEventListener('click', () => {
    const starterId = button.dataset.starter
    if (isStarterVariantId(starterId)) launchRun(starterId)
  })
})

document.querySelector<HTMLButtonElement>('#random-starter')?.addEventListener('click', () => launchRun(randomStarter()))

starterKeyHandler = (event: KeyboardEvent) => {
  const index = Number(event.key) - 1
  if (index >= 0 && index < STARTER_ORDER.length) launchRun(STARTER_ORDER[index])
}
window.addEventListener('keydown', starterKeyHandler)

if (isQuality3DRequested()) {
  if (starterKeyHandler) window.removeEventListener('keydown', starterKeyHandler)
  void import('./quality-3d').then(({ launchQuality3D }) => {
    quality3DCleanup = launchQuality3D()
  })
} else if (isQualitySliceRequested()) {
  if (starterKeyHandler) window.removeEventListener('keydown', starterKeyHandler)
  launchQualitySlice()
} else if (isGloamwoodExplorationLabRequested()) {
  if (starterKeyHandler) window.removeEventListener('keydown', starterKeyHandler)
  launchGloamwoodExplorationLab()
} else if (isGloamwoodSpaceLabRequested()) {
  if (starterKeyHandler) window.removeEventListener('keydown', starterKeyHandler)
  launchGloamwoodSpaceLab()
} else if (isMapLabV2Requested()) {
  if (starterKeyHandler) window.removeEventListener('keydown', starterKeyHandler)
  launchMapLabV2()
} else if (isMapLabRequested()) {
  if (starterKeyHandler) window.removeEventListener('keydown', starterKeyHandler)
  launchLegacyMapLab()
} else {
  const requestedStarter = new URLSearchParams(window.location.search).get('starter')
  if (isMonsterNestLabRequested() || isGloamwoodHuntSliceRequested()) launchRun(isStarterVariantId(requestedStarter) ? requestedStarter : 'spine-stalker')
  else if (isStarterVariantId(requestedStarter)) launchRun(requestedStarter)
  else window.setTimeout(() => document.querySelector<HTMLButtonElement>('[data-starter]')?.focus(), 120)
}

window.addEventListener('beforeunload', () => {
  quality3DCleanup?.()
  game?.destroy(true)
})
