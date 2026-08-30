import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve('public/assets/audio/goal16')
const sumsPath = join(root, 'SHA256SUMS')
const sourcePath = join(root, 'SOURCES.md')
const retainedGoal8Root = resolve('public/assets/audio/goal8')
const retainedGoal8SumsPath = join(retainedGoal8Root, 'ACTIVE-SHA256SUMS')

function inspectVorbis(bytes, file) {
  const signature = Buffer.from('\x01vorbis', 'binary')
  const identification = bytes.indexOf(signature)
  if (identification < 0 || identification + 16 > bytes.length) {
    throw new Error(`Missing Vorbis identification header: ${file}`)
  }
  const channels = bytes[identification + 11]
  const sampleRate = bytes.readUInt32LE(identification + 12)
  let offset = 0
  let lastGranule = 0n
  while (offset + 27 <= bytes.length) {
    const page = bytes.indexOf('OggS', offset, 'ascii')
    if (page < 0 || page + 27 > bytes.length) break
    const segments = bytes[page + 26]
    if (page + 27 + segments > bytes.length) throw new Error(`Truncated OGG page: ${file}`)
    let payloadBytes = 0
    for (let index = 0; index < segments; index += 1) payloadBytes += bytes[page + 27 + index]
    const granule = bytes.readBigUInt64LE(page + 6)
    if (granule !== 0xffffffffffffffffn && granule > lastGranule) lastGranule = granule
    offset = page + 27 + segments + payloadBytes
  }
  const durationSeconds = Number(lastGranule) / sampleRate
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error(`Invalid OGG duration: ${file}`)
  return { channels, sampleRate, durationSeconds }
}

async function audioFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) found.push(...await audioFiles(path))
    else if (entry.name.endsWith('.ogg')) found.push(relative(root, path))
  }
  return found.sort()
}

const sums = (await readFile(sumsPath, 'utf8')).trim().split(/\r?\n/).map((line) => {
  const match = line.match(/^([a-f0-9]{64}) {2}(.+)$/)
  if (!match) throw new Error(`Malformed SHA256SUMS line: ${line}`)
  return { expected: match[1], file: match[2] }
})
const listed = sums.map(({ file }) => file).sort()
const found = await audioFiles(root)
if (JSON.stringify(listed) !== JSON.stringify(found)) {
  throw new Error(`Goal 16 hash inventory differs from audio directory\nlisted=${listed.join(',')}\nfound=${found.join(',')}`)
}

for (const { expected, file } of sums) {
  const path = join(root, file)
  const bytes = await readFile(path)
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (actual !== expected) throw new Error(`Hash mismatch: ${file}`)
  if (bytes.subarray(0, 4).toString('ascii') !== 'OggS') throw new Error(`Not an OGG stream: ${file}`)
  if ((await stat(path)).size < 4_000) throw new Error(`Suspiciously small audio file: ${file}`)
  const metadata = inspectVorbis(bytes, file)
  if (metadata.sampleRate !== 44_100) throw new Error(`Unexpected sample rate ${metadata.sampleRate}: ${file}`)
  const isLoop = !file.startsWith('sfx/')
  const stereoTransition = /sfx\/(evolution-open|evolution-select|mode-select|victory|defeat)\.ogg$/.test(file)
  const expectedChannels = isLoop || stereoTransition ? 2 : 1
  if (metadata.channels !== expectedChannels) throw new Error(`Expected ${expectedChannels} channel(s), got ${metadata.channels}: ${file}`)
  if (isLoop && (metadata.durationSeconds < 20 || metadata.durationSeconds > 180)) {
    throw new Error(`Loop duration outside 20-180 seconds: ${file}`)
  }
  if (!isLoop && (metadata.durationSeconds < 0.08 || metadata.durationSeconds > 6.5)) {
    throw new Error(`One-shot duration outside 0.08-6.5 seconds: ${file}`)
  }
}

const retainedGoal8 = (await readFile(retainedGoal8SumsPath, 'utf8')).trim().split(/\r?\n/).map((line) => {
  const match = line.match(/^([a-f0-9]{64}) {2}(.+)$/)
  if (!match) throw new Error(`Malformed retained Goal 8 hash line: ${line}`)
  return { expected: match[1], file: match[2] }
})
for (const { expected, file } of retainedGoal8) {
  const path = join(retainedGoal8Root, file)
  const bytes = await readFile(path)
  const actual = createHash('sha256').update(bytes).digest('hex')
  if (actual !== expected) throw new Error(`Retained Goal 8 hash mismatch: ${file}`)
  const metadata = inspectVorbis(bytes, `goal8/${file}`)
  if (metadata.sampleRate !== 44_100 || metadata.channels !== 2) {
    throw new Error(`Retained Goal 8 format mismatch: ${file}`)
  }
}

const sources = await readFile(sourcePath, 'utf8')
for (const required of [
  'dark-place-loop', 'krakatoa', 'ancient-power-of-serpents', 'forest-ambience',
  'rain-loopable', '80-cc0-creature-sfx', '75-cc0-breaking-falling-hit-sfx',
  '100-cc0-metal-and-wood-sfx', '25-cc0-mud-sfx',
  'heal-pickup', 'skill-cast-fang', 'skill-cast-shell', 'skill-cast-swarm',
]) {
  if (!sources.toLowerCase().includes(required)) throw new Error(`Missing source record: ${required}`)
}

console.log(`Goal 16 audio audit passed: ${found.length} Goal 16 plus ${retainedGoal8.length} retained runtime OGG files hashed; 44.1 kHz source rate, channels, durations and source record verified.`)
