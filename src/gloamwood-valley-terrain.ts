/**
 * The valley's shape, as pure functions of position.
 *
 * There is no artist on this project and the existing map is already generated
 * rather than authored - the Gloamwood's terrain is a function, its ground is a
 * plane with a tiled CC0 texture, and its props are scattered from a seed. So
 * the valley is built the same way and needs no new art at all.
 *
 * Everything is measured along the route rather than along the world x axis.
 * The first build ran the valley straight down x, which made every measurement
 * trivial and the map a corridor: one direction, one decision, no reason to
 * look around. The route now folds, the open ground sits at its corners, and
 * `s` - distance travelled along it - replaced x in every function here.
 *
 * The length still comes from the time budget in
 * `docs/design/maps/VALLEY-MAP-SPEC-V1.md`: 25 minutes minus what the
 * encounters cost leaves 485s of travel, which at PLAYER_SPEED 6.2 and 70% path
 * efficiency is about 1565 units of route.
 */

import {
  GLOAMWOOD_VALLEY_BRANCHES,
  gloamwoodValleyBranchHalfWidth,
  gloamwoodValleyBranchRise,
  gloamwoodValleyFordInfluence,
  type GloamwoodValleyBranch,
  type GloamwoodValleyGroundBias,
} from './gloamwood-valley-branches'
import { measurePolyline, pointOnPolyline, projectOntoPolyline, roundPolylineCorners } from './gloamwood-valley-spine'

export const GLOAMWOOD_VALLEY = {
  /**
   * The route. Each corner is a place that opens out, and the way on leaves it
   * facing somewhere else - which is the whole difference between a map and a
   * corridor. Turns are 60 to 70 degrees: enough to lose sight of where you
   * came from, not so much that the route doubles back on itself.
   */
  spine: [
    [40, 0],
    [330, 40],
    [560, 210],
    [760, 120],
    [980, 330],
    [1180, 250],
    [1420, 470],
  ],
  /**
   * Widths are set against the camera, not against the map.
   *
   * The first meshed pass used 96 and read as an open field; 28 still put both
   * walls outside the picture. The camera sits 11.8 up and 16.25 back with a
   * 52-degree lens, which frames about 18 units either side of the player, so
   * the wall has to start inside that or the valley is a valley only on paper.
   */
  basinHalfWidth: 38,
  /** Narrowest, at the two chokes. Passable but unmistakably a gate. */
  chokeHalfWidth: 9,
  corridorHalfWidth: 22,
  /**
   * Share of the half-width the player may actually use. Beyond it the wall
   * face takes over. One constant, read by everything: the walkable limit, the
   * river's placement and the wall's onset have to agree, and three copies of
   * the same number in three functions is how they stop agreeing.
   */
  walkShare: 0.6,
  /**
   * Tall enough to stand over the camera. At 11 the gorge walls topped out two
   * units below the lens, so the shot looked over them onto the plateau beyond
   * and a slot canyon read as a ditch in a field.
   */
  wallHeight: 17,
  /** Distance along the route at which the player starts. */
  spawnS: 40,
  chokes: [440, 950],
  chokeSpan: 34,
  /** Open ground, at the corners of the route and at the two gate arenas. */
  basins: [[230, 360], [505, 655], [730, 865], [1035, 1170], [1250, 1385], [1490, 1643]],
  /** Where each region's boss stands: in the bowl past its gate. */
  bossSlots: [570, 1090, 1560],
  regions: [
    { id: 'shallows', from: 0, to: 410, tier: 1 },
    { id: 'gorge', from: 470, to: 920, tier: 2 },
    { id: 'headwater', from: 980, to: 1643, tier: 3 },
  ],
} as const

export type GloamwoodValleyRegionId = typeof GLOAMWOOD_VALLEY.regions[number]['id']

/**
 * The route, with its corners rounded.
 *
 * Rounded before anything measures against it. A hard corner makes the
 * centreline's normal jump, and every function here that offsets from the
 * centreline - the road, the river, the branch mouths - then disagrees with the
 * nearest-point projection the terrain measures with. The river was the visible
 * symptom: cut in one place and drawn in another, so it came out in pieces.
 */
const SPINE = roundPolylineCorners(GLOAMWOOD_VALLEY.spine.map(([x, z]) => [x, z] as const), 62, 10)
const SPINE_MEASURE = measurePolyline(SPINE)

/** Total distance along the route. */
export const GLOAMWOOD_VALLEY_LENGTH = SPINE_MEASURE.total

/** World position at a distance along the route, offset to one side of it. */
export function gloamwoodValleyPointAt(s: number, lateral = 0) {
  const point = pointOnPolyline(SPINE, SPINE_MEASURE.lengths, s)
  return { x: point.x + point.normalX * lateral, z: point.z + point.normalZ * lateral }
}

/** Heading of the route at a distance along it. */
export function gloamwoodValleyHeadingAt(s: number) {
  const point = pointOnPolyline(SPINE, SPINE_MEASURE.lengths, s)
  return { x: point.tangentX, z: point.tangentZ }
}

/** Where a world position sits relative to the route. */
export function gloamwoodValleyProject(x: number, z: number) {
  return projectOntoPolyline(SPINE, SPINE_MEASURE.lengths, x, z)
}

/** Half-width of the valley at this point along the route. */
export function gloamwoodValleyHalfWidth(s: number) {
  for (const choke of GLOAMWOOD_VALLEY.chokes) {
    const distance = Math.abs(s - choke)
    if (distance < GLOAMWOOD_VALLEY.chokeSpan) {
      // Ease out of the choke rather than stepping, or the walls read as a door
      // frame dropped into the terrain.
      const t = distance / GLOAMWOOD_VALLEY.chokeSpan
      return GLOAMWOOD_VALLEY.chokeHalfWidth
        + (GLOAMWOOD_VALLEY.corridorHalfWidth - GLOAMWOOD_VALLEY.chokeHalfWidth) * smoothstep(t)
    }
  }
  for (const [from, to] of GLOAMWOOD_VALLEY.basins) {
    if (s > from && s < to) {
      // Basins swell and close again, so the space reads as a clearing rather
      // than a corridor that happens to be wide.
      const swell = Math.sin(((s - from) / (to - from)) * Math.PI)
      return GLOAMWOOD_VALLEY.corridorHalfWidth
        + (GLOAMWOOD_VALLEY.basinHalfWidth - GLOAMWOOD_VALLEY.corridorHalfWidth) * swell
    }
  }
  return GLOAMWOOD_VALLEY.corridorHalfWidth
}

export function gloamwoodValleyWalkableHalfWidth(s: number) {
  return gloamwoodValleyHalfWidth(s) * GLOAMWOOD_VALLEY.walkShare
}

/**
 * The road's offset from the centreline.
 *
 * Offset to one side rather than run down the middle. Centred, there is no room
 * left for the river: the floor is only thirteen units either side of a
 * five-unit road, so the water ends up pushed against the wall and out of
 * frame, and the valley's defining feature is one the player never sees.
 */
export function gloamwoodValleyRoadOffset(s: number) {
  const half = gloamwoodValleyHalfWidth(s)
  const wander = (Math.sin(s * 0.011) + Math.sin(s * 0.0043 + 2.1) * 0.6) / 1.6
  return half * (0.22 + 0.08 * wander)
}

export function gloamwoodValleyRoadHalfWidth(s: number) {
  return Math.min(5, gloamwoodValleyHalfWidth(s) * 0.26)
}

/**
 * The river.
 *
 * A valley named for its river has to carry one, and the channel must be cut
 * into the terrain rather than laid on top of it - a water plane sitting on
 * flat ground reads as a puddle decal. So the river is a function of s, the
 * ground is carved by it, and the water surface is derived from the carve.
 *
 * It runs on the opposite side of the route from the road and never crosses it,
 * except where a ford lets the player cross instead.
 */
export const GLOAMWOOD_VALLEY_RIVER = {
  /** Open water half-width, as a share of the valley's half-width. */
  widthShare: 0.13,
  maxHalfWidth: 4.5,
  /** Water depth at the centreline. */
  depth: 1.5,
  /** How far the water surface sits below the bank it cuts into. */
  surfaceDrop: 0.9,
} as const

/**
 * Half-width of the cut channel, and of the water it holds.
 *
 * Sized from the floor that is actually left beside the road, not from a share
 * of the valley. A share works everywhere the valley is wide and fails at the
 * gates, where nine units of half-width cannot hold a road and a river abreast
 * - and every version of this that guessed a constant ended with the water
 * either on the path or climbing the wall.
 *
 * The channel is wider than the water. The first one was a narrow V while the
 * water was drawn as a flat ribbon across the whole width, so the banks rose
 * through the surface and chopped the river into pieces. A river is a flat bed
 * with banks at its sides, not a groove.
 */
export function gloamwoodValleyChannelHalfWidth(s: number) {
  // The channel breathes along its length. Constant width gives a dead straight
  // waterline, which is the tell that a river was extruded rather than eroded -
  // and it costs two sine terms to avoid, because the carve follows this and so
  // the water's edge follows the carve.
  const breathing = 1 + Math.sin(s * 0.13) * 0.16 + Math.sin(s * 0.37 + 1.1) * 0.1
  const wanted = Math.min(7.3, gloamwoodValleyHalfWidth(s) * 0.21) * breathing
  return Math.max(0.9, Math.min(wanted, riverBudget(s) / 2))
}

/** Floor left over on the river's side of the road, with a gap kept clear. */
function riverBudget(s: number) {
  return gloamwoodValleyWalkableHalfWidth(s)
    + gloamwoodValleyRoadOffset(s)
    - gloamwoodValleyRoadHalfWidth(s)
    - 0.9
}

/** Half-width of the open water. */
export function gloamwoodValleyRiverHalfWidth(s: number) {
  return gloamwoodValleyChannelHalfWidth(s) / 1.62
}

/**
 * Half-width of the drawn water surface.
 *
 * Narrower at a ford: the bed there rises to just under the surface, so a
 * full-width ribbon has its edges standing proud of the water and the river
 * arrives at the crossing in pieces. The mesh and the tests both read this, so
 * the drawn width and the carved one cannot drift apart.
 */
export function gloamwoodValleyWaterHalfWidth(s: number) {
  return gloamwoodValleyRiverHalfWidth(s) * (1 - gloamwoodValleyFordInfluence(s) * 0.38)
}

/**
 * Where the channel runs.
 *
 * Placed inside the floor left beside the road, so it can overlap neither the
 * path nor the wall by construction. It drifts within whatever slack is left,
 * which is what keeps it from looking ruled.
 */
export function gloamwoodValleyRiverOffset(s: number) {
  const channel = gloamwoodValleyChannelHalfWidth(s)
  const outer = -gloamwoodValleyWalkableHalfWidth(s)
  const inner = gloamwoodValleyRoadOffset(s) - gloamwoodValleyRoadHalfWidth(s) - 0.9
  const slack = Math.max(0, inner - outer - channel * 2)
  const drift = 0.35 + 0.3 * (Math.sin(s * 0.0075) * 0.5 + 0.5)
  return outer + channel + slack * drift
}

/** Edge of the water nearest the road, used to keep the two apart. */
export function gloamwoodValleyRiverNearEdge(s: number) {
  return gloamwoodValleyRiverOffset(s) + gloamwoodValleyRiverHalfWidth(s)
}

/**
 * 1 across the bed, falling to 0 at the channel's edge.
 *
 * Flat-bottomed on purpose: the bed has to stay below the water for the whole
 * width the water is drawn at, or the ground surfaces through it.
 */
export function gloamwoodValleyRiverProfile(s: number, lateral: number) {
  const share = Math.abs(lateral - gloamwoodValleyRiverOffset(s)) / gloamwoodValleyChannelHalfWidth(s)
  return 1 - smoothstep((share - 0.45) / 0.55)
}

/**
 * How far outside a corridor a point is, and which corridor decides that.
 *
 * The route and every branch are solved together: a point belongs to whichever
 * corridor it is most inside, measured as a share of that corridor's own
 * half-width. That single number then drives the floor, the bank, the wall and
 * the walkable limit, exactly as it did when there was only one corridor.
 *
 * The minimum is softened, because a hard one leaves a crease where two
 * corridors meet. A softened one gives the ground you actually want at a
 * confluence: the mouth opens gradually out of the valley wall instead of being
 * punched through it.
 */
export interface GloamwoodValleyCorridorSolve {
  /** Distance from the centreline as a share of the local half-width. */
  across: number
  /** Height of the corridor floor here, before bank, wall and noise. */
  floor: number
  /** Distance to the nearest path centreline, and that path's half-width. */
  pathDistance: number
  pathHalfWidth: number
  /** Local half-width of the corridor the point is most inside. */
  halfWidth: number
  /** Position along the route, and the side of it. */
  s: number
  lateral: number
  /** The branch the point is most inside, or null when the route won. */
  branch: GloamwoodValleyBranch | null
  groundBias: GloamwoodValleyGroundBias
}

interface ResolvedBranch {
  branch: GloamwoodValleyBranch
  points: readonly (readonly [number, number])[]
  lengths: readonly number[]
  /** Floor height where the branch leaves the route. */
  mouthFloor: number
}

/**
 * Branch centrelines in world space.
 *
 * Declared against the route rather than in world coordinates, so a branch
 * still meets the road after the route is re-folded. Hand-written world points
 * survive exactly one layout change.
 */
const RESOLVED_BRANCHES: readonly ResolvedBranch[] = GLOAMWOOD_VALLEY_BRANCHES.map((branch) => {
  const mouth = gloamwoodValleyPointAt(branch.mouthS, gloamwoodValleyRoadOffset(branch.mouthS))
  const endS = branch.rejoinS ?? branch.mouthS
  const chamberS = (branch.mouthS + endS) / 2
  const chamber = gloamwoodValleyPointAt(chamberS, branch.side * branch.reach)
  const points: (readonly [number, number])[] = [[mouth.x, mouth.z], [chamber.x, chamber.z]]
  if (branch.kind === 'loop') {
    const rejoin = gloamwoodValleyPointAt(endS, gloamwoodValleyRoadOffset(endS))
    points.push([rejoin.x, rejoin.z])
  }
  return {
    branch,
    points,
    lengths: measurePolyline(points).lengths,
    mouthFloor: routeFloor(branch.mouthS),
  }
})

/** Base height of the route's floor, which climbs from mouth to headwater. */
function routeFloor(s: number) {
  return (s / GLOAMWOOD_VALLEY_LENGTH) * 4.5
}

export function gloamwoodValleyCorridorAt(x: number, z: number): GloamwoodValleyCorridorSolve {
  const hit = gloamwoodValleyProject(x, z)
  const half = gloamwoodValleyHalfWidth(hit.s)
  const routeAcross = Math.abs(hit.lateral) / half
  let across = routeAcross
  let pathDistance = Math.abs(hit.lateral - gloamwoodValleyRoadOffset(hit.s))
  let pathHalfWidth = gloamwoodValleyRoadHalfWidth(hit.s)
  let winner: GloamwoodValleyBranch | null = null
  let winnerAcross = routeAcross
  let winnerHalf = half
  let floorSum = routeFloor(hit.s) * Math.exp(-routeAcross * 4)
  let weightSum = Math.exp(-routeAcross * 4)

  for (const resolved of RESOLVED_BRANCHES) {
    const branchHit = projectOntoPolyline(resolved.points, resolved.lengths, x, z)
    const total = resolved.lengths.reduce((sum, length) => sum + length, 0) || 1
    const t = branchHit.s / total
    const branchHalf = gloamwoodValleyBranchHalfWidth(resolved.branch, t)
    const branchAcross = branchHit.distance / branchHalf
    // The branch floor hangs off the road it leaves, so it stays level with its
    // own mouth however the route climbs underneath it.
    const branchFloor = resolved.mouthFloor + gloamwoodValleyBranchRise(resolved.branch, t)
    const weight = Math.exp(-branchAcross * 4)
    floorSum += branchFloor * weight
    weightSum += weight
    across = softMin(across, branchAcross, 0.28)
    if (branchAcross < winnerAcross) {
      winnerAcross = branchAcross
      winner = resolved.branch
      winnerHalf = branchHalf
    }
    if (branchHit.distance < pathDistance) {
      pathDistance = branchHit.distance
      pathHalfWidth = resolved.branch.roadHalfWidth
    }
  }

  return {
    across,
    floor: floorSum / (weightSum || 1),
    pathDistance,
    pathHalfWidth,
    halfWidth: winnerHalf,
    s: hit.s,
    lateral: hit.lateral,
    branch: winner,
    groundBias: winner?.groundBias ?? 'none',
  }
}

/** Polynomial smooth minimum. Blends the two within `k` of each other. */
function softMin(a: number, b: number, k: number) {
  const overlap = Math.max(0, k - Math.abs(a - b)) / k
  return Math.min(a, b) - overlap * overlap * k * 0.25
}

function smoothstep(t: number) {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * Ground height. Flat path, banks that lift, then walls.
 *
 * The silhouette does most of the work in a generated map, so the wall rises
 * hard rather than gently: a valley the player can see the top of is a field.
 */
export function gloamwoodValleyHeight(x: number, z: number) {
  const corridor = gloamwoodValleyCorridorAt(x, z)
  const base = valleyBaseHeight(corridor, x, z)
  const profile = gloamwoodValleyRiverProfile(corridor.s, corridor.lateral)
  if (profile <= 0) return base
  // The bed is derived from the water surface rather than subtracted from the
  // bank, so the channel is exactly as deep as the river is - carving a fixed
  // amount out of noisy ground leaves the water anywhere between ankle and
  // waist depending on where the noise happened to sit.
  //
  // At a ford the bed rises to meet the surface, which is the whole crossing:
  // there is no bridge asset, and two branches sit on the far bank.
  const depth = GLOAMWOOD_VALLEY_RIVER.depth * (1 - gloamwoodValleyFordInfluence(corridor.s) * 0.88)
  const bed = gloamwoodValleyWaterHeight(corridor.s) - depth
  return base + (bed - base) * profile
}

/** The valley before the river cuts into it. */
function valleyBaseHeight(corridor: GloamwoodValleyCorridorSolve, x: number, z: number) {
  const across = corridor.across
  const rolling = Math.sin(x * 0.037) * 0.34 + Math.cos(z * 0.055) * 0.22 + Math.sin((x * 0.6 + z) * 0.021) * 0.28
  // The path is graded flat; rolling only shows once off it.
  const path = Math.exp(-Math.pow(corridor.pathDistance, 2) / Math.pow(corridor.pathHalfWidth * 1.15, 2))
  const bank = smoothstep((across - 0.3) / 0.3) * 1.9
  // The face begins exactly where the floor ends, so the player walks up to a
  // wall rather than up a long ramp that leaves the valley reading as a field.
  const walk = GLOAMWOOD_VALLEY.walkShare
  const face = Math.pow(Math.min(1, Math.max(0, across - walk) / (1 - walk)), 1.7) * GLOAMWOOD_VALLEY.wallHeight
  // The outer rise is measured in world units, not in shares of the width.
  // Sharing it would make the basin rim climb three times slower than the
  // choke's simply because the basin is wider, and the far side would sink
  // below the camera exactly where the valley most needs a horizon.
  const beyond = Math.max(0, (across - 1) * corridor.halfWidth)
  const rim = Math.min(34, beyond * 0.5)
  return corridor.floor + bank + face + rim + rolling * (1 - path * 0.85)
}

/** Height of the water surface over the channel at this point on the route. */
export function gloamwoodValleyWaterHeight(s: number) {
  const bankPoint = gloamwoodValleyPointAt(s, gloamwoodValleyRiverOffset(s))
  const fromBank = bareHeightAt(bankPoint.x, bankPoint.z) - GLOAMWOOD_VALLEY_RIVER.surfaceDrop
  // Never above the road. The path is the line the player reads every other
  // height against, and water running visibly higher than the ground they walk
  // on reads as a canal up on a levee rather than as the floor of a valley.
  const roadPoint = gloamwoodValleyPointAt(s, gloamwoodValleyRoadOffset(s))
  return Math.min(fromBank, bareHeightAt(roadPoint.x, roadPoint.z) - 0.35)
}

function bareHeightAt(x: number, z: number) {
  return valleyBaseHeight(gloamwoodValleyCorridorAt(x, z), x, z)
}

/**
 * How deep the water is here. Zero or less means dry ground.
 *
 * Masked to the channel. Without the mask the river's surface height applies to
 * the whole cross-section, so any ground lower than the water counts as
 * underwater however far from the river it is - which quietly made the marsh
 * branch, whose whole character is that it sits low, unstandable along its
 * entire length.
 */
export function gloamwoodValleyWaterDepth(x: number, z: number) {
  const hit = gloamwoodValleyProject(x, z)
  if (gloamwoodValleyRiverProfile(hit.s, hit.lateral) <= 0.001) return 0
  return gloamwoodValleyWaterHeight(hit.s) - gloamwoodValleyHeight(x, z)
}

export type GloamwoodValleySurface = 'road' | 'bank' | 'wall'

/**
 * Which material dominates here.
 *
 * Blending by position rather than painting a splat map is what makes a
 * generated valley look like terrain instead of one tiled photograph, and it
 * costs nothing but arithmetic.
 */
export function gloamwoodValleySurfaceWeights(x: number, z: number) {
  const corridor = gloamwoodValleyCorridorAt(x, z)
  const road = Math.max(0, 1 - Math.pow(corridor.pathDistance / corridor.pathHalfWidth, 1.6))
  const wall = smoothstep((corridor.across - GLOAMWOOD_VALLEY.walkShare) / 0.28)
  let bank = Math.max(0, 1 - road - wall)
  let wet = 0
  let stone = 0
  // A branch reads as a different place partly through what it is made of.
  // Marsh ground borrows the bare-earth map and scree the rock one - no fourth
  // texture, because a fourth sampler is a fourth thing to load and this kit
  // has nothing to put in it.
  if (corridor.groundBias === 'wet') wet = bank * 0.72
  if (corridor.groundBias === 'rock') stone = bank * 0.55
  bank -= wet + stone
  const total = road + wet + bank + wall + stone || 1
  return { road: (road + wet) / total, bank: bank / total, wall: (wall + stone) / total }
}

export function gloamwoodValleyDominantSurface(x: number, z: number): GloamwoodValleySurface {
  const weights = gloamwoodValleySurfaceWeights(x, z)
  if (weights.wall >= weights.road && weights.wall >= weights.bank) return 'wall'
  return weights.road >= weights.bank ? 'road' : 'bank'
}

/** Region containing this point along the route, or null in a gate's gap. */
export function gloamwoodValleyRegionAt(s: number) {
  return GLOAMWOOD_VALLEY.regions.find((region) => s >= region.from && s <= region.to) ?? null
}

/** True where the player may stand. Beyond this the wall or the river takes over. */
export function gloamwoodValleyWalkable(x: number, z: number) {
  const corridor = gloamwoodValleyCorridorAt(x, z)
  if (corridor.s <= 0 || corridor.s >= GLOAMWOOD_VALLEY_LENGTH) {
    // The ends are closed off by the route running out, not by a wall.
    if (!corridor.branch) return false
  }
  if (corridor.across > GLOAMWOOD_VALLEY.walkShare) return false
  // Depth rather than distance, so a ford is walkable without a special case.
  return gloamwoodValleyWaterDepth(x, z) < 0.25
}

/**
 * Push a position back onto standable ground.
 *
 * Toward the centreline of whichever corridor the point is nearest, which works
 * the same for the route and for a branch - and, unlike the old lateral clamp,
 * does not resolve one boundary by breaking another.
 */
export function gloamwoodValleyConfine(x: number, z: number) {
  let px = x
  let pz = z
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const corridor = gloamwoodValleyCorridorAt(px, pz)
    let moved = false
    if (corridor.across > GLOAMWOOD_VALLEY.walkShare) {
      const centre = nearestCentre(corridor, px, pz)
      const dx = px - centre.x
      const dz = pz - centre.z
      const distance = Math.hypot(dx, dz) || 1
      // Well inside the limit rather than onto it: the width changes fast with
      // position near a choke, so landing exactly on the boundary can leave the
      // recomputed position outside it again.
      const limit = corridor.halfWidth * GLOAMWOOD_VALLEY.walkShare * 0.94
      px = centre.x + (dx / distance) * limit
      pz = centre.z + (dz / distance) * limit
      moved = true
    }
    if (gloamwoodValleyWaterDepth(px, pz) >= 0.25) {
      const pushed = pushOutOfWater(px, pz)
      px = pushed.x
      pz = pushed.z
      moved = true
    }
    if (!moved) break
  }
  // Last resort: the road at this point on the route is standable by
  // construction. Returning a position that is still off the map would hand the
  // caller a number that looks fine and puts the player in a wall.
  if (!gloamwoodValleyWalkable(px, pz)) {
    const hit = gloamwoodValleyProject(px, pz)
    const road = gloamwoodValleyPointAt(hit.s, gloamwoodValleyRoadOffset(hit.s))
    return { x: road.x, z: road.z }
  }
  return { x: px, z: pz }
}

function nearestCentre(corridor: GloamwoodValleyCorridorSolve, x: number, z: number) {
  if (!corridor.branch) return gloamwoodValleyPointAt(corridor.s, 0)
  const resolved = RESOLVED_BRANCHES.find((entry) => entry.branch === corridor.branch)
  if (!resolved) return gloamwoodValleyPointAt(corridor.s, 0)
  const hit = projectOntoPolyline(resolved.points, resolved.lengths, x, z)
  return { x: hit.x, z: hit.z }
}

/**
 * Step out of the channel, onto the bank the point is already on.
 *
 * The side matters. An earlier version searched the road side first whatever
 * the position, so stepping into the water from the far bank put the player out
 * on the near one - a one-frame teleport straight across the river, and a way
 * to skip a ford entirely.
 */
function pushOutOfWater(x: number, z: number) {
  const hit = gloamwoodValleyProject(x, z)
  const river = gloamwoodValleyRiverOffset(hit.s)
  const width = gloamwoodValleyChannelHalfWidth(hit.s)
  const nearSide = hit.lateral >= river ? 1 : -1
  // The near bank is searched to exhaustion before the far one is considered
  // at all. Interleaving them by distance is not enough: the two banks are not
  // equidistant, so on an asymmetric channel the far bank comes up first and
  // the player is handed a one-frame teleport across the river - a free
  // crossing, in a map where crossing is supposed to mean finding a ford.
  for (const side of [nearSide, -nearSide]) {
    for (let step = 0.2; step <= width * 3; step += 0.2) {
      const point = gloamwoodValleyPointAt(hit.s, river + side * step)
      if (gloamwoodValleyWaterDepth(point.x, point.z) < 0.2) return point
    }
  }
  return gloamwoodValleyPointAt(hit.s, gloamwoodValleyRoadOffset(hit.s))
}

/** World position inside a branch, at a fraction along it and an offset. */
export function gloamwoodValleyBranchPointAt(index: number, t: number, lateral: number) {
  const resolved = RESOLVED_BRANCHES[index]
  const total = resolved.lengths.reduce((sum, length) => sum + length, 0) || 1
  const point = pointOnPolyline(resolved.points, resolved.lengths, t * total)
  return { x: point.x + point.normalX * lateral, z: point.z + point.normalZ * lateral }
}

/** Every corridor centreline in world space, for meshing and for review. */
export function gloamwoodValleyCorridorLines() {
  const route: Array<{ x: number; z: number }> = []
  for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 4) route.push(gloamwoodValleyPointAt(s))
  return {
    route,
    branches: RESOLVED_BRANCHES.map((resolved) => ({
      branch: resolved.branch,
      points: resolved.points,
      lengths: resolved.lengths,
      total: resolved.lengths.reduce((sum, length) => sum + length, 0),
    })),
  }
}
