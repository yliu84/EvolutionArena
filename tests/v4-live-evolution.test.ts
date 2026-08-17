import { describe, expect, it } from 'vitest'
import { soulOrbDropFor } from '../src/soul-orbs'
import {
  V4_BOSS_REQUIRED_NESTS,
  V4_BOSS_REQUIRED_STAGE,
  canChallengeV4Boss,
  collectV4SoulOrb,
  createV4LiveEvolutionState,
  createV4RouteAcceptanceState,
  currentV4EvolutionSpecies,
  grantV4NestReward,
  resistV4Evolution,
  resolveV4Evolution,
} from '../src/v4-live-evolution'
import { EVOLUTION_APEX_SPECIES } from '../src/evolution-species'

it('requires five cleared nests and all six core evolution stages before the V4 boss', () => {
  expect(canChallengeV4Boss(V4_BOSS_REQUIRED_NESTS, V4_BOSS_REQUIRED_STAGE)).toBe(true)
  expect(canChallengeV4Boss(V4_BOSS_REQUIRED_NESTS - 1, V4_BOSS_REQUIRED_STAGE)).toBe(false)
  expect(canChallengeV4Boss(V4_BOSS_REQUIRED_NESTS, V4_BOSS_REQUIRED_STAGE - 1)).toBe(false)
})

it('builds mechanically distinct six-stage Fang, Carapace and Rift acceptance routes', () => {
  const routes = (['fang', 'carapace', 'rift'] as const).map((family) => createV4RouteAcceptanceState(family))
  for (const route of routes) {
    expect(route.evolutionStage).toBe(6)
    expect(route.evolutionChain).toHaveLength(6)
    expect(canChallengeV4Boss(5, route.evolutionStage)).toBe(true)
  }
  expect(new Set(routes.map((route) => JSON.stringify(route.stats))).size).toBe(3)
  expect(routes[0].stats.meleeDamageBonus).toBeGreaterThan(routes[1].stats.meleeDamageBonus)
  expect(routes[1].stats.maxHealth).toBeGreaterThan(routes[2].stats.maxHealth)
  expect(routes[2].stats.biomassGainMultiplier).toBeGreaterThan(routes[0].stats.biomassGainMultiplier)
})

it('builds a bounded first-evolution acceptance state for model validation', () => {
  const state = createV4RouteAcceptanceState('fang', undefined, 1)
  expect(state.evolutionStage).toBe(1)
  expect(state.evolutionChain).toHaveLength(1)
  expect(state.lastMessage).toBe('fang1阶段路线验收')
  expect(canChallengeV4Boss(5, state.evolutionStage)).toBe(false)
})

it('builds all 13 pure and curated hybrid Apex endpoints with distinct authoritative stats', () => {
  const states = EVOLUTION_APEX_SPECIES.map((endpoint) => {
    const [primary, secondary] = endpoint.families
    const state = createV4RouteAcceptanceState(primary, undefined, 6, secondary)
    return { endpoint, state, resolved: currentV4EvolutionSpecies(state) }
  })
  expect(states).toHaveLength(13)
  expect(new Set(states.map(({ resolved }) => resolved.id)).size).toBe(13)
  expect(new Set(states.map(({ state }) => JSON.stringify(state.stats))).size).toBe(13)
  for (const { endpoint, state, resolved } of states) {
    expect(resolved.id).toBe(endpoint.id)
    expect(state.apexSpeciesId).toBe(endpoint.id)
    expect(state.evolutionStage).toBe(6)
  }
})

it('locks an Apex endpoint even if later overgrowth genes shift the live tendency', () => {
  const state = createV4RouteAcceptanceState('fang')
  const shifted = {
    ...state,
    genes: { ...state.genes, fang: 12, rift: 99 },
    recentHunts: ['rift', 'rift', 'rift', 'rift'] as const,
  }
  expect(currentV4EvolutionSpecies(shifted).id).toBe('bloodfang-tyrant')
})

describe('V4 live evolution controller', () => {
  it('turns three common hunts into a pending first evolution', () => {
    let state = createV4LiveEvolutionState()
    state = collectV4SoulOrb(state, soulOrbDropFor({ gene: 'fang' }), 100)
    state = collectV4SoulOrb(state, soulOrbDropFor({ gene: 'wing' }), 200)
    state = collectV4SoulOrb(state, soulOrbDropFor({ gene: 'swarm' }), 300)

    expect(state.evolution).toBe(60)
    expect(state.pendingEvolutionAt).toBe(2500)
    expect(state.genes).toMatchObject({ fang: 1, wing: 1, swarm: 1 })
    expect(state.recentHunts).toEqual(['fang', 'wing', 'swarm'])
    expect(state.collectedOrbs.common).toBe(3)
  })

  it('resolves the emerged family into a mechanical mutation after preview', () => {
    let state = createV4LiveEvolutionState()
    for (const [index, family] of (['fang', 'wing', 'swarm'] as const).entries()) {
      state = collectV4SoulOrb(state, soulOrbDropFor({ gene: family }), 100 + index * 100)
    }

    expect(resolveV4Evolution(state, 2499, 3, () => 0).evolved).toBeNull()
    const result = resolveV4Evolution(state, 2500, 3, () => 0)

    expect(result.evolved).not.toBeNull()
    expect(result.state.evolutionStage).toBe(1)
    expect(result.state.evolution).toBe(0)
    expect(result.state.evolutionChain).toHaveLength(1)
    expect(Object.values(result.state.mutationRanks).reduce((sum, rank) => sum + (rank ?? 0), 0)).toBe(1)
    expect(result.state.stats).not.toEqual(createV4LiveEvolutionState().stats)
  })

  it('keeps seventy percent of the threshold when the one Resist is used', () => {
    let state = createV4LiveEvolutionState()
    for (const family of ['fang', 'fang', 'wing'] as const) {
      state = collectV4SoulOrb(state, soulOrbDropFor({ gene: family }), 100)
    }
    state = resistV4Evolution(state)

    expect(state.evolution).toBe(42)
    expect(state.pendingEvolutionAt).toBe(0)
    expect(state.resistCharges).toBe(0)
    expect(resistV4Evolution(state)).toBe(state)
  })

  it('lets a cleared nest contribute genes and cross the biomass threshold', () => {
    let state = createV4LiveEvolutionState()
    state = collectV4SoulOrb(state, soulOrbDropFor({ gene: 'carapace' }), 100)
    state = grantV4NestReward(state, { family: 'carapace', genes: 4, evolution: 44 }, 500)

    expect(state.evolution).toBe(60)
    expect(state.genes.carapace).toBe(5)
    expect(state.pendingEvolutionAt).toBe(2700)
  })
})
