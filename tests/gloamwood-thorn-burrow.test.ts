import { describe, expect, it } from 'vitest'
import { statSync } from 'node:fs'
import {
  THORN_BURROW_V4,
  pointInsideThornCollider,
  thornBurrowNest,
  thornBurrowPoint,
  thornBurrowWavePoints,
} from '../src/gloamwood-thorn-burrow'

describe('V4 thorn burrow integration layout', () => {
  it('binds to the first official V4 nest', () => {
    const nest = thornBurrowNest()
    expect(nest.id).toBe('thorn-burrow')
    expect(nest).toMatchObject({ x: 1900, y: 860, waves: 2, family: 'fang' })
    expect(THORN_BURROW_V4.triggerRadius).toBe(nest.radius)
  })

  it('leaves a broad southern entrance between two collision fangs', () => {
    const entrance = thornBurrowPoint(THORN_BURROW_V4.entrance)
    expect(entrance.y).toBeGreaterThan(thornBurrowNest().y)
    expect(THORN_BURROW_V4.entrance.width).toBeGreaterThanOrEqual(240)
    expect(THORN_BURROW_V4.collisionBodies.every((body) => !pointInsideThornCollider(entrance.x, entrance.y, body))).toBe(true)
  })

  it('keeps every wave spawn inside the arena and outside terrain collision', () => {
    const nest = thornBurrowNest()
    const waves = thornBurrowWavePoints()
    expect(waves).toHaveLength(2)
    expect(waves[0]).toHaveLength(3)
    expect(waves[1]).toHaveLength(4)
    expect(waves[1].some((spawn) => spawn.type === 'scorpion')).toBe(true)
    for (const spawn of waves.flat()) {
      expect(Math.hypot(spawn.x - nest.x, spawn.y - nest.y)).toBeLessThan(THORN_BURROW_V4.combatRadius)
      expect(THORN_BURROW_V4.collisionBodies.every((body) => !pointInsideThornCollider(spawn.x, spawn.y, body))).toBe(true)
    }
  })

  it('ships the selected transparent master artwork in the project', () => {
    const asset = new URL('../public/assets/map-lab-v4/thorn-burrow/thorn-burrow-master-v1.png', import.meta.url)
    expect(statSync(asset).size).toBeGreaterThan(100_000)
  })

  it('reuses the validated nest reward', () => {
    expect(THORN_BURROW_V4.reward).toEqual({ fangGenes: 3, evolution: 36 })
    expect(THORN_BURROW_V4.revealRadius).toBeGreaterThan(THORN_BURROW_V4.triggerRadius)
  })
})
