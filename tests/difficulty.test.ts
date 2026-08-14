import { describe, expect, it } from 'vitest'
import {
  BIOME_DIFFICULTY,
  STAGE_THREAT_CONFIG,
  WHITE_ORB_DECAY_CONFIG,
  biomeThreatCopy,
  extraEliteChanceForStage,
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
  whiteOrbValue,
} from '../src/difficulty'
import { SOUL_ORB_CONFIG, bossSoulOrbDrop, soulOrbDropFor } from '../src/soul-orbs'
import { ENCOUNTERS } from '../src/world'
import {
  EVENT_OUTCOMES,
  REWARD_SITES,
  applyEventHazard,
  canChallengeBoss,
  isLairUnlocked,
} from '../src/rewards'
import type { SigilId } from '../src/rewards'

describe('regional difficulty curve', () => {
  it('increases pressure from the first region to the final region', () => {
    const low = BIOME_DIFFICULTY.gloamwood
    const middle = BIOME_DIFFICULTY.rotfen
    const high = BIOME_DIFFICULTY['ashen-ruins']
    expect([low.threatLevel, middle.threatLevel, high.threatLevel]).toEqual([1, 2, 3])
    expect(low.healthMultiplier).toBeLessThan(middle.healthMultiplier)
    expect(middle.healthMultiplier).toBeLessThan(high.healthMultiplier)
    expect(low.damageMultiplier).toBeLessThan(middle.damageMultiplier)
    expect(middle.damageMultiplier).toBeLessThan(high.damageMultiplier)
    expect(low.cooldownMultiplier).toBeGreaterThan(middle.cooldownMultiplier)
    expect(middle.cooldownMultiplier).toBeGreaterThan(high.cooldownMultiplier)
  })

  it('scales health, cooldown and damage deterministically', () => {
    expect(scaledEnemyHealth(4, 'gloamwood', false)).toBe(4)
    expect(scaledEnemyHealth(4, 'ashen-ruins', false)).toBe(6)
    expect(scaledEnemyHealth(4, 'ashen-ruins', true)).toBe(18)
    expect(scaledEnemyCooldown(1000, 'rotfen')).toBe(920)
    expect(scaledEnemyDamage(16, 'ashen-ruins')).toBe(21)
  })
})

describe('stage threat window', () => {
  it('keeps stages 0-5 mild and jumps clearly at stage 6', () => {
    const early = threatForEvolutionStage(0)
    const beforeSurge = threatForEvolutionStage(STAGE_THREAT_CONFIG.mildThroughStage)
    const surge = threatForEvolutionStage(STAGE_THREAT_CONFIG.surgeFromStage)
    const overgrowth = threatForEvolutionStage(STAGE_THREAT_CONFIG.surgeFromStage + 2)
    expect(early.healthMultiplier).toBe(1)
    expect(early.damageMultiplier).toBe(1)
    expect(early.surge).toBe(false)
    expect(beforeSurge.healthMultiplier).toBeLessThan(1.2)
    expect(surge.surge).toBe(true)
    expect(surge.healthMultiplier).toBeGreaterThan(beforeSurge.healthMultiplier + 0.15)
    expect(surge.damageMultiplier).toBeGreaterThan(beforeSurge.damageMultiplier + 0.12)
    expect(overgrowth.healthMultiplier).toBeGreaterThan(surge.healthMultiplier)
    expect(overgrowth.bossHealthMultiplier).toBeGreaterThan(surge.bossHealthMultiplier)
    expect(surge.bossHealthMultiplier).toBe(1)
  })

  it('applies stage multipliers on top of biome scaling', () => {
    const stage6 = STAGE_THREAT_CONFIG.surgeFromStage
    expect(scaledEnemyHealth(10, 'gloamwood', false, stage6)).toBeGreaterThan(
      scaledEnemyHealth(10, 'gloamwood', false, 0),
    )
    expect(scaledEnemyDamage(10, 'rotfen', stage6)).toBeGreaterThan(scaledEnemyDamage(10, 'rotfen', 0))
    expect(scaledEnemyHealth(10, 'gloamwood', true, stage6)).toBeGreaterThan(
      scaledEnemyHealth(10, 'gloamwood', false, stage6),
    )
  })

  it('adds extra elites only after the optional-boss window, and keeps guards elite', () => {
    expect(extraEliteChanceForStage(0)).toBe(0)
    expect(extraEliteChanceForStage(5)).toBe(0)
    expect(extraEliteChanceForStage(6)).toBeGreaterThanOrEqual(0.25)
    expect(isEncounterEliteAtStage('gloamwood-1', 'seed-a', 0, false)).toBe(false)
    expect(isEncounterEliteAtStage('gloamwood-5', 'seed-a', 0, true)).toBe(true)
    const commons = ENCOUNTERS
      .filter((encounter) => !REWARD_SITES.some((site) => site.guardEncounterId === encounter.id))
      .map((encounter) => encounter.id)
    const surgeElites = commons.filter((id) => isEncounterEliteAtStage(id, 'window-seed', 6, false))
    expect(surgeElites.length).toBeGreaterThan(0)
    expect(surgeElites.length).toBeLessThan(commons.length)
    for (const id of surgeElites) {
      expect(isEncounterEliteAtStage(id, 'window-seed', 8, false)).toBe(true)
    }
    expect(isEncounterEliteAtStage('gloamwood-5-brood-1', 'window-seed', 8, false)).toBe(false)
  })

  it('hardens the boss only when the player overgrows past the challenge stage', () => {
    expect(scaledBossHealth(72, 6)).toBe(72)
    expect(scaledBossDamage(22, 6)).toBe(22)
    expect(scaledBossHealth(72, 8)).toBeGreaterThan(72)
    expect(scaledBossDamage(22, 8)).toBeGreaterThan(22)
  })
})

describe('white orb decay', () => {
  it('keeps woodland white orbs full through the first evolution, then decays', () => {
    expect(whiteOrbValue('gloamwood', 0)).toBe(WHITE_ORB_DECAY_CONFIG.baseCommonBiomass)
    expect(whiteOrbValue('gloamwood', 1)).toBe(WHITE_ORB_DECAY_CONFIG.baseCommonBiomass)
    expect(whiteOrbMultiplier('gloamwood', 1)).toBe(1)
    expect(whiteOrbValue('gloamwood', 6)).toBeLessThan(whiteOrbValue('gloamwood', 1))
    expect(whiteOrbValue('gloamwood', 8)).toBeLessThanOrEqual(whiteOrbValue('gloamwood', 6))
    expect(whiteOrbValue('gloamwood', 12)).toBeGreaterThanOrEqual(
      Math.round(WHITE_ORB_DECAY_CONFIG.baseCommonBiomass * WHITE_ORB_DECAY_CONFIG.minimumMultiplier),
    )
  })

  it('does not tax swamp or ruins white orbs, or red and gold orbs', () => {
    expect(whiteOrbValue('rotfen', 8)).toBe(WHITE_ORB_DECAY_CONFIG.baseCommonBiomass)
    expect(whiteOrbValue('ashen-ruins', 8)).toBe(WHITE_ORB_DECAY_CONFIG.baseCommonBiomass)
    const woodlandWhite = soulOrbDropFor({ gene: 'fang', biome: 'gloamwood', stage: 6 })
    const woodlandRed = soulOrbDropFor({
      gene: 'fang',
      elite: true,
      eliteAffix: 'berserker',
      biome: 'gloamwood',
      stage: 6,
    })
    const woodlandGold = soulOrbDropFor({ gene: 'rift', isBoss: true, biome: 'gloamwood', stage: 8 })
    expect(woodlandWhite.biomass).toBeLessThan(SOUL_ORB_CONFIG.common.biomass)
    expect(woodlandRed.biomass).toBe(SOUL_ORB_CONFIG.elite.biomass)
    expect(woodlandGold.biomass).toBe(bossSoulOrbDrop().biomass)
  })
})

describe('optional boss copy and conditions', () => {
  it('opens the nest only with every sigil and the required stage', () => {
    const sigils = new Set<SigilId>(REWARD_SITES.map((site) => site.sigil))
    expect(isLairUnlocked(sigils)).toBe(true)
    expect(canChallengeBoss(sigils, 5)).toBe(false)
    expect(canChallengeBoss(new Set<SigilId>(), 6)).toBe(false)
    expect(canChallengeBoss(sigils, 6)).toBe(true)
    expect(canChallengeBoss(sigils, 8)).toBe(true)
  })

  it('tells the player they can fight now or stay while the world gets worse', () => {
    expect(huntObjectiveCopy({
      bossDefeated: false,
      bossActive: false,
      bossPhase: 1,
      canChallenge: true,
      lairUnlocked: true,
      sigilCount: 3,
      sigilRequired: 3,
      stage: 6,
      requiredStage: 6,
    })).toContain('可立刻进巢穴打Boss')
    expect(huntObjectiveCopy({
      bossDefeated: false,
      bossActive: false,
      bossPhase: 1,
      canChallenge: true,
      lairUnlocked: true,
      sigilCount: 3,
      sigilRequired: 3,
      stage: 8,
      requiredStage: 6,
    })).toContain('留下')
    expect(lairPromptCopy({
      canChallenge: true,
      lairUnlocked: true,
      remainingSigils: 0,
      stage: 6,
      requiredStage: 6,
    })).toContain('现在打或继续猎杀')
    expect(biomeThreatCopy('gloamwood', 6)).toContain('阶段压迫')
    expect(formatEvolutionStageLabel(6, 6)).toBe('6/6')
    expect(formatEvolutionStageLabel(8, 6)).toContain('过载')
  })

  it('makes world events hazardous after the surge without deleting their rewards', () => {
    const calm = applyEventHazard(EVENT_OUTCOMES[0], 1)
    const harsh = applyEventHazard(EVENT_OUTCOMES[1], 6)
    expect(calm.health).toBe(EVENT_OUTCOMES[0].health)
    expect(harsh.health).toBeLessThan(EVENT_OUTCOMES[1].health)
    expect(harsh.evolution).toBe(EVENT_OUTCOMES[1].evolution)
    expect(harsh.name).toContain('险变')
  })
})
