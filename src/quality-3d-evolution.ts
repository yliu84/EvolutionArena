export interface Quality3DMorphology {
  overallScale: number
  bodyLength: number
  bodyBulk: number
  headScale: number
  neckScale: number
  hornGrowth: number
  spineGrowth: number
  wingGrowth: number
  tailGrowth: number
  clawGrowth: number
  primary: number
  secondary: number
  armor: number
  horn: number
  eye: number
}

export interface Quality3DEvolutionStage {
  stage: number
  formId: string
  name: string
  title: string
  description: string
  unlock: string
  morphology: Quality3DMorphology
}

export const QUALITY_3D_EVOLUTION_DURATION = 2.8

export const QUALITY_3D_EVOLUTION_STAGES: readonly Quality3DEvolutionStage[] = [
  {
    stage: 0,
    formId: 'moss-hatchling',
    name: '苔鳞幼蜥',
    title: '林间初生',
    description: '头大、短腿、翼芽未醒，对世界充满好奇。',
    unlock: '初始形态',
    morphology: morph(0.84, 1, 1, 1.08, 1, 0.38, 0.34, 0.16, 1, 0.72, 0xb8d8b8, 0x4b876f, 0xb69045, 0xceb981, 0xffa62b),
  },
  {
    stage: 1,
    formId: 'coral-gecko',
    name: '虹冠壁蜥',
    title: '青蓝物种跃迁',
    description: '宽头、吸附足与珊瑚冠成形，颜色和体态完全脱离幼体。',
    unlock: '第一次进化',
    morphology: morph(0.92, 1.04, 1.04, 1.03, 1.05, 0.62, 0.58, 0.28, 1.04, 0.88, 0xa5d0a6, 0x3f7b66, 0xb99b50, 0xd2c08e, 0xffad2f),
  },
  {
    stage: 2,
    formId: 'scarlet-hunter',
    name: '赤爪猎龙',
    title: '前倾捕食者',
    description: '长腿、窄腰、赤红鳞甲和前倾猎杀姿态取代壁蜥轮廓。',
    unlock: '第二次进化',
    morphology: morph(1.01, 1.13, 0.96, 0.96, 1.12, 0.82, 0.78, 0.42, 1.12, 1.12, 0x89b99a, 0x326c5d, 0xbda65a, 0xd7c78d, 0xffb433),
  },
  {
    stage: 3,
    formId: 'azure-wyvern',
    name: '苍翼飞龙',
    title: '双足飞龙',
    description: '前肢转化为巨翼，只保留强壮后足，钴蓝飞龙正式诞生。',
    unlock: '第三次进化',
    morphology: morph(1.12, 1.18, 1.01, 0.92, 1.2, 1.02, 0.98, 0.78, 1.18, 1.25, 0x6da58f, 0x285b56, 0xc0a65d, 0xdfd0a2, 0x62dfff),
  },
  {
    stage: 4,
    formId: 'magma-bulwark',
    name: '熔甲战龙',
    title: '黑曜重甲',
    description: '回归四足重心，黑曜厚甲与熔岩脊板构成冲锋战龙。',
    unlock: '第四次进化',
    morphology: morph(1.24, 1.22, 1.13, 0.9, 1.25, 1.25, 1.24, 1.02, 1.24, 1.42, 0x4a8779, 0x173f43, 0xb9954c, 0x9ddbe0, 0x69f3ff),
  },
  {
    stage: 5,
    formId: 'frost-sovereign',
    name: '霜穹巨龙',
    title: '银白成年龙',
    description: '长颈、修长龙躯和冰晶巨翼形成高贵的天空统治者。',
    unlock: '第五次进化',
    morphology: morph(1.36, 1.28, 1.2, 0.87, 1.32, 1.5, 1.48, 1.3, 1.31, 1.58, 0x326e66, 0x102e38, 0xc39b45, 0xc8d9d5, 0x87f8ff),
  },
  {
    stage: 6,
    formId: 'golden-ancient',
    name: '曜金龙皇',
    title: '王者终极形态',
    description: '厚重曜金龙躯、深红巨翼和王冠长角构成最终龙皇。',
    unlock: '第六次进化',
    morphology: morph(1.48, 1.34, 1.27, 0.86, 1.38, 1.78, 1.72, 1.58, 1.38, 1.78, 0x2b625d, 0x0a2530, 0xd2aa4f, 0xf0d58a, 0xffe478),
  },
] as const

export function getQuality3DEvolutionStage(stage: number) {
  return QUALITY_3D_EVOLUTION_STAGES[Math.max(0, Math.min(QUALITY_3D_EVOLUTION_STAGES.length - 1, Math.round(stage)))]
}

export function mixQuality3DMorphology(from: Quality3DMorphology, to: Quality3DMorphology, progress: number): Quality3DMorphology {
  const t = Math.max(0, Math.min(1, progress))
  if (t === 0) return from
  if (t === 1) return to
  return {
    overallScale: lerp(from.overallScale, to.overallScale, t),
    bodyLength: lerp(from.bodyLength, to.bodyLength, t),
    bodyBulk: lerp(from.bodyBulk, to.bodyBulk, t),
    headScale: lerp(from.headScale, to.headScale, t),
    neckScale: lerp(from.neckScale, to.neckScale, t),
    hornGrowth: lerp(from.hornGrowth, to.hornGrowth, t),
    spineGrowth: lerp(from.spineGrowth, to.spineGrowth, t),
    wingGrowth: lerp(from.wingGrowth, to.wingGrowth, t),
    tailGrowth: lerp(from.tailGrowth, to.tailGrowth, t),
    clawGrowth: lerp(from.clawGrowth, to.clawGrowth, t),
    primary: mixHex(from.primary, to.primary, t),
    secondary: mixHex(from.secondary, to.secondary, t),
    armor: mixHex(from.armor, to.armor, t),
    horn: mixHex(from.horn, to.horn, t),
    eye: mixHex(from.eye, to.eye, t),
  }
}

export function getQuality3DEvolutionEnvelope(elapsed: number, duration = QUALITY_3D_EVOLUTION_DURATION) {
  const raw = Math.max(0, Math.min(1, elapsed / Math.max(duration, 0.001)))
  const anticipation = raw < 0.18 ? easeInOut(raw / 0.18) : 1
  const growthRaw = Math.max(0, Math.min(1, (raw - 0.15) / 0.58))
  const growth = easeInOut(growthRaw)
  const impact = Math.exp(-Math.pow((raw - 0.74) / 0.075, 2))
  const settle = raw < 0.74 ? 0 : easeOut((raw - 0.74) / 0.26)
  return { raw, anticipation, growth, impact, settle, complete: raw >= 1 }
}

function morph(
  overallScale: number,
  bodyLength: number,
  bodyBulk: number,
  headScale: number,
  neckScale: number,
  hornGrowth: number,
  spineGrowth: number,
  wingGrowth: number,
  tailGrowth: number,
  clawGrowth: number,
  primary: number,
  secondary: number,
  armor: number,
  horn: number,
  eye: number,
): Quality3DMorphology {
  return { overallScale, bodyLength, bodyBulk, headScale, neckScale, hornGrowth, spineGrowth, wingGrowth, tailGrowth, clawGrowth, primary, secondary, armor, horn, eye }
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t
}

function easeInOut(value: number) {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

function easeOut(value: number) {
  const t = Math.max(0, Math.min(1, value))
  return 1 - Math.pow(1 - t, 3)
}

function mixHex(from: number, to: number, t: number) {
  const channel = (shift: number) => Math.round(lerp((from >> shift) & 0xff, (to >> shift) & 0xff, t))
  return (channel(16) << 16) | (channel(8) << 8) | channel(0)
}
