import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_VALLEY, gloamwoodValleyDominantSurface } from '../src/gloamwood-valley-terrain'
import {
  GLOAMWOOD_VALLEY_DRESSING,
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
