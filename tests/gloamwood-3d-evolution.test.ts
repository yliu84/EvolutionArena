import { describe, expect, it } from 'vitest'

import { gloamwoodPlayerDamageTaken } from '../src/gloamwood-3d-combat'

import {
  createGloamwoodEvolutionState,
  generateGloamwoodEvolutionCandidates,
  openGloamwoodEvolutionOffer,
  refreshGloamwoodEvolutionOffer,
  selectGloamwoodEvolutionCandidate,
  GLOAMWOOD_EVOLUTION_GROWTH,
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
  it('makes every evolution tougher, whatever route it is', () => {
    // Both Fang candidates carry maximumHealthBonus 0 and damageReduction 0, so
    // taking that line handed the player a bigger body that died exactly as
    // fast as the old one. The route is the specialisation; the stage is the
    // growth, and they were the same thing.
    expect(GLOAMWOOD_EVOLUTION_GROWTH.maximumHealthBonus).toBeGreaterThan(0)
    expect(GLOAMWOOD_EVOLUTION_GROWTH.flatArmour).toBeGreaterThan(0)
  })

  it('covers the route that costs health, rather than leaving it a downgrade', () => {
    // One Swarm candidate trades 10 maximum health for speed. Growth has to at
    // least meet it, or evolving can measurably leave the player worse off.
    // Read off the pool through the generator, since the pool itself is private.
    const seen = new Set<number>()
    for (let offer = 0; offer < 24; offer += 1) {
      for (const candidate of generateGloamwoodEvolutionCandidates(7, offer, { fang: 3, shell: 3, swarm: 3 }, [])) {
        seen.add(candidate.modifiers.maximumHealthBonus)
      }
    }
    const worst = Math.min(...seen)
    expect(worst).toBeLessThan(0)
    expect(GLOAMWOOD_EVOLUTION_GROWTH.maximumHealthBonus + worst).toBeGreaterThanOrEqual(0)
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
