import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_3D_CAMERA_DISTANCE,
  assistGloamwoodAttackerLock,
  gloamwoodPlayerHitKnockbackDistance,
  nextGloamwoodLockTarget,
  stopGloamwoodActionsExcept,
  gloamwoodCharacterWorldHeight,
  gloamwoodStageOnePounceFrame,
  isGloamwood3DHuntRequested,
} from '../src/gloamwood-3d-hunt'

describe('Gloamwood 3D rebuild routing', () => {
  it('retires the live MapLab V4 entry into the new 3D world', () => {
    expect(isGloamwood3DHuntRequested('?maplab=4&live=1')).toBe(true)
    expect(isGloamwood3DHuntRequested('?maplab=4&live=1&mother=1&evolutionStage=2')).toBe(true)
  })

  it('keeps the old non-live map lab available only as historical tooling', () => {
    expect(isGloamwood3DHuntRequested('?maplab=4')).toBe(false)
  })

  it('supports a stable explicit entry for the rebuilt map', () => {
    expect(isGloamwood3DHuntRequested('?maplab=5')).toBe(true)
    expect(isGloamwood3DHuntRequested('?world3d=1')).toBe(true)
  })

  it('keeps the player combat-readable while preserving visible evolution growth', () => {
    expect(gloamwoodCharacterWorldHeight(0)).toBe(1.8)
    expect(gloamwoodCharacterWorldHeight(1) / gloamwoodCharacterWorldHeight(0)).toBeCloseTo(1.2)
    expect(gloamwoodCharacterWorldHeight(2) / gloamwoodCharacterWorldHeight(1)).toBeCloseTo(1.18, 2)
    expect(gloamwoodCharacterWorldHeight(2)).toBeLessThan(2.9)
    expect(GLOAMWOOD_3D_CAMERA_DISTANCE).toBeGreaterThan(20)
  })

  it('gives stage one a clearly airborne pounce without expanding horizontal overlap', () => {
    const launch = gloamwoodStageOnePounceFrame(0.36, 0.9)
    expect(launch.phase).toBe('launch')
    expect(launch.liftOffset).toBeGreaterThan(0.4)
    expect(launch.forwardOffset).toBeLessThan(0.25)
  })

  it('clears every residual one-shot animation before returning to locomotion', () => {
    const stopped: string[] = []
    const keep = { stop: () => stopped.push('keep') }
    const clampedBite = { stop: () => stopped.push('bite') }
    const clampedTailSwipe = { stop: () => stopped.push('tail') }
    const inactive = { stop: () => stopped.push('inactive') }

    stopGloamwoodActionsExcept([keep, clampedBite, clampedTailSwipe, inactive], keep)

    expect(stopped).toEqual(['bite', 'tail', 'inactive'])
  })

  it('keeps routine swarm contacts from pushing the player across the arena', () => {
    expect(gloamwoodPlayerHitKnockbackDistance('swarm', 0.52, 0)).toBeLessThan(0.05)
    expect(gloamwoodPlayerHitKnockbackDistance('fang', 1.05, 0)).toBeCloseTo(0.273)
    expect(gloamwoodPlayerHitKnockbackDistance('shell', 1.75, 0)).toBeCloseTo(0.595)
    expect(gloamwoodPlayerHitKnockbackDistance('shell', 1.75, 0.3)).toBeLessThan(0.2)
  })

  it('locks the nearest threat first and cycles in stable spawn order', () => {
    const prey = [
      { id: 'far', kind: 'fang', phase: 'chase', phaseElapsed: 0, health: 10, maxHealth: 10, x: 5, z: 0, facingRadians: 0, attackResolved: false, slot: 0 },
      { id: 'near', kind: 'swarm', phase: 'strike', phaseElapsed: 0, health: 10, maxHealth: 10, x: 1, z: 0, facingRadians: 0, attackResolved: false, slot: 1 },
      { id: 'middle', kind: 'shell', phase: 'telegraph', phaseElapsed: 0, health: 10, maxHealth: 10, x: 3, z: 0, facingRadians: 0, attackResolved: false, slot: 2 },
    ] as const
    expect(nextGloamwoodLockTarget(prey, null, { x: 0, z: 0 })).toBe('near')
    expect(nextGloamwoodLockTarget(prey, 'near', { x: 0, z: 0 })).toBe('middle')
    expect(nextGloamwoodLockTarget(prey, 'middle', { x: 0, z: 0 })).toBe('far')
  })

  it('assists an attacker lock only when it will not replace a live deliberate target', () => {
    const prey = [
      { id: 'chosen', kind: 'fang', phase: 'chase', phaseElapsed: 0, health: 10, maxHealth: 10, x: 2, z: 0, facingRadians: 0, attackResolved: false, slot: 0 },
      { id: 'attacker', kind: 'swarm', phase: 'strike', phaseElapsed: 0, health: 10, maxHealth: 10, x: 1, z: 0, facingRadians: 0, attackResolved: true, slot: 1 },
    ] as const
    expect(assistGloamwoodAttackerLock(prey, null, 'attacker')).toBe('attacker')
    expect(assistGloamwoodAttackerLock(prey, 'chosen', 'attacker')).toBe('chosen')
  })
})

describe('River Valley creature-model loading', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('swaps each decoded model before unrelated model requests finish', () => {
    // The old Promise.all gate meant one missing or slow GLB held every creature
    // on its low-poly fallback. Settled results preserve per-model fallback,
    // while the template helper mounts each successful body immediately.
    expect(source).toContain('Promise.allSettled(configs.map((config) => this.ensureModelledPreyTemplate(config)))')
    expect(source).toContain('this.preyTemplates.set(config.id, { scene: gltf.scene, clips: gltf.animations, config })')
    expect(source).toContain('if (this.map.bodyFor(prey)?.id !== config.id) continue')
  })

  it('keeps a failed model observable without blocking the remaining bodies', () => {
    expect(source).toContain('Primitive fallback: ${summary.failedIds.join(\', \')}')
    expect(source).toContain('Some River Valley creature models could not load; their primitive fallbacks remain.')
  })

  it('defers heavyweight regional Boss bodies until the player approaches', () => {
    expect(source).toContain('const GLOAMWOOD_BOSS_MODEL_PREFETCH_DISTANCE = 42')
    expect(source).toContain("if (prey.tier === 'boss') continue")
    expect(source).toContain('if (distance > GLOAMWOOD_BOSS_MODEL_PREFETCH_DISTANCE) return')
    expect(source).toContain('void this.ensureModelledPreyTemplate(config).catch((error) => {')
  })
})

describe('Evolution accent placeholder', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('only bolts the procedural accent onto a route with no body of its own', () => {
    // Shell now loads its own plated model, so the grey-green dodecahedron
    // plates would sit on top of real armour as floating decoration.
    expect(source).toContain('if (!this.characterFamilyMatched) this.createEvolutionAccent(candidate.family)')
    expect(source).not.toMatch(/^\s*this\.createEvolutionAccent\(candidate\.family\)$/m)
  })

  it('gives the Shell form its own world height rather than the stage default', () => {
    // A low, long body normalised to the 2.16 stage height inflates to 6.98 long.
    expect(gloamwoodCharacterWorldHeight(1, 'shell')).toBe(1.8)
    expect(gloamwoodCharacterWorldHeight(1, 'fang')).toBe(2.16)
    expect(gloamwoodCharacterWorldHeight(1)).toBe(2.16)
    expect(gloamwoodCharacterWorldHeight(0, 'shell')).toBe(gloamwoodCharacterWorldHeight(0))
  })
})

describe('Per-form material grading', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('applies the scarlet-gecko grade by form, never by stage', () => {
    // Keyed on stage it also hit the Shell body: a warm tint over grey stone, an
    // emissive fill that erases planes, and normalScale cut to 62%.
    expect(source).toContain("} else if (asset.formId === 'scarlet-gecko') {")
    expect(source).not.toMatch(/}\s*else if \(stage === 1\) \{/)
    expect(source).toContain('applyScarletGeckoSurfaceGrade(material)')
  })
})

describe('Route entry parameter', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('loads a gene family straight from the URL for footprint checks', () => {
    // The documented entries always carried evolutionRoute, but only the stage
    // was read, so a non-Fang body could not be inspected without playing to
    // the evolution first - which is where the traversal check kept stalling.
    expect(source).toContain("params.get('evolutionRoute')")
    expect(source).toContain("if (route === 'fang' || route === 'shell' || route === 'swarm') this.characterFamily = route")
  })
})

describe('Shell attack chain', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('plays Slam for the Shell second step without touching combat authority', () => {
    // The Slam clip shipped in the GLB but nothing played it: the form ran the
    // gecko profile's Pounce, which it has no clip for, so step two was silent.
    expect(source).toContain("quadrupedPounceEnvelope(this.characterFamily) === 'planted-slam' && name === 'Pounce'")
    expect(source).toContain("? 'Slam'")
    // Only the clip is redirected - no per-form damage, range or timing override.
    expect(source).not.toMatch(/slamDamage|slamRange|slamDurationSeconds/)
  })

  it('moves the body with the same envelope it animates it with', () => {
    // The half that was missing. The clip redirect said "planted Slam" and the
    // motion layer keyed off the action name, so the plated body played a
    // planted slam while a gecko's leap arc lifted its root 0.49 off the ground
    // and pitched it eight degrees - measured, and reported from play as the
    // body being hauled up and deformed.
    //
    // Both now ask `quadrupedPounceEnvelope`, so a form cannot again be
    // animated as one thing and moved as another.
    const redirects = source.match(/quadrupedPounceEnvelope\(this\.characterFamily\)/g) ?? []
    expect(redirects.length).toBeGreaterThanOrEqual(2)
    expect(source).toContain('quadrupedPlantedSlamFrame(')
    // And the leap must be reachable only when the envelope is not the slam.
    expect(source).toContain("const leapBite = attackAction === 'Pounce' && !plantedSlam")
  })

  it('never names the chain steps on screen, because they are not skills', () => {
    // One basic attack on one input. Printing "Bite hit" then "Slam hit" trains
    // the player to read three abilities, which is the boundary AGENTS.md draws.
    expect(source).not.toContain('attackName(action)')
    expect(source).not.toMatch(/private attackName\(/)
    // Slam is a clip name, not an action. Written into primaryCombo it made the
    // Shell block unusable as a combat profile, which is part of why no form's
    // profile was ever wired up. The redirect is what actually swaps the motion.
    const source3d = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')
    expect(source3d).toContain("'Slam'")
    const presentation = readFileSync(new URL('../src/stone-pangolin-character-presentation.ts', import.meta.url), 'utf8')
    expect(presentation).toContain("primaryCombo: ['Bite', 'Pounce', 'TailSwipe']")
  })
})

describe('Goal 8 audio event boundaries', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('keeps swing, confirmed contact and landing on separate presentation hooks', () => {
    expect(source).toContain("this.playSound(action === 'Bite' ? 'attack-bite'")
    expect(source).toContain("damage.killed ? 'kill' : action === 'Pounce' || action === 'TailSwipe' ? 'hit-heavy' : 'hit-light'")
    expect(source).toContain("this.playSound('land')")
  })

  it('does not reuse player swing or impact cues for enemy damage and boss FX', () => {
    expect(source).toContain("this.playSound('enemy-hit-player')")
    expect(source).not.toContain("this.playSound('player-hit')")
    expect(source).not.toContain("this.playSound('hit-heavy')\n    }")
  })

  it('resumes an already-unlocked audio context after mobile lifecycle changes', () => {
    expect(source).toContain("document.addEventListener('visibilitychange', this.visibilityChanged)")
    expect(source).toContain("document.removeEventListener('visibilitychange', this.visibilityChanged)")
    expect(source).toContain('this.audio.resume()')
  })

  it('announces elite and boss arrivals without changing their authority', () => {
    expect(source).toContain("creature.tier === 'boss' ? 'boss-intro' : 'elite-intro'")
    expect(source).toContain("this.playSound('boss-intro')")
    expect(source).toContain("this.playSound('elite-intro')")
  })
})

describe('Boss presentation loading boundary', () => {
  const source = readFileSync(new URL('../src/gloamwood-3d-hunt.ts', import.meta.url), 'utf8')

  it('loads the Boss tell renderer only when a real telegraph or strike needs it', () => {
    // The renderer is presentation-only. Delaying its code must never delay the
    // authoritative Boss state machine, damage test or player movement.
    expect(source).toContain("import('./gloamwood-boss-fx-scene')")
    expect(source).toContain('if (entries.some((entry) => entry.frame !== null)) this.ensureBossFx()')
    expect(source).toContain('if (this.disposed || this.bossFx || this.bossFxLoad || this.bossFxUnavailable) return')
    expect(source).not.toMatch(/^import\s+\{\s*createGloamwoodBossFxScene/m)
  })
})
