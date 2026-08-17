import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_3D_COMBAT,
  createGloamwoodEnemyCombatState,
  createGloamwoodPlayerCombatState,
  damageGloamwoodEnemy,
  damageGloamwoodPlayer,
  stepGloamwoodEnemyCombat,
  stepGloamwoodPlayerCombat,
} from '../src/gloamwood-3d-combat'

describe('Gloamwood 3D first combat encounter', () => {
  it('chases, telegraphs, strikes once and recovers before another attack', () => {
    let state = createGloamwoodEnemyCombatState(0, 0)
    const player = { x: 2, z: 0, alive: true }
    state = stepGloamwoodEnemyCombat(state, 1 / 60, player).state
    expect(state.phase).toBe('telegraph')
    for (let index = 0; index < 46; index += 1) state = stepGloamwoodEnemyCombat(state, 1 / 60, player).state
    expect(state.phase).toBe('strike')
    const events = []
    for (let index = 0; index < 22; index += 1) {
      const frame = stepGloamwoodEnemyCombat(state, 1 / 60, player)
      state = frame.state
      events.push(...frame.events)
    }
    expect(events.filter((event) => event.type === 'enemy-attack')).toHaveLength(1)
    expect(state.phase).toBe('recover')
  })

  it('cancels the telegraph when the player leaves the readable attack zone', () => {
    let state = createGloamwoodEnemyCombatState(0, 0)
    state = stepGloamwoodEnemyCombat(state, 1 / 60, { x: 2, z: 0, alive: true }).state
    expect(state.phase).toBe('telegraph')
    state = stepGloamwoodEnemyCombat(state, 1 / 60, { x: 8, z: 0, alive: true }).state
    expect(state.phase).toBe('chase')
  })

  it('takes authoritative damage, enters hit stun, dies and respawns at its spawn', () => {
    let state = createGloamwoodEnemyCombatState(3, -2)
    state = damageGloamwoodEnemy(state, 14, { x: 0.4, z: 0 })
    expect(state.phase).toBe('stunned')
    expect(state.health).toBe(GLOAMWOOD_3D_COMBAT.enemyMaxHealth - 14)
    state = damageGloamwoodEnemy(state, 1000, { x: 0.8, z: 0 })
    expect(state.phase).toBe('dead')
    state = stepGloamwoodEnemyCombat(state, 0.05, { x: 0, z: 0, alive: true }).state
    expect(state.phase).toBe('dead')
    for (let index = 0; index < 14; index += 1) state = stepGloamwoodEnemyCombat(state, 0.05, { x: 0, z: 0, alive: true }).state
    expect(state.phase).toBe('respawning')
    for (let index = 0; index < 65; index += 1) state = stepGloamwoodEnemyCombat(state, 0.05, { x: 0, z: 0, alive: true }).state
    expect(state).toMatchObject({ phase: 'chase', health: state.maxHealth, x: 3, z: -2 })
  })

  it('gives the player invulnerability after a hit and a deterministic death respawn', () => {
    let player = damageGloamwoodPlayer(createGloamwoodPlayerCombatState(), 16)
    player = damageGloamwoodPlayer(player, 16)
    expect(player.health).toBe(84)
    for (let index = 0; index < 13; index += 1) player = stepGloamwoodPlayerCombat(player, 0.05)
    player = damageGloamwoodPlayer(player, 1000)
    expect(player.alive).toBe(false)
    for (let index = 0; index < 45; index += 1) player = stepGloamwoodPlayerCombat(player, 0.05)
    expect(player).toMatchObject({ alive: true, health: GLOAMWOOD_3D_COMBAT.playerMaxHealth })
  })
})
