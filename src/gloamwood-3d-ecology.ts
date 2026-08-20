import type { FormalHuntBasicAttackAction } from './formal-hunt-basic-attack'
import {
  gloamwoodEliteAbsorb,
  gloamwoodEliteCooldown,
  gloamwoodEliteDamage,
  gloamwoodEliteDeathBurst,
  gloamwoodEliteSiphon,
  gloamwoodEliteSpeed,
  gloamwoodEliteSplits,
  type GloamwoodEliteBurst,
  type GloamwoodEliteState,
} from './gloamwood-elite'

export type GloamwoodPreyKind = 'fang' | 'shell' | 'swarm'
export type GloamwoodPreyPhase = 'chase' | 'telegraph' | 'strike' | 'recover' | 'stunned' | 'dead'
export type GloamwoodNestPhase = 'dormant' | 'wave' | 'intermission' | 'cleared'

export interface GloamwoodPreySpec {
  displayName: string
  gene: GloamwoodPreyKind
  maxHealth: number
  moveSpeed: number
  turnSpeed: number
  stopRange: number
  attackRange: number
  telegraphSeconds: number
  contactSeconds: number
  strikeSeconds: number
  recoverSeconds: number
  stunSeconds: number
  damage: number
  knockback: number
  biomass: number
  /**
   * When true the creature commits its facing the moment it leaves `chase`, and
   * only re-acquires the player on return. Families whose front is mechanically
   * stronger need this: without it their turn speed exceeds the angular speed a
   * player can orbit at, so the flank the onboarding asks for is unreachable.
   */
  commitsFacingWhileAttacking: boolean
}

export interface GloamwoodNestPrey {
  id: string
  kind: GloamwoodPreyKind
  phase: GloamwoodPreyPhase
  phaseElapsed: number
  health: number
  maxHealth: number
  x: number
  z: number
  facingRadians: number
  attackResolved: boolean
  slot: number
  /**
   * Time left during which further hits cannot interrupt this creature.
   *
   * Granted the moment it is stunned, and long enough to cover one telegraph
   * plus one strike. Without it a hit reset the whole wind-up, and the Carapace
   * family's 1.05s telegraph is longer than any attack chain's cadence: the nest
   * guardian could not land a single blow while it was being hit, which is to
   * say never.
   */
  stunImmuneSeconds?: number
  /** Overrides the family radius. Set on modelled creatures, which have a size. */
  bodyRadius?: number
  /**
   * Set only on elites.
   *
   * Carried on the creature rather than passed into the damage gate, so a call
   * site cannot forget to hand it over and quietly turn an elite back into an
   * ordinary one - which would look exactly like the fight being easy rather
   * than like a defect.
   */
  elite?: GloamwoodEliteState
}

export interface GloamwoodGeneBank { fang: number; shell: number; swarm: number }

export interface GloamwoodNestState {
  phase: GloamwoodNestPhase
  wave: number
  phaseElapsed: number
  prey: GloamwoodNestPrey[]
  kills: number
  biomass: number
  genes: GloamwoodGeneBank
  recentHunts: GloamwoodPreyKind[]
}

export type GloamwoodNestEvent =
  | { type: 'nest-started'; wave: number }
  | { type: 'wave-started'; wave: number }
  | { type: 'wave-cleared'; wave: number }
  | { type: 'nest-cleared'; biomass: number; genes: GloamwoodGeneBank }
  | { type: 'prey-attack'; preyId: string; kind: GloamwoodPreyKind; damage: number; knockback: number }
  /**
   * A boss crossed half health and turned.
   *
   * Carried on the shared event union rather than a boss-only one because the
   * valley's bosses are creatures in the same list as everything else, and the
   * runtime already has exactly one place where a creature's events are read.
   */
  | { type: 'boss-enraged'; preyId: string; phase: 2 }

export interface GloamwoodPreyDamageResult {
  state: GloamwoodNestState
  effectiveDamage: number
  blocked: boolean
  /**
   * True when an earned multiplier applied - the Carapace flank, or the attack
   * a family is weak to. Reported so presentation can show it; the number is
   * already resolved here and nothing downstream may change it.
   */
  weakness: boolean
  /**
   * True when this hit actually cut the creature's action short.
   *
   * Reported so presentation can tell a real interruption from a hit that
   * landed while the creature was inside its guaranteed attack window. Playing
   * the full stagger on both made a guardian that was no longer being
   * interrupted still look like it was.
   */
  interrupted: boolean
  killed: boolean
  biomassGained: number
  geneGained: GloamwoodPreyKind | null
  /** Damage an elite's barrier swallowed, for presentation to show. */
  absorbedByShield: number
  /** True on the hit that takes a brood elite through half health. */
  splits: boolean
  /** Left behind by a volatile elite, in world units. */
  burst: GloamwoodEliteBurst | null
}

export const GLOAMWOOD_NEST = {
  centerX: 7.2,
  centerZ: -3.4,
  activationRadius: 8.4,
  intermissionSeconds: 1.15,
  maximumActivePrey: 6,
  waveCount: 3,
} as const

export const GLOAMWOOD_NEST_GUARDIAN = {
  id: 'corrupt-root-nest-guardian',
  displayName: '腐根巢卫',
  maxHealth: 230,
  bodyScale: 1.28,
  bodyRadius: 1.82,
} as const

export const GLOAMWOOD_PREY: Record<GloamwoodPreyKind, GloamwoodPreySpec> = {
  fang: {
    displayName: '裂牙猎兽', gene: 'fang', maxHealth: 46, moveSpeed: 3.65, turnSpeed: 7.4,
    stopRange: 1.72, attackRange: 2.12, telegraphSeconds: 0.46, contactSeconds: 0.1,
    strikeSeconds: 0.3, recoverSeconds: 0.58, stunSeconds: 0.24, damage: 12, knockback: 1.05, biomass: 8,
    commitsFacingWhileAttacking: false,
  },
  shell: {
    displayName: '岩盾甲虫', gene: 'shell', maxHealth: 92, moveSpeed: 1.48, turnSpeed: 3.1,
    stopRange: 2.18, attackRange: 2.62, telegraphSeconds: 1.05, contactSeconds: 0.18,
    // 14, not 20. The shell is the wall: 92 health, a 72% frontal reduction
    // nothing else has, and the heaviest knockback in the game. At 20 it was
    // also the hardest hitter, which left the fang - the family whose whole
    // identity is hitting hard and fast - doing 40% less per blow than the tank
    // it stands next to, and took a fifth of the player's bar per landed hit.
    //
    // Still above the fang's 12, because its 1.05s wind-up is the most readable
    // telegraph in the game and a blow that slow has to be worth landing. Over
    // a full cycle it stays the lower of the two - 5.4 a second against the
    // fang's 9.0 - which is what a tank should be.
    strikeSeconds: 0.48, recoverSeconds: 1.08, stunSeconds: 0.18, damage: 14, knockback: 1.75, biomass: 14,
    // Only the shell family reduces frontal damage, so only it needs the window.
    commitsFacingWhileAttacking: true,
  },
  swarm: {
    displayName: '荧孢群虫', gene: 'swarm', maxHealth: 24, moveSpeed: 2.9, turnSpeed: 6.2,
    stopRange: 1.5, attackRange: 1.82, telegraphSeconds: 0.34, contactSeconds: 0.08,
    strikeSeconds: 0.24, recoverSeconds: 0.72, stunSeconds: 0.32, damage: 6, knockback: 0.52, biomass: 4,
    commitsFacingWhileAttacking: false,
  },
}

export const GLOAMWOOD_PREY_BODY_RADII: Record<GloamwoodPreyKind, number> = {
  fang: 1.02,
  shell: 1.42,
  swarm: 0.64,
}

export function gloamwoodPreyBodyRadius(
  prey: Pick<GloamwoodNestPrey, 'id' | 'kind'> & { bodyRadius?: number },
) {
  // A creature may carry its own size. The Gloamwood's prey are code-built
  // shapes whose family radius is the only size they have; the valley's are
  // modelled animals, and a goat is not the same size as a river crocodilian
  // just because both are typed Fang.
  //
  // Safe to widen because reach is already derived from it: `stopDistance`
  // takes the body radius and `attackDistance` takes the stop distance, so a
  // larger creature stands further out *and* strikes further. This is the one
  // place in the project where a size change does not silently put an attack
  // out of range.
  if (prey.bodyRadius !== undefined) return prey.bodyRadius
  return prey.id === GLOAMWOOD_NEST_GUARDIAN.id ? GLOAMWOOD_NEST_GUARDIAN.bodyRadius : GLOAMWOOD_PREY_BODY_RADII[prey.kind]
}

export function clampGloamwoodPreyToArena(
  prey: GloamwoodNestPrey,
  center: { x: number; z: number },
  radius: number,
) {
  const dx = prey.x - center.x
  const dz = prey.z - center.z
  const distance = Math.hypot(dx, dz)
  if (distance <= radius || distance < 0.001) return prey
  return { ...prey, x: center.x + dx / distance * radius, z: center.z + dz / distance * radius }
}

export const GLOAMWOOD_COMBAT_SPACING = {
  actionSpace: { fang: 0.32, shell: 0.48, swarm: 0.24 },
  strikeReach: { fang: 0.52, shell: 0.7, swarm: 0.38 },
  pairGap: 0.32,
  slotArrivalTolerance: 0.32,
  slotAngleStep: 2.399963229728653,
} as const

export interface GloamwoodPlayerPresence {
  x: number
  z: number
  alive: boolean
  bodyRadius?: number
  /**
   * Prey inside this radius move at `slowFactor` of their speed.
   *
   * Granted by the Sporehaze mutation. It is deliberately a defensive aura and
   * not a lure: every prey in this game closes unconditionally, so anything
   * that pulled more of them in could only raise the death rate, and once the
   * larger map separates aggressive from passive creatures a lure would still
   * have to pull only the passive ones to be a tool rather than a trap.
   */
  slowAuraRadius?: number
  slowAuraFactor?: number
}

const WAVES: readonly (readonly GloamwoodPreyKind[])[] = [
  ['fang', 'fang'],
  ['shell', 'swarm', 'swarm'],
  ['fang', 'shell', 'swarm', 'swarm', 'swarm', 'swarm'],
]

export function createGloamwoodNestState(): GloamwoodNestState {
  return { phase: 'dormant', wave: 0, phaseElapsed: 0, prey: [], kills: 0, biomass: 0, genes: { fang: 0, shell: 0, swarm: 0 }, recentHunts: [] }
}

export function awakenGloamwoodNestGuardian(state: GloamwoodNestState): GloamwoodNestState {
  return {
    ...state,
    phase: 'wave',
    phaseElapsed: 0,
    prey: [{
      id: GLOAMWOOD_NEST_GUARDIAN.id,
      kind: 'shell',
      phase: 'chase',
      phaseElapsed: 0,
      health: GLOAMWOOD_NEST_GUARDIAN.maxHealth,
      maxHealth: GLOAMWOOD_NEST_GUARDIAN.maxHealth,
      x: GLOAMWOOD_NEST.centerX,
      z: GLOAMWOOD_NEST.centerZ,
      facingRadians: Math.PI,
      attackResolved: false,
      slot: GLOAMWOOD_NEST.maximumActivePrey + 1,
    }],
  }
}

export function stepGloamwoodNest(
  state: GloamwoodNestState,
  deltaSeconds: number,
  player: GloamwoodPlayerPresence,
): { state: GloamwoodNestState; events: GloamwoodNestEvent[] } {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  let next = { ...state, phaseElapsed: state.phaseElapsed + delta, prey: state.prey.map((prey) => ({ ...prey })) }
  const events: GloamwoodNestEvent[] = []

  if (next.phase === 'dormant') {
    if (Math.hypot(player.x - GLOAMWOOD_NEST.centerX, player.z - GLOAMWOOD_NEST.centerZ) <= GLOAMWOOD_NEST.activationRadius) {
      next = spawnWave(next, 1)
      events.push({ type: 'nest-started', wave: 1 }, { type: 'wave-started', wave: 1 })
    }
    return { state: next, events }
  }
  if (next.phase === 'cleared') return { state: next, events }
  if (next.phase === 'intermission') {
    if (next.phaseElapsed >= GLOAMWOOD_NEST.intermissionSeconds) {
      next = spawnWave(next, next.wave + 1)
      events.push({ type: 'wave-started', wave: next.wave })
    }
    return { state: next, events }
  }

  // Remember where each prey stood so the separation below can tell who caused
  // an overlap. Correcting whoever moved is the same rule the chase already
  // follows: a prey walking into a standing player moves only itself.
  const previousPositions = new Map(next.prey.map((prey) => [prey.id, { x: prey.x, z: prey.z }]))
  next.prey = next.prey.map((prey) => {
    const frame = stepPrey(prey, delta, player)
    events.push(...frame.events)
    return frame.state
  })
  next.prey = separateLivingPrey(next.prey)
  next.prey = resolveGloamwoodPreyAroundPlayer(next.prey, player, player.bodyRadius ?? 0, previousPositions)
  if (next.prey.length > 0 && next.prey.every((prey) => prey.phase === 'dead')) {
    events.push({ type: 'wave-cleared', wave: next.wave })
    if (next.wave >= GLOAMWOOD_NEST.waveCount) {
      next = { ...next, phase: 'cleared', phaseElapsed: 0 }
      events.push({ type: 'nest-cleared', biomass: next.biomass, genes: { ...next.genes } })
    } else {
      next = { ...next, phase: 'intermission', phaseElapsed: 0 }
    }
  }
  return { state: next, events }
}

/**
 * The damage gate, over any list of creatures.
 *
 * Split out from the nest so the valley's free-roaming creatures go through the
 * same arithmetic rather than a second copy of it. The nest wrapper below adds
 * what only a nest has - a gene bank, a kill count, a biomass total - and this
 * decides what a hit does, which is the part that must never exist twice.
 */
export interface GloamwoodPreyHitResult {
  prey: GloamwoodNestPrey[]
  effectiveDamage: number
  blocked: boolean
  weakness: boolean
  interrupted: boolean
  killed: boolean
  absorbedByShield: number
  splits: boolean
  burst: GloamwoodEliteBurst | null
  /** The creature's family, when the hit killed it. */
  killedKind: GloamwoodPreyKind | null
}

export function damageGloamwoodPreyList(
  prey: readonly GloamwoodNestPrey[],
  preyId: string,
  rawDamage: number,
  action: FormalHuntBasicAttackAction,
  attacker: { x: number; z: number },
  knockback: number,
): GloamwoodPreyHitResult {
  const target = prey.find((entry) => entry.id === preyId)
  if (!target || target.phase === 'dead') {
    return {
      prey: [...prey], effectiveDamage: 0, blocked: false, weakness: false, interrupted: false,
      killed: false, absorbedByShield: 0, splits: false, burst: null, killedKind: null,
    }
  }
  const spec = GLOAMWOOD_PREY[target.kind]
  const attackerFacing = Math.atan2(-(attacker.z - target.z), attacker.x - target.x)
  const frontalError = Math.abs(shortestAngle(target.facingRadians, attackerFacing))
  const shellFront = target.kind === 'shell' && frontalError <= Math.PI * 0.42
  const multiplier = shellFront ? 0.28 : target.kind === 'shell' ? 1.35 : target.kind === 'fang' && action === 'Claw' ? 1.2 : target.kind === 'swarm' && action === 'TailSwipe' ? 1.3 : 1
  const familyDamage = Math.max(1, Math.round(Math.max(0, rawDamage) * multiplier))
  const shielded = gloamwoodEliteAbsorb(target.elite, familyDamage)
  const effectiveDamage = shielded.damage
  const health = Math.max(0, target.health - effectiveDamage)
  const killed = health <= 0
  const dx = target.x - attacker.x
  const dz = target.z - attacker.z
  const inverse = 1 / Math.max(0.001, Math.hypot(dx, dz))
  const splits = gloamwoodEliteSplits(target.elite, target.health, health, target.maxHealth)
  const interruptible = (target.stunImmuneSeconds ?? 0) <= 0
  const stunImmunity = spec.stunSeconds + spec.telegraphSeconds + spec.strikeSeconds
  const nextPrey = prey.map((entry) => entry.id === preyId ? {
    ...entry,
    health,
    x: entry.x + dx * inverse * knockback * (target.kind === 'shell' ? 0.35 : 1),
    z: entry.z + dz * inverse * knockback * (target.kind === 'shell' ? 0.35 : 1),
    phase: killed ? 'dead' as const : interruptible ? 'stunned' as const : entry.phase,
    phaseElapsed: killed || interruptible ? 0 : entry.phaseElapsed,
    attackResolved: killed || interruptible ? false : entry.attackResolved,
    stunImmuneSeconds: interruptible ? stunImmunity : entry.stunImmuneSeconds,
    elite: shielded.elite && splits ? { ...shielded.elite, broodTriggered: true } : shielded.elite,
  } : entry)
  return {
    prey: nextPrey,
    effectiveDamage,
    blocked: shellFront,
    weakness: !shellFront && multiplier > 1,
    interrupted: !killed && interruptible,
    killed,
    absorbedByShield: shielded.absorbed,
    splits,
    burst: killed ? gloamwoodEliteDeathBurst(target.elite, target.x, target.z) : null,
    killedKind: killed ? target.kind : null,
  }
}

export function damageGloamwoodNestPrey(
  state: GloamwoodNestState,
  preyId: string,
  rawDamage: number,
  action: FormalHuntBasicAttackAction,
  attacker: { x: number; z: number },
  knockback: number,
): GloamwoodPreyDamageResult {
  // Delegates. The arithmetic of what a hit does lives in one place; what a
  // *nest* additionally tracks - genes, kills, biomass, the recent-hunt list -
  // is added here, because only a nest has those.
  const hit = damageGloamwoodPreyList(state.prey, preyId, rawDamage, action, attacker, knockback)
  const killedKind = hit.killedKind
  const spec = killedKind ? GLOAMWOOD_PREY[killedKind] : null
  const biomassGained = spec ? spec.biomass : 0
  const genes = spec ? { ...state.genes, [spec.gene]: state.genes[spec.gene] + 1 } : state.genes
  const recentHunts = spec ? [...state.recentHunts, spec.gene].slice(-6) : state.recentHunts
  return {
    state: {
      ...state,
      prey: hit.prey,
      kills: state.kills + Number(hit.killed),
      biomass: state.biomass + biomassGained,
      genes,
      recentHunts,
    },
    effectiveDamage: hit.effectiveDamage,
    blocked: hit.blocked,
    weakness: hit.weakness,
    interrupted: hit.interrupted,
    killed: hit.killed,
    biomassGained,
    geneGained: spec ? spec.gene : null,
    absorbedByShield: hit.absorbedByShield,
    splits: hit.splits,
    burst: hit.burst,
  }
}

function spawnWave(state: GloamwoodNestState, wave: number): GloamwoodNestState {
  const kinds = WAVES[wave - 1] ?? []
  const prey = kinds.slice(0, GLOAMWOOD_NEST.maximumActivePrey).map((kind, slot) => {
    const angle = (slot / Math.max(1, kinds.length)) * Math.PI * 2 + wave * 0.55
    const radius = kind === 'swarm' ? 3.2 + (slot % 2) * 0.7 : 2.6 + slot * 0.45
    const spec = GLOAMWOOD_PREY[kind]
    return {
      id: `wave-${wave}-${kind}-${slot}`,
      kind,
      phase: 'chase' as const,
      phaseElapsed: 0,
      health: spec.maxHealth,
      maxHealth: spec.maxHealth,
      x: GLOAMWOOD_NEST.centerX + Math.cos(angle) * radius,
      z: GLOAMWOOD_NEST.centerZ + Math.sin(angle) * radius,
      facingRadians: angle + Math.PI,
      attackResolved: false,
      slot,
    }
  })
  return { ...state, phase: 'wave', wave, phaseElapsed: 0, prey }
}

/** Prey speed after any aura the player is projecting. */
function preyMoveSpeed(spec: GloamwoodPreySpec, playerDistance: number, player: GloamwoodPlayerPresence) {
  const radius = player.slowAuraRadius ?? 0
  const factor = player.slowAuraFactor ?? 1
  return radius > 0 && playerDistance <= radius ? spec.moveSpeed * factor : spec.moveSpeed
}

/**
 * One creature, one frame.
 *
 * Exported because the valley drives free-roaming creatures with it. Its nest
 * runs waves in a fixed arena and the valley scatters packs across 1590 units
 * of route, but what a creature does once it has noticed the player is the same
 * question in both, and answering it twice is how the two would drift apart.
 */
export function stepPrey(
  state: GloamwoodNestPrey,
  delta: number,
  player: GloamwoodPlayerPresence,
): { state: GloamwoodNestPrey; events: GloamwoodNestEvent[] } {
  if (state.phase === 'dead') return { state, events: [] }
  const spec = GLOAMWOOD_PREY[state.kind]
  let next = { ...state, phaseElapsed: state.phaseElapsed + delta }
  const events: GloamwoodNestEvent[] = []
  next.stunImmuneSeconds = Math.max(0, (next.stunImmuneSeconds ?? 0) - delta)
  if (next.phase === 'stunned') {
    if (next.phaseElapsed >= spec.stunSeconds) next = enterPhase(next, 'chase')
    return { state: next, events }
  }
  if (!player.alive) return { state: enterPhase(next, 'chase'), events }

  const stopDistance = gloamwoodPreyStopDistance(state, player.bodyRadius ?? 0)
  const slot = gloamwoodCombatSlotPosition(state.slot, state.kind, player, stopDistance)
  const desiredX = slot.x
  const desiredZ = slot.z
  const dx = desiredX - next.x
  const dz = desiredZ - next.z
  const playerDistance = Math.hypot(player.x - next.x, player.z - next.z)
  const attackDistance = gloamwoodPreyAttackDistance(state, player.bodyRadius ?? 0)
  const desiredDistance = Math.hypot(dx, dz)
  const facing = Math.atan2(-(player.z - next.z), player.x - next.x)
  // A committed creature keeps the facing it chose when the telegraph began, so
  // telegraph/strike/recover form the window the onboarding's flank advice needs.
  // Uncommitted families keep re-acquiring every frame, exactly as before.
  if (!spec.commitsFacingWhileAttacking || next.phase === 'chase') {
    next.facingRadians = turnToward(next.facingRadians, facing, spec.turnSpeed * delta)
  }

  if (next.phase === 'chase') {
    // Attacking is gated on being the right distance from the player, not on
    // reaching a particular angle around them. The slot steers the approach so
    // a pack spreads out; requiring arrival at it as well meant any creature
    // whose slot it could not physically occupy never attacked at all.
    //
    // The guardian fight is exactly that case. Its arena clamps prey inside a
    // 4.2 radius, and widening the guardian's action ring to match its real
    // body put its slot outside that circle: it walked at an unreachable point
    // forever and never threw a single attack. Measured over 30 seconds it went
    // from ten attacks to zero the moment the ring passed what the arena allows.
    if (playerDistance <= stopDistance + 0.18) {
      return { state: enterPhase(next, 'telegraph'), events }
    }
    if (desiredDistance > 0.001) {
      const currentAngle = Math.atan2(next.z - player.z, next.x - player.x)
      const targetAngle = Math.atan2(slot.z - player.z, slot.x - player.x)
      const moveSpeed = preyMoveSpeed(spec, playerDistance, player)
        * gloamwoodEliteSpeed(next.elite, next.health, next.maxHealth)
      const radialStep = Math.min(Math.abs(playerDistance - stopDistance), moveSpeed * delta)
      const nextRadius = Math.max(stopDistance, playerDistance + Math.sign(stopDistance - playerDistance) * radialStep)
      const angularStep = Math.min(
        Math.abs(shortestAngle(currentAngle, targetAngle)),
        moveSpeed * delta / Math.max(stopDistance, playerDistance, 0.001),
      )
      const nextAngle = currentAngle + Math.sign(shortestAngle(currentAngle, targetAngle)) * angularStep
      next.x = player.x + Math.cos(nextAngle) * nextRadius
      next.z = player.z + Math.sin(nextAngle) * nextRadius
    }
    return { state: next, events }
  }
  if (next.phase === 'telegraph') {
    if (playerDistance > attackDistance + 0.65) return { state: enterPhase(next, 'chase'), events }
    if (next.phaseElapsed >= spec.telegraphSeconds) next = enterPhase(next, 'strike')
    return { state: next, events }
  }
  if (next.phase === 'strike') {
    if (!next.attackResolved && next.phaseElapsed >= spec.contactSeconds) {
      next.attackResolved = true
      // The guaranteed attempt has been spent. Dropping the window here rather
      // than letting it run out keeps it a guarantee of one attack rather than
      // a stretch of free immunity.
      next.stunImmuneSeconds = 0
      if (playerDistance <= attackDistance) {
        const damage = Math.round(spec.damage * gloamwoodEliteDamage(next.elite, next.health, next.maxHealth))
        // A siphon elite heals off the hit it just landed. Written here, where
        // the hit is decided, so its health and the damage event cannot ever
        // disagree about whether the blow happened.
        next.health = gloamwoodEliteSiphon(next.elite, next.health, next.maxHealth, damage)
        events.push({ type: 'prey-attack', preyId: next.id, kind: next.kind, damage, knockback: spec.knockback })
      }
    }
    if (next.phaseElapsed >= spec.strikeSeconds) next = enterPhase(next, 'recover')
    return { state: next, events }
  }
  // A wound-up berserker recovers faster; its telegraph is untouched, because
  // the telegraph is where the fight stays readable.
  if (next.phaseElapsed >= spec.recoverSeconds * gloamwoodEliteCooldown(next.elite, next.health, next.maxHealth)) {
    next = enterPhase(next, 'chase')
  }
  return { state: next, events }
}

export function resolveGloamwoodPlayerPreyCollision(
  position: { x: number; z: number },
  playerBodyRadius: number,
  prey: readonly GloamwoodNestPrey[],
  iterations = 4,
) {
  let x = position.x
  let z = position.z
  let contacts = 0
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let corrected = false
    for (const target of prey) {
      if (target.phase === 'dead') continue
      let dx = x - target.x
      let dz = z - target.z
      let distance = Math.hypot(dx, dz)
      const minimum = playerBodyRadius + gloamwoodPreyBodyRadius(target)
      if (distance >= minimum - 0.000001) continue
      if (distance < 0.000001) {
        const angle = (target.slot + 1) * 2.399
        dx = Math.cos(angle)
        dz = Math.sin(angle)
        distance = 1
      }
      const penetration = minimum - distance
      x += dx / distance * penetration
      z += dz / distance * penetration
      contacts += 1
      corrected = true
    }
    if (!corrected) break
  }
  return { x, z, contacts, minimumClearance: inspectGloamwoodPlayerPreyClearance({ x, z }, playerBodyRadius, prey) }
}

/**
 * Hold prey out at their action ring, but only against prey that closed the gap
 * themselves.
 *
 * The ring includes action space and is therefore wider than the body-to-body
 * distance the player is blocked at, so applying it unconditionally let a player
 * walking forward shove prey ahead of them like a plough. A prey that did not
 * move is left where it stands; the player's own resolution stops them at its
 * surface instead.
 */
export function resolveGloamwoodPreyAroundPlayer(
  prey: readonly GloamwoodNestPrey[],
  player: { x: number; z: number },
  playerBodyRadius: number,
  previousPositions?: ReadonlyMap<string, { x: number; z: number }>,
) {
  return prey.map((target) => {
    if (target.phase === 'dead') return target
    let dx = target.x - player.x
    let dz = target.z - player.z
    let distance = Math.hypot(dx, dz)
    const minimum = gloamwoodPreyStopDistance(target, playerBodyRadius)
    if (distance >= minimum - 0.000001) return target
    const previous = previousPositions?.get(target.id)
    if (previous) {
      const previousDistance = Math.hypot(previous.x - player.x, previous.z - player.z)
      // Already inside the ring and not closing: the player walked in, so the
      // player is the one who gets corrected.
      if (previousDistance <= distance + 0.000001 && previousDistance < minimum) return target
    }
    if (distance < 0.000001) {
      const angle = (target.slot + 1) * 2.399
      dx = Math.cos(angle)
      dz = Math.sin(angle)
      distance = 1
    }
    return {
      ...target,
      x: player.x + dx / distance * minimum,
      z: player.z + dz / distance * minimum,
    }
  })
}

export function inspectGloamwoodPlayerPreyClearance(
  position: { x: number; z: number },
  playerBodyRadius: number,
  prey: readonly GloamwoodNestPrey[],
) {
  const clearances = prey
    .filter((target) => target.phase !== 'dead')
    .map((target) => Math.hypot(position.x - target.x, position.z - target.z) - playerBodyRadius - gloamwoodPreyBodyRadius(target))
  return clearances.length ? Math.min(...clearances) : 0
}

export function inspectGloamwoodPlayerPreyActionClearance(
  position: { x: number; z: number },
  playerBodyRadius: number,
  prey: readonly GloamwoodNestPrey[],
) {
  const clearances = prey
    .filter((target) => target.phase !== 'dead')
    .map((target) => Math.hypot(position.x - target.x, position.z - target.z) - gloamwoodPreyStopDistance(target, playerBodyRadius))
  return clearances.length ? Math.min(...clearances) : 0
}

export function inspectGloamwoodPreyPairClearance(prey: readonly GloamwoodNestPrey[]) {
  let minimum = Number.POSITIVE_INFINITY
  const live = prey.filter((target) => target.phase !== 'dead')
  for (let leftIndex = 0; leftIndex < live.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < live.length; rightIndex += 1) {
      const left = live[leftIndex]
      const right = live[rightIndex]
      const clearance = Math.hypot(left.x - right.x, left.z - right.z)
        - gloamwoodPreyBodyRadius(left)
        - gloamwoodPreyBodyRadius(right)
        - GLOAMWOOD_COMBAT_SPACING.pairGap
      minimum = Math.min(minimum, clearance)
    }
  }
  return Number.isFinite(minimum) ? minimum : 0
}

function separateLivingPrey(prey: readonly GloamwoodNestPrey[]) {
  const separated = prey.map((target) => ({ ...target }))
  for (let iteration = 0; iteration < 4; iteration += 1) {
    let corrected = false
    for (let leftIndex = 0; leftIndex < separated.length; leftIndex += 1) {
      const left = separated[leftIndex]
      if (left.phase === 'dead') continue
      for (let rightIndex = leftIndex + 1; rightIndex < separated.length; rightIndex += 1) {
        const right = separated[rightIndex]
        if (right.phase === 'dead') continue
        let dx = right.x - left.x
        let dz = right.z - left.z
        let distance = Math.hypot(dx, dz)
        const minimum = gloamwoodPreyBodyRadius(left)
          + gloamwoodPreyBodyRadius(right)
          + GLOAMWOOD_COMBAT_SPACING.pairGap
        if (distance >= minimum - 0.000001) continue
        if (distance < 0.000001) {
          const angle = (left.slot + right.slot + 1) * 1.618
          dx = Math.cos(angle)
          dz = Math.sin(angle)
          distance = 1
        }
        const correction = (minimum - distance) * 0.5
        const nx = dx / distance
        const nz = dz / distance
        left.x -= nx * correction
        left.z -= nz * correction
        right.x += nx * correction
        right.z += nz * correction
        corrected = true
      }
    }
    if (!corrected) break
  }
  return separated
}

/**
 * The ring a creature holds while fighting: its own body, the player's body, and
 * the action space its attack animation needs between them.
 *
 * This takes the creature, not its family, because body size is per creature.
 * The nest guardian is a `shell` with a 1.82 radius against the family's 1.42,
 * so reading the family here put its ring 0.40 inside its own hull - 0.08 clear
 * of the hard collision floor. It closed until it was touching the player's
 * collision skin, which is why the guardian fight rendered snout-in-body while
 * ordinary beetles kept a visible gap.
 */
export function gloamwoodPreyStopDistance(
  prey: Pick<GloamwoodNestPrey, 'id' | 'kind'>,
  playerBodyRadius: number,
) {
  return Math.max(
    GLOAMWOOD_PREY[prey.kind].stopRange,
    Math.max(0, playerBodyRadius) + gloamwoodPreyBodyRadius(prey) + GLOAMWOOD_COMBAT_SPACING.actionSpace[prey.kind],
  )
}

/**
 * How far a creature's blow actually reaches.
 *
 * Exported because presentation has to draw *this* circle and nothing else.
 * The telegraph ring used to be built from `spec.attackRange` alone while the
 * hit was tested against this, and the two are not the same number: a modelled
 * river fang stands off at its own body radius plus the player's, so it struck
 * at 3.49 while the ring on the ground promised 2.12. Stepping out of the
 * drawn circle and being hit anyway was the player reading a picture that was
 * 65% too small.
 *
 * It cannot be a constant. It depends on the player's body, which grows with
 * every evolution, and on the creature's, which is whatever model it wears.
 */
export function gloamwoodPreyAttackDistance(
  prey: Pick<GloamwoodNestPrey, 'id' | 'kind'> & { bodyRadius?: number },
  playerBodyRadius: number,
) {
  return Math.max(
    GLOAMWOOD_PREY[prey.kind].attackRange,
    gloamwoodPreyStopDistance(prey, playerBodyRadius) + GLOAMWOOD_COMBAT_SPACING.strikeReach[prey.kind],
  )
}

/**
 * The circle to paint on the ground for that blow.
 *
 * Not the same as the reach, and the difference is the whole reason the first
 * attempt at this looked absurd. `gloamwoodPreyAttackDistance` is measured
 * centre to centre, and for a modelled river fang 2.59 of its 3.43 is simply
 * the two bodies - only 0.84 is reach beyond them. A disc of 3.43 drawn round
 * the creature therefore covers the player's own body as well, and reads as a
 * area attack the size of a house rather than as a bite.
 *
 * Taking the player's radius back off gives the circle their *body edge*
 * crosses at exactly the moment their centre crosses the real one:
 *
 *   body edge touches it   <=>   d - playerRadius <= reach - playerRadius
 *                          <=>   d <= reach                (the actual test)
 *
 * So it is the same rule, drawn the way a player reads a mark on the ground -
 * "if I am touching this, it reaches me" - and it comes out at 2.39 rather than
 * 3.43.
 */
export function gloamwoodPreyTelegraphRadius(
  prey: Pick<GloamwoodNestPrey, 'id' | 'kind'> & { bodyRadius?: number },
  playerBodyRadius: number,
) {
  return Math.max(0.2, gloamwoodPreyAttackDistance(prey, playerBodyRadius) - Math.max(0, playerBodyRadius))
}

export function gloamwoodCombatSlotPosition(
  slot: number,
  kind: GloamwoodPreyKind,
  player: { x: number; z: number },
  radius: number,
) {
  const kindOffset = kind === 'shell' ? 0.22 : kind === 'swarm' ? -0.16 : 0
  const angle = slot * GLOAMWOOD_COMBAT_SPACING.slotAngleStep + kindOffset
  return {
    x: player.x + Math.cos(angle) * radius,
    z: player.z + Math.sin(angle) * radius,
  }
}

function enterPhase(state: GloamwoodNestPrey, phase: GloamwoodPreyPhase) {
  if (state.phase === phase && phase === 'chase') return state
  return { ...state, phase, phaseElapsed: 0, attackResolved: false }
}

function turnToward(current: number, target: number, maximum: number) {
  const difference = shortestAngle(current, target)
  if (Math.abs(difference) <= maximum) return target
  return current + Math.sign(difference) * maximum
}

function shortestAngle(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}
