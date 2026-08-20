import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_RUN_LIVES } from '../src/gloamwood-map'

import { gloamwoodMutationOffersEarned, createGloamwoodMutationState, recordGloamwoodMutationMilestone } from '../src/gloamwood-3d-mutations'
import { GLOAMWOOD_VALLEY_BRANCHES } from '../src/gloamwood-valley-branches'
import {
  GLOAMWOOD_VALLEY_LIFE_CAP,
  GLOAMWOOD_VALLEY_MILESTONES,
  createGloamwoodValleyProgression,
  enterGloamwoodValleyRegion,
  gloamwoodValleyGateOpen,
  gloamwoodValleyMilestoneGaps,
  gloamwoodValleyNextGate,
  holdGloamwoodValleyAtGate,
  recordGloamwoodValleyMilestone,
  GLOAMWOOD_VALLEY_EVOLUTION_BIOMASS,
  gloamwoodValleyEvolutionDue,
  gloamwoodValleyEvolutionsEarned,
} from '../src/gloamwood-valley-progression'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyHeadingAt,
  gloamwoodValleyPointAt,
  gloamwoodValleyProject,
  gloamwoodValleyWalkable,
} from '../src/gloamwood-valley-terrain'

/** A 25-minute run, which is the time budget the whole map was sized from. */
const RUN_SECONDS = 25 * 60

describe('Pacing', () => {
  it('pays out about every three minutes across the run', () => {
    const perOffer = RUN_SECONDS / GLOAMWOOD_VALLEY_MILESTONES.length
    expect(perOffer).toBeGreaterThan(150)
    expect(perOffer).toBeLessThan(260)
  })

  it('thins out towards the end, so the run gets harder and not just longer', () => {
    // The producer's note was "about three minutes, and harder to come by
    // later". Measured in thirds of the route rather than by region, because
    // the regions are not the same length.
    const third = GLOAMWOOD_VALLEY_LENGTH / 3
    const count = (from: number, to: number) =>
      GLOAMWOOD_VALLEY_MILESTONES.filter((entry) => entry.s >= from && entry.s < to).length
    expect(count(0, third)).toBeGreaterThan(count(third * 2, GLOAMWOOD_VALLEY_LENGTH + 1))
  })

  it('leaves its longest silence for the hardest stretch', () => {
    const gaps = gloamwoodValleyMilestoneGaps()
    const longest = Math.max(...gaps)
    expect(gaps.indexOf(longest)).toBeGreaterThan(gaps.length / 2)
  })

  it('runs in route order, so an offer never arrives before the one behind it', () => {
    for (let index = 1; index < GLOAMWOOD_VALLEY_MILESTONES.length; index += 1) {
      expect(GLOAMWOOD_VALLEY_MILESTONES[index].s)
        .toBeGreaterThan(GLOAMWOOD_VALLEY_MILESTONES[index - 1].s)
    }
  })

  it('sits every offer on a boundary between fights, never inside one', () => {
    // A panel that opens mid-fight asks the player to weigh three rules while
    // they are still reading telegraphs, so they pick fast and badly.
    for (const milestone of GLOAMWOOD_VALLEY_MILESTONES) {
      expect(['nest', 'boss', 'region-entry']).toContain(milestone.kind)
    }
  })

  it('does not pay out for branch elites', () => {
    // Making exploration the fastest route to mutations turns an optional
    // detour into a required one.
    for (const branch of GLOAMWOOD_VALLEY_BRANCHES) {
      expect(GLOAMWOOD_VALLEY_MILESTONES.some((entry) => entry.id.includes(branch.id))).toBe(false)
    }
  })
})

describe('Feeding the mutation layer', () => {
  it('earns one offer per milestone through the existing authority', () => {
    // The mutation layer takes opaque ids and does not know what a region is,
    // so re-pointing it is a change of source and nothing else.
    let mutations = createGloamwoodMutationState('valley-run')
    for (const milestone of GLOAMWOOD_VALLEY_MILESTONES) {
      mutations = recordGloamwoodMutationMilestone(mutations, milestone.id)
    }
    expect(gloamwoodMutationOffersEarned(mutations)).toBe(GLOAMWOOD_VALLEY_MILESTONES.length)
  })

  it('never pays twice for the same boundary', () => {
    let state = createGloamwoodValleyProgression()
    state = recordGloamwoodValleyMilestone(state, 'gorge-entered')
    state = recordGloamwoodValleyMilestone(state, 'gorge-entered')
    expect(state.reached).toEqual(['gorge-entered'])
  })

  it('ignores an id that is not a milestone', () => {
    const state = recordGloamwoodValleyMilestone(createGloamwoodValleyProgression(), 'wave-1-cleared')
    expect(state.reached).toEqual([])
  })
})

describe('Gates', () => {
  it('holds every choke shut until the boss before it is dead', () => {
    let state = createGloamwoodValleyProgression()
    for (const index of GLOAMWOOD_VALLEY.chokes.keys()) {
      expect(gloamwoodValleyGateOpen(state, index)).toBe(false)
    }
    state = recordGloamwoodValleyMilestone(state, 'shallows-boss-defeated')
    expect(gloamwoodValleyGateOpen(state, 0)).toBe(true)
    expect(gloamwoodValleyGateOpen(state, 1)).toBe(false)
    state = recordGloamwoodValleyMilestone(state, 'gorge-boss-defeated')
    expect(gloamwoodValleyGateOpen(state, 1)).toBe(true)
  })

  it('puts the boss holding each gate before it, not after', () => {
    // Placing them past the gate makes the boss optional, and an optional boss
    // in a run built on region tiers means arriving at the headwater with
    // shallows-tier mutations.
    for (const [index, choke] of GLOAMWOOD_VALLEY.chokes.entries()) {
      expect(GLOAMWOOD_VALLEY.bossSlots[index]).toBeLessThan(choke)
    }
  })

  it('names the gate standing in the player’s way', () => {
    let state = createGloamwoodValleyProgression()
    expect(gloamwoodValleyNextGate(state, 100)?.s).toBe(GLOAMWOOD_VALLEY.chokes[0])
    state = recordGloamwoodValleyMilestone(state, 'shallows-boss-defeated')
    expect(gloamwoodValleyNextGate(state, 100)?.s).toBe(GLOAMWOOD_VALLEY.chokes[1])
    state = recordGloamwoodValleyMilestone(state, 'gorge-boss-defeated')
    expect(gloamwoodValleyNextGate(state, 100)).toBeNull()
  })
})

describe('Lives', () => {
  it('starts at the cap', () => {
    expect(createGloamwoodValleyProgression().livesRemaining).toBe(GLOAMWOOD_VALLEY_LIFE_CAP)
  })

  it('restores on entering a region', () => {
    const spent = { ...createGloamwoodValleyProgression(), livesRemaining: 1 }
    expect(enterGloamwoodValleyRegion(spent, 'gorge').livesRemaining).toBe(GLOAMWOOD_VALLEY_LIFE_CAP)
  })

  it('restores rather than grants, so caution cannot be banked', () => {
    // Granting would make a careful player unkillable by the headwater, which
    // removes the only pressure left once the offers have stopped arriving.
    const full = createGloamwoodValleyProgression()
    expect(enterGloamwoodValleyRegion(full, 'gorge').livesRemaining).toBe(GLOAMWOOD_VALLEY_LIFE_CAP)
    const twice = enterGloamwoodValleyRegion(enterGloamwoodValleyRegion(full, 'gorge'), 'headwater')
    expect(twice.livesRemaining).toBe(GLOAMWOOD_VALLEY_LIFE_CAP)
  })

  it('only pays out the first time a region is entered', () => {
    const spent = { ...createGloamwoodValleyProgression(), livesRemaining: 1 }
    const once = enterGloamwoodValleyRegion(spent, 'gorge')
    const backAgain = enterGloamwoodValleyRegion({ ...once, livesRemaining: 1 }, 'gorge')
    expect(backAgain.livesRemaining).toBe(1)
  })

  it('counts the region the run starts in as already entered', () => {
    expect(createGloamwoodValleyProgression().entered).toEqual(['shallows'])
  })
})

describe('Walking into a shut gate', () => {
  const walk = (state: ReturnType<typeof createGloamwoodValleyProgression>) => {
    // Straight up the route from the spawn, the way a player holding W does.
    let point = gloamwoodValleyPointAt(GLOAMWOOD_VALLEY.spawnS, 0)
    let furthest = 0
    for (let step = 0; step < 900; step += 1) {
      const heading = gloamwoodValleyHeadingAt(gloamwoodValleyProject(point.x, point.z).s)
      const next = holdGloamwoodValleyAtGate(state, point.x + heading.x * 3, point.z + heading.z * 3)
      point = next
      furthest = Math.max(furthest, gloamwoodValleyProject(point.x, point.z).s)
    }
    return furthest
  }

  it('stops the player short of the first gate', () => {
    const reached = walk(createGloamwoodValleyProgression())
    expect(reached).toBeLessThan(GLOAMWOOD_VALLEY.chokes[0])
    // And not so far short that the boss bowl before it is unreachable.
    expect(reached).toBeGreaterThan(GLOAMWOOD_VALLEY.bossSlots[0])
  })

  it('lets them through once its boss is dead, and stops them at the next', () => {
    const opened = recordGloamwoodValleyMilestone(createGloamwoodValleyProgression(), 'shallows-boss-defeated')
    const reached = walk(opened)
    expect(reached).toBeGreaterThan(GLOAMWOOD_VALLEY.chokes[0])
    expect(reached).toBeLessThan(GLOAMWOOD_VALLEY.chokes[1])
  })

  it('opens the whole route once both bosses are down', () => {
    let state = recordGloamwoodValleyMilestone(createGloamwoodValleyProgression(), 'shallows-boss-defeated')
    state = recordGloamwoodValleyMilestone(state, 'gorge-boss-defeated')
    expect(walk(state)).toBeGreaterThan(GLOAMWOOD_VALLEY.chokes[1])
  })

  it('never puts the player somewhere they cannot stand', () => {
    const state = createGloamwoodValleyProgression()
    for (let s = 0; s < GLOAMWOOD_VALLEY_LENGTH; s += 17) {
      for (const lateral of [-30, 0, 30]) {
        const point = gloamwoodValleyPointAt(s, lateral)
        const held = holdGloamwoodValleyAtGate(state, point.x, point.z)
        expect(gloamwoodValleyWalkable(held.x, held.z)).toBe(true)
      }
    }
  })
})

describe('Earning the run\'s evolution on a road', () => {
  const [first, second] = GLOAMWOOD_VALLEY_EVOLUTION_BIOMASS

  it('waits for real biomass rather than firing at spawn', () => {
    expect(gloamwoodValleyEvolutionDue(0, 0)).toBe(false)
    expect(gloamwoodValleyEvolutionDue(first - 1, 0)).toBe(false)
  })

  it('fires once the player has eaten their way to it', () => {
    // The valley has no nest to clear, which is the Gloamwood's trigger, so a
    // player could reach 156 biomass still wearing the body they hatched in.
    expect(gloamwoodValleyEvolutionDue(first, 0)).toBe(true)
    expect(gloamwoodValleyEvolutionDue(156, 0)).toBe(true)
  })

  it('does not hand over the same one twice', () => {
    expect(gloamwoodValleyEvolutionDue(first + 10, 1)).toBe(false)
  })

  it('grants a second one for the rest of the road', () => {
    // Three lives and a single evolution had the player dead before halfway.
    // A road with three tiers on it cannot be run on one body.
    expect(gloamwoodValleyEvolutionDue(second, 1)).toBe(true)
    expect(gloamwoodValleyEvolutionDue(second, 2)).toBe(false)
    expect(gloamwoodValleyEvolutionsEarned(second)).toBe(2)
  })

  it('lands the first before the first gate, not after it', () => {
    // The Tide Cleaver is a worse fight than the starting body was designed
    // against, and the Gloamwood has the player meet its boss already evolved.
    expect(first).toBeLessThan(100)
    expect(first).toBeGreaterThan(40)
    expect(second).toBeGreaterThan(first)
  })

  it('gives the valley more lives than the clearing, and starts with them', () => {
    // The top-up on entering a region cannot help a player who dies three times
    // inside the first one - which is what was happening.
    expect(GLOAMWOOD_VALLEY_LIFE_CAP).toBeGreaterThan(GLOAMWOOD_RUN_LIVES)
  })
})
