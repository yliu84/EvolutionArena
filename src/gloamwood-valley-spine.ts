/**
 * The main route, as a folded line through the world.
 *
 * The first build ran the valley along the x axis with a small wander in the
 * path, and it read exactly as what it was: one corridor to the end. A map is
 * open when it makes you turn - walk a stretch, arrive somewhere open, and the
 * way on leaves in a different direction.
 *
 * So the route is a polyline, the open ground sits at its corners, and every
 * measurement that used to be "at x" is now "at s", the distance travelled
 * along it. Nothing else about the valley changed shape: the widths, the
 * chokes, the road and the river are the same functions, taking s.
 */

export interface GloamwoodSpineHit {
  /** Distance travelled along the route to the nearest point on it. */
  s: number
  /** Signed offset from the centreline. Positive is the route's left. */
  lateral: number
  distance: number
  x: number
  z: number
  /** Unit tangent, pointing the way the route runs. */
  tangentX: number
  tangentZ: number
}

export function measurePolyline(points: readonly (readonly [number, number])[]) {
  const lengths: number[] = []
  let total = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    const length = Math.hypot(points[index + 1][0] - points[index][0], points[index + 1][1] - points[index][1])
    lengths.push(length)
    total += length
  }
  return { lengths, total }
}

/**
 * Nearest point on a folded line, with the side the query fell on.
 *
 * The sign matters: the road sits to one side of the centreline and the river
 * to the other, and on a route that turns there is no world axis left to hang
 * "one side" off.
 */
export function projectOntoPolyline(
  points: readonly (readonly [number, number])[],
  lengths: readonly number[],
  x: number,
  z: number,
): GloamwoodSpineHit {
  let best: GloamwoodSpineHit | null = null
  let travelled = 0
  for (let index = 0; index < points.length - 1; index += 1) {
    const [ax, az] = points[index]
    const [bx, bz] = points[index + 1]
    const dx = bx - ax
    const dz = bz - az
    const lengthSquared = dx * dx + dz * dz || 1
    const along = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / lengthSquared))
    const cx = ax + dx * along
    const cz = az + dz * along
    const distance = Math.hypot(x - cx, z - cz)
    if (!best || distance < best.distance) {
      const inverse = 1 / Math.max(1e-6, Math.hypot(dx, dz))
      const tangentX = dx * inverse
      const tangentZ = dz * inverse
      best = {
        s: travelled + lengths[index] * along,
        // Cross product of the tangent with the offset: the sign is the side.
        lateral: tangentX * (z - cz) - tangentZ * (x - cx),
        distance,
        x: cx,
        z: cz,
        tangentX,
        tangentZ,
      }
    }
    travelled += lengths[index]
  }
  return best as GloamwoodSpineHit
}

/** World position and heading at a distance along a folded line. */
export function pointOnPolyline(
  points: readonly (readonly [number, number])[],
  lengths: readonly number[],
  s: number,
) {
  let remaining = Math.max(0, s)
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining > lengths[index] && index < lengths.length - 1) {
      remaining -= lengths[index]
      continue
    }
    const [ax, az] = points[index]
    const [bx, bz] = points[index + 1]
    const inverse = 1 / Math.max(1e-6, lengths[index])
    const tangentX = (bx - ax) * inverse
    const tangentZ = (bz - az) * inverse
    const clamped = Math.min(lengths[index], remaining)
    return {
      x: ax + tangentX * clamped,
      z: az + tangentZ * clamped,
      tangentX,
      tangentZ,
      /** Unit normal pointing to the route's left. */
      normalX: -tangentZ,
      normalZ: tangentX,
    }
  }
  const [ax, az] = points[0]
  return { x: ax, z: az, tangentX: 1, tangentZ: 0, normalX: 0, normalZ: 1 }
}

/**
 * Rounds the corners of a folded line.
 *
 * A polyline with hard corners has a normal that jumps at every vertex, and the
 * two ways of using it disagree there: nearest-point projection (what the
 * terrain measures with) and offset-along-the-normal (what a ribbon mesh is
 * built with) diverge exactly at the turn. The river was cut into the channel
 * by the first and drawn by the second, so at every corner the water left its
 * own bed and the ground sliced the ribbon into pieces.
 *
 * Rounding the corners makes the normal continuous, and the two agree again.
 */
export function roundPolylineCorners(
  points: readonly (readonly [number, number])[],
  radius: number,
  segments = 8,
): Array<readonly [number, number]> {
  if (points.length < 3) return points.map((point) => [point[0], point[1]] as const)
  const rounded: Array<readonly [number, number]> = [[points[0][0], points[0][1]]]
  for (let index = 1; index < points.length - 1; index += 1) {
    const [ax, az] = points[index - 1]
    const [px, pz] = points[index]
    const [cx, cz] = points[index + 1]
    const inLength = Math.hypot(px - ax, pz - az)
    const outLength = Math.hypot(cx - px, cz - pz)
    const trim = Math.min(radius, inLength * 0.35, outLength * 0.35)
    const startX = px - ((px - ax) / inLength) * trim
    const startZ = pz - ((pz - az) / inLength) * trim
    const endX = px + ((cx - px) / outLength) * trim
    const endZ = pz + ((cz - pz) / outLength) * trim
    for (let step = 0; step <= segments; step += 1) {
      const t = step / segments
      const inverse = 1 - t
      // Quadratic Bezier through the corner, which is a close enough arc and
      // needs no trigonometry.
      rounded.push([
        inverse * inverse * startX + 2 * inverse * t * px + t * t * endX,
        inverse * inverse * startZ + 2 * inverse * t * pz + t * t * endZ,
      ] as const)
    }
  }
  rounded.push([points[points.length - 1][0], points[points.length - 1][1]])
  return rounded
}
