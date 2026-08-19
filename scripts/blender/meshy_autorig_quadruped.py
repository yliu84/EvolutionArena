"""Recover quadruped roles from an unnamed auto-rig, by geometry.

Meshy's auto-rig names every bone `Bone_NNN` in the order the solver happened to
visit joints, so an index means nothing across two exports of the same animal.
This is the second creature to arrive that way, and the classifier written for
the first one is beetle-shaped - it looks for two elytra and a pair of antennae
and returns nothing useful without them.

So this resolves the parts every quadruped has and nothing else: four legs, a
spine, a head. Anything extra stays unclaimed and can be keyed by hand.

Every step is asserted rather than assumed. A silent misclassification animates
a creature walking backwards, or bends its head where its hip is, and the result
looks like bad animation rather than like a bug in a lookup.
"""

import bpy


def _leaves(bones):
    return [bone for bone in bones if not bone.children]


def _chain_up_to_branch(bone):
    """From a foot back toward the body, stopping where the skeleton forks."""
    chain = [bone]
    current = bone
    while current.parent is not None and len(current.parent.children) == 1:
        current = current.parent
        chain.append(current)
    if current.parent is not None:
        chain.append(current.parent)
    return list(reversed(chain))


def resolve_unnamed_quadruped(armature):
    bones = list(armature.data.bones)
    root = next(bone for bone in bones if bone.parent is None)

    # Down is the direction whose four furthest extremities are the feet, and
    # feet are recognised by how they sit: level with each other along that
    # axis, and spread wide across the other two.
    #
    # Distance from the root does not identify it. On a hunched body the tail
    # end is further from the root than the ground is, so "furthest from the
    # root" picked front-to-back and then classified two feet into the same
    # corner - which the next assert caught, but only after the fact.
    leaves = _leaves(bones)
    if len(leaves) < 4:
        raise SystemExit(f"Expected at least four extremities, found {len(leaves)}")
    spans = [max(bone.head_local[axis] for bone in bones) - min(bone.head_local[axis] for bone in bones)
             for axis in range(3)]

    def foot_score(axis, sign):
        ranked = sorted(leaves, key=lambda leaf: leaf.head_local[axis] * sign)
        four = ranked[:4]
        level = max(leaf.head_local[axis] for leaf in four) - min(leaf.head_local[axis] for leaf in four)
        others = sum(
            max(leaf.head_local[other] for leaf in four) - min(leaf.head_local[other] for leaf in four)
            for other in range(3) if other != axis
        )
        return others / (level + spans[axis] * 0.02), four

    up, down_sign, feet = max(
        ((axis, sign, foot_score(axis, sign)[1]) for axis in range(3) for sign in (1, -1)),
        key=lambda entry: foot_score(entry[0], entry[1])[0],
    )
    spread = spans[up]
    level = max(foot.head_local[up] for foot in feet) - min(foot.head_local[up] for foot in feet)
    if level > spread * 0.35:
        raise SystemExit("The four extremities taken as feet are not at a common ground level")

    remaining = [axis for axis in range(3) if axis != up]

    # Side is the axis the feet mirror across, not the one they spread furthest
    # along. On this body those two answers differ by two and a half percent and
    # point at different axes, which swapped left-right with front-back and then
    # walked the spine straight into a foreleg.
    def mirror_error(axis):
        total = 0.0
        for foot in feet:
            offset = foot.head_local[axis] - root.head_local[axis]
            best = min(
                abs(offset + (other.head_local[axis] - root.head_local[axis]))
                for other in feet if other is not foot
            )
            total += best
        return total

    side = min(remaining, key=mirror_error)
    forward = next(axis for axis in remaining if axis != side)
    if mirror_error(side) > spans[side] * 0.5:
        raise SystemExit("The feet do not mirror across any axis; this is not a bilateral quadruped")

    legs = {}
    for foot in feet:
        is_right = foot.head_local[side] > root.head_local[side]
        is_front = foot.head_local[forward] > root.head_local[forward]
        key = f"{'front' if is_front else 'back'}{'Right' if is_right else 'Left'}"
        if key in legs:
            raise SystemExit(f"Two feet classified as {key}; the rig is not a plain quadruped")
        legs[key] = [bone.name for bone in _chain_up_to_branch(foot)]
    if len(legs) != 4:
        raise SystemExit(f"Expected four distinct legs, classified {sorted(legs)}")

    # Mid-line chains. This rig has no neck: the root sits between the shoulders
    # and the hips, with one chain running forward to the front legs and another
    # back to the rear ones. Assuming a single spine with a head on the end of it
    # is what produced a "head" that was actually the hindquarters.
    # A bone claimed by more than one leg is a body bone, not a leg bone. On a
    # round creature all four legs hang off the same trunk vertebra, and letting
    # each leg keep it left the mid-line chain with nothing in it but the root.
    claims = {}
    for key, chain in legs.items():
        for name in chain:
            claims.setdefault(name, set()).add(key)
    leg_bones = {name for name, owners in claims.items() if len(owners) == 1}
    midline = spans[side] * 0.18
    by_name = {bone.name: bone for bone in bones}

    def path_to(bone):
        """Root down to this bone, along the skeleton."""
        chain = []
        current = bone
        while current is not None:
            chain.append(current.name)
            current = current.parent
        return list(reversed(chain))

    def branch_of(*keys):
        """Deepest bone both legs of a pair still share.

        Taken from the paths rather than from a leg's parent: where the legs
        branch off a common vertebra, the parent is one bone too high and the
        mid-line chain comes back empty.
        """
        paths = [path_to(by_name[legs[key][0]]) for key in keys]
        shared = [name for name in paths[0] if all(name in path for path in paths[1:])]
        return shared[-1]

    spine = [name for name in path_to(by_name[branch_of("frontLeft", "frontRight")])
             if name not in leg_bones]
    hips = [name for name in path_to(by_name[branch_of("backLeft", "backRight")])
            if name not in leg_bones]
    if len(spine) < 2 or len(hips) < 2:
        raise SystemExit(f"Could not find mid-line chains; spine={spine} hips={hips}")

    # A head only if there is a mid-line chain left over that is neither.
    claimed = set(spine) | set(hips) | leg_bones
    head = []
    for bone in bones:
        if bone.name in claimed or bone.parent is None:
            continue
        if bone.parent.name not in spine:
            continue
        if abs(bone.head_local[side] - root.head_local[side]) > midline:
            continue
        chain = [bone.name]
        current = bone
        while len(current.children) == 1:
            current = current.children[0]
            chain.append(current.name)
        if len(chain) > len(head):
            head = chain

    return {
        "root": [root.name],
        "spine": spine,
        "hips": hips,
        "head": head,
        **legs,
    }, {"forward": forward, "side": side, "up": up}
