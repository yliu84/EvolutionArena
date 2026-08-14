import type { EnemyState, MonsterLineage } from './monsters'

export const TALENT_SIGNAL_MS: Record<MonsterLineage, number> = {
  fang: 320,
  wing: 300,
  carapace: 280,
  swarm: 360,
  venom: 420,
  rift: 360,
}

export function healthRatio(health: number, maximum: number) {
  if (maximum <= 0) return 0
  return Math.max(0, Math.min(1, health / maximum))
}

export function shouldShowEnemyHealthBar(
  active: boolean,
  inView: boolean,
  state: EnemyState,
  health: number,
  maximum: number,
  selected: boolean,
) {
  if (!active || !inView) return false
  return selected || health < maximum || !['idle', 'return', 'regenerate'].includes(state)
}

export function isTalentSignalActive(lineage: MonsterLineage, now: number, lastTalentAt: number) {
  return lastTalentAt > 0 && now - lastTalentAt <= TALENT_SIGNAL_MS[lineage]
}

export function autoLockPulse(now: number, lastAutoLockAt: number) {
  if (lastAutoLockAt <= 0) return 0
  return Math.max(0, 1 - (now - lastAutoLockAt) / 900)
}

export function shouldAutoLockAttacker(hasVisibleLock: boolean, lockIsAttacker: boolean) {
  if (!hasVisibleLock) return true
  return lockIsAttacker
}
