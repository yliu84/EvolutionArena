/**
 * The side routes off the main road.
 *
 * The chosen layout was a linear valley whose own description read "main road
 * advances, side branches optional", and the first build shipped only the
 * spine: one road, one direction, no decision to make. A corridor is not a map.
 *
 * A branch is a side canyon - its own centreline cut into the valley wall, with
 * its own floor height and its own character. Two of them are loops that leave
 * the road and rejoin it further on, so there is a way round as well as a way
 * through; the rest are spurs ending in a chamber, which is where an optional
 * nest belongs.
 *
 * The geometry is a polyline and a width profile, so the terrain is still a
 * pure function of position and the whole network still costs no art at all.
 */

export type GloamwoodValleyBranchTerrain = 'hollow' | 'marsh' | 'scree' | 'deadwood' | 'terrace'

/** How the ground reads underfoot, biasing the three-way texture blend. */
export type GloamwoodValleyGroundBias = 'none' | 'wet' | 'rock'

export interface GloamwoodValleyBranch {
  id: string
  /** 'loop' rejoins the route; 'spur' ends in its chamber. */
  kind: 'loop' | 'spur'
  /**
   * Where it leaves the route, and where it comes back.
   *
   * Declared against the route rather than in world coordinates. Hand-written
   * world points survive exactly one change to the route's shape, and then the
   * branch mouths are floating in the wall next to a road that has moved.
   */
  mouthS: number
  rejoinS?: number
  /** Which side of the route: +1 is its left, where the road runs. */
  side: 1 | -1
  /** How far out from the route the chamber sits. */
  reach: number
  /** Width at the mouth. Narrow, so a branch reads as a way off the road. */
  mouthHalfWidth: number
  /** Width at the chamber, where the fight happens. */
  chamberHalfWidth: number
  /** Bare path width inside the branch. */
  roadHalfWidth: number
  /** Floor height at the chamber relative to the road it leaves. */
  climb: number
  terrain: GloamwoodValleyBranchTerrain
  groundBias: GloamwoodValleyGroundBias
}

export const GLOAMWOOD_VALLEY_BRANCHES: readonly GloamwoodValleyBranch[] = [
  {
    // Shallows. A way round rather than a dead end, so the first branch the
    // player meets teaches that leaving the road is not a trap.
    id: 'fern-hollow',
    kind: 'loop',
    mouthS: 240,
    rejoinS: 368,
    side: 1,
    reach: 54,
    mouthHalfWidth: 7,
    chamberHalfWidth: 15,
    roadHalfWidth: 3.4,
    climb: -2.2,
    terrain: 'hollow',
    groundBias: 'none',
  },
  {
    // Across the ford, into the wet ground the river feeds.
    id: 'reed-ford',
    kind: 'spur',
    mouthS: 400,
    side: -1,
    reach: 32,
    mouthHalfWidth: 6.5,
    chamberHalfWidth: 13,
    roadHalfWidth: 3,
    climb: -1.6,
    terrain: 'marsh',
    groundBias: 'wet',
  },
  {
    // Gorge, climbing out of it. The only ground in the map that looks down on
    // the road, which is most of why it is worth the walk.
    id: 'scree-shelf',
    kind: 'spur',
    mouthS: 700,
    side: 1,
    reach: 42,
    mouthHalfWidth: 6.5,
    chamberHalfWidth: 13.5,
    roadHalfWidth: 3,
    climb: 7,
    terrain: 'scree',
    groundBias: 'rock',
  },
  {
    id: 'dead-grove',
    kind: 'loop',
    mouthS: 786,
    rejoinS: 902,
    side: 1,
    reach: 50,
    mouthHalfWidth: 7,
    chamberHalfWidth: 14,
    roadHalfWidth: 3.4,
    climb: 1.2,
    terrain: 'deadwood',
    groundBias: 'none',
  },
  {
    id: 'high-terrace',
    kind: 'spur',
    mouthS: 1200,
    side: 1,
    reach: 44,
    mouthHalfWidth: 6.5,
    chamberHalfWidth: 14,
    roadHalfWidth: 3,
    climb: 10,
    terrain: 'terrace',
    groundBias: 'rock',
  },
  {
    id: 'stone-bowl',
    kind: 'spur',
    mouthS: 1420,
    side: -1,
    reach: 30,
    mouthHalfWidth: 6.5,
    chamberHalfWidth: 13,
    roadHalfWidth: 3,
    climb: 2,
    terrain: 'scree',
    groundBias: 'rock',
  },
] as const

/**
 * Where the river is shallow enough to walk across.
 *
 * Two branches sit on the far bank. Without a crossing they would be scenery,
 * and with a bridge they would need an asset this project does not have - so
 * the riverbed simply rises to meet the surface and the crossing is a riffle.
 */
/** Positions along the route where the bed rises to the surface. */
export const GLOAMWOOD_VALLEY_FORDS: readonly number[] = [400, 1420]
export const GLOAMWOOD_VALLEY_FORD_SPAN = 13

/** 1 in the middle of a ford, 0 away from one. */
export function gloamwoodValleyFordInfluence(x: number) {
  let strongest = 0
  for (const ford of GLOAMWOOD_VALLEY_FORDS) {
    strongest = Math.max(strongest, Math.exp(-Math.pow((x - ford) / GLOAMWOOD_VALLEY_FORD_SPAN, 2)))
  }
  return strongest
}

/** Width profile along a branch: narrow mouth, wide chamber. */
export function gloamwoodValleyBranchHalfWidth(branch: GloamwoodValleyBranch, t: number) {
  const swell = branch.kind === 'loop' ? Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) : smoothstep(t)
  return branch.mouthHalfWidth + (branch.chamberHalfWidth - branch.mouthHalfWidth) * swell
}

/** Floor height of a branch relative to the road it leaves, along its length. */
export function gloamwoodValleyBranchRise(branch: GloamwoodValleyBranch, t: number) {
  const swell = branch.kind === 'loop' ? Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) : smoothstep(t)
  return branch.climb * swell
}

function smoothstep(t: number) {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped * clamped * (3 - 2 * clamped)
}
