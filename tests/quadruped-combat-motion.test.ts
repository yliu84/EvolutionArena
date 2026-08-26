import { describe, expect, it } from 'vitest'

import { juvenileLeapBiteMotionFrame, juvenileSpinTailSwipeMotionFrame, quadrupedAttackMotionFrame, quadrupedPounceFrame } from '../src/quadruped-combat-motion'

describe('reusable quadruped pounce presentation', () => {
  it('launches forward to one stable peak and returns without moving authority', () => {
    const start = quadrupedPounceFrame(0, 0.82, 0.72)
    const peak = quadrupedPounceFrame(0.41, 0.82, 0.72)
    const end = quadrupedPounceFrame(0.82, 0.82, 0.72)
    expect(start).toEqual({ progress: 0, forwardOffset: 0, liftOffset: 0 })
    expect(peak.progress).toBeCloseTo(0.5)
    expect(peak.forwardOffset).toBeCloseTo(0.72)
    expect(peak.liftOffset).toBeCloseTo(0.08)
    expect(end.forwardOffset).toBeCloseTo(0)
    expect(end.liftOffset).toBeCloseTo(0)
  })
})

describe('stage-two quadruped attack silhouettes', () => {
  it('raises the chest before claw contact and drives decisively through the target', () => {
    const windup = quadrupedAttackMotionFrame('Claw', 0.1, 0.62, 0.22)
    const contact = quadrupedAttackMotionFrame('Claw', 0.22, 0.62, 0.22)
    expect(windup.liftOffset).toBeGreaterThan(0.12)
    expect(windup.pitchRadians).toBeGreaterThan(0.12)
    expect(contact.forwardOffset).toBeGreaterThan(0.3)
  })

  it('gives pounce a larger airborne read without moving gameplay authority', () => {
    const windup = quadrupedAttackMotionFrame('Pounce', 0.21, 0.82, 0.42)
    const contact = quadrupedAttackMotionFrame('Pounce', 0.42, 0.82, 0.42)
    expect(windup.liftOffset).toBeGreaterThan(0.12)
    expect(contact.forwardOffset).toBeGreaterThan(0.9)
  })

  it('coils and snaps tail swipe on a different axis from claw and pounce', () => {
    const coil = quadrupedAttackMotionFrame('TailSwipe', 0.28, 1.1, 0.56)
    const contact = quadrupedAttackMotionFrame('TailSwipe', 0.56, 1.1, 0.56)
    expect(coil.yawRadians).toBeLessThan(-0.2)
    expect(contact.yawRadians).toBeGreaterThan(0.3)
  })

  it('returns every root-only envelope to a neutral pose', () => {
    for (const action of ['Claw', 'Pounce', 'TailSwipe'] as const) {
      const end = quadrupedAttackMotionFrame(action, 2, 1, 0.5)
      expect(end.forwardOffset).toBe(0)
      expect(end.liftOffset).toBe(0)
      expect(end.pitchRadians).toBe(0)
      expect(end.yawRadians).toBe(0)
      expect(end.forwardScale).toBe(1)
      expect(end.verticalScale).toBe(1)
      expect(end.widthScale).toBe(1)
    }
  })
})

describe('deformation-safe stage-zero attack envelopes', () => {
  it('keeps Bite readable through root motion without requiring non-uniform scale', () => {
    const contact = quadrupedAttackMotionFrame('Bite', 0.3, 0.6, 0.3)
    expect(contact.forwardOffset).toBeGreaterThan(0.2)
    expect(contact.liftOffset).toBeGreaterThan(0)
    // Runtime intentionally ignores these artistic squash values for the
    // repaired stage-zero rig and applies one scalar root scale instead.
    expect(contact.forwardScale).toBeGreaterThan(1)
  })

  it('reads as a heavy crouch, launch, bite contact and compressed landing without non-uniform scale', () => {
    const crouch = juvenileLeapBiteMotionFrame(0.14, 0.9)
    const launch = juvenileLeapBiteMotionFrame(0.34, 0.9)
    const contact = juvenileLeapBiteMotionFrame(0.43, 0.9)
    const landing = juvenileLeapBiteMotionFrame(0.613, 0.9)

    expect(crouch.phase).toBe('crouch')
    expect(crouch.liftOffset).toBe(0)
    expect(launch.phase).toBe('launch')
    expect(launch.liftOffset).toBeGreaterThan(0.15)
    expect(contact.forwardOffset).toBeGreaterThan(0.7)
    expect(contact.pitchRadians).toBeLessThan(0)
    expect(landing.phase).toBe('recover')
    expect(landing.liftOffset).toBeGreaterThanOrEqual(0)
    expect(landing.landingStrength).toBeGreaterThan(0.9)
    for (const frame of [crouch, launch, contact, landing]) {
      expect(frame.forwardScale).toBe(1)
      expect(frame.verticalScale).toBe(1)
      expect(frame.widthScale).toBe(1)
    }
  })

  it('keeps the feet above the terrain through crouch, landing, and recovery', () => {
    for (const elapsed of [0.08, 0.14, 0.58, 0.613, 0.72, 0.84]) {
      expect(juvenileLeapBiteMotionFrame(elapsed, 0.9).liftOffset).toBeGreaterThanOrEqual(0)
    }
  })

  it('coils, crosses the target tail-first at contact, and completes one full-body turn', () => {
    const coil = juvenileSpinTailSwipeMotionFrame(0.08, 0.87, 0.4)
    const contact = juvenileSpinTailSwipeMotionFrame(0.4, 0.87, 0.4)
    const followThrough = juvenileSpinTailSwipeMotionFrame(0.72, 0.87, 0.4)
    const end = juvenileSpinTailSwipeMotionFrame(0.87, 0.87, 0.4)

    expect(coil.phase).toBe('coil')
    expect(coil.yawRadians).toBeLessThan(0)
    expect(contact.yawRadians).toBeCloseTo(Math.PI)
    expect(contact.impactStrength).toBeGreaterThan(0.9)
    expect(followThrough.yawRadians).toBeGreaterThan(Math.PI * 1.8)
    expect(end.yawRadians).toBe(0)
    expect(end.spinProgress).toBe(1)
  })

  it('returns exactly to neutral after the weighted landing recovery', () => {
    const end = juvenileLeapBiteMotionFrame(0.9, 0.9)
    expect(end.phase).toBe('ready')
    expect(end.forwardOffset).toBe(0)
    expect(end.liftOffset).toBe(0)
    expect(end.pitchRadians).toBe(0)
    expect(end.landingStrength).toBe(0)
  })
})

describe('the leap falls like something with weight', () => {
  const at = (progress: number) => juvenileLeapBiteMotionFrame(progress, 1)

  it('does not step down at the contact frame', () => {
    // The launch arc exits at 0.3 * sin(0.74pi) = 0.219 and the descent used to
    // start from 0.19, so the body dropped a visible step at the exact frame the
    // blow lands - the one frame nobody is going to miss.
    const lastAir = at(0.4779)
    const firstFall = at(0.4781)
    expect(Math.abs(lastAir.liftOffset - firstFall.liftOffset)).toBeLessThan(0.01)
  })

  it('accelerates downward instead of easing into the floor', () => {
    // Smoothstep is slow at both ends, so the old descent arrived at the ground
    // at its slowest. A falling body is fastest at the instant it lands, and
    // that is where the whole sense of weight comes from.
    const contact = 0.478
    const landing = 0.68
    const span = landing - contact
    const drop = (from: number, to: number) =>
      at(contact + span * from).liftOffset - at(contact + span * to).liftOffset
    const early = drop(0, 0.2)
    const late = drop(0.8, 1)
    expect(late).toBeGreaterThan(early)
  })

  it('is on the ground by the landing frame and stays there', () => {
    expect(at(0.6799).liftOffset).toBeGreaterThanOrEqual(0)
    expect(at(0.6799).liftOffset).toBeLessThan(0.01)
    expect(at(0.8).liftOffset).toBe(0)
  })

  it('still leaves the ground at all', () => {
    // The guard against fixing the fall by flattening the leap.
    const peak = Math.max(...Array.from({ length: 40 }, (_, i) => at(0.22 + (i / 40) * 0.46).liftOffset))
    expect(peak).toBeGreaterThan(0.25)
  })
})
