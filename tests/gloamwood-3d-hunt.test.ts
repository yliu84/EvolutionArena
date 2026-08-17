import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_3D_CAMERA_DISTANCE,
  assistGloamwoodAttackerLock,
  gloamwoodPlayerHitKnockbackDistance,
  nextGloamwoodLockTarget,
  stopGloamwoodActionsExcept,
  gloamwoodCharacterWorldHeight,
  gloamwoodStageOnePounceFrame,
  isGloamwood3DHuntRequested,
} from '../src/gloamwood-3d-hunt'

describe('Gloamwood 3D rebuild routing', () => {
  it('retires the live MapLab V4 entry into the new 3D world', () => {
    expect(isGloamwood3DHuntRequested('?maplab=4&live=1')).toBe(true)
    expect(isGloamwood3DHuntRequested('?maplab=4&live=1&mother=1&evolutionStage=2')).toBe(true)
  })

  it('keeps the old non-live map lab available only as historical tooling', () => {
    expect(isGloamwood3DHuntRequested('?maplab=4')).toBe(false)
  })

  it('supports a stable explicit entry for the rebuilt map', () => {
    expect(isGloamwood3DHuntRequested('?maplab=5')).toBe(true)
    expect(isGloamwood3DHuntRequested('?world3d=1')).toBe(true)
  })

  it('keeps the player combat-readable while preserving visible evolution growth', () => {
    expect(gloamwoodCharacterWorldHeight(0)).toBe(1.8)
    expect(gloamwoodCharacterWorldHeight(1) / gloamwoodCharacterWorldHeight(0)).toBeCloseTo(1.2)
    expect(gloamwoodCharacterWorldHeight(2) / gloamwoodCharacterWorldHeight(1)).toBeCloseTo(1.18, 2)
    expect(gloamwoodCharacterWorldHeight(2)).toBeLessThan(2.9)
    expect(GLOAMWOOD_3D_CAMERA_DISTANCE).toBeGreaterThan(20)
  })

  it('gives stage one a clearly airborne pounce without expanding horizontal overlap', () => {
    const launch = gloamwoodStageOnePounceFrame(0.36, 0.9)
    expect(launch.phase).toBe('launch')
    expect(launch.liftOffset).toBeGreaterThan(0.4)
    expect(launch.forwardOffset).toBeLessThan(0.25)
  })

  it('clears every residual one-shot animation before returning to locomotion', () => {
    const stopped: string[] = []
    const keep = { stop: () => stopped.push('keep') }
    const clampedBite = { stop: () => stopped.push('bite') }
    const clampedTailSwipe = { stop: () => stopped.push('tail') }
    const inactive = { stop: () => stopped.push('inactive') }

    stopGloamwoodActionsExcept([keep, clampedBite, clampedTailSwipe, inactive], keep)

    expect(stopped).toEqual(['bite', 'tail', 'inactive'])
  })

  it('keeps routine swarm contacts from pushing the player across the arena', () => {
    expect(gloamwoodPlayerHitKnockbackDistance('swarm', 0.52, 0)).toBeLessThan(0.05)
    expect(gloamwoodPlayerHitKnockbackDistance('fang', 1.05, 0)).toBeCloseTo(0.273)
    expect(gloamwoodPlayerHitKnockbackDistance('shell', 1.75, 0)).toBeCloseTo(0.595)
    expect(gloamwoodPlayerHitKnockbackDistance('shell', 1.75, 0.3)).toBeLessThan(0.2)
  })

  it('locks the nearest threat first and cycles in stable spawn order', () => {
    const prey = [
      { id: 'far', kind: 'fang', phase: 'chase', phaseElapsed: 0, health: 10, maxHealth: 10, x: 5, z: 0, facingRadians: 0, attackResolved: false, slot: 0 },
      { id: 'near', kind: 'swarm', phase: 'strike', phaseElapsed: 0, health: 10, maxHealth: 10, x: 1, z: 0, facingRadians: 0, attackResolved: false, slot: 1 },
      { id: 'middle', kind: 'shell', phase: 'telegraph', phaseElapsed: 0, health: 10, maxHealth: 10, x: 3, z: 0, facingRadians: 0, attackResolved: false, slot: 2 },
    ] as const
    expect(nextGloamwoodLockTarget(prey, null, { x: 0, z: 0 })).toBe('near')
    expect(nextGloamwoodLockTarget(prey, 'near', { x: 0, z: 0 })).toBe('middle')
    expect(nextGloamwoodLockTarget(prey, 'middle', { x: 0, z: 0 })).toBe('far')
  })

  it('assists an attacker lock only when it will not replace a live deliberate target', () => {
    const prey = [
      { id: 'chosen', kind: 'fang', phase: 'chase', phaseElapsed: 0, health: 10, maxHealth: 10, x: 2, z: 0, facingRadians: 0, attackResolved: false, slot: 0 },
      { id: 'attacker', kind: 'swarm', phase: 'strike', phaseElapsed: 0, health: 10, maxHealth: 10, x: 1, z: 0, facingRadians: 0, attackResolved: true, slot: 1 },
    ] as const
    expect(assistGloamwoodAttackerLock(prey, null, 'attacker')).toBe('attacker')
    expect(assistGloamwoodAttackerLock(prey, 'chosen', 'attacker')).toBe('chosen')
  })
})

describe('Evolution accent placeholder', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('only bolts the procedural accent onto a route with no body of its own', () => {
    // Shell now loads its own plated model, so the grey-green dodecahedron
    // plates would sit on top of real armour as floating decoration.
    expect(source).toContain('if (!this.characterFamilyMatched) this.createEvolutionAccent(candidate.family)')
    expect(source).not.toMatch(/^\s*this\.createEvolutionAccent\(candidate\.family\)$/m)
  })

  it('gives the Shell form its own world height rather than the stage default', () => {
    // A low, long body normalised to the 2.16 stage height inflates to 6.98 long.
    expect(gloamwoodCharacterWorldHeight(1, 'shell')).toBe(1.8)
    expect(gloamwoodCharacterWorldHeight(1, 'fang')).toBe(2.16)
    expect(gloamwoodCharacterWorldHeight(1)).toBe(2.16)
    expect(gloamwoodCharacterWorldHeight(0, 'shell')).toBe(gloamwoodCharacterWorldHeight(0))
  })
})

describe('Per-form material grading', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('applies the scarlet-gecko grade by form, never by stage', () => {
    // Keyed on stage it also hit the Shell body: a warm tint over grey stone, an
    // emissive fill that erases planes, and normalScale cut to 62%.
    expect(source).toContain("} else if (asset.formId === 'scarlet-gecko') {")
    expect(source).not.toMatch(/}\s*else if \(stage === 1\) \{/)
    expect(source).toContain('applyScarletGeckoSurfaceGrade(material)')
  })
})

describe('Route entry parameter', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('loads a gene family straight from the URL for footprint checks', () => {
    // The documented entries always carried evolutionRoute, but only the stage
    // was read, so a non-Fang body could not be inspected without playing to
    // the evolution first - which is where the traversal check kept stalling.
    expect(source).toContain("params.get('evolutionRoute')")
    expect(source).toContain("if (route === 'fang' || route === 'shell' || route === 'swarm') this.characterFamily = route")
  })
})
