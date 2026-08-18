import { describe, expect, it } from 'vitest'

import { scatterGloamwoodValley } from '../src/gloamwood-valley-dressing'
import { GLOAMWOOD_VALLEY_LENGTH, gloamwoodValleyPointAt } from '../src/gloamwood-valley-terrain'
import {
  GLOAMWOOD_VALLEY_CELL,
  GLOAMWOOD_VALLEY_DRAW_DISTANCE,
  gloamwoodValleyCellDrawn,
  gloamwoodValleyCellOf,
  gloamwoodValleyDrawnPropCount,
  groupGloamwoodValleyProps,
} from '../src/gloamwood-valley-streaming'

describe('Valley draw cells', () => {
  it('bins every prop into exactly one cell', () => {
    const props = scatterGloamwoodValley(0x5a11e, 3000)
    const cells = groupGloamwoodValleyProps(props)
    expect(cells.reduce((total, cell) => total + cell.props.length, 0)).toBe(props.length)
    for (const cell of cells) {
      for (const prop of cell.props) {
        expect(gloamwoodValleyCellOf(prop.x, prop.z)).toEqual(cell.cell)
      }
    }
  })

  it('keeps the cell the camera is standing in', () => {
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 25) {
      const point = gloamwoodValleyPointAt(s, 0)
      expect(gloamwoodValleyCellDrawn(gloamwoodValleyCellOf(point.x, point.z), point.x, point.z)).toBe(true)
    }
  })

  it('measures to the near edge, so nothing pops while it is still ahead', () => {
    // Measuring to the centre switches a cell off while the player is still
    // looking across its near half.
    const cell = { column: 4, row: 2 }
    const nearEdge = cell.column * GLOAMWOOD_VALLEY_CELL
    const row = cell.row * GLOAMWOOD_VALLEY_CELL + GLOAMWOOD_VALLEY_CELL / 2
    expect(gloamwoodValleyCellDrawn(cell, nearEdge - GLOAMWOOD_VALLEY_DRAW_DISTANCE + 1, row)).toBe(true)
    expect(gloamwoodValleyCellDrawn(cell, nearEdge - GLOAMWOOD_VALLEY_DRAW_DISTANCE - 1, row)).toBe(false)
  })

  it('bins in two dimensions, because the route folds back beside itself', () => {
    // Two points far apart along the route can be neighbours in the world, and
    // a player standing between them has to be able to see both. Slicing by
    // distance along the route would keep one and cull the other.
    const cells = groupGloamwoodValleyProps(scatterGloamwoodValley(0x5a11e, 4000))
    const columns = new Set(cells.map((cell) => cell.cell.column))
    const rows = new Set(cells.map((cell) => cell.cell.row))
    expect(columns.size).toBeGreaterThan(6)
    expect(rows.size).toBeGreaterThan(3)
  })

  it('keeps the drawn prop count inside a budget wherever the player stands', () => {
    // The whole point: a single batch for the valley would draw the headwater's
    // cliffs while the player is still in the shallows. The share culled is not
    // the interesting number - what has to hold is the absolute count the GPU
    // is handed, at the worst spot rather than the average one.
    const props = scatterGloamwoodValley(0x5a11e, 6200)
    let worst = 0
    for (let s = 0; s <= GLOAMWOOD_VALLEY_LENGTH; s += 20) {
      const point = gloamwoodValleyPointAt(s, 0)
      worst = Math.max(worst, gloamwoodValleyDrawnPropCount(props, point.x, point.z))
    }
    expect(worst).toBeLessThan(2600)
    expect(worst).toBeGreaterThan(0)
  })
})
