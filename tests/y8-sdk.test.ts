import { describe, expect, it } from 'vitest'

import { GLOAMWOOD_Y8, gloamwoodExtraLifeOffer, gloamwoodY8Available, initGloamwoodY8 } from '../src/y8-sdk'

describe('Rewarded life offer', () => {
  // This rule decides whether a run ends, so it is checkable without a portal,
  // an ad server or a browser.
  const base = { adAvailable: true, alreadyTakenThisRun: false, livesRemaining: 0 }

  it('offers only when the run is genuinely over', () => {
    expect(gloamwoodExtraLifeOffer(base).offer).toBe(true)
    // Still holding lives: an ad here is something in the way rather than
    // something the player wants.
    for (const livesRemaining of [1, 2, 3]) {
      const result = gloamwoodExtraLifeOffer({ ...base, livesRemaining })
      expect(result.offer).toBe(false)
      expect(result.reason).toBe('lives-left')
    }
  })

  it('offers once per run and never again', () => {
    // A rewarded life available every time the last one runs out is an
    // infinite continue with a video tax, and it deletes the only cost a death
    // in this game carries.
    const result = gloamwoodExtraLifeOffer({ ...base, alreadyTakenThisRun: true })
    expect(result.offer).toBe(false)
    expect(result.reason).toBe('already-taken')
  })

  it('stays silent in every build that has no portal', () => {
    // itch.io, GitHub Pages and local play all take this path. A dialog
    // offering an ad that cannot exist would be worse than no dialog.
    const result = gloamwoodExtraLifeOffer({ ...base, adAvailable: false })
    expect(result.offer).toBe(false)
    expect(result.reason).toBe('no-ad')
  })

  it('treats a missing SDK as simply absent rather than as an error', () => {
    // Nothing has injected the portal script in a test run, which is exactly
    // the state every non-Y8 build ships in.
    expect(gloamwoodY8Available()).toBe(false)
  })

  it('carries the credentials Y8 issued for this game', () => {
    // Public by nature - they identify the game to the portal and are visible
    // in the page source of every Y8 game. Asserted so a typo in either cannot
    // ship silently: a wrong appId fails at sign-in, a wrong gameId at the ad
    // slot, and neither is visible in a screenshot.
    expect(GLOAMWOOD_Y8.appId).toBe('6a8f7d191ee8fcff5a7242fb')
    expect(GLOAMWOOD_Y8.gameId).toBe('281491')
  })
})

describe('Portal wiring', () => {
  it('initialises once however many ready signals arrive', () => {
    // The portal script is async, so boot tries immediately and also arms two
    // ready events - any of the three can win. They are not exclusive: without
    // a guard the SDK is initialised twice and logs a duplicated OAuth state
    // mismatch for the second attempt, which is what sent me looking.
    let inits = 0
    const stub = {
      sdk: () => ({
        init: () => { inits += 1 },
        onAuth: () => {},
        showAd: () => Promise.resolve(),
      }),
    }
    const original = (globalThis as unknown as { y8?: unknown }).y8
    ;(globalThis as unknown as { y8?: unknown }).y8 = stub
    try {
      expect(initGloamwoodY8()).toBe(true)
      expect(initGloamwoodY8()).toBe(true)
      expect(initGloamwoodY8()).toBe(true)
      expect(inits).toBe(1)
      expect(gloamwoodY8Available()).toBe(true)
    } finally {
      ;(globalThis as unknown as { y8?: unknown }).y8 = original
    }
  })
})
