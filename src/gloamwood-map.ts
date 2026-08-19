/**
 * What the hunt needs to know about the ground it is played on.
 *
 * The hunt was written against one map and reads it directly: a module-level
 * `terrainHeight`, a pair of world half-extents, and thirty-five references to
 * the nest and arena coordinates. That was correct while there was one map.
 * There are now two, and the alternative to this contract is a second copy of
 * the player, the combat, the HUD and the lives - which is already half built
 * in the valley preview and is exactly how two systems that must agree stop
 * agreeing.
 *
 * The contract is deliberately small. It carries the ground, the bounds and
 * where things stand; it does not carry combat, progression or presentation,
 * because none of those differ between maps and a map that could change them
 * would be a second place to look when a fight misbehaves.
 */

export type GloamwoodMapId = 'gloamwood' | 'valley'

export interface GloamwoodMapBounds {
  /** Rectangular clamp, in world units. Used where a map has no better rule. */
  halfWidth: number
  halfDepth: number
}

export interface GloamwoodMapContract {
  id: GloamwoodMapId
  /** Ground height anywhere. The one function the whole runtime asks. */
  height(x: number, z: number): number
  /**
   * Push a position onto ground that can be stood on.
   *
   * Separate from `height` because "where the floor is" and "how high it is"
   * are different questions, and the project has already shipped a defect from
   * answering them in two places that disagreed.
   */
  confine(x: number, z: number): { x: number; z: number }
  bounds: GloamwoodMapBounds
  /** Where the player starts a run. */
  spawn: { x: number; z: number }
}

/**
 * The Gloamwood, described by the functions it already had.
 *
 * Behaviour-identical on purpose: this map is an accepted build, and the point
 * of the first step is to change where the runtime reads its ground from, not
 * what the ground is.
 */
export function createGloamwoodMap(
  height: (x: number, z: number) => number,
  bounds: GloamwoodMapBounds,
): GloamwoodMapContract {
  return {
    id: 'gloamwood',
    height,
    confine(x, z) {
      return {
        x: Math.min(bounds.halfWidth, Math.max(-bounds.halfWidth, x)),
        z: Math.min(bounds.halfDepth, Math.max(-bounds.halfDepth, z)),
      }
    },
    bounds,
    spawn: { x: -6, z: 3 },
  }
}
