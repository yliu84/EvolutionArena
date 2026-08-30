# Goal 8 audio trial — source and licence record

Downloaded: 2026-08-21. These are presentation assets only; they never decide
damage, hit confirmation, kills or progression.

## Active River Valley background music

- File: `river-valley-forest-music.ogg`
- Work / author: **Beautiful Forest [Orchestra]** by nene
- Source: <https://opengameart.org/content/beautiful-forest-orchestra>
- Licence: CC0. 16-bit, 44.1 kHz stereo Vorbis OGG. This replaces the former
  pad-and-bell bed because it gives the River Valley a gentle melodic arc
  without a persistent drum or pulse. The runtime remains an ordinary native
  HTML media loop, with the existing 2.4-second fade-in.
- SHA-256: `affee8ea651ac18b5def59388049406c95e271ef2fc223097605a17527175644`
- Mix: music gain is restrained but audible at `0.05` before the user's saved
  master-volume preference and combat ducking apply. At the default 60% master
  setting this yields an effective music gain of `0.03`; it is still ducked
  during important combat and encounter cues.

## Retired River Valley background-music trial

- Work / author: **Cathedral in the forest (ambient loop)** by congusbongus
- Source: <https://opengameart.org/content/cathedral-in-the-forest-ambient-loop>
- Licence: CC0. It was previously shipped as the active bed (SHA-256
  `b9e05a1fcd5869b63193515e2a9c1bd578906a78e628e307f19527d387262593`) and
  is no longer in the runtime payload after the owner found its sustained pad
  too monotonous and oppressive.

## Removed River Valley atmosphere trial

- File: `river-valley-forest-ambience.mp3`
- Work / author: **Forest Ambience** by TinyWorlds
- Source: <https://opengameart.org/content/forest-ambience>
- Licence: CC0. Removed from the shipped payload because it was not loaded
  alongside the active music loop; this source/hash record remains for
  provenance.
- SHA-256: `9850aa1d0d5d66bd9c5daf8bb77c6d852e01f2f4de22f283bd5621e8bed13b75`

## Active River Valley foley

- Source pack: **Kenney Impact Sounds**
- Source: <https://kenney.nl/assets/impact-sounds>
- Licence: Creative Commons CC0.
- Files: `footstep-grass-01.ogg`, `footstep-grass-02.ogg`,
  `land-soft-heavy-01.ogg`.
- SHA-256, in filename order:
  - `54442ef23c8dd8775d2db2462468ed3085862e29851dd4d3f18e6eb4cb47284c`
  - `ecda6c93558bceb35321d28b6daaee78eddd6f67a7c68839eaf9c1ad0f45711e`
  - `6d75c5c95090d8202c0abd6070031214a6012b460158e38bd18b0409d72db1d4`

Goal 16's decoded-PCM audit found that `footstep-grass-02.ogg` carried more
than half a second of inaudible tail and decoded at -0.90 dBFS. The retained
CC0 source was re-edited to 146 ms with a short release and -3.1 dBFS decoded
peak; the hash above records that presentation edit.
The same audit subsequently shortened `footstep-grass-01.ogg` from 775 ms to
approximately 178 ms and lowered it to -3.47 dBFS. `land-soft-heavy-01.ogg`
keeps its full release but was lowered from -0.92 to -3.5 dBFS so every active
foley file clears the strict -1 dBFS decoded-peak gate.
`ACTIVE-SHA256SUMS` is the machine-checked inventory for the three Goal 8
foley files still referenced by the Goal 16 runtime.

## Active CC0 creature-combat palette

- **Swish - bamboo stick weapon swoshes**, qubodup, CC0:
  <https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes>.
  Original `swosh-06.flac`, `swosh-18.flac` and `swosh-31.flac` were converted
  once to AAC/M4A with macOS `afconvert` for broad browser support. Files and
  SHA-256: `attack-bite-swish-01.m4a`
  `6c7e2c6c46879e78623b0ea0fe740751888f8dcb6a989e4589cc554fedac1638`,
  `attack-pounce-swish-01.m4a`
  `e95f4d089cafdf39b48d97a1cb5cd03820b489f07f66c38b79ee00fc4cb19278`,
  `attack-tail-swish-01.m4a`
  `c51172b707c662790ecffa2c72b2268c0eaf8c49042850e76d6f9d9e9b7af961`.
- **7 Eating Crunches**, StarNinjas, CC0:
  <https://opengameart.org/content/7-eating-crunches>. Original `crunch.3.ogg`
  and `crunch.5.ogg`; active files `hit-bite-crunch-01.ogg`
  `a24b3e10c6085662eed6ac9f34e133b4d2e645d67121ecdc1d9e66dc279e828d`
  and `hit-bite-crunch-02.ogg`
  `b015b7e1091d20e75404b52b4d90aee1d5c9942e4e361ee62ba7599c2bf9a973`.
- **80 CC0 creature SFX**, rubberduck, CC0:
  <https://opengameart.org/content/80-cc0-creature-sfx>. Original `hurt_04.ogg`;
  active `player-hurt-creature-01.ogg`
  `65a6524d46bbf2acccb09b551fe7e3616dbd19f62266b5ea7e6313df29031df1`.

## Removed inactive Mixkit trial clips

- Source / licence: Mixkit Sound Effects Free License, commercial use permitted;
  no attribution required. <https://mixkit.co/license/>
- Source catalogue: <https://mixkit.co/free-sound-effects/whoosh/> and
  <https://mixkit.co/free-sound-effects/punch/>.
- These original files were **not loaded or played** after the second style pass
  and were removed from the shipped payload:
  - `attack-bite-air-woosh.wav` — **Air woosh**, item 1489 —
    `fdc4f87eb2c6d29ec3567b299fdc3b2aeea2432afe27801db80c496bda084499`
  - `attack-pounce-arrow-woosh.wav` — **Arrow whoosh**, item 1491 —
    `c9aa08de97e5a1235f9b2b4eb7a1096f2fe09586995859e46aa83e9066badca2`
  - `attack-tail-fast-woosh.wav` — **Cinematic whoosh fast transition**, item 1492 —
    `02b8cd40b3761288d54f4d6706983a2f8c110182b669ae2cdf9aab02935a4e7a`

  - `hit-light-martial-arts.wav` — **Martial arts fast punch**, item 2047 —
    `d02e33dbaebf80c24c30794e0627408340e64a62ac26aef1265a5892062b741e`
  - `hit-heavy-strong-punch.mp3` — **Impact of a strong punch**, item 2155 —
    `f89ad1657209daec85a2b17e009c0c8d992f8549d5ed477622b44f6a099fa577`
  - `hit-player-game.wav` — **Small hit in a game**, item 2072 —
    `2da77832ddcce963fd18607c1be61f0f0439533c230efafa4f8803eaebee5afa`

## Removed inactive Kenney contact trial clips

- Source pack: **Kenney Impact Sounds** — <https://kenney.nl/assets/impact-sounds>
  — Creative Commons CC0.
- These files were **not loaded or played** after the second style pass because
  their generic percussion-like contact did not fit creature combat, and were
  removed from the shipped payload:
  - `hit-light-generic-01.ogg` — original `impactGeneric_light_000.ogg` —
    `f0e982611e97512fee5f777986b67e8b435434b601f94992ec044f7e89fb5acb`
  - `hit-heavy-punch-01.ogg` — original `impactPunch_heavy_001.ogg` —
    `f92f5cb6ba4ff2766497292ffd90865654317eeca976f5652e0708dbdcdc0dd9`
  - `hit-player-soft-01.ogg` — original `impactSoft_medium_002.ogg` —
    `5069e3571a77d7f7aae9ef71d0364aa245fb7d64a7c8cc9956f221d03088c089`

The full trial directory is approximately 5.1 MB. Do not replace any file with
a same-named download without updating this record and its hash.
