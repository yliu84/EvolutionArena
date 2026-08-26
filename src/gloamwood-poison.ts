/**
 * Spore poison: a status a creature carries, ticking on its own clock.
 *
 * This exists because the Swarm skill's first design had no status at all. It
 * dropped a burning patch of ground and drained health out of anything standing
 * in it at a fraction of a point per frame, which is a correct simulation and
 * an unreadable one: nothing was attached to the creature, nothing counted, and
 * the only evidence was a bar moving. Played, it did not read as a skill.
 *
 * What a status has to do to read as one:
 *
 *   - land somewhere the player is looking - on the body, not on the floor
 *   - pay in visible instalments, on a beat slow enough to count
 *   - pay in whole numbers, because -10 is a number and -0.31 is noise
 *   - say on the body that it is still running, after the cast is over
 *
 * Only the first and last are presentation. The middle two are this module.
 *
 * **A poison is a number of instalments, not a length of time.** The first
 * version of this was written the other way round - a duration, with a beat
 * dividing into it - and in engine it paid five of the six instalments it
 * advertised. Six times 0.6 is exactly 3.6, so the last one falls due on the
 * same frame the status expires, and which of the two happens first is decided
 * by floating-point drift in the frame delta. A headless test at a fixed
 * 1/60 stepped cleanly and saw six. Counting the instalments instead makes the
 * advertised total the thing that is actually guaranteed, and leaves the
 * duration to be derived from it.
 */

export interface GloamwoodPoisonSpec {
  /** Seconds between instalments. The beat the player counts on. */
  tickSeconds: number
  /** Whole health per instalment. */
  damagePerTick: number
  /** How many instalments. This is the promise; the duration follows from it. */
  ticks: number
}

export interface GloamwoodPoisonStack {
  preyId: string
  /** Instalments still owed. Zero means the status is over. */
  ticksLeft: number
  /** What it started with, so a fade can be measured against it. */
  totalTicks: number
  tickSeconds: number
  damagePerTick: number
  /** Seconds until the next instalment. */
  untilNextTick: number
}

export interface GloamwoodPoisonTick {
  preyId: string
  damage: number
}

/** Seconds this stack still has to run, derived from what it still owes. */
export function gloamwoodPoisonRemaining(stack: GloamwoodPoisonStack) {
  if (stack.ticksLeft <= 0) return 0
  return Math.max(0, stack.untilNextTick + (stack.ticksLeft - 1) * stack.tickSeconds)
}

/** How long a fresh application runs for. */
export function gloamwoodPoisonDuration(spec: GloamwoodPoisonSpec) {
  return spec.ticks * spec.tickSeconds
}

/** Whole health a fresh application is worth, before any damage modifier. */
export function gloamwoodPoisonTotalDamage(spec: GloamwoodPoisonSpec) {
  return spec.ticks * spec.damagePerTick
}

/**
 * Refreshes rather than stacks.
 *
 * A skill on a nine-second cooldown cannot meaningfully stack on itself, but
 * its splash reaches the creature the orb already struck on the same frame, and
 * that must not double the poison on one body while single-poisoning its
 * neighbours - a difference the player has no way to see and every reason to
 * be confused by.
 *
 * The first instalment is a full beat away, so the impact's own number and the
 * first poison number never land on the same frame stacked on top of each other.
 */
export function applyGloamwoodPoison(
  stacks: readonly GloamwoodPoisonStack[],
  preyId: string,
  spec: GloamwoodPoisonSpec,
): GloamwoodPoisonStack[] {
  const fresh: GloamwoodPoisonStack = {
    preyId,
    ticksLeft: spec.ticks,
    totalTicks: spec.ticks,
    tickSeconds: spec.tickSeconds,
    damagePerTick: spec.damagePerTick,
    untilNextTick: spec.tickSeconds,
  }
  const existing = stacks.findIndex((stack) => stack.preyId === preyId)
  if (existing < 0) return [...stacks, fresh]
  const next = [...stacks]
  // Keeps the harder poison's damage if a weaker one refreshes it, and never
  // rewinds an instalment that was about to land.
  next[existing] = {
    ...fresh,
    damagePerTick: Math.max(fresh.damagePerTick, next[existing].damagePerTick),
    untilNextTick: Math.min(fresh.untilNextTick, next[existing].untilNextTick),
  }
  return next
}

/**
 * The largest number of instalments one step may pay out.
 *
 * A tab left in the background hands back a delta measured in minutes. Without
 * a cap, the first frame after it is restored settles the entire backlog at
 * once and kills everything on the field from a poison the player watched land
 * one tick at a time.
 */
const MAXIMUM_TICKS_PER_STEP = 4

export function stepGloamwoodPoison(
  stacks: readonly GloamwoodPoisonStack[],
  delta: number,
): { stacks: GloamwoodPoisonStack[]; ticks: GloamwoodPoisonTick[] } {
  if (stacks.length === 0) return { stacks: stacks as GloamwoodPoisonStack[], ticks: [] }
  const ticks: GloamwoodPoisonTick[] = []
  const next: GloamwoodPoisonStack[] = []
  for (const stack of stacks) {
    let untilNextTick = stack.untilNextTick - delta
    let ticksLeft = stack.ticksLeft
    let paid = 0
    while (untilNextTick <= 0 && ticksLeft > 0 && paid < MAXIMUM_TICKS_PER_STEP) {
      ticks.push({ preyId: stack.preyId, damage: stack.damagePerTick })
      ticksLeft -= 1
      untilNextTick += stack.tickSeconds
      paid += 1
    }
    if (ticksLeft <= 0) continue
    next.push({ ...stack, ticksLeft, untilNextTick })
  }
  return { stacks: next, ticks }
}

/** Drops what is no longer on the field, so a corpse cannot carry a status. */
export function pruneGloamwoodPoison(
  stacks: readonly GloamwoodPoisonStack[],
  livePreyIds: ReadonlySet<string>,
): GloamwoodPoisonStack[] {
  if (stacks.every((stack) => livePreyIds.has(stack.preyId))) return stacks as GloamwoodPoisonStack[]
  return stacks.filter((stack) => livePreyIds.has(stack.preyId))
}

export function gloamwoodPoisonOn(
  stacks: readonly GloamwoodPoisonStack[],
  preyId: string,
): GloamwoodPoisonStack | null {
  return stacks.find((stack) => stack.preyId === preyId) ?? null
}

/**
 * How strongly the green should sit on the body, 0 to 1.
 *
 * Full for most of the run and fading over the last stretch, so "still
 * poisoned" and "about to wear off" are different pictures. Without the fade
 * the status vanishes between two frames and the player never learns that it
 * ended - they only notice the numbers stopped.
 */
export const GLOAMWOOD_POISON_FADE_SECONDS = 0.9

export function gloamwoodPoisonTint(stack: GloamwoodPoisonStack | null) {
  if (!stack) return 0
  const remaining = gloamwoodPoisonRemaining(stack)
  if (remaining <= 0) return 0
  const fade = Math.min(GLOAMWOOD_POISON_FADE_SECONDS, stack.totalTicks * stack.tickSeconds)
  if (remaining >= fade) return 1
  return remaining / fade
}

/**
 * Who a burst catches: the body it struck, plus anything standing in the cloud.
 *
 * Pure, because the boundary is the whole difference between "a skill that
 * rewards throwing into a crowd" and "a skill that quietly poisons the map".
 * Staging an exact grazing distance in a live fight is not something a test can
 * do reliably - creatures walk, and a distance measured one frame after impact
 * is not the distance the decision was made at - so the rule is decided here
 * and the runtime is left with nothing to get wrong.
 *
 * Measured to each creature's own surface, not to its centre, for the same
 * reason attack reach is: a large body standing at the same centre distance as
 * a small one is visibly inside the cloud when the small one is visibly beside
 * it.
 */
export function gloamwoodSporeSplashTargets<T extends { id: string; x: number; z: number }>(
  struck: T,
  candidates: readonly T[],
  splashRadius: number,
  radiusOf: (candidate: T) => number,
): T[] {
  return candidates.filter((candidate) => {
    // The struck body is always caught, however the radii work out - it was hit
    // directly, and a splash of zero must still poison what the orb landed on.
    if (candidate.id === struck.id) return true
    const distance = Math.hypot(candidate.x - struck.x, candidate.z - struck.z)
    return distance <= splashRadius + radiusOf(candidate)
  })
}
