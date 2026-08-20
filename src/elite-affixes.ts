import { hashSeed } from './evolution'

export type EliteAffixId = 'berserker' | 'siphon' | 'brood' | 'barrier' | 'volatile'

export interface EliteAffixDefinition {
  id: EliteAffixId
  name: string
  description: string
  color: number
  /** A compact non-colour cue used by the elite nameplate. */
  icon: string
}

export const ELITE_AFFIXES: Record<EliteAffixId, EliteAffixDefinition> = {
  berserker: {
    id: 'berserker', name: '狂暴', icon: '▲', color: 0xff5c54,
    description: '生命低于一半时，移动、攻击频率和伤害提高',
  },
  siphon: {
    id: 'siphon', name: '吸血', icon: '◒', color: 0xff6f91,
    description: '对玩家造成伤害时恢复生命',
  },
  brood: {
    id: 'brood', name: '分裂', icon: '✣', color: 0x74e8d1,
    description: '生命首次降至一半时产生两只弱化分体',
  },
  barrier: {
    id: 'barrier', name: '护盾', icon: '⬡', color: 0x7acbff,
    description: '拥有一层可被击破的额外护盾',
  },
  volatile: {
    id: 'volatile', name: '毒爆', icon: '✹', color: 0xa7ef62,
    description: '死亡后留下短暂预警的毒素爆发',
  },
}

export const ELITE_AFFIX_IDS = Object.keys(ELITE_AFFIXES) as EliteAffixId[]
export const BERSERKER_THRESHOLD = 0.5
export const ELITE_SHIELD_RATIO = 0.3
export const SIPHON_HEAL_RATIO = 0.45
export const TOXIC_BURST_RADIUS = 132
export const TOXIC_BURST_DAMAGE = 18
export const TOXIC_BURST_TELEGRAPH_MS = 720

export function eliteAffixFor(runSeed: string, encounterId: string): EliteAffixId {
  return ELITE_AFFIX_IDS[hashSeed(`${runSeed}:elite:${encounterId}`) % ELITE_AFFIX_IDS.length]
}

export function isBerserkerActive(affix: EliteAffixId | null, health: number, maximum: number) {
  return affix === 'berserker' && maximum > 0 && health / maximum <= BERSERKER_THRESHOLD
}

export function eliteSpeedMultiplier(affix: EliteAffixId | null, health: number, maximum: number) {
  return isBerserkerActive(affix, health, maximum) ? 1.3 : 1
}

export function eliteCooldownMultiplier(affix: EliteAffixId | null, health: number, maximum: number) {
  return isBerserkerActive(affix, health, maximum) ? 0.72 : 1
}

export function eliteDamageMultiplier(affix: EliteAffixId | null, health: number, maximum: number) {
  return isBerserkerActive(affix, health, maximum) ? 1.25 : 1
}

export function initialEliteShield(affix: EliteAffixId | null, maximum: number) {
  return affix === 'barrier' ? Math.max(1, Math.ceil(maximum * ELITE_SHIELD_RATIO)) : 0
}

export function absorbEliteShield(incomingDamage: number, shield: number) {
  const absorbed = Math.min(Math.max(0, incomingDamage), Math.max(0, shield))
  return {
    absorbed,
    remainingDamage: Math.max(0, incomingDamage - absorbed),
    remainingShield: Math.max(0, shield - absorbed),
  }
}

export function siphonHealth(
  affix: EliteAffixId | null,
  health: number,
  maximum: number,
  damageDealt: number,
) {
  if (affix !== 'siphon' || damageDealt <= 0) return health
  return Math.min(maximum, health + Math.max(1, Math.round(damageDealt * SIPHON_HEAL_RATIO)))
}

export function shouldTriggerBrood(
  affix: EliteAffixId | null,
  previousHealth: number,
  nextHealth: number,
  maximum: number,
  alreadyTriggered: boolean,
) {
  return affix === 'brood'
    && !alreadyTriggered
    && nextHealth > 0
    && previousHealth / maximum > BERSERKER_THRESHOLD
    && nextHealth / maximum <= BERSERKER_THRESHOLD
}

export function toxicBurstHits(distance: number, radius = TOXIC_BURST_RADIUS) {
  return distance <= radius
}
