import type { GeneFamily } from './evolution'

export type MonsterType =
  | 'pouncer' | 'razorwing' | 'shellback' | 'bloodleech' | 'spitter' | 'riftweaver'
  | 'mantis' | 'hornbeetle' | 'fireant' | 'stagbeetle' | 'scorpion' | 'wasp'
  | 'moth' | 'mosquito' | 'centipede' | 'bombardier' | 'dungbeetle' | 'locust'
  | 'dragonfly' | 'spider' | 'tick' | 'cicada' | 'glowworm' | 'silkworm'
export type EnemyState = 'idle' | 'alert' | 'pursue' | 'telegraph' | 'attack' | 'brace' | 'recover' | 'return' | 'regenerate'
export type MonsterAttackKind = 'pounce' | 'dash' | 'brace' | 'drain' | 'projectile' | 'spread'
export type MonsterLineage = 'fang' | 'wing' | 'carapace' | 'swarm' | 'venom' | 'rift'

export interface LineageTalent {
  name: string
  description: string
}

export const LINEAGE_TALENTS: Record<MonsterLineage, LineageTalent> = {
  fang: { name: '血性猎杀', description: '玩家生命低于40%时，伤害提高25%' },
  wing: { name: '振翅回旋', description: '攻击后的恢复时间缩短22%' },
  carapace: { name: '几丁护甲', description: '承受的伤害降低22%' },
  swarm: { name: '群巢共振', description: '靠近同族时，移动速度提高18%' },
  venom: { name: '毒腺侵蚀', description: '命中后施加持续3秒的毒伤' },
  rift: { name: '裂隙增殖', description: '每次远程攻击额外产生1枚弹体' },
}

export const VENOM_DURATION_MS = 3000
export const VENOM_TICK_MS = 700
export const VENOM_TICK_DAMAGE = 2

export interface MonsterVisual {
  shape: 'mantis' | 'beetle' | 'ant' | 'scorpion' | 'wasp' | 'moth' | 'mosquito' | 'centipede' | 'locust' | 'dragonfly' | 'spider' | 'tick' | 'cicada' | 'larva'
  primary: number
  secondary: number
  accent: number
}

export interface MonsterDefinition {
  type: MonsterType
  name: string
  gene: GeneFamily
  texture: string
  attackKind: MonsterAttackKind
  lineage: MonsterLineage
  talentHint: string
  health: number
  speed: number
  contactDamage: number
  preferredMinRange: number
  preferredMaxRange: number
  telegraphMs: number
  activeMs: number
  recoveryMs: number
  cooldownMs: number
  visionRange: number
  visionAngleDeg: number
  hearingRange: number
  lostRange: number
  leashRange: number
  alertMs: number
  returnSpeed: number
  regenDelayMs: number
  regenPercentPerSecond: number
  projectileDamage?: number
  projectileSpeed?: number
  projectileCount?: number
  projectileSpreadRadians?: number
  dashSpeed?: number
  lifeStealPercent?: number
}

const pounceVariant = {
  attackKind: 'pounce' as const, health: 5, speed: 165, contactDamage: 15,
  preferredMinRange: 0, preferredMaxRange: 300, telegraphMs: 560, activeMs: 320, recoveryMs: 620, cooldownMs: 980,
  visionRange: 455, visionAngleDeg: 150, hearingRange: 220, lostRange: 840, leashRange: 740,
  alertMs: 460, returnSpeed: 180, regenDelayMs: 1650, regenPercentPerSecond: 0.15,
}

const dashVariant = {
  attackKind: 'dash' as const, health: 4, speed: 195, contactDamage: 12,
  preferredMinRange: 0, preferredMaxRange: 340, telegraphMs: 520, activeMs: 250, recoveryMs: 700, cooldownMs: 1120,
  dashSpeed: 640, visionRange: 510, visionAngleDeg: 170, hearingRange: 245, lostRange: 900, leashRange: 810,
  alertMs: 410, returnSpeed: 215, regenDelayMs: 1550, regenPercentPerSecond: 0.12,
}

const braceVariant = {
  attackKind: 'brace' as const, health: 9, speed: 86, contactDamage: 11,
  preferredMinRange: 0, preferredMaxRange: 275, telegraphMs: 640, activeMs: 740, recoveryMs: 590, cooldownMs: 2050,
  visionRange: 360, visionAngleDeg: 205, hearingRange: 170, lostRange: 640, leashRange: 555,
  alertMs: 620, returnSpeed: 112, regenDelayMs: 2050, regenPercentPerSecond: 0.2,
}

const drainVariant = {
  attackKind: 'drain' as const, health: 6, speed: 130, contactDamage: 13,
  preferredMinRange: 0, preferredMaxRange: 260, telegraphMs: 600, activeMs: 300, recoveryMs: 740, cooldownMs: 1320,
  dashSpeed: 455, lifeStealPercent: 0.18, visionRange: 420, visionAngleDeg: 185, hearingRange: 235,
  lostRange: 735, leashRange: 650, alertMs: 520, returnSpeed: 150, regenDelayMs: 1750, regenPercentPerSecond: 0.17,
}

const projectileVariant = {
  attackKind: 'projectile' as const, health: 5, speed: 90, contactDamage: 4,
  preferredMinRange: 215, preferredMaxRange: 395, telegraphMs: 680, activeMs: 1, recoveryMs: 800, cooldownMs: 1280,
  projectileDamage: 11, projectileSpeed: 340, visionRange: 565, visionAngleDeg: 120, hearingRange: 185,
  lostRange: 825, leashRange: 725, alertMs: 550, returnSpeed: 120, regenDelayMs: 1850, regenPercentPerSecond: 0.13,
}

const spreadVariant = {
  attackKind: 'spread' as const, health: 6, speed: 80, contactDamage: 0,
  preferredMinRange: 265, preferredMaxRange: 435, telegraphMs: 760, activeMs: 1, recoveryMs: 1020, cooldownMs: 1680,
  projectileDamage: 7, projectileSpeed: 315, projectileCount: 3, projectileSpreadRadians: 0.21,
  visionRange: 590, visionAngleDeg: 130, hearingRange: 180, lostRange: 850, leashRange: 755,
  alertMs: 590, returnSpeed: 105, regenDelayMs: 1950, regenPercentPerSecond: 0.12,
}

export const MONSTERS: Record<MonsterType, MonsterDefinition> = {
  pouncer: {
    type: 'pouncer', name: '跳跳虫', gene: 'fang', texture: 'monster-pouncer', attackKind: 'pounce', lineage: 'fang', talentHint: '连续扑击',
    health: 4, speed: 175, contactDamage: 16,
    preferredMinRange: 0, preferredMaxRange: 300,
    telegraphMs: 520, activeMs: 320, recoveryMs: 540, cooldownMs: 820,
    visionRange: 450, visionAngleDeg: 145, hearingRange: 220,
    lostRange: 850, leashRange: 760, alertMs: 420, returnSpeed: 185,
    regenDelayMs: 1600, regenPercentPerSecond: 0.16,
  },
  razorwing: {
    type: 'razorwing', name: '荆棘翼兽', gene: 'wing', texture: 'monster-razorwing', attackKind: 'dash', lineage: 'wing', talentHint: '风切加速',
    health: 3, speed: 215, contactDamage: 12,
    preferredMinRange: 0, preferredMaxRange: 330,
    telegraphMs: 500, activeMs: 240, recoveryMs: 680, cooldownMs: 1050,
    dashSpeed: 680,
    visionRange: 500, visionAngleDeg: 165, hearingRange: 250,
    lostRange: 900, leashRange: 820, alertMs: 400, returnSpeed: 225,
    regenDelayMs: 1500, regenPercentPerSecond: 0.12,
  },
  shellback: {
    type: 'shellback', name: '甲背龟', gene: 'carapace', texture: 'monster-shellback', attackKind: 'brace', lineage: 'carapace', talentHint: '硬壳反震',
    health: 10, speed: 82, contactDamage: 12,
    preferredMinRange: 0, preferredMaxRange: 280,
    telegraphMs: 620, activeMs: 760, recoveryMs: 540, cooldownMs: 2100,
    visionRange: 350, visionAngleDeg: 210, hearingRange: 160,
    lostRange: 620, leashRange: 540, alertMs: 650, returnSpeed: 105,
    regenDelayMs: 2100, regenPercentPerSecond: 0.22,
  },
  bloodleech: {
    type: 'bloodleech', name: '沼泽血蛭', gene: 'venom', texture: 'monster-bloodleech', attackKind: 'drain', lineage: 'venom', talentHint: '鲜血饱食',
    health: 7, speed: 125, contactDamage: 14,
    preferredMinRange: 0, preferredMaxRange: 250,
    telegraphMs: 580, activeMs: 300, recoveryMs: 720, cooldownMs: 1250,
    dashSpeed: 470, lifeStealPercent: 0.22,
    visionRange: 410, visionAngleDeg: 190, hearingRange: 230,
    lostRange: 720, leashRange: 640, alertMs: 520, returnSpeed: 150,
    regenDelayMs: 1700, regenPercentPerSecond: 0.18,
  },
  spitter: {
    type: 'spitter', name: '电脉虫', gene: 'swarm', texture: 'monster-spitter', attackKind: 'projectile', lineage: 'swarm', talentHint: '电脉连锁',
    health: 5, speed: 92, contactDamage: 5,
    preferredMinRange: 210, preferredMaxRange: 390,
    telegraphMs: 650, activeMs: 1, recoveryMs: 760, cooldownMs: 1200,
    projectileDamage: 12, projectileSpeed: 350,
    visionRange: 570, visionAngleDeg: 115, hearingRange: 180,
    lostRange: 820, leashRange: 720, alertMs: 540, returnSpeed: 118,
    regenDelayMs: 1800, regenPercentPerSecond: 0.13,
  },
  riftweaver: {
    type: 'riftweaver', name: '裂隙织法者', gene: 'rift', texture: 'monster-riftweaver', attackKind: 'spread', lineage: 'rift', talentHint: '裂隙增殖',
    health: 6, speed: 78, contactDamage: 0,
    preferredMinRange: 270, preferredMaxRange: 440,
    telegraphMs: 780, activeMs: 1, recoveryMs: 1050, cooldownMs: 1700,
    projectileDamage: 8, projectileSpeed: 320, projectileCount: 3, projectileSpreadRadians: 0.22,
    visionRange: 600, visionAngleDeg: 125, hearingRange: 175,
    lostRange: 860, leashRange: 760, alertMs: 600, returnSpeed: 100,
    regenDelayMs: 1900, regenPercentPerSecond: 0.12,
  },
  mantis: {
    ...pounceVariant, type: 'mantis', name: '螳刃猎手', gene: 'fang', texture: 'monster-mantis',
    lineage: 'fang', talentHint: '处决弱者', health: 6, contactDamage: 17,
  },
  hornbeetle: {
    ...braceVariant, type: 'hornbeetle', name: '铁角甲虫', gene: 'carapace', texture: 'monster-hornbeetle',
    lineage: 'carapace', talentHint: '铁角冲撞', health: 11,
  },
  fireant: {
    ...dashVariant, type: 'fireant', name: '炎群蚁', gene: 'swarm', texture: 'monster-fireant',
    lineage: 'swarm', talentHint: '群巢狂热', speed: 205,
  },
  stagbeetle: {
    ...braceVariant, type: 'stagbeetle', name: '鹿角巨甲', gene: 'carapace', texture: 'monster-stagbeetle',
    lineage: 'carapace', talentHint: '巨颚钳制', health: 12, speed: 76,
  },
  scorpion: {
    ...projectileVariant, type: 'scorpion', name: '砂尾蝎', gene: 'venom', texture: 'monster-scorpion',
    lineage: 'venom', talentHint: '毒素沉积', projectileDamage: 13,
  },
  wasp: {
    ...dashVariant, type: 'wasp', name: '毒针胡蜂', gene: 'wing', texture: 'monster-wasp',
    lineage: 'wing', talentHint: '毒针追猎', dashSpeed: 700, health: 3,
  },
  moth: {
    ...spreadVariant, type: 'moth', name: '暮光飞蛾', gene: 'wing', texture: 'monster-moth',
    lineage: 'wing', talentHint: '鳞粉迷雾', projectileSpreadRadians: 0.25,
  },
  mosquito: {
    ...drainVariant, type: 'mosquito', name: '血吻蚊', gene: 'wing', texture: 'monster-mosquito',
    lineage: 'wing', talentHint: '吸血加速', health: 4, speed: 175, lifeStealPercent: 0.2,
  },
  centipede: {
    ...pounceVariant, type: 'centipede', name: '百足掠食者', gene: 'fang', texture: 'monster-centipede',
    lineage: 'fang', talentHint: '多足追击', speed: 185,
  },
  bombardier: {
    ...projectileVariant, type: 'bombardier', name: '爆酸甲虫', gene: 'venom', texture: 'monster-bombardier',
    lineage: 'venom', talentHint: '酸液灼烧', projectileSpeed: 300,
  },
  dungbeetle: {
    ...braceVariant, type: 'dungbeetle', name: '岩球蜣螂', gene: 'carapace', texture: 'monster-dungbeetle',
    lineage: 'carapace', talentHint: '滚石护体', health: 10,
  },
  locust: {
    ...dashVariant, type: 'locust', name: '荒原蝗虫', gene: 'swarm', texture: 'monster-locust',
    lineage: 'swarm', talentHint: '饥荒迁徙', dashSpeed: 660,
  },
  dragonfly: {
    ...dashVariant, type: 'dragonfly', name: '闪鳞蜻蜓', gene: 'wing', texture: 'monster-dragonfly',
    lineage: 'wing', talentHint: '掠水残影', speed: 220, health: 3,
  },
  spider: {
    ...projectileVariant, type: 'spider', name: '洞网蛛', gene: 'venom', texture: 'monster-spider',
    lineage: 'venom', talentHint: '蛛网束缚', projectileSpeed: 285,
  },
  tick: {
    ...drainVariant, type: 'tick', name: '腐甲蜱', gene: 'venom', texture: 'monster-tick',
    lineage: 'venom', talentHint: '寄生硬化', health: 8, speed: 105,
  },
  cicada: {
    ...spreadVariant, type: 'cicada', name: '震鸣蝉', gene: 'swarm', texture: 'monster-cicada',
    lineage: 'swarm', talentHint: '震鸣共振', projectileSpeed: 335,
  },
  glowworm: {
    ...spreadVariant, type: 'glowworm', name: '萤光幼虫', gene: 'rift', texture: 'monster-glowworm',
    lineage: 'rift', talentHint: '荧光孢爆', health: 5, speed: 68,
  },
  silkworm: {
    ...projectileVariant, type: 'silkworm', name: '丝甲蚕', gene: 'swarm', texture: 'monster-silkworm',
    lineage: 'swarm', talentHint: '茧丝护盾', health: 7, speed: 72,
  },
}

export type ProceduralMonsterType = Exclude<MonsterType, 'pouncer' | 'razorwing' | 'shellback' | 'bloodleech' | 'spitter' | 'riftweaver'>

export const PROCEDURAL_MONSTER_VISUALS: Record<ProceduralMonsterType, MonsterVisual> = {
  mantis: { shape: 'mantis', primary: 0x76bf58, secondary: 0x244d2d, accent: 0xd9ff86 },
  hornbeetle: { shape: 'beetle', primary: 0x557b88, secondary: 0x172d36, accent: 0xa8d9e6 },
  fireant: { shape: 'ant', primary: 0xe05a35, secondary: 0x68201b, accent: 0xffcf66 },
  stagbeetle: { shape: 'beetle', primary: 0x7d5438, secondary: 0x2f1c17, accent: 0xd6aa72 },
  scorpion: { shape: 'scorpion', primary: 0xc68a42, secondary: 0x5b321d, accent: 0xffdf85 },
  wasp: { shape: 'wasp', primary: 0xf2c94c, secondary: 0x2a2118, accent: 0xfff2a6 },
  moth: { shape: 'moth', primary: 0xa77bd7, secondary: 0x3c2859, accent: 0xf1d0ff },
  mosquito: { shape: 'mosquito', primary: 0x7d9b86, secondary: 0x263b32, accent: 0xff7f8e },
  centipede: { shape: 'centipede', primary: 0xd66c3f, secondary: 0x5d281c, accent: 0xffc06e },
  bombardier: { shape: 'beetle', primary: 0x2c876c, secondary: 0x173a32, accent: 0xe4f56f },
  dungbeetle: { shape: 'beetle', primary: 0x67594b, secondary: 0x28231f, accent: 0xbca986 },
  locust: { shape: 'locust', primary: 0xa1a84b, secondary: 0x42451d, accent: 0xf0e986 },
  dragonfly: { shape: 'dragonfly', primary: 0x45c9c4, secondary: 0x175d68, accent: 0xb8ffff },
  spider: { shape: 'spider', primary: 0x6d526e, secondary: 0x2b1d30, accent: 0xdba5dd },
  tick: { shape: 'tick', primary: 0x9c4f52, secondary: 0x411f2c, accent: 0xe9a1a4 },
  cicada: { shape: 'cicada', primary: 0x62a99d, secondary: 0x234b4b, accent: 0xc7f4de },
  glowworm: { shape: 'larva', primary: 0x92ee75, secondary: 0x234b2c, accent: 0xe7ff91 },
  silkworm: { shape: 'larva', primary: 0xe4d8b6, secondary: 0x756b55, accent: 0xfff8dc },
}

export const MONSTER_TYPES = Object.keys(MONSTERS) as MonsterType[]

export function normalizeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

export function canDetectTarget(
  distance: number,
  angleToTarget: number,
  facingAngle: number,
  definition: Pick<MonsterDefinition, 'visionRange' | 'visionAngleDeg' | 'hearingRange'>,
) {
  if (distance <= definition.hearingRange) return true
  const halfVision = definition.visionAngleDeg * Math.PI / 360
  return distance <= definition.visionRange && Math.abs(normalizeAngle(angleToTarget - facingAngle)) <= halfVision
}

export function shouldDisengage(
  homeDistance: number,
  targetDistance: number,
  definition: Pick<MonsterDefinition, 'leashRange' | 'lostRange'>,
) {
  return homeDistance > definition.leashRange || targetDistance > definition.lostRange
}

export function regenerateHealth(current: number, maximum: number, percentPerSecond: number, elapsedMs: number) {
  return Math.min(maximum, current + maximum * percentPerSecond * elapsedMs / 1000)
}

export function canDealContactDamage(attackKind: MonsterAttackKind, state: EnemyState) {
  if (attackKind === 'pounce' || attackKind === 'dash' || attackKind === 'drain') return state === 'attack'
  return attackKind === 'brace' && state === 'brace'
}

export function projectileAngles(
  aimAngle: number,
  projectileCount = 1,
  spreadRadians = 0,
): number[] {
  if (projectileCount <= 1) return [aimAngle]
  const start = aimAngle - spreadRadians * (projectileCount - 1) / 2
  return Array.from({ length: projectileCount }, (_, index) => start + spreadRadians * index)
}

export function lifeStealHealth(currentHealth: number, maximumHealth: number, lifeStealPercent = 0) {
  return Math.min(maximumHealth, currentHealth + maximumHealth * Math.max(0, lifeStealPercent))
}

export function lineageOutgoingDamage(baseDamage: number, lineage: MonsterLineage, playerHealthRatio: number) {
  return lineage === 'fang' && playerHealthRatio <= 0.4 ? baseDamage * 1.25 : baseDamage
}

export function lineageIncomingDamage(baseDamage: number, lineage: MonsterLineage, isBraced = false) {
  if (isBraced) return 0
  return lineage === 'carapace' ? baseDamage * 0.78 : baseDamage
}

export function lineageRecoveryMs(baseRecoveryMs: number, lineage: MonsterLineage) {
  return Math.round(baseRecoveryMs * (lineage === 'wing' ? 0.78 : 1))
}

export function lineageProjectileCount(baseCount: number, lineage: MonsterLineage) {
  return Math.max(1, baseCount + (lineage === 'rift' ? 1 : 0))
}

export function lineagePursuitSpeed(baseSpeed: number, lineage: MonsterLineage, nearbySwarmAllies: number) {
  return baseSpeed * (lineage === 'swarm' && nearbySwarmAllies > 0 ? 1.18 : 1)
}
