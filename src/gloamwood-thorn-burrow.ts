import { GLOAMWOOD_EXPLORATION_LAYOUT, type ExplorationPoint } from './gloamwood-exploration-layout'
import { MONSTER_NEST_LAB } from './monster-nest'

export interface ThornBurrowCollider {
  id: string
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export const THORN_BURROW_V4 = {
  nestId: 'thorn-burrow',
  entrance: { offsetX: 0, offsetY: 520, width: 420 },
  core: { offsetX: 0, offsetY: -12 },
  triggerRadius: 650,
  combatRadius: 560,
  collisionBodies: [
    { id: 'north-root-wall', offsetX: 0, offsetY: -520, width: 760, height: 150 },
    { id: 'west-root-wall', offsetX: -560, offsetY: -55, width: 140, height: 500 },
    { id: 'east-root-wall', offsetX: 560, offsetY: -55, width: 140, height: 500 },
    { id: 'west-gate-fang', offsetX: -310, offsetY: 445, width: 180, height: 150 },
    { id: 'east-gate-fang', offsetX: 310, offsetY: 445, width: 180, height: 150 },
  ] as const satisfies readonly ThornBurrowCollider[],
  floorRings: [560, 440, 320] as const,
  reward: { ...MONSTER_NEST_LAB.reward },
  revealRadius: MONSTER_NEST_LAB.revealRadius,
} as const

export function thornBurrowNest() {
  const nest = GLOAMWOOD_EXPLORATION_LAYOUT.nests.find((candidate) => candidate.id === THORN_BURROW_V4.nestId)
  if (!nest) throw new Error('V4 thorn burrow nest is missing')
  return nest
}

export function thornBurrowPoint(point: { offsetX: number; offsetY: number }): ExplorationPoint {
  const nest = thornBurrowNest()
  return { x: nest.x + point.offsetX, y: nest.y + point.offsetY }
}

export function thornBurrowColliderRect(collider: ThornBurrowCollider) {
  const center = thornBurrowPoint(collider)
  return {
    x: center.x - collider.width / 2,
    y: center.y - collider.height / 2,
    width: collider.width,
    height: collider.height,
  }
}

export function pointInsideThornCollider(x: number, y: number, collider: ThornBurrowCollider) {
  const rect = thornBurrowColliderRect(collider)
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

export function thornBurrowWavePoints() {
  const nest = thornBurrowNest()
  return MONSTER_NEST_LAB.waves.map((wave) => wave.map((spawn) => ({
    id: spawn.id,
    type: spawn.type,
    elite: 'elite' in spawn ? spawn.elite : false,
    x: nest.x + spawn.offsetX,
    y: nest.y + spawn.offsetY,
  })))
}
