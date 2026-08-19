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

import type { GloamwoodModelledPreyConfig } from './gloamwood-modelled-prey'
import { GLOAMWOOD_MODELLED_PREY } from './gloamwood-modelled-prey'
import {
  createGloamwoodNestState,
  stepGloamwoodNest,
  type GloamwoodNestEvent,
  type GloamwoodNestPrey,
  type GloamwoodNestState,
  type GloamwoodPlayerPresence,
} from './gloamwood-3d-ecology'

export type GloamwoodMapId = 'gloamwood' | 'valley'

export interface GloamwoodMapBounds {
  /** Rectangular clamp, in world units. Used where a map has no better rule. */
  halfWidth: number
  halfDepth: number
}

export interface GloamwoodMapContract {
  id: GloamwoodMapId
  /**
   * Builds the scenery into the scene.
   *
   * The one part of a map that genuinely cannot be shared: the Gloamwood's is
   * ten private methods deep in the runtime and the valley's is an instanced
   * scatter over 1590 units of route. Supplied as a callback rather than
   * branched on `id` at the call site, so the difference is settled once when
   * the map is made rather than every time the scene is touched.
   */
  buildScenery(): Promise<void>
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
  /**
   * Where the camera sits relative to the player.
   *
   * The distance is the same on every map - it is the game's framing, not the
   * map's - but the bearing belongs to the ground. The valley's route folds
   * through six headings and was laid out against a camera looking along about
   * fifteen degrees, chosen so no leg of it runs edge-on to the lens. Viewed
   * from the Gloamwood's bearing instead, the same road and river read as
   * having swapped sides.
   */
  cameraOffset: { x: number; y: number; z: number }
  /**
   * Whether this map runs the nest encounter.
   *
   * The Gloamwood's whole structure is one nest: waves, then a guardian, then
   * an evolution choice, then a boss. The valley has none of that yet - it has
   * sixty-three creatures standing where they live - and describing it as a
   * nest that happened to be cleared already made the runtime believe the
   * encounter was over before the player moved. It opened the evolution gate at
   * spawn, refused to lock anything, and froze them in place.
   */
  hasNest: boolean
  /**
   * The creatures the map begins with.
   *
   * The Gloamwood begins empty and its nest spawns waves when the player walks
   * into it. The valley begins with everything already standing where it lives.
   */
  createCreatures(): GloamwoodNestState
  /**
   * One frame of creature behaviour.
   *
   * The container is shared on purpose. Genes, biomass and kills belong to the
   * run rather than to the nest, and the valley needs all three; what actually
   * differs between maps is who is on the field and how they are stepped, which
   * is this one call. Sixty-three references to the state elsewhere in the
   * runtime are untouched by that, and would have been rewritten by any
   * abstraction that replaced the container instead.
   */
  stepCreatures(
    state: GloamwoodNestState,
    delta: number,
    player: GloamwoodPlayerPresence,
    struck: readonly string[],
  ): { state: GloamwoodNestState; events: GloamwoodNestEvent[] }
  /**
   * Per-frame scenery work, if the map has any.
   *
   * The Gloamwood's scenery is static once built. The valley's culls by cell
   * and moves its fog with the player, because it is 1590 units long and one
   * fog density cannot describe both a green river mouth and a cold headwater.
   */
  update?(camera: { x: number; z: number }, elapsed: number, delta: number): void
  /**
   * Which modelled body a creature wears, if any.
   *
   * On the Gloamwood a family is all there is to know. In the valley the tier
   * comes first - reading family alone put three region bosses on the road as
   * ordinary beetles - and then the ground the creature stands on.
   */
  bodyFor(prey: GloamwoodNestPrey): GloamwoodModelledPreyConfig | undefined
}

/**
 * Where a mover should actually end up this frame.
 *
 * Never places anyone illegally, which is the whole point. Confining after the
 * fact looks equivalent and is not: a confine that pushes a little way inside
 * the limit - as the valley's does, so a recomputed width near a choke cannot
 * leave the point outside again - throws the player back six percent every
 * frame they hold a key against the wall, and they bounce there forever. It was
 * measured at 0.31 units a frame, which is exactly one frame of movement.
 *
 * So the step is tested before it is taken. If the whole step is legal it is
 * taken. If it is not, the part of it running along the wall is tried, so a
 * player following a curving valley slides instead of sticking. If that fails
 * too they simply stay where they were, which is what a wall should do.
 */
export function gloamwoodMapStep(
  map: Pick<GloamwoodMapContract, 'confine'>,
  from: { x: number; z: number },
  to: { x: number; z: number },
  tolerance = 0.001,
) {
  const legal = (point: { x: number; z: number }) => {
    const held = map.confine(point.x, point.z)
    return Math.hypot(held.x - point.x, held.z - point.z) <= tolerance
  }
  if (legal(to)) return { x: to.x, z: to.z, blocked: false }

  // The correction the confine wants to make points inward, so it stands in for
  // a surface normal without any map having to describe its walls.
  const held = map.confine(to.x, to.z)
  const inwardX = held.x - to.x
  const inwardZ = held.z - to.z
  const length = Math.hypot(inwardX, inwardZ)
  if (length > tolerance) {
    const normalX = inwardX / length
    const normalZ = inwardZ / length
    const stepX = to.x - from.x
    const stepZ = to.z - from.z
    const into = stepX * normalX + stepZ * normalZ
    const slide = { x: from.x + stepX - into * normalX, z: from.z + stepZ - into * normalZ }
    if (legal(slide)) return { ...slide, blocked: true }
  }
  // Standing still beats being shoved. If where they already were is somehow
  // illegal - knockback, a spawn on bad ground - the confine still rescues it.
  return legal(from) ? { x: from.x, z: from.z, blocked: true } : { ...map.confine(from.x, from.z), blocked: true }
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
  buildScenery: () => Promise<void>,
): GloamwoodMapContract {
  return {
    id: 'gloamwood',
    buildScenery,
    height,
    confine(x, z) {
      return {
        x: Math.min(bounds.halfWidth, Math.max(-bounds.halfWidth, x)),
        z: Math.min(bounds.halfDepth, Math.max(-bounds.halfDepth, z)),
      }
    },
    bounds,
    spawn: { x: -6, z: 3 },
    cameraOffset: { x: 9.2, y: 11.8, z: 13.4 },
    hasNest: true,
    createCreatures: createGloamwoodNestState,
    stepCreatures: (state, delta, player) => stepGloamwoodNest(state, delta, player),
    bodyFor: (prey) => GLOAMWOOD_MODELLED_PREY[prey.kind],
  }
}
