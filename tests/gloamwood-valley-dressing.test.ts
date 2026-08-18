import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_ROCK_VARIANTS,
  GLOAMWOOD_TREE_VARIANTS,
  GLOAMWOOD_VEGETATION_VARIANTS,
} from '../src/gloamwood-environment-kit'
import { GLOAMWOOD_VALLEY_BRANCHES } from '../src/gloamwood-valley-branches'
import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyDominantSurface,
  gloamwoodValleyPointAt,
} from '../src/gloamwood-valley-terrain'
import {
  GLOAMWOOD_VALLEY_DRESSING,
  GLOAMWOOD_VALLEY_TREE_KINDS,
  gloamwoodValleyAtmosphereAt,
  gloamwoodValleyTreeVariantId,
  gloamwoodValleyWallClearance,
  scatterGloamwoodValley,
  gloamwoodValleyDressingFor,
} from '../src/gloamwood-valley-dressing'

describe('Dressing a valley with only plants and rocks', () => {
  it('makes the three regions read as three places, not one repeated', () => {
    // The kit is seven plants, three rocks and a mushroom. With no props to
    // vary, the variation has to come from distribution.
    const tints = GLOAMWOOD_VALLEY_DRESSING.map((entry) => entry.tint)
    expect(new Set(tints).size).toBe(3)
    const [shallows, gorge, headwater] = GLOAMWOOD_VALLEY_DRESSING
    // Trees thin out and rock takes over as the valley climbs.
    expect(shallows.treeDensity).toBeGreaterThan(gorge.treeDensity)
    expect(gorge.treeDensity).toBeGreaterThan(headwater.treeDensity)
    expect(headwater.boulderDensity).toBeGreaterThan(gorge.boulderDensity)
    expect(gorge.boulderDensity).toBeGreaterThan(shallows.boulderDensity)
    // And the light closes in.
    expect(headwater.fogDensity).toBeGreaterThan(shallows.fogDensity)
    // Coverage, not just species mix. Without it the per-species densities only
    // decide what appears and never whether, so all three end up equally
    // covered and read as one place.
    expect(shallows.coverage).toBeGreaterThan(gorge.coverage)
    expect(gorge.coverage).toBeGreaterThan(headwater.coverage)
  })

  it('turns rocks into terrain by massing them well past their authored size', () => {
    // A rock at its own scale is a rock; at eight times it is an outcrop. This
    // is the only way to build a cliff face out of a three-asset kit.
    for (const entry of GLOAMWOOD_VALLEY_DRESSING) expect(entry.cliffScale).toBeGreaterThanOrEqual(6)
    const props = scatterGloamwoodValley(7)
    const cliffs = props.filter((prop) => prop.kind === 'cliff')
    expect(cliffs.length).toBeGreaterThan(40)
    expect(Math.max(...cliffs.map((prop) => prop.scale))).toBeGreaterThan(6)
  })

  it('leaves the road bare, because a path is read by what is not on it', () => {
    for (const prop of scatterGloamwoodValley(11)) {
      expect(gloamwoodValleyDominantSurface(prop.x, prop.z), `${prop.kind} on the road`).not.toBe('road')
    }
  })

  it('rebuilds the same valley from the same seed', () => {
    // A recorded session cannot be replayed against a map that regenerates
    // differently.
    const a = scatterGloamwoodValley(4242, 400)
    const b = scatterGloamwoodValley(4242, 400)
    expect(b).toEqual(a)
    expect(scatterGloamwoodValley(9999, 400)).not.toEqual(a)
  })

  it('dresses the chokes rather than leaving a gate on bare ground', () => {
    const props = scatterGloamwoodValley(3)
    for (const choke of GLOAMWOOD_VALLEY.chokes) {
      const near = props.filter((prop) => Math.abs(prop.x - choke) < GLOAMWOOD_VALLEY.chokeSpan)
      expect(near.length, `choke at ${choke}`).toBeGreaterThan(4)
    }
  })

  it('covers the whole length rather than clustering at one end', () => {
    const props = scatterGloamwoodValley(5)
    for (const [from, to] of [[0, 400], [600, 1000], [1200, 1600]]) {
      expect(props.filter((prop) => prop.x >= from && prop.x < to).length, `${from}-${to}`).toBeGreaterThan(40)
    }
  })

  it('empties out as the valley climbs, so the regions are told apart at a glance', () => {
    const props = scatterGloamwoodValley(5)
    const bankProps = (from: number, to: number) =>
      props.filter((prop) => prop.x >= from && prop.x < to && prop.kind !== 'cliff').length
    const shallows = bankProps(120, 380)
    const headwater = bankProps(1260, 1500)
    expect(shallows).toBeGreaterThan(headwater * 1.6)
  })

  it('falls back to a real dressing for an unknown region', () => {
    expect(gloamwoodValleyDressingFor('shallows').id).toBe('shallows')
  })
})

describe('Valley atmosphere', () => {
  it('darkens and thickens as the player climbs the valley', () => {
    const samples = [60, 400, 830, 1200, 1520].map((x) => gloamwoodValleyAtmosphereAt(x))
    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index].fogDensity).toBeGreaterThan(samples[index - 1].fogDensity)
      expect(samples[index].sunIntensity).toBeLessThan(samples[index - 1].sunIntensity)
    }
  })

  it('changes gradually rather than at a line the player crosses', () => {
    // One fog serves the whole scene, so it is driven off the camera. Stepping
    // it at the region boundary would recolour the entire valley at once.
    let worst = 0
    for (let x = 0; x < GLOAMWOOD_VALLEY_LENGTH; x += 5) {
      const here = gloamwoodValleyAtmosphereAt(x)
      const next = gloamwoodValleyAtmosphereAt(x + 5)
      worst = Math.max(worst, Math.abs(next.fogDensity - here.fogDensity))
    }
    expect(worst).toBeLessThan(0.0004)
  })

  it('holds the end regions steady past their centres', () => {
    expect(gloamwoodValleyAtmosphereAt(0)).toEqual(gloamwoodValleyAtmosphereAt(120))
    expect(gloamwoodValleyAtmosphereAt(GLOAMWOOD_VALLEY_LENGTH)).toEqual(gloamwoodValleyAtmosphereAt(1450))
  })
})

describe('Scattered variants map onto real kit models', () => {
  it('never asks for a tree the kit does not have', () => {
    const ids = new Set(GLOAMWOOD_TREE_VARIANTS.map((variant) => variant.id))
    for (const prop of scatterGloamwoodValley(0x51a7f0, 4000)) {
      if (prop.kind === 'tree') expect(ids.has(gloamwoodValleyTreeVariantId(prop.variant))).toBe(true)
      if (prop.kind === 'undergrowth') expect(prop.variant).toBeLessThan(GLOAMWOOD_VEGETATION_VARIANTS.length)
      if (prop.kind === 'boulder' || prop.kind === 'cliff') {
        expect(prop.variant).toBeLessThan(GLOAMWOOD_ROCK_VARIANTS.length)
      }
    }
  })

  it('puts conifers in the gorge and broadleaf in the shallows, not the reverse', () => {
    // The kit's array is ordered by when each model was added, so reading the
    // scatter's number straight off it swaps the two.
    const conifers = new Set<string>(GLOAMWOOD_VALLEY_TREE_KINDS.conifer)
    const share = (from: number, to: number) => {
      const trees = scatterGloamwoodValley(0x51a7f0, 6000)
        .filter((prop) => prop.kind === 'tree' && prop.x >= from && prop.x <= to)
      return trees.filter((prop) => conifers.has(gloamwoodValleyTreeVariantId(prop.variant))).length / trees.length
    }
    expect(share(580, 1080)).toBeGreaterThan(share(0, 500) * 1.8)
  })
})

describe('Cliff massing', () => {
  it('never reaches out over the floor the player fights on', () => {
    // Unclamped, the region's cliffScale put nine-times rocks on a choke seven
    // units wide: the gate read superbly and the camera was inside the rock.
    for (const prop of scatterGloamwoodValley(0x5a11e, 6200)) {
      if (prop.kind !== 'cliff' && prop.kind !== 'boulder') continue
      if (gloamwoodValleyDominantSurface(prop.x, prop.z) !== 'wall') continue
      const radius = GLOAMWOOD_ROCK_VARIANTS[prop.variant].diameter * prop.scale * 0.5
      // Measured against the corridor the rock actually stands beside, which on
      // a route that folds is not always the main one.
      expect(radius).toBeLessThanOrEqual(gloamwoodValleyWallClearance(prop.x, prop.z) * 0.75 + 0.001)
    }
  })

  it('still masses the walls where there is room for it', () => {
    // Capping must not quietly turn the cliffs back into pebbles.
    const wall = scatterGloamwoodValley(0x5a11e, 6200)
      .filter((prop) => gloamwoodValleyDominantSurface(prop.x, prop.z) === 'wall')
    const big = wall.filter((prop) => prop.scale >= 3)
    expect(big.length / wall.length).toBeGreaterThan(0.25)
  })
})

describe('Branch character', () => {
  it('makes each branch read as somewhere else, not as more road', () => {
    const props = scatterGloamwoodValley(0x5a11e, 6200)
    const inBranch = (id: string) => props.filter((prop) => prop.branch === id)
    const share = (id: string, kind: string) => {
      const all = inBranch(id)
      return all.filter((prop) => prop.kind === kind).length / Math.max(1, all.length)
    }
    // Scree is bare rock; the fern hollow is the densest ground in the map.
    expect(share('scree-shelf', 'boulder') + share('scree-shelf', 'cliff'))
      .toBeGreaterThan(share('fern-hollow', 'boulder') + share('fern-hollow', 'cliff'))
    expect(share('fern-hollow', 'undergrowth')).toBeGreaterThan(share('scree-shelf', 'undergrowth') * 2)
  })

  it('fills the dead grove with dead trees rather than live ones', () => {
    const trees = scatterGloamwoodValley(0x5a11e, 6200)
      .filter((prop) => prop.branch === 'dead-grove' && prop.kind === 'tree')
    expect(trees.length).toBeGreaterThan(8)
    const dead = trees.filter((prop) => gloamwoodValleyTreeVariantId(prop.variant) === 'dead-a')
    expect(dead.length / trees.length).toBeGreaterThan(0.7)
  })

  it('gives every branch some props of its own', () => {
    const props = scatterGloamwoodValley(0x5a11e, 6200)
    for (const branch of GLOAMWOOD_VALLEY_BRANCHES) {
      expect(props.filter((prop) => prop.branch === branch.id).length).toBeGreaterThan(20)
    }
  })
})
