import { access, mkdir, readFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * The Y8 upload archive.
 *
 * Same payload as the itch build plus the portal SDK, which is injected at
 * build time rather than committed into index.html - see the plugin in
 * vite.config.ts for why the other targets must not carry it.
 */
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const projectRoot = process.cwd()
const distDirectory = resolve(projectRoot, 'dist')
const releaseDirectory = resolve(projectRoot, 'release')
const archivePath = resolve(releaseDirectory, 'EvolutionArenaLite-y8.zip')

run(npm, ['run', 'build:y8'], projectRoot)
run(process.execPath, [resolve(projectRoot, 'scripts/verify-runtime-assets.mjs'), '--dist'], projectRoot)
run(process.execPath, [resolve(projectRoot, 'scripts/verify-itch-build.mjs')], projectRoot)
await access(resolve(distDirectory, 'index.html'))

// The one thing that distinguishes this build from the itch one. A Y8 upload
// without the SDK passes every other check and then fails review for the one
// requirement that cannot be seen by looking at the game.
const index = await readFile(resolve(distDirectory, 'index.html'), 'utf8')
for (const required of ['cdn.y8.com/minimal-sdk', 'y8sdk.ready']) {
  if (!index.includes(required)) throw new Error(`Y8 build is missing ${required} in index.html`)
}

await mkdir(releaseDirectory, { recursive: true })
await rm(archivePath, { force: true })
run('zip', ['-qr', archivePath, '.'], distDirectory)
run('unzip', ['-tqq', archivePath], projectRoot)

console.log(`Y8 upload archive ready: ${archivePath}`)

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
