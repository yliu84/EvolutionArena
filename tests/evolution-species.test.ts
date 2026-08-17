import { describe, expect, it } from 'vitest'
import { emptyGenes, type MutationStatState } from '../src/evolution'
import {
  EVOLUTION_APEX_SPECIES,
  EVOLUTION_SPECIES_CATALOG,
  applySpeciesMechanics,
  combatStyleForSpecies,
  quality3DAssetStageForSpecies,
  resolveEvolutionSpecies,
} from '../src/evolution-species'

const baseStats = (): MutationStatState => ({
  bulletDamage: 2,
  meleeDamageBonus: 1,
  rangedDamageBonus: 0,
  magicDamageBonus: 0,
  playerSpeed: 330,
  dodgeCooldownMultiplier: 1,
  maxHealth: 90,
  health: 90,
  defenseReduction: 0.05,
  biomassGainMultiplier: 1,
  killHeal: 0,
  contactRetaliationDamage: 0,
  shotCooldown: 520,
  magicRadius: 112,
})

describe('random evolution species catalog', () => {
  it('defines exactly 1 origin, 6 lineages and 13 reachable apex endpoints', () => {
    expect(EVOLUTION_SPECIES_CATALOG).toHaveLength(20)
    expect(EVOLUTION_SPECIES_CATALOG.filter((entry) => entry.kind === 'origin')).toHaveLength(1)
    expect(EVOLUTION_SPECIES_CATALOG.filter((entry) => entry.kind === 'lineage')).toHaveLength(6)
    expect(EVOLUTION_APEX_SPECIES).toHaveLength(13)
    expect(new Set(EVOLUTION_SPECIES_CATALOG.map((entry) => entry.id)).size).toBe(20)
    expect(new Set(EVOLUTION_APEX_SPECIES.map((entry) => entry.routeId)).size).toBe(13)
  })

  it('resolves a pure Fang run through its lineage into the Bloodfang apex', () => {
    const genes = { ...emptyGenes(), fang: 12, wing: 3 }
    const middle = resolveEvolutionSpecies(2, genes, ['fang', 'fang', 'wing', 'fang'])
    const apex = resolveEvolutionSpecies(6, genes, ['fang', 'fang', 'wing', 'fang'])
    expect(middle.definition.id).toBe('scarlet-hunter')
    expect(resolveEvolutionSpecies(1, genes, ['fang', 'fang']).formId).toBe('scarlet-gecko')
    expect(middle.routeId).toBe('fang')
    expect(apex.definition.id).toBe('bloodfang-tyrant')
    expect(apex.endpoint).toBe(true)
    expect(quality3DAssetStageForSpecies(middle, 2)).toBe(2)
    expect(quality3DAssetStageForSpecies(apex, 6)).toBeNull()
  })

  it('resolves balanced compatible genes into one of seven curated hybrid endpoints', () => {
    const genes = { ...emptyGenes(), fang: 8, wing: 8 }
    const apex = resolveEvolutionSpecies(6, genes, ['fang', 'wing', 'fang', 'wing'])
    expect(apex.definition.id).toBe('gale-reaper')
    expect(apex.routeId).toBe('fang-wing')
    expect(apex.secondaryFamily).toBe('wing')
    expect(quality3DAssetStageForSpecies(apex, 6)).toBeNull()
  })

  it('falls back to a pure endpoint for an unsupported family pair', () => {
    const genes = { ...emptyGenes(), fang: 8, rift: 8 }
    const apex = resolveEvolutionSpecies(6, genes, ['fang', 'rift', 'fang', 'rift'])
    expect(apex.routeId).toBe('fang')
    expect(apex.definition.id).toBe('bloodfang-tyrant')
  })

  it('gives every apex a distinct authoritative stat result and a declared cost', () => {
    const outcomes = EVOLUTION_APEX_SPECIES.map((entry) => applySpeciesMechanics(baseStats(), entry))
    expect(new Set(outcomes.map((stats) => JSON.stringify(stats))).size).toBe(13)
    for (const entry of EVOLUTION_APEX_SPECIES) {
      expect(entry.normalAttackProfile.length).toBeGreaterThan(2)
      expect(entry.locomotionProfile.length).toBeGreaterThan(2)
      expect(entry.passive.length).toBeGreaterThan(2)
      expect(entry.tradeoff.length).toBeGreaterThan(2)
      expect(Object.keys(entry.modifiers).length).toBeGreaterThan(0)
    }
  })

  it('applies strengths and tradeoffs to the same authoritative stat structure', () => {
    const wing = EVOLUTION_APEX_SPECIES.find((entry) => entry.routeId === 'wing')!
    const shell = EVOLUTION_APEX_SPECIES.find((entry) => entry.routeId === 'carapace')!
    const wingStats = applySpeciesMechanics(baseStats(), wing)
    const shellStats = applySpeciesMechanics(baseStats(), shell)
    expect(wingStats.playerSpeed).toBeGreaterThan(baseStats().playerSpeed)
    expect(wingStats.maxHealth).toBeLessThan(baseStats().maxHealth)
    expect(shellStats.maxHealth).toBeGreaterThan(baseStats().maxHealth)
    expect(shellStats.playerSpeed).toBeLessThan(baseStats().playerSpeed)
    expect(shellStats.defenseReduction).toBeGreaterThan(wingStats.defenseReduction)
  })

  it('maps species mechanics to real normal-attack styles without enabling skills', () => {
    const byRoute = Object.fromEntries(EVOLUTION_APEX_SPECIES.map((entry) => [entry.routeId, combatStyleForSpecies(entry)]))
    expect(byRoute.fang).toBe('melee')
    expect(byRoute.venom).toBe('ranged')
    expect(byRoute.rift).toBe('magic')
    expect(byRoute['fang-wing']).toBe('melee')
    expect(byRoute['wing-venom']).toBe('ranged')
    expect(byRoute['rift-swarm']).toBe('magic')
  })
})
