export type GloamwoodBossPattern = 'root-slam' | 'thorn-charge' | 'spore-ring'
export type GloamwoodBossStateName = 'dormant' | 'intro' | 'chase' | 'telegraph' | 'attack' | 'recover' | 'dead'

export interface GloamwoodBossState {
  state: GloamwoodBossStateName
  elapsed: number
  x: number
  z: number
  facingRadians: number
  health: number
  maxHealth: number
  phase: 1 | 2
  pattern: GloamwoodBossPattern
  turn: number
  attackResolved: boolean
  aimX: number
  aimZ: number
}

export type GloamwoodBossEvent =
  | { type: 'phase-changed'; phase: 2 }
  | { type: 'boss-attack'; pattern: GloamwoodBossPattern; damage: number; knockback: number }
  | { type: 'boss-defeated' }

export const GLOAMWOOD_BOSS = {
  id: 'thorn-heart-warden',
  name: '荆心守卫',
  maxHealth: 420,
  bodyRadius: 1.72,
  /**
   * Where the boss chooses to stand.
   *
   * Two constraints, and the second was missed once already at real cost.
   *
   * It must sit inside every pattern's reach, or the boss stands where its own
   * rotation misses. And it must be at least the collision floor - the runtime
   * pushes the player out to playerCombatBodyRadius + bodyRadius + 0.22, which
   * is 3.50 for the widest form - or the boss can never reach the spacing it is
   * waiting for and simply never attacks again. Lowering this to 3.3 did exactly
   * that and stopped the fight dead.
   */
  preferredRange: 3.82,
  /**
   * Closest the boss will willingly stand.
   *
   * Just outside spore-ring's safe inner circle of 2.15.
   *
   * In practice the collision floor already keeps the player further out than
   * this, so the retreat rarely runs. It was added on a measurement that placed
   * the player at a fixed 3.4 with no collision at all, which made the ring look
   * dead when it was not. Kept as a cheap guard, not as a load-bearing fix.
   */
  minimumRange: 2.6,
  moveSpeed: 1.62,
  turnSpeed: 4.2,
  introSeconds: 1.55,
  /**
   * Standing still after a blow.
   *
   * Playtest, 2026-08-18: the boss was measured attacking once every 2.50s in
   * phase one, with 43% of the whole fight spent in recovery - it stood still
   * longer than it wound up. Recovery is the right lever for pressure because
   * cutting it costs the player nothing they were reading; the telegraphs are
   * where the fight is legible and they are deliberately untouched.
   */
  recoverSeconds: { 1: 0.58, 2: 0.3 },
  patterns: {
    // Radius 4.3, not 3.35. The player can never stand closer than the
    // collision floor of 3.43 to 3.50 depending on form, so at 3.35 this pattern
    // could not connect with anything, ever - and it is two of the three slots
    // in the phase-one rotation. Two thirds of the boss's early attacks were
    // guaranteed misses for the whole life of the encounter.
    'root-slam': { telegraphSeconds: 1.02, attackSeconds: 0.24, radius: 4.3, damage: 14, knockback: 1.25 },
    'thorn-charge': { telegraphSeconds: 0.9, attackSeconds: 0.58, length: 6.4, halfWidth: 0.82, damage: 18, knockback: 1.55 },
    'spore-ring': { telegraphSeconds: 1.14, attackSeconds: 0.28, innerRadius: 2.15, outerRadius: 5.15, damage: 16, knockback: 0.9 },
  },
} as const

const PHASE_ONE: readonly GloamwoodBossPattern[] = ['root-slam', 'thorn-charge', 'root-slam']
const PHASE_TWO: readonly GloamwoodBossPattern[] = ['spore-ring', 'thorn-charge', 'root-slam', 'thorn-charge']

export function createGloamwoodBossState(x = 7.2, z = -3.4): GloamwoodBossState {
  return {
    state: 'dormant', elapsed: 0, x, z, facingRadians: Math.PI, health: GLOAMWOOD_BOSS.maxHealth,
    maxHealth: GLOAMWOOD_BOSS.maxHealth, phase: 1, pattern: 'root-slam', turn: 0,
    attackResolved: false, aimX: x - 1, aimZ: z,
  }
}

export function startGloamwoodBoss(state: GloamwoodBossState): GloamwoodBossState {
  if (state.state !== 'dormant') return state
  return { ...state, state: 'intro', elapsed: 0 }
}

export function damageGloamwoodBoss(state: GloamwoodBossState, damage: number) {
  if (state.state === 'dormant' || state.state === 'dead') return { state, effectiveDamage: 0, defeated: false }
  const effectiveDamage = Math.min(state.health, Math.max(0, Math.round(damage)))
  const health = state.health - effectiveDamage
  return {
    state: health <= 0 ? { ...state, health: 0, state: 'dead' as const, elapsed: 0 } : { ...state, health },
    effectiveDamage,
    defeated: health <= 0,
  }
}

export function stepGloamwoodBoss(
  state: GloamwoodBossState,
  deltaSeconds: number,
  player: { x: number; z: number; alive: boolean },
): { state: GloamwoodBossState; events: GloamwoodBossEvent[] } {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  if (state.state === 'dormant' || state.state === 'dead') return { state, events: [] }
  let next = { ...state, elapsed: state.elapsed + delta }
  const events: GloamwoodBossEvent[] = []

  const expectedPhase: 1 | 2 = next.health <= next.maxHealth * 0.5 ? 2 : 1
  if (expectedPhase !== next.phase) {
    next = { ...next, phase: 2, state: 'recover', elapsed: 0, attackResolved: false }
    events.push({ type: 'phase-changed', phase: 2 })
    return { state: next, events }
  }
  if (!player.alive) return { state: { ...next, state: 'chase', elapsed: 0 }, events }
  const dx = player.x - next.x
  const dz = player.z - next.z
  const distance = Math.hypot(dx, dz)
  const targetFacing = Math.atan2(-dz, dx)
  next.facingRadians = turnToward(next.facingRadians, targetFacing, GLOAMWOOD_BOSS.turnSpeed * delta)

  if (next.state === 'intro') {
    if (next.elapsed >= GLOAMWOOD_BOSS.introSeconds) next = { ...next, state: 'chase', elapsed: 0 }
    return { state: next, events }
  }
  if (next.state === 'chase') {
    // Closing stops just inside the ring rather than exactly on it. The step
    // below clamps travel to `distance - preferredRange`, so a boss walking in
    // lands on the boundary and the strict comparison keeps answering true by a
    // rounding error: it edges forward by 1e-16 a frame and never leaves chase.
    // A player who backed off past 3.82 - or got knocked back past it - watched
    // the boss walk up and then stop fighting for the rest of the run.
    if (distance > GLOAMWOOD_BOSS.preferredRange + 0.001 && distance > 0.001) {
      const travel = Math.min(distance - GLOAMWOOD_BOSS.preferredRange, GLOAMWOOD_BOSS.moveSpeed * delta)
      next.x += dx / distance * travel
      next.z += dz / distance * travel
      return { state: next, events }
    }
    // Spacing is maintained, not merely approached. Chase only ever closed, so
    // once anything left the boss standing on the player it stayed there, and
    // spore-ring - safe inside 2.15 - connected once in thirty-one seconds. A
    // boss that cannot restore its distance cannot use a pattern with a safe
    // centre, which made a third of its phase-two rotation dead time.
    if (distance < GLOAMWOOD_BOSS.minimumRange - 0.001) {
      // A charge ends on the aim point, which is where the player was standing,
      // so the two can be exactly coincident and there is no direction to back
      // along. Falling out here is what left the first attempt at this with no
      // effect at all: retreat behind the boss's own facing instead.
      const retreatX = distance > 0.001 ? -dx / distance : -Math.cos(next.facingRadians)
      const retreatZ = distance > 0.001 ? -dz / distance : Math.sin(next.facingRadians)
      const travel = Math.min(GLOAMWOOD_BOSS.minimumRange - distance, GLOAMWOOD_BOSS.moveSpeed * delta)
      next.x += retreatX * travel
      next.z += retreatZ * travel
      return { state: next, events }
    }
    const sequence = next.phase === 1 ? PHASE_ONE : PHASE_TWO
    const pattern = sequence[next.turn % sequence.length]
    return {
      state: { ...next, state: 'telegraph', elapsed: 0, pattern, aimX: player.x, aimZ: player.z, attackResolved: false },
      events,
    }
  }
  if (next.state === 'telegraph') {
    if (next.elapsed >= GLOAMWOOD_BOSS.patterns[next.pattern].telegraphSeconds) {
      next = { ...next, state: 'attack', elapsed: 0, attackResolved: false }
    }
    return { state: next, events }
  }
  if (next.state === 'attack') {
    const spec = GLOAMWOOD_BOSS.patterns[next.pattern]
    if (!next.attackResolved) {
      next.attackResolved = true
      if (bossPatternHits(next, player)) {
        events.push({ type: 'boss-attack', pattern: next.pattern, damage: spec.damage, knockback: spec.knockback })
      }
    }
    if (next.pattern === 'thorn-charge') {
      const aimDx = next.aimX - next.x
      const aimDz = next.aimZ - next.z
      // Pull up short of where it aimed rather than ending on top of it. The
      // line stays exactly as dodgeable - the aim point is fixed at telegraph -
      // but the boss no longer finishes every charge coincident with the player
      // and then spends 1.6s walking backwards to make room for its next
      // pattern.
      const aimDistance = Math.max(0, Math.hypot(aimDx, aimDz) - GLOAMWOOD_BOSS.minimumRange)
      const travel = Math.min(aimDistance, GLOAMWOOD_BOSS.patterns['thorn-charge'].length / spec.attackSeconds * delta)
      // Stop at the aim point instead of running past it. Recomputing the
      // heading toward a fixed point every frame meant that once the charge
      // overshot it reversed, oscillated, and left the boss standing on the
      // player - which is also why its ring pattern could never connect.
      if (aimDistance > 0.001) {
        next.x += aimDx / aimDistance * travel
        next.z += aimDz / aimDistance * travel
      }
    }
    if (next.elapsed >= spec.attackSeconds) next = { ...next, state: 'recover', elapsed: 0 }
    return { state: next, events }
  }
  if (next.elapsed >= GLOAMWOOD_BOSS.recoverSeconds[next.phase]) {
    next = { ...next, state: 'chase', elapsed: 0, turn: next.turn + 1, attackResolved: false }
  }
  return { state: next, events }
}

export function bossPatternHits(
  state: Pick<GloamwoodBossState, 'pattern' | 'x' | 'z' | 'aimX' | 'aimZ'>,
  player: { x: number; z: number },
) {
  const distance = Math.hypot(player.x - state.x, player.z - state.z)
  if (state.pattern === 'root-slam') return distance <= GLOAMWOOD_BOSS.patterns['root-slam'].radius
  if (state.pattern === 'spore-ring') {
    const spec = GLOAMWOOD_BOSS.patterns['spore-ring']
    return distance >= spec.innerRadius && distance <= spec.outerRadius
  }
  const dx = state.aimX - state.x
  const dz = state.aimZ - state.z
  const length = Math.max(0.001, Math.hypot(dx, dz))
  const directionX = dx / length
  const directionZ = dz / length
  const relativeX = player.x - state.x
  const relativeZ = player.z - state.z
  const forward = relativeX * directionX + relativeZ * directionZ
  const lateral = Math.abs(relativeX * -directionZ + relativeZ * directionX)
  const spec = GLOAMWOOD_BOSS.patterns['thorn-charge']
  return forward >= 0 && forward <= spec.length && lateral <= spec.halfWidth
}

export function gloamwoodBossPatternSequence(phase: 1 | 2) {
  return [...(phase === 1 ? PHASE_ONE : PHASE_TWO)]
}

export function clampGloamwoodBossToArena(
  state: GloamwoodBossState,
  center: { x: number; z: number },
  radius: number,
) {
  const dx = state.x - center.x
  const dz = state.z - center.z
  const distance = Math.hypot(dx, dz)
  if (distance <= radius || distance < 0.001) return state
  return { ...state, x: center.x + dx / distance * radius, z: center.z + dz / distance * radius }
}

function turnToward(current: number, target: number, maximum: number) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  return current + Math.max(-maximum, Math.min(maximum, difference))
}
