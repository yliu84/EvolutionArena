import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_MUTATION_BIOMASS_STEP,
  GLOAMWOOD_MUTATION_POOL,
  accumulateGloamwoodMutationEffects,
  createGloamwoodMutationState,
  generateGloamwoodMutationOffers,
  gloamwoodMutationOffersEarned,
  openGloamwoodMutationOffer,
  selectGloamwoodMutation,
} from '../src/gloamwood-3d-mutations'
import { TRANSLATIONS } from '../src/i18n'

const GENES = { fang: 4, shell: 1, swarm: 1 }

describe('Mutation pool', () => {
  it('charges for every entry, because a choice without a cost is not a choice', () => {
    for (const mutation of GLOAMWOOD_MUTATION_POOL) {
      const cost = TRANSLATIONS[`mutation.${mutation.id}.cost` as keyof typeof TRANSLATIONS]
      expect(cost, mutation.id).toBeDefined()
      expect(cost.en.trim(), mutation.id).not.toBe('')
    }
  })

  it('changes rules rather than nudging percentages', () => {
    // The evolution options this layer exists to replace read "damage -6%" and
    // "speed +14%", which no player feels and none plays differently for. Every
    // entry here either changes a rule outright or moves a number far enough to
    // notice.
    for (const mutation of GLOAMWOOD_MUTATION_POOL) {
      const values = Object.entries(mutation.effects)
      const rewritesARule = values.some(([key]) =>
        !key.endsWith('Multiplier') || ['executeMultiplier', 'luredTargetMultiplier'].includes(key))
      const movesANumberHard = values.some(([key, value]) =>
        key.endsWith('Multiplier') && typeof value === 'number' && Math.abs(value - 1) >= 0.1)
      expect(rewritesARule || movesANumberHard, mutation.id).toBe(true)
    }
  })

  it('covers every family plus neutral', () => {
    const families = new Set(GLOAMWOOD_MUTATION_POOL.map((mutation) => mutation.family))
    expect([...families].sort()).toEqual(['fang', 'neutral', 'shell', 'swarm'])
  })
})

describe('Mutation pacing', () => {
  it('spreads offers across the run rather than lumping them at the end', () => {
    // A full run yields 76 biomass from prey: 16 + 22 + 38 across three waves.
    expect(GLOAMWOOD_MUTATION_BIOMASS_STEP).toBe(14)
    expect(gloamwoodMutationOffersEarned(0)).toBe(0)
    expect(gloamwoodMutationOffersEarned(13)).toBe(0)
    expect(gloamwoodMutationOffersEarned(16)).toBe(1)
    expect(gloamwoodMutationOffersEarned(38)).toBe(2)
    expect(gloamwoodMutationOffersEarned(76)).toBe(5)
  })
})

describe('Mutation draw', () => {
  it('is reproducible from the seed, so Goal 3 acceptance survives', () => {
    const first = generateGloamwoodMutationOffers(1234, 0, GENES, [])
    const again = generateGloamwoodMutationOffers(1234, 0, GENES, [])
    expect(again.map((offer) => offer.id)).toEqual(first.map((offer) => offer.id))
    const other = generateGloamwoodMutationOffers(9876, 0, GENES, [])
    expect(other.map((offer) => offer.id)).not.toEqual(first.map((offer) => offer.id))
  })

  it('offers three distinct entries and never repeats one already taken', () => {
    const offers = generateGloamwoodMutationOffers(77, 0, GENES, ['fang-thin-hide'])
    expect(offers).toHaveLength(3)
    expect(new Set(offers.map((offer) => offer.id)).size).toBe(3)
    expect(offers.map((offer) => offer.id)).not.toContain('fang-thin-hide')
  })

  it('weights by banked genes without ever guaranteeing', () => {
    // The form evolution teaches "Genes weight random candidates, never
    // guarantee a skin", and a mutation layer that guaranteed would make every
    // run with the same diet identical - the opposite of what it is for.
    const fangHeavy = { fang: 40, shell: 0, swarm: 0 }
    let fangDraws = 0
    let nonFangSeen = 0
    for (let seed = 0; seed < 200; seed += 1) {
      const offers = generateGloamwoodMutationOffers(seed, 0, fangHeavy, [])
      if (offers[0].family === 'fang') fangDraws += 1
      if (offers.some((offer) => offer.family === 'shell' || offer.family === 'swarm')) nonFangSeen += 1
    }
    expect(fangDraws).toBeGreaterThan(40)
    // Low weight must stay reachable.
    expect(nonFangSeen).toBeGreaterThan(20)
  })

  it('stops offering once the pool is exhausted instead of repeating', () => {
    const everything = GLOAMWOOD_MUTATION_POOL.map((mutation) => mutation.id)
    expect(generateGloamwoodMutationOffers(5, 0, GENES, everything)).toEqual([])
    const state = openGloamwoodMutationOffer({ ...createGloamwoodMutationState('x'), taken: everything }, GENES)
    expect(state.offering).toBe(false)
  })
})

describe('Taking a mutation', () => {
  it('records it, closes the offer and advances the index', () => {
    let state = openGloamwoodMutationOffer(createGloamwoodMutationState('run-1'), GENES)
    expect(state.offering).toBe(true)
    const chosen = state.candidates[1].id
    state = selectGloamwoodMutation(state, chosen)
    expect(state).toMatchObject({ offering: false, candidates: [], taken: [chosen], offerIndex: 1 })
  })

  it('ignores an id that was not on offer', () => {
    const state = openGloamwoodMutationOffer(createGloamwoodMutationState('run-2'), GENES)
    expect(selectGloamwoodMutation(state, 'not-offered')).toBe(state)
  })
})

describe('Stacking', () => {
  it('compounds multipliers and sums bonuses, so a second cost still bites', () => {
    const effects = accumulateGloamwoodMutationEffects(['fang-thin-hide', 'shell-quake'])
    expect(effects.damageMultiplier).toBeCloseTo(1.35)
    expect(effects.moveSpeedMultiplier).toBeCloseTo(0.9)
    expect(effects.maximumHealthBonus).toBe(-40)
  })

  it('charges Gluttony for every mutation held, including itself', () => {
    // Otherwise the entry is free after the first pick, which is the opposite
    // of what a high-risk option should be.
    const alone = accumulateGloamwoodMutationEffects(['neutral-gluttony'])
    expect(alone.maximumHealthBonus).toBe(-8)
    const withThree = accumulateGloamwoodMutationEffects(['neutral-gluttony', 'swarm-moult', 'shell-quake'])
    expect(withThree.maximumHealthBonus).toBe(-24)
  })

  it('keeps a suppression flag once anything sets it', () => {
    const effects = accumulateGloamwoodMutationEffects(['shell-symbiosis', 'swarm-moult'])
    expect(effects.suppressKillHeal).toBe(true)
    expect(effects.reflectFraction).toBeCloseTo(0.3)
    expect(effects.reviveFraction).toBeCloseTo(0.3)
  })

  it('is empty for a run that has taken nothing', () => {
    expect(accumulateGloamwoodMutationEffects([])).toEqual({})
  })
})
