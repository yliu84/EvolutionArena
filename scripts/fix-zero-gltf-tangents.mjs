import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/fix-zero-gltf-tangents.mjs input.glb output.glb')
  process.exit(2)
}

const glb = Buffer.from(await readFile(inputPath))
if (glb.readUInt32LE(0) !== 0x46546c67 || glb.readUInt32LE(4) !== 2) {
  throw new Error(`${inputPath} is not a glTF 2.0 binary`)
}

let offset = 12
let jsonChunk
let binaryChunkOffset

while (offset < glb.length) {
  const chunkLength = glb.readUInt32LE(offset)
  const chunkType = glb.readUInt32LE(offset + 4)
  const dataOffset = offset + 8
  if (chunkType === 0x4e4f534a) jsonChunk = glb.subarray(dataOffset, dataOffset + chunkLength)
  if (chunkType === 0x004e4942) binaryChunkOffset = dataOffset
  offset = dataOffset + chunkLength
}

if (!jsonChunk || binaryChunkOffset === undefined) throw new Error('GLB must contain JSON and BIN chunks')
const document = JSON.parse(jsonChunk.toString('utf8').replace(/[\u0000 ]+$/u, ''))
const tangentAccessors = new Set()

for (const mesh of document.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    if (primitive.attributes?.TANGENT !== undefined) tangentAccessors.add(primitive.attributes.TANGENT)
  }
}

let repaired = 0
for (const accessorIndex of tangentAccessors) {
  const accessor = document.accessors[accessorIndex]
  if (accessor.componentType !== 5126 || accessor.type !== 'VEC4') {
    throw new Error(`Unsupported tangent accessor ${accessorIndex}; expected FLOAT VEC4`)
  }
  const bufferView = document.bufferViews[accessor.bufferView]
  const stride = bufferView.byteStride ?? 16
  const start = binaryChunkOffset + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0)

  for (let index = 0; index < accessor.count; index += 1) {
    const tangentOffset = start + index * stride
    const x = glb.readFloatLE(tangentOffset)
    const y = glb.readFloatLE(tangentOffset + 4)
    const z = glb.readFloatLE(tangentOffset + 8)
    if (Math.hypot(x, y, z) > 0.000001) continue
    glb.writeFloatLE(1, tangentOffset)
    glb.writeFloatLE(0, tangentOffset + 4)
    glb.writeFloatLE(0, tangentOffset + 8)
    glb.writeFloatLE(1, tangentOffset + 12)
    repaired += 1
  }
}

await writeFile(outputPath, glb)
console.log(`${outputPath}: repaired ${repaired} zero-length tangent vectors`)
