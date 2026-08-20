import { describe, expect, it } from 'vitest'

import { gloamwoodPlayerDamageTaken } from '../src/gloamwood-3d-combat'

import {
  createGloamwoodEvolutionState,
  generateGloamwoodEvolutionCandidates,
  openGloamwoodEvolutionOffer,
  refreshGloamwoodEvolutionOffer,
  selectGloamwoodEvolutionCandidate,
  GLOAMWOOD_EVOLUTION_GROWTH,
  gloamwoodEvolutionGrowthFor,
} from '../src/gloamwood-3d-evolution'

describe('Gloamwood weighted evolution gate', () => {
  it('reproduces the same three candidates from the same seed and hunt history', () => {
    const genes = { fang: 3, shell: 2, swarm: 6 }
    const hunts = ['fang', 'fang', 'shell', 'swarm', 'swarm', 'swarm'] as const
    const first = generateGloamwoodEvolutionCandidates(714, 0, genes, hunts)
    const second = generateGloamwoodEvolutionCandidates(714, 0, genes, hunts)
    expect(first.map((candidate) => candidate.id)).toEqual(second.map((candidate) => candidate.id))
    expect(new Set(first.map((candidate) => candidate.id)).size).toBe(3)
  })

  it('turns prey genes into a strong but non-forced family bias across runs', () => {
    const fangAppearances = Array.from({ length: 120 }, (_, seed) => (
      generateGloamwoodEvolutionCandidates(seed, 0, { fang: 30, shell: 0, swarm: 0 }, ['fang', 'fang', 'fang'])
        .filter((candidate) => candidate.family === 'fang').length
    )).reduce((sum, count) => sum + count, 0)
    const shellAppearances = Array.from({ length: 120 }, (_, seed) => (
      generateGloamwoodEvolutionCandidates(seed, 0, { fang: 30, shell: 0, swarm: 0 }, ['fang', 'fang', 'fang'])
        .filter((candidate) => candidate.family === 'shell').length
    )).reduce((sum, count) => sum + count, 0)
    expect(fangAppearances).toBeGreaterThan(shellAppearances * 1.35)
    expect(shellAppearances).toBeGreaterThan(0)
  })

  it('offers combat, defense and sustain builds with authoritative tradeoffs', () => {
    const candidates = Array.from({ length: 30 }, (_, seed) => (
      generateGloamwoodEvolutionCandidates(seed, 0, { fang: 3, shell: 3, swarm: 3 }, ['fang', 'shell', 'swarm'])
    )).flat()
    expect(candidates.some((candidate) => candidate.modifiers.damageMultiplier > 1)).toBe(true)
    expect(candidates.some((candidate) => candidate.modifiers.maximumHealthBonus > 0)).toBe(true)
    expect(candidates.some((candidate) => candidate.modifiers.killHeal > 0)).toBe(true)
    expect(candidates.every((candidate) => candidate.statLine.length > 0 && candidate.reason.includes('Genes'))).toBe(true)
  })

  it('allows one resistance refresh and locks the accepted candidate', () => {
    const genes = { fang: 3, shell: 2, swarm: 6 }
    const hunts = ['fang', 'shell', 'swarm'] as const
    const opened = openGloamwoodEvolutionOffer(createGloamwoodEvolutionState('run-alpha'), genes, hunts)
    const refreshed = refreshGloamwoodEvolutionOffer(opened, genes, hunts)
    const secondRefresh = refreshGloamwoodEvolutionOffer(refreshed, genes, hunts)
    expect(refreshed.refreshesRemaining).toBe(0)
    expect(refreshed.candidates.map((candidate) => candidate.id)).not.toEqual(opened.candidates.map((candidate) => candidate.id))
    expect(secondRefresh).toBe(refreshed)
    const selected = selectGloamwoodEvolutionCandidate(refreshed, refreshed.candidates[0].id)
    expect(selected).toMatchObject({ phase: 'selected', selected: { id: refreshed.candidates[0].id } })
  })
})

describe('What growing is worth on its own', () => {
  const attacker = { damageMultiplier: 1.24, maximumHealthBonus: 0, damageReduction: 0 }
  const tank = { damageMultiplier: 1, maximumHealthBonus: 30, damageReduction: 0.12 }
  const trader = { damageMultiplier: 1, maximumHealthBonus: -10, damageReduction: 0 }

  it('gives the attack route the health and armour it does not have', () => {
    // Both Fang candidates carry maximumHealthBonus 0 and damageReduction 0, so
    // taking that line handed over a bigger body that died exactly as fast.
    const growth = gloamwoodEvolutionGrowthFor(attacker)
    expect(growth.maximumHealthBonus).toBeGreaterThan(0)
    expect(growth.flatArmour).toBeGreaterThan(0)
    expect(growth.damageMultiplier).toBe(1)
  })

  it('gives the armoured route the teeth it does not have', () => {
    // The Carapace line already arrives with +30 health and 12% reduction.
    // Topping that up again only widens the gap it was already winning.
    const growth = gloamwoodEvolutionGrowthFor(tank)
    expect(growth.damageMultiplier).toBeGreaterThan(1)
    expect(growth.maximumHealthBonus).toBe(0)
    expect(growth.flatArmour).toBe(0)
  })

  it('does not refund an axis the route deliberately traded away', () => {
    // The Swarm line sells ten maximum health for speed. Handing it straight
    // back would erase the choice the player just made.
    const growth = gloamwoodEvolutionGrowthFor(trader)
    expect(growth.maximumHealthBonus).toBe(0)
    // What it is silent about is still topped up.
    expect(growth.flatArmour).toBeGreaterThan(0)
    expect(growth.damageMultiplier).toBeGreaterThan(1)
  })

  it('always grows something, whatever is picked', () => {
    // A pick that grew nothing at all is the defect this exists to answer.
    for (let offer = 0; offer < 24; offer += 1) {
      for (const candidate of generateGloamwoodEvolutionCandidates(7, offer, { fang: 3, shell: 3, swarm: 3 }, [])) {
        const growth = gloamwoodEvolutionGrowthFor(candidate.modifiers)
        const grew = growth.maximumHealthBonus > 0 || growth.flatArmour > 0 || growth.damageMultiplier > 1
        expect(grew, candidate.id).toBe(true)
      }
    }
  })

  it('keeps the three worth about the same', () => {
    // Ten health on a hundred, one point off a blow that averages ten, a tenth
    // more damage. If they drift apart the growth starts steering the pick.
    expect(GLOAMWOOD_EVOLUTION_GROWTH.maximumHealthBonus).toBe(10)
    expect(GLOAMWOOD_EVOLUTION_GROWTH.damageMultiplier).toBeCloseTo(1.1, 6)
  })
})

describe('What a blow costs the player', () => {
  it('takes flat armour off after the percentage, not before', () => {
    expect(gloamwoodPlayerDamageTaken(20, 0.5, 1)).toBe(9)
  })

  it('is worth having at the damage this game actually deals', () => {
    // A percentage cannot do this job here: creature damage is 6, 14 and 12,
    // and 4% of any of those rounds straight back to where it started. One
    // point off every blow is 17% against the swarm that chips you down.
    expect(gloamwoodPlayerDamageTaken(6, 0.04, 0)).toBe(6)
    expect(gloamwoodPlayerDamageTaken(6, 0, 1)).toBe(5)
  })

  it('is never immunity, however much is stacked', () => {
    expect(gloamwoodPlayerDamageTaken(6, 0.9, 99)).toBe(1)
    expect(gloamwoodPlayerDamageTaken(1, 0, 5)).toBe(1)
  })
})
