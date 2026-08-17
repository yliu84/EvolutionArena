import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_PLAYER_STAGE2_HEIGHT,
  GLOAMWOOD_ROCK_VARIANTS,
  GLOAMWOOD_TREE_VARIANTS,
  GLOAMWOOD_VEGETATION_VARIANTS,
  rockFootprint,
  rockVariantForIndex,
  treeFootprint,
  treeSizeFactor,
  treeVariantForIndex,
  vegetationWorldSize,
} from '../src/gloamwood-environment-kit'

const publicRoot = join(__dirname, '..', 'public')

describe('gloamwood environment kit', () => {
  it('ships every referenced GLB inside public assets', () => {
    const variants = [...GLOAMWOOD_TREE_VARIANTS, ...GLOAMWOOD_ROCK_VARIANTS, ...GLOAMWOOD_VEGETATION_VARIANTS]
    for (const variant of variants) {
      expect(existsSync(join(publicRoot, variant.url)), variant.url).toBe(true)
    }
  })

  it('keeps undergrowth below the hunter eyeline and within the instancing budget', () => {
    let totalInstances = 0
    for (const variant of GLOAMWOOD_VEGETATION_VARIANTS) {
      totalInstances += variant.count
      expect(variant.count).toBeGreaterThan(0)
      expect(variant.pathClearance).toBeGreaterThan(1)
      for (const sample of [0, 0.5, 1]) {
        const size = vegetationWorldSize(variant, sample)
        expect(size).toBeGreaterThan(0.1)
        if (variant.mode === 'height') {
          expect(size).toBeLessThan(GLOAMWOOD_PLAYER_STAGE2_HEIGHT * 0.6)
        }
      }
    }
    expect(totalInstances).toBeLessThanOrEqual(500)
  })

  it('keeps trees roughly 2.5x to 4.2x the stage-2 hunter', () => {
    for (const variant of GLOAMWOOD_TREE_VARIANTS) {
      for (const sample of [0.78, 1.1, 1.5]) {
        const { height } = treeFootprint(variant, treeSizeFactor(sample))
        expect(height / GLOAMWOOD_PLAYER_STAGE2_HEIGHT).toBeGreaterThan(2.2)
        expect(height / GLOAMWOOD_PLAYER_STAGE2_HEIGHT).toBeLessThan(4.4)
      }
    }
  })

  it('keeps trunk collision inside the canopy occluder for every variant', () => {
    for (const variant of GLOAMWOOD_TREE_VARIANTS) {
      const footprint = treeFootprint(variant, 1)
      expect(footprint.trunkRadius).toBeGreaterThan(0.4)
      expect(footprint.trunkRadius).toBeLessThan(footprint.canopyRadius)
      expect(footprint.canopyCenterY).toBeGreaterThan(footprint.height * 0.4)
      expect(footprint.canopyCenterY).toBeLessThan(footprint.height)
    }
  })

  it('cycles variants deterministically and sizes rocks within the walkable range', () => {
    expect(treeVariantForIndex(0)).not.toBe(treeVariantForIndex(1))
    expect(treeVariantForIndex(0)).toBe(treeVariantForIndex(GLOAMWOOD_TREE_VARIANTS.length))
    expect(rockVariantForIndex(1)).toBe(rockVariantForIndex(1 + GLOAMWOOD_ROCK_VARIANTS.length))
    for (const sample of [0.35, 0.8, 1.25]) {
      for (const variant of GLOAMWOOD_ROCK_VARIANTS) {
        const { radius } = rockFootprint(variant, sample)
        expect(radius).toBeGreaterThan(0.35)
        expect(radius).toBeLessThan(2)
      }
    }
  })
})
