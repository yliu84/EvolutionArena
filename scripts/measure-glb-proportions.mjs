#!/usr/bin/env node
/**
 * Report a GLB's body proportions and its world size at a given runtime height.
 *
 * This exists because the runtime scales a character by height alone:
 *
 *   scale = gloamwoodCharacterWorldHeight(stage, family) / boundingBox.size.y
 *
 * so a source that comes back elongated does not merely look wrong, it becomes
 * a larger footprint the moment it is normalised. That is the one property a
 * creature source cannot be rescued from downstream, and the Shell stage-2
 * contract makes it an arithmetic rejection gate rather than a taste call.
 * Checking it needed Blender until now, which meant it was checked late.
 *
 * Usage:
 *   node scripts/measure-glb-proportions.mjs <file.glb> [...]
 *   node scripts/measure-glb-proportions.mjs --height 2.55 --max-lh 2.20 --min-wh 0.95 <file.glb>
 *
 * Axis convention, confirmed against every shipped player model: X is width,
 * Y is height, Z is length.
 *
 * Caveat on skinned meshes: glTF ignores a skinned mesh node's own transform at
 * render time, and this script applies it. That is deliberate - the Meshy
 * quadruped exports carry a uniform scale there, so ratios are unaffected, and
 * the absolute numbers matter less than w/h and l/h. Cross-checked against the
 * published figures: stone-pangolin measures 1.59 x 4.58 against the 1.58 x 4.57
 * in its contract, and spore-stalker measures 1.39 x 4.33 against the 1.40 x 4.34
 * recorded in GLOAMWOOD_PLAYER_FAMILY_COLLISION_PROFILES.
 */
import { readFileSync } from 'node:fs'

const GLB_MAGIC = 0x46546c67
const CHUNK_JSON = 0x4e4f534a

function parseGLB(path) {
  const buf = readFileSync(path)
  if (buf.length < 12 || buf.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error(`${path}: not a binary glTF (.glb) file`)
  }
  let offset = 12
  let json
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32LE(offset)
    const type = buf.readUInt32LE(offset + 4)
    if (type === CHUNK_JSON) json = JSON.parse(buf.subarray(offset + 8, offset + 8 + length).toString('utf8'))
    offset += 8 + length
  }
  if (!json) throw new Error(`${path}: no JSON chunk`)
  return json
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

function multiply(a, b) {
  const out = new Array(16).fill(0)
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      let sum = 0
      for (let k = 0; k < 4; k += 1) sum += a[k * 4 + row] * b[column * 4 + k]
      out[column * 4 + row] = sum
    }
  }
  return out
}

function localMatrix(node) {
  if (node.matrix) return node.matrix.slice()
  const [tx, ty, tz] = node.translation ?? [0, 0, 0]
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1]
  const scale = node.scale ?? [1, 1, 1]
  const m = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    0, 0, 0, 1,
  ]
  for (let column = 0; column < 3; column += 1) {
    for (let row = 0; row < 3; row += 1) m[column * 4 + row] *= scale[column]
  }
  m[12] = tx
  m[13] = ty
  m[14] = tz
  return m
}

function transformPoint(m, [x, y, z]) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ]
}

/**
 * Meshy leaves an `Icosphere` helper in its exports and the runtime hides it
 * (see loadCharacter). Measuring it would inflate every extent.
 */
const IGNORED_NODES = new Set(['Icosphere'])

function measure(json) {
  const low = [Infinity, Infinity, Infinity]
  const high = [-Infinity, -Infinity, -Infinity]
  let triangles = 0

  const visit = (index, parentMatrix) => {
    const node = json.nodes[index]
    const matrix = multiply(parentMatrix, localMatrix(node))
    if (node.mesh !== undefined && !IGNORED_NODES.has(node.name ?? '')) {
      for (const primitive of json.meshes[node.mesh].primitives) {
        if (primitive.indices !== undefined) triangles += json.accessors[primitive.indices].count / 3
        const position = json.accessors[primitive.attributes.POSITION]
        if (!position?.min || !position?.max) continue
        for (let corner = 0; corner < 8; corner += 1) {
          const point = [
            corner & 1 ? position.max[0] : position.min[0],
            corner & 2 ? position.max[1] : position.min[1],
            corner & 4 ? position.max[2] : position.min[2],
          ]
          const world = transformPoint(matrix, point)
          for (let axis = 0; axis < 3; axis += 1) {
            low[axis] = Math.min(low[axis], world[axis])
            high[axis] = Math.max(high[axis], world[axis])
          }
        }
      }
    }
    for (const child of node.children ?? []) visit(child, matrix)
  }

  for (const scene of json.scenes ?? []) for (const root of scene.nodes ?? []) visit(root, IDENTITY)

  return {
    width: high[0] - low[0],
    height: high[1] - low[1],
    length: high[2] - low[2],
    triangles,
    bones: json.skins?.[0]?.joints?.length ?? 0,
    clips: (json.animations ?? []).map((animation) => animation.name),
  }
}

function parseArguments(argv) {
  const options = { height: undefined, maxLengthRatio: undefined, minWidthRatio: undefined, files: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i]
    if (flag === '--height') options.height = Number(argv[++i])
    else if (flag === '--max-lh') options.maxLengthRatio = Number(argv[++i])
    else if (flag === '--min-wh') options.minWidthRatio = Number(argv[++i])
    else options.files.push(flag)
  }
  return options
}

const options = parseArguments(process.argv.slice(2))
if (options.files.length === 0) {
  console.error('usage: node scripts/measure-glb-proportions.mjs [--height H] [--max-lh R] [--min-wh R] <file.glb> ...')
  process.exit(2)
}

let failed = false

for (const file of options.files) {
  const body = measure(parseGLB(file))
  const widthRatio = body.width / body.height
  const lengthRatio = body.length / body.height

  console.log(`\n${file}`)
  console.log(`  triangles ${body.triangles}   bones ${body.bones}   clips ${body.clips.join(', ') || '(none)'}`)
  console.log(`  w/h ${widthRatio.toFixed(3)}   l/h ${lengthRatio.toFixed(3)}`)

  if (options.height) {
    const width = widthRatio * options.height
    const length = lengthRatio * options.height
    console.log(`  at world height ${options.height}: ${width.toFixed(2)} wide x ${length.toFixed(2)} long x ${options.height.toFixed(2)} tall`)
  }

  if (options.maxLengthRatio !== undefined) {
    const pass = lengthRatio <= options.maxLengthRatio
    failed ||= !pass
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  l/h ${lengthRatio.toFixed(3)} <= ${options.maxLengthRatio}`)
  }
  if (options.minWidthRatio !== undefined) {
    const pass = widthRatio >= options.minWidthRatio
    failed ||= !pass
    console.log(`  ${pass ? 'PASS' : 'FAIL'}  w/h ${widthRatio.toFixed(3)} >= ${options.minWidthRatio}`)
  }
}

console.log('')
process.exit(failed ? 1 : 0)
