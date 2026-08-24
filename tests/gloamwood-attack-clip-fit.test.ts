import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_ATTACK_FIT_CEILING,
  gloamwoodFittedAttackPlaybackRate,
} from '../src/gloamwood-3d-hunt'
import { CORAL_GECKO_PRESENTATION } from '../src/quality-3d-character-presentation'
import { SCARLET_GECKO_PRESENTATION } from '../src/scarlet-gecko-character-presentation'
import { SPORE_STALKER_PRESENTATION } from '../src/spore-stalker-character-presentation'
import { LANTERN_LYNX_PRESENTATION } from '../src/lantern-lynx-character-presentation'
import { BASALT_BULWARK_PRESENTATION } from '../src/basalt-bulwark-character-presentation'

/** Authored clip lengths, read from the shipped binaries. */
function clipSeconds(file: string) {
  const buf = readFileSync(`public/assets/quality-3d/models/${file}`)
  let off = 12
  let json: any = null
  while (off < buf.length) {
    const len = buf.readUInt32LE(off)
    if (buf.readUInt32LE(off + 4) === 0x4e4f534a) json = JSON.parse(buf.subarray(off + 8, off + 8 + len).toString('utf8'))
    off += 8 + len
  }
  const out: Record<string, number> = {}
  for (const anim of json.animations ?? []) {
    out[anim.name] = Math.max(...anim.channels.map((ch: any) => {
      const input = json.accessors[anim.samplers[ch.sampler].input]
      return input.max ? input.max[0] : 0
    }))
  }
  return out
}

describe('strike clips finish inside their authority window', () => {
  it('never cuts a strike short on any shipped form', () => {
    // A one-shot action is stopped when its window passes, so a clip longer than
    // the window is simply cut - and what is lost is always the recovery, which
    // is why attacks stopped mid-pose instead of finishing.
    const cases: [string, string, Record<string, number>][] = [
      ['coral-gecko', 'coral-gecko-rigged-runtime-v2.glb', {
        Bite: CORAL_GECKO_PRESENTATION.combat.biteDurationSeconds,
        TailSwipe: CORAL_GECKO_PRESENTATION.combat.tailSwipeDurationSeconds,
      }],
      ['scarlet-gecko', 'scarlet-gecko-rigged-runtime-v1.glb', {
        Bite: SCARLET_GECKO_PRESENTATION.combat.biteDurationSeconds,
        TailSwipe: SCARLET_GECKO_PRESENTATION.combat.tailSwipeDurationSeconds,
      }],
      ['spore-stalker', 'spore-stalker-rigged-runtime-v1.glb', {
        Pounce: SPORE_STALKER_PRESENTATION.combat.pounceDurationSeconds,
        Claw: SPORE_STALKER_PRESENTATION.combat.clawDurationSeconds,
        Bite: SPORE_STALKER_PRESENTATION.combat.biteDurationSeconds,
      }],
    ]
    for (const [formId, file, windows] of cases) {
      const clips = clipSeconds(file)
      for (const [name, windowSeconds] of Object.entries(windows)) {
        const rate = gloamwoodFittedAttackPlaybackRate(1, clips[name], windowSeconds)
        const playedFraction = (windowSeconds * rate) / clips[name]
        // Everything either completes, or is held at the ceiling and completes
        // almost entirely. The one that stops short is spore-stalker's Pounce,
        // a 1.42s clip in a 0.68s window: it needs 2.09x, the ceiling holds it
        // at 2.0, and it plays 96%. Speeding past the ceiling would turn the
        // leap into a stutter; the real fix for that clip is to shorten it at
        // export, which is what both stage-2 forms already do.
        expect(playedFraction, `${formId} ${name}`).toBeGreaterThanOrEqual(0.95)
        if (playedFraction < 0.999) {
          expect(rate, `${formId} ${name} is short only because of the ceiling`)
            .toBe(GLOAMWOOD_ATTACK_FIT_CEILING)
        }
      }
    }
  })

  it('leaves alone the forms whose clips already match their windows', () => {
    // Both stage-2 forms were exported with clip lengths equal to their windows,
    // so fitting is a no-op for them and must stay one.
    for (const [file, windows] of [
      ['lantern-lynx-rigged-v1.glb', {
        Pounce: LANTERN_LYNX_PRESENTATION.combat.pounceDurationSeconds,
        Claw: LANTERN_LYNX_PRESENTATION.combat.clawDurationSeconds,
        Bite: LANTERN_LYNX_PRESENTATION.combat.biteDurationSeconds,
      }],
      ['basalt-bulwark-rigged-v1.glb', {
        Bite: BASALT_BULWARK_PRESENTATION.combat.biteDurationSeconds,
        TailSwipe: BASALT_BULWARK_PRESENTATION.combat.tailSwipeDurationSeconds,
      }],
    ] as [string, Record<string, number>][]) {
      const clips = clipSeconds(file)
      for (const [name, windowSeconds] of Object.entries(windows)) {
        const rate = gloamwoodFittedAttackPlaybackRate(1, clips[name], windowSeconds)
        expect(rate, `${file} ${name}`).toBeLessThan(1.06)
      }
    }
  })

  it('never slows a clip down, and never speeds one past the ceiling', () => {
    // Fitting raises the rate to make a long clip finish; it must not lower a
    // declared rate, which would make a short clip drag.
    expect(gloamwoodFittedAttackPlaybackRate(1.2, 0.3, 0.9)).toBe(1.2)
    expect(gloamwoodFittedAttackPlaybackRate(1, 9, 0.5)).toBe(GLOAMWOOD_ATTACK_FIT_CEILING)
    // Degenerate input falls back to the declared rate rather than dividing by zero.
    expect(gloamwoodFittedAttackPlaybackRate(1.16, 0, 0.5)).toBe(1.16)
    expect(gloamwoodFittedAttackPlaybackRate(1.16, 0.5, 0)).toBe(1.16)
  })
})
