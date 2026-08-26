import { describe, expect, it } from 'vitest'

import {
  gloamwoodMonsterStrikeFx,
  gloamwoodVfxCost,
  type GloamwoodStrikeFamily,
} from '../src/gloamwood-vfx'

const FAMILIES: GloamwoodStrikeFamily[] = ['fang', 'shell', 'swarm']
const strike = (family: GloamwoodStrikeFamily, reach = 2.4, facing = 0, seed = 0) =>
  gloamwoodMonsterStrikeFx({ family, reach, facingRadians: facing, seed })

describe('What a monster blow looks like', () => {
  // Until this existed, every ordinary creature in the game announced its blow
  // with the same flat red ring and then nothing at all. The four valley bosses
  // had a whole effects scene; three families of enemy shared one circle. That
  // is the reported complaint - the monster effects look bad - and it was less
  // that they looked bad than that there were none.

  it('gives the three families three different effects', () => {
    const shapes = FAMILIES.map((family) => {
      const fx = strike(family)
      return `${fx.particles.length}|${fx.ring ? 'ring' : 'none'}|${fx.particles[0].motion}`
    })
    expect(new Set(shapes).size).toBe(3)
  })

  it('draws the area the authority tests, and never a different one', () => {
    // The rule the module exists for, inherited from the boss telegraphs. An
    // effect drawn wider than the blow teaches the player a lie; one drawn
    // narrower makes the creature feel like it cheats.
    for (const family of FAMILIES) {
      for (const reach of [0.8, 1.6, 2.4, 3.3, 5]) {
        const ring = gloamwoodMonsterStrikeFx({ family, reach, facingRadians: 0.4, seed: 3 }).ring
        if (ring) expect(ring.radius, `${family} at ${reach}`).toBe(reach)
      }
    }
  })

  it('throws the Fang blow along its facing, because the danger is a direction', () => {
    // A circle cannot say which way a lunge went, which is exactly why all
    // three families read the same before this.
    for (const facing of [0, Math.PI / 2, Math.PI, -2.1]) {
      const fx = gloamwoodMonsterStrikeFx({ family: 'fang', reach: 2.4, facingRadians: facing, seed: 1 })
      const forwardX = Math.cos(facing)
      const forwardZ = -Math.sin(facing)
      for (const particle of fx.particles) {
        // Every particle leaves the body in the forward hemisphere.
        const along = particle.velocityX * forwardX + particle.velocityZ * forwardZ
        expect(along, `facing ${facing}`).toBeGreaterThan(0)
      }
      // And it draws no ring at all.
      expect(fx.ring).toBeNull()
    }
  })

  it('puts the Shell dust on the rim of its shock, not in the middle of it', () => {
    // The edge is the part a player has to read; motion belongs there.
    const reach = 2.4
    const fx = gloamwoodMonsterStrikeFx({ family: 'shell', reach, facingRadians: 0, seed: 2 })
    for (const particle of fx.particles) {
      const distance = Math.hypot(particle.offsetX, particle.offsetZ)
      expect(distance).toBeGreaterThan(reach * 0.6)
      expect(distance).toBeLessThanOrEqual(reach)
    }
  })

  it('keeps the Swarm cloud the dimmest and the longest of the three', () => {
    const dimmest = (family: GloamwoodStrikeFamily) =>
      Math.max(...strike(family).particles.map((particle) => particle.peakOpacity))
    const longest = (family: GloamwoodStrikeFamily) =>
      Math.max(...strike(family).particles.map((particle) => particle.duration))
    expect(dimmest('swarm')).toBeLessThan(dimmest('fang'))
    expect(dimmest('swarm')).toBeLessThan(dimmest('shell'))
    expect(longest('swarm')).toBeGreaterThan(longest('fang'))
    expect(longest('swarm')).toBeGreaterThan(longest('shell'))
  })

  it('asks for camera trauma in the order the bodies weigh', () => {
    expect(strike('shell').trauma).toBeGreaterThan(strike('fang').trauma)
    expect(strike('fang').trauma).toBeGreaterThan(strike('swarm').trauma)
    // And none of them anywhere near a boss blow, which is the one that should
    // be able to move the camera.
    for (const family of FAMILIES) expect(strike(family).trauma).toBeLessThan(0.2)
  })

  it('varies between creatures without varying between runs', () => {
    // A crowd of six striking in lockstep reads as one animation played six
    // times. But an effect that differs between two runs of the same recorded
    // fight cannot be compared frame to frame, which is the only way any of
    // this ever gets verified - so no Math.random.
    const a = strike('swarm', 2.4, 0, 1)
    const b = strike('swarm', 2.4, 0, 2)
    const again = strike('swarm', 2.4, 0, 1)
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
    expect(JSON.stringify(a)).toBe(JSON.stringify(again))
  })

  it('stays inside a budget a crowd can afford', () => {
    // Six creatures can commit within a second of each other on the defence
    // map, and the shared pool is capped at 130.
    for (const family of FAMILIES) {
      expect(gloamwoodVfxCost(strike(family))).toBeLessThanOrEqual(14)
    }
    const crowd = FAMILIES.reduce((sum, family) => sum + gloamwoodVfxCost(strike(family)) * 2, 0)
    expect(crowd).toBeLessThan(130)
  })

  it('produces nothing that would sit on screen forever', () => {
    for (const family of FAMILIES) {
      const fx = strike(family)
      for (const particle of fx.particles) {
        expect(particle.duration).toBeGreaterThan(0)
        expect(particle.duration).toBeLessThan(1)
      }
      if (fx.ring) expect(fx.ring.seconds).toBeLessThan(1)
    }
  })

  it('survives a degenerate reach rather than dividing by it', () => {
    for (const family of FAMILIES) {
      const fx = gloamwoodMonsterStrikeFx({ family, reach: 0, facingRadians: 0, seed: 0 })
      for (const particle of fx.particles) {
        for (const value of [particle.offsetX, particle.offsetY, particle.offsetZ, particle.startScale]) {
          expect(Number.isFinite(value)).toBe(true)
        }
      }
    }
  })
})
