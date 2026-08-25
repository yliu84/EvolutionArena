import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_BOSS,
  createGloamwoodBossState,
  damageGloamwoodBoss,
  startGloamwoodBoss,
  stepGloamwoodBoss,
  type GloamwoodBossState,
} from '../src/gloamwood-3d-boss'
import {
  GLOAMWOOD_THORNHEART_WARDEN_BOSS,
  gloamwoodBossClipForState,
  gloamwoodBossClipRate,
} from '../src/gloamwood-3d-modelled-boss'

/**
 * The Gloamwood's boss, and the first one in this map that is a model.
 *
 * What it replaced is the reason these assertions exist. The primitive assembly
 * animated all three patterns from a single line - `body.position.x = strike *
 * 0.65` - so Root Slam, Thorn Charge and Spore Ring produced identical body
 * motion and were distinguishable only by the decal drawn on the ground. The
 * fight that ends a first run had one animation.
 */

const GLB_MAGIC = 0x46546c67
const CHUNK_JSON = 0x4e4f534a

function clipSeconds() {
  const relative = GLOAMWOOD_THORNHEART_WARDEN_BOSS.url.split('?')[0].replace(/^\//, '')
  const buffer = readFileSync(new URL(`../public/${relative}`, import.meta.url))
  expect(buffer.readUInt32LE(0)).toBe(GLB_MAGIC)
  let offset = 12
  let json: any
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset)
    if (buffer.readUInt32LE(offset + 4) === CHUNK_JSON) {
      json = JSON.parse(buffer.subarray(offset + 8, offset + 8 + length).toString('utf8'))
      break
    }
    offset += 8 + length
  }
  const durations = new Map<string, number>()
  for (const animation of json.animations ?? []) {
    let end = 0
    for (const channel of animation.channels) {
      const input = json.accessors[animation.samplers[channel.sampler].input]
      if (input.max) end = Math.max(end, input.max[0])
    }
    durations.set(animation.name, end)
  }
  return durations
}

describe('the Thornheart Warden plays a different clip for every pattern', () => {
  it('maps each of the three patterns to its own clip', () => {
    const { patterns } = GLOAMWOOD_THORNHEART_WARDEN_BOSS.clips
    expect(patterns['root-slam']).toBe('Slam')
    expect(patterns['thorn-charge']).toBe('Charge')
    expect(patterns['spore-ring']).toBe('RingBurst')
    expect(new Set(Object.values(patterns)).size).toBe(3)
  })

  it('selects that clip from the authority, restarting on each wind-up', () => {
    const config = GLOAMWOOD_THORNHEART_WARDEN_BOSS
    const entering = gloamwoodBossClipForState(
      { state: 'telegraph', pattern: 'thorn-charge' },
      config,
      { state: 'chase', pattern: 'root-slam' },
    )
    expect(entering).toEqual({ clip: 'Charge', restart: true, once: true })

    // Wind-up into strike is one take, so the clip must not snap back to zero
    // halfway through its own swing.
    const continuing = gloamwoodBossClipForState(
      { state: 'attack', pattern: 'thorn-charge' },
      config,
      { state: 'telegraph', pattern: 'thorn-charge' },
    )
    expect(continuing).toEqual({ clip: 'Charge', restart: false, once: true })
  })

  it('holds no clip in common between the three patterns, whatever the state', () => {
    const seen = new Set<string>()
    for (const pattern of ['root-slam', 'thorn-charge', 'spore-ring'] as const) {
      seen.add(gloamwoodBossClipForState({ state: 'telegraph', pattern }, GLOAMWOOD_THORNHEART_WARDEN_BOSS).clip)
    }
    expect(seen.size, 'two patterns resolved to the same clip').toBe(3)
  })
})

describe('the clips are authored onto the windows the authority owns', () => {
  // Each clip is stretched onto `telegraph + attack` by `gloamwoodBossClipRate`.
  // Authoring at that length keeps the rate near 1, so the motion is played at
  // the speed it was posed for rather than visibly slowed or rushed.
  it('needs almost no time-scaling to fit its own pattern window', () => {
    const durations = clipSeconds()
    const { patterns } = GLOAMWOOD_THORNHEART_WARDEN_BOSS.clips
    for (const [pattern, clip] of Object.entries(patterns)) {
      const spec = GLOAMWOOD_BOSS.patterns[pattern as keyof typeof GLOAMWOOD_BOSS.patterns]
      const seconds = durations.get(clip)
      expect(seconds, `${clip} is not in the shipped GLB`).toBeDefined()
      const rate = gloamwoodBossClipRate(seconds!, spec.telegraphSeconds, spec.attackSeconds)
      expect(rate, `${clip} would play at ${rate.toFixed(3)}x`).toBeGreaterThan(0.95)
      expect(rate, `${clip} would play at ${rate.toFixed(3)}x`).toBeLessThan(1.05)
    }
  })

  it('carries idle, walk, hit and death as well', () => {
    const durations = clipSeconds()
    const { idle, walk, hit, death } = GLOAMWOOD_THORNHEART_WARDEN_BOSS.clips
    for (const clip of [idle, walk, hit, death]) {
      expect(durations.has(clip), `${clip} is missing`).toBe(true)
      expect(durations.get(clip)).toBeGreaterThan(0)
    }
  })
})

describe('the body is sized as a boss rather than a large player form', () => {
  it('stands taller than the tallest player body', () => {
    // Player stage-2 forms normalise to 2.55. A boss the same height as the
    // thing fighting it reads as another creature, not as the end of the run.
    expect(GLOAMWOOD_THORNHEART_WARDEN_BOSS.worldHeight).toBeGreaterThan(2.55)
  })

  it('keeps the body inside the reach its collision circle was tuned for', () => {
    // The runtime normalises by height alone, so the mesh's length ratio decides
    // the footprint. Measured l/h is 1.41, and every pattern's reach derives
    // from `bodyRadius`, which cannot move: lowering `preferredRange` to 3.3
    // once stopped the fight dead because the boss could never reach the
    // spacing it waits for.
    const measuredLengthToHeight = 1.41
    const halfLength = (GLOAMWOOD_THORNHEART_WARDEN_BOSS.worldHeight * measuredLengthToHeight) / 2
    // The player is pushed out to at most 3.50 from the boss centre, so the
    // body must not reach that far or they would stand inside it.
    expect(halfLength).toBeLessThan(3.5)
    // And it must still be no worse than the primitive assembly it replaces,
    // whose half-length was 2.4 against the same 1.72 collision radius.
    expect(halfLength).toBeLessThan(2.4)
    expect(GLOAMWOOD_BOSS.bodyRadius).toBe(1.72)
  })
})

describe('a real fight reaches all three clips', () => {
  /**
   * Driving the authority rather than watching the browser.
   *
   * `spore-ring` is one slot in a four-slot phase-two rotation, so catching it
   * by eye means standing in front of the boss for as long as it takes - and
   * the pattern that is hardest to observe is exactly the one most likely to be
   * quietly broken. This runs the real state machine and records which clip the
   * driver would have selected at every telegraph.
   */
  function clipsSeenInAFight() {
    let boss: GloamwoodBossState = startGloamwoodBoss(createGloamwoodBossState(0, 0))
    const clips = new Set<string>()
    const patterns = new Set<string>()
    let previous: Pick<GloamwoodBossState, 'state' | 'pattern'> | undefined
    for (let step = 0; step < 6000; step += 1) {
      // Stand where the collision floor would put the widest player form, so
      // the boss can reach the spacing it waits for instead of circling.
      const player = { x: boss.x + 3.5, z: boss.z, alive: true }
      boss = stepGloamwoodBoss(boss, 1 / 60, player).state
      if (boss.state === 'telegraph') {
        patterns.add(boss.pattern)
        clips.add(gloamwoodBossClipForState(boss, GLOAMWOOD_THORNHEART_WARDEN_BOSS, previous).clip)
      }
      previous = { state: boss.state, pattern: boss.pattern }
      // Half health flips the phase, which is where spore-ring lives.
      if (step === 1800) boss = damageGloamwoodBoss(boss, GLOAMWOOD_BOSS.maxHealth * 0.6).state
    }
    return { clips, patterns }
  }

  it('runs every pattern, including the phase-two-only one', () => {
    const { patterns } = clipsSeenInAFight()
    expect(patterns).toContain('root-slam')
    expect(patterns).toContain('thorn-charge')
    // Only ever scheduled in phase two, and only in one of four slots.
    expect(patterns, 'spore-ring never fired in a full fight').toContain('spore-ring')
  })

  it('plays a different clip for each of them', () => {
    const { clips } = clipsSeenInAFight()
    expect([...clips].sort()).toEqual(['Charge', 'RingBurst', 'Slam'])
  })
})
