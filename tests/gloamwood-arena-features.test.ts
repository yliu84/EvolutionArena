import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_ARENA_FEATURES,
  arenaHazardPhase,
  pointInsideArenaHazard,
} from '../src/gloamwood-arena-features'
import { GLOAMWOOD_NEST_CONFIGS } from '../src/gloamwood-nests'

const intersectsObstacle = (
  point: { offsetX: number; offsetY: number },
  obstacle: { offsetX: number; offsetY: number; width: number; height: number },
  margin: number,
) => Math.abs(point.offsetX - obstacle.offsetX) <= obstacle.width / 2 + margin
  && Math.abs(point.offsetY - obstacle.offsetY) <= obstacle.height / 2 + margin

describe('Gloamwood tactical arena features', () => {
  it('gives all eight nests a distinct obstacle, hazard and route identity', () => {
    const entries = Object.entries(GLOAMWOOD_ARENA_FEATURES)
    expect(entries).toHaveLength(8)
    expect(new Set(entries.map(([, feature]) => feature.obstacleStyle)).size).toBe(8)
    expect(new Set(entries.map(([, feature]) => feature.routeLabel)).size).toBe(8)
    expect(new Set(entries.map(([, feature]) => feature.hazards.map((hazard) => hazard.id).join('|'))).size).toBe(8)
  })

  it('keeps every entrance, core and monster spawn clear of tactical obstacles', () => {
    for (const config of GLOAMWOOD_NEST_CONFIGS) {
      const features = GLOAMWOOD_ARENA_FEATURES[config.id]
      expect(features.obstacles.length).toBeGreaterThanOrEqual(2)
      expect(features.hazards.length).toBeGreaterThanOrEqual(2)
      expect(features.route.length).toBeGreaterThanOrEqual(4)
      for (const obstacle of features.obstacles) {
        expect(intersectsObstacle(config.entrance, obstacle, 45), `${config.id}: entrance blocked by ${obstacle.id}`).toBe(false)
        expect(intersectsObstacle(config.core, obstacle, 55), `${config.id}: core blocked by ${obstacle.id}`).toBe(false)
        for (const wave of config.waves) {
          for (const spawn of wave) {
            expect(intersectsObstacle(spawn, obstacle, 30), `${config.id}: ${spawn.id} blocked by ${obstacle.id}`).toBe(false)
          }
        }
      }
    }
  })

  it('keeps route guidance and all hazard footprints inside each playable arena', () => {
    for (const config of GLOAMWOOD_NEST_CONFIGS) {
      const features = GLOAMWOOD_ARENA_FEATURES[config.id]
      const routeStart = features.route[0]
      expect(Math.hypot(routeStart.offsetX - config.entrance.offsetX, routeStart.offsetY - config.entrance.offsetY)).toBeLessThanOrEqual(230)
      for (const point of features.route) {
        expect(Math.hypot(point.offsetX, point.offsetY)).toBeLessThanOrEqual(config.combatRadius * 0.8)
        for (const obstacle of features.obstacles) {
          expect(intersectsObstacle(point, obstacle, 18), `${config.id}: route crosses ${obstacle.id}`).toBe(false)
        }
      }
      for (const hazard of features.hazards) {
        expect(Math.hypot(hazard.offsetX, hazard.offsetY) + Math.max(hazard.radiusX, hazard.radiusY)).toBeLessThan(config.combatRadius * 0.95)
        expect(hazard.warningMs).toBeGreaterThanOrEqual(850)
        expect(hazard.activeMs).toBeLessThan(hazard.cycleMs / 2)
      }
    }
  })

  it('provides deterministic idle, warning and active phases with ellipse hit testing', () => {
    const sample = GLOAMWOOD_ARENA_FEATURES['venom-hollow'].hazards[0]
    const phases = new Set(Array.from({ length: 80 }, (_, index) => arenaHazardPhase(sample, index * 100)))
    expect(phases).toEqual(new Set(['active', 'idle', 'warning']))
    expect(pointInsideArenaHazard(sample.offsetX, sample.offsetY, sample)).toBe(true)
    expect(pointInsideArenaHazard(sample.offsetX + sample.radiusX * 1.1, sample.offsetY, sample)).toBe(false)
  })
})
