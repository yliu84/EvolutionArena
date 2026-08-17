import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

const [inputPath, outputPath, requestedMaximum = '1024'] = process.argv.slice(2)
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/optimize-glb-textures.mjs <input.glb> <output.glb> [maximum-pixels]')
  process.exit(2)
}

const maximumPixels = Math.max(256, Number.parseInt(requestedMaximum, 10) || 1024)
const source = readFileSync(inputPath)
if (source.toString('ascii', 0, 4) !== 'glTF' || source.readUInt32LE(4) !== 2) {
  throw new Error(`${inputPath} is not a GLB 2.0 file`)
}

const jsonLength = source.readUInt32LE(12)
const jsonType = source.readUInt32LE(16)
if (jsonType !== 0x4e4f534a) throw new Error('GLB JSON chunk is missing')
const document = JSON.parse(source.subarray(20, 20 + jsonLength).toString('utf8'))
const binaryHeaderOffset = 20 + jsonLength
const binaryLength = source.readUInt32LE(binaryHeaderOffset)
const binaryType = source.readUInt32LE(binaryHeaderOffset + 4)
if (binaryType !== 0x004e4942) throw new Error('GLB binary chunk is missing')
const binary = source.subarray(binaryHeaderOffset + 8, binaryHeaderOffset + 8 + binaryLength)

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'evolution-glb-textures-'))
const replacements = new Map()
try {
  for (const [imageIndex, image] of (document.images ?? []).entries()) {
    if (image.mimeType !== 'image/png' || image.bufferView === undefined) continue
    const view = document.bufferViews[image.bufferView]
    const bytes = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
    const colorType = bytes[25]
    const hasAlpha = colorType === 4 || colorType === 6
    const sourceImage = join(temporaryDirectory, `image-${imageIndex}.png`)
    const targetImage = join(temporaryDirectory, `image-${imageIndex}.${hasAlpha ? 'png' : 'jpg'}`)
    writeFileSync(sourceImage, bytes)
    const argumentsList = ['--resampleHeightWidthMax', String(maximumPixels)]
    if (!hasAlpha) argumentsList.push('-s', 'format', 'jpeg', '-s', 'formatOptions', '82')
    argumentsList.push(sourceImage, '--out', targetImage)
    execFileSync('/usr/bin/sips', argumentsList, { stdio: 'ignore' })
    replacements.set(image.bufferView, readFileSync(targetImage))
    image.mimeType = hasAlpha ? 'image/png' : 'image/jpeg'
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}

const rebuiltViews = []
let rebuiltLength = 0
for (const [viewIndex, view] of (document.bufferViews ?? []).entries()) {
  const replacement = replacements.get(viewIndex)
  const bytes = replacement ?? binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
  const alignedOffset = alignFour(rebuiltLength)
  rebuiltViews.push({ alignedOffset, bytes })
  view.byteOffset = alignedOffset
  view.byteLength = bytes.length
  rebuiltLength = alignedOffset + bytes.length
}

const rebuiltBinary = Buffer.alloc(alignFour(rebuiltLength))
for (const { alignedOffset, bytes } of rebuiltViews) bytes.copy(rebuiltBinary, alignedOffset)
document.buffers[0].byteLength = rebuiltBinary.length

const jsonBytes = Buffer.from(JSON.stringify(document))
const paddedJson = Buffer.alloc(alignFour(jsonBytes.length), 0x20)
jsonBytes.copy(paddedJson)
const output = Buffer.alloc(12 + 8 + paddedJson.length + 8 + rebuiltBinary.length)
output.write('glTF', 0, 'ascii')
output.writeUInt32LE(2, 4)
output.writeUInt32LE(output.length, 8)
output.writeUInt32LE(paddedJson.length, 12)
output.writeUInt32LE(0x4e4f534a, 16)
paddedJson.copy(output, 20)
const outputBinaryHeader = 20 + paddedJson.length
output.writeUInt32LE(rebuiltBinary.length, outputBinaryHeader)
output.writeUInt32LE(0x004e4942, outputBinaryHeader + 4)
rebuiltBinary.copy(output, outputBinaryHeader + 8)
writeFileSync(outputPath, output)

const reduction = Math.round((1 - output.length / source.length) * 1000) / 10
console.log(`${basename(inputPath)}: ${source.length} -> ${output.length} bytes (${reduction}% smaller)`)

function alignFour(value) {
  return Math.ceil(value / 4) * 4
}
