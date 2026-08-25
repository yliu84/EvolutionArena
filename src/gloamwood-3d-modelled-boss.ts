import type { GloamwoodBossState } from './gloamwood-3d-boss'

/**
 * Which authored clip a modelled boss should be playing.
 *
 * The two bosses in the game today are not models: the Thorn Sentinel is around
 * thirty primitives animated by writing positions every frame, and the nest
 * guardian is the Carapace prey scaled up. Neither can play a clip, so this is
 * the first time boss state has had to select one.
 *
 * Kept pure and separate from the runtime because it is the part worth testing:
 * a boss that silently keeps playing its wind-up through the blow, or restarts
 * a clip every frame, looks broken in a way no unit test of the loader would
 * catch.
 */
export interface GloamwoodModelledBossConfig {
  url: string
  /** World height the model is normalised to, as the player forms are. */
  worldHeight: number
  /**
   * Yaw correcting the model's authored facing onto the game's forward.
   *
   * The same correction the player forms carry, and it has to be applied here
   * too: the runtime rotates a boss by `facingRadians`, where zero means +X,
   * while a Blender model exported Y-up faces +Z. Without it the creature aims
   * its blades ninety degrees away from whatever it is attacking, which is
   * exactly how this shipped the first time.
   */
  modelYaw: number
  clips: {
    idle: string
    walk: string
    hit: string
    death: string
    /** Boss pattern id to the clip that performs it, wind-up through recovery. */
    patterns: Record<string, string>
  }
}

/**
 * The Bladeshell, authored for the valley's first chokepoint.
 *
 * Its two patterns map onto Gloamwood's by shape rather than by theme, which is
 * what makes it previewable here at all: a ring is a sweep and a line is a
 * charge, whatever the creature is called.
 */
export const GLOAMWOOD_BLADESHELL_BOSS: GloamwoodModelledBossConfig = {
  url: '/assets/quality-3d/models/bladeshell-runtime-v1.glb?v=valley-boss1-v1',
  worldHeight: 2.6,
  // Authored facing is -Y in Blender, which a Y-up export turns into +Z.
  modelYaw: Math.PI / 2,
  clips: {
    idle: 'Idle',
    walk: 'Walk',
    hit: 'Hit',
    death: 'Death',
    patterns: {
      'root-slam': 'BladeSweep',
      'spore-ring': 'BladeSweep',
      'thorn-charge': 'RiverCharge',
    },
  },
}

/** The valley's second gate. Two patterns, told apart by their wind-ups. */
export const GLOAMWOOD_CLIFF_MAW_BOSS: GloamwoodModelledBossConfig = {
  url: '/assets/quality-3d/models/cliff-maw-runtime-v1.glb?v=valley-boss2-v1',
  worldHeight: 3.83,
  modelYaw: Math.PI / 2,
  clips: {
    idle: 'Idle',
    walk: 'Walk',
    hit: 'Hit',
    death: 'Death',
    patterns: {
      'root-slam': 'Slam',
      'spore-ring': 'Sweep',
      'thorn-charge': 'Sweep',
    },
  },
}

/** The end of the run. Three patterns, one of them phase-two only. */
export const GLOAMWOOD_SOURCE_ROOT_BOSS: GloamwoodModelledBossConfig = {
  url: '/assets/quality-3d/models/source-root-runtime-v1.glb?v=valley-boss3-v1',
  worldHeight: 2.4,
  modelYaw: Math.PI / 2,
  clips: {
    idle: 'Idle',
    walk: 'Walk',
    hit: 'Hit',
    death: 'Death',
    patterns: {
      'root-slam': 'Slam',
      'thorn-charge': 'Lunge',
      'spore-ring': 'RingBurst',
    },
  },
}

/**
 * The Gloamwood's own boss, and the first one that is a model rather than a
 * heap of primitives.
 *
 * The three patterns each get their own clip, which is the point of this body
 * existing. The primitive assembly it replaces animated all three with one
 * line - `body.position.x = strike * 0.65` - so Root Slam, Thorn Charge and
 * Spore Ring were told apart only by the decal on the ground. Measured at the
 * head, away from rest and as a fraction of the head-above-forefoot distance:
 *
 *   Slam       -35% -> +76% -> -79%   rear onto the haunches, then crash down
 *   Charge     -58% -> -85% (held) -> +32%   coil low, hold the tell, extend
 *   RingBurst  -61% -> -87% -> +103%  deepest tuck, highest flare, limbs splayed
 *
 * Slam and RingBurst are opposite at the instant of contact - one drives the
 * head below rest, the other throws it to the top of its range - and Charge is
 * the only one that stays low across the whole wind-up.
 *
 * `worldHeight` 3.2 against the largest player form's 2.55. The mesh measures
 * l/h 1.41 and w/h 1.08, so that lands it at about 3.45 wide by 4.50 long: 28%
 * wider, 25% taller and 11% shorter than the Shell stage-2 body. Shorter and
 * bulkier is what separates it from a scaled-up player form.
 */
export const GLOAMWOOD_THORNHEART_WARDEN_BOSS: GloamwoodModelledBossConfig = {
  url: '/assets/quality-3d/models/thornheart-warden-runtime-v1.glb?v=gloamwood-boss-v1',
  worldHeight: 3.2,
  modelYaw: Math.PI / 2,
  clips: {
    idle: 'Idle',
    walk: 'Walk',
    // Declared, but nothing selects it: `gloamwoodBossClipForState` has no hit
    // branch for the Gloamwood boss. The clip ships so wiring one later is a
    // runtime change rather than a re-export.
    hit: 'Hit',
    death: 'Death',
    patterns: {
      'root-slam': 'Slam',
      'thorn-charge': 'Charge',
      'spore-ring': 'RingBurst',
    },
  },
}

export const GLOAMWOOD_MODELLED_BOSSES: readonly GloamwoodModelledBossConfig[] = [
  GLOAMWOOD_BLADESHELL_BOSS,
  GLOAMWOOD_CLIFF_MAW_BOSS,
  GLOAMWOOD_SOURCE_ROOT_BOSS,
  GLOAMWOOD_THORNHEART_WARDEN_BOSS,
]

export interface GloamwoodBossClipSelection {
  clip: string
  /**
   * True when the clip must be restarted from zero rather than left running.
   *
   * A pattern clip carries its own wind-up, so it has to start exactly when the
   * telegraph does. Leaving it to loop from wherever it happened to be would
   * put the swing before the tell.
   */
  restart: boolean
  /** Play it once and hold the final pose rather than looping. */
  once: boolean
}

export function gloamwoodBossClipForState(
  state: Pick<GloamwoodBossState, 'state' | 'pattern'>,
  config: GloamwoodModelledBossConfig,
  previous?: Pick<GloamwoodBossState, 'state' | 'pattern'>,
): GloamwoodBossClipSelection {
  const { clips } = config
  if (state.state === 'dead') {
    return { clip: clips.death, restart: previous?.state !== 'dead', once: true }
  }
  if (state.state === 'telegraph' || state.state === 'attack') {
    const clip = clips.patterns[state.pattern] ?? clips.idle
    // Restart only on entering the wind-up, so the strike continues the same
    // take rather than snapping back to the start halfway through.
    const entering = previous?.state !== 'telegraph' && previous?.state !== 'attack'
    return { clip, restart: entering || previous?.pattern !== state.pattern, once: true }
  }
  if (state.state === 'chase') {
    return { clip: clips.walk, restart: previous?.state !== 'chase', once: false }
  }
  return { clip: clips.idle, restart: false, once: false }
}

/**
 * How fast to play a pattern clip so it lands its contact on the real one.
 *
 * The clip is authored at whatever length reads well; the authority decides
 * when the blow happens. Stretching the clip to the authored telegraph plus
 * attack keeps the two in step without the authority ever consulting the
 * animation.
 */
export function gloamwoodBossClipRate(clipSeconds: number, telegraphSeconds: number, attackSeconds: number) {
  const target = Math.max(0.001, telegraphSeconds + attackSeconds)
  return Math.max(0.1, Math.min(4, clipSeconds / target))
}
