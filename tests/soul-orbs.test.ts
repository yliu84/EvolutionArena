import { describe, expect, it } from 'vitest'
import {
  MUTATIONS,
  emptyGenes,
  geneLean,
  resolveHuntEvolution,
} from '../src/evolution'
import {
  DERIVED_STAT_LABELS,
  SOUL_ORB_CONFIG,
  bossSoulOrbDrop,
  collectSoulOrb,
  createEliteOrbBuff,
  derivedStatsFromGenes,
  eliteOrbBuffModifiers,
  eliteOrbBuffRemainingMs,
  formatDerivedStats,
  goldOrbTendencies,
  soulOrbDropFor,
  soulOrbTierFor,
  type SoulOrbCollectState,
} from '../src/soul-orbs'

const baseState = (overrides: Partial<SoulOrbCollectState> = {}): SoulOrbCollectState => ({
  genes: emptyGenes(),
  recentHunts: [],
  biomassGainMultiplier: 1,
  now: 1000,
  activeBuff: null,
  consumedGoldOrb: false,
  ...overrides,
})

describe('soul orb tiers', () => {
  it('assigns white, red, and gold orbs by prey rank', () => {
    expect(soulOrbTierFor({})).toBe('common')
    expect(soulOrbTierFor({ elite: true })).toBe('elite')
    expect(soulOrbTierFor({ elite: true, fragment: true })).toBe('common')
    expect(soulOrbTierFor({ isBoss: true })).toBe('boss')
  })

  it('gives elite orbs more biomass than common orbs, and gold the most', () => {
    const common = soulOrbDropFor({ gene: 'fang' })
    const elite = soulOrbDropFor({ gene: 'fang', elite: true, eliteAffix: 'berserker' })
    const fragment = soulOrbDropFor({ gene: 'fang', fragment: true, eliteAffix: 'brood' })
    const boss = bossSoulOrbDrop()
    expect(common.tier).toBe('common')
    expect(common.biomass).toBe(SOUL_ORB_CONFIG.common.biomass)
    expect(elite.tier).toBe('elite')
    expect(elite.biomass).toBe(SOUL_ORB_CONFIG.elite.biomass)
    expect(elite.biomass).toBeGreaterThanOrEqual(common.biomass * 2)
    expect(elite.biomass).toBeLessThanOrEqual(common.biomass * 3)
    expect(fragment.tier).toBe('common')
    expect(fragment.biomass).toBe(SOUL_ORB_CONFIG.fragmentBiomass)
    expect(boss.tier).toBe('boss')
    expect(boss.biomass).toBeGreaterThan(elite.biomass)
    expect(common.texture).not.toBe(elite.texture)
    expect(elite.texture).not.toBe(boss.texture)
  })

  it('applies one gene and one recent hunt for a white orb', () => {
    const result = collectSoulOrb(baseState(), soulOrbDropFor({ gene: 'wing' }))
    expect(result.genes.wing).toBe(1)
    expect(result.recentHunts).toEqual(['wing'])
    expect(result.biomassGranted).toBe(20)
    expect(result.buff).toBeNull()
    expect(result.message).toContain('白色魂球')
  })

  it('makes red orbs pull hunt evolution harder than white orbs', () => {
    const afterWhite = collectSoulOrb(baseState(), soulOrbDropFor({ gene: 'wing' }))
    const afterRed = collectSoulOrb(
      { ...baseState(), genes: afterWhite.genes, recentHunts: afterWhite.recentHunts },
      soulOrbDropFor({ gene: 'fang', elite: true, eliteAffix: 'siphon' }),
    )
    expect(afterRed.genes.fang).toBe(2)
    expect(afterRed.recentHunts.filter((family) => family === 'fang')).toHaveLength(2)
    expect(afterRed.biomassGranted).toBe(50)
    const evolved = resolveHuntEvolution(
      MUTATIONS,
      afterRed.genes,
      {},
      afterRed.recentHunts,
      () => 0,
    )
    expect(evolved?.family).toBe('fang')
    const mixedLean = geneLean(afterRed.genes, afterRed.recentHunts)
    expect(mixedLean.fang).toBeGreaterThan(mixedLean.wing)
  })

  it('turns the elite affix into a timed buff instead of a permanent stack', () => {
    const result = collectSoulOrb(
      baseState({ now: 2000 }),
      soulOrbDropFor({ gene: 'venom', elite: true, eliteAffix: 'volatile' }),
    )
    expect(result.buff?.affix).toBe('volatile')
    expect(result.buff?.expiresAt).toBe(2000 + SOUL_ORB_CONFIG.buffDurationMs)
    expect(result.message).toContain('毒爆')
    const active = eliteOrbBuffModifiers(result.buff, 2000)
    expect(active.contactRetaliation).toBe(4)
    expect(eliteOrbBuffModifiers(result.buff, result.buff!.expiresAt)).toEqual({
      damageMultiplier: 1,
      speedMultiplier: 1,
      defenseBonus: 0,
      lifestealRatio: 0,
      biomassGainBonus: 0,
      contactRetaliation: 0,
    })
    expect(eliteOrbBuffRemainingMs(result.buff, 5000)).toBe(SOUL_ORB_CONFIG.buffDurationMs - 3000)
  })

  it('lets an existing brood buff boost the next orb, not the red orb that created it', () => {
    const first = collectSoulOrb(
      baseState(),
      soulOrbDropFor({ gene: 'swarm', elite: true, eliteAffix: 'brood' }),
    )
    expect(first.biomassGranted).toBe(50)
    const second = collectSoulOrb(
      { ...baseState(), now: 1500, activeBuff: first.buff, biomassGainMultiplier: 1 },
      soulOrbDropFor({ gene: 'swarm' }),
    )
    expect(second.biomassGranted).toBe(30)
  })

  it('replaces the previous elite buff instead of stacking it', () => {
    const previous = createEliteOrbBuff('barrier', 0)
    const next = collectSoulOrb(
      baseState({ now: 4000, activeBuff: previous }),
      soulOrbDropFor({ gene: 'fang', elite: true, eliteAffix: 'berserker' }),
    )
    expect(next.buff?.affix).toBe('berserker')
    expect(eliteOrbBuffModifiers(next.buff, 4000).damageMultiplier).toBe(1.25)
    expect(eliteOrbBuffModifiers(next.buff, 4000).defenseBonus).toBe(0)
  })

  it('records a gold orb even when the body is already at a later stage', () => {
    const genes = { ...emptyGenes(), fang: 4, carapace: 3 }
    const result = collectSoulOrb(
      baseState({ genes, recentHunts: ['fang', 'carapace', 'fang'] }),
      bossSoulOrbDrop(),
    )
    expect(result.consumedGoldOrb).toBe(true)
    expect(result.goldOrbSummary).toContain('金色魂球')
    expect(result.biomassGranted).toBe(SOUL_ORB_CONFIG.boss.biomass)
    expect(result.genes.fang).toBeGreaterThan(genes.fang)
    expect(result.genes.carapace).toBeGreaterThan(genes.carapace)
  })

  it('pushes gold orbs toward a combo or final form instead of a third evolution tree', () => {
    const empty = goldOrbTendencies(emptyGenes(), [])
    expect(empty.primary).toBe('rift')
    expect(empty.secondary).toBe('swarm')
    expect(empty.comboName).toBe('异界孵化者')
    const grown = collectSoulOrb(
      baseState({ genes: { ...emptyGenes(), fang: 5, wing: 4 }, recentHunts: ['fang', 'wing', 'fang', 'wing'] }),
      bossSoulOrbDrop('rift'),
    )
    const evolved = resolveHuntEvolution(MUTATIONS, grown.genes, {}, grown.recentHunts, () => 0)
    expect(evolved?.kind === 'combo' || evolved?.family === 'fang' || evolved?.family === 'wing').toBe(true)
    expect(grown.goldOrbSummary).toMatch(/金色魂球/)
  })

  it('derives HUD attributes from the six gene families only', () => {
    const genes = { ...emptyGenes(), fang: 3, rift: 2 }
    expect(derivedStatsFromGenes(genes).fang).toBe(3)
    expect(derivedStatsFromGenes(genes).rift).toBe(2)
    expect(formatDerivedStats(genes)).toBe('力量 3 · 敏捷 0 · 精神 0 · 虫群 0 · 毒素 0 · 魔法 2')
    expect(DERIVED_STAT_LABELS.fang).toBe('力量')
    expect(DERIVED_STAT_LABELS.wing).toBe('敏捷')
    expect(DERIVED_STAT_LABELS.carapace).toBe('精神')
    expect(DERIVED_STAT_LABELS.rift).toBe('魔法')
  })
})
