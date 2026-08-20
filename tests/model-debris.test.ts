import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Reconstruction debris must not be setting a model's bounding box.
 *
 * Every size in this game is derived from that box. `loadModelledPrey` scales a
 * creature by `footprintRadius / halfExtent` and then grounds it with
 * `position.y -= box.min.y`, so a few stray faces left floating by a generator
 * do not look like stray faces - they silently shrink the whole animal and bury
 * it in the ground, and nothing downstream can tell.
 *
 * The failure mode is borrowed rather than suffered: GameFactory-3A records
 * three of four sample characters refused by a humanoid gate for being "wider
 * than tall", where the bodies were fine and four floating specks were setting
 * the box. This project has the same arithmetic and had no guard on it.
 *
 * Calibrated against the fourteen models actually in the payload, including one
 * false positive found by rendering rather than by arguing: the azure wyvern's
 * wing membranes are two triangles each and a metre across. Face count is
 * therefore the wrong proxy for "this is nothing" - what makes a part debris is
 * being small in *every* dimension.
 */

const MODELS = 'public/assets/quality-3d/models'

/** A part small in every dimension against the whole, as a share of diagonal. */
const SPECK_DIAGONAL_SHARE = 0.03
/** How far specks may push the box before the derived size is wrong enough to matter. */
const TOLERATED_BOX_ERROR = 0.01

interface Part {
  faces: number
  min: [number, number, number]
  max: [number, number, number]
}

function readAccessor(json: any, bin: Buffer, index: number) {
  const accessor = json.accessors[index]
  const view = json.bufferViews[accessor.bufferView]
  const componentSize: Record<number, number> = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
  const componentCount: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
  const size = componentSize[accessor.componentType]
  const count = componentCount[accessor.type]
  const stride = view.byteStride || size * count
  const base = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
  const out: number[][] = []
  for (let element = 0; element < accessor.count; element += 1) {
    const row: number[] = []
    for (let component = 0; component < count; component += 1) {
      const at = base + element * stride + component * size
      row.push(
        accessor.componentType === 5126 ? bin.readFloatLE(at)
          : accessor.componentType === 5125 ? bin.readUInt32LE(at)
            : accessor.componentType === 5123 ? bin.readUInt16LE(at)
              : bin.readUInt8(at),
      )
    }
    out.push(row)
  }
  return out
}

/** Connected parts of a GLB, welded by position so UV seams do not split them. */
function parts(buffer: Buffer): Part[] {
  const jsonLength = buffer.readUInt32LE(12)
  const json = JSON.parse(buffer.slice(20, 20 + jsonLength).toString('utf8'))
  const bin = buffer.slice(20 + jsonLength + 8)
  const found: Part[] = []
  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives) {
      if (primitive.indices === undefined || primitive.attributes.POSITION === undefined) continue
      const positions = readAccessor(json, bin, primitive.attributes.POSITION)
      const indices = readAccessor(json, bin, primitive.indices).map((row) => row[0])
      // A glTF splits vertices at UV and normal seams, so two faces sharing an
      // edge on screen carry different indices. Weld by position first or every
      // model comes back as thousands of separate parts.
      const welded = new Map<string, number>()
      const representative = positions.map((point, index) => {
        const key = point.map((value) => Math.round(value * 1e5)).join(',')
        if (!welded.has(key)) welded.set(key, index)
        return welded.get(key)!
      })
      const parent = new Map<number, number>()
      for (const rep of representative) if (!parent.has(rep)) parent.set(rep, rep)
      const find = (node: number): number => {
        let current = node
        while (parent.get(current) !== current) {
          parent.set(current, parent.get(parent.get(current)!)!)
          current = parent.get(current)!
        }
        return current
      }
      const union = (a: number, b: number) => {
        const rootA = find(a)
        const rootB = find(b)
        if (rootA !== rootB) parent.set(rootA, rootB)
      }
      for (let face = 0; face < indices.length; face += 3) {
        union(representative[indices[face]], representative[indices[face + 1]])
        union(representative[indices[face + 1]], representative[indices[face + 2]])
      }
      const tally = new Map<number, Part>()
      for (let face = 0; face < indices.length; face += 3) {
        const root = find(representative[indices[face]])
        const part = tally.get(root) ?? {
          faces: 0,
          min: [Infinity, Infinity, Infinity] as [number, number, number],
          max: [-Infinity, -Infinity, -Infinity] as [number, number, number],
        }
        part.faces += 1
        for (const corner of [indices[face], indices[face + 1], indices[face + 2]]) {
          for (let axis = 0; axis < 3; axis += 1) {
            part.min[axis] = Math.min(part.min[axis], positions[corner][axis])
            part.max[axis] = Math.max(part.max[axis], positions[corner][axis])
          }
        }
        tally.set(root, part)
      }
      found.push(...tally.values())
    }
  }
  return found
}

function boxOf(list: readonly Part[]) {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
  for (const part of list) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], part.min[axis])
      max[axis] = Math.max(max[axis], part.max[axis])
    }
  }
  return { min, max }
}

const diagonal = (box: { min: number[]; max: number[] }) =>
  Math.hypot(box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2])

/** What the runtime derives from a model, with and without its smallest parts. */
export function inspectModelBuffer(buffer: Buffer) {
  const found = parts(buffer)
  const whole = boxOf(found)
  const solid = found.filter((part) => diagonal(part) / diagonal(whole) >= SPECK_DIAGONAL_SHARE)
  const specks = found.length - solid.length
  if (solid.length === 0) return { specks, sizeError: 0, groundError: 0 }
  const body = boxOf(solid)
  // The two numbers the runtime actually uses: the half-extent it scales by and
  // the floor it grounds to.
  const halfOf = (box: { min: number[]; max: number[] }) =>
    Math.max(box.max[0] - box.min[0], box.max[2] - box.min[2]) / 2
  const height = Math.max(1e-9, body.max[1] - body.min[1])
  return {
    specks,
    sizeError: Math.abs(halfOf(whole) / halfOf(body) - 1),
    groundError: (body.min[1] - whole.min[1]) / height,
  }
}

export const inspectModelDebris = (path: string) => inspectModelBuffer(readFileSync(path))

/** A one-primitive GLB, so the guard can be shown failing on purpose. */
function buildGlb(positions: number[][], indices: number[]) {
  const vertexBytes = Buffer.alloc(positions.length * 12)
  positions.forEach((point, index) => {
    point.forEach((value, axis) => vertexBytes.writeFloatLE(value, index * 12 + axis * 4))
  })
  const indexBytes = Buffer.alloc(indices.length * 4)
  indices.forEach((value, index) => indexBytes.writeUInt32LE(value, index * 4))
  const bin = Buffer.concat([vertexBytes, indexBytes])
  const padded = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4)])
  const json = {
    asset: { version: '2.0' },
    buffers: [{ byteLength: padded.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: vertexBytes.length },
      { buffer: 0, byteOffset: vertexBytes.length, byteLength: indexBytes.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length, type: 'VEC3' },
      { bufferView: 1, componentType: 5125, count: indices.length, type: 'SCALAR' },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  }
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8')
  const jsonPadded = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20)])
  const header = Buffer.alloc(12)
  header.write('glTF', 0, 'ascii')
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + padded.length, 8)
  const jsonChunk = Buffer.alloc(8)
  jsonChunk.writeUInt32LE(jsonPadded.length, 0)
  jsonChunk.writeUInt32LE(0x4e4f534a, 4)
  const binChunk = Buffer.alloc(8)
  binChunk.writeUInt32LE(padded.length, 0)
  binChunk.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, jsonChunk, jsonPadded, binChunk, padded])
}

/** A one-metre body: two triangles standing on the floor. */
const BODY: number[][] = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]]
const BODY_FACES = [0, 1, 2, 0, 2, 3]

describe('The guard can fail', () => {
  it('passes a body with nothing floating around it', () => {
    const report = inspectModelBuffer(buildGlb(BODY, BODY_FACES))
    expect(report.specks).toBe(0)
    expect(report.sizeError).toBeLessThan(TOLERATED_BOX_ERROR)
  })

  it('catches a speck that widens the box', () => {
    // Four stray faces are what the borrowed failure was: the body is fine and
    // the box is not.
    const speck = [[6, 0.5, 0], [6.01, 0.5, 0], [6, 0.51, 0]]
    const report = inspectModelBuffer(buildGlb([...BODY, ...speck], [...BODY_FACES, 4, 5, 6]))
    expect(report.specks).toBe(1)
    expect(report.sizeError).toBeGreaterThan(1)
  })

  it('catches a speck below the feet, which is what buries a creature', () => {
    const speck = [[0.5, -4, 0], [0.51, -4, 0], [0.5, -3.99, 0]]
    const report = inspectModelBuffer(buildGlb([...BODY, ...speck], [...BODY_FACES, 4, 5, 6]))
    expect(report.groundError).toBeGreaterThan(1)
  })

  it('does not call a wide thin part debris', () => {
    // The azure wyvern's wing membrane is two triangles and a metre across.
    // Judged by face count it is a speck; it is the wingspan.
    const wing = [[-2, 0.5, 0], [0, 0.5, 0], [-2, 0.6, 0]]
    const report = inspectModelBuffer(buildGlb([...BODY, ...wing], [...BODY_FACES, 4, 5, 6]))
    expect(report.specks).toBe(0)
  })
})

describe('No shipped model is sized by its debris', () => {
  const files = readdirSync(MODELS).filter((name) => name.endsWith('.glb'))

  it('finds the models it is supposed to be guarding', () => {
    expect(files.length).toBeGreaterThan(8)
  })

  for (const file of files) {
    it(`${file} is sized by its body`, () => {
      const report = inspectModelDebris(`${MODELS}/${file}`)
      // Scaled by `footprintRadius / halfExtent`: an inflated box shrinks the
      // whole animal, and its collision no longer matches what is drawn.
      expect(report.sizeError, `${file} half-extent is set by stray parts`)
        .toBeLessThan(TOLERATED_BOX_ERROR)
      // Grounded by `position.y -= box.min.y`: a speck below the feet buries it.
      expect(report.groundError, `${file} is grounded on a stray part below its feet`)
        .toBeLessThan(TOLERATED_BOX_ERROR)
    })
  }
})
