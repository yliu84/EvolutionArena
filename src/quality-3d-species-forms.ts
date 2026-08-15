export type Quality3DBodyPlan = 'hatchling-lizard' | 'crested-gecko' | 'predator-drake' | 'sky-wyvern' | 'armored-dragon' | 'frost-dragon' | 'ancient-dragon'

export interface Quality3DSpeciesForm {
  lineage: 'lizard-dragon'
  stage: number
  formId: string
  bodyPlan: Quality3DBodyPlan
  scale: number
  bodyLength: number
  bodyHeight: number
  bodyWidth: number
  bodyY: number
  headX: number
  headY: number
  headLength: number
  headHeight: number
  headWidth: number
  snoutLength: number
  legCount: 2 | 4
  legLength: number
  legSpread: number
  tailSegments: number
  tailLength: number
  wingSpan: number
  wingChord: number
  hornCount: number
  spineCount: number
  armorLevel: number
  primary: number
  secondary: number
  accent: number
  membrane: number
  eye: number
}

export const QUALITY_3D_LIZARD_DRAGON_FORMS: readonly Quality3DSpeciesForm[] = [
  form(0, 'moss-hatchling', 'hatchling-lizard', 0.72, 1.12, 0.42, 0.58, 0.54, 0.92, 0.68, 0.48, 0.42, 0.5, 0.25, 4, 0.4, 0.48, 7, 1.85, 0, 0, 0, 0, 0, 0x8ecb76, 0x4b7a55, 0xf0d873, 0, 0xffb52e),
  form(1, 'coral-gecko', 'crested-gecko', 0.82, 1.42, 0.46, 0.76, 0.6, 1.12, 0.76, 0.58, 0.4, 0.68, 0.34, 4, 0.5, 0.64, 8, 2.3, 0, 0, 0, 6, 0.08, 0x35bcb4, 0x176f75, 0xff795f, 0, 0xffdf72),
  form(2, 'scarlet-hunter', 'predator-drake', 0.96, 1.66, 0.62, 0.68, 0.84, 1.42, 1.08, 0.62, 0.48, 0.54, 0.62, 4, 0.78, 0.58, 9, 2.75, 0, 0, 2, 5, 0.22, 0xb93e38, 0x351e2a, 0xf3b34b, 0, 0xffdd55),
  form(3, 'azure-wyvern', 'sky-wyvern', 1.08, 1.58, 0.84, 0.74, 1.06, 1.5, 1.5, 0.66, 0.52, 0.58, 0.7, 2, 0.94, 0.62, 9, 2.9, 2.65, 1.6, 4, 4, 0.18, 0x397ed0, 0x173e78, 0x6ff1e7, 0x2459a8, 0x9affff),
  form(4, 'magma-bulwark', 'armored-dragon', 1.18, 1.95, 1.02, 1.08, 1.12, 1.66, 1.4, 0.76, 0.62, 0.7, 0.78, 4, 0.84, 0.86, 8, 2.65, 1.55, 1.05, 5, 9, 0.95, 0x332f38, 0x171821, 0xff713d, 0x632b32, 0xff9d42),
  form(5, 'frost-sovereign', 'frost-dragon', 1.3, 2.12, 0.92, 0.92, 1.24, 1.92, 1.8, 0.72, 0.58, 0.62, 0.88, 4, 1.02, 0.76, 10, 3.35, 3.35, 1.95, 6, 8, 0.52, 0xc7dfe5, 0x557a91, 0x8ef4ff, 0x8acddd, 0xc8ffff),
  form(6, 'golden-ancient', 'ancient-dragon', 1.42, 2.36, 1.16, 1.18, 1.36, 2.1, 1.92, 0.84, 0.68, 0.74, 0.98, 4, 1.08, 0.92, 11, 3.85, 3.9, 2.2, 8, 11, 0.88, 0xf0bd3f, 0x8f2637, 0xffe79a, 0xb2263f, 0xfff4ae),
] as const

export function getQuality3DSpeciesForm(stage: number) {
  return QUALITY_3D_LIZARD_DRAGON_FORMS[Math.max(0, Math.min(QUALITY_3D_LIZARD_DRAGON_FORMS.length - 1, Math.round(stage)))]
}

function form(
  stage: number,
  formId: string,
  bodyPlan: Quality3DBodyPlan,
  scale: number,
  bodyLength: number,
  bodyHeight: number,
  bodyWidth: number,
  bodyY: number,
  headX: number,
  headY: number,
  headLength: number,
  headHeight: number,
  headWidth: number,
  snoutLength: number,
  legCount: 2 | 4,
  legLength: number,
  legSpread: number,
  tailSegments: number,
  tailLength: number,
  wingSpan: number,
  wingChord: number,
  hornCount: number,
  spineCount: number,
  armorLevel: number,
  primary: number,
  secondary: number,
  accent: number,
  membrane: number,
  eye: number,
): Quality3DSpeciesForm {
  return { lineage: 'lizard-dragon', stage, formId, bodyPlan, scale, bodyLength, bodyHeight, bodyWidth, bodyY, headX, headY, headLength, headHeight, headWidth, snoutLength, legCount, legLength, legSpread, tailSegments, tailLength, wingSpan, wingChord, hornCount, spineCount, armorLevel, primary, secondary, accent, membrane, eye }
}
