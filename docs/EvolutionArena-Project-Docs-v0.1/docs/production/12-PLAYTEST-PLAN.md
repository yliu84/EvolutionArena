# Playtest and Validation Plan

## Core Question

**Does evolution itself make players want another run?**

## Test Cohorts

### Internal
Developer + a few familiar testers. Find broken mechanics.

### External Small Test
At least 30 people who did not design the game and are not being coached live.

### Public Demo
Larger self-serve audience after the loop and visual slice are stable.

## v0.1 Success Signals

Initial targets:
- ≥70% understand the basic objective within 1 minute
- ≥50% of deaths lead to immediate replay
- median session ≥3 runs
- players can explain how prey caused the resulting automatic evolution
- players can name meaningful differences between mutations
- ≥20% spontaneously ask about more evolutions/content
- some players voluntarily capture/share their final creature

For later return testing:
- D1 return near or above ~30% would be a strong early signal for this prototype; interpret carefully based on sample and acquisition source.

## Failure Signals

Stop and redesign the loop if:
- immediate replay after death <30%;
- players perceive evolution as cosmetic only;
- combat feels like waiting for numbers to rise;
- players ignore prey choice because gene effects are unclear;
- optimal strategy is repetitive farming;
- boss is reached mainly through grind rather than build decisions.

## Questions After Session

Do not lead the tester. Ask:
1. What were you trying to do?
2. What made you choose which creatures to hunt?
3. Which evolution changed your play the most?
4. What was confusing?
5. When did you feel strongest?
6. Why did you start another run — or why not?
7. What would you try differently next time?
8. What do you think you have not discovered yet?

## Instrumentation Events

- run_started
- player_spawned
- creature_killed
- creature_consumed
- gene_collected
- evolution_previewed
- evolution_committed
- evolution_resisted
- dominant_gene_changed
- stage_advanced
- elite_engaged/killed
- boss_engaged/killed
- player_died
- run_won
- replay_clicked
- run_ended

Do not collect unnecessary personal information.
