"""Identify limb roles in a Meshy auto-rig (UniRig) by geometry.

Meshy offers two official animation rigs, a dog and a human, and neither fits a
creature that is three times wider than it is long with two flat blades where a
quadruped has forelegs. Its auto-rig does fit, but names every bone `Bone_NNN`,
so nothing downstream can address a limb.

The bones are opaque, not ambiguous: a chain reaching furthest along +X is the
right arm whatever it is called. Classifying by position rather than by name is
also the only approach that will survive the Wing and Rift families, which will
never map onto a quadruped template either.

Conventions assumed, and asserted before use: Z is up, -Y is forward.
"""


def classify_meshy_autorig(armature):
    bones = list(armature.data.bones)
    world = armature.matrix_world
    head = {b.name: world @ b.head_local for b in bones}
    tip = {b.name: world @ b.tail_local for b in bones}
    children = {b.name: [c.name for c in b.children] for b in bones}

    def chain_from(name):
        """Walk down from a bone, always taking the child that continues furthest."""
        chain = [name]
        while children[chain[-1]]:
            chain.append(max(children[chain[-1]], key=lambda c: (tip[c] - head[chain[-1]]).length))
        return chain

    depth = {}

    def chains_depth(name):
        if name in depth:
            return depth[name]
        bone = armature.data.bones[name]
        depth[name] = 0 if bone.parent is None else chains_depth(bone.parent.name) + 1
        return depth[name]

    root = next(b.name for b in bones if b.parent is None)
    # Every chain that starts at a direct child of the spine's branch points.
    starts = [b.name for b in bones if b.parent and len(children[b.parent.name]) > 1]
    starts += children[root]
    chains = {s: chain_from(s) for s in dict.fromkeys(starts)}

    def reach(chain, key):
        return max(key(tip[n]) for n in chain)

    def descendants(name):
        out = []
        stack = list(children[name])
        while stack:
            current = stack.pop()
            out.append(current)
            stack.extend(children[current])
        return out

    used = set()

    def take(key):
        candidates = []
        for start, chain in chains.items():
            if start in used or any(n in used for n in chain):
                continue
            # A chain walked from high in the hierarchy runs through the whole
            # body, so once the arms are claimed the spine above them must not
            # be claimable as a limb of its own.
            if any(u in descendants(start) for u in used):
                continue
            candidates.append((chain, reach(chain, key), chains_depth(start)))
        best = None
        if candidates:
            top = max(value for _, value, _ in candidates)
            # A toe reaches almost exactly as far down as the leg it hangs off,
            # so reach alone picks the toe and abandons the limb. Among chains
            # that reach comparably, take the one attached closest to the body.
            near = [c for c in candidates if c[1] >= top * 0.85]
            chain, value, _ = min(near, key=lambda c: (c[2], -c[1]))
            best = (chain, value)
        if best:
            # Absorb every descendant too, not just the chain that was walked.
            # A pincer has two prongs, so the arm's own second prong would
            # otherwise be left as a stray chain and claimed as a head or a leg.
            claimed = list(best[0])
            for name in best[0]:
                claimed.extend(descendants(name))
            used.update(claimed)
            return sorted(dict.fromkeys(claimed), key=lambda n: chains_depth(n))
        return []

    roles = {}
    roles['root'] = root
    # Arms first: they reach furthest sideways, and taking them early stops a
    # leg chain being claimed by the head test.
    roles['armRight'] = take(lambda p: p.x)
    roles['armLeft'] = take(lambda p: -p.x)
    # Legs before head and tail: reaching downward is unambiguous, while the
    # forward and backward tests can otherwise pick up a leg.
    roles['legRight'] = take(lambda p: -p.z + max(0.0, p.x) * 0.6)
    roles['legLeft'] = take(lambda p: -p.z + max(0.0, -p.x) * 0.6)
    roles['head'] = take(lambda p: -p.y)
    roles['tail'] = take(lambda p: p.y)
    roles['spine'] = [b.name for b in bones
                      if b.name not in used and b.name != root and abs(head[b.name].x) < 0.25]
    return roles


def assert_axes(armature, mesh):
    """Fail loudly rather than authoring a clip against the wrong axis."""
    world = mesh.matrix_world
    zs = [(world @ v.co).z for v in mesh.data.vertices]
    lowest = min(zs)
    assert abs(lowest) < max(zs) * 0.08, f'expected feet near z=0, lowest is {lowest:.3f}'
    return True
