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
  gloamwoodValleyProject,
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
  /**
   * Reads the ground as the mesh draws it, once the mesh exists.
   *
   * Until then the analytic terrain answers, which is what places the creatures
   * before anything is built. The two differ by up to three units between grid
   * vertices, so everything that has to *stand* on the ground asks this.
   */
  drawnHeight?: () => ((x: number, z: number) => number) | null,
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
    height: (x, z) => drawnHeight?.()?.(x, z) ?? gloamwoodValleyHeight(x, z),
    confine: gloamwoodValleyConfine,
    bounds: valleyBounds(),
    spawn,
    // Same distance as the Gloamwood's - 20.08 - at a bearing of about fifteen
    // degrees, which is what the folded route was laid out against.
    cameraOffset: { x: -15.7, y: 11.8, z: -4.2 },
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
    resetAfterDeath(state: GloamwoodNestState, diedAt: { x: number; z: number }) {
      // Everything goes home and forgets the player. A creature the player
      // walked past on their way in has no business standing on top of them
      // when they come back.
      const prey = state.prey.map((entry) => {
        const creature = entry as GloamwoodValleyCreature
        if (creature.phase === 'dead') return creature
        return {
          ...creature,
          x: creature.homeX,
          z: creature.homeZ,
          wanderX: creature.homeX,
          wanderZ: creature.homeZ,
          phase: 'chase' as const,
          phaseElapsed: 0,
          attackResolved: false,
          awake: false,
          outOfReachSeconds: 0,
        }
      })
      // Back to the entrance of the region they died in, not to the start of
      // the run. The regions are the valley's checkpoints - that is what the
      // life budget was designed around, and walking 1500 units back is a
      // punishment nobody asked for.
      const died = gloamwoodValleyProject(diedAt.x, diedAt.z)
      const region = GLOAMWOOD_VALLEY.regions.find((entry) => died.s >= entry.from && died.s <= entry.to)
      const entered = Math.max(GLOAMWOOD_VALLEY.spawnS, region?.from ?? GLOAMWOOD_VALLEY.spawnS)
      const point = gloamwoodValleyPointAt(entered, gloamwoodValleyRoadOffset(entered))
      return { state: { ...state, prey: prey as GloamwoodNestPrey[] }, playerAt: gloamwoodValleyConfine(point.x, point.z) }
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
