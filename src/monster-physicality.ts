import { MONSTERS, MONSTER_TYPES, type MonsterType } from './monsters'

export type MonsterLocomotion = 'ground' | 'flying'

export interface MonsterPhysicalProfile {
  locomotion: MonsterLocomotion
  baseScale: number
  colliderRadius: number
  shadowWidth: number
  shadowHeight: number
  hoverHeight: number
}

const FLYING_MONSTERS = new Set<MonsterType>([
  'razorwing', 'riftweaver', 'wasp', 'moth', 'mosquito', 'locust', 'dragonfly', 'cicada',
])

const BASE_SCALE: Record<MonsterType, number> = {
  pouncer: 0.64,
  razorwing: 0.66,
  shellback: 0.7,
  bloodleech: 0.62,
  spitter: 0.63,
  riftweaver: 0.66,
  mantis: 1.22,
  hornbeetle: 1.25,
  fireant: 1.05,
  stagbeetle: 1.38,
  scorpion: 1.22,
  wasp: 1.05,
  moth: 1.18,
  mosquito: 0.95,
  centipede: 1.32,
  bombardier: 1.16,
  dungbeetle: 1.22,
  locust: 1.08,
  dragonfly: 1.05,
  spider: 1.18,
  tick: 1.08,
  cicada: 1.12,
  glowworm: 1.08,
  silkworm: 1.14,
}

const LARGE_GROUND_MONSTERS = new Set<MonsterType>([
  'shellback', 'hornbeetle', 'stagbeetle', 'centipede', 'dungbeetle',
])

const ANIMATED_MONSTERS = new Set<MonsterType>([
  'pouncer', 'razorwing', 'shellback', 'bloodleech', 'spitter', 'riftweaver',
])

export const MONSTER_PHYSICAL_PROFILES = Object.fromEntries(MONSTER_TYPES.map((type) => {
  const flying = FLYING_MONSTERS.has(type)
  const large = LARGE_GROUND_MONSTERS.has(type)
  const animated = ANIMATED_MONSTERS.has(type)
  const colliderRadius = animated ? (large ? 44 : 38) : (large ? 20 : flying ? 14 : 16)
  return [type, {
    locomotion: flying ? 'flying' : 'ground',
    baseScale: BASE_SCALE[type],
    colliderRadius,
    shadowWidth: large ? 154 : flying ? 136 : type === 'bloodleech' ? 142 : 126,
    shadowHeight: large ? 40 : flying ? 28 : type === 'bloodleech' ? 30 : 34,
    hoverHeight: flying ? (type === 'riftweaver' ? 58 : 46) : 0,
  } satisfies MonsterPhysicalProfile]
})) as Record<MonsterType, MonsterPhysicalProfile>

export function monsterPhysicalProfile(type: MonsterType) {
  return MONSTER_PHYSICAL_PROFILES[type]
}

export function isFlyingMonster(type: MonsterType) {
  return monsterPhysicalProfile(type).locomotion === 'flying'
}

export function monsterDisplayScale(type: MonsterType, elite = false) {
  return monsterPhysicalProfile(type).baseScale * (elite ? 1.25 : 1)
}

export function monsterColliderOffset(type: MonsterType, sourceSize: number) {
  const radius = monsterPhysicalProfile(type).colliderRadius
  return { x: sourceSize * 0.5 - radius, y: sourceSize * 0.68 - radius }
}

export function monsterTerrainCollisionEnabled(type: MonsterType, flightHeight: number) {
  return !isFlyingMonster(type) || flightHeight <= 8
}

export function monsterCanContactPlayer(type: MonsterType, flightHeight: number, aiState: string) {
  if (aiState !== 'attack') return false
  if (MONSTERS[type].attackKind === 'projectile' || MONSTERS[type].attackKind === 'spread') return false
  return !isFlyingMonster(type) || flightHeight <= 8
}
