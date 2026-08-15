# Definition of Done

A feature is not “done” because code exists.

## Gameplay Feature DoD
- works in a full run;
- handles death/restart;
- has no obvious console errors;
- key values are configurable;
- has appropriate automated tests for pure logic;
- readable at gameplay camera scale;
- does not introduce unacceptable frame-time spikes;
- has telemetry if it affects a validation metric;
- documentation updated when behavior/design changes.

## Creature DoD
- clear role;
- clear gene reward;
- readable silhouette;
- spawn rules;
- attack/defense behavior;
- death/consume flow;
- tuned threat tier;
- test coverage for data/rules where applicable.
- source, license, original hash and attribution recorded;
- typed scale, rig-node, clip and presentation contract;
- animation state set appropriate to its role, including locomotion, turn, attack, hit and death;
- grounded/airborne movement obeys the creature's body plan and collision rules;
- material, silhouette, contact shadow and attacks remain readable at the real gameplay camera;
- desktop and mobile-landscape evidence, console check, performance sample and GLB validation recorded;
- meets the reusable gates in `../art/19-CHARACTER-QUALITY-BASELINE.md` before it becomes a production template.

## Mutation DoD
- visual change;
- mechanical change;
- trade-off or constraint;
- gene source;
- compatibility rules;
- upgrade rule if applicable;
- UI description;
- automated eligibility test.

## Boss DoD
- readable telegraphs;
- 2–3 meaningful patterns;
- arena boundaries/edge cases;
- reward;
- success/failure flow;
- performance tested with adds/VFX.
