import { describe, expect, it } from 'vitest'

import {
  createGloamwoodEvolutionState,
  generateGloamwoodEvolutionCandidates,
  openGloamwoodEvolutionOffer,
  refreshGloamwoodEvolutionOffer,
  selectGloamwoodEvolutionCandidate,
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
    expect(candidates.every((candidate) => candidate.statLine.length > 0 && candidate.reason.includes('基因'))).toBe(true)
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
