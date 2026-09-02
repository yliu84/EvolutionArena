/**
 * The three moments Y8 asked for an ad, and the one rule that keeps them sane.
 *
 * Their QA: "The ads should appear after user interactions, such as clicking
 * the Play, Next, or Retry buttons." This game's equivalents are picking a map
 * to start a run, and the two buttons that begin another one after the last
 * has ended.
 *
 * Kept here rather than at each button because two of the three call sites
 * immediately reload the page. An ad started and then navigated away from is
 * an ad that never played and never counted, so every one of them has to await
 * the same helper before doing anything else - and a rule copied to three
 * places is a rule that will disagree with itself.
 */
import {
  gloamwoodInterstitialAllowed,
  gloamwoodY8AdsReady,
  showGloamwoodY8Interstitial,
} from './y8-sdk'

export type GloamwoodInterstitialSlot = 'run-start' | 'run-next'

let lastShownSeconds: number | null = null

/**
 * What the ad slots actually did, for the debug readout.
 *
 * An interstitial that never fired and one that fired and found no inventory
 * are the same picture on screen - nothing happens either way - and this
 * project has already lost an afternoon to that exact ambiguity with the
 * strike effects. Counted rather than inferred.
 */
const tally = { requested: 0, gated: 0, notReady: 0, shown: 0, empty: 0 }

export function gloamwoodInterstitialTally() {
  return { ...tally, lastShownSeconds }
}

/** Test seam, and the only way to clear the gap. */
export function resetGloamwoodInterstitials() {
  lastShownSeconds = null
  for (const key of Object.keys(tally) as Array<keyof typeof tally>) tally[key] = 0
}

/**
 * Shows the interstitial for a slot, and resolves once it is safe to continue.
 *
 * Always resolves - never rejects and never hangs - because every caller has a
 * player waiting on a button they already pressed. A missing SDK, a refused
 * break, a frequency cap or an ad that fails all end the same way: carry on.
 */
export async function playGloamwoodInterstitial(
  slot: GloamwoodInterstitialSlot,
  hooks: { pause?: () => void; resume?: () => void } = {},
): Promise<'shown' | 'skipped'> {
  tally.requested += 1
  if (!gloamwoodY8AdsReady()) { tally.notReady += 1; return 'skipped' }
  const nowSeconds = Date.now() / 1000
  if (!gloamwoodInterstitialAllowed({ nowSeconds, lastShownSeconds })) { tally.gated += 1; return 'skipped' }
  // Recorded before the break rather than after: a player who taps twice while
  // an ad is opening must not queue a second one behind it.
  lastShownSeconds = nowSeconds
  const result = await showGloamwoodY8Interstitial({
    // Y8's own slot names. 'start' is the run beginning; 'next' is the one
    // after it, which is what both restart buttons are.
    type: slot === 'run-start' ? 'start' : 'next',
    name: slot,
    pause: hooks.pause ?? (() => {}),
    resume: hooks.resume ?? (() => {}),
  })
  if (result === 'viewed') tally.shown += 1
  else tally.empty += 1
  return result === 'viewed' ? 'shown' : 'skipped'
}
