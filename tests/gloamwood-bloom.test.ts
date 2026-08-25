import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'

import {
  GLOAMWOOD_BLOOM,
  createGloamwoodBloom,
  gloamwoodBloomRequested,
} from '../src/gloamwood-bloom'
import { GLOAMWOOD_GENE_CORE_LIGHT, SKILL_FX_LIGHT_GAIN } from '../src/gloamwood-3d-hunt'
import { createGloamwoodValleyMap } from '../src/gloamwood-valley-map'
import { createGloamwoodDefenceMap } from '../src/gloamwood-defence-map'
import { rendingSparkBurst } from '../src/gloamwood-mutation-fx'

/**
 * Luminance as the bloom pass computes it, on the linear values the pass
 * actually sees. Rec. 709 weights: green is 71% of this and blue only 7%, which
 * is why a warm amber clears the threshold cheaply and a violet does not.
 */
function bloomLuminance([r, g, b]: readonly [number, number, number] | number[]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** sRGB hex to linear, the conversion `THREE.Color` applies on the way in. */
function linearFromHex(hex: number) {
  const channel = (value: number) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  return [
    channel(((hex >> 16) & 255) / 255),
    channel(((hex >> 8) & 255) / 255),
    channel((hex & 255) / 255),
  ]
}

/**
 * Bloom is the one effect in this game that can ruin every frame at once, so
 * what is guarded here is not that it looks nice - nobody can assert that - but
 * that it cannot take the picture away: it stays above the ordinary lit surface,
 * and it fails to nothing rather than to an exception inside the render loop.
 */

describe('the threshold sits above ordinary lit surfaces', () => {
  it('is above the linear value an ordinary lit surface reaches', () => {
    // Read against the composer's linear, pre-tone-mapping buffer rather than
    // against the picture on screen. Sweeping it on a frozen frame put the knee
    // just above 1.1: below that the median luminance of the whole image moved,
    // which is the uniform haze that gets bloom switched off in options menus.
    expect(GLOAMWOOD_BLOOM.threshold).toBeGreaterThan(1.1)
    // ...and far above it nothing in this scene reaches the bar at all. Past
    // about 2.2 the measured frame was identical to no bloom.
    expect(GLOAMWOOD_BLOOM.threshold).toBeLessThan(2)
  })

  it('mixes the glow in without stacking on an already hot exposure', () => {
    // Tone mapping exposure is 1.38. Three separate colour blow-outs in this
    // project came from piling brightness on top of that.
    expect(GLOAMWOOD_BLOOM.strength).toBeGreaterThan(0)
    expect(GLOAMWOOD_BLOOM.strength).toBeLessThanOrEqual(1.2)
  })
})

describe('bloom can be switched off from the address bar', () => {
  it('is on by default', () => {
    expect(gloamwoodBloomRequested('')).toBe(true)
    expect(gloamwoodBloomRequested('?map=defence')).toBe(true)
  })

  it('is off when asked', () => {
    expect(gloamwoodBloomRequested('?bloom=0')).toBe(false)
    expect(gloamwoodBloomRequested('?map=defence&bloom=off')).toBe(false)
  })

  it('stays on for anything else, rather than guessing', () => {
    // `bloom=1` is the documented way to say "yes"; an unrecognised value must
    // not silently disable the effect on a machine that can run it.
    expect(gloamwoodBloomRequested('?bloom=1')).toBe(true)
    expect(gloamwoodBloomRequested('?bloom=maybe')).toBe(true)
  })
})

describe('a device that cannot have it keeps its frame', () => {
  it('returns null instead of throwing when the composer cannot be built', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Stands in for a renderer with no usable context: the real failure mode is
    // a throw somewhere inside the composer's setup, and the contract is that
    // the caller still gets a frame from its direct-render path.
    const broken = {
      getSize() {
        throw new Error('no context')
      },
    } as unknown as THREE.WebGLRenderer
    expect(createGloamwoodBloom(broken, new THREE.Scene(), new THREE.PerspectiveCamera())).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('the things that are meant to glow clear the threshold', () => {
  it('lights the gene core motes well clear of the bar', () => {
    // Additive, so what lands in the buffer is colour x opacity on top of
    // whatever is behind. Checked without the background, so the margin here is
    // the pessimistic one.
    const mote = bloomLuminance(GLOAMWOOD_GENE_CORE_LIGHT.mote) * GLOAMWOOD_GENE_CORE_LIGHT.moteOpacity
    expect(mote).toBeGreaterThan(GLOAMWOOD_BLOOM.threshold)
    // A trophy that only just cleared the bar would stop glowing the moment
    // anyone nudged the exposure, so the margin is asserted, not just the sign.
    expect(mote).toBeGreaterThan(GLOAMWOOD_BLOOM.threshold * 1.3)
  })

  it('keeps the outer hoop under it, so the core is not one flat blob', () => {
    // The design is bright points inside a dimmer structure - the same shape as
    // the altar band. If both hoops bloomed there would be nothing to see but
    // glare.
    expect(bloomLuminance(GLOAMWOOD_GENE_CORE_LIGHT.outerRing))
      .toBeLessThan(bloomLuminance(GLOAMWOOD_GENE_CORE_LIGHT.innerRing))
  })

  it('takes the white-hot end of a hit spark over the bar and leaves the orange under it', () => {
    // rendingSparkBurst alternates a warm white with a deep orange. The read
    // that was wanted is a white-hot centre throwing light and cooling to plain
    // orange at the edges, and that falls out of the luminance weighting rather
    // than needing two gains.
    const sparks = rendingSparkBurst()
    const lit = sparks.map((spark) => bloomLuminance(linearFromHex(spark.color)) * SKILL_FX_LIGHT_GAIN)
    expect(Math.max(...lit)).toBeGreaterThan(GLOAMWOOD_BLOOM.threshold)
    expect(Math.min(...lit)).toBeLessThan(GLOAMWOOD_BLOOM.threshold)
  })
})

describe('the composer does not get to change a map it was not asked to change', () => {
  it('thins the valley fog, because that map is mostly distance', () => {
    // Three mixes fog after tone mapping, so a composer in front of the
    // renderer mixes it against linear light instead. Uncompensated the valley
    // came out 19% brighter and 19% less saturated than the direct render it
    // was authored against; 0.55 puts both back within 3%.
    const valley = createGloamwoodValleyMap(async () => {})
    expect(valley.bloomFogScale).toBeDefined()
    expect(valley.bloomFogScale!).toBeGreaterThan(0.4)
    expect(valley.bloomFogScale!).toBeLessThan(0.75)
  })

  it('leaves the defence bowl alone, because its fog barely participates', () => {
    // Measured at under 3% off the direct render with no correction at all, and
    // thinning its fog moved it further away rather than closer - the sign of
    // the error depends on whether the fog is lighter or darker than what it
    // covers, so there is no global constant to reach for here.
    const defence = createGloamwoodDefenceMap(async () => {})
    expect(defence.bloomFogScale ?? 1).toBe(1)
  })
})
