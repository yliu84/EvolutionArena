import type { GloamwoodPreyKind, GloamwoodPreyPhase } from './gloamwood-3d-ecology'

/**
 * Which authored clip a modelled prey creature should be playing.
 *
 * Prey in the 3D body have always been code-built primitives, so this is the
 * first time a prey phase has had to select a clip. Kept pure and apart from
 * the runtime for the same reason the boss selector is: a creature that keeps
 * playing its wind-up through the blow, or restarts its clip every frame, looks
 * broken in a way no test of the loader would catch.
 *
 * The difference from the boss is the stun. A boss is never interrupted; prey
 * are, constantly, and an interrupted wind-up that carries on animating is the
 * exact defect the guardian shipped with - it looked like it was still
 * attacking while the authority had already reset it.
 */
export interface GloamwoodModelledPreyConfig {
  id: string
  url: string
  /**
   * Half the model's longest horizontal extent, in world units.
   *
   * The authored size, not a wish. It must equal the collision radius of the
   * family the creature is typed as, or blocking does not match the visible
   * footprint - the Goal 2 lesson, and cheaper to hold here than to find in a
   * fight. `process_*_meshy.py` scales each model to exactly this.
   */
  footprintRadius: number
  /**
   * Yaw correcting the model's authored facing onto the game's forward.
   *
   * The runtime rotates a creature by `facingRadians`, where zero means +X,
   * while a Blender model exported Y-up faces +Z. Without this the creature
   * bites ninety degrees away from whatever it is attacking, which is how the
   * first modelled boss shipped.
   */
  modelYaw: number
  clips: {
    idle: string
    walk: string
    /** Wind-up through recovery, in one take. */
    attack: string
    hit: string
    death: string
  }
}

export const GLOAMWOOD_FORD_FANG_PREY: GloamwoodModelledPreyConfig = {
  id: 'ford-fang',
  url: '/assets/quality-3d/models/ford-fang-runtime-v1.glb?v=valley-prey-fang-v1',
  // 1.02 was the Fang family's radius, and at that size a river crocodilian
  // beside a 2.55-tall player read as a lizard on the path. These are modelled
  // animals rather than code-built shapes: they carry their own size, and reach
  // follows it because stop distance and strike distance are both derived from
  // the body radius.
  footprintRadius: 1.55,
  // Authored nose along +Z after a Y-up export.
  modelYaw: Math.PI / 2,
  clips: { idle: 'Idle', walk: 'Walk', attack: 'Bite', hit: 'Hit', death: 'Death' },
}

export const GLOAMWOOD_TERRACE_GRAZER_PREY: GloamwoodModelledPreyConfig = {
  id: 'terrace-grazer',
  url: '/assets/quality-3d/models/terrace-grazer-runtime-v1.glb?v=valley-grazer-v1',
  // Chest height on the player rather than knee height.
  footprintRadius: 1.5,
  modelYaw: Math.PI / 2,
  clips: { idle: 'Idle', walk: 'Walk', attack: 'Butt', hit: 'Hit', death: 'Death' },
}

export const GLOAMWOOD_PEBBLE_DUMPLING_PREY: GloamwoodModelledPreyConfig = {
  id: 'pebble-dumpling',
  url: '/assets/quality-3d/models/pebble-dumpling-runtime-v1.glb?v=valley-pebble-v1',
  footprintRadius: 1.42,
  modelYaw: Math.PI / 2,
  clips: { idle: 'Idle', walk: 'Walk', attack: 'Shove', hit: 'Hit', death: 'Death' },
}

export const GLOAMWOOD_SPOTTED_FORDBUG_PREY: GloamwoodModelledPreyConfig = {
  id: 'spotted-fordbug',
  url: '/assets/quality-3d/models/spotted-fordbug-runtime-v1.glb?v=valley-prey-bug-v1',
  footprintRadius: 1.42,
  modelYaw: Math.PI / 2,
  clips: { idle: 'Idle', walk: 'Walk', attack: 'Bump', hit: 'Hit', death: 'Death' },
}

/**
 * Which body each family wears when modelled prey are switched on.
 *
 * Reversible data, deliberately. Typing the beetle as Carapace is what its size
 * already says - it is sized to that family's collision radius because that is
 * physically what a slow dome is - and it carries the family's frontal damage
 * reduction with it, which for a grazer the player is meant to walk around is
 * the right answer rather than an accident. The Swarm family has no model yet
 * and keeps its primitives.
 */
export const GLOAMWOOD_MODELLED_PREY: Partial<Record<GloamwoodPreyKind, GloamwoodModelledPreyConfig>> = {
  fang: GLOAMWOOD_FORD_FANG_PREY,
  shell: GLOAMWOOD_SPOTTED_FORDBUG_PREY,
}

/**
 * Which body a passive creature wears, by the ground it stands on.
 *
 * Role picks the body before family does, and terrain picks it after. A hunter
 * and a grazer of the same family are not the same animal, and a grazer on
 * scree is not the one on grass - which is the same principle that made three
 * regions out of one kit: spread it unevenly.
 *
 * Keyed by the branch a creature was placed in, because that is what the spawn
 * plan already knows. Anything on the main road takes the default.
 */
export const GLOAMWOOD_MODELLED_GRAZERS: Partial<Record<GloamwoodPreyKind, GloamwoodModelledPreyConfig>> = {
  fang: GLOAMWOOD_TERRACE_GRAZER_PREY,
  shell: GLOAMWOOD_SPOTTED_FORDBUG_PREY,
}

const SCREE_BRANCHES = new Set(['scree-shelf', 'stone-bowl', 'high-terrace'])

export function gloamwoodModelledPreyFor(
  kind: GloamwoodPreyKind,
  role: 'passive' | 'aggressive',
  branch: string | null = null,
): GloamwoodModelledPreyConfig | undefined {
  if (role === 'aggressive') return GLOAMWOOD_MODELLED_PREY[kind]
  // The pebble belongs on rock, where it reads as one of the boulders the scree
  // branches are dressed with until it moves. That is the whole of its value and
  // it is worth nothing anywhere else.
  if (branch && SCREE_BRANCHES.has(branch)) return GLOAMWOOD_PEBBLE_DUMPLING_PREY
  return GLOAMWOOD_MODELLED_GRAZERS[kind] ?? GLOAMWOOD_MODELLED_PREY[kind]
}

export const GLOAMWOOD_MODELLED_PREY_CONFIGS: readonly GloamwoodModelledPreyConfig[] = [
  GLOAMWOOD_FORD_FANG_PREY,
  GLOAMWOOD_SPOTTED_FORDBUG_PREY,
  GLOAMWOOD_TERRACE_GRAZER_PREY,
  GLOAMWOOD_PEBBLE_DUMPLING_PREY,
]

export interface GloamwoodPreyClipSelection {
  clip: string
  /** Restart from zero rather than leaving the clip where it was. */
  restart: boolean
  /** Play once and hold the last pose rather than looping. */
  once: boolean
}

export function gloamwoodPreyClipForPhase(
  phase: GloamwoodPreyPhase,
  config: GloamwoodModelledPreyConfig,
  previousPhase: GloamwoodPreyPhase | undefined,
  moving: boolean,
): GloamwoodPreyClipSelection {
  const { clips } = config
  if (phase === 'dead') {
    return { clip: clips.death, restart: previousPhase !== 'dead', once: true }
  }
  if (phase === 'stunned') {
    // Restarted every time it is entered. A creature hit twice has to flinch
    // twice, or the second blow reads as having missed.
    return { clip: clips.hit, restart: previousPhase !== 'stunned', once: true }
  }
  if (phase === 'telegraph' || phase === 'strike') {
    // One take spans wind-up and blow, so the strike must not restart it - but
    // arriving from a stun must, because the authority has thrown the previous
    // attempt away and the clip would otherwise resume mid-swing with no tell.
    const continuing = previousPhase === 'telegraph' || previousPhase === 'strike'
    return { clip: clips.attack, restart: !continuing, once: true }
  }
  if (phase === 'chase' && moving) {
    return { clip: clips.walk, restart: previousPhase !== 'chase', once: false }
  }
  return { clip: clips.idle, restart: false, once: false }
}

/**
 * How fast to play the attack clip so its contact lands on the real one.
 *
 * The clip is authored at whatever length reads well; the authority decides
 * when the blow happens. Stretching the clip over the authored telegraph plus
 * strike keeps them in step without the authority ever consulting the
 * animation - which is what keeps presentation out of the damage path.
 */
/**
 * How fast to play a walk cycle so the feet keep up with the ground.
 *
 * A walk clip played at a fixed rate slides: the creature is carried by its
 * movement speed and its legs swing at whatever rate they were authored for,
 * and the two have nothing to do with each other. What stops it is deriving the
 * rate from the distance actually covered.
 *
 * The stride a cycle covers is taken from the body rather than tuned per model.
 * A quadruped's walk cycle carries it a little over its own body length, and
 * the body length is already known - it is twice the footprint radius, which
 * every config carries because collision needs it. So one formula fits every
 * body, and a new creature needs no walk-speed number guessed for it.
 *
 * Clamped at both ends: below the floor a creature that has almost stopped
 * would freeze mid-stride, and above the ceiling one knocked back at speed
 * would blur its legs.
 */
export const GLOAMWOOD_WALK_STRIDE_FACTOR = 1.2

export function gloamwoodPreyWalkRate(
  clipSeconds: number,
  footprintRadius: number,
  metresPerSecond: number,
) {
  const strideDistance = GLOAMWOOD_WALK_STRIDE_FACTOR * 2 * Math.max(0.01, footprintRadius)
  const authoredSpeed = strideDistance / Math.max(0.001, clipSeconds)
  return Math.max(0.35, Math.min(4, Math.max(0, metresPerSecond) / authoredSpeed))
}

export function gloamwoodPreyClipRate(
  clipSeconds: number,
  telegraphSeconds: number,
  strikeSeconds: number,
) {
  const target = Math.max(0.001, telegraphSeconds + strikeSeconds)
  return Math.max(0.1, Math.min(4, clipSeconds / target))
}
