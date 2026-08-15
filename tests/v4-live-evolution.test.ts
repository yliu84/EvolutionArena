import { describe, expect, it } from 'vitest'
import { soulOrbDropFor } from '../src/soul-orbs'
import {
  V4_BOSS_REQUIRED_NESTS,
  V4_BOSS_REQUIRED_STAGE,
  canChallengeV4Boss,
  collectV4SoulOrb,
  createV4LiveEvolutionState,
  createV4RouteAcceptanceState,
  grantV4NestReward,
  resistV4Evolution,
  resolveV4Evolution,
} from '../src/v4-live-evolution'

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
