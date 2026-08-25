import {
  GLOAMWOOD_PREY,
  gloamwoodPreyBodyRadius,
  stepPrey,
  type GloamwoodNestEvent,
  type GloamwoodNestState,
  type GloamwoodPlayerPresence,
  createGloamwoodNestState,
} from './gloamwood-3d-ecology'
import {
  GLOAMWOOD_DEFENCE_BOSSES,
  GLOAMWOOD_DEFENCE_ENGAGE_DISTANCE,
  GLOAMWOOD_DEFENCE_RUN,
  createGloamwoodDefenceBossPrey,
  createGloamwoodDefencePrey,
  createGloamwoodDefenceState,
  gloamwoodDefenceWave,
  damageGloamwoodDefenceAltar,
  gloamwoodDefenceDamageScale,
  gloamwoodDefenceMarchStep,
  gloamwoodDefencePreyWave,
  gloamwoodDefenceSpeedMultiplier,
  gloamwoodDefenceTarget,
  separateGloamwoodDefencePrey,
  stepGloamwoodDefence,
  type GloamwoodDefenceState,
} from './gloamwood-defence-director'
import { GLOAMWOOD_RUN_LIVES, type GloamwoodMapContract } from './gloamwood-map'
import {
  GLOAMWOOD_MODELLED_PREY,
  GLOAMWOOD_THORNHEART_WARDEN_PREY,
  GLOAMWOOD_VALLEY_BOSS_BODIES,
  type GloamwoodModelledPreyConfig,
} from './gloamwood-modelled-prey'
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
): GloamwoodMapContract & {
  defenceRun(): GloamwoodDefenceState
  defenceDamageAltar(damage: number): number
  defenceSkipToWave(wave: number): number
  upcomingBossBody(): GloamwoodModelledPreyConfig | undefined
} {
  let run = createGloamwoodDefenceState()
  let spawnSequence = 0
  let pendingAltarDamage = 0
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
    createCreatures: () => {
      run = createGloamwoodDefenceState()
      return createGloamwoodNestState()
    },
    /**
     * One frame of the mode.
     *
     * The director decides what steps through the portal and when the run ends;
     * `stepPrey` decides everything a creature does, exactly as it does on
     * every other map. The only thing settled here is *what each creature is
     * being stepped against* - the altar while it marches, the player once they
     * are close enough to be worth turning on.
     *
     * A blow that landed on the altar never becomes a `prey-attack`. That event
     * means "the player was hit" everywhere else in the runtime, and letting it
     * mean two things would put altar damage on the player's health bar.
     */
    stepCreatures: (
      state: GloamwoodNestState,
      delta: number,
      player: GloamwoodPlayerPresence,
      _struck: readonly string[],
    ): { state: GloamwoodNestState; events: GloamwoodNestEvent[] } => {
      const events: GloamwoodNestEvent[] = []
      const alive = state.prey.filter((prey) => prey.phase !== 'dead')

      const applyAltarDamage = (damage: number) => {
        const hit = damageGloamwoodDefenceAltar(run, damage)
        run = hit.state
        for (const altarEvent of hit.events) {
          if (altarEvent.type === 'altar-damaged') {
            events.push({
              type: 'defence-altar-damaged',
              damage: altarEvent.damage,
              remaining: altarEvent.remaining,
              max: run.altarMaxHealth,
            })
          }
          if (altarEvent.type === 'run-lost') events.push({ type: 'defence-run-lost' })
        }
      }

      if (pendingAltarDamage > 0) {
        applyAltarDamage(pendingAltarDamage)
        pendingAltarDamage = 0
      }

      const directed = stepGloamwoodDefence(run, delta, { alive: alive.length, total: state.prey.length })
      run = directed.state
      for (const event of directed.events) {
        if (event.type === 'wave-started') events.push({ type: 'wave-started', wave: event.wave })
        if (event.type === 'wave-cleared') events.push({ type: 'wave-cleared', wave: event.wave })
        if (event.type === 'run-won') events.push({ type: 'defence-run-won' })
        if (event.type === 'run-lost') events.push({ type: 'defence-run-lost' })
      }

      const prey = alive.map((entry) => ({ ...entry }))
      if (directed.releaseBoss) {
        prey.push(createGloamwoodDefenceBossPrey(directed.releaseBoss, spawnSequence))
        spawnSequence += 1
      }
      for (const kind of directed.release) {
        prey.push(createGloamwoodDefencePrey(kind, spawnSequence, run.wave))
        spawnSequence += 1
      }

      for (let index = 0; index < prey.length; index += 1) {
        const target = gloamwoodDefenceTarget(prey[index], player)
        const toAltar = Math.hypot(
          GLOAMWOOD_DEFENCE.altar.x - prey[index].x,
          GLOAMWOOD_DEFENCE.altar.z - prey[index].z,
        )
        // Travel is a walk, not an approach. See `gloamwoodDefenceMarchStep`.
        if (target.marching && toAltar > GLOAMWOOD_DEFENCE_ENGAGE_DISTANCE && prey[index].phase === 'chase') {
          const walked = gloamwoodDefenceMarchStep(
            prey[index],
            delta,
            GLOAMWOOD_PREY[prey[index].kind].moveSpeed
              * gloamwoodDefenceSpeedMultiplier(prey[index], true),
          )
          const onFloor = gloamwoodDefenceConfine(walked.x, walked.z)
          prey[index] = { ...prey[index], ...walked, ...onFloor }
          continue
        }
        const stepped = stepPrey(prey[index], delta, target.presence, {
          moveSpeedMultiplier: gloamwoodDefenceSpeedMultiplier(prey[index], target.marching),
        })
        // A hard guarantee rather than a hope: nothing on this map may stand
        // where the player cannot follow it.
        const onFloor = gloamwoodDefenceConfine(stepped.state.x, stepped.state.z)
        prey[index] = { ...stepped.state, ...onFloor }
        for (const event of stepped.events) {
          if (event.type !== 'prey-attack') {
            events.push(event)
            continue
          }
          // Two scales, and they are different questions. `playerDamageScale`
          // is how hard this mode hits compared with the rest of the game;
          // the wave scale is how much worse it gets as a run goes on.
          const wave = gloamwoodDefenceDamageScale(gloamwoodDefencePreyWave(event.preyId))
          if (!target.marching) {
            events.push({
              ...event,
              damage: Math.max(
                1,
                Math.round(event.damage * GLOAMWOOD_DEFENCE_RUN.playerDamageScale * wave),
              ),
            })
            continue
          }
          applyAltarDamage(event.damage * wave)
        }
      }

      // Last, so nothing that has just been placed on an action ring is left
      // standing inside a body four times its size.
      const separated = separateGloamwoodDefencePrey(prey, (entry) => gloamwoodPreyBodyRadius(entry))
        .map((entry) => ({ ...entry, ...gloamwoodDefenceConfine(entry.x, entry.z) }))
      return { state: { ...state, prey: separated }, events }
    },
    /** What the mode wants on the status line: which wave, and how the altar is. */
    status: () => (run.phase === 'ready' ? null : {
      key: 'hud.defenceStatus',
      params: {
        wave: run.wave,
        waves: GLOAMWOOD_DEFENCE_RUN.waves,
        altar: run.altarHealth,
        altarMax: run.altarMaxHealth,
      },
    }),
    /** Read-only, for the HUD and for review. */
    defenceRun: () => run,
    /**
     * The body the *next* boss will wear, so it can be fetched before it walks.
     *
     * `loadModelledPrey` deliberately skips boss-tier creatures - that is Goal
     * 15E, which stopped the opening scene downloading every 4-7 MB boss GLB -
     * so without this the first build of this mode put the Warden on the road
     * wearing the Carapace family's primitive fallback.
     *
     * Fetched during the intermission rather than at spawn: six seconds of head
     * start, and if it is not enough the boss wears its fallback until the
     * decode finishes, which is the behaviour that deferral was designed around.
     */
    upcomingBossBody: () => {
      const wave = gloamwoodDefenceWave(run.wave + 1) ?? gloamwoodDefenceWave(run.wave)
      if (!wave?.boss) return undefined
      const wanted = GLOAMWOOD_DEFENCE_BOSSES[wave.boss]?.bodyId
      if (!wanted) return undefined
      if (wanted === GLOAMWOOD_THORNHEART_WARDEN_PREY.id) return GLOAMWOOD_THORNHEART_WARDEN_PREY
      return GLOAMWOOD_VALLEY_BOSS_BODIES.find((body) => body.id === wanted)
    },
    /**
     * Review hooks. Both endings of this mode are minutes away from the start -
     * the altar holds 600 and the run is twelve waves - so reaching either one
     * by playing is not a way to check it works.
     */
    /**
     * Queues damage rather than applying it.
     *
     * The first version called `damageGloamwoodDefenceAltar` directly and the
     * run went to `lost` while the runtime carried on playing, because the
     * events it produced were never forwarded. A review hook that takes a
     * different path from real damage is not testing real damage - so this one
     * pushes into the same queue the next frame drains.
     */
    defenceDamageAltar: (damage: number) => {
      pendingAltarDamage += Math.max(0, damage)
      return pendingAltarDamage
    },
    defenceSkipToWave: (wave: number) => {
      const clamped = Math.max(1, Math.min(GLOAMWOOD_DEFENCE_RUN.waves, Math.round(wave)))
      run = { ...run, phase: 'spawning', wave: clamped, phaseElapsed: 0, released: 0, bossReleased: false }
      return run.wave
    },
    resetAfterDeath: (state, _diedAt) => ({
      state,
      // Always back in front of the altar. On this map a death is a breach of
      // the line, and respawning anywhere else would put the player behind the
      // thing they are defending.
      playerAt: { ...GLOAMWOOD_DEFENCE.spawn },
    }),
    reachedMilestones: () => [],
    /**
     * Bosses read by id, everything else by family.
     *
     * Tier first, then family - reading family alone on the valley put three
     * region bosses on the road as ordinary beetles, and this map has four.
     */
    bodyFor: (prey) => {
      if (prey.tier !== 'boss') return GLOAMWOOD_MODELLED_PREY[prey.kind]
      const bossId = prey.id.replace('defence-boss-', '') as keyof typeof GLOAMWOOD_DEFENCE_BOSSES
      const wanted = GLOAMWOOD_DEFENCE_BOSSES[bossId]?.bodyId
      if (!wanted) return undefined
      if (wanted === GLOAMWOOD_THORNHEART_WARDEN_PREY.id) return GLOAMWOOD_THORNHEART_WARDEN_PREY
      return GLOAMWOOD_VALLEY_BOSS_BODIES.find((body) => body.id === wanted)
    },
  }
}
