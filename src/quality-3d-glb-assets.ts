import { CORAL_GECKO_PRESENTATION } from './quality-3d-character-presentation'

export interface Quality3DGLBAsset {
  stage: 0 | 3 | 6
  formId: 'coral-gecko' | 'azure-wyvern' | 'golden-ancient'
  url: string
  scale: number
  requiredNodes: readonly string[]
  requiredClips: readonly string[]
  motion: 'procedural-root' | 'embedded'
  modelYaw?: number
}

export const QUALITY_3D_GLB_ASSETS: readonly Quality3DGLBAsset[] = [
  asset(
    0,
    'coral-gecko',
    '/assets/quality-3d/models/coral-gecko-rigged-v3.glb',
    CORAL_GECKO_PRESENTATION.displayScale,
    ['Body', 'Head', 'Jaw', 'LegFL', 'LegFR', 'LegBL', 'LegBR', 'FootFL', 'FootFR', 'FootBL', 'FootBR', 'Tail_0'],
    'embedded',
    Math.PI / 2,
    ['Idle', 'Run', 'Turn', 'Bite', 'Claw', 'TailSwipe', 'Hit', 'Death'],
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
  }
}
