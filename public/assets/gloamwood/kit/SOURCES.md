# Gloamwood environment kit

## Current runtime set — Quaternius Stylized Nature MegaKit (CC0)

All models currently referenced by `src/gloamwood-environment-kit.ts` are from the [Stylized Nature MegaKit](https://poly.pizza/bundle/Stylized-Nature-MegaKit-T34GZFA0fm) by [Quaternius](https://quaternius.com/packs/stylizednaturemegakit.html), licensed [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (free for personal, educational and commercial projects; crediting Quaternius is optional and appreciated). Downloaded 2026-08-16 as individual GLBs from poly.pizza (Standard / free version — not the paid Unity/Godot Source shaders).

Processing: drop normal maps (toon lighting at this camera distance does not need them; also avoids tangent-space validator warnings), resize baseColor textures to 512² WebP. No meshopt, so the runtime GLTFLoader does not need a decoder. All files pass `npm run validate:gltf` with 0 errors / 0 warnings.

| File | Poly Pizza id | Use |
| --- | --- | --- |
| `quaternius/tree-a.glb` | `QVOop92WmG` | broadleaf A |
| `quaternius/tree-b.glb` | `YWjGDJ9F7g` | broadleaf B |
| `quaternius/tree-c.glb` | `aVOxaHRPWe` | broadleaf C |
| `quaternius/tree-d.glb` | `qZtx0AHhcy` | broadleaf D |
| `quaternius/pine-a.glb` | `rfnxJv0Rqa` | pine A |
| `quaternius/pine-b.glb` | `igSu0cPoBz` | pine B |
| `quaternius/dead-a.glb` | `n8FhMgMldD` | standing dead tree |
| `quaternius/rock-a.glb` | `KZdEP3uUpa` | boulder A |
| `quaternius/rock-b.glb` | `s1OJ3bBzqc` | boulder B |
| `quaternius/rock-c.glb` | `JQxF95498B` | boulder C |
| `quaternius/bush.glb` | `EoTERLq3z2` | mid-layer bush |
| `quaternius/grass-clump.glb` | `vUJjrRsFp4` | ground grass clumps |
| `quaternius/grass-wispy.glb` | `Msr9zx66VU` | reserved wispy grass |
| `quaternius/tall-grass.glb` | `JSIYtscPmP` | tall grass clumps |
| `quaternius/fern.glb` | `jqcanvH7D6` | ferns anchored near trees |
| `quaternius/mushroom.glb` | `aOW08oSrd4` | mushrooms anchored near trees |

Folder size ≈ 2.0 MB.

## Retired — Kenney Nature Kit 2.1 (CC0)

Replaced 2026-08-16 because the Kenney trees/grass are flat-shaded convex hulls and still read as geometric primitives. Files were removed from `public/assets/gloamwood/kit/` when the Quaternius set became the runtime kit. Original source: [Kenney Nature Kit 2.1](https://kenney.nl/assets/nature-kit).
