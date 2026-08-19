import {
  GLOAMWOOD_NEST,
  type GloamwoodNestEvent,
  type GloamwoodNestPrey,
  type GloamwoodNestState,
  type GloamwoodPlayerPresence,
} from './gloamwood-3d-ecology'
import type { GloamwoodMapContract } from './gloamwood-map'
import { gloamwoodValleyBodyFor } from './gloamwood-modelled-prey'
import {
  createGloamwoodValleyCreatures,
  stepGloamwoodValleyCreatures,
  type GloamwoodValleyCreature,
} from './gloamwood-valley-creatures'
import {
  GLOAMWOOD_VALLEY,
  gloamwoodValleyConfine,
  gloamwoodValleyCorridorLines,
  gloamwoodValleyHeight,
  gloamwoodValleyPointAt,
  gloamwoodValleyRoadOffset,
} from './gloamwood-valley-terrain'

/**
 * The valley, described the way the hunt reads a map.
 *
 * This is what the convergence was for. The valley preview grew its own player,
 * its own combat, its own HUD and its own life budget because it could not use
 * the hunt's; described as a map instead, it gets all of them - and the player
 * stops being a white capsule, because the hunt's player is a modelled creature
 * that evolves.
 */

/** Half-extents covering the folded route and its branches, plus the walls. */
function valleyBounds() {
  let halfWidth = 0
  let halfDepth = 0
  const lines = gloamwoodValleyCorridorLines()
  const note = (x: number, z: number) => {
    halfWidth = Math.max(halfWidth, Math.abs(x))
    halfDepth = Math.max(halfDepth, Math.abs(z))
  }
  for (const point of lines.route) note(point.x, point.z)
  for (const branch of lines.branches) for (const [x, z] of branch.points) note(x, z)
  // Room for the walls the corridors are cut into.
  return { halfWidth: halfWidth + 140, halfDepth: halfDepth + 140 }
}

export function createGloamwoodValleyMap(
  seed: number,
  buildScenery: () => Promise<void>,
  update: GloamwoodMapContract['update'],
): GloamwoodMapContract {
  const spawnPoint = gloamwoodValleyPointAt(
    GLOAMWOOD_VALLEY.spawnS,
    gloamwoodValleyRoadOffset(GLOAMWOOD_VALLEY.spawnS),
  )
  const spawn = gloamwoodValleyConfine(spawnPoint.x, spawnPoint.z)
  return {
    id: 'valley',
    buildScenery,
    update,
    bodyFor: (prey) => {
      const creature = prey as GloamwoodValleyCreature
      return gloamwoodValleyBodyFor({
        kind: creature.kind,
        role: creature.role ?? 'aggressive',
        branch: creature.branch ?? null,
        tier: creature.tier ?? 'pack',
        s: creature.spawnS ?? 0,
      })
    },
    height: gloamwoodValleyHeight,
    confine: gloamwoodValleyConfine,
    bounds: valleyBounds(),
    spawn,
    hasNest: false,
    createCreatures(): GloamwoodNestState {
      return {
        // Cleared, not dormant. The nest's wave machinery is the Gloamwood's
        // one encounter and the valley has sixty-three creatures standing where
        // they live - leaving the phase dormant would have the nest activate on
        // approach and spawn its own waves on top of them.
        phase: 'cleared',
        wave: GLOAMWOOD_NEST.waveCount,
        phaseElapsed: 0,
        prey: createGloamwoodValleyCreatures(seed) as GloamwoodNestPrey[],
        kills: 0,
        biomass: 0,
        genes: { fang: 0, shell: 0, swarm: 0 },
        recentHunts: [],
      }
    },
    stepCreatures(
      state: GloamwoodNestState,
      delta: number,
      player: GloamwoodPlayerPresence,
      struck: readonly string[],
    ): { state: GloamwoodNestState; events: GloamwoodNestEvent[] } {
      // The extra fields a valley creature carries - role, tier, home, wander -
      // are not in the prey type but survive every copy the pipeline makes,
      // because each one spreads the object rather than rebuilding it.
      const frame = stepGloamwoodValleyCreatures(
        state.prey as GloamwoodValleyCreature[],
        delta,
        player,
        { struck },
      )
      return {
        state: { ...state, prey: frame.creatures as GloamwoodNestPrey[] },
        events: frame.events,
      }
    },
  }
}
