import {
  GLOAMWOOD_VALLEY,
  GLOAMWOOD_VALLEY_LENGTH,
  gloamwoodValleyConfine,
  gloamwoodValleyPointAt,
  gloamwoodValleyProject,
  type GloamwoodValleyRegionId,
} from './gloamwood-valley-terrain'

/**
 * How a valley run advances.
 *
 * Three things that have to agree and were previously decided in three places:
 * when the player is offered a mutation, when a gate lets them through, and
 * when their lives come back. All three are boundaries between fights, and
 * putting them in one module is what stops one of them drifting into the middle
 * of a fight while the other two stay outside it.
 *
 * The mutation layer already takes opaque milestone ids, so nothing there
 * changes - only where the ids come from.
 */

export type GloamwoodValleyMilestoneKind = 'nest' | 'boss' | 'region-entry'

export interface GloamwoodValleyMilestone {
  id: string
  region: GloamwoodValleyRegionId
  kind: GloamwoodValleyMilestoneKind
  /**
   * Roughly where along the route it is earned.
   *
   * Nominal. The trigger is the event, not the position - a nest sits wherever
   * its seed put it. This is here so the *pacing* can be checked, which is the
   * property the producer actually specified: about three minutes apart, and
   * thinning out as the run goes on.
   */
  s: number
}

/**
 * The seven boundaries that pay out a mutation.
 *
 * Spacing is the design. The producer's note was "about three minutes, and
 * harder to come by later", so the offers are dense through the shallows and
 * the gorge and then stop: the whole headwater, the longest region in the
 * valley, pays out exactly once, at its boss. The last stretch is the longest
 * a player ever goes without one, which is what makes the run get harder rather
 * than merely longer.
 *
 * Branch elites deliberately do not pay out. They are worth the walk for what
 * they drop, and making exploration also the fastest route to mutations would
 * turn an optional detour into a required one.
 */
export const GLOAMWOOD_VALLEY_MILESTONES: readonly GloamwoodValleyMilestone[] = [
  { id: 'shallows-nest-cleared', region: 'shallows', kind: 'nest', s: 200 },
  { id: 'shallows-boss-defeated', region: 'shallows', kind: 'boss', s: GLOAMWOOD_VALLEY.bossSlots[0] },
  { id: 'gorge-entered', region: 'gorge', kind: 'region-entry', s: GLOAMWOOD_VALLEY.chokes[0] },
  { id: 'gorge-nest-cleared', region: 'gorge', kind: 'nest', s: 640 },
  { id: 'gorge-boss-defeated', region: 'gorge', kind: 'boss', s: GLOAMWOOD_VALLEY.bossSlots[1] },
  { id: 'headwater-entered', region: 'headwater', kind: 'region-entry', s: GLOAMWOOD_VALLEY.chokes[1] },
  { id: 'headwater-boss-defeated', region: 'headwater', kind: 'boss', s: GLOAMWOOD_VALLEY.bossSlots[2] },
]

/**
 * Lives, and where they come back.
 *
 * Topped up to the cap on entering a region rather than added to it. A region
 * is a checkpoint: the player arrives at a new tier whole, and a careful run
 * through the shallows does not bank a stack of lives to spend carelessly in
 * the headwater.
 */
/**
 * The biomass that earns the run's one evolution.
 *
 * The Gloamwood hands it over when the nest is cleared, which is the only
 * structure it has. The valley has no nest to clear - it is a road - so it was
 * handing it over never: a player could eat their way to 156 biomass and still
 * be wearing the body they hatched in.
 *
 * Biomass rather than a boss or a region, because biomass is the number already
 * on the HUD and the one players read as "progress towards something". And
 * before the first boss rather than after: the Gloamwood has you meet its boss
 * already evolved, and the Tide Cleaver is a worse fight than anything the
 * starting body was designed against.
 *
 * 80 is roughly what the Gloamwood's nest pays out by the time it is cleared,
 * so the two runs hand it over at about the same strength. In the valley it
 * lands partway through the shallows, with the first gate still ahead.
 */
/**
 * One per region's worth of hunting.
 *
 * The first lands partway through the shallows with the first gate still
 * ahead. The second lands around the walk into the second region - roughly
 * what clearing the shallows pays out - because a road with three tiers on it
 * cannot be run on one body. Three lives and a single evolution had the player
 * dead before halfway, every time.
 */
export const GLOAMWOOD_VALLEY_EVOLUTION_BIOMASS: readonly number[] = [80, 220]

/** How many evolutions the biomass earned so far has paid for. */
export function gloamwoodValleyEvolutionsEarned(biomass: number) {
  return GLOAMWOOD_VALLEY_EVOLUTION_BIOMASS.filter((threshold) => biomass >= threshold).length
}

export function gloamwoodValleyEvolutionDue(biomass: number, taken: number) {
  return gloamwoodValleyEvolutionsEarned(biomass) > taken
}

/**
 * The next evolution the biomass is buying, and how far off it is.
 *
 * Biomass was a bare number on the HUD with nothing to compare it against, so
 * it read as a score rather than as progress - a player reached 156 and asked
 * whether evolution was broken, which is the number failing to say what it is
 * for. Given a target it becomes a countdown, and every kill on the way is
 * visibly buying something.
 *
 * Counts from whichever is further along - what has been earned, or what has
 * been taken - so a pending offer does not advertise a threshold already
 * crossed.
 */
export function gloamwoodValleyNextEvolution(biomass: number, taken: number) {
  const index = Math.max(taken, gloamwoodValleyEvolutionsEarned(biomass))
  const target = GLOAMWOOD_VALLEY_EVOLUTION_BIOMASS[index]
  if (target === undefined) return null
  return { ordinal: index + 1, target, remaining: Math.max(0, target - biomass) }
}

/**
 * How far back along the road a death puts the player.
 *
 * Far enough to be out of the fight - further than the eleven units a creature
 * notices from - and short enough that coming back is a walk rather than a
 * penalty. About three seconds at the player's pace.
 */
export const GLOAMWOOD_VALLEY_DEATH_SETBACK = 22

export const GLOAMWOOD_VALLEY_LIFE_CAP = 4

export interface GloamwoodValleyProgression {
  /** Milestone ids reached, in order. */
  reached: string[]
  /** Regions the player has entered. */
  entered: GloamwoodValleyRegionId[]
  livesRemaining: number
}

export function createGloamwoodValleyProgression(): GloamwoodValleyProgression {
  return { reached: [], entered: ['shallows'], livesRemaining: GLOAMWOOD_VALLEY_LIFE_CAP }
}

export function gloamwoodValleyMilestone(id: string) {
  return GLOAMWOOD_VALLEY_MILESTONES.find((entry) => entry.id === id) ?? null
}

export function recordGloamwoodValleyMilestone(
  state: GloamwoodValleyProgression,
  id: string,
): GloamwoodValleyProgression {
  if (!gloamwoodValleyMilestone(id) || state.reached.includes(id)) return state
  return { ...state, reached: [...state.reached, id] }
}

/**
 * Entering a region: records it, and restores the life budget.
 *
 * Restoring rather than granting is the whole point. Granting would make a
 * cautious player unkillable by the headwater, which removes the only pressure
 * the map has left once the mutations have stopped arriving.
 */
export function enterGloamwoodValleyRegion(
  state: GloamwoodValleyProgression,
  region: GloamwoodValleyRegionId,
): GloamwoodValleyProgression {
  if (state.entered.includes(region)) return state
  return {
    ...state,
    entered: [...state.entered, region],
    livesRemaining: Math.max(state.livesRemaining, GLOAMWOOD_VALLEY_LIFE_CAP),
  }
}

/**
 * Whether a gate lets the player through.
 *
 * Each choke is held by the region boss standing in the bowl before it, which
 * is why the bosses sit there. A gate the player can walk past makes the boss
 * optional, and an optional boss in a run structured around region tiers means
 * arriving at the headwater with shallows-tier mutations.
 */
export function gloamwoodValleyGateOpen(state: GloamwoodValleyProgression, chokeIndex: number) {
  const choke = GLOAMWOOD_VALLEY.chokes[chokeIndex]
  // The nearest boss before the gate is the one holding it.
  const guarding = GLOAMWOOD_VALLEY_MILESTONES
    .filter((entry) => entry.kind === 'boss' && entry.s < choke)
    .at(-1)
  return guarding ? state.reached.includes(guarding.id) : true
}

/** The gate standing between the player and the rest of the route, if any. */
export function gloamwoodValleyNextGate(state: GloamwoodValleyProgression, s: number) {
  for (const [index, choke] of GLOAMWOOD_VALLEY.chokes.entries()) {
    if (s > choke) continue
    if (gloamwoodValleyGateOpen(state, index)) continue
    return { index, s: choke }
  }
  return null
}

/**
 * Keeps a position on the near side of the first gate it has not opened.
 *
 * A rule rather than preview glue, so it can be checked: a gate that lets the
 * player slip past on a diagonal is a gate that does not exist, and the walk
 * that would find that out is exactly the one nobody does by hand.
 */
export function holdGloamwoodValleyAtGate(
  state: GloamwoodValleyProgression,
  x: number,
  z: number,
) {
  const hit = gloamwoodValleyProject(x, z)
  const gate = gloamwoodValleyNextGate(state, hit.s)
  const limit = gate ? gate.s - GLOAMWOOD_VALLEY.chokeSpan : Infinity
  if (hit.s <= limit) return gloamwoodValleyConfine(x, z)
  // Held at the line, keeping the side of the route they were on, so walking
  // into a shut gate slides along it rather than snapping to the middle.
  const held = gloamwoodValleyPointAt(limit, hit.lateral)
  return gloamwoodValleyConfine(held.x, held.z)
}

/**
 * How far apart the offers land, as a share of the route.
 *
 * Exposed so the pacing can be argued about with numbers rather than felt for.
 */
export function gloamwoodValleyMilestoneGaps() {
  const gaps: number[] = []
  let previous = 0
  for (const milestone of GLOAMWOOD_VALLEY_MILESTONES) {
    gaps.push(milestone.s - previous)
    previous = milestone.s
  }
  gaps.push(GLOAMWOOD_VALLEY_LENGTH - previous)
  return gaps
}
