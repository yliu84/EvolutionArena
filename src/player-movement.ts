export type PlayerMovementState = 'normal' | 'dodge' | 'hitstun'

export const DODGE = {
  speed: 760,
  durationMs: 220,
  cooldownMs: 900,
} as const

export const HIT_STUN_MS = 220
export const CLICK_MOVE_STOP_DISTANCE = 18

export interface WorldPoint {
  x: number
  y: number
}

export function resolveDodgeDirection(inputX: number, inputY: number, facingAngle: number) {
  const length = Math.hypot(inputX, inputY)
  if (length > 0) return { x: inputX / length, y: inputY / length }
  return { x: Math.cos(facingAngle), y: Math.sin(facingAngle) }
}

export function canStartDodge(now: number, nextDodgeAt: number, movementState: PlayerMovementState) {
  return movementState === 'normal' && now >= nextDodgeAt
}

export function dodgeCooldownRemaining(now: number, nextDodgeAt: number) {
  return Math.max(0, nextDodgeAt - now)
}

export function directionToMoveTarget(
  currentX: number,
  currentY: number,
  target: WorldPoint | undefined,
  stopDistance = CLICK_MOVE_STOP_DISTANCE,
): WorldPoint | undefined {
  if (!target) return undefined
  const dx = target.x - currentX
  const dy = target.y - currentY
  const distance = Math.hypot(dx, dy)
  if (distance <= stopDistance) return undefined
  return { x: dx / distance, y: dy / distance }
}
