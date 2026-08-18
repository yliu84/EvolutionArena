import { describe, expect, it } from 'vitest'

import { ELITE_AFFIX_IDS } from '../src/elite-affixes'
import { GLOAMWOOD_VALLEY_BRANCHES } from '../src/gloamwood-valley-branches'
import {
  GLOAMWOOD_GRAZING_FAMILIES,
  GLOAMWOOD_VALLEY_PLAN,
  planGloamwoodValleyEncounters,
} from '../src/gloamwood-valley-spawns'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyCorridorAt,
  gloamwoodValleyWalkable,
} from '../src/gloamwood-valley-terrain'

const SEED = 'valley-first-run'
const spawns = planGloamwoodValleyEncounters(SEED)

describe('What lives in the valley', () => {
  it('places every creature somewhere it can be reached and fought', () => {
    // A creature inside a wall is one the player cannot reach and the run
    // cannot clear.
    for (const spawn of spawns) {
      expect(gloamwoodValleyWalkable(spawn.x, spawn.z)).toBe(true)
    }
  })

  it('builds the run the plan asks for', () => {
    for (const plan of GLOAMWOOD_VALLEY_PLAN) {
      const here = spawns.filter((spawn) => spawn.region === plan.region)
      expect(here.filter((spawn) => spawn.kind === 'grazer')).toHaveLength(plan.grazers)
      expect(here.filter((spawn) => spawn.kind === 'nest')).toHaveLength(1)
      const packs = new Set(here.filter((spawn) => spawn.packId).map((spawn) => spawn.packId))
      expect(packs.size).toBe(plan.packs.length)
    }
    expect(spawns.filter((spawn) => spawn.kind === 'boss')).toHaveLength(GLOAMWOOD_VALLEY.bossSlots.length)
    expect(spawns.filter((spawn) => spawn.kind === 'elite')).toHaveLength(GLOAMWOOD_VALLEY_BRANCHES.length)
  })

  it('is the same valley every time from the same seed', () => {
    expect(planGloamwoodValleyEncounters(SEED)).toEqual(spawns)
    expect(planGloamwoodValleyEncounters('another-run')).not.toEqual(spawns)
  })
})

describe('Passive and aggressive', () => {
  it('never puts a predator out to graze', () => {
    // A passive Fang is a contradiction the player reads as a bug the first
    // time one ignores them.
    for (const spawn of spawns) {
      if (spawn.role !== 'passive') continue
      expect(GLOAMWOOD_GRAZING_FAMILIES).toContain(spawn.family)
    }
    expect(spawns.some((spawn) => spawn.family === 'fang' && spawn.role === 'passive')).toBe(false)
  })

  it('gives the lure something to pull in every region', () => {
    // The lure only pulls passive creatures, so a region with none is a region
    // where that whole mutation does nothing.
    for (const region of GLOAMWOOD_VALLEY.regions) {
      const passive = spawns.filter((spawn) => spawn.region === region.id && spawn.role === 'passive')
      expect(passive.length).toBeGreaterThan(2)
    }
  })

  it('keeps the grazers off the path, not merely off the centreline', () => {
    // A grazer in the road is one the player has to walk through, which makes
    // it a fight they did not choose - and being able to walk past is the
    // entire point of a passive creature. Measuring from the centreline passes
    // while the creature stands squarely in the road, because the road does not
    // run down the centreline.
    for (const spawn of spawns) {
      if (spawn.kind !== 'grazer') continue
      const corridor = gloamwoodValleyCorridorAt(spawn.x, spawn.z)
      expect(corridor.pathDistance).toBeGreaterThan(corridor.pathHalfWidth)
    }
  })
})

describe('Packs', () => {
  it('mixes every group, because one species teaches nothing', () => {
    for (const plan of GLOAMWOOD_VALLEY_PLAN) {
      for (const members of plan.packs) {
        expect(new Set(members).size).toBeGreaterThan(1)
      }
    }
  })

  it('gets harder region by region rather than merely bigger', () => {
    const heavy = (plan: typeof GLOAMWOOD_VALLEY_PLAN[number]) =>
      plan.packs.reduce(
        (total, members) => total + members.filter((family) => family !== 'swarm').length,
        0,
      ) / plan.packs.length
    expect(heavy(GLOAMWOOD_VALLEY_PLAN[1])).toBeGreaterThan(heavy(GLOAMWOOD_VALLEY_PLAN[0]))
    expect(heavy(GLOAMWOOD_VALLEY_PLAN[2])).toBeGreaterThan(heavy(GLOAMWOOD_VALLEY_PLAN[1]))
  })

  it('never drops a pack on top of a nest, a gate or a boss arena', () => {
    // Two encounters the player never chose to take together is one encounter
    // they cannot win.
    for (const spawn of spawns) {
      if (!spawn.packId) continue
      for (const choke of GLOAMWOOD_VALLEY.chokes) expect(Math.abs(spawn.s - choke)).toBeGreaterThan(20)
      for (const boss of GLOAMWOOD_VALLEY.bossSlots) expect(Math.abs(spawn.s - boss)).toBeGreaterThan(24)
    }
  })

  it('holds a pack close enough together to read as one group', () => {
    const packs = new Map<string, Array<{ x: number; z: number }>>()
    for (const spawn of spawns) {
      if (!spawn.packId) continue
      const members = packs.get(spawn.packId) ?? []
      members.push(spawn)
      packs.set(spawn.packId, members)
    }
    for (const members of packs.values()) {
      for (const member of members) {
        const nearest = members
          .filter((other) => other !== member)
          .reduce((best, other) => Math.min(best, Math.hypot(other.x - member.x, other.z - member.z)), Infinity)
        expect(nearest).toBeLessThan(9)
      }
    }
  })
})

describe('Elites', () => {
  it('puts one at the end of every branch and none on the road', () => {
    // The branches are optional, so what is down them has to be worth the walk.
    const elites = spawns.filter((spawn) => spawn.kind === 'elite')
    expect(elites.map((elite) => elite.branch).sort())
      .toEqual(GLOAMWOOD_VALLEY_BRANCHES.map((branch) => branch.id).sort())
    for (const elite of elites) expect(elite.branch).not.toBeNull()
  })

  it('gives each one an affix the game already knows how to run', () => {
    for (const elite of spawns.filter((spawn) => spawn.kind === 'elite')) {
      expect(ELITE_AFFIX_IDS).toContain(elite.affix)
      expect(elite.family === 'shell' || elite.family === 'fang').toBe(true)
    }
  })
})
