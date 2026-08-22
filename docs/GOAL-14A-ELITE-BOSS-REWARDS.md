# Goal 14A — Elite & Regional Boss Reward Loop

## Player outcome

Optional Elite fights and regional Bosses now give a visible, build-relevant
reward rather than only a hidden progression change:

- an **Elite Gene Core** drops toward the player after an Elite kill; walking
  over it grants one additional Gene of that creature's family;
- a **Boss Gene Core** drops after the Shallows or Gorge Boss; walking over it
  grants two additional same-family Genes, then opens the existing mutation
  candidate screen for that Boss's existing milestone;
- the Headwater Boss remains terminal: its reward is run victory, not an
  unusable post-finale pickup.

Every kill still gives its original one Gene and biomass. Cores are bonuses for
the riskier encounter, not a replacement reward and not a new currency.

## Presentation and interaction

- Cores are ground pickups: no extra button, inventory, skill, or targeting
  mode. They remain at the Elite/Boss centre, use the established body-radius
  pickup rule, and never expire. Boss cores first hold for 1.15 seconds, so
  their appearance cannot be skipped by an immediate overlap pickup.
- The visual is deliberately a small bounded hierarchy: a rough amber-bronze
  faceted crystal with a restrained warm rim, two orbiting gold rings, a low
  circular ground rune and three/four motes. Boss cores use the larger version,
  not a white-hot version. There is deliberately no
  vertical cone/column obscuring the terrain.
- This uses ordinary Three meshes and transparent materials only. It does not
  add post-processing, global bloom, shadow-casting point lights, a shader, or
  a per-frame particle allocation.
- The confirmation message and floating `+1` / `+2` number reuse the existing
  HUD, localisation and sound paths. No extra HUD card covers combat.

## Authority boundary

- The existing damage gate still grants the base Gene and biomass at death.
- A core updates Gene count only on physical collection; presentation never
  decides its value.
- A regional gate opens from the already-authoritative Boss death. The matching
  mutation milestone is held in the dropped Boss Core so its existing three-way
  selection opens only once the player has visibly claimed the reward.
- Normal prey, Elite health/damage/affixes, Boss health/patterns, map, models,
  movement and the one-button basic attack remain unchanged. A subsequent
  owner-requested calibration raises only the damage of fully telegraphed River
  Valley Boss patterns; it does not change their range, timing or recovery.

## Verification plan

1. Unit test Elite/Boss reward amounts, family preservation, pickup reach and
   non-expiry.
2. Check existing valley progression and mutation milestones still prevent
   duplicate offers.
3. Browser-check a Shallows Boss at 1440×900 and the normal River Valley at
   844×390 landscape: core must remain readable, clear on collection, update
   family Gene count and open only the established mutation UI.
4. Confirm no new console/page error and no new performance regression.

## Acceptance check

- An Elite detour visibly pays a gold `+1` same-family Gene Core.
- A regional Boss visibly pays a larger `+2` core and then the familiar
  mutation choice; it no longer reads as "only a gate opened".
- The core is recognisable at a glance as a rare reward, but never obscures a
  Boss tell or makes the game meaningfully hotter.
