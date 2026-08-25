/**
 * The ground of the altar defence map, described by functions rather than a mesh.
 *
 * Same discipline as the valley: the shape lives in these functions, the mesh
 * and the plan drawing are both generated from them, and nothing measures the
 * map by looking at it. `scripts/render-defence-preview.ts` draws the plan from
 * here, so a plan can never go stale against the ground the player stands on.
 *
 * The layout answers a specific brief. Monsters emerge from one portal at the
 * north, march down a single road, and cross an open bowl to reach an altar
 * that is backed against the south wall. The player stands between.
 *
 * Two decisions in it are worth keeping written down, because both were wrong
 * in an earlier draft:
 *
 * **The altar is at the south rim, not in the middle.** A central altar with a
 * single northern entrance is a defence problem the player solves by standing
 * still just north of it, and the whole southern half of the bowl is never
 * used. Against the south wall, the bowl itself becomes the defended frontage:
 * 20 units of ground that anything has to cross, and the player has to hold.
 *
 * **The road is long on purpose.** It is 34 units, which at the shipped prey
 * speeds is 9.3s for the Fang, 11.7s for the Swarm and 23s for the Carapace.
 * Without it a wave arrives as a single mob on top of the player. With it, a
 * wave arrives strung out by how fast its members walk, which is a difficulty
 * texture nobody had to author.
 *
 * Do not confuse that with the 54 units from the portal to the altar. The road
 * is how long a wave takes to *arrive*; the march is how far it would get if
 * nothing ever stopped it, and an early estimate quoted one as the other.
 *
 * The Carapace's 23s is too long to stand and watch, which is why the mode is
 * expected to march creatures faster than they fight. That belongs to the wave
 * director rather than to the ground, and is not decided here.
 */

export const GLOAMWOOD_DEFENCE = {
  /**
   * 52 x 68, against the compact Gloamwood's 50 x 36.
   *
   * The width was already enough; it is the depth that had to grow, because
   * the depth is where the march happens.
   */
  bounds: { halfWidth: 26, halfDepth: 34 },
  /** The open bowl. Nothing is scattered inside it - that is the whole point. */
  arena: { x: 0, z: 16, radius: 13 },
  /** Backed against the south wall, so nothing can get behind it. */
  altar: { x: 0, z: 26, radius: 3 },
  /** In front of the altar, so a death puts the player back on the last line. */
  spawn: { x: 0, z: 21 },
  portal: { x: 0, z: -28 },
  road: {
    /** Where the throat is at its narrowest, all the way down from the portal. */
    halfWidth: 3.5,
    /**
     * The mouth, and why it flares.
     *
     * A constant-width road meets the bowl at a point, and everything files
     * through it in single file at a spot the player never has to leave. The
     * flare spreads a wave across an arc as it arrives, so holding the line
     * means moving along it.
     */
    mouthHalfWidth: 8,
    flareStartZ: -3,
    /**
     * The mouth ends *inside* the bowl. At z = 6 the bowl is 8.31 wide against
     * the mouth's 8, so the two regions overlap and the walkable ground is
     * continuous. Ending the road on the rim at z = 3 instead left them
     * touching at a single point.
     */
    endZ: 6,
  },
  /** The portal sits above the bowl, so a wave is visibly coming *down*. */
  portalHeight: 2.4,
  /** How far the bowl dishes at its centre. Shallow: this is a floor, not a pit. */
  arenaDish: 0.45,
  /** The bank outside the walkable ground, which is what reads as a wall. */
  wallHeight: 3.2,
  wallRampWidth: 4,
  /**
   * Where the lens sits relative to the player. Magnitude 20.08, the same as
   * the Gloamwood's and the valley's - the distance is the game's framing and
   * only the bearing belongs to the map.
   *
   * It lives here rather than only in the map contract because the scatter
   * needs it too. The altar is against the south wall, so a camera behind the
   * player is *inside* that wall, and the first build of this map framed a
   * screenful of bark. Which ground the lens flies through is a fact about the
   * layout, so both readers take it from one place.
   */
  cameraOffset: { x: 5, y: 11.8, z: 15.46 },
} as const

const ARENA = GLOAMWOOD_DEFENCE.arena
const ROAD = GLOAMWOOD_DEFENCE.road

/** How wide the road is at a given depth, flaring into the bowl at the end. */
export function gloamwoodDefenceRoadHalfWidth(z: number) {
  if (z < GLOAMWOOD_DEFENCE.portal.z || z > ROAD.endZ) return 0
  if (z <= ROAD.flareStartZ) return ROAD.halfWidth
  const progress = (z - ROAD.flareStartZ) / (ROAD.endZ - ROAD.flareStartZ)
  return ROAD.halfWidth + (ROAD.mouthHalfWidth - ROAD.halfWidth) * progress
}

function arenaDistance(x: number, z: number) {
  return Math.hypot(x - ARENA.x, z - ARENA.z)
}

export function gloamwoodDefenceWalkable(x: number, z: number) {
  if (arenaDistance(x, z) <= ARENA.radius) return true
  const halfWidth = gloamwoodDefenceRoadHalfWidth(z)
  return halfWidth > 0 && Math.abs(x) <= halfWidth
}

/**
 * Projected points land a hair inside the edge rather than exactly on it.
 *
 * Projecting onto the boundary itself puts the result at radius exactly, where
 * floating point decides whether `<= radius` holds - so `confine` returned
 * ground `walkable` then rejected. It also keeps the player off the seam where
 * the wall bank starts to climb.
 */
const EDGE_INSET = 0.02

/**
 * The nearest point that can be stood on, and how far away it is.
 *
 * Both `confine` and `height` need this: where the floor is and how high it is
 * are different questions, and this project has already shipped a defect from
 * answering them in two places that disagreed.
 */
export function gloamwoodDefenceNearestWalkable(x: number, z: number) {
  if (gloamwoodDefenceWalkable(x, z)) return { x, z, distance: 0 }

  const toCentre = arenaDistance(x, z)
  const inset = Math.max(0, ARENA.radius - EDGE_INSET)
  const scale = toCentre > 1e-6 ? inset / toCentre : 0
  const arenaPoint = toCentre > 1e-6
    ? { x: ARENA.x + (x - ARENA.x) * scale, z: ARENA.z + (z - ARENA.z) * scale }
    : { x: ARENA.x + inset, z: ARENA.z }
  const arenaGap = Math.hypot(x - arenaPoint.x, z - arenaPoint.z)

  const roadZ = Math.min(ROAD.endZ - EDGE_INSET, Math.max(GLOAMWOOD_DEFENCE.portal.z + EDGE_INSET, z))
  const roadHalfWidth = Math.max(0, gloamwoodDefenceRoadHalfWidth(roadZ) - EDGE_INSET)
  const roadPoint = { x: Math.min(roadHalfWidth, Math.max(-roadHalfWidth, x)), z: roadZ }
  const roadGap = Math.hypot(x - roadPoint.x, z - roadPoint.z)

  return roadGap < arenaGap
    ? { ...roadPoint, distance: roadGap }
    : { ...arenaPoint, distance: arenaGap }
}

export function gloamwoodDefenceConfine(x: number, z: number) {
  const { halfWidth, halfDepth } = GLOAMWOOD_DEFENCE.bounds
  const clampedX = Math.min(halfWidth, Math.max(-halfWidth, x))
  const clampedZ = Math.min(halfDepth, Math.max(-halfDepth, z))
  const nearest = gloamwoodDefenceNearestWalkable(clampedX, clampedZ)
  return { x: nearest.x, z: nearest.z }
}

/** The walkable surface, before the wall bank is added on top of it. */
function floorHeight(x: number, z: number) {
  const toCentre = arenaDistance(x, z)
  if (toCentre <= ARENA.radius) {
    const normalised = toCentre / ARENA.radius
    return -GLOAMWOOD_DEFENCE.arenaDish * (1 - normalised * normalised)
  }
  // On the road: a steady grade down from the portal to the bowl, so a wave is
  // seen descending rather than appearing at the same level it will fight on.
  const span = ROAD.endZ - GLOAMWOOD_DEFENCE.portal.z
  const travelled = (Math.min(ROAD.endZ, Math.max(GLOAMWOOD_DEFENCE.portal.z, z)) - GLOAMWOOD_DEFENCE.portal.z) / span
  return GLOAMWOOD_DEFENCE.portalHeight * (1 - travelled)
}

export function gloamwoodDefenceHeight(x: number, z: number) {
  const nearest = gloamwoodDefenceNearestWalkable(x, z)
  const base = floorHeight(nearest.x, nearest.z)
  if (nearest.distance <= 0) return base
  const climb = Math.min(1, nearest.distance / GLOAMWOOD_DEFENCE.wallRampWidth)
  // Smoothstep rather than linear: a straight ramp meeting flat ground leaves a
  // crease along the whole boundary, which on a bowl this size is a visible
  // ring around the fight.
  return base + GLOAMWOOD_DEFENCE.wallHeight * climb * climb * (3 - 2 * climb)
}

/**
 * How far anything entering the bowl still has to travel to reach the altar.
 *
 * The number the layout exists to produce: the player's defended frontage. At
 * the shipped speeds the player crosses it in 3.2s and a Fang in 5.5s, so a
 * leaker can always be caught - but only just, which is the tension the mode
 * is for.
 */
export function gloamwoodDefenceInterceptionDepth() {
  return GLOAMWOOD_DEFENCE.altar.z - ROAD.endZ
}

/**
 * How far this point is from any position the camera can occupy.
 *
 * The camera is the player's position plus a fixed offset and the player is
 * confined to walkable ground, so the set of camera positions is the walkable
 * region translated by that offset. Anything tall standing in it ends up
 * between the lens and the fight.
 */
export function gloamwoodDefenceCameraLaneDistance(x: number, z: number) {
  const { cameraOffset } = GLOAMWOOD_DEFENCE
  return gloamwoodDefenceNearestWalkable(x - cameraOffset.x, z - cameraOffset.z).distance
}

/** The march, from the portal to the altar. Used to size wave timing. */
export function gloamwoodDefenceMarchDistance() {
  return GLOAMWOOD_DEFENCE.altar.z - GLOAMWOOD_DEFENCE.portal.z
}

/** Outline points for the plan renderer, so the drawing comes from the ground. */
export function gloamwoodDefenceOutline(steps = 96) {
  const arena: Array<{ x: number; z: number }> = []
  for (let index = 0; index < steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2
    arena.push({ x: ARENA.x + Math.cos(angle) * ARENA.radius, z: ARENA.z + Math.sin(angle) * ARENA.radius })
  }
  const left: Array<{ x: number; z: number }> = []
  const right: Array<{ x: number; z: number }> = []
  for (let index = 0; index <= steps; index += 1) {
    const z = GLOAMWOOD_DEFENCE.portal.z + (ROAD.endZ - GLOAMWOOD_DEFENCE.portal.z) * (index / steps)
    const halfWidth = gloamwoodDefenceRoadHalfWidth(z)
    left.push({ x: -halfWidth, z })
    right.push({ x: halfWidth, z })
  }
  return { arena, road: [...left, ...right.reverse()] }
}
