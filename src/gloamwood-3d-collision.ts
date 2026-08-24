export type GloamwoodObstacleKind = 'tree' | 'rock' | 'shrine' | 'pillar'

export interface GloamwoodCircleObstacle {
  id: string
  kind: GloamwoodObstacleKind
  x: number
  z: number
  radius: number
}

export interface GloamwoodPlayerCollisionProfile {
  radius: number
  frontOffset: number
  rearOffset: number
}

export interface GloamwoodCollisionResult {
  x: number
  z: number
  contacts: number
  closestObstacleId: string | null
  minimumClearance: number
}

/**
 * Kept in step with Quality3DFormFamily by hand, because collision cannot import
 * from the asset registry without a cycle. A family with no entry in the
 * override table falls back to the stage profile, which is correct: a form with
 * no body of its own is wearing another family's, and should collide like it.
 */
export type GloamwoodPlayerFamily = 'fang' | 'shell' | 'swarm' | 'wing' | 'venom' | 'rift'

export const GLOAMWOOD_PLAYER_COLLISION_PROFILES = [
  { radius: 0.52, frontOffset: 0.46, rearOffset: 0.52 },
  { radius: 0.62, frontOffset: 0.58, rearOffset: 0.66 },
  { radius: 0.76, frontOffset: 0.82, rearOffset: 0.94 },
] as const satisfies readonly GloamwoodPlayerCollisionProfile[]

/**
 * Form-specific footprints. The Shell stage-1 body is 1.80 wide and 5.82 long
 * against the Fang form's 1.56 x 3.99, so inheriting the stage profile would
 * leave most of its plated mass outside collision. Radius follows half-width;
 * the front and rear probes grow less than raw length because the long plated
 * tail tip is deliberately not an authoritative body, matching the existing rule
 * that a tail tip must not snag terrain.
 */
const GLOAMWOOD_PLAYER_FAMILY_COLLISION_PROFILES: Partial<
  Record<GloamwoodPlayerFamily, Partial<Record<0 | 1 | 2, GloamwoodPlayerCollisionProfile>>>
> = {
  shell: {
    1: { radius: 0.72, frontOffset: 0.74, rearOffset: 0.84 },
    // Shell stage 2 is the widest body in the game: 2.70 x 5.05 at its 2.55
    // world height, against 1.59 x 4.58 at stage 1. Radius follows measured
    // half-width at the same 0.906 fraction the stage-1 profile uses
    // (1.35 * 0.906 = 1.22). The probes grow only with length, and the rear one
    // deliberately lags it, because the stone club at the tail tip is display
    // mass rather than an authoritative body - the same call the stage-1
    // profile made about its plated tail.
    2: { radius: 1.21, frontOffset: 0.82, rearOffset: 0.92 },
  },
  // The Swarm stage-1 body is 1.40 wide and 4.34 long: the narrowest form in the
  // game but not the shortest. Radius follows measured half-width, so it comes
  // in under the stage profile's 0.62. The probes stay close to the Fang form's
  // because the extra length is almost all tail, and a tail tip is deliberately
  // not an authoritative body.
  swarm: { 1: { radius: 0.56, frontOffset: 0.60, rearOffset: 0.68 } },
}

export function getGloamwoodPlayerCollisionProfile(
  stage: number,
  family?: GloamwoodPlayerFamily,
): GloamwoodPlayerCollisionProfile {
  const index = (stage >= 2 ? 2 : stage >= 1 ? 1 : 0) as 0 | 1 | 2
  const override = family ? GLOAMWOOD_PLAYER_FAMILY_COLLISION_PROFILES[family]?.[index] : undefined
  return override ?? GLOAMWOOD_PLAYER_COLLISION_PROFILES[index]
}

function footprintOffsets(profile: GloamwoodPlayerCollisionProfile) {
  return [profile.frontOffset, 0, -profile.rearOffset] as const
}

export function inspectGloamwoodPlayerCollision(
  position: { x: number; z: number },
  facingRadians: number,
  stage: number,
  obstacles: readonly GloamwoodCircleObstacle[],
  family?: GloamwoodPlayerFamily,
): Omit<GloamwoodCollisionResult, 'contacts'> {
  const profile = getGloamwoodPlayerCollisionProfile(stage, family)
  const forwardX = Math.cos(facingRadians)
  const forwardZ = -Math.sin(facingRadians)
  let closestObstacleId: string | null = null
  let minimumClearance = Number.POSITIVE_INFINITY

  for (const offset of footprintOffsets(profile)) {
    const probeX = position.x + forwardX * offset
    const probeZ = position.z + forwardZ * offset
    for (const obstacle of obstacles) {
      const clearance = Math.hypot(probeX - obstacle.x, probeZ - obstacle.z) - obstacle.radius - profile.radius
      if (clearance < minimumClearance) {
        minimumClearance = clearance
        closestObstacleId = obstacle.id
      }
    }
  }

  return {
    x: position.x,
    z: position.z,
    closestObstacleId,
    minimumClearance: Number.isFinite(minimumClearance) ? minimumClearance : 0,
  }
}

export function resolveGloamwoodPlayerCollision(
  position: { x: number; z: number },
  facingRadians: number,
  stage: number,
  obstacles: readonly GloamwoodCircleObstacle[],
  iterations = 6,
  family?: GloamwoodPlayerFamily,
): GloamwoodCollisionResult {
  const profile = getGloamwoodPlayerCollisionProfile(stage, family)
  const forwardX = Math.cos(facingRadians)
  const forwardZ = -Math.sin(facingRadians)
  let x = position.x
  let z = position.z
  let contacts = 0

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let corrected = false
    for (const offset of footprintOffsets(profile)) {
      for (const obstacle of obstacles) {
        const probeX = x + forwardX * offset
        const probeZ = z + forwardZ * offset
        let dx = probeX - obstacle.x
        let dz = probeZ - obstacle.z
        let distance = Math.hypot(dx, dz)
        const minimum = obstacle.radius + profile.radius
        if (distance >= minimum - 0.000001) continue

        if (distance < 0.000001) {
          dx = x - obstacle.x
          dz = z - obstacle.z
          distance = Math.hypot(dx, dz)
          if (distance < 0.000001) {
            dx = -forwardX
            dz = -forwardZ
            distance = 1
          }
        }

        const penetration = minimum - distance
        x += dx / distance * penetration
        z += dz / distance * penetration
        contacts += 1
        corrected = true
      }
    }
    if (!corrected) break
  }

  const inspection = inspectGloamwoodPlayerCollision({ x, z }, facingRadians, stage, obstacles, family)
  return { ...inspection, contacts }
}
