import { describe, expect, it } from 'vitest'
import {
  BLOODLEECH_ANIMATIONS,
  BLOODLEECH_ATLAS,
  POUNCER_ANIMATIONS,
  POUNCER_ATLAS,
  RAZORWING_ANIMATIONS,
  RAZORWING_ATLAS,
  RIFTWEAVER_ANIMATIONS,
  RIFTWEAVER_ATLAS,
  SHELLBACK_ANIMATIONS,
  SHELLBACK_ATLAS,
  SPITTER_ANIMATIONS,
  SPITTER_ATLAS,
  monsterAnimationForAiState,
  monsterAnimationKey,
  monsterTexture,
  pouncerAnimationForAiState,
} from '../src/monster-animation'

describe('pouncer animation atlas', () => {
  it('uses a complete non-overlapping 4x4 frame budget', () => {
    const frames = Object.values(POUNCER_ANIMATIONS).flatMap((animation) => animation.frames)
    expect(POUNCER_ATLAS.frameWidth).toBe(313)
    expect(POUNCER_ATLAS.frameHeight).toBe(313)
    expect(Math.min(...frames)).toBe(0)
    expect(Math.max(...frames)).toBe(15)
    expect(new Set(frames)).toEqual(new Set(Array.from({ length: 16 }, (_, index) => index)))
  })

  it('maps authoritative AI states to presentation clips', () => {
    expect(pouncerAnimationForAiState('pursue', 140)).toBe('move')
    expect(pouncerAnimationForAiState('pursue', 0)).toBe('idle')
    expect(pouncerAnimationForAiState('telegraph', 0)).toBe('telegraph')
    expect(pouncerAnimationForAiState('attack', 540)).toBe('attack')
    expect(pouncerAnimationForAiState('recover', 0)).toBe('recover')
    expect(pouncerAnimationForAiState('attack', 540, true)).toBe('hit')
  })

  it('only replaces the selected monster texture', () => {
    expect(monsterTexture('pouncer', 'fallback')).toBe(POUNCER_ATLAS.key)
    expect(monsterTexture('razorwing', 'fallback')).toBe(RAZORWING_ATLAS.key)
    expect(monsterTexture('shellback', 'fallback')).toBe(SHELLBACK_ATLAS.key)
    expect(monsterTexture('bloodleech', 'fallback')).toBe(BLOODLEECH_ATLAS.key)
    expect(monsterTexture('spitter', 'fallback')).toBe(SPITTER_ATLAS.key)
    expect(monsterTexture('riftweaver', 'fallback')).toBe(RIFTWEAVER_ATLAS.key)
    expect(monsterTexture('mantis', 'monster-mantis')).toBe('monster-mantis')
  })
})

describe('riftweaver animation atlas', () => {
  it('covers all sixteen frames and exposes spatial charge and fracture clips', () => {
    const frames = Object.values(RIFTWEAVER_ANIMATIONS).flatMap((animation) => animation.frames)
    expect(RIFTWEAVER_ATLAS.frameWidth).toBe(313)
    expect(RIFTWEAVER_ATLAS.frameHeight).toBe(313)
    expect(new Set(frames)).toEqual(new Set(Array.from({ length: 16 }, (_, index) => index)))
    expect(monsterAnimationKey('riftweaver', 'telegraph')).toBe('riftweaver-charge')
    expect(monsterAnimationKey('riftweaver', 'attack')).toBe('riftweaver-fan')
    expect(monsterAnimationKey('riftweaver', 'death')).toBe('riftweaver-fracture')
  })
})

describe('spitter animation atlas', () => {
  it('covers all sixteen frames and exposes a distinct charge and discharge', () => {
    const frames = Object.values(SPITTER_ANIMATIONS).flatMap((animation) => animation.frames)
    expect(SPITTER_ATLAS.frameWidth).toBe(313)
    expect(SPITTER_ATLAS.frameHeight).toBe(313)
    expect(new Set(frames)).toEqual(new Set(Array.from({ length: 16 }, (_, index) => index)))
    expect(SPITTER_ANIMATIONS.move.frameRate).toBeGreaterThan(SPITTER_ANIMATIONS.telegraph.frameRate)
    expect(monsterAnimationKey('spitter', 'telegraph')).toBe('spitter-charge')
    expect(monsterAnimationKey('spitter', 'attack')).toBe('spitter-discharge')
  })
})

describe('bloodleech animation atlas', () => {
  it('covers all sixteen frames and keeps its drain faster than locomotion', () => {
    const frames = Object.values(BLOODLEECH_ANIMATIONS).flatMap((animation) => animation.frames)
    expect(BLOODLEECH_ATLAS.frameWidth).toBe(313)
    expect(BLOODLEECH_ATLAS.frameHeight).toBe(313)
    expect(new Set(frames)).toEqual(new Set(Array.from({ length: 16 }, (_, index) => index)))
    expect(BLOODLEECH_ANIMATIONS.attack.frameRate).toBeGreaterThan(BLOODLEECH_ANIMATIONS.move.frameRate)
    expect(monsterAnimationKey('bloodleech', 'telegraph')).toBe('bloodleech-open-maw')
    expect(monsterAnimationKey('bloodleech', 'death')).toBe('bloodleech-rupture')
  })
})

describe('shellback animation atlas', () => {
  it('covers all sixteen frames and presents a readable heavy brace cycle', () => {
    const frames = Object.values(SHELLBACK_ANIMATIONS).flatMap((animation) => animation.frames)
    expect(SHELLBACK_ATLAS.frameWidth).toBe(313)
    expect(SHELLBACK_ATLAS.frameHeight).toBe(313)
    expect(new Set(frames)).toEqual(new Set(Array.from({ length: 16 }, (_, index) => index)))
    expect(SHELLBACK_ANIMATIONS.move.frameRate).toBeLessThan(RAZORWING_ANIMATIONS.move.frameRate)
    expect(monsterAnimationForAiState('brace', 0)).toBe('attack')
    expect(monsterAnimationKey('shellback', 'telegraph')).toBe('shellback-brace')
  })
})

describe('razorwing animation atlas', () => {
  it('covers all sixteen atlas frames and exposes dash clips', () => {
    const frames = Object.values(RAZORWING_ANIMATIONS).flatMap((animation) => animation.frames)
    expect(RAZORWING_ATLAS.frameWidth).toBe(313)
    expect(RAZORWING_ATLAS.frameHeight).toBe(313)
    expect(new Set(frames)).toEqual(new Set(Array.from({ length: 16 }, (_, index) => index)))
    expect(RAZORWING_ANIMATIONS.attack.frameRate).toBeGreaterThan(RAZORWING_ANIMATIONS.move.frameRate)
    expect(monsterAnimationKey('razorwing', 'attack')).toBe('razorwing-dash')
  })
})
