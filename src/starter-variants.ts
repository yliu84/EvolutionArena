import type { CombatStyle } from './combat'

export type StarterVariantId = 'claw-hunter' | 'spine-stalker' | 'rift-larva'

export interface StarterVariant {
  id: StarterVariantId
  name: string
  role: string
  description: string
  startingStyle: CombatStyle
  maxHealth: number
  defenseReduction: number
  speed: number
  damageMultiplier: Record<CombatStyle, number>
  cooldownMultiplier: Record<CombatStyle, number>
  magicRadiusMultiplier: number
  primaryColor: number
  secondaryColor: number
}

export const STARTER_VARIANTS: Record<StarterVariantId, StarterVariant> = {
  'claw-hunter': {
    id: 'claw-hunter', name: '利爪猎兽', role: '近战 · 坚韧',
    description: '贴近猎物，以甲壳承受冲击，用利爪快速结束战斗。',
    startingStyle: 'melee', maxHealth: 115, defenseReduction: 0.12, speed: 280,
    damageMultiplier: { melee: 1.25, ranged: 1, magic: 1 },
    cooldownMultiplier: { melee: 1, ranged: 1, magic: 1 },
    magicRadiusMultiplier: 1, primaryColor: 0xffc857, secondaryColor: 0x7c3f2c,
  },
  'spine-stalker': {
    id: 'spine-stalker', name: '骨刺游猎者', role: '远程 · 机动',
    description: '保持安全距离，以更快的骨刺节奏猎杀高威胁目标。',
    startingStyle: 'ranged', maxHealth: 90, defenseReduction: 0.05, speed: 300,
    damageMultiplier: { melee: 1, ranged: 1, magic: 1 },
    cooldownMultiplier: { melee: 1, ranged: 480 / 520, magic: 1 },
    magicRadiusMultiplier: 1, primaryColor: 0x79f2a1, secondaryColor: 0x173f31,
  },
  'rift-larva': {
    id: 'rift-larva', name: '裂隙幼体', role: '魔法 · 范围',
    description: '操纵不稳定脉冲，在更大的范围内同时撕裂多个敌人。',
    startingStyle: 'magic', maxHealth: 100, defenseReduction: 0.08, speed: 275,
    damageMultiplier: { melee: 1, ranged: 1, magic: 1 },
    cooldownMultiplier: { melee: 1, ranged: 1, magic: 0.85 },
    magicRadiusMultiplier: 1.12, primaryColor: 0xc887ff, secondaryColor: 0x4d2268,
  },
}

export const STARTER_ORDER: StarterVariantId[] = ['claw-hunter', 'spine-stalker', 'rift-larva']

export function isStarterVariantId(value: string | null | undefined): value is StarterVariantId {
  return typeof value === 'string' && value in STARTER_VARIANTS
}

export function randomStarter(random: () => number = Math.random): StarterVariantId {
  return STARTER_ORDER[Math.min(STARTER_ORDER.length - 1, Math.floor(random() * STARTER_ORDER.length))]
}

export function mitigateDamage(incomingDamage: number, defenseReduction: number) {
  const reduction = Math.min(0.45, Math.max(0, defenseReduction))
  return Math.max(1, Math.round(incomingDamage * (1 - reduction)))
}
