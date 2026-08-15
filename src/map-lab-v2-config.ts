export const MAP_LAB_V2 = {
  sceneKey: 'map-lab-v2',
  version: 2,
  mapId: 'gloamwood',
  initialStage: 'atmosphere',
  language: 'dark-readable-2.5d',
  stages: {
    ground: {
      assetKey: 'gloamwood-v2-ground',
      assetPath: 'assets/map-lab-v2/gloamwood-ground-v1.png',
      label: '第一层 · 基础地面',
    },
    elevation: {
      assetKey: 'gloamwood-v2-elevation',
      assetPath: 'assets/map-lab-v2/gloamwood-elevation-v1.png',
      label: '第二层 · 高差与悬崖',
    },
    riverbanks: {
      assetKey: 'gloamwood-v2-riverbanks',
      assetPath: 'assets/map-lab-v2/gloamwood-riverbanks-v1.png',
      label: '第三层 · 河岸与浅滩',
    },
    trees: {
      assetKey: 'gloamwood-v2-trees',
      assetPath: 'assets/map-lab-v2/gloamwood-trees-v1.png',
      label: '第四层 · 树木分层',
    },
    landmarks: {
      assetKey: 'gloamwood-v2-landmarks',
      assetPath: 'assets/map-lab-v2/gloamwood-landmarks-v1.png',
      label: '第五层 · 岩石与遗迹',
    },
    atmosphere: {
      assetKey: 'gloamwood-v2-atmosphere',
      assetPath: 'assets/map-lab-v2/gloamwood-atmosphere-v1.png',
      label: '第六层 · 雾光氛围',
    },
  },
  width: 1672,
  height: 941,
} as const

export type MapLabV2Stage = keyof typeof MAP_LAB_V2.stages

export function isMapLabV2Requested(search = window.location.search) {
  return new URLSearchParams(search).get('maplab') === '2'
}
