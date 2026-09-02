import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_INTERSTITIAL_GAP_SECONDS,
  gloamwoodInterstitialAllowed,
} from '../src/y8-sdk'

describe('Interstitial pacing', () => {
  // Y8's QA asked for ads on Play, Next and Retry. Y8 also reviews for
  // excessive advertising, and those two pull against each other on exactly
  // one pattern - dying straight after a restart, which this game makes very
  // easy. This rule is the whole difference between the two.

  it('always allows the first one', () => {
    expect(gloamwoodInterstitialAllowed({ nowSeconds: 0, lastShownSeconds: null })).toBe(true)
    expect(gloamwoodInterstitialAllowed({ nowSeconds: 9_999, lastShownSeconds: null })).toBe(true)
  })

  it('refuses a second one inside the gap', () => {
    // The failure this exists to prevent: fail, restart, fail again in twenty
    // seconds, and be shown two full-screen ads for it.
    for (const elapsed of [0, 1, 20, GLOAMWOOD_INTERSTITIAL_GAP_SECONDS - 0.01]) {
      expect(
        gloamwoodInterstitialAllowed({ nowSeconds: 1_000 + elapsed, lastShownSeconds: 1_000 }),
        `${elapsed}s after the last`,
      ).toBe(false)
    }
  })

  it('allows one again once the gap has passed', () => {
    for (const elapsed of [GLOAMWOOD_INTERSTITIAL_GAP_SECONDS, GLOAMWOOD_INTERSTITIAL_GAP_SECONDS + 60, 4_000]) {
      expect(gloamwoodInterstitialAllowed({ nowSeconds: 1_000 + elapsed, lastShownSeconds: 1_000 })).toBe(true)
    }
  })

  it('keeps the gap long enough to matter but short enough to still monetise', () => {
    // A gap under about a minute does not stop the back-to-back case this is
    // for; one over a few minutes means a normal session shows almost nothing
    // and the whole integration earns nothing.
    expect(GLOAMWOOD_INTERSTITIAL_GAP_SECONDS).toBeGreaterThanOrEqual(60)
    expect(GLOAMWOOD_INTERSTITIAL_GAP_SECONDS).toBeLessThanOrEqual(180)
  })

  it('survives a clock that goes backwards', () => {
    // System clock changes and tab suspension both do this. Refusing is the
    // safe answer: a missed ad costs a fraction of a cent, an unexpected one
    // costs a player.
    expect(gloamwoodInterstitialAllowed({ nowSeconds: 500, lastShownSeconds: 1_000 })).toBe(false)
  })
})
