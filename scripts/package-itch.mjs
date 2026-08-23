import { access, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const projectRoot = process.cwd()
const distDirectory = resolve(projectRoot, 'dist')
const releaseDirectory = resolve(projectRoot, 'release')
const archivePath = resolve(releaseDirectory, 'EvolutionArenaLite-itch-alpha.zip')

run(npm, ['run', 'build:itch'], projectRoot)
run(process.execPath, [resolve(projectRoot, 'scripts/verify-runtime-assets.mjs'), '--dist'], projectRoot)
run(process.execPath, [resolve(projectRoot, 'scripts/verify-itch-build.mjs')], projectRoot)
await access(resolve(distDirectory, 'index.html'))
await mkdir(releaseDirectory, { recursive: true })
await rm(archivePath, { force: true })
run('zip', ['-qr', archivePath, '.'], distDirectory)
run('unzip', ['-tqq', archivePath], projectRoot)

console.log(`itch.io upload archive ready: ${archivePath}`)

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
