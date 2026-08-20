import {
  GLOAMWOOD_PREY,
  type GloamwoodNestEvent,
  type GloamwoodNestPrey,
  type GloamwoodPlayerPresence,
} from './gloamwood-3d-ecology'
import {
  GLOAMWOOD_CLIFF_MAW_BODY,
  GLOAMWOOD_SOURCE_ROOT_BODY,
  GLOAMWOOD_TIDE_CLEAVER_BODY,
  gloamwoodValleyBodyFor,
  type GloamwoodModelledPreyConfig,
} from './gloamwood-modelled-prey'

/**
 * The valley's three bosses, as bosses.
 *
 * Until now they fought as heavy prey: one attack clip, one action ring, the
 * same telegraph a beetle uses. The bodies were right and the fight was not -
 * a creature four metres across that throws a beetle's bite is a boss only in
 * the health bar.
 *
 * A boss is its patterns. Each one here has two or three, they are told apart
 * by shape rather than by damage, and every shape has a *different answer*:
 *
 *   disc - a circle centred on the boss.      Answer: get out.
 *   line - a lane along where you stood.      Answer: step aside.
 *   ring - an annulus with a safe centre.     Answer: get in, or run far.
 *
 * The ring is the one worth having. Every other threat in this game is escaped
 * by moving away from it, and a player who has learned only that will stand in
 * a ring burst every time until they read the shape rather than the distance.
 *
 * Kept pure and apart from the runtime for the same reason the clip selector
 * is. What decides a hit is here, in world units, tested; what draws it lives
 * in `gloamwood-boss-fx` and reads these same numbers, so a telegraph can never
 * promise an area the blow does not test.
 */

/**
 * How far the runtime holds the player off a body, for the widest form.
 *
 * The collision pass pushes the player out to `playerCombatBodyRadius +
 * bodyRadius + 0.22`, and the widest player form measures 1.56. So the closest
 * the player can *ever* stand to a boss of radius R is R + 1.78.
 *
 * This is load-bearing, and getting it wrong has already cost this project a
 * whole encounter: the Gloamwood boss shipped with two of its three phase-one
 * patterns at a radius under the collision floor, which made them guaranteed
 * misses for the life of the fight. Every reach below is measured from here
 * rather than picked, and a test asserts each one clears it.
 */
export const GLOAMWOOD_VALLEY_BOSS_PLAYER_FLOOR = 1.78

/**
 * Long enough that no hit ever interrupts a boss.
 *
 * Prey are interruptible and that is most of what makes them prey. Refreshed
 * every frame rather than granted once, so the damage gate's decay can never
 * open a window in the middle of a wind-up - a boss whose pattern can be
 * cancelled has no patterns.
 */
export const GLOAMWOOD_VALLEY_BOSS_STUN_IMMUNITY = 9

/**
 * The shortest reach in the player's chain, measured to the hurt surface.
 *
 * Bite is 2.55, Pounce 2.95, TailSwipe 3.1, and contact is tested surface to
 * surface - so against a boss of radius R the player must stand at R + 2.55 to
 * land anything at all.
 *
 * This is the number every pattern has to be measured against, and leaving it
 * out is what made the first boss unwinnable. Reaches were derived from the
 * boss's own body alone, so the Tide Cleaver's 3.5 radius produced a disc of
 * 8.68 while the player could only reach 6.05: every position they could attack
 * from was 2.6 units inside the blow, and its preferred standing distance of
 * 7.38 was outside their reach entirely. Simulated against the real authority
 * it lost from full health in every configuration - trading, dodging, and after
 * two evolutions - never taking the boss below 45%.
 *
 * The Gloamwood boss, which was tuned by playing it, has exactly the
 * relationship this restores: its slam covers 4.3 and the player reaches 4.27.
 * Standing where you can hit it is standing where it can hit you, and the fight
 * is one short step out and one back.
 */
export const GLOAMWOOD_VALLEY_BOSS_PLAYER_REACH = 2.55

export type GloamwoodValleyBossShape =
  | { kind: 'disc'; radius: number }
  | { kind: 'line'; length: number; halfWidth: number }
  | { kind: 'ring'; innerRadius: number; outerRadius: number }

export interface GloamwoodValleyBossPattern {
  id: string
  /** The authored clip that performs it, wind-up through recovery. */
  clip: string
  shape: GloamwoodValleyBossShape
  telegraphSeconds: number
  attackSeconds: number
  damage: number
  knockback: number
  /**
   * Camera trauma the landed blow is worth.
   *
   * Presentation, and only presentation. It is carried on the pattern so the
   * weight the player feels matches the pattern they read - it never reaches
   * the damage path, and the shake toggle still turns it off.
   */
  trauma: number
  /** Phase two only. The fight has to gain something, not just speed up. */
  phaseTwoOnly?: boolean
}

export interface GloamwoodValleyBossSpec {
  bodyId: string
  displayName: string
  maxHealth: number
  moveSpeed: number
  turnSpeed: number
  bodyRadius: number
  /** Where it chooses to stand: inside every pattern's reach, outside the floor. */
  preferredRange: number
  /** Closest it will willingly stand, so a ring's safe centre stays reachable. */
  minimumRange: number
  recoverSeconds: { 1: number; 2: number }
  patterns: Record<string, GloamwoodValleyBossPattern>
  rotation: { 1: readonly string[]; 2: readonly string[] }
}

/**
 * Reaches measured out from the collision floor rather than chosen.
 *
 * `preferred` is where the boss stands, and every number below is placed
 * relative to it so each pattern has an answer that is neither free nor
 * impossible: the disc reaches past where the player is standing, the ring
 * opens just inside it, and the lane is longer than either.
 */
function bossReaches(bodyRadius: number) {
  const floor = bodyRadius + GLOAMWOOD_VALLEY_BOSS_PLAYER_FLOOR
  // Where the player has to stand to land the shortest step of their chain.
  // Every reach below is placed against this rather than against the boss's
  // body, so a bigger boss gets a bigger *body* and not a longer arm.
  const strikeFrom = bodyRadius + GLOAMWOOD_VALLEY_BOSS_PLAYER_REACH
  return {
    floor,
    strikeFrom,
    // Just clear of the floor, so the boss never wedges itself against the
    // player and stops being able to reach the spacing it waits for.
    minimumRange: floor + 0.2,
    // Inside the player's reach. It used to stand at floor + 2.1, which for a
    // 3.5-radius body is 7.38 against a reach of 6.05 - the boss parked itself
    // where nothing could touch it and waited there between patterns.
    preferredRange: Math.max(floor + 0.2, strikeFrom - 0.05),
    // Just past where the player must stand to attack, so standing still is
    // never the answer and stepping out is a step rather than a commute.
    disc: strikeFrom + 0.6,
    lineLength: floor + 7.5,
    lineHalfWidth: 0.85 + bodyRadius * 0.22,
    // Opens just off the boss's own body, so the safe centre is *contact*.
    //
    // There is very little room to work in: the collision floor is at
    // bodyRadius + 1.78 and the player's shortest reach lands at bodyRadius +
    // 2.55, so the entire band they can stand and fight in is 0.77 wide. A ring
    // whose safe centre is "closer than you were" has to fit inside that.
    //
    // Putting the inner edge half a unit off the floor makes the answer "walk
    // into it", and collision then finishes the job - the player cannot
    // overshoot, because the floor is what stops them. Running past the outer
    // edge stays the expensive alternative.
    ringInner: floor + 0.5,
    ringOuter: strikeFrom + 5.2,
  }
}

function tideCleaver(): GloamwoodValleyBossSpec {
  const body = GLOAMWOOD_TIDE_CLEAVER_BODY
  const reach = bossReaches(body.footprintRadius)
  return {
    bodyId: body.id,
    displayName: '潮汐裂钳',
    // The first boss of the run, met with a stage-one body and few mutations.
    maxHealth: 340,
    moveSpeed: 2.35,
    turnSpeed: 3.1,
    bodyRadius: body.footprintRadius,
    preferredRange: reach.preferredRange,
    minimumRange: reach.minimumRange,
    recoverSeconds: { 1: 1.15, 2: 0.72 },
    patterns: {
      'blade-sweep': {
        id: 'blade-sweep', clip: 'BladeSweep',
        shape: { kind: 'disc', radius: reach.disc },
        telegraphSeconds: 1.0, attackSeconds: 0.26, damage: 14, knockback: 1.35, trauma: 0.5,
      },
      'river-charge': {
        id: 'river-charge', clip: 'RiverCharge',
        shape: { kind: 'line', length: reach.lineLength, halfWidth: reach.lineHalfWidth },
        telegraphSeconds: 0.88, attackSeconds: 0.55, damage: 17, knockback: 1.7, trauma: 0.62,
      },
    },
    // Two shapes, alternating, with the wide one first: the fight opens by
    // teaching that distance is an answer before it asks for a sidestep.
    rotation: { 1: ['blade-sweep', 'river-charge', 'blade-sweep'], 2: ['river-charge', 'blade-sweep', 'river-charge', 'blade-sweep'] },
  }
}

function cliffMaw(): GloamwoodValleyBossSpec {
  const body = GLOAMWOOD_CLIFF_MAW_BODY
  const reach = bossReaches(body.footprintRadius)
  return {
    bodyId: body.id,
    displayName: '崖口巨颚',
    maxHealth: 520,
    moveSpeed: 1.75,
    turnSpeed: 2.4,
    bodyRadius: body.footprintRadius,
    preferredRange: reach.preferredRange,
    minimumRange: reach.minimumRange,
    recoverSeconds: { 1: 1.05, 2: 0.62 },
    patterns: {
      'stone-slam': {
        id: 'stone-slam', clip: 'Slam',
        shape: { kind: 'disc', radius: reach.disc },
        telegraphSeconds: 0.95, attackSeconds: 0.28, damage: 18, knockback: 1.6, trauma: 0.66,
      },
      // The valley's teaching ring. It is the second boss on purpose: the
      // player has spent the first one learning to back off, and this is where
      // that answer stops working.
      'cliff-sweep': {
        id: 'cliff-sweep', clip: 'Sweep',
        shape: { kind: 'ring', innerRadius: reach.ringInner, outerRadius: reach.ringOuter },
        telegraphSeconds: 1.35, attackSeconds: 0.34, damage: 16, knockback: 1.1, trauma: 0.58,
      },
    },
    rotation: { 1: ['stone-slam', 'stone-slam', 'cliff-sweep'], 2: ['cliff-sweep', 'stone-slam', 'cliff-sweep', 'stone-slam'] },
  }
}

function sourceRoot(): GloamwoodValleyBossSpec {
  const body = GLOAMWOOD_SOURCE_ROOT_BODY
  const reach = bossReaches(body.footprintRadius)
  return {
    bodyId: body.id,
    displayName: '源根',
    // The end of the run, met with a fully grown body and a full mutation deck.
    maxHealth: 760,
    moveSpeed: 1.95,
    turnSpeed: 2.2,
    bodyRadius: body.footprintRadius,
    preferredRange: reach.preferredRange,
    minimumRange: reach.minimumRange,
    recoverSeconds: { 1: 0.95, 2: 0.55 },
    patterns: {
      'root-slam': {
        id: 'root-slam', clip: 'Slam',
        shape: { kind: 'disc', radius: reach.disc },
        telegraphSeconds: 0.9, attackSeconds: 0.26, damage: 20, knockback: 1.5, trauma: 0.7,
      },
      'root-lunge': {
        id: 'root-lunge', clip: 'Lunge',
        shape: { kind: 'line', length: reach.lineLength, halfWidth: reach.lineHalfWidth },
        telegraphSeconds: 0.82, attackSeconds: 0.52, damage: 22, knockback: 1.85, trauma: 0.78,
      },
      // Held back for phase two, so the last fight of the run still has
      // something the player has not seen it do.
      'ring-burst': {
        id: 'ring-burst', clip: 'RingBurst',
        shape: { kind: 'ring', innerRadius: reach.ringInner, outerRadius: reach.ringOuter },
        telegraphSeconds: 1.3, attackSeconds: 0.36, damage: 24, knockback: 1.2, trauma: 0.9,
        phaseTwoOnly: true,
      },
    },
    rotation: { 1: ['root-slam', 'root-lunge', 'root-slam'], 2: ['ring-burst', 'root-lunge', 'root-slam', 'ring-burst'] },
  }
}

/** In route order: the two gate bosses, then the end of the run. */
export const GLOAMWOOD_VALLEY_BOSS_SPECS: readonly GloamwoodValleyBossSpec[] = [
  tideCleaver(),
  cliffMaw(),
  sourceRoot(),
]

/**
 * Which boss a creature is, decided by the body it already wears.
 *
 * Keyed off the body registry rather than off route distance a second time.
 * The valley has already been shipped once with two mappings from position to
 * boss, and they disagreed.
 */
export function gloamwoodValleyBossSpecFor(
  creature: {
    tier?: string
    kind: GloamwoodNestPrey['kind']
    role?: string
    branch?: string | null
    /** A placed creature carries `spawnS`; the spawn it was built from carries `s`. */
    spawnS?: number
    s?: number
  },
): GloamwoodValleyBossSpec | undefined {
  if (creature.tier !== 'boss') return undefined
  // Both names, because this is asked the same question from both sides of the
  // spawn plan and reading only one of them is not an error anything reports:
  // the body registry answers an unknown position with its *last* boss, so
  // every boss in the valley was built with the Source Root's health and
  // nothing failed. Found in engine, not by a test.
  const s = creature.spawnS ?? creature.s
  if (s === undefined) return undefined
  const body = gloamwoodValleyBodyFor({
    kind: creature.kind,
    role: (creature.role as 'passive' | 'aggressive') ?? 'aggressive',
    branch: creature.branch ?? null,
    tier: 'boss',
    s,
  })
  return GLOAMWOOD_VALLEY_BOSS_SPECS.find((spec) => spec.bodyId === body?.id)
}

/** The pattern state a boss carries on top of its creature state. */
export interface GloamwoodValleyBossFields {
  bossPattern?: string
  bossTurn?: number
  bossPhase?: 1 | 2
  /** Where the player stood when the wind-up began. A line commits to it. */
  aimX?: number
  aimZ?: number
}

type BossCreature = GloamwoodNestPrey & GloamwoodValleyBossFields

/**
 * Does this blow land?
 *
 * The one place a boss pattern's area is decided. `gloamwood-boss-fx` draws
 * from the same shape object, so the ring on the ground is the area tested -
 * not a picture of it.
 */
export function gloamwoodValleyBossHits(
  shape: GloamwoodValleyBossShape,
  origin: { x: number; z: number },
  aim: { x: number; z: number },
  player: { x: number; z: number },
) {
  const distance = Math.hypot(player.x - origin.x, player.z - origin.z)
  if (shape.kind === 'disc') return distance <= shape.radius
  if (shape.kind === 'ring') return distance >= shape.innerRadius && distance <= shape.outerRadius
  const dx = aim.x - origin.x
  const dz = aim.z - origin.z
  const length = Math.hypot(dx, dz)
  // A lane needs a direction, and the aim point can be exactly where the boss
  // stands - the player walked into it, or a previous lunge ended there. Fall
  // back to +X rather than dividing by zero and testing NaN, which reads as a
  // miss and silently deletes the attack.
  const directionX = length > 0.001 ? dx / length : 1
  const directionZ = length > 0.001 ? dz / length : 0
  const relativeX = player.x - origin.x
  const relativeZ = player.z - origin.z
  const forward = relativeX * directionX + relativeZ * directionZ
  const lateral = Math.abs(relativeX * -directionZ + relativeZ * directionX)
  return forward >= -shape.halfWidth && forward <= shape.length && lateral <= shape.halfWidth
}

/** The patterns available to a boss in the phase it is in. */
export function gloamwoodValleyBossRotation(spec: GloamwoodValleyBossSpec, phase: 1 | 2) {
  return spec.rotation[phase].filter((id) => {
    const pattern = spec.patterns[id]
    return pattern !== undefined && (phase === 2 || !pattern.phaseTwoOnly)
  })
}

/**
 * One boss, one frame.
 *
 * Replaces `stepPrey` for creatures of the boss tier and nothing else. It
 * writes the same phase names the prey pipeline uses - chase, telegraph,
 * strike, recover, dead - so the lock, the corpse clock, the aggro layer and
 * the clip selector all keep working on it unchanged, and it emits the same
 * `prey-attack` event, so the blow reaches the player through the one damage
 * path rather than a second one written for bosses.
 */
export function stepGloamwoodValleyBoss(
  creature: BossCreature,
  spec: GloamwoodValleyBossSpec,
  deltaSeconds: number,
  player: GloamwoodPlayerPresence,
): { state: BossCreature; events: GloamwoodNestEvent[] } {
  if (creature.phase === 'dead') return { state: creature, events: [] }
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  const events: GloamwoodNestEvent[] = []
  let next: BossCreature = {
    ...creature,
    phaseElapsed: creature.phaseElapsed + delta,
    bossPhase: creature.bossPhase ?? 1,
    bossTurn: creature.bossTurn ?? 0,
    stunImmuneSeconds: GLOAMWOOD_VALLEY_BOSS_STUN_IMMUNITY,
  }
  // The gate can still have written 'stunned' on the frame the immunity was
  // first granted. Leave it immediately rather than playing a flinch a boss is
  // not supposed to have.
  if (next.phase === 'stunned') next = { ...next, phase: 'chase', phaseElapsed: 0, attackResolved: false }

  const expected: 1 | 2 = next.health <= next.maxHealth * 0.5 ? 2 : 1
  if (expected !== next.bossPhase) {
    events.push({ type: 'boss-enraged', preyId: next.id, phase: 2 })
    // Straight into recovery, so the turn is a beat the player can see rather
    // than a free hit landing out of the transition.
    return {
      state: { ...next, bossPhase: 2, phase: 'recover', phaseElapsed: 0, attackResolved: false },
      events,
    }
  }

  if (!player.alive) return { state: { ...next, phase: 'chase', phaseElapsed: 0 }, events }

  const dx = player.x - next.x
  const dz = player.z - next.z
  const distance = Math.hypot(dx, dz)
  // A boss keeps the facing it committed to, exactly as the shell family does:
  // the wind-up is the window the player reads, and a boss that keeps turning
  // through it has no window at all.
  if (next.phase === 'chase' || next.phase === 'recover') {
    const facing = Math.atan2(-dz, dx)
    next.facingRadians = turnToward(next.facingRadians, facing, spec.turnSpeed * delta)
  }

  if (next.phase === 'chase') {
    if (distance > spec.preferredRange + 0.001 && distance > 0.001) {
      const speed = bossMoveSpeed(spec, distance, player)
      const travel = Math.min(distance - spec.preferredRange, speed * delta)
      next.x += dx / distance * travel
      next.z += dz / distance * travel
      return { state: next, events }
    }
    if (distance < spec.minimumRange - 0.001) {
      // Backing off behind its own facing when the two are coincident. A lunge
      // ends on where the player stood, so there is a real case with no
      // direction to retreat along, and falling out here leaves a boss standing
      // on the player unable to open a ring for the rest of the fight.
      const retreatX = distance > 0.001 ? -dx / distance : -Math.cos(next.facingRadians)
      const retreatZ = distance > 0.001 ? -dz / distance : Math.sin(next.facingRadians)
      const travel = Math.min(spec.minimumRange - distance, spec.moveSpeed * delta)
      next.x += retreatX * travel
      next.z += retreatZ * travel
      return { state: next, events }
    }
    const rotation = gloamwoodValleyBossRotation(spec, next.bossPhase ?? 1)
    const pattern = rotation[(next.bossTurn ?? 0) % rotation.length]
    return {
      state: {
        ...next,
        phase: 'telegraph',
        phaseElapsed: 0,
        bossPattern: pattern,
        aimX: player.x,
        aimZ: player.z,
        attackResolved: false,
      },
      events,
    }
  }

  const pattern = spec.patterns[next.bossPattern ?? ''] ?? spec.patterns[gloamwoodValleyBossRotation(spec, 1)[0]]

  if (next.phase === 'telegraph') {
    // Never abandoned part way. Prey drop a wind-up when the player walks out
    // of reach, because a prey telegraph is an approach; a boss pattern is a
    // commitment, and one that could be walked out of would never land.
    if (next.phaseElapsed >= pattern.telegraphSeconds) {
      next = { ...next, phase: 'strike', phaseElapsed: 0, attackResolved: false }
    }
    return { state: next, events }
  }

  if (next.phase === 'strike') {
    if (!next.attackResolved) {
      next.attackResolved = true
      const aim = { x: next.aimX ?? player.x, z: next.aimZ ?? player.z }
      if (gloamwoodValleyBossHits(pattern.shape, next, aim, player)) {
        events.push({
          type: 'prey-attack',
          preyId: next.id,
          kind: next.kind,
          damage: pattern.damage,
          knockback: pattern.knockback,
        })
      }
    }
    if (pattern.shape.kind === 'line') {
      // The lane travels. It was committed at wind-up and the boss runs it, so
      // the shape on the ground and the body arriving are the same event.
      const aimDx = (next.aimX ?? next.x) - next.x
      const aimDz = (next.aimZ ?? next.z) - next.z
      const remaining = Math.max(0, Math.hypot(aimDx, aimDz) - spec.minimumRange)
      if (remaining > 0.001) {
        const travel = Math.min(remaining, pattern.shape.length / Math.max(0.001, pattern.attackSeconds) * delta)
        next.x += aimDx / Math.hypot(aimDx, aimDz) * travel
        next.z += aimDz / Math.hypot(aimDx, aimDz) * travel
      }
    }
    if (next.phaseElapsed >= pattern.attackSeconds) next = { ...next, phase: 'recover', phaseElapsed: 0 }
    return { state: next, events }
  }

  if (next.phaseElapsed >= spec.recoverSeconds[next.bossPhase ?? 1]) {
    next = { ...next, phase: 'chase', phaseElapsed: 0, bossTurn: (next.bossTurn ?? 0) + 1, attackResolved: false }
  }
  return { state: next, events }
}

/** A boss inside the player's slow aura is slowed by it, as prey are. */
function bossMoveSpeed(spec: GloamwoodValleyBossSpec, distance: number, player: GloamwoodPlayerPresence) {
  const radius = player.slowAuraRadius ?? 0
  const factor = player.slowAuraFactor ?? 1
  return radius > 0 && distance <= radius ? spec.moveSpeed * factor : spec.moveSpeed
}

export interface GloamwoodValleyBossClipSelection {
  clip: string
  restart: boolean
  once: boolean
  /** Playback rate, so the clip's contact lands on the authority's. */
  rate: number
}

/**
 * Which clip a boss should be playing, and how fast.
 *
 * A boss has one clip per pattern, where prey have one attack clip for
 * everything - so the selector cannot be shared. The rate stretches the take
 * over wind-up plus blow, which is what keeps the swing on the frame the
 * authority already decided to hit on: nothing here ever reports back.
 */
export function gloamwoodValleyBossClipForPhase(
  creature: Pick<BossCreature, 'phase' | 'bossPattern'>,
  spec: GloamwoodValleyBossSpec,
  config: GloamwoodModelledPreyConfig,
  clipSeconds: number,
  previousPhase?: GloamwoodNestPrey['phase'],
): GloamwoodValleyBossClipSelection {
  const { clips } = config
  if (creature.phase === 'dead') {
    return { clip: clips.death, restart: previousPhase !== 'dead', once: true, rate: 1 }
  }
  if (creature.phase === 'telegraph' || creature.phase === 'strike') {
    const pattern = spec.patterns[creature.bossPattern ?? '']
    if (pattern) {
      const continuing = previousPhase === 'telegraph' || previousPhase === 'strike'
      return {
        clip: pattern.clip,
        restart: !continuing,
        once: true,
        rate: gloamwoodValleyBossClipRate(clipSeconds, pattern),
      }
    }
  }
  if (creature.phase === 'chase') {
    return { clip: clips.walk, restart: previousPhase !== 'chase', once: false, rate: 1 }
  }
  return { clip: clips.idle, restart: false, once: false, rate: 1 }
}

export function gloamwoodValleyBossClipRate(clipSeconds: number, pattern: GloamwoodValleyBossPattern) {
  const target = Math.max(0.001, pattern.telegraphSeconds + pattern.attackSeconds)
  return Math.max(0.1, Math.min(4, clipSeconds / target))
}

/** The family speed a boss would have had, for anything still reading it. */
export function gloamwoodValleyBossFamilySpeed(kind: GloamwoodNestPrey['kind']) {
  return GLOAMWOOD_PREY[kind].moveSpeed
}

function turnToward(current: number, target: number, maximum: number) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + Math.max(-maximum, Math.min(maximum, difference))
}
