import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_ENTRY = 'src/main.ts'
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts']
const ASSET_PATTERN = /['"`](\/?assets\/[A-Za-z0-9/._-]+\.(?:png|jpe?g|webp|glb|ogg|mp3|m4a|wav))(?=[?#[\]'"`])/gi
const IMPORT_PATTERNS = [
  /\b(?:import|export)\s+(?:type\s+)?(?:[\w*$\s{},]+?\s+from\s+)?['"](\.[^'"]+)['"]/g,
  /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
]

/**
 * Follows only the TypeScript modules reachable from the production entry,
 * then verifies every literal public-asset URL named by that graph. Retired
 * source archaeology therefore cannot make a build fail, but a missing live
 * model, texture or audio file cannot silently reach a player.
 */
export function verifyRuntimeAssets({ root = process.cwd(), includeDist = false } = {}) {
  const sourceFiles = collectReachableSources(root)
  const references = collectAssetReferences(root, sourceFiles)
  const missingPublic = references.filter(({ path }) => !existsSync(resolve(root, 'public', path)))
  const missingDist = includeDist
    ? references.filter(({ path }) => !existsSync(resolve(root, 'dist', path)))
    : []

  return {
    entry: SOURCE_ENTRY,
    sourceFiles: sourceFiles.map((file) => relative(root, file)).sort(),
    references,
    missingPublic,
    missingDist,
  }
}

function collectReachableSources(root) {
  const entry = resolve(root, SOURCE_ENTRY)
  const pending = [entry]
  const visited = new Set()

  while (pending.length > 0) {
    const file = pending.pop()
    if (!file || visited.has(file)) continue
    visited.add(file)
    const source = readFileSync(file, 'utf8')
    for (const specifier of relativeImportSpecifiers(source)) {
      const dependency = resolveSourceModule(file, specifier)
      if (dependency) pending.push(dependency)
    }
  }

  return [...visited]
}

function relativeImportSpecifiers(source) {
  const specifiers = new Set()
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1])
  }
  return [...specifiers]
}

function resolveSourceModule(importer, specifier) {
  const candidate = resolve(dirname(importer), specifier)
  const extension = extname(candidate)
  if (extension && !SOURCE_EXTENSIONS.includes(extension)) return undefined
  const candidates = extension
    ? [candidate]
    : SOURCE_EXTENSIONS.flatMap((suffix) => [
      `${candidate}${suffix}`,
      resolve(candidate, `index${suffix}`),
    ])
  return candidates.find((file) => existsSync(file))
}

function collectAssetReferences(root, sourceFiles) {
  const references = new Map()
  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(ASSET_PATTERN)) {
      const path = match[1].replace(/^\//, '')
      references.set(`${relative(root, file)} -> ${path}`, {
        source: relative(root, file),
        path,
      })
    }
  }
  return [...references.values()].sort((left, right) => left.path.localeCompare(right.path))
}

function report(result) {
  const missing = [...result.missingPublic, ...result.missingDist]
  if (missing.length > 0) {
    const lines = missing.map(({ source, path }) => `- ${source} -> ${path}`)
    throw new Error(`Missing runtime assets:\n${lines.join('\n')}`)
  }
  console.log(JSON.stringify({
    entry: result.entry,
    reachableSourceFiles: result.sourceFiles.length,
    referencedAssets: result.references.length,
    checkedDist: result.missingDist !== undefined,
  }, null, 2))
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  report(verifyRuntimeAssets({ includeDist: process.argv.includes('--dist') }))
}
