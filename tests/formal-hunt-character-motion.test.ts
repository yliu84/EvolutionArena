import { describe, expect, it } from 'vitest'
import {
  FORMAL_HUNT_CHARACTER_MOTION,
  createFormalHuntCharacterMotionState,
  stepFormalHuntCharacterMotion,
} from '../src/formal-hunt-character-motion'

describe('formal hunt character presentation motion', () => {
  it('eases into a readable run instead of snapping from idle', () => {
    const state = createFormalHuntCharacterMotionState()
    const first = stepFormalHuntCharacterMotion(state, true, 1 / 60)
    expect(state.locomotionBlend).toBeGreaterThan(0)
    expect(state.locomotionBlend).toBeLessThan(1)
    expect(Math.abs(first.stride)).toBeGreaterThan(0)
    for (let index = 0; index < 45; index += 1) stepFormalHuntCharacterMotion(state, true, 1 / 60)
    expect(state.locomotionBlend).toBeGreaterThan(0.98)
  })

  it('adds contact compression and a denser shadow only while planted', () => {
    const state = createFormalHuntCharacterMotionState()
    state.locomotionBlend = 1
    state.runPhase = 0
    const planted = stepFormalHuntCharacterMotion(state, true, 0)
    state.runPhase = Math.PI / 2
    const airborne = stepFormalHuntCharacterMotion(state, true, 0)
    expect(planted.verticalScale).toBeLessThan(airborne.verticalScale)
    expect(planted.shadowOpacity).toBeGreaterThan(airborne.shadowOpacity)
    expect(planted.shadowScale).toBeLessThan(airborne.shadowScale)
  })

  it('settles below rest briefly after movement stops and returns to rest', () => {
    const state = createFormalHuntCharacterMotionState()
    stepFormalHuntCharacterMotion(state, true, 1 / 60)
    const stopping = stepFormalHuntCharacterMotion(state, false, 1 / 60)
    expect(state.stopSettleRemaining).toBeGreaterThan(0)
    expect(stopping.settle).toBeGreaterThan(0)
    for (let index = 0; index < 30; index += 1) stepFormalHuntCharacterMotion(state, false, 1 / 60)
    const rested = stepFormalHuntCharacterMotion(state, false, 1 / 60)
    expect(state.stopSettleRemaining).toBe(0)
    expect(rested.settle).toBe(0)
    expect(FORMAL_HUNT_CHARACTER_MOTION.stopSettleSeconds).toBeLessThan(0.3)
  })
})
