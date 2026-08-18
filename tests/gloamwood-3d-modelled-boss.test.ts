import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_BLADESHELL_BOSS,
  gloamwoodBossClipForState,
  gloamwoodBossClipRate,
} from '../src/gloamwood-3d-modelled-boss'

const CONFIG = GLOAMWOOD_BLADESHELL_BOSS

describe('Choosing a clip from boss state', () => {
  it('starts a pattern clip exactly when the wind-up starts', () => {
    // The clip carries its own wind-up, so letting it run on from wherever it
    // happened to be would put the swing before the tell.
    const entering = gloamwoodBossClipForState(
      { state: 'telegraph', pattern: 'root-slam' }, CONFIG, { state: 'chase', pattern: 'root-slam' },
    )
    expect(entering).toMatchObject({ clip: 'BladeSweep', restart: true, once: true })
  })

  it('carries the same take through the blow instead of snapping back', () => {
    const striking = gloamwoodBossClipForState(
      { state: 'attack', pattern: 'root-slam' }, CONFIG, { state: 'telegraph', pattern: 'root-slam' },
    )
    expect(striking).toMatchObject({ clip: 'BladeSweep', restart: false })
  })

  it('restarts when the pattern changes mid-sequence', () => {
    const swapped = gloamwoodBossClipForState(
      { state: 'telegraph', pattern: 'thorn-charge' }, CONFIG, { state: 'telegraph', pattern: 'root-slam' },
    )
    expect(swapped).toMatchObject({ clip: 'RiverCharge', restart: true })
  })

  it('maps patterns by shape, which is what makes the model previewable at all', () => {
    // A ring is a sweep and a line is a charge whatever the creature is called.
    expect(CONFIG.clips.patterns['spore-ring']).toBe(CONFIG.clips.patterns['root-slam'])
    expect(CONFIG.clips.patterns['thorn-charge']).not.toBe(CONFIG.clips.patterns['root-slam'])
  })

  it('holds the final pose on death rather than looping it', () => {
    const dying = gloamwoodBossClipForState({ state: 'dead', pattern: 'root-slam' }, CONFIG, { state: 'attack', pattern: 'root-slam' })
    expect(dying).toMatchObject({ clip: 'Death', restart: true, once: true })
    const held = gloamwoodBossClipForState({ state: 'dead', pattern: 'root-slam' }, CONFIG, { state: 'dead', pattern: 'root-slam' })
    expect(held.restart).toBe(false)
  })

  it('loops locomotion and idle', () => {
    expect(gloamwoodBossClipForState({ state: 'chase', pattern: 'root-slam' }, CONFIG).once).toBe(false)
    expect(gloamwoodBossClipForState({ state: 'recover', pattern: 'root-slam' }, CONFIG)).toMatchObject({ clip: 'Idle', once: false })
  })
})

describe('Fitting the clip to the authored timing', () => {
  it('stretches a clip so its contact lands on the real one', () => {
    // The clip is authored at whatever length reads well; the authority owns
    // when the blow happens.
    expect(gloamwoodBossClipRate(2.0, 1.02, 0.24)).toBeCloseTo(2.0 / 1.26, 5)
    expect(gloamwoodBossClipRate(1.26, 1.02, 0.24)).toBeCloseTo(1, 5)
  })

  it('clamps rather than producing a still or a blur', () => {
    expect(gloamwoodBossClipRate(100, 0.1, 0.1)).toBeLessThanOrEqual(4)
    expect(gloamwoodBossClipRate(0.01, 10, 10)).toBeGreaterThanOrEqual(0.1)
  })
})

describe('Runtime wiring', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('loads the model only when asked, since the valley does not exist yet', () => {
    // A river crustacean standing in the Gloamwood by default would be wrong.
    expect(source).toContain("get('bossModel') === 'bladeshell'")
  })

  it('lets an encounter shortcut work where the game is actually reviewed', () => {
    // bossGate and evolutionGate required a dev build, so on the deployed site -
    // the only place the game gets looked at - they silently did nothing and the
    // reviewer just played a normal run.
    expect(source).toContain("const debugGatesAllowed = import.meta.env.DEV || debugParams.get('debug') === '1'")
    expect(source).not.toMatch(/import\.meta\.env\.DEV && debugParams\.get\('bossGate'\)/)
    expect(source).not.toMatch(/import\.meta\.env\.DEV && debugParams\.get\('evolutionGate'\)/)
  })

  it('corrects the model\'s authored facing onto the game\'s forward', () => {
    // The runtime rotates a boss by facingRadians, where zero is +X, while a
    // Blender model exported Y-up faces +Z. Without the quarter turn the
    // creature aims its blades ninety degrees away from its target - which is
    // how it first shipped.
    expect(GLOAMWOOD_BLADESHELL_BOSS.modelYaw).toBeCloseTo(Math.PI / 2, 6)
    expect(source).toContain('gltf.scene.rotation.y = config.modelYaw')
  })

  it('lets the clip own the motion instead of nudging the root as well', () => {
    expect(source).toContain('visual.body.position.x = visual.model ? 0 : strike * 0.65')
  })

  it('keeps the telegraph rings, which are the authority\'s own shapes', () => {
    // A model must never imply a different reach than the one that resolves.
    expect(source).toContain('visual.telegraph.scale.setScalar')
  })
})
