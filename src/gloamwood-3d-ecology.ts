import type { FormalHuntBasicAttackAction } from './formal-hunt-basic-attack'

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

export interface GloamwoodPreyDamageResult {
  state: GloamwoodNestState
  effectiveDamage: number
  blocked: boolean
  killed: boolean
  biomassGained: number
  geneGained: GloamwoodPreyKind | null
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
    strikeSeconds: 0.48, recoverSeconds: 1.08, stunSeconds: 0.18, damage: 20, knockback: 1.75, biomass: 14,
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

export function gloamwoodPreyBodyRadius(prey: Pick<GloamwoodNestPrey, 'id' | 'kind'>) {
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

  next.prey = next.prey.map((prey) => {
    const frame = stepPrey(prey, delta, player)
    events.push(...frame.events)
    return frame.state
  })
  next.prey = separateLivingPrey(next.prey)
  next.prey = resolveGloamwoodPreyAroundPlayer(next.prey, player, player.bodyRadius ?? 0)
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

export function damageGloamwoodNestPrey(
  state: GloamwoodNestState,
  preyId: string,
  rawDamage: number,
  action: FormalHuntBasicAttackAction,
  attacker: { x: number; z: number },
  knockback: number,
): GloamwoodPreyDamageResult {
  const target = state.prey.find((prey) => prey.id === preyId)
  if (!target || target.phase === 'dead') return { state, effectiveDamage: 0, blocked: false, killed: false, biomassGained: 0, geneGained: null }
  const spec = GLOAMWOOD_PREY[target.kind]
  const attackerFacing = Math.atan2(-(attacker.z - target.z), attacker.x - target.x)
  const frontalError = Math.abs(shortestAngle(target.facingRadians, attackerFacing))
  const shellFront = target.kind === 'shell' && frontalError <= Math.PI * 0.42
  const multiplier = shellFront ? 0.28 : target.kind === 'shell' ? 1.35 : target.kind === 'fang' && action === 'Claw' ? 1.2 : target.kind === 'swarm' && action === 'TailSwipe' ? 1.3 : 1
  const effectiveDamage = Math.max(1, Math.round(Math.max(0, rawDamage) * multiplier))
  const health = Math.max(0, target.health - effectiveDamage)
  const killed = health <= 0
  const dx = target.x - attacker.x
  const dz = target.z - attacker.z
  const inverse = 1 / Math.max(0.001, Math.hypot(dx, dz))
  const nextPrey = state.prey.map((prey) => prey.id === preyId ? {
    ...prey,
    health,
    x: prey.x + dx * inverse * knockback * (target.kind === 'shell' ? 0.35 : 1),
    z: prey.z + dz * inverse * knockback * (target.kind === 'shell' ? 0.35 : 1),
    phase: killed ? 'dead' as const : 'stunned' as const,
    phaseElapsed: 0,
    attackResolved: false,
  } : prey)
  const biomassGained = killed ? spec.biomass : 0
  const genes = killed ? { ...state.genes, [spec.gene]: state.genes[spec.gene] + 1 } : state.genes
  const recentHunts = killed ? [...state.recentHunts, spec.gene].slice(-6) : state.recentHunts
  return {
    state: { ...state, prey: nextPrey, kills: state.kills + Number(killed), biomass: state.biomass + biomassGained, genes, recentHunts },
    effectiveDamage,
    blocked: shellFront,
    killed,
    biomassGained,
    geneGained: killed ? spec.gene : null,
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

function stepPrey(
  state: GloamwoodNestPrey,
  delta: number,
  player: GloamwoodPlayerPresence,
): { state: GloamwoodNestPrey; events: GloamwoodNestEvent[] } {
  if (state.phase === 'dead') return { state, events: [] }
  const spec = GLOAMWOOD_PREY[state.kind]
  let next = { ...state, phaseElapsed: state.phaseElapsed + delta }
  const events: GloamwoodNestEvent[] = []
  if (next.phase === 'stunned') {
    if (next.phaseElapsed >= spec.stunSeconds) next = enterPhase(next, 'chase')
    return { state: next, events }
  }
  if (!player.alive) return { state: enterPhase(next, 'chase'), events }

  const stopDistance = gloamwoodPreyStopDistance(state.kind, player.bodyRadius ?? 0)
  const slot = gloamwoodCombatSlotPosition(state.slot, state.kind, player, stopDistance)
  const desiredX = slot.x
  const desiredZ = slot.z
  const dx = desiredX - next.x
  const dz = desiredZ - next.z
  const playerDistance = Math.hypot(player.x - next.x, player.z - next.z)
  const attackDistance = Math.max(spec.attackRange, stopDistance + GLOAMWOOD_COMBAT_SPACING.strikeReach[state.kind])
  const desiredDistance = Math.hypot(dx, dz)
  const facing = Math.atan2(-(player.z - next.z), player.x - next.x)
  // A committed creature keeps the facing it chose when the telegraph began, so
  // telegraph/strike/recover form the window the onboarding's flank advice needs.
  // Uncommitted families keep re-acquiring every frame, exactly as before.
  if (!spec.commitsFacingWhileAttacking || next.phase === 'chase') {
    next.facingRadians = turnToward(next.facingRadians, facing, spec.turnSpeed * delta)
  }

  if (next.phase === 'chase') {
    if (desiredDistance <= GLOAMWOOD_COMBAT_SPACING.slotArrivalTolerance && playerDistance <= stopDistance + 0.18) {
      return { state: enterPhase(next, 'telegraph'), events }
    }
    if (desiredDistance > 0.001) {
      const currentAngle = Math.atan2(next.z - player.z, next.x - player.x)
      const targetAngle = Math.atan2(slot.z - player.z, slot.x - player.x)
      const radialStep = Math.min(Math.abs(playerDistance - stopDistance), spec.moveSpeed * delta)
      const nextRadius = Math.max(stopDistance, playerDistance + Math.sign(stopDistance - playerDistance) * radialStep)
      const angularStep = Math.min(
        Math.abs(shortestAngle(currentAngle, targetAngle)),
        spec.moveSpeed * delta / Math.max(stopDistance, playerDistance, 0.001),
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
      if (playerDistance <= attackDistance) events.push({ type: 'prey-attack', preyId: next.id, kind: next.kind, damage: spec.damage, knockback: spec.knockback })
    }
    if (next.phaseElapsed >= spec.strikeSeconds) next = enterPhase(next, 'recover')
    return { state: next, events }
  }
  if (next.phaseElapsed >= spec.recoverSeconds) next = enterPhase(next, 'chase')
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

export function resolveGloamwoodPreyAroundPlayer(
  prey: readonly GloamwoodNestPrey[],
  player: { x: number; z: number },
  playerBodyRadius: number,
) {
  return prey.map((target) => {
    if (target.phase === 'dead') return target
    let dx = target.x - player.x
    let dz = target.z - player.z
    let distance = Math.hypot(dx, dz)
    const minimum = gloamwoodPreyStopDistance(target.kind, playerBodyRadius)
    if (distance >= minimum - 0.000001) return target
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
    .map((target) => Math.hypot(position.x - target.x, position.z - target.z) - gloamwoodPreyStopDistance(target.kind, playerBodyRadius))
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

export function gloamwoodPreyStopDistance(kind: GloamwoodPreyKind, playerBodyRadius: number) {
  return Math.max(
    GLOAMWOOD_PREY[kind].stopRange,
    Math.max(0, playerBodyRadius) + GLOAMWOOD_PREY_BODY_RADII[kind] + GLOAMWOOD_COMBAT_SPACING.actionSpace[kind],
  )
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
