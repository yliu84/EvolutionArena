import { describe, expect, it } from 'vitest'
import { evolutionVisualFamily, playerEvolutionAppearance, mutationRankForFamily } from '../src/player-evolution-visual'
import { emptyGenes, type EvolutionRecord } from '../src/evolution'

describe('player evolution visual profile', () => {
  it('shows the family that actually emerged when mixed genes resolve a different mutation', () => {
    const genes = emptyGenes()
    genes.fang = 1
    genes.wing = 1
    genes.swarm = 1
    const wingGrowth: EvolutionRecord = {
      stage: 1,
      mutationId: 'swift-nerves',
      family: 'wing',
      name: '迅捷神经',
      kind: 'combo',
      reason: '混合猎杀形成翼族生长',
      comboName: '疾风猎杀者',
      kills: 3,
    }

    expect(evolutionVisualFamily([], genes, ['fang', 'wing', 'swarm'])).toBe('fang')
    expect(evolutionVisualFamily([wingGrowth], genes, ['fang', 'wing', 'swarm'])).toBe('wing')
  })

  it('creates a visibly growing six-stage silhouette', () => {
    const stages = Array.from({ length: 7 }, (_, stage) => playerEvolutionAppearance(stage, 'fang', {}))
    expect(stages.map((profile) => profile.stage)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(stages[6].bodyLength).toBeGreaterThan(stages[0].bodyLength)
    expect(stages[6].limbReach).toBeGreaterThan(stages[0].limbReach)
    expect(stages[6].dorsalSpikes).toBeGreaterThan(stages[1].dorsalSpikes)
    expect(stages[6].apex).toBe(true)
    expect(stages[6].tier).toBe('apex')
  })

  it('makes the fang route alter attack silhouette, not just color', () => {
    const neutral = playerEvolutionAppearance(4, null, {})
    const fang = playerEvolutionAppearance(4, 'fang', { 'serrated-claws': 2, 'execution-fangs': 2 })
    expect(fang.limbReach).toBeGreaterThan(neutral.limbReach)
    expect(fang.fangLength).toBeGreaterThan(neutral.fangLength)
    expect(fang.visibleTraits).toContain('獠牙利爪')
  })

  it('clamps debug and overgrowth stages to the apex appearance', () => {
    expect(playerEvolutionAppearance(-3, 'fang', {}).stage).toBe(0)
    expect(playerEvolutionAppearance(12, 'fang', {}).stage).toBe(6)
  })

  it('counts only ranks belonging to the selected family', () => {
    const ranks = { 'serrated-claws': 2, 'execution-fangs': 1, 'reactive-shell': 2 } as const
    expect(mutationRankForFamily(ranks, 'fang')).toBe(3)
    expect(mutationRankForFamily(ranks, 'carapace')).toBe(2)
    expect(mutationRankForFamily(ranks, null)).toBe(0)
  })

  it('gives carapace a wider armored silhouette with stage-readable plates', () => {
    const fang = playerEvolutionAppearance(6, 'fang', { 'serrated-claws': 2, 'execution-fangs': 2 })
    const shell = playerEvolutionAppearance(6, 'carapace', { 'reactive-shell': 2, 'mirror-carapace': 2 })
    expect(shell.bodyWidth).toBeGreaterThan(fang.bodyWidth)
    expect(shell.limbReach).toBeLessThan(fang.limbReach)
    expect(shell.armorPlateCount).toBe(6)
    expect(shell.armorBulk).toBeGreaterThan(1.5)
    expect(shell.visibleTraits).toContain('堡垒冠甲')
  })

  it('gives rift a growing chamber and orbitals at apex', () => {
    const middle = playerEvolutionAppearance(3, 'rift', { 'pulse-gland': 2, 'rift-chamber': 1 })
    const apex = playerEvolutionAppearance(6, 'rift', { 'pulse-gland': 2, 'rift-chamber': 2 })
    expect(apex.riftCoreRadius).toBeGreaterThan(middle.riftCoreRadius)
    expect(apex.riftOrbCount).toBeGreaterThanOrEqual(middle.riftOrbCount)
    expect(apex.visibleTraits).toContain('奇点冠环')
  })

  it('gives wing a light long-limbed double-wing silhouette', () => {
    const wing = playerEvolutionAppearance(6, 'wing', { 'swift-nerves': 2, 'wind-sacs': 2 })
    const neutral = playerEvolutionAppearance(6, null, {})
    expect(wing.bodyWidth).toBeLessThan(neutral.bodyWidth)
    expect(wing.limbReach).toBeGreaterThan(neutral.limbReach)
    expect(wing.wingPairCount).toBe(2)
    expect(wing.visibleTraits).toContain('疾风尾翎')
  })

  it('grows a readable brood colony for swarm', () => {
    const swarm = playerEvolutionAppearance(6, 'swarm', { 'symbiotic-brood': 2, 'devouring-colony': 2 })
    expect(swarm.broodCount).toBe(5)
    expect(swarm.broodSacRadius).toBeGreaterThan(9)
    expect(swarm.visibleTraits).toContain('母巢冠囊')
  })

  it('grows a venom gland and long needle independently of body collision', () => {
    const venom = playerEvolutionAppearance(6, 'venom', { 'toxin-coating': 2, 'toxic-blood': 2 })
    expect(venom.venomGlandRadius).toBeGreaterThan(10)
    expect(venom.venomNeedleLength).toBeGreaterThan(25)
    expect(venom.visibleTraits).toContain('疫毒针冠')
  })
})
