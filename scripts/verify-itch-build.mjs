import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

const DIST_DIRECTORY = resolve(process.cwd(), 'dist')
const MAX_ARCHIVE_FILE_BYTES = 200 * 1024 * 1024
const MAX_EXTRACTED_BYTES = 500 * 1024 * 1024
const MAX_FILE_COUNT = 1000

const files = await listFiles(DIST_DIRECTORY)
const indexPath = resolve(DIST_DIRECTORY, 'index.html')
const index = await readFile(indexPath, 'utf8')

if (!/\.\/assets\//.test(index)) {
  throw new Error('itch build must reference bundled entry assets with a relative ./assets/ path')
}

for (const reference of htmlReferences(index)) {
  if (reference.startsWith('/') && !reference.startsWith('//')) {
    throw new Error(`itch build contains a root-absolute HTML reference: ${reference}`)
  }
}

let totalBytes = 0
for (const file of files) {
  const size = (await stat(file)).size
  totalBytes += size
  if (size > MAX_ARCHIVE_FILE_BYTES) {
    throw new Error(`itch build file exceeds 200 MB: ${relative(DIST_DIRECTORY, file)}`)
  }
}

if (files.length > MAX_FILE_COUNT) {
  throw new Error(`itch build has ${files.length} files; limit is ${MAX_FILE_COUNT}`)
}
if (totalBytes > MAX_EXTRACTED_BYTES) {
  throw new Error(`itch build extracts to ${totalBytes} bytes; limit is ${MAX_EXTRACTED_BYTES}`)
}

console.log(JSON.stringify({
  entry: 'index.html',
  files: files.length,
  extractedBytes: totalBytes,
  maxIndividualFileBytes: Math.max(0, ...await Promise.all(files.map(async (file) => (await stat(file)).size))),
  base: './',
}, null, 2))

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = resolve(directory, entry.name)
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath]
  }))
  return nested.flat()
}

function htmlReferences(html) {
  const result = []
  const expression = /(?:src|href)=["']([^"']+)["']/g
  for (const match of html.matchAll(expression)) {
    const reference = match[1]
    if (!/^(?:#|data:|https?:|mailto:)/.test(reference)) result.push(reference)
  }
  return result
}
