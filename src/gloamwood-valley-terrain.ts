/**
 * The valley's shape, as pure functions of position.
 *
 * There is no artist on this project and the existing map is already generated
 * rather than authored - `terrainHeight` is a function, the ground is a plane
 * with a tiled CC0 texture, and the props are scattered from a seed. So the
 * valley is built the same way, and needs no new art at all.
 *
 * Coordinates come from `docs/design/maps/VALLEY-MAP-SPEC-V1.md`, where the
 * 1600-unit length was derived from a time budget rather than chosen: 25 minutes
 * minus what the encounters actually cost leaves 485s of travel, which at
 * PLAYER_SPEED 6.2 and 70% path efficiency is a 1565-unit main road.
 */

export const GLOAMWOOD_VALLEY = {
  length: 1600,
  /**
   * Widths are set against the camera, not against the map.
   *
   * The first meshed pass used 96 and read as an open field; 28 still put both
   * walls outside the picture. The camera sits 11.8 up and 16.25 back with a
   * 52-degree lens, which frames about 18 units either side of the player, so
   * the wall has to start inside that or the valley is a valley only on paper.
   */
  /** Widest the valley opens, at the three basins. */
  basinHalfWidth: 38,
  /** Narrowest, at the two chokes. Passable but unmistakably a gate. */
  chokeHalfWidth: 9,
  corridorHalfWidth: 22,
  /**
   * Share of the half-width the player may actually use. Beyond it the wall
   * face takes over. One constant, read by everything: the walkable limit, the
   * river's placement and the wall's onset have to agree, and three copies of
   * 0.82 in three functions is how they stop agreeing.
   */
  walkShare: 0.6,
  /**
   * Tall enough to stand over the camera. At 11 the gorge walls topped out two
   * units below the lens, so the shot looked over them onto the plateau beyond
   * and a slot canyon read as a ditch in a field.
   */
  wallHeight: 17,
  spawn: { x: 40, z: 0 },
  chokes: [540, 1120],
  chokeSpan: 34,
  /**
   * The second and third basins open immediately after their chokes rather
   * than well past them. The gate itself is eight units of floor - dramatic to
   * walk through and impossible to fight in, since a region boss is 3.6 across
   * and its ground slam covers 8.6. The squeeze is the gate; the arena is what
   * opens on the other side of it.
   */
  basins: [[120, 380], [590, 960], [1170, 1500]],
  /** Where each region's boss stands: in the bowl past its gate. */
  bossSlots: [600, 1180, 1520],
  regions: [
    { id: 'shallows', from: 0, to: 500, tier: 1 },
    { id: 'gorge', from: 580, to: 1080, tier: 2 },
    { id: 'headwater', from: 1160, to: 1600, tier: 3 },
  ],
} as const


/**
 * The road's centreline.
 *
 * A path dead straight for 1600 units is the single most artificial thing a
 * generated valley can put on screen - it reads as a runway, and it tells the
 * player the map was produced rather than found. The wander is small, because
 * it has to stay clear of the river on one side and the wall on the other.
 */
export function gloamwoodValleyRoadCenter(x: number) {
  const half = gloamwoodValleyHalfWidth(x)
  const wander = (Math.sin(x * 0.011) + Math.sin(x * 0.0043 + 2.1) * 0.6) / 1.6
  // Offset to one side rather than run down the middle. Centred, there is no
  // room left for the river: the floor is only thirteen units either side of a
  // six-unit road, so the water ends up pushed against the wall and out of
  // frame, and the valley's defining feature is one the player never sees.
  return half * (0.22 + 0.08 * wander)
}

/** Bare walking surface half-width. Scales down with the valley at the chokes,
 * where the path is the whole floor and cannot be wider than it. */
export function gloamwoodValleyRoadHalfWidth(x: number) {
  return Math.min(5, gloamwoodValleyHalfWidth(x) * 0.26)
}

/**
 * The river.
 *
 * A valley named for its river has to actually carry one, and the channel must
 * be cut into the terrain rather than laid on top of it - a water plane sitting
 * on flat ground reads as a puddle decal. So the river is a function of x, the
 * ground is carved by it, and the water surface is derived from the carve.
 *
 * It hugs the far bank and never crosses the road. A river across the path
 * would be a wall the player has no way over: there is no swim state, and
 * adding one is not in this milestone.
 */
export const GLOAMWOOD_VALLEY_RIVER = {
  /** Open water half-width, as a fraction of the valley's half-width. */
  widthShare: 0.16,
  /** Capped so a basin does not become a lake. */
  maxHalfWidth: 4.5,
  /** Water depth at the centreline. */
  depth: 2.2,
  /** How far the water surface sits below the bank it cuts into. */
  surfaceDrop: 0.9,
  /**
   * How close to the centreline the player may come, as a fraction of the
   * channel's half-width. Set so the water at the limit is barely over the
   * foot: there is no wading animation, and a hunter standing knee-deep in a
   * river with a walk cycle looks broken.
   */
  wadeShare: 0.75,
} as const

/** Centreline of the river at this point along the valley. */
export function gloamwoodValleyRiverCenter(x: number) {
  // Placed relative to the road, not to the valley: as a share of the width it
  // swung out to twenty units in the basins, which is past the edge of the
  // picture. A river the player only meets on the map screen is decoration.
  //
  // The clearance is built from the two widths rather than guessed as a share
  // of the valley, so the road and the water cannot overlap by construction.
  // Every earlier version of this number was a constant tuned until the test
  // stopped failing, which lasts exactly until the next width changes.
  const clearance = gloamwoodValleyRoadHalfWidth(x) + gloamwoodValleyRiverHalfWidth(x) + 1.8
  return gloamwoodValleyRoadCenter(x) - clearance * (1 + Math.sin(x * 0.0075) * 0.09)
}

export function gloamwoodValleyRiverHalfWidth(x: number) {
  const base = Math.min(
    GLOAMWOOD_VALLEY_RIVER.maxHalfWidth,
    gloamwoodValleyHalfWidth(x) * GLOAMWOOD_VALLEY_RIVER.widthShare,
  )
  // The channel breathes along its length. Constant width gives a dead straight
  // waterline, which is the tell that a river was extruded rather than eroded -
  // and it costs two sine terms to avoid, because the carve follows this and so
  // the water's edge follows the carve.
  return base * (1 + Math.sin(x * 0.13) * 0.16 + Math.sin(x * 0.37 + 1.1) * 0.1)
}

/** True where the river runs, used to keep the road and the water apart. */
export function gloamwoodValleyRiverNearEdge(x: number) {
  return gloamwoodValleyRiverCenter(x) + gloamwoodValleyRiverHalfWidth(x)
}

/** 1 at the centreline, 0 at the channel edge, smooth at both. */
export function gloamwoodValleyRiverProfile(x: number, z: number) {
  const offset = Math.abs(z - gloamwoodValleyRiverCenter(x)) / gloamwoodValleyRiverHalfWidth(x)
  return 1 - smoothstep(offset)
}

export type GloamwoodValleyRegionId = typeof GLOAMWOOD_VALLEY.regions[number]['id']

/** Half-width of the walkable floor at this point along the valley. */
export function gloamwoodValleyHalfWidth(x: number) {
  for (const choke of GLOAMWOOD_VALLEY.chokes) {
    const distance = Math.abs(x - choke)
    if (distance < GLOAMWOOD_VALLEY.chokeSpan) {
      // Ease out of the choke rather than stepping, or the walls read as a door
      // frame dropped into the terrain.
      const t = distance / GLOAMWOOD_VALLEY.chokeSpan
      return GLOAMWOOD_VALLEY.chokeHalfWidth
        + (GLOAMWOOD_VALLEY.corridorHalfWidth - GLOAMWOOD_VALLEY.chokeHalfWidth) * smoothstep(t)
    }
  }
  for (const [from, to] of GLOAMWOOD_VALLEY.basins) {
    if (x > from && x < to) {
      // Basins swell and close again, so the space reads as a clearing rather
      // than a corridor that happens to be wide.
      const t = (x - from) / (to - from)
      const swell = Math.sin(t * Math.PI)
      return GLOAMWOOD_VALLEY.corridorHalfWidth
        + (GLOAMWOOD_VALLEY.basinHalfWidth - GLOAMWOOD_VALLEY.corridorHalfWidth) * swell
    }
  }
  return GLOAMWOOD_VALLEY.corridorHalfWidth
}

function smoothstep(t: number) {
  const clamped = Math.min(1, Math.max(0, t))
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * Ground height. Flat road, banks that lift, then walls.
 *
 * The silhouette does most of the work in a generated map, so the wall rises
 * hard rather than gently: a valley the player can see the top of is a field.
 */
export function gloamwoodValleyHeight(x: number, z: number) {
  const base = valleyBaseHeight(x, z)
  const profile = gloamwoodValleyRiverProfile(x, z)
  if (profile <= 0) return base
  // The bed is derived from the water surface rather than subtracted from the
  // bank, so the channel is exactly as deep as the river is - carving a fixed
  // amount out of noisy ground leaves the water anywhere between ankle and
  // waist depending on where the noise happened to sit.
  const bed = gloamwoodValleyWaterHeight(x) - GLOAMWOOD_VALLEY_RIVER.depth
  return base + (bed - base) * profile
}

/** The valley before the river cuts into it. */
function valleyBaseHeight(x: number, z: number) {
  const half = gloamwoodValleyHalfWidth(x)
  const across = Math.abs(z) / half
  const rolling = Math.sin(x * 0.037) * 0.34 + Math.cos(z * 0.055) * 0.22 + Math.sin((x * 0.6 + z) * 0.021) * 0.28
  // The road is graded flat; rolling only shows once off it.
  const roadHalf = gloamwoodValleyRoadHalfWidth(x)
  const road = Math.exp(-Math.pow(z - gloamwoodValleyRoadCenter(x), 2) / Math.pow(roadHalf * 1.15, 2))
  const bank = smoothstep((across - 0.3) / 0.3) * 1.9
  // The wall term is clamped, then handed to a slower outer rise. Left
  // unclamped it passes 1500 units high at the edge of the drawn ground, which
  // is not a valley wall but a spike; clamped alone it is a flat mesa the
  // camera looks straight over.
  // The face begins exactly where the floor ends, so the player walks up to a
  // wall rather than up a long ramp that leaves the valley reading as a field.
  const walk = GLOAMWOOD_VALLEY.walkShare
  const face = Math.pow(Math.min(1, Math.max(0, across - walk) / (1 - walk)), 1.7) * GLOAMWOOD_VALLEY.wallHeight
  // The outer rise is measured in world units, not in shares of the width.
  // Sharing it would make the basin rim climb three times slower than the
  // choke's simply because the basin is wider, and the far side would sink
  // below the camera exactly where the valley most needs a horizon.
  const beyond = Math.max(0, Math.abs(z) - half)
  const rim = Math.min(34, beyond * 0.5)
  // A long ascent up-valley, so the headwater sits above the river mouth.
  const gradient = x / GLOAMWOOD_VALLEY.length * 4.5
  return gradient + bank + face + rim + rolling * (1 - road * 0.85)
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
  const half = gloamwoodValleyHalfWidth(x)
  const across = Math.abs(z) / half
  const road = Math.max(0, 1 - Math.pow(Math.abs(z - gloamwoodValleyRoadCenter(x)) / gloamwoodValleyRoadHalfWidth(x), 1.6))
  const wall = smoothstep((across - GLOAMWOOD_VALLEY.walkShare) / 0.28)
  const bank = Math.max(0, 1 - road - wall)
  const total = road + bank + wall || 1
  return { road: road / total, bank: bank / total, wall: wall / total }
}

export function gloamwoodValleyDominantSurface(x: number, z: number): GloamwoodValleySurface {
  const weights = gloamwoodValleySurfaceWeights(x, z)
  if (weights.wall >= weights.road && weights.wall >= weights.bank) return 'wall'
  return weights.road >= weights.bank ? 'road' : 'bank'
}

/** Region containing this point, or null in the gaps the chokes occupy. */
export function gloamwoodValleyRegionAt(x: number) {
  return GLOAMWOOD_VALLEY.regions.find((region) => x >= region.from && x <= region.to) ?? null
}

/** Height of the water surface over the channel at this point. */
export function gloamwoodValleyWaterHeight(x: number) {
  const center = gloamwoodValleyRiverCenter(x)
  const fromBank = valleyBaseHeight(x, center) - GLOAMWOOD_VALLEY_RIVER.surfaceDrop
  // Never above the road. The path is the line the player reads every other
  // height against, and water running visibly higher than the ground they walk
  // on reads as a canal up on a levee rather than as the floor of a valley.
  // The rolling noise is free to make the far bank higher than the near one,
  // so this has to be enforced rather than assumed.
  return Math.min(fromBank, valleyBaseHeight(x, gloamwoodValleyRoadCenter(x)) - 0.35)
}

/** How deep the water is here. Zero or less means dry ground. */
export function gloamwoodValleyWaterDepth(x: number, z: number) {
  return gloamwoodValleyWaterHeight(x) - gloamwoodValleyHeight(x, z)
}

/** Half-width of the floor the player may use, before the river is taken out. */
export function gloamwoodValleyWalkableHalfWidth(x: number) {
  return gloamwoodValleyHalfWidth(x) * GLOAMWOOD_VALLEY.walkShare
}

/** True where the player may stand. Beyond this the wall or the river takes over. */
export function gloamwoodValleyWalkable(x: number, z: number) {
  if (x < 0 || x > GLOAMWOOD_VALLEY.length) return false
  if (Math.abs(z) > gloamwoodValleyWalkableHalfWidth(x)) return false
  const wade = gloamwoodValleyRiverHalfWidth(x) * GLOAMWOOD_VALLEY_RIVER.wadeShare
  return Math.abs(z - gloamwoodValleyRiverCenter(x)) >= wade
}

/** Push a position back inside the walkable floor, preserving the road axis. */
export function gloamwoodValleyConfine(x: number, z: number) {
  const clampedX = Math.min(GLOAMWOOD_VALLEY.length, Math.max(0, x))
  const limit = gloamwoodValleyWalkableHalfWidth(clampedX)
  let clampedZ = Math.min(limit, Math.max(-limit, z))
  const center = gloamwoodValleyRiverCenter(clampedX)
  const wade = gloamwoodValleyRiverHalfWidth(clampedX) * GLOAMWOOD_VALLEY_RIVER.wadeShare
  const offset = clampedZ - center
  if (Math.abs(offset) < wade) {
    // Out to the road side by default. The far bank is only chosen when the
    // player was already on it and there is room to stand there - otherwise the
    // push would put them through the wall, which is the same class of defect
    // as the arena that only ever held the boss in.
    // A hair past the line, not on it: landing exactly on the boundary leaves
    // the walkable test deciding on a rounding error.
    const far = center - wade - 0.01
    clampedZ = offset < 0 && far >= -limit ? far : center + wade + 0.01
  }
  return { x: clampedX, z: clampedZ }
}
