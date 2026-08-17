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

export const GLOAMWOOD_PLAYER_COLLISION_PROFILES = [
  { radius: 0.52, frontOffset: 0.46, rearOffset: 0.52 },
  { radius: 0.62, frontOffset: 0.58, rearOffset: 0.66 },
  { radius: 0.76, frontOffset: 0.82, rearOffset: 0.94 },
] as const satisfies readonly GloamwoodPlayerCollisionProfile[]

export function getGloamwoodPlayerCollisionProfile(stage: number): GloamwoodPlayerCollisionProfile {
  return GLOAMWOOD_PLAYER_COLLISION_PROFILES[stage >= 2 ? 2 : stage >= 1 ? 1 : 0]
}

function footprintOffsets(profile: GloamwoodPlayerCollisionProfile) {
  return [profile.frontOffset, 0, -profile.rearOffset] as const
}

export function inspectGloamwoodPlayerCollision(
  position: { x: number; z: number },
  facingRadians: number,
  stage: number,
  obstacles: readonly GloamwoodCircleObstacle[],
): Omit<GloamwoodCollisionResult, 'contacts'> {
  const profile = getGloamwoodPlayerCollisionProfile(stage)
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
): GloamwoodCollisionResult {
  const profile = getGloamwoodPlayerCollisionProfile(stage)
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

  const inspection = inspectGloamwoodPlayerCollision({ x, z }, facingRadians, stage, obstacles)
  return { ...inspection, contacts }
}
