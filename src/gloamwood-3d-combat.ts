export type GloamwoodEnemyPhase = 'chase' | 'telegraph' | 'strike' | 'recover' | 'stunned' | 'dead' | 'respawning'

export type GloamwoodCombatEvent =
  | { type: 'enemy-attack'; damage: number; knockback: number }
  | { type: 'enemy-respawned' }

export interface GloamwoodEnemyCombatState {
  phase: GloamwoodEnemyPhase
  phaseElapsed: number
  health: number
  maxHealth: number
  x: number
  z: number
  spawnX: number
  spawnZ: number
  facingRadians: number
  attackResolved: boolean
}

export interface GloamwoodPlayerCombatState {
  health: number
  maxHealth: number
  alive: boolean
  invulnerabilitySeconds: number
  respawnSeconds: number
}

export const GLOAMWOOD_3D_COMBAT = {
  enemyMaxHealth: 74,
  enemyMoveSpeed: 2.3,
  enemyTurnSpeed: 5.2,
  enemyAttackRange: 2.45,
  enemyStopRange: 2.08,
  enemyTelegraphSeconds: 0.72,
  enemyStrikeSeconds: 0.34,
  enemyContactSeconds: 0.12,
  enemyRecoverSeconds: 0.78,
  enemyStunSeconds: 0.24,
  enemyDeathSeconds: 0.72,
  enemyDamage: 16,
  enemyKnockback: 1.45,
  enemyRespawnSeconds: 3.2,
  playerMaxHealth: 100,
  playerInvulnerabilitySeconds: 0.62,
  playerRespawnSeconds: 2.2,
  playerSpawnX: -6,
  playerSpawnZ: 3,
  attackDamage: { Bite: 16, Claw: 14, Pounce: 20, TailSwipe: 18 },
} as const

export function createGloamwoodEnemyCombatState(x = 1.4, z = -0.8): GloamwoodEnemyCombatState {
  return {
    phase: 'chase',
    phaseElapsed: 0,
    health: GLOAMWOOD_3D_COMBAT.enemyMaxHealth,
    maxHealth: GLOAMWOOD_3D_COMBAT.enemyMaxHealth,
    x,
    z,
    spawnX: x,
    spawnZ: z,
    facingRadians: Math.PI,
    attackResolved: false,
  }
}

export function createGloamwoodPlayerCombatState(): GloamwoodPlayerCombatState {
  return {
    health: GLOAMWOOD_3D_COMBAT.playerMaxHealth,
    maxHealth: GLOAMWOOD_3D_COMBAT.playerMaxHealth,
    alive: true,
    invulnerabilitySeconds: 0,
    respawnSeconds: 0,
  }
}

export function stepGloamwoodEnemyCombat(
  state: GloamwoodEnemyCombatState,
  deltaSeconds: number,
  player: { x: number; z: number; alive: boolean },
): { state: GloamwoodEnemyCombatState; events: GloamwoodCombatEvent[] } {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  let next = { ...state, phaseElapsed: state.phaseElapsed + delta }
  const events: GloamwoodCombatEvent[] = []

  if (next.phase === 'dead') {
    if (next.phaseElapsed >= GLOAMWOOD_3D_COMBAT.enemyDeathSeconds) {
      next.phase = 'respawning'
      next.phaseElapsed = 0
    }
    return { state: next, events }
  }
  if (next.phase === 'respawning') {
    if (next.phaseElapsed >= GLOAMWOOD_3D_COMBAT.enemyRespawnSeconds) {
      next = {
        ...next,
        phase: 'chase',
        phaseElapsed: 0,
        health: next.maxHealth,
        x: next.spawnX,
        z: next.spawnZ,
        attackResolved: false,
      }
      events.push({ type: 'enemy-respawned' })
    }
    return { state: next, events }
  }
  if (next.phase === 'stunned') {
    if (next.phaseElapsed >= GLOAMWOOD_3D_COMBAT.enemyStunSeconds) next = enterEnemyPhase(next, 'chase')
    return { state: next, events }
  }
  if (!player.alive) {
    if (next.phase !== 'chase') next = enterEnemyPhase(next, 'chase')
    return { state: next, events }
  }

  const dx = player.x - next.x
  const dz = player.z - next.z
  const distance = Math.hypot(dx, dz)
  const targetFacing = Math.atan2(-dz, dx)
  next.facingRadians = turnToward(next.facingRadians, targetFacing, GLOAMWOOD_3D_COMBAT.enemyTurnSpeed * delta)

  if (next.phase === 'chase') {
    if (distance <= GLOAMWOOD_3D_COMBAT.enemyStopRange) return { state: enterEnemyPhase(next, 'telegraph'), events }
    if (distance > 0.001) {
      const travel = Math.min(distance - GLOAMWOOD_3D_COMBAT.enemyStopRange, GLOAMWOOD_3D_COMBAT.enemyMoveSpeed * delta)
      next.x += dx / distance * Math.max(0, travel)
      next.z += dz / distance * Math.max(0, travel)
    }
    return { state: next, events }
  }
  if (next.phase === 'telegraph') {
    if (distance > GLOAMWOOD_3D_COMBAT.enemyAttackRange + 0.55) return { state: enterEnemyPhase(next, 'chase'), events }
    if (next.phaseElapsed >= GLOAMWOOD_3D_COMBAT.enemyTelegraphSeconds) next = enterEnemyPhase(next, 'strike')
    return { state: next, events }
  }
  if (next.phase === 'strike') {
    if (!next.attackResolved && next.phaseElapsed >= GLOAMWOOD_3D_COMBAT.enemyContactSeconds) {
      next.attackResolved = true
      if (distance <= GLOAMWOOD_3D_COMBAT.enemyAttackRange) {
        events.push({ type: 'enemy-attack', damage: GLOAMWOOD_3D_COMBAT.enemyDamage, knockback: GLOAMWOOD_3D_COMBAT.enemyKnockback })
      }
    }
    if (next.phaseElapsed >= GLOAMWOOD_3D_COMBAT.enemyStrikeSeconds) next = enterEnemyPhase(next, 'recover')
    return { state: next, events }
  }
  if (next.phaseElapsed >= GLOAMWOOD_3D_COMBAT.enemyRecoverSeconds) next = enterEnemyPhase(next, 'chase')
  return { state: next, events }
}

export function damageGloamwoodEnemy(
  state: GloamwoodEnemyCombatState,
  damage: number,
  knockback: { x: number; z: number },
) {
  if (state.phase === 'dead' || state.phase === 'respawning') return state
  const health = Math.max(0, state.health - Math.max(0, damage))
  return {
    ...state,
    health,
    x: state.x + knockback.x,
    z: state.z + knockback.z,
    phase: health <= 0 ? 'dead' as const : 'stunned' as const,
    phaseElapsed: 0,
    attackResolved: false,
  }
}

/**
 * What a blow actually costs the player.
 *
 * Percentage reduction first, then flat armour, then a floor of one - so armour
 * is never immunity however much of it is stacked, and the order is fixed here
 * rather than left to whichever caller applies which.
 */
export function gloamwoodPlayerDamageTaken(rawDamage: number, reduction: number, flatArmour: number) {
  const scaled = Math.round(Math.max(0, rawDamage) * (1 - Math.max(0, Math.min(0.95, reduction))))
  return Math.max(1, scaled - Math.max(0, flatArmour))
}

export function damageGloamwoodPlayer(state: GloamwoodPlayerCombatState, damage: number) {
  if (!state.alive || state.invulnerabilitySeconds > 0) return state
  const health = Math.max(0, state.health - Math.max(0, damage))
  return {
    ...state,
    health,
    alive: health > 0,
    invulnerabilitySeconds: health > 0 ? GLOAMWOOD_3D_COMBAT.playerInvulnerabilitySeconds : 0,
    respawnSeconds: health > 0 ? 0 : GLOAMWOOD_3D_COMBAT.playerRespawnSeconds,
  }
}

export function stepGloamwoodPlayerCombat(state: GloamwoodPlayerCombatState, deltaSeconds: number) {
  const delta = Math.max(0, Math.min(0.05, deltaSeconds))
  if (state.alive) return { ...state, invulnerabilitySeconds: Math.max(0, state.invulnerabilitySeconds - delta) }
  const respawnSeconds = Math.max(0, state.respawnSeconds - delta)
  return respawnSeconds > 0
    ? { ...state, respawnSeconds }
    : { ...createGloamwoodPlayerCombatState() }
}

function enterEnemyPhase(state: GloamwoodEnemyCombatState, phase: GloamwoodEnemyPhase) {
  return { ...state, phase, phaseElapsed: 0, attackResolved: false }
}

function turnToward(current: number, target: number, maximum: number) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current))
  if (Math.abs(difference) <= maximum) return target
  return current + Math.sign(difference) * maximum
}
