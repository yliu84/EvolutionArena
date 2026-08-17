import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'
import { SCARLET_GECKO_PRESENTATION } from './scarlet-gecko-character-presentation'
import { SCARLET_HUNTER_PRESENTATION } from './scarlet-hunter-character-presentation'

export interface Quality3DGLBAsset {
  stage: 0 | 1 | 2 | 3 | 6
  formId: 'coral-gecko' | 'scarlet-gecko' | 'scarlet-hunter' | 'azure-wyvern' | 'golden-ancient'
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
  ),
  asset(3, 'azure-wyvern', '/assets/quality-3d/models/azure-wyvern-v1.glb', 0.68, ['Body', 'Head', 'LegBL', 'LegBR', 'WingL', 'WingR', 'Tail_0']),
  asset(6, 'golden-ancient', '/assets/quality-3d/models/golden-ancient-v1.glb', 0.74, ['Body', 'Head', 'LegFL', 'LegFR', 'LegBL', 'LegBR', 'WingL', 'WingR', 'Tail_0']),
] as const

export function getQuality3DGLBAsset(stage: number) {
  return QUALITY_3D_GLB_ASSETS.find((asset) => asset.stage === stage)
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
): Quality3DGLBAsset {
  return {
    stage,
    formId,
    url,
    scale,
    requiredNodes,
    requiredClips,
    motion,
    modelYaw,
    rig,
  }
}
