/**
 * Whether something stands between the camera and the player.
 *
 * The rule is shared, the response is not. The Gloamwood hides a whole tree the
 * moment it blocks the shot, which is fine for forty-two trees you rarely walk
 * behind. The valley has thousands of props, drawn as instanced batches where
 * there is no per-object `visible` to switch, and enough of them that a hard
 * toggle would be a constant flicker at the edge of vision.
 *
 * What must not differ is the geometry. Two modules each deciding "is this in
 * the way" with their own arithmetic is the shape of defect that has cost this
 * project four separate bugs, so the decision lives here and both callers read
 * it.
 */

export interface GloamwoodOccluder {
  x: number
  y: number
  z: number
  /** Radius of the blocking volume - a tree's crown, not its trunk. */
  radius: number
}

export interface GloamwoodViewPoint {
  x: number
  y: number
  z: number
}

/**
 * True when the occluder sits on the sightline, between the two points.
 *
 * The "between" test matters as much as the distance one: a crown directly
 * behind the player is on the line the segment extends along but not on the
 * segment, and hiding it would make things vanish for no visible reason.
 */
export function gloamwoodOccludesCameraView(
  occluder: GloamwoodOccluder,
  from: GloamwoodViewPoint,
  to: GloamwoodViewPoint,
) {
  if (distanceToSegment(occluder, from, to) >= occluder.radius) return false
  // Nearer the player than the camera is, measured flat: an occluder further
  // out than the camera cannot be in front of it.
  const toOccluder = squaredFlatDistance(occluder.x, occluder.z, from.x, from.z)
  const toCamera = squaredFlatDistance(to.x, to.z, from.x, from.z)
  return toOccluder < toCamera
}

/**
 * How solid an occluder should be drawn this frame.
 *
 * Eased rather than switched. A hard cut is legible with a handful of trees and
 * becomes a flicker with a thousand: props clip the sightline constantly as the
 * player moves, and each one popping in and out draws the eye to exactly the
 * thing that is supposed to be getting out of the way.
 */
export const GLOAMWOOD_OCCLUSION = {
  /** How solid a blocking prop is left. Not zero - a ghost still reads as cover. */
  blockedOpacity: 0.16,
  /** Seconds to fade out, and back in. Out is faster; being seen matters more. */
  fadeOutSeconds: 0.12,
  fadeInSeconds: 0.28,
} as const

export function gloamwoodOccluderFade(current: number, blocking: boolean, delta: number) {
  const target = blocking ? GLOAMWOOD_OCCLUSION.blockedOpacity : 1
  const seconds = blocking ? GLOAMWOOD_OCCLUSION.fadeOutSeconds : GLOAMWOOD_OCCLUSION.fadeInSeconds
  const step = delta / Math.max(0.0001, seconds)
  if (current < target) return Math.min(target, current + step)
  return Math.max(target, current - step)
}

/**
 * How close the occluder comes to the sightline, as a multiple of its radius.
 *
 * Below 1 means it is in the way. Exposed so a caller can tell "nothing was
 * blocking" from "the test never ran", which are the same observation from the
 * outside and have very different causes.
 */
export function gloamwoodSightlineClearance(
  occluder: GloamwoodOccluder,
  from: GloamwoodViewPoint,
  to: GloamwoodViewPoint,
) {
  return distanceToSegment(occluder, from, to) / Math.max(0.0001, occluder.radius)
}

function distanceToSegment(point: GloamwoodViewPoint, from: GloamwoodViewPoint, to: GloamwoodViewPoint) {
  const abX = to.x - from.x
  const abY = to.y - from.y
  const abZ = to.z - from.z
  const lengthSquared = abX * abX + abY * abY + abZ * abZ
  const along = lengthSquared > 0
    ? Math.min(1, Math.max(0, ((point.x - from.x) * abX + (point.y - from.y) * abY + (point.z - from.z) * abZ) / lengthSquared))
    : 0
  return Math.hypot(
    point.x - (from.x + abX * along),
    point.y - (from.y + abY * along),
    point.z - (from.z + abZ * along),
  )
}

function squaredFlatDistance(ax: number, az: number, bx: number, bz: number) {
  return (ax - bx) ** 2 + (az - bz) ** 2
}

/**
 * The blocking volume of a prop, from its world height.
 *
 * Anything shorter than the player's eye cannot come between the camera and
 * them, so grass and mushrooms are not occluders at all - which is most of the
 * valley's props, and most of the reason the per-frame pass stays cheap.
 */
export const GLOAMWOOD_OCCLUDER_MIN_HEIGHT = 1.6

export function gloamwoodTreeOccluder(x: number, groundY: number, z: number, height: number): GloamwoodOccluder {
  return { x, y: groundY + height * 0.62, z, radius: height * 0.26 }
}

export function gloamwoodRockOccluder(x: number, groundY: number, z: number, diameter: number): GloamwoodOccluder {
  return { x, y: groundY + diameter * 0.42, z, radius: diameter * 0.5 }
}
