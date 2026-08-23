import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { GLOAMWOOD_EXPLORATION_LAYOUT } from '../src/gloamwood-exploration-layout'
import {
  GLOAMWOOD_NEST_CONFIGS,
  canDamageGloamwoodNestCore,
  gloamwoodNestColliderRect,
  gloamwoodNestConfig,
  gloamwoodNestPoint,
  gloamwoodNestWavePoints,
  phaseIntermissionIndex,
  phaseWaveIndex,
} from '../src/gloamwood-nests'

describe('Gloamwood complete nest roster', () => {
  it('defines one complete and uniquely styled configuration for every map nest', () => {
    expect(GLOAMWOOD_NEST_CONFIGS).toHaveLength(GLOAMWOOD_EXPLORATION_LAYOUT.nests.length)
    expect(new Set(GLOAMWOOD_NEST_CONFIGS.map((nest) => nest.id)).size).toBe(8)
    expect(new Set(GLOAMWOOD_NEST_CONFIGS.map((nest) => nest.mechanic)).size).toBe(8)
    expect(new Set(GLOAMWOOD_NEST_CONFIGS.map((nest) => nest.art.path)).size).toBe(8)
    expect(new Set(GLOAMWOOD_NEST_CONFIGS.map((nest) => nest.subtitle)).size).toBe(8)
  })

  it('keeps frozen V4 nest art out of the shipped player payload', () => {
    for (const config of GLOAMWOOD_NEST_CONFIGS) {
      const path = `public${config.art.path}`
      expect(existsSync(path), path).toBe(false)
    }
  })

  it('gives every nest a readable entrance, collision gap, waves, core and reward', () => {
    for (const config of GLOAMWOOD_NEST_CONFIGS) {
      expect(config.entrance.width).toBeGreaterThanOrEqual(400)
      expect(config.collisionBodies.length).toBeGreaterThanOrEqual(5)
      expect(config.waves.length).toBeGreaterThanOrEqual(2)
      expect(config.waves.length).toBeLessThanOrEqual(3)
      expect(config.coreMaxHealth).toBeGreaterThanOrEqual(18)
      expect(config.reward.genes).toBeGreaterThanOrEqual(3)
      expect(config.reward.family).toBe(config.family)
      expect(config.art.width).toBeGreaterThanOrEqual(900)
      expect(config.art.height).toBeGreaterThanOrEqual(700)
      expect(gloamwoodNestWavePoints(config.id, 0).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps every expanded arena spacious, aligned to the map, and free of blocked spawns', () => {
    for (const config of GLOAMWOOD_NEST_CONFIGS) {
      const layout = GLOAMWOOD_EXPLORATION_LAYOUT.nests.find((nest) => nest.id === config.id)!
      const travelSeconds = config.combatRadius * 2 / GLOAMWOOD_EXPLORATION_LAYOUT.playerSpeed
      expect(config.triggerRadius).toBe(layout.radius)
      expect(config.combatRadius).toBeGreaterThanOrEqual(560)
      expect(travelSeconds).toBeGreaterThanOrEqual(layout.elite ? 4.2 : 3.3)
      expect(config.art.width).toBeGreaterThanOrEqual(config.combatRadius * 2.25)
      expect(config.art.height).toBeGreaterThanOrEqual(config.combatRadius * 1.45)

      for (const wave of config.waves) {
        for (const enemy of wave) {
          expect(Math.hypot(enemy.offsetX, enemy.offsetY)).toBeLessThan(config.combatRadius * 0.75)
          for (const collider of config.collisionBodies) {
            const insideCollider = Math.abs(enemy.offsetX - collider.offsetX) < collider.width / 2
              && Math.abs(enemy.offsetY - collider.offsetY) < collider.height / 2
            expect(insideCollider, `${config.id}:${enemy.id} intersects ${collider.id}`).toBe(false)
          }
        }
      }
    }
  })

  it('resolves offsets and collider rectangles against authored map centers', () => {
    const config = gloamwoodNestConfig('drowned-queen')
    const layout = GLOAMWOOD_EXPLORATION_LAYOUT.nests.find((nest) => nest.id === config.id)!
    expect(gloamwoodNestPoint(config.id, config.entrance)).toEqual({
      x: layout.x + config.entrance.offsetX,
      y: layout.y + config.entrance.offsetY,
    })
    const rect = gloamwoodNestColliderRect(config.id, config.collisionBodies[0])
    expect(rect.width).toBe(config.collisionBodies[0].width)
    expect(rect.height).toBe(config.collisionBodies[0].height)
  })

  it('parses generic two- and three-wave phases', () => {
    expect(phaseWaveIndex('wave-1')).toBe(0)
    expect(phaseWaveIndex('wave-3')).toBe(2)
    expect(phaseIntermissionIndex('intermission-2')).toBe(1)
    expect(canDamageGloamwoodNestCore('core-vulnerable')).toBe(true)
    expect(canDamageGloamwoodNestCore('wave-3')).toBe(false)
  })
})
