import { MONSTERS, type MonsterAttackKind, type MonsterType } from './monsters'

export type MonsterTelegraphShape = 'landing' | 'lane' | 'shockwave' | 'tether' | 'line' | 'cone'

export interface GloamwoodMonsterSkill {
  id: string
  label: string
  attackKind: MonsterAttackKind
  telegraphShape: MonsterTelegraphShape
  dangerHint: string
  damageScale: number
  impactRadius: number
  knockback: number
}

export const GLOAMWOOD_MONSTER_SKILLS: Record<MonsterAttackKind, GloamwoodMonsterSkill> = {
  pounce: {
    id: 'predator-pounce', label: '猎杀扑击', attackKind: 'pounce', telegraphShape: 'landing',
    dangerHint: '迅速离开落点圈', damageScale: 0.3, impactRadius: 72, knockback: 145,
  },
  dash: {
    id: 'razor-dash', label: '贯穿冲刺', attackKind: 'dash', telegraphShape: 'lane',
    dangerHint: '横移躲开冲刺线', damageScale: 0.28, impactRadius: 58, knockback: 190,
  },
  brace: {
    id: 'carapace-slam', label: '甲壳震地', attackKind: 'brace', telegraphShape: 'shockwave',
    dangerHint: '退出震地范围', damageScale: 0.3, impactRadius: 158, knockback: 220,
  },
  drain: {
    id: 'blood-drain', label: '吸血穿刺', attackKind: 'drain', telegraphShape: 'tether',
    dangerHint: '切断吸血连线', damageScale: 0.29, impactRadius: 64, knockback: 105,
  },
  projectile: {
    id: 'aimed-projectile', label: '瞄准喷射', attackKind: 'projectile', telegraphShape: 'line',
    dangerHint: '预判射线后侧移', damageScale: 0.38, impactRadius: 24, knockback: 80,
  },
  spread: {
    id: 'fan-barrage', label: '扇形弹幕', attackKind: 'spread', telegraphShape: 'cone',
    dangerHint: '穿过弹幕间隙', damageScale: 0.38, impactRadius: 24, knockback: 65,
  },
}

export function gloamwoodMonsterSkill(type: MonsterType) {
  return GLOAMWOOD_MONSTER_SKILLS[MONSTERS[type].attackKind]
}

export function gloamwoodMonsterDamage(type: MonsterType, elite = false) {
  const monster = MONSTERS[type]
  const skill = gloamwoodMonsterSkill(type)
  const baseDamage = monster.attackKind === 'projectile' || monster.attackKind === 'spread'
    ? monster.projectileDamage ?? 8
    : monster.contactDamage
  return Math.max(2, Math.round(baseDamage * skill.damageScale * (elite ? 1.35 : 1)))
}

export function gloamwoodMonsterAttackSpeed(type: MonsterType) {
  const monster = MONSTERS[type]
  if (monster.attackKind === 'dash' || monster.attackKind === 'drain') return monster.dashSpeed ?? 520
  if (monster.attackKind === 'pounce') return 540
  return 0
}

export function hasReadableMonsterSkillTiming(type: MonsterType) {
  const monster = MONSTERS[type]
  return monster.telegraphMs >= 500
    && monster.activeMs > 0
    && monster.recoveryMs >= 500
    && monster.cooldownMs >= monster.telegraphMs
}
