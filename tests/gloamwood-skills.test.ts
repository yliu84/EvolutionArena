import { describe, expect, it } from 'vitest'

import {
  GLOAMWOOD_DASH_PHASES,
  GLOAMWOOD_SKILLS,
  gloamwoodDashTravel,
  createGloamwoodSkillState,
  gloamwoodDashLanding,
  gloamwoodSkillFor,
  stepGloamwoodSkillState,
  tryGloamwoodSkill,
} from '../src/gloamwood-skills'
import { CORAL_GECKO_PRESENTATION } from '../src/quality-3d-character-presentation'

const ready = { family: 'fang', state: createGloamwoodSkillState(), alive: true, hasTarget: true, targetDistance: 4 }

describe('each line answers distance differently', () => {
  it('gives the three families three different verbs', () => {
    // The point of binding skills to the line. If two lines answered a ranged
    // attacker the same way, the choice between them would be cosmetic again.
    const kinds = (['fang', 'shell', 'swarm'] as const).map((f) => GLOAMWOOD_SKILLS[f].shape.kind)
    expect(new Set(kinds).size).toBe(3)
    expect(kinds).toEqual(['dash', 'guard', 'zone'])
  })

  it('makes the guard do something outward, not only something to a number', () => {
    // Reported from play: the shell fired correctly, cut the damage it said it
    // cut, and read as an input the game had ignored - nothing on screen moved
    // and nothing took a hit. A defensive skill still has to be an action.
    const guard = GLOAMWOOD_SKILLS.shell.shape
    expect(guard.kind).toBe('guard')
    expect(guard.kind === 'guard' && guard.shoveRadius).toBeGreaterThan(1)
    expect(guard.kind === 'guard' && guard.shoveKnockback).toBeGreaterThan(0)
  })

  it('lets the shell fire without a target, because being shot at is the case', () => {
    // A form whose answer to being shot at needed a target it could not reach
    // would have no answer at all.
    expect(GLOAMWOOD_SKILLS.shell.needsTarget).toBe(false)
    expect(GLOAMWOOD_SKILLS.fang.needsTarget).toBe(true)
  })

  it('reaches further than a melee swing on the two that close distance', () => {
    const pounce = GLOAMWOOD_SKILLS.fang.shape
    const bloom = GLOAMWOOD_SKILLS.swarm.shape
    expect(pounce.kind === 'dash' && pounce.range).toBeGreaterThan(5)
    expect(bloom.kind === 'zone' && bloom.castRange).toBeGreaterThan(5)
  })

  it('gives the origin form nothing rather than a borrowed skill', () => {
    // Handing everyone the fang's pounce until they evolve would make the first
    // evolution read as a downgrade for two lines out of three.
    expect(gloamwoodSkillFor('origin')).toBeNull()
    expect(gloamwoodSkillFor(null)).toBeNull()
    expect(gloamwoodSkillFor('fang')).toBe(GLOAMWOOD_SKILLS.fang)
  })
})

describe('firing, and being told why not', () => {
  it('fires when ready and starts the cooldown', () => {
    const attempt = tryGloamwoodSkill(ready)
    expect(attempt.fired).toBe(true)
    expect(attempt.state.cooldownRemaining).toBe(GLOAMWOOD_SKILLS.fang.cooldownSeconds)
  })

  it('names every refusal instead of silently doing nothing', () => {
    // A skill that quietly does nothing on cooldown reads as a dropped input.
    expect(tryGloamwoodSkill({ ...ready, family: 'origin' }).refusal).toBe('no-skill')
    expect(tryGloamwoodSkill({ ...ready, alive: false }).refusal).toBe('dead')
    expect(tryGloamwoodSkill({ ...ready, hasTarget: false }).refusal).toBe('no-target')
    expect(tryGloamwoodSkill({ ...ready, targetDistance: 999 }).refusal).toBe('out-of-range')
    const fired = tryGloamwoodSkill(ready)
    expect(tryGloamwoodSkill({ ...ready, state: fired.state }).refusal).toBe('cooling')
  })

  it('does not start a cooldown on a refusal', () => {
    const attempt = tryGloamwoodSkill({ ...ready, targetDistance: 999 })
    expect(attempt.state.cooldownRemaining).toBe(0)
  })

  it('opens the guard window only for the form that has one', () => {
    const shell = tryGloamwoodSkill({ ...ready, family: 'shell', hasTarget: false })
    expect(shell.fired).toBe(true)
    expect(shell.state.guardRemaining).toBeGreaterThan(0)
    expect(tryGloamwoodSkill(ready).state.guardRemaining).toBe(0)
  })
})

describe('the clock', () => {
  it('runs both timers down and settles at zero', () => {
    let state = tryGloamwoodSkill({ ...ready, family: 'shell', hasTarget: false }).state
    state = stepGloamwoodSkillState(state, 2)
    expect(state.guardRemaining).toBeGreaterThan(0)
    state = stepGloamwoodSkillState(state, 60)
    expect(state).toMatchObject({ cooldownRemaining: 0, guardRemaining: 0 })
  })

  it('returns the same object once nothing is running, so a frame costs nothing', () => {
    const idle = createGloamwoodSkillState()
    expect(stepGloamwoodSkillState(idle, 1 / 60)).toBe(idle)
  })
})

describe('a pounce lands beside its target, not inside it', () => {
  it('stops short by both bodies', () => {
    const landing = gloamwoodDashLanding({ x: 0, z: 0 }, { x: 10, z: 0 }, 1.5, 1.2)
    expect(landing.x).toBeLessThan(10 - 1.5)
    expect(landing.x).toBeGreaterThan(5)
    expect(landing.z).toBeCloseTo(0, 6)
  })

  it('does not move at all when there is nowhere to go', () => {
    // Standing on the target: the separation pass would otherwise shove the
    // body straight through it on the next frame.
    const landing = gloamwoodDashLanding({ x: 3, z: 3 }, { x: 3, z: 3 }, 1.5, 1.2)
    expect(landing).toEqual({ x: 3, z: 3 })
  })

  it('never overshoots past the target', () => {
    const landing = gloamwoodDashLanding({ x: 0, z: 0 }, { x: 2, z: 0 }, 1.5, 1.2)
    expect(landing.x).toBeGreaterThanOrEqual(0)
    expect(landing.x).toBeLessThanOrEqual(2)
  })
})

describe('a pounce leaps rather than slides', () => {
  // The first version of this dash ran for 0.26s against a 0.9s attack window.
  // The crouch alone runs to 0.198s of that, so the whole move finished while
  // the animal was still gathering and the body was then handed straight back
  // to locomotion. Measured in engine at the time: leapBitePhase never left
  // 'crouch' and the character lift never left 0.000. What played was a
  // crouching body sliding across the ground, which is exactly how it was
  // reported. "The clip is called Pounce" was true the whole time and proved
  // nothing - which is the reason this is asserted here rather than eyeballed.

  it('stays planted through the crouch', () => {
    expect(gloamwoodDashTravel(0)).toBe(0)
    expect(gloamwoodDashTravel(GLOAMWOOD_DASH_PHASES.crouchEnd * 0.5)).toBe(0)
    expect(gloamwoodDashTravel(GLOAMWOOD_DASH_PHASES.crouchEnd)).toBe(0)
  })

  it('has arrived by the landing frame and does not creep afterwards', () => {
    expect(gloamwoodDashTravel(GLOAMWOOD_DASH_PHASES.landing)).toBe(1)
    expect(gloamwoodDashTravel(0.9)).toBe(1)
    expect(gloamwoodDashTravel(1)).toBe(1)
  })

  it('does all of its travelling in the airborne stretch', () => {
    const airborne = gloamwoodDashTravel(GLOAMWOOD_DASH_PHASES.landing)
      - gloamwoodDashTravel(GLOAMWOOD_DASH_PHASES.crouchEnd)
    expect(airborne).toBe(1)
  })

  it('is past halfway by the contact frame, so the blow lands on the way in', () => {
    expect(gloamwoodDashTravel(GLOAMWOOD_DASH_PHASES.contact)).toBeGreaterThan(0.5)
    expect(gloamwoodDashTravel(GLOAMWOOD_DASH_PHASES.contact)).toBeLessThan(1)
  })

  it('eases rather than running at a constant rate', () => {
    // A constant rate is a slide with a lift bolted on. Early and late steps
    // must both be smaller than the step through the middle.
    const at = (p: number) => gloamwoodDashTravel(p)
    const span = GLOAMWOOD_DASH_PHASES.landing - GLOAMWOOD_DASH_PHASES.crouchEnd
    const early = at(GLOAMWOOD_DASH_PHASES.crouchEnd + span * 0.15) - at(GLOAMWOOD_DASH_PHASES.crouchEnd)
    const middle = at(GLOAMWOOD_DASH_PHASES.crouchEnd + span * 0.575) - at(GLOAMWOOD_DASH_PHASES.crouchEnd + span * 0.425)
    const late = at(GLOAMWOOD_DASH_PHASES.landing) - at(GLOAMWOOD_DASH_PHASES.landing - span * 0.15)
    expect(middle).toBeGreaterThan(early)
    expect(middle).toBeGreaterThan(late)
  })

  it('keeps the phase constants in step with the motion the renderer drives', () => {
    // These duplicate CORAL_GECKO_PRESENTATION.combat.leapBiteMotion so the
    // travel can be tested without a browser. If that authored motion moves and
    // this does not, the body would leap on one clock and travel on another.
    expect(GLOAMWOOD_DASH_PHASES.crouchEnd)
      .toBe(CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.crouchEndProgress)
    expect(GLOAMWOOD_DASH_PHASES.contact)
      .toBe(CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.contactProgress)
    expect(GLOAMWOOD_DASH_PHASES.landing)
      .toBe(CORAL_GECKO_PRESENTATION.combat.leapBiteMotion.landingProgress)
  })
})
