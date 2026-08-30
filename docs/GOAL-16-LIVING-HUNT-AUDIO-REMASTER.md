# Goal 16 — Living Hunt audio remaster

Status: refreshed implementation and self-validation candidate ready. Owner
listening and real-device confirmation remain required before closure.

## Player-visible outcome

Evolution Arena Lite must sound like one authored creature world rather than a
music file with unrelated effects laid over it. Exploration breathes, nearby
danger raises pressure without announcing a track change, every body family is
recognisable from its attacks, and a Boss entrance changes both the music and
the soundscape before the first damaging pattern begins.

This is a complete replacement of the rejected Goal 8 listening candidate. It
does not change damage, timing, range, collision, AI, map geometry, models,
weather authority, evolution rules or input.

## Creative direction — "the valley is alive and listening"

- **World:** wet wood, river stone, hollow roots, shell, bone, breath, spores
  and restrained animal calls. The sound belongs to the terrain and bodies on
  screen.
- **Music:** dark-organic fantasy, low melodic density, memorable two- or
  three-note identity, tactile percussion and evolving texture. No cheerful
  orchestral travel theme, continuous heroic score, trailer braams, modern
  electronic drums or horror drone wall.
- **Contrast:** quiet exploration is genuinely quiet. Combat gains pulse and
  density, not merely volume. Bosses earn the widest and most memorable moment.
- **Readability:** important information remains clear on ordinary phone and
  laptop speakers; no required cue may live only below 100 Hz.

## Music state contract

| State | Audible role | Transition |
| --- | --- | --- |
| Mode select | A short statement of the evolution motif; inviting, not safe | Starts only after trusted input; leaves cleanly when a mode begins |
| Explore | River/forest bed plus sparse organic tonal layer | 2–4 s entrance; long-form variation must avoid an obvious short repeat |
| Threat | Adds a low pulse and restless texture when a committed encounter is near | 0.8–1.6 s equal-power rise; returns without restarting the bed |
| Elite | Threat state plus a family-coloured accent | Stinger and layer change share the same tonal language |
| Boss intro | 1.8–3.2 s authored warning, reveal and impact | Must finish into the Boss loop without silence or returning to Explore |
| Boss fight | Sustained pressure with space for telegraphs and hits | Phase 2 adds density/motif; it does not restart the track |
| Victory / defeat | Short musical resolution that stops active pressure | Result overlay remains readable and never loops a combat peak |

Valley and Altar Defence use the same musical identity but different pacing:
Valley breathes between encounters; Defence can retain a restrained pulse
between waves and escalates on Boss waves.

## Sound identity matrix

### Player bodies

- **Origin:** light skin/ground contacts, small breath, quick dry attacks.
- **Fang:** sharp jaw transient, tendon snap, fast displaced air; kills resolve
  with a short predatory release rather than a UI chime.
- **Shell:** stone/plate scrape, dense body thump and low-mid crack; Slam and
  TailSwipe must feel massive without masking Boss warnings.
- **Swarm:** granular rustle, airy spore release and clustered micro-impacts;
  it must not become insect buzzing or science-fiction sparkle.

### Contact materials

Each confirmed hit is assembled from action, contact and reaction layers:

`body motion -> air displacement -> contact transient -> target material -> reaction`

- flesh/light hide: short wet-dry contact with little tail;
- shell/stone plate: hard mid-frequency crack plus restrained low body;
- spore/swarm: clustered granular contact with a soft dispersal tail;
- Elite/Boss: the correct family material with larger body and room response,
  never the same sample made louder.

Misses stop after body motion and air displacement. Hits and kills are emitted
only by authoritative damage results.

### Enemies and Bosses

- Ordinary prey receive a short telegraph cue whose rhythm matches their real
  telegraph window and whose family is identifiable before contact.
- Elite arrival, affix burst and death use a stronger version of their family
  palette.
- Every modelled Boss receives a distinct entrance signature and pattern cues.
  Shared music may carry the world motif, but Tide Cleaver, Cliff Maw, Source
  Root and Defence bosses may not share one anonymous low-frequency sweep.
- Boss warnings must be audible before damage, remain synchronised to the
  committed telegraph, and stop when the attack is cancelled or the encounter
  ends.

## Environment and weather

- River, wind and forest life form a quiet diegetic bed independent of music.
- Dawn is open and breathable; mist reduces distant detail and favours close
  droplets/wood movement; rain adds a filtered rain layer with no continuous
  harsh high-frequency wash.
- Altar Defence has a restrained portal/altar bed and wave-pressure accents.
- Environmental one-shots are seeded or rate-limited and may not create an
  unbounded source count.

## Mix and technical targets

- Separate saved **Master**, **Music**, **SFX** and **Ambience** controls plus
  mute. The old three-position master cycle is not sufficient.
- Music programme target: approximately -20 to -17 LUFS before runtime bus gain;
  ambience approximately 8–14 dB below music; routine attacks approximately
  3–6 dB above the local bed; confirmed hit above its matching swing; Boss
  warning and impact clearly above routine combat without clipping.
- Master true peak must remain at or below -1 dBFS in captured stress mixes.
- Required warnings must carry useful energy between 120 Hz and 6 kHz.
- Music crossfades use equal-power curves. Repeated state changes may not pump,
  restart the same phrase, or create a silence gap.
- External clips are trimmed to their real onset and release before shipping.
  Runtime duration limits are measured from those edited files, never used to
  cut past unknown leading silence.
- SFX concurrency is prioritised: expendable footsteps/environment yield first;
  attack telegraphs, confirmed hits, player danger and encounter cues do not.
- Meat recovery and family skill casts have dedicated semantic cues. Neither
  may reuse the evolution-selection confirmation: Fang launch, Shell brace and
  Swarm bloom must also remain recognisable from one another.
- First-interaction, hidden-tab dropping, mobile resume, relative deployment
  paths, failed-asset fallback and disposal remain mandatory.

## Hard acceptance gates

### Automated

- Asset audit verifies every active audio path, format, duration, sample rate,
  channel count, hash and licence/source record.
- No active one-shot begins with more than 12 ms unintended silence; no required
  transient is cut off by its runtime window.
- Tests cover music state transitions, repeated state calls, encounter cleanup,
  priority/source caps, separate saved bus settings, autoplay and lifecycle.
- Combat routing covers whiff, light/heavy hit, blocked hit, kill, enemy
  telegraph, enemy hit, Elite, each Boss entrance, each Boss pattern/phase,
  evolution, victory and defeat.
- Production build, full tests, runtime asset audit, itch relative build and Y8
  relative build pass with no new P0/P1 defect.

### Browser

- Desktop 1440x900 and mobile landscape 844x390: first gesture, Explore,
  ordinary fight, Elite, all Valley Bosses, representative Defence Boss wave,
  dawn/mist/rain, evolution, death, victory and tab/fullscreen recovery.
- No console/page/audio decode error, stale delayed cue, source leak, audible
  seam, clipped stress mix or critical FPS regression.
- Debug evidence exposes current music state, active layers, bus gains, recent
  semantic events, active source counts and last transition reason.

### Listening — owner is the final gate

Using normal headphones and one phone/laptop speaker, the owner must confirm:

1. With eyes away from the HUD, whiff, hit, blocked hit, kill and player damage
   are distinguishable.
2. Fang, Shell and Swarm attacks are recognisable as different bodies rather
   than pitch-shifted copies.
3. Rain and ambience create place without masking combat information.
4. A Boss entrance is memorable, the fight music continues the entrance, and
   every damaging Boss pattern is readable before impact.
5. Twenty minutes of play does not make the music loop or routine attacks feel
   repetitive or fatiguing.
6. No cue is described as cheap, unrelated, intermittent, painfully loud,
   muddy, synthetic-placeholder-like or inaudible on the smaller speaker.

Goal 16 cannot be marked complete from tests, waveforms or browser routing
alone. Those produce the acceptance candidate; the owner's listening pass is
the final decision.

## Evidence to deliver

- Active asset/source/hash manifest and processing notes.
- Event-to-layer matrix and measured loudness/onset/peak report.
- Desktop/mobile browser state and error evidence for the complete matrix.
- Direct acceptance URLs for Valley, each Boss, Defence and each weather state.
- A concise list of anything that still needs a physical-device confirmation.

## Acceptance candidate evidence — 2026-08-30

### Implemented and measured

- Six continuous 44.1 kHz stereo layers: world, pressure pulse, Boss music,
  forest, rain and the Defence altar/portal bed. Forty edited event files
  cover mode selection, combat, family/material identity, evolution, distinct
  Boss entrances/warnings/phase changes, wave accents and results.
- The Boss source's 1.4-second encoded silent tail was removed. The active
  68-second loop uses a four-second internal crossfade and a dual-channel
  near-zero boundary; measured edge jumps are 0.0005 / 0.0035.
- Codec-decoded peak audit found 23 transient overshoots in the first export.
  Those files were transparently limited and re-exported at -3.0 to -4.2 dBTP;
  every remaining file is at or below -1.0 dBTP.
- `npm run verify:audio` parses the actual Vorbis headers/pages and verifies the
  46 Goal 16 plus three retained Goal 8 runtime hashes, 44.1 kHz source sample
  rate, channel contracts, duration bounds and source/licence records.
- `?debug=1&audioAudit=1` performs a second, independent browser-engine decode
  of all 49 active audio URLs. It measures PCM onset, trailing silence, decoded
  peak, final-window peak, loop edge and the 120 Hz–6 kHz energy ratio. The
  final run is 49/49 with zero failures: maximum onset 11.17 ms, maximum
  one-shot silent tail 49.29 ms, and required warning useful-band ratios
  0.692–0.984.
- That audit exposed four defects the header/asset tests could not see: a 0.155
  world-loop edge, 31 ms Shell swing prefix, -15 dBFS hard-cut Fang tail and
  -0.90 dBFS old footstep. All were re-edited. A release-tail pass then removed
  60–619 ms inaudible payloads from 22 active one-shots/foley files.
- The old master path was only a compressor: a 4× oversampled Phase 2/Defence
  stress render exceeded 0 dB at +0.54 dBTP. The runtime now adds a 4× soft-knee
  limiter and final ceiling. Its maximum-source stress case (10 SFX plus four
  continuous layers) measures -1.34 dBTP.
- Full Vitest: 137 files / 1358 tests. Production build, itch relative build
  and Y8 relative build/package all pass. The existing Three runtime chunk
  remains above 500 kB; Goal 16 did not create that warning.

### Browser verified

- The mode-card click started `mode-select.ogg` from the trusted gesture and it
  reached `ended` cleanly during scene loading. The run's first real canvas
  gesture then produced `AudioContext=running`, active ambience and 43 decoded
  external event buffers with no delayed routine cue.
- A strict follow-up exposed and fixed an automatic-Defence startup race. Before
  the run gesture, a normal Defence entry now remains at ready/wave 0 with zero
  combat events. After the gesture it advances to wave 1, emits `wave-start`,
  selects threat music plus forest/Defence ambience, and keeps no stale pending
  cue.
- The Warden gate remained dormant before the run gesture. After unlock it
  reported `lastEncounterContext={bossIdentity: warden}`, Boss Phase 1,
  pulse+Boss music, forest+Defence ambience and no pending encounter signal.
  With one browser tab it stabilised at 68.9 mean FPS, 16 ms p95, zero stalls.
- Real combat input emitted distinct swing, contact, landing, player-hit and
  kill boundaries. All three Valley Boss gates emitted entrance then shape
  warning; Phase 1 changed to Phase 2 at the real health threshold.
- Family-specific Elite intros, blocked contact and the dedicated Boss phase cue
  are covered by routing tests and decoded in-browser; their final artistic
  judgement remains part of the owner listening gate below.
- Dawn, mist and rain each selected the intended environment mix. Master,
  Music, Combat & UI and World Ambience update independently and persist.
- Settings remained operable at 1280x720, 844x390 and 390x844. Final browser
  console: zero warnings/errors. A fresh headless Chrome touch context at true
  844×390 CSS pixels / 1.15 render ratio reported running audio, 39 decoded
  event buffers, world+forest+rain, visible touch controls and all four audio
  buttons; 95.6 mean FPS / 17.5 ms p95 / zero stalls. Resizing that same context
  to 390×844 preserved running ambience and showed the orientation gate. This
  is real browser/device emulation on the development Mac, not physical-phone
  thermal or speaker evidence.

### Owner feedback correction — healing and skill casts

- The owner correctly identified that meat recovery and skill release sounded
  identical and semantically wrong. Both paths were reusing
  `evolution-select`, a large progression confirmation, as a generic positive
  cue. Recovery now emits `heal-pickup`; a successful skill emits
  `skill-cast` with the fired skill's own Fang/Shell/Swarm family.
- Four dedicated mono one-shots replace that alias. Shell remains a non-pitched
  physical impact; healing V3 deliberately restores one continuous upward tonal
  gesture because the noise-only V2 was not recognisable as recovery.
- The refreshed browser audit is 49/49 with zero failures and -1.34 dBTP stress
  peak. A real Shell cast reports `lastEvent=skill-cast` and
  `lastContext.playerFamily=shell`; browser console warnings/errors remain zero.
  Full Vitest is now 137 files / 1358 tests, and production build plus the
  52-reference runtime asset audit pass. Owner listening remains the final
  artistic gate for these four cues.

Owner rejected the first `heal-pickup` because its three fixed pitches and
decay read as a struck bell, then rejected noise-only V2 because it read as
rustling rather than recovery. V3 follows current healing-cue references without
copying their struck-note language: a CC0 reference fragment is reversed,
band-limited and kept quiet beneath an original continuous 430–930 Hz rise. The
old organic texture is reduced to 8% gain. The 0.780-second, 44.1 kHz mono file
peaks at -7.65 dBFS before runtime gain. A cache-busted browser reload decoded
it as 0.777 seconds with 8.40 ms onset, 28.92 ms trailing silence and 0.99999
useful-band ratio; the complete 49/49 PCM audit and -1.34 dBTP stress render
pass with zero failures. It still requires fresh owner listening.

Owner then judged V3's recovery presence too strong and the two generic monster
deaths too electronic. V3.1 keeps the accepted recovery shape but lowers only
its event gain from 0.72 to 0.48 (-3.52 dB). Death V2 discards the former
processed composites: unpitched CC0 `die_01`/`die_03` throat recordings now lead,
with only restrained breath and body contact beneath them. Their file peaks fall
from about -3/-2.3 dBFS to about -7.9 dBFS, and runtime gains fall from 0.86/0.88
to 0.66/0.64. Neither path changes combat, healing or reward authority.
A browser-cache-isolated V5 pass decodes the two deaths at 0.415/0.575 seconds,
10.04/10.17 ms onset, 18.73/23.29 ms silent tail and -7.72/-7.90 dBFS peak.
All 49 PCM records pass with zero failures; the maximum-source stress render is
-1.35 dBTP and 43 external event buffers load successfully.

Owner also rejected the resonant Shell cast because Bulwark is a physical shove,
not a magical shield. Shell V3 removes every oscillator and sustained resonance:
the cue now opens on shell/stone impact plus ground body, follows with a second
rock crack, and ends in filtered gravel/sand scatter. This supersedes both
earlier Shell skill candidates and requires fresh owner listening. Browser
review rejected the first physical V3 too: its low ground body dominated and
its gravel became inaudible 86.3 ms before the file ended. V3.1 reduces that
rumble, raises the 520 Hz–5.2 kHz crack/gravel bands and carries the scatter to
the release. Decoded onset is 0.46 ms, silent tail 31.33 ms, peak -6.18 dBFS
and useful-band energy 0.815; the complete 49-file audit passes.

### Owner acceptance entries

Run `npm run dev -- --port 4178`, choose River Valley unless noted, then use:

- Dawn: <http://127.0.0.1:4178/?debug=1&weather=dawn&evolutionSeed=goal16-dawn&mapSeed=1601>
- Mist: <http://127.0.0.1:4178/?debug=1&weather=mist&evolutionSeed=goal16-mist&mapSeed=1602>
- Rain: <http://127.0.0.1:4178/?debug=1&weather=rain&evolutionSeed=goal16-rain&mapSeed=1603>
- Valley Boss 1: append `&bossGate=1&bossIndex=0&evolutionChoice=0`
- Valley Boss 2: append `&bossGate=1&bossIndex=1&evolutionChoice=0`
- Valley Boss 3: append `&bossGate=1&bossIndex=2&evolutionChoice=0`
- Defence Warden: open
  <http://127.0.0.1:4178/?debug=1&bossGate=1&evolutionChoice=0&evolutionSeed=goal16-defence&mapSeed=1616>
  and choose **The Altar**.

### Still requires the owner / physical hardware

- The six listening questions above on ordinary headphones and a phone or
  laptop speaker, including one uninterrupted 20-minute run.
- Real iOS/Android autoplay/resume, Bluetooth/headphone routing, thermal load
  and the project's existing midrange-device 30-FPS gate.
- Actual itch/Y8 iframe focus, ad/fullscreen lifecycle and platform loudness
  after upload. Local relative packages verify paths and SDK build shape only.
