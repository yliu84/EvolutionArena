# Swarm Stage-2 Production Model Contract V1

Status: **owner-accepted 2026-08-24 ("差不多了，验收"); identifiers promoted to
`master`.** With this form, all three produced families have a second evolution
that changes body, world height and combat chain.

The name `lantern-lynx` remains unlocked as a *display* name — nothing in the
runtime shows it — but the baseline and combat identifiers are now master,
following the `spore-stalker` precedent.

- form: `lantern-lynx` — display name not locked; no runtime string shows it
- baseline: `lantern-lynx-swarm-second-evolution-master-v1`
- combat profile: `lantern-lynx-combat-master-v1`
- runtime model: `public/assets/quality-3d/models/lantern-lynx-rigged-v1.glb`
- 18,942 triangles, 27 bones, ten clips, 0 glTF errors/warnings
- measured body **1.59 wide x 4.37 long x 2.55 tall**, torso 1.47; the smallest
  footprint of the three stage-2 forms, which is what this route is
- chain `Pounce → Claw → Claw → Bite` (`孢跃 → 裂爪 → 裂爪 → 巢噬`), 11/9/9/20
  over 0.71/0.46/0.46/0.75 s — 20.6 damage per committed second, parity with the
  Fang hunter's 20.5 and the Shell bulwark's 20.4

Standard: `evolution-arena-creature-production-v2.1`.
Predecessor: `../swarm-stage1/` (`spore-stalker` / 荧囊猎蜥, shipped).
Job pack and prompts: `source/SOURCE.md`.

Names: **not locked.** Working id `brood-hollow`. No Chinese name proposed yet;
nothing in the runtime displays a form name, so nothing depends on it.

---

## 0. The first gate: would a player choose to become this?

**This is judged by the owner, by eye, before any measurable gate is applied.**

Every other gate in this document measures whether a form is *distinct* and
whether it *reads*. None of them asks whether it is *appealing*, and the first
Swarm stage-2 mesh passed all of them and was rejected on sight: "这个怪物太丑了,
不符合玩家审美... 如果是我，我肯定不会选现在这个样式."

That is not a matter of taste to be argued with. **The evolution card is a
choice the player makes.** A route whose form nobody wants to become is a route
nobody takes, and the three-route structure is the reason this game has replay
value at all. An unappealing form does not merely look bad; it removes a third
of the game.

What the failure taught, concretely:

- **I mistook "different from its predecessor" for "good".** At board review I
  accepted a larger blade-shaped head and a longer neck as improvements
  *because they pushed further from the stage-1 read*. They were the main
  source of the ugliness.
- **Detail below the readable threshold is worse than no detail.** Twelve small
  identical spine chambers read as an LED strip. Four or five large ones read as
  a creature.
- **Appeal comes from the face.** The rejected form had a flat plate where a
  head should be and a slit for an eye. The accepted one leads with two large
  eyes.

Where this gate conflicts with a measurable one, **this gate wins and the
measurable one is amended**, with the amendment recorded. §3's torso-width gate
was relaxed for exactly this reason.

---

## 1. Why this form exists

`swarm` is the only family left whose second evolution changes nothing the
player can see. `quality3DBodyStageForFamily(2, "swarm")` returns 1, so the
body, the 2.16 world height and the four-step chain all stay at stage 1 — the
same gap the Shell line had until `basalt-bulwark` shipped. Closing it makes
all three routes deliver a visible second evolution.

## 2. Gameplay identity — and the art rule it forces

The Swarm evolution candidates grant speed, biomass and healing on kills, and
they *cost* health and damage:

| Candidate | Authority change |
| --- | --- |
| 共生孢群 | damage −6%, biomass +18%, kill-heal +7 |
| 狩猎孢云 | speed +14%, max health −10, biomass +12%, kill-heal +3 |

So the form must read as **fast and fragile, sustained by feeding** — never as
armoured or bulky. Where the Shell contract says "heavy and hard all over",
this one says the opposite, and for the same kind of reason: the silhouette
must not promise durability the player does not have.

Stage 1 already carries this. Its chain is four steps where the other forms have
three — `Pounce → Claw → Claw → Bite` — with the payoff on the **finisher**, and
the finisher has the **shortest reach** in the chain, so the step that pays most
is only available at closest quarters. Stage 2 keeps that shape.

## 3. Measured gates — and they are the inverse of the Shell line's

Measured from the shipped runtime GLBs by `scripts/measure-glb-proportions.mjs`.

| Form | w/h | l/h | Width | Length | Height |
| --- | --- | --- | --- | --- | --- |
| scarlet-gecko (Fang 1) | 0.724 | 1.848 | 1.56 | 3.99 | 2.16 |
| scarlet-hunter (Fang 2) | 0.796 | 1.927 | 2.03 | 4.91 | 2.55 |
| stone-pangolin (Shell 1) | 0.883 | 2.542 | 1.59 | 4.58 | 1.80 |
| basalt-bulwark (Shell 2) | 1.059 | 1.980 | 2.70 | 5.05 | 2.55 |
| **spore-stalker (Swarm 1)** | **0.645** | 2.006 | 1.39 | 4.33 | 2.16 |

`spore-stalker-character-presentation.ts` states it plainly: *"What separates it
is width, and only width."* 0.645 against Fang 0.724 and Shell 0.883. That makes
the stage-2 gate the **opposite** of the Shell line's:

| Property | Stage 1 | Stage 2 requirement |
| --- | --- | --- |
| **torso** w/h | 0.472 | **relaxed — §0 outranks it, see below** |
| l/h | 2.006 | **≤ 2.10** — it must not get proportionally longer |
| Resulting body at 2.55 | — | length ≤ 5.36 |

**Second correction, 2026-08-24: the gate was wrong even measured correctly.**

Holding this line to "the narrowest body in the game" is part of what produced a
creature the owner would not play — it pushed the design toward a thin, spidery,
skeletal read. Narrowness is a three-percent difference nobody perceives. Colour
and the glowing shoulder ruff separate this family far more strongly than
proportion ever did.

**§0 outranks this gate.** The accepted direction is compact and athletic with
real limb mass and will measure wider than 0.52. That is correct. What still
binds: it must stay visibly lighter and quicker than the Shell stage-2 body, and
`l/h ≤ 2.10` holds.

A source that comes back wide is rejected at silhouette review. Widening is what
the Shell line does; if this form widens, the two stage-2 bodies converge and the
route stops being legible.

### Correction, 2026-08-24: measure the torso, not the bounding box

The gate above originally read `w/h ≤ 0.70` against the **bounding-box** width,
and it rejected a mesh it should have passed. Bounding-box width on a
long-legged, splay-stanced animal measures **the stance, not the body**. It was
written against the Shell line, where the form is a low mound and the body
genuinely *is* the width; it does not transfer to a creature standing on four
spread spider legs.

Measured over the upper 45% of each body, which excludes the legs:

| Form | bounding-box w/h | **torso w/h** | torso at 2.55 |
| --- | --- | --- | --- |
| spore-stalker (Swarm 1) | 0.645 | **0.472** | 1.20 |
| swarm stage-2 mesh-1 | 0.809 | **0.475** | 1.21 |
| scarlet-hunter (Fang 2) | 0.796 | 0.573 | 1.46 |
| basalt-bulwark (Shell 2) | 1.059 | 0.767 | 1.96 |

The rejected mesh has a torso within half a percent of its own stage-1 form and
17% narrower than the Fang stage-2 body. The family identity was never at risk.
**The gate was measuring the wrong quantity**; it now measures torso width, and
the front render is the check that catches this class of error, which is why it
is the gate view for this form.

**No world-height override is needed.** Stage 1 took the 2.16 stage default and
stage 2 takes 2.55, a +18% step matching the Fang line. The Shell line needed an
override because a low long body inflates when normalised by height alone; this
body is already tall for its mass. Naively scaled, stage-1 proportions at 2.55
give 1.65 × 5.11 — inside both gates before any redesign, so unlike the Shell
line there is no elongation trap to escape.

## 4. Emissive budget — a gate this line owns alone

Stage 1's material record: emissive is a **baked mask covering 5.7% of the
texture** — the sac, the spine speckles and the eye — and the runtime must not
lift emissive globally *"or the hide stops taking light and the sac stops being
the brightest thing on the body."*

Stage 2 adds glowing area by design, so that budget has to be stated rather than
drifted past:

- emissive area **≤ 15% of the texture**; the hide stays the dominant value;
- the glow stays **confined** to the two eyes, the four-or-five shoulder pods
  and the tail tuft;
- **the creature must never read as a lantern**, and it must never read as
  diseased. Deep teal-blue hide plus cream chest stay the dominant values.

Verify from the baked texture before rigging, not by eye.

## 5. Direction — appeal first; the ruff is the architecture

Revised after board-1 / mesh-1, 2026-08-24. The first look passed every
silhouette gate and failed the one that matters for a player form: **would
anyone choose to become this.** Players called it ugly. Board-1's "fragile
colony" language — thin legs, vents, a spine of small chambers, one slit eye —
read as diseased. That direction is withdrawn.

Stage 1 remains *an animal carrying one glowing flank sac*. Stage 2 is now *an
appealing sprinter with a lantern ruff*:

- a sleek big-cat / young-dragon, compact athletic body, slightly oversized head;
- **two large glowing cyan eyes** as the far-distance focal point;
- a ruff of **four or five LARGE** smooth cyan pods around the neck and
  shoulders — big and few, set into the hide. This is the architecture change,
  not a spine of small bumps and not a bigger copy of the stage-1 sac;
- four **sturdy muscular** sprinting legs, soft paws; never stick-like or insect;
- a long expressive tail ending in a glowing tuft;
- deep teal-blue hide, pale cream chest and belly.

**The distance read.** Stage 1 is one bright dot on the flank. Stage 2 is a
crown of a few large cyan lanterns at the shoulders, plus two huge eyes and a
tufted tail. Light still separates the forms; the body must stay likeable.

Inherited and still binding: one connected animal, no floating orbs, no swarm of
extra creatures, not a biped, not a belly-crawler, no armour plates, no
coral-red. A whip-thin tail is still a rejection; a tufted cat tail is required.

## 6. Rig, budget and clips

| Item | Contract |
| --- | --- |
| Triangles | 19,000–24,000. Stage 1 is 19,992. |
| Bones | 27-bone Meshy quadruped template, node names matching every other player form. |
| Clips | `Idle`, `Walk`, `Run`, `Turn`, `Bite`, `Claw`, `Pounce`, `TailSwipe`, `Hit`, `Death` |
| Validator | `npm run validate:gltf` at zero errors and zero warnings |

Chain stays **`Pounce → Claw → Claw → Bite`**. This body keeps the leap — athletic
hind legs under a light sprinter frame are the anatomy a pounce needs.

**Every clip must be authored to match its authoritative window at playback rate
1.** The Shell stage-2 pass found that `setAction` truncates a one-shot clip when
its action window ends, and that most attack clips in this game play only 60–80%
of themselves. `tests/basalt-bulwark-form.test.ts` shows the shape of the guard;
write the equivalent for this form.

## 7. Acceptance sequence

1. Concept board. Board-1 **rejected** (ugly). Board-2 generated 2026-08-24.
   Paths in `source/SOURCE.md`.
2. Silhouette review against §5 (appeal, large eyes, four-or-five large pods,
   sturdy legs) at the true 36° camera angle.
   **← current gate: owner reviews the revision-2 3/4**
3. Meshy Image-to-3D. Text-to-3D is forbidden on this line, as on the others.
4. Measure `l/h`, `w/h` and emissive area **before** any Blender work.
5. Process, rig, ten clips, validator pass.
6. Runtime integration; add `swarm` stage 2 to the registry, a presentation
   module, a form-keyed combat branch and a typed collision profile sized to the
   measured half-width.
7. Traversal and browser verification, desktop and 844×390.
8. Owner gameplay acceptance.

## 8. Generation attempts

| # | Date | Method | Outcome |
| --- | --- | --- | --- |

| board-1 | 2026-08-24 | four separate images from revision-1 prompt | **Rejected by owner: ugly, players do not like it.** Archived `superseded-board1-*`. Lean, vented, spine-chamber chain, one-eyed. Passed silhouette gates; failed appeal. |
| mesh-3 | 2026-08-24 | Meshy Image-to-3D, `Animation → Walking (with skin)` from board-2 | **Accepted and integrated as `lantern-lynx`.** Correct 27-bone template, a Walk clip, l/h 1.714, 18,942 triangles, 0 glTF errors/warnings. Reproduces the board: big eyes, four shoulder lanterns, cream chest, sturdy paws, and the tail tuft came back as a clean stylised shape rather than the blob the job pack warned about. Three source conditions repaired in processing — the Icosphere helper, a 1.033 Hips scale key, and the neck (head swinging 28.9° in Walk against the shipped stage-1 form's 17.7°, damped to about 16°). |
| board-2 | 2026-08-24 | concept board from the appeal-first prompt | **Accepted — "这次好看了很多".** Big-cat/young-dragon, two large glowing cyan eyes leading the design, four large cyan pods at the shoulders, sturdy muscular legs with paws, cream chest, long tail with a glowing tuft. The first board for this form that answers §0. |
| mesh-2 | 2026-08-24 | Meshy Image-to-3D, `Animation → Walking (with skin)` export | **Integrated, then rejected on §0 and superseded by board-2.** It is technically sound and remains in the working tree only as the placeholder the board-2 mesh will replace: correct 27-bone quadruped template and a Walk clip, l/h 1.841, 18,924 triangles, glow 4.2% against the 15% budget, and three source conditions repaired in processing — the Icosphere helper, a constant 1.136 Hips scale, and the neck. None of that saved it. Rejected on sight as unappealing, and the owner said plainly they would not choose this form. Originally recorded here as "accepted and integrated", which was true of the pipeline and false of the creature. |
| mesh-1 | 2026-08-24 | Meshy Image-to-3D, `Character output` export | **Rejected on two counts, both fixable by one re-run.** (a) **w/h 0.809 against the ≤0.70 gate** — at 2.55 that is 2.06 wide, *wider than the Fang stage-2 hunter at 2.03*, so the narrowest family would produce the second-widest body in the game and the one property separating this line would be gone. Almost certainly caused by uploading the 3/4 alone: the same reconstruction failure as Shell stage-1 attempt 2, which came back at l/h 3.23 for the same reason on the other axis. (b) **68 generic `Bone_000…Bone_067` joints and zero animation clips** — Meshy's generic auto-rig, not the 27-bone quadruped template (`Hips`, `chest`, `head`, `tail1..3`, `frontleg`, …) that the registry rig mapping, `requiredNodes` and every processing script depend on; and with no Walk clip there is no source gait to derive Walk and Run from. Everything else passed: l/h 1.841, 18,925 triangles, glow area 4.9% against the 15% budget, 94.6% of the baked base colour dark. |

**The neck, reported from play and fixed in processing.** The owner reported the
neck sinking during Walk. Measured rather than guessed: the source rotates `head`
29.7 degrees and `headend` 26.3, against 17.7 and 15.4 on the shipped stage-1
form — about 70% more. The 27-bone template has no neck bone, so this design's
longer neck is skinned across `chest` → `head`, and a head swing that size drags
the whole throat down with it. Damped to 16.3 and 14.4, just under the stage-1
figures because this neck is longer. Only head and headend are touched; the limb
curves are the gait.

**Attack tempo.** The clips were first inherited verbatim from the stage-1 form
and came out frame-identical — the Shell line's board-1 failure repeating in the
animation layer. `compress_action()` scales them to 0.52, giving Pounce 0.71s,
Claw 0.46s and Bite 0.75s, and every window then matches its clip at playback
rate 1 so the whole motion plays. The stage-1 form does not manage this: its
clips run 1.42s, 0.92s and 1.50s against windows of 0.68s, 0.54s and 0.84s.

**The emissive ramp had to move for this body, and the two coverage numbers are
not the same thing.** This source ships `emissiveTexture` set to its own base
colour with `emissiveFactor [1,1,1]` — the reuse the scarlet-gecko and the Spore
Toad both arrived with — so left alone the whole animal emits its albedo. The
mask is rebuilt from cyan excess as usual, but this body is a saturated
blue-teal where the previous design was near-black: measured in Blender's linear
buffer it runs p50=0.137, p75=0.314, p95=0.549, so the inherited 0.30–0.62 ramp
sat below its 75th percentile and put some glow on 29% of the texture. At
0.40–0.70 it lights 8.5% at all and 4.8% weighted.

Those are two different quantities. `build_spore_emissive_mask` returns the
**pixel count** carrying any glow; the 15% budget means the **weighted** figure.
A pixel at weight 0.02 contributes nothing. Do not compare them directly — an
offline sRGB estimate of the weighted number matched Blender's, and the reported
pixel count did not, which briefly looked like a linear-vs-sRGB error and was
not.

**Also noted, and not a blocker.** The `Character output` export carries no emissive texture at all —
`emissiveFactor` and `emissiveTexture` are both absent, so the cyan is paint on
the base colour and would not glow. The entire distance read of this form is a
line of light on a dark body, so the mask has to be rebuilt in processing.
Precedent exists: `build_spore_emissive_mask` in
`process_spore_stalker_meshy.py`, and the Spore Toad hit the same thing.
Handled in Blender, not by the source.

**Re-run instructions.** Export type **Animation → Walking (with skin)**, which
produced the correct 27-bone template on the Shell stage-2 job, and upload the
**front view** as an extra view alongside the 3/4. Width has to be pinned by the
front view rather than guessed from a foreshortened three-quarter — which is why
the job pack calls the front view the gate view for this form.
