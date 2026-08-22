import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_VALLEY_ECOLOGIES,
  resolveGloamwoodEcologyRunSeed,
  resolveGloamwoodValleyEcology,
} from '../src/gloamwood-valley-ecology'
import { planGloamwoodValleySpawns } from '../src/gloamwood-valley-spawns'

const MAP_SEED = 0x5a11e
const RUN_SEEDS = ['oak', 'river', 'cliff', 'moss', 'migrate', 'guard', 'bloom']

describe('River Valley per-run ecology', () => {
  it('keeps an explicit seed reproducible and generates an independent seed otherwise', () => {
    expect(resolveGloamwoodEcologyRunSeed('  replay-42 ', () => 'unused')).toBe('ecology-seed:replay-42')
    expect(resolveGloamwoodEcologyRunSeed(null, () => 'fresh-run')).toBe('ecology-run:fresh-run')
  })

  it('keeps the historical balanced composition for old callers', () => {
    expect(resolveGloamwoodValleyEcology('valley-run').id).toBe('balanced')
  })

  it('has a reviewable, non-balanced encounter deck for every normal run seed', () => {
    const selected = new Set(RUN_SEEDS.map((seed) => resolveGloamwoodValleyEcology(`ecology-seed:${seed}`).id))
    expect(selected.has('balanced')).toBe(false)
    expect(selected.size).toBeGreaterThan(1)
    expect(GLOAMWOOD_VALLEY_ECOLOGIES.map((entry) => entry.id)).toEqual([
      'balanced', 'fang-migration', 'shell-guard', 'swarm-bloom',
    ])
  })

  it('keeps all existing prey families and mixed packs in every ecology', () => {
    for (const ecology of GLOAMWOOD_VALLEY_ECOLOGIES) {
      const spawns = planGloamwoodValleySpawns(MAP_SEED, ecology.id === 'balanced' ? 'valley-run' : `ecology-seed:${ecology.id}`)
      const packs = new Map<string, string[]>()
      for (const spawn of spawns.filter((entry) => entry.tier === 'pack')) {
        packs.set(spawn.group, [...(packs.get(spawn.group) ?? []), spawn.kind])
      }
      expect(new Set(spawns.map((spawn) => spawn.kind))).toEqual(new Set(['fang', 'shell', 'swarm']))
      for (const kinds of packs.values()) expect(new Set(kinds).size).toBeGreaterThan(1)
    }
  })

  it('changes pack composition without changing pack, nest, elite or boss counts', () => {
    const baseline = planGloamwoodValleySpawns(MAP_SEED, 'valley-run')
    const variant = planGloamwoodValleySpawns(MAP_SEED, 'ecology-seed:oak')
    const count = (spawns: typeof baseline, tier: typeof baseline[number]['tier']) => spawns.filter((spawn) => spawn.tier === tier).length
    for (const tier of ['pack', 'nest', 'elite', 'boss'] as const) expect(count(variant, tier)).toBe(count(baseline, tier))
    expect(variant.filter((spawn) => spawn.tier === 'pack').map((spawn) => `${spawn.group}:${spawn.kind}`))
      .not.toEqual(baseline.filter((spawn) => spawn.tier === 'pack').map((spawn) => `${spawn.group}:${spawn.kind}`))
  })
})
