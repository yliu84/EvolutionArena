import {
  type GloamwoodNestEvent,
  type GloamwoodNestState,
  type GloamwoodPlayerPresence,
  createGloamwoodNestState,
} from './gloamwood-3d-ecology'
import { GLOAMWOOD_RUN_LIVES, type GloamwoodMapContract } from './gloamwood-map'
import { GLOAMWOOD_MODELLED_PREY } from './gloamwood-modelled-prey'
import {
  GLOAMWOOD_DEFENCE,
  gloamwoodDefenceConfine,
  gloamwoodDefenceHeight,
} from './gloamwood-defence-terrain'

/**
 * The altar defence map, described the way the hunt reads a map.
 *
 * This is the ground only. There is no altar entity, no wave director and no
 * lose condition yet: the map spawns nothing and steps nothing, on purpose, so
 * the space can be walked and judged before anything is built to stand in it.
 * Everything below that looks like a stub says so.
 *
 * It is a third map rather than a reshaped Gloamwood. The compact Gloamwood is
 * an accepted build with its own nest, guardian and boss, and the mode this map
 * is for changes what a creature is trying to do - it walks to the altar rather
 * than at the player. Rewriting the Gloamwood into it would have taken an
 * accepted encounter apart to build an unproven one.
 */
export function createGloamwoodDefenceMap(
  buildScenery: () => Promise<void>,
  update?: GloamwoodMapContract['update'],
): GloamwoodMapContract {
  return {
    id: 'defence',
    buildScenery,
    update,
    height: gloamwoodDefenceHeight,
    confine: gloamwoodDefenceConfine,
    bounds: GLOAMWOOD_DEFENCE.bounds,
    spawn: GLOAMWOOD_DEFENCE.spawn,
    /**
     * Looking down the road, from behind the altar.
     *
     * The Gloamwood's bearing and the valley's were each chosen against the
     * ground they frame. This map's whole read is "what is coming down the
     * road", so the lens sits behind the line the player is holding, with the
     * approach running away from it rather than across it.
     *
     * Taken from the layout constants rather than written here, because the
     * scatter has to keep trunks out of the lane the lens flies through and the
     * two must not be able to disagree.
     */
    cameraOffset: GLOAMWOOD_DEFENCE.cameraOffset,
    /**
     * No nest encounter. The Gloamwood's nest is waves-then-guardian-then-boss
     * on a timer the player triggers by walking in; this map's waves come from
     * a portal on a schedule and are aimed at the altar, which is a different
     * director and is not written yet.
     */
    hasNest: false,
    lives: GLOAMWOOD_RUN_LIVES,
    /**
     * The three families already have shipped bodies, and this mode puts the
     * player nose to nose with them for a whole run. Primitives are the look
     * that was accepted on the compact Gloamwood, not here.
     */
    modelledCreatures: true,
    createCreatures: () => createGloamwoodNestState(),
    stepCreatures: (
      state: GloamwoodNestState,
      _delta: number,
      _player: GloamwoodPlayerPresence,
      _struck: readonly string[],
    ): { state: GloamwoodNestState; events: GloamwoodNestEvent[] } => ({ state, events: [] }),
    resetAfterDeath: (state, _diedAt) => ({
      state,
      // Always back in front of the altar. On this map a death is a breach of
      // the line, and respawning anywhere else would put the player behind the
      // thing they are defending.
      playerAt: { ...GLOAMWOOD_DEFENCE.spawn },
    }),
    reachedMilestones: () => [],
    bodyFor: (prey) => GLOAMWOOD_MODELLED_PREY[prey.kind],
  }
}
