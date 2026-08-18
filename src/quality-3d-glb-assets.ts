import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'
import { SCARLET_GECKO_PRESENTATION } from './scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'
import { SPORE_STALKER_PRESENTATION } from './spore-stalker-character-presentation'

/**
 * Gene family a form belongs to. Stage 0 and the late-stage endpoints are shared
 * by every route, so they leave this undefined.
 */
export type Quality3DFormFamily = 'fang' | 'shell' | 'swarm'

export interface Quality3DGLBAsset {
  stage: 0 | 1 | 2 | 3 | 6
  formId: 'coral-gecko' | 'scarlet-gecko' | 'scarlet-hunter' | 'stone-pangolin' | 'spore-stalker' | 'azure-wyvern' | 'golden-ancient'
  /** Undefined means the form is route-independent and serves every family. */
  family?: Quality3DFormFamily
  url: string
  scale: number
  requiredNodes: readonly string[]
  requiredClips: readonly string[]
  motion: 'procedural-root' | 'embedded'
  modelYaw?: number
  rig?: {
    body: string
    head: string
    feet: readonly string[]
    tail: readonly string[]
  }
}

export const QUALITY_3D_GLB_ASSETS: readonly Quality3DGLBAsset[] = [
  asset(
    0,
    'coral-gecko',
    '/assets/quality-3d/models/coral-gecko-rigged-runtime-v1.glb?v=texture-budget-v1',
    CORAL_GECKO_PRESENTATION.displayScale,
    ['Body', 'Head', 'Jaw', 'LegFL', 'LegFR', 'LegBL', 'LegBR', 'FootFL', 'FootFR', 'FootBL', 'FootBR', 'Tail_0'],
    'embedded',
    Math.PI / 2,
    ['Idle', 'Run', 'Turn', 'Bite', 'Claw', 'TailSwipe', 'Hit', 'Death'],
  ),
  asset(
    1,
    'scarlet-gecko',
    '/assets/quality-3d/models/scarlet-gecko-rigged-runtime-v1.glb?v=texture-budget-v1',
    SCARLET_GECKO_PRESENTATION.displayScale,
    ['ScarletGeckoMesh', 'Hips', 'chest', 'head', 'frontleg', 'frontleg2', 'R_frontleg', 'R_frontleg2', 'backleg', 'backleg2', 'R_backleg', 'R_backleg2', 'tail', 'tail3'],
    'embedded',
    Math.PI / 2,
    SCARLET_GECKO_PRESENTATION.asset.clips,
    {
      body: 'chest',
      head: 'head',
      feet: ['frontleg2', 'R_frontleg2', 'backleg2', 'R_backleg2'],
      tail: ['tail1', 'tail2', 'tail3'],
    },
    'fang',
  ),
  asset(
    2,
    'scarlet-hunter',
    '/assets/quality-3d/models/scarlet-hunter-quadruped-runtime-v1.glb?v=texture-budget-v1',
    SCARLET_HUNTER_PRESENTATION.displayScale,
    ['ScarletHunterMesh', 'Hips', 'chest', 'head', 'frontleg', 'frontleg2', 'R_frontleg', 'R_frontleg2', 'backleg', 'backleg2', 'R_backleg', 'R_backleg2', 'tail', 'tail3'],
    'embedded',
    Math.PI / 2,
    SCARLET_HUNTER_PRESENTATION.asset.clips,
    {
      body: 'chest',
      head: 'head',
      feet: ['frontleg2', 'R_frontleg2', 'backleg2', 'R_backleg2'],
      tail: ['tail1', 'tail2', 'tail3'],
    },
    'fang',
  ),
  // Shell stage 1. Same 27-bone Meshy quadruped template as the Fang form, so
  // the rig mapping matches; the chain is Bite -> Slam -> TailSwipe because a
  // low head and short stout forelimbs cannot sell a leap.
  asset(
    1,
    'stone-pangolin',
    '/assets/quality-3d/models/stone-pangolin-rigged-runtime-v2.glb?v=shell-stage1-v3-compact',
    SCARLET_GECKO_PRESENTATION.displayScale,
    ['StonePangolinMesh', 'Hips', 'chest', 'head', 'frontleg', 'frontleg2', 'R_frontleg', 'R_frontleg2', 'backleg', 'backleg2', 'R_backleg', 'R_backleg2', 'tail', 'tail3'],
    'embedded',
    Math.PI / 2,
    ['Idle', 'Walk', 'Run', 'Turn', 'Bite', 'Slam', 'TailSwipe', 'Hit', 'Death'],
    {
      body: 'chest',
      head: 'head',
      feet: ['frontleg2', 'R_frontleg2', 'backleg2', 'R_backleg2'],
      tail: ['tail1', 'tail2', 'tail3'],
    },
    'shell',
  ),
  // Swarm stage 1. Same 27-bone Meshy quadruped template again, so the rig
  // mapping is identical to both other stage-1 forms; the chain keeps Pounce
  // because this body's long hind legs can actually sell a leap.
  asset(
    1,
    'spore-stalker',
    '/assets/quality-3d/models/spore-stalker-rigged-runtime-v1.glb?v=swarm-stage1-v3-bite-finisher',
    SPORE_STALKER_PRESENTATION.displayScale,
    ['SporeStalkerMesh', 'Hips', 'chest', 'head', 'frontleg', 'frontleg2', 'R_frontleg', 'R_frontleg2', 'backleg', 'backleg2', 'R_backleg', 'R_backleg2', 'tail', 'tail3'],
    'embedded',
    Math.PI / 2,
    SPORE_STALKER_PRESENTATION.asset.clips,
    {
      body: 'chest',
      head: 'head',
      feet: ['frontleg2', 'R_frontleg2', 'backleg2', 'R_backleg2'],
      tail: ['tail1', 'tail2', 'tail3'],
    },
    'swarm',
  ),
  asset(3, 'azure-wyvern', '/assets/quality-3d/models/azure-wyvern-v1.glb', 0.68, ['Body', 'Head', 'LegBL', 'LegBR', 'WingL', 'WingR', 'Tail_0']),
  asset(6, 'golden-ancient', '/assets/quality-3d/models/golden-ancient-v1.glb', 0.74, ['Body', 'Head', 'LegFL', 'LegFR', 'LegBL', 'LegBR', 'WingL', 'WingR', 'Tail_0']),
] as const

/**
 * Resolve the runtime GLB for a stage, preferring the requested gene family.
 *
 * Only the Fang line has authored stage-1/2 models today, so a Shell or Swarm
 * request still falls back to the Fang form. `matchedFamily` reports whether the
 * route actually got its own body, so debug state can show the substitution
 * instead of silently presenting one form as three.
 */
export function resolveQuality3DGLBAsset(stage: number, family?: Quality3DFormFamily) {
  const atStage = QUALITY_3D_GLB_ASSETS.filter((asset) => asset.stage === stage)
  if (atStage.length === 0) return { asset: undefined, matchedFamily: false }
  const exact = family ? atStage.find((asset) => asset.family === family) : undefined
  if (exact) return { asset: exact, matchedFamily: true }
  const shared = atStage.find((asset) => asset.family === undefined)
  // A route-independent form serves every family, so it is not a substitution.
  if (shared) return { asset: shared, matchedFamily: true }
  return { asset: atStage[0], matchedFamily: family === undefined }
}

export function getQuality3DGLBAsset(stage: number, family?: Quality3DFormFamily) {
  return resolveQuality3DGLBAsset(stage, family).asset
}

function asset(
  stage: Quality3DGLBAsset['stage'],
  formId: Quality3DGLBAsset['formId'],
  url: string,
  scale: number,
  requiredNodes: readonly string[],
  motion: Quality3DGLBAsset['motion'] = 'embedded',
  modelYaw = 0,
  requiredClips: readonly string[] = motion === 'embedded' ? ['Idle', 'Run'] : [],
  rig?: Quality3DGLBAsset['rig'],
  family?: Quality3DFormFamily,
): Quality3DGLBAsset {
  return {
    stage,
    formId,
    family,
    url,
    scale,
    requiredNodes,
    requiredClips,
    motion,
    modelYaw,
    rig,
  }
}
