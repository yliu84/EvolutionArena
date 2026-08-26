/**
 * What an effect *is*, decided before anything is allocated.
 *
 * Two problems, one module.
 *
 * The first is that ordinary monsters had no attack effect at all. Every
 * creature in the game - a lunging Fang hunter, a plated Shell ram, a Swarm
 * cloud - announced its blow with the same flat red ring on the floor and then
 * nothing. The valley bosses got a whole effects scene of their own; everything
 * else got a circle. Played, three families of enemy attack identically.
 *
 * The second is how the effects that *do* exist are written. Fourteen separate
 * places in the runtime each hand-build a sprite, a material, a blend mode, a
 * gain, a scale pair and a lifetime, then push it into a shared array and cap
 * that array with a while-loop. Nothing about any of them can be looked at
 * without a browser, so "does this effect draw the area it actually hits" has
 * never been a question anyone could answer except by eye.
 *
 * So this file draws nothing. It answers "what should appear, given what the
 * authority already decided", as numbers.
 *
 * The rule it exists to hold, inherited from `gloamwood-boss-fx`: **the area
 * drawn is the area tested.** A strike effect is handed the authority's own
 * reach and passes it through untouched. An effect drawn wider than the blow
 * teaches the player a lie; one drawn narrower makes the creature feel like it
 * cheats. Both are the same defect and both are impossible if there is only one
 * number.
 */

export type GloamwoodVfxMotion = 'ballistic' | 'expand' | 'rise'
export type GloamwoodVfxTexture = 'glow' | 'streak'

/** One particle, fully described. Positions are relative to the effect origin. */
export interface GloamwoodVfxParticle {
  offsetX: number
  offsetY: number
  offsetZ: number
  velocityX: number
  velocityY: number
  velocityZ: number
  /** Linear colour before the light gain is applied. */
  color: number
  /**
   * Which gain this particle takes.
   *
   * Named rather than numeric because the two gains are live tunables the
   * review panel sweeps: baking a number here would freeze whatever the panel
   * happened to be set to when the effect was written.
   */
  gain: 'glow' | 'streak'
  texture: GloamwoodVfxTexture
  startScale: number
  endScale: number
  /** Seconds, before the accessibility duration multiplier. */
  duration: number
  gravity: number
  peakOpacity: number
  motion: GloamwoodVfxMotion
  /** Radians a second. Only meaningful for a streak. */
  spin: number
}

/** A flat ring on the ground, when an effect has an area to say something about. */
export interface GloamwoodVfxRing {
  /** The authority's own reach. Never re-derived here. */
  radius: number
  seconds: number
  color: number
  peakOpacity: number
}

export interface GloamwoodVfxBurst {
  particles: GloamwoodVfxParticle[]
  ring: GloamwoodVfxRing | null
  /** Camera trauma this asks for. Presentation-only, like everything here. */
  trauma: number
}

/**
 * A small deterministic sequence.
 *
 * Effects need variation or a crowd of six creatures strikes in lockstep and
 * reads as one animation played six times. They must not need `Math.random`:
 * an effect that differs between two runs of the same recorded fight cannot be
 * compared frame to frame, which is the only way any of this gets verified.
 */
function scatter(seed: number, index: number) {
  const value = Math.sin((seed + 1) * 12.9898 + index * 78.233) * 43758.5453
  return value - Math.floor(value)
}

export type GloamwoodStrikeFamily = 'fang' | 'shell' | 'swarm'

export interface GloamwoodStrikeFxInput {
  family: GloamwoodStrikeFamily
  /**
   * The reach the blow will actually test, from the authority.
   *
   * Passed in rather than looked up, so this module cannot disagree with the
   * telegraph ring drawn from the same number.
   */
  reach: number
  /** Where the creature is pointing when it commits. */
  facingRadians: number
  /** Stable per creature, so two of the same kind do not strike identically. */
  seed: number
}

/**
 * What a monster's blow looks like.
 *
 * Three families, three silhouettes of effect, because the three families are
 * meant to be three different problems and until now they all looked like one
 * red circle:
 *
 *   fang   - two thin claw streaks thrown forward along the facing, and sparks.
 *            Fast and narrow: the danger is a direction.
 *   shell  - a ground shock at the full reach and dust thrown outward from its
 *            rim. Heavy and wide: the danger is an area you are standing in.
 *   swarm  - a low cloud of spores rising off the body. Dim, dense and slow:
 *            the danger is being surrounded rather than being hit.
 *
 * None of them changes a number. A run with every particle removed takes
 * exactly the damage this one does.
 */
export function gloamwoodMonsterStrikeFx(input: GloamwoodStrikeFxInput): GloamwoodVfxBurst {
  const forwardX = Math.cos(input.facingRadians)
  const forwardZ = -Math.sin(input.facingRadians)
  const reach = Math.max(0.01, input.reach)
  const particles: GloamwoodVfxParticle[] = []

  if (input.family === 'fang') {
    // Two streaks, crossed. Thrown along the facing rather than sprayed, so the
    // effect says which way the blow went - the one thing the ring never could.
    for (let index = 0; index < 2; index += 1) {
      const side = index === 0 ? 1 : -1
      const spread = 0.34 * side
      const angle = input.facingRadians + spread
      particles.push({
        offsetX: forwardX * reach * 0.42,
        offsetY: 0.62 + index * 0.16,
        offsetZ: forwardZ * reach * 0.42,
        velocityX: Math.cos(angle) * reach * 2.1,
        velocityY: -0.5,
        velocityZ: -Math.sin(angle) * reach * 2.1,
        color: 0xff7a4e,
        gain: 'streak',
        texture: 'streak',
        startScale: reach * 0.5,
        endScale: reach * 0.16,
        duration: 0.22,
        gravity: 0,
        peakOpacity: 0.8,
        motion: 'ballistic',
        spin: side * 5.2,
      })
    }
    for (let index = 0; index < 5; index += 1) {
      const jitter = scatter(input.seed, index)
      const angle = input.facingRadians + (jitter - 0.5) * 1.1
      particles.push({
        offsetX: forwardX * reach * 0.5,
        offsetY: 0.55 + jitter * 0.4,
        offsetZ: forwardZ * reach * 0.5,
        velocityX: Math.cos(angle) * (1.6 + jitter * 2.2),
        velocityY: 1.1 + jitter * 1.2,
        velocityZ: -Math.sin(angle) * (1.6 + jitter * 2.2),
        color: 0xffc07a,
        gain: 'glow',
        texture: 'glow',
        startScale: 0.2,
        endScale: 0.05,
        duration: 0.3,
        gravity: 6.4,
        peakOpacity: 0.7,
        motion: 'ballistic',
        spin: 0,
      })
    }
    return {
      particles,
      // No ring: a Fang blow is a direction, and drawing a circle for it is
      // what made every family read the same.
      ring: null,
      trauma: 0.05,
    }
  }

  if (input.family === 'shell') {
    for (let index = 0; index < 9; index += 1) {
      const jitter = scatter(input.seed, index)
      // Dust lifted from the rim of the shock, not from the middle of it: the
      // edge is the part the player has to read, so that is where the motion is.
      const angle = (index / 9) * Math.PI * 2 + jitter * 0.3
      particles.push({
        offsetX: Math.cos(angle) * reach * 0.78,
        offsetY: 0.1,
        offsetZ: Math.sin(angle) * reach * 0.78,
        velocityX: Math.cos(angle) * 1.5,
        velocityY: 1.5 + jitter * 0.9,
        velocityZ: Math.sin(angle) * 1.5,
        color: 0xd9a866,
        gain: 'streak',
        texture: 'glow',
        startScale: 0.34 + jitter * 0.16,
        endScale: 0.9,
        duration: 0.46,
        gravity: 2.1,
        peakOpacity: 0.42,
        motion: 'expand',
        spin: 0,
      })
    }
    return {
      particles,
      // The authority's reach, unchanged. This is the assertion the whole
      // module exists for.
      ring: { radius: reach, seconds: 0.3, color: 0xffab52, peakOpacity: 0.55 },
      trauma: 0.12,
    }
  }

  for (let index = 0; index < 11; index += 1) {
    const jitter = scatter(input.seed, index)
    const angle = jitter * Math.PI * 2
    const radius = reach * (0.2 + scatter(input.seed, index + 40) * 0.6)
    particles.push({
      offsetX: Math.cos(angle) * radius,
      offsetY: 0.2 + jitter * 0.5,
      offsetZ: Math.sin(angle) * radius,
      velocityX: Math.cos(angle) * 0.45,
      velocityY: 0.6 + jitter * 0.5,
      velocityZ: Math.sin(angle) * 0.45,
      color: 0x8fd455,
      gain: 'streak',
      texture: 'glow',
      startScale: 0.16 + jitter * 0.12,
      endScale: 0.4,
      // The longest of the three, and the dimmest. A swarm blow is a condition
      // you are standing in rather than an event that happened to you.
      duration: 0.72,
      gravity: -0.5,
      peakOpacity: 0.34,
      motion: 'rise',
      spin: 0,
    })
  }
  return {
    particles,
    ring: { radius: reach, seconds: 0.42, color: 0x7fc93f, peakOpacity: 0.34 },
    trauma: 0.03,
  }
}

/** Total particles a burst asks for, for budgeting against the shared pool. */
export function gloamwoodVfxCost(burst: GloamwoodVfxBurst) {
  return burst.particles.length + (burst.ring ? 1 : 0)
}
