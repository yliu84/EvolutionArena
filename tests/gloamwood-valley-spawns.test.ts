import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_AGGRO } from '../src/gloamwood-creature-aggro'
import { GLOAMWOOD_VALLEY_BRANCHES } from '../src/gloamwood-valley-branches'
import {
  GLOAMWOOD_PACK_SPACING,
  GLOAMWOOD_VALLEY_SPAWN_PLAN,
  planGloamwoodValleySpawns,
} from '../src/gloamwood-valley-spawns'
import { GLOAMWOOD_VALLEY, gloamwoodValleyWalkable } from '../src/gloamwood-valley-terrain'

const SEED = 0x5a11e
const spawns = planGloamwoodValleySpawns(SEED)

describe('The agreed composition', () => {
  it('places the grazers, packs and nests the plan asks for', () => {
    for (const plan of GLOAMWOOD_VALLEY_SPAWN_PLAN) {
      const inRegion = spawns.filter((spawn) => spawn.region === plan.region)
      expect(inRegion.filter((spawn) => spawn.tier === 'grazer')).toHaveLength(plan.grazers)
      expect(inRegion.filter((spawn) => spawn.tier === 'nest')).toHaveLength(1)
      const packs = new Set(inRegion.filter((spawn) => spawn.tier === 'pack').map((spawn) => spawn.group))
      expect(packs.size).toBe(plan.packs.length)
    }
  })

  it('puts exactly the members each pack was written with', () => {
    for (const plan of GLOAMWOOD_VALLEY_SPAWN_PLAN) {
      for (const [index, members] of plan.packs.entries()) {
        const group = `${plan.region}-pack-${index + 1}`
        const placed = spawns.filter((spawn) => spawn.group === group).map((spawn) => spawn.kind)
        expect([...placed].sort()).toEqual([...members].sort())
      }
    }
  })

  it('mixes every pack, because one species asks the player nothing', () => {
    // The decision a pack creates is which of them dies first, and a pack of
    // one kind has no such decision in it.
    for (const plan of GLOAMWOOD_VALLEY_SPAWN_PLAN) {
      for (const members of plan.packs) {
        expect(new Set(members).size).toBeGreaterThan(1)
      }
    }
  })

  it('starts the player on the teaching pack', () => {
    // A Fang anchor with Swarm support: kill the anchor or be worn down.
    expect(GLOAMWOOD_VALLEY_SPAWN_PLAN[0].packs[0]).toEqual(['fang', 'swarm', 'swarm'])
  })

  it('grows the packs as the valley climbs', () => {
    const sizes = GLOAMWOOD_VALLEY_SPAWN_PLAN.map(
      (plan) => plan.packs.reduce((total, pack) => total + pack.length, 0),
    )
    expect(sizes[1]).toBeGreaterThan(sizes[0])
    expect(sizes[2]).toBeGreaterThanOrEqual(sizes[1])
  })

  it('empties out as it climbs, so the headwater reads as high and cold', () => {
    const grazers = GLOAMWOOD_VALLEY_SPAWN_PLAN.map((plan) => plan.grazers)
    expect(grazers[0]).toBeGreaterThan(grazers[1])
    expect(grazers[1]).toBeGreaterThan(grazers[2])
  })
})

describe('Where they stand', () => {
  it('puts every creature on ground it can stand on', () => {
    // A creature in a wall or in the river is one the player cannot reach and
    // the run cannot clear.
    for (const spawn of spawns) {
      expect(gloamwoodValleyWalkable(spawn.x, spawn.z), `${spawn.id} is unreachable`).toBe(true)
    }
  })

  it('keeps packs further apart than one can notice from', () => {
    // Otherwise the road is one continuous fight and there is never a reason to
    // choose to start one.
    const anchors = new Map<string, { x: number; z: number }>()
    for (const spawn of spawns) {
      if (spawn.tier !== 'pack') continue
      if (!anchors.has(spawn.group)) anchors.set(spawn.group, spawn)
    }
    const list = [...anchors.values()]
    for (let a = 0; a < list.length; a += 1) {
      for (let b = a + 1; b < list.length; b += 1) {
        expect(Math.hypot(list[a].x - list[b].x, list[a].z - list[b].z))
          .toBeGreaterThan(GLOAMWOOD_AGGRO.noticeRadius * 2)
      }
    }
    expect(GLOAMWOOD_PACK_SPACING).toBeGreaterThan(GLOAMWOOD_AGGRO.noticeRadius * 2)
  })

  it('keeps fights out of the gates and off the boss floor', () => {
    for (const spawn of spawns) {
      if (spawn.tier !== 'pack' && spawn.tier !== 'nest') continue
      for (const choke of GLOAMWOOD_VALLEY.chokes) {
        expect(Math.abs(spawn.s - choke), `${spawn.id} is in a gate`).toBeGreaterThan(30)
      }
      for (const slot of GLOAMWOOD_VALLEY.bossSlots) {
        expect(Math.abs(spawn.s - slot), `${spawn.id} is on the boss floor`).toBeGreaterThan(30)
      }
    }
  })

  it('puts an elite at the end of every branch and nowhere else', () => {
    const elites = spawns.filter((spawn) => spawn.tier === 'elite')
    expect(elites).toHaveLength(GLOAMWOOD_VALLEY_BRANCHES.length)
    for (const elite of elites) expect(elite.branch).not.toBeNull()
    // A branch is optional, so what is down it has to be worth the walk. An
    // elite on the road would just be a pack the player has no choice about.
    for (const spawn of spawns) {
      if (spawn.branch === null) expect(spawn.tier).not.toBe('elite')
    }
  })

  it('gives every region something optional to find', () => {
    for (const plan of GLOAMWOOD_VALLEY_SPAWN_PLAN) {
      const optional = spawns.filter((spawn) => spawn.region === plan.region && spawn.tier === 'elite')
      expect(optional.length).toBeGreaterThan(0)
    }
  })

  it('stands one region boss in each region', () => {
    const bosses = spawns.filter((spawn) => spawn.tier === 'boss')
    expect(bosses).toHaveLength(GLOAMWOOD_VALLEY.bossSlots.length)
    expect(new Set(bosses.map((boss) => boss.region)).size).toBe(GLOAMWOOD_VALLEY.regions.length)
  })
})

describe('Passive and aggressive', () => {
  it('makes grazers passive and everything else aggressive', () => {
    for (const spawn of spawns) {
      expect(spawn.role).toBe(spawn.tier === 'grazer' ? 'passive' : 'aggressive')
    }
  })

  it('gives the lure something it is allowed to pull', () => {
    // The lure refuses aggressive creatures by design, so a valley with no
    // passive creatures in it would leave that mutation doing nothing at all.
    expect(spawns.filter((spawn) => spawn.role === 'passive').length).toBeGreaterThan(10)
  })
})

describe('Reproducibility', () => {
  it('rebuilds the same valley from the same seed', () => {
    // A recorded session has to be replayable against the map it happened on.
    expect(planGloamwoodValleySpawns(SEED)).toEqual(spawns)
  })

  it('lays out differently for a different seed', () => {
    const other = planGloamwoodValleySpawns(0x1234)
    expect(other.map((spawn) => `${spawn.x.toFixed(2)},${spawn.z.toFixed(2)}`))
      .not.toEqual(spawns.map((spawn) => `${spawn.x.toFixed(2)},${spawn.z.toFixed(2)}`))
    // But the composition is a decision, not a roll: the same creatures appear.
    expect(other.filter((spawn) => spawn.tier === 'pack').length)
      .toBe(spawns.filter((spawn) => spawn.tier === 'pack').length)
  })
})
