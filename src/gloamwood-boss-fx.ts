import type {
  GloamwoodValleyBossPattern,
  GloamwoodValleyBossShape,
  GloamwoodValleyBossSpec,
} from './gloamwood-valley-boss'
import type { GloamwoodNestPrey } from './gloamwood-3d-ecology'

/**
 * What a boss attack looks like, decided from what it already is.
 *
 * This module draws nothing. It answers one question - given a boss mid-pattern,
 * what should be on screen this frame - and it answers it as numbers, so the
 * part worth being sure about can be tested without a renderer.
 *
 * The rule this file exists to hold: **the shape drawn is the shape tested.**
 * It is handed the pattern's own `shape` object and passes it through
 * untouched. A telegraph that is drawn slightly bigger than it hits teaches the
 * player a lie, and one drawn smaller makes the boss feel like it cheats -
 * both are the same defect, and both are impossible here because there is only
 * one set of numbers.
 *
 * Everything below is presentation and nothing below is consulted by the
 * damage path. Colour, opacity, the pulse, the trauma - a run with all of it
 * turned off takes exactly the same damage as a run with none of it.
 */

export interface GloamwoodBossFxFrame {
  patternId: string
  /** The area the blow will test, unchanged. */
  shape: GloamwoodValleyBossShape
  /** Yaw the lane is drawn along. Ignored by discs and rings. */
  aimRadians: number
  /**
   * How far through the wind-up, 0 to 1.
   *
   * Reaches exactly 1 on the frame the blow lands, which is the whole contract
   * between this and the authority: the fill is a clock, not a decoration.
   */
  windup: number
  /** How far through the blow, 0 to 1. Null while still winding up. */
  impact: number | null
  /** Rim colour. Phase two shifts it and changes no geometry at all. */
  color: number
  /** Bright core colour for the blow itself. */
  flashColor: number
  /** The whole area, filling as the wind-up runs. */
  fillOpacity: number
  /** The outline, which shows the *full* area from the first frame. */
  rimOpacity: number
  /**
   * How hard the rim pulses this frame, 0 to 1.
   *
   * Quickens as the wind-up runs. The player reads a rhythm faster than they
   * read a bar, and this is what makes a 1.35s ring burst legible from the
   * corner of the eye while they are busy running out of it.
   */
  pulse: number
  /** Camera trauma to add this frame. Non-zero only when the blow lands. */
  trauma: number
}

export const GLOAMWOOD_BOSS_FX = {
  /** Wind-up colours. Warm amber reads as "coming" against the valley's green. */
  telegraphColor: 0xffb648,
  /** Phase two. Same shapes, hotter light - the tell is that nothing else changed. */
  enragedColor: 0xff5a3c,
  /** The blow itself, at the moment of contact. */
  flashColor: 0xfff2c4,
  enragedFlashColor: 0xffd0b4,
  /** Pulses per second at the start of a wind-up, and at the end of one. */
  pulseHzStart: 2.4,
  pulseHzEnd: 8.5,
  /** How long the impact wash lingers past the blow, in shares of the blow. */
  impactTailScale: 2.4,
} as const

/**
 * The frame to draw for one boss, or null when there is nothing to draw.
 *
 * Nothing is drawn while a boss is chasing, recovering or dead. A telegraph
 * that lingers through recovery is worse than none: it marks ground that is
 * safe, and the player learns to ignore the marks.
 */
export function gloamwoodBossFxFrame(
  creature: Pick<GloamwoodNestPrey, 'phase' | 'phaseElapsed' | 'x' | 'z'> & {
    bossPattern?: string
    bossPhase?: 1 | 2
    aimX?: number
    aimZ?: number
  },
  spec: GloamwoodValleyBossSpec,
  previousPhase?: GloamwoodNestPrey['phase'],
): GloamwoodBossFxFrame | null {
  if (creature.phase !== 'telegraph' && creature.phase !== 'strike') return null
  const pattern = spec.patterns[creature.bossPattern ?? '']
  if (!pattern) return null
  const enraged = (creature.bossPhase ?? 1) === 2
  const color = enraged ? GLOAMWOOD_BOSS_FX.enragedColor : GLOAMWOOD_BOSS_FX.telegraphColor
  const flashColor = enraged ? GLOAMWOOD_BOSS_FX.enragedFlashColor : GLOAMWOOD_BOSS_FX.flashColor
  const aimRadians = Math.atan2(
    -((creature.aimZ ?? creature.z) - creature.z),
    (creature.aimX ?? creature.x) - creature.x,
  )

  if (creature.phase === 'telegraph') {
    const windup = clamp01(creature.phaseElapsed / Math.max(0.001, pattern.telegraphSeconds))
    return {
      patternId: pattern.id,
      shape: pattern.shape,
      aimRadians,
      windup,
      impact: null,
      color,
      flashColor,
      // The area darkens as the clock runs, so a glance answers "how long".
      fillOpacity: 0.09 + windup * 0.29,
      rimOpacity: 0.5 + windup * 0.42,
      pulse: telegraphPulse(creature.phaseElapsed, windup),
      trauma: 0,
    }
  }

  const impact = clamp01(creature.phaseElapsed / Math.max(0.001, pattern.attackSeconds))
  // The wash outlives the blow. A flash exactly as long as a 0.26s strike is a
  // single frame at 60Hz on a slow machine, and the blow reads as not having
  // happened at all.
  const wash = clamp01(creature.phaseElapsed / Math.max(0.001, pattern.attackSeconds * GLOAMWOOD_BOSS_FX.impactTailScale))
  return {
    patternId: pattern.id,
    shape: pattern.shape,
    aimRadians,
    windup: 1,
    impact,
    color,
    flashColor,
    fillOpacity: 0.62 * (1 - wash) ** 1.6,
    rimOpacity: (1 - wash) ** 2.2,
    pulse: 0,
    // Paid once, on the frame the authority resolved the blow, and only then.
    trauma: previousPhase === 'strike' ? 0 : pattern.trauma,
  }
}

/**
 * The reach a boss's own presentation needs, whatever it is doing.
 *
 * Used for the aura under an enraged boss and to size the shockwave, so the
 * effect never grows past the largest area the fight actually uses.
 */
export function gloamwoodBossFxReach(spec: GloamwoodValleyBossSpec) {
  let reach = spec.bodyRadius
  for (const pattern of Object.values(spec.patterns)) reach = Math.max(reach, gloamwoodBossShapeReach(pattern.shape))
  return reach
}

export function gloamwoodBossShapeReach(shape: GloamwoodValleyBossShape) {
  if (shape.kind === 'disc') return shape.radius
  if (shape.kind === 'ring') return shape.outerRadius
  return shape.length
}

/**
 * How the fill expresses the wind-up for a given shape.
 *
 * A disc and a lane grow, because a shape closing on you is the clearest thing
 * a player can read at the edge of vision. An annulus cannot grow from its
 * centre without covering the safe circle it exists to teach, so it brightens
 * instead - the safe middle stays visibly empty for the whole wind-up.
 */
export function gloamwoodBossFxFillMode(shape: GloamwoodValleyBossShape): 'grow' | 'brighten' {
  return shape.kind === 'ring' ? 'brighten' : 'grow'
}

export function gloamwoodBossFxPatternOf(spec: GloamwoodValleyBossSpec, patternId: string | undefined) {
  return spec.patterns[patternId ?? ''] as GloamwoodValleyBossPattern | undefined
}

function telegraphPulse(elapsed: number, windup: number) {
  const hz = GLOAMWOOD_BOSS_FX.pulseHzStart
    + (GLOAMWOOD_BOSS_FX.pulseHzEnd - GLOAMWOOD_BOSS_FX.pulseHzStart) * windup
  return Math.abs(Math.sin(elapsed * hz * Math.PI))
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}
