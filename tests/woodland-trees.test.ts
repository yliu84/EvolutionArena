import { describe, expect, it } from 'vitest'
import { createGloamwoodLandscape, riverWidth, sampleLandscape } from '../src/terrain'
import { WOODLAND_VIEW, planGloamwoodTrees, treeStats } from '../src/woodland-trees'

describe('gloamwood trees', () => {
  it('plants a sparse woodland without standing in the river', () => {
    const field = createGloamwoodLandscape()
    const trees = planGloamwoodTrees(field)
    expect(trees.length).toBeGreaterThan(12)
    expect(trees.length).toBeLessThanOrEqual(WOODLAND_VIEW.treeCount)
    for (const tree of trees) {
      const sample = sampleLandscape(field, tree.x, tree.y)
      expect(sample.river).toBeGreaterThan(riverWidth(tree.x, tree.y) + 20)
    }
    const xs = trees.map((tree) => Math.round(tree.x / 32))
    expect(new Set(xs).size).toBeGreaterThan(8)
  })

  it('keeps trees larger than the hunter and mixed in silhouette', () => {
    expect(WOODLAND_VIEW.minDist).toBeGreaterThan(WOODLAND_VIEW.playerHeight * 2)
    expect(WOODLAND_VIEW.groundTilt).toBeGreaterThan(0.85)
    expect(WOODLAND_VIEW.groundTilt).toBeLessThan(1)
    const trees = planGloamwoodTrees(createGloamwoodLandscape())
    const stats = treeStats(trees)
    const kindsUsed = Object.values(stats.kinds).filter((count) => count > 0).length
    expect(kindsUsed).toBeGreaterThan(1)
    expect(stats.count).toBe(trees.length)
  })
})
