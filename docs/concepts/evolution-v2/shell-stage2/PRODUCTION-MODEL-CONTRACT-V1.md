# Shell Stage-2 Production Model Contract V1

Status: **owner-accepted in play 2026-08-24; released.** The owner reviewed the
form in the game ("模型，走路，攻击都可以"), rejected the first attack pass for
Bite and Slam reading as one action, accepted the re-authored pass
("这一版好多了") and authorised commit and push to `main`.

Identifiers deliberately stay `candidate` for now: the Chinese name 磐岳甲龙 is
still unlocked, and promoting to `master` is a separate, explicit step the owner
has not taken. Nothing in the runtime displays the name, so nothing depends on
it.

Previously: **runtime candidate, integrated 2026-08-24.** The form is in the game: registered at stage 2 for family `shell`,
running its own combat authority, footprint and material grade. Board-1 and
board-2 were rejected, board-3 accepted, and the Meshy source passed both §3
proportion gates. Sections 1-4 are measured and bind production; §5 is the
locked design.

Runtime identifiers (candidate, not master, until the owner accepts in play):

- form: `basalt-bulwark` / 磐岳甲龙 — **Chinese name still not locked**; nothing in
  the runtime displays it, so no HUD string depends on it
- character baseline: `basalt-bulwark-shell-second-evolution-candidate-v1`
- combat profile: `basalt-bulwark-combat-candidate-v1`
- runtime model: `public/assets/quality-3d/models/basalt-bulwark-rigged-v1.glb`
- contract: 20,659 triangles, 27 bones, nine named clips, 0 glTF errors/warnings

Standard: `evolution-arena-creature-production-v2.1`. Where this document and
typed runtime code disagree, stop and reconcile before producing another
creature.

Predecessor: `../shell-stage1/PRODUCTION-MODEL-CONTRACT-V1.md`
(`stone-pangolin` / 叠岩甲蜥, user-accepted 2026-08-17).

Names: **not locked.** Working id `basalt-bulwark`, working Chinese name 磐岳甲龙.
Neither may enter runtime strings until the user confirms, following the
`brood-stalker` precedent.

---

## 1. Why this form exists

Today a Shell run's second evolution changes nothing the player can see.
Traced through the live code:

`gloamwood-3d-hunt.ts:6140` calls
`loadCharacter(quality3DBodyStageForFamily(stage, candidate.family), candidate.family)`.
For `shell` at stage 2 that helper returns **1**, because stage 2 has no Shell
asset. The **body stage**, not the requested stage, is what reaches
`loadCharacter`, so `this.stage = 1` and three things stay behind with it:

| | Fang run | Shell run |
| --- | --- | --- |
| Body | 赤冠壁蜥 → 赤爪猎龙 | 叠岩甲蜥 → **same mesh** |
| World height | 2.16 → 2.55 | 1.80 → **1.80** |
| Combat chain | Bite→Pounce→Tail → **Claw**→Pounce→Tail | **unchanged** |

`GLOAMWOOD_3D_FORM_WORLD_HEIGHTS.shell` is `[1.8, 1.8, 2.55]`. Index 2 is
**unreachable dead data** and has been since the table was written.

**The player gets nothing at all.** Not even the placeholder: the accent that
was supposed to mark an evolution the model cannot show is now unreachable.
`createEvolutionAccent` has one call site (`gloamwood-3d-hunt.ts:6145`), gated
on `!this.characterFamilyMatched` — but `loadCharacter` is always handed
`quality3DBodyStageForFamily(...)`, which by definition returns a stage where
the family *does* match. `characterFamilyMatched` is therefore always `true` on
that path and the accent never fires. It was live while Swarm had no body of its
own; once all three families got a stage-1 body it became dead code, and nobody
noticed because its absence looks exactly like the bug it was hiding.

Measured in a live browser on 2026-08-24, taking `shell-bastion-core` twice from
a clean run:

```
first  evolution → stage 1, model stone-pangolin, matched true
second evolution → stage 1, model stone-pangolin, matched true
                   sameModelAsBefore: true   sameStageAsBefore: true
```

A third Shell evolution changes nothing either.

Pass condition, inherited verbatim from stage 1: `PROJECT_CONTEXT.md` requires
evolution to change body plan, silhouette, colour, scale and fantasy rather
than adding parts to the same body; standard §4 states a recolour, scale change
or alternate crown is not a new species. **A scaled-up 叠岩甲蜥 fails this
contract.**

---

## 2. Gameplay identity — unchanged from stage 1, and it still binds the art

Incoming player damage is `event.damage * (1 - damageReduction)` with **no
facing term**. The stage-1 contract turned that into an art rule and the rule
survives unchanged:

> The design must read as "heavy and hard all over", not "armoured at the
> front". A front-loaded shield silhouette would promise a directional mechanic
> the player does not have; that language is reserved for the Shell-family
> enemies, which do own a ±75.6° frontal rule.

This is the single easiest gate to fail at stage 2, because "the armour grew"
invites a raised prow, a ram, or a bigger frontal boss. **All three are
rejections**, not stylistic preferences. Growth must be distributed across the
whole dorsal surface.

---

## 3. Measured footprint — the constraint that decides the silhouette

Runtime GLB bounding boxes, measured directly from the shipped files by
`scripts/measure-glb-proportions.mjs` and converted to world units at each
form's runtime height. The measurements agree with the published figures
(stone-pangolin measures 1.59 × 4.58 against the 1.58 × 4.57 recorded in its
contract; spore-stalker measures 1.39 × 4.33 against the 1.40 × 4.34 recorded in
`GLOAMWOOD_PLAYER_FAMILY_COLLISION_PROFILES`), so these ratios are trustworthy
inputs.

| Form | w/h | l/h | Width | Length | Height |
| --- | --- | --- | --- | --- | --- |
| coral-gecko (stage 0) | 0.956 | 2.186 | 1.72 | 3.93 | 1.80 |
| scarlet-gecko (Fang 1) | 0.724 | 1.848 | 1.56 | 3.99 | 2.16 |
| scarlet-hunter (Fang 2) | 0.796 | 1.927 | 2.03 | 4.91 | 2.55 |
| stone-pangolin (Shell 1) | 0.883 | 2.542 | 1.59 | 4.58 | 1.80 |
| spore-stalker (Swarm 1) | 0.645 | 2.006 | 1.39 | 4.33 | 2.16 |

**The trap, stated before it is sprung.** The runtime scales by height alone:

```
scale = gloamwoodCharacterWorldHeight(stage, family) / boundingBox.size.y
```

Take the stage-1 Shell proportions to the table's stage-2 height of 2.55 and
the body becomes **2.25 × 6.48 × 2.55** — 32% longer than the largest creature
in the game. This is the same failure the stage-1 contract hit and solved by
holding height at 1.80 instead of 2.16. At stage 2 that escape is not available:
height *is* the evolution read, and the player must never see their creature
appear to shrink.

**Therefore the correction has to come from the mesh, and it is a gate on the
Meshy source, not a Blender fix:**

| Property | Stage 1 | Stage 2 requirement |
| --- | --- | --- |
| l/h | 2.542 | **≤ 2.20** |
| w/h | 0.883 | **≥ 0.95** |
| Resulting body at 2.55 | — | **≥ 2.42 wide, ≤ 5.61 long** |

Read plainly: **the Shell line grows upward and outward, never longer.** It
becomes the widest and tallest body in the game while staying shorter than
6.48. A source that comes back elongated is rejected at silhouette review — it
cannot be rescued downstream, because scaling by height is exactly what
converts elongation into footprint.

Note the stage-1 lesson on *why* a source comes back elongated: attempt 2 came
out at l/h 3.23 because the 3/4 primary view foreshortened the body and Meshy
guessed it long; a true side view corrected it to 2.54. **A side view is
mandatory for this job**, not an optional extra slot.

### World height — 2.55, chosen by the user 2026-08-24

1.80 → 2.55 is **+41.7%** in one evolution, against Fang's +18%. The alternative
considered was ~2.30 (+27.8%, roughly 2.19 × 5.06 × 2.30), which is cheaper on
traversal but leaves the armour line standing **lower than the hunter line**
(2.55) while still being longer than it — the worst of both reads for a form
whose whole identity is mass.

2.55 is the value already sitting in `GLOAMWOOD_3D_FORM_WORLD_HEIGHTS.shell`,
so no table change is needed; the index simply becomes reachable. Two
consequences follow and are now binding:

- the §3 proportion gates are **hard rejections at silhouette review**, not
  targets to aim at;
- traversal must be re-verified in a live browser against the valley obstacles,
  the nest clear radii and the Boss arena radii. Stage 1 was accepted with this
  check still open; it must not be carried forward a second time.

Target body: **≈ 2.42 × 5.61 × 2.55** — the widest and tallest creature in the
game, and still shorter than the 6.48 the naive scale-up would produce.

---

## 4. Integration — the stage-keyed branches

**Two of the three were defused on 2026-08-24, before the model exists.** Both
changes are behaviour-preserving today, provably so: `stage === 2` and
`formId === 'scarlet-hunter'` are the same set while Fang owns the only stage-2
asset. They were made now because the alternative is finding them in play, which
is how every one of this project's stage-keyed defects has been found so far.

They are recorded here in full because the project has already lost three
defects to exactly this pattern:
`PROJECT_CONTEXT.md` records that form-specific handling must key on `formId`
or family, never on stage.

| # | Site | What would have happened when a Shell stage-2 body lands | Status |
| --- | --- | --- | --- |
| 1 | `if (stage === 2)` material grade in `loadCharacter` | Sets `material.normalMap = null`. **Deletes the plate relief**, which is this form's entire identity. The comment immediately below documents this same mistake already happening once, for the gecko grade. | **Fixed** — now keyed `formId === 'scarlet-hunter'`. |
| 2 | `if (stage >= 2) return SCARLET_HUNTER_PRESENTATION.combat` | Shell stage 2 silently fights with the Fang hunter's damage, reach and timings, and its chain **opens with `Claw`**, which no Shell GLB declares — `setAction` finds no action and plays nothing while the authority still resolves damage. That exact defect landed on stage 1 after acceptance. (`Pounce` is safe: `setAction` redirects it to `Slam` keyed on *family*, so a stage-2 Shell body inherits that correctly.) | **Fixed** — every produced form is now named explicitly, and `gloamwoodFormCombatProfile` returns `matchedForm`, reported in debug state beside `characterFamilyMatched`. Guarded by `tests/gloamwood-form-combat-authority.test.ts`. |
| 3 | `gloamwood-3d-collision.ts:50` — `shell: { 1: {...} }` only | Falls back to `GLOAMWOOD_PLAYER_COLLISION_PROFILES[2]`, the Fang stage-2 profile, against a body ≥ 2.42 wide. | **Open, and cannot be closed early** — the correct radius follows the finished body's measured half-width. Add `shell: { 2: {...} }` with the model. |

Required with the model, not after it:

- register the asset with `stage: 2, family: 'shell'` in `QUALITY_3D_GLB_ASSETS`;
- add a `<form>-character-presentation.ts` module carrying `combat`, `asset`
  and `material`, matching the four existing modules;
- add the `formId` branch to `gloamwoodFormCombatProfile` **above** the
  `stage >= 2` line, and make the material grade in `loadCharacter` form-keyed;
- add `shell: { 2: {...} }` to `GLOAMWOOD_PLAYER_FAMILY_COLLISION_PROFILES`,
  radius following measured half-width;
- confirm debug `characterFamilyMatched === true` for `shell` at stage 2. The
  accent then disappears on its own — `createEvolutionAccent` is already gated
  on `!this.characterFamilyMatched`.

`tests/public-payload.test.ts` requires `public/assets/quality-3d/models` to
contain exactly the files the registry resolves, so the GLB and the registry
entry must land together or the suite fails either way round.

---

## 5. Direction — B 立起, chosen by the user 2026-08-24

The stage-1 process generated four concept boards and the user chose one. No
image tool was available in the session that wrote this document, so three
directions were written instead and the user chose from those. A — 层岩化
(plate rows stack into tiers, same body plan) and C — 熔岩化 (glowing molten
seams) were not chosen; C was recommended against, because orange-red sits in
the Fang line's coral-red neighbourhood and the stage-1 contract forbids two
forms sharing a palette.

**The mound rises onto pillar limbs.** The low crawler becomes a standing
bulwark. This is the only one of the three that changes the body *plan* rather
than the body's *quantity*, which is what §1's pass condition asks for, and its
growth is vertical — so the §3 `l/h ≤ 2.20` gate is satisfied by the design
rather than fought against.

### Non-negotiable silhouette

Inherited from stage 1 and still binding:

- **Continuous plate coverage** across back, both flanks and the full tail. No
  bare smooth back panel, no scattered spikes, no single fused turtle dome.
- **All armour mass is dorsal.** The camera sits at ~36° pitch; the top surface
  is what the player reads for the entire run.
- **Four legs clear of the plate skirt**, all four feet and claws visible. The
  stage-1 first draft hid them and failed standard rule 3.
- Tail thick, plated, **shorter than the torso**, ending in a **fused stone
  club**. A long smooth tapering tail reproduces the gecko read and fails.
- Belly and throat soft cream, giving the plate rows something to sit against.

New at stage 2 (revised after board-2, 2026-08-23). **Mass is the subject.**
Board-1 kept the stage-1 animal (many small shingles, low mound). Board-2
separated by height and lost the weight. Stage 2 separates by *architecture*:

- **Few very large fused megalith slabs** — angular cracked grey basalt, like
  broken cliff rock, each huge relative to the body. Not small shingles, not
  scales, not a smooth turtle dome. They wrap back, both flanks and the tail.
- **Two clusters of tall upright standing stones**, one over the shoulders and
  one over the hips, **equal height**. They break the skyline. They are
  additional mass on full plate coverage, not a spinal spike ridge in place of
  plates (the stage-1 attempt-1 rejection still holds).
- **Legs return to short tree-trunk columns**, roughly **one third** of
  standing height, immensely thick, wide apart. Modest belly gap. Never thin,
  long or stilt-like. Board-2's half-height stilts are withdrawn.
- **Head carried forward at shoulder height** on a short powerful neck. A
  massive plated skull with a thick brow shelf. Not tucked under a rim, not
  raised on a stalk.
- **Tail club.** Short thick plated tail ending in a fused stone club. Rear
  mass; does not violate §2; gives TailSwipe a readable finisher.

### Palette — inherited, must not drift, and one new conflict

**Hue does not change, and the reason is structural rather than aesthetic.**
Both neighbouring colour positions are taken — coral-red is Fang, cyan is
Swarm — and this contract forbids two forms sharing a palette because it halves
the evolution read. That constraint argues *against* recolouring, not for it.
Now that architecture separates the two Shell forms decisively, palette is the
one signal left telling the player this is still their own line.

**But the shipped stage-1 body proves the palette on paper is not the palette on
screen.** Observed in engine on 2026-08-24 at the real gameplay camera: the
stone pangolin reads as an almost uniform **pale white-grey blob**. The dark
teal-green hide, the cream underbelly and the lichen seams specified in its
contract are essentially absent at that size and lighting.

That is a warning, not a curiosity. **This form's entire architecture lives in
the deep dark seams between megaliths.** If those wash out the way stage 1's
did, the slabs merge into one pale mass and three rounds of silhouette work are
lost. Seam survival at 13.3% screen height under the valley's actual lighting is
therefore a **material requirement measured in engine**, not a texture choice
judged on the concept board.

**New conflict, identified 2026-08-24.** This design's fantasy — a walking piece
of cliff — is in direct tension with readability on a map that contains rocks.
The valley scatters grey boulders exactly where fights happen. The resolution is
not to change the grey; it is to guarantee that the connective tissue between
the stone stays visible:

- dark teal-green hide and yellow-green lichen must hold real area between the
  slabs — neither colour appears in the terrain;
- the cream throat and underbelly stay bright, a note nothing in the scene has;
- **the creature must never collapse into a solid grey mass at any distance.**

Prompt line carrying this: `Between the stone slabs, the dark teal-green hide
and yellow-green lichen must remain clearly visible as connective tissue — the
creature must never read as a solid grey mass. Cream throat and underbelly stay
bright.`

### Palette source values

Grey basalt plates, dark teal-green hide, cream underbelly, yellow-green lichen
in the seams, amber eye. **No coral-red** (Fang), **no cyan** (Swarm). Value
separation carries the form: light stone against dark hide must hold in bright,
midtone and shadow zones. Hue-only separation fails standard rule 11.

---

## 6. Rig, budget and clips

| Item | Contract |
| --- | --- |
| Triangles | 20,000–24,000 runtime. Stage-1 Shell is 20,391; Fang stage 2 is 54,828, which is above the line the other four hold and is not the precedent to follow. |
| Bones | 27-bone Meshy quadruped template, node names matching the four existing player forms, so the shared rig mapping applies unchanged. |
| Clips | `Idle`, `Walk`, `Run`, `Turn`, `Bite`, `Slam`, `TailSwipe`, `Hit`, `Death` |
| Validator | `npm run validate:gltf` at zero errors and zero warnings |

Chain stays **`Bite → Slam → TailSwipe`**. Pounce remains removed: a heavier,
taller version of a body that could not sell a leap still cannot sell one, and
standard rule 4 forbids stretching a body into an attack it cannot support.
Stage 2 makes Slam *heavier* — longer anticipation, harder contact frame,
slower recovery — rather than replacing it. Skills stay disabled.

Overlapping plates remain the main deformation risk, and tiering multiplies it:
rows must slide against each other through the spine's bend range without
interpenetrating (standard rule 2).

---

## 7. Acceptance sequence

1. ~~User chooses a direction from §5.~~ **Done 2026-08-24: B 立起 at 2.55.**
2. Concept board. Board-1 **rejected** (stage-1 body). Board-2 **rejected**
   (tall stilts, reads light). Both archived `superseded-board1-*` /
   `superseded-board2-*`. Revision-3 board generated 2026-08-23.
3. Silhouette review against §2, §3 and the revised architecture (few huge
   megaliths, upright shoulder and hip slabs, short tree-trunk legs), at the
   true 36° camera angle, before any Meshy job. **← current gate: owner
   reviews the revision-3 3/4**
4. Meshy Image-to-3D. **Text-to-3D is forbidden for this line** — stage-1
   attempt 1 proved `lizard`/`reptile`/`quadruped` dominate the generator's
   prior and reduce armour to bolted-on decoration.
5. Decimation preserving the outer contour notching, rig, weights, nine clips,
   validator pass.
6. Runtime integration per §4, including the three stage-keyed branches.
7. Footprint and traversal verification against the live valley obstacles.
8. Browser verification at desktop 1440×900 and 844×390: full three-step chain,
   authoritative damage, grounded feet, zero console errors or warnings.
9. User gameplay acceptance. Only then does the identifier move from
   `candidate` to `master`.

## 8. Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |
| board-1 | 2026-08-23 | four separate concept images from revision-1 prompt | Archived `superseded-board1-*`. |
| board-1 review | 2026-08-24 | owner review of the 3/4 | **Rejected on sight: "it is the same as the level-1 evolution."** Correct. The render is competent and holds the palette, the plate language, the four visible legs and the ban on frontal mass — and it is the stage-1 body plan: low-slung, belly near the ground, head tucked at or below the shoulder line, legs roughly 26% of standing height. Direction B's entire content, the vertical lift, is absent. |
| board-2 | 2026-08-23 | four separate images from the owner's revision-2 prompt | Archived `superseded-board2-*`. |
| board-3 | 2026-08-23 | four separate images from the owner's revision-3 prompt | First pass archived `superseded-board3-grey-mass-*` (read as a solid grey pile). Color pass on disk: teal hide and lichen visible between slabs, cream throat and belly bright. Awaiting owner review of the 3/4. |

**Root cause is the prompt, not the generator.** Three words fought the
direction: `short` legs against "standing tall and clear of the ground",
`short thick neck` and `low brow ridge` pushing the head back down, and
`broad and blocky` reading as low-and-wide. Underneath that, a structural
error: the prompt described the target creature in isolation and never
described the *change* from its predecessor, so it converged on the
armoured-quadruped attractor — which is an ankylosaur, and ankylosaurs are low.
This is the same failure class as stage-1 attempt 1, whose lesson this contract
quotes and then repeated.

**Contract-level lesson.** Every "inherited, must not drift" clause in §5 is
individually defensible — the palette cannot collide with Fang or Swarm, the
plates are the identity, the frontal-shield ban follows from mitigation having
no facing term. Stacked, they left the form almost no room to become a
different animal, which is what §1's pass condition actually requires.
**Continuity was over-constrained and change was under-constrained.** The
revision makes stance the subject and gives it a number: the legs are half the
standing height and the head sits at or above the shoulder line. Stance is also
the only one of these properties resolvable at 13.3% screen height, so it is
where the budget belongs.

The fused stone club is in the owner's revision-2 prompt and is now part of
the board. It is **rear** mass, so it does not violate §2's frontal-shield ban;
it also gives the chain's TailSwipe finisher something to sell.

| board-2 review | 2026-08-24 | owner review of the REVISION 2 3/4 | **Rejected: "too ugly."** Correct, and the failure is the opposite of board-1's. The revision's gates all passed — legs near half the standing height, clear belly gap, head up, tail club — and it destroyed the form's identity doing it. A small torso perches on four thin columns; the plates read as paving stones glued to a smooth body rather than armour grown from it; the outline is four verticals under a lumpy top, which at 144 px is a nondescript quadruped. The stage-1 contract's entire "weight and solidity" section is violated: it reads **light**. |

**Root cause: I over-corrected, and traded away the one property this form
cannot lose.** board-1 was diagnosed as "reads like its predecessor" and
prescribed height, with a number — legs at half the standing height. Height was
never this creature's identity. **Mass is.** board-1 was in fact the better
*creature*; its only fault was not being a new *animal*, and that is an identity
problem treated with a proportion remedy.

**The durable lesson, which supersedes the one recorded under board-1.** When a
form reads as its predecessor, change **what the body is made of**, not how high
it stands. Stance is cheap to change and just as cheap to lose. Architecture is
the identity. Stage 1 is "many small plates in a low mound"; stage 2 separates
from it at distance by plate *architecture* — few, very large fused megaliths
instead of shingles — plus upright standing slabs rising from the spine that
break the outline, plus the tail club. Legs return to short thick columns at
roughly one third of standing height: enough for a belly gap, never enough to
lift the body off its own weight.

Note the distinction from stage-1 attempt 1, which failed on a "spinal spike
ridge instead of plate coverage": the upright slabs here are **additional** mass
on top of full plate coverage, not a substitute for it. A form that trades
coverage for a spine row is still a rejection.

| board-3 (3/4) | 2026-08-24 | REVISION 3 prompt | **Passes every silhouette gate. First board that is both a good creature and a new animal.** Mass restored: barrel torso dominating the outline, short thick columnar legs, modest belly gap. Plate architecture is few large angular megaliths, decisively different from stage 1's dense shingles. Two upright slab clusters over shoulders and hips, equal, breaking the outline into a readable broken ridgeline. Tail club present. Palette held. No frontal prow, ram or shield boss. Provisional 3/4 estimate of l/h ≈ 1.5, well inside the gate — but a 3/4 view foreshortens, so the mandatory side view decides. Remaining three views not yet generated. |

**New measurement consequence, found on board-3 and not present on any earlier
creature.** The runtime normalises by bounding-box height, and **the upright
spine slabs count toward `boundingBox.size.y`**. Estimated off the 3/4 render,
the back plates top out around 75% of total height and the slabs take the
remaining 25%. At world height 2.55 that puts the slab tips at 2.55 and the
**body itself at roughly 1.91** — against a stage-1 body of 1.80, about +6%.
The form would not appear to shrink, but it would barely grow: the evolution
read would rest almost entirely on architecture rather than on size.

Three admissible answers, deliberately **not** decided from concept art:

1. accept it, since architecture is what makes this board work;
2. shorten the slabs to roughly 15% of total height, putting the body near 2.17;
3. raise the world height above 2.55 — but 2.55 is the owner's chosen value and
   already in `GLOAMWOOD_3D_FORM_WORLD_HEIGHTS`, and changing it re-opens the
   traversal verification.

**Decide this from the source GLB, not the render.** Measure body-height as a
fraction of total height with `scripts/measure-glb-proportions.mjs` once the
mesh exists. Reverse-engineering 3D proportions from a 3/4 perspective drawing
is exactly the mistake stage-1 attempt 2 made.

Also carry forward: tall rigid slabs on a bending spine are a deformation risk
(standard rule 2), separate from the plate-row sliding risk already recorded.

| source-1 | 2026-08-24 | Meshy Image-to-3D + Walking/auto-rig from the accepted board-3 | **ACCEPTED as source geometry.** Both §3 gates pass on the creature mesh in bind pose: l/h **1.980** (≤2.20), w/h **1.059** (≥0.95). At 2.55 that is **2.70 × 5.05 × 2.55** — the widest body in the game — against stage-1 Shell's 1.59 × 4.58 × 1.80, i.e. +70% width, +10% length, +42% height. The upright slab clusters, megalith plate architecture, lichen seams, teal hide, cream belly, tail club and even mass distribution all survived reconstruction and read correctly at the true 36° gameplay camera. 20,660 triangles — **already inside the runtime budget, no staged decimation needed**, against 1,986,110 for the stage-1 Shell source. 27 joints on the shared template node names. SHA-256 `1cd240cd…bde6`, archived in `source/`. |

**Two measurement traps this source sprang, recorded so the next one does not.**
The Meshy `Icosphere` helper is 2.0 units against a creature 0.017 units across,
so it *is* the bounding box until deleted — it corrupted two separate proportion
readings and rendered the first review turntable as a single speck. And the file
is a *walking* export, so its armature sits on a walk frame; bounds must be taken
in **rest position**, or the numbers describe a pose rather than the body.
`scripts/measure-glb-proportions.mjs` already skips `Icosphere`, but it reads
bind-space accessors, which is why it stayed correct where the Blender pass did
not.

**Resolved: the board-3 slab height-budget question.** The slabs take roughly
22% of total height, putting the body near 1.99 against stage 1's 1.80, about
+10%. Weak alone, but width grew 70% and mass reads from width and height
together. **Option 1 accepted — keep the slabs, keep 2.55** — now decided from
measurement rather than from a perspective drawing.

| runtime-1 | 2026-08-24 | `scripts/blender/process_basalt_bulwark_meshy.py` | **Integrated.** Icosphere deleted, texture 6.7 MB PNG to 1024, nine clips authored, 81 constant scale curves stripped, 3 root-location channels recentred. **No decimation** - the source arrived at 20,660 and one degenerate UV face was removed, so the plates keep their hard lifted lips. Runtime GLB is 3.5 MB and validates at 0 errors / 0 warnings. Proportions survive processing unchanged: l/h 1.980, w/h 1.059. |

**Cost measurement, which is this creature's other deliverable.** One source
attempt and one processing run to a passing runtime asset, against 3 source
attempts plus 2 rig attempts for Shell stage 1 and 13 GLBs for the Fang stage-2
hunter. Three concept boards were spent, and that is where the real cost went:
the mesh pipeline is now cheap and the *design* is what is expensive. The two
rejected boards cost nothing but time and produced the two lessons in this
table.

| runtime-2 | 2026-08-24 | re-authored `Bite` and `Slam`, retimed `TailSwipe` | **Owner review of runtime-1: model, walk and attacks acceptable, but "攻击方式都是一样的，山崩压和咬没有区别".** Correct, and it had two causes. **Shape:** both steps were the same gesture — the front end pitching down — at 16° and 20°. At 13.3% screen height a 16° and a 20° version of one gesture is one animation. **Truncation:** `setAction` read `SCARLET_HUNTER_PRESENTATION.combat.attackPlaybackRate` for *every* form, and a one-shot clip is cut when its action window ends, so Bite played 64% of itself and Slam 65% — anticipation and contact, never recovery. Measured across the whole cast, **only the hunter's own TailSwipe completes**; every other attack clip in the game is truncated, most at 60–80%. |

**Fixes.** The playback-rate lookup is now form-keyed, with forms that declare no
rate still falling back to the hunter's table — so the four accepted forms keep
exactly the rates they ship with today and nothing they were playtested with is
retuned. `setAction`'s presentation lookup was also stage-keyed and is now
form-keyed, the same defect class as the three in §4.

The two steps are now separated by **shape**, not degrees, and each is led by a
different bone:

| step | window | clip | peak | led by | reads as |
| --- | --- | --- | --- | --- | --- |
| Bite | 0.58s | 0.58s | 27° | **head** | head cocks back and snaps; body still |
| Slam | 1.20s | 1.21s | 38° | **foreleg** | rears up, holds 4 frames, drives down |
| TailSwipe | 1.35s | 1.33s | 34° | **hips** | body turns to swing the club |

Every window now matches its clip at playback rate 1, so the whole authored
motion plays. Measured at the peak frame, Slam changes 16.0% of the rendered
frame against Bite's 3.9% — a 4× separation, against roughly 2× before. Damage
moved 15/21/24 to 16/22/26 to hold the 20.5 damage-per-committed-second parity
with the Fang hunter across the longer windows.

**The owner's direction was the right one and it was already in the stage-1
contract**: "visible anticipation, a hard contact frame and a slow recovery,
because fast symmetric motion is what makes armour read as foam." runtime-1
under-delivered it at 14° of lean. The lesson is that a clause written as prose
did not survive into authored numbers, and nothing checked. It is checked now:
`tests/basalt-bulwark-form.test.ts` reads the shipped binary and fails if a clip
stops matching its window.

Cost measurement is a deliverable: stage-1 Shell needed 3 source attempts and
2 rig attempts; the stage-2 Fang hunter needed 13 GLBs. What this form costs
decides whether Swarm stage 2 follows immediately or waits.
