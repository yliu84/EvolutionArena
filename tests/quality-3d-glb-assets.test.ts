import { describe, expect, it } from 'vitest'
import { AnimationClip, Euler, MathUtils, Quaternion, QuaternionKeyframeTrack } from 'three'
import {
  getQuality3DGLBAsset,
  resolveQuality3DGLBAsset,
  QUALITY_3D_GLB_ASSETS,
  QUALITY_3D_PRODUCED_FAMILIES,
  type Quality3DFormFamily,
  quality3DBodyStageForFamily,
} from '../src/quality-3d-glb-assets'
import { CORAL_GECKO_PRESENTATION } from '../src/quality-3d-character-presentation'
import {
  SCARLET_GECKO_LOCOMOTION_STABILITY,
  SCARLET_GECKO_PRESENTATION,
  SCARLET_GECKO_SURFACE_GRADE,
  stabilizeScarletGeckoLocomotionClip,
} from '../src/scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from '../src/scarlet-hunter-character-presentation'

describe('quality 3D GLB vertical slice assets', () => {
  it('defines independent stage-0, first-evolution, second-evolution, wyvern and ancient assets', () => {
    // Stage 1 now carries all three bodies: Fang scarlet-gecko, Shell
    // stone-pangolin and Swarm spore-stalker.
    expect(QUALITY_3D_GLB_ASSETS.map((asset) => asset.stage)).toEqual([0, 1, 2, 1, 1, 3, 6])
    expect(new Set(QUALITY_3D_GLB_ASSETS.map((asset) => asset.formId)).size).toBe(7)
    expect(new Set(QUALITY_3D_GLB_ASSETS.map((asset) => asset.url)).size).toBe(7)
    // Every form still owns a distinct GLB; none may share a runtime file.
    expect(QUALITY_3D_GLB_ASSETS).toHaveLength(7)
  })

  it('keys evolved forms by gene family so routes can own separate bodies', () => {
    // Stage 0 is the shared origin; the authored evolutions belong to Fang.
    expect(getQuality3DGLBAsset(0)?.family).toBeUndefined()
    expect(getQuality3DGLBAsset(1)?.family).toBe('fang')
    expect(getQuality3DGLBAsset(2)?.family).toBe('fang')
  })

  it('resolves a family to its own body and reports when it borrows another', () => {
    const fang = resolveQuality3DGLBAsset(1, 'fang')
    expect(fang.asset?.formId).toBe('scarlet-gecko')
    expect(fang.matchedFamily).toBe(true)

    // Shell now has its own stage-1 body rather than wearing the Fang one.
    const shell = resolveQuality3DGLBAsset(1, 'shell')
    expect(shell.asset?.formId).toBe('stone-pangolin')
    expect(shell.matchedFamily).toBe(true)

    // Swarm now has one too, so every stage-1 route serves its own animal. This
    // was the last card on the evolution screen whose picture and stat line were
    // true while the body it handed you was the Fang gecko under another name.
    const swarm = resolveQuality3DGLBAsset(1, 'swarm')
    expect(swarm.asset?.formId).toBe('spore-stalker')
    expect(swarm.matchedFamily).toBe(true)
    for (const family of ['fang', 'shell', 'swarm'] as const) {
      expect(resolveQuality3DGLBAsset(1, family).matchedFamily, family).toBe(true)
    }

    // Stage 0 serves every route, so it is not a substitution.
    expect(resolveQuality3DGLBAsset(0, 'shell').matchedFamily).toBe(true)
  })

  it('gives the Swarm stage-1 form its own mesh and its own chain', () => {
    const swarm = resolveQuality3DGLBAsset(1, 'swarm').asset
    expect(swarm?.url).toContain('spore-stalker-rigged-runtime-v1.glb')
    // Cache tag must change whenever the GLB is rebuilt, or browsers serve the old one.
    expect(swarm?.url).toContain('v=swarm-stage1-v3')
    // Four steps against three, opening on the leap instead of centring on it,
    // with a Claw clip neither other stage-1 form carries.
    expect(swarm?.requiredClips).toContain('Pounce')
    expect(swarm?.requiredClips).toContain('Claw')
    expect(swarm?.requiredClips).not.toContain('Slam')
    // Same 27-bone Meshy quadruped template as both other stage-1 rigs.
    expect(swarm?.rig).toEqual(resolveQuality3DGLBAsset(1, 'fang').asset?.rig)
    expect(swarm?.requiredNodes).toContain('SporeStalkerMesh')
  })

  it('gives the Shell stage-1 form its own chain and mesh, sharing the rig template', () => {
    const shell = resolveQuality3DGLBAsset(1, 'shell').asset
    // The runtime serves the texture-optimized variant, not the authoring master.
    expect(shell?.url).toContain('stone-pangolin-rigged-runtime-v2.glb')
    // Cache tag must change whenever the GLB is rebuilt, or browsers serve the old one.
    expect(shell?.url).toContain('v=shell-stage1-v3')
    // Slam replaces Pounce: short stout forelimbs cannot support a leap.
    expect(shell?.requiredClips).toContain('Slam')
    expect(shell?.requiredClips).not.toContain('Pounce')
    expect(shell?.requiredClips).not.toContain('Claw')
    // Same 27-bone Meshy quadruped template as the accepted Fang stage-1 rig.
    expect(shell?.rig).toEqual(resolveQuality3DGLBAsset(1, 'fang').asset?.rig)
    expect(shell?.requiredNodes).toContain('StonePangolinMesh')
  })

  it('keeps the family-less lookup resolving exactly as before', () => {
    for (const stage of [0, 1, 2, 3, 6]) {
      expect(getQuality3DGLBAsset(stage)?.formId).toBe(
        QUALITY_3D_GLB_ASSETS.find((asset) => asset.stage === stage)?.formId,
      )
    }
    expect(resolveQuality3DGLBAsset(4).asset).toBeUndefined()
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
    expect(coralGecko?.url).toContain('coral-gecko-rigged-runtime-v2.glb')
    // Bumped with the file. The rig was refitted onto the sculpt, and a browser
    // holding the old skin would keep walking the player's starting body on two
    // legs long after the fix shipped.
    expect(coralGecko?.url).toContain('refit-rig-v1')

    const scarletGecko = getQuality3DGLBAsset(1)
    expect(scarletGecko).toMatchObject({
      formId: 'scarlet-gecko',
      scale: SCARLET_GECKO_PRESENTATION.displayScale,
      motion: 'embedded',
    })
    expect(scarletGecko?.requiredClips).toEqual(SCARLET_GECKO_PRESENTATION.asset.clips)
    expect(scarletGecko?.requiredNodes).toEqual(expect.arrayContaining([
      'ScarletGeckoMesh', 'Hips', 'chest', 'head', 'frontleg2', 'R_frontleg2', 'backleg2', 'R_backleg2', 'tail', 'tail3',
    ]))
    expect(scarletGecko?.rig).toEqual({
      body: 'chest',
      head: 'head',
      feet: ['frontleg2', 'R_frontleg2', 'backleg2', 'R_backleg2'],
      tail: ['tail1', 'tail2', 'tail3'],
    })

    const scarletHunter = getQuality3DGLBAsset(2)
    expect(scarletHunter).toMatchObject({
      formId: 'scarlet-hunter',
      scale: SCARLET_HUNTER_PRESENTATION.displayScale,
      motion: 'embedded',
      modelYaw: Math.PI / 2,
    })
    expect(scarletHunter?.requiredClips).toEqual(SCARLET_HUNTER_PRESENTATION.asset.clips)
    expect(scarletHunter?.requiredNodes).toEqual(expect.arrayContaining([
      'ScarletHunterMesh', 'Hips', 'chest', 'head', 'frontleg', 'frontleg2', 'R_frontleg', 'R_frontleg2',
      'backleg', 'backleg2', 'R_backleg', 'R_backleg2', 'tail', 'tail3',
    ]))
    expect(scarletHunter?.rig).toEqual({
      body: 'chest',
      head: 'head',
      feet: ['frontleg2', 'R_frontleg2', 'backleg2', 'R_backleg2'],
      tail: ['tail1', 'tail2', 'tail3'],
    })

    for (const asset of QUALITY_3D_GLB_ASSETS.filter((candidate) => candidate.motion === 'embedded')) {
      expect(asset.requiredClips).toEqual(expect.arrayContaining(['Idle', 'Run']))
      if (asset.rig) continue
      expect(asset.requiredNodes).toContain('Body')
      expect(asset.requiredNodes).toContain('Head')
      expect(asset.requiredNodes).toContain('Tail_0')
    }
    expect(getQuality3DGLBAsset(3)?.requiredNodes).not.toContain('LegFL')
    expect(getQuality3DGLBAsset(3)?.requiredNodes).toContain('WingL')
  })

  it('locks the first-evolution V2 candidate and the stage-2 reusable quadruped template', () => {
    expect(SCARLET_GECKO_PRESENTATION).toMatchObject({
      baselineId: 'scarlet-gecko-first-evolution-master-v2',
      displayScale: 166.1,
      combat: {
        profileId: 'scarlet-gecko-combat-master-v1',
        system: 'basic-attack',
        skillsEnabled: false,
        primaryCombo: ['Bite', 'Pounce', 'TailSwipe'],
        attackNames: { Bite: '撕咬', Pounce: '跃起重咬', TailSwipe: '旋身尾扫' },
        pounceVisualTravelScale: 0.32,
        pounceVisualLiftScale: 1.65,
      },
      animation: {
        runPlaybackRate: 1.45,
        footstepEventsPerSecond: 5.8,
        authoredStrideAmplification: 1.22,
      },
      asset: {
        triangles: 19406,
        bones: 27,
        bodyPlan: 'coral-crested-gecko-drake',
        runtimeModel: 'scarlet-gecko-rigged-v2.glb',
        artStyle: 'stylized-handpainted-quadruped',
      },
      silhouette: { attachmentCount: 0, dominantRead: 'volumetric-coral-crested-gecko-drake' },
      material: {
        colorTint: 0xb88a7d,
        minimumRoughness: 0.46,
        maximumRoughness: 0.64,
        normalStrength: 0.62,
        environmentIntensity: 0.5,
        emissiveIntensity: 0.18,
      },
    })
    expect(SCARLET_HUNTER_PRESENTATION.displayScale / SCARLET_GECKO_PRESENTATION.displayScale).toBeCloseTo(1.18, 2)
    expect(SCARLET_GECKO_SURFACE_GRADE).toEqual({ contrast: 1.16, saturation: 1.24 })
    expect(SCARLET_GECKO_LOCOMOTION_STABILITY).toEqual({
      coreBones: ['Hips', 'chest', 'head'],
      yawScale: 0.22,
      rollScale: 0.18,
    })
    expect(getQuality3DGLBAsset(1)?.url).toContain('scarlet-gecko-rigged-runtime-v1.glb')
    expect(SCARLET_HUNTER_PRESENTATION).toMatchObject({
      baselineId: 'scarlet-hunter-quadruped-template-v1',
      displayScale: 196,
      stageGrowthRatio: 1.18,
      templateId: 'meshy-quadruped-combat-v1',
      combat: {
        profileId: 'scarlet-hunter-combat-master-v1',
        skillsEnabled: false,
        primaryCombo: ['Claw', 'Pounce', 'TailSwipe'],
        attackNames: { Claw: '裂爪', Pounce: '双爪跃扑', TailSwipe: '旋身尾扫' },
        pounceMotion: {
          contactSeconds: 0.42,
          visualTravel: 0.72,
          damageEvents: 1,
        },
      },
      asset: {
        triangles: 54828,
        bones: 27,
        bodyPlan: 'broad-chested-hunter-drake',
        runtimeModel: 'scarlet-hunter-quadruped-v1.glb',
        artStyle: 'stylized-handpainted-quadruped',
      },
      silhouette: { dominantRead: 'crested-scarlet-pounce-drake' },
      material: { normalStrength: 0, environmentIntensity: 0.58 },
    })
    expect(SCARLET_HUNTER_PRESENTATION.stageGrowthRatio).toBeCloseTo(1.18)
    expect(getQuality3DGLBAsset(2)?.url).toContain('scarlet-hunter-quadruped-runtime-v1.glb')
  })

  it('stabilizes core yaw and roll in stage-one locomotion without mutating the source clip', () => {
    const rest = new Quaternion()
    const swayed = new Quaternion().setFromEuler(new Euler(0, MathUtils.degToRad(20), MathUtils.degToRad(10), 'XYZ'))
    const source = new AnimationClip('Run', 1, [
      new QuaternionKeyframeTrack('Hips.quaternion', [0, 1], [
        rest.x, rest.y, rest.z, rest.w,
        swayed.x, swayed.y, swayed.z, swayed.w,
      ]),
    ])
    const stabilized = stabilizeScarletGeckoLocomotionClip(source)
    const values = stabilized.tracks[0].values
    const adjusted = new Euler().setFromQuaternion(
      new Quaternion(values[4], values[5], values[6], values[7]),
      'XYZ',
    )

    expect(stabilized).not.toBe(source)
    expect(MathUtils.radToDeg(Math.abs(adjusted.y))).toBeLessThan(5)
    expect(MathUtils.radToDeg(Math.abs(adjusted.z))).toBeLessThan(3)
    expect(source.tracks[0].values[5]).toBeCloseTo(swayed.y)
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
      primaryCombo: ['Bite', 'Pounce', 'TailSwipe'],
      attackNames: { Bite: '快速撕咬', Pounce: '跃起重咬', TailSwipe: '尾扫' },
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

describe('Six gene families, produced one at a time', () => {
  it('names all six, including the three with no body yet', () => {
    // Decided 2026-08-18: the eight MapLab 4 nest archetypes were authored
    // against six families, and the user chose to honour that rather than fold
    // them into three. Declaring them now means adding a body later is a data
    // change rather than a structural one.
    const families: Quality3DFormFamily[] = ['fang', 'shell', 'swarm', 'wing', 'venom', 'rift']
    for (const family of families) {
      const resolved = resolveQuality3DGLBAsset(1, family)
      expect(resolved.asset, family).toBeDefined()
    }
  })

  it('says so when an unproduced family borrows another body', () => {
    // Silence here is the failure mode: a route whose card promises a different
    // animal and quietly delivers the Fang gecko is exactly what stage 1 looked
    // like before the Shell and Swarm bodies existed.
    for (const family of QUALITY_3D_PRODUCED_FAMILIES) {
      expect(resolveQuality3DGLBAsset(1, family).matchedFamily, family).toBe(true)
    }
    for (const family of ['wing', 'venom', 'rift'] as const) {
      expect(resolveQuality3DGLBAsset(1, family).matchedFamily, family).toBe(false)
    }
  })
})

describe('Growing without becoming another animal', () => {
  it('gives the Fang route its own stage-2 body', () => {
    expect(quality3DBodyStageForFamily(2, 'fang')).toBe(2)
    expect(getQuality3DGLBAsset(2, 'fang')?.formId).toBe('scarlet-hunter')
  })

  it('keeps a route with no stage-2 body in the one it has', () => {
    // Stage 2 is authored only for the Fang line. Asked for a stage-2 Shell the
    // resolver falls back to whatever exists at that stage, so a stone pangolin
    // evolving a second time turned into a scarlet hunter - a different animal
    // from a different route. Growing is not becoming something else.
    expect(quality3DBodyStageForFamily(2, 'shell')).toBe(1)
    expect(quality3DBodyStageForFamily(2, 'swarm')).toBe(1)
    expect(getQuality3DGLBAsset(quality3DBodyStageForFamily(2, 'shell'), 'shell')?.formId).toBe('stone-pangolin')
    expect(getQuality3DGLBAsset(quality3DBodyStageForFamily(2, 'swarm'), 'swarm')?.formId).toBe('spore-stalker')
  })

  it('never answers with another route\'s body', () => {
    // A route-independent form serves everyone and is not a substitution; a
    // form belonging to a different family is.
    for (const family of QUALITY_3D_PRODUCED_FAMILIES) {
      for (const asked of [1, 2, 3, 9]) {
        const stage = quality3DBodyStageForFamily(asked, family)
        const asset = getQuality3DGLBAsset(stage, family)
        expect(asset, `${family} at ${asked}`).toBeDefined()
        expect(asset?.family === undefined || asset?.family === family, `${family} at ${asked} wore ${asset?.formId}`).toBe(true)
        expect(stage).toBeLessThanOrEqual(asked)
      }
    }
  })
})
