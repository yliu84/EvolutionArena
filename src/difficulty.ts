import { hashSeed } from './evolution'
import type { BiomeId } from './world'

export interface BiomeDifficulty {
  biome: BiomeId
  threatLevel: 1 | 2 | 3
  threatLabel: string
  healthMultiplier: number
  damageMultiplier: number
  speedMultiplier: number
  cooldownMultiplier: number
  projectileSpeedMultiplier: number
}

export interface StageThreat {
  stage: number
  surge: boolean
  healthMultiplier: number
  damageMultiplier: number
  speedMultiplier: number
  cooldownMultiplier: number
  extraEliteChance: number
  bossHealthMultiplier: number
  bossDamageMultiplier: number
  eventHazardDamage: number
  whiteOrbMultiplier: number
}

export const BIOME_DIFFICULTY: Record<BiomeId, BiomeDifficulty> = {
  gloamwood: {
    biome: 'gloamwood', threatLevel: 1, threatLabel: '威胁Ⅰ',
    healthMultiplier: 1, damageMultiplier: 1, speedMultiplier: 1,
    cooldownMultiplier: 1, projectileSpeedMultiplier: 1,
  },
  rotfen: {
    biome: 'rotfen', threatLevel: 2, threatLabel: '威胁Ⅱ',
    healthMultiplier: 1.2, damageMultiplier: 1.15, speedMultiplier: 1.08,
    cooldownMultiplier: 0.92, projectileSpeedMultiplier: 1.08,
  },
  'ashen-ruins': {
    biome: 'ashen-ruins', threatLevel: 3, threatLabel: '威胁Ⅲ',
    healthMultiplier: 1.45, damageMultiplier: 1.3, speedMultiplier: 1.15,
    cooldownMultiplier: 0.82, projectileSpeedMultiplier: 1.18,
  },
}

export const STAGE_THREAT_CONFIG = {
  mildThroughStage: 5,
  surgeFromStage: 6,
  requiredBossStage: 6,
  mildHealthPerStage: 0.03,
  mildDamagePerStage: 0.025,
  mildSpeedPerStage: 0.01,
  surgeHealthBonus: 0.24,
  surgeDamageBonus: 0.2,
  surgeSpeedBonus: 0.06,
  surgeCooldownMultiplier: 0.9,
  postSurgeHealthPerStage: 0.1,
  postSurgeDamagePerStage: 0.08,
  postSurgeSpeedPerStage: 0.03,
  extraEliteChanceAtSurge: 0.3,
  extraEliteChancePostSurgePerStage: 0.1,
  extraEliteChanceCap: 0.7,
  bossHealthPerOvergrowthStage: 0.18,
  bossDamagePerOvergrowthStage: 0.12,
  eventDamageAtSurge: 18,
  eventDamagePerOvergrowthStage: 8,
} as const

export const WHITE_ORB_DECAY_CONFIG = {
  lowThreatBiome: 'gloamwood' as const satisfies BiomeId,
  fullValueThroughStage: 1,
  decayPerStage: 0.15,
  minimumMultiplier: 0.35,
  baseCommonBiomass: 20,
} as const

export function difficultyForBiome(biome: BiomeId) {
  return BIOME_DIFFICULTY[biome]
}

export function threatForEvolutionStage(
  stage: number,
  config: typeof STAGE_THREAT_CONFIG = STAGE_THREAT_CONFIG,
): StageThreat {
  const clamped = Math.max(0, Math.floor(stage))
  const mildStages = Math.min(clamped, config.mildThroughStage)
  const overgrowth = Math.max(0, clamped - config.surgeFromStage)
  const surge = clamped >= config.surgeFromStage
  const healthMultiplier = 1
    + config.mildHealthPerStage * mildStages
    + (surge ? config.surgeHealthBonus : 0)
    + config.postSurgeHealthPerStage * overgrowth
  const damageMultiplier = 1
    + config.mildDamagePerStage * mildStages
    + (surge ? config.surgeDamageBonus : 0)
    + config.postSurgeDamagePerStage * overgrowth
  const speedMultiplier = 1
    + config.mildSpeedPerStage * mildStages
    + (surge ? config.surgeSpeedBonus : 0)
    + config.postSurgeSpeedPerStage * overgrowth
  const extraEliteChance = surge
    ? Math.min(
      config.extraEliteChanceCap,
      config.extraEliteChanceAtSurge + config.extraEliteChancePostSurgePerStage * overgrowth,
    )
    : 0
  return {
    stage: clamped,
    surge,
    healthMultiplier,
    damageMultiplier,
    speedMultiplier,
    cooldownMultiplier: surge ? config.surgeCooldownMultiplier : 1,
    extraEliteChance,
    bossHealthMultiplier: 1 + config.bossHealthPerOvergrowthStage * overgrowth,
    bossDamageMultiplier: 1 + config.bossDamagePerOvergrowthStage * overgrowth,
    eventHazardDamage: surge
      ? config.eventDamageAtSurge + config.eventDamagePerOvergrowthStage * overgrowth
      : 0,
    whiteOrbMultiplier: whiteOrbMultiplier(WHITE_ORB_DECAY_CONFIG.lowThreatBiome, clamped),
  }
}

export function extraEliteChanceForStage(stage: number) {
  return threatForEvolutionStage(stage).extraEliteChance
}

export function pressureEliteRoll(runSeed: string, encounterId: string) {
  return (hashSeed(`${runSeed}:pressure-elite:${encounterId}`) % 10000) / 10000
}

export function isEncounterEliteAtStage(
  encounterId: string,
  runSeed: string,
  stage: number,
  isGuard: boolean,
) {
  if (isGuard) return true
  if (encounterId.includes('-brood-')) return false
  const chance = extraEliteChanceForStage(stage)
  if (chance <= 0) return false
  return pressureEliteRoll(runSeed, encounterId) < chance
}

export function whiteOrbMultiplier(
  biome: BiomeId,
  stage: number,
  config: typeof WHITE_ORB_DECAY_CONFIG = WHITE_ORB_DECAY_CONFIG,
) {
  if (biome !== config.lowThreatBiome) return 1
  const clamped = Math.max(0, Math.floor(stage))
  if (clamped <= config.fullValueThroughStage) return 1
  const steps = clamped - config.fullValueThroughStage
  return Math.max(config.minimumMultiplier, 1 - steps * config.decayPerStage)
}

export function whiteOrbValue(
  biome: BiomeId,
  stage: number,
  baseValue: number = WHITE_ORB_DECAY_CONFIG.baseCommonBiomass,
  config: typeof WHITE_ORB_DECAY_CONFIG = WHITE_ORB_DECAY_CONFIG,
) {
  return Math.max(1, Math.round(baseValue * whiteOrbMultiplier(biome, stage, config)))
}

export function scaledEnemyHealth(
  baseHealth: number,
  biome: BiomeId,
  elite: boolean,
  stage = 0,
) {
  const threat = threatForEvolutionStage(stage)
  return Math.ceil(
    baseHealth
    * BIOME_DIFFICULTY[biome].healthMultiplier
    * threat.healthMultiplier
    * (elite ? 3 : 1),
  )
}

export function scaledEnemyCooldown(baseCooldownMs: number, biome: BiomeId, stage = 0) {
  const threat = threatForEvolutionStage(stage)
  return Math.round(baseCooldownMs * BIOME_DIFFICULTY[biome].cooldownMultiplier * threat.cooldownMultiplier)
}

export function scaledEnemyDamage(baseDamage: number, biome: BiomeId, stage = 0) {
  const threat = threatForEvolutionStage(stage)
  return Math.max(1, Math.round(baseDamage * BIOME_DIFFICULTY[biome].damageMultiplier * threat.damageMultiplier))
}

export function scaledBossHealth(baseHealth: number, stage: number) {
  return Math.max(1, Math.ceil(baseHealth * threatForEvolutionStage(stage).bossHealthMultiplier))
}

export function scaledBossDamage(baseDamage: number, stage: number) {
  return Math.max(1, Math.round(baseDamage * threatForEvolutionStage(stage).bossDamageMultiplier))
}

export function eventHazardDamageForStage(stage: number) {
  return threatForEvolutionStage(stage).eventHazardDamage
}

export function formatEvolutionStageLabel(stage: number, maxStages: number) {
  if (stage <= maxStages) return `${stage}/${maxStages}`
  return `${maxStages}/${maxStages} · 过载${stage - maxStages}`
}

export function biomeThreatCopy(biome: BiomeId, stage: number) {
  const difficulty = BIOME_DIFFICULTY[biome]
  const threat = threatForEvolutionStage(stage)
  return threat.surge
    ? `${difficulty.threatLabel} · 阶段压迫`
    : difficulty.threatLabel
}

export function huntObjectiveCopy(state: {
  bossDefeated: boolean
  bossActive: boolean
  bossPhase: number
  canChallenge: boolean
  lairUnlocked: boolean
  sigilCount: number
  sigilRequired: number
  stage: number
  requiredStage: number
  victorySummary?: string | null
}): string {
  if (state.bossDefeated) return state.victorySummary ?? '猎杀完成 · 裂隙守望者已倒下'
  if (state.bossActive) return `Boss阶段 ${state.bossPhase}/2 · 观察预警并闪避`
  if (state.canChallenge) {
    return state.stage > state.requiredStage
      ? '可立刻进巢穴，也可留下 · 过载中猎场与Boss继续变强，林地白球更穷'
      : '第6次已成 · 可立刻进巢穴打Boss，也可留下继续猎杀（猎场将更险，林地白球变少）'
  }
  if (state.lairUnlocked) {
    return `印记 ${state.sigilRequired}/${state.sigilRequired} · 再进化 ${Math.max(0, state.requiredStage - state.stage)} 次后可挑战巢穴`
  }
  return `区域印记 ${state.sigilCount}/${state.sigilRequired} · 猎杀精英守卫并吞噬基因`
}

export function lairPromptCopy(state: {
  canChallenge: boolean
  lairUnlocked: boolean
  remainingSigils: number
  stage: number
  requiredStage: number
}) {
  if (state.canChallenge) return '按 E 唤醒裂隙守望者 · 现在打或继续猎杀'
  if (state.lairUnlocked) {
    return `封印巢穴 · 再完成 ${Math.max(0, state.requiredStage - state.stage)} 次进化`
  }
  return `封印巢穴 · 还缺 ${state.remainingSigils} 枚区域印记`
}
