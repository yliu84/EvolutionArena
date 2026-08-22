# Goal 13A — River Valley Hunt Radar

## Player promise

River Valley has a small, semi-transparent circular **local** radar. It answers
only the navigation questions a hunt needs:

- the player remains centred in a fixed north-up map frame while nearby
  geography keeps its world bearing; the centre arrow alone communicates facing;
- restrained terrain bands, the real river and the real side-canyon network
  give the nearby River Valley route geographic shape without new art;
- the label names the current region;
- gold marks the next Boss or, once appropriate, the next evolution gate;
- mint marks an Elite only while it is the player's locked target.

The radar deliberately never draws normal prey. It is a route and opportunity
aid, not a replacement for looking at the world or a combat targeting system.
Side-canyon endpoints are map geography, not spawn or creature indicators. A
Boss or evolution gate beyond the local radius becomes a gold edge marker
instead of vanishing.

## Boundaries

- No changes to movement, lock, attack range, damage, AI, spawning, map
  placement, evolution, models, weather, or touch controls.
- No new map art, fog-of-war, live creature tracking, or additional input.
- It appears only on the formal River Valley map.

## Verification

```bash
npx vitest run tests/gloamwood-valley-radar.test.ts tests/gloamwood-valley-weather.test.ts
npm test
npm run build
```

Manual pass: check the regular and forced-Boss River Valley at 1440x900 and
844x390 landscape (plus a compact 700x564 landscape). On desktop, the run card
and radar must form a horizontal right-hand group, with the radar at its outer
edge. On mobile, the radar moves to the right-side safe space below the guide.
It must stay clear of the Boss plate, combat HUD and mobile Move / Lock / Attack
controls, with no page overflow or console error.
