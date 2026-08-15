# Browser Performance Budget

## Target

The validation build should feel smooth on a typical non-gaming laptop browser.

Primary target:
- 60 FPS on a reasonable modern desktop/laptop
- graceful fallback near 30 FPS on weaker hardware
- fast initial load suitable for sharing a URL

## v0.1 Budgets

Starting budgets, to be profiled and revised:

- Typical active creatures on screen: 15–25
- Stress target: ~30 active combatants
- Avoid hundreds of physics bodies
- Pool frequently spawned projectiles/VFX
- Limit expensive per-frame allocations
- Use simple collision shapes
- Cull/offload distant AI work
- Cap particles and transparent overdraw
- Compress textures/audio
- Lazy-load nonessential content where practical

## 2.5D Rendering Strategy

Use a camera and art direction that creates depth without requiring photorealistic rendering:
- stylized low-poly or illustrated sprites/meshes depending current implementation;
- strong silhouettes;
- baked/simple lighting look where possible;
- limited dynamic shadows;
- restrained post-processing;
- clear ground contact/shadows;
- readable VFX.

## Performance Gates

Before adding content, profile:
1. Empty map
2. 10 creatures
3. 20 creatures
4. 30 creatures + VFX
5. Boss + adds
6. Evolution UI transition

Record FPS, frame time, memory and obvious GC spikes.

## Web Quality Rule

Visual ambition is acceptable only if it preserves:
- combat readability;
- input responsiveness;
- quick load;
- stable frame pacing.

A clean stylized 2.5D game at 60 FPS is preferable to a “better looking” game that stutters.
