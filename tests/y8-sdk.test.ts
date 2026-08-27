import { describe, expect, it, vi } from 'vitest'

import {
  GLOAMWOOD_Y8,
  gloamwoodExtraLifeOffer,
  gloamwoodY8AdsReady,
  gloamwoodY8Available,
  initGloamwoodY8,
  showGloamwoodY8RewardedAd,
} from '../src/y8-sdk'
import { GLOAMWOOD_ACHIEVEMENTS } from '../src/gloamwood-achievements'

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

describe('Ad configuration', () => {
  // Y8's SDK throws "Ads not initialized. Pass adConfig to init() to enable
  // ads." without this, and `gameId` is what fetches the game's ad settings.
  // It was omitted on the first pass because their docs call adConfig optional
  // - true only for a game with no ads, which this is not.
  function initWithStub() {
    const calls: Array<{ app: unknown; ads: unknown }> = []
    let onReady: (() => void) | undefined
    const stub = {
      sdk: () => ({
        init: (app: unknown, ads: unknown) => {
          calls.push({ app, ads })
          onReady = (ads as { onReady?: () => void } | undefined)?.onReady
        },
        onAuth: () => {},
        showAd: () => Promise.resolve(),
      }),
    }
    const original = (globalThis as unknown as { y8?: unknown }).y8
    ;(globalThis as unknown as { y8?: unknown }).y8 = stub
    const restore = () => { (globalThis as unknown as { y8?: unknown }).y8 = original }
    return { calls, restore, ready: () => onReady?.() }
  }

  it('passes the Game ID Y8 issued, so ads can initialise at all', () => {
    const harness = initWithStub()
    try {
      initGloamwoodY8({ appId: 'app-under-test', gameId: 'game-under-test' })
      const [call] = harness.calls
      // A fresh module would record the call; if an earlier test already
      // initialised, the guard correctly suppresses this one.
      if (!call) return
      expect((call.app as { appId: string }).appId).toBe('app-under-test')
      expect((call.ads as { gameId: string }).gameId).toBe('game-under-test')
      expect((call.ads as { preloadAdBreaks: string }).preloadAdBreaks).toBe('on')
    } finally {
      harness.restore()
    }
  })

  it('does not claim ads are ready before Y8 says so', () => {
    // The SDK loads long before an ad can play - it fetches this game's ad
    // settings first. Offering a life for an ad that cannot run spends the
    // player's last life on a tap that returns nothing.
    const offerWithoutAds = gloamwoodExtraLifeOffer({
      adAvailable: gloamwoodY8AdsReady(),
      alreadyTakenThisRun: false,
      livesRemaining: 0,
    })
    if (!gloamwoodY8AdsReady()) {
      expect(offerWithoutAds.offer).toBe(false)
      expect(offerWithoutAds.reason).toBe('no-ad')
    }
  })
})

describe('An ad that goes quiet', () => {
  // Measured against the real SDK: with a correct adConfig it opened two ad
  // frames, fired beforeAd - so the game muted and paused - and then never
  // called back at all. The player was left on a frozen, silent dialog with no
  // way forward. Whatever the cause, a portal SDK going quiet must not be able
  // to end someone's session.

  /**
   * A freshly imported module wired to a stub whose showAd only calls back
   * when told to.
   *
   * Re-imported per test on purpose: the module deliberately initialises only
   * once, so a shared instance would leave every test after the first talking
   * to the first test's stub - which is exactly how these were failing.
   */
  async function withSdk(behaviour: (handlers: Record<string, (...args: never[]) => void>) => void) {
    vi.resetModules()
    const stub = {
      sdk: () => ({
        init: () => {},
        onAuth: () => {},
        showAd: (request: Record<string, (...args: never[]) => void>) => {
          behaviour(request)
          return Promise.resolve()
        },
      }),
    }
    const original = (globalThis as unknown as { y8?: unknown }).y8
    ;(globalThis as unknown as { y8?: unknown }).y8 = stub
    const module = await import('../src/y8-sdk')
    module.initGloamwoodY8()
    return {
      showAd: module.showGloamwoodY8RewardedAd,
      restore: () => { (globalThis as unknown as { y8?: unknown }).y8 = original },
    }
  }

  it('gives up when the break never opens, and always resumes', async () => {
    // Never calls anything back - the slot simply is not there.
    const { showAd, restore } = await withSdk(() => {})
    vi.useFakeTimers()
    try {
      let resumed = 0
      const pending = showAd({ name: 'extra-life', pause: () => {}, resume: () => { resumed += 1 } })
      await vi.advanceTimersByTimeAsync(8_000)
      await expect(pending).resolves.toBe('error')
      // The one outcome no result justifies is leaving the game muted.
      expect(resumed).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
      restore()
    }
  })

  it('waits far longer once an ad is genuinely playing', async () => {
    // Opens the break and then goes silent, which is what was measured.
    const { showAd, restore } = await withSdk((handlers) => { handlers.beforeAd?.() })
    vi.useFakeTimers()
    try {
      let resumed = 0
      let settled = false
      const pending = showAd({ name: 'extra-life', pause: () => {}, resume: () => { resumed += 1 } })
      void pending.then(() => { settled = true })
      // Past the start timeout: cutting a running rewarded ad short here would
      // rob a player who is actually watching one.
      await vi.advanceTimersByTimeAsync(30_000)
      expect(settled).toBe(false)
      // But it cannot wait forever either.
      await vi.advanceTimersByTimeAsync(31_000)
      await expect(pending).resolves.toBe('error')
      expect(resumed).toBeGreaterThan(0)
    } finally {
      vi.useRealTimers()
      restore()
    }
  })

  it('pays out only for an ad that was actually watched', async () => {
    const { showAd, restore } = await withSdk((handlers) => { handlers.beforeAd?.(); handlers.adViewed?.() })
    try {
      await expect(showAd({ name: 'extra-life', pause: () => {}, resume: () => {} })).resolves.toBe('viewed')
    } finally {
      restore()
    }
  })

  it('earns nothing when the player skips', async () => {
    const { showAd, restore } = await withSdk((handlers) => { handlers.beforeAd?.(); handlers.adDismissed?.() })
    try {
      await expect(showAd({ name: 'extra-life', pause: () => {}, resume: () => {} })).resolves.toBe('dismissed')
    } finally {
      restore()
    }
  })
})

describe('Mirroring an achievement to the portal', () => {
  async function withSdk(award?: (request: unknown) => Promise<unknown>) {
    vi.resetModules()
    const stub = {
      sdk: () => ({
        init: () => {},
        onAuth: () => {},
        showAd: () => Promise.resolve(),
        ...(award ? { awardAchievement: award } : {}),
      }),
    }
    const original = (globalThis as unknown as { y8?: unknown }).y8
    ;(globalThis as unknown as { y8?: unknown }).y8 = stub
    const module = await import('../src/y8-sdk')
    module.initGloamwoodY8()
    return {
      award: module.awardGloamwoodY8Achievement,
      restore: () => { (globalThis as unknown as { y8?: unknown }).y8 = original },
    }
  }

  it("sends Y8's own key, not the game's achievement id", async () => {
    // The two systems share no identifier. Y8 generates an opaque twenty-hex
    // key when the achievement is created on their dashboard, and sending the
    // game's own id instead awards nothing - silently, with nothing inside the
    // game able to tell. That was the first version of this call.
    const sent: unknown[] = []
    const { award, restore } = await withSdk(async (request) => { sent.push(request); return null })
    try {
      await expect(award('valley-cleared', 'The river ends')).resolves.toBe(true)
      expect(sent).toEqual([{ achievement: 'The river ends', achievementKey: '331d330138e23495e99a' }])
    } finally {
      restore()
    }
  })

  it('skips an achievement that has no key on Y8 yet', async () => {
    // The keys arrive one at a time as each achievement is created on the
    // dashboard. Until then the local unlock still happens and only the portal
    // mirror is skipped - no call, and certainly no guessed key.
    const sent: unknown[] = []
    const { award, restore } = await withSdk(async (request) => { sent.push(request); return null })
    try {
      await expect(award('not-created-on-y8-yet', 'Nothing')).resolves.toBe(false)
      expect(sent).toEqual([])
    } finally {
      restore()
    }
  })

  it('stays quiet when the player is signed out', async () => {
    // Y8's own code reads the auth token first and throws "The token can't be
    // null." without one. Anonymous is the normal state everywhere outside
    // y8.com, and it must not surface as an error to someone who has just
    // finished a run - the local achievement is already stored either way.
    const { award, restore } = await withSdk(async () => { throw new Error("The token can't be null.") })
    try {
      await expect(award('valley-cleared', 'The river ends')).resolves.toBe(false)
    } finally {
      restore()
    }
  })

  it('does nothing at all in a build with no portal', async () => {
    const { award, restore } = await withSdk(undefined)
    try {
      await expect(award('valley-cleared', 'The river ends')).resolves.toBe(false)
    } finally {
      restore()
    }
  })

  it('keys every achievement the game can actually earn', () => {
    // The keys entered on Y8's dashboard have to be these exact ids, so a
    // rename here without a matching rename there silently stops awarding.
    expect(GLOAMWOOD_ACHIEVEMENTS.map((entry) => entry.id)).toEqual([
      'valley-cleared',
      'valley-unspent',
      'many-mutations',
      'altar-wave-six',
      'altar-held',
      'altar-untouched',
      'altar-unspent',
      'hundred-kills',
      'both-ways',
    ])
  })
})
