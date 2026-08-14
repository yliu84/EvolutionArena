import { describe, expect, it } from 'vitest'
import {
  EVOLUTION_CONFIG,
  MUTATIONS,
  applyMutationEffect,
  comboFormFor,
  createSeededRandom,
  currentFormName,
  dominantGene,
  emptyGenes,
  evolutionCollisionScale,
  evolutionRequirementForStage,
  evolutionScaleForStage,
  geneLean,
  leanReason,
  recordRecentHunt,
  resistEvolutionProgress,
  resolveHuntEvolution,
  selectMutationCandidates,
  type MutationStatState,
} from '../src/evolution'

const baseStats = (): MutationStatState => ({
  bulletDamage: 1,
  meleeDamageBonus: 0,
  rangedDamageBonus: 0,
  magicDamageBonus: 0,
  playerSpeed: 300,
  dodgeCooldownMultiplier: 1,
  maxHealth: 90,
  health: 90,
  defenseReduction: 0.05,
  biomassGainMultiplier: 1,
  killHeal: 0,
  contactRetaliationDamage: 0,
  shotCooldown: 520,
  magicRadius: 96,
})

describe('hunt-driven evolution', () => {
  it('weights recent hunts at 60% and cumulative genes at 40%', () => {
    const genes = { ...emptyGenes(), fang: 8, wing: 2 }
    const recent = ['wing', 'wing', 'wing'] as const
    const lean = geneLean(genes, recent)
    expect(lean.wing).toBeGreaterThan(lean.fang)
    expect(lean.wing).toBeCloseTo(0.6 + 0.4 * 0.2, 2)
  })

  it('records only the most recent hunts', () => {
    const hunts = ['fang', 'fang', 'fang', 'fang', 'fang', 'fang', 'wing'] as const
    const recent = hunts.reduce((list, family) => recordRecentHunt(list, family), [] as ReturnType<typeof recordRecentHunt>)
    expect(recent).toEqual(['fang', 'fang', 'fang', 'fang', 'fang', 'wing'])
  })

  it('lets recent wing hunts decide the automatic growth', () => {
    const genes = { ...emptyGenes(), fang: 1, wing: 1 }
    const result = resolveHuntEvolution(
      MUTATIONS,
      genes,
      {},
      ['wing', 'wing', 'wing', 'wing'],
      () => 0,
    )
    expect(result?.family).toBe('wing')
    expect(result?.kind).toBe('dominant')
    expect(result?.reason).toContain('翼族')
  })

  it('forms a combo when two gene leans are close', () => {
    const genes = { ...emptyGenes(), fang: 5, carapace: 5 }
    const result = resolveHuntEvolution(
      MUTATIONS,
      genes,
      {},
      ['fang', 'carapace', 'fang', 'carapace'],
      () => 0,
    )
    expect(result?.kind).toBe('combo')
    expect(result?.comboName).toBe('装甲暴君')
    expect(comboFormFor('fang', 'carapace')?.name).toBe('装甲暴君')
  })

  it('injects a wild mutation after repeating the same family', () => {
    const genes = { ...emptyGenes(), fang: 6 }
    const result = resolveHuntEvolution(
      MUTATIONS,
      genes,
      {},
      ['fang', 'fang', 'fang', 'fang'],
      () => 0,
      ['fang', 'fang'],
    )
    expect(result?.kind).toBe('wild')
    expect(result?.family).not.toBe('fang')
  })

  it('excludes mutations already at maximum rank', () => {
    const ranks = { 'swift-nerves': 2, 'wind-sacs': 2 }
    const result = resolveHuntEvolution(
      MUTATIONS,
      { ...emptyGenes(), wing: 4 },
      ranks,
      ['wing', 'wing', 'wing'],
      () => 0,
    )
    expect(result?.family).not.toBe('wing')
  })

  it('returns null when the pool is exhausted', () => {
    const ranks = Object.fromEntries(MUTATIONS.map((mutation) => [mutation.id, mutation.maxRank]))
    expect(resolveHuntEvolution(MUTATIONS, emptyGenes(), ranks, [], () => 0)).toBeNull()
  })

  it('is reproducible with the same seed', () => {
    const genes = { ...emptyGenes(), venom: 3, rift: 2 }
    const recent = ['venom', 'rift', 'venom'] as const
    const first = resolveHuntEvolution(MUTATIONS, genes, {}, recent, createSeededRandom(42))
    const second = resolveHuntEvolution(MUTATIONS, genes, {}, recent, createSeededRandom(42))
    expect(first?.mutation.id).toBe(second?.mutation.id)
    expect(first?.kind).toBe(second?.kind)
  })

  it('keeps visual growth larger than collision growth', () => {
    expect(evolutionScaleForStage(6)).toBe(1.58)
    expect(evolutionCollisionScale(1.58)).toBeCloseTo(1.2)
    expect(evolutionCollisionScale(1.24)).toBeLessThan(1.12)
    expect(evolutionRequirementForStage(0)).toBe(60)
    expect(evolutionRequirementForStage(8, [60, 80, 90, 100, 110, 120, 130, 140, 150, 160])).toBe(150)
    expect(evolutionRequirementForStage(20, [60, 80, 90, 100, 110, 120, 130, 140, 150, 160])).toBe(160)
  })

  it('explains the hunt that is shaping the body', () => {
    const genes = { ...emptyGenes(), wing: 1 }
    const recent = ['wing', 'wing', 'wing', 'wing']
    const reason = leanReason(geneLean(genes, recent), recent)
    expect(reason).toContain('4只翼族')
    expect(currentFormName({}, genes, recent)).toBe('翼族捕食者')
  })

  it('applies every mutation family to combat stats', () => {
    let stats = baseStats()
    stats = applyMutationEffect(stats, 'all-damage')
    stats = applyMutationEffect(stats, 'melee-damage')
    stats = applyMutationEffect(stats, 'move-speed')
    stats = applyMutationEffect(stats, 'dodge-cooldown')
    stats = applyMutationEffect(stats, 'maximum-health')
    stats = applyMutationEffect(stats, 'damage-reduction')
    stats = applyMutationEffect(stats, 'biomass-gain')
    stats = applyMutationEffect(stats, 'kill-heal')
    stats = applyMutationEffect(stats, 'ranged-damage')
    stats = applyMutationEffect(stats, 'contact-retaliation')
    stats = applyMutationEffect(stats, 'ranged-cooldown')
    stats = applyMutationEffect(stats, 'magic-focus')
    expect(stats.bulletDamage).toBe(2)
    expect(stats.meleeDamageBonus).toBe(1)
    expect(stats.playerSpeed).toBe(336)
    expect(stats.dodgeCooldownMultiplier).toBe(0.85)
    expect(stats.maxHealth).toBe(115)
    expect(stats.defenseReduction).toBeCloseTo(0.1)
    expect(stats.biomassGainMultiplier).toBe(1.15)
    expect(stats.killHeal).toBe(4)
    expect(stats.rangedDamageBonus).toBe(1)
    expect(stats.contactRetaliationDamage).toBe(1)
    expect(stats.shotCooldown).toBe(Math.round(520 * 0.88))
    expect(stats.magicRadius).toBe(Math.round(96 * 1.18))
    expect(stats.magicDamageBonus).toBe(1)
  })

  it('keeps most of the biomass bar after a resist', () => {
    expect(resistEvolutionProgress(60, 60)).toBe(Math.round(60 * EVOLUTION_CONFIG.resistProgressKeep))
  })
})

describe('selectMutationCandidates compatibility', () => {
  it('returns an empty list for an empty pool', () => {
    expect(selectMutationCandidates([], emptyGenes(), {}, 3, () => 0.5)).toEqual([])
  })

  it('lets an extreme gene weight dominate the first draw', () => {
    const genes = { ...emptyGenes(), carapace: 1000 }
    const pool = MUTATIONS.filter((mutation) => mutation.id === 'serrated-claws' || mutation.id === 'reactive-shell')
    const result = selectMutationCandidates(pool, genes, {}, 1, () => 0)
    expect(result[0].id).toBe('reactive-shell')
    expect(result[0].isGeneFavored).toBe(true)
  })
})

describe('dominantGene', () => {
  it('follows recent hunts when cumulative genes are tied', () => {
    const genes = { ...emptyGenes(), fang: 2, wing: 2 }
    expect(dominantGene(genes, ['wing', 'wing', 'wing'])).toBe('wing')
  })
})
