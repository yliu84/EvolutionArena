import { describe, expect, it } from 'vitest'
import { getQuality3DGLBAsset, QUALITY_3D_GLB_ASSETS } from '../src/quality-3d-glb-assets'
import { CORAL_GECKO_PRESENTATION } from '../src/quality-3d-character-presentation'

describe('quality 3D GLB vertical slice assets', () => {
  it('defines independent hatchling, wyvern and ancient-dragon assets', () => {
    expect(QUALITY_3D_GLB_ASSETS.map((asset) => asset.stage)).toEqual([0, 3, 6])
    expect(new Set(QUALITY_3D_GLB_ASSETS.map((asset) => asset.formId)).size).toBe(3)
    expect(new Set(QUALITY_3D_GLB_ASSETS.map((asset) => asset.url)).size).toBe(3)
  })

  it('requires locomotion clips and body-plan-specific nodes', () => {
    const coralGecko = getQuality3DGLBAsset(0)
    expect(coralGecko?.formId).toBe('coral-gecko')
    expect(coralGecko?.scale).toBe(CORAL_GECKO_PRESENTATION.displayScale)
    expect(coralGecko?.motion).toBe('embedded')
    expect(coralGecko?.requiredClips).toEqual(['Idle', 'Run', 'Turn', 'Bite', 'Claw', 'TailSwipe', 'Hit', 'Death'])
    expect(coralGecko?.requiredNodes).toContain('FootFL')
    expect(coralGecko?.requiredNodes).toContain('FootBR')
    expect(coralGecko?.requiredNodes).toContain('Jaw')
    expect(coralGecko?.url).toContain('coral-gecko-rigged')

    for (const asset of QUALITY_3D_GLB_ASSETS.filter((candidate) => candidate.motion === 'embedded')) {
      expect(asset.requiredClips).toEqual(expect.arrayContaining(['Idle', 'Run']))
      expect(asset.requiredNodes).toContain('Body')
      expect(asset.requiredNodes).toContain('Head')
      expect(asset.requiredNodes).toContain('Tail_0')
    }
    expect(getQuality3DGLBAsset(3)?.requiredNodes).not.toContain('LegFL')
    expect(getQuality3DGLBAsset(3)?.requiredNodes).toContain('WingL')
    expect(getQuality3DGLBAsset(1)).toBeUndefined()
  })

  it('keeps the accepted coral-gecko quality baseline as structured tuning data', () => {
    expect(CORAL_GECKO_PRESENTATION.baselineId).toBe('coral-gecko-master-v1')
    expect(CORAL_GECKO_PRESENTATION.displayScale).toBe(1.25)
    expect(CORAL_GECKO_PRESENTATION.animation).toMatchObject({
      runPlaybackRate: 3.2,
      turnPlaybackRate: 1.2,
      footstepEventsPerSecond: 6.4,
    })
    expect(CORAL_GECKO_PRESENTATION.dust).toMatchObject({
      poolSize: 14,
      durationSeconds: 0.58,
      startScale: 0.42,
      peakOpacity: 0.62,
    })
    expect(CORAL_GECKO_PRESENTATION.validation.maximumPlantedFootError).toBe(0.16)
    expect(CORAL_GECKO_PRESENTATION.combat).toMatchObject({
      profileId: 'coral-gecko-combat-master-v1',
      system: 'basic-attack',
      skillsEnabled: false,
      targeting: {
        mode: 'nearest-live-target',
        turnSpeedRadiansPerSecond: 12,
        contactToleranceDegrees: 8,
      },
      demoTarget: {
        name: '甲壳训练虫',
        maxHealth: 84,
        respawnSeconds: 1.8,
        spawnDistance: 2.55,
      },
      hitFeedback: {
        biteDamage: 16,
        clawDamage: 12,
        tailSwipeDamage: 14,
        biteRange: 2.55,
        clawRange: 2.75,
        tailSwipeRange: 3.1,
        flashSeconds: 0.1,
        cameraTrauma: 0.34,
        knockbackSpeed: 2.3,
        particleCount: 9,
      },
      primaryCombo: ['Bite', 'Claw', 'TailSwipe'],
      comboResetSeconds: 1.15,
      biteDurationSeconds: 0.6,
      biteContactSeconds: 0.3,
      clawDurationSeconds: 0.73,
      clawContactSeconds: 0.3,
      tailSwipeDurationSeconds: 0.87,
      tailSwipeContactSeconds: 0.4,
      hitDurationSeconds: 0.47,
      deathDurationSeconds: 1.2,
    })
    expect(CORAL_GECKO_PRESENTATION.weight).toMatchObject({
      stopSettleSeconds: 0.22,
      stepCompression: 0.018,
      turnLean: 0.052,
      maximumGroundCorrection: 0.48,
    })
    expect(CORAL_GECKO_PRESENTATION.material).toMatchObject({
      normalStrength: 1.18,
      aoStrength: 1.28,
      maximumAnisotropy: 8,
    })
    expect(CORAL_GECKO_PRESENTATION.contactShadow).toMatchObject({
      bodyWidth: 1.18,
      bodyLength: 0.62,
      groundLift: 0.045,
    })
  })
})
