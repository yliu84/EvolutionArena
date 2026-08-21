# Goal 7 external playtest protocol

## Purpose

Validate whether body mutations are understood through play, without adding a
new button, an instruction panel, map content, or a batch of new creature
models. Each tester uses the normal move, lock and single basic-attack input.

## What a complete test records

The session recorder is local to the browser and stores no account, identity,
network, or input-text data. It records only game events:

- mutation selected;
- confirmed visible result (`rending-hit`, `tail-suppression`,
  `carapace-reflect`, `feeding-heal`, or `slow-aura`);
- normal attack hit/miss by combo action;
- deaths, phases, and existing arena diagnostics.

In a debug build, reviewers can retrieve a structured report through
`window.__EA_DEBUG__.sessionReport()` and raw events through
`window.__EA_DEBUG__.sessionDump()`. These are inspection tools only; they do
not change authority or upload data.

## Tester flow

1. Play the river valley for 15-20 minutes with no mutation explanation beyond
   the standard choice card.
2. After each selection, ask the tester what changed and why they chose it.
3. At the end, capture the local session report and three short answers:
   - Which mutation did you notice first?
   - What did it change during an attack or when hit?
   - Which mutation would you choose again, and why?

## Readiness gate

For each mutation selected by at least three testers:

- at least 2/3 identify the correct body-action relationship without help;
- the session report shows at least one confirmed result for 80% or more of
  selected mutations;
- no run has `action-never-connects`, `enemy-silent`,
  `player-outside-arena`, or `choice-during-fight` findings;
- no tester reports a new button, a spell, or an invisible bonus as the primary
  explanation of the mutation.

Failing a gate means improve the body cue, action, target reaction, or rule;
do not hide the issue with a tooltip or add a separate skill button.
