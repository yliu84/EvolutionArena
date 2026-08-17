/**
 * Player-facing text for the hunt.
 *
 * English is the primary market, so both locales are stored as data and neither
 * is a translation of the other in code: every string is looked up by key. New
 * player-facing copy must be added here rather than inlined, or it silently
 * ships English-only or Chinese-only.
 *
 * Interpolation uses `{name}` placeholders so word order can differ between
 * locales; English and Chinese frequently need the number in different places.
 */

export type Locale = 'en' | 'zh'

export interface LocalisedString {
  en: string
  zh: string
}

export type TranslationParams = Record<string, string | number>

const STRINGS = {
  // ---- contextual hunter guide -------------------------------------------
  'guide.eyebrow': { en: 'Hunter guide · {step}/{total}', zh: '猎手指引 · {step}/{total}' },

  'guide.move.title': { en: 'Learn to move first', zh: '先学会控制身体' },
  'guide.move.instruction': {
    en: 'Move with {move}, the arrow keys, or the left thumbstick. Your body turns before it walks.',
    zh: '使用{move}、方向键或左侧触控移动；角色会先转身再前进。',
  },
  'guide.move.reason': {
    en: 'Movement, target lock and attacks follow the same rules on keyboard and touch.',
    zh: '移动、锁定和攻击在键鼠与触控上遵循同一套规则。',
  },
  'guide.move.progress': { en: 'Move a little to begin the hunt', zh: '移动一小段开始狩猎' },

  'guide.approach.title': { en: 'Follow the trail to the Corrupted Brood Nest', zh: '沿猎路接近腐根孵育巢' },
  'guide.approach.instruction': {
    en: 'Keep following the dirt path. Entering the nest triggers the first wave.',
    zh: '继续沿土路前进；进入巢穴范围会自动触发第一波。',
  },
  'guide.approach.reason': {
    en: 'Hunting prey for Biomass and Genes is what unlocks this run’s first evolution.',
    zh: '先清理猎物获取Biomass和Genes，才能形成本局第一次随机进化。',
  },
  'guide.approach.progress': { en: '{distance}m to the nest', zh: '距离窝点 {distance}m' },

  'guide.lock.title': { en: 'Lock a threat before you commit', zh: '先锁定威胁，再决定出手顺序' },
  'guide.lock.instruction': {
    en: 'Press {lock}, or Lock on the right, to pick an enemy. Press again to switch targets.',
    zh: '按{lock}或右侧“锁定”选择敌人；再次按下可切换目标。',
  },
  'guide.lock.reason': {
    en: 'Locking does not attack for you. It only fixes which enemy you mean.',
    zh: '锁定不会自动替你攻击，它只固定你的战斗意图。',
  },
  'guide.lock.progress': { en: 'First wave has arrived', zh: '第一波已经出现' },

  'guide.attack.title': { en: 'Lock on, then run the one-button combo', zh: '锁定目标，发动一键连招' },
  'guide.attack.instruction': {
    en: 'Press {attack} and you close in and keep attacking on your own. Steer at any time to take over.',
    zh: '按{attack}会自动接近并持续攻击。任何时候推方向键都可以自己接管。',
  },
  'guide.attack.reason': {
    en: 'Closing in is automatic, the angle is yours, and contact still needs the locked target within 8° of your facing.',
    zh: '接近是自动的，角度归你；命中仍要求锁定目标在朝向 8° 以内。',
  },
  'guide.attack.progress': { en: 'Target locked', zh: '目标已锁定' },

  'guide.hunt.title': { en: 'Hunt their weak points to shape your evolution', zh: '按弱点猎食，塑造下一次进化' },
  'guide.hunt.reason': {
    en: 'Every kill grants Biomass and one family Gene. Biomass opens the evolution; Genes shift which options appear.',
    zh: '每次击杀获得Biomass与一种家族Gene；Biomass开启进化，Genes改变候选概率。',
  },
  'guide.hunt.progress': { en: 'Nest kills {kills}/11 · Biomass {biomass}', zh: '窝点击杀 {kills}/11 · 生物质 {biomass}' },

  'guide.evolution.title': { en: 'Choose your evolution from what you hunted', zh: '根据猎食结果选择随机进化' },
  'guide.evolution.instruction': {
    en: 'Weigh each power against its cost. Press 1–3 to choose, or R to reroll once.',
    zh: '比较三项能力和代价；数字1–3选择，R或“抗拒”可重抽一次。',
  },
  'guide.evolution.reason': {
    en: 'Genes raise the odds of a route appearing; they never guarantee one. That is why every run differs.',
    zh: 'Genes只提高对应路线的出现概率，不保证固定进化；这正是每局不同的来源。',
  },
  'guide.evolution.progress': {
    en: 'Genes · Fang {fang} / Carapace {shell} / Swarm {swarm}',
    zh: 'Genes · 裂牙 {fang} / 岩盾 {shell} / 群生 {swarm}',
  },

  'guide.guardian.title': { en: 'Break the nest’s last defender', zh: '击破窝点最后防线' },
  'guide.guardian.instruction': {
    en: 'The Rootrot Warden guards its front. Strike from the flank or behind, then the Boss opens.',
    zh: '腐根巢卫正面防御很强；绕到侧后攻击，击破后通往Boss。',
  },
  'guide.guardian.reason': {
    en: 'Reach on large enemies is measured to their body surface, so you never need to walk inside them.',
    zh: '体型更大的敌人按身体表面计算攻击距离，不需要钻进模型内部。',
  },
  'guide.guardian.progress': { en: '{distance}m to the Warden', zh: '距离守卫 {distance}m' },

  'guide.boss.title': { en: 'Read the tells, kill the Thornheart Warden', zh: '读预警，猎杀荆心守望者' },
  'guide.boss.reason': {
    en: 'Tells, attack range and safe ground all use the same numbers. Do not trade health for a hit.',
    zh: '预警、攻击范围和安全区使用同一套权威参数；不要用血量硬换。',
  },
  'guide.boss.progress': { en: '{distance}m to the final target', zh: '距离终局目标 {distance}m' },

  'guide.complete.eyebrow': { en: 'Run complete', zh: '本局完成' },
  'guide.complete.title': { en: 'You finished an evolution hunt', zh: '你已经完成一次进化狩猎' },
  'guide.complete.instruction': {
    en: 'Check your build and time, then start again and hunt a different family.',
    zh: '查看本局构筑和用时，然后重新开始尝试不同猎食路线。',
  },
  'guide.complete.reason': {
    en: 'Hunting a different family first changes which evolutions the next run offers you.',
    zh: '更换优先猎食的家族，会改变下一局随机进化的候选权重。',
  },
  'guide.complete.progress': { en: 'Full loop learned', zh: '完整循环已掌握' },

  'guide.recover.eyebrow': { en: 'Defeat review', zh: '失败复盘' },
  'guide.recover.title': { en: 'Find the killing blow, then go again', zh: '看清致命攻击，再开始下一局' },
  'guide.recover.instruction': {
    en: 'The results screen names what killed you. Next run, dodge that tell first.',
    zh: '结算会说明失败来源；重开后优先躲开相同预警。',
  },
  'guide.recover.reason': {
    en: 'Dying costs no knowledge. Boss patterns and safe ground stay learnable.',
    zh: '失败不会删除操作知识；Boss招式和安全区保持可学习。',
  },
  'guide.recover.progress': { en: 'Ready to hunt again', zh: '准备重新狩猎' },

  // ---- family and boss tactical hints -------------------------------------
  'hint.family.shell': {
    en: 'Carapace blocks most damage head-on. Come at it from the flank or behind.',
    zh: '岩盾正面减伤很高；绕到侧后再攻击。',
  },
  'hint.family.swarm': {
    en: 'Swarms rely on numbers but fold to a tail sweep. Do not stand in the middle of the ring.',
    zh: '群虫数量多但怕范围尾扫；不要站在包围圈中央。',
  },
  'hint.family.fang': {
    en: 'Fang hunters are fast but commit hard. Punish the recovery after their strike.',
    zh: '裂牙速度快但硬直明显；抓住攻击后的恢复窗口。',
  },
  'hint.family.unknown': {
    en: 'Read their shape and their tells: all three families open and punish differently.',
    zh: '观察轮廓与预警：三类猎物的弱点和进攻节奏都不同。',
  },

  'hint.boss.root-slam': { en: 'Root Slam: leave the inner ring once the tell lights up.', zh: '根须震击：预警亮起后离开中心内圈。' },
  'hint.boss.thorn-charge': { en: 'Thorn Charge: step sideways out of the lane it locked onto.', zh: '荆棘冲锋：横向离开它锁定的冲锋通道。' },
  'hint.boss.spore-ring': { en: 'Spore Ring: hug the safe centre, or get fully outside the ring.', zh: '孢子环爆：贴近安全内圈，或完全退到外圈。' },
  'hint.boss.unknown': { en: 'Watch the ground tell before you swing. Every Boss move has safe ground.', zh: '先观察地面预警，再攻击；Boss每种招式都有固定安全区。' },

  // ---- hunt scene: HUD, combat, evolution, results, settings --------------
  'hud.msg.approachNest': { en: 'Approach the Corrupted Brood Nest', zh: '接近腐根孵育巢开始清理' },
  'hud.msg.nearNest': { en: 'Get closer to the nest to start clearing it', zh: '靠近腐根孵育巢以开始清理' },
  'a11y.canvas': { en: 'Gloamwood 3D hunting grounds', zh: '幽影林地 3D 狩猎地图' },
  'hud.msg.bossWaking': { en: 'The Thornheart Warden is waking', zh: '荆心守卫即将苏醒' },
  'hud.msg.chooseEvolution': { en: 'Nest cleared · choose your evolution', zh: '窝点已清理 · 请先选择进化' },
  'hud.msg.reinforcements': { en: 'Reinforcements closing in', zh: '增援正在逼近' },
  'hud.msg.nestCleared': { en: 'Nest cleared', zh: '窝点已清理' },
  'hud.msg.noTarget': { en: 'No target to lock', zh: '当前没有可锁定目标' },
  'hud.msg.backToHunt': { en: 'Back into the hunt', zh: '重新投入狩猎' },
  'hud.msg.missNoLock': { en: 'Missed · nothing locked', zh: '挥空 · 没有锁定目标' },
  'hud.msg.missRange': { en: 'Missed · target out of reach', zh: '挥空 · 目标超出攻击距离' },
  'hud.msg.missAngle': { en: 'Missed · more than 8° off aim', zh: '挥空 · 接触角度超过 8°' },
  'hud.msg.missBossRange': { en: 'Missed · Boss out of reach', zh: '挥空 · Boss 超出攻击距离' },
  'hud.msg.nestAwake': { en: 'The nest wakes · first wave incoming', zh: '腐根孵育巢苏醒 · 第一波来袭' },
  'hud.msg.lastWave': { en: 'Last wave broken', zh: '最后一波已击溃' },
  'hud.msg.downed': { en: 'Downed · returning to the hunt', zh: '倒下 · 即将重返狩猎' },
  'attack.rootSlam': { en: 'Root Slam', zh: '根须震击' },
  'attack.thornCharge': { en: 'Thorn Charge', zh: '荆棘冲锋' },
  'attack.sporeRing': { en: 'Spore Ring', zh: '孢子环爆' },
  'attack.bite': { en: 'Bite', zh: '撕咬' },
  'gene.fang': { en: 'Fang Gene', zh: '裂牙基因' },
  'gene.shell': { en: 'Carapace Gene', zh: '岩盾基因' },
  'gene.swarm': { en: 'Swarm Gene', zh: '群生基因' },
  'wave.fangPincer': { en: 'Fast Fang hunters will flank you', zh: '快速裂牙会主动夹击' },
  'wave.shellSwarm': { en: 'Avoid the Carapace front; clear the Swarm first', zh: '绕开岩盾正面，先处理群虫' },
  'wave.mixed': { en: 'Mixed pack · pick your attack and your ground', zh: '混合生态群 · 选择正确攻击与站位' },
  'evo.chooseTitle': { en: 'Choose your first evolution', zh: '选择第一次随机进化' },
  'evo.rerolled': { en: 'Rerolled once · new options formed', zh: '已抗拒一次 · 身体重新组合候选' },
  'result.bossDown': { en: 'The Thornheart Warden has fallen', zh: '荆心守卫已倒下' },
  'result.victory': { en: 'Hunt complete', zh: '猎杀完成' },
  'result.defeat': { en: 'Hunt failed', zh: '猎杀失败' },
  'result.victoryLead': { en: 'Gloamwood is clean', zh: '幽影林地已净化' },
  'result.defeatLead': { en: 'The Thornheart still beats', zh: '荆心仍在跳动' },
  'result.noEvolution': { en: 'No evolution', zh: '未进化' },
  'hud.noTargetLabel': { en: 'No prey locked', zh: '尚未锁定猎物' },
  'hud.undisturbed': { en: 'Undisturbed', zh: '未惊动' },
  'hud.incoming': { en: 'Incoming', zh: '增援逼近' },
  'hud.collapse': { en: 'Less info', zh: '收起信息' },
  'hud.expand': { en: 'More info', zh: '展开信息' },
  'toggle.on': { en: 'On', zh: '开' },
  'toggle.off': { en: 'Off', zh: '关' },
  'bind.moveUp': { en: 'Move up', zh: '向上移动' },
  'bind.moveDown': { en: 'Move down', zh: '向下移动' },
  'bind.moveLeft': { en: 'Move left', zh: '向左移动' },
  'bind.moveRight': { en: 'Move right', zh: '向右移动' },
  'bind.lock': { en: 'Lock target', zh: '锁定目标' },
  'bind.attack': { en: 'Basic attack', zh: '普通攻击' },
  'bind.pause': { en: 'Pause / resume', zh: '暂停/继续' },
  'a11y.touch': { en: 'Touch controls', zh: '触控操作' },
  'touch.move': { en: 'Move', zh: '移动' },
  'touch.lock': { en: 'Lock', zh: '锁定' },
  'fs.howTo': { en: 'How to go full screen', zh: '全屏方法' },
  'fs.exit': { en: 'Exit full screen', zh: '退出全屏' },
  'fs.enter': { en: 'Full screen', zh: '全屏游戏' },
  'a11y.orientation': { en: 'Landscape play prompt', zh: '横屏游戏提示' },
  'a11y.fsTip': { en: 'How to play full screen', zh: '全屏游玩方法' },

  // ---- combat and run messages -------------------------------------------
  'hud.msg.locked': { en: 'Locked · {name}', zh: '已锁定 · {name}' },
  'hud.msg.guardianDown': { en: '{name} has fallen · the Boss opens', zh: '{name}已倒下 · Boss 开启' },
  'hud.msg.kill': { en: 'Killed · {name} · +{biomass} Biomass · +1 {gene}', zh: '击杀 · {name} · +{biomass} 生物质 · +1 {gene}' },
  'hud.msg.bossDown': { en: '{name} has fallen · Gloamwood is clean', zh: '{name}已倒下 · 幽影林地已净化' },
  'hud.msg.waveStart': { en: 'Wave {wave} · {hint}', zh: '第 {wave} 波 · {hint}' },
  'hud.msg.waveClear': { en: 'Wave {wave} cleared · watch for reinforcements', zh: '第 {wave} 波清理完成 · 警惕增援' },
  'hud.msg.guardianBroken': { en: '{name} is broken', zh: '{name}已被击破' },
  'hud.msg.nestDone': { en: 'Nest cleared · {biomass} Biomass', zh: '窝点清理完成 · {biomass} 生物质' },
  'hud.msg.killedByGuardian': { en: 'A heavy blow from {name} ended the hunt', zh: '{name}的重击终结了本次狩猎' },
  'hud.msg.bossPhase2': { en: '{name} · phase 2', zh: '{name} · 第二阶段' },
  'hud.msg.bossHit': { en: '{name} hit · took {damage} damage', zh: '{name}命中 · 受到 {damage} 伤害' },
  'hud.msg.bossFatal': { en: '{name} was fatal · run over', zh: '{name}致命 · 本局失败' },
  'hud.msg.killedByBoss': { en: 'Caught in the tell when {name} landed', zh: '{name}命中时未离开预警区' },
  'hud.msg.evolved': { en: 'Evolved · {name} · {stats}', zh: '进化完成 · {name} · {stats}' },
  'hud.msg.guardianRises': { en: '{name} erupts', zh: '{name}破土而出' },
  'hud.msg.bossRises': { en: '{name} wakes', zh: '{name}苏醒' },

  // ---- HUD, overlays, settings and touch chrome ---------------------------
  'hud.nestTitle': { en: 'Gloamwood · Corrupted Brood Nest', zh: '幽影林地 · 腐根孵育巢' },
  'hud.initialMsg': { en: 'Approach the nest to start clearing', zh: '接近窝点开始清理' },
  'hud.health': { en: 'Health', zh: '生命' },
  'hud.biomass': { en: 'Biomass', zh: '生物质' },
  'hud.fang': { en: 'Fang', zh: '裂牙' },
  'hud.shell': { en: 'Carapace', zh: '岩盾' },
  'hud.swarm': { en: 'Swarm', zh: '群生' },
  'hud.settings': { en: 'Settings · Esc', zh: '体验设置 · Esc' },
  'evo.eyebrow': { en: 'First evolution', zh: '第一次进化' },
  'evo.headline': { en: 'What you hunted is what you become', zh: '猎食决定你会长成什么' },
  'evo.seedLine': { en: 'Seed {seed} · all three are real builds with real costs, not skins', zh: '本次种子 {seed} · 三项均为带代价的实战构筑，不是单纯换皮' },
  'evo.routeLabel': { en: '{family} route · weight {probability}%', zh: '{family}路线 · 权重 {probability}%' },
  'evo.reroll': { en: 'Reroll these', zh: '抗拒这组' },
  'evo.rerollLeft': { en: 'R · {count} left', zh: 'R · 剩余 {count}' },
  'evo.footer': { en: 'Your first evolved form applies immediately. Skill attacks stay off.', zh: '选择后立即进入一级形态；技能攻击仍保持关闭。' },
  'result.time': { en: 'Time', zh: '用时' },
  'result.prey': { en: 'Prey', zh: '猎物' },
  'result.evolution': { en: 'Evolution', zh: '进化' },
  'result.restart': { en: 'Start a new run', zh: '重新开始一局' },
  'orient.eyebrow': { en: 'MOBILE PLAY', zh: 'MOBILE PLAY / 手机试玩' },
  'orient.title': { en: 'Turn your phone sideways', zh: '请把手机横过来' },
  'orient.body': { en: 'Landscape gives you more of the fight, and splits movement and attack to opposite thumbs.', zh: '横屏会保留更大的战斗视野，并把移动与攻击分到屏幕两侧。' },
  'orient.enter': { en: 'Go full screen landscape', zh: '进入全屏横屏' },
  'orient.continue': { en: 'Continue in portrait for now', zh: '暂时以竖屏继续' },
  'orient.status': { en: 'If it does not rotate, turn off your phone\'s portrait lock, then turn it yourself.', zh: '如果没有旋转，请先关闭手机的竖屏方向锁定，再手动横放。' },
  'orient.rotated': { en: 'Landscape requested. If nothing changed, turn the phone yourself.', zh: '已请求横屏；如果画面未变化，请手动把手机横放。' },
  'orient.fsOnly': { en: 'Full screen is on. Turn off portrait lock, then turn the phone.', zh: '已进入全屏。请关闭系统竖屏锁定，再把手机横放。' },
  'orient.unsupported': { en: 'This browser cannot rotate for you. Turn off portrait lock and turn the phone.', zh: '浏览器不支持自动旋转；请关闭系统竖屏锁定并手动横放。' },
  'fs.eyebrow': { en: 'FULL SCREEN', zh: 'FULL SCREEN / 全屏游玩' },
  'fs.tipBody': { en: 'This browser has no web full screen. Tap Share, choose Add to Home Screen, and launch from the icon — the address and tab bars go away.', zh: '此浏览器不支持网页全屏。点击底部的分享按钮，选择添加到主屏幕，之后从主屏图标启动，地址栏与标签栏都会消失。' },
  'fs.tipNote': { en: 'The system still owns rotation. If it will not turn, switch off portrait lock first.', zh: '横屏方向仍由系统控制；如果不旋转，请先关闭手机的竖屏方向锁定。' },
  'fs.tipClose': { en: 'Got it', zh: '知道了' },
  'fs.enterAria': { en: 'Go full screen and hide the address bar', zh: '进入全屏，隐藏浏览器地址栏' },
  'fs.howToAria': { en: 'See how to play full screen', zh: '查看如何全屏游玩，隐藏浏览器地址栏' },
  'settings.eyebrow': { en: 'PAUSED', zh: 'PAUSED / 体验设置' },
  'settings.title': { en: 'Tune the feedback to your screen', zh: '让反馈适合你的屏幕与设备' },
  'settings.body': { en: 'Changes apply at once and are saved on this device. The hunt is paused while you adjust.', zh: '设置即时生效并保存在本机；调整期间狩猎已暂停。' },
  'settings.shake': { en: 'Camera shake: {state}', zh: '镜头震动：{state}' },
  'settings.flash': { en: 'Hit flash: {state}', zh: '受击闪光：{state}' },
  'settings.volume': { en: 'Volume: {value}', zh: '音效音量：{value}' },
  'settings.openInput': { en: 'Key bindings', zh: '基础按键设置' },
  'settings.resume': { en: 'Resume hunting', zh: '继续狩猎' },
  'settings.perfWaiting': { en: 'PERF · waiting for a stable sample', zh: 'PERF · 等待稳定采样' },
  'settings.summary': { en: 'Keyboard: Esc pause/resume · move W/A/S/D · lock Tab · attack Space', zh: '键盘：Esc 暂停/继续 · 移动 W/A/S/D · 锁定 Tab · 普攻 Space' },
  'input.eyebrow': { en: 'KEY BINDINGS', zh: 'KEY BINDINGS / 基础按键' },
  'input.title': { en: 'Pick an action, then press the new key', zh: '选择动作，再按下新按键' },
  'input.body': { en: 'If the key is already taken, the two actions swap. Esc cancels the capture.', zh: '若新按键已经被占用，两个动作会自动交换；Esc取消当前录入。' },
  'input.reset': { en: 'Restore defaults', zh: '恢复默认' },
  'input.back': { en: 'Back to settings', zh: '返回体验设置' },
  'touch.joystickAria': { en: 'Drag the stick to move', zh: '拖动虚拟摇杆移动' },
  'touch.attack': { en: 'Attack', zh: '攻击' },
  'touch.attackHint': { en: 'hold to chain', zh: '按住连招' },
  'touch.attackAria': { en: 'Hold to run the basic attack chain', zh: '按住执行普通攻击连招' },
  'mute': { en: 'Muted', zh: '静音' },

  // ---- dynamic HUD, settings and bindings ---------------------------------
  'hud.settingsKey': { en: 'Settings · {key}', zh: '体验设置 · {key}' },
  'settings.shakeLabel': { en: 'Camera shake: {state}', zh: '镜头震动：{state}' },
  'settings.flashLabel': { en: 'Hit flash: {state}', zh: '受击闪光：{state}' },
  'settings.volumeLabel': { en: 'Volume: {value}%', zh: '音效音量：{value}%' },
  'settings.summaryDyn': { en: 'Keyboard: {pause} pause/resume · move {move} · lock {lock} · attack {attack}', zh: '键盘：{pause} 暂停/继续 · 移动 {move} · 锁定 {lock} · 普攻 {attack}' },
  'bind.capturing': { en: '{action}: press a new key…', zh: '{action}：请按新按键…' },
  'bind.current': { en: '{action}: {key}', zh: '{action}：{key}' },
  'hud.titleBoss': { en: 'Gloamwood · {name} · phase {phase}/2', zh: '幽影林地 · {name} · 阶段 {phase}/2' },
  'hud.titleGuardian': { en: 'Gloamwood · the nest\'s last line', zh: '幽影林地 · 窝点最后防线' },
  'hud.titleNest': { en: 'Gloamwood · Corrupted Brood Nest{suffix}', zh: '幽影林地 · 腐根孵育巢{suffix}' },
  'hud.targetLine': { en: 'Target {phase} · {weakness}', zh: '目标 {phase} · {weakness}' },
  'evo.rerollBtn': { en: 'Reroll these <small>R · {count} left</small>', zh: '抗拒这组 <small>R · 剩余 {count}</small>' },
  'evo.routeLine': { en: '{family} route · weight {probability}%', zh: '{family}路线 · 权重 {probability}%' },
  'evo.routeChip': { en: '{family} · {probability}%', zh: '{family} · {probability}%' },

  'hud.titleVictory': { en: 'Gloamwood · hunt complete', zh: '幽影林地 · 猎杀完成' },
  'hud.titleCleared': { en: 'Gloamwood · nest cleared', zh: '幽影林地 · 窝点已净化' },

  'hud.waveSuffix': { en: ' · wave {wave}/{total}', zh: ' · 第 {wave}/{total} 波' },
  'hud.clearedKills': { en: 'Cleared · {kills} kills', zh: '清理完成 · {kills} 击杀' },
  'hud.waveRemaining': { en: '{count} left this wave', zh: '本波剩余 {count}' },

  // ---- creature and evolution names --------------------------------------
  'creature.boss': { en: 'Thornheart Warden', zh: '荆心守卫' },
  'creature.guardian': { en: 'Rootrot Warden', zh: '腐根巢卫' },
  'creature.fang': { en: 'Rendfang Hunter', zh: '裂牙猎兽' },
  'creature.shell': { en: 'Stoneshield Beetle', zh: '岩盾甲虫' },
  'creature.swarm': { en: 'Sporeglow Swarmling', zh: '荧孢群虫' },
  'family.fang': { en: 'Fang', zh: '裂牙' },
  'family.shell': { en: 'Carapace', zh: '岩盾' },
  'family.swarm': { en: 'Swarm', zh: '群生' },
  'evo.fang-serrated-pounce.name': { en: 'Serrated Pounce', zh: '锯齿扑爪' },
  'evo.fang-serrated-pounce.stat': { en: 'Basic attack +24% · Speed +4%', zh: '普通攻击 +24% · 移速 +4%' },
  'evo.fang-execution-jaw.name': { en: 'Executioner Jaw', zh: '处决颚肌' },
  'evo.fang-execution-jaw.stat': { en: 'Basic attack +32% · Speed −6%', zh: '普通攻击 +32% · 移速 −6%' },
  'evo.shell-reactive-plates.name': { en: 'Reactive Plating', zh: '反应甲片' },
  'evo.shell-reactive-plates.stat': { en: 'Health +30 · Mitigation 12% · Speed −8%', zh: '生命 +30 · 减伤 12% · 移速 −8%' },
  'evo.shell-bastion-core.name': { en: 'Bastion Core', zh: '堡垒核心' },
  'evo.shell-bastion-core.stat': { en: 'Health +45 · Mitigation 8% · Speed −12%', zh: '生命 +45 · 减伤 8% · 移速 −12%' },
  'evo.swarm-symbiotic-brood.name': { en: 'Symbiotic Brood', zh: '共生幼巢' },
  'evo.swarm-symbiotic-brood.stat': { en: 'Kill heal 7 · Biomass +18% · Damage −6%', zh: '击杀恢复 7 · 生物质 +18% · 伤害 −6%' },
  'evo.swarm-hunting-cloud.name': { en: 'Hunting Bloom', zh: '猎行菌群' },
  'evo.swarm-hunting-cloud.stat': { en: 'Speed +14% · Biomass +12% · Health −10', zh: '移速 +14% · 生物质 +12% · 生命 −10' },
  'evo.reason.recent': { en: 'You devoured {recent} {family} prey and hold {genes} Genes, which raised this route\'s weight.', zh: '最近吞噬 {recent} 只{family}猎物，累计 {genes} 份基因，提高了这条路线的出现权重。' },
  'evo.reason.none': { en: '{genes} {family} Genes banked; a low-weight mutation can still surface.', zh: '累计 {genes} 份{family}基因；本次仍可能发生低权重异变。' },

  'evo.busy': { en: 'Reforming your body…', zh: '身体正在重组…' },

  'enemy.telegraph': { en: 'Telegraph', zh: '预警' },
  'enemy.strike': { en: 'Strike', zh: '攻击' },
  'enemy.watch': { en: 'Watching', zh: '观察' },

  'settings.language': { en: 'Language: English', zh: '语言：中文' },

  // ---- document chrome ----------------------------------------------------
  'document.title': { en: 'Evolution Arena Lite · Gloamwood', zh: '进化竞技场 Lite · 幽影林地 3D 重制' },
} as const satisfies Record<string, LocalisedString>

export type TranslationKey = keyof typeof STRINGS

const SUPPORTED: readonly Locale[] = ['en', 'zh']

/**
 * English is the primary market, so anything that is not explicitly Chinese
 * resolves to English rather than the other way round.
 */
export function detectLocale(languages: readonly string[] = []): Locale {
  for (const tag of languages) {
    const lower = tag.toLowerCase()
    if (lower.startsWith('zh')) return 'zh'
    if (lower.startsWith('en')) return 'en'
  }
  return 'en'
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match)
}

let activeLocale: Locale = 'en'

export function setLocale(locale: Locale) {
  activeLocale = SUPPORTED.includes(locale) ? locale : 'en'
  return activeLocale
}

export function getLocale(): Locale {
  return activeLocale
}

export function translate(key: TranslationKey, params?: TranslationParams, locale: Locale = activeLocale): string {
  return interpolate(STRINGS[key][locale], params)
}

export const t = translate

/**
 * Resolve the locale from the browser, allow ?lang= to override it for testing,
 * and stamp the document so CSS and assistive tech agree with the copy.
 */
export const LOCALE_STORAGE_KEY = 'evolution-arena:locale'

function storedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY)
    return value === 'en' || value === 'zh' ? value : null
  } catch {
    return null
  }
}

export function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Private browsing can refuse storage; the choice still applies this session.
  }
}

/**
 * Precedence: an explicit ?lang= for testing, then the player's saved choice,
 * then the browser. A player whose browser is set to the other language needs a
 * way out, so a saved choice always beats detection.
 */
export function applyDocumentLocale(search = window.location.search, languages = navigator.languages ?? [navigator.language]) {
  const requested = new URLSearchParams(search).get('lang')
  const locale = requested === 'en' || requested === 'zh'
    ? requested
    : storedLocale() ?? detectLocale(languages)
  setLocale(locale)
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  document.documentElement.dataset.locale = locale
  return locale
}

/** Exposed so tests can assert every key carries both locales. */
export const TRANSLATIONS = STRINGS
