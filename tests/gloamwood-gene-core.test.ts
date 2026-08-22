import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_GENE_CORE,
  createGloamwoodGeneCore,
  stepGloamwoodGeneCores,
} from '../src/gloamwood-gene-core'

function stepFor(
  cores: Parameters<typeof stepGloamwoodGeneCores>[0],
  seconds: number,
  player: Parameters<typeof stepGloamwoodGeneCores>[2],
) {
  let remaining = seconds
  let current = [...cores]
  const collected = [] as ReturnType<typeof stepGloamwoodGeneCores>['collected']
  while (remaining > 0) {
    const frame = stepGloamwoodGeneCores(current, Math.min(1 / 60, remaining), player)
    current = frame.cores
    collected.push(...frame.collected)
    remaining -= 1 / 60
  }
  return { cores: current, collected }
}

describe('Gene Core rewards', () => {
  it('gives an Elite one deliberate extra family Gene', () => {
    const core = createGloamwoodGeneCore('elite-1', 'elite', 'fang', 0, 0)
    expect(core).toMatchObject({ source: 'elite', kind: 'fang', bonus: GLOAMWOOD_GENE_CORE.eliteBonus })
  })

  it('gives a regional Boss two extra family Genes and carries its existing milestone', () => {
    const core = createGloamwoodGeneCore('boss-1', 'boss', 'shell', 0, 0, 'shallows-boss-defeated')
    expect(core).toMatchObject({ source: 'boss', kind: 'shell', bonus: GLOAMWOOD_GENE_CORE.bossBonus, milestone: 'shallows-boss-defeated' })
  })

  it('requires walking to the core but never expires while the player is away', () => {
    const core = createGloamwoodGeneCore('elite-1', 'elite', 'fang', 0, 0)
    const far = stepFor([core], 30, { x: 9, z: 0, bodyRadius: 1.28 })
    expect(far.collected).toEqual([])
    expect(far.cores).toHaveLength(1)
    const claimed = stepFor(far.cores, 1 / 60, { x: 0.5, z: 0, bodyRadius: 1.28 })
    expect(claimed.cores).toEqual([])
    expect(claimed.collected).toHaveLength(1)
  })

  it('holds a Boss Core on screen before it can be claimed', () => {
    const core = createGloamwoodGeneCore('boss-1', 'boss', 'shell', 0, 0, 'shallows-boss-defeated')
    const tooSoon = stepFor([core], core.claimDelaySeconds - 0.05, { x: 0, z: 0, bodyRadius: 2 })
    expect(tooSoon.collected).toEqual([])
    const claimed = stepFor(tooSoon.cores, 0.1, { x: 0, z: 0, bodyRadius: 2 })
    expect(claimed.collected).toHaveLength(1)
  })
})
