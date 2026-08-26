# Every line gets a verb

Until this update, Evolution Arena had exactly one thing you could *do*: close the distance and hit the thing. Whatever body you evolved into, whatever three families you'd been hunting — the verb was the same. Forms differed in numbers, in silhouette, and in nothing your hands could feel.

They differ now. Each of the three evolution lines has its own skill, on **Q**, and each one is a different answer to the same problem: *there is distance between you and the thing that wants you dead.*

---

## Three lines, three answers

**Fang — Pounce.** Delete the gap. Nine metres of reach, 26 damage on arrival, seven-second cooldown. You are standing there afterwards in a thin hide, which is the whole trade.

**Shell — Bulwark.** Do not close faster. Close anyway. A 3.2-second window that cuts incoming damage by 65% and shoves the ring of things crowding you, on an eleven-second cooldown. The Shell fantasy is arriving, not arriving first.

**Swarm — Spore Bloom.** Never close at all. Spit a spore orb from eleven metres; it flies, it strikes a body, and it leaves a poison that eats six instalments of health off it while you walk away. Nine-second cooldown.

These exist in this shape because ranged enemies are coming. "Walk up and hit it" stops being an answer at that point, and three lines then need three *different* answers — which is the thing that makes a form worth choosing rather than a skin.

---

## Spore Bloom got rebuilt, because the first one wasn't a skill

The first version dropped a burning patch of ground and drained health out of anything standing in it. Arithmetically it was fine. Played, it was invisible.

Nothing appeared. Damage came off at a fraction of a point per frame, so no number ever showed up — a fraction floors to zero. The effect was on the *floor*, so nothing about the creature changed. And the animal didn't move when you cast it.

The report I got was one sentence: **"is this even a skill?"**

It isn't now. It's an orb that leaves the mouth, crosses the gap, and hits a body. Then that body wears a green sickness and coughs up a `-10` every 0.6 seconds, six times, while you're busy with something else. Anything standing close enough gets caught in the cloud too — the Swarm line's answer to distance is still attrition across a crowd, not one big hit.

That's the difference between damage and a *status*: a status has to land somewhere you're looking, pay in instalments slow enough to count, pay in whole numbers, and say on the body that it's still running after the cast is over.

---

## Monsters finally have attacks you can see

The other half of this update is the part I'd been putting off.

Every ordinary creature in the game announced its blow the same way: a flat red circle on the ground that filled up and then flashed. That was the entire attack presentation. The four River Valley bosses had a whole effects system of their own; everything else shared one circle. A lunging Fang hunter, a plated Shell ram and a Swarm cloud were, visually, the same event.

Now they're three different events:

- **Fang** throws two claw streaks along its facing, and *no ring at all.* The danger is a direction, and a circle can never say which way a lunge came from — which turns out to be most of why all three read the same before.
- **Shell** puts down a shock at its full reach with dust lifted off the **rim**, because the edge is the part you actually have to read.
- **Swarm** raises a low cloud of spores off its body — the dimmest and longest of the three, because a swarm blow is a condition you're standing in rather than a thing that happened to you.

There's one rule underneath all of it that I care about more than how any of them look: **the area drawn is the area tested.** The effect is handed the same reach number the damage check uses, and passes it through untouched. An effect drawn wider than the blow teaches you a lie. One drawn narrower makes the creature feel like it cheats. Both are the same defect, and both are impossible when there's only one number.

---

## Fixes, including two I'm not proud of

**Pouncing at something behind you played the whole leap backwards.** The facing was computed correctly — it just never got written to the body. The model's rotation is only ever set by the movement pass and the basic-attack pass, and a skill dash is neither. The field said one thing and the animal did another. It now turns during the crouch, so every airborne frame is head-first.

**The Shell was animated as one thing and moved as another.** The plated body has no leap — short stout forelimbs can't sell one — so its Pounce plays as a planted slam. Nobody had told the *motion* layer that, and it keyed off the move's name, so the armoured body played a planted slam while a gecko's leap arc lifted its root half a metre off the ground and tilted it eight degrees. That's the "the body deforms and gets hauled upward" everyone kept reporting. It now slams: gathers, drives down, never leaves the ground, and kicks dust on the contact frame instead of on a landing that never happens.

**Skills refused to fire at bosses.** Both targeted skills answered "no target" in a boss fight — the fight you'd most want them in. The boss doesn't live in the same list ordinary creatures do, and the skill targeting only knew about that list. Two of three lines had no verb at the moment a run is decided. Fixed.

---

## A note on how any of this gets checked

Two things went wrong this update in a way worth writing down.

The spore poison advertises six instalments. In the engine it paid **five**. Six beats of 0.6 seconds is exactly 3.6, so under a duration the last one falls due on the same frame the status expires, and floating-point drift in the frame time decides which happens first. A headless test stepping at a clean 1/60 saw all six and proved nothing. Poison is now counted in instalments, and the duration follows from that.

Worse: the combat animation ran on the wall clock while the frame-stepper advanced the simulation clock. So when I stepped through a whole attack combo to measure it, every pose sat frozen at zero — and the first reading I took of the Shell bug said the body never moved at all. I nearly reported that as proof nothing was wrong. Attack poses now run on the same clock as everything else, which is the only reason the bug was measurable in the end.

"The animation is called Pounce" is not the same claim as "the pounce happened." I've learned that one twice now.

---

## What's next

Ranged enemies. The three skills were designed against them from the start — close, endure, deny — and the effects engine that just went in is what their projectiles will be built on.

---

*3D assets include Meshy-generated source material. CC BY 4.0 source assets: Meshy.*
