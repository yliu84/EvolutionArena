# Goal 8 — River Valley audio acceptance

Status: implementation candidate; owner listening approval pending.
Entry: `http://127.0.0.1:<vite-port>/?maplab=5&debug=1&evolutionStage=1&evolutionRoute=fang&evolutionSeed=goal8-audio`

## Scope lock

- River Valley receives one restrained ambient bed and basic combat feedback.
- Audio consumes existing movement, attack, contact, death, evolution and encounter events.
- Damage, range, targeting, evolution, map layout, models, mutation effects and the single basic-attack input are unchanged.
- The selected external trial assets are recorded with source, licence and SHA-256
  in [`public/assets/audio/goal8/SOURCES.md`](../public/assets/audio/goal8/SOURCES.md).
  `src/gloamwood-3d-audio.ts` only routes them after a user interaction; it never
  uses an asset to determine gameplay.

## Audible contract

| Player event | Audio contract |
| --- | --- |
| Footstep | Quiet, alternating CC0 grass foley; never competes with an impact. |
| Pounce landing | Separate low CC0 ground/body layer after the airborne action. |
| Bite / Pounce / Claw / TailSwipe | A quiet 0.20–0.28s CC0 air swish on action start. A miss ends here. |
| Confirmed hit | Short CC0 bite-crunch contact is added only after authority confirms damage. |
| Kill | Impact plus a short resolving signal, distinct from an ordinary hit. |
| Enemy damage to player | A separate, quieter body cue only after an enemy actually damages the player; simultaneous hits collapse to one cue. |
| Player death | A distinct final-defeat cue. |
| Evolution | Rising open/select signals. |
| Elite / Boss | Separate arrival stings; Boss is lower and longer. |
| Victory | Rising result signal; defeat remains descending. |

The River Valley bed is congusbongus' CC0 **Cathedral in the forest** seamless
ambient-music loop. It is decoded by the browser as a looped media element
after first interaction and fades in over 2.4 seconds; it remains deliberately
below movement and combat. Large cues duck it briefly; a compressor/limiter
remains on the master bus.

Small external files prefetch silently but are decoded once into reusable
`AudioBuffer`s only after first unlock; gameplay never creates an HTML media
element during a footstep, swing or hit. At most ten very short sources may
overlap; a footstep may yield to a crowd, but an attack or confirmed hit does
not. Active attack sounds are CC0 natural air swishes, active contact sounds
are CC0 bite crunches and player damage uses a CC0 creature-hurt cue. The
previous Mixkit and drum-like Kenney impact trials are retained on disk but
inactive.

**Public Pages path:** music and sound URLs resolve through the shared
`assetUrl()` boundary. This preserves ordinary localhost paths while correctly
prefixing GitHub Pages project deployments with `/EvolutionArena/`; audio files
must never be fetched from the domain-root `/assets/` path.

**Strict timing rule:** a routine combat cue is scheduled only while the audio
context is already `running` and the page is visible. A suspended lifecycle
state triggers a resume attempt but drops the old cue instead of replaying it
after an action has ended. Player attack and player-confirmed-contact events
are never emitted by enemy or Boss FX; enemy damage uses the separate,
rate-limited `enemy-hit-player` route.

## Owner listening pass

1. Load the entry and wait without touching anything: there must be no audio.
2. Click the world or move once: the ambient bed should fade into perception,
   not announce itself as a song start.
3. Swing once without contact, then connect the same chain: the connected hit
   must add weight that the whiff does not have.
4. Complete a kill and take a hit. Each should be identifiable with eyes away
   from the health bars.
5. Use `bossGate=1&bossIndex=0`, interact once, and fight the first River Valley
   Boss. If the debug gate awakened it before that first interaction, the
   arrival sting is preserved and plays on unlock. Its arrival and attacks
   should read above ordinary prey without a painful volume jump.
6. Open Settings. Toggle mute off/on and cycle volume; refresh and confirm the
   choices persist. Repeat in phone landscape and after returning from another
   tab or fullscreen.

Pass when the owner confirms: the ambient loop is unobtrusive and seam-free;
whiff, hit, kill, incoming hit and Boss are distinguishable; impacts feel
weighty without harshness or clipping; and mobile resume/settings are reliable.

## Automated and browser evidence

- `npm run build`: passed; the existing legacy bundle >500 kB warning remains.
- Focused audio/combat/mobile regression: 3 files / 32 tests passed. Full
  regression after the strict-timing correction passed: 105 files / 971 tests. The
  repository's default five-second timeout is too short for several unchanged
  River Valley grazing simulations on this machine, so use
  `npx vitest run --testTimeout=15000`.
- Current palette browser check: after the first desktop interaction, all nine
  short buffers decoded once; the real basic chain recorded
  `attack-bite`, `hit-light` and `attack-pounce` at 1440×900, while audio was
  running and the ambient bed was active. It sampled about 107 FPS (9.3 ms
  average, 13.1 ms p95), with no console warnings/errors. After a simulated
  844×390 reload and interaction, the context and ambient bed resumed with all
  nine buffers ready, at about 120 FPS (8.3 ms average, 9.3 ms p95) and no
  console warnings/errors. Browser instrumentation can verify routing and
  lifecycle, not whether the mix is aesthetically right.
- Strict-timing browser check: the desktop chain emitted only the player route
  (`attack-*`, then confirmed `hit-*` / `kill`); after it settled, active short
  sources returned to zero. Subsequent damage was explicitly recorded as
  `enemy-hit-player`, never as a player heavy hit. At simulated 844×390, a
  keyboard gesture restored `contextState=running`, ambience and all nine
  buffers with no console warning/error.
- Forest-music browser check: before a trusted interaction, the music was not
  active. At 1440×900, after interaction and the 2.4-second fade window,
  `contextState=running` and `ambientActive=true` at about 120 FPS (8.3 ms
  average, 8.9 ms p95), with no console warning/error. The same state restored
  at simulated 844×390 after a trusted touch-plus-keyboard gesture.
- Owner listening remains the release gate. The owner rejected the first
  external trial as unrelated, saturated and intermittent; the removed Mixkit
  and Kenney-contact files must not return to the active map. Verify this
  revised palette on a device with sound enabled before any acceptance claim.
