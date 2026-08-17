export interface GloamwoodJoystickVector {
  x: number
  z: number
  visualX: number
  visualY: number
  strength: number
}

export function gloamwoodJoystickVector(
  deltaX: number,
  deltaY: number,
  maximumTravel = 38,
  deadZone = 0.14,
): GloamwoodJoystickVector {
  const distance = Math.hypot(deltaX, deltaY)
  if (!Number.isFinite(distance) || distance <= 0) return { x: 0, z: 0, visualX: 0, visualY: 0, strength: 0 }
  const clampedDistance = Math.min(maximumTravel, distance)
  const normalizedX = deltaX / distance
  const normalizedY = deltaY / distance
  const rawStrength = clampedDistance / maximumTravel
  const strength = rawStrength <= deadZone ? 0 : Math.min(1, (rawStrength - deadZone) / (1 - deadZone))
  return {
    x: normalizedX * strength,
    z: normalizedY * strength,
    visualX: normalizedX * clampedDistance,
    visualY: normalizedY * clampedDistance,
    strength,
  }
}
