import type { MonsterType } from './monsters'

export type MonsterNestPhase = 'dormant' | 'wave-1' | 'intermission-1' | 'wave-2' | 'core-vulnerable' | 'cleared'

export interface MonsterNestSpawn {
  id: string
  type: MonsterType
  offsetX: number
  offsetY: number
  elite?: boolean
}

export const MONSTER_NEST_LAB = {
  id: 'thorn-burrow',
  name: '棘牙地穴',
  family: 'fang' as const,
  center: { x: 1350, y: 1450 },
  triggerRadius: 520,
  coreMaxHealth: 18,
  intermissionMs: 900,
  revealRadius: 960,
  reward: { fangGenes: 3, evolution: 36 },
  waves: [
    [
      { id: 'thorn-burrow-w1-pouncer', type: 'pouncer', offsetX: -150, offsetY: -80 },
      { id: 'thorn-burrow-w1-mantis', type: 'mantis', offsetX: 150, offsetY: -70 },
      { id: 'thorn-burrow-w1-fireant', type: 'fireant', offsetX: 0, offsetY: 155 },
    ],
    [
      { id: 'thorn-burrow-w2-scorpion', type: 'scorpion', offsetX: -185, offsetY: 25 },
      { id: 'thorn-burrow-w2-wasp', type: 'wasp', offsetX: 175, offsetY: -20 },
      { id: 'thorn-burrow-w2-centipede', type: 'centipede', offsetX: -25, offsetY: -175 },
      { id: 'thorn-burrow-w2-hornbeetle', type: 'hornbeetle', offsetX: 30, offsetY: 185, elite: true },
    ],
  ] satisfies MonsterNestSpawn[][],
} as const

export function isMonsterNestLabRequested(search = window.location.search) {
  return new URLSearchParams(search).get('nestlab') === '1'
}

export function nestWaveForPhase(phase: MonsterNestPhase) {
  if (phase === 'wave-1') return 1
  if (phase === 'wave-2') return 2
  return 0
}

export function canDamageNestCore(phase: MonsterNestPhase) {
  return phase === 'core-vulnerable'
}

export function nextNestPhase(phase: MonsterNestPhase): MonsterNestPhase {
  if (phase === 'dormant') return 'wave-1'
  if (phase === 'wave-1') return 'intermission-1'
  if (phase === 'intermission-1') return 'wave-2'
  if (phase === 'wave-2') return 'core-vulnerable'
  if (phase === 'core-vulnerable') return 'cleared'
  return 'cleared'
}
