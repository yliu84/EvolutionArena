import Phaser from 'phaser'
import { RIFT_WARDEN, bossCooldown, bossPatternForTurn, bossPhase, type BossPattern, type BossState } from './boss'
import { COMBAT_STYLES, attackDamage, type CombatStyle } from './combat'
import {
  canFormalHuntBasicAttackContact,
  createFormalHuntBasicAttackState,
  formalHuntAttackAimErrorDegrees,
  formalHuntTargetSurfaceDistance,
  requestFormalHuntBasicAttack,
  turnFormalHuntAttackToward,
  updateFormalHuntBasicAttack,
  type FormalHuntBasicAttackAction,
  type FormalHuntBasicAttackState,
} from './formal-hunt-basic-attack'
import { updateFormalHuntHud } from './formal-hunt-hud'
import { resolveImpactFeedback, type ImpactFeedbackProfile } from './combat-impact-feedback'
import {
  enemyReadabilityState,
  floatingIncomingDamageStyle,
  floatingOutgoingDamageStyle,
  type FloatingDamageStyle,
} from './combat-readability'
import {
  canStartCombatThreat,
  combatPressureBudget,
  combatPressureUsed,
  combatThreatCost,
  combatThreatLane,
  type ActiveCombatThreat,
  type CombatPressureBlockReason,
  type CombatThreatPhase,
} from './combat-pressure-director'
import { paintAllMonsterTextures, paintBossTexture } from './creature-art'
import { eliteAffixFor } from './elite-affixes'
import { GLOAMWOOD_ARENA_FEATURES, arenaHazardPhase, gloamwoodArenaFeatures, pointInsideArenaHazard } from './gloamwood-arena-features'
import {
  gloamwoodMonsterAttackSpeed,
  gloamwoodMonsterDamage,
  gloamwoodMonsterSkill,
  type GloamwoodMonsterSkill,
} from './gloamwood-monster-skills'
import {
  MONSTER_ANIMATION_ATLASES,
  createMonsterAnimations,
  monsterAnimationForAiState,
  monsterAnimationKey,
  monsterTexture,
  monsterUsesAtlas,
} from './monster-animation'
import {
  monsterCanContactPlayer,
  monsterColliderOffset,
  monsterDisplayScale,
  monsterPhysicalProfile,
  monsterTerrainCollisionEnabled,
} from './monster-physicality'
import {
  GLOAMWOOD_EXPLORATION_LAYOUT,
  estimatedRunMinutes,
  explorationSeedFromSearch,
  pointInsideNest,
  routeLength,
  spawnPointForSeed,
  totalRouteLength,
  type MonsterNest,
} from './gloamwood-exploration-layout'
import {
  GLOAMWOOD_NEST_CONFIGS,
  canDamageGloamwoodNestCore,
  gloamwoodNest,
  gloamwoodNestColliderRect,
  gloamwoodNestConfig,
  gloamwoodNestPoint,
  gloamwoodNestWavePoints,
  phaseIntermissionIndex,
  phaseWaveIndex,
  type GloamwoodNestConfig,
  type GloamwoodNestId,
  type GloamwoodNestPhase,
} from './gloamwood-nests'
import { MONSTERS, type MonsterType } from './monsters'
import { GENE_COLORS, GENE_FAMILIES, GENE_LABELS, createSeededRandom, evolutionRequirementForStage, evolutionScaleForStage, hashSeed, type GeneFamily } from './evolution'
import { playerAnimationPose } from './player-animation'
import { evolutionVisualFamily, playerEvolutionAppearance } from './player-evolution-visual'
import { combatStyleForSpecies, quality3DAssetStageForSpecies, resolveEvolutionSpecies, speciesDebugContract } from './evolution-species'
import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'
import type { MotherMonsterHuntOverlay } from './mother-monster-hunt-overlay'
import { SCARLET_GECKO_PRESENTATION } from './scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'
import {
  bossSoulOrbDrop,
  eliteOrbBuffModifiers,
  eliteOrbBuffRemainingMs,
  formatDerivedStats,
  soulOrbDropFor,
  soulOrbTierConfig,
  type SoulOrbDrop,
} from './soul-orbs'
import {
  V4_BASE_MUTATION_STATS,
  V4_BOSS_REQUIRED_NESTS,
  V4_BOSS_REQUIRED_STAGE,
  canChallengeV4Boss,
  collectV4SoulOrb,
  createV4LiveEvolutionState,
  createV4RouteAcceptanceState,
  grantV4NestReward,
  resistV4Evolution,
  resolveV4Evolution,
  type V4LiveEvolutionState,
} from './v4-live-evolution'
import { STARTER_VARIANTS, isStarterVariantId, type StarterVariant } from './starter-variants'
import {
  V4_FOG_CELL_SIZE,
  V4_REVEAL_RADIUS,
  V4_VISION_RADIUS,
  createV4FogGrid,
  revealV4Fog,
  v4FogExploredPercent,
  type V4FogCell,
} from './v4-live-fog'
import { createV4EnvironmentProps, type V4EnvironmentProp } from './v4-environment-props'
import {
  DEFAULT_COMBAT_FEEDBACK_SETTINGS,
  cycleFeedbackVolume,
  damageDirectionDegrees,
  incomingHitKindForAttack,
  normalizeCombatFeedbackSettings,
  resolvePlayerHitFeedback,
  type CombatFeedbackSettings,
  type IncomingHitKind,
  type PlayerHitFeedbackProfile,
} from './player-hit-feedback'

const FOLLOW_ZOOM = 0.88
const ARRIVAL_RADIUS = 18
const TARGET_RADIUS = 760
const PLAYER_MAX_HEALTH = 90
const PLAYER_FEEDBACK_SETTINGS_KEY = 'evolution-arena-combat-feedback-v1'
const PLAYER_DOWNED_MS = 680
const PLAYER_REVIVE_MS = 520
const V4_FOG_REFRESH_MS = 120
const V4_ATTACKS = {
  melee: { range: 135, damage: 3, cooldownMs: 520 },
  ranged: { range: 390, damage: 1, cooldownMs: 390 },
  magic: { range: 430, damage: 2, cooldownMs: 760, radius: 112 },
} as const

const FAMILY_COLORS = {
  fang: 0xffc857,
  wing: 0x79f2a1,
  carapace: 0x65a9ff,
  swarm: 0x74e8d1,
  venom: 0xa7ef62,
  rift: 0xc887ff,
} as const

export class GloamwoodExplorationLabScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image
  private starter: StarterVariant = STARTER_VARIANTS['spine-stalker']
  private playerVisual!: Phaser.GameObjects.Graphics
  private playerAttackVisualUntil = 0
  private playerAttackVisualStyle: CombatStyle = 'ranged'
  private playerHitVisualUntil = 0
  private motherMonsterEnabled = false
  private motherMonsterOverlay?: MotherMonsterHuntOverlay
  private motherMonsterAttack: FormalHuntBasicAttackState = createFormalHuntBasicAttackState()
  private motherMonsterAimErrorDegrees = 0
  private motherMonsterLastContact?: {
    action: FormalHuntBasicAttackAction
    targetId: string | null
    hit: boolean
    reason: 'hit' | 'no-lock' | 'unavailable' | 'out-of-range' | 'off-angle'
    distance: number
    aimErrorDegrees: number
    at: number
  }
  private frameDeltaSeconds = 1 / 60
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'TAB' | 'ONE' | 'TWO' | 'THREE' | 'T' | 'R', Phaser.Input.Keyboard.Key>
  private moveTarget: Phaser.Math.Vector2 | null = null
  private nestRangeGraphics!: Phaser.GameObjects.Graphics
  private overview = false
  private showNestRanges = false
  private seed: string = GLOAMWOOD_EXPLORATION_LAYOUT.defaultSeed
  private liveRunEnabled = false
  private liveEvolution: V4LiveEvolutionState = createV4LiveEvolutionState()
  private liveRandom: () => number = createSeededRandom(1)
  private soulOrbs!: Phaser.Physics.Arcade.Group
  private lastConsumeAt = -10000
  private fogCells: V4FogCell[] = []
  private unknownFog?: Phaser.GameObjects.Graphics
  private exploredFog?: Phaser.GameObjects.Graphics
  private visionEdgeFog?: Phaser.GameObjects.Graphics
  private lastFogRefreshAt = -10000
  private environmentProps: V4EnvironmentProp[] = []
  private runStartedAt = 0
  private runOver = false
  private boss!: Phaser.Physics.Arcade.Image
  private bossWarning!: Phaser.GameObjects.Graphics
  private bossHud!: Phaser.GameObjects.Graphics
  private bossHudText!: Phaser.GameObjects.Text
  private bossActive = false
  private bossDefeated = false
  private bossHealth = RIFT_WARDEN.maxHealth
  private bossMaxHealth = RIFT_WARDEN.maxHealth
  private bossState: BossState = 'dormant'
  private bossPattern: BossPattern = 'shockwave'
  private bossStateUntil = 0
  private bossTurn = 0
  private bossAimAngle = 0
  private bossPhaseValue: 1 | 2 = 1
  private bossGateMessageAt = -10000
  private currentSpawnId = ''
  private visitedNestIds = new Set<string>()
  private terrainColliders!: Phaser.Physics.Arcade.StaticGroup
  private enemies!: Phaser.Physics.Arcade.Group
  private nestCores!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private enemyBullets!: Phaser.Physics.Arcade.Group
  private selectedTarget?: Phaser.Physics.Arcade.Image
  private combatStyle: CombatStyle = 'ranged'
  private lastAttackAt = 0
  private health = PLAYER_MAX_HEALTH
  private lastDamageAt = 0
  private invulnerableUntil = 0
  private kills = 0
  private geneRewards: Record<MonsterNest['family'], number> = { fang: 0, wing: 0, carapace: 0, swarm: 0, venom: 0, rift: 0 }
  private evolution = 0
  private activeNestId: GloamwoodNestId = 'thorn-burrow'
  private nestPhase: GloamwoodNestPhase = 'dormant'
  private nestCore!: Phaser.Physics.Arcade.Image
  private nestCoreHealth = 18
  private nestIntermissionUntil = 0
  private nestRewardGranted = false
  private nestProgress = new Map<GloamwoodNestId, { phase: GloamwoodNestPhase; coreHealth: number; rewardGranted: boolean }>()
  private nestCoreSprites = new Map<GloamwoodNestId, Phaser.Physics.Arcade.Image>()
  private nestGroundSprites = new Map<GloamwoodNestId, Phaser.GameObjects.Graphics>()
  private nestArtSprites = new Map<GloamwoodNestId, Phaser.GameObjects.Image>()
  private nestArtShadows = new Map<GloamwoodNestId, Phaser.GameObjects.Graphics>()
  private nestArenaFx!: Phaser.GameObjects.Graphics
  private arenaFeatureFx!: Phaser.GameObjects.Graphics
  private combatFx!: Phaser.GameObjects.Graphics
  private combatReadabilityFx!: Phaser.GameObjects.Graphics
  private combatStatusLabels = new Map<string, Phaser.GameObjects.Text>()
  private telegraphFx!: Phaser.GameObjects.Graphics
  private combatHud!: Phaser.GameObjects.Text
  private objectiveHud!: Phaser.GameObjects.Text
  private targetHud!: Phaser.GameObjects.Text
  private combatEventHud!: Phaser.GameObjects.Text
  private lastCombatEvent = '尚未进入怪物窝点'
  private damageNumberCount = 0
  private lastDamageNumber?: { amount: number; incoming: boolean; label: string; at: number }
  private visibleEnemyBars = 0
  private visibleCombatStatusLabels = 0
  private lastDamageSource = 'none'
  private nextMechanicAt = 0
  private mechanicActiveUntil = 0
  private mechanicDirection = 1
  private poisonUntil = 0
  private activeArenaHazardIds: string[] = []
  private arenaSlowMultiplier = 1
  private playerKnockbackUntil = 0
  private playerKnockbackVelocity = new Phaser.Math.Vector2()
  private lastThreatStartedAt = -10000
  private maxObservedConcurrentThreats = 0
  private blockedThreatStarts = 0
  private blockedThreatReasons: Partial<Record<CombatPressureBlockReason, number>> = {}
  private hitStopUntil = 0
  private hitStopTimer?: Phaser.Time.TimerEvent
  private impactAudioContext?: AudioContext
  private lastImpactToneAt = 0
  private totalPlayerImpacts = 0
  private killingPlayerImpacts = 0
  private lastPlayerImpact?: {
    targetId: string
    type: MonsterType
    style: CombatStyle
    weight: ImpactFeedbackProfile['weight']
    killed: boolean
    hitStopMs: number
    knockback: number
    at: number
  }
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private feedbackSettings: CombatFeedbackSettings = { ...DEFAULT_COMBAT_FEEDBACK_SETTINGS }
  private playerState: 'active' | 'downed' | 'reviving' = 'active'
  private playerDownedUntil = 0
  private playerReviveUntil = 0
  private respawnCount = 0
  private incomingHitCount = 0
  private lastIncomingHit?: {
    source: string
    kind: IncomingHitKind
    damage: number
    lethal: boolean
    directionDegrees: number | null
    at: number
  }

  constructor() {
    super(GLOAMWOOD_EXPLORATION_LAYOUT.sceneKey)
    try {
      this.feedbackSettings = normalizeCombatFeedbackSettings(JSON.parse(localStorage.getItem(PLAYER_FEEDBACK_SETTINGS_KEY) ?? 'null'))
    } catch {
      this.feedbackSettings = { ...DEFAULT_COMBAT_FEEDBACK_SETTINGS }
    }
  }

  preload() {
    this.load.image('gloamwood-v4-live-ground', '/assets/map-lab-v4/gloamwood-v4-live-ground-v1.png')
    this.load.image('gloamwood-live-broadleaf', '/assets/hunt-slice/gloamwood-broadleaf-v1.png')
    this.load.image('gloamwood-live-conifer', '/assets/hunt-slice/gloamwood-conifer-v1.png')
    for (const config of GLOAMWOOD_NEST_CONFIGS) this.load.image(config.art.key, config.art.path)
    for (const atlas of Object.values(MONSTER_ANIMATION_ATLASES)) {
      this.load.spritesheet(atlas.key, atlas.path, {
        frameWidth: atlas.frameWidth,
        frameHeight: atlas.frameHeight,
      })
    }
  }

  create() {
    this.seed = explorationSeedFromSearch()
    this.runStartedAt = this.time.now
    this.liveRunEnabled = new URLSearchParams(window.location.search).get('live') === '1'
    this.motherMonsterEnabled = this.liveRunEnabled
      && new URLSearchParams(window.location.search).get('mother') === '1'
    const requestedStarter = new URLSearchParams(window.location.search).get('starter')
    this.starter = STARTER_VARIANTS[isStarterVariantId(requestedStarter) ? requestedStarter : 'spine-stalker']
    this.combatStyle = this.starter.startingStyle
    if (this.motherMonsterEnabled) this.combatStyle = 'melee'
    this.liveEvolution = createV4LiveEvolutionState({
      ...V4_BASE_MUTATION_STATS,
      playerSpeed: this.starter.speed,
      maxHealth: this.starter.maxHealth,
      health: this.starter.maxHealth,
      defenseReduction: this.starter.defenseReduction,
      meleeDamageBonus: this.starter.id === 'claw-hunter' ? 2 : V4_BASE_MUTATION_STATS.meleeDamageBonus,
      shotCooldown: Math.round(COMBAT_STYLES.ranged.cooldownMs * this.starter.cooldownMultiplier.ranged),
      magicRadius: Math.round(V4_BASE_MUTATION_STATS.magicRadius * this.starter.magicRadiusMultiplier),
    })
    const search = new URLSearchParams(window.location.search)
    const acceptanceRoute = search.get('evolutionRoute')
    const acceptanceSecondary = search.get('evolutionSecondary')
    const acceptanceStage = Number(search.get('evolutionStage'))
    const route = GENE_FAMILIES.includes(acceptanceRoute as GeneFamily) ? acceptanceRoute as GeneFamily : null
    const secondary = GENE_FAMILIES.includes(acceptanceSecondary as GeneFamily) ? acceptanceSecondary as GeneFamily : undefined
    if (this.liveRunEnabled && search.get('debug') === '1'
      && route
      && acceptanceStage >= 1 && acceptanceStage <= 6) {
      this.liveEvolution = createV4RouteAcceptanceState(route, this.liveEvolution.stats, acceptanceStage, secondary)
      const acceptanceSpecies = this.resolvedEvolutionSpecies()
      if (this.motherMonsterEnabled && quality3DAssetStageForSpecies(acceptanceSpecies, acceptanceStage) === null) {
        this.motherMonsterEnabled = false
      }
      this.combatStyle = this.motherMonsterEnabled ? 'melee' : combatStyleForSpecies(acceptanceSpecies.definition)
    }
    this.health = this.liveEvolution.stats.health
    this.liveRandom = createSeededRandom(hashSeed(`${this.seed}:v4-live`))
    const { width, height } = GLOAMWOOD_EXPLORATION_LAYOUT.world
    this.physics.world.setBounds(0, 0, width, height)
    this.cameras.main.setBounds(0, 0, width, height).setBackgroundColor('#050b08')
    this.createLabTextures()
    createMonsterAnimations(this)
    this.terrainColliders = this.physics.add.staticGroup()
    this.drawExplorationSkeleton()

    const spawn = spawnPointForSeed(this.seed)
    this.currentSpawnId = spawn.id
    this.player = this.physics.add.image(spawn.x, spawn.y, 'exploration-lab-player')
    this.player.setOrigin(0.5, 0.72).setCircle(21.5, 26.5, 47.5).setScale(1.12).setAlpha(0).setCollideWorldBounds(true).setDepth(30)
    this.playerVisual = this.add.graphics().setDepth(36)
    this.enemies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite, maxSize: 16 })
    this.nestCores = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: GLOAMWOOD_NEST_CONFIGS.length })
    this.bullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 32 })
    this.enemyBullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 24 })
    this.soulOrbs = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 64 })
    const bossLair = GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
    this.boss = this.physics.add.image(bossLair.x, bossLair.y, 'boss-rift-warden')
      .setOrigin(0.5, 0.72)
      .setCircle(54)
      .setScale(1.15)
      .setDepth(34)
      .setData('targetId', 'rift-warden')
      .setData('hurtRadius', 68)
    this.boss.disableBody(true, true)
    this.bossWarning = this.add.graphics().setDepth(43)
    if (this.liveRunEnabled) this.createLiveFog()
    this.createNestGameplay()
    this.nestRangeGraphics = this.add.graphics().setDepth(18)
    this.combatFx = this.add.graphics().setDepth(42)
    this.combatReadabilityFx = this.add.graphics().setDepth(44)
    this.telegraphFx = this.add.graphics().setDepth(41)
    this.physics.add.collider(this.player, this.terrainColliders)
    this.physics.add.collider(this.enemies, this.terrainColliders, undefined, (enemyObject) => {
      const enemy = enemyObject as Phaser.Physics.Arcade.Image
      const type = enemy.getData('type') as MonsterType | undefined
      if (!type) return true
      return monsterTerrainCollisionEnabled(type, (enemy.getData('flightHeight') as number) || 0)
    }, this)
    this.physics.add.overlap(this.player, this.enemies, this.damagePlayer, undefined, this)
    this.physics.add.overlap(this.bullets, this.enemies, this.hitNestEnemy, undefined, this)
    this.physics.add.overlap(this.bullets, this.nestCores, this.hitNestCore, undefined, this)
    this.physics.add.overlap(this.bullets, this.boss, this.hitV4Boss, undefined, this)
    this.physics.add.overlap(this.player, this.boss, this.damagePlayerFromV4Boss, undefined, this)
    this.physics.add.overlap(this.player, this.enemyBullets, this.damagePlayerFromEnemyProjectile, undefined, this)
    this.physics.add.overlap(this.player, this.soulOrbs, this.collectLiveSoulOrb, undefined, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.physics.world.resume()
      void this.impactAudioContext?.close()
      this.motherMonsterOverlay?.dispose()
      this.motherMonsterOverlay = undefined
    })

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      TAB: Phaser.Input.Keyboard.KeyCodes.TAB,
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
      T: Phaser.Input.Keyboard.KeyCodes.T,
      R: Phaser.Input.Keyboard.KeyCodes.R,
    }) as typeof this.keys
    this.input.keyboard!.addCapture('TAB')
    this.keys.SPACE.on('down', () => {
      if (this.motherMonsterEnabled) this.requestMotherMonsterAttack(this.time.now)
    })
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.overview || !pointer.leftButtonDown()) return
      this.ensureImpactAudio()
      const target = this.pickTarget(pointer.worldX, pointer.worldY)
      if (target) {
        this.selectedTarget = target
        this.moveTarget = null
        if (!this.motherMonsterEnabled) this.attackSelectedTarget()
        return
      }
      this.selectedTarget = undefined
      this.moveTarget = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
    })
    this.input.keyboard!.once('keydown', () => this.ensureImpactAudio())
    this.createCombatHud()
    this.createBossHud()
    this.setOverview(false)
    this.updateNestRanges()
    this.nestRangeGraphics.setVisible(false)
    if (this.motherMonsterEnabled) {
      const container = document.querySelector<HTMLElement>('#game-container')
      if (container) {
        void import('./mother-monster-hunt-overlay').then(async ({ MotherMonsterHuntOverlay }) => {
          if (!this.scene.isActive() || !this.motherMonsterEnabled) return
          const overlayStage = this.currentQuality3DAssetStage()
          if (overlayStage === null) {
            this.lastCombatEvent = '当前随机路线使用程序化模块形态 · 普攻规则保持不变'
            return
          }
          const overlay = new MotherMonsterHuntOverlay(container, this.game.canvas, overlayStage)
          this.motherMonsterOverlay = overlay
          try {
            await overlay.load()
            this.lastCombatEvent = '母怪物GLB已接入 · 点击或Tab锁定后按Space普攻'
          } catch (error) {
            console.error('Formal hunt mother-monster GLB failed to load', error)
            this.lastCombatEvent = '母怪物GLB加载失败 · 已保留程序化角色回退'
          }
        })
      }
    }
  }

  update(time: number, delta = 1000 / 60) {
    if (this.runOver) return
    this.frameDeltaSeconds = Math.min(0.05, Math.max(0, delta / 1000))
    const x = Number(this.cursors.right.isDown || this.keys.D.isDown) - Number(this.cursors.left.isDown || this.keys.A.isDown)
    const y = Number(this.cursors.down.isDown || this.keys.S.isDown) - Number(this.cursors.up.isDown || this.keys.W.isDown)
    if (this.playerState !== 'active' || (this.motherMonsterEnabled && this.motherMonsterAttack.action)) {
      this.player.setVelocity(0)
      this.moveTarget = null
    } else if (time < this.playerKnockbackUntil) {
      this.player.setVelocity(this.playerKnockbackVelocity.x, this.playerKnockbackVelocity.y)
      this.moveTarget = null
    } else if (x !== 0 || y !== 0) {
      const direction = new Phaser.Math.Vector2(x, y).normalize().scale(this.currentPlayerSpeed())
      this.player.setVelocity(direction.x, direction.y)
      this.moveTarget = null
    } else if (this.moveTarget) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y)
      if (distance <= ARRIVAL_RADIUS) {
        this.player.setVelocity(0)
        this.moveTarget = null
      } else {
        this.physics.moveTo(this.player, this.moveTarget.x, this.moveTarget.y, this.currentPlayerSpeed())
      }
    } else {
      this.player.setVelocity(0)
    }
    for (const nest of GLOAMWOOD_EXPLORATION_LAYOUT.nests) {
      if (pointInsideNest(this.player.x, this.player.y, nest)) this.visitedNestIds.add(nest.id)
    }
    this.updateNestPresentationVisibility()
    if (!this.motherMonsterEnabled && Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.combatStyle = 'melee'
    if (!this.motherMonsterEnabled && Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.combatStyle = 'ranged'
    if (!this.motherMonsterEnabled && Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.combatStyle = 'magic'
    if (Phaser.Input.Keyboard.JustDown(this.keys.TAB)) this.cycleTarget()
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      if (!this.motherMonsterEnabled) this.attackSelectedTarget()
    }
    if (!this.liveRunEnabled && Phaser.Input.Keyboard.JustDown(this.keys.T)) this.teleportToNextNest()
    if (this.liveRunEnabled && Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.resistFormalEvolution()
    }
    if (this.liveRunEnabled) this.updateLiveEvolution(time)
    if (this.liveRunEnabled && time - this.lastFogRefreshAt >= V4_FOG_REFRESH_MS) {
      this.refreshLiveFog()
      this.lastFogRefreshAt = time
    }
    this.updateNestCombat(time)
    this.updateArenaHazards(time)
    this.updateNestMechanic(time)
    this.updateNestEnemies(time)
    if (this.liveRunEnabled) {
      this.updateBossGate(time)
      if (this.bossActive && !this.bossDefeated) this.updateV4Boss(time)
    }
    this.updateBullets(time)
    if (this.motherMonsterEnabled) this.updateMotherMonsterAttack(time, this.frameDeltaSeconds)
    if (this.motherMonsterOverlay) {
      const desiredStage = this.currentQuality3DAssetStage()
      if (desiredStage !== null && this.motherMonsterOverlay.getState().stage !== desiredStage) {
        void this.motherMonsterOverlay.setStage(desiredStage).catch((error) => {
          console.error('Formal hunt evolution GLB failed to load', error)
        })
      }
    }
    this.renderV4Player(time)
    this.renderCombatState(time)
  }

  private currentPlayerSpeed() {
    const base = this.liveRunEnabled
      ? this.liveEvolution.stats.playerSpeed
      : GLOAMWOOD_EXPLORATION_LAYOUT.playerSpeed
    return Math.round(base * this.arenaSlowMultiplier * eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, this.time.now).speedMultiplier)
  }

  private resolvedEvolutionSpecies() {
    return resolveEvolutionSpecies(
      this.liveEvolution.evolutionStage,
      this.liveEvolution.genes,
      this.liveEvolution.recentHunts,
      this.liveEvolution.mutationRanks,
      this.liveEvolution.evolutionChain,
      this.liveEvolution.apexSpeciesId,
    )
  }

  private currentQuality3DAssetStage() {
    return quality3DAssetStageForSpecies(this.resolvedEvolutionSpecies(), this.liveEvolution.evolutionStage)
  }

  private currentMaxHealth() {
    return this.liveRunEnabled ? this.liveEvolution.stats.maxHealth : PLAYER_MAX_HEALTH
  }

  private updateLiveEvolution(time: number) {
    const resolution = resolveV4Evolution({
      ...this.liveEvolution,
      stats: { ...this.liveEvolution.stats, health: this.health },
    }, time, this.kills, this.liveRandom)
    this.liveEvolution = resolution.state
    this.evolution = this.liveEvolution.evolution
    if (!resolution.evolved) return
    this.health = Math.min(this.currentMaxHealth(), this.liveEvolution.stats.health)
    const resolvedSpecies = this.resolvedEvolutionSpecies()
    const assetStage = this.currentQuality3DAssetStage()
    if (this.motherMonsterEnabled && assetStage === null) {
      this.motherMonsterEnabled = false
      this.motherMonsterOverlay?.dispose()
      this.motherMonsterOverlay = undefined
    }
    this.combatStyle = this.motherMonsterEnabled ? 'melee' : combatStyleForSpecies(resolvedSpecies.definition)
    this.lastCombatEvent = `${resolution.evolved.name} → ${resolvedSpecies.formName} · ${resolvedSpecies.definition.passive}`
    this.invulnerableUntil = Math.max(this.invulnerableUntil, time + 900)
    this.cameras.main.flash(160, 121, 242, 161, false)
    this.tweens.add({
      targets: this.player,
      scaleX: 1.28,
      scaleY: 1.28,
      duration: 260,
      yoyo: true,
      ease: 'Back.Out',
      onComplete: () => this.player.setScale(1.12),
    })
  }

  private createLiveFog() {
    const { width, height } = GLOAMWOOD_EXPLORATION_LAYOUT.world
    this.fogCells = createV4FogGrid(width, height)
    this.unknownFog = this.add.graphics().setDepth(80)
    this.exploredFog = this.add.graphics().setDepth(81)
    this.visionEdgeFog = this.add.graphics().setDepth(82)
    this.refreshLiveFog()
  }

  private refreshLiveFog() {
    revealV4Fog(this.fogCells, this.player.x, this.player.y, V4_REVEAL_RADIUS)
    const visionSquared = V4_VISION_RADIUS * V4_VISION_RADIUS
    const revealSquared = V4_REVEAL_RADIUS * V4_REVEAL_RADIUS
    this.unknownFog?.clear().fillStyle(0x020705, 0.88)
    this.exploredFog?.clear().fillStyle(0x06110c, 0.38)
    this.visionEdgeFog?.clear().fillStyle(0x07140e, 0.16)
    for (const cell of this.fogCells) {
      const dx = cell.centerX - this.player.x
      const dy = cell.centerY - this.player.y
      const distanceSquared = dx * dx + dy * dy
      if (distanceSquared <= visionSquared) continue
      const target = !cell.explored
        ? this.unknownFog
        : distanceSquared <= revealSquared
          ? this.visionEdgeFog
          : this.exploredFog
      target?.fillRect(cell.x, cell.y, V4_FOG_CELL_SIZE + 1, V4_FOG_CELL_SIZE + 1)
    }
  }

  private createBossHud() {
    this.bossHud = this.add.graphics().setScrollFactor(0).setDepth(121).setVisible(false)
    this.bossHudText = this.add.text(640, 650, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ffe2cb',
      stroke: '#16060c', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(122).setVisible(false)
    if (this.liveRunEnabled) {
      this.bossHud.setVisible(false)
      this.bossHudText.setVisible(false)
    }
  }

  private clearedNestCount() {
    return [...this.nestProgress.values()].filter((progress) => progress.phase === 'cleared').length
  }

  private canChallengeV4Boss() {
    return canChallengeV4Boss(this.clearedNestCount(), this.liveEvolution.evolutionStage)
  }

  private updateBossGate(time: number) {
    if (this.bossActive || this.bossDefeated) return
    const lair = GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, lair.x, lair.y)
    if (distance > lair.radius - 110) return
    if (this.canChallengeV4Boss()) {
      this.startV4BossFight()
      return
    }
    if (time - this.bossGateMessageAt < 2200) return
    this.bossGateMessageAt = time
    this.lastCombatEvent = `古林之心仍在沉睡 · 需要 ${V4_BOSS_REQUIRED_NESTS} 个窝点与第 ${V4_BOSS_REQUIRED_STAGE} 次进化`
  }

  private startV4BossFight() {
    if (!this.canChallengeV4Boss() || this.bossActive || this.bossDefeated) return
    const lair = GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
    this.clearActiveEnemiesAndProjectiles()
    this.bossActive = true
    this.bossMaxHealth = RIFT_WARDEN.maxHealth + Math.max(0, this.liveEvolution.evolutionStage - V4_BOSS_REQUIRED_STAGE) * 12
    this.bossHealth = this.bossMaxHealth
    this.bossState = 'recover'
    this.bossStateUntil = this.time.now + 1100
    this.bossTurn = 0
    this.bossPhaseValue = 1
    this.health = this.currentMaxHealth()
    this.player.setPosition(lair.x - 520, lair.y).setVelocity(0)
    this.moveTarget = null
    this.selectedTarget = this.boss
    this.boss.enableBody(true, lair.x, lair.y, true, true)
      .setScale(1.15)
      .setAlpha(0)
      .setAngle(-28)
      .clearTint()
    revealV4Fog(this.fogCells, lair.x, lair.y, lair.radius + 260)
    this.refreshLiveFog()
    this.tweens.add({ targets: this.boss, alpha: 1, angle: 0, duration: 650, ease: 'Cubic.Out' })
    this.cameras.main.flash(380, 112, 25, 53, false)
    this.cameras.main.shake(280, 0.009)
    this.lastCombatEvent = `${RIFT_WARDEN.name}苏醒 · 观察地面预警后闪避`
    this.renderV4BossHud()
  }

  private updateV4Boss(time: number) {
    this.boss.setDepth(34 + Math.round(this.boss.y / 1000))
    const nextPhase = bossPhase(this.bossHealth, this.bossMaxHealth)
    if (nextPhase !== this.bossPhaseValue) {
      this.bossPhaseValue = nextPhase
      this.bossState = 'recover'
      this.bossStateUntil = time + 900
      this.boss.setVelocity(0).setTintFill(0xff7a4d).setScale(1.28)
      this.bossWarning.clear()
      this.cameras.main.flash(220, 255, 91, 55, false)
      this.cameras.main.shake(260, 0.01)
      this.lastCombatEvent = '裂隙暴走 · 第二阶段攻势加快'
    }
    if (this.bossState === 'recover') {
      this.boss.setVelocity(0)
      if (time >= this.bossStateUntil) this.beginV4BossTelegraph(time)
    } else if (this.bossState === 'telegraph' && time >= this.bossStateUntil) {
      this.executeV4BossPattern(time)
    } else if (this.bossState === 'attack' && time >= this.bossStateUntil) {
      this.bossState = 'recover'
      this.bossStateUntil = time + RIFT_WARDEN.patterns[this.bossPattern].recoveryMs + bossCooldown(this.bossPhaseValue)
      this.boss.setVelocity(0).clearTint().setScale(1.15)
      this.bossWarning.clear()
    }
    this.renderV4BossHud()
  }

  private beginV4BossTelegraph(time: number) {
    this.bossPattern = bossPatternForTurn(this.bossTurn, this.bossPhaseValue)
    this.bossTurn += 1
    this.bossState = 'telegraph'
    this.bossAimAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y)
    this.bossStateUntil = time + RIFT_WARDEN.patterns[this.bossPattern].telegraphMs
    this.boss.setVelocity(0).setTintFill(0xffd36e).setScale(1.55)
    this.bossWarning.clear()
    if (this.bossPattern === 'shockwave') {
      this.bossWarning.lineStyle(10, 0xff6f61, 0.92).strokeCircle(this.boss.x, this.boss.y, 280)
      this.bossWarning.lineStyle(3, 0xffd36e, 0.85).strokeCircle(this.boss.x, this.boss.y, 225)
    } else if (this.bossPattern === 'ember-volley') {
      this.bossWarning.lineStyle(6, 0xcf6cff, 0.86)
      for (let offset = -0.42; offset <= 0.42; offset += 0.14) {
        this.bossWarning.lineBetween(this.boss.x, this.boss.y, this.boss.x + Math.cos(this.bossAimAngle + offset) * 680, this.boss.y + Math.sin(this.bossAimAngle + offset) * 680)
      }
    } else {
      this.bossWarning.lineStyle(20, 0xff9b55, 0.55).lineBetween(
        this.boss.x, this.boss.y,
        this.boss.x + Math.cos(this.bossAimAngle) * 760,
        this.boss.y + Math.sin(this.bossAimAngle) * 760,
      )
    }
  }

  private executeV4BossPattern(time: number) {
    const pattern = RIFT_WARDEN.patterns[this.bossPattern]
    this.bossState = 'attack'
    this.bossStateUntil = time + pattern.activeMs
    this.boss.clearTint().setScale(1.4)
    if (this.bossPattern === 'shockwave') {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y) <= 280) {
        this.applyNestPlayerDamage(pattern.damage, '裂隙震波', 'area', this.boss.x, this.boss.y)
      }
      this.bossWarning.clear().fillStyle(0xff624f, 0.34).fillCircle(this.boss.x, this.boss.y, 280)
    } else if (this.bossPattern === 'ember-volley') {
      this.bossWarning.clear()
      const count = this.bossPhaseValue === 1 ? 5 : 7
      for (let index = 0; index < count; index += 1) {
        const spread = (index - (count - 1) / 2) * 0.13
        this.fireV4BossProjectile(this.bossAimAngle + spread, pattern.damage)
      }
    } else {
      this.bossWarning.clear()
      this.boss.setVelocity(Math.cos(this.bossAimAngle) * 760, Math.sin(this.bossAimAngle) * 760)
    }
  }

  private fireV4BossProjectile(angle: number, damage: number) {
    const projectile = this.enemyBullets.get(this.boss.x, this.boss.y, 'v4-enemy-bullet') as Phaser.Physics.Arcade.Image
    if (!projectile) return
    projectile.enableBody(true, this.boss.x, this.boss.y, true, true)
      .setTint(0xff7a9f)
      .setScale(1.45)
      .setData('damage', damage)
      .setData('source', '裂隙守望者·余烬弹幕')
      .setData('attackKind', 'projectile')
      .setData('bossProjectile', true)
      .setData('expiresAt', this.time.now + 2600)
      .setDepth(42)
    projectile.setVelocity(Math.cos(angle) * 410, Math.sin(angle) * 410)
  }

  private damagePlayerFromV4Boss() {
    if (!this.bossActive || this.bossState !== 'attack' || this.bossPattern !== 'rift-charge') return
    this.applyNestPlayerDamage(RIFT_WARDEN.patterns['rift-charge'].damage, '裂隙冲锋', 'contact', this.boss.x, this.boss.y)
  }

  private renderV4BossHud() {
    if (this.liveRunEnabled) return
    if (!this.bossActive || this.bossDefeated) {
      this.bossHud?.setVisible(false)
      this.bossHudText?.setVisible(false)
      return
    }
    const width = 500
    const ratio = Math.max(0, this.bossHealth / this.bossMaxHealth)
    this.bossHud.setVisible(true).clear()
      .fillStyle(0x090407, 0.92).fillRoundedRect(390, 682, width, 18, 7)
      .fillStyle(this.bossPhaseValue === 1 ? 0xd85e88 : 0xff7a4d, 1).fillRoundedRect(394, 686, (width - 8) * ratio, 10, 5)
    this.bossHudText.setVisible(true).setText(`${RIFT_WARDEN.name} · 阶段 ${this.bossPhaseValue} · ${this.bossHealth}/${this.bossMaxHealth}`)
  }

  private renderV4Player(time: number) {
    const graphics = this.playerVisual
    graphics.clear()
    if (!this.player?.active) return
    const velocity = this.player.body?.velocity
    if (velocity && velocity.lengthSq() > 80) this.player.setRotation(Math.atan2(velocity.y, velocity.x))
    if (this.motherMonsterEnabled && this.motherMonsterOverlay && this.currentQuality3DAssetStage() !== null) {
      const camera = this.cameras.main
      const overlayAction = this.playerState === 'downed'
        ? 'Death'
        : this.motherMonsterAttack.action
          ?? (time < this.playerHitVisualUntil ? 'Hit' : null)
      this.motherMonsterOverlay.update({
        screenX: (this.player.x - camera.worldView.x) * camera.zoom,
        screenY: (this.player.y - camera.worldView.y) * camera.zoom,
        facingRadians: this.player.rotation,
        moving: Boolean(velocity && velocity.lengthSq() > 80) && !this.motherMonsterAttack.action,
        visible: !this.overview && this.player.visible,
        action: overlayAction,
        deltaSeconds: this.frameDeltaSeconds,
      })
      if (this.motherMonsterOverlay.getState().ready) return
    }
    const attackStyle = time < this.playerAttackVisualUntil ? this.playerAttackVisualStyle : null
    const pose = playerAnimationPose({
      now: time,
      runOver: this.runOver,
      health: this.health,
      movementState: time < this.playerHitVisualUntil ? 'hitstun' : 'normal',
      movementRemainingMs: Math.max(0, this.playerHitVisualUntil - time),
      speed: velocity?.length() ?? 0,
      attackStyle,
      attackWindupRemainingMs: 0,
      attackRecoverRemainingMs: Math.max(0, this.playerAttackVisualUntil - time),
      consumeRemainingMs: Math.max(0, this.lastConsumeAt + 460 - time),
    })
    const species = this.resolvedEvolutionSpecies()
    const route = species.primaryFamily ?? evolutionVisualFamily(this.liveEvolution.evolutionChain, this.liveEvolution.genes, this.liveEvolution.recentHunts)
    const appearance = playerEvolutionAppearance(this.liveEvolution.evolutionStage, route, this.liveEvolution.mutationRanks, species.secondaryFamily)
    const scale = evolutionScaleForStage(this.liveEvolution.evolutionStage) * 1.28
    const angle = this.player.rotation
    const x = this.player.x + Math.cos(angle) * pose.forwardOffset * scale
    const y = this.player.y - 24 * scale + Math.sin(angle) * pose.forwardOffset * scale + pose.bob * scale
    const bodyColor = route ? GENE_COLORS[route] : this.starter.primaryColor
    const darkColor = route === 'carapace' ? 0x17375e : route === 'rift' ? 0x291542 : route === 'venom' ? 0x365d28 : this.starter.secondaryColor
    const pulse = 1 + Math.sin(time / 180) * (appearance.apex ? 0.05 : 0.022)
    const bodyLength = appearance.bodyLength * pulse
    const bodyWidth = appearance.bodyWidth * pulse
    const point = (forward: number, side: number) => ({
      x: x + Math.cos(angle) * forward * pose.forwardScale * scale + Math.cos(angle + Math.PI / 2) * side * pose.sideScale * scale,
      y: y + Math.sin(angle) * forward * pose.forwardScale * scale + Math.sin(angle + Math.PI / 2) * side * pose.sideScale * scale,
    })

    graphics.setAlpha(pose.alpha)
    graphics.fillStyle(0x010302, 0.5).fillEllipse(this.player.x + 4, this.player.y + 9, bodyLength * 1.5 * scale, bodyWidth * 0.62 * scale)

    if (appearance.wingPairCount > 0) {
      for (let pair = 0; pair < appearance.wingPairCount; pair += 1) {
        for (const side of [-1, 1]) {
          const root = point(4 - pair * 10, side * bodyWidth * 0.28)
          const tip = point(-2 - pair * 8, side * (bodyWidth * 0.55 + appearance.wingSpan * (1 - pair * 0.25)))
          const rear = point(-bodyLength * 0.42, side * (bodyWidth * 0.48 + appearance.wingSpan * 0.48))
          graphics.fillStyle(pair === 0 ? 0x79f2a1 : 0xc5ffda, pair === 0 ? 0.48 : 0.3).fillTriangle(root.x, root.y, tip.x, tip.y, rear.x, rear.y)
          graphics.lineStyle(1.5 * scale, 0xe4ffed, 0.65).lineBetween(root.x, root.y, tip.x, tip.y)
        }
      }
    }

    const tailBase = point(-bodyLength * 0.38, 0)
    const tailTip = point(-bodyLength * 0.52 - appearance.tailLength, appearance.venomNeedleLength > 0 ? Math.sin(time / 180) * 3 : 0)
    graphics.lineStyle(Math.max(5, appearance.limbThickness * 1.25) * scale, darkColor, 1).lineBetween(tailBase.x, tailBase.y, tailTip.x, tailTip.y)
    if (appearance.venomNeedleLength > 0) {
      const needleTip = point(-bodyLength * 0.58 - appearance.tailLength - appearance.venomNeedleLength, 0)
      graphics.lineStyle(4 * scale, 0xe8ffb8, 0.98).lineBetween(tailTip.x, tailTip.y, needleTip.x, needleTip.y)
      graphics.fillStyle(GENE_COLORS.venom, 0.96).fillCircle(tailTip.x, tailTip.y, appearance.venomGlandRadius * scale)
    }

    const drawLeg = (forward: number, side: number) => {
      const stride = pose.limbSweep * 8 * side
      const root = point(forward, side * bodyWidth * 0.3)
      const joint = point(forward - 1 + stride * 0.4, side * (bodyWidth * 0.55 + appearance.limbReach * 0.3))
      const tip = point(forward + appearance.limbReach * 0.22 + stride, side * (bodyWidth * 0.58 + appearance.limbReach * 0.66))
      graphics.lineStyle(appearance.limbThickness * scale, darkColor, 1).lineBetween(root.x, root.y, joint.x, joint.y)
      graphics.lineStyle(Math.max(2, appearance.limbThickness * 0.58) * scale, bodyColor, 1).lineBetween(joint.x, joint.y, tip.x, tip.y)
    }
    for (const forward of [-bodyLength * 0.23, bodyLength * 0.12]) {
      drawLeg(forward, -1)
      drawLeg(forward, 1)
    }

    const nose = point(bodyLength * 0.54, 0)
    const right = point(0, bodyWidth * 0.5)
    const rear = point(-bodyLength * 0.5, 0)
    const left = point(0, -bodyWidth * 0.5)
    graphics.fillStyle(darkColor, 1).fillPoints([
      { x: nose.x + 4, y: nose.y + 5 }, { x: right.x + 4, y: right.y + 5 },
      { x: rear.x + 4, y: rear.y + 5 }, { x: left.x + 4, y: left.y + 5 },
    ], true)
    graphics.fillStyle(bodyColor, 1).fillPoints([nose, right, rear, left], true)
    const abdomen = point(-bodyLength * 0.2, 0)
    const thorax = point(bodyLength * 0.18, 0)
    graphics.fillStyle(darkColor, 1).fillCircle(abdomen.x + 3, abdomen.y + 4, bodyWidth * 0.46 * scale)
    graphics.fillStyle(bodyColor, 1).fillCircle(abdomen.x, abdomen.y, bodyWidth * 0.46 * scale)
    graphics.fillStyle(bodyColor, 1).fillCircle(thorax.x, thorax.y, bodyWidth * 0.37 * scale)

    if (appearance.armorPlateCount > 0) {
      for (let index = 0; index < appearance.armorPlateCount; index += 1) {
        const progress = (index + 1) / (appearance.armorPlateCount + 1)
        const center = point(-bodyLength * 0.36 + bodyLength * 0.7 * progress, 0)
        graphics.fillStyle(index % 2 ? 0x315f98 : 0x4d82bd, 0.94)
          .fillEllipse(center.x, center.y, 11 * appearance.armorBulk * scale, bodyWidth * 0.9 * scale)
        graphics.lineStyle(1.5 * scale, 0xc4e6ff, 0.65).strokeEllipse(center.x, center.y, 11 * appearance.armorBulk * scale, bodyWidth * 0.9 * scale)
      }
    }

    for (let index = 0; index < appearance.dorsalSpikes; index += 1) {
      const progress = appearance.dorsalSpikes <= 1 ? 0.5 : index / (appearance.dorsalSpikes - 1)
      const forward = -bodyLength * 0.3 + bodyLength * 0.55 * progress
      const baseA = point(forward - 4, -bodyWidth * 0.34)
      const baseB = point(forward + 4, -bodyWidth * 0.34)
      const tip = point(forward, -bodyWidth * 0.66)
      graphics.fillStyle(route === 'fang' ? 0xffe09a : bodyColor, 0.96).fillTriangle(baseA.x, baseA.y, baseB.x, baseB.y, tip.x, tip.y)
    }

    const head = point(bodyLength * 0.48 - pose.headDip, 0)
    graphics.fillStyle(darkColor, 1).fillCircle(head.x + 3, head.y + 4, appearance.headRadius * scale)
    graphics.fillStyle(bodyColor, 1).fillCircle(head.x, head.y, appearance.headRadius * scale)
    const eye = point(bodyLength * 0.56, -appearance.headRadius * 0.4)
    graphics.fillStyle(0xfff0ae, 1).fillCircle(eye.x, eye.y, 2.8 * scale)
    graphics.fillStyle(0x07100b, 1).fillCircle(eye.x + Math.cos(angle) * scale, eye.y + Math.sin(angle) * scale, 1.3 * scale)

    if (appearance.visibleTraits.includes('獠牙利爪')) {
      for (const side of [-1, 1]) {
        const clawRoot = point(bodyLength * 0.2, side * bodyWidth * 0.34)
        const clawTip = point(bodyLength * 0.72 + appearance.fangLength, side * (bodyWidth * 0.62 + appearance.limbReach * 0.34))
        graphics.lineStyle(5 * scale, 0xb86a35, 1).lineBetween(clawRoot.x, clawRoot.y, clawTip.x, clawTip.y)
        graphics.fillStyle(0xffedbf, 0.98).fillCircle(clawTip.x, clawTip.y, 3.2 * scale)
      }
    }
    if (appearance.riftCoreRadius > 0) {
      const core = point(0, 0)
      graphics.fillStyle(0x25113c, 0.98).fillCircle(core.x, core.y, appearance.riftCoreRadius * 1.45 * scale)
      graphics.lineStyle(3 * scale, GENE_COLORS.rift, 0.9).strokeCircle(core.x, core.y, appearance.riftCoreRadius * (1 + Math.sin(time / 110) * 0.12) * scale)
      for (let index = 0; index < appearance.riftOrbCount; index += 1) {
        const orbit = time / 420 + index / appearance.riftOrbCount * Math.PI * 2
        graphics.fillStyle(0xe0b0ff, 0.92).fillCircle(core.x + Math.cos(orbit) * 24 * scale, core.y + Math.sin(orbit) * 13 * scale, 3.2 * scale)
      }
    }
    if (appearance.broodCount > 0) {
      for (let index = 0; index < appearance.broodCount; index += 1) {
        const orbit = -time / 620 + index / appearance.broodCount * Math.PI * 2
        graphics.fillStyle(index % 2 ? 0x63d8c0 : 0xc6fff0, 0.96)
          .fillCircle(this.player.x + Math.cos(orbit) * 42 * scale, y + Math.sin(orbit) * 22 * scale, 3.4 * scale)
      }
    }

    if (appearance.apex) {
      graphics.lineStyle(3 * scale, bodyColor, 0.48 + Math.sin(time / 120) * 0.16)
        .strokeEllipse(this.player.x, y, (bodyLength + 25) * scale, (bodyWidth + 23) * scale)
    }
    graphics.setDepth(35 + this.player.y / 100)
  }

  private createNestGameplay() {
    this.nestArenaFx = this.add.graphics().setDepth(17)
    this.arenaFeatureFx = this.add.graphics().setDepth(22)
    for (const config of GLOAMWOOD_NEST_CONFIGS) {
      const core = gloamwoodNestPoint(config.id, config.core)
      const coreSprite = this.nestCores.get(core.x, core.y, 'v4-thorn-core') as Phaser.Physics.Arcade.Image
      coreSprite.enableBody(true, core.x, core.y, true, true)
        .setOrigin(0.5, 0.64)
        .setCircle(45)
        .setScale(config.id === 'drowned-queen' || config.id === 'black-cocoon' ? 1.28 : 1.12)
        .setTint(config.palette.glow)
        .setDepth(24)
        .setData('targetId', config.id)
        .setData('nestId', config.id)
      this.nestCoreSprites.set(config.id, coreSprite)
      this.nestProgress.set(config.id, { phase: 'dormant', coreHealth: config.coreMaxHealth, rewardGranted: false })
    }
    this.setActiveNest('thorn-burrow')
  }

  private updateArenaHazards(time: number) {
    this.activeArenaHazardIds = []
    this.arenaSlowMultiplier = 1
    if (phaseWaveIndex(this.nestPhase) < 0) return
    const nest = gloamwoodNest(this.activeNestId)
    const localX = this.player.x - nest.x
    const localY = this.player.y - nest.y
    for (const hazard of GLOAMWOOD_ARENA_FEATURES[this.activeNestId].hazards) {
      if (arenaHazardPhase(hazard, time) !== 'active' || !pointInsideArenaHazard(localX, localY, hazard)) continue
      this.activeArenaHazardIds.push(hazard.id)
      if (hazard.effect === 'slow') {
        this.arenaSlowMultiplier = Math.min(this.arenaSlowMultiplier, hazard.slowMultiplier ?? 1)
      } else {
        this.applyNestPlayerDamage(hazard.damage ?? 2, hazard.label, 'environment')
      }
    }
    if (this.arenaSlowMultiplier < 1) {
      this.player.setVelocity(
        this.player.body!.velocity.x * this.arenaSlowMultiplier,
        this.player.body!.velocity.y * this.arenaSlowMultiplier,
      )
    }
  }

  private updateNestPresentationVisibility() {
    const combatLocked = this.nestPhase !== 'dormant' && this.nestPhase !== 'cleared'
    const nearestNestId = GLOAMWOOD_NEST_CONFIGS
      .map((config) => {
        const nest = gloamwoodNest(config.id)
        return { id: config.id, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, nest.x, nest.y) }
      })
      .sort((a, b) => a.distance - b.distance)[0]?.id
    for (const config of GLOAMWOOD_NEST_CONFIGS) {
      const nest = gloamwoodNest(config.id)
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, nest.x, nest.y)
      const visible = this.overview || (combatLocked
        ? config.id === this.activeNestId
        : config.id === nearestNestId && distance <= config.combatRadius + 460)
      const closeEnoughForLiveDetail = combatLocked
        ? config.id === this.activeNestId
        : distance <= config.triggerRadius + 80
      const showInteractiveNestLayer = visible
        && (!this.liveRunEnabled || (!this.overview && closeEnoughForLiveDetail))
      this.nestGroundSprites.get(config.id)?.setVisible(visible && !this.liveRunEnabled)
      this.nestArtSprites.get(config.id)?.setVisible(showInteractiveNestLayer)
      // The V4 master ground already carries soft ambient occlusion beneath each
      // arena. Re-applying the old oversized lab shadow made every nest look like
      // a black debug disc, especially in the full-map overview.
      this.nestArtShadows.get(config.id)?.setVisible(showInteractiveNestLayer && !this.liveRunEnabled)
      this.nestCoreSprites.get(config.id)?.setVisible(showInteractiveNestLayer)
    }
  }

  private createCombatHud() {
    const compactLandscape = window.innerHeight < 600 && window.innerWidth > window.innerHeight
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'system-ui, sans-serif', fontSize: compactLandscape ? '21px' : '16px', color: '#e8f4ea',
      backgroundColor: '#030805dd', padding: { x: 12, y: 8 },
    }
    this.combatHud = this.add.text(18, 18, '', textStyle).setScrollFactor(0).setDepth(120)
    this.objectiveHud = this.add.text(640, 18, '', {
      ...textStyle, fontSize: compactLandscape ? '23px' : '17px', color: '#ffd68a', fontStyle: 'bold',
    })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(120)
    this.targetHud = this.add.text(640, compactLandscape ? 68 : 58, '', {
      ...textStyle, fontSize: compactLandscape ? '20px' : '15px', color: '#cde8d5',
    })
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(120)
    this.combatEventHud = this.add.text(640, compactLandscape ? 122 : 96, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: compactLandscape ? '17px' : '12px', color: '#9fb8aa',
      backgroundColor: '#030805bb', padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(120)
    if (this.liveRunEnabled) {
      this.combatHud.setVisible(false)
      this.objectiveHud.setVisible(false)
      this.targetHud.setVisible(false)
      this.combatEventHud.setVisible(false)
    }
  }

  private setActiveNest(id: GloamwoodNestId) {
    if (this.activeNestId && this.nestProgress.has(this.activeNestId)) {
      this.nestProgress.set(this.activeNestId, {
        phase: this.nestPhase,
        coreHealth: this.nestCoreHealth,
        rewardGranted: this.nestRewardGranted,
      })
    }
    this.activeNestId = id
    const config = gloamwoodNestConfig(id)
    const progress = this.nestProgress.get(id) ?? { phase: 'dormant' as const, coreHealth: config.coreMaxHealth, rewardGranted: false }
    this.nestPhase = progress.phase
    this.nestCoreHealth = progress.coreHealth
    this.nestRewardGranted = progress.rewardGranted
    this.nestCore = this.nestCoreSprites.get(id)!
    this.nextMechanicAt = this.time.now + 1800
    this.mechanicActiveUntil = 0
    this.poisonUntil = 0
    this.resetCombatPressureTelemetry()
    this.lastCombatEvent = `${config.name} · ${config.subtitle}`
  }

  private resetCombatPressureTelemetry() {
    this.lastThreatStartedAt = -10000
    this.maxObservedConcurrentThreats = 0
    this.blockedThreatStarts = 0
    this.blockedThreatReasons = {}
  }

  private clearActiveEnemiesAndProjectiles() {
    for (const child of this.enemies.getChildren()) {
      const enemy = child as Phaser.Physics.Arcade.Image
      if (!enemy.active) continue
      ;(enemy.getData('groundShadow') as Phaser.GameObjects.Ellipse | undefined)?.destroy()
      enemy.setData('groundShadow', undefined).disableBody(true, true)
    }
    this.bullets.children.iterate((child) => {
      const bullet = child as Phaser.Physics.Arcade.Image
      if (bullet.active) bullet.disableBody(true, true)
      return true
    })
    this.enemyBullets.children.iterate((child) => {
      const bullet = child as Phaser.Physics.Arcade.Image
      if (bullet.active) bullet.disableBody(true, true)
      return true
    })
    this.selectedTarget = undefined
  }

  private teleportToNest(id: GloamwoodNestId) {
    if (id !== this.activeNestId) {
      this.clearActiveEnemiesAndProjectiles()
      this.setActiveNest(id)
    }
    const config = gloamwoodNestConfig(id)
    const entrance = gloamwoodNestPoint(id, config.entrance)
    const inward = new Phaser.Math.Vector2(config.entrance.offsetX, config.entrance.offsetY).normalize().scale(-180)
    this.player.setPosition(entrance.x + inward.x, entrance.y + inward.y).setVelocity(0)
    this.moveTarget = null
    this.setOverview(false)
    this.cameras.main.centerOn(this.player.x, this.player.y)
  }

  private activeNestEnemies() {
    return this.enemies.getChildren()
      .map((child) => child as Phaser.Physics.Arcade.Image)
      .filter((enemy) => enemy.active && (enemy.getData('hp') as number) > 0)
  }

  private activeCombatThreats(): ActiveCombatThreat[] {
    return this.activeNestEnemies().flatMap((enemy) => {
      const phase = enemy.getData('aiState') as string
      if (phase !== 'telegraph' && phase !== 'attack' && phase !== 'brace') return []
      const type = enemy.getData('type') as MonsterType
      return [{
        id: this.targetId(enemy) ?? type,
        lane: combatThreatLane(MONSTERS[type].attackKind),
        phase: phase as CombatThreatPhase,
        elite: Boolean(enemy.getData('elite')),
      }]
    })
  }

  private spawnNestWave(waveIndex: number) {
    const config = gloamwoodNestConfig(this.activeNestId)
    const waveNumber = waveIndex + 1
    this.nestPhase = `wave-${waveNumber}`
    for (const spawn of gloamwoodNestWavePoints(config.id, waveIndex)) {
      const definition = MONSTERS[spawn.type]
      const texture = monsterTexture(spawn.type, definition.texture)
      const enemy = this.enemies.get(spawn.x, spawn.y, texture) as Phaser.Physics.Arcade.Sprite
      if (!enemy) continue
      const mechanicHealth = config.mechanic === 'bulwark' ? 1.3 : config.mechanic === 'queen' ? 1.15 : 1
      const waveHealth = 1 + waveIndex * 0.16
      const maxHp = Math.ceil(definition.health * mechanicHealth * waveHealth * (spawn.elite ? 1.7 : 1))
      const animated = monsterUsesAtlas(spawn.type)
      const physical = monsterPhysicalProfile(spawn.type)
      const normalScale = monsterDisplayScale(spawn.type, Boolean(spawn.elite))
      const spawnDelay = waveIndex > 0 ? Math.random() * 180 : Math.random() * 100
      enemy.enableBody(true, spawn.x, spawn.y, true, true)
        .setTexture(texture, animated ? 0 : undefined)
        .setOrigin(0.5, 0.68)
        .setScale(0.18)
        .setAlpha(0)
        .setTint(spawn.elite ? 0xffc66b : 0xffffff)
        .setData('targetId', spawn.id)
        .setData('type', spawn.type)
        .setData('hp', maxHp)
        .setData('maxHp', maxHp)
        .setData('elite', spawn.elite)
        .setData('eliteAffix', spawn.elite ? eliteAffixFor(this.seed, spawn.id) : null)
        .setData('nextHitAt', 0)
        .setData('homeX', spawn.x)
        .setData('homeY', spawn.y)
        .setData('normalScale', normalScale)
        .setData('aiState', 'pursue')
        .setData('stateUntil', 0)
        .setData('skillId', gloamwoodMonsterSkill(spawn.type).id)
        .setData('attackAngle', 0)
        .setData('attackTargetX', spawn.x)
        .setData('attackTargetY', spawn.y)
        .setData('attackHit', false)
        .setData('hitAnimationUntil', 0)
        .setData('fedUntil', 0)
        .setData('shotAnimationUntil', 0)
        .setData('locomotion', physical.locomotion)
        .setData('flightHeight', physical.hoverHeight)
        .setData('nextAfterimageAt', 0)
        .setData('nextAttackAt', this.time.now + (config.mechanic === 'cocoon' ? 620 : 900) + Math.random() * 500)
        .setData('spawnReadyAt', this.time.now + spawnDelay + 360)
        .setDepth(26)
      if (animated) {
        const colliderOffset = monsterColliderOffset(spawn.type, 313)
        enemy.setCircle(
          physical.colliderRadius,
          colliderOffset.x,
          colliderOffset.y,
        )
        enemy.setRotation(0)
        enemy.play(monsterAnimationKey(spawn.type, 'idle')!)
      } else {
        const colliderOffset = monsterColliderOffset(spawn.type, 96)
        enemy.setCircle(physical.colliderRadius, colliderOffset.x, colliderOffset.y)
      }
      if (animated || physical.locomotion === 'flying') {
        const flying = physical.locomotion === 'flying'
        enemy.setData('groundShadow', this.add.ellipse(
          spawn.x,
          spawn.y + (flying ? 28 : 14),
          physical.shadowWidth,
          physical.shadowHeight,
          0x010302,
          flying ? 0.36 : 0.58,
        ).setDepth(25))
      }
      this.showSpawnRift(spawn.x, spawn.y, Boolean(spawn.elite))
      this.tweens.add({
        targets: enemy,
        scale: normalScale,
        alpha: 1,
        duration: 360,
        delay: spawnDelay,
        ease: 'Back.Out',
      })
    }
    if (waveIndex > 0) {
      this.cameras.main.shake(260, 0.006)
      this.cameras.main.flash(100, (config.palette.glow >> 16) & 0xff, (config.palette.glow >> 8) & 0xff, config.palette.glow & 0xff, false)
      const art = this.nestArtSprites.get(config.id)!
      const baseScaleX = art.scaleX
      const baseScaleY = art.scaleY
      this.tweens.add({
        targets: art,
        scaleX: baseScaleX * 1.025,
        scaleY: baseScaleY * 1.025,
        duration: 120,
        yoyo: true,
        ease: 'Sine.InOut',
      })
    }
    this.lastCombatEvent = `${config.name}第 ${waveNumber} 波守卫苏醒 · ${config.subtitle}`
  }

  private showSpawnRift(x: number, y: number, elite: boolean) {
    const rift = this.add.graphics({ x, y }).setDepth(25).setBlendMode(Phaser.BlendModes.ADD)
    rift.fillStyle(elite ? 0xff7c45 : 0xffb34f, 0.18).fillEllipse(0, 12, elite ? 128 : 96, elite ? 72 : 54)
    rift.lineStyle(elite ? 7 : 4, elite ? 0xffd073 : 0xff9a4a, 0.92).strokeEllipse(0, 12, elite ? 104 : 78, elite ? 58 : 44)
    for (let index = 0; index < 6; index += 1) {
      const angle = index / 6 * Math.PI * 2
      rift.lineStyle(3, 0xffd58a, 0.75).lineBetween(
        Math.cos(angle) * 18,
        12 + Math.sin(angle) * 12,
        Math.cos(angle) * (elite ? 64 : 48),
        12 + Math.sin(angle) * (elite ? 38 : 30),
      )
    }
    this.tweens.add({
      targets: rift,
      alpha: 0,
      scaleX: 1.42,
      scaleY: 1.25,
      duration: 520,
      ease: 'Cubic.Out',
      onComplete: () => rift.destroy(),
    })
  }

  private showImpactBurst(x: number, y: number, color: number, large = false) {
    const burst = this.add.graphics({ x, y }).setDepth(44).setBlendMode(Phaser.BlendModes.ADD)
    const radius = large ? 62 : 28
    burst.fillStyle(color, large ? 0.22 : 0.3).fillCircle(0, 0, radius * 0.65)
    burst.lineStyle(large ? 8 : 4, color, 0.95).strokeCircle(0, 0, radius)
    for (let index = 0; index < (large ? 12 : 7); index += 1) {
      const angle = index / (large ? 12 : 7) * Math.PI * 2
      burst.lineStyle(large ? 5 : 3, 0xffe2a3, 0.88).lineBetween(
        Math.cos(angle) * radius * 0.35,
        Math.sin(angle) * radius * 0.35,
        Math.cos(angle) * radius * 1.45,
        Math.sin(angle) * radius * 1.45,
      )
    }
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: large ? 1.85 : 1.5,
      duration: large ? 520 : 220,
      ease: 'Cubic.Out',
      onComplete: () => burst.destroy(),
    })
  }

  private ensureImpactAudio() {
    try {
      this.impactAudioContext ??= new AudioContext()
      if (this.impactAudioContext.state === 'suspended') void this.impactAudioContext.resume()
    } catch {
      // Combat remains fully playable when Web Audio is unavailable or blocked.
    }
  }

  private applyHitStop(durationMs: number) {
    const adjustedDuration = this.reducedMotion ? Math.round(durationMs * 0.58) : durationMs
    this.hitStopUntil = Math.max(this.hitStopUntil, this.time.now + adjustedDuration)
    this.physics.world.pause()
    this.hitStopTimer?.remove(false)
    this.hitStopTimer = this.time.delayedCall(Math.max(1, this.hitStopUntil - this.time.now), () => {
      this.physics.world.resume()
      this.hitStopTimer = undefined
    })
  }

  private playImpactTone(profile: ImpactFeedbackProfile) {
    const context = this.impactAudioContext
    if (!context || context.state !== 'running' || this.feedbackSettings.volume === 0 || this.time.now - this.lastImpactToneAt < 38) return
    this.lastImpactToneAt = this.time.now
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    const duration = profile.toneDurationMs / 1000
    oscillator.type = profile.style === 'melee' ? 'square' : profile.style === 'magic' ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(profile.toneHz, now)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(42, profile.toneHz * 0.52), now + duration)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime((profile.killed ? 0.075 : 0.045) * this.feedbackSettings.volume, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.01)
  }

  private applyPlayerImpactFeedback(
    enemy: Phaser.Physics.Arcade.Image,
    profile: ImpactFeedbackProfile,
    sourceX: number,
    sourceY: number,
  ) {
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, enemy.x, enemy.y)
    enemy.setData('playerRecoilUntil', this.time.now + profile.recoilMs)
      .setData('playerRecoilVelocityX', Math.cos(angle) * profile.knockback)
      .setData('playerRecoilVelocityY', Math.sin(angle) * profile.knockback)
    this.applyHitStop(profile.hitStopMs)
    this.showImpactBurst(enemy.x, enemy.y - 8, profile.style === 'magic' ? 0xc889ff : profile.style === 'ranged' ? 0x88e9ff : 0xffc55d, profile.killed)
    this.showDirectionalPlayerImpact(enemy.x, enemy.y - 8, angle, profile)
    if (profile.killed) this.showMonsterDeathFragments(enemy, profile)
    if (!this.reducedMotion) this.cameras.main.shake(profile.shakeDurationMs, profile.shakeIntensity)
    this.playImpactTone(profile)
    this.totalPlayerImpacts += 1
    this.lastPlayerImpact = {
      targetId: this.targetId(enemy) ?? enemy.getData('type') as string,
      type: enemy.getData('type') as MonsterType,
      style: profile.style,
      weight: profile.weight,
      killed: profile.killed,
      hitStopMs: profile.hitStopMs,
      knockback: profile.knockback,
      at: this.time.now,
    }
    if (profile.killed) this.killingPlayerImpacts += 1
  }

  private showDirectionalPlayerImpact(
    x: number,
    y: number,
    angle: number,
    profile: ImpactFeedbackProfile,
  ) {
    const impact = this.add.graphics({ x, y }).setDepth(46).setBlendMode(Phaser.BlendModes.ADD).setRotation(angle)
    if (profile.style === 'melee') {
      impact.lineStyle(8, 0xfff1bf, 0.96).beginPath().arc(0, 0, 42, -0.95, 0.95).strokePath()
      impact.lineStyle(3, 0xff9b45, 0.85).lineBetween(-18, 0, 54, 0)
    } else if (profile.style === 'ranged') {
      impact.fillStyle(0xe6fbff, 0.96).fillTriangle(-26, -7, 34, 0, -26, 7)
      impact.lineStyle(3, 0x73ddff, 0.9).strokeEllipse(4, 0, 64, 24)
    } else {
      impact.lineStyle(7, 0xe0b0ff, 0.9).strokeCircle(0, 0, 30)
      impact.lineStyle(3, 0xffffff, 0.92).strokeCircle(0, 0, 48)
      for (let index = 0; index < 6; index += 1) {
        const runeAngle = index / 6 * Math.PI * 2
        impact.lineBetween(Math.cos(runeAngle) * 22, Math.sin(runeAngle) * 22, Math.cos(runeAngle) * 55, Math.sin(runeAngle) * 55)
      }
    }
    impact.setScale(profile.burstScale)
    this.tweens.add({
      targets: impact,
      alpha: 0,
      scaleX: profile.burstScale * 1.46,
      scaleY: profile.burstScale * 1.46,
      duration: profile.killed ? 360 : 180,
      ease: 'Cubic.Out',
      onComplete: () => impact.destroy(),
    })
  }

  private showMonsterDeathFragments(enemy: Phaser.Physics.Arcade.Image, profile: ImpactFeedbackProfile) {
    const type = enemy.getData('type') as MonsterType
    const color = FAMILY_COLORS[MONSTERS[type].gene]
    const fragments = this.add.graphics({ x: enemy.x, y: enemy.y - 4 }).setDepth(45)
    const count = profile.weight === 'heavy' ? 14 : profile.weight === 'medium' ? 11 : 8
    for (let index = 0; index < count; index += 1) {
      const angle = index / count * Math.PI * 2 + (index % 2) * 0.12
      const distance = 28 + (index % 4) * 11
      const size = profile.weight === 'heavy' ? 7 : 5
      fragments.fillStyle(index % 3 === 0 ? 0xffe2a3 : color, 0.92).fillTriangle(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance * 0.62 - size,
        Math.cos(angle) * distance - size,
        Math.sin(angle) * distance * 0.62 + size,
        Math.cos(angle) * distance + size,
        Math.sin(angle) * distance * 0.62 + size,
      )
    }
    this.tweens.add({
      targets: fragments,
      y: fragments.y + (profile.weight === 'heavy' ? 38 : 24),
      alpha: 0,
      scale: profile.weight === 'heavy' ? 1.42 : 1.24,
      duration: profile.weight === 'heavy' ? 540 : 390,
      ease: 'Quad.Out',
      onComplete: () => fragments.destroy(),
    })
  }

  private showShellbackSlam(enemy: Phaser.Physics.Arcade.Image, color: number, radius: number) {
    const shockwave = this.add.ellipse(enemy.x, enemy.y + 16, radius * 1.5, radius * 0.58, color, 0.16)
      .setStrokeStyle(7, 0xd7ecff, 0.88)
      .setDepth(43)
    const debris = this.add.graphics({ x: enemy.x, y: enemy.y + 12 }).setDepth(44)
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2
      const distance = 34 + (index % 3) * 13
      const size = 4 + (index % 2) * 3
      debris.fillStyle(index % 3 === 0 ? 0xc4d7df : 0x775c42, 0.9)
        .fillTriangle(
          Math.cos(angle) * distance,
          Math.sin(angle) * distance * 0.45 - size,
          Math.cos(angle) * distance - size,
          Math.sin(angle) * distance * 0.45 + size,
          Math.cos(angle) * distance + size,
          Math.sin(angle) * distance * 0.45 + size,
        )
    }
    this.tweens.add({
      targets: shockwave,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.42,
      duration: 430,
      ease: 'Cubic.Out',
      onComplete: () => shockwave.destroy(),
    })
    this.tweens.add({
      targets: debris,
      alpha: 0,
      y: debris.y + 32,
      scale: 1.35,
      duration: 520,
      ease: 'Quad.Out',
      onComplete: () => debris.destroy(),
    })
  }

  private showBloodDrainPulse(enemy: Phaser.Physics.Arcade.Image) {
    const tether = this.add.graphics().setDepth(45).setBlendMode(Phaser.BlendModes.ADD)
    tether.lineStyle(8, 0xff315c, 0.82).lineBetween(this.player.x, this.player.y, enemy.x, enemy.y)
    tether.lineStyle(3, 0xffd0be, 0.94).lineBetween(this.player.x, this.player.y, enemy.x, enemy.y)
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y)
    for (let index = 0; index < 4; index += 1) {
      const distance = 22 + index * 24
      const mote = this.add.circle(
        this.player.x + Math.cos(angle) * distance,
        this.player.y + Math.sin(angle) * distance,
        7 - index * 0.7,
        index % 2 === 0 ? 0xff4568 : 0xffc1a8,
        0.94,
      ).setDepth(46).setBlendMode(Phaser.BlendModes.ADD)
      this.tweens.add({
        targets: mote,
        x: enemy.x,
        y: enemy.y,
        alpha: 0.16,
        scale: 0.45,
        delay: index * 38,
        duration: 220,
        ease: 'Cubic.In',
        onComplete: () => mote.destroy(),
      })
    }
    const normalScale = enemy.getData('normalScale') as number
    this.tweens.add({
      targets: enemy,
      scaleX: normalScale * 1.12,
      scaleY: normalScale * 1.08,
      duration: 120,
      yoyo: true,
      ease: 'Sine.InOut',
    })
    this.tweens.add({
      targets: tether,
      alpha: 0,
      duration: 330,
      ease: 'Quad.Out',
      onComplete: () => tether.destroy(),
    })
  }

  private showSpitterDischarge(enemy: Phaser.Physics.Arcade.Image, angle: number) {
    const muzzleX = enemy.x + Math.cos(angle) * 54
    const muzzleY = enemy.y + Math.sin(angle) * 54
    const discharge = this.add.graphics({ x: muzzleX, y: muzzleY }).setDepth(46).setBlendMode(Phaser.BlendModes.ADD)
    discharge.fillStyle(0xe9ffff, 0.96).fillCircle(0, 0, 15)
    discharge.lineStyle(7, 0x69eaff, 0.9).strokeCircle(0, 0, 27)
    for (let branch = -1; branch <= 1; branch += 1) {
      const branchAngle = angle + branch * 0.2
      discharge.lineStyle(branch === 0 ? 6 : 3, branch === 0 ? 0xc8fbff : 0x4ebcff, 0.9)
        .lineBetween(0, 0, Math.cos(branchAngle) * (66 + Math.abs(branch) * 15), Math.sin(branchAngle) * (66 + Math.abs(branch) * 15))
    }
    const normalScale = enemy.getData('normalScale') as number
    this.tweens.add({
      targets: enemy,
      scaleX: normalScale * 0.94,
      scaleY: normalScale * 1.06,
      duration: 80,
      yoyo: true,
      ease: 'Quad.Out',
    })
    this.tweens.add({
      targets: discharge,
      alpha: 0,
      scale: 1.45,
      duration: 230,
      ease: 'Cubic.Out',
      onComplete: () => discharge.destroy(),
    })
    this.cameras.main.shake(90, 0.0025)
  }

  private showRiftweaverFan(enemy: Phaser.Physics.Arcade.Image, angle: number) {
    const fan = this.add.graphics({ x: enemy.x, y: enemy.y }).setDepth(46).setBlendMode(Phaser.BlendModes.ADD)
    fan.fillStyle(0xe4a3ff, 0.74).fillCircle(0, 0, 24)
    for (const offset of [-0.24, 0, 0.24]) {
      const bladeAngle = angle + offset
      fan.lineStyle(9, offset === 0 ? 0xf2c5ff : 0xad56ff, 0.86)
        .lineBetween(
          Math.cos(bladeAngle) * 18,
          Math.sin(bladeAngle) * 18,
          Math.cos(bladeAngle) * 112,
          Math.sin(bladeAngle) * 112,
        )
    }
    this.tweens.add({
      targets: fan,
      alpha: 0,
      scale: 1.28,
      duration: 300,
      ease: 'Cubic.Out',
      onComplete: () => fan.destroy(),
    })
    this.cameras.main.shake(110, 0.003)
  }

  private updateNestCombat(time: number) {
    if (this.nestPhase === 'dormant' || this.nestPhase === 'cleared') {
      const entered = GLOAMWOOD_NEST_CONFIGS
        .map((config) => {
          const nest = gloamwoodNest(config.id)
          return { config, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, nest.x, nest.y) }
        })
        .filter(({ config, distance }) => this.nestProgress.get(config.id)?.phase !== 'cleared' && distance <= config.triggerRadius)
        .sort((a, b) => a.distance - b.distance)[0]?.config
      if (entered && entered.id !== this.activeNestId) {
        this.clearActiveEnemiesAndProjectiles()
        this.setActiveNest(entered.id)
      }
    }
    const config = gloamwoodNestConfig(this.activeNestId)
    const nest = gloamwoodNest(this.activeNestId)
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, nest.x, nest.y)
    if (this.nestPhase === 'dormant' && distance <= config.triggerRadius) {
      this.spawnNestWave(0)
    } else if (phaseWaveIndex(this.nestPhase) >= 0 && this.activeNestEnemies().length === 0) {
      const completedWaveIndex = phaseWaveIndex(this.nestPhase)
      if (completedWaveIndex + 1 < config.waves.length) {
        this.nestPhase = `intermission-${completedWaveIndex + 1}`
        this.nestIntermissionUntil = time + config.intermissionMs
        this.lastCombatEvent = `第 ${completedWaveIndex + 1} 波清除 · ${config.name}正在改变战场节奏`
      } else {
        this.nestPhase = 'core-vulnerable'
        this.nestCore.setTint(config.palette.glow).setAlpha(1)
        this.showImpactBurst(this.nestCore.x, this.nestCore.y - 10, config.palette.glow, true)
        this.cameras.main.shake(320, 0.008)
        this.lastCombatEvent = `${config.waves.length} 波守卫全灭 · ${config.name}核心已经暴露`
      }
    } else if (phaseIntermissionIndex(this.nestPhase) >= 0 && time >= this.nestIntermissionUntil) {
      this.spawnNestWave(phaseIntermissionIndex(this.nestPhase) + 1)
    }
    if (this.selectedTarget && !this.isTargetAvailable(this.selectedTarget)) this.selectedTarget = undefined
  }

  private updateNestEnemies(time: number) {
    const config = gloamwoodNestConfig(this.activeNestId)
    const nest = gloamwoodNest(this.activeNestId)
    this.telegraphFx.clear()
    this.maxObservedConcurrentThreats = Math.max(this.maxObservedConcurrentThreats, this.activeCombatThreats().length)
    for (const enemy of this.activeNestEnemies()) {
      if (time < (enemy.getData('spawnReadyAt') as number || 0)) {
        enemy.setVelocity(0)
        continue
      }
      const type = enemy.getData('type') as MonsterType
      const definition = MONSTERS[type]
      const skill = gloamwoodMonsterSkill(type)
      const playerDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y)
      const nestDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, nest.x, nest.y)
      const ranged = definition.attackKind === 'projectile' || definition.attackKind === 'spread'
      const state = enemy.getData('aiState') as 'pursue' | 'telegraph' | 'attack' | 'brace' | 'recover'
      const flightHeight = this.updateMonsterAltitude(enemy, type, state, time, definition)
      if (state === 'telegraph') {
        enemy.setVelocity(0)
        const progress = 1 - Math.max(0, (enemy.getData('stateUntil') as number) - time) / definition.telegraphMs
        this.renderMonsterAttackTelegraph(enemy, definition, skill, progress, config)
        if (time >= (enemy.getData('stateUntil') as number)) {
          if (ranged) {
            this.fireNestEnemyProjectile(enemy, definition)
            this.enterNestEnemyRecovery(enemy, time, definition)
          } else if (definition.attackKind === 'brace') {
            enemy.setData('aiState', 'brace').setData('stateUntil', time + definition.activeMs).setData('attackHit', false)
            this.lastCombatEvent = `${definition.name}发动${skill.label} · ${skill.dangerHint}`
          } else {
            enemy.setData('aiState', 'attack').setData('stateUntil', time + definition.activeMs).setData('attackHit', false)
            const speed = gloamwoodMonsterAttackSpeed(type)
            const angle = enemy.getData('attackAngle') as number
            enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
            this.lastCombatEvent = `${definition.name}发动${skill.label} · ${skill.dangerHint}`
          }
        }
      } else if (state === 'attack') {
        const angle = enemy.getData('attackAngle') as number
        const speed = gloamwoodMonsterAttackSpeed(type)
        enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
        this.telegraphFx.lineStyle(9, config.palette.glow, 0.32).lineBetween(
          enemy.x - Math.cos(angle) * 72,
          enemy.y - Math.sin(angle) * 72,
          enemy.x,
          enemy.y,
        )
        if (!enemy.getData('attackHit')
          && playerDistance <= skill.impactRadius + 24
          && monsterCanContactPlayer(type, flightHeight, 'attack')) {
          this.applyMonsterSkillHit(enemy, definition, skill)
        }
        if (type === 'bloodleech' && enemy.getData('attackHit')) {
          const pulse = 0.52 + Math.sin(time * 0.045) * 0.18
          this.telegraphFx.lineStyle(6, 0xff315c, pulse).lineBetween(enemy.x, enemy.y, this.player.x, this.player.y)
        }
        if (type === 'razorwing' && time >= (enemy.getData('nextAfterimageAt') as number || 0)) {
          enemy.setData('nextAfterimageAt', time + 48)
          this.showRazorwingAfterimage(enemy)
        }
        if (time >= (enemy.getData('stateUntil') as number)) this.enterNestEnemyRecovery(enemy, time, definition)
      } else if (state === 'brace') {
        enemy.setVelocity(0)
        const activeProgress = 1 - Math.max(0, (enemy.getData('stateUntil') as number) - time) / definition.activeMs
        this.telegraphFx.lineStyle(8, config.palette.glow, 0.76 - activeProgress * 0.35)
          .strokeCircle(enemy.x, enemy.y, skill.impactRadius * (0.82 + activeProgress * 0.22))
        if (!enemy.getData('attackHit')) {
          if (playerDistance <= skill.impactRadius) this.applyMonsterSkillHit(enemy, definition, skill)
          enemy.setData('attackHit', true)
          this.showImpactBurst(enemy.x, enemy.y, config.palette.glow, true)
          if (type === 'shellback') this.showShellbackSlam(enemy, config.palette.glow, skill.impactRadius)
          this.cameras.main.shake(type === 'shellback' ? 240 : 180, type === 'shellback' ? 0.008 : 0.006)
        }
        if (time >= (enemy.getData('stateUntil') as number)) this.enterNestEnemyRecovery(enemy, time, definition)
      } else if (state === 'recover') {
        enemy.setVelocity(0)
        const rangedPresentation = (type === 'spitter' || type === 'riftweaver')
          && time < (enemy.getData('shotAnimationUntil') as number)
        enemy.setAlpha(rangedPresentation ? 1 : 0.72)
        if (time >= (enemy.getData('stateUntil') as number)) enemy.setData('aiState', 'pursue').setAlpha(1)
      } else {
        const inAttackRange = playerDistance <= definition.preferredMaxRange + (ranged ? 80 : 0)
        if (inAttackRange && time >= (enemy.getData('nextAttackAt') as number)) {
          const pressureDecision = canStartCombatThreat({
            now: time,
            lastThreatStartedAt: this.lastThreatStartedAt,
            playerHealthRatio: this.health / this.currentMaxHealth(),
            candidate: {
              id: this.targetId(enemy) ?? type,
              lane: combatThreatLane(definition.attackKind),
              elite: Boolean(enemy.getData('elite')),
            },
            activeThreats: this.activeCombatThreats(),
          })
          if (!pressureDecision.allowed) {
            enemy.setVelocity(0)
            enemy.setData('nextAttackAt', time + pressureDecision.retryAfterMs)
            this.blockedThreatStarts += 1
            this.blockedThreatReasons[pressureDecision.reason] = (this.blockedThreatReasons[pressureDecision.reason] ?? 0) + 1
          } else {
            const attackAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
            const travel = Math.min(playerDistance, definition.preferredMaxRange)
            this.lastThreatStartedAt = time
            enemy.setVelocity(0)
              .setData('aiState', 'telegraph')
              .setData('stateUntil', time + definition.telegraphMs)
              .setData(
                'nextAttackAt',
                time + definition.telegraphMs + definition.activeMs + definition.recoveryMs
                  + Math.max(240, definition.cooldownMs * (config.mechanic === 'cocoon' ? 0.18 : 0.24)),
              )
              .setData('attackAngle', attackAngle)
              .setData('attackTargetX', enemy.x + Math.cos(attackAngle) * travel)
              .setData('attackTargetY', enemy.y + Math.sin(attackAngle) * travel)
              .setData('attackHit', false)
            this.lastCombatEvent = `${definition.name}预警：${skill.label} · ${skill.dangerHint}`
          }
        } else if (ranged && inAttackRange) {
          if (playerDistance < definition.preferredMinRange) {
            const angleAway = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y)
            enemy.setVelocity(Math.cos(angleAway) * 92, Math.sin(angleAway) * 92)
          } else enemy.setVelocity(0)
        } else if (playerDistance <= Math.min(560, config.combatRadius * 0.9) && nestDistance <= config.combatRadius + 90) {
          const speedMultiplier = config.mechanic === 'gust' || config.mechanic === 'cocoon'
            ? 1.16
            : config.mechanic === 'brood' && phaseWaveIndex(this.nestPhase) === config.waves.length - 1
              ? 1.12
              : config.mechanic === 'bulwark' ? 0.86 : 1
          this.physics.moveTo(enemy, this.player.x, this.player.y, Math.min(190, definition.speed * 0.82 * speedMultiplier))
          enemy.setRotation(Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y))
        } else if (nestDistance > config.combatRadius) this.physics.moveTo(enemy, nest.x, nest.y, 120)
        else enemy.setVelocity(0)
      }
      enemy.setDepth(26 + enemy.y / 10000 + flightHeight / 100)
      if (time < (enemy.getData('playerRecoilUntil') as number || 0)) {
        enemy.setVelocity(
          enemy.getData('playerRecoilVelocityX') as number,
          enemy.getData('playerRecoilVelocityY') as number,
        )
      }
      if (time < (enemy.getData('hitFlashUntil') as number || 0)) enemy.setAlpha(0.7)
      else if (enemy.getData('aiState') !== 'recover') enemy.setAlpha(1)
      this.syncMonsterAnimation(enemy, type, state, time)
    }
  }

  private updateMonsterAltitude(
    enemy: Phaser.Physics.Arcade.Image,
    type: MonsterType,
    state: string,
    time: number,
    definition: (typeof MONSTERS)[MonsterType],
  ) {
    const physical = monsterPhysicalProfile(type)
    if (physical.locomotion === 'ground') {
      enemy.setData('flightHeight', 0)
      const groundShadow = enemy.getData('groundShadow') as Phaser.GameObjects.Ellipse | undefined
      groundShadow?.setPosition(enemy.x, enemy.y + (type === 'shellback' ? 18 : type === 'bloodleech' ? 12 : 14))
        .setAlpha(type === 'shellback' ? 0.64 : type === 'bloodleech' ? 0.52 : 0.58)
        .setScale(1)
        .setDepth(25 + enemy.y / 10000)
      return 0
    }
    let height = physical.hoverHeight
    const remaining = Math.max(0, (enemy.getData('stateUntil') as number || 0) - time)
    if (state === 'telegraph') height = physical.hoverHeight * Math.min(1, remaining / definition.telegraphMs)
    else if (state === 'attack' || state === 'brace') height = 0
    else if (state === 'recover') height = physical.hoverHeight * (1 - Math.min(1, remaining / definition.recoveryMs))
    enemy.setData('flightHeight', height)
    const shadow = enemy.getData('groundShadow') as Phaser.GameObjects.Ellipse | undefined
    if (shadow) {
      const altitudeRatio = height / physical.hoverHeight
      shadow.setPosition(enemy.x, enemy.y + 12 + height * 0.34)
        .setAlpha(0.68 - altitudeRatio * 0.34)
        .setScale(1 - altitudeRatio * 0.18, 1 - altitudeRatio * 0.08)
        .setDepth(25 + enemy.y / 10000)
    }
    return height
  }

  private syncMonsterAnimation(
    enemy: Phaser.Physics.Arcade.Image,
    type: MonsterType,
    aiState: string,
    time: number,
  ) {
    if (!monsterUsesAtlas(type)) return
    const sprite = enemy as unknown as Phaser.Physics.Arcade.Sprite
    const speed = enemy.body?.velocity.length() ?? 0
    const state = (type === 'spitter' || type === 'riftweaver')
      && time < (enemy.getData('shotAnimationUntil') as number || 0)
      ? 'attack'
      : monsterAnimationForAiState(aiState, speed, time < (enemy.getData('hitAnimationUntil') as number || 0))
    sprite.play(monsterAnimationKey(type, state)!, true)
    const facingAngle = aiState === 'attack'
      ? enemy.getData('attackAngle') as number
      : Math.atan2(enemy.body?.velocity.y ?? 0, enemy.body?.velocity.x ?? 1)
    if (Math.abs(enemy.body?.velocity.x ?? 0) > 4 || aiState === 'attack') sprite.setFlipX(Math.cos(facingAngle) < 0)
    sprite.setRotation(0)
  }

  private showRazorwingAfterimage(enemy: Phaser.Physics.Arcade.Image) {
    const sprite = enemy as unknown as Phaser.Physics.Arcade.Sprite
    const ghost = this.add.image(enemy.x, enemy.y, sprite.texture.key, sprite.frame.name)
      .setOrigin(sprite.originX, sprite.originY)
      .setScale(sprite.scaleX, sprite.scaleY)
      .setFlipX(sprite.flipX)
      .setTint(0x8df2c0)
      .setAlpha(0.34)
      .setDepth(enemy.depth - 0.02)
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: sprite.scaleX * 0.9,
      scaleY: sprite.scaleY * 1.05,
      duration: 190,
      ease: 'Cubic.Out',
      onComplete: () => ghost.destroy(),
    })
  }

  private enterNestEnemyRecovery(enemy: Phaser.Physics.Arcade.Image, time: number, definition: (typeof MONSTERS)[MonsterType]) {
    enemy.setVelocity(0).setData('aiState', 'recover').setData('stateUntil', time + definition.recoveryMs)
  }

  private renderMonsterAttackTelegraph(
    enemy: Phaser.Physics.Arcade.Image,
    definition: (typeof MONSTERS)[MonsterType],
    skill: GloamwoodMonsterSkill,
    progress: number,
    config: GloamwoodNestConfig,
  ) {
    const angle = enemy.getData('attackAngle') as number
    const targetX = enemy.getData('attackTargetX') as number
    const targetY = enemy.getData('attackTargetY') as number
    const warningColor = progress > 0.72 ? 0xff6b4a : 0xffd36a
    this.telegraphFx.lineStyle(4 + progress * 5, warningColor, 0.64 + progress * 0.3)
    if (skill.telegraphShape === 'landing') {
      this.telegraphFx.strokeCircle(targetX, targetY, skill.impactRadius * (1.22 - progress * 0.22))
      this.telegraphFx.lineBetween(enemy.x, enemy.y, targetX, targetY)
    } else if (skill.telegraphShape === 'lane') {
      const length = Math.max(420, definition.preferredMaxRange + 100)
      const normalX = -Math.sin(angle) * 32
      const normalY = Math.cos(angle) * 32
      this.telegraphFx.lineBetween(enemy.x + normalX, enemy.y + normalY, enemy.x + Math.cos(angle) * length + normalX, enemy.y + Math.sin(angle) * length + normalY)
      this.telegraphFx.lineBetween(enemy.x - normalX, enemy.y - normalY, enemy.x + Math.cos(angle) * length - normalX, enemy.y + Math.sin(angle) * length - normalY)
    } else if (skill.telegraphShape === 'shockwave') {
      this.telegraphFx.strokeCircle(enemy.x, enemy.y, skill.impactRadius * (0.72 + progress * 0.28))
    } else if (skill.telegraphShape === 'tether') {
      this.telegraphFx.lineBetween(enemy.x, enemy.y, targetX, targetY)
      this.telegraphFx.strokeCircle(targetX, targetY, skill.impactRadius)
    } else if (skill.telegraphShape === 'cone') {
      const spread = (definition.projectileSpreadRadians ?? 0.22) * ((definition.projectileCount ?? 3) - 1) / 2
      for (const edge of [-spread, 0, spread]) this.telegraphFx.lineBetween(
        enemy.x, enemy.y,
        enemy.x + Math.cos(angle + edge) * definition.preferredMaxRange,
        enemy.y + Math.sin(angle + edge) * definition.preferredMaxRange,
      )
    } else this.telegraphFx.lineBetween(enemy.x, enemy.y, targetX, targetY)
    this.telegraphFx.lineStyle(3, config.palette.primary, 0.84).strokeCircle(enemy.x, enemy.y, 38 + progress * 20)
  }

  private updateNestMechanic(time: number) {
    if (phaseWaveIndex(this.nestPhase) < 0) return
    const config = gloamwoodNestConfig(this.activeNestId)
    const nest = gloamwoodNest(this.activeNestId)
    if (config.mechanic === 'gust') {
      if (time >= this.nextMechanicAt) {
        this.nextMechanicAt = time + 4300
        this.mechanicActiveUntil = time + 1050
        this.mechanicDirection *= -1
        this.lastCombatEvent = `刃翼风压 ${this.mechanicDirection > 0 ? '向东' : '向西'}横扫 · 保持走位`
      }
      if (time < this.mechanicActiveUntil) this.player.setVelocityX(this.player.body!.velocity.x + 88 * this.mechanicDirection)
    } else if (config.mechanic === 'rift' && time >= this.nextMechanicAt) {
      this.nextMechanicAt = time + 3900
      const candidates = this.activeNestEnemies()
      const enemy = candidates[Math.floor(Math.random() * candidates.length)]
      if (enemy) {
        const angle = Phaser.Math.Angle.Between(nest.x, nest.y, enemy.x, enemy.y) + Math.PI
        enemy.setPosition(
          nest.x + Math.cos(angle) * config.combatRadius * 0.62,
          nest.y + Math.sin(angle) * config.combatRadius * 0.44,
        )
        this.showImpactBurst(enemy.x, enemy.y, config.palette.glow, true)
        this.lastCombatEvent = '裂隙换位 · 守卫从对侧空间伤口出现'
      }
    } else if (config.mechanic === 'queen' && time >= this.nextMechanicAt) {
      this.nextMechanicAt = time + 1450
      for (const enemy of this.activeNestEnemies()) {
        const hp = enemy.getData('hp') as number
        const maxHp = enemy.getData('maxHp') as number
        if (hp < maxHp) enemy.setData('hp', Math.min(maxHp, hp + 1))
      }
      this.lastCombatEvent = '母巢潮汐 · 存活守卫恢复生命'
    }
    if (this.poisonUntil > time && time - this.lastDamageAt >= 900) this.applyNestPlayerDamage(1, '腐穴余毒', 'environment')
  }

  private updateBullets(time: number) {
    this.bullets.children.iterate((child) => {
      const bullet = child as Phaser.Physics.Arcade.Image
      if (!bullet.active) return true
      if (time >= (bullet.getData('expiresAt') as number)) {
        bullet.disableBody(true, true)
        return true
      }
      const target = bullet.getData('target') as Phaser.Physics.Arcade.Image | undefined
      if (target?.active && this.isTargetAvailable(target)) this.physics.moveTo(bullet, target.x, target.y, 720)
      return true
    })
    this.enemyBullets.children.iterate((child) => {
      const bullet = child as Phaser.Physics.Arcade.Image
      if (bullet.active && time >= (bullet.getData('expiresAt') as number)) bullet.disableBody(true, true)
      return true
    })
  }

  private fireNestEnemyProjectile(enemy: Phaser.Physics.Arcade.Image, definition: (typeof MONSTERS)[MonsterType]) {
    const config = gloamwoodNestConfig(this.activeNestId)
    const type = enemy.getData('type') as MonsterType
    const skill = gloamwoodMonsterSkill(type)
    const baseCount = definition.projectileCount ?? 1
    // Keep volleys odd so the telegraphed aim line is always a real threat;
    // even counts create an accidental safe lane exactly where the monster aims.
    const mechanicBonus = config.mechanic === 'rift' ? 2 : 0
    const projectileCount = Math.min(5, baseCount + mechanicBonus)
    const spread = definition.projectileSpreadRadians ?? (projectileCount > 1 ? 0.18 : 0)
    const baseAngle = enemy.getData('attackAngle') as number
    const speed = (definition.projectileSpeed ?? 315) * (config.mechanic === 'gust' ? 1.18 : 1)
    if (type === 'spitter') {
      enemy.setData('shotAnimationUntil', this.time.now + 320)
      this.showSpitterDischarge(enemy, baseAngle)
    } else if (type === 'riftweaver') {
      enemy.setData('shotAnimationUntil', this.time.now + 360)
      this.showRiftweaverFan(enemy, baseAngle)
    }
    for (let index = 0; index < projectileCount; index += 1) {
      const bullet = this.enemyBullets.get(enemy.x, enemy.y, 'v4-enemy-bullet') as Phaser.Physics.Arcade.Image
      if (!bullet) return
      const angle = baseAngle + (index - (projectileCount - 1) / 2) * spread
      bullet.enableBody(true, enemy.x, enemy.y, true, true)
        .setTint(type === 'spitter' ? 0x83efff : type === 'riftweaver' ? 0xd47aff : config.palette.glow)
        .setScale(type === 'spitter' || type === 'riftweaver' ? 1.25 : 1)
        .setData('damage', gloamwoodMonsterDamage(type, Boolean(enemy.getData('elite'))))
        .setData('source', `${definition.name}·${skill.label}`)
        .setData('attackKind', definition.attackKind)
        .setData('knockback', skill.knockback)
        .setData('expiresAt', this.time.now + 2300)
        .setDepth(40)
      bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
    }
  }

  private isTargetAvailable(target?: Phaser.Physics.Arcade.Image) {
    if (!target?.active) return false
    if (target === this.boss) {
      return this.bossActive && !this.bossDefeated
        && Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y) <= TARGET_RADIUS
    }
    if (target === this.nestCore) return canDamageGloamwoodNestCore(this.nestPhase)
    return this.activeNestEnemies().includes(target)
      && Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y) <= TARGET_RADIUS
  }

  private targetHurtRadius(target: Phaser.Physics.Arcade.Image) {
    const configured = target.getData('hurtRadius') as number | undefined
    if (Number.isFinite(configured)) return Math.max(0, configured!)
    const body = target.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null
    return body ? Math.max(0, Math.min(body.halfWidth, body.halfHeight)) : 0
  }

  private availableTargets() {
    const targets = this.activeNestEnemies().filter((enemy) => this.isTargetAvailable(enemy))
    if (this.isTargetAvailable(this.nestCore)) targets.push(this.nestCore)
    if (this.isTargetAvailable(this.boss)) targets.push(this.boss)
    return targets.sort((a, b) => (
      Phaser.Math.Distance.Squared(this.player.x, this.player.y, a.x, a.y)
      - Phaser.Math.Distance.Squared(this.player.x, this.player.y, b.x, b.y)
    ))
  }

  private pickTarget(worldX: number, worldY: number) {
    return this.availableTargets()
      .map((target) => ({ target, distance: Phaser.Math.Distance.Between(worldX, worldY, target.x, target.y) }))
      .filter(({ target, distance }) => distance <= Math.max(52, target.displayWidth * 0.72))
      .sort((a, b) => a.distance - b.distance)[0]?.target
  }

  private cycleTarget() {
    const targets = this.availableTargets()
    if (targets.length === 0) {
      this.selectedTarget = undefined
      return
    }
    const index = this.selectedTarget ? targets.indexOf(this.selectedTarget) : -1
    this.selectedTarget = targets[(index + 1) % targets.length]
  }

  private requestMotherMonsterAttack(now: number) {
    if (!this.motherMonsterEnabled || this.playerState !== 'active') return
    if (!this.isTargetAvailable(this.selectedTarget)) {
      this.lastCombatEvent = '普攻未启动 · 请点击怪物或按Tab锁定目标'
      return
    }
    this.ensureImpactAudio()
    this.motherMonsterAttack = requestFormalHuntBasicAttack(
      this.motherMonsterAttack,
      now,
      this.motherMonsterCombatProfile(),
    )
  }

  requestMotherMonsterBasicAttack() {
    if (this.motherMonsterEnabled) this.requestMotherMonsterAttack(this.time.now)
    else this.attackSelectedTarget()
  }

  selectNextMotherMonsterTarget() {
    this.cycleTarget()
  }

  resistFormalEvolution() {
    if (!this.liveRunEnabled) return
    const resisted = resistV4Evolution(this.liveEvolution)
    if (resisted !== this.liveEvolution) this.lastCombatEvent = resisted.lastMessage
    this.liveEvolution = resisted
    this.updateFormalHud()
  }

  private updateMotherMonsterAttack(now: number, deltaSeconds: number) {
    const target = this.selectedTarget
    if (this.motherMonsterAttack.action && this.isTargetAvailable(target)) {
      const targetAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target!.x, target!.y)
      this.player.setRotation(turnFormalHuntAttackToward(
        this.player.rotation,
        targetAngle,
        deltaSeconds,
      ))
      this.motherMonsterAimErrorDegrees = formalHuntAttackAimErrorDegrees(this.player.rotation, targetAngle)
    } else {
      this.motherMonsterAimErrorDegrees = 0
    }

    const update = updateFormalHuntBasicAttack(
      this.motherMonsterAttack,
      now,
      this.keys.SPACE.isDown && this.playerState === 'active',
      this.motherMonsterCombatProfile(),
    )
    this.motherMonsterAttack = update.state
    if (update.contactAction) this.resolveMotherMonsterContact(update.contactAction, now)
  }

  private resolveMotherMonsterContact(action: FormalHuntBasicAttackAction, now: number) {
    const target = this.selectedTarget
    const targetLocked = Boolean(target)
    const targetAvailable = this.isTargetAvailable(target)
    const distance = target
      ? Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y)
      : Number.POSITIVE_INFINITY
    const targetRadius = target ? this.targetHurtRadius(target) : 0
    const surfaceDistance = formalHuntTargetSurfaceDistance(distance, targetRadius)
    const profile = this.motherMonsterCombatProfile()
    const actionRange = action === 'Bite'
      ? profile.hitFeedback.biteRange
      : action === 'Pounce'
        ? profile.hitFeedback.pounceRange
      : action === 'Claw'
        ? profile.hitFeedback.clawRange
        : profile.hitFeedback.tailSwipeRange
    const range = Math.round(COMBAT_STYLES.melee.range * (actionRange / profile.hitFeedback.biteRange))
    const hit = canFormalHuntBasicAttackContact({
      targetLocked,
      targetAvailable,
      distance,
      range,
      aimErrorDegrees: this.motherMonsterAimErrorDegrees,
      targetRadius,
    })
    const reason = hit
      ? 'hit'
      : !targetLocked
        ? 'no-lock'
        : !targetAvailable
          ? 'unavailable'
          : surfaceDistance > range
            ? 'out-of-range'
            : 'off-angle'
    this.motherMonsterLastContact = {
      action,
      targetId: this.targetId(target) ?? null,
      hit,
      reason,
      distance: Number.isFinite(distance) ? Math.round(distance * 100) / 100 : -1,
      aimErrorDegrees: Math.round(this.motherMonsterAimErrorDegrees * 100) / 100,
      at: now,
    }
    if (!hit || !target) {
      const reasonCopy = reason === 'no-lock'
        ? '没有锁定目标'
        : reason === 'unavailable'
          ? '锁定目标已失效'
          : reason === 'out-of-range'
            ? `目标过远 ${Math.round(surfaceDistance)}/${range}`
            : `接触角误差 ${this.motherMonsterAimErrorDegrees.toFixed(1)}° > 8°`
      this.lastCombatEvent = `${this.motherMonsterAttackLabel(action)}未命中 · ${reasonCopy}`
      return
    }
    const stats = this.liveEvolution.stats
    const actionDamage = action === 'Bite'
      ? profile.hitFeedback.biteDamage
      : action === 'Pounce'
        ? profile.hitFeedback.pounceDamage
      : action === 'Claw'
        ? profile.hitFeedback.clawDamage
        : profile.hitFeedback.tailSwipeDamage
    const damage = Math.round(attackDamage(
      'melee',
      stats.bulletDamage,
      actionDamage / CORAL_GECKO_PRESENTATION.combat.hitFeedback.biteDamage,
      stats.meleeDamageBonus,
    ) * eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, now).damageMultiplier)
    this.applyDamageToV4Target(target, damage, 'melee', this.player.x, this.player.y)
    this.lastCombatEvent = `${this.motherMonsterAttackLabel(action)}命中 · ${this.targetId(target) ?? '正式锁定目标'}`
  }

  private motherMonsterCombatProfile() {
    const stage = this.currentQuality3DAssetStage()
    if (stage === 2) return SCARLET_HUNTER_PRESENTATION.combat
    if (stage === 1) return SCARLET_GECKO_PRESENTATION.combat
    return CORAL_GECKO_PRESENTATION.combat
  }

  private motherMonsterAttackLabel(action: FormalHuntBasicAttackAction) {
    const stage = this.currentQuality3DAssetStage()
    if (stage === 0) {
      if (action === 'Bite') return CORAL_GECKO_PRESENTATION.combat.attackNames.Bite
      if (action === 'Pounce') return CORAL_GECKO_PRESENTATION.combat.attackNames.Pounce
      if (action === 'TailSwipe') return CORAL_GECKO_PRESENTATION.combat.attackNames.TailSwipe
      return action
    }
    if (stage === 1) {
      if (action === 'Bite') return SCARLET_GECKO_PRESENTATION.combat.attackNames.Bite
      if (action === 'Pounce') return SCARLET_GECKO_PRESENTATION.combat.attackNames.Pounce
      if (action === 'TailSwipe') return SCARLET_GECKO_PRESENTATION.combat.attackNames.TailSwipe
      return action
    }
    return action === 'Pounce' || action === 'Claw' || action === 'TailSwipe'
      ? SCARLET_HUNTER_PRESENTATION.combat.attackNames[action]
      : action
  }

  private attackSelectedTarget() {
    if (this.playerState !== 'active') return
    const target = this.selectedTarget
    if (!this.isTargetAvailable(target)) return
    const attack = V4_ATTACKS[this.combatStyle]
    const liveStats = this.liveEvolution.stats
    const attackCooldown = this.liveRunEnabled
      ? this.combatStyle === 'ranged'
        ? liveStats.shotCooldown
        : Math.round(COMBAT_STYLES[this.combatStyle].cooldownMs * this.starter.cooldownMultiplier[this.combatStyle])
      : attack.cooldownMs
    const attackRadius = this.liveRunEnabled && this.combatStyle === 'magic'
      ? liveStats.magicRadius
      : this.combatStyle === 'magic' ? V4_ATTACKS.magic.radius : 0
    const attackPower = this.liveRunEnabled
      ? Math.round(attackDamage(
          this.combatStyle,
          liveStats.bulletDamage,
          1,
          this.combatStyle === 'melee'
            ? liveStats.meleeDamageBonus
            : this.combatStyle === 'ranged' ? liveStats.rangedDamageBonus : liveStats.magicDamageBonus,
        ) * eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, this.time.now).damageMultiplier)
      : attack.damage
    const now = this.time.now
    if (now - this.lastAttackAt < attackCooldown) return
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, target!.x, target!.y)
    const surfaceDistance = formalHuntTargetSurfaceDistance(distance, this.targetHurtRadius(target!))
    if (surfaceDistance > attack.range) {
      this.lastCombatEvent = `目标过远 · ${Math.round(surfaceDistance)}/${attack.range}`
      return
    }
    this.ensureImpactAudio()
    this.lastAttackAt = now
    this.playerAttackVisualUntil = now + (this.combatStyle === 'magic' ? 520 : this.combatStyle === 'melee' ? 300 : 260)
    this.playerAttackVisualStyle = this.combatStyle
    if (this.combatStyle === 'ranged') {
      const bullet = this.bullets.get(this.player.x, this.player.y, 'v4-player-bullet') as Phaser.Physics.Arcade.Image
      if (!bullet) return
      bullet.enableBody(true, this.player.x, this.player.y, true, true)
        .setData('damage', attackPower)
        .setData('attackStyle', this.combatStyle)
        .setData('sourceX', this.player.x)
        .setData('sourceY', this.player.y)
        .setData('expiresAt', now + 1300)
        .setData('target', target)
        .setDepth(40)
      this.physics.moveTo(bullet, target!.x, target!.y, 720)
    } else if (this.combatStyle === 'melee') {
      this.applyDamageToV4Target(target!, attackPower, this.combatStyle, this.player.x, this.player.y)
    } else {
      const radius = attackRadius
      for (const candidate of this.availableTargets()) {
        if (Phaser.Math.Distance.Between(target!.x, target!.y, candidate.x, candidate.y) <= radius) {
          this.applyDamageToV4Target(candidate, attackPower, this.combatStyle, this.player.x, this.player.y)
        }
      }
    }
    this.lastCombatEvent = `${COMBAT_STYLES[this.combatStyle].name}命中判定`
  }

  private hitNestEnemy(firstObject: unknown, secondObject: unknown) {
    const first = firstObject as Phaser.Physics.Arcade.Image
    const second = secondObject as Phaser.Physics.Arcade.Image
    const bullet = first.texture.key === 'v4-player-bullet' ? first : second
    const enemy = bullet === first ? second : first
    if (!bullet.active || !enemy.active) return
    bullet.disableBody(true, true)
    this.applyDamageToNestEnemy(
      enemy,
      (bullet.getData('damage') as number) || 1,
      (bullet.getData('attackStyle') as CombatStyle) || 'ranged',
      (bullet.getData('sourceX') as number) || this.player.x,
      (bullet.getData('sourceY') as number) || this.player.y,
    )
  }

  private hitNestCore(firstObject: unknown, secondObject: unknown) {
    const first = firstObject as Phaser.Physics.Arcade.Image
    const second = secondObject as Phaser.Physics.Arcade.Image
    const bullet = first.texture.key === 'v4-player-bullet' ? first : second
    const core = bullet === first ? second : first
    if (!bullet.active) return
    bullet.disableBody(true, true)
    if (core !== this.nestCore) return
    if (canDamageGloamwoodNestCore(this.nestPhase)) this.applyDamageToNestCore((bullet.getData('damage') as number) || 1)
  }

  private hitV4Boss(firstObject: unknown, secondObject: unknown) {
    const first = firstObject as Phaser.Physics.Arcade.Image
    const second = secondObject as Phaser.Physics.Arcade.Image
    const bullet = first.texture.key === 'v4-player-bullet' ? first : second
    if (!bullet.active || !this.bossActive) return
    bullet.disableBody(true, true)
    this.applyDamageToV4Boss((bullet.getData('damage') as number) || 1)
  }

  private applyDamageToV4Target(
    target: Phaser.Physics.Arcade.Image,
    damage: number,
    style: CombatStyle = this.combatStyle,
    sourceX = this.player.x,
    sourceY = this.player.y,
  ) {
    if (target === this.boss) this.applyDamageToV4Boss(damage)
    else if (target === this.nestCore) this.applyDamageToNestCore(damage)
    else this.applyDamageToNestEnemy(target, damage, style, sourceX, sourceY)
  }

  private applyDamageToV4Boss(damage: number) {
    if (!this.bossActive || this.bossDefeated || !this.boss.active) return
    this.bossHealth = Math.max(0, this.bossHealth - damage)
    const lifesteal = eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, this.time.now).lifestealRatio
    if (lifesteal > 0) this.health = Math.min(this.currentMaxHealth(), this.health + Math.max(1, Math.round(damage * lifesteal)))
    this.showFloatingDamage(this.boss.x, this.boss.y - 78, damage, floatingOutgoingDamageStyle(this.combatStyle, this.bossHealth <= 0), false)
    this.showImpactBurst(this.boss.x, this.boss.y - 20, 0xff83ad, this.bossHealth <= 0)
    this.boss.setTintFill(0xffffff)
    this.time.delayedCall(70, () => {
      if (!this.boss.active) return
      if (this.bossState === 'telegraph') this.boss.setTintFill(0xffd36e)
      else this.boss.clearTint()
    })
    this.lastCombatEvent = `${RIFT_WARDEN.name} ${this.bossHealth}/${this.bossMaxHealth}`
    this.renderV4BossHud()
    if (this.bossHealth === 0) this.completeV4BossFight()
  }

  private completeV4BossFight() {
    if (this.bossDefeated) return
    this.bossDefeated = true
    this.bossActive = false
    this.bossState = 'defeated'
    this.boss.disableBody(true, true)
    this.bossWarning.clear()
    this.enemyBullets.children.iterate((child) => {
      const projectile = child as Phaser.Physics.Arcade.Image
      if (projectile.active) projectile.disableBody(true, true)
      return true
    })
    this.selectedTarget = undefined
    this.player.setVelocity(0)
    this.cameras.main.flash(650, 255, 220, 132, false)
    this.cameras.main.shake(420, 0.012)
    const gold = bossSoulOrbDrop('rift')
    this.liveEvolution = collectV4SoulOrb(this.liveEvolution, gold, this.time.now)
    this.lastConsumeAt = this.time.now
    this.lastCombatEvent = '古林之心崩解 · 金色魂核已被吞噬'
    this.renderV4BossHud()
    this.time.delayedCall(900, () => this.endV4Run('victory'))
  }

  private endV4Run(outcome: 'victory' | 'death') {
    if (this.runOver) return
    this.runOver = true
    this.player.setVelocity(0)
    this.physics.world.pause()
    this.time.paused = true
    const overlay = document.querySelector<HTMLElement>('#result-overlay')
    const title = document.querySelector<HTMLElement>('#result-title')
    const lead = overlay?.querySelector<HTMLElement>('.result-lead')
    const stats = document.querySelector<HTMLElement>('#result-stats')
    const mutations = document.querySelector<HTMLElement>('#result-mutations')
    if (!overlay || !title || !stats || !mutations) return
    const elapsedSeconds = Math.max(1, Math.round((this.time.now - this.runStartedAt) / 1000))
    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = String(elapsedSeconds % 60).padStart(2, '0')
    const formName = this.liveEvolution.evolutionStage > 0 ? `第 ${this.liveEvolution.evolutionStage} 阶进化体` : '原始幼体'
    const diedToBoss = this.bossActive
    title.textContent = outcome === 'victory'
      ? `${formName} 猎杀成功`
      : diedToBoss ? `${formName} 倒在古林之心` : `${formName} 倒在幽影林地`
    if (lead) lead.textContent = outcome === 'victory'
      ? '裂隙守望者倒下，你的本局进化路线已被记录。'
      : diedToBoss ? '终局失败不会抹去发现；换一条进化路线再战。' : '本次猎杀已经结束；调整路线与战斗方式后再次进入古林。'
    stats.innerHTML = [
      `<div class="result-stat"><strong>${minutes}:${seconds}</strong><span>本局时长</span></div>`,
      `<div class="result-stat"><strong>${this.kills + (outcome === 'victory' ? 1 : 0)}</strong><span>猎物击杀</span></div>`,
      `<div class="result-stat"><strong>${Math.round(v4FogExploredPercent(this.fogCells))}%</strong><span>地图探索</span></div>`,
      `<div class="result-stat"><strong>${outcome === 'victory' ? '完成' : '战败'}</strong><span>本局结果</span></div>`,
    ].join('')
    const chain = this.liveEvolution.evolutionChain.map((entry) => `${entry.stage}. ${entry.name}`).join(' → ') || '原始形态'
    mutations.textContent = `进化基因链：${chain} · ${formatDerivedStats(this.liveEvolution.genes)}`
    overlay.hidden = false
    overlay.classList.add('is-open')
    overlay.setAttribute('aria-hidden', 'false')
    window.setTimeout(() => document.querySelector<HTMLButtonElement>('#restart-run')?.focus(), 120)
  }

  private applyDamageToNestEnemy(
    enemy: Phaser.Physics.Arcade.Image,
    damage: number,
    style: CombatStyle = this.combatStyle,
    sourceX = this.player.x,
    sourceY = this.player.y,
  ) {
    if (!enemy.active) return
    const config = gloamwoodNestConfig(this.activeNestId)
    const definition = MONSTERS[enemy.getData('type') as MonsterType]
    const braced = definition.attackKind === 'brace' && enemy.getData('aiState') === 'brace'
    const mitigation = (config.mechanic === 'bulwark' ? 0.72 : 1) * (braced ? 0.45 : 1)
    const appliedDamage = Math.max(1, Math.ceil(damage * mitigation))
    const hp = (enemy.getData('hp') as number) - appliedDamage
    const killed = hp <= 0
    const baseImpact = resolveImpactFeedback(style, enemy.getData('type') as MonsterType, Boolean(enemy.getData('elite')), killed)
    const impact = braced ? { ...baseImpact, knockback: Math.round(baseImpact.knockback * 0.35) } : baseImpact
    enemy.setData('hp', hp)
      .setData('hitFlashUntil', this.time.now + 90)
      .setData('hitAnimationUntil', this.time.now + 155)
      .setTintFill(0xffffff)
    this.showFloatingDamage(
      enemy.x + Phaser.Math.Between(-8, 8),
      enemy.y - Math.max(32, enemy.displayHeight * 0.36),
      appliedDamage,
      floatingOutgoingDamageStyle(style, killed, mitigation < 0.99),
      false,
    )
    this.applyPlayerImpactFeedback(enemy, impact, sourceX, sourceY)
    const lifesteal = eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, this.time.now).lifestealRatio
    if (this.liveRunEnabled && lifesteal > 0) {
      this.health = Math.min(this.currentMaxHealth(), this.health + Math.max(1, Math.round(appliedDamage * lifesteal)))
    }
    this.time.delayedCall(90, () => {
      if (enemy.active && (enemy.getData('hp') as number) > 0) enemy.setTint(enemy.getData('elite') ? 0xffc66b : 0xffffff)
    })
    if (hp > 0) return
    if (this.selectedTarget === enemy) this.selectedTarget = undefined
    this.kills += 1
    if (this.liveRunEnabled) {
      const drop = soulOrbDropFor({
        gene: definition.gene,
        elite: Boolean(enemy.getData('elite')),
        eliteAffix: enemy.getData('eliteAffix') ?? null,
        biome: 'gloamwood',
        stage: this.liveEvolution.evolutionStage,
      })
      this.spawnLiveSoulOrb(enemy.x, enemy.y, drop)
      if (this.liveEvolution.stats.killHeal > 0) {
        this.health = Math.min(this.currentMaxHealth(), this.health + this.liveEvolution.stats.killHeal)
      }
    }
    enemy.setData('aiState', 'death').setVelocity(0)
    if (monsterUsesAtlas(enemy.getData('type') as MonsterType)) {
      const sprite = enemy as unknown as Phaser.Physics.Arcade.Sprite
      const type = enemy.getData('type') as MonsterType
      const shadow = enemy.getData('groundShadow') as Phaser.GameObjects.Ellipse | undefined
      sprite.body!.enable = false
      sprite.clearTint().setAlpha(1).play(monsterAnimationKey(type, 'death')!, true)
      if (shadow) this.tweens.add({ targets: shadow, alpha: 0, scaleX: 1.25, scaleY: 0.65, duration: 420 })
      if (type === 'razorwing') this.tweens.add({
        targets: sprite,
        y: sprite.y + 44,
        angle: sprite.flipX ? -14 : 14,
        duration: 420,
        ease: 'Quad.In',
      })
      if (type === 'shellback') this.tweens.add({
        targets: sprite,
        y: sprite.y + 16,
        scaleX: sprite.scaleX * 1.04,
        scaleY: sprite.scaleY * 0.84,
        duration: 420,
        ease: 'Quad.In',
      })
      if (type === 'bloodleech') this.tweens.add({
        targets: sprite,
        scaleX: sprite.scaleX * 1.16,
        scaleY: sprite.scaleY * 0.62,
        y: sprite.y + 10,
        duration: 420,
        ease: 'Cubic.In',
      })
      if (type === 'spitter') this.tweens.add({
        targets: sprite,
        alpha: 0.18,
        scaleX: sprite.scaleX * 0.94,
        scaleY: sprite.scaleY * 0.78,
        y: sprite.y + 12,
        duration: 420,
        ease: 'Quad.In',
      })
      if (type === 'riftweaver') this.tweens.add({
        targets: sprite,
        alpha: 0.12,
        scaleX: sprite.scaleX * 1.18,
        scaleY: sprite.scaleY * 0.72,
        angle: sprite.flipX ? -9 : 9,
        duration: 420,
        ease: 'Cubic.In',
      })
      this.time.delayedCall(460, () => {
        shadow?.destroy()
        sprite.setData('groundShadow', undefined)
        if (sprite.active) sprite.disableBody(true, true)
      })
    } else {
      enemy.body!.enable = false
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        scaleX: enemy.scaleX * 1.18,
        scaleY: enemy.scaleY * 0.68,
        angle: enemy.x >= sourceX ? 16 : -16,
        duration: 320,
        ease: 'Cubic.In',
        onComplete: () => {
          if (enemy.active) enemy.disableBody(true, true)
        },
      })
    }
    this.lastCombatEvent = `${gloamwoodNestConfig(this.activeNestId).name}守卫击杀 · 总击杀 ${this.kills}`
  }

  private spawnLiveSoulOrb(x: number, y: number, drop: SoulOrbDrop) {
    const orb = this.soulOrbs.get(x, y, drop.texture) as Phaser.Physics.Arcade.Image
    if (!orb) return
    orb.enableBody(true, x, y, true, true)
      .setTexture(drop.texture)
      .setCircle(soulOrbTierConfig(drop.tier).visual.size / 2)
      .setScale(0.2)
      .setDepth(43)
      .setData('drop', drop)
    this.tweens.add({
      targets: orb,
      scale: drop.displayScale,
      angle: 180,
      duration: 260,
      ease: 'Back.Out',
    })
  }

  private collectLiveSoulOrb(_: unknown, orbObject: unknown) {
    if (!this.liveRunEnabled) return
    const orb = orbObject as Phaser.Physics.Arcade.Image
    if (!orb.active) return
    const drop = orb.getData('drop') as SoulOrbDrop
    orb.disableBody(true, true)
    this.liveEvolution = collectV4SoulOrb(this.liveEvolution, drop, this.time.now)
    this.health = Math.min(this.currentMaxHealth(), this.health)
    this.lastConsumeAt = this.time.now
    this.lastCombatEvent = this.liveEvolution.lastMessage
    this.cameras.main.flash(70, 220, 244, 255, false)
  }

  private applyDamageToNestCore(damage: number) {
    const config = gloamwoodNestConfig(this.activeNestId)
    if (!canDamageGloamwoodNestCore(this.nestPhase) || !this.nestCore.active) return
    this.nestCoreHealth = Math.max(0, this.nestCoreHealth - damage)
    this.showFloatingDamage(
      this.nestCore.x + Phaser.Math.Between(-8, 8),
      this.nestCore.y - 54,
      damage,
      floatingOutgoingDamageStyle(this.combatStyle, this.nestCoreHealth <= 0),
      false,
    )
    this.showImpactBurst(this.nestCore.x, this.nestCore.y - 16, config.palette.glow, this.nestCoreHealth <= 0)
    const activeCore = this.nestCore
    activeCore.setTintFill(0xffffff)
    this.time.delayedCall(80, () => {
      if (activeCore.active) activeCore.setTint(config.palette.glow)
    })
    this.lastCombatEvent = `${config.name}核心 ${this.nestCoreHealth}/${config.coreMaxHealth}`
    if (this.nestCoreHealth <= 0) this.clearActiveNest()
  }

  private damagePlayer(_: unknown, enemyObject: unknown) {
    const enemy = enemyObject as Phaser.Physics.Arcade.Image
    if (!enemy.active) return
    const type = enemy.getData('type') as MonsterType
    const definition = MONSTERS[type]
    const state = enemy.getData('aiState') as string
    if (!monsterCanContactPlayer(type, (enemy.getData('flightHeight') as number) || 0, state)
      || enemy.getData('attackHit')) return
    this.applyMonsterSkillHit(enemy, definition, gloamwoodMonsterSkill(type))
    enemy.setData('attackHit', true)
  }

  private applyMonsterSkillHit(
    enemy: Phaser.Physics.Arcade.Image,
    definition: (typeof MONSTERS)[MonsterType],
    skill: GloamwoodMonsterSkill,
  ) {
    if (enemy.getData('attackHit')) return false
    const type = enemy.getData('type') as MonsterType
    if (!monsterCanContactPlayer(type, (enemy.getData('flightHeight') as number) || 0, enemy.getData('aiState') as string)
      && definition.attackKind !== 'brace') return false
    const applied = this.applyNestPlayerDamage(
      gloamwoodMonsterDamage(type, Boolean(enemy.getData('elite'))),
      `${definition.name}·${skill.label}`,
      incomingHitKindForAttack(definition.attackKind),
      enemy.x,
      enemy.y,
    )
    if (!applied) return false
    enemy.setData('attackHit', true)
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y)
    this.playerKnockbackVelocity.set(Math.cos(angle) * skill.knockback, Math.sin(angle) * skill.knockback)
    this.playerKnockbackUntil = this.time.now + 145
    if (definition.attackKind === 'drain') {
      const maxHp = enemy.getData('maxHp') as number
      const hp = enemy.getData('hp') as number
      enemy.setData('hp', Math.min(maxHp, hp + Math.max(1, Math.ceil(maxHp * (definition.lifeStealPercent ?? 0.15)))))
        .setData('fedUntil', this.time.now + 520)
      this.showImpactBurst(enemy.x, enemy.y, 0xff5f76, true)
      this.showBloodDrainPulse(enemy)
    }
    this.lastCombatEvent = `${definition.name}的${skill.label}命中 · ${skill.dangerHint}`
    return true
  }

  private damagePlayerFromEnemyProjectile(_: unknown, projectileObject: unknown) {
    const projectile = projectileObject as Phaser.Physics.Arcade.Image
    if (!projectile.active) return
    const projectileVelocity = projectile.body?.velocity.clone()
    projectile.disableBody(true, true)
    if (!projectile.getData('bossProjectile') && gloamwoodNestConfig(this.activeNestId).mechanic === 'toxin') this.poisonUntil = this.time.now + 2600
    const applied = this.applyNestPlayerDamage(
      (projectile.getData('damage') as number) || 3,
      `${projectile.getData('source') as string}远程攻击`,
      incomingHitKindForAttack((projectile.getData('attackKind') as (typeof MONSTERS)[MonsterType]['attackKind']) || 'projectile'),
      projectileVelocity ? this.player.x - projectileVelocity.x : undefined,
      projectileVelocity ? this.player.y - projectileVelocity.y : undefined,
    )
    if (applied) {
      const angle = projectileVelocity ? Math.atan2(projectileVelocity.y, projectileVelocity.x) : 0
      const knockback = (projectile.getData('knockback') as number) || 70
      this.playerKnockbackVelocity.set(Math.cos(angle) * knockback, Math.sin(angle) * knockback)
      this.playerKnockbackUntil = this.time.now + 110
    }
  }

  private applyPlayerIncomingFeedback(profile: PlayerHitFeedbackProfile, directionDegrees: number | null) {
    if (this.feedbackSettings.flash) {
      this.player.setTintFill(profile.color)
      this.showImpactBurst(this.player.x, this.player.y, profile.color, profile.lethal)
      this.time.delayedCall(profile.flashMs, () => {
        if (this.playerState === 'active') this.player.clearTint()
      })
    }
    this.showDamageDirection(profile, directionDegrees)
    if (this.feedbackSettings.shake && !this.reducedMotion) {
      this.cameras.main.shake(profile.shakeDurationMs, profile.shakeIntensity)
    }
    this.playPlayerDamageTone(profile)
  }

  private showDamageDirection(profile: PlayerHitFeedbackProfile, directionDegrees: number | null) {
    const indicator = this.add.graphics({ x: this.player.x, y: this.player.y })
      .setDepth(124)
      .setBlendMode(Phaser.BlendModes.ADD)
    if (directionDegrees === null) {
      indicator.lineStyle(9, profile.color, 0.88).strokeCircle(0, 0, 82)
      indicator.lineStyle(3, 0xffffff, 0.72).strokeCircle(0, 0, 102)
    } else {
      indicator.setRotation(Phaser.Math.DegToRad(directionDegrees))
      indicator.fillStyle(profile.color, 0.92).fillTriangle(72, -22, 118, 0, 72, 22)
      indicator.lineStyle(5, 0xffffff, 0.76).lineBetween(34, 0, 100, 0)
      indicator.lineStyle(4, profile.color, 0.6).beginPath().arc(0, 0, 96, -0.58, 0.58).strokePath()
    }
    this.tweens.add({
      targets: indicator,
      alpha: 0,
      scaleX: 1.24,
      scaleY: 1.24,
      duration: profile.indicatorMs,
      ease: 'Cubic.Out',
      onComplete: () => indicator.destroy(),
    })
  }

  private playPlayerDamageTone(profile: PlayerHitFeedbackProfile) {
    const context = this.impactAudioContext
    if (!context || context.state !== 'running' || this.feedbackSettings.volume === 0) return
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    const duration = profile.toneDurationMs / 1000
    oscillator.type = profile.kind === 'area' ? 'sawtooth' : profile.kind === 'ranged' ? 'triangle' : 'square'
    oscillator.frequency.setValueAtTime(profile.toneHz, now)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(36, profile.toneHz * 0.48), now + duration)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.065 * this.feedbackSettings.volume, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.01)
  }

  private beginPlayerDowned(source: string, directionDegrees: number | null) {
    this.playerState = 'downed'
    this.playerDownedUntil = this.time.now + PLAYER_DOWNED_MS
    this.selectedTarget = undefined
    this.moveTarget = null
    this.player.setVelocity(0)
    this.player.body!.enable = false
    this.tweens.killTweensOf(this.player)
    this.tweens.add({
      targets: this.player,
      angle: directionDegrees !== null && Math.abs(directionDegrees) > 90 ? -72 : 72,
      scaleX: 1.24,
      scaleY: 0.46,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.In',
    })
    const downedRing = this.add.ellipse(this.player.x, this.player.y + 14, 76, 34, 0xff3f45, 0.18)
      .setStrokeStyle(7, 0xff6d62, 0.92)
      .setDepth(43)
    this.tweens.add({
      targets: downedRing,
      alpha: 0,
      scaleX: 2.1,
      scaleY: 1.7,
      duration: PLAYER_DOWNED_MS,
      ease: 'Cubic.Out',
      onComplete: () => downedRing.destroy(),
    })
    this.lastCombatEvent = `被${source}击倒 · 正在返回巢穴入口`
    this.time.delayedCall(PLAYER_DOWNED_MS, () => this.revivePlayerAtNestEntrance())
  }

  private revivePlayerAtNestEntrance() {
    const config = gloamwoodNestConfig(this.activeNestId)
    const entrance = gloamwoodNestPoint(config.id, config.entrance)
    const outward = new Phaser.Math.Vector2(config.entrance.offsetX, config.entrance.offsetY).normalize().scale(120)
    this.playerState = 'reviving'
    this.playerReviveUntil = this.time.now + PLAYER_REVIVE_MS
    this.respawnCount += 1
    this.health = this.currentMaxHealth()
    this.invulnerableUntil = this.time.now + 2600
    this.player.body!.enable = true
    this.player.setPosition(entrance.x + outward.x, entrance.y + outward.y)
      .setVelocity(0)
      .setAngle(0)
      .setScale(0.72)
      .setAlpha(0)
      .clearTint()
    this.enemyBullets.children.iterate((child) => {
      const projectile = child as Phaser.Physics.Arcade.Image
      if (projectile.active) projectile.disableBody(true, true)
      return true
    })
    for (const guard of this.activeNestEnemies()) {
      guard.setPosition(guard.getData('homeX') as number, guard.getData('homeY') as number)
        .setVelocity(0)
        .setData('aiState', 'pursue')
        .setData('stateUntil', 0)
        .setData('nextAttackAt', this.time.now + 1600)
        .setData('attackHit', false)
    }
    const reviveRing = this.add.ellipse(this.player.x, this.player.y + 14, 52, 26, 0x79f2a1, 0.22)
      .setStrokeStyle(6, 0xc8ffdc, 0.95)
      .setDepth(43)
    this.tweens.add({
      targets: this.player,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: PLAYER_REVIVE_MS,
      ease: 'Back.Out',
      onComplete: () => {
        this.player.setScale(1.12).setAlpha(0)
        this.playerState = 'active'
        this.lastCombatEvent = '已在巢穴入口复苏 · 2.6秒保护'
      },
    })
    this.tweens.add({
      targets: reviveRing,
      alpha: 1,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: PLAYER_REVIVE_MS,
      ease: 'Back.Out',
      onComplete: () => reviveRing.destroy(),
    })
  }

  private applyNestPlayerDamage(
    damage: number,
    source: string,
    kind: IncomingHitKind = 'environment',
    sourceX?: number,
    sourceY?: number,
  ) {
    if (this.playerState !== 'active' || this.time.now < this.invulnerableUntil || this.time.now - this.lastDamageAt < 900) return false
    this.lastDamageAt = this.time.now
    this.lastDamageSource = source
    this.playerHitVisualUntil = this.time.now + 260
    const buffDefense = eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, this.time.now).defenseBonus
    const appliedDamage = this.liveRunEnabled
      ? Math.max(1, Math.round(damage * (1 - Math.min(0.45, this.liveEvolution.stats.defenseReduction + buffDefense))))
      : damage
    const lethal = appliedDamage >= this.health
    const profile = resolvePlayerHitFeedback(kind, appliedDamage, lethal)
    const directionDegrees = damageDirectionDegrees(this.player.x, this.player.y, sourceX, sourceY)
    this.incomingHitCount += 1
    this.lastIncomingHit = { source, kind, damage: appliedDamage, lethal, directionDegrees, at: this.time.now }
    this.health = Math.max(0, this.health - appliedDamage)
    this.showFloatingDamage(
      this.player.x + Phaser.Math.Between(-8, 8),
      this.player.y - 48,
      appliedDamage,
      floatingIncomingDamageStyle(kind, lethal),
      true,
    )
    this.applyPlayerIncomingFeedback(profile, directionDegrees)
    if (this.liveRunEnabled && kind === 'contact') this.applyV4ContactRetaliation(sourceX, sourceY)
    if (this.health > 0) return true
    if (this.liveRunEnabled) {
      this.endV4Run('death')
      return true
    }
    this.beginPlayerDowned(source, directionDegrees)
    return true
  }

  private applyV4ContactRetaliation(sourceX?: number, sourceY?: number) {
    const modifiers = eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, this.time.now)
    const damage = this.liveEvolution.stats.contactRetaliationDamage + modifiers.contactRetaliation
    if (damage <= 0 || sourceX === undefined || sourceY === undefined) return
    if (this.bossActive && Phaser.Math.Distance.Between(sourceX, sourceY, this.boss.x, this.boss.y) <= 150) {
      this.applyDamageToV4Boss(damage)
      this.showImpactBurst(this.boss.x, this.boss.y, 0xa7ef62)
      return
    }
    const attacker = this.activeNestEnemies()
      .map((enemy) => ({ enemy, distance: Phaser.Math.Distance.Between(sourceX, sourceY, enemy.x, enemy.y) }))
      .filter(({ distance }) => distance <= 150)
      .sort((a, b) => a.distance - b.distance)[0]?.enemy
    if (!attacker) return
    this.applyDamageToNestEnemy(attacker, damage, 'melee', this.player.x, this.player.y)
    this.showImpactBurst(attacker.x, attacker.y, 0xa7ef62)
    this.lastCombatEvent = `毒血反噬 · 对近身攻击者造成 ${damage} 点伤害`
  }

  private clearActiveNest() {
    if (this.nestRewardGranted) return
    const config = gloamwoodNestConfig(this.activeNestId)
    this.nestRewardGranted = true
    this.nestPhase = 'cleared'
    this.geneRewards[config.reward.family] += config.reward.genes
    if (this.liveRunEnabled) {
      this.liveEvolution = grantV4NestReward(this.liveEvolution, config.reward, this.time.now)
      this.evolution = this.liveEvolution.evolution
    } else {
      this.evolution += config.reward.evolution
    }
    this.health = Math.min(this.currentMaxHealth(), this.health + config.reward.heal)
    this.nestProgress.set(config.id, { phase: 'cleared', coreHealth: 0, rewardGranted: true })
    this.selectedTarget = undefined
    this.enemyBullets.children.iterate((child) => {
      const projectile = child as Phaser.Physics.Arcade.Image
      if (projectile.active) projectile.disableBody(true, true)
      return true
    })
    this.nestCore.disableBody(false, false)
    this.tweens.add({
      targets: this.nestCore,
      alpha: 0,
      scale: 1.65,
      angle: 70,
      duration: 620,
      ease: 'Cubic.In',
      onComplete: () => this.nestCore.setVisible(false).setActive(false),
    })
    const art = this.nestArtSprites.get(config.id)!
    this.tweens.add({
      targets: art,
      tint: config.palette.glow,
      duration: 700,
      yoyo: true,
      hold: 220,
      onComplete: () => art.clearTint(),
    })
    const cleared = [...this.nestProgress.values()].filter((progress) => progress.phase === 'cleared').length
    this.lastCombatEvent = `${config.name}清理 · ${config.reward.family}基因 +${config.reward.genes} · 进化 +${config.reward.evolution} · ${cleared}/8`
    this.cameras.main.flash(90, (config.palette.glow >> 16) & 0xff, (config.palette.glow >> 8) & 0xff, config.palette.glow & 0xff, false)
  }

  private targetId(target?: Phaser.Physics.Arcade.Image) {
    return target?.getData('targetId') as string | undefined
  }

  private nestObjectiveCopy() {
    if (this.bossActive) return `${RIFT_WARDEN.name} · 阶段 ${this.bossPhaseValue} · 观察预警并闪避`
    if (this.bossDefeated) return '古林之心已净化'
    if (this.liveRunEnabled && this.canChallengeV4Boss()) return '古林之心已经苏醒 · 前往东侧 Boss 圆场'
    const config = gloamwoodNestConfig(this.activeNestId)
    if (this.nestPhase === 'dormant') {
      if (this.liveRunEnabled && !pointInsideNest(this.player.x, this.player.y, gloamwoodNest(this.activeNestId))) {
        const cleared = this.clearedNestCount()
        return cleared === 0
          ? '探索幽影林地 · 沿道路寻找第一个怪物窝点'
          : `继续探索 · 已清理 ${cleared}/8 个窝点`
      }
      return this.liveRunEnabled ? `${config.name} · 进入警戒范围` : `${config.name} · ${config.subtitle}（T 切换验收）`
    }
    if (phaseWaveIndex(this.nestPhase) >= 0) return `${config.name} · 第 ${phaseWaveIndex(this.nestPhase) + 1}/${config.waves.length} 波 · 剩余 ${this.activeNestEnemies().length}`
    if (phaseIntermissionIndex(this.nestPhase) >= 0) return `${config.name}正在重组 · 下一波即将出现`
    if (this.nestPhase === 'core-vulnerable') return `摧毁${config.name}核心 · ${this.nestCoreHealth}/${config.coreMaxHealth}`
    return `${config.name}已清理 · 总进化 ${this.evolution}`
  }

  private targetDecisionCopy() {
    const target = this.selectedTarget
    if (!this.isTargetAvailable(target)) return '点击怪物或按 Tab 锁定目标'
    if (target === this.boss) return `${RIFT_WARDEN.name}  ${this.bossHealth}/${this.bossMaxHealth}  ·  阶段 ${this.bossPhaseValue}`
    if (target === this.nestCore) {
      const config = gloamwoodNestConfig(this.activeNestId)
      const state = canDamageGloamwoodNestCore(this.nestPhase) ? '可攻击' : '受保护'
      return `${config.name}核心  ${this.nestCoreHealth}/${config.coreMaxHealth}  ·  ${state}`
    }
    const type = target!.getData('type') as MonsterType
    const definition = MONSTERS[type]
    const hp = Math.max(0, target!.getData('hp') as number)
    const maxHp = target!.getData('maxHp') as number
    const elite = target!.getData('elite') ? '精英 · ' : ''
    const state = enemyReadabilityState(hp, maxHp, target!.getData('aiState') as string, Boolean(target!.getData('elite')), true)
    const timing = state.statusLabel ? ` · ${state.statusLabel}` : ''
    return `${elite}${definition.name}  ${hp}/${maxHp}  ·  ${gloamwoodMonsterSkill(type).label}${timing}`
  }

  private formalHudObjectivePoint() {
    if (this.bossActive || this.canChallengeV4Boss()) return GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
    if (this.nestPhase !== 'dormant' && this.nestPhase !== 'cleared') return gloamwoodNest(this.activeNestId)
    const uncleared = GLOAMWOOD_EXPLORATION_LAYOUT.nests
      .filter((nest) => this.nestProgress.get(nest.id)?.phase !== 'cleared')
      .map((nest) => ({
        ...nest,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, nest.x, nest.y),
      }))
      .sort((a, b) => a.distance - b.distance)
    return uncleared[0] ?? GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
  }

  private updateFormalHud() {
    if (!this.liveRunEnabled) return
    const species = this.resolvedEvolutionSpecies()
    const objective = this.formalHudObjectivePoint()
    const objectiveAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, objective.x, objective.y)
    const dominantFamily = GENE_FAMILIES
      .map((family) => ({ family, value: this.liveEvolution.genes[family] }))
      .sort((a, b) => b.value - a.value)[0]
    const hasGeneTendency = Boolean(dominantFamily && dominantFamily.value > 0)
    const attackLabel = this.motherMonsterEnabled
      ? this.motherMonsterCombatProfile().primaryCombo
        .map((action) => this.motherMonsterAttackLabel(action))
        .join(' → ')
      : species.definition.normalAttackProfile
    updateFormalHuntHud({
      health: this.health,
      maxHealth: this.currentMaxHealth(),
      formName: species.formName,
      speciesName: species.definition.name,
      stage: this.liveEvolution.evolutionStage,
      maxStage: V4_BOSS_REQUIRED_STAGE,
      evolution: this.liveEvolution.evolution,
      evolutionRequired: evolutionRequirementForStage(this.liveEvolution.evolutionStage),
      dominantFamily: hasGeneTendency ? dominantFamily!.family : null,
      dominantLabel: hasGeneTendency ? GENE_LABELS[dominantFamily!.family] : '',
      objective: this.nestObjectiveCopy(),
      objectiveDistance: Phaser.Math.Distance.Between(this.player.x, this.player.y, objective.x, objective.y) / 10,
      objectiveBearingDegrees: Phaser.Math.RadToDeg(Phaser.Math.Angle.Wrap(objectiveAngle - this.player.rotation)),
      target: this.targetDecisionCopy(),
      event: this.lastCombatEvent,
      attackLabel,
      clearedNests: this.clearedNestCount(),
      requiredNests: V4_BOSS_REQUIRED_NESTS,
      bossReady: this.canChallengeV4Boss(),
      bossActive: this.bossActive,
      bossName: RIFT_WARDEN.name,
      bossHealth: this.bossHealth,
      bossMaxHealth: this.bossMaxHealth,
      bossPhase: this.bossPhaseValue,
      resistCharges: this.liveEvolution.resistCharges,
      evolutionPending: this.liveEvolution.pendingEvolutionAt > 0,
    })
  }

  private showFloatingDamage(
    x: number,
    y: number,
    amount: number,
    style: FloatingDamageStyle,
    incoming: boolean,
  ) {
    const label = `${style.prefix}${amount}`
    const damageText = this.add.text(x, y, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: `${style.fontSize}px`,
      fontStyle: 'bold',
      color: style.color,
      stroke: '#07100b',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(90)
    this.damageNumberCount += 1
    this.lastDamageNumber = { amount, incoming, label, at: this.time.now }
    this.tweens.add({
      targets: damageText,
      y: y - style.rise,
      alpha: 0,
      scale: 1.08,
      duration: style.durationMs,
      ease: 'Cubic.Out',
      onComplete: () => damageText.destroy(),
    })
  }

  private combatStatusLabel(id: string) {
    let label = this.combatStatusLabels.get(id)
    if (!label) {
      label = this.add.text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif', fontSize: '12px', fontStyle: 'bold',
        color: '#ffffff', stroke: '#07100b', strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(46)
      this.combatStatusLabels.set(id, label)
    }
    return label
  }

  private renderCombatReadability() {
    this.combatReadabilityFx.clear()
    this.visibleEnemyBars = 0
    this.visibleCombatStatusLabels = 0
    const visibleLabelIds = new Set<string>()
    const view = this.cameras.main.worldView
    for (const enemy of this.activeNestEnemies()) {
      if (!Phaser.Geom.Rectangle.Contains(view, enemy.x, enemy.y)) continue
      const hp = enemy.getData('hp') as number
      const maxHp = enemy.getData('maxHp') as number
      const id = this.targetId(enemy) ?? `${enemy.getData('type')}-${enemy.x}-${enemy.y}`
      const selected = enemy === this.selectedTarget
      const elite = Boolean(enemy.getData('elite'))
      const state = enemyReadabilityState(hp, maxHp, enemy.getData('aiState') as string, elite, selected)
      const width = elite ? 90 : selected ? 82 : 70
      const x = enemy.x - width / 2
      const y = enemy.y - Math.max(44, enemy.displayHeight * 0.48) - 16
      this.combatReadabilityFx.fillStyle(0x030805, 0.86).fillRoundedRect(x - 3, y - 3, width + 6, 10, 4)
      if (selected) this.combatReadabilityFx.lineStyle(2, 0xffdf82, 0.94).strokeRoundedRect(x - 3, y - 3, width + 6, 10, 4)
      this.combatReadabilityFx.fillStyle(state.healthColor, 0.96).fillRoundedRect(x, y, Math.max(2, width * state.healthRatio), 4, 2)
      if (elite) {
        this.combatReadabilityFx.fillStyle(0xffd982, 1).fillTriangle(x - 9, y + 2, x - 5, y - 3, x - 1, y + 2)
      }
      this.visibleEnemyBars += 1
      if (state.showStatus) {
        const label = this.combatStatusLabel(id)
        label.setPosition(enemy.x, y - 6).setText(state.statusLabel).setColor(`#${state.statusColor.toString(16).padStart(6, '0')}`).setVisible(true)
        visibleLabelIds.add(id)
        this.visibleCombatStatusLabels += 1
      }
    }
    for (const [id, label] of this.combatStatusLabels) label.setVisible(visibleLabelIds.has(id))

    const showPlayerBar = this.health < this.currentMaxHealth() || (this.nestPhase !== 'dormant' && this.nestPhase !== 'cleared')
    if (showPlayerBar && this.player.visible) {
      const width = 88
      const x = this.player.x - width / 2
      const y = this.player.y - 64
      const ratio = Math.max(0, this.health / this.currentMaxHealth())
      const color = ratio <= 0.3 ? 0xff7058 : ratio <= 0.6 ? 0xffc857 : 0x79f2a1
      this.combatReadabilityFx.fillStyle(0x030805, 0.88).fillRoundedRect(x - 3, y - 3, width + 6, 11, 4)
      this.combatReadabilityFx.fillStyle(color, 0.98).fillRoundedRect(x, y, Math.max(2, width * ratio), 5, 2)
      if (this.time.now < this.invulnerableUntil) this.combatReadabilityFx.lineStyle(2, 0xc8ffdc, 0.9).strokeRoundedRect(x - 3, y - 3, width + 6, 11, 4)
    }
  }

  private renderCombatState(time: number) {
    const config = gloamwoodNestConfig(this.activeNestId)
    this.nestArenaFx.clear()
    this.renderArenaFeatures(config, time)
    const core = gloamwoodNestPoint(config.id, config.core)
    this.renderNestMechanic(config, time)
    if (this.nestPhase !== 'cleared') {
      const pulse = 1 + Math.sin(time / 190) * 0.07
      this.nestArenaFx.lineStyle(
        canDamageGloamwoodNestCore(this.nestPhase) ? 8 : 4,
        canDamageGloamwoodNestCore(this.nestPhase) ? config.palette.glow : config.palette.primary,
        canDamageGloamwoodNestCore(this.nestPhase) ? 0.76 : 0.3,
      ).strokeEllipse(core.x, core.y + 18, 138 * pulse, 88 * pulse)
    } else {
      this.nestArenaFx.lineStyle(6, 0x79f2a1, 0.72).strokeEllipse(core.x, core.y + 18, 168, 104)
    }
    this.combatFx.clear()
    if (this.isTargetAvailable(this.selectedTarget)) {
      this.combatFx.lineStyle(4, 0xffdf82, 0.95).strokeEllipse(
        this.selectedTarget!.x,
        this.selectedTarget!.y + 10,
        Math.max(76, this.selectedTarget!.displayWidth + 24),
        Math.max(44, this.selectedTarget!.displayHeight * 0.55),
      )
    }
    this.renderCombatReadability()
    const totalGenes = Object.values(this.geneRewards).reduce((sum, genes) => sum + genes, 0)
    const cleared = [...this.nestProgress.values()].filter((progress) => progress.phase === 'cleared').length
    const playerStateLabel = this.playerState === 'downed' ? ' · 倒地' : this.playerState === 'reviving' ? ' · 复苏中' : ''
    const genes = this.liveRunEnabled
      ? Object.values(this.liveEvolution.genes).reduce((sum, value) => sum + value, 0)
      : totalGenes
    const evolutionCopy = this.liveRunEnabled
      ? `${this.liveEvolution.evolutionStage}/6 · ${this.liveEvolution.evolution}/${evolutionRequirementForStage(this.liveEvolution.evolutionStage)}`
      : String(this.evolution)
    const resolvedSpecies = this.resolvedEvolutionSpecies()
    const species = resolvedSpecies.definition
    this.combatHud.setText(`生命 ${this.health}/${this.currentMaxHealth()}${playerStateLabel} · ${resolvedSpecies.formName} · 击杀 ${this.kills} · 基因 ${genes} · 进化 ${evolutionCopy} · 窝点 ${cleared}/8`)
    this.objectiveHud.setText(this.nestObjectiveCopy())
    this.targetHud.setText(this.targetDecisionCopy())
    const buffRemaining = eliteOrbBuffRemainingMs(this.liveEvolution.eliteOrbBuff, time)
    const buffCopy = buffRemaining > 0 && this.liveEvolution.eliteOrbBuff
      ? ` · ${this.liveEvolution.eliteOrbBuff.name}余韵 ${Math.ceil(buffRemaining / 1000)}s`
      : ''
    this.combatEventHud.setText(`${species.normalAttackProfile} · ${this.lastCombatEvent}${buffCopy}`)
    this.updateFormalHud()
  }

  private renderArenaFeatures(config: GloamwoodNestConfig, time: number) {
    this.arenaFeatureFx.clear()
    const nest = gloamwoodNest(config.id)
    const features = gloamwoodArenaFeatures(config.id)
    const worldPoint = (point: { offsetX: number; offsetY: number }) => ({ x: nest.x + point.offsetX, y: nest.y + point.offsetY })

    this.arenaFeatureFx.lineStyle(12, 0x050807, 0.58)
    for (let index = 1; index < features.route.length; index += 1) {
      const from = worldPoint(features.route[index - 1])
      const to = worldPoint(features.route[index])
      this.arenaFeatureFx.lineBetween(from.x, from.y, to.x, to.y)
    }
    this.arenaFeatureFx.lineStyle(4, config.palette.glow, 0.42)
    for (let index = 1; index < features.route.length; index += 1) {
      const from = worldPoint(features.route[index - 1])
      const to = worldPoint(features.route[index])
      this.arenaFeatureFx.lineBetween(from.x, from.y, to.x, to.y)
    }
    for (const point of features.route) {
      const world = worldPoint(point)
      this.arenaFeatureFx.fillStyle(config.palette.glow, 0.42).fillCircle(world.x, world.y, 8)
    }

    for (const obstacle of features.obstacles) {
      const world = worldPoint(obstacle)
      this.arenaFeatureFx.fillStyle(0x010302, 0.72).fillEllipse(world.x, world.y + obstacle.height * 0.25, obstacle.width * 1.16, obstacle.height * 0.54)
      if (config.mechanic === 'hunt') {
        this.arenaFeatureFx.fillStyle(config.palette.secondary, 0.96).fillTriangle(
          world.x, world.y - obstacle.height / 2,
          world.x - obstacle.width / 2, world.y + obstacle.height / 2,
          world.x + obstacle.width / 2, world.y + obstacle.height / 2,
        )
        this.arenaFeatureFx.lineStyle(6, config.palette.primary, 0.92).lineBetween(world.x, world.y - obstacle.height / 2, world.x, world.y + obstacle.height / 2)
      } else if (config.mechanic === 'gust' || config.mechanic === 'rift') {
        this.arenaFeatureFx.fillStyle(config.palette.secondary, 0.94)
          .fillTriangle(world.x, world.y - obstacle.height / 2, world.x - obstacle.width / 2, world.y, world.x, world.y + obstacle.height / 2)
          .fillTriangle(world.x, world.y - obstacle.height / 2, world.x + obstacle.width / 2, world.y, world.x, world.y + obstacle.height / 2)
        this.arenaFeatureFx.lineStyle(5, config.palette.glow, 0.66).lineBetween(world.x, world.y - obstacle.height * 0.38, world.x, world.y + obstacle.height * 0.38)
      } else if (config.mechanic === 'bulwark') {
        this.arenaFeatureFx.fillStyle(config.palette.secondary, 0.94).fillRoundedRect(
          world.x - obstacle.width / 2, world.y - obstacle.height / 2, obstacle.width, obstacle.height, 24,
        )
        this.arenaFeatureFx.lineStyle(6, config.palette.primary, 0.88).strokeRoundedRect(
          world.x - obstacle.width / 2, world.y - obstacle.height / 2, obstacle.width, obstacle.height, 24,
        )
      } else {
        if (config.mechanic === 'queen') {
          this.arenaFeatureFx.fillStyle(config.palette.secondary, 0.94).fillEllipse(world.x, world.y + 8, obstacle.width, obstacle.height * 0.58)
          this.arenaFeatureFx.lineStyle(5, config.palette.primary, 0.72).strokeEllipse(world.x, world.y + 8, obstacle.width, obstacle.height * 0.58)
          for (let index = 0; index < 6; index += 1) {
            const angle = index / 6 * Math.PI * 2
            this.arenaFeatureFx.lineStyle(5, index % 2 === 0 ? config.palette.primary : config.palette.secondary, 0.78).lineBetween(
              world.x + Math.cos(angle) * obstacle.width * 0.3,
              world.y + 8 + Math.sin(angle) * obstacle.height * 0.18,
              world.x + Math.cos(angle) * obstacle.width * 0.63,
              world.y + 8 + Math.sin(angle) * obstacle.height * 0.42,
            )
          }
        } else {
          this.arenaFeatureFx.fillStyle(config.palette.secondary, 0.92).fillEllipse(world.x, world.y, obstacle.width, obstacle.height)
          this.arenaFeatureFx.lineStyle(5, config.palette.primary, 0.9).strokeEllipse(world.x, world.y, obstacle.width, obstacle.height)
          if (config.mechanic === 'brood') {
            this.arenaFeatureFx.fillStyle(config.palette.glow, 0.46).fillCircle(world.x - obstacle.width * 0.16, world.y - obstacle.height * 0.12, 10)
            this.arenaFeatureFx.fillStyle(config.palette.glow, 0.32).fillCircle(world.x + obstacle.width * 0.14, world.y + obstacle.height * 0.08, 7)
          } else if (config.mechanic === 'cocoon') {
            this.arenaFeatureFx.lineStyle(3, config.palette.glow, 0.46)
              .lineBetween(world.x - obstacle.width * 0.35, world.y - obstacle.height * 0.25, world.x + obstacle.width * 0.35, world.y + obstacle.height * 0.25)
              .lineBetween(world.x + obstacle.width * 0.35, world.y - obstacle.height * 0.25, world.x - obstacle.width * 0.35, world.y + obstacle.height * 0.25)
          } else {
            this.arenaFeatureFx.lineStyle(3, config.palette.glow, 0.52).strokeEllipse(world.x - obstacle.width * 0.08, world.y - obstacle.height * 0.12, obstacle.width * 0.55, obstacle.height * 0.42)
          }
        }
      }
    }

    for (const hazard of features.hazards) {
      const world = worldPoint(hazard)
      const phase = phaseWaveIndex(this.nestPhase) >= 0 ? arenaHazardPhase(hazard, time) : 'idle'
      const pulse = 1 + Math.sin((time + hazard.phaseOffsetMs) / 120) * 0.06
      const color = phase === 'warning' ? 0xffca66 : phase === 'active' ? config.palette.glow : config.palette.secondary
      const alpha = phase === 'active' ? 0.24 : phase === 'warning' ? 0.16 : 0.07
      this.arenaFeatureFx.fillStyle(color, alpha).fillEllipse(world.x, world.y, hazard.radiusX * 2 * pulse, hazard.radiusY * 2 * pulse)
      this.arenaFeatureFx.lineStyle(phase === 'active' ? 7 : 4, color, phase === 'idle' ? 0.28 : 0.82)
        .strokeEllipse(world.x, world.y, hazard.radiusX * 2 * pulse, hazard.radiusY * 2 * pulse)
      if (hazard.effect === 'damage') {
        for (let index = 0; index < 6; index += 1) {
          const angle = index / 6 * Math.PI * 2
          this.arenaFeatureFx.lineStyle(3, color, phase === 'active' ? 0.72 : 0.3).lineBetween(
            world.x + Math.cos(angle) * hazard.radiusX * 0.3,
            world.y + Math.sin(angle) * hazard.radiusY * 0.3,
            world.x + Math.cos(angle) * hazard.radiusX * 0.78,
            world.y + Math.sin(angle) * hazard.radiusY * 0.78,
          )
        }
      } else {
        this.arenaFeatureFx.lineStyle(3, color, phase === 'active' ? 0.62 : 0.26)
          .strokeEllipse(world.x, world.y, hazard.radiusX * 1.35, hazard.radiusY * 1.35)
      }
    }
  }

  private renderNestMechanic(config: GloamwoodNestConfig, time: number) {
    const nest = gloamwoodNest(config.id)
    const pulse = 1 + Math.sin(time / 260) * 0.08
    this.nestArenaFx.lineStyle(3, config.palette.glow, 0.16)
    if (config.mechanic === 'gust') {
      for (let offset = -1; offset <= 1; offset += 1) this.nestArenaFx.strokeEllipse(nest.x, nest.y + offset * 72, 620 * pulse, 92)
    } else if (config.mechanic === 'brood') {
      for (let index = 0; index < 7; index += 1) {
        const angle = index / 7 * Math.PI * 2
        this.nestArenaFx.strokeCircle(nest.x + Math.cos(angle) * 270, nest.y + Math.sin(angle) * 175, 26 + (index % 3) * 7)
      }
    } else if (config.mechanic === 'bulwark') {
      for (let index = 0; index < 8; index += 1) {
        const angle = index / 8 * Math.PI * 2
        this.nestArenaFx.lineBetween(nest.x + Math.cos(angle) * 250, nest.y + Math.sin(angle) * 165, nest.x + Math.cos(angle) * 330, nest.y + Math.sin(angle) * 220)
      }
    } else if (config.mechanic === 'toxin') {
      for (const [x, y, radius] of [[-250, 120, 55], [260, 90, 44], [-210, -150, 38], [225, -135, 52]] as const) this.nestArenaFx.strokeCircle(nest.x + x, nest.y + y, radius * pulse)
    } else if (config.mechanic === 'rift') {
      for (let index = 0; index < 6; index += 1) {
        const angle = time / 1800 + index / 6 * Math.PI * 2
        this.nestArenaFx.lineBetween(nest.x + Math.cos(angle) * 80, nest.y + Math.sin(angle) * 55, nest.x + Math.cos(angle) * 325, nest.y + Math.sin(angle) * 220)
      }
    } else if (config.mechanic === 'cocoon') {
      this.nestArenaFx.strokeEllipse(nest.x, nest.y - 55, 520 * pulse, 330 * pulse)
      this.nestArenaFx.strokeEllipse(nest.x, nest.y + 35, 660, 240)
    } else if (config.mechanic === 'queen') {
      for (let index = 1; index <= 3; index += 1) this.nestArenaFx.strokeEllipse(nest.x, nest.y + 24, 180 * index * pulse, 105 * index * pulse)
    } else {
      this.nestArenaFx.strokeEllipse(nest.x, nest.y + 18, 590 * pulse, 370 * pulse)
    }
  }

  setOverview(enabled: boolean) {
    this.overview = enabled
    const camera = this.cameras.main
    if (enabled) {
      const { width, height } = GLOAMWOOD_EXPLORATION_LAYOUT.world
      camera.stopFollow().setZoom(Math.min(camera.width / width, camera.height / height) * 0.94).centerOn(width / 2, height / 2)
      this.player.setVelocity(0)
      this.moveTarget = null
    } else {
      camera.setZoom(FOLLOW_ZOOM).startFollow(this.player, true, 0.14, 0.14)
    }
    const button = document.querySelector<HTMLButtonElement>('[data-exploration-action="overview"]')
    button?.setAttribute('aria-pressed', String(enabled))
    button?.classList.toggle('is-active', enabled)
  }

  toggleNestRanges() {
    this.showNestRanges = !this.showNestRanges
    this.nestRangeGraphics.setVisible(this.showNestRanges)
    const button = document.querySelector<HTMLButtonElement>('[data-exploration-action="nests"]')
    button?.setAttribute('aria-pressed', String(this.showNestRanges))
    button?.classList.toggle('is-active', this.showNestRanges)
  }

  randomizeSpawn() {
    const candidates = GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints.filter((spawn) => spawn.id !== this.currentSpawnId)
    const spawn = candidates[Math.floor(Math.random() * candidates.length)]
    this.currentSpawnId = spawn.id
    this.player.setPosition(spawn.x, spawn.y).setVelocity(0)
    this.moveTarget = null
    if (!this.overview) this.cameras.main.centerOn(spawn.x, spawn.y)
  }

  teleportToFirstNest() {
    this.clearActiveEnemiesAndProjectiles()
    this.setActiveNest('thorn-burrow')
    this.teleportToNest('thorn-burrow')
  }

  teleportToNextNest() {
    const currentConfig = gloamwoodNestConfig(this.activeNestId)
    const currentNest = gloamwoodNest(this.activeNestId)
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, currentNest.x, currentNest.y)
    if (this.nestPhase === 'dormant' && distance > currentConfig.triggerRadius * 1.5) {
      this.teleportToNest(this.activeNestId)
      return
    }
    if (this.nestPhase !== 'dormant' && this.nestPhase !== 'cleared') {
      this.lastCombatEvent = `${currentConfig.name}战斗尚未结束 · 无法切换窝点`
      return
    }
    const currentIndex = GLOAMWOOD_NEST_CONFIGS.findIndex((config) => config.id === this.activeNestId)
    const next = GLOAMWOOD_NEST_CONFIGS[(currentIndex + 1) % GLOAMWOOD_NEST_CONFIGS.length]
    this.clearActiveEnemiesAndProjectiles()
    this.setActiveNest(next.id)
    this.teleportToNest(next.id)
  }

  teleportToNestById(id: string) {
    const config = gloamwoodNestConfig(id)
    this.clearActiveEnemiesAndProjectiles()
    this.setActiveNest(config.id)
    this.teleportToNest(config.id)
  }

  teleportToArenaHazard(id?: string) {
    const hazard = id
      ? GLOAMWOOD_ARENA_FEATURES[this.activeNestId].hazards.find((candidate) => candidate.id === id)
      : GLOAMWOOD_ARENA_FEATURES[this.activeNestId].hazards[0]
    if (!hazard) throw new Error(`Unknown arena hazard: ${id ?? 'first'}`)
    const nest = gloamwoodNest(this.activeNestId)
    this.player.setPosition(nest.x + hazard.offsetX, nest.y + hazard.offsetY).setVelocity(0)
    this.moveTarget = null
  }

  teleportToMonsterSkill(type: string) {
    const enemy = this.activeNestEnemies().find((candidate) => candidate.getData('type') === type)
    if (!enemy) throw new Error(`Active monster skill target not found: ${type}`)
    const definition = MONSTERS[type as MonsterType]
    const skill = gloamwoodMonsterSkill(type as MonsterType)
    const distance = definition.attackKind === 'brace'
      ? skill.impactRadius * 0.72
      : definition.attackKind === 'projectile' || definition.attackKind === 'spread'
        ? (definition.preferredMinRange + definition.preferredMaxRange) / 2
        : definition.preferredMaxRange * 0.72
    this.player.setPosition(enemy.x + distance, enemy.y).setVelocity(0)
    this.moveTarget = null
    for (const candidate of this.activeNestEnemies()) {
      candidate.setData('nextAttackAt', this.time.now + (candidate === enemy ? 1000 : 10000))
    }
  }

  setCombatStyleForDebug(style: string) {
    if (style === 'melee' || style === 'ranged' || style === 'magic') this.combatStyle = style
  }

  setPlayerHealthForDebug(value: number) {
    if (Number.isFinite(value) && this.playerState === 'active') this.health = Phaser.Math.Clamp(Math.round(value), 1, this.currentMaxHealth())
  }

  getCombatFeedbackSettings() {
    return { ...this.feedbackSettings }
  }

  cycleCombatFeedbackSetting(setting: string) {
    if (setting === 'shake') this.feedbackSettings.shake = !this.feedbackSettings.shake
    else if (setting === 'flash') this.feedbackSettings.flash = !this.feedbackSettings.flash
    else if (setting === 'volume') this.feedbackSettings.volume = cycleFeedbackVolume(this.feedbackSettings.volume)
    try {
      localStorage.setItem(PLAYER_FEEDBACK_SETTINGS_KEY, JSON.stringify(this.feedbackSettings))
    } catch {
      // Settings remain active for the current session when storage is unavailable.
    }
    return this.getCombatFeedbackSettings()
  }

  advanceFirstNestDebug() {
    if (this.liveRunEnabled && this.canChallengeV4Boss() && !this.bossActive && !this.bossDefeated) {
      const lair = GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
      this.player.setPosition(lair.x - 520, lair.y).setVelocity(0)
      this.startV4BossFight()
      return
    }
    if (this.nestPhase === 'dormant') {
      this.teleportToNest(this.activeNestId)
      this.spawnNestWave(0)
      return
    }
    if (phaseWaveIndex(this.nestPhase) >= 0) {
      for (const enemy of this.activeNestEnemies()) this.applyDamageToNestEnemy(enemy, 9999)
      if (this.liveRunEnabled) {
        for (const child of this.soulOrbs.getChildren()) {
          const orb = child as Phaser.Physics.Arcade.Image
          if (orb.active) this.collectLiveSoulOrb(undefined, orb)
        }
      }
      this.updateNestCombat(this.time.now)
      return
    }
    if (phaseIntermissionIndex(this.nestPhase) >= 0) {
      this.nestIntermissionUntil = 0
      this.updateNestCombat(this.time.now)
      return
    }
    if (this.nestPhase === 'core-vulnerable') this.applyDamageToNestCore(9999)
    else if (this.nestPhase === 'cleared') this.teleportToNextNest()
  }

  startBossForDebug() {
    if (!this.liveRunEnabled || this.runOver) return
    for (const config of GLOAMWOOD_NEST_CONFIGS.slice(0, V4_BOSS_REQUIRED_NESTS)) {
      this.nestProgress.set(config.id, { phase: 'cleared', coreHealth: 0, rewardGranted: true })
    }
    this.liveEvolution = {
      ...this.liveEvolution,
      evolutionStage: Math.max(V4_BOSS_REQUIRED_STAGE, this.liveEvolution.evolutionStage),
      pendingEvolutionAt: 0,
      genes: Object.values(this.liveEvolution.genes).some((value) => value > 0)
        ? this.liveEvolution.genes
        : { ...this.liveEvolution.genes, rift: 4 },
      recentHunts: this.liveEvolution.recentHunts.length > 0 ? this.liveEvolution.recentHunts : ['rift'],
      mutationRanks: Object.keys(this.liveEvolution.mutationRanks).length > 0
        ? this.liveEvolution.mutationRanks
        : { 'pulse-gland': 2 },
    }
    this.clearActiveEnemiesAndProjectiles()
    const lair = GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
    this.player.setPosition(lair.x - 520, lair.y).setVelocity(0)
    this.startV4BossFight()
  }

  defeatBossForDebug() {
    if (this.bossActive) this.applyDamageToV4Boss(99999)
  }

  teleportToEnvironmentPropForDebug(index = 0) {
    const prop = this.environmentProps[Math.max(0, Math.min(this.environmentProps.length - 1, index))]
    if (!prop) return
    this.player.setPosition(prop.x - 170, prop.y + 20).setVelocity(0)
    this.moveTarget = null
    this.setOverview(false)
  }

  private terrainOverlapIds(enemy: Phaser.Physics.Arcade.Image) {
    const body = enemy.body
    if (!body) return []
    const enemyBounds = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height)
    return this.terrainColliders.getChildren()
      .map((child) => child as Phaser.Physics.Arcade.Image)
      .filter((terrain) => {
        const terrainBody = terrain.body
        if (!terrainBody) return false
        const overlapX = Math.min(enemyBounds.right, terrainBody.x + terrainBody.width)
          - Math.max(enemyBounds.left, terrainBody.x)
        const overlapY = Math.min(enemyBounds.bottom, terrainBody.y + terrainBody.height)
          - Math.max(enemyBounds.top, terrainBody.y)
        // Arcade separation leaves bodies touching at sub-pixel precision. Only
        // report meaningful penetration, not a correct contact along the wall.
        return overlapX > 2.5 && overlapY > 2.5
      })
      .map((terrain) => terrain.getData('terrainId') as string)
  }

  getDebugState() {
    const activeNest = GLOAMWOOD_EXPLORATION_LAYOUT.nests.find((nest) => pointInsideNest(this.player.x, this.player.y, nest))
    const pacing = GLOAMWOOD_EXPLORATION_LAYOUT.pacing
    return {
      explorationLab: {
        version: GLOAMWOOD_EXPLORATION_LAYOUT.version,
        world: { ...GLOAMWOOD_EXPLORATION_LAYOUT.world },
        desktopScreenAreas: Math.round(GLOAMWOOD_EXPLORATION_LAYOUT.world.width * GLOAMWOOD_EXPLORATION_LAYOUT.world.height / (1455 * 818) * 100) / 100,
        routeLength: Math.round(totalRouteLength()),
        rawRouteTravelSeconds: Math.round(totalRouteLength() / GLOAMWOOD_EXPLORATION_LAYOUT.playerSpeed),
        expectedRunMinutes: {
          min: Math.round(estimatedRunMinutes(pacing.expectedNestClears.min) * 10) / 10,
          max: Math.round(estimatedRunMinutes(pacing.expectedNestClears.max) * 10) / 10,
        },
        expectedNestClears: { ...pacing.expectedNestClears },
        seed: this.seed,
        liveRun: {
          enabled: this.liveRunEnabled,
          starter: { id: this.starter.id, name: this.starter.name, style: this.starter.startingStyle },
          evolution: this.liveEvolution.evolution,
          stage: this.liveEvolution.evolutionStage,
          required: evolutionRequirementForStage(this.liveEvolution.evolutionStage),
          pending: this.liveEvolution.pendingEvolutionAt > 0,
          pendingRemainingMs: Math.max(0, Math.round(this.liveEvolution.pendingEvolutionAt - this.time.now)),
          resistCharges: this.liveEvolution.resistCharges,
          genes: { ...this.liveEvolution.genes },
          recentHunts: [...this.liveEvolution.recentHunts],
          mutationRanks: { ...this.liveEvolution.mutationRanks },
          evolutionChain: this.liveEvolution.evolutionChain.map((entry) => ({ ...entry })),
          apexSpeciesId: this.liveEvolution.apexSpeciesId,
          species: speciesDebugContract(this.resolvedEvolutionSpecies()),
          stats: { ...this.liveEvolution.stats },
          collectedOrbs: { ...this.liveEvolution.collectedOrbs },
          eliteOrbBuff: this.liveEvolution.eliteOrbBuff
            ? {
                ...this.liveEvolution.eliteOrbBuff,
                remainingMs: eliteOrbBuffRemainingMs(this.liveEvolution.eliteOrbBuff, this.time.now),
                modifiers: eliteOrbBuffModifiers(this.liveEvolution.eliteOrbBuff, this.time.now),
              }
            : null,
          fog: {
            exploredCells: this.fogCells.filter((cell) => cell.explored).length,
            totalCells: this.fogCells.length,
            exploredPercent: v4FogExploredPercent(this.fogCells),
            visionRadius: V4_VISION_RADIUS,
            revealRadius: V4_REVEAL_RADIUS,
          },
          lastMessage: this.liveEvolution.lastMessage,
          lastConsumeAgoMs: Math.max(0, Math.round(this.time.now - this.lastConsumeAt)),
          activeSoulOrbs: this.soulOrbs?.getChildren()
            .map((child) => child as Phaser.Physics.Arcade.Image)
            .filter((orb) => orb.active)
            .map((orb) => {
              const drop = orb.getData('drop') as SoulOrbDrop
              return { x: Math.round(orb.x), y: Math.round(orb.y), tier: drop.tier, gene: drop.gene, biomass: drop.biomass }
            }) ?? [],
        },
        player: {
          x: Math.round(this.player.x), y: Math.round(this.player.y),
          speed: Math.round(this.player.body?.velocity.length() ?? 0),
          moveTarget: this.moveTarget ? { x: Math.round(this.moveTarget.x), y: Math.round(this.moveTarget.y) } : null,
        },
        camera: {
          mode: this.overview ? 'overview' : 'follow',
          zoom: Math.round(this.cameras.main.zoom * 100) / 100,
          width: Math.round(this.cameras.main.worldView.width),
          height: Math.round(this.cameras.main.worldView.height),
        },
        currentSpawnId: this.currentSpawnId,
        spawnPoints: GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints.map((spawn) => ({ ...spawn })),
        activeNestId: this.activeNestId,
        playerInsideNestId: activeNest?.id ?? null,
        visitedNestIds: [...this.visitedNestIds],
        nestRangesVisible: this.showNestRanges,
        nests: GLOAMWOOD_EXPLORATION_LAYOUT.nests.map((nest) => ({ ...nest })),
        bossLair: { ...GLOAMWOOD_EXPLORATION_LAYOUT.bossLair },
        environment: {
          propCount: this.environmentProps.length,
          props: this.environmentProps.map((prop) => ({ ...prop })),
        },
        bossCombat: {
          unlocked: this.canChallengeV4Boss(),
          requiredNests: V4_BOSS_REQUIRED_NESTS,
          requiredStage: V4_BOSS_REQUIRED_STAGE,
          active: this.bossActive,
          defeated: this.bossDefeated,
          state: this.bossState,
          pattern: this.bossPattern,
          phase: this.bossPhaseValue,
          health: this.bossHealth,
          maxHealth: this.bossMaxHealth,
          runOver: this.runOver,
        },
        routes: GLOAMWOOD_EXPLORATION_LAYOUT.routes.map((route) => ({ id: route.id, name: route.name, width: route.width, length: Math.round(routeLength(route)) })),
        firstNestCombat: {
          id: this.activeNestId,
          mechanic: gloamwoodNestConfig(this.activeNestId).mechanic,
          triggerRadius: gloamwoodNestConfig(this.activeNestId).triggerRadius,
          combatRadius: gloamwoodNestConfig(this.activeNestId).combatRadius,
          diameterTravelSeconds: Math.round(gloamwoodNestConfig(this.activeNestId).combatRadius * 200 / GLOAMWOOD_EXPLORATION_LAYOUT.playerSpeed) / 100,
          phase: this.nestPhase,
          health: this.health,
          playerState: this.playerState,
          downedRemainingMs: Math.max(0, Math.round(this.playerDownedUntil - this.time.now)),
          reviveRemainingMs: Math.max(0, Math.round(this.playerReviveUntil - this.time.now)),
          respawnCount: this.respawnCount,
          kills: this.kills,
          style: this.combatStyle,
          motherMonster: {
            ...(() => {
              const assetStage = this.currentQuality3DAssetStage()
              const species = this.resolvedEvolutionSpecies()
              const presentation = assetStage === 2
                ? SCARLET_HUNTER_PRESENTATION
                : assetStage === 1
                  ? SCARLET_GECKO_PRESENTATION
                  : assetStage === 0 ? CORAL_GECKO_PRESENTATION : null
              return {
                baselineId: presentation?.baselineId ?? `${species.definition.id}-procedural-route-v1`,
                profileId: presentation?.combat.profileId ?? `${species.routeId}-normal-attack-v1`,
              }
            })(),
            enabled: this.motherMonsterEnabled,
            system: CORAL_GECKO_PRESENTATION.combat.system,
            skillsEnabled: CORAL_GECKO_PRESENTATION.combat.skillsEnabled,
            targetMode: 'player-selected-live-target',
            action: this.motherMonsterAttack.action ?? 'ready',
            comboStep: this.motherMonsterAttack.comboStep,
            nextAction: this.motherMonsterCombatProfile().primaryCombo[this.motherMonsterAttack.comboStep],
            buffered: this.motherMonsterAttack.buffered,
            aimErrorDegrees: Math.round(this.motherMonsterAimErrorDegrees * 100) / 100,
            contactToleranceDegrees: this.motherMonsterCombatProfile().targeting.contactToleranceDegrees,
            overlay: this.motherMonsterOverlay && this.currentQuality3DAssetStage() !== null ? this.motherMonsterOverlay.getState() : {
              ready: false,
              source: this.currentQuality3DAssetStage() === null ? 'procedural-route' : this.motherMonsterEnabled ? 'loading' : 'disabled',
              stage: this.currentQuality3DAssetStage() ?? this.liveEvolution.evolutionStage,
              formId: this.resolvedEvolutionSpecies().formId,
              baselineId: `${this.resolvedEvolutionSpecies().definition.id}-procedural-route-v1`,
              profileId: `${this.resolvedEvolutionSpecies().routeId}-normal-attack-v1`,
              activeClip: 'none',
              modelUrl: null,
            },
            lastContact: this.motherMonsterLastContact ? {
              ...this.motherMonsterLastContact,
              ageMs: Math.max(0, Math.round(this.time.now - this.motherMonsterLastContact.at)),
            } : null,
          },
          combatPressure: {
            activeThreats: this.activeCombatThreats().map((threat) => ({
              ...threat,
              cost: combatThreatCost(threat),
            })),
            usedBudget: combatPressureUsed(this.activeCombatThreats()),
            budget: combatPressureBudget(this.health / this.currentMaxHealth()),
            lastThreatStartedAgoMs: Math.max(0, Math.round(this.time.now - this.lastThreatStartedAt)),
            maxObservedConcurrentThreats: this.maxObservedConcurrentThreats,
            blockedStarts: this.blockedThreatStarts,
            blockedReasons: { ...this.blockedThreatReasons },
          },
          impactFeedback: {
            totalPlayerImpacts: this.totalPlayerImpacts,
            killingPlayerImpacts: this.killingPlayerImpacts,
            hitStopRemainingMs: Math.max(0, Math.round(this.hitStopUntil - this.time.now)),
            reducedMotion: this.reducedMotion,
            audioState: this.impactAudioContext?.state ?? 'not-created',
            lastImpact: this.lastPlayerImpact ? {
              ...this.lastPlayerImpact,
              ageMs: Math.max(0, Math.round(this.time.now - this.lastPlayerImpact.at)),
            } : null,
          },
          incomingFeedback: {
            hitCount: this.incomingHitCount,
            settings: { ...this.feedbackSettings },
            effectiveShake: this.feedbackSettings.shake && !this.reducedMotion,
            lastHit: this.lastIncomingHit ? {
              ...this.lastIncomingHit,
              ageMs: Math.max(0, Math.round(this.time.now - this.lastIncomingHit.at)),
            } : null,
          },
          readability: {
            visibleEnemyBars: this.visibleEnemyBars,
            visibleStatusLabels: this.visibleCombatStatusLabels,
            damageNumberCount: this.damageNumberCount,
            lastDamageNumber: this.lastDamageNumber ? {
              ...this.lastDamageNumber,
              ageMs: Math.max(0, Math.round(this.time.now - this.lastDamageNumber.at)),
            } : null,
            targetCopy: this.targetDecisionCopy(),
          },
          selectedTargetId: this.targetId(this.selectedTarget) ?? null,
          activeEnemies: this.activeNestEnemies().map((enemy) => ({
            id: this.targetId(enemy),
            type: enemy.getData('type') as MonsterType,
            hp: enemy.getData('hp') as number,
            maxHp: enemy.getData('maxHp') as number,
            elite: enemy.getData('elite') as boolean,
            locomotion: enemy.getData('locomotion') as string,
            flightHeight: Math.round((enemy.getData('flightHeight') as number) || 0),
            terrainCollisionEnabled: monsterTerrainCollisionEnabled(
              enemy.getData('type') as MonsterType,
              (enemy.getData('flightHeight') as number) || 0,
            ),
            terrainOverlapIds: this.terrainOverlapIds(enemy),
            contactDamageEligible: monsterCanContactPlayer(
              enemy.getData('type') as MonsterType,
              (enemy.getData('flightHeight') as number) || 0,
              enemy.getData('aiState') as string,
            ),
            aiState: enemy.getData('aiState') as string,
            skillId: enemy.getData('skillId') as string,
            stateRemainingMs: Math.max(0, Math.round((enemy.getData('stateUntil') as number) - this.time.now)),
            attackHit: Boolean(enemy.getData('attackHit')),
            fedRemainingMs: Math.max(0, Math.round((enemy.getData('fedUntil') as number) - this.time.now)),
            shotAnimationRemainingMs: Math.max(0, Math.round((enemy.getData('shotAnimationUntil') as number) - this.time.now)),
            texture: enemy.texture.key,
            animation: (enemy as unknown as Phaser.Physics.Arcade.Sprite).anims?.currentAnim?.key ?? null,
            animationFrame: (enemy as unknown as Phaser.Physics.Arcade.Sprite).anims?.currentFrame?.index ?? null,
            flipX: enemy.flipX,
            scale: Math.round(enemy.scaleX * 100) / 100,
            attackAngle: Math.round((enemy.getData('attackAngle') as number) * 1000) / 1000,
            attackTarget: {
              x: Math.round(enemy.getData('attackTargetX') as number),
              y: Math.round(enemy.getData('attackTargetY') as number),
            },
            x: Math.round(enemy.x),
            y: Math.round(enemy.y),
          })),
          core: {
            health: this.nestCoreHealth,
            maxHealth: gloamwoodNestConfig(this.activeNestId).coreMaxHealth,
            vulnerable: canDamageGloamwoodNestCore(this.nestPhase),
            active: this.nestCore.active,
          },
          reward: {
            granted: this.nestRewardGranted,
            geneRewards: { ...this.geneRewards },
            evolution: this.evolution,
          },
          terrain: {
            entrance: gloamwoodNestPoint(this.activeNestId, gloamwoodNestConfig(this.activeNestId).entrance),
            collisionBodies: gloamwoodNestConfig(this.activeNestId).collisionBodies.map((body) => ({ ...body, rect: gloamwoodNestColliderRect(this.activeNestId, body) })),
            masterAsset: gloamwoodNestConfig(this.activeNestId).art.path,
            masterDisplaySize: {
              width: Math.round(this.nestArtSprites.get(this.activeNestId)!.displayWidth),
              height: Math.round(this.nestArtSprites.get(this.activeNestId)!.displayHeight),
            },
          },
          arenaFeatures: {
            obstacleStyle: GLOAMWOOD_ARENA_FEATURES[this.activeNestId].obstacleStyle,
            routeLabel: GLOAMWOOD_ARENA_FEATURES[this.activeNestId].routeLabel,
            obstacleCount: GLOAMWOOD_ARENA_FEATURES[this.activeNestId].obstacles.length,
            routePoints: GLOAMWOOD_ARENA_FEATURES[this.activeNestId].route.length,
            slowMultiplier: this.arenaSlowMultiplier,
            playerHazardIds: [...this.activeArenaHazardIds],
            hazards: GLOAMWOOD_ARENA_FEATURES[this.activeNestId].hazards.map((hazard) => ({
              id: hazard.id,
              label: hazard.label,
              effect: hazard.effect,
              phase: arenaHazardPhase(hazard, this.time.now),
            })),
          },
          enemyProjectiles: this.enemyBullets.countActive(true),
          enemyProjectileState: this.enemyBullets.getChildren()
            .map((child) => child as Phaser.Physics.Arcade.Image)
            .filter((projectile) => projectile.active)
            .map((projectile) => ({
              x: Math.round(projectile.x),
              y: Math.round(projectile.y),
              velocityX: Math.round(projectile.body?.velocity.x ?? 0),
              velocityY: Math.round(projectile.body?.velocity.y ?? 0),
              damage: projectile.getData('damage') as number,
              source: projectile.getData('source') as string,
              remainingMs: Math.max(0, Math.round((projectile.getData('expiresAt') as number) - this.time.now)),
            })),
          lastDamageSource: this.lastDamageSource,
          lastEvent: this.lastCombatEvent,
        },
        allNestCombat: GLOAMWOOD_NEST_CONFIGS.map((config) => ({
          id: config.id,
          name: config.name,
          mechanic: config.mechanic,
          waves: config.waves.length,
          phase: config.id === this.activeNestId ? this.nestPhase : this.nestProgress.get(config.id)?.phase ?? 'dormant',
          coreHealth: config.id === this.activeNestId ? this.nestCoreHealth : this.nestProgress.get(config.id)?.coreHealth ?? config.coreMaxHealth,
          rewardGranted: config.id === this.activeNestId ? this.nestRewardGranted : this.nestProgress.get(config.id)?.rewardGranted ?? false,
          art: config.art.path,
        })),
        excluded: this.liveRunEnabled
          ? []
          : ['drops', 'fog-of-war', 'boss-lair-combat'],
        fps: Math.round(this.game.loop.actualFps),
      },
    }
  }

  private createLabTextures() {
    const g = this.add.graphics()
    g.fillStyle(0x020604, 0.55).fillEllipse(48, 72, 66, 24)
    g.fillStyle(0xc5ff8e).fillCircle(48, 43, 25)
    g.lineStyle(4, 0xf0ffdc, 0.92).strokeCircle(48, 43, 25)
    g.fillStyle(0x315d3b).fillTriangle(25, 48, 7, 65, 35, 59)
    g.fillStyle(0x315d3b).fillTriangle(71, 48, 89, 65, 61, 59)
    g.generateTexture('exploration-lab-player', 96, 96).clear()
    paintAllMonsterTextures(g)
    paintBossTexture(g)
    g.fillStyle(0xffe6a1).fillEllipse(14, 7, 26, 8)
    g.fillStyle(0xffffff).fillCircle(21, 7, 3)
    g.generateTexture('v4-player-bullet', 28, 14).clear()
    g.fillStyle(0x4f1f55).fillCircle(12, 12, 11)
    g.lineStyle(3, 0xd78cff, 0.95).strokeCircle(12, 12, 9)
    g.fillStyle(0xffb25f).fillCircle(9, 9, 4)
    g.generateTexture('v4-enemy-bullet', 24, 24).clear()
    g.fillStyle(0x111111).fillEllipse(64, 105, 108, 42)
    g.fillStyle(0x686868).fillEllipse(64, 76, 100, 92)
    g.lineStyle(8, 0xb5b5b5, 0.95).strokeEllipse(64, 76, 92, 84)
    for (let index = 0; index < 9; index += 1) {
      const angle = index / 9 * Math.PI * 2
      g.lineStyle(7, index % 2 === 0 ? 0xf1f1f1 : 0x8f8f8f, 0.92).lineBetween(
        64 + Math.cos(angle) * 29,
        76 + Math.sin(angle) * 26,
        64 + Math.cos(angle) * 54,
        76 + Math.sin(angle) * 47,
      )
    }
    g.fillStyle(0xcfcfcf).fillEllipse(64, 76, 48, 43)
    g.fillStyle(0xffffff, 0.92).fillCircle(54, 66, 9)
    g.generateTexture('v4-thorn-core', 128, 132).clear()
    g.fillStyle(0xffffff).fillRect(0, 0, 4, 4)
    g.generateTexture('v4-collision-marker', 4, 4).clear()
    for (const tier of ['common', 'elite', 'boss'] as const) {
      const visual = soulOrbTierConfig(tier).visual
      const size = visual.size + 12
      const center = size / 2
      g.fillStyle(0x020605, 0.46).fillEllipse(center + 2, center + visual.size * 0.35, visual.size * 1.2, visual.size * 0.48)
      g.fillStyle(visual.fill, 0.96).fillCircle(center, center, visual.size / 2)
      g.lineStyle(3, visual.stroke, 0.96).strokeCircle(center, center, visual.size / 2)
      g.fillStyle(visual.core, 1).fillCircle(center - visual.size * 0.14, center - visual.size * 0.16, Math.max(3, visual.size * 0.17))
      g.generateTexture(visual.texture, size, size).clear()
    }
    g.destroy()
  }

  private drawExplorationSkeleton() {
    const { width, height } = GLOAMWOOD_EXPLORATION_LAYOUT.world
    const ground = this.add.graphics().setDepth(0)
    if (this.liveRunEnabled) {
      this.add.image(width / 2, height / 2, 'gloamwood-v4-live-ground')
        .setDisplaySize(width, height)
        .setDepth(0)
    } else {
      ground.fillStyle(0x07100c).fillRect(0, 0, width, height)
      for (let x = 400; x < width; x += 400) {
        ground.lineStyle(x % 2000 === 0 ? 2 : 1, 0x1f352a, x % 2000 === 0 ? 0.3 : 0.1).lineBetween(x, 0, x, height)
      }
      for (let y = 400; y < height; y += 400) {
        ground.lineStyle(y % 2000 === 0 ? 2 : 1, 0x1f352a, y % 2000 === 0 ? 0.3 : 0.1).lineBetween(0, y, width, y)
      }

      for (const route of GLOAMWOOD_EXPLORATION_LAYOUT.routes) {
        const drawRoundedRoute = (lineWidth: number, color: number, alpha: number) => {
          ground.lineStyle(lineWidth, color, alpha)
          for (let index = 1; index < route.points.length; index += 1) {
            const from = route.points[index - 1]
            const to = route.points[index]
            ground.lineBetween(from.x, from.y, to.x, to.y)
          }
          ground.fillStyle(color, alpha)
          for (const point of route.points) ground.fillCircle(point.x, point.y, lineWidth / 2)
        }
        // Draw each segment separately and round every junction. Phaser's default
        // polyline miter can create giant triangular wedges at sharp route turns.
        drawRoundedRoute(route.width + 54, 0x020604, 0.66)
        drawRoundedRoute(route.width, 0x314331, 1)
        drawRoundedRoute(Math.max(20, route.width - 90), 0x5a5534, 0.35)
        drawRoundedRoute(4, 0xd1b96a, 0.32)
      }
    }

    for (const spawn of GLOAMWOOD_EXPLORATION_LAYOUT.spawnPoints) {
      if (this.liveRunEnabled) {
        ground.fillStyle(0x183126, 0.78).fillEllipse(spawn.x, spawn.y + 12, 340, 230)
        ground.lineStyle(4, 0x79f2a1, 0.38).strokeEllipse(spawn.x, spawn.y + 12, 340, 230)
        ground.fillStyle(0xc5ff8e, 0.9).fillCircle(spawn.x, spawn.y, 18)
        ground.lineStyle(3, 0xe7ffd2, 0.72).strokeCircle(spawn.x, spawn.y, 28)
      } else {
        ground.fillStyle(0x173a2b, 0.92).fillCircle(spawn.x, spawn.y, spawn.safeRadius)
        ground.lineStyle(8, 0x79f2a1, 0.72).strokeCircle(spawn.x, spawn.y, spawn.safeRadius)
        ground.fillStyle(0xc5ff8e, 1).fillCircle(spawn.x, spawn.y, 34)
        this.add.text(spawn.x, spawn.y - spawn.safeRadius - 56, spawn.name, {
          fontFamily: 'system-ui, sans-serif', fontSize: '25px', color: '#c9f7d8', stroke: '#030805', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(3)
      }
    }

    for (const nest of GLOAMWOOD_EXPLORATION_LAYOUT.nests) {
      this.drawAuthoredNest(nest)
    }

    if (this.liveRunEnabled) this.drawLiveEnvironmentProps()

    const boss = GLOAMWOOD_EXPLORATION_LAYOUT.bossLair
    if (!this.liveRunEnabled) {
      ground.fillStyle(0x3b1820, 0.95).fillCircle(boss.x, boss.y, boss.radius)
      ground.lineStyle(18, 0xff6d4a, 0.76).strokeCircle(boss.x, boss.y, boss.radius)
      ground.lineStyle(5, 0xffc2a6, 0.82).strokeCircle(boss.x, boss.y, boss.radius - 70)
      ground.fillStyle(0xff6d4a).fillCircle(boss.x, boss.y, 72)
      this.add.text(boss.x, boss.y - boss.radius - 70, `${boss.name} · Boss巢穴`, {
        fontFamily: 'system-ui, sans-serif', fontSize: '34px', color: '#ffc2a6', stroke: '#030805', strokeThickness: 8,
      }).setOrigin(0.5).setDepth(3)
    }

  }

  private drawLiveEnvironmentProps() {
    this.environmentProps = createV4EnvironmentProps(this.seed)
    for (const prop of this.environmentProps) {
      const texture = prop.kind === 'broadleaf' ? 'gloamwood-live-broadleaf' : 'gloamwood-live-conifer'
      this.add.image(prop.x, prop.y, texture)
        .setOrigin(0.5, 1)
        .setScale(prop.scale)
        .setFlipX(prop.flipX)
        .setDepth(34 + prop.y / 100)
      const collider = this.terrainColliders.create(prop.x, prop.y - prop.colliderHeight / 2, 'v4-collision-marker') as Phaser.Physics.Arcade.Image
      collider.setDisplaySize(prop.colliderWidth, prop.colliderHeight).setVisible(false).setData('terrainId', prop.id)
      ;(collider.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
    }
  }

  private drawAuthoredNest(nest: MonsterNest) {
    const config = gloamwoodNestConfig(nest.id)
    const ground = this.add.graphics().setDepth(1)
    ground.setVisible(!this.liveRunEnabled)
    this.nestGroundSprites.set(config.id, ground)
    const entrance = gloamwoodNestPoint(config.id, config.entrance)
    const outward = new Phaser.Math.Vector2(config.entrance.offsetX, config.entrance.offsetY).normalize()
    const tangent = new Phaser.Math.Vector2(-outward.y, outward.x)
    // A generous organic clearing hides the abstract route construction beneath
    // the authored nest slice and gives the combat camera a cohesive backdrop.
    ground.fillStyle(0x050c08, 0.98).fillEllipse(nest.x, nest.y + outward.y * 150, 1900, 1480)
    ground.fillStyle(config.palette.ground, 0.96).fillEllipse(nest.x, nest.y + outward.y * 120, 1650, 1260)
    ground.fillStyle(config.palette.secondary, 0.32).fillEllipse(nest.x, nest.y + outward.y * 90, 1380, 1010)
    ground.fillStyle(config.palette.primary, 0.18).fillEllipse(nest.x, nest.y + outward.y * 240, 430, 420)
    ground.fillStyle(0x050805, 0.86).fillEllipse(nest.x, nest.y + 34, 880, 610)
    ground.fillStyle(config.palette.secondary, 0.84).fillEllipse(nest.x, nest.y + 24, 780, 540)
    for (const [index, ring] of [350, 276, 205].entries()) {
      ground.lineStyle(26 - index * 6, index === 0 ? config.palette.secondary : config.palette.primary, 0.58 - index * 0.1)
        .strokeEllipse(nest.x, nest.y + 20, ring * 2, ring * 1.28)
    }
    const trailPoints = [-42, 95, 230, 375, 520, 650].map((distance, index) => {
      const sway = [0, -14, 26, -28, 18, 0][index]
      return {
        x: entrance.x + outward.x * distance + tangent.x * sway,
        y: entrance.y + outward.y * distance + tangent.y * sway,
      }
    })
    const drawRoundedTrail = (lineWidth: number, color: number, alpha: number) => {
      ground.lineStyle(lineWidth, color, alpha)
      for (let index = 1; index < trailPoints.length; index += 1) {
        const from = trailPoints[index - 1]
        const to = trailPoints[index]
        ground.lineBetween(from.x, from.y, to.x, to.y)
      }
      ground.fillStyle(color, alpha)
      for (const point of trailPoints) ground.fillCircle(point.x, point.y, lineWidth / 2)
    }
    drawRoundedTrail(240, 0x090705, 0.96)
    drawRoundedTrail(180, config.palette.secondary, 0.96)
    drawRoundedTrail(120, config.palette.primary, 0.32)
    drawRoundedTrail(5, config.palette.glow, 0.3)
    const trailStones = [
      [-126, 210, 42, 24], [118, 285, 34, 20], [-142, 390, 54, 26], [132, 505, 46, 24],
      [-112, 590, 32, 18], [104, 630, 38, 20],
    ] as const
    for (const [offsetX, offsetY, width, height] of trailStones) {
      const stoneX = entrance.x + outward.x * offsetY + tangent.x * offsetX
      const stoneY = entrance.y + outward.y * offsetY + tangent.y * offsetX
      ground.fillStyle(config.palette.secondary, 0.88).fillEllipse(stoneX, stoneY, width, height)
      ground.fillStyle(config.palette.glow, 0.2).fillEllipse(stoneX - 4, stoneY - 4, width * 0.64, height * 0.45)
    }
    for (let index = 0; index < 16; index += 1) {
      const angle = index / 16 * Math.PI * 2
      const radiusX = 275 + (index % 3) * 28
      const radiusY = 178 + (index % 2) * 24
      ground.fillStyle(index % 2 === 0 ? config.palette.primary : config.palette.secondary, 0.72).fillTriangle(
        nest.x + Math.cos(angle) * radiusX,
        nest.y + 24 + Math.sin(angle) * radiusY,
        nest.x + Math.cos(angle - 0.07) * (radiusX + 72),
        nest.y + 24 + Math.sin(angle - 0.07) * (radiusY + 52),
        nest.x + Math.cos(angle + 0.07) * (radiusX + 72),
        nest.y + 24 + Math.sin(angle + 0.07) * (radiusY + 52),
      )
    }

    const artShadow = this.add.graphics().setDepth(19)
    artShadow.fillStyle(0x010201, 0.62).fillEllipse(nest.x, nest.y + 48, config.art.width * 0.98, config.art.height * 0.74)
    artShadow.setVisible(!this.liveRunEnabled)
    this.nestArtShadows.set(config.id, artShadow)
    const art = this.add.image(nest.x, nest.y + config.art.offsetY, config.art.key)
      .setOrigin(0.5)
      .setDisplaySize(config.art.width, config.art.height)
      .setDepth(20)
    this.nestArtSprites.set(config.id, art)

    for (const collider of config.collisionBodies) {
      const rect = gloamwoodNestColliderRect(config.id, collider)
      const body = this.terrainColliders.create(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        'v4-collision-marker',
      ) as Phaser.Physics.Arcade.Image
      body.setDisplaySize(rect.width, rect.height).setVisible(false).setData('terrainId', collider.id)
      ;(body.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
    }
    for (const obstacle of gloamwoodArenaFeatures(config.id).obstacles) {
      const body = this.terrainColliders.create(
        nest.x + obstacle.offsetX,
        nest.y + obstacle.offsetY,
        'v4-collision-marker',
      ) as Phaser.Physics.Arcade.Image
      body.setDisplaySize(obstacle.width, obstacle.height).setVisible(false).setData('terrainId', `arena-${obstacle.id}`)
      ;(body.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject()
    }

    this.add.text(nest.x, nest.y - nest.radius - 74, `${config.name}${nest.elite ? ' · 精英窝点' : ''}`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#f1e7cf', stroke: '#030805', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(23).setVisible(!this.liveRunEnabled)
    this.add.text(nest.x, nest.y - nest.radius - 34, `${config.waves.length}波 · ${config.subtitle} · ${config.family}基因`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#c8d8c8', stroke: '#030805', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(23).setVisible(!this.liveRunEnabled)
  }

  private updateNestRanges() {
    this.nestRangeGraphics.clear()
    for (const nest of GLOAMWOOD_EXPLORATION_LAYOUT.nests) {
      this.nestRangeGraphics.lineStyle(3, FAMILY_COLORS[nest.family], 0.42).strokeCircle(nest.x, nest.y, nest.radius + 120)
    }
  }
}
