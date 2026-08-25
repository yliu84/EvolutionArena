import { describe, expect, it } from 'vitest'

import { carapaceShellLayout, metabolicVeinLayout, MOULT_RHOMBUS, moultHuskLayout, moultRhombusMeshData, moultVaultAlpha, moultVaultPoint, mutationFxBurst, RENDING_CRACK, rendingSlashEnvelope, rendingSparkBurst, SKILL_FX_TEXTURE_KINDS, sporeHazeLayout, TAIL_SWEEP_TORUS, tailSweepLayout } from '../src/gloamwood-mutation-fx'

describe('mutation skill-particle feedback', () => {
  it('uses additive skill textures instead of debug meshes', () => {
    expect(SKILL_FX_TEXTURE_KINDS).toEqual(['glow', 'slash', 'ring', 'streak', 'dust', 'pebble', 'plate'])
  })

  it('wraps a 3D carapace of hex plates around both flanks, not a flat card', () => {
    const plates = carapaceShellLayout(1.6)
    expect(plates.length).toBeGreaterThanOrEqual(16)
    expect(plates.some((plate) => plate.local[0] > 0.35)).toBe(true)
    expect(plates.some((plate) => plate.local[0] < -0.35)).toBe(true)
    expect(plates.some((plate) => plate.local[2] < -0.25)).toBe(true)
    expect(plates.some((plate) => plate.local[2] > 0.2)).toBe(true)
    const heights = plates.map((plate) => plate.local[1])
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.4)
    const burst = mutationFxBurst('carapace', 0.4)
    expect(burst.particles.every((particle) => particle.texture !== 'ring' && particle.texture !== 'glow')).toBe(true)
    expect(burst.particles.every((particle) => particle.texture !== 'plate')).toBe(true)
  })

  it('draws sporehaze as a persistent low haze, not a pulsing skill ring', () => {
    const layout = sporeHazeLayout(4.2)
    expect(layout.radius).toBeCloseTo(4.2 * 1.22, 5)
    expect(layout.hazeOpacity).toBeLessThan(0.22)
    // The mist is one disc that follows the terrain, not a pile of flat quads.
    // The quads sat at the player's own ground height, so anywhere the ground
    // rose inside the aura it won the depth test and sliced the mist off along
    // a contour - a hard edge with nothing beyond it. Enough rings to bend over
    // a slope, and enough segments that the rim reads as a circle.
    expect(layout.mistRings).toBeGreaterThanOrEqual(4)
    expect(layout.mistSegments).toBeGreaterThanOrEqual(16)
    // It floats clear of the grass but nowhere near far enough to stop being
    // ground mist; lifting it until it cleared every slope was the other way to
    // fix the edge, and it turns the mist into a cloud around the animal's back.
    expect(layout.mistLift).toBeGreaterThan(0)
    expect(layout.mistLift).toBeLessThan(0.3)
    // Many small points of light, not a few big soft ones. The previous shape
    // was six sprites a metre across drawn with the mist's own gradient, and at
    // the game's camera distance they read as pale bubbles parked around the
    // animal rather than as anything airborne. Subtlety now comes from each
    // spore being tiny and fading over its climb, not from a low opacity - so
    // the guard is on size and count, and the opacity cap is gone.
    expect(layout.motes.length).toBeGreaterThan(30)
    // A quarter of a unit against the metre-wide sprites this replaced.
    expect(layout.motes.every((mote) => mote.size < 0.25)).toBe(true)
    // Every spore starts inside the aura it belongs to.
    expect(layout.motes.every((mote) => Math.hypot(mote.local[0], mote.local[2]) <= layout.radius)).toBe(true)
    // They rise, but not over the animal's head - this is a ground aura.
    expect(layout.moteRise).toBeLessThan(2)
    expect(layout.motes.every((mote) => mote.local[1] < 0.55)).toBe(true)
    const aura = mutationFxBurst('spore-aura', 1.2)
    expect(aura.particles).toHaveLength(0)
    expect(aura.trauma).toBe(0)
    const preview = mutationFxBurst('spore-preview', 1.2)
    expect(preview.particles.every((particle) => particle.texture !== 'ring' && particle.texture !== 'glow')).toBe(true)
    expect(preview.particles.every((particle) => particle.peakOpacity < 0.3)).toBe(true)
    expect(preview.particles.every((particle) => particle.offset[1] < 0.4)).toBe(true)
  })

  it('makes moult a hovering rhombus-tiled shell that fades from crown to rim', () => {
    const husk = moultHuskLayout(1.6)
    expect(husk.sides).toHaveLength(2)
    expect(husk.sides[0].peel).toBe(-husk.sides[1].peel)
    expect(husk.color).toBe(0xe2c48a)
    expect(husk.peakOpacity).toBe(0.48)
    expect(MOULT_RHOMBUS.fillOpacity).toBe(0.48)
    expect(MOULT_RHOMBUS.stepX).toBeGreaterThan(MOULT_RHOMBUS.stepZ)
    expect(MOULT_RHOMBUS.edgeWidth).toBeLessThan(0.01)
    expect(husk.edgeOpacity).toBeLessThan(husk.peakOpacity)
    expect(husk.lift / 1.6).toBeGreaterThan(0.8)
    expect(husk.shiftBack / 1.6).toBeGreaterThan(0.15)
    expect(husk.scale[1] / husk.scale[2]).toBeLessThan(1.05)
    expect(husk.scale[1] / husk.scale[2]).toBeGreaterThan(0.7)
    expect(husk.scale[0] / 1.6).toBeLessThan(1.4)
    const right = moultRhombusMeshData(1)
    const left = moultRhombusMeshData(-1)
    expect(right.facets).toBeGreaterThanOrEqual(8)
    expect(left.facets).toBe(right.facets)
    expect(right.maxSideRatio).toBeLessThan(2.2)
    expect(right.positions.length).toBe(right.facets * 18)
    expect(right.edgePositions.length).toBe(right.facets * 72)
    const windingY = (positions: number[]) => {
      const heights: number[] = []
      for (let index = 0; index < positions.length; index += 9) {
        const abx = positions[index + 3] - positions[index]
        const abz = positions[index + 5] - positions[index + 2]
        const acx = positions[index + 6] - positions[index]
        const acz = positions[index + 8] - positions[index + 2]
        heights.push(abz * acx - abx * acz)
      }
      return heights
    }
    expect(windingY(right.positions).every((value) => value > 0)).toBe(true)
    expect(windingY(left.positions).every((value) => value > 0)).toBe(true)
    expect(right.normals.every((value, index) => index % 3 !== 1 || value > 0)).toBe(true)
    expect(left.normals.every((value, index) => index % 3 !== 1 || value > 0)).toBe(true)
    const zs = Array.from({ length: right.positions.length / 3 }, (_, index) => right.positions[index * 3 + 2])
    expect(Math.min(...zs)).toBeLessThan(0.08)
    expect(Math.max(...zs)).toBeGreaterThan(0.6)
    const xs = Array.from({ length: right.positions.length / 3 }, (_, index) => right.positions[index * 3])
    expect(Math.min(...xs)).toBeLessThan(-0.7)
    expect(Math.max(...xs)).toBeGreaterThan(0.7)
    const crown = moultVaultPoint(0, 0)
    const rim = moultVaultPoint(0, 0.78)
    expect(crown[1]).toBeGreaterThan(rim[1] * 1.35)
    expect(moultVaultAlpha(crown[1])).toBeGreaterThan(moultVaultAlpha(rim[1]) + 0.35)
    expect(Math.max(...right.alphas)).toBeGreaterThan(Math.min(...right.alphas) + 0.3)
    const burst = mutationFxBurst('moult', 0)
    expect(burst.particles).toHaveLength(0)
    expect(burst.trauma).toBeGreaterThan(0.3)
  })

  it('sends feeding motes inward and metabolism gain upward', () => {
    const feeding = mutationFxBurst('regeneration').particles.filter((particle) => particle.motion === 'attract')
    expect(feeding.length).toBeGreaterThan(0)
    expect(feeding.every((particle) => (
      particle.offset[0] * particle.velocity[0] + particle.offset[2] * particle.velocity[2] < 0
    ))).toBe(true)

    const gain = mutationFxBurst('metabolism-gain')
    const decay = mutationFxBurst('metabolism-decay')
    expect(gain.particles[0].velocity[1]).toBeGreaterThan(0)
    expect(decay.particles[0].velocity[1]).toBeLessThan(0)
    expect(gain.particles[0].color).not.toBe(decay.particles[0].color)
    expect(gain.particles.every((particle) => particle.texture !== 'glow' && particle.texture !== 'ring')).toBe(true)
    expect(decay.particles.every((particle) => particle.texture !== 'glow' && particle.texture !== 'ring')).toBe(true)
    const veins = metabolicVeinLayout(1.6)
    expect(veins.veins.some((vein) => vein.local[0] > 0.3)).toBe(true)
    expect(veins.veins.some((vein) => vein.local[0] < -0.3)).toBe(true)
    const heights = veins.veins.map((vein) => vein.local[1])
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.5)
    expect(veins.gainColor).not.toBe(veins.decayColor)
  })

  it('makes rending claws three tapered hunting slashes, not a screen overlay', () => {
    expect(RENDING_CRACK.cuts).toBe(3)
    expect(RENDING_CRACK.planeWidth).toBeGreaterThan(1.5)
    expect(RENDING_CRACK.planeWidth).toBeLessThan(1.8)
    expect(RENDING_CRACK.planeHeight).toBeGreaterThan(1.2)
    expect(RENDING_CRACK.planeHeight).toBeLessThan(1.5)
  })

  it('tapers each claw to a point instead of a constant-width worm', () => {
    expect(rendingSlashEnvelope(0)).toBeCloseTo(0, 5)
    expect(rendingSlashEnvelope(1)).toBeCloseTo(0, 5)
    expect(rendingSlashEnvelope(0.5)).toBeGreaterThan(rendingSlashEnvelope(0.12))
  })

  it('throws embers around the three hunting claws', () => {
    expect(rendingSparkBurst()).toHaveLength(6)
    expect(rendingSparkBurst().every((particle) => particle.texture === 'glow')).toBe(true)
  })

  it('kicks gravel and dust along a tail sweep instead of a painted crescent', () => {
    const burst = mutationFxBurst('tail-sweep', 0.4)
    expect(burst.particles.every((particle) => particle.texture !== 'ring')).toBe(true)
    const dust = burst.particles.filter((particle) => particle.texture === 'dust')
    const gravel = burst.particles.filter((particle) => particle.texture === 'pebble')
    expect(dust.length).toBeGreaterThanOrEqual(10)
    expect(gravel.length).toBeGreaterThanOrEqual(12)
    expect(gravel.every((particle) => particle.motion === 'ballistic')).toBe(true)
    expect(dust.every((particle) => particle.motion === 'ballistic')).toBe(true)
    expect(dust.every((particle) => particle.billboard === 'camera' && particle.depthTest === true)).toBe(true)
    expect(dust.every((particle) => particle.startScale[0] === particle.startScale[1])).toBe(true)
    expect(dust.every((particle) => Math.hypot(particle.offset[0], particle.offset[2]) >= TAIL_SWEEP_TORUS.innerRadius)).toBe(true)
    expect(dust.every((particle) => particle.offset[1] < 0.4)).toBe(true)
    const grit = burst.particles.filter((particle) => particle.texture === 'streak')
    expect(grit.length).toBeGreaterThanOrEqual(8)
    expect(dust.every((particle) => Math.hypot(particle.velocity[0], particle.velocity[2]) > particle.velocity[1])).toBe(true)
    expect(burst.trauma).toBeGreaterThan(0.2)
  })

  it('grows the tail sweep one ring outside a larger body', () => {
    const small = tailSweepLayout(1)
    const large = tailSweepLayout(2.4)
    expect(large.innerRadius).toBeGreaterThan(2.4)
    expect(large.innerRadius).toBeGreaterThan(small.innerRadius)
    expect(large.shockEnd / large.shockStart).toBeCloseTo(small.shockEnd / small.shockStart, 5)
    const burst = mutationFxBurst('tail-sweep', 0.4, 2.4)
    const ground = burst.particles.filter((particle) => particle.texture === 'dust' || particle.texture === 'pebble')
    expect(ground.every((particle) => Math.hypot(particle.offset[0], particle.offset[2]) >= 2.4)).toBe(true)
  })
})
