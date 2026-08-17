export const QUALITY_3D_RESCUE_CAMERA = {
  mode: 'perspective-spring' as const,
  fovDegrees: 48,
  distance: 10.6,
  pitchDegrees: 29,
  orbitDegrees: 39,
  pivotHeight: 0.82,
  lookAheadDistance: 0.72,
  horizontalOmega: 9.5,
  verticalOmega: 6.2,
  horizontalLeash: 1.18,
  verticalLeash: 1.42,
  teleportDistance: 7,
  near: 0.12,
  far: 150,
} as const

export interface Quality3DCameraPivot {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  active: boolean
}

export function createQuality3DCameraPivot(): Quality3DCameraPivot {
  return { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, active: false }
}

function dampAxis(position: number, velocity: number, target: number, omega: number, delta: number) {
  const displacement = position - target
  const decay = Math.exp(-omega * delta)
  const impulse = (velocity + omega * displacement) * delta
  return {
    position: target + (displacement + impulse) * decay,
    velocity: (velocity - omega * impulse) * decay,
  }
}

export function stepQuality3DCameraPivot(
  state: Quality3DCameraPivot,
  targetX: number,
  targetY: number,
  targetZ: number,
  delta: number,
) {
  const dx = state.x - targetX
  const dy = state.y - targetY
  const dz = state.z - targetZ
  if (!state.active || dx * dx + dy * dy + dz * dz > QUALITY_3D_RESCUE_CAMERA.teleportDistance ** 2) {
    state.x = targetX
    state.y = targetY
    state.z = targetZ
    state.vx = 0
    state.vy = 0
    state.vz = 0
    state.active = true
    return state
  }

  const step = Math.min(Math.max(delta, 0), 0.25)
  const x = dampAxis(state.x, state.vx, targetX, QUALITY_3D_RESCUE_CAMERA.horizontalOmega, step)
  const z = dampAxis(state.z, state.vz, targetZ, QUALITY_3D_RESCUE_CAMERA.horizontalOmega, step)
  const y = dampAxis(state.y, state.vy, targetY, QUALITY_3D_RESCUE_CAMERA.verticalOmega, step)
  state.x = x.position
  state.vx = x.velocity
  state.y = y.position
  state.vy = y.velocity
  state.z = z.position
  state.vz = z.velocity

  const offsetX = state.x - targetX
  const offsetZ = state.z - targetZ
  const horizontalOffset = Math.hypot(offsetX, offsetZ)
  if (horizontalOffset > QUALITY_3D_RESCUE_CAMERA.horizontalLeash) {
    const ratio = QUALITY_3D_RESCUE_CAMERA.horizontalLeash / horizontalOffset
    state.x = targetX + offsetX * ratio
    state.z = targetZ + offsetZ * ratio
  }
  state.y = Math.max(
    targetY - QUALITY_3D_RESCUE_CAMERA.verticalLeash,
    Math.min(targetY + QUALITY_3D_RESCUE_CAMERA.verticalLeash, state.y),
  )
  return state
}

export function quality3DVisibleHeightAtPivot() {
  return 2 * Math.tan((QUALITY_3D_RESCUE_CAMERA.fovDegrees * Math.PI) / 360) * QUALITY_3D_RESCUE_CAMERA.distance
}
