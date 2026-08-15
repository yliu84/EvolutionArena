# Pouncer animation atlas

- Asset: `pouncer-animation-atlas-v1.png`
- Purpose: first production-style animated monster sample for the Gloamwood V4 combat lab.
- Source: generated with the built-in OpenAI image generation tool on 2026-08-14.
- Camera: fixed three-quarter top-down view, facing screen-right.
- Lighting: upper-left moonlight with warm reflected ground light.
- Grid: 4 columns by 4 rows, 313 x 313 pixels per frame after normalization.
- Frame groups: idle `0-3`, move `4-7`, pounce `8-11`, hit `12-13`, death `14-15`.
- Integration rule: keep gameplay timing authoritative; animation frames only present the current AI state.

Final prompt summary: a consistent dark-fantasy flea-and-mantis hybrid with rust-red and bone-brown chitin, rendered as a transparent 4 x 4 Phaser sprite atlas containing idle, run, pounce, hit, and death keyframes.
