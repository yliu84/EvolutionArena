import { describe, expect, it } from 'vitest'
import {
  GLOAMWOOD_MONSTER_SKILLS,
  gloamwoodMonsterAttackSpeed,
  gloamwoodMonsterDamage,
  gloamwoodMonsterSkill,
  hasReadableMonsterSkillTiming,
} from '../src/gloamwood-monster-skills'
import { MONSTERS, type MonsterType } from '../src/monsters'

const REPRESENTATIVE_MONSTERS: readonly MonsterType[] = [
  'pouncer', 'razorwing', 'shellback', 'bloodleech', 'spitter', 'riftweaver',
]

describe('Gloamwood monster skill combat', () => {
  it('covers all six attack families with distinct warnings and silhouettes', () => {
    const skills = Object.values(GLOAMWOOD_MONSTER_SKILLS)
    expect(skills).toHaveLength(6)
    expect(new Set(skills.map((skill) => skill.id)).size).toBe(6)
    expect(new Set(skills.map((skill) => skill.telegraphShape)).size).toBe(6)
    expect(new Set(REPRESENTATIVE_MONSTERS.map((type) => MONSTERS[type].attackKind)).size).toBe(6)
  })

  it('keeps every representative attack readable and recoverable', () => {
    for (const type of REPRESENTATIVE_MONSTERS) {
      const definition = MONSTERS[type]
      const skill = gloamwoodMonsterSkill(type)
      expect(hasReadableMonsterSkillTiming(type), type).toBe(true)
      expect(definition.telegraphMs).toBeGreaterThanOrEqual(500)
      expect(definition.recoveryMs).toBeGreaterThanOrEqual(500)
      expect(skill.dangerHint.length).toBeGreaterThanOrEqual(6)
      expect(skill.knockback).toBeGreaterThanOrEqual(60)
    }
  })

  it('keeps prototype damage threatening without allowing a single normal hit to delete the player', () => {
    for (const type of REPRESENTATIVE_MONSTERS) {
      expect(gloamwoodMonsterDamage(type)).toBeGreaterThanOrEqual(2)
      expect(gloamwoodMonsterDamage(type)).toBeLessThanOrEqual(5)
      expect(gloamwoodMonsterDamage(type, true)).toBeGreaterThanOrEqual(gloamwoodMonsterDamage(type))
      expect(gloamwoodMonsterDamage(type, true)).toBeLessThanOrEqual(7)
    }
  })

  it('gives committed melee attacks enough burst speed while stationary skills remain rooted', () => {
    expect(gloamwoodMonsterAttackSpeed('pouncer')).toBeGreaterThan(500)
    expect(gloamwoodMonsterAttackSpeed('razorwing')).toBeGreaterThan(600)
    expect(gloamwoodMonsterAttackSpeed('bloodleech')).toBeGreaterThan(400)
    expect(gloamwoodMonsterAttackSpeed('shellback')).toBe(0)
    expect(gloamwoodMonsterAttackSpeed('spitter')).toBe(0)
    expect(gloamwoodMonsterAttackSpeed('riftweaver')).toBe(0)
  })
})
