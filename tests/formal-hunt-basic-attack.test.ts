import { describe, expect, it } from 'vitest'
import {
  canFormalHuntBasicAttackContact,
  cancelFormalHuntBasicAttack,
  createFormalHuntBasicAttackState,
  formalHuntAttackAimErrorDegrees,
  formalHuntTargetSurfaceDistance,
  requestFormalHuntBasicAttack,
  turnFormalHuntAttackToward,
  updateFormalHuntBasicAttack,
} from '../src/formal-hunt-basic-attack'
import { SCARLET_HUNTER_PRESENTATION } from '../src/scarlet-hunter-character-presentation'

describe('formal hunt coral-gecko basic attack chain', () => {
  it('cycles quick Bite, weighted leap Bite and TailSwipe on one primary input', () => {
    let state = requestFormalHuntBasicAttack(createFormalHuntBasicAttackState(), 1000)
    expect(state.action).toBe('Bite')
    let update = updateFormalHuntBasicAttack(state, 1300, false)
    expect(update.contactAction).toBe('Bite')
    state = requestFormalHuntBasicAttack(update.state, 1320)
    expect(state.buffered).toBe(true)
    state = updateFormalHuntBasicAttack(state, 1600, false).state
    expect(state.action).toBe('Pounce')
    state = updateFormalHuntBasicAttack(state, 2500, true).state
    expect(state.action).toBe('TailSwipe')
    state = updateFormalHuntBasicAttack(state, 3370, true).state
    expect(state.action).toBe('Bite')
  })

  it('buffers exactly one next action and resets to Bite after idle', () => {
    let state = requestFormalHuntBasicAttack(createFormalHuntBasicAttackState(), 0)
    state = requestFormalHuntBasicAttack(state, 100)
    state = requestFormalHuntBasicAttack(state, 110)
    expect(state.buffered).toBe(true)
    state = updateFormalHuntBasicAttack(state, 600, false).state
    expect(state.action).toBe('Pounce')
    state = updateFormalHuntBasicAttack(state, 1500, false).state
    expect(state.action).toBeNull()
    state = updateFormalHuntBasicAttack(state, 2650, false).state
    expect(state.comboStep).toBe(0)
    expect(requestFormalHuntBasicAttack(state, 2670).action).toBe('Bite')
  })

  it('cancels an active or buffered chain when movement takes priority', () => {
    let state = requestFormalHuntBasicAttack(createFormalHuntBasicAttackState(), 1000)
    state = requestFormalHuntBasicAttack(state, 1040)
    expect(state).toMatchObject({ action: 'Bite', buffered: true })

    state = cancelFormalHuntBasicAttack(state)
    expect(state).toMatchObject({ action: null, buffered: false, comboStep: 0, resetAt: 0 })
    expect(requestFormalHuntBasicAttack(state, 1080).action).toBe('Bite')
  })

  it('emits each authoritative contact once at the accepted clip timing', () => {
    const state = requestFormalHuntBasicAttack(createFormalHuntBasicAttackState(), 2000)
    expect(updateFormalHuntBasicAttack(state, 2299, false).contactAction).toBeNull()
    const contact = updateFormalHuntBasicAttack(state, 2300, false)
    expect(contact.contactAction).toBe('Bite')
    expect(updateFormalHuntBasicAttack(contact.state, 2350, false).contactAction).toBeNull()
  })

  it('resolves the juvenile leap bite once at its own heavy contact timing', () => {
    let state = requestFormalHuntBasicAttack(createFormalHuntBasicAttackState(), 1000)
    state = updateFormalHuntBasicAttack(state, 1600, true).state
    expect(state.action).toBe('Pounce')
    expect(updateFormalHuntBasicAttack(state, 2029, false).contactAction).toBeNull()
    const contact = updateFormalHuntBasicAttack(state, 2030, false)
    expect(contact.contactAction).toBe('Pounce')
    expect(updateFormalHuntBasicAttack(contact.state, 2060, false).contactAction).toBeNull()
  })

  it('requires the same selected live target, range and eight-degree contact tolerance', () => {
    expect(canFormalHuntBasicAttackContact({
      targetLocked: true, targetAvailable: true, distance: 110, range: 118, aimErrorDegrees: 8,
    })).toBe(true)
    expect(canFormalHuntBasicAttackContact({
      targetLocked: false, targetAvailable: true, distance: 110, range: 118, aimErrorDegrees: 0,
    })).toBe(false)
    expect(canFormalHuntBasicAttackContact({
      targetLocked: true, targetAvailable: false, distance: 110, range: 118, aimErrorDegrees: 0,
    })).toBe(false)
    expect(canFormalHuntBasicAttackContact({
      targetLocked: true, targetAvailable: true, distance: 119, range: 118, aimErrorDegrees: 0,
    })).toBe(false)
    expect(canFormalHuntBasicAttackContact({
      targetLocked: true, targetAvailable: true, distance: 110, range: 118, aimErrorDegrees: 8.01,
    })).toBe(false)
  })

  it('measures large-target contact from its hurt surface instead of an unreachable centre', () => {
    expect(formalHuntTargetSurfaceDistance(180, 68)).toBe(112)
    expect(canFormalHuntBasicAttackContact({
      targetLocked: true,
      targetAvailable: true,
      distance: 180,
      targetRadius: 68,
      range: 118,
      aimErrorDegrees: 0,
    })).toBe(true)
    expect(canFormalHuntBasicAttackContact({
      targetLocked: true,
      targetAvailable: true,
      distance: 187,
      targetRadius: 68,
      range: 118,
      aimErrorDegrees: 0,
    })).toBe(false)
  })

  it('turns toward the lock at twelve radians per second without overshoot', () => {
    const target = Math.PI / 2
    const first = turnFormalHuntAttackToward(0, target, 0.05)
    expect(first).toBeCloseTo(0.6)
    const arrived = turnFormalHuntAttackToward(first, target, 0.2)
    expect(arrived).toBeCloseTo(target)
    expect(formalHuntAttackAimErrorDegrees(arrived, target)).toBeCloseTo(0)
  })

  it('gives stage 2 a separately timed claw, double-claw leap and spinning tail-swipe chain', () => {
    const profile = SCARLET_HUNTER_PRESENTATION.combat
    let state = requestFormalHuntBasicAttack(createFormalHuntBasicAttackState(), 1000, profile)
    expect(state.action).toBe('Claw')
    expect(updateFormalHuntBasicAttack(state, 1219, false, profile).contactAction).toBeNull()
    const clawContact = updateFormalHuntBasicAttack(state, 1220, false, profile)
    expect(clawContact.contactAction).toBe('Claw')
    state = updateFormalHuntBasicAttack(clawContact.state, 1620, true, profile).state
    expect(state.action).toBe('Pounce')
    expect(updateFormalHuntBasicAttack(state, 2039, false, profile).contactAction).toBeNull()
    const pounceContact = updateFormalHuntBasicAttack(state, 2040, false, profile)
    expect(pounceContact.contactAction).toBe('Pounce')
    expect(updateFormalHuntBasicAttack(pounceContact.state, 2200, false, profile).contactAction).toBeNull()
    state = updateFormalHuntBasicAttack(pounceContact.state, 2440, true, profile).state
    expect(state.action).toBe('TailSwipe')
    expect(profile.attackNames).toEqual({ Pounce: '双爪跃扑', Claw: '裂爪', TailSwipe: '旋身尾扫' })
    expect(profile.pounceMotion).toMatchObject({ contactSeconds: 0.42, visualTravel: 0.72, damageEvents: 1 })
    expect(profile.skillsEnabled).toBe(false)
  })
})
