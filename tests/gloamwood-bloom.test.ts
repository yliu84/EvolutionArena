import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'

import {
  GLOAMWOOD_BLOOM,
  createGloamwoodBloom,
  gloamwoodBloomRequested,
} from '../src/gloamwood-bloom'

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
