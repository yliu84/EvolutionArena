import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import process from 'node:process'

import validator from 'gltf-validator'

const modelPaths = process.argv.slice(2)

if (modelPaths.length === 0) {
  console.error('Usage: npm run validate:gltf -- <model.glb> [more.glb files]')
  process.exit(2)
}

let hasErrors = false

for (const modelPath of modelPaths) {
  const bytes = new Uint8Array(await readFile(modelPath))
  const report = await validator.validateBytes(bytes, { uri: basename(modelPath) })
  const { numErrors, numWarnings, numInfos, numHints } = report.issues

  console.log(`${modelPath}: ${numErrors} errors, ${numWarnings} warnings, ${numInfos} infos, ${numHints} hints`)

  if (numErrors > 0) {
    hasErrors = true
    for (const message of report.issues.messages.filter((item) => item.severity === 0)) {
      console.error(`  [${message.code}] ${message.message}`)
    }
  }
}

if (hasErrors) process.exit(1)
