/**
 * The Y8 portal SDK, kept at arm's length.
 *
 * Y8 hosts games in a cross-origin iframe and serves its SDK from its own CDN.
 * That is fine on Y8 and wrong everywhere else: this build ships to itch.io as
 * a zip that has to run from disk with no network at all, and to GitHub Pages
 * where a request to `cdn.y8.com` buys nothing and adds a way to fail. The
 * script tag is therefore injected only into the Y8 build, and everything here
 * is written to be completely inert when it is absent.
 *
 * Nothing in this file decides anything about a run. It reports whether an ad
 * was actually watched; the game decides what that is worth.
 */

import { gloamwoodY8AchievementKey } from './y8-achievement-keys'

export interface GloamwoodY8Config {
  appId: string
  gameId: string
}

/** Y8's published credentials for this game. */
export const GLOAMWOOD_Y8: GloamwoodY8Config = {
  appId: '6a8f7d191ee8fcff5a7242fb',
  gameId: '281491',
}

/** How a rewarded ad ended. Only `viewed` earns anything. */
export type GloamwoodY8AdResult = 'viewed' | 'dismissed' | 'unavailable' | 'error'

interface Y8AdRequest {
  type: 'reward' | 'start' | 'pause' | 'next' | 'browse'
  name: string
  beforeAd?: () => void
  afterAd?: () => void
  beforeReward?: (showAd: () => void) => void
  adDismissed?: () => void
  adViewed?: () => void
  adBreakDone?: (info: { breakStatus?: string }) => void
}

interface Y8AdConfig {
  gameId: string
  preloadAdBreaks: 'on' | 'off'
  sound: 'on' | 'off'
  onReady: () => void
}

interface Y8Sdk {
  init: (app: { appId: string; autoLogin: boolean }, ads?: Y8AdConfig) => void
  awardAchievement?: (request: { achievement: string; achievementKey: string }) => Promise<unknown>
  onAuth?: (handler: (user: unknown, error: unknown) => void) => void
  login?: () => void
  showAd: (request: Y8AdRequest) => Promise<unknown>
}

interface Y8Global {
  sdk: () => Y8Sdk
  emitReadyEvent?: () => void
}

let sdk: Y8Sdk | null = null
let signedIn = false
/**
 * Set when Y8's ad module reports itself ready.
 *
 * Separate from "the SDK is present" on purpose. The SDK loads long before ads
 * can play - it has to fetch this game's ad settings first - and offering a
 * player a life for an ad that cannot run is worse than not offering one: they
 * spend their last life on a tap and get nothing back.
 */
let adsReady = false
/**
 * Set the first time init succeeds, and never cleared.
 *
 * The portal script is async, so the game arms two ready events *and* tries
 * immediately - three ways in, because any of them can be the one that wins.
 * Without this they are not mutually exclusive: `y8sdk.ready` and the shim
 * event both fire, `sdk.init` runs twice, and the SDK logs a duplicated OAuth
 * state mismatch for the second attempt.
 */
let initialised = false

function y8(): Y8Global | null {
  // `globalThis`, not `window`: this module is imported by the test runner,
  // which has no window at all, and reaching for one there throws before any
  // of the logic worth checking can run.
  const value = (globalThis as unknown as { y8?: Y8Global }).y8
  return value && typeof value.sdk === 'function' ? value : null
}

/** Whether the portal SDK is present at all. False in every non-Y8 build. */
export function gloamwoodY8Available() {
  return sdk !== null
}

/** Whether an ad could actually play right now. */
export function gloamwoodY8AdsReady() {
  return adsReady
}

/**
 * Whether a player is signed in to their Y8 account.
 *
 * Nothing reads this yet, and that is deliberate rather than an oversight:
 * sign-in is on so the portal has an identity for this player, but saves stay
 * in `localStorage` for now. This is the seam cloud saves would attach to, and
 * it is kept because the alternative - wiring auth up again later - is how two
 * disagreeing copies of a player's progress get created.
 *
 * Sign-in only works on y8.com itself. Everywhere else the SDK reports an
 * OAuth state mismatch and the player stays anonymous, which is Y8's own
 * documented behaviour and costs the game nothing.
 */
export function gloamwoodY8SignedIn() {
  return signedIn
}

/**
 * Wires up the SDK if this build has it, and does nothing at all if not.
 *
 * Sign-in is switched on because on Y8 it costs the player nothing - they are
 * already signed in to the portal - and it gives the run record a name to hang
 * on later. Saves deliberately stay in `localStorage` for now: moving them to
 * Y8's cloud is a separate piece of work, and doing half of it would leave two
 * disagreeing copies of a player's progress.
 */
export function initGloamwoodY8(config: GloamwoodY8Config = GLOAMWOOD_Y8) {
  if (initialised) return true
  const global = y8()
  if (!global) return false
  try {
    initialised = true
    sdk = global.sdk()
    // `adConfig` is only optional for a game with no ads. This one has a
    // rewarded life, and without it Y8's own SDK throws "Ads not initialized.
    // Pass adConfig to init() to enable ads." - `gameId` is what fetches this
    // game's ad settings. Omitting it was a real defect: the failure was
    // caught, the run ended correctly, and the reason was entirely wrong.
    //
    // `preloadAdBreaks` and `sound` are Y8's own defaults, written out because
    // an ad that arrives silently is an ad the player thinks is broken. The
    // game mutes itself for the duration instead.
    sdk.init({ appId: config.appId, autoLogin: true }, {
      gameId: config.gameId,
      preloadAdBreaks: 'on',
      sound: 'on',
      onReady: () => { adsReady = true },
    })
    sdk.onAuth?.((user, error) => { signedIn = Boolean(user) && !error })
    return true
  } catch {
    // A portal SDK that throws must not take the game down with it.
    sdk = null
    initialised = false
    adsReady = false
    return false
  }
}

/**
 * Shows a rewarded ad and resolves with what actually happened.
 *
 * `pause` and `resume` are handed in rather than assumed: an ad plays over a
 * live scene, and a game that keeps simulating - and keeps making noise -
 * behind a full-screen advert is the complaint every portal hears.
 *
 * Resolves rather than rejects on every path, including failure, because the
 * caller has a player sitting in front of a dialog waiting for an answer. A
 * rejected promise here would leave them looking at a frozen menu.
 */
/**
 * How long to wait for the ad slot to open at all, and then for it to finish.
 *
 * Measured, not guessed: with a correct `adConfig` the SDK opened two ad
 * frames, fired `beforeAd` - so the game muted and paused - and then never
 * called back. Nothing resolved, and the player was left staring at a frozen,
 * silent dialog with no way forward. Whatever the cause, a portal SDK that
 * goes quiet must not be able to end someone's session.
 *
 * Two stages, because they are different failures. If the break never starts
 * the slot is simply not there and there is no reason to keep anyone waiting.
 * Once it has started an ad may legitimately be playing, and cutting a running
 * rewarded ad short would rob a player who is watching one.
 */
const AD_START_TIMEOUT_MS = 8_000
const AD_COMPLETE_TIMEOUT_MS = 60_000

export function showGloamwoodY8RewardedAd(options: {
  name: string
  pause: () => void
  resume: () => void
}): Promise<GloamwoodY8AdResult> {
  const active = sdk
  if (!active) return Promise.resolve('unavailable')
  return new Promise<GloamwoodY8AdResult>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout>
    const finish = (result: GloamwoodY8AdResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      // Resume on every exit, including the timeouts. Leaving the game muted
      // and paused is the one outcome no result justifies.
      options.resume()
      resolve(result)
    }
    const arm = (ms: number) => {
      clearTimeout(timer)
      timer = setTimeout(() => finish('error'), ms)
    }
    arm(AD_START_TIMEOUT_MS)
    try {
      void active.showAd({
        type: 'reward',
        name: options.name,
        beforeAd: () => {
          // The break opened, so an ad may really be playing now. Give it room.
          arm(AD_COMPLETE_TIMEOUT_MS)
          options.pause()
        },
        afterAd: () => options.resume(),
        // Y8 hands over a function to open the ad. Not calling it means no ad.
        beforeReward: (showAd) => showAd(),
        adDismissed: () => finish('dismissed'),
        adViewed: () => finish('viewed'),
        // Always fires, whatever happened. Anything still unsettled by here was
        // neither watched nor explicitly skipped, and earns nothing.
        adBreakDone: () => finish('dismissed'),
      }).catch(() => finish('error'))
    } catch {
      finish('error')
    }
  })
}

/**
 * Whether to offer a life for an ad, and why not when the answer is no.
 *
 * Pure, because this is the rule that decides whether a run ends, and it must
 * be checkable without a portal, an ad server or a browser.
 *
 * One per run. A rewarded life that can be taken again every time the last one
 * runs out is not a reward, it is an infinite continue with a video tax, and
 * it deletes the only cost a death in this game carries.
 */
export function gloamwoodExtraLifeOffer(input: {
  adAvailable: boolean
  alreadyTakenThisRun: boolean
  livesRemaining: number
}): { offer: boolean; reason: 'ok' | 'no-ad' | 'already-taken' | 'lives-left' } {
  if (input.livesRemaining > 0) return { offer: false, reason: 'lives-left' }
  if (!input.adAvailable) return { offer: false, reason: 'no-ad' }
  if (input.alreadyTakenThisRun) return { offer: false, reason: 'already-taken' }
  return { offer: true, reason: 'ok' }
}

/**
 * Mirrors an unlocked achievement onto the player's Y8 profile.
 *
 * The game's own achievements are decided and stored locally and stay that way:
 * this only tells the portal about one that has already been earned. Nothing
 * here can grant, withhold or re-order anything.
 *
 * Signing in is not optional for this, and that is Y8's rule rather than a
 * choice: `awardAchievement` reads the auth token first and throws "The token
 * can't be null." without one. Anonymous players - which is everyone outside
 * y8.com, and anyone on it who is signed out - therefore cannot be awarded
 * anything, and that has to be an ordinary quiet outcome rather than an error
 * in front of someone who just finished a run.
 */
export async function awardGloamwoodY8Achievement(achievementId: string, title: string): Promise<boolean> {
  const active = sdk
  if (!active?.awardAchievement) return false
  // Y8's own key, not this game's id. They share no identifier, and sending
  // the wrong one awards nothing without saying so.
  const key = gloamwoodY8AchievementKey(achievementId)
  if (!key) return false
  try {
    await active.awardAchievement({ achievement: title, achievementKey: key })
    return true
  } catch {
    // Anonymous player, offline, or the portal having a bad day. The local
    // achievement is already stored either way, so nothing is lost by failing.
    return false
  }
}
