export type CombatStyle = 'melee' | 'ranged' | 'magic'

export interface CombatDefinition {
  style: CombatStyle
  name: string
  shortName: string
  range: number
  radius: number
  telegraphMs: number
  recoveryMs: number
  cooldownMs: number
  damageBonus: number
}

export const COMBAT_STYLES: Record<CombatStyle, CombatDefinition> = {
  melee: {
    style: 'melee', name: '撕裂近战', shortName: '近战',
    range: 118, radius: 0, telegraphMs: 170, recoveryMs: 250, cooldownMs: 520, damageBonus: 1,
  },
  ranged: {
    style: 'ranged', name: '骨刺远射', shortName: '远程',
    range: 390, radius: 0, telegraphMs: 150, recoveryMs: 210, cooldownMs: 520, damageBonus: 0,
  },
  magic: {
    style: 'magic', name: '裂隙脉冲', shortName: '魔法',
    range: 430, radius: 96, telegraphMs: 520, recoveryMs: 480, cooldownMs: 1180, damageBonus: 1,
  },
}

export const COMBAT_STYLE_ORDER: CombatStyle[] = ['melee', 'ranged', 'magic']
export const ATTACK_BUFFER_MS = 140
export const PLAYER_PROJECTILE_SPEED = 920

export function projectileLifetimeMs(range: number, speed: number) {
  return Math.ceil(range / speed * 1000) + 40
}

export function attackBufferExpiresAt(now: number) {
  return now + ATTACK_BUFFER_MS
}

export function isAttackBufferAlive(now: number, expiresAt: number) {
  return now <= expiresAt
}

export function attackDamage(style: CombatStyle, basePower: number, multiplier = 1, styleBonus = 0) {
  return Math.max(1, (basePower + COMBAT_STYLES[style].damageBonus + styleBonus) * multiplier)
}

export function isWithinAttackRange(style: CombatStyle, distance: number) {
  return distance <= COMBAT_STYLES[style].range
}

export function clampAttackPoint(
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  maximumRange: number,
) {
  const dx = targetX - originX
  const dy = targetY - originY
  const distance = Math.hypot(dx, dy)
  if (distance <= maximumRange || distance === 0) return { x: targetX, y: targetY }
  const scale = maximumRange / distance
  return { x: originX + dx * scale, y: originY + dy * scale }
}

export function isInsideMeleeArc(
  originX: number,
  originY: number,
  aimAngle: number,
  targetX: number,
  targetY: number,
  range: number,
  halfArcRadians = Math.PI * 0.36,
) {
  const dx = targetX - originX
  const dy = targetY - originY
  if (dx * dx + dy * dy > range * range) return false
  const targetAngle = Math.atan2(dy, dx)
  const difference = Math.atan2(Math.sin(targetAngle - aimAngle), Math.cos(targetAngle - aimAngle))
  return Math.abs(difference) <= halfArcRadians
}
