/**
 * Prints the Y8 unlock-key table, read from Y8's own API.
 *
 * Y8 generates an opaque twenty-character key per achievement and shows it only
 * on the dashboard. Copying nine of those by hand is how a typo ships: a wrong
 * key awards nothing, silently, and nothing inside the game can tell.
 *
 * So this asks Y8 what they are, matches each one to a local achievement by its
 * English title, and prints the block ready to paste into
 * `src/y8-achievement-keys.ts`. Listing needs no authentication.
 *
 *   node scripts/y8-achievement-keys.mjs
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const APP_ID = '6a8f7d191ee8fcff5a7242fb'
const KEY_PATTERN = /^[0-9a-f]{20}$/

// Parsed rather than imported so this stays a plain script with no TypeScript
// runtime. If the shape of i18n.ts ever changes this finds nothing and says so,
// which is a loud failure rather than a table full of wrong keys.
const i18n = await readFile(resolve('src/i18n.ts'), 'utf8')
const titles = new Map()
for (const match of i18n.matchAll(/'achievement\.([a-z-]+)\.name':\s*\{\s*en:\s*'([^']+)'/g)) {
  titles.set(match[2], match[1])
}
if (titles.size === 0) {
  console.error('Found no achievement titles in src/i18n.ts - the parse needs updating.')
  process.exit(1)
}

/**
 * Y8's list endpoint answers inconsistently.
 *
 * Measured: the same request returned nine achievements, then zero, then two -
 * stale snapshots from a cache, all reported as `success: true`. A single call
 * is therefore worthless here, because a short answer is indistinguishable
 * from "you have not created those yet", and acting on one would print a table
 * missing most of the game's achievements while looking entirely correct.
 *
 * So ask repeatedly and keep the fullest answer. Reporting the spread makes
 * the flakiness visible rather than something the next person rediscovers.
 */
async function fetchAchievements(attempts = 10) {
  const seen = []
  let best = []
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch('https://playtomic.y8.com/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ appid: APP_ID, section: 'achievements', action: 'list' }),
    })
    const payload = await response.json()
    if (!payload.success) {
      console.error('Y8 refused the request:', payload)
      process.exit(1)
    }
    const list = payload.achievements ?? []
    seen.push(list.length)
    if (list.length > best.length) best = list
    // Nothing more to gain once every local achievement is accounted for.
    if (best.length >= titles.size) break
  }
  if (new Set(seen).size > 1) {
    console.log(`Y8 returned ${seen.join(', ')} achievements across ${seen.length} calls - using the fullest.`)
  }
  return best
}

const achievements = await fetchAchievements()

const rows = []
const unmatched = []
for (const entry of achievements) {
  const id = titles.get(entry.achievement)
  if (!id) { unmatched.push(entry.achievement); continue }
  if (!KEY_PATTERN.test(entry.achievementkey)) {
    console.error(`Unexpected key shape for ${entry.achievement}: ${entry.achievementkey}`)
    process.exit(1)
  }
  rows.push([id, entry.achievementkey])
  titles.delete(entry.achievement)
}

console.log('\nPaste into src/y8-achievement-keys.ts:\n')
for (const [id, key] of rows.sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  '${id}': '${key}',`)
}
if (titles.size > 0) {
  console.log('\nNot yet created on Y8 (no key exists for these):')
  for (const [title, id] of titles) console.log(`  ${id.padEnd(18)} ${title}`)
}
if (unmatched.length > 0) {
  console.log('\nOn Y8 but matching no local achievement - a title was edited on one side only:')
  for (const title of unmatched) console.log(`  ${title}`)
}
console.log()
