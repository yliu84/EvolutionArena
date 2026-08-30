# Goal 16 audio source and processing record

All source works below are CC0 / public-domain material. Goal 16 files are
edited presentation assets only. They never decide a hit, damage, AI timing or
progression. Exact shipped-file hashes live in `SHA256SUMS` beside this file.

## Music and ambience

- `music-world.ogg`: **Dark Place (loop)** by SkyleTheFrench,
  <https://opengameart.org/content/dark-place-loop>, CC0. High-pass 55 Hz,
  low-pass 12.5 kHz, programme normalised near -19.5 LUFS. Browser PCM audit
  exposed a 0.155 boundary jump in the published loop; the active 52.857-second
  edit overlaps the final two seconds into the opening and resumes at the next
  natural source sample. Its decoded edge jump is approximately 0.001.
- `music-pulse.ogg`: **Krakatoa** by Kistol,
  <https://opengameart.org/content/krakatoa>, CC0. The source is published as a
  seamless loop. High-pass 75 Hz, low-pass 8.5 kHz, normalised near -20 LUFS.
- `music-boss.ogg`: **Ancient Power Of Serpents** by Kevin MacLeod,
  <https://opengameart.org/content/ancient-power-of-serpents>, CC0/public
  domain. A 68-second, bar-aligned loop was cut from the sustained battle
  section; its four-second internal crossfade removes the source's 1.67-second
  silent tail, and the final boundary was chosen at a dual-channel near-zero
  crossing. Normalised near -18 LUFS.
- `ambience-forest.ogg`: **Forest Ambience** by TinyWorlds,
  <https://opengameart.org/content/forest-ambience>, CC0 and published as a
  seamless loop. High-pass 100 Hz, low-pass 10.5 kHz, normalised near -26 LUFS.
- `ambience-rain.ogg`: sample 2 from **Rain (loopable)** by Ylmir,
  <https://opengameart.org/content/rain-loopable>, CC0. High-pass 130 Hz,
  low-pass 9 kHz, a restrained 3.2 kHz cut, normalised near -27 LUFS.
- `ambience-defence.ogg`: a 32-second authored altar/portal bed built from
  filtered breath and snore textures in rubberduck's CC0 creature packs, quiet
  shaped noise and a low procedural tonal pulse. High-pass/low-pass filtering
  keeps it out of the combat transient band; normalised near -29 LUFS.

## Creature, impact and material sources

- **80 CC0 creature SFX** and **80 CC0 creature SFX #2** by rubberduck,
  <https://opengameart.org/content/80-cc0-creature-sfx> and
  <https://opengameart.org/content/80-cc0-creture-sfx-2>, CC0. Selected hurt,
  attack, grunt, roar, bug and slime recordings provide creature bodies,
  telegraphs, reactions and Boss signatures.
- **75 CC0 breaking / falling / hit sfx** by rubberduck,
  <https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx>, CC0.
  Selected rock/body impacts provide hard contact and Boss weight.
- **100 CC0 metal and wood SFX** by rubberduck,
  <https://opengameart.org/content/100-cc0-metal-and-wood-sfx>, CC0. Selected
  wood cracks provide shell, root and plate detail.
- **25 CC0 mud sfx** by rubberduck,
  <https://opengameart.org/content/25-cc0-mud-sfx>, CC0. Selected mud contacts
  provide restrained flesh and spore dispersal layers.
- Goal 8 CC0 source recordings are reused only as raw layers: qubodup's
  **Swish - bamboo stick weapon swoshes**, StarNinjas' **7 Eating Crunches**,
  and the Kenney **Impact Sounds** footsteps. Their original links and hashes
  remain in `../goal8/SOURCES.md`.

## Goal 16 expansion cues

- `heal-pickup.ogg` V3 is a bespoke recovery composite informed by **Heal - Rpg**
  by colorsCrimsonTears,
  <https://freesound.org/people/colorsCrimsonTears/sounds/562292/>, CC0. A quiet,
  reversed and band-limited fragment of that reference removes its struck-note
  attacks and becomes a soft rising glow. The main identity is an original
  continuous 430–930 Hz life-energy glide with a non-harmonic upper partial;
  the rejected V2 breath/fluid texture remains at only 8% gain as tactile
  absorption. There is no separated three-note figure, metallic transient or
  resonant bell tail. The shipped file is 0.780 seconds, 44.1 kHz mono and peaks
  near -7.7 dBFS before the saved 0.48 runtime gain. V3.1 keeps the same cue but
  lowers its in-game level by 3.52 dB after owner feedback that V3 still sat too
  far forward in the combat mix.
- `kill-01.ogg` and `kill-02.ogg` V2 return to the unpitched `die_01` and
  `die_03` recordings from rubberduck's **80 CC0 creature SFX #2**. They use
  only high/low-pass cleanup, gentle fades, a quiet natural breath on variant 2
  and a restrained body-contact layer from the retained Goal 8 landing source.
  No oscillator, pitch shift, ring modulation or synthetic kill-confirmation
  tone is present. Browser-led head/tail trims reduce them to 0.418/0.578 seconds
  without changing their body. The files peak near -7.8 dBFS before 0.66/0.64 runtime gains;
  the rejected versions peaked near -3/-2.3 dBFS before 0.86/0.88 gains.
- `skill-cast-fang.ogg`, `skill-cast-shell.ogg` and
  `skill-cast-swarm.ogg` are separate family casts rather than a shared UI
  confirmation. Fang combines a predatory intake and launch transient; Shell
  combines two existing CC0 shell/stone impacts, the retained ground-contact
  body, and filtered granular noise for a short gravel scatter, with no pitched
  shield resonance;
  Swarm combines granular air, clustered modulation and a soft spore tone.
  The generated tonal/noise layers are original; any reused body layers derive
  from the CC0 packs already recorded above.

- `mode-select.ogg` is a short stereo statement of the world motif. It also
  returns at restrained gain as the Defence wave accent, making the menu and
  run feel like the same product.
- `blocked-hit.ogg` combines a short plate/wood stop with a muted body layer;
  it is deliberately drier and less rewarding than a confirmed flesh hit.
- `elite-intro-fang.ogg`, `elite-intro-shell.ogg` and
  `elite-intro-swarm.ogg` use distinct creature, plate and granular/spore
  composites from the CC0 packs above. They are selected by the actual enemy
  family, not pitch-shifted at runtime.
- `boss-intro-warden.ogg` gives Thornheart Warden its own root/wood/breath
  signature. Defence's Tide Cleaver, Cliff Maw and Source Root retain their
  corresponding Valley identities instead of falling back to this cue.
- `boss-phase.ogg` is a dedicated rising body-and-wood transition. It no
  longer aliases the disc attack warning, so a phase change cannot teach the
  wrong dodge response.

All expansion one-shots were onset-trimmed, filtered and gain-staged before
Vorbis export. Their decoded peaks measure from -3.7 to -8.0 dBFS; the Defence
bed measures -4.6 dBFS peak. These are file peaks before the saved bus gains
and runtime master limiter.

## Production rules

- One-shots are trimmed to audible onset before export. Runtime code does not
  stop them at guessed offsets.
- The decoded-PCM follow-up removed a 31 ms prefix from `shell-swing-01`, gave
  `fang-swing-01` a 45 ms cosine release instead of a hard -15 dBFS terminal
  cut, and moved both comfortably inside the 12 ms onset / -30 dBFS final-window
  gates. The retained Goal 8 second footstep was shortened from 666 ms to 146 ms
  by removing its silent payload and was lowered to a decoded -3.1 dBFS peak;
  its updated hash remains in `../goal8/SOURCES.md`.
- A subsequent release-tail audit shortened 21 Goal 16 one-shots whose decoded
  signal had already fallen below -50 dBFS but whose OGG payload continued for
  60–249 ms. Each now retains approximately 20 ms of release room; this removes
  inaudible source occupancy without cutting an audible tail. Browser decode
  is the authority because Vorbis padding differs from source PCM.
- Combat one-shots ship mono at 44.1 kHz. Music, ambience, evolution reveals
  and musical victory/defeat resolutions ship stereo at 44.1 kHz. All active
  files use Vorbis OGG for the browser build.
- Each composite is high/low-pass filtered for useful phone/laptop energy and
  loudness normalised. Codec-decoded peak audit found 23 Vorbis transient
  overshoots; those files received a final transparent limiter pass and now
  measure between -3.0 and -4.2 dBTP. The remaining files are at or below
  -1.0 dBTP, before runtime gain staging and the master limiter.
- Boss warning shapes are semantic: `disc` means move out, `line` means step
  aside, and `ring` means move inward or far out. They are emitted on the real
  telegraph transition before authoritative damage.
